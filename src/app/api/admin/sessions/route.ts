import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'all', 'active', 'expired'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status === 'active') {
      where.expiresAt = {
        gt: new Date()
      };
    } else if (status === 'expired') {
      where.expiresAt = {
        lt: new Date()
      };
    }
    
    // Get total count for pagination
    const totalSessions = await prisma.userSession.count({ where });
    
    const sessions = await prisma.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });
    
    // Add isActive field to each session
    const sessionsWithStatus = sessions.map(session => ({
      ...session,
      isActive: session.expiresAt > new Date()
    }));
    
    const totalPages = Math.ceil(totalSessions / limit);
    
    return NextResponse.json({ 
      sessions: sessionsWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalSessions,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const expiredOnly = searchParams.get('expiredOnly') === 'true';
    
    if (sessionId) {
      // Delete specific session
      await prisma.userSession.delete({
        where: { id: sessionId }
      });
      
      return NextResponse.json({ message: 'Session deleted successfully' });
    } else if (expiredOnly) {
      // Delete all expired sessions
      const result = await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      return NextResponse.json({ 
        message: `${result.count} expired sessions deleted successfully`,
        deletedCount: result.count
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid delete operation' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 }
    );
  }
}
