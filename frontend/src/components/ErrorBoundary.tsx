'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  type?: 'general' | 'items';
  className?: string;
}

export function ErrorBoundary({ error, reset, type = 'general', className = '' }: ErrorBoundaryProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`${type === 'items' ? 'Items' : 'General'} Error:`, error);
    }
  }, [error, type]);


  const isNetworkError = error.message.toLowerCase().includes('сетевая ошибка') 
    || error.message.toLowerCase().includes('network')
    || error.message.toLowerCase().includes('econnrefused')
    || error.message.toLowerCase().includes('fetch');
  
  const isServerError = error.message.includes('5') || 
                       error.message.includes('500') ||
                       error.message.includes('502') ||
                       error.message.includes('503') ||
                       error.message.includes('54st');

  const getErrorMessage = () => {
    if (isNetworkError) {
      return 'Проблемы с подключением к серверу. Проверьте интернет-соединение.';
    }
    if (isServerError) {
      return 'Сервер временно недоступен. Попробуйте позже.';
    }
    return type === 'items' 
      ? 'Произошла ошибка при загрузке данных.'
      : 'Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться позже.';
  };

  const getErrorTitle = () => {
    if (isNetworkError) return 'Ошибка сети';
    if (isServerError) return 'Ошибка сервера';
    return type === 'items' ? 'Ошибка загрузки' : 'Внутренняя ошибка сервера';
  };

  const getErrorCode = () => {
    if (isServerError) return '500';
    return type === 'items' ? '' : '500';
  };

  return (
    <div className={`min-h-[600px] flex flex-col items-center justify-center text-center gap-6 px-4 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <ExclamationTriangleIcon className="w-24 h-24 text-red-500" />
        {getErrorCode() && (
          <h1 className="text-6xl font-bold text-gray-800">{getErrorCode()}</h1>
        )}
        <h2 className="text-2xl font-semibold text-gray-700">{getErrorTitle()}</h2>
        <p className="text-lg text-gray-500 max-w-md">
          {getErrorMessage()}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left max-w-md">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Детали ошибки (только для разработки)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Попробовать снова
        </button>
        <Link
          href="/items"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {type === 'items' ? 'Обновить страницу' : 'На главную'}
        </Link>
      </div>
    </div>
  );
} 