'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useItems } from '@/hooks/useItems';
import { useAuthContext } from '@/hooks/useAuthContext';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
const LocalizedDate = dynamic(() => import('./LocalizedDate').then(mod => mod.LocalizedDate), { ssr: false });
import type { ItemResponseDto } from '@/types/api';
import { ActionButtons } from './ActionButtons';
import { ItemCardSkeleton } from './ItemCardSkeleton';
import { useEffect, useState } from 'react';
import { PAGINATION, SKELETON, UI } from '@/constants';
import { getPaginationItems, shouldShowStartEllipsis, shouldShowEndEllipsis, calculateTotalPages } from '@/lib/pagination';

interface ItemsListProps {
  page?: number;
  limit?: number;
  initialData?: { data: ItemResponseDto[]; count: number };
}

export function ItemsList({ page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT, initialData }: ItemsListProps) {
  const { data, isLoading, error } = useItems({ page, limit }, { initialData });
  const { user } = useAuthContext();
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

  if (error) return <div className="text-red-500 text-center py-8">Ошибка загрузки данных</div>;

  const items = (typeof data === 'object' && data !== null && 'data' in data ? (data as { data: ItemResponseDto[] }).data : []) as ItemResponseDto[];
  const count = (typeof data === 'object' && data !== null && 'count' in data ? (data as { count: number }).count : 0);
  const totalPages = calculateTotalPages(count, limit);

  const renderPaginationItems = () => {
    const paginationItems = getPaginationItems(page, totalPages);
    const result = [];

    if (shouldShowStartEllipsis(page, totalPages)) {
      result.push(
        <PaginationItem key="ellipsis-start">
          <PaginationLink href="?page=1" size="icon">
            <PaginationEllipsis />
          </PaginationLink>
        </PaginationItem>
      );
    }

    paginationItems.forEach((item) => {
      result.push(
        <PaginationItem key={item.page}>
          <PaginationLink href={`?page=${item.page}`} isActive={item.isActive}>
            {item.page}
          </PaginationLink>
        </PaginationItem>
      );
    });

    if (shouldShowEndEllipsis(page, totalPages)) {
      result.push(
        <PaginationItem key="ellipsis-end">
          <PaginationLink href={`?page=${totalPages}`} size="icon">
            <PaginationEllipsis />
          </PaginationLink>
        </PaginationItem>
      );
    }

    return result;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {showSkeleton ? (
          Array.from({ length: limit }).map((_, index) => (
            <ItemCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : items.length > 0 ? items.map((item: ItemResponseDto) => {
          const isAuthor = !!(user && item.author?.username === user.username);
          return (
            <div key={item.id} className="relative border rounded-lg p-4 shadow hover:shadow-lg transition bg-white flex flex-col h-[290px] justify-between">
              <Link href={`/items/${item.id}`} className="flex-1 block">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarFallback>{item.author?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{item.author?.username}</span>
                  <span className="ml-auto text-xs text-gray-400 font-light"><LocalizedDate iso={item.createdAt} /></span>
                </div>
                <h2 className="font-semibold text-lg mb-2 line-clamp-3">{item.title}</h2>
                <p className="text-gray-600 line-clamp-3 mb-2">{item.content}</p>
              </Link>
              <ActionButtons item={item} isAuthor={isAuthor} />
            </div>
          );
        }) : <div className="col-span-full text-center text-gray-500">Нет данных</div>}
      </div>
      
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="flex justify-center items-center px-4 py-4">
            <div className="max-w-80 bg-white/70 backdrop-blur-md rounded-lg shadow-md border">
              <Pagination>
                <PaginationContent className="gap-2 p-2">
                  <PaginationItem>
                    <PaginationLink href={page > 1 ? `?page=${page - 1}` : undefined} size="icon">
                      <ChevronLeftIcon />
                    </PaginationLink>
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationLink href={page < totalPages ? `?page=${page + 1}` : undefined} size="icon">
                      <ChevronRightIcon />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      )}
    </>
  );
}