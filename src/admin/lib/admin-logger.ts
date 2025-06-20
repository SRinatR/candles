
// Утилита для логирования действий администратора через API

interface LogEntry {
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
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
  createdAt: string;
}

// Функция для создания лога через API
export async function logAdminAction(entry: LogEntry): Promise<void> {
  try {
    const response = await fetch('/api/admin/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // В случае ошибки API, можно добавить fallback логику
  }
}

// Функция для получения логов через API
export async function getAdminLogs(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: AdminLogEntry[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const response = await fetch(`/api/admin/logs?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin logs:', error);
    return { logs: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } };
  }
}

// Функция для очистки всех логов через API
export async function clearAdminLogs(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/logs', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to clear admin logs:', error);
    return false;
  }
}

// Вспомогательные функции для часто используемых действий
export const AdminActions = {
  // Действия с пользователями
  USER_CREATED: (userEmail: string) => 
    logAdminAction({ action: `Создан пользователь: ${userEmail}` }),
  
  USER_UPDATED: (userEmail: string) => 
    logAdminAction({ action: `Обновлен пользователь: ${userEmail}` }),
  
  USER_DELETED: (userEmail: string) => 
    logAdminAction({ action: `Удален пользователь: ${userEmail}` }),
  
  USER_BLOCKED: (userEmail: string) => 
    logAdminAction({ action: `Заблокирован пользователь: ${userEmail}` }),
  
  USER_UNBLOCKED: (userEmail: string) => 
    logAdminAction({ action: `Разблокирован пользователь: ${userEmail}` }),

  // Действия с продуктами
  PRODUCT_CREATED: (productSku: string) => 
    logAdminAction({ action: `Создан продукт: ${productSku}` }),
  
  PRODUCT_UPDATED: (productSku: string) => 
    logAdminAction({ action: `Обновлен продукт: ${productSku}` }),
  
  PRODUCT_DELETED: (productSku: string) => 
    logAdminAction({ action: `Удален продукт: ${productSku}` }),
  
  PRODUCT_ACTIVATED: (productSku: string) => 
    logAdminAction({ action: `Активирован продукт: ${productSku}` }),
  
  PRODUCT_DEACTIVATED: (productSku: string) => 
    logAdminAction({ action: `Деактивирован продукт: ${productSku}` }),

  // Действия с категориями
  CATEGORY_CREATED: (categoryName: string) => 
    logAdminAction({ action: `Создана категория: ${categoryName}` }),
  
  CATEGORY_UPDATED: (categoryName: string) => 
    logAdminAction({ action: `Обновлена категория: ${categoryName}` }),
  
  CATEGORY_DELETED: (categoryName: string) => 
    logAdminAction({ action: `Удалена категория: ${categoryName}` }),

  // Действия с материалами
  MATERIAL_CREATED: (materialName: string) => 
    logAdminAction({ action: `Создан материал: ${materialName}` }),
  
  MATERIAL_UPDATED: (materialName: string) => 
    logAdminAction({ action: `Обновлен материал: ${materialName}` }),
  
  MATERIAL_DELETED: (materialName: string) => 
    logAdminAction({ action: `Удален материал: ${materialName}` }),

  // Действия с ароматами
  SCENT_CREATED: (scentName: string) => 
    logAdminAction({ action: `Создан аромат: ${scentName}` }),
  
  SCENT_UPDATED: (scentName: string) => 
    logAdminAction({ action: `Обновлен аромат: ${scentName}` }),
  
  SCENT_DELETED: (scentName: string) => 
    logAdminAction({ action: `Удален аромат: ${scentName}` }),

  // Действия со статьями
  ARTICLE_CREATED: (articleTitle: string) => 
    logAdminAction({ action: `Создана статья: ${articleTitle}` }),
  
  ARTICLE_UPDATED: (articleTitle: string) => 
    logAdminAction({ action: `Обновлена статья: ${articleTitle}` }),
  
  ARTICLE_DELETED: (articleTitle: string) => 
    logAdminAction({ action: `Удалена статья: ${articleTitle}` }),

  // Системные действия
  LOGIN: () => 
    logAdminAction({ action: 'Вход в админ панель' }),
  
  LOGOUT: () => 
    logAdminAction({ action: 'Выход из админ панели' }),
  
  LOGS_CLEARED: () => 
    logAdminAction({ action: 'Очищены логи администратора' }),
};
