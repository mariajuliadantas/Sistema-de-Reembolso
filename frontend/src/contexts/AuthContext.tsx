import React, { createContext, useState, useEffect } from 'react';
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
  login: (userData: User, userToken: string) => void;
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
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedUser = localStorage.getItem('@App:user');
        const storedToken = localStorage.getItem('@App:token');

        if (storedUser && storedToken) {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação do localStorage:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []); // Executa apenas uma vez ao montar o componente

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('@App:user', JSON.stringify(userData));
    localStorage.setItem('@App:token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('@App:user');
    localStorage.removeItem('@App:token');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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