
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useForm, Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { ImageUploadArea } from '@/components/admin/ImageUploadArea';
import React, { useEffect, useState, useCallback } from "react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/types";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminProductsPageDict = typeof enAdminMessages.adminProductsPage;


const productSchema = z.object({
  name_en: z.string().min(1, { message: "English product name is required." }),
  name_ru: z.string().min(1, { message: "Russian product name is required." }),
  name_uz: z.string().min(1, { message: "Uzbek product name is required." }),
  description_en: z.string().min(1, { message: "English description is required." }),
  description_ru: z.string().min(1, { message: "Russian description is required." }),
  description_uz: z.string().min(1, { message: "Uzbek description is required." }),
  sku: z.string().optional(),
  price: z.coerce.number().int().positive({ message: "Price must be a positive integer (in UZS)." }),
  costPrice: z.coerce.number().int().nonnegative({ message: "Cost price must be a non-negative integer (in UZS)." }).optional(),
  category: z.string().min(1, { message: "Please select a category." }),
  stock: z.coerce.number().int().nonnegative({ message: "Stock must be a non-negative integer." }),
  images: z.array(z.string().min(1, {message: "Each image must be a valid path or URL."})).min(1, { message: "At least one image is required." }),
  mainImageId: z.string().optional(), 
  scent: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  isActive: z.boolean(),
  isDraft: z.boolean(),
});

