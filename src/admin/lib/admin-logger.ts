// Современная утилита для логирования действий администратора через API
// Поддерживает базу данных Prisma и расширенную фильтрацию

interface LogEntry {
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AdminLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface LogsResponse {
  logs: AdminLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    totalActions: number;
    uniqueUsers: number;
    lastActivity: string;
  };
}

export interface LogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  userEmail?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'action' | 'userEmail';
  sortOrder?: 'asc' | 'desc';
  format?: 'csv' | 'json';
  includeMetadata?: boolean;
}

// Функция для создания лога через API
export async function logAdminAction(entry: LogEntry): Promise<AdminLogEntry | null> {
  try {
    // TODO: Implement proper logging API endpoint
    // For now, we'll just log to console and return a mock entry
    console.log('Admin Action:', {
      ...entry,
      timestamp: new Date().toISOString(),
    });
    
    // Return a mock log entry
    return {
      id: `log-${Date.now()}`,
      action: entry.action,
      details: JSON.stringify({
        details: entry.details,
        metadata: entry.metadata
      }),
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: new Date().toISOString(),
    };
    
    /* TODO: Uncomment when /api/admin/logs endpoint is implemented
    const response = await fetch('/api/admin/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
    */
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // В случае ошибки API, можно добавить fallback логику
    return null;
  }
}

// Функция для получения логов через API с расширенной фильтрацией
export async function getAdminLogs(filters?: LogFilters): Promise<LogsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (filters?.page) searchParams.set('page', filters.page.toString());
    if (filters?.limit) searchParams.set('limit', filters.limit.toString());
    if (filters?.userId) searchParams.set('userId', filters.userId);
    if (filters?.userEmail) searchParams.set('userEmail', filters.userEmail);
    if (filters?.action) searchParams.set('action', filters.action);
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);
    if (filters?.search) searchParams.set('search', filters.search);
    if (filters?.sortBy) searchParams.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) searchParams.set('sortOrder', filters.sortOrder);

    const response = await fetch(`/api/admin/logs?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin logs:', error);
    return { 
      logs: [], 
      pagination: { page: 1, limit: 100, total: 0, pages: 0 },
      stats: { totalActions: 0, uniqueUsers: 0, lastActivity: '' }
    };
  }
}

// Функция для очистки всех логов через API
export async function clearAdminLogs(): Promise<{ success: boolean; message?: string; deletedCount?: number }> {
  try {
    const response = await fetch('/api/admin/logs', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    return { success: true, ...result };
  } catch (error) {
    console.error('Failed to clear admin logs:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Функция для получения статистики логов
export async function getLogsStats(): Promise<{
  totalLogs: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  recentActivity: AdminLogEntry[];
} | null> {
  try {
    const response = await fetch('/api/admin/logs/stats');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch logs stats:', error);
    return null;
  }
}

// Функция для экспорта логов
export async function exportLogs(filters?: LogFilters): Promise<Blob | null> {
  try {
    const searchParams = new URLSearchParams();
    
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);
    if (filters?.userId) searchParams.set('userId', filters.userId);
    if (filters?.action) searchParams.set('action', filters.action);
    if (filters?.format) searchParams.set('format', filters.format);
    if (filters?.includeMetadata !== undefined) searchParams.set('includeMetadata', filters.includeMetadata.toString());

    const response = await fetch(`/api/admin/logs/export?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Failed to export logs:', error);
    return null;
  }
}

