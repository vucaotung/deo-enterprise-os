import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '@/api/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readAuthState() {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const userRaw = localStorage.getItem('user');

  let user: User | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }

  if (token && !localStorage.getItem('token')) {
    localStorage.setItem('token', token);
  }

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initial = readAuthState();
  const [user, setUser] = useState<User | null>(initial.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = readAuthState();
    setUser(auth.user);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiLogin(username, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
