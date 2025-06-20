
'use client';

import { useEffect, useState } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/admin/UserManagement';
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminUsersPageDict = typeof enAdminMessages.adminUsersPage;

export default function AdminUsersPage() {
  const { user, loading } = useUnifiedAuth();
  const router = useRouter();
  const [dict, setDict] = useState<AdminUsersPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

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
    if (!loading && isClient) {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if user has admin or manager role
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        router.push('/admin/login');
        return;
      }
    }
  }, [user, loading, router, isClient]);

  if (loading || !isClient || !dict) {
    return <AdminTableSkeleton rows={6} columns={5} title="User Management" />;
  }
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return (
         <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You don't have permission to access this page.</p>
            </CardContent>
         </Card>
    );
  }

  // Convert dict to the format expected by UserManagement component
  const usersDictionary = {
    users: {
      title: dict.title || 'User Management',
      addUser: dict.addNewManagerButton || 'Add User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      email: dict.emailLabel || 'Email',
      name: dict.nameLabel || 'Name',
      password: 'Password',
      role: dict.roleHeader || 'Role',
      status: dict.statusHeader || 'Status',
      actions: dict.actionsHeader || 'Actions',
      active: dict.statusActive || 'Active',
      blocked: dict.statusBlocked || 'Blocked',
      superAdmin: 'Super Admin',
      admin: dict.roleAdmin || 'Admin',
      manager: dict.roleManager || 'Manager',
      user: dict.roleUser || 'User',
      block: dict.blockUserAction || 'Block',
      unblock: dict.unblockUserAction || 'Unblock',
      delete: dict.deleteManagerAction || 'Delete',
      edit: dict.editManagerAction || 'Edit',
      save: dict.saveChangesButton || 'Save',
      cancel: dict.cancelButton || 'Cancel',
      confirmDelete: 'Confirm Delete',
      deleteConfirmation: 'Are you sure you want to delete user {name}? This action cannot be undone.',
      cannotDeleteSuperAdmin: 'Super Admin cannot be deleted.',
      cannotBlockSuperAdmin: 'Super Admin cannot be blocked.',
      userCreated: 'User Created',
      userUpdated: 'User Updated',
      userDeleted: 'User Deleted',
      userBlocked: 'User Blocked',
      userUnblocked: 'User Unblocked',
      error: 'Error',
      loading: 'Loading...',
    },
  };

  return (
    <div className="container mx-auto p-6">
      <UserManagement dictionary={usersDictionary} />
    </div>
  );
}
