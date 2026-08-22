import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import SearchFilters, { DEFAULT_FILTERS } from '../components/search/SearchFilters.jsx';
import PlayerList from '../components/search/PlayerList.jsx';
import Button from '../components/common/Button.jsx';
import { inputClassName } from '../components/common/FormField.jsx';
import { getRoleLabel } from '../data/constants.js';

export default function SearchPage() {
  const { currentUser } = useAuth();
  const { games, listGameProfilesForGame, addNotification } = useDatabase();
  const { showToast } = useToast();
  const [gameId, setGameId] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (!gameId && games.length > 0) {
      setGameId(games[0].id);
    }
  }, [games, gameId]);

  const game = games.find((g) => g.id === gameId) ?? null;

  function handleGameChange(event) {
    setGameId(event.target.value);
    setFilters(DEFAULT_FILTERS);
  }

  const matchingEntries = useMemo(() => {
    if (!gameId) return [];
    return listGameProfilesForGame(gameId)
      .filter(({ profile }) => profile.userId !== currentUser.id)
      .filter(
        ({ gameProfile }) =>
          filters.gameRoles.length === 0 || filters.gameRoles.some((role) => gameProfile.roles.includes(role))
      )
      .filter(({ gameProfile }) => filters.rankTiers.length === 0 || filters.rankTiers.includes(gameProfile.rankTier))
      .filter(({ profile }) => !filters.onlyAvailable || profile.isAvailable);
  }, [gameId, listGameProfilesForGame, currentUser.id, filters]);

  async function handleCreateAlert() {
    const roleLabel =
      filters.gameRoles.length === 0
        ? 'tous roles'
        : filters.gameRoles.map((role) => getRoleLabel(game, role)).join(', ');
    try {
      await addNotification({
        userId: currentUser.id,
        message: `Alerte activee sur ${game?.label} : ${matchingEntries.length} joueur(s) correspondent actuellement a "${roleLabel}".`,
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
            {matchingEntries.length} joueur(s) trouve(s) selon tes filtres.
          </p>
        </div>
        <Button variant="secondary" onClick={handleCreateAlert} disabled={!gameId}>
          🔔 M'alerter sur ces criteres
        </Button>
      </div>

      <label className="mb-6 flex flex-col gap-1.5 text-sm sm:max-w-xs">
        <span className="font-medium text-slate-300">Jeu</span>
        <select className={inputClassName} value={gameId} onChange={handleGameChange}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      {game && (
        <div className="mb-6">
          <SearchFilters game={game} filters={filters} onChange={setFilters} />
        </div>
      )}

      <PlayerList entries={matchingEntries} game={game} />
    </div>
  );
}
