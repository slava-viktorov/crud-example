import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsService } from '../services/items';
import { api } from '../services/api';
import type { 
  ItemResponseDto, 
  CreateItemDto, 
  UpdateItemDto, 
  PaginatedResponse, 
  ItemsQueryParams, 
  UpdateItemParams 
} from '../types/api';
import type { UseQueryOptions } from '@tanstack/react-query';

const items = itemsService(api);

export function useItems(
  params?: ItemsQueryParams, 
  options?: Partial<UseQueryOptions<PaginatedResponse<ItemResponseDto>>>
) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => items.getAll(params),
    ...options,
  });
}

export function useItem(
  id: string, 
  options?: Partial<UseQueryOptions<ItemResponseDto>>
) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => items.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDto) => items.create(data),
    onSuccess: (createdItem) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      return createdItem;
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateItemParams) => items.update(id, data),
    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData(['item', variables.id], updatedItem);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      return updatedItem;
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => items.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
