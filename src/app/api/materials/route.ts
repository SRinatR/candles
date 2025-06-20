import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания/обновления материала
const materialSchema = z.object({
  name: z.record(z.string(), z.string().min(1, 'Название обязательно')),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы')
});

// GET /api/materials - Получить все материалы
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
    
    if (search) {
      where.OR = [
        { name: { path: ['uz'], string_contains: search } },
        { name: { path: ['ru'], string_contains: search } },
        { name: { path: ['en'], string_contains: search } }
      ];
    }
    
    // Получение материалов с пагинацией
    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: limit,
        include: {
          products: includeProducts ? {
            select: {
              id: true,
              sku: true,
              price: true
            }
          } : false,
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: { slug: 'asc' }
      }),
      prisma.material.count({ where })
    ]);
    
    // Форматирование ответа
    const formattedMaterials = materials.map(material => ({
      id: material.id,
      name: material.name,
      slug: material.slug,
      productsCount: material._count.products,
      products: includeProducts ? material.products : undefined,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    }));
    
    return NextResponse.json({
      materials: formattedMaterials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении материалов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/materials - Создать новый материал
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = materialSchema.parse(body);
    
    // Проверка уникальности slug
    const existingMaterial = await prisma.material.findUnique({
      where: { slug: validatedData.slug }
    });
    
    if (existingMaterial) {
      return NextResponse.json(
        { error: 'Материал с таким slug уже существует' },
        { status: 400 }
      );
    }
    
    // Создание материала
    const material = await prisma.material.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    return NextResponse.json({
      ...material,
      productsCount: material._count.products
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при создании материала:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}