import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TODO: Раскомментировать и доработать схему валидации, когда будет реализована фильтрация
// import { z } from 'zod';
// const salesReportQuerySchema = z.object({
//   startDate: z.string().datetime().optional(), // Убедиться, что формат даты обрабатывается корректно
//   endDate: z.string().datetime().optional(),
//   groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
// });

export async function GET(request: Request) {
  try {
    // TODO: Добавить обработку параметров запроса (startDate, endDate, groupBy)
    // const { searchParams } = new URL(request.url);
    // const queryParams = Object.fromEntries(searchParams.entries());
    // const validatedQuery = salesReportQuerySchema.safeParse(queryParams);

    // if (!validatedQuery.success) {
    //   return NextResponse.json({ error: 'Invalid query parameters', details: validatedQuery.error.format() }, { status: 400 });
    // }

    // const { startDate, endDate, groupBy } = validatedQuery.data;

    // Пример: получение всех заказов со статусом DELIVERED или SHIPPED
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['DELIVERED', 'SHIPPED'], // Учитываем только доставленные или отправленные заказы
        },
        // TODO: Добавить фильтрацию по дате, если startDate и endDate предоставлены
      },
      include: {
        items: true, // Включаем связанные элементы заказа
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Простая агрегация данных для отчета
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const numberOfOrders = orders.length;
    const averageOrderValue = numberOfOrders > 0 ? totalSales / numberOfOrders : 0;

    // TODO: Реализовать более сложную группировку и агрегацию данных
    // Например, продажи по дням/неделям/месяцам

    const reportData = {
      totalSales,
      numberOfOrders,
      averageOrderValue,
      orders, // Пока возвращаем все заказы для примера
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json({ error: 'Failed to fetch sales report' }, { status: 500 });
  }
}
