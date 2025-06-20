'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import NotificationSettings from '@/components/admin/NotificationSettings';

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к настройкам
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              Настройки уведомлений
            </h1>
            <p className="text-muted-foreground mt-1">
              Управляйте настройками получения уведомлений о событиях в системе поддержки
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings Component */}
      <NotificationSettings />

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Информация об уведомлениях</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Email уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Email уведомления отправляются на ваш зарегистрированный email адрес. 
                Вы можете настроить частоту получения сводок или отключить их полностью.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Уведомления в приложении</h4>
              <p className="text-sm text-muted-foreground">
                Уведомления в приложении отображаются в центре уведомлений в верхней части экрана. 
                Они помогают быстро отслеживать важные события.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Звуковые уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Звуковые уведомления воспроизводят звуковой сигнал при получении новых уведомлений. 
                Убедитесь, что звук включен в вашем браузере.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Роли и доступ</h4>
              <p className="text-sm text-muted-foreground">
                Администраторы получают уведомления обо всех событиях. 
                Менеджеры получают уведомления только о назначенных им тикетах.
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Типы уведомлений</h4>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>• Создание нового тикета</span>
                <span>Когда создается новый тикет в системе</span>
              </div>
              <div className="flex justify-between">
                <span>• Назначение тикета</span>
                <span>Когда тикет назначается на исполнителя</span>
              </div>
              <div className="flex justify-between">
                <span>• Новые сообщения</span>
                <span>Когда добавляется новое сообщение в тикет</span>
              </div>
              <div className="flex justify-between">
                <span>• Изменение статуса</span>
                <span>Когда изменяется статус тикета</span>
              </div>
              <div className="flex justify-between">
                <span>• Закрытие тикета</span>
                <span>Когда тикет закрывается</span>
              </div>
              <div className="flex justify-between">
                <span>• Переоткрытие тикета</span>
                <span>Когда закрытый тикет переоткрывается</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}