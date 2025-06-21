
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Truck } from 'lucide-react';
import { mockOrders, mockProducts } from '@/lib/mock-data';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';
import type { Locale } from '@/lib/i1n-config';
import { getDictionary } from '@/lib/getDictionary';
import { useState, useEffect } from 'react';
import type { Order, CartItem as OrderItemType, Product } from '@/lib/types';

function getStatusBadgeVariant(status: Order['status']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'Delivered': return 'default';
    case 'Shipped': return 'default';
    case 'Processing': return 'secondary';
    case 'Pending': return 'outline';
    case 'Cancelled': return 'destructive';
    default: return 'outline';
  }
}

function getTranslatedStatus(status: Order['status'], dictionary: any): string {
    const fallbacks = {
        'Delivered': 'Delivered',
        'Shipped': 'Shipped', 
        'Processing': 'Processing',
        'Pending': 'Pending',
        'Cancelled': 'Cancelled'
    };
    
    switch (status) {
        case 'Delivered': return dictionary?.accountOrderDetailPage?.statusDelivered || fallbacks.Delivered;
        case 'Shipped': return dictionary?.accountOrderDetailPage?.statusShipped || fallbacks.Shipped;
        case 'Processing': return dictionary?.accountOrderDetailPage?.statusProcessing || fallbacks.Processing;
        case 'Pending': return dictionary?.accountOrderDetailPage?.statusPending || fallbacks.Pending;
        case 'Cancelled': return dictionary?.accountOrderDetailPage?.statusCancelled || fallbacks.Cancelled;
        default: return status;
    }
}

interface OrderDetailPageProps {
  params: Promise<{
    orderId: string;
    locale: Locale;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [dictionary, setDictionary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = React.useState<{ orderId: string; locale: Locale } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Load dictionary
  useEffect(() => {
    if (!resolvedParams) return;
    
    const loadDictionary = async () => {
      try {
        const locale = resolvedParams.locale || 'uz';
        const dict = await getDictionary(locale);
        setDictionary(dict);
      } catch (error) {
        // Handle error silently in production
      } finally {
        setLoading(false);
      }
    };
    loadDictionary();
  }, [resolvedParams]);

  if (!resolvedParams) {
    return <div>Loading...</div>;
  }

  const locale = resolvedParams.locale || 'uz';

  const order = mockOrders.find(o => o.id === resolvedParams.orderId || o.orderNumber === resolvedParams.orderId);

  if (!order) {
    notFound();
  }

  // Augment order items with full product details for name and image, considering multilingual names
  const detailedItems = order.items.map(item => {
    const productDetails = mockProducts.find(p => p.id === item.id);
    const itemName = productDetails?.name[locale] || productDetails?.name.en || item.name[locale] || item.name.en || "Unknown Product";
    const itemImages = productDetails?.images || item.images || ["https://placehold.co/100x100.png?text=No+Image"];
    const mainImage = productDetails?.mainImage || itemImages[0];
    return { ...item, name: itemName, images: itemImages, mainImage: mainImage }; // Ensure name is the localized one
  });

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={`/${locale}/`}>{dictionary?.accountOrderDetailPage?.home || 'Home'}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbLink href={`/${locale}/account`}>{dictionary?.accountOrderDetailPage?.account || 'Account'}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
           <BreadcrumbItem><BreadcrumbLink href={`/${locale}/account/orders`}>{dictionary?.accountOrderDetailPage?.orders || 'Orders'}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbPage>{(dictionary?.accountOrderDetailPage?.orderBreadcrumb || 'Order {orderNumber}').replace('{orderNumber}', order.orderNumber)}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dictionary?.accountOrderDetailPage?.orderDetailsTitle || 'Order Details'}</h1>
        <Button variant="outline" asChild> 
            <Link href={`/${locale}/account/orders`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {dictionary?.accountOrderDetailPage?.backToOrdersButton || 'Back to Orders'}
            </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl">{(dictionary?.accountOrderDetailPage?.orderNumTitle || 'Order {orderNumber}').replace('{orderNumber}', order.orderNumber)}</CardTitle>
              <CardDescription>{dictionary?.accountOrderDetailPage?.placedOn || 'Placed on'} {new Date(order.date).toLocaleDateString()}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">{getTranslatedStatus(order.status, dictionary)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">{dictionary?.accountOrderDetailPage?.itemsOrdered || 'Items Ordered'}</h3>
            <ul className="space-y-4">
              {detailedItems.map((item) => (
                <li key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border shrink-0">
                    {((item.mainImage && typeof item.mainImage === 'string' && item.mainImage.trim() !== '') || (item.images && item.images.length > 0 && item.images[0] && typeof item.images[0] === 'string')) ? (
                      <Image 
                        src={
                          (item.mainImage && typeof item.mainImage === 'string' && item.mainImage.trim() !== '') 
                            ? item.mainImage 
                            : item.images[0]
                        } 
                        alt={item.name as string} 
                        fill 
                        className="object-cover" 
                        data-ai-hint="ordered item" 
                        sizes="64px" 
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <Link href={`/${locale}/products/${item.id}`} className="font-medium hover:text-primary">{item.name}</Link>
                    <p className="text-sm text-muted-foreground">{dictionary?.accountOrderDetailPage?.qty || 'Qty'} {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{(item.price * item.quantity).toLocaleString('en-US')} UZS</p>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">{dictionary?.accountOrderDetailPage?.orderSummary || 'Order Summary'}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary?.accountOrderDetailPage?.subtotal || 'Subtotal'}:</span><span>{order.totalAmount.toLocaleString('en-US')} UZS</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary?.accountOrderDetailPage?.shipping || 'Shipping'}:</span><span>{dictionary?.accountOrderDetailPage?.free || 'Free'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary?.accountOrderDetailPage?.taxes || 'Taxes'}:</span><span>{dictionary?.accountOrderDetailPage?.calculatedAtCheckout || 'Calculated at checkout'}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base"><span>{dictionary?.accountOrderDetailPage?.total || 'Total'}:</span><span>{order.totalAmount.toLocaleString('en-US')} UZS</span></div>
            </div>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">{dictionary?.accountOrderDetailPage?.shippingAddress || 'Shipping Address'}</h3>
              <address className="not-italic text-sm text-muted-foreground space-y-0.5"><p>Jane Doe</p><p>123 Main St, Apt 4B</p><p>Anytown, CA 90210</p><p>United States</p></address>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">{dictionary?.accountOrderDetailPage?.billingAddress || 'Billing Address'}</h3>
              <address className="not-italic text-sm text-muted-foreground space-y-0.5"><p>Jane Doe</p><p>123 Main St, Apt 4B</p><p>Anytown, CA 90210</p><p>United States</p></address>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{dictionary?.accountOrderDetailPage?.needHelp || 'Need help?'} <Link href={`/${locale}${dictionary?.accountOrderDetailPage?.contactPagePath || '/contact'}`} className="text-primary hover:underline">{dictionary?.accountOrderDetailPage?.contactSupport || 'Contact Support'}</Link></p>
            <div className="flex space-x-3">
                <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> {dictionary?.accountOrderDetailPage?.viewInvoiceButton || 'View Invoice'}</Button>
                <Button variant="outline" size="sm"><Truck className="mr-2 h-4 w-4" /> {dictionary?.accountOrderDetailPage?.trackPackageButton || 'Track Package'}</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
