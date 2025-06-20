import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
  emailNotifications: z.object({
    ticketCreated: z.boolean(),
    ticketAssigned: z.boolean(),
    messageAdded: z.boolean(),
    statusChanged: z.boolean(),
    ticketClosed: z.boolean(),
    ticketReopened: z.boolean()
  }),
  inAppNotifications: z.object({
    ticketCreated: z.boolean(),
    ticketAssigned: z.boolean(),
    messageAdded: z.boolean(),
    statusChanged: z.boolean(),
    ticketClosed: z.boolean(),
    ticketReopened: z.boolean()
  }),
  soundNotifications: z.boolean(),
  digestFrequency: z.enum(['IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY', 'DISABLED'])
});

// GET - Fetch user notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        notificationPreferences: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return preferences or default values
    const defaultPreferences = {
      emailNotifications: {
        ticketCreated: true,
        ticketAssigned: true,
        messageAdded: true,
        statusChanged: true,
        ticketClosed: true,
        ticketReopened: true
      },
      inAppNotifications: {
        ticketCreated: true,
        ticketAssigned: true,
        messageAdded: true,
        statusChanged: true,
        ticketClosed: true,
        ticketReopened: true
      },
      soundNotifications: true,
      digestFrequency: 'IMMEDIATE' as const
    };

    const preferences = user.notificationPreferences 
      ? { ...defaultPreferences, ...user.notificationPreferences }
      : defaultPreferences;

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: validatedData
      },
      select: {
        id: true,
        notificationPreferences: true
      }
    });

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}