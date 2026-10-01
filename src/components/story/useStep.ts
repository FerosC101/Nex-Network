import { useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';

/**
 * A value derived from scroll progress, held in React state. Re-renders only
 * when the derived value changes — not on every scroll frame.
 */
export function useProgressValue<T>(progress: MotionValue<number>, derive: (v: number) => T): T {
  const [value, setValue] = useState(() => derive(progress.get()));
  useMotionValueEvent(progress, 'change', (v) => {
    const next = derive(v);
    if (next !== value) setValue(next);
  });
  return value;
}

/**
 * Which of `count` equal steps the progress is in, between `start` and `end`.
 * Before `start` it reports -1, so a scene can have a "nothing yet" beat.
 */
export function useStep(progress: MotionValue<number>, count: number, start = 0, end = 1) {
  return useProgressValue(progress, (v) =>
    v < start ? -1 : Math.min(count - 1, Math.floor(((v - start) / (end - start)) * count)),
  );
}
