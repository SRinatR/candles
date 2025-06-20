
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useAuth as useSimulatedAuth } from "@/contexts/AuthContext";
import { Package, Search, Filter, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, XCircle, Eye, Download, RefreshCw } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';
import Link from "next/link";

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getOrdersPageDictionary = (locale: Locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.accountOrdersPage;
};

// Mock order data
const mockOrders = [
  {
    id: "ORD-2024-001",
    date: "2024-01-15",
    status: "delivered",
    total: 89.99,
    items: [
      { name: "Vanilla Candle", quantity: 2, price: 24.99 },
      { name: "Lavender Candle", quantity: 1, price: 39.99 }
    ],
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentMethod: "Credit Card ending in 4242",
    trackingNumber: "TRK123456789"
  },
  {
    id: "ORD-2024-002",
    date: "2024-01-20",
    status: "shipped",
    total: 156.50,
    items: [
      { name: "Rose Candle Set", quantity: 1, price: 79.99 },
      { name: "Citrus Candle", quantity: 3, price: 25.50 }
    ],
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
    paymentMethod: "PayPal",
    trackingNumber: "TRK987654321"
  },
  {
    id: "ORD-2024-003",
    date: "2024-01-25",
    status: "processing",
    total: 45.00,
    items: [
      { name: "Eucalyptus Candle", quantity: 1, price: 29.99 },
      { name: "Tea Light Set", quantity: 1, price: 15.00 }
    ],
    shippingAddress: "789 Pine St, Chicago, IL 60601",
    paymentMethod: "Credit Card ending in 1234",
    trackingNumber: null
  },
  {
    id: "ORD-2024-004",
    date: "2024-01-28",
    status: "cancelled",
    total: 67.99,
    items: [
      { name: "Sandalwood Candle", quantity: 2, price: 33.99 }
    ],
    shippingAddress: "321 Elm St, Miami, FL 33101",
    paymentMethod: "Credit Card ending in 5678",
    trackingNumber: null
  }
];

type OrderStatus = "all" | "processing" | "shipped" | "delivered" | "cancelled";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "processing":
      return <Clock className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "processing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "shipped":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function OrdersPage() {
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getOrdersPageDictionary(locale);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useSimulatedAuth();

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = mockOrders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.total - b.total;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const orderStats = useMemo(() => {
    const total = mockOrders.length;
    const delivered = mockOrders.filter(o => o.status === "delivered").length;
    const processing = mockOrders.filter(o => o.status === "processing").length;
    const shipped = mockOrders.filter(o => o.status === "shipped").length;
    const totalSpent = mockOrders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    
    return { total, delivered, processing, shipped, totalSpent };
  }, []);

  const handleTrackOrder = (trackingNumber: string) => {
    toast({
      title: "Tracking Order",
      description: `Tracking number: ${trackingNumber}`,
    });
  };

  const handleDownloadInvoice = (orderId: string) => {
    toast({
      title: "Downloading Invoice",
      description: `Invoice for order ${orderId} will be downloaded.`,
    });
  };

  const handleReorder = (orderId: string) => {
    toast({
      title: "Reordering Items",
      description: `Items from order ${orderId} added to cart.`,
    });
  };

  if (nextAuthStatus === "loading" || isLoadingSimulatedAuth) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2">{dictionary.loadingOrders}</p>
      </div>
    );
  }

  if (nextAuthStatus === "unauthenticated" && !simulatedUser) {
    return (
      <div className="flex justify-center items-center p-10">
        <p>{dictionary.pleaseLogin}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Track and manage all your orders in one place</p>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{orderStats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-3xl font-bold text-green-600">{orderStats.delivered}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{orderStats.processing + orderStats.shipped}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">{orderStats.totalSpent.toLocaleString()} UZS</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Package className="h-5 w-5 text-blue-600" />
                  {dictionary.orderHistoryTitle}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">{dictionary.orderHistoryDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 lg:flex-[2]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order ID or product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="w-full lg:w-36">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <Select value={statusFilter} onValueChange={(value: OrderStatus) => setStatusFilter(value)}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full lg:w-36">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as "date" | "total");
                  setSortOrder(order as "asc" | "desc");
                }}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="total-desc">Highest Amount</SelectItem>
                    <SelectItem value="total-asc">Lowest Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredAndSortedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                filteredAndSortedOrders.map((order) => (
                  <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            {/* Order Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg text-gray-900">{order.id}</h3>
                                <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1`}>
                                  {getStatusIcon(order.status)}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Order Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Order Date</p>
                                    <p className="text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <CreditCard className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Total Amount</p>
                                    <p className="text-gray-600 font-semibold">{order.total.toLocaleString()} UZS</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="p-2 bg-purple-50 rounded-lg">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Shipping Address</p>
                                    <p className="text-gray-600 break-words">{order.shippingAddress}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="p-2 bg-orange-50 rounded-lg">
                                    <CreditCard className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Payment Method</p>
                                    <p className="text-gray-600">{order.paymentMethod}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Order Items */}
                            <div className="border-t pt-4">
                              <p className="text-sm font-medium text-gray-900 mb-3">Order Items ({order.items.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-3 py-1 bg-gray-50 border-gray-200">
                                    {item.quantity}x {item.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 min-w-0 xl:min-w-[200px]">
                            <Link href={`/${locale}/account/orders/${order.id}`} className="w-full">
                              <Button variant="outline" size="sm" className="w-full justify-start">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                            </Link>
                            
                            {order.trackingNumber && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleTrackOrder(order.trackingNumber!)}
                                className="w-full justify-start"
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Track Order
                              </Button>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadInvoice(order.id)}
                              className="w-full justify-start"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Invoice
                            </Button>
                            
                            {order.status === "delivered" && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => handleReorder(order.id)}
                                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

