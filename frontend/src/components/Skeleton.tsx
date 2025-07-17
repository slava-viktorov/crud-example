import { Skeleton } from '@/components/ui/skeleton';

export const AvatarSkeleton = () => (
  <Skeleton className="w-8 h-8 rounded-full" />
);

export const TextSkeleton = ({ className = "w-20 h-3" }: { className?: string }) => (
  <Skeleton className={className} />
);

export const ButtonSkeleton = ({ className = "w-10 h-10 rounded" }: { className?: string }) => (
  <Skeleton className={className} />
);

export const ContentSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 w-full ${i === lines - 1 ? 'w-2/3' : ''}`} 
      />
    ))}
  </div>
); 