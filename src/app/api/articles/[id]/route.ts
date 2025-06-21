import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Схема валидации для переводов статей
const articleTranslationSchema = z.object({
  locale: z.enum(['en', 'ru', 'uz']),
  title: z.string().min(1, 'Заголовок обязателен'),
  content: z.string().min(1, 'Содержание обязательно'),
  excerpt: z.string().optional()
});

// Схема валидации для обновления статьи
const updateArticleSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы').optional(),
  isActive: z.boolean().optional(),
  translations: z.array(articleTranslationSchema).min(1, 'Необходим хотя бы один перевод').optional()
});

// GET /api/articles/[id] - Получить статью по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    
    const article = await prisma.article.findUnique({
      where: { id: resolvedParams.id },
      include: {
        translations: locale ? {
          where: { locale }
        } : true
      }
    });
    
    if (!article) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Ошибка при получении статьи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - Обновить статью
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);
    
    // Проверка существования статьи
    const existingArticle = await prisma.article.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }
    
    // Проверка уникальности slug (если он изменяется)
    if (validatedData.slug && validatedData.slug !== existingArticle.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug: validatedData.slug }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Статья с таким slug уже существует' },
          { status: 400 }
        );
      }
    }
    
    // Подготовка данных для обновления
    const updateData: any = {};
    
    if (validatedData.slug !== undefined) {
      updateData.slug = validatedData.slug;
    }
    
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }
    
    // Обновление переводов
    if (validatedData.translations) {
      // Удаляем старые переводы
      await prisma.articleTranslation.deleteMany({
        where: { articleId: resolvedParams.id }
      });
      
      // Создаем новые переводы
      updateData.translations = {
        create: validatedData.translations
      };
    }
    
    // Обновление статьи
    const article = await prisma.article.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        translations: true
      }
    });
    
    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении статьи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - Удалить статью
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут удалять статьи' },
        { status: 403 }
      );
    }

    // Проверка существования статьи
    const existingArticle = await prisma.article.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }
    
    // Удаление статьи (переводы удалятся автоматически благодаря onDelete: Cascade)
    await prisma.article.delete({
      where: { id: resolvedParams.id }
    });
    
    return NextResponse.json(
      { message: 'Статья успешно удалена' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при удалении статьи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}