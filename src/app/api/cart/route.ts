import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для добавления товара в корзину
const addToCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

// Схема валидации для обновления количества
const updateQuantitySchema = z.object({
  quantity: z.number().min(0)
});

// GET /api/cart - Получить корзину
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId или sessionId обязательны' },
        { status: 400 }
      );
    }
    
    // Поиск корзины
    const where: any = {};
    if (userId) {
      where.userId = userId;
    } else {
      where.sessionId = sessionId;
      where.userId = null;
    }
    
    const cart = await prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                images: {
                  where: { isMain: true },
                  take: 1
                },
                category: {
                  include: {
                    translations: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!cart) {
      return NextResponse.json({
        id: null,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }
    
    // Форматирование ответа
    const formattedItems = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        sku: item.product.sku,
        price: item.product.price,
        stock: item.product.stock,
        isActive: item.product.isActive,
        translations: item.product.translations,
        mainImage: item.product.images[0]?.url || null,
        category: item.product.category
      }
    }));
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    
    return NextResponse.json({
      id: cart.id,
      items: formattedItems,
      totalItems,
      totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });
    
  } catch (error) {
    console.error('Ошибка при получении корзины:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Добавить товар в корзину
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);
    
    // Проверка существования товара
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId }
    });
    
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Товар не найден или неактивен' },
        { status: 404 }
      );
    }
    
    // Проверка наличия на складе
    if (product.stock < validatedData.quantity) {
      return NextResponse.json(
        { error: 'Недостаточно товара на складе' },
        { status: 400 }
      );
    }
    
    // Поиск или создание корзины
    const where: any = {};
    if (validatedData.userId) {
      where.userId = validatedData.userId;
    } else {
      where.sessionId = validatedData.sessionId;
      where.userId = null;
    }
    
    let cart = await prisma.cart.findFirst({ where });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: validatedData.userId || null,
          sessionId: validatedData.sessionId || null
        }
      });
    }
    
    // Проверка существования товара в корзине
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: validatedData.productId
        }
      }
    });
    
    let cartItem;
    if (existingItem) {
      // Обновление количества
      const newQuantity = existingItem.quantity + validatedData.quantity;
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { error: 'Недостаточно товара на складе' },
          { status: 400 }
        );
      }
      
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Создание нового элемента корзины
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          quantity: validatedData.quantity
        },
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
    }
    
    return NextResponse.json({
      id: cartItem.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      product: {
        id: cartItem.product.id,
        sku: cartItem.product.sku,
        price: cartItem.product.price,
        stock: cartItem.product.stock,
        translations: cartItem.product.translations,
        mainImage: cartItem.product.images[0]?.url || null
      }
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при добавлении в корзину:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Очистить корзину
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId или sessionId обязательны' },
        { status: 400 }
      );
    }
    
    // Поиск корзины
    const where: any = {};
    if (userId) {
      where.userId = userId;
    } else {
      where.sessionId = sessionId;
      where.userId = null;
    }
    
    const cart = await prisma.cart.findFirst({ where });
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Корзина не найдена' },
        { status: 404 }
      );
    }
    
    // Удаление всех элементов корзины
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
    
    return NextResponse.json(
      { message: 'Корзина очищена' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при очистке корзины:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
