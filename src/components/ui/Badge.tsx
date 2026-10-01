import type { PropsWithChildren } from 'react';

interface BadgeProps extends PropsWithChildren {
  tone?: 'brand' | 'neutral';
  className?: string;
}

const TONES = {
  brand: 'border-brand/30 bg-brand/10 text-brand',
  neutral: 'border-slate bg-void/60 text-ink-3',
};

/** Compact label for categories and statuses. */
export function Badge({ tone = 'brand', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[0.62rem] font-semibold tracking-wide uppercase ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
