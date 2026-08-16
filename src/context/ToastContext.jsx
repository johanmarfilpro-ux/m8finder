import { createContext, useCallback, useMemo, useState } from 'react';
import { generateId } from '../utils/storage.js';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = generateId('toast');
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast, toasts }), [showToast, dismissToast, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.type === 'error'
                ? 'border-red-500/40 bg-red-950/80 text-red-200'
                : toast.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                : 'border-brand-500/40 bg-surface-soft/90 text-slate-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastContext;
