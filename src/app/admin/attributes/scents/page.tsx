
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
  translations: ScentTranslation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultScents: Scent[] = [
  {
    id: "vanilla",
    translations: [
      { locale: 'en', name: 'Vanilla' },
      { locale: 'ru', name: 'Ваниль' },
      { locale: 'uz', name: 'Vanil' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "lavender",
    translations: [
      { locale: 'en', name: 'Lavender' },
      { locale: 'ru', name: 'Лаванда' },
      { locale: 'uz', name: 'Lavanda' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "rose",
    translations: [
      { locale: 'en', name: 'Rose' },
      { locale: 'ru', name: 'Роза' },
      { locale: 'uz', name: 'Atirgul' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "citrus",
    translations: [
      { locale: 'en', name: 'Citrus' },
      { locale: 'ru', name: 'Цитрус' },
      { locale: 'uz', name: 'Sitrus' }
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "sandalwood",
    translations: [
      { locale: 'en', name: 'Sandalwood' },
      { locale: 'ru', name: 'Сандаловое дерево' },
      { locale: 'uz', name: 'Sandal yog\'ochi' }
    ],
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

export default function AdminManageScentsPage() {
  const [scents, setScents] = useState<Scent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dict, setDict] = useState<ManageScentsDict | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newScentEn, setNewScentEn] = useState("");
  const [newScentRu, setNewScentRu] = useState("");
  const [newScentUz, setNewScentUz] = useState("");
  const [editingScentId, setEditingScentId] = useState<string | null>(null);
  const [editScentEn, setEditScentEn] = useState("");
  const [editScentRu, setEditScentRu] = useState("");
  const [editScentUz, setEditScentUz] = useState("");
  const [deletingScentId, setDeletingScentId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      try {
        const fullDict = await getAdminDictionary(localeToLoad);
        setDict(fullDict.adminManageScentsPage);
      } catch (error) {
        console.error('Failed to load admin dictionary:', error);
        // Set fallback dictionary
        setDict({
          pageTitle: 'Manage Scents',
          pageDescription: 'Add, edit, and manage scent attributes for your products.',
          addScentButton: 'Add New Scent',
          editScentButton: 'Edit Scent',
          deleteScentButton: 'Delete Scent',
          scentNameEn: 'English Name',
          scentNameRu: 'Russian Name',
          scentNameUz: 'Uzbek Name',
          activeStatus: 'Active',
          inactiveStatus: 'Inactive',
          saveButton: 'Save',
          cancelButton: 'Cancel',
          deleteConfirmTitle: 'Delete Scent',
          deleteConfirmDescription: 'Are you sure you want to delete this scent?',
          scentAddedToast: 'Scent added successfully',
          scentUpdatedToast: 'Scent updated successfully',
          scentDeletedToast: 'Scent deleted successfully',
          scentStatusUpdatedToast: 'Scent status updated'
        } as ManageScentsDict);
      } finally {
        setIsLoading(false);
      }
    }
    loadDictionary();

    // Load scents from localStorage or use defaults
    const storedScents = localStorage.getItem(LOCAL_STORAGE_KEY_SCENTS);
    if (storedScents) {
      try {
        setScents(JSON.parse(storedScents));
      } catch (error) {
        console.error('Error parsing stored scents:', error);
        setScents(defaultScents);
      }
    } else {
      setScents(defaultScents);
    }
  }, []);

  const saveScentsToStorage = useCallback((updatedScents: Scent[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
    setScents(updatedScents);
  }, []);

  const addScent = () => {
    if (!dict || !newScentEn.trim() || !newScentRu.trim() || !newScentUz.trim()) return;

    const newScent: Scent = {
      id: `scent-${Date.now()}`,
      translations: [
        { locale: 'en', name: newScentEn.trim() },
        { locale: 'ru', name: newScentRu.trim() },
        { locale: 'uz', name: newScentUz.trim() }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedScents = [...scents, newScent];
    saveScentsToStorage(updatedScents);

    // Reset form
    setNewScentEn("");
    setNewScentRu("");
    setNewScentUz("");
    setIsAddDialogOpen(false);

    toast({
      title: dict.scentAddedToast,
      description: `${newScentEn} has been added.`,
    });
  };

  const startEditScent = (scent: Scent) => {
    setEditingScentId(scent.id);
    setEditScentEn(scent.translations.find(t => t.locale === 'en')?.name || "");
    setEditScentRu(scent.translations.find(t => t.locale === 'ru')?.name || "");
    setEditScentUz(scent.translations.find(t => t.locale === 'uz')?.name || "");
    setIsEditDialogOpen(true);
  };

  const saveEditScent = () => {
    if (!dict || !editingScentId || !editScentEn.trim() || !editScentRu.trim() || !editScentUz.trim()) return;

    const updatedScents = scents.map(scent => {
      if (scent.id === editingScentId) {
        return {
          ...scent,
          translations: [
            { locale: 'en', name: editScentEn.trim() },
            { locale: 'ru', name: editScentRu.trim() },
            { locale: 'uz', name: editScentUz.trim() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return scent;
    });

    saveScentsToStorage(updatedScents);

    // Reset form
    setEditingScentId(null);
    setEditScentEn("");
    setEditScentRu("");
    setEditScentUz("");
    setIsEditDialogOpen(false);

    toast({
      title: dict.scentUpdatedToast,
      description: `${editScentEn} has been updated.`,
    });
  };

  const toggleScentStatus = (scentId: string) => {
    if (!dict) return;
    
    const updatedScents = scents.map(scent => {
      if (scent.id === scentId) {
        return {
          ...scent,
          isActive: !scent.isActive,
          updatedAt: new Date().toISOString()
        };
      }
      return scent;
    });

    saveScentsToStorage(updatedScents);

    const scent = scents.find(s => s.id === scentId);
    const scentName = scent?.translations.find(t => t.locale === 'en')?.name || 'Scent';
    
    toast({
      title: dict.scentStatusUpdatedToast,
      description: `${scentName} is now ${scent?.isActive ? 'inactive' : 'active'}.`,
    });
  };

  const deleteScent = (scentId: string) => {
    if (!dict) return;
    
    const scentToDelete = scents.find(s => s.id === scentId);
    const updatedScents = scents.filter(scent => scent.id !== scentId);
    saveScentsToStorage(updatedScents);

    const scentName = scentToDelete?.translations.find(t => t.locale === 'en')?.name || 'Scent';
    
    toast({
      title: dict.scentDeletedToast,
      description: `${scentName} has been deleted.`,
    });

    setDeletingScentId(null);
  };

  const getScentUsageCount = (scentId: string) => {
    return mockProducts.filter(product => 
      product.scents?.some(scent => scent.id === scentId)
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
              {dict.addScentButton}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.addScentButton}</DialogTitle>
              <DialogDescription>
                Add a new scent with translations in all supported languages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-scent-en">{dict.scentNameEn}</Label>
                <Input
                  id="new-scent-en"
                  value={newScentEn}
                  onChange={(e) => setNewScentEn(e.target.value)}
                  placeholder="Enter English name"
                />
              </div>
              <div>
                <Label htmlFor="new-scent-ru">{dict.scentNameRu}</Label>
                <Input
                  id="new-scent-ru"
                  value={newScentRu}
                  onChange={(e) => setNewScentRu(e.target.value)}
                  placeholder="Введите русское название"
                />
              </div>
              <div>
                <Label htmlFor="new-scent-uz">{dict.scentNameUz}</Label>
                <Input
                  id="new-scent-uz"
                  value={newScentUz}
                  onChange={(e) => setNewScentUz(e.target.value)}
                  placeholder="O'zbek nomini kiriting"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {dict.cancelButton}
              </Button>
              <Button 
                onClick={addScent}
                disabled={!newScentEn.trim() || !newScentRu.trim() || !newScentUz.trim()}
              >
                {dict.saveButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Scents ({scents.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({scents.filter(s => s.isActive).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({scents.filter(s => !s.isActive).length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Scents</CardTitle>
              <CardDescription>Manage all scent attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scents.map((scent) => {
                  const usageCount = getScentUsageCount(scent.id);
                  return (
                    <div key={scent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {scent.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant={scent.isActive ? "default" : "secondary"}>
                            {scent.isActive ? dict.activeStatus : dict.inactiveStatus}
                          </Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {scent.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {scent.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={scent.isActive}
                          onCheckedChange={() => toggleScentStatus(scent.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditScent(scent)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingScentId(scent.id)}
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
                                    <strong>Warning:</strong> This scent is used in {usageCount} product{usageCount !== 1 ? 's' : ''}. Deleting it may affect those products.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{dict.cancelButton}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteScent(scent.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {dict.deleteScentButton}
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
              <CardTitle>Active Scents</CardTitle>
              <CardDescription>Currently active scent attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scents.filter(s => s.isActive).map((scent) => {
                  const usageCount = getScentUsageCount(scent.id);
                  return (
                    <div key={scent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {scent.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant="default">{dict.activeStatus}</Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {scent.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {scent.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScentStatus(scent.id)}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditScent(scent)}
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
              <CardTitle>Inactive Scents</CardTitle>
              <CardDescription>Currently inactive scent attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scents.filter(s => !s.isActive).map((scent) => {
                  const usageCount = getScentUsageCount(scent.id);
                  return (
                    <div key={scent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-muted-foreground">
                            {scent.translations.find(t => t.locale === 'en')?.name}
                          </h3>
                          <Badge variant="secondary">{dict.inactiveStatus}</Badge>
                          {usageCount > 0 && (
                            <Badge variant="outline">
                              Used in {usageCount} product{usageCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>RU:</strong> {scent.translations.find(t => t.locale === 'ru')?.name}</div>
                          <div><strong>UZ:</strong> {scent.translations.find(t => t.locale === 'uz')?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScentStatus(scent.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditScent(scent)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingScentId(scent.id)}
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
                                    <strong>Warning:</strong> This scent is used in {usageCount} product{usageCount !== 1 ? 's' : ''}. Deleting it may affect those products.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{dict.cancelButton}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteScent(scent.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {dict.deleteScentButton}
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
            <DialogTitle>{dict.editScentButton}</DialogTitle>
            <DialogDescription>
              Edit the scent translations in all supported languages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-scent-en">{dict.scentNameEn}</Label>
              <Input
                id="edit-scent-en"
                value={editScentEn}
                onChange={(e) => setEditScentEn(e.target.value)}
                placeholder="Enter English name"
              />
            </div>
            <div>
              <Label htmlFor="edit-scent-ru">{dict.scentNameRu}</Label>
              <Input
                id="edit-scent-ru"
                value={editScentRu}
                onChange={(e) => setEditScentRu(e.target.value)}
                placeholder="Введите русское название"
              />
            </div>
            <div>
              <Label htmlFor="edit-scent-uz">{dict.scentNameUz}</Label>
              <Input
                id="edit-scent-uz"
                value={editScentUz}
                onChange={(e) => setEditScentUz(e.target.value)}
                placeholder="O'zbek nomini kiriting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {dict.cancelButton}
            </Button>
            <Button 
              onClick={saveEditScent}
              disabled={!editScentEn.trim() || !editScentRu.trim() || !editScentUz.trim()}
            >
              {dict.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
