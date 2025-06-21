import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления аромата
const updateScentSchema = z.object({
  name: z.string().min(1, 'Название аромата обязательно').optional(),
  isActive: z.boolean().optional()
});

// GET /api/scents/[id] - Получить аромат по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scentId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(scentId)) {
      return Response.json({ error: 'Invalid scent ID' }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    
    const scent = await prisma.scent.findUnique({
      where: { id: scentId },
      include: {
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
    
    if (!scent) {
      return NextResponse.json(
        { error: 'Аромат не найден' },
        { status: 404 }
      );
    }
    
    // Форматирование ответа
    const formattedScent = {
      id: scent.id,
      name: scent.name,
      isActive: scent.isActive,
      productsCount: scent._count.products,
      products: includeProducts ? scent.products?.map(product => ({
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
      createdAt: scent.createdAt,
      updatedAt: scent.updatedAt
    };
    
    return NextResponse.json(formattedScent);
    
  } catch (error) {
    console.error('Ошибка при получении аромата:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/scents/[id] - Обновить аромат
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scentId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(scentId)) {
      return Response.json({ error: 'Invalid scent ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const validatedData = updateScentSchema.parse(body);
    
    // Проверка существования аромата
    const existingScent = await prisma.scent.findUnique({
      where: { id: scentId }
    });
    
    if (!existingScent) {
      return NextResponse.json(
        { error: 'Аромат не найден' },
        { status: 404 }
      );
    }
    
    // Проверка уникальности названия (если обновляется)
    if (validatedData.name && validatedData.name !== existingScent.name) {
      const nameExists = await prisma.scent.findFirst({
        where: {
          name: validatedData.name,
          id: { not: scentId }
        }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Аромат с таким названием уже существует' },
          { status: 400 }
        );
      }
    }
    
    // Обновление аромата
    const updatedScent = await prisma.scent.update({
      where: { id: scentId },
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
      ...updatedScent,
      productsCount: updatedScent._count.products
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении аромата:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/scents/[id] - Удалить аромат
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scentId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(scentId)) {
      return Response.json({ error: 'Invalid scent ID' }, { status: 400 });
    }
    
    // Проверка существования аромата
    const existingScent = await prisma.scent.findUnique({
      where: { id: scentId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!existingScent) {
      return NextResponse.json(
        { error: 'Аромат не найден' },
        { status: 404 }
      );
    }
    
    // Проверка наличия связанных продуктов
    if (existingScent._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Невозможно удалить аромат, используемый в продуктах',
          details: `Аромат используется в ${existingScent._count.products} продуктах`
        },
        { status: 400 }
      );
    }
    
    // Удаление аромата
    await prisma.scent.delete({
      where: { id: scentId }
    });
    
    return NextResponse.json(
      { message: 'Аромат успешно удален' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении аромата:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}