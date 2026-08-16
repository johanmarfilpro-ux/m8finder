import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import { getAvailabilityLabel, getGameRoleLabel, getRankLabel } from '../data/constants.js';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import ContactPlayerModal from '../components/profile/ContactPlayerModal.jsx';
import ReportProfileModal from '../components/profile/ReportProfileModal.jsx';

export default function PlayerProfilePage() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getProfileByUserId, createReport } = useDatabase();
  const { showToast } = useToast();

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const profile = getProfileByUserId(userId);

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
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{profile.displayName}</h1>
            <p className="text-sm text-slate-500">{profile.riotId}</p>
          </div>
          <Badge tone="brand" className="text-sm">
            {getGameRoleLabel(profile.gameRole)}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="success">{getRankLabel(profile.rankTier, profile.rankDivision)}</Badge>
          {profile.availability.map((slot) => (
            <Badge key={slot} tone="neutral">
              {getAvailabilityLabel(slot)}
            </Badge>
          ))}
        </div>

        <p className="mt-6 whitespace-pre-line text-sm text-slate-300">
          {profile.bio || "Ce joueur n'a pas encore ecrit de bio."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setIsContactOpen(true)}>
            Contacter
          </Button>
          <Button variant="danger" onClick={() => setIsReportOpen(true)}>
            Signaler ce profil
          </Button>
        </div>
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
