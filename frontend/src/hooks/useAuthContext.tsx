'use client';

import React, { createContext, useContext, useState } from 'react';
import { useCurrentUser } from './useAuth';
import type { UserResponseDto } from './useAuth';

interface AuthContextType {
  user: UserResponseDto | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isLoading: true,
  logout: () => {},
});

export function AuthProvider({ children, initialUser }: { children: React.ReactNode, initialUser: UserResponseDto | null }) {
  const { data: userData, isLoading } = useCurrentUser(initialUser);
  const [user, setUser] = useState<UserResponseDto | null>(initialUser ?? null);

  React.useEffect(() => {
    setUser(userData ?? null);
  }, [userData]);

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
} 