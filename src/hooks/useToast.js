import { useContext } from 'react';
import ToastContext from '../context/ToastContext.jsx';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit etre utilise a l\'interieur de <ToastProvider>.');
  }
  return context;
}
