import { Skeleton } from "@/components/ui/skeleton";

export function CategoryCardSkeleton({ aspectRatio = "aspect-[4/5]" }: { aspectRatio?: string }) {
  return (
    <div className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-muted animate-pulse`}>
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <Skeleton className="h-4 md:h-5 w-3/4 mx-auto bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 5 }: { count?: number }) {
  // Dynamic grid and aspect ratio based on count
  const getGridClasses = () => {
    if (count === 1) return 'grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto';
    if (count === 4) return 'grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
  };
  
  const getAspectRatio = () => {
    if (count === 1) return 'aspect-[4/3]';
    if (count === 2) return 'aspect-[3/4]';
    if (count === 3) return 'aspect-square';
    return 'aspect-[4/5]';
  };

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <Skeleton className="h-10 md:h-12 w-64 md:w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 max-w-full mx-auto" />
      </div>
      
      <div className={`grid gap-6 justify-center ${getGridClasses()}`}>
        {Array.from({ length: count }).map((_, index) => (
          <CategoryCardSkeleton key={index} aspectRatio={getAspectRatio()} />
        ))}
      </div>
    </div>
  );
}
