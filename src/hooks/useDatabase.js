import { useContext } from 'react';
import DatabaseContext from '../context/DatabaseContext.jsx';

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase doit etre utilise a l\'interieur de <DatabaseProvider>.');
  }
  return context;
}
