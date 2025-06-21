import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logAdminAction } from '@/admin/lib/admin-logger';

const prisma = new PrismaClient();

// Схемы валидации
const updateUserSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное').optional(),
  email: z.string().email('Неверный формат email').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING']).optional(),

  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').max(100, 'Пароль слишком длинный').optional(),
  resetPassword: z.boolean().optional(),
  sendNotification: z.boolean().optional().default(false)
});

const passwordResetSchema = z.object({
  newPassword: z.string().min(6, 'Пароль должен содержать минимум 6 символов').max(100, 'Пароль слишком длинный'),
  sendNotification: z.boolean().optional().default(true)
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

// GET - получить информацию о пользователе
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;
  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
        loginAttempts: true,
        // Дополнительная информация для статистики
        _count: {
          select: {
            // Если есть связанные таблицы, можно добавить подсчеты
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Добавление флага isSuperAdmin
    const userWithFlags = {
      ...user,
      isSuperAdmin: isSuperAdmin(user)
    };

    // Получение активности пользователя (последние действия)
    const recentActivity = await prisma.adminLog.findMany({
      where: { userId: id },
      select: {
        id: true,
        action: true,
        details: true,
        timestamp: true,
        ipAddress: true
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Просмотр профиля пользователя',
      details: `Просмотр профиля пользователя: ${user.name} (${user.email})`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    return NextResponse.json({
      user: userWithFlags,
      recentActivity
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PUT - обновить пользователя
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;
  const { id } = params;

  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Проверка прав на изменение
    if (isSuperAdmin(existingUser) && currentUser.id !== existingUser.id) {
      return NextResponse.json(
        { error: 'Нельзя изменять Super Admin', code: 'PROTECTED_USER' },
        { status: 403 }
      );
    }

    // Проверка уникальности email при изменении
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }
    }

    // Подготовка данных для обновления
    const updateData: any = { ...validatedData };
    
    // Хеширование пароля если он изменяется
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
      updateData.lastPasswordChange = new Date();
      delete updateData.resetPassword;
    }

    // Удаление служебных полей
    delete updateData.sendNotification;

    // Обновление пользователя
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        avatar: true
      }
    });

    // Добавление флага isSuperAdmin
    const userWithFlags = {
      ...updatedUser,
      isSuperAdmin: isSuperAdmin(updatedUser)
    };

    // Формирование описания изменений
    const changes = Object.keys(validatedData).filter(key => 
      key !== 'sendNotification' && validatedData[key] !== undefined
    );
    
    const changeDescription = changes.length > 0 
      ? `Изменены поля: ${changes.join(', ')}` 
      : 'Обновление профиля';

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Обновление пользователя',
      details: `Обновлен пользователь: ${updatedUser.name} (${updatedUser.email}). ${changeDescription}`,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    // TODO: Отправка уведомления пользователю если sendNotification = true
    if (validatedData.sendNotification) {
      console.log(`Отправка уведомления об изменениях для ${updatedUser.email}`);
    }

    return NextResponse.json(userWithFlags);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    
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

// DELETE - удалить пользователя
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;
  const { id } = params;

  // Только администраторы могут удалять пользователей
  if (currentUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Только администраторы могут удалять пользователей', code: 'INSUFFICIENT_PERMISSIONS' },
      { status: 403 }
    );
  }

  try {
    // Проверка существования пользователя
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Пользователь не найден', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Проверка защищенных пользователей
    if (isSuperAdmin(userToDelete) || userToDelete.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить Super Admin или самого себя', code: 'PROTECTED_USER' },
        { status: 403 }
      );
    }

    // Удаление пользователя
    await prisma.user.delete({
      where: { id }
    });

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Удаление пользователя',
      details: `Удален пользователь: ${userToDelete.name} (${userToDelete.email})`,
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
      message: `Пользователь ${userToDelete.name} успешно удален`
    });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH - специальные действия (сброс пароля, блокировка и т.д.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;
  const { id } = params;

  try {
    const { action, ...data } = await req.json();

    // Проверка существования пользователя
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, isBlocked: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Проверка защищенных пользователей для некоторых действий
    if (isSuperAdmin(targetUser) && currentUser.id !== targetUser.id && 
        ['block', 'unblock', 'reset_password'].includes(action)) {
      return NextResponse.json(
        { error: 'Нельзя выполнить это действие для Super Admin', code: 'PROTECTED_USER' },
        { status: 403 }
      );
    }

    let result;
    let actionDescription = '';

    switch (action) {
      case 'block':
        result = await prisma.user.update({
          where: { id },
          data: { isBlocked: true, status: 'BLOCKED' },
          select: { id: true, email: true, name: true, isBlocked: true, status: true }
        });
        actionDescription = 'Блокировка пользователя';
        break;

      case 'unblock':
        result = await prisma.user.update({
          where: { id },
          data: { isBlocked: false, status: 'ACTIVE', loginAttempts: 0 },
          select: { id: true, email: true, name: true, isBlocked: true, status: true }
        });
        actionDescription = 'Разблокировка пользователя';
        break;

      case 'reset_password':
        const { newPassword, sendNotification } = passwordResetSchema.parse(data);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        result = await prisma.user.update({
          where: { id },
          data: { 
            password: hashedPassword, 
            lastPasswordChange: new Date(),
            loginAttempts: 0
          },
          select: { id: true, email: true, name: true, lastPasswordChange: true }
        });
        
        actionDescription = 'Сброс пароля пользователя';
        
        // TODO: Отправка уведомления о смене пароля
        if (sendNotification) {
          console.log(`Отправка уведомления о смене пароля для ${targetUser.email}`);
        }
        break;

      case 'verify_email':
        result = await prisma.user.update({
          where: { id },
          data: { emailVerified: true },
          select: { id: true, email: true, name: true, emailVerified: true }
        });
        actionDescription = 'Подтверждение email пользователя';
        break;

      case 'enable_2fa':
        result = await prisma.user.update({
          where: { id },
          data: { twoFactorEnabled: true },
          select: { id: true, email: true, name: true, twoFactorEnabled: true }
        });
        actionDescription = 'Включение двухфакторной аутентификации';
        break;

      case 'disable_2fa':
        result = await prisma.user.update({
          where: { id },
          data: { twoFactorEnabled: false },
          select: { id: true, email: true, name: true, twoFactorEnabled: true }
        });
        actionDescription = 'Отключение двухфакторной аутентификации';
        break;

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие', code: 'UNKNOWN_ACTION' },
          { status: 400 }
        );
    }

    // Добавление флага isSuperAdmin
    const resultWithFlags = {
      ...result,
      isSuperAdmin: isSuperAdmin(result)
    };

    // Логирование действия
    await logAdminAction({
       action: `USER_MANAGEMENT: ${actionDescription}`,
       details: `${actionDescription} для пользователя: ${targetUser.name} (${targetUser.email})`,
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
      action,
      user: resultWithFlags,
      message: `${actionDescription} выполнена успешно`
    });
  } catch (error) {
    console.error('Ошибка при выполнении действия:', error);
    
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