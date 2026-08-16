import { AVAILABILITY_SLOTS } from '../../data/constants.js';

export default function AvailabilityPicker({ value, onChange }) {
  function toggleSlot(slotValue) {
    if (value.includes(slotValue)) {
      onChange(value.filter((slot) => slot !== slotValue));
    } else {
      onChange([...value, slotValue]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABILITY_SLOTS.map((slot) => {
        const isSelected = value.includes(slot.value);
        return (
          <button
            key={slot.value}
            type="button"
            onClick={() => toggleSlot(slot.value)}
            aria-pressed={isSelected}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              isSelected
                ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                : 'border-surface-border bg-surface-soft text-slate-400 hover:text-slate-200'
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
