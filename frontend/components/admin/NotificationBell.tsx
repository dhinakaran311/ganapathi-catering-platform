'use client';

// components/admin/NotificationBell.tsx — E35: Real-time notification bell

import { useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface NotificationBellProps {
  initialNotifications?: Notification[];
}

export default function NotificationBell({ initialNotifications = [] }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${unreadCount} unread notifications`}
        className="relative p-2 rounded-lg text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] hover:bg-[var(--color-ivory-300)] transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-gold-600)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl shadow-2xl border border-[var(--color-ivory-300)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-ivory-300)]">
              <h3 className="font-display text-sm font-bold text-[var(--color-brown-900)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="font-body text-xs text-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--color-ivory-200)]">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-center font-body text-sm text-[var(--color-brown-400)]">
                  No notifications yet
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${!n.read ? 'bg-[var(--color-ivory-100)]' : 'bg-white'}`}
                  >
                    <p className="font-body text-sm font-semibold text-[var(--color-brown-900)]">
                      {n.title}
                    </p>
                    <p className="font-body text-xs text-[var(--color-brown-500)] mt-0.5">
                      {n.body}
                    </p>
                    <p className="font-body text-[10px] text-[var(--color-brown-400)] mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
