import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _isRefresh?: boolean; // Флаг для запросов на обновление
}

const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
] as string[];

export const axiosInstanceConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
};

// Создаём отдельный экземпляр axios для запросов без перехватчика
const axiosWithoutInterceptors = axios.create(axiosInstanceConfig);

export const errorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as CustomAxiosRequestConfig;
  const requestPath = originalRequest.url?.replace(originalRequest.baseURL || '', '') || '';
  
  // Если ошибка 401 и это не повторный запрос и не запрос на обновление
  // и путь не в списке исключений
  if (
    error.response?.status === 401 &&
    !originalRequest?._retry &&
    !originalRequest?._isRefresh &&
    !EXCLUDED_PATHS.includes(requestPath)
  ) {
    originalRequest._retry = true;

    try {
      // Выполняем запрос на обновление токена без перехватчика
      await axiosWithoutInterceptors.post('/auth/refresh', {}, {
        headers: {
          Cookie: originalRequest.headers?.Cookie || '', // Пробрасываем cookies
        },
        withCredentials: true,
      });

      // Повторяем оригинальный запрос
      return axiosWithoutInterceptors(originalRequest);
    } catch (refreshError) {
      // Если обновление токена не удалось, перенаправляем на логин или отклоняем
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

export const api = axios.create(axiosInstanceConfig);

// Глобальный перехватчик ошибок
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  errorInterceptor,
);