const VARIANT_CLASSES = {
  primary: 'bg-yang-100 hover:bg-yang-50 text-yin-900 shadow-black/40',
  secondary: 'bg-surface-soft hover:bg-surface-border text-slate-100 border border-surface-border',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  ghost: 'bg-transparent hover:bg-surface-soft text-slate-300 border border-transparent',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
