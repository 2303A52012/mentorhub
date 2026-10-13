import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, X } from 'lucide-react';
import api from '../../services/api';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in-50 duration-150">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications right now
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.readAt && markOneRead(n._id)}
                    className={`p-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                      !n.readAt ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{n.title}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
