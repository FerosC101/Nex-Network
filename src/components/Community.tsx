import { motion, useTransform, type MotionValue } from 'framer-motion';
import { Section } from '@/components/layout/Section';
import { NetworkGraph } from '@/components/NetworkGraph';
import { AnimatedText } from '@/components/motion/AnimatedText';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { StickyTrack } from '@/components/story/StickyTrack';
import { useProgressValue } from '@/components/story/useStep';
import { ACTIVITIES } from '@/data/activities';
import { INTERESTS } from '@/types/registration';

// Real members, real photos. The first is alone on screen; the rest join it.
// Positions are the photo centres, as a percentage of the collage box.
const FACES = [
  { src: '/activities/code-golf-2.jpg', alt: 'The Code Golf top three', x: 50, y: 46, w: 40 },
  { src: '/activities/aws-1.jpg', alt: 'A Nex group selfie at AWS Community Day', x: 15, y: 24, w: 22, position: 'center 30%' },
  { src: '/activities/code-golf-3.jpg', alt: 'Code Golf participants around the table', x: 85, y: 22, w: 24 },
  { src: '/activities/aws-3.jpg', alt: 'The full room at AWS Community Day', x: 16, y: 76, w: 24 },
  { src: '/activities/code-golf-1.jpg', alt: 'Members coding during Code Golf', x: 84, y: 76, w: 22 },
];

// Lines between photo centres, drawn last — the people, connected.
const THREADS: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 3], [2, 4]];

const TAGS = INTERESTS.filter((i) => i !== 'Other');

// The figures the team uses publicly; events are counted, not typed.
const STATS = [
  { value: 250, suffix: '+', label: 'student builders' },
  { value: 19, suffix: '', label: 'schools across Batangas' },
  { value: ACTIVITIES.length, suffix: '', label: ACTIVITIES.length === 1 ? 'event so far' : 'events so far' },
];

function Face({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const f = FACES[i];
  const t = i === 0 ? 0 : 0.1 + i * 0.07;
  // The first photo starts large and centred, then settles into the collage.
  const scale = useTransform(progress, i === 0 ? [0, 0.18] : [t, t + 0.08], i === 0 ? [1.5, 1] : [0.7, 1]);
  const opacity = useTransform(progress, i === 0 ? [0, 0.02] : [t, t + 0.06], [i === 0 ? 1 : 0, 1]);
  const dim = useTransform(progress, [0.42, 0.55], [1, 0.55]);
  return (
    <motion.figure
      style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, scale, opacity }}
      className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-card border border-slate shadow-lift"
    >
      <motion.img
        src={f.src}
        alt={f.alt}
        decoding="async"
        style={{ opacity: dim, ...(f.position ? { objectPosition: f.position } : {}) }}
        className="aspect-[4/3] w-full object-cover"
      />
    </motion.figure>
  );
}