// Более мягкая схема для черновиков
const draftProductSchema = z.object({
  name_en: z.string().optional(),
  name_ru: z.string().optional(),
  name_uz: z.string().optional(),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  description_uz: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().int().positive().optional(),
  costPrice: z.coerce.number().int().nonnegative().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  mainImageId: z.string().optional(), 
  scent: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  isActive: z.boolean(),
  isDraft: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const LOCAL_STORAGE_KEY_CUSTOM_CATEGORIES = "askimAdminCustomCategories";
const LOCAL_STORAGE_KEY_CUSTOM_MATERIALS = "askimAdminCustomMaterials";
const LOCAL_STORAGE_KEY_CUSTOM_SCENTS = "askimAdminCustomScents";


export default function NewProductPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<{id: string, name: string}[]>([]);
  const [availableScents, setAvailableScents] = useState<{id: string, name: string}[]>([]);
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProductName, setCreatedProductName] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    const storedAdminLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedAdminLocale && i18nAdmin.locales.includes(storedAdminLocale) ? storedAdminLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminProductsPage);
    }
    loadDictionary();

    // Load categories, materials, and scents from API
    async function loadData() {
      try {
        const [categoriesRes, materialsRes, scentsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/materials'),
          fetch('/api/scents')
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setAvailableCategories(categoriesData.categories || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setAvailableMaterials(materialsData.materials || []);
        }

        if (scentsRes.ok) {
          const scentsData = await scentsRes.json();
          setAvailableScents(scentsData.scents || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty arrays if API fails
         console.error('Failed to load data from API, using empty arrays');
         setAvailableCategories([]);
         setAvailableMaterials([]);
         setAvailableScents([]);
      }
    }
    loadData();
  }, []);


  const formMethods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
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
      isActive: true,
      isDraft: false,
    },
  });

  const { register, handleSubmit, control, formState, setValue, watch, getValues } = formMethods;
  const { errors, isSubmitting } = formState; 

  const handleImagesChange = useCallback((imageUrls: string[], mainImageUrl?: string) => {
    console.log('Setting images:', imageUrls);
    setValue("images", imageUrls, { shouldValidate: true });
    
    // Устанавливаем mainImageId только если он валидный
    if (mainImageUrl && typeof mainImageUrl === 'string') {
      setValue("mainImageId", mainImageUrl, { shouldValidate: true });
    } else if (imageUrls.length > 0) {
      // Если mainImageId не указан, используем первое изображение
      setValue("mainImageId", imageUrls[0], { shouldValidate: true });
    }
  }, [setValue]);

  const validateRequiredFields = (data: ProductFormValues): string[] => {
    const errors: string[] = [];
    
    if (!data.name_en?.trim()) errors.push("English product name");
    if (!data.name_ru?.trim()) errors.push("Russian product name");
    if (!data.name_uz?.trim()) errors.push("Uzbek product name");
    if (!data.description_en?.trim()) errors.push("English description");
    if (!data.description_ru?.trim()) errors.push("Russian description");
    if (!data.description_uz?.trim()) errors.push("Uzbek description");
    if (!data.price || data.price <= 0) errors.push("Valid price");
    if (!data.category) errors.push("Category selection");
    if (!data.images || data.images.length === 0) errors.push("At least one product image");
    if (data.stock === undefined || data.stock < 0) errors.push("Valid stock quantity");
    
    return errors;
  };

  const onSubmitDraft: SubmitHandler<ProductFormValues> = async (data) => {
    console.log('onSubmitDraft called with data:', data);
    
    try {
      // Для черновика используем менее строгую валидацию
      const draftData = {
        ...data,
        isDraft: true
      };
      
      // Валидируем с помощью draftProductSchema
      const validatedData = draftProductSchema.parse(draftData);
      
      // Подготовка данных для API
      const translations = [
        { locale: 'en' as const, name: validatedData.name_en || '', description: validatedData.description_en || '' },
        { locale: 'ru' as const, name: validatedData.name_ru || '', description: validatedData.description_ru || '' },
        { locale: 'uz' as const, name: validatedData.name_uz || '', description: validatedData.description_uz || '' }
      ];

      const productData = {
        sku: validatedData.sku || Math.floor(Math.random() * 99999 + 1).toString(),
        price: validatedData.price ? Number(validatedData.price) : 0,
        costPrice: validatedData.costPrice ? Number(validatedData.costPrice) : undefined,
        dimensions: validatedData.dimensions || undefined,
        burningTime: validatedData.burningTime || undefined,
        stock: validatedData.stock ? Number(validatedData.stock) : 0,
        isActive: false, // Черновики всегда неактивны
        isDraft: true,
        categoryId: validatedData.category || null,
        materialId: validatedData.material || undefined,
        scentId: validatedData.scent || undefined,
        translations,
        images: validatedData.images && validatedData.images.length > 0 ? validatedData.images.map((url, index) => ({
          url,
          isMain: url === validatedData.mainImageId,
          order: index
        })) : []
      };

      console.log('Sending draft product data:', productData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении черновика');
      }

      const createdProduct = await response.json();
      console.log('Draft saved successfully:', createdProduct);
      
      toast({
        title: "Черновик сохранен",
        description: "Товар сохранен как черновик. Вы можете продолжить редактирование позже.",
      });
      
      // Перенаправляем на страницу редактирования
      router.push(`/admin/products/edit/${createdProduct.id}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить черновик",
        variant: "destructive"
      });
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    console.log('onSubmit called with data:', data);
    
    // Проверка обязательных полей
    const missingFields = validateRequiredFields(data);
    console.log('Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
      console.log('Setting validation modal to true');
      setValidationErrors(missingFields);
      setShowValidationModal(true);
      return;
    }

    try {
      // Подготовка данных для API - все три языка обязательны
      const translations = [
        { locale: 'en' as const, name: data.name_en, description: data.description_en },
        { locale: 'ru' as const, name: data.name_ru, description: data.description_ru },
        { locale: 'uz' as const, name: data.name_uz, description: data.description_uz }
      ];

      // Проверяем, что все переводы заполнены
      const missingTranslations = translations.filter(t => !t.name || !t.name.trim() || !t.description || !t.description.trim());
      if (missingTranslations.length > 0) {
        const missingLanguages = missingTranslations.map(t => {
          switch(t.locale) {
            case 'en': return 'английском';
            case 'ru': return 'русском';
            case 'uz': return 'узбекском';
            default: return (t as any).locale as string;
          }
        }).join(', ');
        
        toast({
          title: "Ошибка валидации",
          description: `Необходимо заполнить название и описание на ${missingLanguages} языке(ах)`,
          variant: "destructive"
        });
        return;
      }

      const productData = {
        sku: data.sku || Math.floor(Math.random() * 99999 + 1).toString(),
        price: Number(data.price),
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        dimensions: data.dimensions || undefined,
        burningTime: data.burningTime || undefined,
        stock: Number(data.stock),
        isActive: data.isActive,
        categoryId: data.category,
        materialId: data.material || undefined,
        scentId: data.scent || undefined,
        translations,
        images: data.images.length > 0 ? data.images.map((url, index) => ({
          url,
          isMain: url === data.mainImageId,
          order: index
        })) : undefined
      };

      console.log('Sending product data:', productData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании продукта');
      }

      const createdProduct = await response.json();
      console.log('Product created successfully:', createdProduct);
      
      // Показываем модальное окно успеха
      setCreatedProductName(data.name_en || data.name_ru || data.name_uz || 'Product');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive"
      });
    }
  };
  
  if (!isClient || !dict) {
    return <div>Loading form...</div>;
  }

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">{dict.addNewTitle}</h1>
              <p className="text-muted-foreground">{dict.addNewDesc}</p>
          </div>
          <Button variant="outline" asChild>
              <Link href="/admin/products">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {dict.backToProductsButton}
              </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit(
          onSubmit, 
          (errors) => {
            console.log('Form validation errors:', errors);
            
            // Собираем ошибки валидации из Zod схемы
            const errorMessages: string[] = [];
            
            Object.entries(errors).forEach(([field, error]) => {
              if (error?.message) {
                errorMessages.push(error.message);
              }
            });
            
            if (errorMessages.length > 0) {
              setValidationErrors(errorMessages);
              setShowValidationModal(true);
            }
          }
        )}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.productInfoTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="ru">Русский</TabsTrigger>
                      <TabsTrigger value="uz">O'zbekcha</TabsTrigger>
                    </TabsList>
                    <TabsContent value="en" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_en">{dict.nameLabel} (EN)</Label>
                        <Input id="name_en" {...register("name_en")} />
                        {errors.name_en && <p className="text-sm text-destructive">{errors.name_en.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">{dict.descriptionLabel} (EN)</Label>
                        <Textarea id="description_en" {...register("description_en")} />
                        {errors.description_en && <p className="text-sm text-destructive">{errors.description_en.message}</p>}
                      </div>
                    </TabsContent>
                    <TabsContent value="ru" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_ru">{dict.nameLabel} (RU)</Label>
                        <Input id="name_ru" {...register("name_ru")} />
                        {errors.name_ru && <p className="text-sm text-destructive">{errors.name_ru.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_ru">{dict.descriptionLabel} (RU)</Label>
                        <Textarea id="description_ru" {...register("description_ru")} />
                        {errors.description_ru && <p className="text-sm text-destructive">{errors.description_ru.message}</p>}
                      </div>
                    </TabsContent>
                    <TabsContent value="uz" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_uz">{dict.nameLabel} (UZ)</Label>
                        <Input id="name_uz" {...register("name_uz")} />
                        {errors.name_uz && <p className="text-sm text-destructive">{errors.name_uz.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_uz">{dict.descriptionLabel} (UZ)</Label>
                        <Textarea id="description_uz" {...register("description_uz")} />
                        {errors.description_uz && <p className="text-sm text-destructive">{errors.description_uz.message}</p>}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                    <CardTitle>{dict.generalDetailsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                      <Label htmlFor="sku">{dict.skuLabel}</Label>
                      <Input id="sku" {...register("sku")} placeholder={dict.skuPlaceholder} />
                      {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{dict.priceLabel}</Label>
                      <Input id="price" type="number" step="1" {...register("price")} placeholder="0" />
                      {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="costPrice">{dict.costPriceLabel}</Label>
                      <Input id="costPrice" type="number" step="1" {...register("costPrice")} placeholder="0" />
                      {errors.costPrice && <p className="text-sm text-destructive">{errors.costPrice.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{dict.stockLabel}</Label>
                      <Input id="stock" type="number" {...register("stock")} placeholder="0" />
                      {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{dict.categoryLabel}</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder={dict.categoryPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="scent">{dict.scentLabel}</Label>
                         <Controller
                            name="scent"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || undefined} >
                                <SelectTrigger id="scent">
                                    <SelectValue placeholder={dict.scentPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableScents.map(scent => (
                                    <SelectItem key={scent.id} value={scent.id}>{scent.name?.en || scent.name?.ru || scent.name?.uz || scent.slug || 'Scent'}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.scent && <p className="text-sm text-destructive">{errors.scent.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="material">{dict.materialLabel}</Label>
                        <Controller
                            name="material"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger id="material">
                                    <SelectValue placeholder={dict.materialPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMaterials.map(material => (
                                    <SelectItem key={material.id} value={material.id}>{material.name?.en || material.name?.ru || material.name?.uz || material.slug || 'Material'}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.material && <p className="text-sm text-destructive">{errors.material.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dimensions">{dict.dimensionsLabel}</Label>
                        <Input id="dimensions" {...register("dimensions")} placeholder={dict.dimensionsPlaceholder} />
                        {errors.dimensions && <p className="text-sm text-destructive">{errors.dimensions.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="burningTime">{dict.burningTimeLabel}</Label>
                        <Input id="burningTime" {...register("burningTime")} placeholder={dict.burningTimePlaceholder} />
                        {errors.burningTime && <p className="text-sm text-destructive">{errors.burningTime.message}</p>}
                    </div>
                  </div>
                   <div className="space-y-2 pt-2">
                      <Label htmlFor="isActive" className="flex items-center">
                        {dict.statusLabel}
                        <Controller
                          name="isActive"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id="isActive"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="ml-3"
                            />
                          )}
                        />
                         <span className="ml-2 text-sm text-muted-foreground">({watch("isActive") ? dict.statusActive : dict.statusInactive})</span>
                      </Label>
                       {errors.isActive && <p className="text-sm text-destructive">{errors.isActive.message}</p>}
                    </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
               <Card>
                <CardHeader>
                  <CardTitle>{dict.imagesTitle}</CardTitle>
                  <CardDescription>{dict.imagesDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                   <Controller
                    name="images" 
                    control={control}
                    render={({ field }) => ( 
                      <ImageUploadArea
                        initialImageUrls={field.value} 
                        initialMainImageUrl={watch("mainImageId")} 
                        onImagesChange={handleImagesChange}
                        maxFiles={5}
                      />
                    )}
                  />
                  {errors.images && <p className="text-sm text-destructive mt-2">{errors.images.message}</p>}
                  {errors.mainImageId && <p className="text-sm text-destructive mt-2">{errors.mainImageId.message}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
          <CardFooter className="mt-6 flex justify-end gap-3">
            <Button 
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmitDraft)}
            >
              <FileText className="mr-2 h-4 w-4" /> 
              Сохранить как черновик
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? dict.savingButton : dict.saveButton}
            </Button>
          </CardFooter>
        </form>
        <p className="text-sm text-muted-foreground text-center pt-4">
            {dict.simulationNote}
          </p>
      </div>

      {/* Модальное окно валидации */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Missing Required Fields
            </DialogTitle>
            <DialogDescription>
              Please fill in the following required fields before adding the product:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-muted-foreground">{error}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowValidationModal(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно успеха */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Save className="h-5 w-5" />
              Product Added Successfully
            </DialogTitle>
            <DialogDescription>
              The product "{createdProductName}" has been added to your catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowSuccessModal(false);
              // Сброс формы для добавления нового товара
              formMethods.reset();
            }}>
              Add Another Product
            </Button>
            <Button onClick={() => {
              setShowSuccessModal(false);
              router.push("/admin/products");
            }}>
              Go to Products
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
