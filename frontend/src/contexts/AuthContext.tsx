/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'COLLABORATOR' | 'MANAGER' | 'FINANCIAL' | 'ADMIN';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (userData: User, userToken: string, userRefreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// O valor padrão é um objeto vazio tipado como AuthContextData.
// O 'as AuthContextData' é necessário porque o valor inicial não é um AuthContextData completo,
// mas o Provider sempre fornecerá um valor completo.
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('@App:user');
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:refreshToken');
  }, []);

  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedUser = localStorage.getItem('@App:user');
        const storedToken = localStorage.getItem('@App:token');
        const storedRefresh = localStorage.getItem('@App:refreshToken');

        if (storedUser && storedToken && storedRefresh) {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          setRefreshToken(storedRefresh);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação do localStorage:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, [clearSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      clearSession();
    };
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, [clearSession]);

  const login = (userData: User, userToken: string, userRefreshToken: string) => {
    setUser(userData);
    setToken(userToken);
    setRefreshToken(userRefreshToken);
    localStorage.setItem('@App:user', JSON.stringify(userData));
    localStorage.setItem('@App:token', userToken);
    localStorage.setItem('@App:refreshToken', userRefreshToken);
  };

  const logout = () => clearSession();

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};