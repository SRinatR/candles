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
  AlertCircle
} from "lucide-react";
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
import { useLocalPreferences } from '@/hooks/use-preferences';
import type enAdminMessages from '@/admin/dictionaries/en.json';
import Link from 'next/link';

const LOCAL_STORAGE_KEY_DRAFTS = "askimAdminDraftCategories";
type ManageCategoriesDict = typeof enAdminMessages.adminManageCategoriesPage;

interface CategoryTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
  description?: string;
}

interface DraftCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  translations: CategoryTranslation[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending_review' | 'needs_changes';
  notes?: string;
}

export default function CategoryDraftsPage() {
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [dictionary, setDictionary] = useState<ManageCategoriesDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<any>(null);
  const { preferences } = useLocalPreferences();
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftCategory | null>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending_review' | 'needs_changes'>('all');
  
  // Form states
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [newCategoryActive, setNewCategoryActive] = useState(true);
  const [newCategoryTranslations, setNewCategoryTranslations] = useState<CategoryTranslation[]>([
    { locale: 'ru', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
    { locale: 'uz', name: '', description: '' }
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftStatus, setDraftStatus] = useState<'draft' | 'pending_review' | 'needs_changes'>('draft');
  
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    loadDrafts();
    loadDictionary();
  }, []);

  useEffect(() => {
    loadDictionary();
  }, [preferences.language]);

  const loadDictionary = async () => {
    try {
      const locale = (preferences.language as AdminLocale) || 'en';
      const dict = await getAdminDictionary(locale);
      setDictionary(dict.adminManageCategoriesPage);
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
        setDraftCategories(drafts);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDrafts = (drafts: DraftCategory[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
    setDraftCategories(drafts);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setNewCategoryImage(result);
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
    
    if (locale === 'en' && field === 'name') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      setNewCategorySlug(slug);
    }
  };

  const handleSaveDraft = () => {
    const ruTranslation = newCategoryTranslations.find(t => t.locale === 'ru');
    if (!ruTranslation?.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Название на русском языке обязательно для драфта.",
        variant: "destructive"
      });
      return;
    }

    const newDraft: DraftCategory = {
      id: editingDraft?.id || Date.now().toString(),
      name: ruTranslation.name,
      slug: newCategorySlug || ruTranslation.name.toLowerCase().replace(/\s+/g, '-'),
      description: ruTranslation.description,
      image: newCategoryImage,
      isActive: newCategoryActive,
      translations: newCategoryTranslations,
      createdAt: editingDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: draftStatus,
      notes: draftNotes
    };

    const updatedDrafts = editingDraft 
      ? draftCategories.map(d => d.id === editingDraft.id ? newDraft : d)
      : [...draftCategories, newDraft];

    saveDrafts(updatedDrafts);
    
    toast({
      title: editingDraft ? "Драфт обновлен" : "Драфт сохранен",
      description: `Драфт категории "${newDraft.name}" успешно ${editingDraft ? 'обновлен' : 'сохранен'}.`
    });

    handleCloseDialog();
  };

  const handleEditDraft = (draft: DraftCategory) => {
    setEditingDraft(draft);
    setNewCategorySlug(draft.slug);
    setNewCategoryImage(draft.image || '');
    setNewCategoryActive(draft.isActive);
    setNewCategoryTranslations(draft.translations);
    setImagePreview(draft.image || '');
    setDraftNotes(draft.notes || '');
    setDraftStatus(draft.status);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = draftCategories.filter(d => d.id !== draftId);
    saveDrafts(updatedDrafts);
    toast({
      title: "Драфт удален",
      description: "Драфт категории был успешно удален."
    });
  };

  const handlePublishDrafts = () => {
    const draftsToPublish = draftCategories.filter(d => selectedDrafts.includes(d.id));
    
    // Здесь должна быть логика публикации в основную систему
    // Пока просто удаляем из драфтов
    const remainingDrafts = draftCategories.filter(d => !selectedDrafts.includes(d.id));
    saveDrafts(remainingDrafts);
    
    toast({
      title: "Драфты опубликованы",
      description: `${draftsToPublish.length} категорий успешно опубликованы.`
    });
    
    setSelectedDrafts([]);
    setIsPublishConfirmOpen(false);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setEditingDraft(null);
    setNewCategorySlug("");
    setNewCategoryImage("");
    setNewCategoryActive(true);
    setNewCategoryTranslations([
      { locale: 'ru', name: '', description: '' },
      { locale: 'en', name: '', description: '' },
      { locale: 'uz', name: '', description: '' }
    ]);
    removeImage();
    setDraftNotes('');
    setDraftStatus('draft');
  };

  const toggleDraftSelection = (draftId: string) => {
    setSelectedDrafts(prev => 
      prev.includes(draftId) 
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    );
  };

  const toggleSelectAll = () => {
    const filteredDrafts = getFilteredDrafts();
    if (selectedDrafts.length === filteredDrafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(filteredDrafts.map(d => d.id));
    }
  };

  const getFilteredDrafts = () => {
    if (filterStatus === 'all') return draftCategories;
    return draftCategories.filter(d => d.status === filterStatus);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'pending_review': return <Clock className="h-4 w-4" />;
      case 'needs_changes': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'needs_changes': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Драфт';
      case 'pending_review': return 'На рассмотрении';
      case 'needs_changes': return 'Требует изменений';
      default: return 'Драфт';
    }
  };

  if (!isClient || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Category Drafts" />;
  }

  const filteredDrafts = getFilteredDrafts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/attributes/categories">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к категориям
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Драфты категорий</h1>
            <p className="text-muted-foreground">Управление черновиками категорий</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedDrafts.length > 0 && (
            <Button 
              onClick={() => {
                setPendingPublish(selectedDrafts);
                setIsPublishConfirmOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Опубликовать ({selectedDrafts.length})
            </Button>
          )}
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Создать драфт
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label>Статус:</Label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="all">Все</option>
                <option value="draft">Драфт</option>
                <option value="pending_review">На рассмотрении</option>
                <option value="needs_changes">Требует изменений</option>
              </select>
            </div>
            
            {filteredDrafts.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedDrafts.length === filteredDrafts.length}
                  onCheckedChange={toggleSelectAll}
                />
                <Label>Выбрать все ({filteredDrafts.length})</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drafts List */}
      <Card>
        <CardHeader>
          <CardTitle>Драфты категорий ({filteredDrafts.length})</CardTitle>
          <CardDescription>
            Здесь отображаются все черновики категорий. Вы можете редактировать их перед публикацией.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет драфтов</h3>
              <p className="text-muted-foreground mb-4">
                {filterStatus === 'all' 
                  ? 'У вас пока нет сохраненных драфтов категорий.'
                  : `Нет драфтов со статусом "${getStatusText(filterStatus)}".`
                }
              </p>
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Создать первый драфт
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrafts.map(draft => (
                <div key={draft.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedDrafts.includes(draft.id)}
                      onCheckedChange={() => toggleDraftSelection(draft.id)}
                    />
                    
                    {draft.image && (
                      <img 
                        src={draft.image} 
                        alt={draft.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{draft.name}</h3>
                        <Badge className={`${getStatusColor(draft.status)} flex items-center space-x-1`}>
                          {getStatusIcon(draft.status)}
                          <span>{getStatusText(draft.status)}</span>
                        </Badge>
                      </div>
                      
                      {draft.description && (
                        <p className="text-sm text-muted-foreground mb-1">{draft.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Slug: {draft.slug}</span>
                        <span>Создан: {new Date(draft.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>Обновлен: {new Date(draft.updatedAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                      
                      {draft.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Заметки: {draft.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDraft(draft)}
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
                            Вы уверены, что хотите удалить драфт "{draft.name}"? Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="bg-red-600 hover:bg-red-700"
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

      {/* Edit/Create Draft Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDraft ? 'Редактировать драфт' : 'Создать новый драфт'}
            </DialogTitle>
            <DialogDescription>
              {editingDraft ? 'Внесите изменения в драфт категории.' : 'Создайте новый драфт категории.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Изображение категории</Label>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="draftImageUpload"
                />
                <Label
                  htmlFor="draftImageUpload"
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

            {/* Translations */}
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
            
            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="draftSlug">Slug (URL) - автоматически сгенерирован</Label>
              <Input
                id="draftSlug"
                value={newCategorySlug}
                readOnly
                placeholder="category-slug"
                className="bg-gray-50 text-gray-600"
              />
            </div>
            
            {/* Status and Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус драфта</Label>
                <select 
                  value={draftStatus} 
                  onChange={(e) => setDraftStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="draft">Драфт</option>
                  <option value="pending_review">На рассмотрении</option>
                  <option value="needs_changes">Требует изменений</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Активность при публикации</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newCategoryActive}
                    onCheckedChange={setNewCategoryActive}
                  />
                  <span className="text-sm">{newCategoryActive ? 'Активна' : 'Неактивна'}</span>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label>Заметки (необязательно)</Label>
              <Textarea
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Добавьте заметки к драфту..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Отмена
            </Button>
            <Button onClick={handleSaveDraft}>
              <FileText className="mr-2 h-4 w-4" />
              {editingDraft ? 'Обновить драфт' : 'Сохранить драфт'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите публикацию</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите опубликовать {pendingPublish.length} выбранных драфтов? 
              Они будут добавлены в основной список категорий и удалены из драфтов.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingPublish([]);
              setIsPublishConfirmOpen(false);
            }}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePublishDrafts}
              className="bg-green-600 hover:bg-green-700"
            >
              Опубликовать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
