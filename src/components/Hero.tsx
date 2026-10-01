import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { MagneticLink } from '@/components/story/MagneticLink';
import { buttonClasses } from '@/components/ui/buttonStyles';

// One word per beat, each with its own photograph behind it. The words share
// a single position; the photos share the frame.
const BEATS = [
  { word: 'Connect.', photo: '/activities/aws-3.jpg' },
  { word: 'Build.', photo: '/activities/code-golf-1.jpg' },
  { word: 'Grow.', photo: '/activities/aws-2.jpg' },
];

// Progress windows (0 → 1 across the pinned track).
const WORD_SPAN = 0.2; // each word holds for this long
const WORDS_END = BEATS.length * WORD_SPAN; // 0.6 — then the resolve begins

function Word({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const start = index * WORD_SPAN;
  const end = start + WORD_SPAN;
  const isFirst = index === 0;
  const isLast = index === BEATS.length - 1;

  // In: unmasked upward from below (the first word is simply there). Out:
  // lifts, spreads its letters, blurs. Input ranges stay inside 0–1 — the
  // browser rejects scroll animations with offsets outside it.
  const inRange = isFirst ? [0, 0.01] : [start - 0.06, start];
  const clip = useTransform(
    progress,
    inRange,
    isFirst ? ['inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] : ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
  );
  const inY = useTransform(progress, inRange, isFirst ? [0, 0] : [60, 0]);
  const outEnd = isLast ? WORDS_END + 0.08 : end;
  const outY = useTransform(progress, [outEnd - 0.06, outEnd], [0, -70]);
  const opacity = useTransform(progress, [outEnd - 0.06, outEnd], [1, 0]);
  const spacing = useTransform(progress, [outEnd - 0.06, outEnd], ['-0.04em', '0.08em']);
  const blur = useTransform(progress, [outEnd - 0.06, outEnd], ['blur(0px)', 'blur(10px)']);
  const y = useTransform(() => inY.get() + outY.get());

  return (
    <motion.span
      aria-hidden="true"
      style={{ clipPath: clip, y, opacity, letterSpacing: spacing, filter: blur }}
      className={`absolute inset-x-0 text-center will-change-transform ${isLast ? 'text-brand-gradient' : ''}`}
    >
      {BEATS[index].word}
    </motion.span>
  );
}

function Photo({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const start = index * WORD_SPAN;
  const opacity = useTransform(
    progress,
    index === 0 ? [0, WORD_SPAN - 0.02, WORD_SPAN + 0.02] : [start - 0.04, start + 0.02, start + WORD_SPAN - 0.02, start + WORD_SPAN + 0.02],
    index === 0 ? [1, 1, 0] : index === BEATS.length - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  // Each photo drifts slowly while it's up, so a pause still feels alive.
  const scale = useTransform(progress, [Math.max(0, start - 0.05), Math.min(1, start + WORD_SPAN + 0.3)], [1.12, 1]);
  return (
    <motion.img
      src={BEATS[index].photo}
      alt=""
      decoding="async"
      style={{ opacity, scale }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  // The resolve: the big word gives way to the full line, copy, and CTAs.
  const lineOpacity = useTransform(progress, [WORDS_END + 0.06, WORDS_END + 0.16], [0, 1]);
  const lineY = useTransform(progress, [WORDS_END + 0.06, WORDS_END + 0.16], [30, 0]);
  const copyOpacity = useTransform(progress, [WORDS_END + 0.14, WORDS_END + 0.24], [0, 1]);
  const copyY = useTransform(progress, [WORDS_END + 0.14, WORDS_END + 0.24], [20, 0]);
  const ctaOpacity = useTransform(progress, [WORDS_END + 0.2, WORDS_END + 0.3], [0, 1]);
  const ctaPointer = useTransform(ctaOpacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  // The photo darkens further as the copy arrives, keeping it readable.
  const scrim = useTransform(progress, [WORDS_END, WORDS_END + 0.15], [0.72, 0.86]);
  const cue = useTransform(progress, [0, 0.05], [1, 0]);
  // The navbar carries the logo from here on, so the big mark steps aside.
  const brandY = useTransform(progress, [WORDS_END, WORDS_END + 0.12], [0, -30]);
  const brandOpacity = useTransform(progress, [WORDS_END, WORDS_END + 0.1], [1, 0]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-void">
        {BEATS.map((beat, i) => (
          <Photo key={beat.photo} progress={progress} index={i} />
        ))}
        <motion.div className="absolute inset-0 bg-void" style={{ opacity: scrim }} />
        <div className="grid-veil absolute inset-0 opacity-60 mask-[radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,transparent_40%,var(--color-void))]" />
      </div>

      {/* The existing mark and name: the first thing anyone sees. */}
      <motion.div style={{ y: brandY, opacity: brandOpacity }} className="flex flex-col items-center">
        <img src="/nex-mark.png" alt="" width={56} height={56} className="h-12 w-12 sm:h-14 sm:w-14" />
        <p className="label-condensed mt-4 text-[0.7rem] tracking-[0.4em] text-ink-2">Nex Network</p>
      </motion.div>

      {/* One position, three words. The real headline is the h1 below; these
          are its scroll-driven performance, hidden from assistive tech. */}
      <div className="relative mt-8 h-[1.05em] w-full font-display text-[clamp(4rem,17vw,13rem)] leading-none font-extrabold tracking-[-0.04em] text-ink">
        {BEATS.map((beat, i) => (
          <Word key={beat.word} progress={progress} index={i} />
        ))}
      </div>

      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-6 text-center">
        <motion.h1
          style={{ opacity: lineOpacity, y: lineY }}
          className="text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.02] font-extrabold tracking-[-0.035em]"
        >
          Connect. Build. <span className="text-brand-gradient">Grow.</span>
        </motion.h1>
        <motion.p
          style={{ opacity: copyOpacity, y: copyY }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-ink-2 sm:text-xl"
        >
          Where students in Batangas discover opportunities, find people to build with, and turn ideas into
          something real.
        </motion.p>
        <motion.div
          style={{ opacity: ctaOpacity, pointerEvents: ctaPointer }}
          className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row"
        >
          <MagneticLink href="#register" className={`${buttonClasses('primary', 'lg')} group`}>
            Join Nex
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </MagneticLink>
          <MagneticLink href="#world" className={buttonClasses('secondary', 'lg')}>
            Explore Community
          </MagneticLink>
        </motion.div>
      </div>

      <motion.p
        aria-hidden="true"
        style={{ opacity: cue }}
        className="label-condensed absolute bottom-8 flex flex-col items-center gap-3 text-[0.6rem] text-ink-3"
      >
        Scroll
        <span className="h-10 w-px bg-gradient-to-b from-brand to-transparent" />
      </motion.p>
    </div>
  );
}

/**
 * 01 — The opening. Not a hero block: a pinned scene where one word
 * transforms into the next as you scroll, over the community's own photos,
 * before resolving into the line, the promise, and the way in.
 */
export function Hero() {
  return (
    <StickyTrack
      id="top"
      screens={4}
      ariaLabel="Nex Network"
      fallback={
        <div className="relative isolate flex min-h-svh flex-col items-center justify-center px-6 py-28 text-center">
          <img src="/activities/aws-3.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-void/85" />
          <img src="/nex-mark.png" alt="" width={56} height={56} />
          <p className="label-condensed mt-4 text-[0.7rem] tracking-[0.4em] text-ink-2">Nex Network</p>
          <h1 className="mt-8 text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
            Connect. Build. <span className="text-brand">Grow.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-2">
            Where students in Batangas discover opportunities, find people to build with, and turn ideas into
            something real.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#register" className={buttonClasses('primary', 'lg')}>Join Nex</a>
            <a href="#world" className={buttonClasses('secondary', 'lg')}>Explore Community</a>
          </div>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
