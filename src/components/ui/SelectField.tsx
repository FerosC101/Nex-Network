import { useState, useRef, useEffect, useId, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: readonly string[];
  value?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
}

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
  (
    {
      label,
      error,
      required,
      disabled = false,
      placeholder = 'Select…',
      options,
      value = '',
      onChange,
      onBlur,
      name,
      className = '',
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = generatedId;
    const errorId = error ? `${fieldId}-error` : undefined;

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle clicks outside container to close dropdown
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          onBlur?.();
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    const handleSelectOption = (option: string) => {
      onChange?.({ target: { name, value: option } });
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
      } else if (e.key === 'Enter') {
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
          e.preventDefault();
          handleSelectOption(options[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
        <div className="relative">
          <button
            ref={ref}
            id={fieldId}
            name={name}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            aria-expanded={isOpen}
            role="combobox"
            className={`flex w-full items-center justify-between rounded-xl border bg-surface px-4 py-3 text-base text-ink text-left transition-colors duration-200 outline-none ${
              error ? 'border-red-400/60 focus:border-red-400' : 'border-line focus:border-brand'
            } ${disabled ? 'cursor-not-allowed opacity-50 bg-base' : 'cursor-pointer'} ${className}`}
          >
            <span className={value ? 'text-ink' : 'text-ink-4'}>{value || placeholder}</span>
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && !disabled && (
            <ul
              role="listbox"
              className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-2xl backdrop-blur-xl transition-all"
            >
              {options.map((option, idx) => {
                const isSelected = option === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isHighlighted
                        ? 'bg-brand/15 text-brand font-medium'
                        : isSelected
                          ? 'bg-brand/10 text-brand font-medium'
                          : 'text-ink hover:bg-surface-hover hover:text-ink'
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-brand" />}
                  </li>
                );
              })}
            </ul>
          )}
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
