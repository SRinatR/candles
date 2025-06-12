
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { BarChart, DollarSign, Package, ShoppingCart, Users, CreditCard, TrendingUp, TrendingDown, Repeat, Gift, BarChartBig, History, ListChecks } from "lucide-react"; // Added TrendingDown
import { useEffect, useState } from "react";
import type { AdminLocale } from "@/admin/lib/i18n-config-admin";
import { i18nAdmin } from "@/admin/lib/i18n-config-admin";
import { getAdminDictionary } from "@/admin/lib/getAdminDictionary";
import type enAdminMessages from '@/admin/dictionaries/en.json';
import { getAdminLogs, type AdminLogEntry } from '@/admin/lib/admin-logger';
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea

type AdminDashboardDictionary = typeof enAdminMessages.adminDashboardPage;

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral'; 
}

function StatCard({ title, value, description, icon: Icon, trend = 'neutral' }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center">
          {value}
          {trend === 'up' && <TrendingUp className="ml-2 h-5 w-5 text-green-500" />}
          {trend === 'down' && <TrendingDown className="ml-2 h-5 w-5 text-red-500" />}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { currentAdminUser } = useAdminAuth();
  const [dict, setDict] = useState<AdminDashboardDictionary | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminLogEntry[]>([]);

  useEffect(() => {
    async function loadDictionary() {
      const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
      const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminDashboardPage);
    }
    loadDictionary();
    setRecentLogs(getAdminLogs().slice(0, 5)); 
  }, []); 

  // Effect to refresh recent logs if logs might change due to actions on other pages
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'askimAdminLogs') {
        setRecentLogs(getAdminLogs().slice(0, 5));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  if (!dict) {
    return <div className="flex h-screen items-center justify-center"><p>Loading Dashboard...</p></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
          <p className="text-muted-foreground">
            {dict.welcomeMessage.replace('{name}', currentAdminUser?.name || 'Admin')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title={dict.totalRevenue} value="45,231,890 UZS" description={dict.fromLastMonth.replace('{percent}', '20.1')} icon={DollarSign} trend="up" />
        <StatCard title={dict.totalPayments} value="44,810,200 UZS" description={dict.successfulPayments.replace('{percent}', '99.5')} icon={CreditCard} />
        <StatCard title={dict.activeProducts} value="78" description={dict.newThisWeek.replace('{count}', '6')} icon={Package} />
        <StatCard title={dict.totalTransactions} value="3,102" description={dict.today.replace('{count}', '280')} icon={ShoppingCart} trend="up"/>
        <StatCard title={dict.totalClients} value="1,250" description={dict.newClientsThisWeek.replace('{count}', '30')} icon={Users} />
        <StatCard title={dict.returningCustomers} value="35%" description={dict.increaseThisMonth.replace('{percent}', '5')} icon={Repeat} trend="up"/>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary"/> {dict.top10Products}</CardTitle>
            <CardDescription>{dict.top10ProductsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Lavender Bliss Candle - 150 sales</li>
              <li>2. Elegant Swan Wax Figure - 98 sales</li>
              <li>3. Vanilla Dream Candle - 85 sales</li>
              <li className="pt-2 font-semibold">{dict.placeholderList}</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/> Recent Activity</CardTitle>
            <CardDescription>Latest actions in the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <ScrollArea className="h-[200px] pr-3">
                <ul className="space-y-3">
                  {recentLogs.map((log, index) => (
                    <li key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <p className="font-medium truncate text-sm">{log.action}</p>
                      <p className="text-muted-foreground text-xs">
                        {log.userEmail} - {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                       {log.details && Object.keys(log.details).length > 0 && (
                         <p className="text-muted-foreground text-xs truncate">
                           Details: {Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                         </p>
                       )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">{dict.placeholderList}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground text-center">{dict.demoDataNote}</p>
    </div>
  );
}
