import type { AppError } from '@/types/errors';

type ResponseData = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

type Response = {
  status?: number;
  data?: ResponseData | ResponseData[];
  [key: string]: unknown;
};

type ErrorWithResponse = {
  code?: string;
  name?: string;
  isAxiosError?: boolean;
  message?: string;
  response?: Response;
  [key: string]: unknown;
};

export function handleApiError(error: unknown, defaultMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorWithResponse;
    // Проверка на сетевые ошибки
    if (
      err.code === 'ECONNREFUSED' ||
      err.name === 'FetchError' ||
      err.isAxiosError ||
      (typeof err.message === 'string' && err.message.toLowerCase().includes('network'))
    ) {
      return 'Похоже, нет соединения с сервером. Проверьте интернет или попробуйте позже.';
    }
    // Проверка на response
    if (
      err.response &&
      typeof err.response.status === 'number'
    ) {
      const status = err.response.status;
      if (status >= 500) {
        return `Сервер временно недоступен (ошибка ${status}). Мы уже работаем над решением проблемы.`;
      }
      if (status >= 400) {
        const data = err.response.data as ResponseData | undefined;
        return `Ошибка запроса (${status}): ${data?.message || 'Проверьте параметры запроса.'}`;
      }
    }
    if (typeof err.message === 'string') {
      return `Что-то пошло не так: ${err.message}`;
    }
  }
  return defaultMessage;
}

export function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorWithResponse;
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Проблема с сетью. Проверьте соединение.';
    }
    if (
      err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      !Array.isArray(err.response.data)
    ) {
      const data = err.response.data as ResponseData;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    if (
      err.response &&
      typeof err.response.status === 'number'
    ) {
      const status = err.response.status;
      if (status === 404) return 'Не найдено';
      if (status === 401) return 'Не авторизован';
      if (status === 400) return 'Некорректный запрос';
      if (status >= 500) return 'Ошибка сервера';
    }
    if (
      err.response &&
      Array.isArray(err.response.data) &&
      err.response.data.length > 0
    ) {
      const dataArr = err.response.data as ResponseData[];
      return (dataArr[0].message as string) || (dataArr[0] as unknown as string);
    }
    if (Array.isArray(err) && err.length > 0) {
      return (err[0] as { message?: string }).message || (err[0] as unknown as string);
    }
    if (err instanceof Error && err.stack) {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.error(err.stack);
      }
    }
  }
  return 'Неизвестная ошибка';
} 