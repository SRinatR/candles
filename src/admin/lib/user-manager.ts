import { toast } from '@/hooks/use-toast';

// Интерфейсы для пользователей
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  isSuperAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  ipAddress?: string;
  userAgent?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  loginAttempts?: number;
  permissions?: string[];
  department?: string;
  position?: string;
  avatar?: string;
  phone?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt' | 'role';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  includeBlocked?: boolean;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  position?: string;
  phone?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER' | 'USER';
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  department?: string;
  position?: string;
  phone?: string;
  permissions?: string[];
  twoFactorEnabled?: boolean;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    adminCount: number;
    managerCount: number;
    userCount: number;
    recentRegistrations: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  pendingUsers: number;
  adminCount: number;
  managerCount: number;
  userCount: number;
  recentRegistrations: number;
  dailyRegistrations: Record<string, number>;
  roleDistribution: Array<{ role: string; count: number; percentage: number }>;
  departmentStats: Array<{ department: string; count: number }>;
  loginStats: {
    dailyLogins: Record<string, number>;
    topActiveUsers: Array<{ user: AdminUser; loginCount: number }>;
  };
  securityStats: {
    twoFactorEnabled: number;
    lockedAccounts: number;
    failedLoginAttempts: number;
  };
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

// Предопределенные роли и права
export const UserRoles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER'
} as const;

export const UserStatuses = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING'
} as const;

export const UserPermissions = {
  // Управление пользователями
  MANAGE_USERS: 'manage_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  VIEW_USERS: 'view_users',
  
  // Управление продуктами
  MANAGE_PRODUCTS: 'manage_products',
  CREATE_PRODUCTS: 'create_products',
  UPDATE_PRODUCTS: 'update_products',
  DELETE_PRODUCTS: 'delete_products',
  VIEW_PRODUCTS: 'view_products',
  
  // Управление заказами
  MANAGE_ORDERS: 'manage_orders',
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  
  // Системные права
  VIEW_LOGS: 'view_logs',
  MANAGE_SETTINGS: 'manage_settings',
  EXPORT_DATA: 'export_data',
  BACKUP_SYSTEM: 'backup_system'
} as const;

// Функции для работы с пользователями
export async function getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/admin/users?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось загрузить пользователей');
  }
  
  return response.json();
}

export async function getUser(id: string): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось загрузить пользователя');
  }
  
  return response.json();
}

export async function createUser(userData: CreateUserData): Promise<AdminUser> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось создать пользователя');
  }
  
  return response.json();
}

export async function updateUser(id: string, userData: UpdateUserData): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось обновить пользователя');
  }
  
  return response.json();
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось удалить пользователя');
  }
  
  return response.json();
}

export async function toggleUserStatus(id: string, isBlocked: boolean): Promise<AdminUser> {
  return updateUser(id, { status: isBlocked ? 'BLOCKED' : 'ACTIVE' });
}

export async function resetUserPassword(id: string, newPassword?: string): Promise<{ success: boolean; temporaryPassword?: string }> {
  const response = await fetch(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось сбросить пароль');
  }
  
  return response.json();
}

export async function getUserStats(): Promise<UserStats> {
  const response = await fetch('/api/admin/users/stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось загрузить статистику');
  }
  
  return response.json();
}

export async function getUserActivity(userId?: string, limit: number = 50): Promise<UserActivity[]> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  params.append('limit', limit.toString());
  
  const response = await fetch(`/api/admin/users/activity?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось загрузить активность');
  }
  
  return response.json();
}

export async function exportUsers(filters: UserFilters & { format: 'csv' | 'json' | 'xlsx' }): Promise<Blob | null> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/admin/users/export?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось экспортировать пользователей');
  }
  
  return response.blob();
}

export async function bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserData>): Promise<{ success: boolean; updated: number }> {
  const response = await fetch('/api/admin/users/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds, updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось обновить пользователей');
  }
  
  return response.json();
}

export async function sendWelcomeEmail(userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/users/${userId}/send-welcome`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Не удалось отправить приветственное письмо');
  }
  
  return response.json();
}

