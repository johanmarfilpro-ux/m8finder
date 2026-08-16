import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import ProfileForm from '../components/profile/ProfileForm.jsx';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { getProfileByUserId, upsertProfile } = useDatabase();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingProfile = getProfileByUserId(currentUser.id);

  async function handleSubmit(profileData) {
    setIsSubmitting(true);
    try {
      await upsertProfile({ ...profileData, userId: currentUser.id });
      showToast('Ton profil a ete enregistre.', 'success');
    } catch (error) {
      showToast(`Erreur lors de l'enregistrement : ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">
        {existingProfile ? 'Modifier mon profil' : 'Creer mon profil'}
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Renseigne ton role, ton rang et tes disponibilites pour que d'autres joueurs puissent te trouver.
      </p>

      <ProfileForm
        initialProfile={existingProfile}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
