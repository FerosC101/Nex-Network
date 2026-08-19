import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: readonly string[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, required, id, placeholder = 'Select…', options, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            defaultValue=""
            className={`w-full appearance-none rounded-xl border bg-surface px-4 py-3 text-base text-ink transition-colors duration-200 outline-none ${
              error ? 'border-red-400/60 focus:border-red-400' : 'border-line focus:border-brand'
            } ${className}`}
            {...rest}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-ink-3"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';
