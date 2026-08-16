import { GAME_ROLES } from '../../data/constants.js';

export default function GameRolesPicker({ value, onChange }) {
  function toggleRole(roleValue) {
    if (value.includes(roleValue)) {
      onChange(value.filter((role) => role !== roleValue));
    } else {
      onChange([...value, roleValue]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {GAME_ROLES.map((role) => {
        const isSelected = value.includes(role.value);
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => toggleRole(role.value)}
            aria-pressed={isSelected}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              isSelected
                ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                : 'border-surface-border bg-surface-soft text-slate-400 hover:text-slate-200'
            }`}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
