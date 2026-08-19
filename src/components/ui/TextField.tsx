import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-4 transition-colors duration-200 outline-none ${
            error
              ? 'border-red-400/60 focus:border-red-400'
              : 'border-line focus:border-brand'
          } ${className}`}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-3">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = 'TextField';
