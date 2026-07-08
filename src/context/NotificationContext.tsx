import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Mock initial notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    message: 'New order #FAMORD2025090159 received',
    time: '5 minutes ago',
    read: false,
    type: 'info',
    link: '/orders/FAMORD2025090159'
  },
  {
    id: '2',
    message: 'Customer Sarah Williams updated their profile',
    time: '1 hour ago',
    read: false,
    type: 'info',
    link: '/customers/FAMCUST2025070054'
  },
  {
    id: '3',
    message: 'Low stock alert: Green Tea (5 left)',
    time: '3 hours ago',
    read: true,
    type: 'warning',
    link: '/products/FAMPROD2025080001'
  },
  {
    id: '4',
    message: 'Payment failed for order #FAMORD2025090158',
    time: '1 day ago',
    read: true,
    type: 'error',
    link: '/orders/FAMORD2025090158'
  },
  {
    id: '5',
    message: 'New package "Detox Program" created successfully',
    time: '2 days ago',
    read: true,
    type: 'success',
    link: '/packages'
  }
];

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Try to load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fam_notifications');
      return saved ? JSON.parse(saved) : initialNotifications;
    }
    return initialNotifications;
  });

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Save to localStorage when notifications change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fam_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: 'Just now',
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
