import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// GET user analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!adminUser || !['ADMIN', 'MANAGER'].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get current date for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users (verified email)
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        emailVerified: { not: null }
      }
    });

    // Blocked users
    const blockedUsers = await prisma.user.count({
      where: { isBlocked: true }
    });

    // New registrations this month
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // New registrations this week
    const newUsersThisWeek = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Users by language
    const usersByLanguage = await prisma.user.groupBy({
      by: ['language'],
      _count: { language: true }
    });

    // Registration trend (last 30 days)
    const registrationTrend = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "users"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    // Users with orders (conversion rate)
    const usersWithOrders = await prisma.user.count({
      where: {
        orders: {
          some: {}
        }
      }
    });

    const conversionRate = totalUsers > 0 ? (usersWithOrders / totalUsers) * 100 : 0;

    // Newsletter subscribers
    const newsletterSubscribers = await prisma.user.count({
      where: { newsletter: true }
    });

    // OAuth vs email/password users
    const oauthUsers = await prisma.user.count({
      where: { googleId: { not: null } }
    });
    const emailPasswordUsers = await prisma.user.count({
      where: { 
        password: { not: null },
        googleId: null
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        blockedUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        conversionRate: Math.round(conversionRate * 100) / 100,
        newsletterSubscribers
      },
      demographics: {
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role
        })),
        usersByLanguage: usersByLanguage.map(item => ({
          language: item.language,
          count: item._count.language
        })),
        authMethods: {
          oauth: oauthUsers,
          emailPassword: emailPasswordUsers
        }
      },
      trends: {
        registrationTrend
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
