import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import { useToast } from '../../hooks/useToast.js';

export default function AvailabilityToggle() {
  const { currentUser } = useAuth();
  const { getProfileByUserId, setAvailability } = useDatabase();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const profile = getProfileByUserId(currentUser.id);
  if (!profile) return null;

  async function handleToggle() {
    setIsUpdating(true);
    try {
      await setAvailability(currentUser.id, !profile.isAvailable);
    } catch (error) {
      showToast(`Erreur : ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      aria-pressed={profile.isAvailable}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        profile.isAvailable
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
          : 'border-surface-border bg-surface-soft text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${profile.isAvailable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      <span className="hidden sm:inline">{profile.isAvailable ? 'Disponible' : 'Indisponible'}</span>
    </button>
  );
}
