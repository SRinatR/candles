import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logAdminAction } from '@/admin/lib/admin-logger';

const prisma = new PrismaClient();

// Схема валидации для экспорта
const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  fields: z.array(z.string()).optional(),
  filters: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
    status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING']).optional(),
    department: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    includeBlocked: z.boolean().default(true),
    emailVerified: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional()
  }).optional()
});

// Проверка прав доступа
async function checkAdminAccess(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Необходима авторизация', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        status: true,
        loginAttempts: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (user.status === 'BLOCKED' || user.loginAttempts >= 5) {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован', code: 'ACCOUNT_BLOCKED' },
        { status: 403 }
      );
    }

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    return { user };
  } catch (error) {
    console.error('Ошибка проверки доступа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Получение IP адреса
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Функция для конвертации в CSV
function convertToCSV(data: any[], fields?: string[]): string {
  if (data.length === 0) return '';
  
  const headers = fields || Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Функция для форматирования данных пользователей
function formatUserData(users: any[]) {
  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name || '',
    role: user.role,
    status: user.status,
    isBlocked: user.isBlocked ? 'Да' : 'Нет',
    emailVerified: user.emailVerified ? 'Да' : 'Нет',
    twoFactorEnabled: user.twoFactorEnabled ? 'Да' : 'Нет',
    department: user.department || '',
    position: user.position || '',
    phone: user.phone || '',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString('ru-RU') : '',
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toLocaleString('ru-RU') : '',
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : 'Никогда',
    lastPasswordChange: user.lastPasswordChange ? new Date(user.lastPasswordChange).toLocaleString('ru-RU') : '',
    loginAttempts: user.loginAttempts || 0,
    notes: user.notes || ''
  }));
}

// POST - экспорт пользователей
export async function POST(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;

  try {
    const body = await req.json();
    const { format, fields, filters } = exportSchema.parse(body);

    // Построение условий фильтрации
    const where: any = {};

    if (filters) {
      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.department) {
        where.department = filters.department;
      }

      if (!filters.includeBlocked) {
        where.status = { in: ['ACTIVE', 'PENDING'] };
      }

      if (filters.emailVerified !== undefined) {
        where.emailVerified = filters.emailVerified;
      }

      if (filters.twoFactorEnabled !== undefined) {
        where.twoFactorEnabled = filters.twoFactorEnabled;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }
    }

    // Получение пользователей
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        department: true,
        position: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        loginAttempts: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для экспорта', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // Форматирование данных
    const formattedUsers = formatUserData(users);
    
    let content: string;
    let contentType: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      content = convertToCSV(formattedUsers, fields);
      contentType = 'text/csv; charset=utf-8';
      filename = `users_export_${timestamp}.csv`;
    } else {
      // JSON format
      const exportData = {
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        filters: filters || {},
        users: fields ? formattedUsers.map(user => {
          const filteredUser: any = {};
          fields.forEach(field => {
            if (user.hasOwnProperty(field)) {
              filteredUser[field] = user[field];
            }
          });
          return filteredUser;
        }) : formattedUsers
      };
      
      content = JSON.stringify(exportData, null, 2);
      contentType = 'application/json; charset=utf-8';
      filename = `users_export_${timestamp}.json`;
    }

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Экспорт пользователей',
      details: `Экспорт ${users.length} пользователей в формате ${format.toUpperCase()}. Фильтры: ${JSON.stringify(filters || {})}`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    // Возврат файла
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Ошибка при экспорте пользователей:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации параметров экспорта', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET - получить доступные поля для экспорта
export async function GET(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;

  const availableFields = [
    { key: 'id', label: 'ID', description: 'Уникальный идентификатор пользователя' },
    { key: 'email', label: 'Email', description: 'Электронная почта пользователя' },
    { key: 'name', label: 'Имя', description: 'Полное имя пользователя' },
    { key: 'role', label: 'Роль', description: 'Роль пользователя в системе' },
    { key: 'status', label: 'Статус', description: 'Текущий статус аккаунта' },
    { key: 'isBlocked', label: 'Заблокирован', description: 'Статус блокировки аккаунта' },
    { key: 'emailVerified', label: 'Email подтвержден', description: 'Статус подтверждения email' },
    { key: 'twoFactorEnabled', label: '2FA включен', description: 'Статус двухфакторной аутентификации' },
    { key: 'department', label: 'Отдел', description: 'Отдел сотрудника' },
    { key: 'position', label: 'Должность', description: 'Должность сотрудника' },
    { key: 'phone', label: 'Телефон', description: 'Номер телефона' },
    { key: 'createdAt', label: 'Дата создания', description: 'Дата регистрации аккаунта' },
    { key: 'updatedAt', label: 'Дата обновления', description: 'Дата последнего обновления профиля' },
    { key: 'lastLoginAt', label: 'Последний вход', description: 'Дата и время последнего входа' },
    { key: 'lastPasswordChange', label: 'Смена пароля', description: 'Дата последней смены пароля' },
    { key: 'loginAttempts', label: 'Попытки входа', description: 'Количество неудачных попыток входа' },
    { key: 'notes', label: 'Заметки', description: 'Административные заметки' }
  ];

  const exportFormats = [
    { key: 'csv', label: 'CSV', description: 'Comma-separated values файл' },
    { key: 'json', label: 'JSON', description: 'JavaScript Object Notation файл' }
  ];

  const filterOptions = {
    roles: [
      { key: 'ADMIN', label: 'Администратор' },
      { key: 'MANAGER', label: 'Менеджер' },
      { key: 'USER', label: 'Пользователь' }
    ],
    statuses: [
      { key: 'ACTIVE', label: 'Активный' },
      { key: 'BLOCKED', label: 'Заблокирован' },
      { key: 'PENDING', label: 'Ожидает подтверждения' }
    ]
  };

  return NextResponse.json({
    availableFields,
    exportFormats,
    filterOptions,
    defaultFields: ['email', 'name', 'role', 'status', 'createdAt', 'lastLoginAt']
  });
}