// Предопределенные действия для логирования
export const AdminActions = {
  // Действия с пользователями
  USER_CREATED: (userEmail: string, details?: string) => 
    logAdminAction({ 
      action: 'Создание пользователя', 
      details: `Email: ${userEmail}${details ? ` | ${details}` : ''}`,
      metadata: { userEmail, type: 'user_management' }
    }),
  
  USER_UPDATED: (userEmail: string, changes?: string[]) => 
    logAdminAction({ 
      action: 'Обновление пользователя', 
      details: `Email: ${userEmail}${changes ? ` | Изменения: ${changes.join(', ')}` : ''}`,
      metadata: { userEmail, changes, type: 'user_management' }
    }),
  
  USER_DELETED: (userEmail: string) => 
    logAdminAction({ 
      action: 'Удаление пользователя', 
      details: `Email: ${userEmail}`,
      metadata: { userEmail, type: 'user_management' }
    }),
  
  // Действия с продуктами
  PRODUCT_CREATED: (productName: string, sku?: string) => 
    logAdminAction({ 
      action: 'Создание продукта', 
      details: `Название: ${productName}${sku ? ` | SKU: ${sku}` : ''}`,
      metadata: { productName, sku, type: 'product_management' }
    }),
  
  PRODUCT_UPDATED: (productName: string, changes?: string[]) => 
    logAdminAction({ 
      action: 'Обновление продукта', 
      details: `Название: ${productName}${changes ? ` | Изменения: ${changes.join(', ')}` : ''}`,
      metadata: { productName, changes, type: 'product_management' }
    }),
  
  PRODUCT_DELETED: (productName: string) => 
    logAdminAction({ 
      action: 'Удаление продукта', 
      details: `Название: ${productName}`,
      metadata: { productName, type: 'product_management' }
    }),
  
  PRODUCT_STATUS_CHANGED: (productName: string, status: 'active' | 'inactive') => 
    logAdminAction({ 
      action: 'Изменение статуса продукта', 
      details: `Название: ${productName} | Новый статус: ${status}`,
      metadata: { productName, status, type: 'product_management' }
    }),
  
  // Действия с заказами
  ORDER_CREATED: (orderId: string, customerEmail?: string) => 
    logAdminAction({ 
      action: 'Создание заказа', 
      details: `ID заказа: ${orderId}${customerEmail ? ` | Клиент: ${customerEmail}` : ''}`,
      metadata: { orderId, customerEmail, type: 'order_management' }
    }),
  
  ORDER_STATUS_CHANGED: (orderId: string, oldStatus: string, newStatus: string) => 
    logAdminAction({ 
      action: 'Изменение статуса заказа', 
      details: `ID заказа: ${orderId} | ${oldStatus} → ${newStatus}`,
      metadata: { orderId, oldStatus, newStatus, type: 'order_management' }
    }),
  
  // Системные действия
  LOGIN: () => 
    logAdminAction({ 
      action: 'Вход в систему', 
      metadata: { type: 'authentication' }
    }),
  
  LOGOUT: () => 
    logAdminAction({ 
      action: 'Выход из системы', 
      metadata: { type: 'authentication' }
    }),
  
  SETTINGS_CHANGED: (settingName: string, oldValue?: string, newValue?: string) => 
    logAdminAction({ 
      action: 'Изменение настроек', 
      details: `Настройка: ${settingName}${oldValue && newValue ? ` | ${oldValue} → ${newValue}` : ''}`,
      metadata: { settingName, oldValue, newValue, type: 'system_settings' }
    }),
  
  LOGS_CLEARED: (deletedCount: number) => 
    logAdminAction({ 
      action: 'Очистка логов', 
      details: `Удалено записей: ${deletedCount}`,
      metadata: { deletedCount, type: 'system_maintenance' }
    }),
  
  // Действия с атрибутами
  ATTRIBUTE_CREATED: (type: string, name: string) => 
    logAdminAction({ 
      action: 'Создание атрибута', 
      details: `Тип: ${type} | Название: ${name}`,
      metadata: { attributeType: type, attributeName: name, type: 'attribute_management' }
    }),
  
  ATTRIBUTE_UPDATED: (type: string, name: string) => 
    logAdminAction({ 
      action: 'Обновление атрибута', 
      details: `Тип: ${type} | Название: ${name}`,
      metadata: { attributeType: type, attributeName: name, type: 'attribute_management' }
    }),
  
  ATTRIBUTE_DELETED: (type: string, name: string) => 
    logAdminAction({ 
      action: 'Удаление атрибута', 
      details: `Тип: ${type} | Название: ${name}`,
      metadata: { attributeType: type, attributeName: name, type: 'attribute_management' }
    }),
};

// Утилитарные функции
export const LogUtils = {
  // Форматирование даты для отображения
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },
  
  // Получение цвета для типа действия
  getActionColor: (action: string): string => {
    if (action.includes('Создание')) return 'green';
    if (action.includes('Удаление')) return 'red';
    if (action.includes('Обновление') || action.includes('Изменение')) return 'blue';
    if (action.includes('Вход') || action.includes('Выход')) return 'purple';
    return 'gray';
  },
  
  // Получение иконки для типа действия
  getActionIcon: (action: string): string => {
    if (action.includes('Создание')) return '➕';
    if (action.includes('Удаление')) return '🗑️';
    if (action.includes('Обновление') || action.includes('Изменение')) return '✏️';
    if (action.includes('Вход')) return '🔓';
    if (action.includes('Выход')) return '🔒';
    return '📝';
  }
};