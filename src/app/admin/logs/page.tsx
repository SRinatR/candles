
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trash2, AlertTriangle, Search, ArrowUpDown, FilterX } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useRouter } from 'next/navigation';
import { getAdminLogs, clearAdminLogs, type AdminLogEntry, logAdminAction } from '@/admin/lib/admin-logger';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SortableLogKeys = keyof Pick<AdminLogEntry, 'timestamp' | 'userEmail' | 'action'>;

export default function AdminLogsPage() {
  const { isAdmin, isLoading: isLoadingAuth, currentAdminUser } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const [filterEmail, setFilterEmail] = useState("");
  const [filterActionText, setFilterActionText] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortableLogKeys; direction: 'ascending' | 'descending' }>({ key: 'timestamp', direction: 'descending' });

  useEffect(() => {
    if (!isLoadingAuth && !isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isAdmin, router, isLoadingAuth]);

  useEffect(() => {
    if (isAdmin) {
      setLogs(getAdminLogs());
      setIsLoadingLogs(false);
    }
  }, [isAdmin]);

  const handleClearLogs = () => {
    clearAdminLogs();
    const clearedLogs = getAdminLogs(); // Fetch logs again, which will now be empty or contain only the "clear logs" action
    setLogs(clearedLogs);
    if (currentAdminUser?.email) {
      // This action itself might not appear immediately if `getAdminLogs` is called before it's written
      // A slight delay or re-fetch mechanism might be needed for perfect consistency here,
      // but for client-side logging, this is generally acceptable.
      logAdminAction(currentAdminUser.email, "All Admin Logs Cleared");
    }
    toast({ title: "Logs Cleared", description: "All admin logs have been cleared from localStorage." });
  };

  const requestSort = (key: SortableLogKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: SortableLogKeys) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-2 h-3 w-3 inline" /> : <ArrowUpDown className="ml-2 h-3 w-3 inline transform rotate-180" />;
    }
    return <ArrowUpDown className="ml-2 h-3 w-3 inline opacity-30" />;
  };
  
  const clearAllFilters = () => {
    setFilterEmail("");
    setFilterActionText("");
  };


  const displayedLogs = useMemo(() => {
    let sortableLogs = [...logs];

    // Filtering
    if (filterEmail) {
      sortableLogs = sortableLogs.filter(log =>
        log.userEmail.toLowerCase().includes(filterEmail.toLowerCase())
      );
    }
    if (filterActionText) {
      sortableLogs = sortableLogs.filter(log =>
        log.action.toLowerCase().includes(filterActionText.toLowerCase())
      );
    }
    
    // Sorting
    if (sortConfig.key !== null) {
      sortableLogs.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === undefined || valB === undefined) return 0;


        if (typeof valA === 'string' && typeof valB === 'string') {
           if (valA < valB) {
             return sortConfig.direction === 'ascending' ? -1 : 1;
           }
           if (valA > valB) {
             return sortConfig.direction === 'ascending' ? 1 : -1;
           }
        } else if (typeof valA === 'number' && typeof valB === 'number') {
             return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        // For timestamp (string), direct comparison works for ISO strings
         if (valA < valB) {
           return sortConfig.direction === 'ascending' ? -1 : 1;
         }
         if (valA > valB) {
           return sortConfig.direction === 'ascending' ? 1 : -1;
         }
        return 0;
      });
    }
    return sortableLogs;
  }, [logs, filterEmail, filterActionText, sortConfig]);


  if (isLoadingAuth || isLoadingLogs) {
    return <div className="flex h-full items-center justify-center"><p>Loading Logs...</p></div>;
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System & Audit Logs</h1>
          <p className="text-muted-foreground">
            View admin actions. Logs are stored in browser localStorage (max 100 entries).
          </p>
        </div>
        {logs.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete all log entries from your browser's local storage. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClearLogs} className="bg-destructive hover:bg-destructive/90">Yes, clear logs</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Log Entries</CardTitle>
           <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
            <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by User Email..."
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    className="pl-10 h-9 w-full sm:min-w-[250px]"
                />
            </div>
             <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by Action Text..."
                    value={filterActionText}
                    onChange={(e) => setFilterActionText(e.target.value)}
                    className="pl-10 h-9 w-full sm:min-w-[250px]"
                />
            </div>
            {(filterEmail || filterActionText) && (
              <Button variant="ghost" onClick={clearAllFilters} size="sm" className="text-xs w-full sm:w-auto">
                <FilterX className="mr-1 h-3 w-3" /> Clear Filters
              </Button>
            )}
          </div>
          <CardDescription className="mt-2">
            Displaying {displayedLogs.length} of {logs.length} log entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayedLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('timestamp')}>Timestamp {getSortIndicator('timestamp')}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('userEmail')}>User Email {getSortIndicator('userEmail')}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('action')}>Action {getSortIndicator('action')}</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLogs.map((log, index) => (
                  <TableRow key={log.timestamp + index}> {/* Use timestamp + index for potentially non-unique timestamps in quick succession */}
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.userEmail}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      {log.details ? (
                        <pre className="text-xs bg-muted p-2 rounded-sm overflow-x-auto max-w-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 p-12 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">No Log Entries Found</h3>
              <p className="text-sm">
                No logs match your current filters, or no actions have been logged yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        Note: Log data is simulated and stored in browser localStorage. For production, a robust backend logging solution is required.
      </p>
    </div>
  );
}
