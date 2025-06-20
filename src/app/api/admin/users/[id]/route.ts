import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// Схема валидации для обновления пользователя
const updateUserSchema = z.object({
  email: z.string().email('Неверный формат email').optional(),
  name: z.string().min(1, 'Имя обязательно').optional(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  isBlocked: z.boolean().optional(),
});

// Проверка прав доступа
async function checkAdminAccess(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Необходима авторизация' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true, isBlocked: true }
  });

  if (!user || user.isBlocked || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Недостаточно прав доступа' },
      { status: 403 }
    );
  }

  return { currentUser: user };
}

// Проверка, является ли пользователь Super Admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });
  
  // Super Admin имеет фиксированный ID или email
  return user?.id === 'super-admin-001' || user?.email === 'superadmin@askimcandles.com';
}

// GET - получить информацию о пользователе
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Добавляем флаг isSuperAdmin для фронтенда
    const userWithFlags = {
      ...user,
      isSuperAdmin: await isSuperAdmin(user.id)
    };

    return NextResponse.json(userWithFlags);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
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

  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем, является ли это Super Admin
    const isTargetSuperAdmin = await isSuperAdmin(params.id);
    
    if (isTargetSuperAdmin) {
      // Для Super Admin можно изменять только пароль
      const allowedFields = ['password'];
      const attemptedFields = Object.keys(validatedData);
      const forbiddenFields = attemptedFields.filter(field => !allowedFields.includes(field));
      
      if (forbiddenFields.length > 0) {
        return NextResponse.json(
          { error: `Для Super Admin можно изменять только пароль. Запрещенные поля: ${forbiddenFields.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Проверяем уникальность email, если он изменяется
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        );
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.role && !isTargetSuperAdmin) updateData.role = validatedData.role;
    if (typeof validatedData.isBlocked === 'boolean' && !isTargetSuperAdmin) {
      updateData.isBlocked = validatedData.isBlocked;
    }
    
    // Хешируем новый пароль, если он предоставлен
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при обновлении пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
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

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем, является ли это Super Admin
    const isTargetSuperAdmin = await isSuperAdmin(params.id);
    
    if (isTargetSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin не может быть удален' },
        { status: 400 }
      );
    }

    // Проверяем, не пытается ли пользователь удалить самого себя
    const { currentUser } = accessCheck;
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      );
    }

    // Удаляем пользователя
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Пользователь успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}