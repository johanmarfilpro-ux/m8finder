import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import { gameHasFreeSlot } from '../data/constants.js';
import AccountProfileForm from '../components/profile/AccountProfileForm.jsx';
import GameProfileForm from '../components/profile/GameProfileForm.jsx';
import GameProfileCard from '../components/profile/GameProfileCard.jsx';
import Button from '../components/common/Button.jsx';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const {
    games,
    getProfileByUserId,
    upsertProfile,
    getGameProfilesByUserId,
    getGameById,
    upsertGameProfile,
    deleteGameProfile,
  } = useDatabase();
  const { showToast } = useToast();
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isSubmittingGameProfile, setIsSubmittingGameProfile] = useState(false);
  const [editingGameProfileId, setEditingGameProfileId] = useState(null);

  const accountProfile = getProfileByUserId(currentUser.id);
  const myGameProfiles = getGameProfilesByUserId(currentUser.id);
  const canAddGameProfile = games.some((game) => gameHasFreeSlot(game, myGameProfiles));

  async function handleAccountSubmit(profileData) {
    setIsSubmittingAccount(true);
    try {
      await upsertProfile({ ...profileData, userId: currentUser.id });
      showToast('Ton profil a ete enregistre.', 'success');
    } catch (error) {
      showToast(`Erreur lors de l'enregistrement : ${error.message}`, 'error');
    } finally {
      setIsSubmittingAccount(false);
    }
  }

  async function handleGameProfileSubmit(gameProfileData) {
    setIsSubmittingGameProfile(true);
    try {
      await upsertGameProfile({ ...gameProfileData, userId: currentUser.id });
      showToast('Profil de jeu enregistre.', 'success');
      setEditingGameProfileId(null);
    } catch (error) {
      showToast(`Erreur lors de l'enregistrement : ${error.message}`, 'error');
    } finally {
      setIsSubmittingGameProfile(false);
    }
  }

  async function handleDeleteGameProfile(gameProfile) {
    const game = getGameById(gameProfile.gameId);
    if (!window.confirm(`Supprimer ton profil ${game?.label ?? gameProfile.gameId} ?`)) return;
    try {
      await deleteGameProfile(gameProfile.id);
      showToast('Profil de jeu supprime.', 'success');
    } catch (error) {
      showToast(`Erreur lors de la suppression : ${error.message}`, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">
        {accountProfile ? 'Modifier mon profil' : 'Creer mon profil'}
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Renseigne tes infos generales, puis ajoute un profil pour chaque jeu ou tu cherches des coequipiers.
      </p>

      <AccountProfileForm
        initialProfile={accountProfile}
        onSubmit={handleAccountSubmit}
        isSubmitting={isSubmittingAccount}
      />

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Mes jeux</h2>
          {canAddGameProfile && editingGameProfileId !== 'new' && (
            <Button variant="secondary" onClick={() => setEditingGameProfileId('new')}>
              + Ajouter un jeu
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {myGameProfiles.map((gameProfile) =>
            editingGameProfileId === gameProfile.id ? (
              <GameProfileForm
                key={gameProfile.id}
                games={games}
                existingGameProfiles={myGameProfiles}
                initialGameProfile={gameProfile}
                onSubmit={handleGameProfileSubmit}
                onCancel={() => setEditingGameProfileId(null)}
                isSubmitting={isSubmittingGameProfile}
              />
            ) : (
              <GameProfileCard
                key={gameProfile.id}
                game={getGameById(gameProfile.gameId)}
                gameProfile={gameProfile}
                onEdit={() => setEditingGameProfileId(gameProfile.id)}
                onDelete={() => handleDeleteGameProfile(gameProfile)}
              />
            )
          )}

          {editingGameProfileId === 'new' && (
            <GameProfileForm
              games={games}
              existingGameProfiles={myGameProfiles}
              onSubmit={handleGameProfileSubmit}
              onCancel={() => setEditingGameProfileId(null)}
              isSubmitting={isSubmittingGameProfile}
            />
          )}

          {myGameProfiles.length === 0 && editingGameProfileId !== 'new' && (
            <p className="rounded-xl border border-dashed border-surface-border p-4 text-sm text-slate-500">
              Tu n'as pas encore ajoute de jeu. Ajoutes-en un pour apparaitre dans la recherche.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
