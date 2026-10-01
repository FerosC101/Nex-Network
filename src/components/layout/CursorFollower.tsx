import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type Mode = 'idle' | 'interactive' | 'view';

/**
 * A small ring that trails the pointer. It never replaces the system cursor
 * (so precision and accessibility settings are untouched): it grows over
 * links and buttons, and shows "View" over anything marked data-cursor="view".
 *
 * Mouse and trackpad only — touch has no pointer to follow — and off entirely
 * for reduced motion.
 */
export function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-cursor="view"]')) setMode('view');
      else if (target?.closest('a, button, [role="button"], input, select, textarea, label')) setMode('interactive');
      else setMode('idle');
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [x, y]);

  if (!enabled) return null;

  const size = mode === 'view' ? 64 : mode === 'interactive' ? 36 : 22;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[70] flex items-center justify-center rounded-full border"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      animate={{
        width: size,
        height: size,
        opacity: visible ? 1 : 0,
        backgroundColor: mode === 'view' ? 'rgb(0 229 200 / 0.9)' : 'rgb(0 229 200 / 0)',
        borderColor: mode === 'idle' ? 'rgb(248 250 252 / 0.35)' : 'rgb(0 229 200 / 0.7)',
        boxShadow: mode === 'interactive' ? '0 0 18px rgb(0 229 200 / 0.35)' : '0 0 0 rgb(0 229 200 / 0)',
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {mode === 'view' && (
        <span className="text-[0.65rem] font-semibold tracking-wide text-on-brand uppercase">View</span>
      )}
    </motion.div>
  );
}
