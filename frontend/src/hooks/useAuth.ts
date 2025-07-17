import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { api } from '../services/api';
import type { paths } from '@/types/openapi';
import { useAuthContext } from './useAuthContext';

export type UserResponseDto = paths['/auth/me']['get']['responses']['200']['content']['application/json'];

const auth = authService(api);

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auth.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auth.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.setQueryData(['me'], null);
      
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    },
  });
}

export function useCurrentUser(initialData?: UserResponseDto | null) {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => auth.getMe(),
    initialData,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAuth() {
  const { user, isLoading } = useAuthContext();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isUnauthenticated: !isLoading && !user,
  };
}
