
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, Users, BarChart3, Download } from "lucide-react";

// TODO: Localize texts when admin i18n is fully implemented
export default function AdminSalesPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
            <p className="text-muted-foreground">
              View and manage sales data and order processing.
            </p>
        </div>
        <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" /> Export Sales Data (Soon)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250,000 UZS</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month (Simulated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">+10 orders from last week (Simulated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,000 UZS</div>
            <p className="text-xs text-muted-foreground">Calculated from total revenue & orders (Simulated)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>List of the latest transactions and sales. Full order management is in development.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Order Table & Management (Coming Soon)</h3>
            <p className="text-sm">
              Detailed order list with statuses, filtering, and actions will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
