'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Shield, ShieldCheck, UserX, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  isSuperAdmin?: boolean;
}

interface UserFormData {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

interface UserManagementProps {
  dictionary: {
    users: {
      title: string;
      addUser: string;
      editUser: string;
      deleteUser: string;
      email: string;
      name: string;
      password: string;
      role: string;
      status: string;
      actions: string;
      active: string;
      blocked: string;
      superAdmin: string;
      admin: string;
      manager: string;
      user: string;
      block: string;
      unblock: string;
      delete: string;
      edit: string;
      save: string;
      cancel: string;
      confirmDelete: string;
      deleteConfirmation: string;
      cannotDeleteSuperAdmin: string;
      cannotBlockSuperAdmin: string;
      userCreated: string;
      userUpdated: string;
      userDeleted: string;
      userBlocked: string;
      userUnblocked: string;
      error: string;
      loading: string;
    };
  };
}

export default function UserManagement({ dictionary }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'USER'
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: dictionary.users.error,
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: dictionary.users.userCreated,
          description: `User ${formData.name} has been created successfully`,
        });
        setIsCreateDialogOpen(false);
        setFormData({ email: '', name: '', password: '', role: 'USER' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: dictionary.users.error,
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: dictionary.users.userUpdated,
          description: `User ${formData.name} has been updated successfully`,
        });
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setFormData({ email: '', name: '', password: '', role: 'USER' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: dictionary.users.error,
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: dictionary.users.userDeleted,
          description: `User ${selectedUser.name} has been deleted successfully`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: dictionary.users.error,
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBlock = async (user: User) => {
    if (user.isSuperAdmin) {
      toast({
        title: dictionary.users.error,
        description: dictionary.users.cannotBlockSuperAdmin,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked: !user.isBlocked }),
      });

      if (response.ok) {
        toast({
          title: user.isBlocked ? dictionary.users.userUnblocked : dictionary.users.userBlocked,
          description: `User ${user.name} has been ${user.isBlocked ? 'unblocked' : 'blocked'}`,
        });
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling user block status:', error);
      toast({
        title: dictionary.users.error,
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadge = (role: string, isSuperAdmin?: boolean) => {
    if (isSuperAdmin) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          {dictionary.users.superAdmin}
        </Badge>
      );
    }

    switch (role) {
      case 'ADMIN':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {dictionary.users.admin}
          </Badge>
        );
      case 'MANAGER':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {dictionary.users.manager}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {dictionary.users.user}
          </Badge>
        );
    }
  };

  const getStatusBadge = (isBlocked: boolean) => {
    return isBlocked ? (
      <Badge variant="destructive">{dictionary.users.blocked}</Badge>
    ) : (
      <Badge variant="default">{dictionary.users.active}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">{dictionary.users.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{dictionary.users.title}</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {dictionary.users.addUser}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dictionary.users.addUser}</DialogTitle>
              <DialogDescription>
                Create a new user account with specified role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">{dictionary.users.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">{dictionary.users.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label htmlFor="password">{dictionary.users.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                />
              </div>
              <div>
                <Label htmlFor="role">{dictionary.users.role}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'MANAGER' | 'USER') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">{dictionary.users.user}</SelectItem>
                    <SelectItem value="MANAGER">{dictionary.users.manager}</SelectItem>
                    <SelectItem value="ADMIN">{dictionary.users.admin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({ email: '', name: '', password: '', role: 'USER' });
                }}
              >
                {dictionary.users.cancel}
              </Button>
              <Button onClick={handleCreateUser}>{dictionary.users.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.users.name}</TableHead>
              <TableHead>{dictionary.users.email}</TableHead>
              <TableHead>{dictionary.users.role}</TableHead>
              <TableHead>{dictionary.users.status}</TableHead>
              <TableHead>{dictionary.users.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role, user.isSuperAdmin)}</TableCell>
                <TableCell>{getStatusBadge(user.isBlocked)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      disabled={user.isSuperAdmin && user.role !== 'ADMIN'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!user.isSuperAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleBlock(user)}
                        >
                          {user.isBlocked ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.users.editUser}</DialogTitle>
            <DialogDescription>
              {selectedUser?.isSuperAdmin
                ? 'For Super Admin, only password can be changed.'
                : 'Update user information and permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">{dictionary.users.email}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={selectedUser?.isSuperAdmin}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">{dictionary.users.name}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={selectedUser?.isSuperAdmin}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">{dictionary.users.password}</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </div>
            {!selectedUser?.isSuperAdmin && (
              <div>
                <Label htmlFor="edit-role">{dictionary.users.role}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'MANAGER' | 'USER') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">{dictionary.users.user}</SelectItem>
                    <SelectItem value="MANAGER">{dictionary.users.manager}</SelectItem>
                    <SelectItem value="ADMIN">{dictionary.users.admin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                setFormData({ email: '', name: '', password: '', role: 'USER' });
              }}
            >
              {dictionary.users.cancel}
            </Button>
            <Button onClick={handleUpdateUser}>{dictionary.users.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.users.deleteUser}</DialogTitle>
            <DialogDescription>
              {dictionary.users.deleteConfirmation.replace(
                '{name}',
                selectedUser?.name || ''
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              {dictionary.users.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {dictionary.users.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}