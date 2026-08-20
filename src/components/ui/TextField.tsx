import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { sanitizeConsecutiveSpam } from '@/lib/stringSanitizer';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  numericOnly?: boolean;
  lettersOnly?: boolean;
  phoneOnly?: boolean;
  showCount?: boolean;
  maxConsecutive?: number;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      id,
      className = '',
      type = 'text',
      numericOnly,
      lettersOnly,
      phoneOnly,
      showCount = false,
      maxConsecutive = 3,
      onChange,
      onKeyDown,
      maxLength,
      value,
      defaultValue,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const currentLength = typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent typing 'e', 'E', '.', '+', '-' for numeric inputs
      if (type === 'number' || numericOnly) {
        if (['e', 'E', '.', '+', '-'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          return;
        }
      }
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      if (phoneOnly) {
        // Digits only
        let digits = val.replace(/\D/g, '');

        // Enforce starting with 09 if user typed digits
        if (digits.length > 0) {
          if (!digits.startsWith('09')) {
            if (digits.startsWith('9')) {
              digits = '0' + digits;
            } else if (digits.startsWith('0') && digits.length > 1 && digits[1] !== '9') {
              digits = '09' + digits.slice(1);
            } else {
              digits = '09' + digits;
            }
          }
        }

        // Apply consecutive digit anti-spam (max 3 consecutive identical digits)
        digits = sanitizeConsecutiveSpam(digits, maxConsecutive);

        if (maxLength && digits.length > maxLength) {
          digits = digits.slice(0, maxLength);
        }

        val = digits;
      } else if (numericOnly) {
        val = val.replace(/\D/g, '');
        val = sanitizeConsecutiveSpam(val, maxConsecutive);
      } else if (lettersOnly) {
        // Allow letters (including international), spaces, hyphens, apostrophes
        val = val.replace(/[^a-zA-Z\s'-]/g, '');
        val = sanitizeConsecutiveSpam(val, maxConsecutive);
      } else {
        // General text anti-spam
        val = sanitizeConsecutiveSpam(val, maxConsecutive);
      }

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
            {required && <span className="ml-1 text-brand">*</span>}
          </label>
          {/* Only worth showing as the limit gets close. Always-on counters
              read as clutter, and a full field ("11/11") looks like an error
              when it is simply a complete answer. */}
          {maxLength && showCount && currentLength >= maxLength * 0.7 && (
            <span
              className={`font-mono text-xs ${
                currentLength >= maxLength ? 'text-ink-3' : 'text-ink-4'
              }`}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <input
          ref={ref}
          id={fieldId}
          type={type}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={`w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-4 transition-colors duration-200 outline-none ${
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
TextField.displayName = 'TextField';
