"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { ImageUploadArea } from '@/components/admin/ImageUploadArea';
import React, { useEffect, useState, useCallback } from "react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/types";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminProductsPageDict = typeof enAdminMessages.adminProductsPage;

// Упрощенная схема для черновиков - все поля опциональные
const draftProductSchema = z.object({
  name_en: z.string().optional(),
  name_ru: z.string().optional(),
  name_uz: z.string().optional(),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  description_uz: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().optional(),
  images: z.array(z.string()).optional(),
  mainImageId: z.string().optional(), 
  scent: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  isDraft: z.boolean().default(true),
});

type DraftProductFormValues = z.infer<typeof draftProductSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Material {
  id: string;
  name: string;
  slug: string;
}

interface Scent {
  id: string;
  name: string;
  slug: string;
}

export default function CreateDraftPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [scents, setScents] = useState<Scent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем словарь
        const currentLocale: AdminLocale = (localStorage.getItem('admin-locale') as AdminLocale) || 'en';
        const dictionary = await getAdminDictionary(currentLocale);
        setDict(dictionary.adminProductsPage);

        // Загружаем данные для селектов
        const [categoriesRes, materialsRes, scentsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/materials'),
          fetch('/api/scents')
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(materialsData.materials || []);
        }

        if (scentsRes.ok) {
          const scentsData = await scentsRes.json();
          setScents(scentsData.scents || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const formMethods = useForm<DraftProductFormValues>({
    resolver: zodResolver(draftProductSchema),
    defaultValues: {
      name_en: "", name_ru: "", name_uz: "",
      description_en: "", description_ru: "", description_uz: "",
      sku: "",
      price: 0,
      costPrice: 0,
      category: "",
      stock: 0,
      images: [],
      mainImageId: undefined,
      scent: "",
      material: "",
      dimensions: "",
      burningTime: "",
      isDraft: true,
    },
  });

  const { register, handleSubmit, control, formState, setValue, watch, getValues } = formMethods;
  const { errors, isSubmitting } = formState; 

  const handleImagesChange = useCallback((imageUrls: string[], mainImageUrl?: string) => {
    console.log('Setting images:', imageUrls);
    setValue('images', imageUrls);
    if (mainImageUrl) {
      setValue('mainImageId', mainImageUrl);
    }
  }, [setValue]);

  const onSubmitDraft: SubmitHandler<DraftProductFormValues> = async (data) => {
    console.log('onSubmitDraft called with data:', data);
    
    try {
      // Подготовка данных для сохранения в ProductDraft
      const draftPayload = {
        sku: data.sku || Math.floor(Math.random() * 99999 + 1).toString(),
        name: {
          en: data.name_en || '',
          ru: data.name_ru || '',
          uz: data.name_uz || ''
        },
        description: {
          en: data.description_en || '',
          ru: data.description_ru || '',
          uz: data.description_uz || ''
        },
        price: data.price ? Number(data.price) : 0,
        costPrice: data.costPrice ? Number(data.costPrice) : 0,
        dimensions: data.dimensions || '',
        burningTime: data.burningTime || '',
        stock: data.stock ? Number(data.stock) : 0,
        categoryId: data.category || null,
        materialId: data.material || null,
        scentId: data.scent || null,
        images: data.images || []
      };

      console.log('Sending draft product data:', draftPayload);

      const response = await fetch('/api/products/drafts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении черновика');
      }

      const createdDraft = await response.json();
      console.log('Draft saved successfully:', createdDraft);
      
      toast({
        title: "Черновик сохранен",
        description: "Товар сохранен как черновик. Вы можете найти его на странице черновиков.",
      });
      
      // Перенаправляем на страницу черновиков
      router.push('/admin/products/drafts');
      
      // Очищаем форму
      formMethods.reset();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить черновик",
        variant: "destructive"
      });
    }
  };

  if (isLoading || !dict) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к товарам
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Создать черновик товара</h1>
            <p className="text-muted-foreground">Сохраните товар как черновик для последующего редактирования</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitDraft)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Основная информация */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                  <CardDescription>Базовые данные о товаре (все поля опциональные)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="uz" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="uz">UZ</TabsTrigger>
                      <TabsTrigger value="ru">RU</TabsTrigger>
                      <TabsTrigger value="en">EN</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="uz" className="space-y-4">
                      <div>
                        <Label htmlFor="name_uz">Название (UZ)</Label>
                        <Input
                          id="name_uz"
                          {...register('name_uz')}
                          placeholder="Введите название на узбекском"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_uz">Описание (UZ)</Label>
                        <Textarea
                          id="description_uz"
                          {...register('description_uz')}
                          placeholder="Введите описание на узбекском"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ru" className="space-y-4">
                      <div>
                        <Label htmlFor="name_ru">Название (RU)</Label>
                        <Input
                          id="name_ru"
                          {...register('name_ru')}
                          placeholder="Введите название на русском"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_ru">Описание (RU)</Label>
                        <Textarea
                          id="description_ru"
                          {...register('description_ru')}
                          placeholder="Введите описание на русском"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="en" className="space-y-4">
                      <div>
                        <Label htmlFor="name_en">Название (EN)</Label>
                        <Input
                          id="name_en"
                          {...register('name_en')}
                          placeholder="Enter name in English"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_en">Описание (EN)</Label>
                        <Textarea
                          id="description_en"
                          {...register('description_en')}
                          placeholder="Enter description in English"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        {...register('sku')}
                        placeholder="Автоматически"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Количество</Label>
                      <Input
                        id="stock"
                        type="number"
                        {...register('stock')}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Цена (UZS)</Label>
                      <Input
                        id="price"
                        type="number"
                        {...register('price')}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPrice">Себестоимость (UZS)</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        {...register('costPrice')}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Категории и характеристики</CardTitle>
                  <CardDescription>Дополнительная информация о товаре</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {(category.name as any)?.ru || (category.name as any)?.en || (category.name as any)?.uz || category.slug || 'Category'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="material">Материал</Label>
                    <Controller
                      name="material"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите материал" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {(material.name as any)?.ru || (material.name as any)?.en || (material.name as any)?.uz || material.slug || 'Material'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="scent">Аромат</Label>
                    <Controller
                      name="scent"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите аромат" />
                          </SelectTrigger>
                          <SelectContent>
                            {scents.map((scent) => (
                              <SelectItem key={scent.id} value={scent.id}>
                                {(scent.name as any)?.ru || (scent.name as any)?.en || (scent.name as any)?.uz || scent.slug || 'Scent'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dimensions">Размеры</Label>
                    <Input
                      id="dimensions"
                      {...register('dimensions')}
                      placeholder="например: 10x10x15 см"
                    />
                  </div>

                  <div>
                    <Label htmlFor="burningTime">Время горения</Label>
                    <Input
                      id="burningTime"
                      {...register('burningTime')}
                      placeholder="например: 40 часов"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Изображения */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Изображения товара</CardTitle>
                  <CardDescription>Загрузите изображения товара (опционально)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploadArea
                    onImagesChange={handleImagesChange}
                    maxImages={5}
                    currentImages={watch('images') || []}
                    mainImageId={watch('mainImageId')}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <CardFooter className="mt-6 flex justify-end gap-3">
            <Link href="/admin/products">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              <FileText className="mr-2 h-4 w-4" /> 
              {isSubmitting ? 'Сохранение...' : 'Сохранить черновик'}
            </Button>
          </CardFooter>
        </form>
        
        <p className="text-sm text-muted-foreground text-center pt-4">
          Черновик можно сохранить с любыми заполненными полями и доработать позже.
        </p>
      </div>
    </FormProvider>
  );
}