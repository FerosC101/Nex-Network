import { AnimatePresence, motion, useTransform, type MotionValue } from 'framer-motion';
import { CalendarDays, FolderGit2, Lightbulb, Radar, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { useStep } from '@/components/story/useStep';

interface Orbit {
  label: string;
  icon: LucideIcon;
  caption: string;
}

// The six things Nex connects, in the order they join the picture.
const ORBITS: Orbit[] = [
  { label: 'People', icon: Users, caption: 'Students across Batangas — builders, designers, researchers, first-timers.' },
  { label: 'Projects', icon: FolderGit2, caption: 'Ideas that need a team, and teams that need an idea.' },
  { label: 'Opportunities', icon: Radar, caption: 'Hackathons, competitions, internships, and scholarships worth going for.' },
  { label: 'Events', icon: CalendarDays, caption: 'Where members meet in person — to learn, compete, and build.' },
  { label: 'Skills', icon: Lightbulb, caption: 'What each person brings, and what they want to learn next.' },
  { label: 'Community', icon: Sparkles, caption: 'All of it, connected. That is the point of Nex.' },
];

// Evenly spaced on a circle, starting at the top. Coordinates in a 100×100 box.
const RADIUS = 38;
const POINTS = ORBITS.map((_, i) => {
  const angle = (i / ORBITS.length) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) };
});

// Each node takes a slice of the first 70% of the track; the last 30% adds the
// cross-links, so the picture keeps getting richer after every node is in.
const NODE_SPAN = 0.7 / ORBITS.length;
const node = (i: number) => 0.06 + i * NODE_SPAN;

// Neighbours, then a few long chords — the "network gets more complex" beat.
const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4], [2, 5],
];

function Spoke({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const length = useTransform(progress, [node(i), node(i) + NODE_SPAN * 0.8], [0, 1]);
  const p = POINTS[i];
  return (
    <motion.line
      x1={50} y1={50} x2={p.x} y2={p.y}
      stroke="var(--color-brand)" strokeOpacity={0.55} strokeWidth={0.25}
      style={{ pathLength: length }}
    />
  );
}

function Link({ progress, a, b, k }: { progress: MotionValue<number>; a: number; b: number; k: number }) {
  const start = 0.74 + k * 0.022;
  const length = useTransform(progress, [start, start + 0.06], [0, 1]);
  return (
    <motion.line
      x1={POINTS[a].x} y1={POINTS[a].y} x2={POINTS[b].x} y2={POINTS[b].y}
      stroke="var(--color-ink-3)" strokeOpacity={0.35} strokeWidth={0.18}
      style={{ pathLength: length }}
    />
  );
}

function Node({ progress, i, active }: { progress: MotionValue<number>; i: number; active: boolean }) {
  const t = node(i) + NODE_SPAN * 0.5;
  const opacity = useTransform(progress, [t, t + 0.04], [0, 1]);
  const scale = useTransform(progress, [t, t + 0.05], [0.6, 1]);
  const { icon: Icon, label } = ORBITS[i];
  const p = POINTS[i];
  return (
    <motion.div
      style={{ left: `${p.x}%`, top: `${p.y}%`, opacity, scale }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-md transition-all duration-500 sm:px-4 sm:py-2 sm:text-sm ${
          active
            ? 'border-brand bg-brand/15 text-ink shadow-[0_0_30px_-6px_var(--color-brand)]'
            : 'border-slate bg-void/80 text-ink-2'
        }`}
      >
        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${active ? 'text-brand' : 'text-ink-3'}`} aria-hidden="true" />
        {label}
      </div>
    </motion.div>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  // -1 while only the logo is on screen, then whichever node arrived last.
  const step = useStep(progress, ORBITS.length, 0.06 + NODE_SPAN * 0.5, 0.06 + NODE_SPAN * 0.5 + 0.7);
  const complete = useTransform(progress, [0.74, 0.95], [0, 1]);
  const logoScale = useTransform(progress, [0, 0.1, 0.9, 1], [0.85, 1, 1, 1.06]);
  const glow = useTransform(progress, [0, 1], [0.15, 0.4]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 py-20 lg:flex-row lg:gap-16 lg:px-16">
      <div className="relative z-10 w-full max-w-md text-center lg:order-first lg:text-left">
        <p className="label-condensed text-xs text-brand">02 · The world of Nex</p>
        <h2 className="mt-4 text-3xl leading-tight text-balance sm:text-5xl">One place where it all connects.</h2>
        <div className="mt-6 min-h-24" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-base text-ink-2 sm:text-lg"
            >
              {step < 0 ? (
                'It starts with one community.'
              ) : (
                <>
                  <span className="font-semibold text-brand">{ORBITS[step].label}.</span> {ORBITS[step].caption}
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-6 aspect-square w-full max-w-[min(34rem,72svh)] lg:mt-0">
        <motion.div
          aria-hidden="true"
          style={{ opacity: glow }}
          className="absolute inset-[20%] rounded-full bg-brand blur-[90px]"
        />
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          <motion.circle cx={50} cy={50} r={RADIUS} fill="none" stroke="var(--color-slate)" strokeWidth={0.2} strokeDasharray="0.6 1.4" style={{ opacity: complete }} />
          {LINKS.map(([a, b], k) => (
            <Link key={`${a}-${b}`} progress={progress} a={a} b={b} k={k} />
          ))}
          {ORBITS.map((o, i) => (
            <Spoke key={o.label} progress={progress} i={i} />
          ))}
        </svg>

        <motion.div
          style={{ scale: logoScale }}
          className="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand/30 bg-void/90 shadow-[0_0_60px_-10px_var(--color-brand)] sm:h-32 sm:w-32"
        >
          <img src="/nex-mark.png" alt="Nex" className="h-12 w-12 sm:h-16 sm:w-16" />
        </motion.div>

        {ORBITS.map((o, i) => (
          <Node key={o.label} progress={progress} i={i} active={i === step} />
        ))}
      </div>
    </div>
  );
}

/** 02 — Starting from just the logo, the things Nex connects arrive one by one. */
export function StoryWorld() {
  return (
    <StickyTrack
      id="world"
      screens={4}
      ariaLabel="The world of Nex"
      fallback={
        <div className="mx-auto max-w-page px-6 py-24">
          <p className="label-condensed text-xs text-brand">02 · The world of Nex</p>
          <h2 className="mt-4 text-3xl sm:text-5xl">One place where it all connects.</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ORBITS.map(({ label, icon: Icon, caption }) => (
              <li key={label} className="flex gap-3">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <p className="text-ink-2"><span className="font-semibold text-ink">{label}.</span> {caption}</p>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
