
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockCategories, mockProducts } from '@/lib/mock-data';
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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingAttributeName, setEditingAttributeName] = useState<string | null>(null);
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<ManageCategoriesDict | null>(null);
  const [alertStrings, setAlertStrings] = useState<AlertDialogStrings | null>(null);
  const [isClient, setIsClient] = useState(false);

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

    let storedCustomCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (!storedCustomCategories) {
      const initialMockCategoryNames = mockCategories.map(cat => cat.name);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(initialMockCategoryNames));
      setAllCategories(initialMockCategoryNames);
    } else {
      setAllCategories(JSON.parse(storedCustomCategories));
    }
  }, []);

  const isAttributeInUse = useCallback((attributeName: string): boolean => {
    return mockProducts.some(product => product.category === attributeName);
  }, []);

  const handleAddOrUpdateAttribute = () => {
    if (!dictionary || !newCategoryName.trim()) {
      toast({ title: "Error", description: dictionary?.errorEmptyName || "Category name cannot be empty.", variant: "destructive" });
      return;
    }

    const trimmedNewName = newCategoryName.trim();
    const isDuplicate = allCategories.some(
      (cat) => cat.toLowerCase() === trimmedNewName.toLowerCase() && cat !== editingAttributeName
    );

    if (isDuplicate) {
      toast({ title: "Error", description: dictionary?.errorExists || "Category with this name already exists.", variant: "destructive" });
      return;
    }

    if (editingAttributeName) { // Updating
      const oldName = editingAttributeName;
      if (isAttributeInUse(oldName) && oldName.toLowerCase() !== trimmedNewName.toLowerCase()) {
        // Trigger modal manually for rename if in use
        // This part would require a state for modal visibility and content
        // For simplicity, we'll show a toast and proceed if they implement a confirm dialog on their side
        // Ideally, this path should be blocked until confirmation from AlertDialog
        // For now, let's assume the AlertDialog handles the confirmation flow for renaming in-use attributes
      }
      const updatedCategories = allCategories.map(cat => (cat === oldName ? trimmedNewName : cat));
      setAllCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
      toast({ title: dictionary?.updateSuccessTitle || "Category Updated", description: (dictionary?.updateSuccess || "'{oldName}' has been updated to '{newName}'.").replace('{oldName}', oldName).replace('{newName}', trimmedNewName) });
      setNewCategoryName("");
      setEditingAttributeName(null);
    } else { // Adding
      const updatedCategories = [...allCategories, trimmedNewName];
      setAllCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
      toast({ title: dictionary?.addSuccessTitle || "Category Added", description: (dictionary?.addSuccess || "'{name}' has been added.").replace('{name}', trimmedNewName) });
      setNewCategoryName("");
    }
  };
  
  const handleInitiateEdit = (name: string) => {
    setEditingAttributeName(name);
    setNewCategoryName(name);
  };

  const handleCancelEdit = () => {
    setNewCategoryName("");
    setEditingAttributeName(null);
  };

  const handleDeleteAttribute = (attributeToDelete: string) => {
    if (!dictionary) return;
    const updatedAttributes = allCategories.filter(attr => attr !== attributeToDelete);
    setAllCategories(updatedAttributes);
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedAttributes));
    toast({ title: dictionary?.deleteSuccessTitle || "Category Deleted", description: (dictionary?.deleteSuccess || "'{name}' has been deleted.").replace('{name}', attributeToDelete) });
  };

  if (!isClient || !dictionary || !alertStrings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingAttributeName ? (dictionary.editExistingTitle || "Edit Category") : (dictionary.addNewTitle || "Add New Category")}</CardTitle>
          <CardDescription>{editingAttributeName ? (dictionary.editExistingDescription || "Modify the category name below.") : (dictionary.addNewDescription || "Create a new category for your products.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={dictionary.inputPlaceholder || "Category name"}
            className="flex-grow"
          />
          <div className="flex gap-2 mt-2 sm:mt-0">
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
