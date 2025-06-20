import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { triggerTicketCreatedNotification } from '@/lib/notifications';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['BUG', 'FEATURE', 'SUPPORT', 'COMPLAINT', 'QUESTION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  productArea: z.enum([
    'FRONTEND', 'BACKEND', 'ADMIN_PANEL', 'DATABASE', 'API', 'MOBILE',
    'PAYMENT', 'INVENTORY', 'USERS', 'ORDERS', 'ANALYTICS',
    'SECURITY', 'PERFORMANCE', 'UI_UX', 'OTHER'
  ]),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional()
});

// Generate unique ticket number
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.supportTicket.count() + 1;
  return `SUP-${year}-${count.toString().padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const productArea = searchParams.get('productArea');
    const assignedToId = searchParams.get('assignedToId');
    const createdById = searchParams.get('createdById');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause based on user role
    const where: any = {};
    
    // Role-based access control
    if (userRole === 'USER') {
      // Users can only see their own tickets
      where.createdById = userId;
    } else if (userRole === 'MANAGER') {
      // Managers can see all tickets (no additional restrictions)
      // But have limited access to some statistics
    } else if (userRole === 'ADMIN') {
      // Admins can see everything (no restrictions)
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (productArea) where.productArea = productArea;
    
    // Only ADMIN and MANAGER can filter by assignee
    if (assignedToId && ['ADMIN', 'MANAGER'].includes(userRole)) {
      where.assignedToId = assignedToId;
    }
    
    // Only ADMIN and MANAGER can filter by creator (unless it's the user themselves)
    if (createdById && ['ADMIN', 'MANAGER'].includes(userRole)) {
      where.createdById = createdById;
    }

    // Get total count for pagination
    const totalCount = await prisma.supportTicket.count({ where });

    // Get tickets with pagination
    const tickets = await prisma.supportTicket.findMany({
      where,
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
        },
        _count: {
          select: {
            messages: true,
            attachments: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRole = session.user.role;

    const body = await request.json();
    
    // Role-based validation for ticket creation
    let validationSchema = createTicketSchema;
    
    if (userRole === 'USER') {
      // Users have limited options when creating tickets
      validationSchema = createTicketSchema.omit({ assignedToId: true });
      // Users can only create certain types of tickets
      if (body.type && !['SUPPORT', 'QUESTION', 'COMPLAINT'].includes(body.type)) {
        return NextResponse.json(
          { error: 'Users can only create SUPPORT, QUESTION, or COMPLAINT tickets' },
          { status: 403 }
        );
      }
    }
    
    const validatedData = validationSchema.parse(body);

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber();

    // Create ticket with role-based restrictions
    const ticketData: any = {
      ticketNumber,
      title: validatedData.title,
      description: validatedData.description,
      type: validatedData.type,
      priority: validatedData.priority,
      productArea: validatedData.productArea,
      tags: validatedData.tags || [],
      createdById: session.user.id
    };
    
    // Only ADMIN and MANAGER can assign tickets and set advanced options
    if (['ADMIN', 'MANAGER'].includes(userRole)) {
      if (validatedData.assignedToId) ticketData.assignedToId = validatedData.assignedToId;
      if (validatedData.estimatedHours) ticketData.estimatedHours = validatedData.estimatedHours;
      if (validatedData.dueDate) ticketData.dueDate = new Date(validatedData.dueDate);
    }
    
    // Users can only create tickets with MEDIUM or LOW priority
    if (userRole === 'USER' && ['HIGH', 'CRITICAL'].includes(validatedData.priority)) {
      ticketData.priority = 'MEDIUM';
    }
    
    const ticket = await prisma.supportTicket.create({
      data: ticketData,
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

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        action: 'CREATED',
        description: `Ticket created with priority ${ticket.priority}`,
        performedById: session.user.id
      }
    });

    // Trigger notifications
    try {
      await triggerTicketCreatedNotification(ticket.id);
    } catch (error) {
      console.error('Failed to send ticket created notifications:', error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}