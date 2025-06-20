
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminFormSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AlertTriangle, Save, Bell, ChevronRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAdmin = session?.user?.role === "ADMIN";
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isAdmin, router, isLoading]);

  if (isLoading) {
    return <AdminFormSkeleton title="Store Settings" />;
  }

  if (!isAdmin) {
    return (
         <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You do not have permission to view this page. Redirecting...</p>
            </CardContent>
         </Card>
    );
  }
  
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
        <p className="text-muted-foreground">
          Manage general store settings, payment, shipping, and taxes. (ADMIN Only)
        </p>
      </div>

      {/* Notification Settings */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription>
            Управляйте настройками получения уведомлений о событиях в системе поддержки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Персональные уведомления</p>
              <p className="text-sm text-muted-foreground">
                Настройте email, звуковые уведомления и уведомления в приложении
              </p>
            </div>
            <Link href="/admin/settings/notifications">
              <Button variant="outline" className="flex items-center gap-2">
                Настроить
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure basic store information.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Store settings management features are in development.</p>
           <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            Settings forms will appear here (e.g., Currency, Taxes, Shipping Costs, Email Notifications).
          </div>
           <div className="flex justify-end mt-6">
             <Button disabled>
                <Save className="mr-2 h-4 w-4" /> Save Changes
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
