'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Send, 
  Paperclip, 
  Download,
  Trash2,
  Clock,
  User,
  Calendar,
  Tag,
  AlertTriangle,
  MessageSquare,
  History,
  FileText,
  Image,
  Video,
  Music
} from 'lucide-react';
import Link from 'next/link';
import { SupportTicket, TicketMessage, TicketHistory, TicketStatus, TicketPriority } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const PRIORITY_COLORS = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'destructive',
  CRITICAL: 'destructive'
} as const;

const STATUS_COLORS = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  PENDING: 'outline',
  RESOLVED: 'secondary',
  CLOSED: 'outline',
  REOPENED: 'destructive'
} as const;

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function TicketDetailsPage() {
  const dict = useAdminDictionary();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchAdminUsers();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?roles=ADMIN,MANAGER');
      if (response.ok) {
        const users = await response.json();
        setAdminUsers(users);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const updateTicket = async (updates: Partial<SupportTicket>) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      await fetchTicket(); // Refresh ticket data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          isInternal
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchTicket(); // Refresh to get new message
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!ticket) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Ticket not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {ticket.ticketNumber}
              </h1>
              <Badge variant={PRIORITY_COLORS[ticket.priority]}>
                {dict.ticketPriorities[ticket.priority as keyof typeof dict.ticketPriorities]}
              </Badge>
              <Badge variant={STATUS_COLORS[ticket.status]}>
                {dict.ticketStatuses[ticket.status as keyof typeof dict.ticketStatuses]}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground mt-1">
              {ticket.title}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Ticket
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="messages" className="w-full">
            <TabsList>
              <TabsTrigger value="messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                {dict.ticketDetails.messages}
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                {dict.ticketDetails.history}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>{dict.ticketDetails.messages}</CardTitle>
                  <CardDescription>
                    Conversation history and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ticket.messages && ticket.messages.length > 0 ? (
                    <div className="space-y-4">
                      {ticket.messages.map((message) => (
                        <div key={message.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{message.user.name}</span>
                              {message.isInternal && (
                                <Badge variant="outline" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm font-medium">Attachments:</p>
                              {message.attachments.map((attachment) => {
                                const FileIcon = getFileIcon(attachment.mimeType);
                                return (
                                  <div key={attachment.id} className="flex items-center gap-2 text-sm">
                                    <FileIcon className="h-4 w-4" />
                                    <span>{attachment.originalName}</span>
                                    <span className="text-muted-foreground">
                                      ({formatFileSize(attachment.size)})
                                    </span>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {dict.ticketDetails.noMessages}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Add Message */}
              <Card>
                <CardHeader>
                  <CardTitle>{dict.ticketDetails.addMessage}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={isInternal ? 'internal' : 'public'}
                      onValueChange={(value) => setIsInternal(value === 'internal')}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">{dict.ticketDetails.publicMessage}</SelectItem>
                        <SelectItem value="internal">{dict.ticketDetails.internalComment}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder={dict.ticketDetails.messagePlaceholder}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendingMessage ? 'Sending...' : dict.ticketDetails.sendMessage}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.ticketDetails.history}</CardTitle>
                  <CardDescription>
                    Timeline of all changes and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ticket.history && ticket.history.length > 0 ? (
                    <div className="space-y-4">
                      {ticket.history.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{entry.action.replace('_', ' ')}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {entry.user.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {dict.ticketDetails.noHistory}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.ticketDetails.ticketInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline">
                    {dict.ticketTypes[ticket.type as keyof typeof dict.ticketTypes]}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Priority:</span>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value: TicketPriority) => updateTicket({ priority: value })}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dict.ticketPriorities).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={ticket.status}
                    onValueChange={(value: TicketStatus) => updateTicket({ status: value })}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dict.ticketStatuses).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Assigned to:</span>
                  <Select
                    value={ticket.assignedToId || 'unassigned'}
                    onValueChange={(value) => updateTicket({ assignedToId: value === 'unassigned' ? null : value })}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {adminUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created by:</span>
                  <span className="text-sm">{ticket.createdBy.name}</span>
                </div>

                {ticket.estimatedHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Estimated:</span>
                    <span className="text-sm">{ticket.estimatedHours}h</span>
                  </div>
                )}

                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.ticketDetails.attachments}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment.mimeType);
                    return (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">{attachment.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}