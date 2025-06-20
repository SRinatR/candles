import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateTicketData } from '@/lib/types';
import { z } from 'zod';
import { triggerTicketAssignedNotification, triggerTicketStatusChangedNotification } from '@/lib/notifications';

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['BUG', 'FEATURE', 'SUPPORT', 'COMPLAINT', 'QUESTION']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED']).optional(),
  productArea: z.enum([
    'FRONTEND', 'BACKEND', 'ADMIN_PANEL', 'DATABASE', 'API', 'MOBILE',
    'PAYMENT', 'INVENTORY', 'USERS', 'ORDERS', 'ANALYTICS',
    'SECURITY', 'PERFORMANCE', 'UI_UX', 'OTHER'
  ]).optional(),
  assignedToId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query with role-based access control
    const whereClause: any = { id: params.id };
    
    // Users can only access their own tickets
    if (userRole === 'USER') {
      whereClause.createdById = userId;
    }
    
    const ticket = await prisma.supportTicket.findUnique({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          where: userRole === 'USER' ? {
            // Users can only see public messages and their own internal messages
            OR: [
              { isInternal: false },
              { authorId: userId }
            ]
          } : undefined, // ADMIN and MANAGER see all messages
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            attachments: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        history: {
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateTicketSchema.parse(body);

    // Get current ticket for comparison
    const currentTicket = await prisma.supportTicket.findUnique({
      where: { id: params.id }
    });

    if (!currentTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Handle date conversion
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }

    // Set resolvedAt when status changes to RESOLVED
    if (validatedData.status === 'RESOLVED' && currentTicket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    // Clear resolvedAt when status changes from RESOLVED
    if (validatedData.status && validatedData.status !== 'RESOLVED' && currentTicket.status === 'RESOLVED') {
      updateData.resolvedAt = null;
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create history entries for changes
    const historyEntries = [];

    if (validatedData.status && validatedData.status !== currentTicket.status) {
      historyEntries.push({
        ticketId: params.id,
        action: 'STATUS_CHANGED' as const,
        details: `Status changed from ${currentTicket.status} to ${validatedData.status}`,
        userId: session.user.id
      });
    }

    if (validatedData.priority && validatedData.priority !== currentTicket.priority) {
      historyEntries.push({
        ticketId: params.id,
        action: 'PRIORITY_CHANGED' as const,
        details: `Priority changed from ${currentTicket.priority} to ${validatedData.priority}`,
        userId: session.user.id
      });
    }

    if (validatedData.assignedToId !== undefined && validatedData.assignedToId !== currentTicket.assignedToId) {
      const action = validatedData.assignedToId ? 'ASSIGNED' : 'UNASSIGNED';
      const details = validatedData.assignedToId 
        ? `Ticket assigned to user ${validatedData.assignedToId}`
        : 'Ticket unassigned';
      
      historyEntries.push({
        ticketId: params.id,
        action: action as const,
        details,
        userId: session.user.id
      });
    }

    if (historyEntries.length > 0) {
      await prisma.ticketHistory.createMany({
        data: historyEntries
      });
    }

    // Trigger notifications for specific changes
    try {
      // Notify about assignment changes
      if (validatedData.assignedToId !== undefined && validatedData.assignedToId !== currentTicket.assignedToId) {
        if (validatedData.assignedToId) {
          await triggerTicketAssignedNotification(params.id, validatedData.assignedToId);
        }
      }

      // Notify about status changes
      if (validatedData.status && validatedData.status !== currentTicket.status) {
        await triggerTicketStatusChangedNotification(params.id, currentTicket.status, validatedData.status);
      }
    } catch (error) {
      console.error('Failed to send ticket update notifications:', error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only ADMIN can delete tickets
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Delete ticket and all related data (cascade)
    await prisma.supportTicket.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}