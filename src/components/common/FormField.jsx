export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// text-base (16px) sur mobile pour eviter le zoom automatique iOS/Android
// au focus d'un champ ; retour a text-sm (14px) a partir du breakpoint sm.
export const inputClassName =
  'w-full rounded-lg border border-surface-border bg-surface-soft px-3 py-2 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-yang-300 focus:outline-none focus:ring-1 focus:ring-yang-300';
