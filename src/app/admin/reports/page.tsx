
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, BarChartHorizontalBig, Users2, PackageSearch } from "lucide-react";

// TODO: Localize texts when admin i18n is fully implemented
export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate and view reports on various aspects of your store.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select a report type to view or generate. (Functionality Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="flex flex-col items-start h-auto p-4 space-y-1 text-left" disabled>
            <div className="flex items-center space-x-2 mb-1">
                <BarChartHorizontalBig className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Sales Report</h3>
            </div>
            <p className="text-xs text-muted-foreground">Analyze sales trends, revenue by period, best-selling products.</p>
          </Button>
           <Button variant="outline" className="flex flex-col items-start h-auto p-4 space-y-1 text-left" disabled>
            <div className="flex items-center space-x-2 mb-1">
                <Users2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customer Report</h3>
            </div>
            <p className="text-xs text-muted-foreground">Understand customer demographics, purchase history, and lifetime value.</p>
          </Button>
           <Button variant="outline" className="flex flex-col items-start h-auto p-4 space-y-1 text-left" disabled>
            <div className="flex items-center space-x-2 mb-1">
                <PackageSearch className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Inventory Report</h3>
            </div>
            <p className="text-xs text-muted-foreground">Track stock levels, identify low-stock items, and manage inventory value.</p>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Report Display Area (Coming Soon)</h3>
            <p className="text-sm">
              Generated reports will be available for download or viewing here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
