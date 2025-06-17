
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
// import { mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import Image from "next/image";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { logAdminAction } from '@/admin/lib/admin-logger';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminProductsPageDict = typeof enAdminMessages.adminProductsPage;


export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentAdminUser } = useAdminAuth();
  const [adminLocale, setAdminLocale] = useState<AdminLocale>('en');
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?includeTranslations=true');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error);
      if (dict) {
        toast({
          title: "Ошибка загрузки",
          description: error instanceof Error ? error.message : "Не удалось загрузить список товаров",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchProducts()}
            >
              Повторить
            </Button>
          )
        });
      }
      setProducts([]); // Устанавливаем пустой массив при ошибке
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
    
    fetchProducts();
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

    // Слушаем изменения в localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Также проверяем изменения при фокусе на окне (для случаев изменения в том же окне)
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
        return (
            nameInAdminLocale.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
  }, [products, searchTerm, adminLocale, dict]);

  const handleDeleteProduct = async (productId: string, productNameObj: Product['name']) => {
    if (!dict) return;
    const productName = productNameObj[adminLocale] || productNameObj.en;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении товара');
      }
      
      // Удаляем товар из локального состояния только после успешного удаления на сервере
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      if (currentAdminUser?.email && dict) {
        logAdminAction(currentAdminUser.email, dict.logProductDeleted, { productId, productName });
      }
      
      toast({
        title: dict.deleteSuccessTitle,
        description: `${dict.deleteSuccessDescPrefix}${productName}${dict.deleteSuccessDescSuffix.replace('{productId}', productId)}`,
      });
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить товар",
        variant: "destructive"
      });
    }
  };

  const toggleProductStatus = async (productId: string) => {
    if (!dict) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productName = product.name[adminLocale] || product.name.en;
    const newStatus = !product.isActive;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении статуса товара');
      }
      
      // Обновляем локальное состояние только после успешного обновления на сервере
      setProducts(prevProducts =>
        prevProducts.map(p => 
          p.id === productId ? { ...p, isActive: newStatus } : p
        )
      );
      
      if (currentAdminUser?.email && dict) {
        const logAction = newStatus ? dict.logProductActivated : dict.logProductDeactivated;
        logAdminAction(currentAdminUser.email, logAction, { productId, productName });
      }
      
      toast({
        title: dict.statusChangeSuccessTitle,
        description: `${dict.statusChangeDescPrefix}${productName}${newStatus ? dict.statusChangeDescSuffixActive : dict.statusChangeDescSuffixInactive}`,
      });
    } catch (error) {
      console.error('Ошибка при изменении статуса товара:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось изменить статус товара",
        variant: "destructive"
      });
    }
  };

  if (!isClient || !dict || loading) {
    return <AdminTableSkeleton rows={8} columns={6} title="Products" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
          <p className="text-muted-foreground">
            {dict.description}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusCircle className="mr-2 h-4 w-4" /> {dict.addNewButton}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.listTitle}</CardTitle>
          <CardDescription>
            {dict.listDescription.replace('{count}', String(filteredProducts.length)).replace('{total}', String(products.length))}
          </CardDescription>
           <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={dict.searchPlaceholder}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto"> {/* This allows horizontal scroll if content overflows */}
              <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead className="px-2">{dict.idHeader}</TableHead>
                    <TableHead className="px-2">{dict.imageHeader}</TableHead>
                    <TableHead className="px-2">{dict.skuHeader}</TableHead>
                    <TableHead className="px-2">{dict.nameHeader.replace('{locale}', adminLocale.toUpperCase())}</TableHead>
                    <TableHead className="px-2">{dict.categoryHeader}</TableHead>
                    <TableHead className="text-right px-2">{dict.priceHeader}</TableHead>
                    <TableHead className="text-right px-2">{dict.costPriceHeader}</TableHead>
                    <TableHead className="text-center px-2">{dict.stockHeader}</TableHead>
                    <TableHead className="text-center px-2">{dict.statusHeader}</TableHead>
                    <TableHead className="text-center px-2">{dict.actionsHeader}</TableHead>
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
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-200 group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50">
                            <Image
                              src={product.mainImage || (product.images && product.images.length > 0 ? product.images[0]?.url : "https://placehold.co/100x100.png?text=No+Image")}
                              alt={product.name[adminLocale] || product.name.en || 'Product Image'}
                              width={48}
                              height={48}
                              sizes="48px"
                              className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
                              data-ai-hint="product thumbnail"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                            {/* Hover Preview - Large Size */}
                            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none transform group-hover:scale-100 scale-90">
                              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl shadow-2xl backdrop-blur-sm p-6 max-w-sm">
                                <div className="relative overflow-hidden rounded-xl bg-white shadow-inner">
                                  <Image
                                    src={product.mainImage || (product.images && product.images.length > 0 ? product.images[0]?.url : "https://placehold.co/100x100.png?text=No+Image")}
                                    alt={product.name[adminLocale] || product.name.en || 'Product Image Preview'}
                                    width={320}
                                    height={320}
                                    sizes="320px"
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="mt-4 text-center space-y-2">
                                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                                    <h3 className="text-base font-semibold text-gray-900 leading-tight">
                                      {product.name[adminLocale] || product.name.en}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        SKU: {product.sku || 'N/A'}
                                      </span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ID: {product.id}
                                      </span>
                                    </div>
                                    {product.category && (
                                      <p className="text-xs text-gray-600 mt-1 font-medium">
                                        {product.category}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
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
                          {product.category}
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
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Switch
                            id={`status-${product.id}`}
                            checked={product.isActive}
                            onCheckedChange={() => toggleProductStatus(product.id)}
                            aria-label={product.isActive ? dict.deactivateAction : dict.activateAction}
                          />
                          <Badge variant={product.isActive ? "secondary" : "outline"} className="text-xs px-2">
                            {product.isActive ? dict.statusActive : dict.statusInactive}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle px-2 py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <Button variant="outline" size="sm" asChild className="h-8 px-3 py-1 text-xs min-w-[70px]" title={`${dict.editAction} ${product.name[adminLocale] || product.name.en}`}>
                            <Link href={`/admin/products/edit/${product.id}`}>
                                <Edit3 className="mr-1 h-3 w-3" /> {dict.editButton}
                            </Link>
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 py-1 text-xs min-w-[70px]"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            title={`${dict.deleteAction} ${product.name[adminLocale] || product.name.en}`}
                            >
                            <Trash2 className="mr-1 h-3 w-3" /> {dict.deleteButton}
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">{dict.noProductsFound}</p>
          )}
        </CardContent>
      </Card>
       <p className="text-sm text-muted-foreground text-center">
          {dict.simulationNote}
        </p>
    </div>
  );
}
