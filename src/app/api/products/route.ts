import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания/обновления продукта
const productSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен'),
  name: z.record(z.string(), z.string().min(1, 'Название обязательно')),
  description: z.record(z.string(), z.string().min(1, 'Описание обязательно')),
  price: z.number().positive('Цена должна быть положительной'),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Количество не может быть отрицательным').default(0),
  isActive: z.boolean().default(true),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  categoryId: z.number().int().positive('Категория обязательна'),
  materialId: z.number().int().positive().optional(),
  scentId: z.number().int().positive().optional(),
  images: z.array(z.string().min(1, 'URL изображения не может быть пустым')).optional()
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
    const draftsOnly = searchParams.get('draftsOnly') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Если запрашиваются только черновики, работаем с ProductDraft
    if (draftsOnly) {
      const [drafts, total] = await Promise.all([
        prisma.productDraft.findMany({
          skip,
          take: limit,
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.productDraft.count()
      ]);
      
      // Форматируем черновики как продукты
      const formattedDrafts = drafts.map(draft => {
        const data = draft.data as any;
        return {
          id: draft.id,
          sku: data.sku || '',
          name: data.name || { uz: '', ru: '', en: '' },
          description: data.description || { uz: '', ru: '', en: '' },
          price: data.price || 0,
          costPrice: data.costPrice || 0,
          stock: data.stock || 0,
          isActive: false,
          isDraft: true,
          category: data.category || '',
          categoryId: data.categoryId,
          material: data.material || null,
          materialId: data.materialId,
          scent: data.scent || null,
          scentId: data.scentId,
          dimensions: data.dimensions,
          burningTime: data.burningTime,
          images: data.images || [],
          mainImage: data.images && data.images.length > 0 ? data.images[0] : null,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt
        };
      });
      
      return NextResponse.json({
        products: formattedDrafts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    // Построение фильтров для обычных продуктов
    const where: any = {};
    
    if (categoryId) where.categoryId = categoryId;
    if (materialId) where.materialId = materialId;
    if (scentId) where.scentId = scentId;
    if (isActive !== null) where.isActive = isActive === 'true';
    
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        {
          OR: [
            { name: { path: ['uz'], string_contains: search } },
            { name: { path: ['ru'], string_contains: search } },
            { name: { path: ['en'], string_contains: search } },
            { description: { path: ['uz'], string_contains: search } },
            { description: { path: ['ru'], string_contains: search } },
            { description: { path: ['en'], string_contains: search } }
          ]
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
          scent: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    
    // Форматирование ответа
    const formattedProducts = products.map(product => {
      // Определяем главное изображение
      const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
      
      if (includeTranslations) {
        // Для админ-панели: возвращаем все переводы
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          costPrice: product.costPrice,
          stock: product.stock,
          isActive: product.isActive,
          category: product.category?.name || null,
          categoryId: product.categoryId,
          material: product.material?.name || null,
          materialId: product.materialId,
          scent: product.scent?.name || null,
          scentId: product.scentId,
          dimensions: product.dimensions,
          burningTime: product.burningTime,
          images: product.images || [],
          mainImage: mainImage,
          isDraft: false,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      } else {
        // Для фронтенда: возвращаем только перевод для текущей локали
        const name = (product.name as any)?.[locale] || (product.name as any)?.['uz'] || '';
        const description = (product.description as any)?.[locale] || (product.description as any)?.['uz'] || '';
        const categoryName = (product.category?.name as any)?.[locale] || (product.category?.name as any)?.['uz'] || '';
        const materialName = product.material ? ((product.material.name as any)?.[locale] || (product.material.name as any)?.['uz'] || '') : null;
        const scentName = product.scent ? ((product.scent.name as any)?.[locale] || (product.scent.name as any)?.['uz'] || '') : null;
        
        return {
          id: product.id,
          sku: product.sku,
          name: name,
          description: description,
          price: product.price,
          costPrice: product.costPrice,
          stock: product.stock,
          isActive: product.isActive,
          category: categoryName,
          categoryId: product.categoryId,
          material: materialName,
          materialId: product.materialId,
          scent: scentName,
          scentId: product.scentId,
          dimensions: product.dimensions,
          burningTime: product.burningTime,
          images: product.images || [],
          mainImage: mainImage,
          isDraft: false,
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
    
    // Создание продукта
    const product = await prisma.product.create({
      data: {
        sku: validatedData.sku,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        costPrice: validatedData.costPrice,
        stock: validatedData.stock,
        isActive: validatedData.isActive,
        dimensions: validatedData.dimensions,
        burningTime: validatedData.burningTime,
        categoryId: validatedData.categoryId,
        materialId: validatedData.materialId,
        scentId: validatedData.scentId,
        images: validatedData.images || []
      },
      include: {
        category: true,
        material: true,
        scent: true
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