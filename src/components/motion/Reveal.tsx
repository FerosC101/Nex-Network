import type { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_SOFT } from '@/components/motion/easing';


const VIEWPORT = { once: true, margin: '-80px' } as const;

interface RevealProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  /** Distance to travel, in px. */
  y?: number;
  as?: 'div' | 'li' | 'section' | 'article' | 'figure';
}

/** A single element that fades and rises into place the first time it's seen. */
export function Reveal({ children, className, delay = 0, y = 18, as = 'div' }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.4, ease: EASE_OUT_SOFT, delay }}
    >
      {children}
    </Component>
  );
}
