import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from './AuthContext';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Safety timeout: if previous fetch took > 5000ms, unlock
    const now = Date.now();
    if (isFetchingRef.current && now - lastFetchTimeRef.current < 5000) {
      return;
    }
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    if (!isSilent) {
      setLoading(true);
    }
    setError('');

    try {
      const res = await listNotifications();
      if (res) {
        const items = Array.isArray(res.notifications) ? res.notifications : [];
        setNotifications(items);
        if (typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        } else {
          setUnreadCount(items.filter((n) => !n.is_read).length);
        }
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Failed to load notifications.');
      }
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(false);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic immediate UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications(true);
    } catch {
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic immediate UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      fetchNotifications(true);
    } catch {
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // Initial fetch when user logs in or mounts
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Reactive background polling (every 2.5 seconds for instant notification feedback)
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      fetchNotifications(true);
    }, 2500);

    return () => clearInterval(timer);
  }, [user, fetchNotifications]);

  // AppState (mobile) and Window/Tab Focus (web) listener to refresh immediately on return
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchNotifications(true);
      }
    });

    let onFocus = null;
    let onVisibilityChange = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onFocus = () => fetchNotifications(true);
      onVisibilityChange = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchNotifications(true);
        }
      };
      window.addEventListener('focus', onFocus);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
      }
    }

    return () => {
      subscription?.remove?.();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (onFocus) window.removeEventListener('focus', onFocus);
        if (onVisibilityChange && typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibilityChange);
        }
      }
    };
  }, [user, fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshing,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      refreshing,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
