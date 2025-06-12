
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, Users, BarChart2, Percent } from "lucide-react";

// TODO: Localize texts when admin i18n is fully implemented
export default function AdminMarketingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing & Promotions</h1>
            <p className="text-muted-foreground">
              Manage marketing campaigns, discounts, and promotional tools.
            </p>
        </div>
        <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign (Soon)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">e.g., Summer Sale, New Arrivals (Simulated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+50 this week (Simulated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">e.g., WELCOME10, SAVE20 (Simulated)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>List of current and past marketing activities and discount codes.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tools for SEO, email newsletters, and promotion management will appear here.</p>
          <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Marketing Campaign Data (Coming Soon)</h3>
            <p className="text-sm">
              Detailed list of campaigns, performance metrics, and discount code management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
