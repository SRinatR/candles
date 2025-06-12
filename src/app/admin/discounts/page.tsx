
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function AdminDiscountsPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Discounts</h1>
            <p className="text-muted-foreground">
                Create and manage promotional codes and sales.
            </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Discount (Coming Soon)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discount List</CardTitle>
          <CardDescription>Active and past discounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Discount management features are in development.</p>
          <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            Discount listing will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
