
"use client";

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { Locale } from '@/lib/i1n-config';
import type { Product } from '@/lib/types'; // Ensure Product type is imported

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;
type CartPageDictionary = Dictionary['cartPage'];


const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getCartDictionary = (locale: Locale): CartPageDictionary => {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.cartPage || { // Fallback to ensure dict.cartPage is never undefined
    home: "Home",
    shoppingCartBreadcrumb: "Shopping Cart",
    yourCartTitle: "Your Shopping Cart",
    itemRemoved: "Item Removed",
    itemRemovedDesc: "{productName} has been removed from your cart.",
    cartCleared: "Cart Cleared",
    cartClearedDesc: "All items have been removed from your cart.",
    price: "Price:",
    quantityFor: "Quantity for {productName}",
    remove: "Remove {productName} from cart",
    clearCart: "Clear Cart",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    taxes: "Taxes",
    calculatedAtCheckout: "Calculated at checkout",
    total: "Total",
    proceedToCheckout: "Proceed to Checkout",
    continueShopping: "Continue Shopping",
    emptyCartTitle: "Your Cart is Empty",
    emptyCartSubtitle: "Looks like you haven't added anything yet.",
    startShopping: "Start Shopping"
  };
};


export default function CartPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getCartDictionary(locale);

  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const handleRemove = (productId: string, productNameObj: Product['name']) => {
    const productName = productNameObj[locale] || productNameObj.en || "Product";
    removeFromCart(productId);
    toast({
      title: dictionary.itemRemoved,
      description: dictionary.itemRemovedDesc.replace('{productName}', productName),
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: dictionary.cartCleared,
      description: dictionary.cartClearedDesc,
    });
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">{dictionary.emptyCartTitle}</h1>
        <p className="text-muted-foreground mb-8">{dictionary.emptyCartSubtitle}</p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/${locale}/products`}>{dictionary.startShopping}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/`}>{dictionary.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{dictionary.shoppingCartBreadcrumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">{dictionary.yourCartTitle}</h1>
      
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map(item => {
            const itemName = item.name[locale] || item.name.en || "Item";
            return (
            <Card key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 shadow-sm">
              <div className="relative w-full sm:w-24 h-32 sm:h-24 aspect-square rounded-md overflow-hidden shrink-0 border">
                <Image 
                    src={item.mainImage || (item.images && item.images.length > 0 ? item.images[0] : "https://placehold.co/100x100.png?text=No+Image")}
                    alt={itemName} 
                    fill 
                    className="object-cover" 
                    data-ai-hint="cart item" 
                    sizes="(max-width: 640px) 100vw, 96px" 
                />
              </div>
              <div className="flex-grow space-y-1">
                <Link href={`/${locale}/products/${item.id}`} className="text-lg font-medium hover:text-primary">{itemName}</Link>
                <p className="text-sm text-muted-foreground">{dictionary.price} {item.price.toLocaleString('en-US')} UZS</p>
                 {item.stock < 5 && item.stock > 0 && (
                  <p className="text-xs text-destructive">Only {item.stock} left in stock!</p>
                )}
                {item.stock === 0 && (
                  <p className="text-xs text-destructive">Out of stock</p>
                )}
              </div>
              <div className="flex items-center space-x-3 shrink-0 mt-2 sm:mt-0">
                <Input
                  type="number"
                  min="1"
                  max={item.stock > 0 ? item.stock : undefined} // Set max to stock if available
                  value={item.quantity}
                  onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                  className="w-20 h-9 text-center"
                  aria-label={dictionary.quantityFor.replace('{productName}', itemName)}
                  disabled={item.stock === 0}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id, item.name)} aria-label={dictionary.remove.replace('{productName}', itemName)}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
              <p className="sm:ml-auto text-lg font-semibold w-full sm:w-auto text-right sm:text-left mt-2 sm:mt-0">{(item.price * item.quantity).toLocaleString('en-US')} UZS</p>
            </Card>
          );
        })}
          {cartItems.length > 0 && (
             <div className="flex justify-end pt-4">
               <Button variant="outline" onClick={handleClearCart} className="text-destructive border-destructive hover:bg-destructive/10">
                 <Trash2 className="mr-2 h-4 w-4" /> {dictionary.clearCart}
               </Button>
             </div>
           )}
        </div>

        <Card className="lg:sticky lg:top-24 p-6 shadow-md">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-2xl">{dictionary.orderSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="flex justify-between text-muted-foreground">
              <span>{dictionary.subtotal}</span>
              <span>{cartTotal.toLocaleString('en-US')} UZS</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{dictionary.shipping}</span>
              <span>{dictionary.free}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{dictionary.taxes}</span>
              <span>{dictionary.calculatedAtCheckout}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-xl font-semibold">
              <span>{dictionary.total}</span>
              <span>{cartTotal.toLocaleString('en-US')} UZS</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4 p-0 pt-6">
            <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href={`/${locale}/checkout`}>
                <CreditCard className="mr-2 h-5 w-5" /> {dictionary.proceedToCheckout}
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/${locale}/products`}>
                <ArrowLeft className="mr-2 h-5 w-5" /> {dictionary.continueShopping}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    