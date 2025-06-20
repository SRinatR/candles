'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, UserPlus, AlertCircle, FileText, Volume2, VolumeX } from 'lucide-react';

interface NotificationPreferences {
  emailNotifications: {
    ticketCreated: boolean;
    ticketAssigned: boolean;
    messageAdded: boolean;
    statusChanged: boolean;
    ticketClosed: boolean;
    ticketReopened: boolean;
  };
  inAppNotifications: {
    ticketCreated: boolean;
    ticketAssigned: boolean;
    messageAdded: boolean;
    statusChanged: boolean;
    ticketClosed: boolean;
    ticketReopened: boolean;
  };
  soundNotifications: boolean;
  digestFrequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'DISABLED';
}

const defaultPreferences: NotificationPreferences = {
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
  digestFrequency: 'IMMEDIATE'
};

const notificationTypes = [
  {
    key: 'ticketCreated',
    label: 'Создание нового тикета',
    description: 'Уведомления о создании новых тикетов',
    icon: FileText,
    color: 'text-blue-500'
  },
  {
    key: 'ticketAssigned',
    label: 'Назначение тикета',
    description: 'Уведомления о назначении тикетов на исполнителей',
    icon: UserPlus,
    color: 'text-green-500'
  },
  {
    key: 'messageAdded',
    label: 'Новые сообщения',
    description: 'Уведомления о новых сообщениях в тикетах',
    icon: MessageSquare,
    color: 'text-purple-500'
  },
  {
    key: 'statusChanged',
    label: 'Изменение статуса',
    description: 'Уведомления об изменении статуса тикетов',
    icon: AlertCircle,
    color: 'text-orange-500'
  },
  {
    key: 'ticketClosed',
    label: 'Закрытие тикета',
    description: 'Уведомления о закрытии тикетов',
    icon: AlertCircle,
    color: 'text-gray-500'
  },
  {
    key: 'ticketReopened',
    label: 'Переоткрытие тикета',
    description: 'Уведомления о переоткрытии тикетов',
    icon: AlertCircle,
    color: 'text-red-500'
  }
];

const digestOptions = [
  { value: 'IMMEDIATE', label: 'Немедленно', description: 'Получать уведомления сразу' },
  { value: 'HOURLY', label: 'Каждый час', description: 'Сводка уведомлений каждый час' },
  { value: 'DAILY', label: 'Ежедневно', description: 'Ежедневная сводка уведомлений' },
  { value: 'WEEKLY', label: 'Еженедельно', description: 'Еженедельная сводка уведомлений' },
  { value: 'DISABLED', label: 'Отключено', description: 'Не получать email уведомления' }
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Ошибка загрузки настроек уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Настройки уведомлений сохранены');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailNotification = (type: keyof NotificationPreferences['emailNotifications'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [type]: enabled
      }
    }));
  };

  const updateInAppNotification = (type: keyof NotificationPreferences['inAppNotifications'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      inAppNotifications: {
        ...prev.inAppNotifications,
        [type]: enabled
      }
    }));
  };

  const toggleAllEmail = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: Object.keys(prev.emailNotifications).reduce((acc, key) => ({
        ...acc,
        [key]: enabled
      }), {} as NotificationPreferences['emailNotifications'])
    }));
  };

  const toggleAllInApp = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      inAppNotifications: Object.keys(prev.inAppNotifications).reduce((acc, key) => ({
        ...acc,
        [key]: enabled
      }), {} as NotificationPreferences['inAppNotifications'])
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Настройки уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allEmailEnabled = Object.values(preferences.emailNotifications).every(Boolean);
  const allInAppEnabled = Object.values(preferences.inAppNotifications).every(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Настройки уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Email уведомления</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="toggle-all-email" className="text-sm">
                  {allEmailEnabled ? 'Отключить все' : 'Включить все'}
                </Label>
                <Switch
                  id="toggle-all-email"
                  checked={allEmailEnabled}
                  onCheckedChange={toggleAllEmail}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {notificationTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${type.color}`} />
                      <div>
                        <Label className="font-medium">{type.label}</Label>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications[type.key as keyof NotificationPreferences['emailNotifications']]}
                      onCheckedChange={(checked) => updateEmailNotification(type.key as keyof NotificationPreferences['emailNotifications'], checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* In-App Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Уведомления в приложении</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="toggle-all-inapp" className="text-sm">
                  {allInAppEnabled ? 'Отключить все' : 'Включить все'}
                </Label>
                <Switch
                  id="toggle-all-inapp"
                  checked={allInAppEnabled}
                  onCheckedChange={toggleAllInApp}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {notificationTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${type.color}`} />
                      <div>
                        <Label className="font-medium">{type.label}</Label>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.inAppNotifications[type.key as keyof NotificationPreferences['inAppNotifications']]}
                      onCheckedChange={(checked) => updateInAppNotification(type.key as keyof NotificationPreferences['inAppNotifications'], checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sound Notifications */}
          <div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {preferences.soundNotifications ? (
                  <Volume2 className="h-5 w-5 text-green-500" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <Label className="font-medium">Звуковые уведомления</Label>
                  <p className="text-sm text-gray-600">Воспроизводить звук при получении уведомлений</p>
                </div>
              </div>
              <Switch
                checked={preferences.soundNotifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, soundNotifications: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Digest Frequency */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Частота email сводок</h3>
            <div className="space-y-2">
              {digestOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`digest-${option.value}`}
                    name="digestFrequency"
                    value={option.value}
                    checked={preferences.digestFrequency === option.value}
                    onChange={(e) => setPreferences(prev => ({ ...prev, digestFrequency: e.target.value as NotificationPreferences['digestFrequency'] }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor={`digest-${option.value}`} className="flex-1">
                    <div>
                      <span className="font-medium">{option.label}</span>
                      {option.value === 'DISABLED' && (
                        <Badge variant="secondary" className="ml-2">Рекомендуется</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}