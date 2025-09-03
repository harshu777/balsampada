import { create } from 'zustand';
import api from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'live-class' | 'assignment' | 'announcement';
  timestamp: Date;
  read: boolean;
  link?: string;
  icon?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  loadNotifications: (role: string) => void;
  fetchLiveNotifications: () => Promise<void>;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    return {
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  removeNotification: (id) => set((state) => {
    const notification = state.notifications.find((n) => n.id === id);
    return {
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notification && !notification.read 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount,
    };
  }),

  clearAll: () => set(() => ({
    notifications: [],
    unreadCount: 0,
  })),

  loadNotifications: async (role) => {
    // For students, fetch real enrollment and class data
    if (role === 'student') {
      try {
        // Fetch enrollments to get upcoming classes
        const enrollmentResponse = await api.get('/enrollments/my-enrollments');
        const enrollments = enrollmentResponse.data.data || [];
        
        const notifications: Notification[] = [];
        const now = new Date();
        
        // Check each enrollment for upcoming classes
        enrollments.forEach((enrollment: any, index: number) => {
          if (enrollment.class && enrollment.class.startDate) {
            const classStartDate = new Date(enrollment.class.startDate);
            const timeDiff = classStartDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            // If class starts within next 7 days, create notification
            if (daysDiff > 0 && daysDiff <= 7) {
              notifications.push({
                id: `class-${enrollment._id}`,
                title: daysDiff === 1 ? 'Class Starting Tomorrow!' : `Class Starting in ${daysDiff} days`,
                message: `${enrollment.class.title} with ${enrollment.class.teacher?.name || 'Teacher'}`,
                type: 'live-class' as const,
                timestamp: new Date(Date.now() - index * 60 * 60 * 1000),
                read: false,
                link: `/classes/${enrollment.class._id}`,
              });
            }
            
            // If class started today
            if (daysDiff === 0) {
              notifications.push({
                id: `today-${enrollment._id}`,
                title: 'Class Today!',
                message: `${enrollment.class.title} is scheduled for today`,
                type: 'live-class' as const,
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                read: false,
                link: '/dashboard',
              });
            }
          }
        });
        
        // Add some default notifications if no class-based ones
        if (notifications.length === 0) {
          notifications.push({
            id: 'welcome',
            title: 'Welcome to Balsampada!',
            message: 'Browse available classes and start learning',
            type: 'info' as const,
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            read: false,
            link: '/classes',
          });
        }
        
        const unreadCount = notifications.filter(n => !n.read).length;
        
        set({
          notifications,
          unreadCount,
        });
      } catch (error) {
        console.error('Error fetching student notifications:', error);
        // Set default notifications on error
        set({
          notifications: [
            {
              id: '1',
              title: 'Welcome!',
              message: 'Check out available classes',
              type: 'info' as const,
              timestamp: new Date(),
              read: false,
              link: '/classes',
            },
          ],
          unreadCount: 1,
        });
      }
    } else if (role === 'teacher') {
      const notifications = [
        {
          id: '1',
          title: 'New Student Enrolled',
          message: '5 new students enrolled in your Mathematics class',
          type: 'info' as const,
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
          link: '/my-classes',
        },
        {
          id: '2',
          title: 'Assignment Submissions',
          message: '12 students submitted their homework',
          type: 'assignment' as const,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          read: false,
          link: '/assignments',
        },
        {
          id: '3',
          title: 'Class Reminder',
          message: 'Your evening batch starts at 6:00 PM',
          type: 'live-class' as const,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          read: true,
          link: '/schedule',
        },
      ];
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({
        notifications,
        unreadCount,
      });
    } else if (role === 'admin') {
      const notifications = [
        {
          id: '1',
          title: 'New Teacher Application',
          message: '3 new teacher applications pending review',
          type: 'warning' as const,
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          read: false,
          link: '/admin/applications',
        },
        {
          id: '2',
          title: 'System Update',
          message: 'Platform maintenance scheduled for tonight',
          type: 'announcement' as const,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
        },
        {
          id: '3',
          title: 'Payment Received',
          message: '45 students completed their fee payment today',
          type: 'success' as const,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          read: true,
          link: '/admin/payments',
        },
      ];
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({
        notifications,
        unreadCount,
      });
    }
  },
  
  fetchLiveNotifications: async () => {
    const state = useNotificationStore.getState();
    try {
      // Fetch latest enrollments
      const enrollmentResponse = await api.get('/enrollments/my-enrollments');
      const enrollments = enrollmentResponse.data.data || [];
      
      const notifications: Notification[] = [...state.notifications];
      const now = new Date();
      
      // Check for new upcoming classes
      enrollments.forEach((enrollment: any) => {
        if (enrollment.class && enrollment.class.startDate) {
          const classStartDate = new Date(enrollment.class.startDate);
          const timeDiff = classStartDate.getTime() - now.getTime();
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));
          
          // If class starts within next 30 minutes and not already notified
          if (minutesDiff > 0 && minutesDiff <= 30) {
            const notificationId = `urgent-${enrollment._id}`;
            const exists = notifications.find(n => n.id === notificationId);
            
            if (!exists) {
              notifications.unshift({
                id: notificationId,
                title: '🔴 Live Class Starting Soon!',
                message: `${enrollment.class.title} starts in ${minutesDiff} minutes`,
                type: 'live-class' as const,
                timestamp: new Date(),
                read: false,
                link: '/dashboard',
              });
            }
          }
        }
      });
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching live notifications:', error);
    }
  },
}));

export default useNotificationStore;