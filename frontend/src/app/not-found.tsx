'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6 px-4">
      <div className="flex flex-col items-center gap-4">
        <ExclamationTriangleIcon className="w-24 h-24 text-gray-400" />
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Страница не найдена</h2>
        <p className="text-lg text-gray-500 max-w-md">
          Запрашиваемая страница не существует или была перемещена.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/items"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          На главную
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Назад
        </button>
      </div>
    </div>
  );
} 