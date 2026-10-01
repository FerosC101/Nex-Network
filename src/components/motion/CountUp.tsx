import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  suffix?: string;
  className?: string;
}

/**
 * Counts from 0 to a real figure the first time it scrolls into view.
 * Reduced-motion visitors, and the server-rendered first paint, get the final
 * number straight away — never a stuck 0.
 */
export function CountUp({ value, suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: Math.min(1.6, 0.6 + value / 400),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {/* The final figure for assistive tech, whatever frame the animation is on. */}
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true">
        {shown}
        {suffix}
      </span>
    </span>
  );
}
