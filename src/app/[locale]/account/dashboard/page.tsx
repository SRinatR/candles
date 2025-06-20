"use client";

import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i1n-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingBag, 
  Package, 
  Heart, 
  Star, 
  Calendar,
  MapPin,
  CreditCard,
  Settings,
  User,
  ArrowRight,
  Mail,
  Phone,
  CalendarDays,
  Truck,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";

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

const getDateLocale = (locale: Locale) => {
  switch (locale) {
    case 'ru': return ru;
    case 'en': return enUS;
    default: return enUS;
  }
}

export default function DashboardPage() {
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
  
  // Mock user data for demonstration
  const user = {
    id: simulatedUser?.id || nextAuthSession?.user?.id || '1',
    firstName: simulatedUser?.firstName || nextAuthSession?.user?.firstName || 'User',
    lastName: simulatedUser?.lastName || nextAuthSession?.user?.lastName || '',
    email: simulatedUser?.email || nextAuthSession?.user?.email || 'user@example.com',
    phone: simulatedUser?.phone || null,
    image: simulatedUser?.image || nextAuthSession?.user?.image || null,
    emailVerified: simulatedUser?.isConfirmed || !!nextAuthSession?.user?.emailVerified,
    createdAt: simulatedUser?.createdAt || new Date(),
    role: 'USER',
    newsletter: simulatedUser?.newsletter || false,
    _count: {
      orders: 0,
      addresses: 0,
      wishlistItems: 0
    }
  };

  // Mock data for demonstration
  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      status: 'DELIVERED',
      total: 89.99,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      _count: {
        items: 2
      }
    }
  ];

  const addresses = [
    {
      id: '1',
      city: 'Tashkent',
      region: 'Tashkent',
      isDefault: true
    }
  ];

  const quickActions = [
    { 
      title: "View Orders", 
      description: "Track your recent purchases", 
      icon: ShoppingBag, 
      href: `/${locale}/account/orders`, 
      color: "bg-blue-500" 
    },
    { 
      title: "Manage Addresses", 
      description: "Update delivery addresses", 
      icon: MapPin, 
      href: `/${locale}/account/addresses`, 
      color: "bg-green-500" 
    },
    { 
      title: "Profile Settings", 
      description: "Update your personal info", 
      icon: User, 
      href: `/${locale}/account/profile`, 
      color: "bg-purple-500" 
    },
    { 
      title: "Account Settings", 
      description: "Security and preferences", 
      icon: Settings, 
      href: `/${locale}/account/settings`, 
      color: "bg-orange-500" 
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName} {user.lastName || ''}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your account
            </p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || ''} alt={`${user.firstName} ${user.lastName || ''}`.trim() || 'User'} />
                <AvatarFallback>
                  {user.firstName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>
                Your account statistics and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ShoppingBag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{user._count.orders}</div>
                  <div className="text-sm text-blue-700">Total Orders</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{user._count.addresses}</div>
                  <div className="text-sm text-green-700">Addresses</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">{user._count.wishlistItems}</div>
                  <div className="text-sm text-purple-700">Wishlist Items</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-orange-700">Days Member</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Your latest purchases and their status
                  </CardDescription>
                </div>
                <Link href={`/${locale}/account/orders`}>
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start shopping to see your orders here
                  </p>
                  <Link href={`/${locale}/products`}>
                    <Button>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Package className="h-8 w-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order._count.items} item{order._count.items !== 1 ? 's' : ''} • 
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used account features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color} text-white mr-3`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your current account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                {user.emailVerified ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    Pending
                  </Badge>
                )}
              </div>
              
              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </div>
                </div>
              )}
              
              {addresses.length > 0 && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Default Address</p>
                    <p className="text-sm text-gray-600">
                      {addresses[0].city}, {addresses[0].region}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}