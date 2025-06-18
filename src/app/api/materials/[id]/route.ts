import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления материала
const updateMaterialSchema = z.object({
  name: z.string().min(1, 'Название материала обязательно').optional(),
  isActive: z.boolean().optional()
});

// GET /api/materials/[id] - Получить материал по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    
    const material = await prisma.material.findUnique({
      where: { id: resolvedParams.id },
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
    
    if (!material) {
      return NextResponse.json(
        { error: 'Материал не найден' },
        { status: 404 }
      );
    }
    
    // Форматирование ответа
    const formattedMaterial = {
      id: material.id,
      name: material.name,
      isActive: material.isActive,
      productsCount: material._count.products,
      products: includeProducts ? material.products?.map(product => ({
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
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    };
    
    return NextResponse.json(formattedMaterial);
    
  } catch (error) {
    console.error('Ошибка при получении материала:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id] - Обновить материал
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateMaterialSchema.parse(body);
    
    // Проверка существования материала
    const existingMaterial = await prisma.material.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'Материал не найден' },
        { status: 404 }
      );
    }
    
    // Проверка уникальности названия (если обновляется)
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const nameExists = await prisma.material.findFirst({
        where: {
          name: validatedData.name,
          id: { not: resolvedParams.id }
        }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Материал с таким названием уже существует' },
          { status: 400 }
        );
      }
    }
    
    // Обновление материала
    const updatedMaterial = await prisma.material.update({
      where: { id: resolvedParams.id },
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
      ...updatedMaterial,
      productsCount: updatedMaterial._count.products
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении материала:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] - Удалить материал
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Проверка существования материала
    const existingMaterial = await prisma.material.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'Материал не найден' },
        { status: 404 }
      );
    }
    
    // Проверка наличия связанных продуктов
    if (existingMaterial._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Невозможно удалить материал, используемый в продуктах',
          details: `Материал используется в ${existingMaterial._count.products} продуктах`
        },
        { status: 400 }
      );
    }
    
    // Удаление материала
    await prisma.material.delete({
      where: { id: resolvedParams.id }
    });
    
    return NextResponse.json(
      { message: 'Материал успешно удален' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении материала:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}