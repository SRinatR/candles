import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET - получить настройки пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        adminProfile: true,
        managerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Определяем профиль в зависимости от роли
    let preferences = {
      theme: 'light',
      language: 'en',
    };

    if (user.role === 'ADMIN' && user.adminProfile) {
      preferences = {
        theme: user.adminProfile.theme || 'light',
        language: user.adminProfile.language || 'en',
      };
    } else if (user.role === 'MANAGER' && user.managerProfile) {
      preferences = {
        theme: user.managerProfile.theme || 'light',
        language: user.managerProfile.language || 'en',
      };
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - обновить настройки пользователя
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { theme, language } = await request.json();

    // Валидация
    if (theme && !['light', 'dark'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    if (language && !['en', 'ru'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        adminProfile: true,
        managerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Обновляем настройки в зависимости от роли
    if (user.role === 'ADMIN') {
      if (user.adminProfile) {
        await prisma.adminProfile.update({
          where: { userId: user.id },
          data: {
            ...(theme && { theme }),
            ...(language && { language }),
          },
        });
      } else {
        // Создаем профиль если его нет
        await prisma.adminProfile.create({
          data: {
            userId: user.id,
            theme: theme || 'light',
            language: language || 'en',
          },
        });
      }
    } else if (user.role === 'MANAGER') {
      if (user.managerProfile) {
        await prisma.managerProfile.update({
          where: { userId: user.id },
          data: {
            ...(theme && { theme }),
            ...(language && { language }),
          },
        });
      } else {
        // Создаем профиль если его нет
        await prisma.managerProfile.create({
          data: {
            userId: user.id,
            theme: theme || 'light',
            language: language || 'en',
          },
        });
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}