// Утилиты
export const UserUtils = {
  formatDate: (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  formatRole: (role: string) => {
    const roleMap = {
      'ADMIN': 'Администратор',
      'MANAGER': 'Менеджер',
      'USER': 'Пользователь'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  },
  
  formatStatus: (status: string) => {
    const statusMap = {
      'ACTIVE': 'Активен',
      'BLOCKED': 'Заблокирован',
      'PENDING': 'Ожидает подтверждения'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  },
  
  getRoleColor: (role: string) => {
    const colorMap = {
      'ADMIN': '#dc2626', // red-600
      'MANAGER': '#2563eb', // blue-600
      'USER': '#16a34a' // green-600
    };
    return colorMap[role as keyof typeof colorMap] || '#6b7280';
  },
  
  getStatusColor: (status: string) => {
    const colorMap = {
      'ACTIVE': '#16a34a', // green-600
      'BLOCKED': '#dc2626', // red-600
      'PENDING': '#d97706' // amber-600
    };
    return colorMap[status as keyof typeof colorMap] || '#6b7280';
  },
  
  getRoleIcon: (role: string) => {
    const iconMap = {
      'ADMIN': '👑',
      'MANAGER': '👨‍💼',
      'USER': '👤'
    };
    return iconMap[role as keyof typeof iconMap] || '👤';
  },
  
  getStatusIcon: (status: string) => {
    const iconMap = {
      'ACTIVE': '✅',
      'BLOCKED': '🚫',
      'PENDING': '⏳'
    };
    return iconMap[status as keyof typeof iconMap] || '❓';
  },
  
  validateEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  validatePassword: (password: string) => {
    return password.length >= 6;
  },
  
  generatePassword: (length: number = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  },
  
  getPermissionsByRole: (role: string): string[] => {
    switch (role) {
      case 'ADMIN':
        return Object.values(UserPermissions);
      case 'MANAGER':
        return [
          UserPermissions.VIEW_USERS,
          UserPermissions.MANAGE_PRODUCTS,
          UserPermissions.CREATE_PRODUCTS,
          UserPermissions.UPDATE_PRODUCTS,
          UserPermissions.VIEW_PRODUCTS,
          UserPermissions.MANAGE_ORDERS,
          UserPermissions.VIEW_ORDERS,
          UserPermissions.UPDATE_ORDER_STATUS,
          UserPermissions.VIEW_LOGS
        ];
      case 'USER':
        return [
          UserPermissions.VIEW_PRODUCTS,
          UserPermissions.VIEW_ORDERS
        ];
      default:
        return [];
    }
  },
  
  canUserPerformAction: (user: AdminUser, permission: string): boolean => {
    if (user.isSuperAdmin) return true;
    const userPermissions = user.permissions || UserUtils.getPermissionsByRole(user.role);
    return userPermissions.includes(permission);
  },
  
  isSuperAdmin: (user: AdminUser): boolean => {
    return user.isSuperAdmin === true || user.email === 'superadmin@askimcandles.com';
  },
  
  canEditUser: (currentUser: AdminUser, targetUser: AdminUser): boolean => {
    if (UserUtils.isSuperAdmin(currentUser)) return true;
    if (UserUtils.isSuperAdmin(targetUser)) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'MANAGER' && targetUser.role === 'USER') return true;
    return currentUser.id === targetUser.id;
  },
  
  canDeleteUser: (currentUser: AdminUser, targetUser: AdminUser): boolean => {
    if (UserUtils.isSuperAdmin(targetUser)) return false;
    if (currentUser.id === targetUser.id) return false;
    if (UserUtils.isSuperAdmin(currentUser)) return true;
    if (currentUser.role === 'ADMIN' && targetUser.role !== 'ADMIN') return true;
    return false;
  }
};

// Константы для департаментов
export const Departments = {
  ADMINISTRATION: 'Администрация',
  SALES: 'Продажи',
  MARKETING: 'Маркетинг',
  PRODUCTION: 'Производство',
  LOGISTICS: 'Логистика',
  CUSTOMER_SERVICE: 'Служба поддержки',
  IT: 'IT отдел',
  FINANCE: 'Финансы',
  HR: 'Кадры'
} as const;

// Хуки для уведомлений
export const UserNotifications = {
  userCreated: (userName: string) => {
    toast({
      title: 'Пользователь создан',
      description: `Пользователь ${userName} успешно создан`,
    });
  },
  
  userUpdated: (userName: string) => {
    toast({
      title: 'Пользователь обновлен',
      description: `Данные пользователя ${userName} успешно обновлены`,
    });
  },
  
  userDeleted: (userName: string) => {
    toast({
      title: 'Пользователь удален',
      description: `Пользователь ${userName} успешно удален`,
      variant: 'destructive',
    });
  },
  
  userBlocked: (userName: string) => {
    toast({
      title: 'Пользователь заблокирован',
      description: `Пользователь ${userName} заблокирован`,
      variant: 'destructive',
    });
  },
  
  userUnblocked: (userName: string) => {
    toast({
      title: 'Пользователь разблокирован',
      description: `Пользователь ${userName} разблокирован`,
    });
  },
  
  passwordReset: (userName: string) => {
    toast({
      title: 'Пароль сброшен',
      description: `Пароль для пользователя ${userName} успешно сброшен`,
    });
  },
  
  bulkUpdate: (count: number) => {
    toast({
      title: 'Массовое обновление',
      description: `Обновлено ${count} пользователей`,
    });
  },
  
  exportComplete: (format: string) => {
    toast({
      title: 'Экспорт завершен',
      description: `Пользователи экспортированы в формате ${format.toUpperCase()}`,
    });
  },
  
  error: (message: string) => {
    toast({
      title: 'Ошибка',
      description: message,
      variant: 'destructive',
    });
  }
};