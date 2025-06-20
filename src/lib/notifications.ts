import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export type NotificationType = 
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'MESSAGE_ADDED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_CLOSED'
  | 'TICKET_REOPENED'
  | 'ATTACHMENT_ADDED';

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  ticketId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  ticketId?: string;
  userId?: string;
}

// Email transporter configuration
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP configuration missing. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Create in-app notification
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        ticketId: data.ticketId,
        userId: data.userId,
        metadata: data.metadata || {},
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Send email notification
export async function sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
  try {
    const transporter = createEmailTransporter();
    
    if (!transporter) {
      console.warn('Email transporter not configured. Skipping email notification.');
      return false;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.to,
      subject: data.subject,
      html: data.html
    });

    // Log email notification
    if (data.ticketId && data.userId) {
      await prisma.emailLog.create({
        data: {
          to: data.to,
          subject: data.subject,
          ticketId: data.ticketId,
          userId: data.userId,
          status: 'SENT',
          sentAt: new Date()
        }
      }).catch(error => {
        console.error('Error logging email:', error);
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    
    // Log failed email
    if (data.ticketId && data.userId) {
      await prisma.emailLog.create({
        data: {
          to: data.to,
          subject: data.subject,
          ticketId: data.ticketId,
          userId: data.userId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(logError => {
        console.error('Error logging failed email:', logError);
      });
    }
    
    return false;
  }
}

// Generate email templates
export function generateTicketCreatedEmail(ticket: any, creator: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Support Ticket Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .ticket-info { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .priority-high { color: #dc3545; font-weight: bold; }
        .priority-medium { color: #fd7e14; font-weight: bold; }
        .priority-low { color: #28a745; font-weight: bold; }
        .priority-critical { color: #6f42c1; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Support Ticket Created</h2>
          <p>A new support ticket has been created and requires attention.</p>
        </div>
        
        <div class="ticket-info">
          <h3>Ticket Details</h3>
          <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> <span class="priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></p>
          <p><strong>Type:</strong> ${ticket.type}</p>
          <p><strong>Product Area:</strong> ${ticket.productArea}</p>
          <p><strong>Created by:</strong> ${creator.firstName} ${creator.lastName} (${creator.email})</p>
          <p><strong>Created at:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
          
          <h4>Description:</h4>
          <p>${ticket.description}</p>
          
          <a href="${process.env.NEXTAUTH_URL}/admin/support/tickets/${ticket.id}" class="button">
            View Ticket
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateTicketAssignedEmail(ticket: any, assignee: any, assignedBy: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket Assigned to You</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .ticket-info { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .priority-high { color: #dc3545; font-weight: bold; }
        .priority-medium { color: #fd7e14; font-weight: bold; }
        .priority-low { color: #28a745; font-weight: bold; }
        .priority-critical { color: #6f42c1; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Ticket Assigned to You</h2>
          <p>You have been assigned a support ticket that requires your attention.</p>
        </div>
        
        <div class="ticket-info">
          <h3>Ticket Details</h3>
          <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> <span class="priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></p>
          <p><strong>Type:</strong> ${ticket.type}</p>
          <p><strong>Product Area:</strong> ${ticket.productArea}</p>
          <p><strong>Assigned by:</strong> ${assignedBy.firstName} ${assignedBy.lastName}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          
          <h4>Description:</h4>
          <p>${ticket.description}</p>
          
          <a href="${process.env.NEXTAUTH_URL}/admin/support/tickets/${ticket.id}" class="button">
            View Ticket
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateNewMessageEmail(ticket: any, message: any, author: any, recipient: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Message on Support Ticket</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .message-info { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .message-content { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Message on Support Ticket</h2>
          <p>A new message has been added to ticket #${ticket.ticketNumber}.</p>
        </div>
        
        <div class="message-info">
          <h3>Ticket: ${ticket.title}</h3>
          <p><strong>From:</strong> ${author.firstName} ${author.lastName} (${author.email})</p>
          <p><strong>Date:</strong> ${new Date(message.createdAt).toLocaleString()}</p>
          
          <div class="message-content">
            <h4>Message:</h4>
            <p>${message.content}</p>
          </div>
          
          <a href="${process.env.NEXTAUTH_URL}/admin/support/tickets/${ticket.id}" class="button">
            View Ticket
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateTicketStatusChangeEmail(ticket: any, oldStatus: string, newStatus: string, changedBy: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket Status Updated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status-info { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .status-change { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .status-old { color: #6c757d; }
        .status-new { color: #28a745; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Ticket Status Updated</h2>
          <p>The status of ticket #${ticket.ticketNumber} has been changed.</p>
        </div>
        
        <div class="status-info">
          <h3>Ticket: ${ticket.title}</h3>
          <p><strong>Changed by:</strong> ${changedBy.firstName} ${changedBy.lastName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          
          <div class="status-change">
            <h4>Status Change:</h4>
            <p><span class="status-old">${oldStatus}</span> → <span class="status-new">${newStatus}</span></p>
          </div>
          
          <a href="${process.env.NEXTAUTH_URL}/admin/support/tickets/${ticket.id}" class="button">
            View Ticket
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Notification helper functions
export async function notifyTicketCreated(ticket: any, creator: any, assignee?: any): Promise<void> {
  try {
    // Create in-app notification for assignee
    if (assignee) {
      await createNotification({
        type: 'TICKET_CREATED',
        title: 'New Ticket Assigned',
        message: `New ticket #${ticket.ticketNumber}: ${ticket.title}`,
        ticketId: ticket.id,
        userId: assignee.id,
        metadata: {
          priority: ticket.priority,
          type: ticket.type
        }
      });
      
      // Send email to assignee
      await sendEmailNotification({
        to: assignee.email,
        subject: `New Support Ticket Assigned: #${ticket.ticketNumber}`,
        html: generateTicketCreatedEmail(ticket, creator),
        ticketId: ticket.id,
        userId: assignee.id
      });
    }
    
    // Notify admins about new tickets
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    for (const admin of admins) {
      await createNotification({
        type: 'TICKET_CREATED',
        title: 'New Support Ticket',
        message: `New ticket #${ticket.ticketNumber} created by ${creator.firstName} ${creator.lastName}`,
        ticketId: ticket.id,
        userId: admin.id,
        metadata: {
          priority: ticket.priority,
          type: ticket.type,
          createdBy: creator.id
        }
      });
    }
  } catch (error) {
    console.error('Error sending ticket created notifications:', error);
  }
}

export async function notifyTicketAssigned(ticket: any, assignee: any, assignedBy: any): Promise<void> {
  try {
    // Create in-app notification
    await createNotification({
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned to You',
      message: `You have been assigned ticket #${ticket.ticketNumber}: ${ticket.title}`,
      ticketId: ticket.id,
      userId: assignee.id,
      metadata: {
        assignedBy: assignedBy.id,
        priority: ticket.priority
      }
    });
    
    // Send email notification
    await sendEmailNotification({
      to: assignee.email,
      subject: `Ticket Assigned: #${ticket.ticketNumber}`,
      html: generateTicketAssignedEmail(ticket, assignee, assignedBy),
      ticketId: ticket.id,
      userId: assignee.id
    });
  } catch (error) {
    console.error('Error sending ticket assigned notifications:', error);
  }
}

export async function notifyNewMessage(ticket: any, message: any, author: any): Promise<void> {
  try {
    // Get all users who should be notified (ticket creator, assignee, admins)
    const usersToNotify = new Set<string>();
    
    // Add ticket creator
    if (ticket.createdById && ticket.createdById !== author.id) {
      usersToNotify.add(ticket.createdById);
    }
    
    // Add assignee
    if (ticket.assignedToId && ticket.assignedToId !== author.id) {
      usersToNotify.add(ticket.assignedToId);
    }
    
    // Add admins and managers (for internal messages)
    if (message.isInternal) {
      const staffUsers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MANAGER'] },
          isActive: true,
          id: { not: author.id }
        },
        select: { id: true }
      });
      
      staffUsers.forEach(user => usersToNotify.add(user.id));
    }
    
    // Get user details
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(usersToNotify) }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    // Send notifications
    for (const user of users) {
      // Create in-app notification
      await createNotification({
        type: 'MESSAGE_ADDED',
        title: 'New Message on Ticket',
        message: `New message on ticket #${ticket.ticketNumber} from ${author.firstName} ${author.lastName}`,
        ticketId: ticket.id,
        userId: user.id,
        metadata: {
          messageId: message.id,
          authorId: author.id,
          isInternal: message.isInternal
        }
      });
      
      // Send email notification (only for non-internal messages or to staff)
      if (!message.isInternal || ['ADMIN', 'MANAGER'].includes(user.role)) {
        await sendEmailNotification({
          to: user.email,
          subject: `New Message on Ticket #${ticket.ticketNumber}`,
          html: generateNewMessageEmail(ticket, message, author, user),
          ticketId: ticket.id,
          userId: user.id
        });
      }
    }
  } catch (error) {
    console.error('Error sending new message notifications:', error);
  }
}

export async function notifyTicketStatusChange(ticket: any, oldStatus: string, newStatus: string, changedBy: any): Promise<void> {
  try {
    // Get users to notify
    const usersToNotify = new Set<string>();
    
    // Add ticket creator
    if (ticket.createdById && ticket.createdById !== changedBy.id) {
      usersToNotify.add(ticket.createdById);
    }
    
    // Add assignee
    if (ticket.assignedToId && ticket.assignedToId !== changedBy.id) {
      usersToNotify.add(ticket.assignedToId);
    }
    
    // Get user details
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(usersToNotify) }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    // Send notifications
    for (const user of users) {
      const notificationType = newStatus === 'CLOSED' ? 'TICKET_CLOSED' : 'TICKET_UPDATED';
      
      // Create in-app notification
      await createNotification({
        type: notificationType,
        title: `Ticket Status Changed`,
        message: `Ticket #${ticket.ticketNumber} status changed from ${oldStatus} to ${newStatus}`,
        ticketId: ticket.id,
        userId: user.id,
        metadata: {
          oldStatus,
          newStatus,
          changedBy: changedBy.id
        }
      });
      
      // Send email notification
      await sendEmailNotification({
        to: user.email,
        subject: `Ticket Status Updated: #${ticket.ticketNumber}`,
        html: generateTicketStatusChangeEmail(ticket, oldStatus, newStatus, changedBy),
        ticketId: ticket.id,
        userId: user.id
      });
    }
  } catch (error) {
    console.error('Error sending ticket status change notifications:', error);
  }
}

// Export trigger functions for API routes
export const triggerTicketCreatedNotification = notifyTicketCreated;
export const triggerTicketAssignedNotification = notifyTicketAssigned;
export const triggerMessageAddedNotification = notifyNewMessage;
export const triggerTicketStatusChangedNotification = notifyTicketStatusChange;