
import React from "react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockOrders, mockProducts } from "@/lib/mock-data"; 
import type { Order, CartItem as OrderItemType, Product } from "@/lib/types"; 
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation"; 
import { ArrowLeft, Package, FileText, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';
import type { Locale } from '@/lib/i1n-config';
import { getDictionary } from "@/lib/getDictionary";

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

type AccountOrderDetailPageDictionary = Awaited<ReturnType<typeof getDictionary>>['accountOrderDetailPage'];

function getTranslatedStatus(status: Order['status'], dict: AccountOrderDetailPageDictionary): string {
    switch (status) {
        case 'Delivered': return dict.statusDelivered;
        case 'Shipped': return dict.statusShipped;
        case 'Processing': return dict.statusProcessing;
        case 'Pending': return dict.statusPending;
        case 'Cancelled': return dict.statusCancelled;
        default: return status;
    }
}

interface OrderDetailPageProps {
  params: {
    orderId: string;
    locale: Locale;
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const locale = params.locale || 'uz';
  const fullDictionary = await getDictionary(locale); 
  const dictionary = fullDictionary.accountOrderDetailPage;

  const order = mockOrders.find(o => o.id === params.orderId || o.orderNumber === params.orderId);

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
          <BreadcrumbItem><BreadcrumbLink href={`/${locale}/`}>{dictionary.home}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbLink href={`/${locale}/account`}>{dictionary.account}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
           <BreadcrumbItem><BreadcrumbLink href={`/${locale}/account/orders`}>{dictionary.orders}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbPage>{dictionary.orderBreadcrumb.replace('{orderNumber}', order.orderNumber)}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dictionary.orderDetailsTitle}</h1>
        <Button variant="outline" asChild> 
            <Link href={`/${locale}/account/orders`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {dictionary.backToOrdersButton}
            </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl">{dictionary.orderNumTitle.replace('{orderNumber}', order.orderNumber)}</CardTitle>
              <CardDescription>{dictionary.placedOn} {new Date(order.date).toLocaleDateString()}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">{getTranslatedStatus(order.status, dictionary)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">{dictionary.itemsOrdered}</h3>
            <ul className="space-y-4">
              {detailedItems.map((item) => (
                <li key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border shrink-0">
                    <Image src={item.mainImage} alt={item.name as string} fill className="object-cover" data-ai-hint="ordered item" sizes="64px" />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/${locale}/products/${item.id}`} className="font-medium hover:text-primary">{item.name}</Link>
                    <p className="text-sm text-muted-foreground">{dictionary.qty} {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{(item.price * item.quantity).toLocaleString('en-US')} UZS</p>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">{dictionary.orderSummary}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary.subtotal}:</span><span>{order.totalAmount.toLocaleString('en-US')} UZS</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary.shipping}:</span><span>{dictionary.free}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{dictionary.taxes}:</span><span>{dictionary.calculatedAtCheckout}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base"><span>{dictionary.total}:</span><span>{order.totalAmount.toLocaleString('en-US')} UZS</span></div>
            </div>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">{dictionary.shippingAddress}</h3>
              <address className="not-italic text-sm text-muted-foreground space-y-0.5"><p>Jane Doe</p><p>123 Main St, Apt 4B</p><p>Anytown, CA 90210</p><p>United States</p></address>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">{dictionary.billingAddress}</h3>
              <address className="not-italic text-sm text-muted-foreground space-y-0.5"><p>Jane Doe</p><p>123 Main St, Apt 4B</p><p>Anytown, CA 90210</p><p>United States</p></address>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{dictionary.needHelp} <Link href={`/${locale}${dictionary.contactPagePath}`} className="text-primary hover:underline">{dictionary.contactSupport}</Link></p>
            <div className="flex space-x-3">
                <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> {dictionary.viewInvoiceButton}</Button>
                <Button variant="outline" size="sm"><Truck className="mr-2 h-4 w-4" /> {dictionary.trackPackageButton}</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
