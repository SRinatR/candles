
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { AdminFormSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AlertTriangle, Save } from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'; // Import React for useEffect

export default function AdminSettingsPage() {
  const { isAdmin, isLoading } = useUnifiedAuth(); // Add isLoading from context
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) { // Check isLoading before redirecting
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

    