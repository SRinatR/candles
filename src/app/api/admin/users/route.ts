import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// Схема валидации для создания пользователя
const createUserSchema = z.object({
  email: z.string().email('Неверный формат email'),
  name: z.string().min(1, 'Имя обязательно'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
});

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

  // Проверяем роль пользователя
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true, isBlocked: true }
  });

  if (!user || user.isBlocked || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Недостаточно прав доступа' },
      { status: 403 }
    );
  }

  return null;
}

// GET - получить список пользователей
export async function GET(req: NextRequest) {
  const accessError = await checkAdminAccess(req);
  if (accessError) return accessError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST - создать нового пользователя
export async function POST(req: NextRequest) {
  const accessError = await checkAdminAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Проверяем, что email уникален
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        isBlocked: false
      },
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при создании пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}