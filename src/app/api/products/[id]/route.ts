import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления продукта
const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен').optional(),
  price: z.number().positive('Цена должна быть положительной').optional(),
  costPrice: z.number().positive().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  stock: z.number().int().min(0, 'Количество не может быть отрицательным').optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1, 'Категория обязательна').optional(),
  materialId: z.string().optional(),
  scentId: z.string().optional(),
  translations: z.array(z.object({
    locale: z.enum(['en', 'ru', 'uz']),
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().min(1, 'Описание обязательно')
  })).optional(),
  images: z.array(z.object({
    url: z.string().url('Некорректный URL изображения'),
    isMain: z.boolean().default(false),
    order: z.number().int().min(0).default(0)
  })).optional(),
  attributes: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1)
  })).optional()
});

// GET /api/products/[id] - Получить продукт по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'uz';
    const includeTranslations = searchParams.get('includeTranslations') === 'true';
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(productId)) {
      return Response.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        material: true,
        scent: true,
        translations: true,
        images: {
          orderBy: { order: 'asc' }
        },
        attributes: true
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Продукт не найден' },
        { status: 404 }
      );
    }
    
    // Форматирование ответа
    let formattedProduct;
    
    if (includeTranslations) {
      // Для админ-панели: возвращаем все переводы в виде объекта
      const nameTranslations: Record<string, string> = {};
      const descriptionTranslations: Record<string, string> = {};
      
      product.translations.forEach(translation => {
        nameTranslations[translation.locale] = translation.name;
        descriptionTranslations[translation.locale] = translation.description;
      });
      
      formattedProduct = {
        id: product.id,
        sku: product.sku,
        name: nameTranslations,
        description: descriptionTranslations,
        price: product.price,
        costPrice: product.costPrice,
        dimensions: product.dimensions,
        burningTime: product.burningTime,
        stock: product.stock,
        isActive: product.isActive,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug
        },
        material: product.material ? {
          id: product.material.id,
          name: product.material.name
        } : null,
        scent: product.scent ? {
          id: product.scent.id,
          name: product.scent.name
        } : null,
        translations: product.translations.reduce((acc, translation) => {
          acc[translation.locale] = {
            name: translation.name,
            description: translation.description
          };
          return acc;
        }, {} as Record<string, { name: string; description: string }>),
        images: product.images,
        attributes: product.attributes,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    } else {
      // Для фронтенда: возвращаем только перевод для текущей локали
      const currentTranslation = product.translations.find(t => t.locale === locale) || product.translations[0];
      
      formattedProduct = {
        id: product.id,
        sku: product.sku,
        name: currentTranslation?.name || '',
        description: currentTranslation?.description || '',
        price: product.price,
        costPrice: product.costPrice,
        dimensions: product.dimensions,
        burningTime: product.burningTime,
        stock: product.stock,
        isActive: product.isActive,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug
        },
        material: product.material ? {
          id: product.material.id,
          name: product.material.name
        } : null,
        scent: product.scent ? {
          id: product.scent.id,
          name: product.scent.name
        } : null,
        images: product.images,
        attributes: product.attributes,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    }
    
    return NextResponse.json(formattedProduct);
    
  } catch (error) {
    console.error('Ошибка при получении продукта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Обновить продукт
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(productId)) {
      return Response.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    // Проверка существования продукта
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Продукт не найден' },
        { status: 404 }
      );
    }
    
    // Проверка уникальности SKU (если обновляется)
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: validatedData.sku }
      });
      
      if (skuExists) {
        return NextResponse.json(
          { error: 'Продукт с таким SKU уже существует' },
          { status: 400 }
        );
      }
    }
    
    // Проверка существования связанных сущностей
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Категория не найдена' },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.materialId) {
      const material = await prisma.material.findUnique({
        where: { id: validatedData.materialId }
      });
      if (!material) {
        return NextResponse.json(
          { error: 'Материал не найден' },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.scentId) {
      const scent = await prisma.scent.findUnique({
        where: { id: validatedData.scentId }
      });
      if (!scent) {
        return NextResponse.json(
          { error: 'Аромат не найден' },
          { status: 400 }
        );
      }
    }
    
    // Обновление продукта с транзакцией
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Обновление основных полей продукта
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          sku: validatedData.sku,
          price: validatedData.price,
          costPrice: validatedData.costPrice,
          dimensions: validatedData.dimensions,
          burningTime: validatedData.burningTime,
          stock: validatedData.stock,
          isActive: validatedData.isActive,
          categoryId: validatedData.categoryId,
          materialId: validatedData.materialId,
          scentId: validatedData.scentId
        }
      });
      
      // Обновление переводов
      if (validatedData.translations) {
        await tx.productTranslation.deleteMany({
          where: { productId: productId }
        });
        
        await tx.productTranslation.createMany({
          data: validatedData.translations.map(translation => ({
            productId: productId,
            locale: translation.locale,
            name: translation.name,
            description: translation.description
          }))
        });
      }
      
      // Обновление изображений
      if (validatedData.images) {
        await tx.productImage.deleteMany({
          where: { productId: productId }
        });
        
        await tx.productImage.createMany({
          data: validatedData.images.map(image => ({
            productId: productId,
            url: image.url,
            isMain: image.isMain,
            order: image.order
          }))
        });
      }
      
      // Обновление атрибутов
      if (validatedData.attributes) {
        await tx.productAttribute.deleteMany({
          where: { productId: productId }
        });
        
        await tx.productAttribute.createMany({
          data: validatedData.attributes.map(attribute => ({
            productId: productId,
            key: attribute.key,
            value: attribute.value
          }))
        });
      }
      
      return product;
    });
    
    // Получение обновленного продукта с включениями
    const fullProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        material: true,
        scent: true,
        translations: true,
        images: true,
        attributes: true
      }
    });
    
    return NextResponse.json(fullProduct);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Ошибка при обновлении продукта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Удалить продукт
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(productId)) {
      return Response.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    // Проверка существования продукта
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Продукт не найден' },
        { status: 404 }
      );
    }
    
    // Удаление продукта (каскадное удаление связанных записей)
    await prisma.product.delete({
      where: { id: productId }
    });
    
    return NextResponse.json(
      { message: 'Продукт успешно удален' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Ошибка при удалении продукта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}