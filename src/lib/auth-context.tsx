'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User, Hotel, Subscription } from '@/types';

interface AuthContextType {
  user: User | null;
  hotel: Hotel | null;
  subscription: Subscription | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; hotel_name: string; hotel_address?: string; hotel_phone?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
          setHotel(data.hotel);
          setSubscription(data.subscription);
        })
        .catch(() => {
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    api.setToken(data.access_token);
    setUser(data.user);
    setHotel(data.hotel);
    // Fetch subscription data
    try {
      const me = await api.getMe();
      setSubscription(me.subscription);
    } catch { /* ignore */ }
  };

  const register = async (regData: { email: string; password: string; full_name: string; hotel_name: string; hotel_address?: string; hotel_phone?: string }) => {
    const data = await api.register(regData);
    api.setToken(data.access_token);
    setUser(data.user);
    setHotel(data.hotel);
    // Fetch subscription data (trial just created)
    try {
      const me = await api.getMe();
      setSubscription(me.subscription);
    } catch { /* ignore */ }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setHotel(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, hotel, subscription, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
