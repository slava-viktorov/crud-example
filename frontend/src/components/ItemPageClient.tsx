'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const LocalizedDate = dynamic(() => import('./LocalizedDate').then(mod => mod.LocalizedDate), { ssr: false });
import type { ItemResponseDto, UserResponseDto } from '@/types/api';
import { ActionButtons } from './ActionButtons';
import { useItem } from '@/hooks/useItems';
import { ItemDialog } from './ItemDialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ItemPageSkeleton } from './ItemPageSkeleton';
import { useEffect, useState } from 'react';
import { SKELETON, UI } from '@/constants';

interface ItemPageClientProps {
  item: ItemResponseDto;
  user: UserResponseDto | null;
  openCreatedItem?: boolean;
}

export function ItemPageClient({ item, user, openCreatedItem = false }: ItemPageClientProps) {
  const { data: currentItem, isLoading } = useItem(item.id, {
    initialData: item,
  });
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, SKELETON.MIN_DISPLAY_TIME);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading]);

  const displayItem = (currentItem as ItemResponseDto) || item;
  const isAuthor = !!(user && displayItem?.author?.username === user.username);

  if (showSkeleton) {
    return <ItemPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/items" className="text-blue-600 hover:underline">← К списку материалов</Link>
        <ItemDialog openCreatedItem={true}>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={!user}
          >
            <PlusIcon className="w-4 h-4" />
            Создать
          </Button>
        </ItemDialog>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <Avatar>
          <AvatarFallback>{displayItem.author?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{displayItem.author?.username}</span>
        <span className="text-xs text-gray-400"><LocalizedDate iso={displayItem.createdAt} /></span>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border p-6 mb-8 min-h-[350px]">
        <h1 className="text-3xl font-bold text-center mb-6">{displayItem.title}</h1>
        <div className="prose max-w-none text-lg leading-relaxed">
          {displayItem.content}
        </div>
      </div>
      <ActionButtons 
        item={displayItem} 
        isAuthor={isAuthor} 
        className="flex gap-2" 
        onDeleteSuccess={() => {
          window.location.href = '/items';
        }}
        openCreatedItem={openCreatedItem}
      />
    </div>
  );
} 