import { AvatarSkeleton, TextSkeleton, ButtonSkeleton, ContentSkeleton } from './Skeleton';

export function ItemPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex items-center gap-4 mb-4">
        <TextSkeleton className="w-32 h-4" />
        <ButtonSkeleton className="w-20 h-8 rounded" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <AvatarSkeleton />
        <TextSkeleton className="w-24 h-4" />
        <TextSkeleton className="w-20 h-3" />
      </div>
      
      <div className="bg-white rounded-lg shadow-md border p-6 mb-8 min-h-[350px]">
        <TextSkeleton className="h-10 w-3/4 mx-auto mb-6" />      
        <ContentSkeleton lines={7} />
      </div>
      
      <div className="flex gap-2">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
} 