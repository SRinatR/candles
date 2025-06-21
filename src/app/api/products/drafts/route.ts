import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/products/drafts - Получить список черновиков
export async function GET(request: NextRequest) {
  try {
    const drafts = await prisma.productDraft.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(
      { drafts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при получении черновиков:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/drafts - Удалить черновик
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    const draftIdNum = parseInt(draftId, 10);
    if (isNaN(draftIdNum)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    // Проверяем существование черновика
    const existingDraft = await prisma.productDraft.findUnique({
      where: { id: draftIdNum }
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Черновик не найден' },
        { status: 404 }
      );
    }

    // Удаляем черновик
    await prisma.productDraft.delete({
      where: { id: draftIdNum }
    });

    return NextResponse.json(
      { message: 'Черновик успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при удалении черновика:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/products/drafts - Опубликовать черновик как продукт
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json(
        { error: 'ID черновика обязателен' },
        { status: 400 }
      );
    }

    const draftIdNum = parseInt(draftId, 10);
    if (isNaN(draftIdNum)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      );
    }

    // Получаем черновик
    const draft = await prisma.productDraft.findUnique({
      where: { id: draftIdNum }
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Черновик не найден' },
        { status: 404 }
      );
    }

    const draftData = draft.data as any;

    // Проверяем уникальность SKU
    if (draftData.sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: draftData.sku }
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Продукт с таким SKU уже существует' },
          { status: 400 }
        );
      }
    }

    // Создаем продукт из черновика
    const newProduct = await prisma.product.create({
      data: {
        sku: draftData.sku,
        name: draftData.name,
        description: draftData.description,
        price: draftData.price,
        costPrice: draftData.costPrice,
        stock: draftData.stock,
        isActive: true,
        status: 'AVAILABLE',
        categoryId: parseInt(draftData.categoryId, 10),
        materialId: draftData.materialId ? parseInt(draftData.materialId, 10) : null,
        scentId: draftData.scentId ? parseInt(draftData.scentId, 10) : null,
        dimensions: draftData.dimensions,
        burningTime: draftData.burningTime,
        images: draftData.images || []
      },
      include: {
        category: true,
        material: true,
        scent: true
      }
    });

    // Удаляем черновик после успешной публикации
    await prisma.productDraft.delete({
      where: { id: draftIdNum }
    });

    return NextResponse.json(
      { 
        message: 'Черновик успешно опубликован',
        product: newProduct
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка при публикации черновика:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}