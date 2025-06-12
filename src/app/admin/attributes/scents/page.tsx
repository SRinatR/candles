
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Edit3 } from "lucide-react";
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
import type enAdminMessages from '@/admin/dictionaries/en.json';

const LOCAL_STORAGE_KEY_SCENTS = "askimAdminCustomScents";
type ManageScentsDict = typeof enAdminMessages.adminManageScentsPage;

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
  const [allScents, setAllScents] = useState<string[]>([]);
  const [newScentName, setNewScentName] = useState("");
  const [editingAttributeName, setEditingAttributeName] = useState<string | null>(null);
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

    let storedCustomScents = localStorage.getItem(LOCAL_STORAGE_KEY_SCENTS);
    if (!storedCustomScents) {
      const initialMockScentNames = Array.from(new Set(mockProducts.map(p => p.scent).filter((s): s is string => !!s))).sort();
      localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(initialMockScentNames));
      setAllScents(initialMockScentNames);
    } else {
        setAllScents(JSON.parse(storedCustomScents));
    }
  }, []);
  
  const isAttributeInUse = useCallback((attributeName: string): boolean => {
    return mockProducts.some(product => product.scent === attributeName);
  }, []);

  const handleAddOrUpdateAttribute = () => {
    if (!dictionary || !newScentName.trim()) {
      toast({ title: "Error", description: dictionary?.errorEmptyName || "Scent name cannot be empty.", variant: "destructive" });
      return;
    }
    const trimmedNewName = newScentName.trim();
    const isDuplicate = allScents.some(
      (scent) => scent.toLowerCase() === trimmedNewName.toLowerCase() && scent !== editingAttributeName
    );

    if (isDuplicate) {
      toast({ title: "Error", description: dictionary?.errorExists || "Scent with this name already exists.", variant: "destructive" });
      return;
    }

    if (editingAttributeName) { // Updating
      const oldName = editingAttributeName;
      const updatedScents = allScents.map(scent => (scent === oldName ? trimmedNewName : scent));
      setAllScents(updatedScents);
      localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
      toast({ title: dictionary?.updateSuccessTitle || "Scent Updated", description: (dictionary?.updateSuccess || "'{oldName}' has been updated to '{newName}'.").replace('{oldName}', oldName).replace('{newName}', trimmedNewName) });
      setNewScentName("");
      setEditingAttributeName(null);
    } else { // Adding
      const updatedScents = [...allScents, trimmedNewName];
      setAllScents(updatedScents);
      localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedScents));
      toast({ title: dictionary?.addSuccessTitle || "Scent Added", description: (dictionary?.addSuccess || "'{name}' has been added.").replace('{name}', trimmedNewName) });
      setNewScentName("");
    }
  };
  
  const handleInitiateEdit = (name: string) => {
    setEditingAttributeName(name);
    setNewScentName(name);
  };

  const handleCancelEdit = () => {
    setNewScentName("");
    setEditingAttributeName(null);
  };

  const handleDeleteAttribute = (attributeToDelete: string) => {
    if (!dictionary) return;
    const updatedAttributes = allScents.filter(attr => attr !== attributeToDelete);
    setAllScents(updatedAttributes);
    localStorage.setItem(LOCAL_STORAGE_KEY_SCENTS, JSON.stringify(updatedAttributes));
    toast({ title: dictionary?.deleteSuccessTitle || "Scent Deleted", description: (dictionary?.deleteSuccess || "'{name}' has been deleted.").replace('{name}', attributeToDelete) });
  };
  
  if (!isClient || !dictionary || !alertStrings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dictionary.title}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingAttributeName ? (dictionary.editExistingTitle || "Edit Scent") : (dictionary.addNewTitle || "Add New Scent")}</CardTitle>
          <CardDescription>{editingAttributeName ? (dictionary.editExistingDescription || "Modify the scent name below.") : (dictionary.addNewDescription || "Create a new scent option for your products.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newScentName}
            onChange={(e) => setNewScentName(e.target.value)}
            placeholder={dictionary.inputPlaceholder || "Scent name"}
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
          {allScents.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dictionary.noCustomYet || "No scents added yet."}</p>
          ) : (
            <ul className="space-y-2">
              {allScents.map(attr => (
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
                              ? alertStrings.confirmDeleteScentInUse.replace('{attributeName}', attr)
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
