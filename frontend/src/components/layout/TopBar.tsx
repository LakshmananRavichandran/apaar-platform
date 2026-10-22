import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, Bell, Moon, Sun,
  Globe, LogOut, Keyboard, User, Check, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Language } from '../../types';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, language, setLanguage, setSearchOpen, setShortcutsOpen, toggleAiDrawer, t } = useAppStore();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English (EN)' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
  ];

  return (
    <header className="h-16 bg-[#121212]/95 backdrop-blur-md px-6 flex items-center justify-between border-b border-[#242424] sticky top-0 z-40 select-none">
      {/* Navigation history arrows & Search input */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-black transition"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-black transition"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Spotify-style Search Input */}
        <div
          onClick={() => setSearchOpen(true)}
          className="flex-1 flex items-center gap-3 px-4 py-2 rounded-full bg-[#242424] hover:bg-[#2a2a2a] border border-transparent hover:border-zinc-700 text-[#B3B3B3] hover:text-white cursor-pointer transition text-sm shadow-inner group"
        >
          <Search className="w-4 h-4 text-[#B3B3B3] group-hover:text-[#1DB954] transition-colors" />
          <span className="flex-1 truncate">{t('search_placeholder')}</span>
          <kbd className="hidden sm:inline-block text-[11px] bg-[#181818] border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
            /
          </kbd>
        </div>
      </div>

      {/* Top right actions */}
      <div className="flex items-center gap-3">
        {/* Ask APAAR AI trigger */}
        <button
          onClick={toggleAiDrawer}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/60 transition text-xs font-bold"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>Ask APAAR</span>
        </button>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#282828] flex items-center justify-center text-zinc-300 hover:text-white transition"
            title="Change language"
          >
            <Globe className="w-4 h-4" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-[#1F1F1F] border border-[#2e2e2e] rounded-xl shadow-2xl py-1.5 z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between text-zinc-300 hover:text-white hover:bg-[#2a2a2a] transition"
                >
                  <span>{l.label}</span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-[#1DB954]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#282828] flex items-center justify-center text-zinc-300 hover:text-white transition"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Keyboard shortcuts trigger */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#282828] flex items-center justify-center text-zinc-300 hover:text-white transition"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifMenuOpen(!notifMenuOpen);
              if (!notifMenuOpen) markAllAsRead();
            }}
            className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#282828] flex items-center justify-center text-zinc-300 hover:text-white transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1DB954] text-black text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1F1F1F] border border-[#2e2e2e] rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#2e2e2e] mb-2">
                <span className="text-xs font-bold text-white">Live Notifications</span>
                <span className="text-[10px] text-[#1DB954] font-semibold">Real-time WebSocket</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-[#242424] text-xs">
                    <div className="font-bold text-white">{n.title}</div>
                    <div className="text-[#B3B3B3] text-[11px] mt-0.5">{n.message}</div>
                    <div className="text-zinc-500 text-[10px] mt-1">{n.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar & menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#1F1F1F] hover:bg-[#282828] transition border border-[#2e2e2e]"
          >
            <div className="w-7 h-7 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                {user?.full_name || 'Demo User'}
              </div>
              <div className="text-[9px] uppercase font-semibold text-[#1DB954]">
                {user?.role || 'Guest'}
              </div>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1F1F1F] border border-[#2e2e2e] rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3.5 py-2 border-b border-[#2e2e2e] mb-1">
                <div className="font-bold text-white text-xs">{user?.full_name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{user?.email}</div>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954]">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate('/student-portal');
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>My Credentials</span>
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
