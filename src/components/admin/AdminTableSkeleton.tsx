import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminTableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
  title?: string;
}

export function AdminTableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showActions = true,
  title 
}: AdminTableSkeletonProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        {title && <Skeleton className="h-6 w-48" />}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" /> {/* Search input */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" /> {/* Filter button */}
            <Skeleton className="h-9 w-32" /> {/* Add button */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {showActions && (
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminTableSkeleton rows={3} columns={3} title="Recent Activity" />
        <AdminTableSkeleton rows={3} columns={2} showActions={false} title="Quick Stats" />
      </div>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminLoginSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo skeleton */}
          <div className="flex justify-center mb-2">
            <Skeleton className="h-12 w-32 rounded-lg" />
          </div>
          {/* Title with icon */}
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          {/* Description */}
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="relative">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Password field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="relative">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Login button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
        <CardFooter className="text-center">
          <Skeleton className="h-3 w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}