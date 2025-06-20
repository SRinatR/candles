import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для переводов статьи
const articleTranslationSchema = z.object({
  language: z.string().min(2).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});

// Схема валидации для обновления статьи
const updateArticleSchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featuredImage: z.string().url().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  translations: z.array(articleTranslationSchema).optional()
});

// GET /api/articles/[id] - Получить статью по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    
    // Условия для переводов
    const translationWhere: any = {};
    if (language) {
      translationWhere.language = language;
    }
    
    const article = await prisma.article.findUnique({
      where: { id: resolvedParams.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        translations: {
          where: translationWhere
        }
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

// PATCH /api/articles/[id] - Обновить статью
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
    
    // Проверка уникальности slug (если изменяется)
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
    
    if (validatedData.slug) updateData.slug = validatedData.slug;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage;
    if (validatedData.publishedAt !== undefined) {
      updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : null;
    }
    
    // Обновление переводов (если предоставлены)
    if (validatedData.translations) {
      // Удаление существующих переводов
      await prisma.articleTranslation.deleteMany({
        where: { articleId: resolvedParams.id }
      });
      
      // Создание новых переводов
      updateData.translations = {
        create: validatedData.translations
      };
    }
    
    // Обновление статьи
    const updatedArticle = await prisma.article.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        translations: true
      }
    });
    
    return NextResponse.json(updatedArticle);
    
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