import { useState, useRef, useEffect, useId, forwardRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { sanitizeConsecutiveSpam } from '@/lib/stringSanitizer';

interface ComboboxFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: readonly string[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
  allowCustom?: boolean;
  strictSelection?: boolean;
  maxLength?: number;
  showCount?: boolean;
  emptyMessage?: string;
}

export const ComboboxField = forwardRef<HTMLInputElement, ComboboxFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      disabled = false,
      placeholder = 'Select or type…',
      options,
      value = '',
      onChange,
      onBlur,
      name,
      className = '',
      allowCustom = true,
      strictSelection = false,
      maxLength,
      showCount = false,
      emptyMessage = 'No matches found in the list.',
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync input value with incoming controlled value prop
    useEffect(() => {
      setInputValue(value ?? '');
    }, [value]);

    // Filter options based on typed search query
    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(inputValue.trim().toLowerCase()),
    );

    const currentLength = inputValue.length;

    const handleSelectOption = (option: string) => {
      setInputValue(option);
      onChange?.(option);
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    // Handle clicks outside container to close dropdown and validate strict selection
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);

          if (strictSelection && inputValue.trim()) {
            // Check if typed value matches a valid option in options list
            const exactMatch = options.find(
              (opt) => opt.toLowerCase() === inputValue.trim().toLowerCase(),
            );
            if (exactMatch) {
              setInputValue(exactMatch);
              onChange?.(exactMatch);
            } else {
              // Reset if invalid custom string was typed into strict field
              setInputValue('');
              onChange?.('');
            }
          } else if (allowCustom && !strictSelection && inputValue.trim()) {
            // Commit typed custom string on click outside
            onChange?.(inputValue.trim());
          }

          onBlur?.();
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur, strictSelection, allowCustom, inputValue, options, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      newValue = sanitizeConsecutiveSpam(newValue, 3);

      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      setInputValue(newValue);

      if (allowCustom && !strictSelection) {
        onChange?.(newValue);
      } else if (strictSelection) {
        // Only update form value if typed text exact matches an option
        const exactMatch = options.find(
          (opt) => opt.toLowerCase() === newValue.trim().toLowerCase(),
        );
        onChange?.(exactMatch ?? '');
      }

      setIsOpen(true);
      setHighlightedIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        }
      } else if (e.key === 'Enter') {
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (isOpen && allowCustom && inputValue.trim()) {
          e.preventDefault();
          handleSelectOption(inputValue.trim());
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    const handleClear = () => {
      setInputValue('');
      onChange?.('');
      setIsOpen(false);
    };

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
            {label}
            {required && <span className="ml-1 text-brand">*</span>}
          </label>
          {maxLength && showCount && (
            <span className="text-xs font-mono text-ink-4">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(error)}
            aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
            aria-expanded={isOpen}
            role="combobox"
            autoComplete="off"
            className={`w-full rounded-xl border bg-surface px-4 py-3 pr-10 text-base text-ink placeholder:text-ink-4 transition-colors duration-200 outline-none ${
              error ? 'border-red-400/60 focus:border-red-400' : 'border-line focus:border-brand'
            } ${disabled ? 'cursor-not-allowed opacity-50 bg-base' : ''} ${className}`}
          />

          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
            {inputValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                className="rounded-full p-1 text-ink-4 hover:bg-surface/80 hover:text-ink transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              aria-hidden="true"
              onClick={() => {
                if (!disabled) setIsOpen((prev) => !prev);
              }}
              className={`h-4 w-4 text-ink-3 transition-transform duration-200 cursor-pointer ${
                isOpen ? 'rotate-180' : ''
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            />
          </div>

          {/* Dropdown menu */}
          {isOpen && !disabled && (
            <ul
              role="listbox"
              className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-2xl backdrop-blur-xl transition-all"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const isSelected = option === inputValue;
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
                            ? 'bg-brand/10 text-brand'
                            : 'text-ink hover:bg-surface-hover hover:text-ink'
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-brand" />}
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-2.5 text-sm text-ink-4">
                  {allowCustom && !strictSelection
                    ? `No matches found. Press enter to use "${inputValue}"`
                    : emptyMessage}
                </li>
              )}
            </ul>
          )}
        </div>

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

ComboboxField.displayName = 'ComboboxField';
