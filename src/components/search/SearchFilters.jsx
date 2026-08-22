import ChipMultiSelect from '../common/ChipMultiSelect.jsx';

export const DEFAULT_FILTERS = { gameRoles: [], rankTiers: [], platforms: [], onlyAvailable: false };

export default function SearchFilters({ game, filters, onChange }) {
  function updateFilter(field, fieldValue) {
    onChange({ ...filters, [field]: fieldValue });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-soft p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Filtrer par rang, role et disponibilite
      </h2>

      {(game?.platforms.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">Plateforme</span>
          <ChipMultiSelect
            options={game.platforms}
            value={filters.platforms}
            onChange={(platforms) => updateFilter('platforms', platforms)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">Role</span>
        <ChipMultiSelect
          options={game?.roles ?? []}
          value={filters.gameRoles}
          onChange={(gameRoles) => updateFilter('gameRoles', gameRoles)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">Rang</span>
        <ChipMultiSelect
          options={game?.ranks ?? []}
          value={filters.rankTiers}
          onChange={(rankTiers) => updateFilter('rankTiers', rankTiers)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={filters.onlyAvailable}
          onChange={(event) => updateFilter('onlyAvailable', event.target.checked)}
          className="h-4 w-4 rounded border-surface-border bg-surface-soft text-yang-300 focus:ring-1 focus:ring-yang-300"
        />
        Uniquement les joueurs disponibles maintenant
      </label>
    </div>
  );
}
