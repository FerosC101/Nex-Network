import { useRef, type AnchorHTMLAttributes, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * A link that leans a few pixels toward the cursor and springs back when it
 * leaves. Mouse only — touch never sends hover moves, so it stays still there.
 */
export function MagneticLink({ children, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });

  function onMove(e: PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className={className}
      {...(rest as object)}
    >
      {children}
    </motion.a>
  );
}
