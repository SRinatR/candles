
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PlusCircle, Edit3, Upload, X, Power, PowerOff, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockCategories } from '@/lib/mock-data';
import { mockProducts } from '@/lib/mock-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

const LOCAL_STORAGE_KEY_CATEGORIES = "askimAdminCustomCategories";
type ManageCategoriesDict = typeof enAdminMessages.adminManageCategoriesPage;

interface CategoryTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  productsCount?: number;
  translations?: CategoryTranslation[];
  createdAt?: string;
  updatedAt?: string;
}

type AlertDialogStrings = {
  confirmDeleteTitle: string;
  confirmDeleteCategoryInUse: string;
  confirmDeleteGeneral: string;
  confirmRenameTitle: string;
  confirmRenameAttributeInUse: string;
  cancelButton: string;
  deleteConfirmButton: string;
  updateButton: string; 
};

export default function AdminManageCategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [newCategoryActive, setNewCategoryActive] = useState(true);
  const [newCategoryTranslations, setNewCategoryTranslations] = useState<CategoryTranslation[]>([
    { locale: 'ru', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
    { locale: 'uz', name: '', description: '' }
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingAttributeName, setEditingAttributeName] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{id: string, isActive: boolean} | null>(null);
  const [pendingEditCategory, setPendingEditCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<ManageCategoriesDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setAllCategories(data.categories || []);
        localStorage.setItem('categories', JSON.stringify(data.categories || []));
      } else {
        // Fallback to localStorage if API fails
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
          setAllCategories(JSON.parse(storedCategories));
        } else {
          setAllCategories(mockCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to localStorage
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        setAllCategories(JSON.parse(storedCategories));
      } else {
        setAllCategories(mockCategories);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      const pageDict = fullDict.adminManageCategoriesPage;
      setDictionary(pageDict);
      setAlertStrings({
        confirmDeleteTitle: pageDict.confirmDeleteTitle || "Confirm Deletion",
        confirmDeleteCategoryInUse: pageDict.confirmDeleteCategoryInUse || "The category '{attributeName}' is currently used by one or more products. Deleting it means these products will no longer be associated with this category and may need to be updated manually. Are you sure you want to delete it?",
        confirmDeleteGeneral: pageDict.confirmDeleteGeneral || "Are you sure you want to delete the category \"{name}\"?",
        confirmRenameTitle: pageDict.confirmRenameTitle || "Confirm Rename",
        confirmRenameAttributeInUse: pageDict.confirmRenameAttributeInUse || "Renaming '{oldName}' to '{newName}'? Products currently using '{oldName}' will not be automatically updated with this new name and may need to be updated manually to reflect the change. Are you sure?",
        cancelButton: pageDict.cancelButton || "Cancel",
        deleteConfirmButton: pageDict.deleteConfirmButton || "Delete",
        updateButton: pageDict.updateButton || "Update Category"
      });
    }
    loadDictionary();
    
    fetchCategories();
  }, []);

  const checkIfCategoryInUse = useCallback((categoryName: string) => {
    // Mock data check - replace with actual API call
    const mockProducts = [
      { id: 1, category: 'Ароматические свечи' },
      { id: 2, category: 'Декоративные свечи' },
      { id: 3, category: 'Ароматические свечи' },
    ];
    
    return mockProducts.some(product => product.category === categoryName);
  }, []);

  const getCategoryProductCount = useCallback((categoryName: string) => {
    // Mock data check - replace with actual API call
    const mockProducts = [
      { id: 1, category: 'Ароматические свечи' },
      { id: 2, category: 'Декоративные свечи' },
      { id: 3, category: 'Ароматические свечи' },
    ];
    
    return mockProducts.filter(product => product.category === categoryName).length;
  }, []);

  const toggleCategoryStatus = async (categoryId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setAllCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId 
              ? { ...cat, isActive: !currentStatus }
              : cat
          )
        );
        
        // Update localStorage
        const updatedCategories = allCategories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, isActive: !currentStatus }
            : cat
        );
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        toast({
          title: "Статус обновлен",
          description: `Категория ${!currentStatus ? 'активирована' : 'деактивирована'}.`,
        });
      } else {
        throw new Error('Failed to update category status');
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус категории.",
        variant: "destructive",
      });
    }
  };

  const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        
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
        
        // Рисуем изображение с новыми размерами
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в base64
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите файл изображения.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        setImageFile(file);
        // Автоматически изменяем размер изображения
        const resizedImage = await resizeImage(file);
        setImagePreview(resizedImage);
        setNewCategoryImage(resizedImage);
        
        toast({
          title: "Успешно",
          description: "Изображение загружено и оптимизировано.",
        });
      } catch (error) {
        console.error('Error resizing image:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обработать изображение.",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setNewCategoryImage('');
  };

  const updateTranslation = (locale: 'en' | 'ru' | 'uz', field: 'name' | 'description', value: string) => {
    setNewCategoryTranslations(prev => 
      prev.map(t => t.locale === locale ? { ...t, [field]: value } : t)
    );
  };

  const handleAddOrUpdateAttribute = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Ошибка",
        description: "Название категории не может быть пустым.",
        variant: "destructive",
      });
      return;
    }

    if (!newCategorySlug.trim()) {
      toast({
        title: "Ошибка",
        description: "Slug категории не может быть пустым.",
        variant: "destructive",
      });
      return;
    }

    // Проверка на дублирование slug
    const existingCategory = allCategories.find(cat => 
      cat.slug === newCategorySlug && cat.id !== editingCategory?.id
    );
    
    if (existingCategory) {
      toast({
        title: "Ошибка",
        description: "Категория с таким slug уже существует.",
        variant: "destructive",
      });
      return;
    }

    // Валидация переводов
    const validTranslations = newCategoryTranslations.filter(t => t.name.trim() !== '');
    if (validTranslations.length === 0) {
      toast({
        title: "Ошибка",
        description: "Необходимо заполнить хотя бы один перевод.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName.trim(),
        slug: newCategorySlug.trim(),
        description: newCategoryDescription.trim() || undefined,
        image: newCategoryImage || undefined,
        isActive: newCategoryActive,
        translations: validTranslations
      };

      let response;
      if (editingCategory) {
        // Обновление существующей категории
        response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
      } else {
        // Создание новой категории
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Успех",
          description: editingCategory 
            ? "Категория успешно обновлена." 
            : "Категория успешно создана.",
        });

        // Обновить список категорий
        await fetchCategories();
        
        // Закрыть модальные окна и сбросить форму
        handleCloseDialogs();
        handleCancelEdit();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении категории');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить категорию.",
        variant: "destructive",
      });
    }
  };
  
  const handleInitiateEdit = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`);
      if (response.ok) {
        const data = await response.json();
        const categoryData = data.category;
        if (categoryData) {
          setNewCategoryName(categoryData.name);
          setNewCategorySlug(categoryData.slug);
          setNewCategoryDescription(categoryData.description || '');
          setNewCategoryImage(categoryData.image || '');
          setImagePreview(categoryData.image || '');
          setNewCategoryActive(categoryData.isActive ?? true);
          
          // Set translations
          if (categoryData.translations && categoryData.translations.length > 0) {
            const locales: ('ru' | 'en' | 'uz')[] = ['ru', 'en', 'uz'];
            const formattedTranslations = locales.map(locale => {
              const existing = categoryData.translations.find((t: { locale: string }) => t.locale === locale);
              return existing || { locale, name: '', description: '' };
            });
            setNewCategoryTranslations(formattedTranslations);
          } else {
            // Fallback translations if none exist
            setNewCategoryTranslations([
              { locale: 'ru', name: categoryData.name || '', description: categoryData.description || '' },
              { locale: 'en', name: '', description: '' },
              { locale: 'uz', name: '', description: '' }
            ]);
          }
          
          setEditingCategory(category);
          setEditingAttributeName(category.name);
          setIsEditDialogOpen(true);
        } else {
          // Fallback if no category data
          setNewCategoryName(category.name);
          setNewCategorySlug(category.slug || '');
          setNewCategoryDescription(category.description || '');
          setNewCategoryImage(category.image || '');
          setImagePreview(category.image || '');
          setNewCategoryActive(category.isActive ?? true);
          setNewCategoryTranslations([
            { locale: 'ru', name: category.name, description: category.description || '' },
            { locale: 'en', name: '', description: '' },
            { locale: 'uz', name: '', description: '' }
          ]);
          setEditingCategory(category);
          setEditingAttributeName(category.name);
          setIsEditDialogOpen(true);
        }
      } else {
        // Fallback if API call fails
        setNewCategoryName(category.name);
        setNewCategorySlug(category.slug || '');
        setNewCategoryDescription(category.description || '');
        setNewCategoryImage(category.image || '');
        setImagePreview(category.image || '');
        setNewCategoryActive(category.isActive ?? true);
        setNewCategoryTranslations([
          { locale: 'ru', name: category.name, description: category.description || '' },
          { locale: 'en', name: '', description: '' },
          { locale: 'uz', name: '', description: '' }
        ]);
        setEditingCategory(category);
        setEditingAttributeName(category.name);
        setIsEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching category for edit:', error);
      // Fallback if exception occurs
      setNewCategoryName(category.name);
      setNewCategorySlug(category.slug || '');
      setNewCategoryDescription(category.description || '');
      setNewCategoryImage(category.image || '');
      setImagePreview(category.image || '');
      setNewCategoryActive(category.isActive ?? true);
      setNewCategoryTranslations([
        { locale: 'ru', name: category.name, description: category.description || '' },
        { locale: 'en', name: '', description: '' },
        { locale: 'uz', name: '', description: '' }
      ]);
      setEditingCategory(category);
      setEditingAttributeName(category.name);
      setIsEditDialogOpen(true);
    }
  };

  const handleOpenAddDialog = () => {
    // Reset form
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryDescription('');
    setNewCategoryImage('');
    setImagePreview('');
    setNewCategoryActive(true);
    setNewCategoryTranslations([
      { locale: 'ru', name: '', description: '' },
      { locale: 'en', name: '', description: '' },
      { locale: 'uz', name: '', description: '' }
    ]);
    setEditingCategory(null);
    setEditingAttributeName(null);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setEditingAttributeName(null);
  };

  const handleCancelEdit = () => {
    setNewCategoryName("");
    setNewCategorySlug("");
    setNewCategoryDescription("");
    setNewCategoryImage("");
    setNewCategoryActive(true);
    setNewCategoryTranslations([
      { locale: 'ru', name: '', description: '' },
      { locale: 'en', name: '', description: '' },
      { locale: 'uz', name: '', description: '' }
    ]);
    removeImage();
    setEditingAttributeName(null);
  };

  const handleDeleteAttribute = async (categoryName: string) => {
    try {
      // Find the category by name
      const categoryToDelete = allCategories.find(cat => cat.name === categoryName);
      
      if (categoryToDelete) {
        // Delete category from database
        const deleteResponse = await fetch(`/api/categories/${categoryToDelete.id}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          throw new Error(errorData.error || 'Failed to delete category');
        }
        
        // Update local state and localStorage
        const updatedCategories = allCategories.filter(cat => cat.id !== categoryToDelete.id);
        setAllCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        toast({ 
          title: "Категория удалена", 
          description: `Категория "${categoryName}" была успешно удалена.`
        });
        
        // Refresh categories from API
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

  if (!isClient || !dictionary || !alertStrings || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Categories Management" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{typeof dictionary.title === 'object' ? (dictionary.title.ru || dictionary.title.en || dictionary.title.uz || 'Категории') : dictionary.title}</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
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
              {/* Основные поля */}
              <div className="space-y-2">
                <Label htmlFor="categorySlug">Slug (URL)</Label>
                <Input
                  id="categorySlug"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  placeholder="category-slug"
                />
              </div>

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
                <Label>Переводы на языки</Label>
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
                            placeholder={`Название категории на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Описание на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                          <Textarea
                            value={translation?.description || ''}
                            onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                            placeholder={`Описание категории на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                            rows={3}
                          />
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>
              Измените данные категории.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Основные поля */}
            <div className="space-y-2">
              <Label htmlFor="editCategorySlug">Slug (URL)</Label>
              <Input
                id="editCategorySlug"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>

            {/* Загрузка изображения */}
            <div className="space-y-2">
              <Label>Изображение категории</Label>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="editImageUpload"
                />
                <Label
                  htmlFor="editImageUpload"
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
              <Label>Переводы на языки</Label>
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
                          placeholder={`Название категории на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Описание на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                        <Textarea
                          value={translation?.description || ''}
                          onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                          placeholder={`Описание категории на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>
              Отмена
            </Button>
            <Button onClick={() => setIsSaveConfirmOpen(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{typeof dictionary.existingTitle === 'object' ? (dictionary.existingTitle.ru || dictionary.existingTitle.en || dictionary.existingTitle.uz || 'Категории') : dictionary.existingTitle}</CardTitle>
          <CardDescription>{typeof dictionary.existingDescription === 'object' ? (dictionary.existingDescription.ru || dictionary.existingDescription.en || dictionary.existingDescription.uz || '') : dictionary.existingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {allCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">{typeof dictionary.noCustomYet === 'object' ? (dictionary.noCustomYet.ru || dictionary.noCustomYet.en || dictionary.noCustomYet.uz || "No categories added yet.") : (dictionary.noCustomYet || "No categories added yet.")}</p>
          ) : (
            <div className="space-y-2">
              {allCategories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {category.image && (
                      <img 
                        src={category.image} 
                        alt={typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name}</h3>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Slug: {category.slug}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Товаров: {getCategoryProductCount(typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingStatusChange({id: category.id, isActive: category.isActive ?? false});
                        setIsStatusConfirmOpen(true);
                      }}
                      className={category.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                    >
                      {category.isActive ? (
                        <><EyeOff className="h-4 w-4" /></>
                      ) : (
                        <><Eye className="h-4 w-4" /></>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setPendingEditCategory(category);
                        setIsEditConfirmOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                          <AlertDialogDescription>
                            {checkIfCategoryInUse(typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name) 
                              ? `Категория "${typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name}" используется в товарах. Удаление может повлиять на отображение товаров.`
                              : `Вы уверены, что хотите удалить категорию "${typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name}"? Это действие нельзя отменить.`
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                             <AlertDialogCancel>Отмена</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => handleDeleteAttribute(typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name)}
                               className="bg-red-600 hover:bg-red-700"
                               disabled={checkIfCategoryInUse(typeof category.name === 'object' ? (category.name.ru || category.name.en || category.name.uz || 'Category') : category.name)}
                             >
                               Удалить
                             </AlertDialogAction>
                           </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно подтверждения изменения статуса */}
      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите изменение статуса</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange?.isActive 
                ? `Вы уверены, что хотите деактивировать категорию? Она станет недоступной для пользователей.`
                : `Вы уверены, что хотите активировать категорию? Она станет доступной для пользователей.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingStatusChange(null);
              setIsStatusConfirmOpen(false);
            }}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatusChange) {
                toggleCategoryStatus(pendingStatusChange.id, pendingStatusChange.isActive);
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
              Вы хотите отредактировать категорию "{typeof pendingEditCategory?.name === 'object' ? (pendingEditCategory.name.ru || pendingEditCategory.name.en || pendingEditCategory.name.uz || 'Category') : pendingEditCategory?.name}"? Откроется форма редактирования.
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

      {/* Модальное окно подтверждения сохранения */}
      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите сохранение</AlertDialogTitle>
            <AlertDialogDescription>
              {editingCategory 
                ? `Вы уверены, что хотите сохранить изменения в категории "${typeof editingCategory.name === 'object' ? (editingCategory.name.ru || editingCategory.name.en || editingCategory.name.uz || 'Category') : editingCategory.name}"?`
                : 'Вы уверены, что хотите создать новую категорию с указанными данными?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSaveConfirmOpen(false)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleAddOrUpdateAttribute();
              setIsSaveConfirmOpen(false);
            }}>
              {editingCategory ? 'Сохранить изменения' : 'Создать категорию'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
