import { create } from 'zustand';
import { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'notif_1',
      title: 'National Batch Verification Completed',
      message: '5,000 student records indexed with 97.2% overall credential authenticity.',
      category: 'SYSTEM',
      timestamp: '10 mins ago',
      read: false
    },
    {
      id: 'notif_2',
      title: 'Active Flags Requiring Review',
      message: '150 discrepancy flags detected by rule-based validation engine.',
      category: 'ALERT',
      timestamp: '25 mins ago',
      read: false
    },
    {
      id: 'notif_3',
      title: 'DigiLocker Mock API Online',
      message: 'Realtime synchronization gateway operational at 120 req/min.',
      category: 'VERIFICATION',
      timestamp: '1 hour ago',
      read: true
    }
  ],
  unreadCount: 2,
  addNotification: (item) => set((state) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: item.title,
      message: item.message,
      category: item.category,
      timestamp: 'Just now',
      read: false
    };
    return {
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1
    };
  }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 })
}));
