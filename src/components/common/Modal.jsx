export default function Modal({ title, isOpen, onClose, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-soft p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-slate-400 hover:bg-surface-border hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-slate-300">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
