import { useId } from 'react';

interface RadioCardGroupProps {
  legend: string;
  options: readonly string[];
  value: string | null;
  onChange: (next: string) => void;
  name: string;
}

/** Single-select radio group styled as cards — used for "are you building something?". */
export function RadioCardGroup({ legend, options, value, onChange, name }: RadioCardGroupProps) {
  const groupId = useId();

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink-2">{legend}</legend>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option;
          const inputId = `${groupId}-${option}`;
          return (
            <div key={option}>
              <input
                type="radio"
                id={inputId}
                name={name}
                checked={checked}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className="block cursor-pointer rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-ink-2 transition-all duration-150 select-none hover:border-brand/40 peer-checked:border-brand peer-checked:bg-brand/12 peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
              >
                {option}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
