import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateMessageData } from '@/lib/types';
import { z } from 'zod';
import { triggerMessageAddedNotification } from '@/lib/notifications';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  isInternal: z.boolean().default(false),
  attachmentIds: z.array(z.string()).default([])
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

    // First check if user has access to this ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true
      }
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Users can only access messages from their own tickets
    if (userRole === 'USER' && ticket.createdById !== userId) {
      return NextResponse.json(
        { error: 'You can only access messages from your own tickets' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const whereClause: any = {
      ticketId: params.id
    };
    
    // Users can only see public messages and their own internal messages
    if (userRole === 'USER') {
      whereClause.OR = [
        { isInternal: false },
        { authorId: userId }
      ];
    }

    const messages = await prisma.ticketMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit
    });

    const total = await prisma.ticketMessage.count({
      where: whereClause
    });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRole = session.user.role;
    const userId = session.user.id;

    const body = await request.json();
    
    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        status: true
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Users can only add messages to their own tickets
    if (userRole === 'USER' && ticket.createdById !== userId) {
      return NextResponse.json(
        { error: 'You can only add messages to your own tickets' },
        { status: 403 }
      );
    }
    
    // Users cannot add messages to closed tickets
    if (userRole === 'USER' && ticket.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot add messages to closed tickets' },
        { status: 403 }
      );
    }
    
    // Users cannot create internal messages
    if (userRole === 'USER' && body.isInternal) {
      return NextResponse.json(
        { error: 'Users cannot create internal messages' },
        { status: 403 }
      );
    }
    
    const validatedData = createMessageSchema.parse(body);

    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        content: validatedData.content,
        isInternal: userRole === 'USER' ? false : (validatedData.isInternal || false),
        ticketId: params.id,
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Link attachments if provided
    if (validatedData.attachmentIds.length > 0) {
      await prisma.ticketMessageAttachment.createMany({
        data: validatedData.attachmentIds.map(attachmentId => ({
          messageId: message.id,
          attachmentId
        }))
      });
    }

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: params.id,
        action: validatedData.isInternal ? 'INTERNAL_COMMENT_ADDED' : 'MESSAGE_ADDED',
        details: `Message added: ${validatedData.content.substring(0, 100)}${validatedData.content.length > 100 ? '...' : ''}`,
        userId: userId
      }
    });

    // Trigger notifications for new message
    try {
      await triggerMessageAddedNotification(params.id, message.id);
    } catch (error) {
      console.error('Failed to send message notification:', error);
      // Don't fail the request if notifications fail
    }

    // Get the complete message with attachments
    const completeMessage = await prisma.ticketMessage.findUnique({
      where: { id: message.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(completeMessage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}