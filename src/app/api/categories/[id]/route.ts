import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для переводов
const translationSchema = z.object({
  locale: z.enum(['en', 'ru', 'uz']),
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional()
});

// Схема валидации для обновления категории
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').optional(),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы').optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  translations: z.array(translationSchema).optional()
});

// GET /api/categories/[id] - Получить категорию по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    
    const category = await prisma.category.findUnique({
      where: { id: resolvedParams.id },
      include: {
        translations: true,
        products: includeProducts ? {
          where: { isActive: true },
          include: {
            translations: true,
            images: {
              where: { isMain: true },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' }
        } : false,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }
    
    // Форматирование ответа
    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      productsCount: category._count.products,
      translations: category.translations,
      products: includeProducts ? category.products?.map(product => ({
        id: product.id,
        sku: product.sku,
        name: (product as any).translations.reduce((acc: Record<string, string>, t: any) => {
          acc[t.locale] = t.name;
          return acc;
        }, {} as Record<string, string>),
        price: product.price,
        stock: product.stock,
        mainImage: (product as any).images[0]?.url || null,
        isActive: product.isActive
      })) : undefined,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
    
    return NextResponse.json(formattedCategory);
    
  } catch (error) {
    console.error('Ошибка при получении категории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Обновить категорию
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);
    
    // Проверка существования категории
    const existingCategory = await prisma.category.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }
    
    // Проверка уникальности названия и slug (если обновляются)
    const checks = [];
    
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      checks.push(
        prisma.category.findFirst({
          where: {
            name: validatedData.name,
            id: { not: resolvedParams.id }
          }
        }).then(result => ({ type: 'name', exists: !!result }))
      );
    }
    
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      checks.push(
        prisma.category.findFirst({
          where: {
            slug: validatedData.slug,
            id: { not: resolvedParams.id }
          }
        }).then(result => ({ type: 'slug', exists: !!result }))
      );
    }
    
    const checkResults = await Promise.all(checks);
    const conflicts = checkResults.filter(result => result.exists);
    
    if (conflicts.length > 0) {
      const conflictType = conflicts[0].type;
      return NextResponse.json(
        { error: `Категория с таким ${conflictType === 'name' ? 'названием' : 'slug'} уже существует` },
        { status: 400 }
      );
    }
    
    // Обновление категории с переводами
    const { translations, ...categoryData } = validatedData;
    
    const updatedCategory = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: {
        ...categoryData,
        ...(translations && {
          translations: {
            deleteMany: {},
            create: translations
          }
        })
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
      ...updatedCategory,
      productsCount: updatedCategory._count.products
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении категории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Удалить категорию
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Проверка существования категории
    const existingCategory = await prisma.category.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }
    
    // Проверка наличия связанных продуктов
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Невозможно удалить категорию, содержащую продукты',
          details: `В категории ${existingCategory._count.products} продуктов`
        },
        { status: 400 }
      );
    }
    
    // Удаление категории
    await prisma.category.delete({
      where: { id: resolvedParams.id }
    });
    
    return NextResponse.json(
      { message: 'Категория успешно удалена' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении категории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}