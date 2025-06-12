
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ImageUploadArea } from '@/components/admin/ImageUploadArea';
import React, { useEffect, useState } from "react"; 
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
  images: z.array(z.string().url({message: "Each image must be a valid URL (Data URL in this case)."})).min(1, { message: "At least one image is required." }),
  mainImageId: z.string().optional(), 
  scent: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  burningTime: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

const LOCAL_STORAGE_KEY_CUSTOM_CATEGORIES = "askimAdminCustomCategories";
const LOCAL_STORAGE_KEY_CUSTOM_MATERIALS = "askimAdminCustomMaterials";
const LOCAL_STORAGE_KEY_CUSTOM_SCENTS = "askimAdminCustomScents";


export default function NewProductPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [availableScents, setAvailableScents] = useState<string[]>([]);
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedAdminLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedAdminLocale && i18nAdmin.locales.includes(storedAdminLocale) ? storedAdminLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminProductsPage);
    }
    loadDictionary();

    if (typeof window !== 'undefined') {
      const storedCustomCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_CATEGORIES);
      setAvailableCategories(storedCustomCategories ? JSON.parse(storedCustomCategories) : []);
      
      const storedCustomMaterials = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_MATERIALS);
      setAvailableMaterials(storedCustomMaterials ? JSON.parse(storedCustomMaterials) : []);

      const storedCustomScents = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_SCENTS);
      setAvailableScents(storedCustomScents ? JSON.parse(storedCustomScents) : []);
    }
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
    },
  });

  const { register, handleSubmit, control, formState, setValue, watch } = formMethods;
  const { errors, isSubmitting } = formState; 

  const onSubmit = (data: ProductFormValues) => {
    const newProductData = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: { en: data.name_en, ru: data.name_ru, uz: data.name_uz },
      description: { en: data.description_en, ru: data.description_ru, uz: data.description_uz },
      sku: data.sku,
      price: data.price,
      costPrice: data.costPrice,
      category: data.category,
      stock: data.stock,
      images: data.images,
      mainImage: data.mainImageId, 
      scent: data.scent,
      material: data.material,
      dimensions: data.dimensions,
      burningTime: data.burningTime,
      isActive: data.isActive,
    };
    console.log("New Product Data (Simulated):", newProductData);
    toast({
      title: dict?.addSuccessTitle || "Product Added (Simulated)",
      description: `${dict?.addSuccessDescPrefix || ""}${data.name_en}${dict?.addSuccessDescSuffix || " has been 'added'."}`,
    });
    router.push("/admin/products");
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

        <form onSubmit={handleSubmit(onSubmit)}>
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
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                                    <SelectItem key={scent} value={scent}>{scent}</SelectItem>
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
                                    <SelectItem key={material} value={material}>{material}</SelectItem>
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
                        onImagesChange={(newImageUrls, newMainImageUrl) => {
                           setValue("images", newImageUrls, { shouldValidate: true });
                           setValue("mainImageId", newMainImageUrl, { shouldValidate: true });
                        }}
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
          <CardFooter className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? dict.savingButton : dict.saveButton}
            </Button>
          </CardFooter>
        </form>
        <p className="text-sm text-muted-foreground text-center pt-4">
            {dict.simulationNote}
          </p>
      </div>
    </FormProvider>
  );
}
