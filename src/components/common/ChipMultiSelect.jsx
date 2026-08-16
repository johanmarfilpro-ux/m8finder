export default function ChipMultiSelect({ options, value, onChange }) {
  function toggleOption(optionValue) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            aria-pressed={isSelected}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              isSelected
                ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                : 'border-surface-border bg-surface-soft text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
