import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания/обновления аромата
const scentSchema = z.object({
  name: z.string().min(1, 'Название аромата обязательно'),
  isActive: z.boolean().default(true)
});

// GET /api/scents - Получить все ароматы
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const includeProducts = searchParams.get('includeProducts') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Построение фильтров
    const where: any = {};
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Получение ароматов с пагинацией
    const [scents, total] = await Promise.all([
      prisma.scent.findMany({
        where,
        skip,
        take: limit,
        include: {
          products: includeProducts ? {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              price: true,
              stock: true,
              isActive: true
            }
          } : false,
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.scent.count({ where })
    ]);
    
    // Форматирование ответа
    const formattedScents = scents.map(scent => ({
      id: scent.id,
      name: scent.name,
      isActive: scent.isActive,
      productsCount: scent._count.products,
      products: includeProducts ? scent.products : undefined,
      createdAt: scent.createdAt,
      updatedAt: scent.updatedAt
    }));
    
    return NextResponse.json({
      scents: formattedScents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении ароматов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/scents - Создать новый аромат
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scentSchema.parse(body);
    
    // Проверка уникальности названия
    const existingScent = await prisma.scent.findUnique({
      where: { name: validatedData.name }
    });
    
    if (existingScent) {
      return NextResponse.json(
        { error: 'Аромат с таким названием уже существует' },
        { status: 400 }
      );
    }
    
    // Создание аромата
    const scent = await prisma.scent.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      ...scent,
      productsCount: scent._count.products
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при создании аромата:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}