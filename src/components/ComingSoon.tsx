import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { buttonClasses } from '@/components/ui/buttonStyles';

// Kinds of opportunity, scattered across an empty screen and found one at a
// time. Categories only — there is no opportunity data yet, and a made-up
// listing with a deadline is exactly what a student might act on.
const FINDS = [
  { label: 'Hackathons', x: 18, y: 26, size: 'text-3xl sm:text-5xl' },
  { label: 'Competitions', x: 72, y: 20, size: 'text-2xl sm:text-4xl' },
  { label: 'Internships', x: 30, y: 70, size: 'text-2xl sm:text-4xl' },
  { label: 'Scholarships', x: 76, y: 66, size: 'text-3xl sm:text-5xl' },
  { label: 'Workshops', x: 50, y: 88, size: 'text-xl sm:text-3xl' },
  { label: 'Fellowships', x: 54, y: 10, size: 'text-xl sm:text-3xl' },
];

const FIND_START = 0.14;
const FIND_SPAN = 0.08;

function Find({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const t = FIND_START + i * FIND_SPAN;
  const opacity = useTransform(progress, [t, t + 0.05, 0.7, 0.8], [0, 1, 1, 0.1]);
  const blur = useTransform(progress, [t, t + 0.05], ['blur(12px)', 'blur(0px)']);
  const scale = useTransform(progress, [t, t + 0.06], [1.25, 1]);
  const { label, x, y, size } = FINDS[i];
  return (
    <motion.span
      style={{ left: `${x}%`, top: `${y}%`, opacity, filter: blur, scale }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 font-display font-bold whitespace-nowrap text-ink ${size}`}
    >
      {label}
      <span className="text-brand">.</span>
    </motion.span>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  const qOpacity = useTransform(progress, [0, 0.06, 0.66, 0.74], [0, 1, 1, 0]);
  const qScale = useTransform(progress, [0, 0.66], [0.94, 1.04]);
  const endOpacity = useTransform(progress, [0.76, 0.86], [0, 1]);
  const endY = useTransform(progress, [0.76, 0.86], [30, 0]);
  const endPointer = useTransform(endOpacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <div className="relative h-full overflow-hidden">
      <div aria-hidden="true" className="grid-veil absolute inset-0 opacity-40 mask-[radial-gradient(ellipse_60%_55%_at_50%_50%,black,transparent)]" />
      <div aria-hidden="true" className="absolute inset-[6%_4%]">
        {FINDS.map((f, i) => (
          <Find key={f.label} progress={progress} i={i} />
        ))}
      </div>

      <motion.h2
        style={{ opacity: qOpacity, scale: qScale }}
        className="absolute inset-0 flex items-center justify-center text-[clamp(3rem,10vw,8rem)] font-extrabold tracking-[-0.04em] text-ink-3"
      >
        What's next?
      </motion.h2>

      <motion.div
        style={{ opacity: endOpacity, y: endY, pointerEvents: endPointer }}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="label-condensed text-xs text-brand">04 · Opportunities</p>
        <p className="mt-5 max-w-3xl text-[clamp(2rem,5vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
          Every opportunity, in one place. <span className="text-ink-3">Coming soon to Nex.</span>
        </p>
        <p className="mt-5 max-w-lg text-lg text-ink-2">
          Hackathons, competitions, internships, scholarships, workshops, and fellowships — with deadlines up
          front. Members get it first.
        </p>
        <a href="#register" className={`${buttonClasses('secondary', 'lg')} group mt-9`}>
          Get early access
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </motion.div>
    </div>
  );
}

/** 07 — "What's next?": an empty screen where opportunities are discovered. */
export function ComingSoon() {
  return (
    <StickyTrack
      id="opportunities"
      screens={3.5}
      ariaLabel="Opportunities"
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <p className="label-condensed text-xs text-brand">04 · Opportunities</p>
          <h2 className="mt-5 text-4xl font-extrabold sm:text-6xl">
            What's next? <span className="text-ink-3">Every opportunity, in one place — coming soon.</span>
          </h2>
          <p className="mt-6 text-lg text-ink-2">{FINDS.map((f) => f.label).join(', ')} — with deadlines up front. Members get it first.</p>
          <a href="#register" className={`${buttonClasses('secondary', 'lg')} mt-9`}>Get early access</a>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
