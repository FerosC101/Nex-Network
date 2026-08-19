import type { PropsWithChildren } from 'react';

interface SectionProps extends PropsWithChildren {
  id?: string;
  className?: string;
  containerClassName?: string;
}

export function Section({ id, className = '', containerClassName = '', children }: SectionProps) {
  return (
    <section id={id} className={`relative px-6 py-24 sm:py-28 ${className}`}>
      <div className={`mx-auto w-full max-w-6xl ${containerClassName}`}>{children}</div>
    </section>
  );
}
