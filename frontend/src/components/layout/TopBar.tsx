import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, Bell, Moon, Sun,
  Globe, LogOut, Keyboard, User, Check, Sparkles, Shield
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
    <header className="h-16 bg-white dark:bg-[#0F172A] px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 select-none shadow-sm transition-colors duration-200">
      {/* Navigation history arrows & Official Search bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Government Portal Search Bar */}
        <div
          onClick={() => setSearchOpen(true)}
          className="flex-1 flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:border-[#0A3871] dark:hover:border-blue-500 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition text-sm shadow-sm group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#0A3871] dark:group-hover:text-blue-400 transition-colors" />
          <span className="flex-1 truncate font-medium">{t('search_placeholder')}</span>
          <kbd className="hidden sm:inline-block text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono shadow-xs">
            /
          </kbd>
        </div>
      </div>

      {/* Top right utility bar */}
      <div className="flex items-center gap-2.5">
        {/* Ask APAAR AI trigger */}
        <button
          onClick={toggleAiDrawer}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0A3871] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition text-xs font-bold shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EA580C] dark:text-blue-400" />
          <span>Ask APAAR AI</span>
        </button>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition text-xs font-semibold"
            title="Change language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
            <span className="uppercase">{language}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1.5 z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 hover:text-[#0A3871] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <span>{l.label}</span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle: Light / Dark mode */}
        <button
          onClick={toggleTheme}
          className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition text-xs font-medium border border-slate-200 dark:border-slate-700"
          title={`Currently ${theme === 'dark' ? 'Dark' : 'Light'} Mode. Click to toggle.`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#0A3871]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Keyboard shortcuts trigger */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
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
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EA580C] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Live Notifications</span>
                <span className="text-[10px] text-[#15803D] dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time WebSocket
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-700/60 text-xs border border-slate-100 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">{n.title}</div>
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{n.message}</div>
                      <div className="text-slate-400 text-[10px] mt-1">{n.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar & menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
          >
            <div className="w-6 h-6 rounded-md bg-[#0A3871] text-white font-bold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                {user?.full_name || 'Demo User'}
              </div>
              <div className="text-[9px] uppercase font-semibold text-[#0A3871] dark:text-blue-400">
                {user?.role || 'Guest'}
              </div>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 mb-1">
                <div className="font-bold text-slate-900 dark:text-white text-xs">{user?.full_name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[#0A3871] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate('/student-portal');
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-[#0A3871] hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>My Credentials</span>
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
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