function Thread({ progress, a, b, k }: { progress: MotionValue<number>; a: number; b: number; k: number }) {
  const t = 0.72 + k * 0.03;
  const length = useTransform(progress, [t, t + 0.08], [0, 1]);
  return (
    <motion.line
      x1={FACES[a].x} y1={FACES[a].y} x2={FACES[b].x} y2={FACES[b].y}
      vectorEffect="non-scaling-stroke"
      stroke="var(--color-brand)" strokeWidth={1.5} strokeOpacity={0.8}
      style={{ pathLength: length }}
    />
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  const titleOpacity = useTransform(progress, [0, 0.08], [0, 1]);
  const statsOpacity = useTransform(progress, [0.44, 0.52], [0, 1]);
  const statsY = useTransform(progress, [0.44, 0.52], [24, 0]);
  const tagsShown = useProgressValue(progress, (v) => Math.max(0, Math.min(TAGS.length, Math.floor(((v - 0.55) / 0.15) * TAGS.length))));
  const statsIn = useProgressValue(progress, (v) => v >= 0.46);

  return (
    <div className="relative flex h-full flex-col px-6 pt-20 pb-6">
      <motion.div style={{ opacity: titleOpacity }} className="mx-auto w-full max-w-page">
        <p className="label-condensed text-xs text-brand">06 · The people</p>
        <h2 className="mt-3 text-[clamp(2rem,5vw,4rem)] leading-none font-extrabold tracking-[-0.03em]">
          Real people. <span className="text-brand">Real ideas.</span>
        </h2>
      </motion.div>

      <div className="relative mx-auto mt-4 min-h-0 w-full max-w-page flex-1">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 z-10 h-full w-full overflow-visible">
          {THREADS.map(([a, b], k) => (
            <Thread key={`${a}-${b}`} progress={progress} a={a} b={b} k={k} />
          ))}
        </svg>
        {FACES.map((f, i) => (
          <Face key={f.src} progress={progress} i={i} />
        ))}

        {/* Once everyone is in: who they are, by the numbers that exist. */}
        <motion.dl
          style={{ opacity: statsOpacity, y: statsY }}
          className="absolute top-1/2 left-1/2 z-20 grid w-[min(36rem,92%)] -translate-x-1/2 -translate-y-1/2 grid-cols-3 divide-x divide-line rounded-panel border border-line bg-void/85 py-6 shadow-lift backdrop-blur-xl"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center px-3 text-center">
              <dt className="mt-1 text-xs text-ink-3">{s.label}</dt>
              <dd className="font-display text-3xl font-extrabold sm:text-5xl">
                {statsIn ? (
                  <CountUp value={s.value} suffix={s.suffix} className={s.suffix === '+' ? 'text-brand' : ''} />
                ) : (
                  <span className="tabular-nums">0</span>
                )}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* What they're into — the real interests from registration, one by one. */}
      <ul className="mx-auto mt-4 flex w-full max-w-page flex-wrap justify-center gap-1.5" aria-label="What members are into">
        {TAGS.map((tag, i) => (
          <li
            key={tag}
            className={`rounded-md border px-2.5 py-1 text-xs transition-all duration-500 sm:text-sm ${
              i < tagsShown ? 'border-slate bg-surface/80 text-ink-2 opacity-100' : 'translate-y-2 border-transparent opacity-0'
            }`}
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 09 — The people, then 10 — the network they form. The second pays off the
 * world-of-Nex sketch from chapter 02: same idea, now explorable.
 */
export function Community() {
  return (
    <>
      <StickyTrack
        id="people"
        screens={4}
        ariaLabel="The people"
        fallback={
          <div className="mx-auto max-w-page px-6 py-24">
            <p className="label-condensed text-xs text-brand">06 · The people</p>
            <h2 className="mt-3 text-4xl font-extrabold sm:text-6xl">
              Real people. <span className="text-brand">Real ideas.</span>
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
              {FACES.map((f) => (
                <img key={f.src} src={f.src} alt={f.alt} loading="lazy" className="aspect-[4/3] rounded-card object-cover" />
              ))}
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-sm text-ink-3">{s.label}</dt>
                  <dd className="font-display text-4xl font-extrabold">{s.value}{s.suffix}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-8 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <li key={t} className="rounded-md border border-slate px-2.5 py-1 text-sm text-ink-2">{t}</li>
              ))}
            </ul>
          </div>
        }
      >
        {(progress) => <Scene progress={progress} />}
      </StickyTrack>

      <Section id="network" className="overflow-hidden border-t border-line-soft">
        <div aria-hidden="true" className="grid-veil pointer-events-none absolute inset-0 opacity-60 mask-[radial-gradient(ellipse_60%_50%_at_50%_45%,black,transparent)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="label-condensed text-xs text-brand">06 · The network comes together</p>
          </Reveal>
          <AnimatedText text="This is Nex." accentFrom={2} className="mt-5 text-5xl font-extrabold sm:text-7xl" />
          <Reveal delay={0.15}>
            <p className="mt-5 text-lg text-ink-2">
              Students, skills, projects, people, events, and opportunities — all connected. Pick any point and
              follow where it leads.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="relative mt-14">
          <NetworkGraph />
        </Reveal>
      </Section>
    </>
  );
}
