import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для настроек
const preferencesSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'ru', 'uz']).optional(),
  settings: z.any().optional()
});

// GET /api/admin/preferences - Получить настройки пользователя
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      );
    }
    
    // Получение настроек пользователя
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    if (!preferences) {
      // Создаем настройки по умолчанию если их нет
      const defaultPreferences = await prisma.userPreference.create({
        data: {
          userId,
          theme: 'light',
          language: 'en',
          settings: {}
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });
      
      return NextResponse.json(defaultPreferences);
    }
    
    return NextResponse.json(preferences);
    
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/admin/preferences - Создать или обновить настройки
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);
    
    // Проверка существования пользователя
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Создание или обновление настроек
    const preferences = await prisma.userPreference.upsert({
      where: { userId: validatedData.userId },
      update: {
        theme: validatedData.theme,
        language: validatedData.language,
        settings: validatedData.settings
      },
      create: {
        userId: validatedData.userId,
        theme: validatedData.theme || 'light',
        language: validatedData.language || 'en',
        settings: validatedData.settings || {}
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    return NextResponse.json(preferences);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении настроек:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/preferences - Удалить настройки пользователя
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      );
    }
    
    // Удаление настроек
    await prisma.userPreference.delete({
      where: { userId }
    });
    
    return NextResponse.json(
      { message: 'Настройки успешно удалены' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении настроек:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
