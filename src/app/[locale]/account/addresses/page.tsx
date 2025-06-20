"use client";

import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i1n-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AddressesClient } from "./AddressesClient";

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en;
};

export default function AddressesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as Locale) || 'uz';
  
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useAuth();
  
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = !!nextAuthSession || !!simulatedUser;
  const isLoadingAuth = nextAuthStatus === "loading" || isLoadingSimulatedAuth;
  
  useEffect(() => {
    const dictionary = getDictionary(locale);
    setDict(dictionary);
  }, [locale]);
  
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    } else if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isLoadingAuth, isAuthenticated, router, locale]);
  
  if (isLoadingAuth || isLoading || !dict) {
    return <div className="flex justify-center items-center min-h-[300px]"><p>Loading...</p></div>;
  }
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{dict.accountAddressesPage.manageAddressesTitle}</h1>
        <p className="text-muted-foreground">{dict.accountAddressesPage.manageAddressesDesc}</p>
      </div>

      <AddressesClient 
        dictionary={dict.accountAddressesPage}
        locale={locale}
      />
    </div>
  );
}