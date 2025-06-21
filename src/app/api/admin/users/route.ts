import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logAdminAction } from '@/admin/lib/admin-logger';

const prisma = new PrismaClient();

// Схемы валидации
const createUserSchema = z.object({
  email: z.string().email('Неверный формат email'),
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').max(100, 'Пароль слишком длинный'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  sendWelcomeEmail: z.boolean().optional().default(false)
});

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING']).optional(),
  department: z.string().optional(),
  emailVerified: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeBlocked: z.coerce.boolean().default(true)
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
          emailVerified: true,
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

// Проверка, является ли пользователь Super Admin
function isSuperAdmin(user: any): boolean {
  return user.email === 'superadmin@askimcandles.com' || user.id === 'super-admin-001';
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

// GET - получить список пользователей
export async function GET(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;

  try {
    const { searchParams } = new URL(req.url);
    const filters = getUsersSchema.parse(Object.fromEntries(searchParams));
    
    const {
      page,
      limit,
      search,
      role,
      status,
      department,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      includeBlocked
    } = filters;

    const skip = (page - 1) * limit;

    // Построение условий фильтрации
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (!includeBlocked) {
      where.status = { in: ['ACTIVE', 'PENDING'] };
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.twoFactorEnabled !== undefined) {
      where.twoFactorEnabled = filters.twoFactorEnabled;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Выполнение запросов
    const [users, total, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          emailVerified: true,
          twoFactorEnabled: true,
          department: true,
          position: true,
          phone: true,
          avatar: true,
          loginAttempts: true
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.user.count({ where }),
      // Статистика
      prisma.user.groupBy({
        by: ['role', 'status'],
        _count: true
      })
    ]);

    // Добавление флага isSuperAdmin
    const usersWithFlags = users.map(user => ({
      ...user,
      isSuperAdmin: isSuperAdmin(user)
    }));

    // Подсчет статистики
    const statsData = {
      totalUsers: total,
      activeUsers: stats.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s._count, 0),
      blockedUsers: stats.filter(s => s.status === 'BLOCKED').reduce((sum, s) => sum + s._count, 0),
      adminCount: stats.filter(s => s.role === 'ADMIN').reduce((sum, s) => sum + s._count, 0),
      managerCount: stats.filter(s => s.role === 'MANAGER').reduce((sum, s) => sum + s._count, 0),
      userCount: stats.filter(s => s.role === 'USER').reduce((sum, s) => sum + s._count, 0),
      recentRegistrations: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
          }
        }
      })
    };

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Просмотр списка пользователей',
      details: `Фильтры: ${JSON.stringify(filters)}`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    return NextResponse.json({
      users: usersWithFlags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statsData
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации параметров', 
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

// POST - создать нового пользователя
export async function POST(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;

  // Проверка прав на создание пользователей
  if (currentUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Только администраторы могут создавать пользователей', code: 'INSUFFICIENT_PERMISSIONS' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Проверка уникальности email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Создание пользователя
    const newUser = await prisma.user.create({
      data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          role: validatedData.role,
          status: 'ACTIVE',
          emailVerified: false,
          twoFactorEnabled: false,
          department: validatedData.department,
          position: validatedData.position,
          phone: validatedData.phone,
          loginAttempts: 0
        },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        department: true,
        position: true,
        phone: true
      }
    });

    // Добавление флага isSuperAdmin
    const userWithFlags = {
      ...newUser,
      isSuperAdmin: isSuperAdmin(newUser)
    };

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Создание пользователя',
      details: `Создан пользователь: ${newUser.name} (${newUser.email}) с ролью ${newUser.role}`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    // TODO: Отправка приветственного email если sendWelcomeEmail = true
    if (validatedData.sendWelcomeEmail) {
      // Здесь будет логика отправки email
      console.log(`Отправка приветственного письма для ${newUser.email}`);
    }

    return NextResponse.json(userWithFlags, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации данных', 
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

// DELETE - массовое удаление пользователей
export async function DELETE(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;

  // Только администраторы могут удалять пользователей
  if (currentUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Только администраторы могут удалять пользователей', code: 'INSUFFICIENT_PERMISSIONS' },
      { status: 403 }
    );
  }

  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать ID пользователей для удаления', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Проверка, что не удаляем Super Admin или самого себя
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, role: true }
    });

    const protectedUsers = usersToDelete.filter(user => 
      isSuperAdmin(user) || user.id === currentUser.id
    );

    if (protectedUsers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Нельзя удалить Super Admin или самого себя', 
          code: 'PROTECTED_USERS',
          protectedUsers: protectedUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
        },
        { status: 400 }
      );
    }

    // Удаление пользователей
    const deletedUsers = await prisma.user.deleteMany({
      where: { 
        id: { in: userIds },
        NOT: {
          OR: [
            { email: 'superadmin@askimcandles.com' },
            { id: currentUser.id }
          ]
        }
      }
    });

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Массовое удаление пользователей',
      details: `Удалено пользователей: ${deletedUsers.count}. IDs: ${userIds.join(', ')}`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    return NextResponse.json({
      success: true,
      deleted: deletedUsers.count,
      message: `Удалено пользователей: ${deletedUsers.count}`
    });
  } catch (error) {
    console.error('Ошибка при массовом удалении пользователей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}