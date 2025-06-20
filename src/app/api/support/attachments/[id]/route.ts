import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(
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

    // Find the attachment
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: params.id },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if user can delete this attachment
    // Only ADMIN or the uploader can delete attachments
    if (session.user.role !== 'ADMIN' && attachment.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'public', attachment.path);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file from filesystem:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete attachment record from database
    await prisma.ticketAttachment.delete({
      where: { id: params.id }
    });

    // Create history entry if attached to a ticket
    if (attachment.ticketId) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: attachment.ticketId,
          action: 'ATTACHMENT_REMOVED',
          details: `File "${attachment.originalName}" removed`,
          userId: session.user.id
        }
      });
    }

    return NextResponse.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}