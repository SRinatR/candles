
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PlusCircle, Edit3, Power, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

const LOCAL_STORAGE_KEY_SCENTS = "askimAdminCustomScents";
type ManageScentsDict = typeof enAdminMessages.adminManageScentsPage;

interface ScentTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
}

interface Scent {
  id: string;
  name: { en: string; ru: string; uz: string };
  isActive: boolean;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

type AlertDialogStrings = {
  confirmDeleteTitle: string;
  confirmDeleteScentInUse: string;
  confirmDeleteGeneral: string;
  confirmRenameTitle: string;
  confirmRenameAttributeInUse: string;
  cancelButton: string;
  deleteConfirmButton: string;
  updateButton: string;
};

export default function AdminManageScentsPage() {
  const [allScents, setAllScents] = useState<Scent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newScentName, setNewScentName] = useState("");
  const [newScentTranslations, setNewScentTranslations] = useState<ScentTranslation[]>([
    { locale: 'ru', name: '' },
    { locale: 'en', name: '' },
    { locale: 'uz', name: '' }
  ]);
  const [editingAttributeName, setEditingAttributeName] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScent, setEditingScent] = useState<Scent | null>(null);
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<ManageScentsDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      const pageDict = fullDict.adminManageScentsPage;
      setDictionary(pageDict);
      setAlertStrings({
        confirmDeleteTitle: pageDict.confirmDeleteTitle || "Confirm Deletion",
        confirmDeleteScentInUse: pageDict.confirmDeleteScentInUse || "The scent '{attributeName}' is currently used by one or more products. Deleting it means these products will no longer be associated with this scent and may need to be updated manually. Are you sure you want to delete it?",
        confirmDeleteGeneral: pageDict.confirmDeleteGeneral || "Are you sure you want to delete the scent \"{name}\"?",
        confirmRenameTitle: pageDict.confirmRenameTitle || "Confirm Rename",
        confirmRenameAttributeInUse: pageDict.confirmRenameAttributeInUse || "Renaming '{oldName}' to '{newName}'? Products currently using '{oldName}' will not be automatically updated with this new name and may need to be updated manually to reflect the change. Are you sure?",
        cancelButton: pageDict.cancelButton || "Cancel",
        deleteConfirmButton: pageDict.deleteConfirmButton || "Delete",
        updateButton: pageDict.updateButton || "Update Scent"
      });
    }
    loadDictionary();

    const fetchScents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/scents');
        if (response.ok) {
          const data = await response.json();
          const scents = data.scents || [];
          setAllScents(scents);
          localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(scents));
        } else {
          // Fallback to localStorage if API fails
          let storedCustomScents = localStorage.getItem(LOCAL_STORAGE_KEY_SCENTS);
          if (storedCustomScents) {
            const parsed = JSON.parse(storedCustomScents);
            // Проверяем, если это старый формат (массив строк), конвертируем
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              const converted = parsed.map((name: string, index: number) => ({
                id: `temp-${index}`,
                name,
                isActive: true
              }));
              setAllScents(converted);
            } else {
              setAllScents(parsed);
            }
          }
        }
      } catch (error) {
        console.error('Error loading scents:', error);
        // Fallback to localStorage if API fails
        let storedCustomScents = localStorage.getItem(LOCAL_STORAGE_KEY_SCENTS);
        if (storedCustomScents) {
          const parsed = JSON.parse(storedCustomScents);
          // Проверяем, если это старый формат (массив строк), конвертируем
          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            const converted = parsed.map((name: string, index: number) => ({
              id: `temp-${index}`,
              name,
              isActive: true
            }));
            setAllScents(converted);
          } else {
            setAllScents(parsed);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchScents();
  }, []);
  
  const updateScentTranslation = (locale: 'en' | 'ru' | 'uz', value: string) => {
    setNewScentTranslations(prev => 
      prev.map((t: ScentTranslation) => t.locale === locale ? { ...t, name: value } : t)
    );
  };

  const isAttributeInUse = useCallback((scent: Scent): boolean => {
    // Проверяем количество продуктов, связанных с ароматом
    return (scent.productsCount || 0) > 0;
  }, []);

  const toggleScentStatus = async (scent: Scent) => {
    try {
      const response = await fetch(`/api/scents/${scent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !scent.isActive
        }),
      });

      if (response.ok) {
        const updatedScent = await response.json();
        const updatedScents = allScents.map(s => 
          s.id === scent.id ? { ...s, isActive: !s.isActive } : s
        );
        setAllScents(updatedScents);
        localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
        const scentName = scent.name?.ru || scent.name?.en || scent.name?.uz || 'Scent';
        toast({ 
          title: scent.isActive ? "Аромат деактивирован" : "Аромат активирован", 
          description: `${scentName} ${scent.isActive ? 'деактивирован' : 'активирован'}` 
        });
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.error || "Failed to update scent status", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error toggling scent status:', error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleOpenAddDialog = () => {
    setNewScentTranslations([
      { locale: 'ru', name: '' },
      { locale: 'en', name: '' },
      { locale: 'uz', name: '' }
    ]);
    setEditingScent(null);
    setEditingAttributeName(null);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingScent(null);
    setEditingAttributeName(null);
    setNewScentTranslations([
      { locale: 'ru', name: '' },
      { locale: 'en', name: '' },
      { locale: 'uz', name: '' }
    ]);
  };

  const handleAddOrUpdateAttribute = async () => {
    // Проверка заполненности переводов
    const hasEmptyTranslations = newScentTranslations.some(t => !t.name.trim());
    if (hasEmptyTranslations) {
      toast({
        title: "Заполните названия на всех языках",
        variant: "destructive",
      });
      return;
    }

    // Используем русское название как основное
    const ruTranslation = newScentTranslations.find(t => t.locale === 'ru');
    const trimmedNewName = ruTranslation?.name.trim() || '';
    
    if (!trimmedNewName) {
      toast({ title: "Error", description: dictionary?.errorEmptyName || "Scent name cannot be empty.", variant: "destructive" });
      return;
    }

    const isDuplicate = allScents.some(
      (scent) => {
        const scentName = scent.name?.ru || scent.name?.en || scent.name?.uz || '';
        return scentName.toLowerCase() === trimmedNewName.toLowerCase() && scentName !== editingAttributeName;
      }
    );

    if (isDuplicate) {
      toast({ title: "Error", description: dictionary?.errorExists || "Scent with this name already exists.", variant: "destructive" });
      return;
    }

    try {
      const scentData = {
        name: trimmedNewName,
        translations: newScentTranslations.filter(t => t.name.trim())
      };

      if (editingAttributeName) {
        // Обновление существующего аромата
        const editingScent = allScents.find(s => s.name === editingAttributeName);
        if (!editingScent) return;
        
        const response = await fetch(`/api/scents/${editingScent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scentData),
        });

        if (!response.ok) {
          throw new Error('Failed to update scent');
        }

        const updatedScent = await response.json();
        
        // Create proper name object from translations
        const nameObject = {
          ru: newScentTranslations.find(t => t.locale === 'ru')?.name || '',
          en: newScentTranslations.find(t => t.locale === 'en')?.name || '',
          uz: newScentTranslations.find(t => t.locale === 'uz')?.name || ''
        };
        
        const updatedScents = allScents.map(scent => 
          scent.id === editingScent.id ? { ...scent, name: nameObject } : scent
        );
        setAllScents(updatedScents);
        localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
        
        toast({
          title: dictionary?.updateSuccessTitle || "Scent Updated",
        });
      } else {
        // Создание нового аромата
        const response = await fetch('/api/scents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...scentData, isActive: true }),
        });

        if (!response.ok) {
          throw new Error('Failed to create scent');
        }

        const newScent = await response.json();
        const updatedScents = [...allScents, newScent];
        setAllScents(updatedScents);
        localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
        
        toast({
          title: dictionary?.addSuccessTitle || "Scent Added",
        });
      }

      // Сброс формы и закрытие диалогов
      handleCloseDialogs();
    } catch (error) {
      console.error('Error saving scent:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить аромат",
        variant: "destructive",
      });
    }
  };
  
  const handleInitiateEdit = async (scent: Scent) => {
    try {
      // Попытка загрузить переводы с сервера
      const response = await fetch(`/api/scents/${scent.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.translations) {
          // Устанавливаем переводы из базы данных
          const translations = data.translations.reduce((acc: ScentTranslation[], t: { locale: string; name: string }) => {
            acc.push({ locale: t.locale as 'en' | 'ru' | 'uz', name: t.name });
            return acc;
          }, []);
          
          // Дополняем недостающие локали
          ['ru', 'en', 'uz'].forEach(locale => {
            if (!translations.find((t: ScentTranslation) => t.locale === locale)) {
              translations.push({ locale: locale as 'en' | 'ru' | 'uz', name: '' });
            }
          });
          
          setNewScentTranslations(translations);
          setEditingAttributeName(scent.name?.ru || scent.name?.en || scent.name?.uz || '');
          setEditingScent(scent);
          setIsEditDialogOpen(true);
        } else {
          // Fallback к простому редактированию
          const scentName = scent.name?.ru || scent.name?.en || scent.name?.uz || '';
          setNewScentName(scentName);
          setNewScentTranslations([
            { locale: 'ru', name: scent.name?.ru || '' },
            { locale: 'en', name: scent.name?.en || '' },
            { locale: 'uz', name: scent.name?.uz || '' }
          ]);
          setEditingAttributeName(scentName);
          setEditingScent(scent);
          setIsEditDialogOpen(true);
        }
      } else {
        // Fallback к простому редактированию
        const scentName = scent.name?.ru || scent.name?.en || scent.name?.uz || '';
        setNewScentName(scentName);
        setNewScentTranslations([
          { locale: 'ru', name: scent.name?.ru || '' },
          { locale: 'en', name: scent.name?.en || '' },
          { locale: 'uz', name: scent.name?.uz || '' }
        ]);
        setEditingAttributeName(scentName);
        setEditingScent(scent);
        setIsEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading scent for edit:', error);
      // Fallback к простому редактированию
      const scentName = scent.name?.ru || scent.name?.en || scent.name?.uz || '';
      setNewScentName(scentName);
      setNewScentTranslations([
        { locale: 'ru', name: scent.name?.ru || '' },
        { locale: 'en', name: '' },
        { locale: 'uz', name: '' }
      ]);
      setEditingAttributeName(scent.name?.ru || scent.name?.en || scent.name?.uz || '');
      setEditingScent(scent);
      setIsEditDialogOpen(true);
    }
  };

  const handleCancelEdit = () => {
    setNewScentName("");
    setNewScentTranslations([
      { locale: 'ru', name: '' },
      { locale: 'en', name: '' },
      { locale: 'uz', name: '' }
    ]);
    setEditingAttributeName(null);
  };

  const handleDeleteAttribute = async (scent: Scent) => {
    if (!dictionary) return;
    
    try {
      const response = await fetch(`/api/scents/${scent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedAttributes = allScents.filter(attr => attr.id !== scent.id);
        setAllScents(updatedAttributes);
        localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedAttributes));
        toast({ 
          title: dictionary?.deleteSuccessTitle || "Scent Deleted", 
          description: (dictionary?.deleteSuccess || "'{name}' has been deleted.").replace('{name}', scent.name?.ru || scent.name?.en || scent.name?.uz || 'Scent') 
        });
      } else {
        const errorData = await response.json();
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete scent", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error deleting scent:', error);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred", 
        variant: "destructive" 
      });
    }
  };
  
  if (!isClient || !dictionary || !alertStrings || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Scents Management" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добавить аромат
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить новый аромат</DialogTitle>
              <DialogDescription>
                Создайте новый вариант аромата для ваших товаров.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Название аромата</Label>
                <Tabs defaultValue="ru" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ru">Русский</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="uz">O'zbek</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ru">
                    <Input
                      type="text"
                      value={newScentTranslations.find(t => t.locale === 'ru')?.name || ''}
                      onChange={(e) => updateScentTranslation('ru', e.target.value)}
                      placeholder="Введите название аромата на русском"
                    />
                  </TabsContent>
                  <TabsContent value="en">
                    <Input
                      type="text"
                      value={newScentTranslations.find(t => t.locale === 'en')?.name || ''}
                      onChange={(e) => updateScentTranslation('en', e.target.value)}
                      placeholder="Enter scent name in English"
                    />
                  </TabsContent>
                  <TabsContent value="uz">
                    <Input
                      type="text"
                      value={newScentTranslations.find(t => t.locale === 'uz')?.name || ''}
                      onChange={(e) => updateScentTranslation('uz', e.target.value)}
                      placeholder="O'zbek tilida hid nomini kiriting"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialogs}>
                Отмена
              </Button>
              <Button onClick={handleAddOrUpdateAttribute}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать аромат</DialogTitle>
            <DialogDescription>
              Измените название аромата ниже.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название аромата</Label>
              <Tabs defaultValue="ru" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="uz">O'zbek</TabsTrigger>
                </TabsList>
                <TabsContent value="ru">
                  <Input
                    type="text"
                    value={newScentTranslations.find(t => t.locale === 'ru')?.name || ''}
                    onChange={(e) => updateScentTranslation('ru', e.target.value)}
                    placeholder="Введите название аромата на русском"
                  />
                </TabsContent>
                <TabsContent value="en">
                  <Input
                    type="text"
                    value={newScentTranslations.find(t => t.locale === 'en')?.name || ''}
                    onChange={(e) => updateScentTranslation('en', e.target.value)}
                    placeholder="Enter scent name in English"
                  />
                </TabsContent>
                <TabsContent value="uz">
                  <Input
                    type="text"
                    value={newScentTranslations.find(t => t.locale === 'uz')?.name || ''}
                    onChange={(e) => updateScentTranslation('uz', e.target.value)}
                    placeholder="O'zbek tilida hid nomini kiriting"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>
              Отмена
            </Button>
            <Button onClick={handleAddOrUpdateAttribute}>
              <Edit3 className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.existingTitle}</CardTitle>
          <CardDescription>{dictionary.existingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {allScents.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dictionary.noCustomYet || "No scents added yet."}</p>
          ) : (
            <ul className="space-y-2">
              {allScents.map(attr => (
                <li key={attr.id || (attr.name?.ru || attr.name?.en || attr.name?.uz || 'scent')} className="flex items-center justify-between p-3 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span>{attr.name?.ru || attr.name?.en || attr.name?.uz || 'Scent'}</span>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={attr.isActive}
                        onCheckedChange={() => toggleScentStatus(attr)}
                        className="h-4 w-6"
                      />
                      {attr.isActive ? (
                        <Power className="h-3 w-3 text-green-500" />
                      ) : (
                        <PowerOff className="h-3 w-3 text-gray-400" />
                      )}
                      <Badge variant={attr.isActive ? "default" : "secondary"} className="text-xs">
                        {attr.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {(attr.productsCount || 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {attr.productsCount} products
                        </Badge>
                      )}
                    </div>
                  </div>
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
                              ? alertStrings.confirmDeleteScentInUse.replace('{attributeName}', attr.name?.ru || attr.name?.en || attr.name?.uz || 'Scent')
                              : alertStrings.confirmDeleteGeneral.replace('{name}', attr.name?.ru || attr.name?.en || attr.name?.uz || 'Scent')
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

    </div>
  );
}
