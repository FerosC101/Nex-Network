import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand text-[#10171a] font-semibold hover:bg-brand-soft hover:shadow-[0_0_36px_-4px_var(--color-brand)] disabled:hover:bg-brand disabled:hover:shadow-none',
  secondary: 'bg-surface text-ink border border-line hover:border-brand/50 hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-3 hover:text-ink',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
