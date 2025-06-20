
import type { Locale } from './i1n-config';

export type { Locale };

export interface Product {
  id: string;
  sku?: string;
  name: { [key in Locale | 'en']: string };
  description: { [key in Locale | 'en']: string };
  price: number;
  costPrice?: number;
  category: string;
  images: (string | { url: string; isMain?: boolean; order?: number })[];
  mainImage?: string;
  scent?: string;
  material?: string;
  dimensions?: string;
  burningTime?: string;
  stock: number;
  attributes?: { key: string; value: string }[];
  isActive: boolean;
  isDraft?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface SimulatedUser {
  id: string;
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  password?: string;
  isRegistered?: boolean;
  isConfirmed?: boolean;
  phone?: string;
  image?: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Language = 'UZ' | 'RU' | 'EN';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  password?: string;
  isBlocked?: boolean;
  isPredefined?: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  googleId?: string;
  image?: string;
  newsletter: boolean;
  language: Language;
  isActive: boolean;
  emailVerified?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  role: UserRole;
  lastLoginAt?: Date;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAddress {
  id: string;
  userId: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface Address {
  id: string;
  title: string;
  street: string;
  house: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode?: string;
  landmark?: string;
  comment?: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  items: CartItem[];
}

export interface MockAdminClient {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  registrationDate: string;
  totalOrders: number;
  totalSpent: number;
  isBlocked: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: { [key in Locale | 'en']: string };
  content: { [key in Locale | 'en']: string };
  sharedMainImage?: string;
  mainImage_en?: string;
  mainImage_ru?: string;
  mainImage_uz?: string;
  useSharedImage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// === ТИПЫ ДЛЯ СИСТЕМЫ ПОДДЕРЖКИ ===

export type TicketType = 'BUG' | 'FEATURE' | 'SUPPORT' | 'COMPLAINT' | 'QUESTION';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type ProductArea = 
  | 'FRONTEND' | 'BACKEND' | 'ADMIN_PANEL' | 'DATABASE' | 'API' | 'MOBILE'
  | 'PAYMENT' | 'INVENTORY' | 'USERS' | 'ORDERS' | 'ANALYTICS'
  | 'SECURITY' | 'PERFORMANCE' | 'UI_UX' | 'OTHER';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  productArea: ProductArea;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Создатель и исполнитель
  createdById: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  assignedToId?: string;
  assignedTo?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  
  // Связанные данные
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  history?: TicketHistory[];
  
  // Вычисляемые поля
  messagesCount?: number;
  attachmentsCount?: number;
  lastActivity?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  author: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  attachments?: TicketMessageAttachment[];
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  uploadedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface TicketMessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  performedById: string;
  performedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
}

// Формы для создания/редактирования
export interface CreateTicketData {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  productArea: ProductArea;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  status?: TicketStatus;
  productArea?: ProductArea;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  assignedToId?: string;
}

export interface CreateMessageData {
  content: string;
  isInternal?: boolean;
}

// Фильтры и поиск
export interface TicketFilters {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  type?: TicketType[];
  productArea?: ProductArea[];
  assignedToId?: string;
  createdById?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface TicketSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title' | 'ticketNumber';
  direction: 'asc' | 'desc';
}

// Статистика
export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  averageResolutionTime: number; // в часах
  ticketsByType: Record<TicketType, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByArea: Record<ProductArea, number>;
  recentActivity: TicketHistory[];
}

// Константы
export const TICKET_TYPES: { value: TicketType; label: string; color: string }[] = [
  { value: 'BUG', label: 'Ошибка', color: 'destructive' },
  { value: 'FEATURE', label: 'Предложение', color: 'default' },
  { value: 'SUPPORT', label: 'Поддержка', color: 'secondary' },
  { value: 'COMPLAINT', label: 'Жалоба', color: 'destructive' },
  { value: 'QUESTION', label: 'Вопрос', color: 'outline' }
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Низкий', color: 'secondary' },
  { value: 'MEDIUM', label: 'Средний', color: 'default' },
  { value: 'HIGH', label: 'Высокий', color: 'destructive' },
  { value: 'CRITICAL', label: 'Критический', color: 'destructive' }
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Открыт', color: 'default' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'secondary' },
  { value: 'PENDING', label: 'Ожидает ответа', color: 'outline' },
  { value: 'RESOLVED', label: 'Решен', color: 'default' },
  { value: 'CLOSED', label: 'Закрыт', color: 'secondary' },
  { value: 'REOPENED', label: 'Переоткрыт', color: 'destructive' }
];

export const PRODUCT_AREAS: { value: ProductArea; label: string }[] = [
  { value: 'FRONTEND', label: 'Фронтенд' },
  { value: 'BACKEND', label: 'Бэкенд' },
  { value: 'ADMIN_PANEL', label: 'Админ-панель' },
  { value: 'DATABASE', label: 'База данных' },
  { value: 'API', label: 'API' },
  { value: 'MOBILE', label: 'Мобильное приложение' },
  { value: 'PAYMENT', label: 'Платежная система' },
  { value: 'INVENTORY', label: 'Управление товарами' },
  { value: 'USERS', label: 'Управление пользователями' },
  { value: 'ORDERS', label: 'Управление заказами' },
  { value: 'ANALYTICS', label: 'Аналитика' },
  { value: 'SECURITY', label: 'Безопасность' },
  { value: 'PERFORMANCE', label: 'Производительность' },
  { value: 'UI_UX', label: 'UI/UX дизайн' },
  { value: 'OTHER', label: 'Другое' }
];

// Утилиты
export const getPriorityColor = (priority: TicketPriority): string => {
  const colors = {
    LOW: '#6B7280',
    MEDIUM: '#EAB308', 
    HIGH: '#F97316',
    CRITICAL: '#EF4444'
  };
  return colors[priority];
};

export const getStatusColor = (status: TicketStatus): string => {
  const colors = {
    OPEN: '#3B82F6',
    IN_PROGRESS: '#8B5CF6',
    PENDING: '#F59E0B',
    RESOLVED: '#10B981',
    CLOSED: '#6B7280',
    REOPENED: '#EF4444'
  };
  return colors[status];
};

export const getTypeIcon = (type: TicketType): string => {
  const icons = {
    BUG: '🐛',
    FEATURE: '💡',
    SUPPORT: '🛠️',
    COMPLAINT: '😠',
    QUESTION: '❓'
  };
  return icons[type];
};
