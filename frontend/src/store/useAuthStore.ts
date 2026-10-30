import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, accessToken?: string | null, refreshToken?: string | null) => void;
  logout: () => void;
}

const getSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('apaar_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const savedUser = getSavedUser();
const savedToken = localStorage.getItem('apaar_access_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  accessToken: savedToken || null,
  isAuthenticated: !!savedToken,
  setUser: (user, accessToken, refreshToken) => {
    if (user && accessToken) {
      localStorage.setItem('apaar_user', JSON.stringify(user));
      localStorage.setItem('apaar_access_token', accessToken);
      if (refreshToken) localStorage.setItem('apaar_refresh_token', refreshToken);
      set({ user, accessToken, isAuthenticated: true });
    } else {
      localStorage.removeItem('apaar_user');
      localStorage.removeItem('apaar_access_token');
      localStorage.removeItem('apaar_refresh_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
  logout: () => {
    localStorage.removeItem('apaar_user');
    localStorage.removeItem('apaar_access_token');
    localStorage.removeItem('apaar_refresh_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
    window.location.href = '/login';
  }
}));
