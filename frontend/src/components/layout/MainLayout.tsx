import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NowViewingBar } from './NowViewingBar';
import { SearchModal } from '../common/SearchModal';
import { ShortcutsModal } from '../common/ShortcutsModal';
import { AskApaarDrawer } from '../ai/AskApaarDrawer';
import { useAppStore } from '../../store/useAppStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { setSearchOpen, setShortcutsOpen } = useAppStore();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  const [pendingPrefix, setPendingPrefix] = useState<string | null>(null);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if actively typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          setSearchOpen(false);
          setShortcutsOpen(false);
        }
        return;
      }

      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsOpen(false);
        return;
      }

      // 2-key sequence shortcuts (e.g. g then d)
      if (pendingPrefix === 'g') {
        setPendingPrefix(null);
        if (e.key === 'd') navigate('/dashboard');
        else if (e.key === 's') navigate('/students');
        else if (e.key === 'c') navigate('/colleges');
        else if (e.key === 'v') navigate('/verification');
        else if (e.key === 'f') navigate('/flags');
        else if (e.key === 'h') navigate('/');
        return;
      }

      if (e.key === 'g') {
        setPendingPrefix('g');
        setTimeout(() => setPendingPrefix(null), 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingPrefix, navigate, setSearchOpen, setShortcutsOpen]);

  // Real-time WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const url = `ws://localhost:8000/ws${user?.id ? `?user_id=${user.id}` : ''}`;
        ws = new WebSocket(url);

        ws.onopen = () => {
          console.log('[WebSocket] Connected to APAAR live notification hub');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'VERIFICATION_UPDATE') {
              addNotification({
                title: 'Verification Completed',
                message: `${data.student_name} authenticated as ${data.status} (Trust: ${data.trust_score}%)`,
                category: 'VERIFICATION'
              });
            } else if (data.type === 'ANNOUNCEMENT') {
              addNotification({
                title: data.title,
                message: data.content,
                category: 'ALERT'
              });
            }
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 5000);
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user, addNotification]);

  return (
    <div className="flex h-screen w-screen bg-[#121212] text-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#181818] to-[#121212]">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-24 p-6">
          {children}
        </main>
      </div>

      <NowViewingBar />
      <SearchModal />
      <ShortcutsModal />
      <AskApaarDrawer />
    </div>
  );
};
