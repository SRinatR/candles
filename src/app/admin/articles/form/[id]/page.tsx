
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ImageUp } from "lucide-react";
import type { Article, Locale } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { ImageUploadArea } from '@/components/admin/ImageUploadArea';
import { logAdminAction } from "@/admin/lib/admin-logger";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const ARTICLES_STORAGE_KEY = "askimAdminArticles";

const articleSchema = z.object({
  slug: z.string().min(1, "Slug is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens."),
  title_en: z.string().min(1, "English title is required."),
  title_ru: z.string().min(1, "Russian title is required."),
  title_uz: z.string().min(1, "Uzbek title is required."),
  content_en: z.string().min(1, "English content is required."),
  content_ru: z.string().min(1, "Russian content is required."),
  content_uz: z.string().min(1, "Uzbek content is required."),
  isActive: z.boolean().default(true),
  useSharedImage: z.boolean().default(true),
  sharedMainImage: z.string().url({ message: "Invalid image URL (shared)." }).optional().or(z.literal("")),
  mainImage_en: z.string().url({ message: "Invalid image URL (EN)." }).optional().or(z.literal("")),
  mainImage_ru: z.string().url({ message: "Invalid image URL (RU)." }).optional().or(z.literal("")),
  mainImage_uz: z.string().url({ message: "Invalid image URL (UZ)." }).optional().or(z.literal("")),
}).refine(data => {
  if (data.useSharedImage && !data.sharedMainImage) {
    return false; 
  }
  return true;
}, {
  message: "If 'Use shared image' is checked, a shared image must be uploaded.",
  path: ["sharedMainImage"], 
});


type ArticleFormValues = z.infer<typeof articleSchema>;

