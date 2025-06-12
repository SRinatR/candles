
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { PlusCircle, AlertTriangle, UserCog, ShieldCheck, Mail, UserX, UserCheckIcon as UserCheck, Settings2, Edit2, Eye as ViewIcon, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import type { AdminUser, AdminRole } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';
import { useToast } from "@/hooks/use-toast";

type AdminUsersPageDict = typeof enAdminMessages.adminUsersPage;

const managerEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
});
type ManagerEditFormValues = z.infer<typeof managerEditSchema>;

export default function AdminUsersPage() {
  const { isAdmin, isLoading, currentAdminUser, predefinedUsers, dynamicallyAddedManagers, toggleBlockManagerStatus, updateManagerDetails, deleteManager } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allAdminUsers, setAllAdminUsers] = useState<AdminUser[]>([]);
  const [dict, setDict] = useState<AdminUsersPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const [selectedRoleInModal, setSelectedRoleInModal] = useState<AdminRole>('MANAGER');

  const editManagerForm = useForm<ManagerEditFormValues>({
    resolver: zodResolver(managerEditSchema),
  });

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminUsersPage);
    }
    loadDictionary();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAdmin) { 
      router.replace('/admin/dashboard'); 
    }
  }, [isAdmin, router, isLoading]);

  useEffect(() => {
    const combinedUsers: AdminUser[] = [
      ...Object.values(predefinedUsers).map(u => ({ ...u, isPredefined: true })),
      ...dynamicallyAddedManagers.map(u => ({ ...u, isPredefined: false }))
    ];
    setAllAdminUsers(combinedUsers);
  }, [predefinedUsers, dynamicallyAddedManagers]);

  const openViewModal = (user: AdminUser) => { setSelectedUser(user); setIsViewModalOpen(true); };
  const openEditModal = (user: AdminUser) => { 
    setSelectedUser(user); 
    editManagerForm.reset({ name: user.name, email: user.email });
    setIsEditModalOpen(true); 
  };
  const openRoleChangeModal = (user: AdminUser) => { setSelectedUser(user); setSelectedRoleInModal(user.role); setIsRoleChangeModalOpen(true); };
  const openPermissionsModal = (user: AdminUser) => { setSelectedUser(user); setIsPermissionsModalOpen(true); };
  const openDeleteAlert = (user: AdminUser) => { setSelectedUser(user); setIsDeleteAlertOpen(true); };

  const handleEditManagerSubmit = async (data: ManagerEditFormValues) => {
    if (!selectedUser || !dict) return;
    const success = await updateManagerDetails(selectedUser.email, data.name, data.email);
    if (success) {
      toast({ title: dict.editManagerSuccessTitle, description: dict.editManagerSuccessDesc.replace('{name}', data.name) });
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };
  
  const handleDeleteManagerConfirm = async () => {
    if (!selectedUser || !dict) return;
    const success = await deleteManager(selectedUser.email);
    if (success) {
      toast({ title: dict.deleteManagerSuccessTitle, description: dict.deleteManagerSuccessDesc.replace('{name}', selectedUser.name) });
      setIsDeleteAlertOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSimulatedRoleSave = () => {
    if (dict && selectedUser) {
      toast({
        title: dict.roleChangeSimulatedTitle,
        description: dict.roleChangeSimulatedDesc
          .replace('{name}', selectedUser.name)
          .replace('{role}', selectedRoleInModal),
      });
    }
    setIsRoleChangeModalOpen(false);
    setSelectedUser(null);
  };

  if (isLoading || !isClient || !dict) {
    return <div className="flex h-full items-center justify-center"><p>{dict?.loadingPage || "Loading User Management..."}</p></div>;
  }
  
  if (!isAdmin) {
    return (
         <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">{dict.accessDeniedTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{dict.accessDeniedDesc}</p>
            </CardContent>
         </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
            <p className="text-muted-foreground">{dict.description}</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new-manager">
            <PlusCircle className="mr-2 h-4 w-4" /> {dict.addNewManagerButton}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.managerListTitle}</CardTitle>
          <CardDescription>{dict.managerListDesc.replace('{count}', String(allAdminUsers.length))}</CardDescription>
        </CardHeader>
        <CardContent>
          {allAdminUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3 py-2.5 text-left">{dict.nameHeader}</TableHead>
                    <TableHead className="px-3 py-2.5 text-left"><Mail className="inline h-4 w-4 mr-1 text-muted-foreground"/>{dict.emailHeader}</TableHead>
                    <TableHead className="px-3 py-2.5 text-left"><ShieldCheck className="inline h-4 w-4 mr-1 text-muted-foreground"/>{dict.roleHeader}</TableHead>
                    <TableHead className="px-3 py-2.5 text-center">{dict.statusHeader}</TableHead>
                    <TableHead className="px-3 py-2.5 text-right">{dict.actionsHeader}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAdminUsers.map((user) => {
                    const isCurrentUserAdmin = currentAdminUser?.email === user.email && user.role === 'ADMIN';
                    const canPerformActionsOnUser = !user.isPredefined && !isCurrentUserAdmin;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium px-3 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.isPredefined && <Badge variant="outline" className="text-xs whitespace-nowrap">{dict.predefinedUserBadge}</Badge>}
                            {isCurrentUserAdmin && <Badge variant="default" className="text-xs whitespace-nowrap">{dict.currentUserAdminBadge}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 align-top">{user.email}</TableCell>
                        <TableCell className="px-3 py-3 align-top">{user.role}</TableCell>
                        <TableCell className="text-center px-3 py-3 align-top">
                          <Badge variant={user.isBlocked ? "destructive" : "secondary"} className="whitespace-nowrap">
                            {user.isBlocked ? dict.statusBlocked : dict.statusActive}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-3 py-3 align-top">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{dict.actionsHeader}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openViewModal(user)}>
                                <ViewIcon className="mr-2 h-4 w-4" /> {dict.viewProfileAction}
                              </DropdownMenuItem>
                              {canPerformActionsOnUser && (
                                <>
                                  <DropdownMenuItem onClick={() => openEditModal(user)}>
                                    <Edit2 className="mr-2 h-4 w-4" /> {dict.editManagerAction}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleBlockManagerStatus(user.email)}>
                                    {user.isBlocked ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                                    {user.isBlocked ? dict.unblockUserAction : dict.blockUserAction}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRoleChangeModal(user)}>
                                    <UserCog className="mr-2 h-4 w-4" /> {dict.changeRoleButton}
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => openDeleteAlert(user)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> {dict.deleteManagerAction}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => openPermissionsModal(user)} disabled={!canPerformActionsOnUser && !isCurrentUserAdmin}>
                                <Settings2 className="mr-2 h-4 w-4" /> {dict.permissionsButton}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{dict.noManagersFound}</p>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">{dict.mainSiteUserManagementNote}</p>
        </CardFooter>
      </Card>
       <p className="text-sm text-muted-foreground text-center">
          {dict.simulationNote}
        </p>

      {/* View User Modal */}
      {selectedUser && isViewModalOpen && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.viewProfileModalTitle.replace('{name}', selectedUser.name)}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2 text-sm">
              <p><strong>{dict.nameLabel}:</strong> {selectedUser.name}</p>
              <p><strong>{dict.emailLabel}:</strong> {selectedUser.email}</p>
              <p><strong>{dict.roleLabel}:</strong> <Badge variant="outline">{selectedUser.role}</Badge></p>
              <div><strong>{dict.statusLabel}:</strong> <Badge variant={selectedUser.isBlocked ? "destructive" : "secondary"}>{selectedUser.isBlocked ? dict.statusBlocked : dict.statusActive}</Badge></div>
              {selectedUser.isPredefined && <p><Badge variant="info" className="mt-2">{dict.predefinedUserBadge}</Badge></p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{dict.closeButton}</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Manager Modal */}
      {selectedUser && isEditModalOpen && (
        <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setSelectedUser(null); }}>
          <DialogContent>
            <FormProvider {...editManagerForm}>
              <form onSubmit={editManagerForm.handleSubmit(handleEditManagerSubmit)}>
                <DialogHeader>
                  <DialogTitle>{dict.editManagerModalTitle.replace('{name}', selectedUser.name)}</DialogTitle>
                  <DialogDescription>{dict.editManagerModalDesc}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">{dict.nameLabel}</Label>
                    <Input id="edit-name" {...editManagerForm.register("name")} />
                    {editManagerForm.formState.errors.name && <p className="text-sm text-destructive">{editManagerForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{dict.emailLabel}</Label>
                    <Input id="edit-email" type="email" {...editManagerForm.register("email")} />
                    {editManagerForm.formState.errors.email && <p className="text-sm text-destructive">{editManagerForm.formState.errors.email.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">{dict.cancelButton}</Button></DialogClose>
                  <Button type="submit" disabled={editManagerForm.formState.isSubmitting}>{dict.saveChangesButton}</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Manager Alert Dialog */}
      {selectedUser && isDeleteAlertOpen && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { setIsDeleteAlertOpen(open); if(!open) setSelectedUser(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.deleteManagerConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {dict.deleteManagerConfirmDesc.replace('{name}', selectedUser.name)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{dict.cancelButton}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteManagerConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {dict.deleteConfirmButton}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Change Role Modal */}
      {selectedUser && isRoleChangeModalOpen && (
          <Dialog open={isRoleChangeModalOpen} onOpenChange={setIsRoleChangeModalOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{dict.changeRoleModalTitle.replace('{name}', selectedUser.name)}</DialogTitle>
                      <DialogDescription>{dict.changeRoleModalDesc}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                      <p className="text-sm">{dict.currentRoleLabel} <Badge>{selectedUser.role}</Badge></p>
                      <div>
                          <Label htmlFor="role-select" className="text-sm font-medium">{dict.newRoleLabel}</Label>
                          <Select value={selectedRoleInModal} onValueChange={(value) => setSelectedRoleInModal(value as AdminRole)}>
                              <SelectTrigger id="role-select" className="mt-1">
                                  <SelectValue placeholder={dict.selectRolePlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="ADMIN" disabled>{dict.roleAdmin}</SelectItem>
                                  <SelectItem value="MANAGER">{dict.roleManager}</SelectItem>
                                  <SelectItem value="USER" disabled>{dict.roleUser}</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">{dict.cancelButton}</Button></DialogClose>
                      <Button type="button" onClick={handleSimulatedRoleSave}>{dict.saveRoleButton}</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      {/* Permissions Modal Placeholder */}
      {selectedUser && isPermissionsModalOpen && (
          <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{dict.permissionsModalTitle.replace('{name}', selectedUser.name)}</DialogTitle>
                      <DialogDescription>{dict.permissionsModalDesc}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 text-sm text-muted-foreground">
                      <p>{dict.permissionsFeatureComingSoon}</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>{dict.manageProductsPermission} (Yes/No)</li>
                          <li>{dict.manageOrdersPermission} (Yes/No)</li>
                          <li>{dict.manageDiscountsPermission} (Yes/No)</li>
                      </ul>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">{dict.closeButton}</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </div>
  );
}
