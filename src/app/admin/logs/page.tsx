"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { getAdminLogs, clearAdminLogs, getLogsStats, exportLogs, LogUtils } from '@/admin/lib/admin-logger';
import type { AdminLogEntry, LogFilters, LogsResponse } from '@/admin/lib/admin-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Trash2, 
  RefreshCw, 
  Calendar, 
  User, 
  Activity, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Download,
  Filter,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminLogsDictionary {
  title: string;
  description: string;
  clearAllButton: string;
  entriesTitle: string;
  filterByUserEmailPlaceholder: string;
  filterByActionPlaceholder: string;
  listDescription: string;
  timestampHeader: string;
  userEmailHeader: string;
  actionHeader: string;
  detailsHeader: string;
  noEntriesFound: string;
  noEntriesDesc: string;
  confirmClearTitle: string;
  confirmClearDesc: string;
  confirmClearButton: string;
  logsClearedToastTitle: string;
  logsClearedToastDesc: string;
  simulationNote: string;
  clearFiltersButton: string;
}

interface LogsStats {
  totalLogs: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  recentActivity: AdminLogEntry[];
  dailyStats: Record<string, number>;
  userStats: Array<{ userEmail: string; actionsCount: number }>;
  actionTypeStats: Array<{ type: string; count: number }>;
}

export default function AdminLogsPage() {
  const { currentUser, isLoading: authLoading, isAdmin, isManager } = useUnifiedAuth();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dictionary, setDictionary] = useState<AdminLogsDictionary | null>(null);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  // Фильтры
  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: 50,
    search: '',
    userEmail: '',
    action: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const loadDictionary = async () => {
      const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
      const locale = storedLocale || 'en';
      const dict = await getAdminDictionary(locale);
      setDictionary(dict.adminLogsPage);
    };
    
    loadDictionary();
  }, [isClient]);

  const loadLogs = useCallback(async () => {
    if (!isClient || !dictionary) return;
    
    setIsLoading(true);
    try {
      const response: LogsResponse = await getAdminLogs({
        ...filters,
        page: currentPage
      });
      
      setLogs(response.logs || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить логи',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  }, [isClient, dictionary, filters, currentPage, toast]);

  const loadStats = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const statsData = await getLogsStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && dictionary) {
      loadLogs();
      loadStats();
    }
  }, [loadLogs, loadStats]);

  const handleClearLogs = async () => {
    if (!dictionary) return;
    
    setIsClearing(true);
    try {
      const result = await clearAdminLogs();
      if (result.success) {
        setLogs([]);
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 });
        await loadStats(); // Обновляем статистику
        toast({ 
          title: dictionary.logsClearedToastTitle, 
          description: `${dictionary.logsClearedToastDesc} Удалено: ${result.deletedCount || 0}` 
        });
      } else {
        toast({
          title: 'Ошибка',
          description: result.message || 'Не удалось очистить логи',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при очистке логов',
        variant: 'destructive'
      });
    }
    setIsClearing(false);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const blob = await exportLogs({
        ...filters,
        format,
        includeMetadata: true
      });
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_logs_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Экспорт завершен',
          description: `Логи экспортированы в формате ${format.toUpperCase()}`
        });
      } else {
        throw new Error('Не удалось создать файл экспорта');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать логи',
        variant: 'destructive'
      });
    }
    setIsExporting(false);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      search: '',
      userEmail: '',
      action: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentUser || (!isAdmin && !isManager)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Доступ запрещен</h3>
          <p className="text-muted-foreground">У вас нет прав для просмотра логов администратора.</p>
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

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userEmail).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => {
    const action = log.action.split(':')[0].trim();
    return action;
  })));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Логи Администратора
            </h1>
            <p className="text-muted-foreground mt-1">
              Просмотр и управление логами действий администраторов
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={loadLogs}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Обновить логи</TooltipContent>
            </Tooltip>
            
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'json')} disabled={isExporting}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Экспорт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isLoading || logs.length === 0 || isClearing}
                    className="flex items-center gap-2"
                  >
                    {isClearing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Очистить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Подтвердите очистку</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие навсегда удалит все записи логов из базы данных. 
                      Это действие нельзя будет отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Да, очистить логи
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Логи ({pagination.total})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {/* Фильтры */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Фильтры
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Поиск</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Поиск по действию, пользователю..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userFilter">Пользователь</Label>
                    <Select value={filters.userEmail || 'all'} onValueChange={(value) => handleFilterChange('userEmail', value === 'all' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все пользователи" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все пользователи</SelectItem>
                        {uniqueUsers.map((email) => (
                          <SelectItem key={email} value={email}>{email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="actionFilter">Действие</Label>
                    <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все действия" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все действия</SelectItem>
                        {uniqueActions.map((action) => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Действия</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Сбросить
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Дата начала</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Дата окончания</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Таблица логов */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Записи логов
                </CardTitle>
                <CardDescription>
                  Отображается {logs.length} из {pagination.total} записей
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Логи не найдены</h3>
                    <p className="text-muted-foreground">Логи, соответствующие вашим фильтрам, отсутствуют.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Время</TableHead>
                            <TableHead>Пользователь</TableHead>
                            <TableHead>Действие</TableHead>
                            <TableHead>Детали</TableHead>
                            <TableHead className="w-[120px]">IP адрес</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{LogUtils.formatDate(log.createdAt)}</span>
                                </div>
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
                                <Badge 
                                  variant="outline" 
                                  className="flex items-center gap-1 w-fit"
                                  style={{ 
                                    borderColor: LogUtils.getActionColor(log.action),
                                    color: LogUtils.getActionColor(log.action)
                                  }}
                                >
                                  <span>{LogUtils.getActionIcon(log.action)}</span>
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md">
                                {log.details && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm text-muted-foreground truncate cursor-help">
                                        {log.details}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      <p>{log.details}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {log.ipAddress || 'unknown'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Пагинация */}
                    {pagination.pages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Страница {pagination.page} из {pagination.pages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {currentPage} / {pagination.pages}
                          </span>
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= pagination.pages}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего логов</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLogs}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Уникальных пользователей</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Топ действий</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topActions.slice(0, 3).map((action, index) => (
                        <div key={action.action} className="flex justify-between text-sm">
                          <span className="truncate">{action.action}</span>
                          <span className="font-medium">{action.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Последняя активность</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recentActivity.slice(0, 3).map((log) => (
                        <div key={log.id} className="text-sm">
                          <div className="font-medium truncate">{log.action}</div>
                          <div className="text-muted-foreground">
                            {LogUtils.formatDate(log.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}