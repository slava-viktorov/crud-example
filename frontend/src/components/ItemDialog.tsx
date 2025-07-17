'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateItem } from "@/hooks/useItems";
import { useUpdateItem } from '@/hooks/useItems';
import { ErrorMessage } from "./ErrorMessage";
import type { ItemResponseDto, UserResponseDto } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  title: z.string().min(1, 'Введите заголовок'),
  content: z.string().min(1, 'Введите содержимое'),
});

type FormData = z.infer<typeof schema>;

export type ItemDialogProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  item?: ItemResponseDto;
  onEditSuccess?: (updatedItem: ItemResponseDto) => void;
  openCreatedItem?: boolean;
};

export const ItemDialog: React.FC<ItemDialogProps> = ({ children, disabled, item, onEditSuccess, openCreatedItem = false }) => {
  const [open, setOpen] = React.useState(false);
  const isEdit = !!item;
  const router = useRouter();
  const { user } = useAuth();
  const { mutate: create, isPending: isCreating, error: createError, reset: resetCreate } = useCreateItem();
  const { mutate: update, isPending: isUpdating, error: updateError, reset: resetUpdate } = useUpdateItem();
  const { register, handleSubmit, formState: { errors }, reset: resetForm } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { title: item.title, content: item.content } : undefined,
  });

  useEffect(() => {
    if (item) {
      resetForm({ title: item.title, content: item.content });
    }
  }, [item, resetForm]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      return;
    }
    setOpen(newOpen);
  };

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      update({ id: item.id, data }, {
        onSuccess: (updatedItem) => {
          setOpen(false);
          resetForm();
          resetUpdate();
          if (onEditSuccess && updatedItem) {
            onEditSuccess(updatedItem);
          }
        },
      });
    } else {
      create(data, {
        onSuccess: (createdItem) => {
          setOpen(false);
          resetForm();
          resetCreate();

          if (openCreatedItem && createdItem?.id) {
            router.push(`/items/${createdItem.id}`);
          }
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {children ? children : <Button>{isEdit ? 'Редактировать' : 'Создать Item'}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать Item' : 'Создать Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('title')}
              placeholder="Заголовок"
              disabled={isCreating || isUpdating}
            />
            <ErrorMessage error={errors.title?.message} />
          </div>
          <div>
            <Textarea
              {...register('content')}
              placeholder="Содержимое"
              disabled={isCreating || isUpdating}
              className="min-h-[120px] resize-y"
            />
            <ErrorMessage error={errors.content?.message} />
          </div>
          <ErrorMessage error={isEdit ? updateError : createError} />
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (isEdit ? 'Сохранение...' : 'Создание...') : (isEdit ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
