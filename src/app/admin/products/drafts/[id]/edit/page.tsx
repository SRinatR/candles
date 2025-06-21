"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Схема для черновика (все поля опциональны)
const draftProductSchema = z.object({
  name_en: z.string().optional(),
  name_ru: z.string().optional(),
  name_uz: z.string().optional(),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  description_uz: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  costPrice: z.number().optional(),
  stock: z.number().optional(),
  categoryId: z.string().optional(),
  materialId: z.string().optional(),
  scentId: z.string().optional(),
  dimensions: z.string().optional(),
  burningTime: z.number().optional(),
  images: z.array(z.string()).optional(),
});

type DraftProductFormData = z.infer<typeof draftProductSchema>;

interface Category {
  id: number;
  name: {
    en: string;
    ru: string;
    uz: string;
  };
}

interface Material {
  id: number;
  name: {
    en: string;
    ru: string;
    uz: string;
  };
}

interface Scent {
  id: number;
  name: {
    en: string;
    ru: string;
    uz: string;
  };
}

interface ProductDraft {
  id: number;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [scents, setScents] = useState<Scent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const form = useForm<DraftProductFormData>({
    resolver: zodResolver(draftProductSchema),
    defaultValues: {
      name_en: "",
      name_ru: "",
      name_uz: "",
      description_en: "",
      description_ru: "",
      description_uz: "",
      sku: "",
      price: undefined,
      costPrice: undefined,
      stock: undefined,
      categoryId: "",
      materialId: "",
      scentId: "",
      dimensions: "",
      burningTime: undefined,
      images: [],
    },
  });

  useEffect(() => {
    if (!resolvedParams) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем черновик
        const draftResponse = await fetch(`/api/products/drafts/${resolvedParams.id}`);
        if (!draftResponse.ok) {
          throw new Error('Черновик не найден');
        }
        const draftData = await draftResponse.json();
        setDraft(draftData.draft);
        
        // Заполняем форму данными черновика
        const data = draftData.draft.data;
        form.reset({
          name_en: data.name_en || "",
          name_ru: data.name_ru || "",
          name_uz: data.name_uz || "",
          description_en: data.description_en || "",
          description_ru: data.description_ru || "",
          description_uz: data.description_uz || "",
          sku: data.sku || "",
          price: data.price || undefined,
          costPrice: data.costPrice || undefined,
          stock: data.stock || undefined,
          categoryId: data.categoryId?.toString() || "",
          materialId: data.materialId?.toString() || "",
          scentId: data.scentId?.toString() || "",
          dimensions: data.dimensions || "",
          burningTime: data.burningTime || undefined,
          images: data.images || [],
        });

        // Загружаем справочники
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
        router.push('/admin/products/drafts');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [resolvedParams, form, toast, router]);

  const onSubmit = async (data: DraftProductFormData) => {
    try {
      setIsSaving(true);
      
      if (!resolvedParams) return;
      
      const response = await fetch(`/api/products/drafts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении черновика');
      }

      toast({
        title: "Черновик сохранен",
        description: "Изменения успешно сохранены",
      });

      router.push('/admin/products/drafts');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить черновик",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка черновика...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products/drafts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к черновикам
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Редактирование черновика</h1>
          <p className="text-muted-foreground">Изменение данных черновика товара</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Заполните основные данные товара. Все поля опциональны для черновика.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название (EN)</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название (RU)</FormLabel>
                      <FormControl>
                        <Input placeholder="Название товара на русском" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_uz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название (UZ)</FormLabel>
                      <FormControl>
                        <Input placeholder="Mahsulot nomi o'zbek tilida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Артикул товара" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name.ru || category.name.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена (UZS)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Себестоимость (UZS)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество на складе</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Описание</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (EN)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Product description in English" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (RU)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Описание товара на русском" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_uz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (UZ)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mahsulot tavsifi o'zbek tilida" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дополнительные характеристики</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="materialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Материал</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите материал" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id.toString()}>
                              {material.name.ru || material.name.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Аромат</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите аромат" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scents.map((scent) => (
                            <SelectItem key={scent.id} value={scent.id.toString()}>
                              {scent.name.ru || scent.name.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Размеры</FormLabel>
                      <FormControl>
                        <Input placeholder="Например: 10x10x15 см" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="burningTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Время горения (часы)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Сохранение...' : 'Сохранить черновик'}
            </Button>
            <Link href="/admin/products/drafts">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}