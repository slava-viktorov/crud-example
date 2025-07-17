import { itemsService } from '@/services/items';
import { ItemDialog } from '@/components/ItemDialog';
import { apiServer } from '@/services/api.server';
import { getMeCached } from '@/services/auth.server';
import { ItemsList } from '@/components/ItemsList';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { handleApiError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic'; // SSR

const itemsServiceServer = itemsService(apiServer);

export default async function ItemsPage(props: unknown) {
  const { searchParams } = props as { searchParams?: { [key: string]: string | string[] } };
  const page = Number(Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page) || 1;
  const limit = 6;

  const user = await getMeCached();

  let data, count;
  try {
    const res = await itemsServiceServer.getAll({ page, limit });
    data = res.data;
    count = res.count;
  } catch (e: unknown) {
    const errorMessage = handleApiError(e, 'Не удалось загрузить список материалов.');
    throw new Error(errorMessage);
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Items</h1>
        <ItemDialog>
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
      <ItemsList page={page} limit={limit} initialData={{ data, count }} />
    </div>
  );
}