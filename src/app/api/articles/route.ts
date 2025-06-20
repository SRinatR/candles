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

// Схема валидации для создания/обновления статьи
const articleSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  isActive: z.boolean().default(true),
  translations: z.array(articleTranslationSchema).min(1, 'Необходим хотя бы один перевод')
});

// GET /api/articles - Получить все статьи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const locale = searchParams.get('locale');
    
    const skip = (page - 1) * limit;
    
    // Построение фильтров
    const where: any = {};
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }
    
    // Получение статей с пагинацией
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: locale ? {
            where: { locale }
          } : true
        },
        orderBy: { createdAt: 'desc' }
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
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = articleSchema.parse(body);
    
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
        isActive: validatedData.isActive,
        translations: {
          create: validatedData.translations
        }
      },
      include: {
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