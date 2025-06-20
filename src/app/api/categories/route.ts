import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для переводов
const translationSchema = z.object({
  locale: z.enum(['en', 'ru', 'uz']),
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional()
});

// Схема валидации для создания/обновления категории
const categorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  translations: z.array(translationSchema).min(1, 'Необходим хотя бы один перевод')
});

// GET /api/categories - Получить все категории
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
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Получение категорий с пагинацией
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: true,
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
      prisma.category.count({ where })
    ]);
    
    // Форматирование ответа
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      productsCount: category._count.products,
      products: includeProducts ? category.products : undefined,
      translations: category.translations,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    return NextResponse.json({
      categories: formattedCategories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Создать новую категорию
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = categorySchema.parse(body);
    
    // Проверка уникальности названия и slug
    const [existingName, existingSlug] = await Promise.all([
      prisma.category.findUnique({ where: { name: validatedData.name } }),
      prisma.category.findUnique({ where: { slug: validatedData.slug } })
    ]);
    
    if (existingName) {
      return NextResponse.json(
        { error: 'Категория с таким названием уже существует' },
        { status: 400 }
      );
    }
    
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Категория с таким slug уже существует' },
        { status: 400 }
      );
    }
    
    // Создание категории с переводами
    const { translations, ...categoryData } = validatedData;
    
    const category = await prisma.category.create({
      data: {
        ...categoryData,
        translations: {
          create: translations
        }
      },
      include: {
        translations: true,
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
      ...category,
      productsCount: category._count.products
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при создании категории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
