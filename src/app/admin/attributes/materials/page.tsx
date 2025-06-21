
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

const LOCAL_STORAGE_KEY_MATERIALS = "askimAdminCustomMaterials";
type ManageMaterialsDict = typeof enAdminMessages.adminManageMaterialsPage;

interface MaterialTranslation {
  locale: 'en' | 'ru' | 'uz';
  name: string;
}

interface Material {
  id: string;
  translations: MaterialTranslation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultMaterials: Material[] = [
  {
    id: "soy-wax",
    translations: [
      { locale: 'en', name: 'Soy Wax' },
      { locale: 'ru', name: 'Соевый воск' },
      { locale: 'uz', name: 'Soya mumi' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "beeswax",
    translations: [
      { locale: 'en', name: 'Beeswax' },
      { locale: 'ru', name: 'Пчелиный воск' },
      { locale: 'uz', name: 'Ari mumi' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "paraffin",
    translations: [
      { locale: 'en', name: 'Paraffin' },
      { locale: 'ru', name: 'Парафин' },
      { locale: 'uz', name: 'Parafin' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "coconut-wax",
    translations: [
      { locale: 'en', name: 'Coconut Wax' },
      { locale: 'ru', name: 'Кокосовый воск' },
      { locale: 'uz', name: 'Kokos mumi' }
    ],
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

export default function AdminManageMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dict, setDict] = useState<ManageMaterialsDict | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newMaterialEn, setNewMaterialEn] = useState("");
  const [newMaterialRu, setNewMaterialRu] = useState("");
  const [newMaterialUz, setNewMaterialUz] = useState("");
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialEn, setEditMaterialEn] = useState("");
  const [editMaterialRu, setEditMaterialRu] = useState("");
  const [editMaterialUz, setEditMaterialUz] = useState("");
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      try {
        const fullDict = await getAdminDictionary(localeToLoad);
        setDict(fullDict.adminManageMaterialsPage);
      } catch (error) {
        console.error('Failed to load admin dictionary:', error);
        // Set fallback dictionary
        setDict({
          pageTitle: 'Manage Materials',
          pageDescription: 'Add, edit, and manage material attributes for your products.',
          addMaterialButton: 'Add New Material',
          editMaterialButton: 'Edit Material',
          deleteMaterialButton: 'Delete Material',
          materialNameEn: 'English Name',
          materialNameRu: 'Russian Name',
          materialNameUz: 'Uzbek Name',
          activeStatus: 'Active',
          inactiveStatus: 'Inactive',
          saveButton: 'Save',
          cancelButton: 'Cancel',
          deleteConfirmTitle: 'Delete Material',
          deleteConfirmDescription: 'Are you sure you want to delete this material?',
          materialAddedToast: 'Material added successfully',
          materialUpdatedToast: 'Material updated successfully',
          materialDeletedToast: 'Material deleted successfully',
          materialStatusUpdatedToast: 'Material status updated'
        } as ManageMaterialsDict);
      } finally {
        setIsLoading(false);
      }
    }
    loadDictionary();

    // Load materials from localStorage or use defaults
    const storedMaterials = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
    if (storedMaterials) {
      try {
        setMaterials(JSON.parse(storedMaterials));
      } catch (error) {
        console.error('Error parsing stored materials:', error);
        setMaterials(defaultMaterials);
      }
    } else {
      setMaterials(defaultMaterials);
    }
  }, []);

  const saveMaterialsToStorage = useCallback((updatedMaterials: Material[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(updatedMaterials));
    setMaterials(updatedMaterials);
  }, []);

  const addMaterial = () => {
    if (!dict || !newMaterialEn.trim() || !newMaterialRu.trim() || !newMaterialUz.trim()) return;

    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      translations: [
        { locale: 'en', name: newMaterialEn.trim() },
        { locale: 'ru', name: newMaterialRu.trim() },
        { locale: 'uz', name: newMaterialUz.trim() }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedMaterials = [...materials, newMaterial];
    saveMaterialsToStorage(updatedMaterials);

    // Reset form
    setNewMaterialEn("");
    setNewMaterialRu("");
    setNewMaterialUz("");
    setIsAddDialogOpen(false);

    toast({
      title: dict.materialAddedToast,
      description: `${newMaterialEn} has been added.`,
    });
  };

  const startEditMaterial = (material: Material) => {
    setEditingMaterialId(material.id);
    setEditMaterialEn(material.translations.find(t => t.locale === 'en')?.name || "");
    setEditMaterialRu(material.translations.find(t => t.locale === 'ru')?.name || "");
    setEditMaterialUz(material.translations.find(t => t.locale === 'uz')?.name || "");
    setIsEditDialogOpen(true);
  };

  const saveEditMaterial = () => {
    if (!dict || !editingMaterialId || !editMaterialEn.trim() || !editMaterialRu.trim() || !editMaterialUz.trim()) return;

    const updatedMaterials = materials.map(material => {
      if (material.id === editingMaterialId) {
        return {
          ...material,
          translations: [
            { locale: 'en', name: editMaterialEn.trim() },
            { locale: 'ru', name: editMaterialRu.trim() },
            { locale: 'uz', name: editMaterialUz.trim() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return material;
    });

    saveMaterialsToStorage(updatedMaterials);

    // Reset form
    setEditingMaterialId(null);
    setEditMaterialEn("");
    setEditMaterialRu("");
    setEditMaterialUz("");
    setIsEditDialogOpen(false);

    toast({
      title: dict.materialUpdatedToast,
      description: `${editMaterialEn} has been updated.`,
    });
  };

  const toggleMaterialStatus = (materialId: string) => {
    if (!dict) return;
    
    const updatedMaterials = materials.map(material => {
      if (material.id === materialId) {
        return {
          ...material,
          isActive: !material.isActive,
          updatedAt: new Date().toISOString()
        };
      }
      return material;
    });

    saveMaterialsToStorage(updatedMaterials);

    const material = materials.find(m => m.id === materialId);
    const materialName = material?.translations.find(t => t.locale === 'en')?.name || 'Material';
    
    toast({
      title: dict.materialStatusUpdatedToast,
      description: `${materialName} is now ${material?.isActive ? 'inactive' : 'active'}.`,
    });
  };

  const deleteMaterial = (materialId: string) => {
    if (!dict) return;
    
    const materialToDelete = materials.find(m => m.id === materialId);
    const updatedMaterials = materials.filter(material => material.id !== materialId);
    saveMaterialsToStorage(updatedMaterials);

    const materialName = materialToDelete?.translations.find(t => t.locale === 'en')?.name || 'Material';
    
    toast({
      title: dict.materialDeletedToast,
      description: `${materialName} has been deleted.`,
    });

    setDeletingMaterialId(null);
  };

  const getMaterialUsageCount = (materialId: string) => {
    return mockProducts.filter(product => 
      product.materials?.some(material => material.id === materialId)
    ).length;
  };

  if (!isClient || isLoading || !dict) {
    return <AdminTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.pageTitle}</h1>
          <p className="text-muted-foreground">{dict.pageDescription}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {dict.addMaterialButton}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.addMaterialButton}</DialogTitle>
              <DialogDescription>
                Add a new material with translations in all supported languages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-material-en">{dict.materialNameEn}</Label>
                <Input
                  id="new-material-en"
                  value={newMaterialEn}
                  onChange={(e) => setNewMaterialEn(e.target.value)}
                  placeholder="Enter English name"
                />
              </div>
              <div>
                <Label htmlFor="new-material-ru">{dict.materialNameRu}</Label>
                <Input
                  id="new-material-ru"
                  value={newMaterialRu}
                  onChange={(e) => setNewMaterialRu(e.target.value)}
                  placeholder="Введите русское название"
                />
              </div>
              <div>
                <Label htmlFor="new-material-uz">{dict.materialNameUz}</Label>
                <Input
                  id="new-material-uz"
                  value={newMaterialUz}
                  onChange={(e) => setNewMaterialUz(e.target.value)}
                  placeholder="O'zbek nomini kiriting"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {dict.cancelButton}
              </Button>
              <Button 
                onClick={addMaterial}
                disabled={!newMaterialEn.trim() || !newMaterialRu.trim() || !newMaterialUz.trim()}
              >
                {dict.saveButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Materials ({materials.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({materials.filter(m => m.isActive).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({materials.filter(m => !m.isActive).length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Materials</CardTitle>
              <CardDescription>Manage all material attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.map((material) => {
                  const usageCount = getMaterialUsageCount(material.id);
                  return (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {material.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant={material.isActive ? "default" : "secondary"}>
                            {material.isActive ? dict.activeStatus : dict.inactiveStatus}
                          </Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {material.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {material.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={material.isActive}
                          onCheckedChange={() => toggleMaterialStatus(material.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditMaterial(material)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingMaterialId(material.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{dict.deleteConfirmTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {dict.deleteConfirmDescription}
                                {usageCount > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <strong>Warning:</strong> This material is used in {usageCount} product{usageCount !== 1 ? 's' : ''}. Deleting it may affect those products.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{dict.cancelButton}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMaterial(material.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {dict.deleteMaterialButton}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Materials</CardTitle>
              <CardDescription>Currently active material attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.filter(m => m.isActive).map((material) => {
                  const usageCount = getMaterialUsageCount(material.id);
                  return (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {material.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant="default">{dict.activeStatus}</Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {material.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {material.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMaterialStatus(material.id)}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditMaterial(material)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Materials</CardTitle>
              <CardDescription>Currently inactive material attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.filter(m => !m.isActive).map((material) => {
                  const usageCount = getMaterialUsageCount(material.id);
                  return (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-muted-foreground">
                            {material.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant="secondary">{dict.inactiveStatus}</Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {material.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {material.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMaterialStatus(material.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditMaterial(material)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingMaterialId(material.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{dict.deleteConfirmTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {dict.deleteConfirmDescription}
                                {usageCount > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <strong>Warning:</strong> This material is used in {usageCount} product{usageCount !== 1 ? 's' : ''}. Deleting it may affect those products.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{dict.cancelButton}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMaterial(material.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {dict.deleteMaterialButton}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.editMaterialButton}</DialogTitle>
            <DialogDescription>
              Edit the material translations in all supported languages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-material-en">{dict.materialNameEn}</Label>
              <Input
                id="edit-material-en"
                value={editMaterialEn}
                onChange={(e) => setEditMaterialEn(e.target.value)}
                placeholder="Enter English name"
              />
            </div>
            <div>
              <Label htmlFor="edit-material-ru">{dict.materialNameRu}</Label>
              <Input
                id="edit-material-ru"
                value={editMaterialRu}
                onChange={(e) => setEditMaterialRu(e.target.value)}
                placeholder="Введите русское название"
              />
            </div>
            <div>
              <Label htmlFor="edit-material-uz">{dict.materialNameUz}</Label>
              <Input
                id="edit-material-uz"
                value={editMaterialUz}
                onChange={(e) => setEditMaterialUz(e.target.value)}
                placeholder="O'zbek nomini kiriting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {dict.cancelButton}
            </Button>
            <Button 
              onClick={saveEditMaterial}
              disabled={!editMaterialEn.trim() || !editMaterialRu.trim() || !editMaterialUz.trim()}
            >
              {dict.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
