import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import { getPlatformLabel, getRankLabel, getRoleLabel } from '../data/constants.js';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import ContactPlayerModal from '../components/profile/ContactPlayerModal.jsx';
import ReportProfileModal from '../components/profile/ReportProfileModal.jsx';

export default function PlayerProfilePage() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getProfileByUserId, getGameProfilesByUserId, getGameById, createReport, isUserAdmin, getOrCreateConversation } =
    useDatabase();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  const profile = getProfileByUserId(userId);
  const gameProfiles = getGameProfilesByUserId(userId);
  const isProfileAdmin = isUserAdmin(userId);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-400">Ce profil n'existe pas ou plus.</p>
        <Link to="/recherche" className="mt-4 inline-block text-brand-400 hover:text-brand-300">
          Retour a la recherche
        </Link>
      </div>
    );
  }

  if (userId === currentUser.id) {
    return <Navigate to="/profil" replace />;
  }

  async function handleSendMessage() {
    setIsMessaging(true);
    try {
      const conversationId = await getOrCreateConversation(userId);
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      showToast(`Erreur lors de la creation de la conversation : ${error.message}`, 'error');
    } finally {
      setIsMessaging(false);
    }
  }

  async function handleReportSubmit({ reason, details }) {
    try {
      await createReport({ reporterId: currentUser.id, reportedUserId: userId, reason, details });
      setIsReportOpen(false);
      showToast('Signalement envoye. Un administrateur va examiner ce profil.', 'success');
    } catch (error) {
      showToast(`Erreur lors de l'envoi du signalement : ${error.message}`, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-surface-border bg-surface-soft p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className={`text-2xl font-bold ${isProfileAdmin ? 'text-orange-400' : 'text-slate-100'}`}>
            {isProfileAdmin && '[ADMIN] '}
            {profile.displayName}
          </h1>
          {profile.isAvailable && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Disponible maintenant
            </span>
          )}
        </div>

        <p className="mt-4 whitespace-pre-line text-sm text-slate-300">
          {profile.bio || "Ce joueur n'a pas encore ecrit de bio."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleSendMessage} disabled={isMessaging}>
            Envoyer un message
          </Button>
          <Button variant="secondary" onClick={() => setIsContactOpen(true)}>
            Contacter
          </Button>
          {!isProfileAdmin && (
            <Button variant="danger" onClick={() => setIsReportOpen(true)}>
              Signaler ce profil
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Jeux</h2>
        {gameProfiles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-border p-4 text-sm text-slate-500">
            Ce joueur n'a pas encore ajoute de jeu.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {gameProfiles.map((gameProfile) => {
              const game = getGameById(gameProfile.gameId);
              return (
                <div key={gameProfile.id} className="rounded-xl border border-surface-border bg-surface-soft p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-slate-100">{game?.label ?? gameProfile.gameId}</h3>
                    <p className="text-xs text-slate-500">{gameProfile.inGameId}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {gameProfile.platform !== 'NONE' && (
                      <Badge tone="neutral">{getPlatformLabel(game, gameProfile.platform)}</Badge>
                    )}
                    {gameProfile.roles.map((role) => (
                      <Badge key={role} tone="brand">
                        {getRoleLabel(game, role)}
                      </Badge>
                    ))}
                    <Badge tone="success">{getRankLabel(game, gameProfile.rankTier, gameProfile.rankDivision)}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContactPlayerModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        profile={profile}
      />
      <ReportProfileModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
        reportedDisplayName={profile.displayName}
      />
    </div>
  );
}
