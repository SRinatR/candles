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

// Схема валидации для создания статьи
const createArticleSchema = z.object({
  slug: z.string().min(1).max(100),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featuredImage: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  translations: z.array(articleTranslationSchema).min(1)
});

// GET /api/articles - Получить список статей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const search = searchParams.get('search');
    const authorId = searchParams.get('authorId');
    
    const skip = (page - 1) * limit;
    
    // Построение условий фильтрации
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (search) {
      where.OR = [
        { slug: { contains: search, mode: 'insensitive' } },
        {
          translations: {
            some: {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }
    
    // Условия для переводов
    const translationWhere: any = {};
    if (language) {
      translationWhere.language = language;
    }
    
    // Получение статей
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ]);
    
    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении статей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Создать новую статью
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);
    
    // Проверка уникальности slug
    const existingArticle = await prisma.article.findUnique({
      where: { slug: validatedData.slug }
    });
    
    if (existingArticle) {
      return NextResponse.json(
        { error: 'Статья с таким slug уже существует' },
        { status: 400 }
      );
    }
    
    // Создание статьи с переводами
    const article = await prisma.article.create({
      data: {
        slug: validatedData.slug,
        status: validatedData.status,
        featuredImage: validatedData.featuredImage,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        authorId: 'admin', // TODO: получать из сессии
        translations: {
          create: validatedData.translations
        }
      },
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
    
    return NextResponse.json(article, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при создании статьи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
