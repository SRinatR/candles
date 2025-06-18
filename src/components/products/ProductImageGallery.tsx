"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: string[];
  altText: string;
}

export function ProductImageGallery({ images, altText }: ProductImageGalleryProps) {
  // Filter out empty strings from images array
  const validImages = images.filter(img => img && img.trim() !== '');
  const [selectedImage, setSelectedImage] = useState(validImages[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!validImages || validImages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Card className="overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow group">
            <CardContent className="p-0">
              <div className="relative w-full overflow-hidden">
                <Image
                  src={selectedImage}
                  alt={altText}
                  width={600}
                  height={600}
                  className="object-contain w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority // Prioritize loading the main image
                  data-ai-hint="product photo"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none">
          <VisuallyHidden>
            <DialogTitle>{altText} - Full Size Image</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <Image
              src={selectedImage}
              alt={altText}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
      {validImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                selectedImage === image ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
              )}
              aria-label={`View image ${index + 1} of ${validImages.length} - ${altText}`}
            >
              <div className="relative w-full">
                <Image
                  src={image}
                  alt={`${altText} - thumbnail ${index + 1}`}
                  width={150}
                  height={150}
                  className="object-cover w-full h-auto"
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
