import { create } from 'zustand';
import { Language } from '../types';
import { translations } from '../services/i18n';

interface AppState {
  theme: 'dark' | 'light';
  language: Language;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  aiDrawerOpen: boolean;
  highContrast: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setSearchOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;
  toggleAiDrawer: () => void;
  toggleHighContrast: () => void;
  t: (key: string) => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  language: 'en',
  searchOpen: false,
  shortcutsOpen: false,
  aiDrawerOpen: false,
  highContrast: false,
  setTheme: (theme) => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  setLanguage: (language) => set({ language }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setAiDrawerOpen: (aiDrawerOpen) => set({ aiDrawerOpen }),
  toggleAiDrawer: () => set((state) => ({ aiDrawerOpen: !state.aiDrawerOpen })),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  t: (key: string) => {
    const lang = get().language;
    return translations[lang]?.[key] || translations.en[key] || key;
  }
}));
