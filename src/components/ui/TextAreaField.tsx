import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, id, className = '', rows = 3, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`w-full resize-none rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-4 transition-colors duration-200 outline-none ${
            error ? 'border-red-400/60 focus:border-red-400' : 'border-line focus:border-brand'
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
TextAreaField.displayName = 'TextAreaField';
