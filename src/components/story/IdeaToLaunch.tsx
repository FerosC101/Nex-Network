import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Check, Rocket } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { buttonClasses } from '@/components/ui/buttonStyles';

interface Stage {
  label: string;
  quote: string;
  note: string;
}

const STAGES: Stage[] = [
  { label: 'Idea', quote: '“I have an idea.”', note: 'Every project starts as a sentence. Nex is where you say it out loud.' },
  { label: 'Team', quote: '“Find collaborators.”', note: 'The developer, the designer, the tester — people whose skills fill your gaps.' },
  { label: 'Build', quote: '“Build.”', note: 'Prototype, break things, fix them. Get feedback from people who have shipped.' },
  { label: 'Test', quote: '“Test.”', note: 'Put it in front of real users — other students are the first ones.' },
  { label: 'Launch', quote: '“Launch.”', note: 'Ship it, show it, take it to a competition. Then start the next one.' },
];

/**
 * The same project at each stage — a sketch that becomes a product. Abstract on
 * purpose: this is the journey, not someone's real project.
 */
function ProjectMock({ stage }: { stage: number }) {
  const sketch = stage === 0;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-card border transition-colors ${
        sketch ? 'border-dashed border-ink-4/60 bg-transparent' : 'border-slate bg-surface shadow-lift'
      }`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {stage >= 1 && (
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
          {[0, 1, 2].map((d) => (
            <span key={d} className="h-2 w-2 rounded-full bg-slate" />
          ))}
        </div>
      )}
      <div className="p-4">
        <div className={`h-3 rounded-full ${sketch ? 'w-1/2 border border-dashed border-ink-4/60' : 'w-1/2 bg-ink/80'}`} />
        <div className={`mt-2 h-2 rounded-full ${sketch ? 'w-3/4 border border-dashed border-ink-4/40' : 'w-3/4 bg-slate'}`} />
        {stage >= 1 && (
          <div className="mt-4 flex -space-x-2">
            {Array.from({ length: Math.min(3, stage + 1) }).map((_, i) => (
              <span key={i} className="h-7 w-7 rounded-full border-2 border-surface bg-gradient-to-br from-brand/70 to-slate" />
            ))}
          </div>
        )}
        {stage >= 2 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-md bg-slate/70" />
            ))}
          </div>
        )}
        {stage >= 3 && (
          <div className="mt-4 space-y-1.5">
            {['Sign up works', 'Loads on mobile', 'Feedback from testers'].map((t) => (
              <p key={t} className="flex items-center gap-2 text-[0.7rem] text-ink-3">
                <Check className="h-3 w-3 text-brand" aria-hidden="true" /> {t}
              </p>
            ))}
          </div>
        )}
      </div>
      {stage >= 4 && (
        <span className="absolute top-2.5 right-3 inline-flex items-center gap-1 rounded-md bg-brand px-2 py-0.5 text-[0.65rem] font-semibold text-on-brand">
          <Rocket className="h-3 w-3" aria-hidden="true" /> Live
        </span>
      )}
    </div>
  );
}

function Panel({ stage, i }: { stage: Stage; i: number }) {
  return (
    <article className="flex h-full w-[86vw] shrink-0 flex-col justify-center gap-8 px-6 sm:w-[70vw] lg:w-[56vw] lg:flex-row lg:items-center lg:gap-12 lg:px-12">
      <div className="lg:w-1/2">
        <p className="font-display text-sm font-bold text-ink-4">{String(i + 1).padStart(2, '0')} · {stage.label}</p>
        <h3 className="mt-3 text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance">
          {stage.quote}
        </h3>
        <p className="mt-4 max-w-sm text-ink-3">{stage.note}</p>
      </div>
      {/* The project grows with each stage. */}
      <div className="w-full lg:w-1/2" style={{ maxWidth: `${16 + i * 3}rem` }}>
        <ProjectMock stage={i} />
      </div>
    </article>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  // How far the row has to travel so its last panel ends on screen.
  useLayoutEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const x = useTransform(progress, [0.08, 0.92], [0, -distance]);
  const bar = useTransform(progress, [0.08, 0.92], [0, 1]);

  return (
    <div className="relative flex h-full flex-col pt-20">
      <div className="mx-auto flex w-full max-w-page items-end justify-between gap-6 px-6">
        <div>
          <p className="label-condensed text-xs text-brand">03 · From idea to launch</p>
          <h2 className="mt-3 text-2xl sm:text-4xl">How a project grows in Nex.</h2>
        </div>
        <ol className="hidden gap-5 text-xs text-ink-4 md:flex" aria-hidden="true">
          {STAGES.map((s) => (
            <li key={s.label}>{s.label}</li>
          ))}
        </ol>
      </div>
      <div className="mx-auto mt-5 h-px w-full max-w-page px-6">
        <div className="relative h-px bg-line">
          <motion.div style={{ scaleX: bar }} className="absolute inset-0 origin-left bg-brand" />
        </div>
      </div>

      <motion.div ref={trackRef} style={{ x }} className="flex min-h-0 flex-1 items-stretch">
        {STAGES.map((stage, i) => (
          <Panel key={stage.label} stage={stage} i={i} />
        ))}
        {/* The honest ending: there's no showcase yet — yours could open it. */}
        <article className="flex h-full w-[86vw] shrink-0 flex-col justify-center px-6 sm:w-[60vw] lg:w-[44vw] lg:px-12">
          <p className="label-condensed text-xs text-brand">Project showcase · coming soon</p>
          <h3 className="mt-4 text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
            The first projects are being built right now.
          </h3>
          <p className="mt-4 max-w-sm text-ink-3">Yours could be one of them.</p>
          <a href="#register" className={`${buttonClasses('primary', 'lg')} group mt-8 self-start`}>
            Start with Nex
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </article>
      </motion.div>
    </div>
  );
}

/** 05 — Vertical scroll drives a horizontal journey from idea to launch. */
export function IdeaToLaunch() {
  return (
    <StickyTrack
      id="idea"
      screens={4.5}
      ariaLabel="From idea to launch"
      fallback={
        <div className="mx-auto max-w-page px-6 py-24">
          <p className="label-condensed text-xs text-brand">03 · From idea to launch</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">How a project grows in Nex.</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-2">
            {STAGES.map((s, i) => (
              <li key={s.label}>
                <p className="font-display text-sm font-bold text-ink-4">{String(i + 1).padStart(2, '0')} · {s.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{s.quote}</p>
                <p className="mt-2 text-ink-3">{s.note}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 text-ink-2">Project showcase coming soon — the first projects are being built right now.</p>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
