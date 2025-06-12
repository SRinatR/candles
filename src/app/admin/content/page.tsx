
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Edit site content like banners and informational pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editable Content Areas</CardTitle>
          <CardDescription>Select content to edit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="border p-4 rounded-md">
                <h3 className="font-semibold mb-1">Homepage Banners</h3>
                <p className="text-sm text-muted-foreground mb-2">Manage images and links for homepage banners.</p>
                <Button variant="outline" size="sm" disabled>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Banners (Coming Soon)
                </Button>
            </div>
            <div className="border p-4 rounded-md">
                <h3 className="font-semibold mb-1">About Us Page</h3>
                <p className="text-sm text-muted-foreground mb-2">Update the text content of the "About Us" page.</p>
                <Button variant="outline" size="sm" disabled>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit "About Us" (Coming Soon)
                </Button>
            </div>
             <div className="border p-4 rounded-md">
                <h3 className="font-semibold mb-1">Other Static Pages</h3>
                <p className="text-sm text-muted-foreground mb-2">Manage content for pages like "Payment", "Shipping", etc.</p>
                <Button variant="outline" size="sm" disabled>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Pages (Coming Soon)
                </Button>
            </div>
          <p className="text-muted-foreground mt-4">Full content editing features are in development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
