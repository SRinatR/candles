import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // дни
    const type = searchParams.get('type'); // income, expense, all
    const category = searchParams.get('category');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Получение транзакций с фильтрами
    const whereClause: any = {
      date: {
        gte: startDate
      }
    };
    
    if (type === 'income') {
      whereClause.amount = { gt: 0 };
    } else if (type === 'expense') {
      whereClause.amount = { lt: 0 };
    }
    
    if (category) {
      whereClause.categoryId = category;
    }
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        order: {
          select: {
            orderNumber: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Получение сводной статистики
    const totalIncome = await prisma.transaction.aggregate({
      where: {
        ...whereClause,
        amount: { gt: 0 }
      },
      _sum: {
        amount: true
      }
    });
    
    const totalExpenses = await prisma.transaction.aggregate({
      where: {
        ...whereClause,
        amount: { lt: 0 }
      },
      _sum: {
        amount: true
      }
    });
    
    // Получение категорий для фильтров
    const categories = await prisma.financeCategory.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Типы транзакций определены как enum
    const transactionTypes = [
      { id: 'INCOME', name: 'Доход' },
      { id: 'EXPENSE', name: 'Расход' }
    ];
    
    // Статистика по категориям
    const categoryStats = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    // Добавление названий категорий к статистике
    const categoryStatsWithNames = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await prisma.financeCategory.findUnique({
          where: { id: stat.categoryId }
        });
        return {
          ...stat,
          categoryName: category?.name || 'Неизвестно'
        };
      })
    );
    
    const summary = {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpenses: Math.abs(totalExpenses._sum.amount || 0),
      netProfit: (totalIncome._sum.amount || 0) + (totalExpenses._sum.amount || 0),
      transactionCount: transactions.length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary,
        categories,
        transactionTypes,
        categoryStats: categoryStatsWithNames
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении финансовых данных:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, type, categoryId, date } = body;
    
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        type: type as 'INCOME' | 'EXPENSE',
        categoryId,
        date: new Date(date),
        status: 'COMPLETED',
        createdBy: 'admin-id' // В реальном приложении получать из сессии
      },
      include: {
        category: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: transaction
    });
    
  } catch (error) {
    console.error('Ошибка при создании транзакции:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании транзакции' },
      { status: 500 }
    );
  }
}
