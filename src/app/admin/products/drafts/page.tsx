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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { 
  Trash2, 
  PlusCircle, 
  Edit3, 
  Upload, 
  X, 
  Power, 
  PowerOff, 
  Eye, 
  EyeOff, 
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { useLocalPreferences } from '@/hooks/use-preferences';
import type enAdminMessages from '@/admin/dictionaries/en.json';
import Link from 'next/link';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOCAL_STORAGE_KEY_DRAFTS = "askimAdminDraftProducts";
type ManageProductsDict = typeof enAdminMessages.adminProductsPage;

interface ProductTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
  description?: string;
  shortDescription?: string;
}

interface DraftProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  categoryId: string;
  materialIds: string[];
  scentIds: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  translations: ProductTranslation[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending_review' | 'needs_changes';
  notes?: string;
  reviewNotes?: string;
}

export default function ProductDraftsPage() {
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dictionary, setDictionary] = useState<ManageProductsDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<any>(null);
  const { preferences } = useLocalPreferences();
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftProduct | null>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending_review' | 'needs_changes'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Form states
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductComparePrice, setNewProductComparePrice] = useState<number | undefined>();
  const [newProductWeight, setNewProductWeight] = useState<number | undefined>();
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductActive, setNewProductActive] = useState(true);
  const [newProductFeatured, setNewProductFeatured] = useState(false);
  const [newProductStockQuantity, setNewProductStockQuantity] = useState(0);
  const [newProductLowStockThreshold, setNewProductLowStockThreshold] = useState(5);
  const [newProductTranslations, setNewProductTranslations] = useState<ProductTranslation[]>([
    { locale: 'ru', name: '', description: '', shortDescription: '' },
    { locale: 'en', name: '', description: '', shortDescription: '' },
    { locale: 'uz', name: '', description: '', shortDescription: '' }
  ]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftStatus, setDraftStatus] = useState<'draft' | 'pending_review' | 'needs_changes'>('draft');
  
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    loadDrafts();
    loadDictionary();
  }, []);

  useEffect(() => {
    if (isClient) {
      loadDictionary();
    }
  }, [preferences.language, isClient]);

  const loadDictionary = async () => {
    try {
      const locale = (preferences.language as AdminLocale) || 'en';
      const dict = await getAdminDictionary(locale);
      setDictionary(dict.adminProductsPage);
      setAlertStrings({
        deleteTitle: dict.common.deleteTitle,
        deleteDescription: dict.common.deleteDescription,
        cancel: dict.common.cancel,
        delete: dict.common.delete,
        statusChangeTitle: dict.common.statusChangeTitle,
        statusChangeDescription: dict.common.statusChangeDescription,
        confirm: dict.common.confirm,
        editCancelTitle: dict.common.editCancelTitle,
        editCancelDescription: dict.common.editCancelDescription,
        discardChanges: dict.common.discardChanges,
        continueEditing: dict.common.continueEditing
      });
    } catch (error) {
      console.error('Error loading dictionary:', error);
    }
  };

  const loadDrafts = () => {
    try {
      const savedDrafts = localStorage.getItem(LOCAL_STORAGE_KEY_DRAFTS);
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        setDraftProducts(drafts);
      } else {
        // Initialize with some sample drafts
        const sampleDrafts: DraftProduct[] = [
          {
            id: 'draft-1',
            name: 'Lavender Dreams Candle',
            slug: 'lavender-dreams-candle',
            description: 'A soothing lavender scented candle perfect for relaxation',
            shortDescription: 'Relaxing lavender candle',
            price: 25.99,
            comparePrice: 29.99,
            sku: 'LAV-001',
            barcode: '1234567890123',
            weight: 300,
            dimensions: { length: 8, width: 8, height: 10 },
            images: ['/images/candles/lavender-1.jpg'],
            categoryId: 'cat-1',
            materialIds: ['mat-1'],
            scentIds: ['scent-1'],
            tags: ['relaxation', 'lavender', 'aromatherapy'],
            isActive: true,
            isFeatured: false,
            stockQuantity: 50,
            lowStockThreshold: 10,
            translations: [
              { locale: 'ru', name: 'Свеча Лавандовые Мечты', description: 'Успокаивающая лавандовая свеча для релаксации', shortDescription: 'Расслабляющая лавандовая свеча' },
              { locale: 'en', name: 'Lavender Dreams Candle', description: 'A soothing lavender scented candle perfect for relaxation', shortDescription: 'Relaxing lavender candle' },
              { locale: 'uz', name: 'Lavanda Orzulari Sham', description: 'Dam olish uchun tinchlashtiruvchi lavanda hidli sham', shortDescription: 'Dam beruvchi lavanda sham' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            notes: 'Need to finalize product images and pricing'
          },
          {
            id: 'draft-2',
            name: 'Vanilla Bliss Candle',
            slug: 'vanilla-bliss-candle',
            description: 'Sweet vanilla scented candle with warm undertones',
            shortDescription: 'Sweet vanilla candle',
            price: 22.99,
            sku: 'VAN-001',
            weight: 280,
            images: ['/images/candles/vanilla-1.jpg'],
            categoryId: 'cat-1',
            materialIds: ['mat-1'],
            scentIds: ['scent-2'],
            tags: ['vanilla', 'sweet', 'cozy'],
            isActive: true,
            isFeatured: true,
            stockQuantity: 30,
            lowStockThreshold: 5,
            translations: [
              { locale: 'ru', name: 'Свеча Ванильное Блаженство', description: 'Сладкая ванильная свеча с теплыми нотками', shortDescription: 'Сладкая ванильная свеча' },
              { locale: 'en', name: 'Vanilla Bliss Candle', description: 'Sweet vanilla scented candle with warm undertones', shortDescription: 'Sweet vanilla candle' },
              { locale: 'uz', name: 'Vanil Baxt Sham', description: 'Issiq notalari bilan shirin vanil hidli sham', shortDescription: 'Shirin vanil sham' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending_review',
            notes: 'Ready for review - all details completed'
          }
        ];
        setDraftProducts(sampleDrafts);
        localStorage.setItem(LOCAL_STORAGE_KEY_DRAFTS, JSON.stringify(sampleDrafts));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDrafts = (drafts: DraftProduct[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
      setDraftProducts(drafts);
    } catch (error) {
      console.error('Error saving drafts:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить черновики",
        variant: "destructive",
      });
    }
  };

  const filteredDrafts = draftProducts.filter(draft => {
    const matchesStatus = filterStatus === 'all' || draft.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      draft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || draft.categoryId === filterCategory;
    
    return matchesStatus && matchesSearch && matchesCategory;
  });

  const handleSelectDraft = (draftId: string, checked: boolean) => {
    if (checked) {
      setSelectedDrafts(prev => [...prev, draftId]);
    } else {
      setSelectedDrafts(prev => prev.filter(id => id !== draftId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrafts(filteredDrafts.map(draft => draft.id));
    } else {
      setSelectedDrafts([]);
    }
  };

  const handleDeleteSelected = () => {
    const updatedDrafts = draftProducts.filter(draft => !selectedDrafts.includes(draft.id));
    saveDrafts(updatedDrafts);
    setSelectedDrafts([]);
    toast({
      title: "Черновики удалены",
      description: `Удалено ${selectedDrafts.length} черновиков`,
    });
  };

  const handlePublishSelected = () => {
    setPendingPublish(selectedDrafts);
    setIsPublishConfirmOpen(true);
  };

  const confirmPublish = () => {
    // Here you would typically send the drafts to your API
    const updatedDrafts = draftProducts.filter(draft => !pendingPublish.includes(draft.id));
    saveDrafts(updatedDrafts);
    setSelectedDrafts([]);
    setPendingPublish([]);
    setIsPublishConfirmOpen(false);
    toast({
      title: "Товары опубликованы",
      description: `Опубликовано ${pendingPublish.length} товаров`,
    });
  };

  const handleStatusChange = (draftId: string, newStatus: 'draft' | 'pending_review' | 'needs_changes') => {
    const updatedDrafts = draftProducts.map(draft => 
      draft.id === draftId 
        ? { ...draft, status: newStatus, updatedAt: new Date().toISOString() }
        : draft
    );
    saveDrafts(updatedDrafts);
    toast({
      title: "Статус изменен",
      description: `Статус товара изменен на ${getStatusLabel(newStatus)}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'pending_review':
        return <Clock className="h-4 w-4" />;
      case 'needs_changes':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_changes':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик';
      case 'pending_review':
        return 'На рассмотрении';
      case 'needs_changes':
        return 'Требует изменений';
      default:
        return 'Неизвестно';
    }
  };

  if (!isClient) {
    return <AdminTableSkeleton />;
  }

  if (loading) {
    return <AdminTableSkeleton />;
  }

  if (!dictionary || !alertStrings) {
    return <AdminTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к товарам
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Черновики товаров</h1>
            <p className="text-muted-foreground">
              Управление черновиками товаров перед публикацией
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/products/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Новый товар
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего черновиков</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Черновики</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftProducts.filter(d => d.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На рассмотрении</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftProducts.filter(d => d.status === 'pending_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Требует изменений</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftProducts.filter(d => d.status === 'needs_changes').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, SKU или тегам..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="draft">Черновики</SelectItem>
                  <SelectItem value="pending_review">На рассмотрении</SelectItem>
                  <SelectItem value="needs_changes">Требует изменений</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedDrafts.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Выбрано: {selectedDrafts.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublishSelected}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Опубликовать
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{alertStrings.deleteTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы уверены, что хотите удалить {selectedDrafts.length} выбранных черновиков? Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{alertStrings.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                        {alertStrings.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDrafts.length === filteredDrafts.length && filteredDrafts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Обновлен</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || filterStatus !== 'all' 
                            ? 'Черновики не найдены по заданным критериям'
                            : 'Нет черновиков товаров'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDrafts.includes(draft.id)}
                          onCheckedChange={(checked) => handleSelectDraft(draft.id, checked === true)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {draft.images.length > 0 ? (
                            <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                              <Image
                                src={draft.images[0]}
                                alt={draft.name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{draft.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {draft.shortDescription}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{draft.sku}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">${draft.price}</span>
                          {draft.comparePrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${draft.comparePrice}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={draft.status}
                          onValueChange={(value: any) => handleStatusChange(draft.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(draft.status)}
                              <span>{getStatusLabel(draft.status)}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Черновик</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="pending_review">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>На рассмотрении</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="needs_changes">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>Требует изменений</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(draft.updatedAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDraft(draft);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPendingPublish([draft.id]);
                              setIsPublishConfirmOpen(true);
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Опубликовать товары</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите опубликовать {pendingPublish.length} выбранных товаров? 
              Они станут доступны для покупателей.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPublish([])}>
              {alertStrings.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} className="bg-green-600 hover:bg-green-700">
              Опубликовать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Draft Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать черновик</DialogTitle>
            <DialogDescription>
              Внесите изменения в черновик товара
            </DialogDescription>
          </DialogHeader>
          
          {editingDraft && (
            <div className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Основное</TabsTrigger>
                  <TabsTrigger value="pricing">Цены</TabsTrigger>
                  <TabsTrigger value="inventory">Склад</TabsTrigger>
                  <TabsTrigger value="notes">Заметки</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name-ru">Название (RU)</Label>
                      <Input
                        id="edit-name-ru"
                        value={editingDraft.translations.find(t => t.locale === 'ru')?.name || ''}
                        onChange={(e) => {
                          const updatedTranslations = editingDraft.translations.map(t => 
                            t.locale === 'ru' ? { ...t, name: e.target.value } : t
                          );
                          setEditingDraft({ ...editingDraft, translations: updatedTranslations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sku">SKU</Label>
                      <Input
                        id="edit-sku"
                        value={editingDraft.sku}
                        onChange={(e) => setEditingDraft({ ...editingDraft, sku: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description-ru">Описание (RU)</Label>
                    <Textarea
                      id="edit-description-ru"
                      value={editingDraft.translations.find(t => t.locale === 'ru')?.description || ''}
                      onChange={(e) => {
                        const updatedTranslations = editingDraft.translations.map(t => 
                          t.locale === 'ru' ? { ...t, description: e.target.value } : t
                        );
                        setEditingDraft({ ...editingDraft, translations: updatedTranslations });
                      }}
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Цена</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        value={editingDraft.price}
                        onChange={(e) => setEditingDraft({ ...editingDraft, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-compare-price">Цена для сравнения</Label>
                      <Input
                        id="edit-compare-price"
                        type="number"
                        step="0.01"
                        value={editingDraft.comparePrice || ''}
                        onChange={(e) => setEditingDraft({ 
                          ...editingDraft, 
                          comparePrice: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="inventory" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-stock">Количество на складе</Label>
                      <Input
                        id="edit-stock"
                        type="number"
                        value={editingDraft.stockQuantity}
                        onChange={(e) => setEditingDraft({ 
                          ...editingDraft, 
                          stockQuantity: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-low-stock">Порог низкого остатка</Label>
                      <Input
                        id="edit-low-stock"
                        type="number"
                        value={editingDraft.lowStockThreshold}
                        onChange={(e) => setEditingDraft({ 
                          ...editingDraft, 
                          lowStockThreshold: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-active"
                        checked={editingDraft.isActive}
                        onCheckedChange={(checked) => setEditingDraft({ ...editingDraft, isActive: checked })}
                      />
                      <Label htmlFor="edit-active">Активный</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-featured"
                        checked={editingDraft.isFeatured}
                        onCheckedChange={(checked) => setEditingDraft({ ...editingDraft, isFeatured: checked })}
                      />
                      <Label htmlFor="edit-featured">Рекомендуемый</Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Заметки</Label>
                    <Textarea
                      id="edit-notes"
                      value={editingDraft.notes || ''}
                      onChange={(e) => setEditingDraft({ ...editingDraft, notes: e.target.value })}
                      rows={4}
                      placeholder="Добавьте заметки к черновику..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Статус</Label>
                    <Select
                      value={editingDraft.status}
                      onValueChange={(value: any) => setEditingDraft({ ...editingDraft, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="pending_review">На рассмотрении</SelectItem>
                        <SelectItem value="needs_changes">Требует изменений</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => {
              if (editingDraft) {
                const updatedDrafts = draftProducts.map(draft => 
                  draft.id === editingDraft.id 
                    ? { ...editingDraft, updatedAt: new Date().toISOString() }
                    : draft
                );
                saveDrafts(updatedDrafts);
                setIsEditDialogOpen(false);
                setEditingDraft(null);
                toast({
                  title: "Черновик обновлен",
                  description: "Изменения сохранены",
                });
              }
            }}>
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
