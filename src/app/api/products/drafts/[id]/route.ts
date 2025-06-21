import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/drafts/[id] - Получить черновик по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = parseInt(params.id, 10);
    
    if (isNaN(draftId)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      );
    }

    const draft = await prisma.productDraft.findUnique({
      where: { id: draftId }
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Черновик не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { draft },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при получении черновика:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/products/drafts/[id] - Обновить черновик
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = parseInt(params.id, 10);
    
    if (isNaN(draftId)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Проверяем существование черновика
    const existingDraft = await prisma.productDraft.findUnique({
      where: { id: draftId }
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Черновик не найден' },
        { status: 404 }
      );
    }

    // Обновляем черновик
    const updatedDraft = await prisma.productDraft.update({
      where: { id: draftId },
      data: {
        data: body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(
      { 
        message: 'Черновик успешно обновлен',
        draft: updatedDraft
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обновлении черновика:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/drafts/[id] - Удалить черновик
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = parseInt(params.id, 10);
    
    if (isNaN(draftId)) {
      return NextResponse.json(
        { error: 'Invalid draft ID' },
        { status: 400 }
      );
    }

    // Проверяем существование черновика
    const existingDraft = await prisma.productDraft.findUnique({
      where: { id: draftId }
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Черновик не найден' },
        { status: 404 }
      );
    }

    // Удаляем черновик
    await prisma.productDraft.delete({
      where: { id: draftId }
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