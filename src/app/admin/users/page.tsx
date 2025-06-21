'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus, 
  resetUserPassword,
  getUserStats,
  exportUsers,
  bulkUpdateUsers,
  UserFilters,
  AdminUser,
  CreateUserData,
  UpdateUserData,
  UsersResponse,
  UserStats
} from '@/admin/lib/user-manager';
import { UserNotifications } from '@/admin/lib/user-manager';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Icons
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff, 
  Key, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

// Локализация
import { useAdminPreferences } from '@/hooks/useAdminPreferences';
import adminDictionaries from '@/admin/dictionaries/ru.json';
import adminDictionariesEn from '@/admin/dictionaries/en.json';

type AdminDictionary = typeof adminDictionaries;

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useAdminPreferences();
  
  // Получаем словарь в зависимости от языка
  const dict = (language === 'en' ? adminDictionariesEn : adminDictionaries) as AdminDictionary;
  const userDict = dict.adminUsersPage;

  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    search: '',
    role: undefined,
    status: undefined,
    department: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    name: '',
    password: '',
    role: 'USER',
    department: '',
    position: '',
    phone: '',
    notes: '',
    sendWelcomeEmail: false
  });

  const [editUserData, setEditUserData] = useState<UpdateUserData>({});
  const [newPassword, setNewPassword] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin or manager role
    // This should be implemented based on your auth system
    // For now, we'll assume the check is done on the API side
  }, [session, status, router]);

  // Load users and stats
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        getUsers(filters),
        getUserStats()
      ]);
      
      setUsers(usersResponse.users);
      setCurrentPage(usersResponse.pagination.page);
      setTotalPages(usersResponse.pagination.pages);
      setTotalUsers(usersResponse.pagination.total);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (session?.user?.email) {
      loadUsers();
    }
  }, [session, loadUsers]);

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to first page when changing filters
    }));
  };

  // Handle user selection
  const handleUserSelect = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedUsers(selected ? users.map(user => user.id) : []);
  };

  // User actions
  const handleCreateUser = async () => {
    try {
      await createUser(newUserData);
      toast.success('Пользователь создан успешно');
      setShowAddDialog(false);
      setNewUserData({
        email: '',
        name: '',
        password: '',
        role: 'USER',
        department: '',
        position: '',
        phone: '',
        notes: '',
        sendWelcomeEmail: false
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Ошибка при создании пользователя');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, editUserData);
      toast.success('Пользователь обновлен успешно');
      setShowEditDialog(false);
      setEditUserData({});
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Ошибка при обновлении пользователя');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      toast.success('Пользователь удален успешно');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Ошибка при удалении пользователя');
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      await toggleUserStatus(user.id);
      const message = user.isBlocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован';
      toast.success(message);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Ошибка при изменении статуса пользователя');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    try {
      await resetUserPassword(selectedUser.id, newPassword, sendNotification);
      toast.success('Пароль сброшен успешно');
      setShowResetPasswordDialog(false);
      setNewPassword('');
      setSendNotification(true);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Ошибка при сбросе пароля');
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Не выбрано ни одного пользователя');
      return;
    }
    
    try {
      await bulkUpdateUsers(selectedUsers, { action: 'delete' });
      toast.success('Массовое действие выполнено успешно');
      setShowBulkDeleteDialog(false);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Ошибка при массовом удалении');
    }
  };

  const handleBulkBlock = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Не выбрано ни одного пользователя');
      return;
    }
    
    try {
      await bulkUpdateUsers(selectedUsers, { action: 'block' });
      toast.success('Пользователи заблокированы');
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk blocking users:', error);
      toast.error('Ошибка при массовой блокировке');
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Не выбрано ни одного пользователя');
      return;
    }
    
    try {
      await bulkUpdateUsers(selectedUsers, { action: 'unblock' });
      toast.success('Пользователи разблокированы');
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk unblocking users:', error);
      toast.error('Ошибка при массовой разблокировке');
    }
  };

  // Export users
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await exportUsers(format, undefined, filters);
      toast.success('Экспорт завершен успешно');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Ошибка при экспорте данных');
    }
  };

  // Helper functions
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'MANAGER': return 'default';
      case 'USER': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string, isBlocked: boolean) => {
    if (isBlocked) return 'destructive';
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'BLOCKED': return 'destructive';
      case 'PENDING': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Никогда';
    return new Date(date).toLocaleString('ru-RU');
  };

  // Show loading skeleton while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access (this should be more robust in a real app)
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{userDict.accessDeniedTitle}</h1>
        <p className="text-muted-foreground mb-4">
          {userDict.accessDeniedDesc}
        </p>
        <Button onClick={() => router.push('/admin')}>
          Вернуться в админ-панель
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{userDict.title}</h1>
          <p className="text-muted-foreground">{userDict.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadUsers()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Экспорт в CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Экспорт в JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего пользователей
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.overview.recentRegistrations} за неделю
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Активные пользователи
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.overview.activeUsers / stats.overview.totalUsers) * 100)}% от общего числа
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Заблокированные
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.blockedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.overview.blockedUsers / stats.overview.totalUsers) * 100)}% от общего числа
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Активность
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.recentLogins}</div>
              <p className="text-xs text-muted-foreground">
                входов за неделю
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры и поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Поиск по имени или email"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role-filter">Роль</Label>
              <Select
                value={filters.role || 'all'}
                onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="ADMIN">{userDict.roleAdmin}</SelectItem>
                  <SelectItem value="MANAGER">{userDict.roleManager}</SelectItem>
                  <SelectItem value="USER">{userDict.roleUser}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Статус</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="ACTIVE">{userDict.statusActive}</SelectItem>
                  <SelectItem value="BLOCKED">{userDict.statusBlocked}</SelectItem>
                  <SelectItem value="PENDING">В ожидании</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department-filter">Отдел</Label>
              <Input
                id="department-filter"
                placeholder="Отдел"
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Выбрано: {selectedUsers.length} пользователей
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkBlock}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Заблокировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkUnblock}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Разблокировать
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Пользователи ({totalUsers})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Выбрать все</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{userDict.nameHeader}</TableHead>
                  <TableHead>{userDict.emailHeader}</TableHead>
                  <TableHead>{userDict.roleHeader}</TableHead>
                  <TableHead>{userDict.statusHeader}</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead className="w-12">{userDict.actionsHeader}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelect(user.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
                          <AvatarFallback>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'Без имени'}</div>
                          {user.isSuperAdmin && (
                            <Badge variant="outline" className="text-xs">
                              Super Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role === 'ADMIN' ? userDict.roleAdmin : 
                         user.role === 'MANAGER' ? userDict.roleManager : userDict.roleUser}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status, user.isBlocked)}>
                        {user.isBlocked ? 'Заблокирован' : 
                         user.status === 'ACTIVE' ? userDict.statusActive : 
                         user.status === 'BLOCKED' ? userDict.statusBlocked : 'В ожидании'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(user.lastLoginAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setEditUserData({
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                department: user.department,
                                position: user.position,
                                phone: user.phone,
                                notes: user.notes
                              });
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {userDict.editManagerAction}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={user.isSuperAdmin}
                          >
                            {user.isBlocked ? (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                {userDict.unblockUserAction}
                              </>
                            ) : (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                {userDict.blockUserAction}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPasswordDialog(true);
                            }}
                            disabled={user.isSuperAdmin}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Сбросить пароль
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                            disabled={user.isSuperAdmin}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {userDict.deleteManagerAction}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                Показано {((currentPage - 1) * filters.limit!) + 1}-{Math.min(currentPage * filters.limit!, totalUsers)} из {totalUsers}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Назад
                </Button>
                <span className="text-sm">
                  Страница {currentPage} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Далее
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Добавить нового пользователя</DialogTitle>
            <DialogDescription>
              Заполните форму для создания нового пользователя в системе.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-name">Имя</Label>
              <Input
                id="new-name"
                value={newUserData.name}
                onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Полное имя"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Пароль</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Пароль"
              />
            </div>
            <div>
              <Label htmlFor="new-role">Роль</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{userDict.roleUser}</SelectItem>
                  <SelectItem value="MANAGER">{userDict.roleManager}</SelectItem>
                  <SelectItem value="ADMIN">{userDict.roleAdmin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-department">Отдел</Label>
              <Input
                id="new-department"
                value={newUserData.department || ''}
                onChange={(e) => setNewUserData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Отдел"
              />
            </div>
            <div>
              <Label htmlFor="new-position">Должность</Label>
              <Input
                id="new-position"
                value={newUserData.position || ''}
                onChange={(e) => setNewUserData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Должность"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="new-phone">Телефон</Label>
              <Input
                id="new-phone"
                value={newUserData.phone || ''}
                onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="new-notes">Заметки</Label>
              <Textarea
                id="new-notes"
                value={newUserData.notes || ''}
                onChange={(e) => setNewUserData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Дополнительные заметки"
                rows={3}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox
                id="send-welcome"
                checked={newUserData.sendWelcomeEmail}
                onCheckedChange={(checked) => setNewUserData(prev => ({ ...prev, sendWelcomeEmail: checked === true }))}
              />
              <Label htmlFor="send-welcome">Отправить приветственное письмо</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {userDict.cancelButton}
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={!newUserData.email || !newUserData.name || !newUserData.password}
            >
              Создать пользователя
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Измените информацию о пользователе.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Имя</Label>
                <Input
                  id="edit-name"
                  value={editUserData.name || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Полное имя"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUserData.email || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Роль</Label>
                <Select
                  value={editUserData.role || selectedUser.role}
                  onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">{userDict.roleUser}</SelectItem>
                    <SelectItem value="MANAGER">{userDict.roleManager}</SelectItem>
                    <SelectItem value="ADMIN">{userDict.roleAdmin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-department">Отдел</Label>
                <Input
                  id="edit-department"
                  value={editUserData.department || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Отдел"
                />
              </div>
              <div>
                <Label htmlFor="edit-position">Должность</Label>
                <Input
                  id="edit-position"
                  value={editUserData.position || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Должность"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Телефон</Label>
                <Input
                  id="edit-phone"
                  value={editUserData.phone || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Заметки</Label>
                <Textarea
                  id="edit-notes"
                  value={editUserData.notes || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Дополнительные заметки"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {userDict.cancelButton}
            </Button>
            <Button onClick={handleUpdateUser}>
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердить удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить пользователя?
              {selectedUser && (
                <span className="font-medium">
                  {selectedUser.name} ({selectedUser.email})
                </span>
              )}
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сбросить пароль</DialogTitle>
            <DialogDescription>
              Введите новый пароль для пользователя
              {selectedUser && (
                <span className="font-medium">
                  {selectedUser.name} ({selectedUser.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password-reset">Новый пароль</Label>
              <Input
                id="new-password-reset"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(checked === true)}
              />
              <Label htmlFor="send-notification">Отправить уведомление пользователю</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={!newPassword}
            >
              Сбросить пароль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Массовое удаление пользователей</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedUsers.length} выбранных пользователей? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}