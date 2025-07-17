// Типы для ошибок API
export interface ApiError {
  response?: {
    status: number;
    data?: { 
      message: string;
      error?: string;
    };
  };
  message: string;
  code?: string;
  name?: string;
  isAxiosError?: boolean;
}

// Типы для ошибок сети
export interface NetworkError {
  code: 'ECONNREFUSED' | 'ERR_NETWORK';
  message: string;
  name: 'FetchError' | 'NetworkError';
}

// Типы для ошибок валидации
export interface ValidationError {
  message: string;
  field?: string;
}

// Объединенный тип для всех ошибок
export type AppError = ApiError | NetworkError | ValidationError | Error;

// Типы для определения ошибок
export interface ErrorClassifier {
  isNetworkError: boolean;
  isServerError: boolean;
  isValidationError: boolean;
  statusCode?: number;
} 