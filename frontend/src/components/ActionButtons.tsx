'use client';

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ItemDialog } from './ItemDialog';
import { useDeleteItem } from '@/hooks/useItems';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import type { ItemResponseDto } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface ActionButtonsProps {
  item: ItemResponseDto;
  isAuthor: boolean;
  className?: string;
  onDeleteSuccess?: () => void;
  openCreatedItem?: boolean;
}

export function ActionButtons({ item, isAuthor, className = "flex gap-2 mt-2", onDeleteSuccess, openCreatedItem = false }: ActionButtonsProps) {
  const deleteMutation = useDeleteItem();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      logger.error('Ошибка удаления:', error);
    }
  };

  const handleEditSuccess = (updatedItem: ItemResponseDto) => {
    queryClient.setQueryData(['item', item.id], updatedItem);
  };

  return (
    <div className={className}>
      <ItemDialog 
        item={item} 
        disabled={!isAuthor}
        onEditSuccess={handleEditSuccess}
        openCreatedItem={openCreatedItem}
      >
        <button
          className={`p-0 rounded hover:bg-gray-100 transition ${!isAuthor ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          title="Редактировать"
        >
          <PencilSquareIcon className={`w-5 h-5 text-blue-500 ${!isAuthor ? 'opacity-30' : ''}`} />
        </button>
      </ItemDialog>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className={`p-0 rounded hover:bg-gray-100 transition ${!isAuthor ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
            title="Удалить"
          >
            <TrashIcon className={`w-5 h-5 text-red-500 ${!isAuthor ? 'opacity-30' : ''}`} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Вы уверены, что хотите удалить этот материал?</div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(item.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 