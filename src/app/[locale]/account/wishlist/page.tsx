"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Star,
  Share2,
  Filter,
  Grid3X3,
  List,
  Search
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Locale } from '@/lib/i1n-config';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

// Mock wishlist data
const mockWishlistItems = [
  {
    id: 1,
    name: "Lavender Dreams Candle",
    price: 45000,
    originalPrice: 55000,
    image: "/api/placeholder/300/300",
    category: "Scented Candles",
    rating: 4.8,
    reviews: 124,
    inStock: true,
    discount: 18,
    addedDate: "2024-01-15",
    description: "Relaxing lavender scented candle perfect for evening relaxation"
  },
  {
    id: 2,
    name: "Rose Garden Wax Figure",
    price: 75000,
    originalPrice: null,
    image: "/api/placeholder/300/300",
    category: "Wax Figures",
    rating: 4.9,
    reviews: 89,
    inStock: true,
    discount: 0,
    addedDate: "2024-01-12",
    description: "Elegant rose-shaped wax figure for home decoration"
  },
  {
    id: 3,
    name: "Vanilla Spice Candle Set",
    price: 120000,
    originalPrice: 150000,
    image: "/api/placeholder/300/300",
    category: "Candle Sets",
    rating: 4.7,
    reviews: 156,
    inStock: false,
    discount: 20,
    addedDate: "2024-01-08",
    description: "Set of 3 vanilla spice scented candles in different sizes"
  },
  {
    id: 4,
    name: "Gypsum Angel Figurine",
    price: 85000,
    originalPrice: null,
    image: "/api/placeholder/300/300",
    category: "Gypsum Products",
    rating: 4.6,
    reviews: 67,
    inStock: true,
    discount: 0,
    addedDate: "2024-01-05",
    description: "Beautiful handcrafted gypsum angel figurine"
  }
];

export default function WishlistPage() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'uz';
  const { toast } = useToast();
  const router = useRouter();
  
  const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['all', 'Scented Candles', 'Wax Figures', 'Candle Sets', 'Gypsum Products'];
  
  const handleRemoveFromWishlist = (itemId: number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Removed from Wishlist",
      description: "Item has been removed from your wishlist.",
    });
  };
  
  const handleAddToCart = (itemId: number) => {
    const item = wishlistItems.find(item => item.id === itemId);
    if (item && item.inStock) {
      toast({
        title: "Added to Cart",
        description: `${item.name} has been added to your cart.`,
      });
    }
  };
  
  const handleShare = (item: any) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: item.description,
        url: `/${locale}/products/${item.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/${locale}/products/${item.id}`);
      toast({
        title: "Link Copied",
        description: "Product link has been copied to clipboard.",
      });
    }
  };
  
  // Filter and sort items
  const filteredItems = wishlistItems
    .filter(item => {
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'oldest':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  
  const WishlistItemCard = ({ item }: { item: any }) => (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/20 h-full flex flex-col cursor-pointer" onClick={() => router.push(`/${locale}/products/${item.id}`)}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative overflow-hidden">
          <div className="aspect-square w-full">
            {item.image && typeof item.image === 'string' && item.image.trim() !== '' ? (
              <Image
                src={item.image}
                alt={item.name}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.discount > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md border-0 font-semibold text-xs px-2 py-1">
                -{item.discount}%
              </Badge>
            )}
            {!item.inStock && (
              <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md border-0 text-xs px-2 py-1">
                Out of Stock
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0 rounded-full"
              onClick={(e) => { e.stopPropagation(); handleShare(item); }}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          <div className="mb-2">
            <Badge variant="outline" className="text-xs px-2 py-1 max-w-[120px] truncate">{item.category}</Badge>
          </div>
          
          {/* Product name */}
          <h3 className="font-bold text-sm mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors leading-tight break-words">
            {item.name}
          </h3>
          
          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed flex-1">
            {item.description}
          </p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(item.rating) 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({item.reviews})</span>
          </div>
          
          {/* Price */}
          <div className="mb-3">
            {item.originalPrice && (
              <div className="text-xs text-gray-500 line-through mb-1">
                {item.originalPrice.toLocaleString()} UZS
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-gray-900">
                {item.price.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-gray-600">UZS</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-auto">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md border-0 font-medium py-2 text-sm"
              disabled={!item.inStock}
              onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id); }}
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {item.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="px-3 border hover:bg-gray-50 shadow-sm"
              onClick={(e) => { e.stopPropagation(); handleRemoveFromWishlist(item.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const WishlistItemRow = ({ item }: { item: any }) => (
    <Card className="mb-4 overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24">
              {item.image && typeof item.image === 'string' && item.image.trim() !== '' ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl">
                  <span className="text-muted-foreground text-xs">No image</span>
                </div>
              )}
            </div>
            {item.discount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs shadow-lg border-0">
                -{item.discount}%
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 pr-4">{item.name}</h3>
                <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">{item.category}</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(item.rating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">({item.reviews})</span>
                </div>
                
                {!item.inStock && (
                  <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-between gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900">
                {item.price.toLocaleString()} UZS
              </div>
              {item.originalPrice && (
                <div className="text-sm text-muted-foreground line-through">
                  {item.originalPrice.toLocaleString()} UZS
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md text-xs"
                disabled={!item.inStock}
                onClick={() => handleAddToCart(item.id)}
              >
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                {item.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 px-2"
                onClick={() => handleShare(item)}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-2"
                onClick={() => handleRemoveFromWishlist(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            My Wishlist
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-gradient-to-r from-primary to-primary/80 shadow-md' : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-gradient-to-r from-primary to-primary/80 shadow-md' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      
      {/* Filters and Search */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-white to-gray-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search wishlist items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-0 bg-white shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-0 bg-white shadow-sm">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-0 bg-white shadow-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-16 text-center">
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">
              {searchQuery || filterCategory !== 'all' ? 'No items found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto leading-relaxed">
              {searchQuery || filterCategory !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Start adding items you love to your wishlist and they\'ll appear here'}
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg px-8 py-3">
              <Link href={`/${locale}/products`}>Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
              {filteredItems.map(item => (
                <WishlistItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredItems.map(item => (
                <WishlistItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}