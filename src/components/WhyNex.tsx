import { motion, useTransform, type MotionValue } from 'framer-motion';
import { StickyTrack } from '@/components/story/StickyTrack';

const LINES = [
  { text: 'The talent is already here.', accent: false },
  { text: "But finding where to start isn't always easy.", accent: false },
  { text: "That's where Nex comes in.", accent: true },
];

// Each line owns a third of the track; it is unmasked upward, holds, then
// lifts away as the next arrives. The last one stays.
function Line({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const span = 1 / LINES.length;
  const start = i * span;
  const last = i === LINES.length - 1;
  const inT = [start + 0.02, start + 0.12];
  const outT = [start + span - 0.06, Math.min(1, start + span + 0.02)];
  const clip = useTransform(progress, inT, ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']);
  const y = useTransform(progress, [inT[0], inT[1], outT[0], outT[1]], [40, 0, 0, last ? 0 : -60]);
  const opacity = useTransform(progress, [outT[0], outT[1]], [1, last ? 1 : 0]);
  return (
    <motion.p
      style={{ clipPath: clip, y, opacity }}
      className={`absolute inset-x-0 px-6 text-center text-[clamp(2.2rem,6.4vw,5.5rem)] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance ${
        LINES[i].accent ? 'text-brand' : 'text-ink'
      }`}
    >
      {LINES[i].text}
    </motion.p>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  // The photo starts almost black and clears as the story turns hopeful.
  const scrim = useTransform(progress, [0, 0.45, 0.8], [0.92, 0.7, 0.55]);
  const scale = useTransform(progress, [0, 1], [1.25, 1.02]);
  const x = useTransform(progress, [0, 1], ['-3%', '2%']);
  const bodyOpacity = useTransform(progress, [0.8, 0.9], [0, 1]);
  const bodyY = useTransform(progress, [0.8, 0.9], [20, 0]);

  return (
    <div className="relative flex h-full items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <motion.img
          src="/activities/aws-2.jpg"
          alt=""
          decoding="async"
          style={{ scale, x }}
          className="h-full w-full object-cover"
        />
        <motion.div className="absolute inset-0 bg-void" style={{ opacity: scrim }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_50%,transparent_30%,var(--color-void))]" />
      </div>

      <h2 className="sr-only">{LINES.map((l) => l.text).join(' ')}</h2>
      <div aria-hidden="true" className="relative h-[3.3em] w-full max-w-5xl text-[clamp(2.2rem,6.4vw,5.5rem)]">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          {LINES.map((line, i) => (
            <Line key={line.text} progress={progress} i={i} />
          ))}
        </div>
      </div>

      <motion.p
        style={{ opacity: bodyOpacity, y: bodyY }}
        className="absolute bottom-[12%] max-w-xl px-6 text-center text-lg text-pretty text-ink-2"
      >
        Talented students shouldn't have to figure everything out alone. Nex connects them with opportunities,
        people, knowledge, and projects — so they can start building.
      </motion.p>
      <p className="label-condensed absolute bottom-6 text-[0.6rem] text-ink-3">
        Nex members at AWS Student Community Day Mega Manila, September 2026
      </p>
    </div>
  );
}

/**
 * 03 — The problem, told over a real photo of members: the talent exists,
 * the path doesn't, and that gap is why Nex exists.
 */
export function WhyNex() {
  return (
    <StickyTrack
      id="talent"
      screens={3.5}
      ariaLabel="Why Nex exists"
      fallback={
        <div className="relative isolate px-6 py-28 text-center">
          <img src="/activities/aws-2.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-void/80" />
          <h2 className="mx-auto max-w-4xl space-y-4 text-4xl leading-tight sm:text-6xl">
            {LINES.map((l) => (
              <span key={l.text} className={`block ${l.accent ? 'text-brand' : ''}`}>{l.text}</span>
            ))}
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-lg text-ink-2">
            Talented students shouldn't have to figure everything out alone. Nex connects them with
            opportunities, people, knowledge, and projects — so they can start building.
          </p>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
