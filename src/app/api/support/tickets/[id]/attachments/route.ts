import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

// File validation schema
const fileUploadSchema = z.object({
  file: z.any(),
  description: z.string().optional()
});

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  // Text files
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  // Archives
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'support');

export async function GET(
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
    
    // Users can only access attachments from their own tickets
    if (userRole === 'USER' && ticket.createdById !== userId) {
      return NextResponse.json(
        { error: 'You can only access attachments from your own tickets' },
        { status: 403 }
      );
    }
    
    const attachments = await prisma.supportAttachment.findMany({
      where: {
        ticketId: params.id
      },
      include: {
        uploadedBy: {
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
    });
    
    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
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
    
    // Users can only upload to their own tickets
    if (userRole === 'USER' && ticket.createdById !== userId) {
      return NextResponse.json(
        { error: 'You can only upload files to your own tickets' },
        { status: 403 }
      );
    }
    
    // Users cannot upload to closed tickets
    if (userRole === 'USER' && ticket.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot upload files to closed tickets' },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedExtensions = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    if (!allowedExtensions) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }
    
    // Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File extension ${fileExtension} is not allowed for MIME type ${file.type}` },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(UPLOAD_DIR, fileName);
    
    try {
      // Ensure upload directory exists
      await mkdir(UPLOAD_DIR, { recursive: true });
      
      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      // Save attachment record to database
      const attachment = await prisma.supportAttachment.create({
        data: {
          fileName: file.name,
          filePath: fileName, // Store relative path
          fileSize: file.size,
          mimeType: file.type,
          description: description || null,
          ticketId: params.id,
          uploadedById: userId
        },
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
      });
      
      // Create history entry
      await prisma.supportTicketHistory.create({
        data: {
          ticketId: params.id,
          action: 'ATTACHMENT_ADDED',
          details: `File uploaded: ${file.name}`,
          performedById: userId
        }
      });
      
      return NextResponse.json(attachment, { status: 201 });
    } catch (fileError) {
      console.error('Error saving file:', fileError);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading attachment:', error);
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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRole = session.user.role;
    const userId = session.user.id;
    
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }
    
    // Get attachment with ticket info
    const attachment = await prisma.supportAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            id: true,
            createdById: true,
            status: true
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
    
    // Check if attachment belongs to the specified ticket
    if (attachment.ticketId !== params.id) {
      return NextResponse.json(
        { error: 'Attachment does not belong to this ticket' },
        { status: 400 }
      );
    }
    
    // Users can only delete attachments from their own tickets
    if (userRole === 'USER') {
      if (attachment.ticket.createdById !== userId) {
        return NextResponse.json(
          { error: 'You can only delete attachments from your own tickets' },
          { status: 403 }
        );
      }
      
      // Users can only delete their own attachments
      if (attachment.uploadedById !== userId) {
        return NextResponse.json(
          { error: 'You can only delete attachments you uploaded' },
          { status: 403 }
        );
      }
      
      // Users cannot delete from closed tickets
      if (attachment.ticket.status === 'CLOSED') {
        return NextResponse.json(
          { error: 'Cannot delete attachments from closed tickets' },
          { status: 403 }
        );
      }
    }
    
    // Delete attachment record
    await prisma.supportAttachment.delete({
      where: { id: attachmentId }
    });
    
    // Create history entry
    await prisma.supportTicketHistory.create({
      data: {
        ticketId: params.id,
        action: 'ATTACHMENT_DELETED',
        details: `File deleted: ${attachment.fileName}`,
        performedById: userId
      }
    });
    
    // TODO: Delete physical file from disk
    // This should be done in a background job to avoid blocking the response
    
    return NextResponse.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}