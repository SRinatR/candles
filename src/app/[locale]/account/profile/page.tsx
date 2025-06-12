
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react"; 
import { useAuth as useSimulatedAuth } from "@/contexts/AuthContext"; 
import { Edit3 } from "lucide-react";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages; // Assuming en.json has all keys

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getProfilePageDictionary = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.accountProfilePage;
};

// TODO: Localize Zod messages properly
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }), 
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;


export default function ProfilePage() {
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getProfilePageDictionary(locale);

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useSimulatedAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", phone: "" },
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
    
    form.reset({ name, email, phone: simulatedUser?.phone || "" }); // Assuming phone might be in simulatedUser
  }, [nextAuthSession, simulatedUser, form]);

  async function onSubmit(data: ProfileFormValues) {
    console.log("Profile data to update:", data);
    // Here you would typically call an API to update the user's profile
    // For simulated auth, you might update localStorage or context state if implemented
    toast({
      title: dictionary.updateDemoTitle,
      description: dictionary.updateDemoDesc,
    });
  }
  
  if (nextAuthStatus === "loading" || isLoadingSimulatedAuth) {
    return <div className="flex justify-center items-center p-10"><p>{dictionary.loadingProfile}</p></div>;
  }

  if (nextAuthStatus === "unauthenticated" && !simulatedUser) {
    return <div className="flex justify-center items-center p-10"><p>{dictionary.pleaseLogin}</p></div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{dictionary.profileInfoTitle}</CardTitle>
        <CardDescription>{dictionary.profileInfoDesc}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{dictionary.fullNameLabel}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.emailAddressLabel}</FormLabel>
                  <FormControl><Input type="email" {...field} disabled={!!nextAuthSession?.user?.email || !!simulatedUser?.email} /></FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground pt-1">
                    {nextAuthSession?.user?.email ? dictionary.emailManagedByProvider : (simulatedUser?.email ? dictionary.emailForLogin : '')}
                  </p>
                </FormItem>
              )}/>
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.phoneLabel}</FormLabel>
                  <FormControl><Input type="tel" {...field} placeholder={dictionary.phonePlaceholder} /></FormControl>
                  <FormMessage />
                   <p className="text-xs text-muted-foreground pt-1">{dictionary.phoneBackendNote}</p>
                </FormItem>
              )}/>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <Edit3 className="mr-2 h-4 w-4" /> {dictionary.saveChangesButton}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
