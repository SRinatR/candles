
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@/lib/types";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary'; // For future title translation
import { logAdminAction } from '@/admin/lib/admin-logger';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const initialSeedArticles: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: "what-is-soy-wax",
    title: { en: "What is Soy Wax and Why We Use It", ru: "Что такое соевый воск и почему мы его используем", uz: "Soya mumi nima va biz uni nima uchun ishlatamiz" },
    content: { 
      en: "Detailed information about soy wax, its benefits, and why Askim candles chooses it for many products will be available here soon. Soy wax is a vegetable wax made from the oil of soybeans...", 
      ru: "Подробная информация о соевом воске, его преимуществах и почему Askim candles выбирает его для многих продуктов, скоро будет доступна здесь. Соевый воск — это растительный воск, получаемый из масла соевых бобов...",
      uz: "Soya mumi, uning foydalari va Askim candles nima uchun uni ko'plab mahsulotlar uchun tanlagani haqida batafsil ma'lumot tez orada shu yerda joylashtiriladi. Soya mumi soya loviya moyidan tayyorlangan o'simlik mumidir..."
    },
    isActive: true,
    useSharedImage: true,
    sharedMainImage: "https://placehold.co/800x400.png?text=Soy+Wax+Info",
    mainImage_en: "", mainImage_ru: "", mainImage_uz: "",
  },
  {
    slug: "what-is-aroma-sachet",
    title: { en: "What is an Aroma Sachet and How to Use It", ru: "Что такое аромасаше и как его использовать", uz: "Aromasashe nima va undan qanday foydalanish kerak" },
    content: { 
      en: "Learn all about aroma sachets, their uses, and how to best enjoy their fragrance in your home or car. Content coming soon! Aroma sachets are small pouches filled with fragrant herbs or essential oils...",
      ru: "Узнайте все об аромасаше, их применении и как лучше всего наслаждаться их ароматом дома или в машине. Контент скоро появится! Аромасаше — это небольшие мешочки, наполненные ароматными травами или эфирными маслами...",
      uz: "Aromasashelar, ulardan foydalanish usullari va uyingizda yoki mashinangizda ularning hididan qanday qilib eng yaxshi bahramand bo'lish haqida hamma narsani bilib oling. Kontent tez orada! Aromasashelar xushbo'y o'tlar yoki efir moylari bilan to'ldirilgan kichik xaltachalardir..."
    },
    isActive: true,
    useSharedImage: true,
    sharedMainImage: "https://placehold.co/800x400.png?text=Aroma+Sachet+Info",
    mainImage_en: "", mainImage_ru: "", mainImage_uz: "",
  },
];

const ARTICLES_STORAGE_KEY = "askimAdminArticles";

export default function AdminArticlesPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [adminLocale, setAdminLocale] = useState<AdminLocale>('en');
  const { currentAdminUser } = useAdminAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    if (storedLocale && i18nAdmin.locales.includes(storedLocale)) {
      setAdminLocale(storedLocale);
    }

    let storedArticles: Article[] = [];
    const storedArticlesRaw = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (storedArticlesRaw) {
      try {
        storedArticles = JSON.parse(storedArticlesRaw);
      } catch (e) {
        console.error("Error parsing articles from localStorage", e);
        localStorage.removeItem(ARTICLES_STORAGE_KEY); // Clear corrupted data
      }
    } else {
      const now = new Date().toISOString();
      const seededArticles = initialSeedArticles.map((art, index) => ({
        ...art,
        id: art.slug + '-' + Date.now() + index, 
        createdAt: now,
        updatedAt: now,
      }));
      localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(seededArticles));
      storedArticles = seededArticles;
    }
    setArticles(storedArticles);
  }, []);

  const handleDeleteArticle = (articleId: string, articleTitle: string) => {
    const updatedArticles = articles.filter(art => art.id !== articleId);
    setArticles(updatedArticles);
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(updatedArticles));
    if (currentAdminUser?.email) {
      logAdminAction(currentAdminUser.email, "Article Deleted (Simulated)", { articleId, articleTitle });
    }
    toast({
      title: "Article Deleted (Simulated)",
      description: `Article "${articleTitle}" (ID: ${articleId}) has been 'deleted'. Client-side only.`,
    });
  };
  
  if (!isClient) {
    return <div>Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Articles</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage informational articles for your site.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/form/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Article
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article List</CardTitle>
          <CardDescription>
            Displaying {articles.length} articles. Data is stored in localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title ({adminLocale.toUpperCase()})</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => {
                  const titleInAdminLocale = article.title[adminLocale] || article.title.en || 'N/A';
                  return (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{titleInAdminLocale}</TableCell>
                      <TableCell>{article.slug}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={article.isActive ? "secondary" : "outline"}>
                          {article.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/articles/form/${article.id}`}>
                            <Edit3 className="mr-1 h-3 w-3" /> Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteArticle(article.id, titleInAdminLocale)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No articles found. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
