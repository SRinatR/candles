
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Upload, X, FileText, Eye, EyeOff } from "lucide-react";
import Link from 'next/link';
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';

interface CategoryTranslation {
  locale: string;
  name: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  translations: CategoryTranslation[];
}

type AlertDialogStrings = {
  deleteTitle: string;
  deleteDescription: string;
  cancel: string;
  delete: string;
  statusChangeTitle: string;
  statusChangeDescription: string;
  confirm: string;
  editCancelTitle: string;
  editCancelDescription: string;
  discardChanges: string;
  continueEditing: string;
};

export default function AdminManageCategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dictionary, setDictionary] = useState<any>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryTranslations, setNewCategoryTranslations] = useState<CategoryTranslation[]>([
    { locale: 'ru', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
    { locale: 'uz', name: '', description: '' }
  ]);
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{categoryId: string, isActive: boolean} | null>(null);
  const [isEditCancelDialogOpen, setIsEditCancelDialogOpen] = useState(false);
  const [pendingEditCategory, setPendingEditCategory] = useState<Category | null>(null);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        // API возвращает объект с полем categories
        const categories = data.categories || [];
        setAllCategories(categories);
        localStorage.setItem('categories', JSON.stringify(categories));
      } else {
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
          setAllCategories(JSON.parse(storedCategories));
        } else {
          setAllCategories([]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        setAllCategories(JSON.parse(storedCategories));
      } else {
        setAllCategories([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    async function loadDictionary() {
      const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
      const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
      
      const fullDict = await getAdminDictionary(localeToLoad);
      setDictionary(fullDict.adminManageCategoriesPage);
      setAlertStrings({
        deleteTitle: fullDict.common.deleteTitle,
        deleteDescription: fullDict.common.deleteDescription,
        cancel: fullDict.common.cancel,
        delete: fullDict.common.delete,
        statusChangeTitle: fullDict.common.statusChangeTitle,
        statusChangeDescription: fullDict.common.statusChangeDescription,
        confirm: fullDict.common.confirm,
        editCancelTitle: fullDict.common.editCancelTitle,
        editCancelDescription: fullDict.common.editCancelDescription,
        discardChanges: fullDict.common.discardChanges,
        continueEditing: fullDict.common.continueEditing
      });
    }
    
    async function initializeComponent() {
      await loadDictionary();
      fetchCategories();
    }
    
    initializeComponent();
  }, [fetchCategories]);

  const checkIfCategoryInUse = useCallback((categoryName: string) => {
    // Mock implementation - in real app, check if category has products
    const mockProductsWithCategories = [
      { id: '1', category: 'Ароматические свечи' },
      { id: '2', category: 'Декоративные свечи' },
    ];
    return mockProductsWithCategories.some(product => product.category === categoryName);
  }, []);

  const getCategoryProductCount = useCallback((categoryName: string) => {
    // Mock implementation - in real app, count products in category
    const mockProductsWithCategories = [
      { id: '1', category: 'Ароматические свечи' },
      { id: '2', category: 'Декоративные свечи' },
      { id: '3', category: 'Ароматические свечи' },
    ];
    return mockProductsWithCategories.filter(product => product.category === categoryName).length;
  }, []);

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setAllCategories(prev => {
          const updated = prev.map(cat => 
            cat.id === categoryId 
              ? { ...cat, isActive: !currentStatus }
              : cat
          );
          localStorage.setItem('categories', JSON.stringify(updated));
          return updated;
        });
        
        toast({
          title: "Успешно",
          description: `Категория ${!currentStatus ? 'активирована' : 'деактивирована'}.`,
        });
      } else {
        throw new Error('Failed to update category status');
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус категории.",
        variant: "destructive"
      });
    }
  };

  const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите изображение.",
          variant: "destructive"
        });
        return;
      }

      try {
        const resizedImage = await resizeImage(file);
        setNewCategoryImage(resizedImage);
        setImagePreview(resizedImage);
        
        toast({
          title: "Успешно",
          description: "Изображение загружено и оптимизировано.",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось обработать изображение.",
          variant: "destructive"
        });
      }
    }
  };

  const removeImage = () => {
    setNewCategoryImage(null);
    setImagePreview(null);
  };

  const updateTranslation = (locale: 'en' | 'ru' | 'uz', field: 'name' | 'description', value: string) => {
    setNewCategoryTranslations(prev => 
      prev.map(t => 
        t.locale === locale 
          ? { ...t, [field]: value }
          : t
      )
    );
    
    // Auto-generate slug from English name
    if (locale === 'en' && field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setNewCategorySlug(slug);
    }
  };

  const handleAddOrUpdateAttribute = async () => {
    const missingFields = [];
    
    // Проверяем обязательные поля
    const hasRussianName = newCategoryTranslations.find(t => t.locale === 'ru')?.name.trim();
    const hasEnglishName = newCategoryTranslations.find(t => t.locale === 'en')?.name.trim();
    const hasUzbekName = newCategoryTranslations.find(t => t.locale === 'uz')?.name.trim();
    
    if (!hasRussianName) missingFields.push('Название на русском языке');
    if (!hasEnglishName) missingFields.push('Название на английском языке');
    if (!hasUzbekName) missingFields.push('Название на узбекском языке');
    
    if (!newCategorySlug.trim()) {
      missingFields.push('URL slug');
    }
    
    // Проверяем описания
    const hasRussianDesc = newCategoryTranslations.find(t => t.locale === 'ru')?.description.trim();
    const hasEnglishDesc = newCategoryTranslations.find(t => t.locale === 'en')?.description.trim();
    const hasUzbekDesc = newCategoryTranslations.find(t => t.locale === 'uz')?.description.trim();
    
    if (!hasRussianDesc) missingFields.push('Описание на русском языке');
    if (!hasEnglishDesc) missingFields.push('Описание на английском языке');
    if (!hasUzbekDesc) missingFields.push('Описание на узбекском языке');
    
    if (missingFields.length > 0) {
      const message = `Необходимо заполнить следующие поля:\n\n${missingFields.map(field => `• ${field}`).join('\n')}`;
      setValidationMessage(message);
      setIsValidationDialogOpen(true);
      return;
    }
    
    const validTranslations = newCategoryTranslations.filter(t => t.name.trim() !== '');
    
    const englishTranslation = validTranslations.find(t => t.locale === 'en');
    const categoryName = englishTranslation ? englishTranslation.name.trim() : validTranslations[0].name.trim();
    
    if (!categoryName) {
      toast({
        title: "Ошибка валидации",
        description: "Название категории обязательно.",
        variant: "destructive"
      });
      return;
    }
    
    let categorySlug = newCategorySlug.trim();
    
    // Автоматически генерируем slug, если он не заполнен
    if (!categorySlug) {
      categorySlug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    
    // Check for duplicate category names (excluding current category if editing)
    const existingCategory = allCategories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase() && 
      (!editingCategory || cat.id !== editingCategory.id)
    );
    
    if (existingCategory) {
      toast({
        title: "Ошибка",
        description: "Категория с таким названием уже существует.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const categoryData = {
        name: categoryName,
        slug: categorySlug,
        image: newCategoryImage || null,
        isActive: true,
        translations: validTranslations
      };
      
      let response;
      if (editingCategory) {
        // Update existing category
        response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });
      } else {
        // Create new category
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Успешно",
          description: editingCategory 
            ? "Категория успешно обновлена." 
            : "Категория успешно создана.",
        });
        
        // Refresh categories
        await fetchCategories();
        
        // Close dialogs and reset form
        handleCloseDialogs();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить категорию.",
        variant: "destructive"
      });
    }
  };

  const handleInitiateEdit = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`);
      if (response.ok) {
        const categoryData = await response.json();
        
        if (categoryData) {
          setEditingCategory(categoryData);
          
          // Set up translations
          const locales = ['ru', 'en', 'uz'];
          if (categoryData.translations && categoryData.translations.length > 0) {
            // Use existing translations
            const formattedTranslations = locales.map(locale => {
              const existing = categoryData.translations.find((t: { locale: string }) => t.locale === locale);
              return {
                locale,
                name: existing?.name || '',
                description: existing?.description || ''
              };
            });
            setNewCategoryTranslations(formattedTranslations);
          } else {
            // Fallback to category name for all locales
            const fallbackTranslations = locales.map(locale => ({
              locale,
              name: categoryData.name || '',
              description: categoryData.description || ''
            }));
            setNewCategoryTranslations(fallbackTranslations);
          }
          
          setNewCategorySlug(categoryData.slug || '');
          setNewCategoryImage(categoryData.image || null);
          setImagePreview(categoryData.image || null);
          
          setIsEditDialogOpen(true);
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные категории.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить категорию для редактирования.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading category for edit:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке категории.",
        variant: "destructive"
      });
    }
  };

  const handleOpenAddDialog = () => {
    setNewCategoryTranslations([
      { locale: 'ru', name: '', description: '' },
      { locale: 'en', name: '', description: '' },
      { locale: 'uz', name: '', description: '' }
    ]);
    setNewCategorySlug('');
    setNewCategoryImage(null);
    setImagePreview(null);
    setEditingCategory(null);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setIsSaveConfirmOpen(false);
  };

  const handleCancelEdit = () => {
    const hasChanges = newCategoryTranslations.some(t => t.name.trim() !== '' || t.description.trim() !== '') ||
                      newCategorySlug.trim() !== '' ||
                      newCategoryImage !== null;
    
    if (hasChanges) {
      setPendingEditCategory(editingCategory);
      setIsEditCancelDialogOpen(true);
    } else {
      handleCloseDialogs();
    }
  };

  const handleDeleteAttribute = async (categoryName: string) => {
    try {
      // Find the category to delete
      const categoryToDelete = allCategories.find(cat => cat.name === categoryName);
      
      if (categoryToDelete) {
        const deleteResponse = await fetch(`/api/categories/${categoryToDelete.id}`, {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          throw new Error(errorData.message || 'Failed to delete category');
        }
        
        // Update local state
        const updatedCategories = allCategories.filter(cat => cat.id !== categoryToDelete.id);
        setAllCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        toast({ 
          title: "Успешно", 
          description: "Категория успешно удалена." 
        });
        
        // Refresh categories from server
        await fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ 
        title: "Ошибка", 
        description: error instanceof Error ? error.message : "Не удалось удалить категорию.", 
        variant: "destructive" 
      });
    }
  };

  // Отладочная информация для диагностики
  if (!isClient || !dictionary || !alertStrings || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Categories Management" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
          <p className="text-muted-foreground">Управление категориями товаров</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/admin/attributes/categories/drafts">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Драфты
            </Button>
          </Link>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (open) {
              handleOpenAddDialog();
            } else {
              setIsAddDialogOpen(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Добавить категорию
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить новую категорию</DialogTitle>
                <DialogDescription>
                  Создайте новую категорию для ваших товаров.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Загрузка изображения */}
                <div className="space-y-2">
                  <Label>Изображение категории</Label>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <Label
                      htmlFor="imageUpload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                              e.preventDefault();
                              removeImage();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">Нажмите для загрузки изображения</p>
                        </div>
                      )}
                    </Label>
                  </div>
                </div>

                {/* Переводы */}
                <div className="space-y-4">
                  <Label>Переводы</Label>
                  <Tabs defaultValue="ru" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="ru">Русский</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="uz">O'zbek</TabsTrigger>
                    </TabsList>
                    
                    {(['ru', 'en', 'uz'] as const).map((locale) => {
                      const translation = newCategoryTranslations.find(t => t.locale === locale);
                      return (
                        <TabsContent key={locale} value={locale} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Название на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                            <Input
                              value={translation?.name || ''}
                              onChange={(e) => updateTranslation(locale, 'name', e.target.value)}
                              placeholder={`Введите название на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Описание на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                            <Textarea
                              value={translation?.description || ''}
                              onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                              placeholder={`Введите описание на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                              rows={3}
                            />
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </div>

                {/* URL Slug */}
                <div className="space-y-2">
                  <Label htmlFor="categorySlugAdd">URL Slug</Label>
                  <Input
                    id="categorySlugAdd"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="category-url-slug"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialogs}>
                  Отмена
                </Button>
                <Button onClick={() => setIsSaveConfirmOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Модальное окно редактирования */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать категорию</DialogTitle>
              <DialogDescription>
                Измените данные категории.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Основные поля */}
              {/* Загрузка изображения */}
              <div className="space-y-2">
                <Label>Изображение категории</Label>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUploadEdit"
                  />
                  <Label
                    htmlFor="imageUploadEdit"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.preventDefault();
                            removeImage();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Нажмите для загрузки изображения</p>
                      </div>
                    )}
                  </Label>
                </div>
              </div>

              {/* Переводы */}
              <div className="space-y-4">
                <Label>Переводы</Label>
                <Tabs defaultValue="ru" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ru">Русский</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="uz">O'zbek</TabsTrigger>
                  </TabsList>
                  
                  {(['ru', 'en', 'uz'] as const).map((locale) => {
                    const translation = newCategoryTranslations.find(t => t.locale === locale);
                    return (
                      <TabsContent key={locale} value={locale} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Название на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                          <Input
                            value={translation?.name || ''}
                            onChange={(e) => updateTranslation(locale, 'name', e.target.value)}
                            placeholder={`Введите название на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Описание на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                          <Textarea
                            value={translation?.description || ''}
                            onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                            placeholder={`Введите описание на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                            rows={3}
                          />
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <Label htmlFor="categorySlugEdit">URL Slug</Label>
                <Input
                  id="categorySlugEdit"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  placeholder="category-url-slug"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Отмена
              </Button>
              <Button onClick={() => setIsSaveConfirmOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Таблица категорий */}
      <div className="rounded-md border">
        {allCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Категории не найдены. Добавьте первую категорию.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Изображение</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCategories.map(category => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.image && (
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    {category.description && (
                      <span className="text-sm text-muted-foreground">
                        {category.description.length > 50 
                          ? `${category.description.substring(0, 50)}...` 
                          : category.description
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) => {
                          setPendingStatusChange({
                            categoryId: category.id,
                            isActive: category.isActive
                          });
                          setIsStatusConfirmOpen(true);
                        }}
                      />
                      {category.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingEditCategory(category);
                          setIsEditConfirmOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoryToDelete(category.name);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={checkIfCategoryInUse(category.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {checkIfCategoryInUse(category.name) && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Используется в {getCategoryProductCount(category.name)} товарах
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Диалог подтверждения изменения статуса */}
      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите изменение статуса</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange?.isActive 
                ? 'Вы уверены, что хотите деактивировать эту категорию? Она станет недоступной для пользователей.' 
                : 'Вы уверены, что хотите активировать эту категорию? Она станет доступной для пользователей.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingStatusChange(null);
              setIsStatusConfirmOpen(false);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatusChange) {
                toggleCategoryStatus(pendingStatusChange.categoryId, pendingStatusChange.isActive);
                setPendingStatusChange(null);
              }
              setIsStatusConfirmOpen(false);
            }}>
              {pendingStatusChange?.isActive ? 'Деактивировать' : 'Активировать'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Модальное окно подтверждения редактирования */}
      <AlertDialog open={isEditConfirmOpen} onOpenChange={setIsEditConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите редактирование</AlertDialogTitle>
            <AlertDialogDescription>
              Вы хотите отредактировать категорию "{pendingEditCategory?.name}"? Откроется форма редактирования.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingEditCategory(null);
              setIsEditConfirmOpen(false);
            }}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingEditCategory) {
                handleInitiateEdit(pendingEditCategory);
                setPendingEditCategory(null);
              }
              setIsEditConfirmOpen(false);
            }}>
              Редактировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertStrings?.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertStrings?.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCategoryToDelete(null);
              setIsDeleteDialogOpen(false);
            }}>
              {alertStrings?.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (categoryToDelete) {
                handleDeleteAttribute(categoryToDelete);
                setCategoryToDelete(null);
                setIsDeleteDialogOpen(false);
              }
            }}>
              {alertStrings?.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог отмены редактирования */}
      <AlertDialog open={isEditCancelDialogOpen} onOpenChange={setIsEditCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingCategory 
                ? alertStrings?.editCancelTitle 
                : 'Отменить создание категории?'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingCategory 
                ? alertStrings?.editCancelDescription 
                : 'У вас есть несохраненные изменения. Вы уверены, что хотите отменить создание категории?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsEditCancelDialogOpen(false);
              setPendingEditCategory(null);
            }}>
              {editingCategory 
                ? alertStrings?.continueEditing 
                : 'Продолжить создание'
              }
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleCloseDialogs();
              setIsEditCancelDialogOpen(false);
              setPendingEditCategory(null);
            }}>
              {editingCategory 
                ? alertStrings?.discardChanges 
                : 'Отменить создание'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог валидации */}
      <AlertDialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ошибка валидации</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsValidationDialogOpen(false)}>
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения сохранения */}
      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingCategory ? 'Сохранить изменения?' : 'Создать категорию?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingCategory 
                ? 'Вы уверены, что хотите сохранить изменения в этой категории?' 
                : 'Вы уверены, что хотите создать новую категорию с указанными данными?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSaveConfirmOpen(false)}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsSaveConfirmOpen(false);
              handleAddOrUpdateAttribute();
            }}>
              {editingCategory ? 'Сохранить' : 'Создать'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { AdminManageCategoriesPage };
