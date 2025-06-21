import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// POST /api/products/drafts/create - Создать новый черновик
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Создаем черновик в таблице ProductDraft
    const draft = await prisma.productDraft.create({
      data: {
        userId: session.user.id,
        data: body // Сохраняем все данные формы как JSON
      }
    });

    return NextResponse.json(
      { 
        message: 'Черновик успешно создан',
        id: draft.id,
        draft
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка при создании черновика:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}