
"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, MapPin, ShoppingBag, LogOut, Link2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"; 
import { useAuth as useSimulatedAuth } from "@/contexts/AuthContext"; 
import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

const getAccountLayoutDictionary = (locale: Locale) => {
  return dictionaries[locale]?.accountLayout || dictionaries.en.accountLayout;
};


export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routeParams = useParams();
  const locale = routeParams.locale as Locale || 'uz';
  const dictionary = getAccountLayoutDictionary(locale);

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, logout: simulatedLogout, isLoading: isLoadingSimulatedAuth } = useSimulatedAuth();
  const { toast } = useToast();

  const isAuthenticated = !!nextAuthSession || !!simulatedUser;
  const isLoadingAuth = nextAuthStatus === "loading" || isLoadingSimulatedAuth;

  const sidebarNavItems = [
    { title: dictionary.navProfile, href: `/${locale}/account/profile`, icon: User },
    { title: dictionary.navAddresses, href: `/${locale}/account/addresses`, icon: MapPin },
    { title: dictionary.navOrderHistory, href: `/${locale}/account/orders`, icon: ShoppingBag },
    { title: dictionary.navAccountLinking, href: `/${locale}/account/linking`, icon: Link2 },
  ];

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace(`/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoadingAuth, isAuthenticated, router, pathname, locale]);

  const handleLogout = async () => {
    try {
      if (nextAuthSession) {
        await nextAuthSignOut({ callbackUrl: `/${locale}/login` });
      }
      if (simulatedUser) {
        simulatedLogout(); 
      }
      toast({
        title: dictionary.loggedOutTitle,
        description: dictionary.loggedOutDesc,
      });
    } catch (error) {
      toast({
        title: dictionary.logoutFailedTitle,
        description: dictionary.logoutFailedDesc,
        variant: "destructive",
      });
    }
  };

  let welcomeName = dictionary.guest;
  if (nextAuthSession?.user?.name) welcomeName = nextAuthSession.user.name;
  else if (simulatedUser?.name) welcomeName = simulatedUser.name;
  else if (nextAuthSession?.user?.email) welcomeName = nextAuthSession.user.email;
  else if (simulatedUser?.email) welcomeName = simulatedUser.email;


  if (isLoadingAuth || !isAuthenticated) {
    return <div className="flex justify-center items-center min-h-[300px]"><p>{dictionary.loadingAccount}</p></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dictionary.myAccountTitle}</h1>
          <p className="text-muted-foreground">{dictionary.welcomeBack.replace('{name}', welcomeName)}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> {dictionary.logoutButton}
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/4">
          <Card>
            <CardContent className="p-2">
            <nav className="flex flex-col space-y-1">
              {sidebarNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-base px-3 py-2 h-auto",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.title}
                  </Button>
                </Link>
              ))}
            </nav>
            </CardContent>
          </Card>
        </aside>
        <div className="flex-1 lg:max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
