
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/lib/types";
import { Eye, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Locale } from '@/lib/i1n-config';
import { getDictionary } from "@/lib/getDictionary";

interface OrderHistoryPageProps {
  params: {
    locale: Locale;
  };
}

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

function getTranslatedStatus(status: Order['status'], dict: any): string {
    switch (status) {
        case 'Delivered': return dict.statusDelivered;
        case 'Shipped': return dict.statusShipped;
        case 'Processing': return dict.statusProcessing;
        case 'Pending': return dict.statusPending;
        case 'Cancelled': return dict.statusCancelled;
        default: return status;
    }
}


export default async function OrderHistoryPage({ params }: OrderHistoryPageProps) {
  const locale = params.locale || 'uz';
  const dictionary = await getDictionary(locale);
  const dict = dictionary.accountOrderHistoryPage;

  const orders = mockOrders; 

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
        <p className="text-muted-foreground">{dict.description}</p>
      </div>

      {orders.length === 0 ? (
        <Card>
            <CardContent className="p-10 text-center">
                 <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{dict.noOrdersYetTitle}</h3>
                <p className="text-muted-foreground mb-6">{dict.noOrdersYetDesc}</p>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={`/${locale}/products`}>{dict.startShoppingButton}</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.orderIdHeader}</TableHead>
                  <TableHead>{dict.dateHeader}</TableHead>
                  <TableHead>{dict.statusHeader}</TableHead>
                  <TableHead className="text-right">{dict.totalHeader}</TableHead>
                  <TableHead className="text-center">{dict.actionsHeader}</TableHead>
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
                      <Badge variant={getStatusBadgeVariant(order.status)}>{getTranslatedStatus(order.status, dict)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.totalAmount.toLocaleString('en-US')} UZS</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${locale}/account/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> {dict.viewDetailsButton}
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

