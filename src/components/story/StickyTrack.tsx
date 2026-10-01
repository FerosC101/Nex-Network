import { useRef, type ReactNode } from 'react';
import { motionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from 'framer-motion';

interface StickyTrackProps {
  id?: string;
  /** How many screens of scrolling the sequence lasts. */
  screens: number;
  /** Renders the pinned scene from scroll progress (0 → 1 across the track). */
  children: (progress: MotionValue<number>) => ReactNode;
  /**
   * What reduced-motion visitors get instead: a normal, un-pinned section with
   * everything readable at once. Defaults to the scene at its final frame.
   */
  fallback?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

// Shared, never-changing "fully played" progress for the reduced-motion path.
const DONE = motionValue(1);

/**
 * The building block of the story: a tall section whose inner scene stays
 * pinned to the viewport while its scroll progress drives what happens.
 * Everything inside animates from that one MotionValue, so nothing re-renders
 * per frame.
 */
export function StickyTrack({ id, screens, children, fallback, className = '', ariaLabel }: StickyTrackProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Scenes read a plain copy of the progress, not scrollYProgress itself.
  // Framer hands opacity/filter/clip-path transforms of scrollYProgress to the
  // browser's native scroll timeline, which measures the whole page rather
  // than this section's pinned range — so those properties would play out of
  // step with everything else. A plain MotionValue keeps every property on
  // the same clock.
  const progress = useMotionValue(scrollYProgress.get());
  useMotionValueEvent(scrollYProgress, 'change', (v) => progress.set(v));

  if (reduce) {
    return (
      <section id={id} aria-label={ariaLabel} className={`relative scroll-mt-16 ${className}`}>
        {fallback ?? <div className="relative h-svh min-h-[36rem] overflow-hidden">{children(DONE)}</div>}
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      aria-label={ariaLabel}
      className={`relative ${className}`}
      style={{ height: `${screens * 100}svh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">{children(progress)}</div>
    </section>
  );
}
