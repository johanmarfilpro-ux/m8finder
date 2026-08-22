import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import SearchFilters, { DEFAULT_FILTERS } from '../components/search/SearchFilters.jsx';
import PlayerList from '../components/search/PlayerList.jsx';
import Button from '../components/common/Button.jsx';
import { inputClassName } from '../components/common/FormField.jsx';
import { getPlatformLabel, getRankLabel, getRoleLabel } from '../data/constants.js';

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 15;

function getPageSize() {
  if (typeof window === 'undefined') return DESKTOP_PAGE_SIZE;
  return window.matchMedia('(min-width: 640px)').matches ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE;
}

function sameCriteria(listA, listB) {
  if (listA.length !== listB.length) return false;
  const sortedA = [...listA].sort();
  const sortedB = [...listB].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function describeAlert(alert, game) {
  const roleLabel = alert.roles.length === 0 ? 'tous roles' : alert.roles.map((role) => getRoleLabel(game, role)).join(', ');
  const rankLabel =
    alert.rankTiers.length === 0 ? 'tous rangs' : alert.rankTiers.map((tier) => getRankLabel(game, tier, null)).join(', ');
  const platformLabel =
    alert.platforms.length === 0
      ? ''
      : ` · ${alert.platforms.map((platform) => getPlatformLabel(game, platform)).join(', ')}`;
  return `${roleLabel} · ${rankLabel}${platformLabel}`;
}

export default function SearchPage() {
  const { currentUser } = useAuth();
  const { games, listGameProfilesForGame, matchAlerts, createMatchAlert, deleteMatchAlert } = useDatabase();
  const { showToast } = useToast();
  const [gameId, setGameId] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(getPageSize);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

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
      .filter(({ gameProfile }) => filters.platforms.length === 0 || filters.platforms.includes(gameProfile.platform))
      .filter(({ profile }) => !filters.onlyAvailable || profile.isAvailable);
  }, [gameId, listGameProfilesForGame, currentUser.id, filters]);

  useEffect(() => {
    setVisibleCount(getPageSize());
  }, [gameId, filters]);

  const visibleEntries = matchingEntries.slice(0, visibleCount);
  const hasMore = matchingEntries.length > visibleCount;

  function handleShowMore() {
    setVisibleCount((prev) => prev + getPageSize());
  }

  const alertsForGame = matchAlerts.filter((alert) => alert.gameId === gameId);
  const matchingExistingAlert = alertsForGame.find(
    (alert) =>
      sameCriteria(alert.roles, filters.gameRoles) &&
      sameCriteria(alert.rankTiers, filters.rankTiers) &&
      sameCriteria(alert.platforms, filters.platforms)
  );

  async function handleCreateAlert() {
    if (matchingExistingAlert) {
      showToast('Cette alerte existe deja.', 'info');
      return;
    }
    setIsCreatingAlert(true);
    try {
      await createMatchAlert({
        userId: currentUser.id,
        gameId,
        roles: filters.gameRoles,
        rankTiers: filters.rankTiers,
        platforms: filters.platforms,
      });
      showToast('Alerte creee. Tu seras notifie des qu\'un joueur correspondant se rend disponible.', 'success');
    } catch (error) {
      showToast(`Erreur lors de la creation de l'alerte : ${error.message}`, 'error');
    } finally {
      setIsCreatingAlert(false);
    }
  }

  async function handleDeleteAlert(alertId) {
    try {
      await deleteMatchAlert(alertId);
      showToast('Alerte supprimee.', 'success');
    } catch (error) {
      showToast(`Erreur lors de la suppression : ${error.message}`, 'error');
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
        <Button
          variant="secondary"
          onClick={handleCreateAlert}
          disabled={!gameId || isCreatingAlert || Boolean(matchingExistingAlert)}
        >
          🔔 {matchingExistingAlert ? 'Alerte deja active' : "M'alerter sur ces criteres"}
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

      {game && alertsForGame.length > 0 && (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-surface-border bg-surface-soft p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Mes alertes actives pour {game.label}
          </h2>
          {alertsForGame.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-300"
            >
              <span>{describeAlert(alert, game)}</span>
              <button
                type="button"
                onClick={() => handleDeleteAlert(alert.id)}
                aria-label="Supprimer cette alerte"
                className="text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <PlayerList entries={visibleEntries} game={game} />

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={handleShowMore}>
            Voir plus
          </Button>
        </div>
      )}
    </div>
  );
}
