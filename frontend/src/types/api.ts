// Типы на основе OpenAPI схемы
export interface AuthorResponseDto {
  id: string;
  username: string;
}

export interface ItemResponseDto {
  id: string;
  title: string;
  content: string;
  author: AuthorResponseDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  title: string;
  content: string;
}

export interface UpdateItemDto {
  title?: string;
  content?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ErrorResponseDto {
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}

// Типы для пагинации
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

// Типы для хуков
export interface ItemsQueryParams extends PaginationParams {
  page?: number;
  limit?: number;
}

export interface UpdateItemParams {
  id: string;
  data: UpdateItemDto;
} 