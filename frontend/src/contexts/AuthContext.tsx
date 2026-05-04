import React, { createContext, useState, useContext, useEffect } from 'react'; // REMOVA ReactNode AQUI
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
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadStorageData() {
      try {
        const storedUser = localStorage.getItem('@App:user');
        const storedToken = localStorage.getItem('@App:token');

        if (storedUser && storedToken) {
          // Se o token existir, mas o JSON for inválido, o try-catch captura o erro
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        // Se houver erro de parse ou corrupção, limpa tudo por segurança
        console.error('Erro ao carregar dados de autenticação:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadStorageData();
  }, []);

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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated: !!user,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
