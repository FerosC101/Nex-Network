export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-on-brand font-semibold hover:bg-brand-soft hover:shadow-glow active:translate-y-px disabled:hover:bg-brand disabled:hover:shadow-none',
  secondary:
    'bg-surface/70 text-ink border border-slate hover:border-brand/50 hover:bg-surface-2 active:translate-y-px',
  ghost: 'bg-transparent text-ink-3 hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-3.5 text-[0.95rem]',
};

/**
 * Also exported for links that should look like buttons (`<a>` CTAs), so the
 * two never drift apart.
 */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `inline-flex items-center justify-center gap-2 rounded-control font-medium transition-all duration-200 ease-out-soft disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]}`;
}
