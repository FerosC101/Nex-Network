import { useId } from 'react';

interface CheckboxPillGroupProps {
  legend: string;
  description?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  required?: boolean;
}

/**
 * Accessible multi-select "chip" picker. Built from real checkbox inputs
 * (visually hidden, not display:none) so it's fully keyboard- and
 * screen-reader-navigable — the pill styling is purely a `peer` skin.
 */
export function CheckboxPillGroup({
  legend,
  description,
  options,
  value,
  onChange,
  error,
  required,
}: CheckboxPillGroupProps) {
  const groupId = useId();
  const errorId = error ? `${groupId}-error` : undefined;

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="text-sm font-medium text-ink-2">
        {legend}
        {required && <span className="ml-1 text-brand">*</span>}
      </legend>
      {description && <p className="mt-1 text-xs text-ink-3">{description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option);
          const inputId = `${groupId}-${option}`;
          return (
            <div key={option}>
              <input
                type="checkbox"
                id={inputId}
                checked={checked}
                onChange={() => toggle(option)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className="block cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-2 transition-all duration-150 select-none hover:border-brand/40 hover:text-ink peer-checked:border-brand peer-checked:bg-brand peer-checked:font-medium peer-checked:text-[#10171a] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
              >
                {option}
              </label>
            </div>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs font-medium text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
