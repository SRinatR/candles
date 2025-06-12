
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentAdminUser } = useAdminAuth();
  const [adminLocale, setAdminLocale] = useState<AdminLocale>('en');
  const [dict, setDict] = useState<AdminProductsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

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
  }, []);

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

  const handleDeleteProduct = (productId: string, productNameObj: Product['name']) => {
    if (!dict) return;
    const productName = productNameObj[adminLocale] || productNameObj.en;
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (currentAdminUser?.email && dict) {
      logAdminAction(currentAdminUser.email, dict.logProductDeleted, { productId, productName });
    }
    toast({
      title: dict.deleteSuccessTitle,
      description: `${dict.deleteSuccessDescPrefix}${productName}${dict.deleteSuccessDescSuffix.replace('{productId}', productId)}`,
    });
  };

  const toggleProductStatus = (productId: string) => {
    if (!dict) return;
    let productName = "Product";
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (product.id === productId) {
          productName = product.name[adminLocale] || product.name.en;
          const newStatus = !product.isActive;
          if (currentAdminUser?.email && dict) {
            const logAction = newStatus ? dict.logProductActivated : dict.logProductDeactivated;
            logAdminAction(currentAdminUser.email, logAction, { productId: product.id, productName });
          }
          toast({
            title: dict.statusChangeSuccessTitle,
            description: `${dict.statusChangeDescPrefix}${productName}${newStatus ? dict.statusChangeDescSuffixActive : dict.statusChangeDescSuffixInactive}`,
          });
          return { ...product, isActive: newStatus };
        }
        return product;
      })
    );
  };

  if (!isClient || !dict) {
    return <div>Loading products...</div>; // Or a skeleton loader
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
                    <TableHead className="w-[40px] px-2">{dict.idHeader}</TableHead>
                    <TableHead className="w-[50px] px-2">{dict.imageHeader}</TableHead>
                    <TableHead className="w-[70px] px-2">{dict.skuHeader}</TableHead>
                    <TableHead className="min-w-[140px] px-2">{dict.nameHeader.replace('{locale}', adminLocale.toUpperCase())}</TableHead>
                    <TableHead className="w-[110px] px-2">{dict.categoryHeader}</TableHead>
                    <TableHead className="text-right w-[80px] px-2">{dict.priceHeader}</TableHead>
                    <TableHead className="text-right w-[80px] px-2">{dict.costPriceHeader}</TableHead>
                    <TableHead className="text-center w-[50px] px-2">{dict.stockHeader}</TableHead>
                    <TableHead className="text-center w-[100px] px-2">{dict.statusHeader}</TableHead>
                    <TableHead className="text-center w-[130px] px-2">{dict.actionsHeader}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-xs align-top px-2">{product.id}</TableCell>
                      <TableCell className="align-top px-2">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                          <Image
                            src={product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/100x100.png?text=No+Image")}
                            alt={product.name[adminLocale] || product.name.en || 'Product Image'}
                            fill
                            sizes="40px"
                            className="object-cover"
                            data-ai-hint="product thumbnail"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs align-top px-2">{product.sku || '-'}</TableCell>
                      <TableCell className="font-medium align-top whitespace-normal px-2">{product.name[adminLocale] || product.name.en}</TableCell>
                      <TableCell className="align-top px-2">{product.category}</TableCell>
                      <TableCell className="text-right align-top px-2">{product.price.toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-right align-top px-2">{product.costPrice?.toLocaleString('en-US') || '-'}</TableCell>
                      <TableCell className="text-center align-top px-2">{product.stock}</TableCell>
                      <TableCell className="text-center align-top px-2">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Switch
                            id={`status-${product.id}`}
                            checked={product.isActive}
                            onCheckedChange={() => toggleProductStatus(product.id)}
                            aria-label={product.isActive ? dict.deactivateAction : dict.activateAction}
                          />
                          <Badge variant={product.isActive ? "secondary" : "outline"} className="text-xs">
                            {product.isActive ? dict.statusActive : dict.statusInactive}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-top px-2">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                            <Button variant="outline" size="sm" asChild className="h-7 px-2 py-1 text-xs" title={`${dict.editAction} ${product.name[adminLocale] || product.name.en}`}>
                            <Link href={`/admin/products/edit/${product.id}`}>
                                <Edit3 className="mr-1 h-3 w-3" /> {dict.editButton}
                            </Link>
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 py-1 text-xs"
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
