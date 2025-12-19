import { create } from 'zustand';
import { Notification } from '../types';
import { MockDataService } from '../services/mockDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@artywiz_notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  initialize: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  getNotificationById: (id: string) => Notification | undefined;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const notifications = stored ? JSON.parse(stored) : MockDataService.getAllNotifications();
      const unreadCount = notifications.filter((n: Notification) => n.state === 'unread').length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Error initializing notifications:', error);
      const notifications = MockDataService.getAllNotifications();
      const unreadCount = notifications.filter(n => n.state === 'unread').length;
      set({ notifications, unreadCount });
    }
  },

  addNotification: async (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `not_${Date.now()}`,
      state: 'unread',
    };

    const notifications = [newNotification, ...get().notifications];
    const unreadCount = notifications.filter(n => n.state === 'unread').length;
    
    set({ notifications, unreadCount });
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  },

  markAsRead: async (id) => {
    const notifications = get().notifications.map(n => 
      n.id === id ? { ...n, state: 'read' as const } : n
    );
    const unreadCount = notifications.filter(n => n.state === 'unread').length;
    
    set({ notifications, unreadCount });
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  },

  getNotificationById: (id) => {
    return get().notifications.find(n => n.id === id);
  },
}));
