import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const notificationQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  unreadOnly: z.string().optional().default('false'),
  type: z.enum(['TICKET_CREATED', 'TICKET_UPDATED', 'MESSAGE_ADDED', 'TICKET_ASSIGNED', 'TICKET_CLOSED']).optional()
});

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAllAsRead: z.boolean().optional().default(false)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      unreadOnly: searchParams.get('unreadOnly') || 'false',
      type: searchParams.get('type')
    };
    
    const validatedParams = notificationQuerySchema.parse(queryParams);
    
    const page = parseInt(validatedParams.page);
    const limit = parseInt(validatedParams.limit);
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: any = {
      userId: userId
    };
    
    if (validatedParams.unreadOnly === 'true') {
      whereClause.isRead = false;
    }
    
    if (validatedParams.type) {
      whereClause.type = validatedParams.type;
    }
    
    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            ticketNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Get total count
    const total = await prisma.notification.count({
      where: whereClause
    });
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });
    
    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const validatedData = markAsReadSchema.parse(body);
    
    if (validatedData.markAllAsRead) {
      // Mark all notifications as read for the user
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (validatedData.notificationIds && validatedData.notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: validatedData.notificationIds },
          userId: userId // Ensure user can only mark their own notifications
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      
      return NextResponse.json({ message: 'Notifications marked as read' });
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or markAllAsRead must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }
    
    // Delete notification (only if it belongs to the user)
    const deletedNotification = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId
      }
    });
    
    if (deletedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}