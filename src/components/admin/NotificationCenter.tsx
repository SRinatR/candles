'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Trash2, Filter, Mail, MessageSquare, UserPlus, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'MESSAGE_ADDED' | 'TICKET_ASSIGNED' | 'TICKET_CLOSED' | 'TICKET_REOPENED' | 'ATTACHMENT_ADDED';
  title: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  ticket?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    ticketNumber: string;
  };
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'TICKET_CREATED':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'TICKET_ASSIGNED':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'MESSAGE_ADDED':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'TICKET_UPDATED':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'TICKET_CLOSED':
      return <Check className="h-4 w-4 text-gray-500" />;
    case 'TICKET_REOPENED':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'ATTACHMENT_ADDED':
      return <Mail className="h-4 w-4 text-indigo-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'TICKET_CREATED':
      return 'bg-blue-50 border-blue-200';
    case 'TICKET_ASSIGNED':
      return 'bg-green-50 border-green-200';
    case 'MESSAGE_ADDED':
      return 'bg-purple-50 border-purple-200';
    case 'TICKET_UPDATED':
      return 'bg-orange-50 border-orange-200';
    case 'TICKET_CLOSED':
      return 'bg-gray-50 border-gray-200';
    case 'TICKET_REOPENED':
      return 'bg-red-50 border-red-200';
    case 'ATTACHMENT_ADDED':
      return 'bg-indigo-50 border-indigo-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getTypeLabel = (type: Notification['type']) => {
  switch (type) {
    case 'TICKET_CREATED':
      return 'Новый тикет';
    case 'TICKET_ASSIGNED':
      return 'Назначение';
    case 'MESSAGE_ADDED':
      return 'Сообщение';
    case 'TICKET_UPDATED':
      return 'Обновление';
    case 'TICKET_CLOSED':
      return 'Закрытие';
    case 'TICKET_REOPENED':
      return 'Переоткрытие';
    case 'ATTACHMENT_ADDED':
      return 'Вложение';
    default:
      return 'Уведомление';
  }
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        unreadOnly: filter === 'unread' ? 'true' : 'false',
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await fetch(`/api/support/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data: NotificationResponse = await response.json();
      
      if (reset) {
        setNotifications(data.notifications);
        setPage(2);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
        setPage(prev => prev + 1);
      }
      
      setUnreadCount(data.unreadCount);
      setHasMore(currentPage < data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/support/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (!response.ok) throw new Error('Failed to mark notifications as read');

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Ошибка при отметке уведомлений как прочитанных');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/support/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAllAsRead: true })
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Ошибка при отметке всех уведомлений как прочитанных');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/support/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Уведомление удалено');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Ошибка при удалении уведомления');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    // Navigate to ticket if available
    if (notification.ticketId) {
      window.location.href = `/admin/support/tickets/${notification.ticketId}`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen, filter, typeFilter]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        // Just fetch unread count when panel is closed
        fetch('/api/support/notifications?limit=1&unreadOnly=true')
          .then(res => res.json())
          .then(data => setUnreadCount(data.unreadCount))
          .catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Уведомления</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Все прочитано
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Select value={filter} onValueChange={(value: 'all' | 'unread') => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="unread">Непрочитанные</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="TICKET_CREATED">Новые тикеты</SelectItem>
                  <SelectItem value="TICKET_ASSIGNED">Назначения</SelectItem>
                  <SelectItem value="MESSAGE_ADDED">Сообщения</SelectItem>
                  <SelectItem value="TICKET_UPDATED">Обновления</SelectItem>
                  <SelectItem value="TICKET_CLOSED">Закрытия</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {loading ? 'Загрузка...' : 'Нет уведомлений'}
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <p className="font-medium text-sm text-gray-900 mb-1">
                              {notification.title}
                            </p>
                            
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            {notification.ticket && (
                              <div className="text-xs text-gray-500 mb-2">
                                Тикет #{notification.ticket.ticketNumber}: {notification.ticket.title}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: ru
                                })}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead([notification.id]);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchNotifications()}
                        disabled={loading}
                        className="text-xs"
                      >
                        {loading ? 'Загрузка...' : 'Загрузить еще'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}