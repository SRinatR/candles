
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { LogOut, ShieldAlert, Info, Clock, Laptop, Globe, Search, Trash2, Users, RefreshCw, Filter } from "lucide-react"; 
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from 'react';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';
import { useToast } from '@/hooks/use-toast';

type AdminSessionsPageDict = typeof enAdminMessages.adminSessionsPage;

interface UserSession {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  userAgent: string | null;
  ipAddress: string | null;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

interface SessionsResponse {
  sessions: UserSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const fallbackDict: AdminSessionsPageDict = {
    title: "Session Management",
    description: "Manage active sessions and view session details across all devices.",
    currentSessionTitle: "Current Session (This Device)",
    nameLabel: "Name:",
    emailLabel: "Email:",
    roleLabel: "Role:",
    sessionStartTimeLabel: "Session Start Time:",
    deviceBrowserLabel: "Device/Browser:",
    ipAddressLabel: "IP Address:",
    ipAddressNote: "IP address tracking",
    logoutThisDeviceButton: "Log Out From This Device",
    otherSessionsTitle: "Other Active Sessions",
    otherSessionsInfo: "View and manage sessions across all devices. You can log out from specific devices or all devices at once.",
    logoutOtherDevicesButton: "Log Out From All Other Devices",
    accessDeniedTitle: "Access Denied",
    accessDeniedDesc: "You do not have permission to view this page."
};


export default function AdminSessionsPage() {
  const { currentAdminUser, logout, isAdmin, isLoading, sessionStartTime, sessionUserAgent } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dict, setDict] = useState<AdminSessionsPageDict>(fallbackDict);
  const [isClient, setIsClient] = useState(false);
  const [formattedStartTime, setFormattedStartTime] = useState<string | null>(null);
  
  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (statusFilter === 'active') {
        params.append('status', 'active');
      } else if (statusFilter === 'expired') {
        params.append('status', 'expired');
      }
      
      const response = await fetch(`/api/admin/sessions?${params}`);
      if (response.ok) {
        const data: SessionsResponse = await response.json();
        setSessions(data.sessions);
        setTotalPages(data.pagination.pages);
        setTotalSessions(data.pagination.total);
      } else {
        console.error('Failed to load sessions');
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentPage, statusFilter, toast]);

  // Delete expired sessions
  const deleteExpiredSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions?expiredOnly=true', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `Deleted ${result.deletedCount} expired sessions`
        });
        loadSessions();
      } else {
        throw new Error('Failed to delete sessions');
      }
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      toast({
        title: "Error",
        description: "Failed to delete expired sessions",
        variant: "destructive"
      });
    }
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      session.user.email.toLowerCase().includes(searchLower) ||
      `${session.user.firstName} ${session.user.lastName || ''}`.trim().toLowerCase().includes(searchLower) ||
      session.userAgent?.toLowerCase().includes(searchLower) ||
      session.ipAddress?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      try {
        const fullDict = await getAdminDictionary(localeToLoad);
        setDict(fullDict.adminSessionsPage || fallbackDict);
      } catch (error) {
        console.error("Error loading admin dictionary for sessions page:", error);
        setDict(fallbackDict); // Use fallback if loading fails
      }
    }
    loadDictionary();
  }, []); 

  useEffect(() => {
    if (isClient && !isLoading && !isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isAdmin, router, isLoading, isClient]);

  useEffect(() => {
    if (sessionStartTime) {
      try {
        setFormattedStartTime(new Date(sessionStartTime).toLocaleString());
      } catch (e) {
        setFormattedStartTime("Invalid date");
      }
    } else {
      setFormattedStartTime(null);
    }
  }, [sessionStartTime]);

  // Load sessions when component mounts or filters change
  useEffect(() => {
    if (isClient && isAdmin) {
      loadSessions();
    }
  }, [isClient, isAdmin, loadSessions]);

  if (!isClient || isLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading Session Management...</p></div>;
  }

  if (!isAdmin) { // This check should ideally happen after isLoading is false and dict is loaded
     return (
         <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center space-x-2">
                <ShieldAlert className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">{dict.accessDeniedTitle || "Access Denied"}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{dict.accessDeniedDesc || "You do not have permission to view this page."}</p>
            </CardContent>
         </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {dict.title}
          </CardTitle>
          <CardDescription>{dict.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Session */}
          {currentAdminUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  {dict.currentSessionTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>{dict.nameLabel}</strong> {`${currentAdminUser.firstName} ${currentAdminUser.lastName || ''}`.trim()}</p>
                    <p><strong>{dict.emailLabel}</strong> {currentAdminUser.email}</p>
                    <div><strong>{dict.roleLabel}</strong> 
                      <Badge variant={currentAdminUser.role === 'ADMIN' ? 'default' : 'secondary'} className="ml-2">
                        {currentAdminUser.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formattedStartTime && (
                      <p className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>{dict.sessionStartTimeLabel}</strong> 
                        <span className="ml-1">{formattedStartTime}</span>
                      </p>
                    )}
                    <p className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <strong>{dict.ipAddressLabel}</strong> 
                      <span className="ml-1">{dict.ipAddressNote}</span>
                    </p>
                  </div>
                </div>
                {sessionUserAgent && (
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">
                      <strong>{dict.deviceBrowserLabel}</strong> {sessionUserAgent}
                    </p>
                  </div>
                )}
                <div className="pt-2">
                  <Button onClick={logout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" /> {dict.logoutThisDeviceButton}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Sessions Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All User Sessions
                  <Badge variant="outline">{totalSessions}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={loadSessions} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoadingSessions}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clean Expired
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expired Sessions</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all expired user sessions from the database. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteExpiredSessions}>
                          Delete Expired Sessions
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email, name, IP, or user agent..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'expired') => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="expired">Expired Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sessions Table */}
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading sessions...
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Device Info</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{`${session.user.firstName} ${session.user.lastName || ''}`.trim() || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{session.user.email}</p>
                              <Badge variant={session.user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                                {session.user.role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.isActive ? 'default' : 'secondary'}>
                              {session.isActive ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <p className="text-xs text-muted-foreground break-words" title={session.userAgent || 'Unknown'}>
                                {session.userAgent || 'Unknown'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {session.ipAddress || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleTimeString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(session.expiresAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.expiresAt).toLocaleTimeString()}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No sessions found matching your search.' : 'No sessions found.'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredSessions.length} of {totalSessions} sessions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
    
