'use client';

import { useAuthContext } from '@/hooks/useAuthContext';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { UserResponseDto } from '@/types/api';

interface HeaderUserProps {
  initialUser?: UserResponseDto;
}

export function HeaderUser({ initialUser }: HeaderUserProps) {
  const { user, isLoading, logout } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  if (!user && pathname && (pathname === '/login' || pathname === '/register')) {
    return null;
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <span>Войти</span>
          <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
        </Link>
      </Button>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>
            {user.username?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-gray-700">{user.username}</span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
        <span>Выйти</span>
        <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
