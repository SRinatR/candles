import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TicketStatus, TicketPriority, TicketType, ProductArea } from '@/lib/types';

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
    
    // Only ADMIN and MANAGER can access statistics
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access statistics' },
        { status: 403 }
      );
    }

    // Build base where clause for role-based access
    const baseWhere: any = {};
    
    // MANAGER role restrictions - can only see tickets they're assigned to or created
    if (userRole === 'MANAGER') {
      baseWhere.OR = [
        { assignedToId: userId },
        { createdById: userId }
      ];
    }

    // Get basic counts
    const totalTickets = await prisma.supportTicket.count({ where: baseWhere });
    const openTickets = await prisma.supportTicket.count({
      where: { ...baseWhere, status: 'OPEN' }
    });
    const inProgressTickets = await prisma.supportTicket.count({
      where: { ...baseWhere, status: 'IN_PROGRESS' }
    });
    const resolvedTickets = await prisma.supportTicket.count({
      where: { ...baseWhere, status: 'RESOLVED' }
    });
    const criticalTickets = await prisma.supportTicket.count({
      where: { ...baseWhere, priority: 'CRITICAL' }
    });

    // Calculate average resolution time
    const resolvedTicketsWithTime = await prisma.supportTicket.findMany({
      where: {
        ...baseWhere,
        status: 'RESOLVED',
        resolvedAt: { not: null }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    });

    const averageResolutionTime = resolvedTicketsWithTime.length > 0
      ? resolvedTicketsWithTime.reduce((acc, ticket) => {
          const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
          return acc + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
        }, 0) / resolvedTicketsWithTime.length
      : 0;

    // Get tickets by type
    const ticketsByType = await prisma.supportTicket.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true }
    });

    // Get tickets by priority
    const ticketsByPriority = await prisma.supportTicket.groupBy({
      by: ['priority'],
      where: baseWhere,
      _count: { priority: true }
    });

    // Get tickets by status
    const ticketsByStatus = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { status: true }
    });

    // Get tickets by product area
    const ticketsByArea = await prisma.supportTicket.groupBy({
      by: ['productArea'],
      where: baseWhere,
      _count: { productArea: true }
    });

    // Get recent activity (last 10 tickets)
    const recentTickets = await prisma.supportTicket.findMany({
      take: 10,
      where: baseWhere,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get assignee workload (only for ADMIN)
    let assigneeWorkload = null;
    if (userRole === 'ADMIN') {
      const workloadData = await prisma.supportTicket.groupBy({
        by: ['assignedToId'],
        where: {
          assignedToId: { not: null },
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        _count: {
          id: true
        }
      });
      
      // Get assignee details
      const assigneeIds = workloadData.map(item => item.assignedToId).filter(Boolean);
      if (assigneeIds.length > 0) {
        const assignees = await prisma.user.findMany({
          where: {
            id: { in: assigneeIds as string[] }
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        
        assigneeWorkload = workloadData.map(item => ({
          ...item,
          assignee: assignees.find(a => a.id === item.assignedToId)
        }));
      }
    }

    const stats = {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      ticketsByType: ticketsByType.map(item => ({
        type: item.type,
        count: item._count.type
      })),
      ticketsByPriority: ticketsByPriority.map(item => ({
        priority: item.priority,
        count: item._count.priority
      })),
      ticketsByStatus: ticketsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      ticketsByArea: ticketsByArea.map(item => ({
        area: item.productArea,
        count: item._count.productArea
      })),
      recentActivity: recentTickets,
      ...(assigneeWorkload && { assigneeWorkload })
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching support stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}