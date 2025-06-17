"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Home, MapPin, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import type { Address } from '@/lib/types';
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { getDictionary } from "@/lib/getDictionary";
import { Separator } from "@/components/ui/separator";

type AddressesPageDictionary = {
  manageAddressesTitle: string;
  manageAddressesDesc: string;
  addNewAddressButton: string;
  noAddressesYet: string;
  editAddressTitle: string;
  addAddressTitle: string;
  streetAddressLabel: string;
  cityLabel: string;
  stateProvinceLabel: string;
  zipPostalCodeLabel: string;
  countryLabel: string;
  setDefaultAddressLabel: string;
  cancelButton: string;
  saveChangesButton: string;
  addAddressFormButton: string;
  defaultBadge: string;
  setDefaultButton: string;
  editButtonLabel: string;
  deleteButtonLabel: string;
  confirmDeleteTitle: string;
  confirmDeleteDesc: string;
  deleteConfirmButton: string;
  addressDeletedToast: string;
  addressDeletedDescToast: string;
  defaultAddressSetToast: string;
  defaultAddressDescToast: string;
  addressUpdatedToast: string;
  addressUpdatedDescToast: string;
  addressAddedToast: string;
  addressAddedDescToast: string;
};

// Enhanced address validation schema
const addressSchema = z.object({
  id: z.string().optional(), 
  street: z.string()
    .min(1, { message: "Street address is required." })
    .max(100, { message: "Street address is too long." }),
  city: z.string()
    .min(1, { message: "City is required." })
    .max(50, { message: "City name is too long." }),
  state: z.string()
    .min(1, { message: "State/Province is required." })
    .max(50, { message: "State/Province name is too long." }),
  zipCode: z.string()
    .min(1, { message: "ZIP/Postal code is required." })
    .max(20, { message: "ZIP/Postal code is too long." }),
  country: z.string()
    .min(1, { message: "Country is required." })
    .max(50, { message: "Country name is too long." }),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

// Loading skeleton component
const AddressSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
      </div>
      <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
    </div>
    
    <div className="grid gap-4">
      {[1, 2].map((i) => (
        <Card key={i} className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-8 animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default function AccountAddressesPage() {
  const { toast } = useToast();
  const params = useParams();
  const locale = (params?.locale as Locale) || 'uz';
  const [dictionary, setDictionary] = useState<AddressesPageDictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setIsLoading(true);
        const dict = await getDictionary(locale);
        setDictionary(dict.accountAddressesPage);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
        toast({
          title: "Error",
          description: "Failed to load page content. Please refresh.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadDictionary();
  }, [locale, toast]);

  // Memoized computed values
  const defaultAddress = useMemo(() => 
    addresses.find(addr => addr.isDefault), 
    [addresses]
  );

  const hasMultipleAddresses = useMemo(() => 
    addresses.length > 1, 
    [addresses.length]
  );

  const handleAddNew = useCallback(() => {
    setIsEditing(false);
    setEditingAddress(null);
    setIsFormVisible(true);
    form.reset({
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Uzbekistan",
      isDefault: addresses.length === 0, // Auto-set as default if it's the first address
    });
  }, [form, addresses.length]);

  const handleEdit = useCallback((address: Address) => {
    setIsEditing(true);
    setEditingAddress(address);
    setIsFormVisible(true);
    form.reset(address);
  }, [form]);

  const handleCancel = useCallback(() => {
    setIsFormVisible(false);
    setIsEditing(false);
    setEditingAddress(null);
    form.reset();
  }, [form]);

  const handleSetDefault = useCallback((addressId: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    );
    
    if (dictionary) {
      toast({
        title: dictionary.defaultAddressSetToast,
        description: dictionary.defaultAddressDescToast,
      });
    }
  }, [dictionary, toast]);

  const handleDelete = useCallback((addressId: string) => {
    const addressToDelete = addresses.find(addr => addr.id === addressId);
    
    // Prevent deleting the only address or the default address when there are multiple
    if (addresses.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one address.",
        variant: "destructive",
      });
      return;
    }

    setAddresses(prevAddresses => {
      const filteredAddresses = prevAddresses.filter(addr => addr.id !== addressId);
      
      // If we deleted the default address, set the first remaining as default
      if (addressToDelete?.isDefault && filteredAddresses.length > 0) {
        filteredAddresses[0].isDefault = true;
      }
      
      return filteredAddresses;
    });

    if (dictionary) {
      toast({
        title: dictionary.addressDeletedToast,
        description: dictionary.addressDeletedDescToast,
      });
    }
  }, [addresses, dictionary, toast]);

  const onSubmit = useCallback(async (data: AddressFormData) => {
    if (!dictionary) return;
    
    try {
      setIsSubmitting(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isEditing && editingAddress) {
        // Edit existing address
        setAddresses(prevAddresses =>
          prevAddresses.map(addr => {
            if (addr.id === editingAddress.id) {
              const updatedAddress = { ...data, id: editingAddress.id };
              
              // If setting this as default, unset others
              if (data.isDefault) {
                return updatedAddress;
              }
              return updatedAddress;
            }
            
            // If the edited address is set as default, unset others
            if (data.isDefault) {
              return { ...addr, isDefault: false };
            }
            return addr;
          })
        );
        
        toast({
          title: dictionary.addressUpdatedToast,
          description: dictionary.addressUpdatedDescToast,
        });
      } else {
        // Add new address
        const newAddress: Address = {
          ...data,
          id: Date.now().toString(),
        };
        
        setAddresses(prev => {
          // If this is the default address, unset others
          if (data.isDefault) {
            return [...prev.map(addr => ({ ...addr, isDefault: false })), newAddress];
          }
          return [...prev, newAddress];
        });
        
        toast({
          title: dictionary.addressAddedToast,
          description: dictionary.addressAddedDescToast,
        });
      }
      
      handleCancel();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [dictionary, isEditing, editingAddress, toast, handleCancel]);

  // Loading state
  if (isLoading) {
    return <AddressSkeleton />;
  }

  // Dictionary not loaded
  if (!dictionary) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-muted-foreground">Failed to load page content.</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form view
  if (isFormVisible) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-4 hover:bg-accent/50 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Addresses
        </Button>

        <Card className="max-w-2xl mx-auto shadow-lg border-border/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {isEditing ? dictionary.editAddressTitle : dictionary.addAddressTitle}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Street Address */}
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{dictionary.streetAddressLabel}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter street address"
                          className="transition-colors duration-200 focus:ring-2 focus:ring-ring"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{dictionary.cityLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter city"
                            className="transition-colors duration-200 focus:ring-2 focus:ring-ring"
                          />
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
                        <FormLabel className="text-sm font-medium">{dictionary.stateProvinceLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter state/province"
                            className="transition-colors duration-200 focus:ring-2 focus:ring-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* ZIP Code and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{dictionary.zipPostalCodeLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter ZIP/postal code"
                            className="transition-colors duration-200 focus:ring-2 focus:ring-ring"
                          />
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
                        <FormLabel className="text-sm font-medium">{dictionary.countryLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter country"
                            className="transition-colors duration-200 focus:ring-2 focus:ring-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                {/* Default Address Checkbox */}
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-border rounded-lg bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          {dictionary.setDefaultAddressLabel}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          This address will be used as your default shipping address.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="transition-colors duration-200"
                >
                  {dictionary.cancelButton}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    isEditing ? dictionary.saveChangesButton : dictionary.addAddressFormButton
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    );
  }

  // Main addresses view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{dictionary.manageAddressesTitle}</h2>
          <p className="text-muted-foreground leading-relaxed">{dictionary.manageAddressesDesc}</p>
        </div>
        <Button 
          onClick={handleAddNew} 
          className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-200 shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> 
          {dictionary.addNewAddressButton}
        </Button>
      </div>
      
      {/* Empty State */}
      {addresses.length === 0 ? (
        <Card className="shadow-lg border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{dictionary.noAddressesYet}</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Add your first address to enable faster checkout and delivery.
            </p>
            <Button onClick={handleAddNew} size="lg" className="shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> 
              {dictionary.addNewAddressButton}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Addresses List */
        <div className="grid gap-4">
          {addresses.map((address, index) => (
            <Card 
              key={address.id} 
              className="shadow-lg border-border/50 hover:shadow-xl transition-shadow duration-200"
            >
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  {/* Address Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-card-foreground truncate">{address.street}</h3>
                      {address.isDefault && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {dictionary.defaultBadge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {!address.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs transition-colors duration-200 hover:bg-accent/50"
                      >
                        {dictionary.setDefaultButton}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(address)}
                      aria-label={dictionary.editButtonLabel}
                      className="transition-colors duration-200 hover:bg-accent/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          aria-label={dictionary.deleteButtonLabel}
                          disabled={addresses.length === 1}
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {dictionary.confirmDeleteTitle}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="leading-relaxed">
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
      
      {/* Info Card */}
      {addresses.length > 0 && (
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Address Management</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your default address will be used for shipping. You can have multiple addresses and switch the default anytime.
                  {addresses.length === 1 && " You must have at least one address on file."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}