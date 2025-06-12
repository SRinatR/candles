"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: string[];
  altText: string;
}

export function ProductImageGallery({ images, altText }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  if (!images || images.length === 0) {
    return (
      <Card className="aspect-square w-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No image available</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden shadow-md">
        <CardContent className="p-0">
          <div className="aspect-square relative w-full">
            <Image
              src={selectedImage}
              alt={altText}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority // Prioritize loading the main image
              data-ai-hint="product photo"
            />
          </div>
        </CardContent>
      </Card>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "aspect-square rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                selectedImage === image ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
              )}
              aria-label={`View image ${index + 1} of ${altText}`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt={`${altText} - thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="10vw"
                  data-ai-hint="product thumbnail"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
