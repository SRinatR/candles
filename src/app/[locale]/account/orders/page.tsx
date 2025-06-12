
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/lib/types";
import { Eye, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import type { Locale } from '@/lib/i1n-config';

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;
type OrderHistoryPageDictionary = Dictionary['accountOrderHistoryPage'];


const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getOrderHistoryDictionary = (locale: Locale): OrderHistoryPageDictionary => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.accountOrderHistoryPage;
};

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

function getTranslatedStatus(status: Order['status'], dict: ReturnType<typeof getOrderHistoryDictionary>): string {
    switch (status) {
        case 'Delivered': return dict.statusDelivered;
        case 'Shipped': return dict.statusShipped;
        case 'Processing': return dict.statusProcessing;
        case 'Pending': return dict.statusPending;
        case 'Cancelled': return dict.statusCancelled;
        default: return status;
    }
}


export default function OrderHistoryPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getOrderHistoryDictionary(locale);

  const orders = mockOrders; 

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-semibold">{dictionary.title}</h2>
        <p className="text-muted-foreground">{dictionary.description}</p>
      </div>

      {orders.length === 0 ? (
        <Card>
            <CardContent className="p-10 text-center">
                 <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{dictionary.noOrdersYetTitle}</h3>
                <p className="text-muted-foreground mb-6">{dictionary.noOrdersYetDesc}</p>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={`/${locale}/products`}>{dictionary.startShoppingButton}</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.orderIdHeader}</TableHead>
                  <TableHead>{dictionary.dateHeader}</TableHead>
                  <TableHead>{dictionary.statusHeader}</TableHead>
                  <TableHead className="text-right">{dictionary.totalHeader}</TableHead>
                  <TableHead className="text-center">{dictionary.actionsHeader}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href={`/${locale}/account/orders/${order.id}`} className="hover:text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{getTranslatedStatus(order.status, dictionary)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.totalAmount.toLocaleString('en-US')} UZS</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${locale}/account/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> {dictionary.viewDetailsButton}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

