import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания/обновления продукта
const productSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен'),
  price: z.number().positive('Цена должна быть положительной'),
  costPrice: z.number().positive().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  stock: z.number().int().min(0, 'Количество не может быть отрицательным'),
  isActive: z.boolean().default(true),
  isDraft: z.boolean().default(false),
  categoryId: z.string().min(1, 'Категория обязательна'),
  materialId: z.string().optional(),
  scentId: z.string().optional(),
  translations: z.array(z.object({
    locale: z.enum(['en', 'ru', 'uz']),
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().min(1, 'Описание обязательно')
  })).min(1, 'Необходим хотя бы один перевод'),
  images: z.array(z.union([
    z.string().min(1, 'URL изображения не может быть пустым'),
    z.object({
      url: z.string().min(1, 'URL изображения не может быть пустым'),
      isMain: z.boolean().default(false),
      order: z.number().int().min(0).default(0)
    })
  ])).optional(),
  attributes: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1)
  })).optional()
});

// GET /api/products - Получить все продукты с фильтрацией
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('categoryId');
    const materialId = searchParams.get('materialId');
    const scentId = searchParams.get('scentId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const locale = searchParams.get('locale') || 'uz';
    const includeTranslations = searchParams.get('includeTranslations') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Построение фильтров
    const where: any = {};
    
    if (categoryId) where.categoryId = categoryId;
    if (materialId) where.materialId = materialId;
    if (scentId) where.scentId = scentId;
    if (isActive !== null) where.isActive = isActive === 'true';
    
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }
    
    // Получение продуктов с пагинацией
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          material: true,
          scent: true,
          translations: includeTranslations ? true : {
            where: { locale }
          },
          images: {
            orderBy: { order: 'asc' }
          },
          attributes: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    
    // Форматирование ответа
    const formattedProducts = products.map(product => {
      if (includeTranslations) {
        // Для админ-панели: возвращаем все переводы в виде объекта
        const nameTranslations: Record<string, string> = {};
        const descriptionTranslations: Record<string, string> = {};
        
        product.translations.forEach(translation => {
          nameTranslations[translation.locale] = translation.name;
          descriptionTranslations[translation.locale] = translation.description;
        });
        
        return {
          id: product.id,
          sku: product.sku,
          name: nameTranslations,
          description: descriptionTranslations,
          price: product.price,
          costPrice: product.costPrice,
          category: product.category.name,
          categoryId: product.categoryId,
          material: product.material?.name,
          materialId: product.materialId,
          scent: product.scent?.name,
          scentId: product.scentId,
          dimensions: product.dimensions,
          burningTime: product.burningTime,
          stock: product.stock,
          isActive: product.isActive,
          isDraft: product.isDraft,
          images: product.images,
          attributes: product.attributes,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      } else {
        // Для фронтенда: возвращаем только перевод для текущей локали
        return {
          id: product.id,
          sku: product.sku,
          name: product.translations[0]?.name || '',
          description: product.translations[0]?.description || '',
          price: product.price,
          costPrice: product.costPrice,
          category: product.category.name,
          categoryId: product.categoryId,
          material: product.material?.name,
          materialId: product.materialId,
          scent: product.scent?.name,
          scentId: product.scentId,
          dimensions: product.dimensions,
          burningTime: product.burningTime,
          stock: product.stock,
          isActive: product.isActive,
          isDraft: product.isDraft,
          images: product.images,
          attributes: product.attributes,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      }
    });
    
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении продуктов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/products - Создать новый продукт
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received product data:', JSON.stringify(body, null, 2));
    const validatedData = productSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));
    
    // Проверка уникальности SKU
    const existingProduct = await prisma.product.findUnique({
      where: { sku: validatedData.sku }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Продукт с таким SKU уже существует' },
        { status: 400 }
      );
    }
    
    // Проверка существования связанных сущностей
    const [category, material, scent] = await Promise.all([
      prisma.category.findUnique({ where: { id: validatedData.categoryId } }),
      validatedData.materialId ? prisma.material.findUnique({ where: { id: validatedData.materialId } }) : null,
      validatedData.scentId ? prisma.scent.findUnique({ where: { id: validatedData.scentId } }) : null
    ]);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 400 }
      );
    }
    
    if (validatedData.materialId && !material) {
      return NextResponse.json(
        { error: 'Материал не найден' },
        { status: 400 }
      );
    }
    
    if (validatedData.scentId && !scent) {
      return NextResponse.json(
        { error: 'Аромат не найден' },
        { status: 400 }
      );
    }
    
    // Создание продукта с транзакцией
    const product = await prisma.product.create({
      data: {
        sku: validatedData.sku,
        price: validatedData.price,
        costPrice: validatedData.costPrice,
        dimensions: validatedData.dimensions,
        burningTime: validatedData.burningTime,
        stock: validatedData.stock,
        isActive: validatedData.isActive,
        isDraft: validatedData.isDraft,
        categoryId: validatedData.categoryId,
        materialId: validatedData.materialId,
        scentId: validatedData.scentId,
        translations: {
          create: validatedData.translations
        },
        images: validatedData.images ? {
          create: validatedData.images.map((img, index) => {
            if (typeof img === 'string') {
              return {
                url: img,
                isMain: false,
                order: index
              };
            }
            return {
              url: img.url,
              isMain: img.isMain || false,
              order: img.order || index
            };
          })
        } : undefined,
        attributes: validatedData.attributes ? {
          create: validatedData.attributes
        } : undefined
      },
      include: {
        category: true,
        material: true,
        scent: true,
        translations: true,
        images: true,
        attributes: true
      }
    });
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при создании продукта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
