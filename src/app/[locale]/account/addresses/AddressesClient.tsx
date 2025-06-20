"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Home, MapPin } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddressForm } from '@/components/forms/AddressForm';
import { toast } from 'sonner';
import { Locale } from '@/lib/i1n-config';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';

interface Address {
  id: string;
  title: string;
  street: string;
  house: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode?: string;
  landmark?: string;
  comment?: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressesClientProps {
  dictionary: any;
  locale: Locale;
}

export function AddressesClient({ dictionary, locale }: AddressesClientProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { currentUser: simulatedUser } = useAuth();
  const { data: nextAuthSession } = useSession();

  // Helper function to get request headers with authentication
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // If using simulated auth and no NextAuth session, add simulated user header
    if (simulatedUser && !nextAuthSession) {
      headers['x-simulated-user'] = JSON.stringify(simulatedUser);
    }
    
    return headers;
  };

  // Load addresses on component mount
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const headers = getAuthHeaders();
        console.log('Auth headers:', headers);
        console.log('Simulated user:', simulatedUser);
        console.log('NextAuth session:', nextAuthSession);
        
        const response = await fetch('/api/user/addresses', {
          headers
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
        } else {
          const errorText = await response.text();
          console.error('Failed to load addresses:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load addresses if we have authentication
    if (simulatedUser || nextAuthSession) {
      loadAddresses();
    } else {
      setIsLoading(false);
    }
  }, [simulatedUser, nextAuthSession]);

  const handleAddSuccess = () => {
    // Reload addresses after successful add
    const loadAddresses = async () => {
      try {
        const response = await fetch('/api/user/addresses', {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error('Error reloading addresses:', error);
      }
    };
    
    loadAddresses();
    setIsAddDialogOpen(false);
    toast.success(dictionary.addressAddedSuccess || 'Address added successfully!');
  };

  const handleEditSuccess = () => {
    // Reload addresses after successful edit
    const loadAddresses = async () => {
      try {
        const response = await fetch('/api/user/addresses', {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error('Error reloading addresses:', error);
      }
    };
    
    loadAddresses();
    setIsEditDialogOpen(false);
    setEditingAddress(null);
    toast.success(dictionary.addressUpdatedSuccess || 'Address updated successfully!');
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete address');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to set default address');
      }

      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );
      toast.success('Default address updated!');
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Address Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {dictionary.addNewAddressButton}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{dictionary.addAddressTitle}</DialogTitle>
              <DialogDescription>
                {dictionary.manageAddressesDesc}
              </DialogDescription>
            </DialogHeader>
            <AddressForm
              isOpen={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              onSuccess={handleAddSuccess}
              dictionary={dictionary}
              initialData={{
                title: '',
                street: '',
                house: '',
                apartment: '',
                city: '',
                region: '',
                postalCode: '',
                landmark: '',
                comment: '',
                country: 'UZ',
                isDefault: false
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading addresses...</p>
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dictionary.noAddressesYet}
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {dictionary.manageAddressesDesc}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {dictionary.addAddressFormButton}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-900">
                        {address.title}
                      </h3>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          {dictionary.defaultBadge}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{address.street}, {address.house}{address.apartment ? `, кв. ${address.apartment}` : ''}</p>
                      <p>{address.city}, {address.region}</p>
                      {address.landmark && <p className="text-gray-500">Ориентир: {address.landmark}</p>}
                      {address.comment && <p className="text-gray-500">Комментарий: {address.comment}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        {dictionary.setDefaultButton}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{dictionary.confirmDeleteTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {dictionary.confirmDeleteDesc}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{dictionary.cancelButton}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(address.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {dictionary.deleteButton}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      {/* Edit Address Dialog */}
      {editingAddress && (
        <AddressForm
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingAddress(null);
          }}
          onSuccess={handleEditSuccess}
          dictionary={dictionary}
          initialData={{
            title: editingAddress.title,
            street: editingAddress.street,
            house: editingAddress.house,
            apartment: editingAddress.apartment,
            city: editingAddress.city,
            region: editingAddress.region,
            postalCode: editingAddress.postalCode,
            landmark: editingAddress.landmark,
            comment: editingAddress.comment,
            country: editingAddress.country,
            isDefault: editingAddress.isDefault
          }}
          addressId={editingAddress.id}
        />
      )}
    </div>
  );
}