"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Home } from "lucide-react";
import type { Address } from '@/lib/types';
import React, { useState } from "react";
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
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getAddressesPageDictionary = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.accountAddressesPage;
};

// Address validation schema
const addressSchema = z.object({
  id: z.string().optional(), 
  street: z.string().min(1, { message: "Street address is required." }),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(1, { message: "State/Province is required." }),
  zipCode: z.string().min(1, { message: "ZIP/Postal code is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AccountAddressesPage() {
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getAddressesPageDictionary(locale);

  // Mock addresses data - в реальном приложении будет загружаться из API
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      street: "123 Main Street",
      city: "Tashkent",
      state: "Tashkent Region",
      zipCode: "100000",
      country: "Uzbekistan",
      isDefault: true,
    },
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Uzbekistan",
      isDefault: false,
    },
  });

  const handleAddNew = () => {
    setIsEditing(false);
    setEditingAddress(null);
    setIsFormVisible(true);
    form.reset({
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Uzbekistan",
      isDefault: false,
    });
  };

  const handleEdit = (address: Address) => {
    setIsEditing(true);
    setEditingAddress(address);
    setIsFormVisible(true);
    form.reset(address);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setIsEditing(false);
    setEditingAddress(null);
    form.reset();
  };

  const handleSetDefault = (addressId: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    );
    toast({
      title: dictionary.defaultAddressSetToast,
      description: dictionary.defaultAddressDescToast,
    });
  };

  const handleDelete = (addressId: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.filter(addr => addr.id !== addressId)
    );
    toast({
      title: dictionary.addressDeletedToast,
      description: dictionary.addressDeletedDescToast,
    });
  };

  const onSubmit = (data: AddressFormData) => {
    if (isEditing && editingAddress) {
      // Edit existing address
      setAddresses(prevAddresses =>
        prevAddresses.map(addr =>
          addr.id === editingAddress.id ? { ...addr, ...data } : addr
        )
      );
      toast({
        title: dictionary.addressUpdatedToast,
        description: dictionary.addressUpdatedDescToast,
      });
    } else {
      // Add new address
      const newAddress: Address = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      
      // If this is the first address or set as default, make it default
      if (addresses.length === 0 || data.isDefault) {
        setAddresses(prevAddresses =>
          prevAddresses.map(addr => ({ ...addr, isDefault: false }))
        );
        newAddress.isDefault = true;
      }
      
      setAddresses(prevAddresses => [...prevAddresses, newAddress]);
      toast({
        title: dictionary.addressAddedToast,
        description: dictionary.addressAddedDescToast,
      });
    }
    
    handleCancel();
  };

  if (isFormVisible) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>
            {isEditing ? dictionary.editAddressTitle : dictionary.addAddressTitle}
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.streetAddressLabel}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.cityLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.stateProvinceLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.zipPostalCodeLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.countryLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{dictionary.setDefaultAddressLabel}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {dictionary.cancelButton}
              </Button>
              <Button type="submit">
                {isEditing ? dictionary.saveChangesButton : dictionary.addAddressFormButton}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">{dictionary.manageAddressesTitle}</h2>
          <p className="text-muted-foreground">{dictionary.manageAddressesDesc}</p>
        </div>
        <Button onClick={handleAddNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" /> {dictionary.addNewAddressButton}
        </Button>
      </div>
      
      {addresses.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">{dictionary.noAddressesYet}</p>
            <Button onClick={handleAddNew} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> {dictionary.addNewAddressButton}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{address.street}</p>
                      {address.isDefault && (
                        <Badge variant="secondary">{dictionary.defaultBadge}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-muted-foreground">{address.country}</p>
                  </div>
                  
                  <div className="flex space-x-2">
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
                      aria-label={dictionary.editButtonLabel}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          aria-label={dictionary.deleteButtonLabel}
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {dictionary.deleteConfirmButton}
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
    </div>
  );
}