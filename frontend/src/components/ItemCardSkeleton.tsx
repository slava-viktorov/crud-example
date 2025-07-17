import { AvatarSkeleton, TextSkeleton, ButtonSkeleton, ContentSkeleton } from './Skeleton';

export function ItemCardSkeleton() {
  return (
    <div className="relative border rounded-lg p-4 shadow hover:shadow-lg transition bg-white flex flex-col h-[290px] justify-between">
      <div className="flex items-center gap-3 mb-2">
        <AvatarSkeleton />
        <TextSkeleton />
        <TextSkeleton className="ml-auto w-16 h-3" />
      </div>
      
      <TextSkeleton className="h-6 w-3/4 mb-2" />
      
      <div className="flex-1">
        <ContentSkeleton lines={3} />
      </div>
      
      <div className="flex gap-2 mt-2">
        <ButtonSkeleton className="w-5 h-5 rounded" />
        <ButtonSkeleton className="w-5 h-5 rounded" />
      </div>
    </div>
  );
} 