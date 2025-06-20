import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const changeStatusSchema = z.object({
  isBlocked: z.boolean().optional(),
  isActive: z.boolean().optional()
}).refine(data => data.isBlocked !== undefined || data.isActive !== undefined, {
  message: "At least one status field must be provided"
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true }
    });

    if (!adminUser || !['ADMIN', 'MANAGER'].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const statusData = changeStatusSchema.parse(body);

    // Prevent admin from blocking themselves
    if (adminUser.id === params.id && statusData.isBlocked === true) {
      return NextResponse.json(
        { error: 'Cannot block your own account' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        isBlocked: true, 
        isActive: true 
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log admin action
    const changes = [];
    if (statusData.isBlocked !== undefined && statusData.isBlocked !== targetUser.isBlocked) {
      changes.push(`${statusData.isBlocked ? 'blocked' : 'unblocked'}`);
    }
    if (statusData.isActive !== undefined && statusData.isActive !== targetUser.isActive) {
      changes.push(`${statusData.isActive ? 'activated' : 'deactivated'}`);
    }

    if (changes.length > 0) {
      await prisma.adminLog.create({
        data: {
          userId: session.user.email,
          action: 'CHANGE_USER_STATUS',
          details: `${changes.join(' and ')} user ${targetUser.email}`,
          metadata: JSON.stringify({
            targetUserId: params.id,
            changes: statusData
          })
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: statusData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error changing user status:', error);
    return NextResponse.json(
      { error: 'Failed to change user status' },
      { status: 500 }
    );
  }
}