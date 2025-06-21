import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '@/admin/lib/admin-logger';

const prisma = new PrismaClient();

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

// GET - получить статистику пользователей
export async function GET(req: NextRequest) {
  const accessCheck = await checkAdminAccess(req);
  if ('error' in accessCheck) return accessCheck;
  
  const { user: currentUser } = accessCheck;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Параллельное выполнение запросов для оптимизации
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      pendingUsers,
      adminUsers,
      managerUsers,
      regularUsers,
      verifiedUsers,
      twoFactorUsers,
      recentRegistrations,
      monthlyRegistrations,
      recentLogins,
      roleStats,
      statusStats,
      departmentStats,
      dailyRegistrations,
      monthlyStats
    ] = await Promise.all([
      // Общая статистика
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'BLOCKED' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      
      // Статистика по ролям
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MANAGER' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      
      // Статистика по верификации
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      
      // Регистрации
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      
      // Активность
      prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
      
      // Группировка по ролям
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        orderBy: { _count: { role: 'desc' } }
      }),
      
      // Группировка по статусам
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
        orderBy: { _count: { status: 'desc' } }
      }),
      
      // Группировка по отделам
      prisma.user.groupBy({
        by: ['department'],
        _count: true,
        where: { department: { not: null } },
        orderBy: { _count: { department: 'desc' } },
        take: 10
      }),
      
      // Ежедневная статистика регистраций за последние 7 дней
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "users" 
        WHERE "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,
      
      // Месячная статистика за последний год
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as registrations,
          COUNT(CASE WHEN "lastLoginAt" >= ${thirtyDaysAgo} THEN 1 END) as active_users
        FROM "users" 
        WHERE "createdAt" >= ${oneYearAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 12
      `
    ]);

    // Топ пользователи по активности (последние логины)
    const topActiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: { not: null },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        department: true
      },
      orderBy: { lastLoginAt: 'desc' },
      take: 10
    });

    // Недавно зарегистрированные пользователи
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        status: true,
        department: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Пользователи с проблемами (заблокированные, с неподтвержденным email и т.д.)
    const problemUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isBlocked: true },
          { status: 'BLOCKED' },
          { emailVerified: false },
          { loginAttempts: { gte: 3 } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isBlocked: true,
        emailVerified: true,
        loginAttempts: true,
        lastLoginAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Формирование ответа
    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        blockedUsers,
        pendingUsers,
        verifiedUsers,
        twoFactorUsers,
        recentRegistrations,
        monthlyRegistrations,
        recentLogins
      },
      roles: {
        admin: adminUsers,
        manager: managerUsers,
        user: regularUsers,
        distribution: roleStats.map(stat => ({
          role: stat.role,
          count: stat._count,
          percentage: Math.round((stat._count / totalUsers) * 100)
        }))
      },
      status: {
        distribution: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count,
          percentage: Math.round((stat._count / totalUsers) * 100)
        }))
      },
      departments: {
        distribution: departmentStats.map(stat => ({
          department: stat.department || 'Не указан',
          count: stat._count
        }))
      },
      activity: {
        topActiveUsers,
        recentUsers,
        problemUsers
      },
      trends: {
        dailyRegistrations: (dailyRegistrations as any[]).map(day => ({
          date: day.date,
          count: Number(day.count)
        })),
        monthlyStats: (monthlyStats as any[]).map(month => ({
          month: month.month,
          registrations: Number(month.registrations),
          activeUsers: Number(month.active_users)
        }))
      },
      security: {
        unverifiedEmails: totalUsers - verifiedUsers,
        noTwoFactor: totalUsers - twoFactorUsers,
        blockedAccounts: blockedUsers,
        securityScore: Math.round(
          ((verifiedUsers + twoFactorUsers + activeUsers - blockedUsers) / (totalUsers * 3)) * 100
        )
      }
    };

    // Логирование действия
    await logAdminAction({
      action: 'USER_MANAGEMENT: Просмотр статистики пользователей',
      details: 'Получение статистики пользователей',
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Unknown'
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Ошибка при получении статистики пользователей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}