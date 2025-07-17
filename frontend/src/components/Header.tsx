import { HeaderUser } from './HeaderUser';
import Link from 'next/link';
import type { UserResponseDto } from '@/types/api';

function LogoWithText() {
  return (
    <Link href="/items" className="flex items-center gap-2 group select-none">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-2xl font-bold shadow cursor-pointer group-hover:bg-blue-700 transition-colors">
        C
      </span>
      <span className="text-2xl font-light text-gray-800 tracking-wide uppercase">
        crud
      </span>
    </Link>
  );
}

interface HeaderProps {
  user?: UserResponseDto;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <LogoWithText />
        <nav className="flex items-center gap-4">
          <HeaderUser initialUser={user} />
        </nav>
      </div>
    </header>
  );
}