export default function ArticleFormPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { currentAdminUser } = useAdminAuth();
  
  const articleId = params.id as string;
  const isEditing = articleId !== "new";
  const [isClient, setIsClient] = useState(false);


  const formMethods = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      slug: "",
      title_en: "", title_ru: "", title_uz: "",
      content_en: "", content_ru: "", content_uz: "",
      isActive: true,
      useSharedImage: true,
      sharedMainImage: "",
      mainImage_en: "", mainImage_ru: "", mainImage_uz: "",
    },
  });
  const { register, handleSubmit, control, formState, reset, watch, setValue, trigger } = formMethods;
  const { errors, isSubmitting } = formState;

  const watchedTitleEn = watch("title_en");
  const watchedUseSharedImage = watch("useSharedImage");

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      if (isEditing) {
        const storedArticlesRaw = localStorage.getItem(ARTICLES_STORAGE_KEY);
        const articles: Article[] = storedArticlesRaw ? JSON.parse(storedArticlesRaw) : [];
        const articleToEdit = articles.find(art => art.id === articleId);
        if (articleToEdit) {
          reset({
            slug: articleToEdit.slug,
            title_en: articleToEdit.title.en || "",
            title_ru: articleToEdit.title.ru || "",
            title_uz: articleToEdit.title.uz || "",
            content_en: articleToEdit.content.en || "",
            content_ru: articleToEdit.content.ru || "",
            content_uz: articleToEdit.content.uz || "",
            isActive: articleToEdit.isActive,
            useSharedImage: articleToEdit.useSharedImage === undefined ? true : articleToEdit.useSharedImage,
            sharedMainImage: articleToEdit.sharedMainImage || "",
            mainImage_en: articleToEdit.mainImage_en || "",
            mainImage_ru: articleToEdit.mainImage_ru || "",
            mainImage_uz: articleToEdit.mainImage_uz || "",
          });
        } else {
          toast({ title: "Error", description: "Article not found.", variant: "destructive" });
          router.push("/admin/articles");
        }
      } else { // For 'new' article
        reset({ // Reset to default values for new article form
          slug: "",
          title_en: "", title_ru: "", title_uz: "",
          content_en: "", content_ru: "", content_uz: "",
          isActive: true,
          useSharedImage: true,
          sharedMainImage: "",
          mainImage_en: "", mainImage_ru: "", mainImage_uz: "",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, isEditing, router, toast]); // Removed reset to avoid loops, re-added for correct form population on nav

  useEffect(() => {
    if (!isEditing && watchedTitleEn && isClient) {
      setValue("slug", slugify(watchedTitleEn));
    }
  }, [watchedTitleEn, setValue, isEditing, isClient]);


  const onSubmit = (data: ArticleFormValues) => {
    if (typeof window === 'undefined') return;

    const storedArticlesRaw = localStorage.getItem(ARTICLES_STORAGE_KEY);
    let articles: Article[] = storedArticlesRaw ? JSON.parse(storedArticlesRaw) : [];
    const now = new Date().toISOString();
    let finalArticleData: Article;
    const articleAction = isEditing ? "Article Updated" : "Article Created";

    if (isEditing) {
      const articleIndex = articles.findIndex(art => art.id === articleId);
      if (articleIndex === -1) {
        toast({ title: "Error updating article", description: "Article not found.", variant: "destructive" });
        return;
      }
      const existingArticle = articles[articleIndex];
      finalArticleData = {
        ...existingArticle,
        slug: data.slug,
        title: { en: data.title_en, ru: data.title_ru, uz: data.title_uz },
        content: { en: data.content_en, ru: data.content_ru, uz: data.content_uz },
        isActive: data.isActive,
        useSharedImage: data.useSharedImage,
        sharedMainImage: data.useSharedImage ? data.sharedMainImage : undefined,
        mainImage_en: !data.useSharedImage ? data.mainImage_en : undefined,
        mainImage_ru: !data.useSharedImage ? data.mainImage_ru : undefined,
        mainImage_uz: !data.useSharedImage ? data.mainImage_uz : undefined,
        updatedAt: now,
      };
      articles[articleIndex] = finalArticleData;
    } else {
      const newId = slugify(data.title_en) + '-' + Date.now(); 
      finalArticleData = {
        id: newId,
        slug: data.slug,
        title: { en: data.title_en, ru: data.title_ru, uz: data.title_uz },
        content: { en: data.content_en, ru: data.content_ru, uz: data.content_uz },
        isActive: data.isActive,
        useSharedImage: data.useSharedImage,
        sharedMainImage: data.useSharedImage ? data.sharedMainImage : undefined,
        mainImage_en: !data.useSharedImage ? data.mainImage_en : undefined,
        mainImage_ru: !data.useSharedImage ? data.mainImage_ru : undefined,
        mainImage_uz: !data.useSharedImage ? data.mainImage_uz : undefined,
        createdAt: now,
        updatedAt: now,
      };
      articles.push(finalArticleData);
    }

    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
    if(currentAdminUser?.email) {
        logAdminAction(currentAdminUser.email, articleAction + " (Simulated)", { articleId: finalArticleData.id, articleTitle: data.title_en});
    }
    toast({
      title: `${articleAction} (Simulated)`,
      description: `Article "${data.title_en}" has been ${isEditing ? 'updated' : 'created'}. Client-side only.`,
    });
    router.push("/admin/articles");
    router.refresh();
  };
  
  const locales: Locale[] = ['en', 'ru', 'uz'];

  if (!isClient) {
    return <div>Loading form...</div>; // Or a skeleton loader
  }

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Article" : "Add New Article"}</h1>
            {isEditing && <p className="text-muted-foreground text-sm">Editing article ID: {articleId}</p>}
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL Path)</Label>
                <Input id="slug" {...register("slug")} placeholder="e.g., what-is-soy-wax" />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
              
              <div className="space-y-2 flex items-center gap-3">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isActive">Active (Published)</Label>
                {errors.isActive && <p className="text-sm text-destructive">{errors.isActive.message}</p>}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="useSharedImage" className="flex items-center">
                  Use one image for all languages?
                  <Controller
                    name="useSharedImage"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="useSharedImage"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) { 
                            setValue("mainImage_en", "");
                            setValue("mainImage_ru", "");
                            setValue("mainImage_uz", "");
                          } else { 
                             setValue("sharedMainImage", "");
                          }
                          trigger(["sharedMainImage", "mainImage_en", "mainImage_ru", "mainImage_uz"]);
                        }}
                        className="ml-3"
                      />
                    )}
                  />
                </Label>
                {errors.useSharedImage && <p className="text-sm text-destructive">{errors.useSharedImage.message}</p>}
                {errors.sharedMainImage && watchedUseSharedImage && <p className="text-sm text-destructive">{errors.sharedMainImage.message}</p>}
              </div>

              {watchedUseSharedImage && (
                <div className="space-y-2">
                  <Label htmlFor="sharedMainImage">Shared Main Image</Label>
                  <Controller
                    name="sharedMainImage"
                    control={control}
                    render={({ field }) => (
                      <ImageUploadArea
                        initialImageUrls={field.value ? [field.value] : []}
                        onImagesChange={(newImageUrls) => {
                           setValue("sharedMainImage", newImageUrls[0] || "", { shouldValidate: true });
                        }}
                        maxFiles={1}
                      />
                    )}
                  />
                  {/* Error for sharedMainImage handled above with useSharedImage error */}
                </div>
              )}

              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  {locales.map(loc => (
                    <TabsTrigger key={loc} value={loc}>{loc.toUpperCase()}</TabsTrigger>
                  ))}
                </TabsList>
                {locales.map(loc => (
                  <TabsContent key={loc} value={loc} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title_${loc}`}>Title ({loc.toUpperCase()})</Label>
                      <Input id={`title_${loc}`} {...register(`title_${loc}` as `title_${Locale}`)} />
                      {errors[`title_${loc}` as `title_${Locale}`] && <p className="text-sm text-destructive">{errors[`title_${loc}` as `title_${Locale}`]?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`content_${loc}`}>Content ({loc.toUpperCase()})</Label>
                      <Textarea id={`content_${loc}`} {...register(`content_${loc}` as `content_${Locale}`)} rows={10} />
                      {errors[`content_${loc}` as `content_${Locale}`] && <p className="text-sm text-destructive">{errors[`content_${loc}` as `content_${Locale}`]?.message}</p>}
                    </div>
                    {!watchedUseSharedImage && (
                       <div className="space-y-2">
                         <Label htmlFor={`mainImage_${loc}`}>Main Image ({loc.toUpperCase()})</Label>
                         <Controller
                           name={`mainImage_${loc}` as `mainImage_${Locale}`}
                           control={control}
                           render={({ field }) => (
                             <ImageUploadArea
                               initialImageUrls={field.value ? [field.value] : []}
                               onImagesChange={(newImageUrls) => {
                                 setValue(`mainImage_${loc}` as `mainImage_${Locale}`, newImageUrls[0] || "", { shouldValidate: true });
                               }}
                               maxFiles={1}
                             />
                           )}
                         />
                         {errors[`mainImage_${loc}` as `mainImage_${Locale}`] && <p className="text-sm text-destructive">{errors[`mainImage_${loc}` as `mainImage_${Locale}`]?.message}</p>}
                       </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : (isEditing ? "Update Article" : "Create Article")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </FormProvider>
  );
}

