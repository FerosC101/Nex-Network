import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { sanitizeConsecutiveSpam } from '@/lib/stringSanitizer';

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxConsecutive?: number;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      label,
      error,
      hint,
      id,
      className = '',
      rows = 3,
      maxLength,
      value,
      defaultValue,
      onChange,
      showCount = false,
      maxConsecutive = 3,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const currentLength =
      typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let val = e.target.value;
      val = sanitizeConsecutiveSpam(val, maxConsecutive);

      if (maxLength && val.length > maxLength) {
        val = val.slice(0, maxLength);
      }

      e.target.value = val;
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
            {label}
          </label>
          {maxLength && (showCount || currentLength > 0) && (
            <span className="text-xs font-mono text-ink-4">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
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
