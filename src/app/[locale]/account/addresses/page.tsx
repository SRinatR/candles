
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


// TODO: Translate Zod messages properly
const addressSchema = z.object({
  id: z.string().optional(), 
  street: z.string().min(1, { message: "Street address is required." }),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(1, { message: "State/Province is required." }),
  zipCode: z.string().min(1, { message: "ZIP/Postal code is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const mockAddresses: Address[] = [
  { id: 'addr1', street: '123 Main St', city: 'Anytown', state: 'CA', zipCode: '90210', country: 'USA', isDefault: true },
  { id: 'addr2', street: '456 Oak Ave', city: 'Otherville', state: 'NY', zipCode: '10001', country: 'USA', isDefault: false },
];


export default function AddressesPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getAddressesPageDictionary(locale);

  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { street: '', city: '', state: '', zipCode: '', country: 'USA', isDefault: false },
  });

  const handleAddNew = () => {
    setEditingAddress(null);
    form.reset({ street: '', city: '', state: '', zipCode: '', country: 'USA', isDefault: false });
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    form.reset(address);
    setIsFormOpen(true);
  };

  const handleDelete = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    toast({ title: dictionary.addressDeletedToast, description: dictionary.addressDeletedDescToast });
  };
  
  const handleSetDefault = (addressId: string) => {
     setAddresses(prev => prev.map(addr => ({...addr, isDefault: addr.id === addressId })));
     toast({ title: dictionary.defaultAddressSetToast, description: dictionary.defaultAddressDescToast });
  };


  function onSubmit(data: AddressFormValues) {
    if (editingAddress) {
      setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? { ...editingAddress, ...data } : addr));
      toast({ title: dictionary.addressUpdatedToast, description: dictionary.addressUpdatedDescToast });
    } else {
      const newAddress = { ...data, id: `addr${Date.now()}` };
      setAddresses(prev => [...prev, newAddress]);
      toast({ title: dictionary.addressAddedToast, description: dictionary.addressAddedDescToast });
    }
    setIsFormOpen(false);
    form.reset();
  }

  if (isFormOpen) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{editingAddress ? dictionary.editAddressTitle : dictionary.addAddressTitle}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField name="street" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{dictionary.streetAddressLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="city" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{dictionary.cityLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="state" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{dictionary.stateProvinceLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="zipCode" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{dictionary.zipPostalCodeLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="country" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{dictionary.countryLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="isDefault" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>{dictionary.setDefaultAddressLabel}</FormLabel></div>
                  </FormItem>
                )}/>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{dictionary.cancelButton}</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{editingAddress ? dictionary.saveChangesButton : dictionary.addAddressFormButton}</Button>
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
        <Card><CardContent className="p-6 text-center text-muted-foreground">{dictionary.noAddressesYet}</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {addresses.map(address => (
            <Card key={address.id} className="shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <p className="font-semibold">{address.street}</p>
                    <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                    {address.isDefault && <span className="text-xs font-medium text-primary mt-1 inline-flex items-center"><Home className="h-3 w-3 mr-1" /> {dictionary.defaultBadge}</span>}
                  </div>
                  <div className="flex space-x-2 mt-3 sm:mt-0 shrink-0">
                    {!address.isDefault && (
                       <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>{dictionary.setDefaultButton}</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(address)} aria-label={dictionary.editButtonLabel}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={dictionary.deleteButtonLabel}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>{dictionary.confirmDeleteTitle}</AlertDialogTitle><AlertDialogDescription>{dictionary.confirmDeleteDesc}</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>{dictionary.cancelButton}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(address.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{dictionary.deleteConfirmButton}</AlertDialogAction></AlertDialogFooter>
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
