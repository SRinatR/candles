// Утилита для работы с API вместо localStorage

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Произошла ошибка' };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Ошибка сети' };
    }
  }

  // Методы для пользователей
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);

    return this.request<PaginatedResponse<any>>(
      `/admin/users?${searchParams.toString()}`
    );
  }

  async createUser(userData: any) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Методы для сессий
  async getSessions(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    active?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.active !== undefined) searchParams.set('active', params.active.toString());

    return this.request<PaginatedResponse<any>>(
      `/admin/sessions?${searchParams.toString()}`
    );
  }

  async deleteSessions(params?: { userId?: string; expiredOnly?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.expiredOnly) searchParams.set('expiredOnly', 'true');

    return this.request(`/admin/sessions?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  }

  // Методы для логов
  async getLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.resource) searchParams.set('resource', params.resource);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    return this.request<PaginatedResponse<any>>(
      `/admin/logs?${searchParams.toString()}`
    );
  }

  async createLog(logData: any) {
    return this.request('/admin/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async deleteLogs(params?: { userId?: string; olderThan?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.olderThan) searchParams.set('olderThan', params.olderThan);

    return this.request(`/admin/logs?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  }

  // Методы для настроек
  async getPreferences() {
    return this.request('/admin/preferences');
  }

  async updatePreferences(preferences: any) {
    return this.request('/admin/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  // Методы для корзины
  async getCart(params?: { userId?: string; sessionId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);

    return this.request(`/cart?${searchParams.toString()}`);
  }

  async addToCart(data: { productId: string; quantity: number; userId?: string; sessionId?: string }) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request(`/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string) {
    return this.request(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(params?: { userId?: string; sessionId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);

    return this.request(`/cart?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  }

  // Методы для статей
  async getArticles(params?: {
    page?: number;
    limit?: number;
    status?: string;
    language?: string;
    search?: string;
    authorId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.language) searchParams.set('language', params.language);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.authorId) searchParams.set('authorId', params.authorId);

    return this.request<PaginatedResponse<any>>(
      `/articles?${searchParams.toString()}`
    );
  }

  async getArticle(id: string, language?: string) {
    const searchParams = new URLSearchParams();
    if (language) searchParams.set('language', language);

    return this.request(`/articles/${id}?${searchParams.toString()}`);
  }

  async createArticle(articleData: any) {
    return this.request('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  }

  async updateArticle(id: string, articleData: any) {
    return this.request(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(articleData),
    });
  }

  async deleteArticle(id: string) {
    return this.request(`/articles/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
