import type { PropsWithChildren } from 'react';

interface SectionProps extends PropsWithChildren {
  id?: string;
  className?: string;
  containerClassName?: string;
}

export function Section({ id, className = '', containerClassName = '', children }: SectionProps) {
  return (
    // scroll-mt clears the fixed navbar when a section is reached by anchor.
    <section id={id} className={`relative scroll-mt-16 px-6 py-24 sm:py-32 ${className}`}>
      <div className={`mx-auto w-full max-w-page ${containerClassName}`}>{children}</div>
    </section>
  );
}
