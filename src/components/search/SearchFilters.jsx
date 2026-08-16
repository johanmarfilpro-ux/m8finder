import { GAME_ROLES, RANK_TIERS } from '../../data/constants.js';
import { inputClassName } from '../common/FormField.jsx';
import AvailabilityPicker from '../profile/AvailabilityPicker.jsx';

export const DEFAULT_FILTERS = { gameRole: 'TOUS', rankTier: 'TOUS', availability: [] };

export default function SearchFilters({ filters, onChange }) {
  function updateFilter(field, fieldValue) {
    onChange({ ...filters, [field]: fieldValue });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-soft p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Filtrer par rang, role et disponibilite
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-300">Role</span>
          <select
            className={inputClassName}
            value={filters.gameRole}
            onChange={(event) => updateFilter('gameRole', event.target.value)}
          >
            <option value="TOUS">Tous les roles</option>
            {GAME_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-300">Rang</span>
          <select
            className={inputClassName}
            value={filters.rankTier}
            onChange={(event) => updateFilter('rankTier', event.target.value)}
          >
            <option value="TOUS">Tous les rangs</option>
            {RANK_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">Disponibilite</span>
        <AvailabilityPicker
          value={filters.availability}
          onChange={(availability) => updateFilter('availability', availability)}
        />
      </div>
    </div>
  );
}
