"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; 
import { useSession } from "next-auth/react";
import { Chrome, Send, Globe, Link2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react"; 
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';
import dynamic from 'next/dynamic';

// Типы для словарей
type AccountLinkingDictionary = {
  title: string;
  description: string;
  google: string;
  telegram: string;
  yandex: string;
  featureComingSoonTitle: string;
  linkFeatureComingSoon: string;
  unlinkNotAllowedTitle: string;
  unlinkNotAllowedDesc: string;
  unlinkFeatureComingSoon: string;
  connectedAccountsTitle: string;
  connectedAccountsDesc: string;
  linkedStatus: string;
  unlinkButton: string;
  linkAccountButton: string;
  primarySignInMethodNote: string;
};

// Fallback словарь для prerendering
const fallbackDictionary: AccountLinkingDictionary = {
  title: "Account Linking",
  description: "Connect your accounts for easier access",
  google: "Google",
  telegram: "Telegram", 
  yandex: "Yandex",
  featureComingSoonTitle: "Feature Coming Soon",
  linkFeatureComingSoon: "Linking with {provider} will be available soon",
  unlinkNotAllowedTitle: "Cannot Unlink",
  unlinkNotAllowedDesc: "You must have at least one linked account",
  unlinkFeatureComingSoon: "Unlinking from {provider} will be available soon",
  connectedAccountsTitle: "Connected Accounts",
  connectedAccountsDesc: "Manage your connected accounts",
  linkedStatus: "Linked",
  unlinkButton: "Unlink",
  linkAccountButton: "Link Account",
  primarySignInMethodNote: "This is your primary sign-in method",
};

// Безопасная загрузка словарей
const loadDictionary = async (locale: Locale): Promise<AccountLinkingDictionary> => {
  try {
    const dictionaries = {
      en: () => import('@/dictionaries/en.json'),
      ru: () => import('@/dictionaries/ru.json'),
      uz: () => import('@/dictionaries/uz.json'),
    };
    
    const loadDict = dictionaries[locale] || dictionaries.en;
    const dict = await loadDict();
    return dict.default?.accountLinkingPage || dict.accountLinkingPage || fallbackDictionary;
  } catch (error) {
    console.warn('Failed to load dictionary, using fallback:', error);
    return fallbackDictionary;
  }
};

interface LinkedAccount {
  provider: string;
  name: string;
  iconName: 'Chrome' | 'Send' | 'Globe';
  linked: boolean;
  email?: string; 
}

// Компонент для безопасного рендеринга иконок
const IconRenderer: React.FC<{ iconName: 'Chrome' | 'Send' | 'Globe'; className?: string }> = ({ 
  iconName, 
  className = "h-6 w-6 text-muted-foreground" 
}) => {
  switch (iconName) {
    case 'Chrome':
      return <Chrome className={className} />;
    case 'Send':
      return <Send className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    default:
      return <Globe className={className} />;
  }
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
    <Card className="shadow-lg">
      <CardHeader>
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Основной компонент
function AccountLinkingPageComponent() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const params = useParams();
  
  // Состояния для безопасной загрузки
  const [dictionary, setDictionary] = useState<AccountLinkingDictionary>(fallbackDictionary);
  const [isLoadingDict, setIsLoadingDict] = useState(true);
  const [locale, setLocale] = useState<Locale>('uz');

  // Безопасное получение locale из params
  useEffect(() => {
    if (params?.locale) {
      setLocale(params.locale as Locale);
    }
  }, [params?.locale]);

  // Загрузка словаря
  useEffect(() => {
    let isMounted = true;
    
    const loadDict = async () => {
      try {
        const dict = await loadDictionary(locale);
        if (isMounted) {
          setDictionary(dict);
          setIsLoadingDict(false);
        }
      } catch (error) {
        if (isMounted) {
          setDictionary(fallbackDictionary);
          setIsLoadingDict(false);
        }
      }
    };

    loadDict();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Loading state для сессии или словаря
  if (status === "loading" || isLoadingDict) {
    return <LoadingSkeleton />;
  }

  // Безопасное создание linkedAccounts с fallback значениями
  const linkedAccounts: LinkedAccount[] = [
    { 
      provider: "google", 
      name: dictionary.google || "Google", 
      iconName: 'Chrome',
      linked: Boolean(session?.user?.email), 
      email: session?.user?.email || undefined 
    },
    { 
      provider: "telegram", 
      name: dictionary.telegram || "Telegram", 
      iconName: 'Send',
      linked: false 
    },
    { 
      provider: "yandex", 
      name: dictionary.yandex || "Yandex", 
      iconName: 'Globe',
      linked: false 
    },
  ];

  const linkedAccountsCount = linkedAccounts.filter(acc => acc.linked).length;

  const handleLinkAccount = async (provider: string) => {
    try {
      toast({
        title: dictionary.featureComingSoonTitle || "Feature Coming Soon",
        description: (dictionary.linkFeatureComingSoon || "Linking with {provider} will be available soon").replace('{provider}', provider),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkAccount = async (providerKey: string, providerName: string) => {
    try {
      // Предотвращаем отвязку последнего аккаунта
      if (providerKey === "google" && linkedAccountsCount <= 1) {
        toast({
          title: dictionary.unlinkNotAllowedTitle || "Cannot Unlink",
          description: dictionary.unlinkNotAllowedDesc || "You must have at least one linked account",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: dictionary.featureComingSoonTitle || "Feature Coming Soon",
        description: (dictionary.unlinkFeatureComingSoon || "Unlinking from {provider} will be available soon").replace('{provider}', providerName),
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to unlink account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {dictionary.title || "Account Linking"}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {dictionary.description || "Connect your accounts for easier access"}
        </p>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {dictionary.connectedAccountsTitle || "Connected Accounts"}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {dictionary.connectedAccountsDesc || "Manage your connected accounts"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {linkedAccounts.map((account, index) => (
            <div key={account.provider} className="space-y-2">
              {/* Account Row */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
                {/* Account Info */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <IconRenderer iconName={account.iconName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-card-foreground truncate">{account.name}</p>
                    {account.linked && account.email && (
                      <p className="text-xs text-muted-foreground truncate" title={account.email}>
                        {account.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Section */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  {account.linked ? (
                    <>
                      {/* Linked Status */}
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center font-medium">
                        <CheckCircle className="h-4 w-4 mr-1" /> 
                        {dictionary.linkedStatus || "Linked"}
                      </span>
                      
                      {/* Unlink Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAccount(account.provider, account.name)}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                        disabled={account.provider === "google" && linkedAccountsCount <= 1}
                      >
                        {dictionary.unlinkButton || "Unlink"}
                      </Button>
                    </>
                  ) : (
                    /* Link Button */
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkAccount(account.name)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent transition-colors duration-200"
                    >
                      <Link2 className="mr-2 h-4 w-4" /> 
                      {dictionary.linkAccountButton || "Link Account"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Warning for Primary Account */}
              {account.provider === "google" && account.linked && linkedAccountsCount <= 1 && (
                <div className="flex items-start gap-2 px-1 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dictionary.primarySignInMethodNote || "This is your primary sign-in method"}
                  </p>
                </div>
              )}

              {/* Add separator between accounts (except last one) */}
              {index < linkedAccounts.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Security Notice</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Linking multiple accounts provides backup access methods and enhanced security. 
                Always keep at least one account linked for secure access to your profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Экспорт компонента с dynamic loading для отключения SSR
export default dynamic(() => Promise.resolve(AccountLinkingPageComponent), {
  ssr: false,
  loading: () => <LoadingSkeleton />
});