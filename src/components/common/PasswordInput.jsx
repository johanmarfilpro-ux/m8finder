import { useState } from 'react';
import { inputClassName } from './FormField.jsx';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function PasswordInput({ id, className = '', ...props }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        className={`${inputClassName} pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={isVisible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
