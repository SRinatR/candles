
"use client";

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { getAdminLogs, clearAdminLogs } from '@/admin/lib/admin-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Calendar, User, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLocale, getAdminDictionary } from '@/admin/dictionaries';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AdminLogsDictionary {
  title: string;
  description: string;
  clearLogs: string;
  refresh: string;
  noLogs: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  clearLogsConfirm: string;
  logsClearedToast: string;
  logsClearedToastDesc: string;
  filterByUser: string;
  filterByAction: string;
  allUsers: string;
  allActions: string;
  searchPlaceholder: string;
  note: string;
}

export default function AdminLogsPage() {
  const { user, loading } = useUnifiedAuth();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dictionary, setDictionary] = useState<AdminLogsDictionary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 });
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const loadDictionary = async () => {
      const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
      const locale = storedLocale || 'en';
      const dict = await getAdminDictionary(locale);
      setDictionary(dict.logs);
    };
    
    loadDictionary();
  }, [isClient]);

  const loadLogs = async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    try {
      const response = await getAdminLogs({ page: 1, limit: 100 });
      setLogs(response.logs || []);
      setPagination(response.pagination || { page: 1, limit: 100, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isClient && dictionary) {
      loadLogs();
    }
  }, [isClient, dictionary]);

  const handleClearLogs = async () => {
    if (!dictionary) return;
    
    if (window.confirm(dictionary.clearLogsConfirm)) {
      const success = await clearAdminLogs();
      if (success) {
        setLogs([]);
        setFilteredLogs([]);
        setPagination({ page: 1, limit: 100, total: 0, pages: 0 });
        toast({ title: dictionary.logsClearedToast, description: dictionary.logsClearedToastDesc });
      }
    }
  };

  // Filter logs
  useEffect(() => {
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userEmail === userFilter);
    }
    
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, userFilter, actionFilter]);

  // Get unique users and actions for filters
  const uniqueUsers = Array.from(new Set(logs.map(log => log.userEmail).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => {
    const action = log.action.split(':')[0].trim();
    return action;
  })));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view admin logs.</p>
        </div>
      </div>
    );
  }

  if (!dictionary) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Logs</h1>
        <Button
           onClick={clearLogs}
           variant="destructive"
           disabled={loading || logs.length === 0}
           className="flex items-center gap-2"
         >
           {loading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
           ) : (
             <Trash2 className="h-4 w-4" />
           )}
           Clear All Logs
         </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log ({logs.length} entries)
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex-1">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((email) => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
           {loading ? (
             <div className="space-y-4">
               <Skeleton className="h-8 w-64" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-64 w-full" />
             </div>
           ) : (
             <>
               {logs.length === 0 ? (
                 <div className="text-center py-8">
                   <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                   <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                   <p className="text-muted-foreground">Admin activity will appear here.</p>
                 </div>
               ) : (
                 <>
                   <div className="rounded-md border">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Timestamp</TableHead>
                           <TableHead>User</TableHead>
                           <TableHead>Action</TableHead>
                           <TableHead>Details</TableHead>
                           <TableHead>IP Address</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                           <TableRow key={log.id}>
                             <TableCell className="font-mono text-sm">
                               {new Date(log.createdAt).toLocaleString()}
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-2">
                                 <User className="h-4 w-4 text-muted-foreground" />
                                 <div>
                                   <div className="font-medium">{log.userName || 'Unknown'}</div>
                                   <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell>
                               <Badge variant="outline">
                                 {log.action}
                               </Badge>
                             </TableCell>
                             <TableCell className="max-w-md">
                               {log.details && (
                                 <div className="text-sm text-muted-foreground truncate">
                                   {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                 </div>
                               )}
                             </TableCell>
                             <TableCell className="font-mono text-sm">
                               {log.ipAddress || 'N/A'}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                   
                   {/* Pagination */}
                   {totalPages > 1 && (
                     <div className="flex items-center justify-between mt-4">
                       <div className="text-sm text-muted-foreground">
                         Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                       </div>
                       <div className="flex items-center space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                           disabled={currentPage === 1}
                         >
                           <ChevronLeft className="h-4 w-4" />
                           Previous
                         </Button>
                         <span className="text-sm">
                           Page {currentPage} of {totalPages}
                         </span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                           disabled={currentPage === totalPages}
                         >
                           Next
                           <ChevronRight className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   )}
                 </>
               )}
             </>
           )}
         </CardContent>
       </Card>
     </div>
   );
}
