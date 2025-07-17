import { itemsService } from '@/services/items';
import { Skeleton } from '@/components/ui/skeleton';
import React, { Suspense } from 'react';
import { apiServer } from '@/services/api.server';
import { getMeCached } from '@/services/auth.server';
import { handleApiError } from '@/lib/error-handler';
import { ItemPageClient } from '@/components/ItemPageClient';

const itemsServiceServer = itemsService(apiServer);

function ItemSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-24 h-4" />
        <Skeleton className="ml-auto w-20 h-3" />
      </div>
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-32 w-full mb-8" />
      <div className="flex gap-2">
        <Skeleton className="w-10 h-10 rounded" />
        <Skeleton className="w-10 h-10 rounded" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export default async function ItemPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  return (
    <Suspense fallback={<ItemSkeleton />}>
      <ItemPageContent params={params} />
    </Suspense>
  );
}

async function ItemPageContent(props: { params: { id: string } }) {
  const params = props.params;
  let item;
  try {
    item = await itemsServiceServer.getById(params.id);
  } catch (e: unknown) {
    const errorMessage = handleApiError(e, 'Не удалось загрузить материал.');
    throw new Error(errorMessage);
  }
  if (!item) return <div className="text-gray-500">Материал не найден</div>;

  // SSR: получаем текущего пользователя
  const user = await getMeCached();

  return <ItemPageClient item={item} user={user} openCreatedItem={true} />;
} 