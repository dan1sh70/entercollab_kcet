import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface User {
  id: number;
  name: string;
  email: string;
  accountType?: string | null;
  profilePhotoPath?: string | null;
  university?: string | null;
  major?: string | null;
  isAdmin?: boolean;
  managedCollegeId?: number | null;
  bio?: string | null;
  skills?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerInstitution: (name: string, email: string, password: string, kind: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      connectSocket();
    }
    if (!loading && !user) {
      disconnectSocket();
    }
  }, [loading, user]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const registerInstitution = async (name: string, email: string, password: string, kind: string) => {
    const res = await api.post('/auth/register-institution', { name, email, password, institution_kind: kind });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerInstitution, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
