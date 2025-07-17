'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { mutate, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess: () => {
        router.push('/items');
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Вход</h1>
            <p className="text-gray-600">Войдите в свой аккаунт</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input {...register('email')} placeholder="Email" disabled={isPending} />
              <ErrorMessage error={errors.email?.message} />
            </div>
            <div>
              <Input type="password" {...register('password')} placeholder="Пароль" disabled={isPending} />
              <ErrorMessage error={errors.password?.message} />
            </div>
            <ErrorMessage error={error} />
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Вход...' : 'Войти'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 