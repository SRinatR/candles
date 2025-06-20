import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления количества
const updateQuantitySchema = z.object({
  quantity: z.number().min(0)
});

// PATCH /api/cart/[itemId] - Обновить количество товара в корзине
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateQuantitySchema.parse(body);
    
    // Поиск элемента корзины
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: resolvedParams.itemId },
      include: {
        product: true
      }
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Элемент корзины не найден' },
        { status: 404 }
      );
    }
    
    // Если количество 0, удаляем элемент
    if (validatedData.quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: resolvedParams.itemId }
      });
      
      return NextResponse.json(
        { message: 'Товар удален из корзины' },
        { status: 200 }
      );
    }
    
    // Проверка наличия на складе
    if (cartItem.product.stock < validatedData.quantity) {
      return NextResponse.json(
        { error: 'Недостаточно товара на складе' },
        { status: 400 }
      );
    }
    
    // Обновление количества
    const updatedItem = await prisma.cartItem.update({
      where: { id: resolvedParams.itemId },
      data: { quantity: validatedData.quantity },
      include: {
        product: {
          include: {
            translations: true,
            images: {
              where: { isMain: true },
              take: 1
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      id: updatedItem.id,
      productId: updatedItem.productId,
      quantity: updatedItem.quantity,
      product: {
        id: updatedItem.product.id,
        sku: updatedItem.product.sku,
        price: updatedItem.product.price,
        stock: updatedItem.product.stock,
        translations: updatedItem.product.translations,
        mainImage: updatedItem.product.images[0]?.url || null
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении корзины:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] - Удалить товар из корзины
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Проверка существования элемента корзины
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: resolvedParams.itemId }
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Элемент корзины не найден' },
        { status: 404 }
      );
    }
    
    // Удаление элемента
    await prisma.cartItem.delete({
      where: { id: resolvedParams.itemId }
    });
    
    return NextResponse.json(
      { message: 'Товар удален из корзины' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении из корзины:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}