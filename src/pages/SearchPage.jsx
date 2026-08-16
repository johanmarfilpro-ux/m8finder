import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import SearchFilters, { DEFAULT_FILTERS } from '../components/search/SearchFilters.jsx';
import PlayerList from '../components/search/PlayerList.jsx';
import Button from '../components/common/Button.jsx';
import { getGameRoleLabel } from '../data/constants.js';

export default function SearchPage() {
  const { currentUser } = useAuth();
  const { listPlayerProfiles, addNotification } = useDatabase();
  const { showToast } = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const matchingProfiles = useMemo(() => {
    return listPlayerProfiles()
      .map(({ profile }) => profile)
      .filter((profile) => profile.userId !== currentUser.id)
      .filter(
        (profile) =>
          filters.gameRoles.length === 0 ||
          filters.gameRoles.some((role) => profile.gameRoles.includes(role))
      )
      .filter((profile) => filters.rankTiers.length === 0 || filters.rankTiers.includes(profile.rankTier))
      .filter((profile) => !filters.onlyAvailable || profile.isAvailable);
  }, [listPlayerProfiles, currentUser.id, filters]);

  async function handleCreateAlert() {
    const roleLabel =
      filters.gameRoles.length === 0
        ? 'tous roles'
        : filters.gameRoles.map(getGameRoleLabel).join(', ');
    try {
      await addNotification({
        userId: currentUser.id,
        message: `Alerte activee : ${matchingProfiles.length} joueur(s) correspondent actuellement a "${roleLabel}".`,
      });
      showToast('Alerte de match creee. Tu seras notifie dans la cloche en haut a droite.', 'success');
    } catch (error) {
      showToast(`Erreur lors de la creation de l'alerte : ${error.message}`, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-100">Rechercher des coequipiers</h1>
          <p className="text-sm text-slate-400">
            {matchingProfiles.length} joueur(s) trouve(s) selon tes filtres.
          </p>
        </div>
        <Button variant="secondary" onClick={handleCreateAlert}>
          🔔 M'alerter sur ces criteres
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilters filters={filters} onChange={setFilters} />
      </div>

      <PlayerList profiles={matchingProfiles} />
    </div>
  );
}
