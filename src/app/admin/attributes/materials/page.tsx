
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PlusCircle, Edit3, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from '@/lib/mock-data';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

const LOCAL_STORAGE_KEY_MATERIALS = "askimAdminCustomMaterials";
type ManageMaterialsDict = typeof enAdminMessages.adminManageMaterialsPage;

interface MaterialTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
}

interface Material {
  id: string;
  name: string;
  isActive: boolean;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

type AlertDialogStrings = {
  confirmDeleteTitle: string;
  confirmDeleteMaterialInUse: string;
  confirmDeleteGeneral: string;
  confirmRenameTitle: string;
  confirmRenameAttributeInUse: string;
  cancelButton: string;
  deleteConfirmButton: string;
  updateButton: string;
};

export default function AdminManageMaterialsPage() {
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialTranslations, setNewMaterialTranslations] = useState<MaterialTranslation[]>([
    { locale: 'ru', name: '' },
    { locale: 'en', name: '' },
    { locale: 'uz', name: '' }
  ]);
  const [editingAttributeName, setEditingAttributeName] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<ManageMaterialsDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      const pageDict = fullDict.adminManageMaterialsPage;
      setDictionary(pageDict);
      setAlertStrings({
        confirmDeleteTitle: pageDict.confirmDeleteTitle || "Confirm Deletion",
        confirmDeleteMaterialInUse: pageDict.confirmDeleteMaterialInUse || "The material '{attributeName}' is currently used by one or more products. Deleting it means these products will no longer be associated with this material and may need to be updated manually. Are you sure you want to delete it?",
        confirmDeleteGeneral: pageDict.confirmDeleteGeneral || "Are you sure you want to delete the material \"{name}\"?",
        confirmRenameTitle: pageDict.confirmRenameTitle || "Confirm Rename",
        confirmRenameAttributeInUse: pageDict.confirmRenameAttributeInUse || "Renaming '{oldName}' to '{newName}'? Products currently using '{oldName}' will not be automatically updated with this new name and may need to be updated manually to reflect the change. Are you sure?",
        cancelButton: pageDict.cancelButton || "Cancel",
        deleteConfirmButton: pageDict.deleteConfirmButton || "Delete",
        updateButton: pageDict.updateButton || "Update Material"
      });
    }
    loadDictionary();
    
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/materials');
        if (response.ok) {
          const data = await response.json();
          const materials = data.materials || [];
          setAllMaterials(materials);
          localStorage.setItem('materials', JSON.stringify(materials));
        } else {
          // Fallback to localStorage if API fails
          let storedCustomMaterials = localStorage.getItem('materials');
          if (storedCustomMaterials) {
            const parsed = JSON.parse(storedCustomMaterials);
            // Проверяем, если это старый формат (массив строк), конвертируем
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              const converted = parsed.map((name: string, index: number) => ({
                id: `temp-${index}`,
                name,
                isActive: true
              }));
              setAllMaterials(converted);
            } else {
              setAllMaterials(parsed);
            }
          }
        }
      } catch (error) {
        console.error('Error loading materials:', error);
        // Fallback to localStorage if API fails
        let storedCustomMaterials = localStorage.getItem('materials');
        if (storedCustomMaterials) {
          const parsed = JSON.parse(storedCustomMaterials);
          // Проверяем, если это старый формат (массив строк), конвертируем
          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            const converted = parsed.map((name: string, index: number) => ({
              id: `temp-${index}`,
              name,
              isActive: true
            }));
            setAllMaterials(converted);
          } else {
            setAllMaterials(parsed);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, []);

  const updateMaterialTranslation = (locale: 'en' | 'ru' | 'uz', value: string) => {
    setNewMaterialTranslations(prev => 
      prev.map(t => t.locale === locale ? { ...t, name: value } : t)
    );
  };

  const checkIfMaterialInUse = useCallback((materialName: string): boolean => {
    const material = allMaterials.find(m => m.name === materialName);
    return material ? (material.productsCount || 0) > 0 : false;
  }, [allMaterials]);

  const handleOpenAddDialog = () => {
    setNewMaterialName("");
    setNewMaterialTranslations([
      { locale: 'ru', name: '' },
      { locale: 'en', name: '' },
      { locale: 'uz', name: '' }
    ]);
    setEditingAttributeName(null);
    setEditingMaterial(null);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setNewMaterialName("");
    setNewMaterialTranslations([
      { locale: 'ru', name: '' },
      { locale: 'en', name: '' },
      { locale: 'uz', name: '' }
    ]);
    setEditingAttributeName(null);
    setEditingMaterial(null);
  };

  const toggleMaterialStatus = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...material,
          isActive: !material.isActive
        }),
      });

      if (response.ok) {
        const updatedMaterial = await response.json();
        setAllMaterials(prev => 
          prev.map(m => m.id === material.id ? updatedMaterial : m)
        );
        localStorage.setItem('materials', JSON.stringify(
          allMaterials.map(m => m.id === material.id ? updatedMaterial : m)
        ));
        toast({
          title: dictionary?.statusUpdated || "Status updated",
          description: `${material.name} ${!material.isActive ? dictionary?.activated || 'activated' : dictionary?.deactivated || 'deactivated'}`,
        });
      } else {
        throw new Error('Failed to update material status');
      }
    } catch (error) {
      console.error('Error updating material status:', error);
      toast({
        title: dictionary?.error || "Error",
        description: dictionary?.statusUpdateError || "Failed to update material status",
        variant: "destructive",
      });
    }
  };

  const handleAddOrUpdateAttribute = async () => {
    // Проверка заполненности переводов
    const hasEmptyTranslations = newMaterialTranslations.some(t => !t.name.trim());
    if (hasEmptyTranslations) {
      toast({
        title: "Заполните названия на всех языках",
        variant: "destructive",
      });
      return;
    }

    // Используем русское название как основное
    const ruTranslation = newMaterialTranslations.find(t => t.locale === 'ru');
    const trimmedNewName = ruTranslation?.name.trim() || '';
    
    if (!trimmedNewName) {
      toast({ title: "Error", description: dictionary?.errorEmptyName || "Material name cannot be empty.", variant: "destructive" });
      return;
    }

    const isDuplicate = allMaterials.some(
      (material) => material.name.toLowerCase() === trimmedNewName.toLowerCase() && material.name !== editingAttributeName
    );

    if (isDuplicate) {
      toast({ title: "Error", description: dictionary?.errorExists || "Material with this name already exists.", variant: "destructive" });
      return;
    }

    try {
      const materialData = {
        name: trimmedNewName,
        translations: newMaterialTranslations.filter(t => t.name.trim())
      };

      if (editingAttributeName) {
        // Обновление существующего материала
        const response = await fetch(`/api/materials/${editingAttributeName}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) {
          throw new Error('Failed to update material');
        }

        const updatedMaterial = await response.json();
        const updatedMaterials = allMaterials.map(mat => 
          mat.id === editingAttributeName ? updatedMaterial : mat
        );
        setAllMaterials(updatedMaterials);
        localStorage.setItem('materials', JSON.stringify(updatedMaterials));
        
        toast({
          title: dictionary?.updateSuccessTitle || "Material Updated",
        });
      } else {
        // Создание нового материала
        const response = await fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) {
          throw new Error('Failed to create material');
        }

        const newMaterial = await response.json();
        const updatedMaterials = [...allMaterials, newMaterial];
        setAllMaterials(updatedMaterials);
        localStorage.setItem('materials', JSON.stringify(updatedMaterials));
        
        toast({
          title: dictionary?.addSuccessTitle || "Material Added",
        });
      }

      // Закрытие модального окна и сброс формы
      handleCloseDialogs();
    } catch (error) {
      console.error('Error saving material:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить материал",
        variant: "destructive",
      });
    }
  };

  const handleInitiateEdit = async (material: Material) => {
    try {
      // Попытаться загрузить полные данные материала из API
      const response = await fetch(`/api/materials/${material.id}`);
      if (response.ok) {
        const data = await response.json();
        
        setNewMaterialName(data.name);
        
        // Установить переводы или создать пустые
        const translations = data.translations || [];
        const locales: ('ru' | 'en' | 'uz')[] = ['ru', 'en', 'uz'];
        const formattedTranslations = locales.map(locale => {
          const existing = translations.find((t: { locale: string }) => t.locale === locale);
          return existing || { locale, name: '' };
        });
        
        setNewMaterialTranslations(formattedTranslations);
        setEditingAttributeName(data.id);
        setEditingMaterial(material);
        setIsEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading material for edit:', error);
      // Fallback к простому редактированию
      setNewMaterialName(material.name);
      setNewMaterialTranslations([
        { locale: 'ru', name: material.name },
        { locale: 'en', name: '' },
        { locale: 'uz', name: '' }
      ]);
      setEditingAttributeName(material.id);
      setEditingMaterial(material);
      setIsEditDialogOpen(true);
    }
  };



  const handleDeleteAttribute = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedMaterials = allMaterials.filter(m => m.id !== material.id);
        setAllMaterials(updatedMaterials);
        localStorage.setItem('materials', JSON.stringify(updatedMaterials));
        toast({ 
          title: dictionary?.deleteSuccessTitle || "Material Deleted", 
          description: (dictionary?.deleteSuccess || "'{name}' has been deleted.").replace('{name}', material.name) 
        });
      } else {
        throw new Error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: dictionary?.error || "Error",
        description: dictionary?.deleteError || "Failed to delete material",
        variant: "destructive",
      });
    }
  };

  if (!isClient || !dictionary || !alertStrings || loading) {
    return <AdminTableSkeleton rows={8} columns={3} showActions={true} title="Materials Management" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {dictionary?.addButton || "Add Material"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.existingTitle}</CardTitle>
          <CardDescription>{dictionary.existingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {allMaterials.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dictionary.noCustomYet || "No materials added yet."}</p>
          ) : (
            <div className="space-y-2">
              {allMaterials.map(material => (
                <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={material.isActive}
                        onCheckedChange={() => toggleMaterialStatus(material)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      {material.isActive ? (
                        <Power className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{material.name}</span>
                      {material.productsCount !== undefined && (
                        <Badge variant="secondary" className="ml-2">
                          {material.productsCount} {dictionary?.productsUsing || 'products'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleInitiateEdit(material)}>
                      <Edit3 className="mr-1 h-3 w-3" /> {dictionary.editButton || "Edit"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={checkIfMaterialInUse(material.name)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> {dictionary.deleteButton || "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{alertStrings.confirmDeleteTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {checkIfMaterialInUse(material.name) 
                              ? alertStrings.confirmDeleteMaterialInUse.replace('{attributeName}', material.name)
                              : alertStrings.confirmDeleteGeneral.replace('{name}', material.name)
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{alertStrings.cancelButton}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteAttribute(material)} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={checkIfMaterialInUse(material.name)}
                          >
                            {alertStrings.deleteConfirmButton}
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

      {/* Add Material Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary?.addNewTitle || "Add New Material"}</DialogTitle>
            <DialogDescription>
              {dictionary?.addNewDescription || "Create a new material option for your products."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <Label>Переводы на языки</Label>
              <Tabs defaultValue="ru" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="uz">O'zbek</TabsTrigger>
                </TabsList>
                
                {(['ru', 'en', 'uz'] as const).map((locale) => {
                  const translation = newMaterialTranslations.find(t => t.locale === locale);
                  return (
                    <TabsContent key={locale} value={locale} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Название на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                        <Input
                          value={translation?.name || ''}
                          onChange={(e) => updateMaterialTranslation(locale, e.target.value)}
                          placeholder={`Название материала на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
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
              {alertStrings?.cancelButton || "Cancel"}
            </Button>
            <Button onClick={handleAddOrUpdateAttribute}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {dictionary?.addButton || "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary?.editExistingTitle || "Edit Material"}</DialogTitle>
            <DialogDescription>
              {dictionary?.editExistingDescription || "Modify the material details below."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <Label>Переводы на языки</Label>
              <Tabs defaultValue="ru" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="uz">O'zbek</TabsTrigger>
                </TabsList>
                
                {(['ru', 'en', 'uz'] as const).map((locale) => {
                  const translation = newMaterialTranslations.find(t => t.locale === locale);
                  return (
                    <TabsContent key={locale} value={locale} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Название на {locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}</Label>
                        <Input
                          value={translation?.name || ''}
                          onChange={(e) => updateMaterialTranslation(locale, e.target.value)}
                          placeholder={`Название материала на ${locale === 'ru' ? 'русском' : locale === 'en' ? 'английском' : 'узбекском'}`}
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
              {alertStrings?.cancelButton || "Cancel"}
            </Button>
            <Button onClick={handleAddOrUpdateAttribute}>
              <Edit3 className="mr-2 h-4 w-4" />
              {alertStrings?.updateButton || "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
