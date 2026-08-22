import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useDatabase } from '../../hooks/useDatabase.js';

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "a l'instant";
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const { listNotificationsForUser, markAllNotificationsRead } = useDatabase();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const notifications = currentUser ? listNotificationsForUser(currentUser.id) : [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && currentUser) markAllNotificationsRead(currentUser.id);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications de match"
        className="relative rounded-lg border border-surface-border bg-surface-soft p-2 text-slate-300 hover:text-slate-100"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-surface-border bg-surface-soft p-3 shadow-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notifications de match
          </p>
          {notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aucune notification pour le moment.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200"
                >
                  <p>{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(notification.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
