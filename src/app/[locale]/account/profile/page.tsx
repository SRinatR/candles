
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react"; 
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth"; 
import { Edit3, Camera, Calendar, MapPin, Mail, Phone, User as UserIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getProfilePageDictionary = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.accountProfilePage;
};

// Enhanced profile schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }), 
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters." }).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  location: z.string().optional(),
  preferredLanguage: z.string().optional(),
  newsletter: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getProfilePageDictionary(locale);
  const [isEditing, setIsEditing] = useState(false);

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useUnifiedAuth();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: "", 
      email: "", 
      phone: "",
      dateOfBirth: "",
      gender: "",
      bio: "",
      website: "",
      location: "",
      preferredLanguage: locale,
      newsletter: false
    },
    mode: "onChange"
  });

  useEffect(() => {
    let name = "";
    let email = "";

    if (nextAuthSession?.user) {
      name = nextAuthSession.user.name || "";
      email = nextAuthSession.user.email || "";
    } else if (simulatedUser) {
      name = simulatedUser.name || "";
      email = simulatedUser.email || "";
    }
    
    form.reset({ 
      name, 
      email, 
      phone: simulatedUser?.phone || "",
      dateOfBirth: "",
      gender: "",
      bio: "",
      website: "",
      location: "",
      preferredLanguage: locale,
      newsletter: false
    });
  }, [nextAuthSession, simulatedUser, form, locale]);

  const onSubmit = async (data: any) => {
    console.log("Profile data to update:", data);
    setIsEditing(false);
    toast({
      title: dictionary.updateProfileTitle,
      description: dictionary.updateProfileDesc,
    });
  };
  
  if (nextAuthStatus === "loading" || isLoadingSimulatedAuth) {
    return <div className="flex justify-center items-center p-10"><p>{dictionary.loadingProfile}</p></div>;
  }

  if (nextAuthStatus === "unauthenticated" && !simulatedUser) {
    return <div className="flex justify-center items-center p-10"><p>{dictionary.pleaseLogin}</p></div>;
  }

  const user = nextAuthSession?.user || simulatedUser;
  const userName = user?.name || user?.email || "Guest";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {/* Profile Header */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.image && user.image.trim() !== '' ? user.image : undefined} alt={userName} />
                  <AvatarFallback className="text-lg font-medium bg-gray-100 text-gray-700">{userInitials}</AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 bg-white border border-gray-200 hover:bg-gray-50"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Profile picture upload will be available soon." })}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-medium text-gray-900">{userName}</h2>
                <p className="text-gray-600 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">Member</Badge>
                  <Badge variant="outline" className="text-xs text-green-700 border-green-200">Verified</Badge>
                </div>
              </div>
              
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-medium text-gray-900">{dictionary.profileInfoTitle}</CardTitle>
            <CardDescription className="text-sm text-gray-600">{dictionary.profileInfoDesc}</CardDescription>
          </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{dictionary.fullNameLabel}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{dictionary.emailAddressLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled={!!nextAuthSession?.user?.email || !!simulatedUser?.email || !isEditing}
                            className="mt-1" 
                          />
                        </FormControl>
                        <FormMessage />
                        {(nextAuthSession?.user?.email || simulatedUser?.email) && (
                          <FormDescription className="text-xs text-gray-500">
                            {nextAuthSession?.user?.email ? dictionary.emailManagedByProvider : dictionary.emailForLogin}
                          </FormDescription>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="phone" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{dictionary.phoneLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            {...field} 
                            placeholder={dictionary.phonePlaceholder}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="location" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Location</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="City, Country"
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
               
               {/* Additional Information */}
               <div>
                 <h3 className="text-sm font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <FormField 
                    control={form.control} 
                    name="bio" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell us about yourself..."
                            className="min-h-[80px] mt-1 resize-none"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField 
                      control={form.control} 
                      name="website" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Website</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://yourwebsite.com"
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField 
                      control={form.control} 
                      name="preferredLanguage" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Preferred Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                              <SelectItem value="uz">O'zbek</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            {isEditing && (
              <CardFooter className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>
      
        {/* Account Statistics */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900">Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50/70 border border-slate-200 rounded-lg">
                <div className="text-2xl font-semibold text-slate-700 mb-1">12</div>
                <div className="text-xs text-slate-500">Orders</div>
              </div>
              <div className="text-center p-4 bg-zinc-50/70 border border-zinc-200 rounded-lg">
                <div className="text-2xl font-semibold text-zinc-700 mb-1">8</div>
                <div className="text-xs text-zinc-500">Wishlist</div>
              </div>
              <div className="text-center p-4 bg-stone-50/70 border border-stone-200 rounded-lg">
                <div className="text-2xl font-semibold text-stone-700 mb-1">1,250</div>
                <div className="text-xs text-stone-500">Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
