
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
        <p className="text-muted-foreground">
          View and process customer orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Browse and manage all customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Order table and management features are in development.</p>
           <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            Order listing will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
