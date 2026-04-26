import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

interface UserProxy {
  uid: string;
  login: string;
  role?: 'admin' | 'guest';
  congregation?: string;
  circuit?: string;
}

interface AuthContextType {
  user: UserProxy | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, pass: string, congregation: string, circuit: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  username: string | null;
  token: string | null;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProxy | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const isGuest = user?.role === 'guest';

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved && token) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setUsername(parsed.login);
    } else if (!token) {
      // Auto-login as a public operator if no session exists
      const publicUser: UserProxy = { uid: "public_operator", login: "Operador de Sincronismo", role: "admin" };
      setUser(publicUser);
      setUsername(publicUser.login);
    }
    setLoading(false);
  }, [token]);

  const login = async (usernameInput: string, pass: string) => {
    try {
      const result = await api.post('/api/auth/login', { login: usernameInput, password: pass });
      const data = result.data;

      const userProfile = { 
        uid: data.uid, 
        login: data.login, 
        role: data.role, 
        congregation: data.congregation, 
        circuit: data.circuit 
      };

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      
      setToken(data.token);
      setUser(userProfile);
      setUsername(data.login);
      
      toast.success(`Bem-vindo, ${data.login}!`);
    } catch (error: any) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const register = async (usernameInput: string, pass: string, congregation: string, circuit: string) => {
    try {
      const result = await api.post('/api/auth/register', { 
        login: usernameInput, 
        password: pass, 
        congregation, 
        circuit 
      });
      const data = result.data;

      const userProfile = { 
        uid: data.uid, 
        login: data.login, 
        role: data.role, 
        congregation: data.congregation, 
        circuit: data.circuit 
      };

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      
      setToken(data.token);
      setUser(userProfile);
      setUsername(data.login);
      
      toast.success(`Conta criada com sucesso! Bem-vindo, ${data.login}`);
    } catch (error: any) {
      console.error("Registration Error:", error);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try {
      const result = await api.post('/api/auth/guest');
      const data = result.data;

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify({ uid: data.uid, login: data.login, role: data.role }));
      
      setToken(data.token);
      setUser({ uid: data.uid, login: data.login, role: data.role });
      setUsername(data.login);
      
      toast.success(`Acesso como Convidado liberado.`);
    } catch (error: any) {
      console.error("Guest Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsGuest, logout, username, token, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
