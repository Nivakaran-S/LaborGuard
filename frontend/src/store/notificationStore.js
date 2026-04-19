import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
  persist(
    (set) => ({
      unreadCount: 0,
      notifications: [],
      
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
      clearUnread: () => set({ unreadCount: 0 }),
      
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      })),
    }),
    {
      name: 'laborguard-notifications',
    }
  )
);
