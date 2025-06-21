"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Product } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Search, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import Image from "next/image";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { logAdminAction } from '@/admin/lib/admin-logger';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminProductsPageDict = typeof enAdminMessages.adminProductsPage;

export default function AdminProductsDraftsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser: currentAdminUser } = useUnifiedAuth();
  const [adminLocale, setAdminLocale] = useState<AdminLocale>('en');
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [productToPublish, setProductToPublish] = useState<number | null>(null);

  const fetchDraftProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?includeTranslations=true&draftsOnly=true');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Фильтруем только черновики
      const draftProducts = (data.products || []).filter((product: any) => product.isDraft);
      setProducts(draftProducts);
    } catch (error) {
      console.error('Ошибка загрузки черновиков:', error);
      if (dict) {
        toast({
          title: "Ошибка загрузки",
          description: error instanceof Error ? error.message : "Не удалось загрузить список черновиков",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchDraftProducts()}
            >
              Повторить
            </Button>
          )
        });
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    setAdminLocale(localeToLoad);

    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminProductsPage);
    }
    loadDictionary();
    
    fetchDraftProducts();
  }, []);

  // Отслеживание изменений языка в localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
      const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
      
      if (localeToLoad !== adminLocale) {
        setAdminLocale(localeToLoad);
        
        async function loadDictionary() {
          const fullDict = await getAdminDictionary(localeToLoad);
          setDict(fullDict.adminProductsPage);
        }
        loadDictionary();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const intervalId = setInterval(() => {
      handleStorageChange();
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [adminLocale]);

  const filteredProducts = useMemo(() => {
    if (!dict || !products) return [];
    return products.filter(product => {
        const nameInAdminLocale = product.name[adminLocale] || product.name.en || '';
        const category = product.category || '';
        const sku = product.sku || '';
        
        // Фильтр по поисковому запросу
        const searchMatch = searchTerm === '' || (
            nameInAdminLocale.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return searchMatch;
    });
  }, [products, searchTerm, adminLocale, dict]);

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!dict) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот черновик?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/products/drafts?id=${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении черновика');
      }
      
      await fetchDraftProducts();
      
      if (currentAdminUser?.email && dict) {
        logAdminAction({ 
          action: 'Черновик удален',
          details: JSON.stringify({ productId, productName, adminEmail: currentAdminUser.email })
        });
      }
      
      toast({
        title: "Черновик удален",
        description: `Черновик "${productName}" успешно удален`,
      });
    } catch (error) {
      console.error('Ошибка при удалении черновика:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить черновик",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateProductForPublication = (product: Product): string[] => {
    const errors: string[] = [];
    
    // Проверяем названия на всех языках
    if (!product.name?.en?.trim()) errors.push("Название на английском");
    if (!product.name?.ru?.trim()) errors.push("Название на русском");
    if (!product.name?.uz?.trim()) errors.push("Название на узбекском");
    
    // Проверяем описания на всех языках
    if (!product.description?.en?.trim()) errors.push("Описание на английском");
    if (!product.description?.ru?.trim()) errors.push("Описание на русском");
    if (!product.description?.uz?.trim()) errors.push("Описание на узбекском");
    
    // Проверяем обязательные поля
    if (!product.price || product.price <= 0) errors.push("Корректная цена");
    if (!product.category?.id) errors.push("Выбор категории");
    if (!product.images || product.images.length === 0) errors.push("Хотя бы одно изображение");
    if (product.stock === undefined || product.stock < 0) errors.push("Корректное количество на складе");
    if (!product.sku?.trim()) errors.push("SKU товара");
    
    return errors;
  };

  const handlePublishClick = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const errors = validateProductForPublication(product);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setProductToPublish(productId);
      setShowValidationDialog(true);
    } else {
      publishDraft(productId);
    }
  };

  const publishDraft = async (productId: number) => {
    if (!dict) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productName = product.name[adminLocale] || product.name.en;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/products/drafts?id=${productId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при публикации черновика');
      }
      
      // Обновляем список черновиков
      await fetchDraftProducts();
      
      if (currentAdminUser?.email && dict) {
        logAdminAction({ 
          action: 'Черновик опубликован',
          details: JSON.stringify({ productId, productName, adminEmail: currentAdminUser.email })
        });
      }
      
      toast({
        title: "Черновик опубликован",
        description: `Черновик "${productName}" успешно опубликован как товар`,
      });
    } catch (error) {
      console.error('Ошибка при публикации черновика:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось опубликовать черновик",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || !dict || loading) {
    return <AdminTableSkeleton rows={8} columns={6} title="Draft Products" />;
  }

  if (!dict) {
    return <AdminTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Назад к товарам
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Черновики товаров</h1>
          <p className="text-muted-foreground">
            Управление черновиками товаров - неопубликованные товары
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/draft">
            <PlusCircle className="mr-2 h-4 w-4" /> Создать новый товар
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список черновиков</CardTitle>
          <CardDescription>
            Найдено {filteredProducts.length} черновиков из {products.length} всего
          </CardDescription>
           <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, категории или SKU..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead className="px-2">ID</TableHead>
                    <TableHead className="px-2">Изображение</TableHead>
                    <TableHead className="px-2">SKU</TableHead>
                    <TableHead className="px-2">Название ({adminLocale.toUpperCase()})</TableHead>
                    <TableHead className="px-2">Категория</TableHead>
                    <TableHead className="text-right px-2">Цена</TableHead>
                    <TableHead className="text-right px-2">Себестоимость</TableHead>
                    <TableHead className="text-center px-2">Остаток</TableHead>
                    <TableHead className="text-center px-2">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="align-middle">
                      <TableCell className="text-xs text-center align-middle px-2 py-3">
                        <span className="font-mono text-gray-600">{product.id}</span>
                      </TableCell>
                      <TableCell className="align-middle px-2 py-3">
                        <div className="flex justify-center">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
                            {((product.mainImage && typeof product.mainImage === 'string' && product.mainImage.trim() !== '') || (product.images && product.images.length > 0 && product.images[0] && typeof product.images[0] === 'string')) ? (
                              <Image
                                src={
                                  (product.mainImage && typeof product.mainImage === 'string' && product.mainImage.trim() !== '') 
                                    ? product.mainImage 
                                    : product.images[0]
                                }
                                alt={product.name[adminLocale] || product.name.en || 'Product Image'}
                                width={48}
                                height={48}
                                sizes="48px"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No image</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center align-middle px-2 py-3">
                        <span className="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">{product.sku || '-'}</span>
                      </TableCell>
                      <TableCell className="font-medium align-middle px-2 py-3">
                        <div className="max-w-[200px]">
                          <span className="block truncate" title={product.name[adminLocale] || product.name.en}>
                            {product.name[adminLocale] || product.name.en}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle px-2 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {typeof product.category === 'object' ? (product.category[adminLocale] || product.category.en || 'Category') : product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right align-middle px-2 py-3">
                        <span className="font-semibold text-green-600">{product.price.toLocaleString('en-US')}</span>
                      </TableCell>
                      <TableCell className="text-right align-middle px-2 py-3">
                        <span className="font-medium text-gray-600">{product.costPrice?.toLocaleString('en-US') || '-'}</span>
                      </TableCell>
                      <TableCell className="text-center align-middle px-2 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          product.stock > 10 ? 'bg-green-100 text-green-800' : 
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center align-middle px-2 py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-8 px-3 py-1 text-xs min-w-[80px]" 
                              onClick={() => handlePublishClick(product.id)}
                              title={`Опубликовать черновик ${product.name[adminLocale] || product.name.en}`}
                            >
                              Опубликовать
                            </Button>
                            <Button variant="outline" size="sm" asChild className="h-8 px-3 py-1 text-xs min-w-[70px]" title={`Редактировать ${product.name[adminLocale] || product.name.en}`}>
                              <Link href={`/admin/products/edit/${product.id}`}>
                                <Edit3 className="mr-1 h-3 w-3" /> Изменить
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 py-1 text-xs min-w-[70px]"
                              onClick={() => handleDeleteProduct(product.id, product.name[adminLocale] || product.name.en)}
                              title={`Удалить черновик ${product.name[adminLocale] || product.name.en}`}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Удалить
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Черновики не найдены</p>
              <Button asChild>
                <Link href="/admin/products/draft">
                  <PlusCircle className="mr-2 h-4 w-4" /> Создать первый черновик
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
       <p className="text-sm text-muted-foreground text-center">
          Черновики - это неопубликованные товары, которые не отображаются в каталоге
        </p>
      
      {/* Модальное окно валидации */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Невозможно опубликовать черновик
            </AlertDialogTitle>
            <AlertDialogDescription>
              Для публикации товара необходимо заполнить следующие обязательные поля:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowValidationDialog(false);
              setValidationErrors([]);
              setProductToPublish(null);
            }}>
              Понятно
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowValidationDialog(false);
                  if (productToPublish) {
                    window.location.href = `/admin/products/edit/${productToPublish}`;
                  }
                }}
              >
                Редактировать товар
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}