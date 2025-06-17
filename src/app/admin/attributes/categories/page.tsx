
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PlusCircle, Edit3, Upload, X } from "lucide-react";
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
  isActive: boolean;
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
  const [allCategories, setAllCategories] = useState<string[]>([]);
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
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<ManageCategoriesDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?includeTranslations=true');
      if (response.ok) {
        const data = await response.json();
        const categoryNames = data.categories?.map((cat: any) => cat.name) || [];
        setAllCategories(categoryNames);
        localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categoryNames));
      } else {
        // Fallback to localStorage if API fails
        let storedCustomCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
        if (storedCustomCategories) {
          setAllCategories(JSON.parse(storedCustomCategories));
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to localStorage if API fails
      let storedCustomCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
      if (storedCustomCategories) {
        setAllCategories(JSON.parse(storedCustomCategories));
      }
    } finally {
      setLoading(false);
    }
  };

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

  const isAttributeInUse = useCallback((attributeName: string): boolean => {
    return mockProducts.some(product => product.category === attributeName);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
    // Проверка заполненности переводов
    const hasEmptyTranslations = newCategoryTranslations.some(t => !t.name.trim());
    if (hasEmptyTranslations) {
      toast({
        title: "Заполните названия на всех языках",
        variant: "destructive",
      });
      return;
    }

    if (!newCategorySlug.trim()) {
      toast({
        title: "Заполните slug категории",
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
        translations: newCategoryTranslations.filter(t => t.name.trim())
      };

      if (editingAttributeName) {
        // Обновление существующей категории
        const response = await fetch(`/api/categories/${editingAttributeName}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          throw new Error('Failed to update category');
        }

        const updatedCategory = await response.json();
        const updatedCategories = allCategories.map(cat => 
          cat === editingAttributeName ? updatedCategory.name : cat
        );
        setAllCategories(updatedCategories);
        localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
        
        toast({
          title: dictionary?.updateSuccessTitle || "Category Updated",
        });
      } else {
        // Создание новой категории
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          throw new Error('Failed to create category');
        }

        const newCategory = await response.json();
        const updatedCategories = [...allCategories, newCategory.name];
        setAllCategories(updatedCategories);
        localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
        
        toast({
          title: dictionary?.addSuccessTitle || "Category Added",
        });
      }

      // Сброс формы
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
      
      // Refresh categories from API
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      
      toast({
        title: "Ошибка при сохранении категории",
        variant: "destructive",
      });
    }
  };
  
  const handleInitiateEdit = async (categoryName: string) => {
    try {
      // Найти категорию в API данных
      const response = await fetch('/api/categories?includeTranslations=true');
      if (response.ok) {
        const categoriesData = await response.json();
        const category = categoriesData.categories?.find((cat: Category) => cat.name === categoryName);
        
        if (category) {
          setNewCategoryName(category.name);
          setNewCategorySlug(category.slug);
          setNewCategoryDescription(category.description || '');
          setNewCategoryImage(category.image || '');
          setNewCategoryActive(category.isActive);
          
          // Установить переводы или создать пустые
          const translations = category.translations || [];
          const locales: ('ru' | 'en' | 'uz')[] = ['ru', 'en', 'uz'];
          const formattedTranslations = locales.map(locale => {
            const existing = translations.find(t => t.locale === locale);
            return existing || { locale, name: '', description: '' };
          });
          
          setNewCategoryTranslations(formattedTranslations);
          setEditingAttributeName(category.id);
          
          if (category.image) {
            setImagePreview(category.image);
          }
        }
      }
    } catch (error) {
      console.error('Error loading category for edit:', error);
      // Fallback к простому редактированию
      setNewCategoryName(categoryName);
      setEditingAttributeName(categoryName);
    }
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

  const handleDeleteAttribute = async (attributeToDelete: string) => {
    if (!dictionary) return;
    
    try {
      // Find the category ID from the API data
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        const categoryToDelete = categoriesData.categories?.find((cat: any) => cat.name === attributeToDelete);
        
        if (categoryToDelete) {
          // Delete category from database
          const deleteResponse = await fetch(`/api/categories/${categoryToDelete.id}`, {
            method: 'DELETE',
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.error || 'Failed to delete category');
          }
        }
      }
      
      // Update local state and localStorage
      const updatedAttributes = allCategories.filter(attr => attr !== attributeToDelete);
      setAllCategories(updatedAttributes);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedAttributes));
      
      toast({ 
        title: dictionary?.deleteSuccessTitle || "Category Deleted", 
        description: (dictionary?.deleteSuccess || "'{name}' has been deleted.").replace('{name}', attributeToDelete) 
      });
      
      // Refresh categories from API
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete category.", 
        variant: "destructive" 
      });
    }
  };

  if (!isClient || !dictionary || !alertStrings || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Categories Management" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingAttributeName ? (dictionary.editExistingTitle || "Edit Category") : (dictionary.addNewTitle || "Add New Category")}</CardTitle>
          <CardDescription>{editingAttributeName ? (dictionary.editExistingDescription || "Modify the category details below.") : (dictionary.addNewDescription || "Create a new category for your products.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основные поля */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Основное название</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Название категории"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorySlug">Slug (URL)</Label>
              <Input
                id="categorySlug"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryDescription">Описание</Label>
            <Textarea
              id="categoryDescription"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Описание категории"
              rows={3}
            />
          </div>

          {/* Загрузка изображения */}
          <div className="space-y-2">
            <Label>Изображение категории</Label>
            <div className="flex items-center gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Или введите URL</Label>
                <Input
                  id="imageUrl"
                  value={newCategoryImage}
                  onChange={(e) => setNewCategoryImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
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

          {/* Статус активности */}
          <div className="flex items-center space-x-2">
            <Switch
              id="categoryActive"
              checked={newCategoryActive}
              onCheckedChange={setNewCategoryActive}
            />
            <Label htmlFor="categoryActive">Активная категория</Label>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button onClick={handleAddOrUpdateAttribute}>
              {editingAttributeName 
                ? <><Edit3 className="mr-2 h-4 w-4" /> {alertStrings.updateButton || "Update"}</> 
                : <><PlusCircle className="mr-2 h-4 w-4" /> {dictionary.addButton || "Add"}</>}
            </Button>
            {editingAttributeName && (
              <Button variant="outline" onClick={handleCancelEdit}>{alertStrings.cancelButton || "Cancel"}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.existingTitle}</CardTitle>
          <CardDescription>{dictionary.existingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {allCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dictionary.noCustomYet || "No categories added yet."}</p>
          ) : (
            <ul className="space-y-2">
              {allCategories.map(attr => (
                <li key={attr} className="flex items-center justify-between p-3 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                  <span>{attr}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleInitiateEdit(attr)} className="h-7 px-2 py-1 text-xs">
                      <Edit3 className="mr-1 h-3 w-3" /> {dictionary.editButton || "Edit"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 py-1 text-xs">
                          <Trash2 className="mr-1 h-3 w-3" /> {dictionary.deleteButton || "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{alertStrings.confirmDeleteTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isAttributeInUse(attr) 
                              ? alertStrings.confirmDeleteCategoryInUse.replace('{attributeName}', attr)
                              : alertStrings.confirmDeleteGeneral.replace('{name}', attr)
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{alertStrings.cancelButton}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAttribute(attr)} className="bg-destructive hover:bg-destructive/90">{alertStrings.deleteConfirmButton}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
       <p className="text-sm text-muted-foreground text-center">
        {dictionary.note}
      </p>
    </div>
  );
}
