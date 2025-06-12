
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { UploadCloud, ImagePlus, Trash2, Star } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadedImage {
  file: File;
  preview: string; // Data URL
  id: string;
}

interface ImageUploadAreaProps {
  onImagesChange: (images: UploadedImage[], mainImageId?: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  initialImageUrls?: string[]; 
  initialMainImageUrl?: string; 
}

export function ImageUploadArea({
  onImagesChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  initialImageUrls = [], 
  initialMainImageUrl,
}: ImageUploadAreaProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [mainImageId, setMainImageId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (initialImageUrls.length > 0 && uploadedImages.length === 0) { // Only set initial if uploadedImages is empty
      const initialPreviews = initialImageUrls.map((url, index) => ({
        file: new File([], `initial-image-${index}.jpg`, { type: 'image/jpeg' }), 
        preview: url,
        id: `initial-${index}-${Date.now()}`,
      }));
      setUploadedImages(initialPreviews);
      if (initialMainImageUrl && initialPreviews.some(img => img.preview === initialMainImageUrl)) {
        const initialMain = initialPreviews.find(img => img.preview === initialMainImageUrl);
        if (initialMain) setMainImageId(initialMain.id);
      } else if (initialPreviews.length > 0) {
        setMainImageId(initialPreviews[0].id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImageUrls, initialMainImageUrl]); // Dependencies are correct, avoiding uploadedImages


  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ errors }) => {
          errors.forEach((err: any) => {
            toast({
              title: 'File Upload Error',
              description: err.message,
              variant: 'destructive',
            });
          });
        });
        return;
      }

      const newImageObjects = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 15)}`,
      }));

      setUploadedImages(prevImages => {
        // New uploads should replace previous *File-based* uploads, or add if below limit
        // Initial URL-based previews are not part of this File-based management
        const currentFileBasedImages = prevImages.filter(img => !img.id.startsWith('initial-'));
        const combined = [...currentFileBasedImages, ...newImageObjects];
        const limited = combined.slice(0, maxFiles);
        
        combined.slice(maxFiles).forEach(image => URL.revokeObjectURL(image.preview));
        
        let newMainId = mainImageId;
        // If mainImageId was for an initial-URL image, and new files are uploaded, default to first new file
        if (mainImageId && mainImageId.startsWith('initial-') && limited.length > 0) {
            newMainId = limited[0].id;
        } 
        // If no main image is set, or current main image is removed/not in new list, set first as main
        else if ((!mainImageId || !limited.some(img => img.id === mainImageId)) && limited.length > 0) {
          newMainId = limited[0].id;
        } else if (limited.length === 0) {
          newMainId = undefined;
        }
        setMainImageId(newMainId);
        onImagesChange(limited, newMainId); // Pass only the file-based images
        return limited; 
      });
    },
    [maxFiles, toast, onImagesChange, mainImageId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize,
    maxFiles: uploadedImages.filter(img => !img.id.startsWith('initial-')).length >= maxFiles ? 0 : maxFiles, // Adjust maxFiles for dropzone based on current actual uploads
  });

  const removeImage = (idToRemove: string) => {
    setUploadedImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === idToRemove);
      if (imageToRemove && imageToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview); 
      }
      const remainingImages = prevImages.filter(image => image.id !== idToRemove);
      
      let newMainImageId = mainImageId;
      if (idToRemove === mainImageId) {
        newMainImageId = remainingImages.length > 0 ? remainingImages[0].id : undefined;
        setMainImageId(newMainImageId);
      }
      onImagesChange(remainingImages.filter(img => !img.id.startsWith('initial-')), newMainImageId); // Pass only file-based images
      return remainingImages;
    });
  };

  const handleSetMainImage = (idToSetAsMain: string) => {
    setMainImageId(idToSetAsMain);
    onImagesChange(uploadedImages.filter(img => !img.id.startsWith('initial-')), idToSetAsMain); // Pass only file-based images
  };
  
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        if (image.preview.startsWith('blob:')) {
            URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [uploadedImages]);

  // Filter for display: show initial URL-based images plus any newly uploaded file-based images
  const displayImages = [...uploadedImages];
  const actualFileCount = uploadedImages.filter(img => !img.id.startsWith('initial-')).length;


  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-muted-foreground/30 hover:border-primary/70 transition-colors p-8 text-center cursor-pointer',
          isDragActive && 'border-primary bg-primary/10',
          actualFileCount >= maxFiles && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getInputProps()} disabled={actualFileCount >= maxFiles} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary">Drop the files here ...</p>
          ) : (
            <>
              <p className="font-semibold">Drag &apos;n&apos; drop some files here, or click to select files</p>
              <p className="text-xs text-muted-foreground">
                (Max {maxFiles} new images, up to {maxSize / (1024 * 1024)}MB each)
              </p>
            </>
          )}
          <Button type="button" variant="outline" size="sm" className="mt-2" disabled={actualFileCount >= maxFiles}>
            <ImagePlus className="mr-2 h-4 w-4" /> Select Images
          </Button>
        </div>
      </Card>

      {displayImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Image Previews ({actualFileCount} new files / {maxFiles} limit):</h4>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {displayImages.map((image) => (
                <Card key={image.id} className="relative group w-40 h-40 overflow-hidden shadow-md">
                  <Image
                    src={image.preview} // This can be a Data URL or an initial HTTP URL
                    alt={image.file?.name || 'Image preview'}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-1 p-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={mainImageId === image.id ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 bg-background/80 hover:bg-background"
                      onClick={(e) => { e.stopPropagation(); handleSetMainImage(image.id); }}
                      title={mainImageId === image.id ? "Main image" : "Set as main image"}
                    >
                      <Star className={cn("h-4 w-4", mainImageId === image.id ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                    </Button>
                  </div>
                  {mainImageId === image.id && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground p-1 rounded-bl-md text-xs font-semibold">
                      Main
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

    