
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash, Heart, Leaf, Lightbulb } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>About Us</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          About <span className="text-primary">ScentSational Showcase</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover the passion, craftsmanship, and inspiration behind every product we create.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            ScentSational Showcase was born from a love for artisanal craftsmanship and the transformative power of scent. We believe that everyday items can be sources of joy and tranquility. Our journey began with a simple desire: to create high-quality, handcrafted products that elevate your space and soothe your senses.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From hand-poured candles with captivating fragrances to unique wax figures and elegant gypsum decor, each item is meticulously designed and crafted with care. We are dedicated to using quality materials and sustainable practices wherever possible.
          </p>
        </div>
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://placehold.co/600x400.png" 
            alt="Artisanal workshop" 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="artisanal workshop"
          />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center text-foreground mb-8">Our Values</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Passion & Craftsmanship</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Every item is made with love and attention to detail, ensuring a unique and high-quality product.
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Quality Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              We source the finest materials, from natural waxes to premium fragrance oils, for a superior experience.
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/20 rounded-full mb-3">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Inspired Designs</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Our products are thoughtfully designed to bring beauty, warmth, and a touch of elegance to your home.
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="text-center bg-secondary/50 rounded-xl p-8 md:p-12 shadow-md">
        <h2 className="text-2xl md:text-3xl font-semibold text-secondary-foreground mb-4">Join Our Community</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          We're more than just a store; we're a community of scent enthusiasts and lovers of handcrafted beauty. Follow us on social media and sign up for our newsletter for updates, new arrivals, and special offers.
        </p>
        {/* Add social media links or newsletter signup form here if desired */}
      </section>
    </div>
  );
}
