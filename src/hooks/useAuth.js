import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit etre utilise a l\'interieur de <AuthProvider>.');
  }
  return context;
}
