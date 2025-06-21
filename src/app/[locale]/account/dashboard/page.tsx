"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShoppingBag, 
  Package, 
  Heart, 
  Star, 
  TrendingUp, 
  Calendar,
  MapPin,
  CreditCard,
  Gift,
  Award,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import type { Locale } from '@/lib/i1n-config';
import { mockOrders } from "@/lib/mock-data";
import { useState, useEffect } from "react";

// Mock data for dashboard
const mockUserStats = {
  totalOrders: 12,
  totalSpent: 450000,
  favoriteProducts: 8,
  loyaltyPoints: 1250,
  memberSince: "2023-06-15",
  nextReward: 2000,
  currentTier: "Silver"
};

const mockRecentActivity = [
  { id: 1, type: "order", description: "Order #ORD-2024-001 delivered", date: "2024-01-15", icon: Package },
  { id: 2, type: "review", description: "Reviewed Lavender Candle", date: "2024-01-12", icon: Star },
  { id: 3, type: "wishlist", description: "Added Rose Scented Candle to wishlist", date: "2024-01-10", icon: Heart },
  { id: 4, type: "order", description: "Order #ORD-2024-002 placed", date: "2024-01-08", icon: ShoppingBag }
];

const mockQuickActions = [
  { title: "Reorder Favorites", description: "Quickly reorder your most loved items", icon: ShoppingBag, href: "/products", color: "bg-blue-500" },
  { title: "Track Orders", description: "Check the status of your recent orders", icon: Package, href: "/account/orders", color: "bg-green-500" },
  { title: "Update Profile", description: "Keep your information up to date", icon: MapPin, href: "/account/profile", color: "bg-purple-500" },
  { title: "Manage Addresses", description: "Add or edit shipping addresses", icon: MapPin, href: "/account/addresses", color: "bg-orange-500" }
];

interface DashboardPageProps {
  params: {
    locale: Locale;
  };
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as Locale) || 'uz';
  
  const { data: nextAuthSession } = useSession();
  const { currentUser: simulatedUser } = useUnifiedAuth();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="flex justify-center items-center min-h-[300px]">Loading...</div>;
  }
  
  const user = nextAuthSession?.user || simulatedUser;
  const userName = user?.name || user?.email || "Guest";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const recentOrders = mockOrders.slice(0, 3);
  const progressToNextReward = (mockUserStats.loyaltyPoints / mockUserStats.nextReward) * 100;
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image && user.image.trim() !== '' ? user.image : undefined} alt={userName} />
            <AvatarFallback className="text-lg font-semibold">{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your account</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Award className="w-4 h-4 mr-1" />
          {mockUserStats.currentTier} Member
        </Badge>
      </div>
      
      <Separator />
      
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUserStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUserStats.totalSpent.toLocaleString()} UZS</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUserStats.loyaltyPoints}</div>
            <p className="text-xs text-muted-foreground">{mockUserStats.nextReward - mockUserStats.loyaltyPoints} points to next reward</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUserStats.favoriteProducts}</div>
            <p className="text-xs text-muted-foreground">3 items on sale</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Loyalty Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Loyalty Progress
          </CardTitle>
          <CardDescription>
            You're {mockUserStats.nextReward - mockUserStats.loyaltyPoints} points away from your next reward!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Points: {mockUserStats.loyaltyPoints}</span>
              <span>Next Reward: {mockUserStats.nextReward}</span>
            </div>
            <Progress value={progressToNextReward} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Earn points with every purchase and unlock exclusive rewards!
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockQuickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/${locale}${action.href}`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Recent Activity & Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Orders
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/account/orders`}>
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                  <p className="text-sm font-medium mt-1">
                    {order.totalAmount.toLocaleString()} UZS
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-full">
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}