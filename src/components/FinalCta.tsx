import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { VideoBackdrop } from '@/components/layout/VideoBackdrop';
import { MagneticLink } from '@/components/story/MagneticLink';
import { StickyTrack } from '@/components/story/StickyTrack';
import { buttonClasses } from '@/components/ui/buttonStyles';

const PROMISES = ['Find your people.', 'Build something real.', 'Take the next step.'];

function PromiseLine({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const t = 0.26 + i * 0.07;
  const opacity = useTransform(progress, [t, t + 0.06], [0, 1]);
  const y = useTransform(progress, [t, t + 0.06], [18, 0]);
  return (
    <motion.span style={{ opacity, y }} className="block">
      {PROMISES[i]}
    </motion.span>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  // Darkness first; the brand film brightens as the story resolves.
  const dark = useTransform(progress, [0, 0.5, 0.85], [0.97, 0.9, 0.45]);
  const glow = useTransform(progress, [0.1, 0.85], [0.08, 0.45]);
  const glowScale = useTransform(progress, [0.1, 0.85], [0.6, 1.4]);
  // The logo arrives, then grows behind the words.
  const logoOpacity = useTransform(progress, [0, 0.1, 0.55, 0.85], [0, 1, 1, 0.35]);
  const logoScale = useTransform(progress, [0, 0.5, 0.9], [0.55, 1, 2.6]);
  const logoY = useTransform(progress, [0, 0.5], [40, 0]);
  const headOpacity = useTransform(progress, [0.12, 0.2], [0, 1]);
  const headY = useTransform(progress, [0.12, 0.2], [24, 0]);
  const joinOpacity = useTransform(progress, [0.5, 0.6], [0, 1]);
  const joinScale = useTransform(progress, [0.5, 0.62], [0.9, 1]);
  const joinPointer = useTransform(joinOpacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <div className="relative isolate flex h-full flex-col items-center justify-center px-6 text-center">
      <VideoBackdrop />
      <motion.div aria-hidden="true" className="absolute inset-0 -z-10 bg-void" style={{ opacity: dark }} />
      <motion.div
        aria-hidden="true"
        style={{ opacity: glow, scale: glowScale }}
        className="absolute top-1/2 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/40 blur-[140px]"
      />
      <motion.img
        src="/nex-mark-3d.png"
        alt=""
        aria-hidden="true"
        style={{ opacity: logoOpacity, scale: logoScale, y: logoY }}
        className="pointer-events-none absolute top-[34%] left-1/2 -z-10 w-40 -translate-x-1/2 -translate-y-1/2 sm:w-56"
      />

      <motion.h2
        style={{ opacity: headOpacity, y: headY }}
        className="mt-40 text-[clamp(2.6rem,8vw,6.5rem)] leading-[1] font-extrabold tracking-[-0.04em] text-balance sm:mt-56"
      >
        What's next starts <span className="text-brand-gradient">here.</span>
      </motion.h2>
      <p className="mt-6 text-xl leading-snug text-ink-2 sm:text-2xl">
        {PROMISES.map((p, i) => (
          <PromiseLine key={p} progress={progress} i={i} />
        ))}
      </p>

      <motion.div style={{ opacity: joinOpacity, scale: joinScale, pointerEvents: joinPointer }} className="mt-10">
        <MagneticLink href="#register" className={`${buttonClasses('primary', 'lg')} group !px-10 !py-4 text-base tracking-[0.2em] uppercase`}>
          Join Nex
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </MagneticLink>
      </motion.div>
    </div>
  );
}

/**
 * 11 — The ending. The mark emerges from darkness, the promise lands line by
 * line, then the logo swells and the film brightens behind it before the one
 * thing left to do appears.
 */
export function FinalCta() {
  return (
    <StickyTrack
      id="join"
      screens={3.5}
      ariaLabel="Join Nex"
      fallback={
        <div className="relative isolate flex min-h-[80svh] flex-col items-center justify-center px-6 py-28 text-center">
          <img src="/nex-mark-3d.png" alt="" className="w-40" />
          <h2 className="mt-8 text-5xl font-extrabold sm:text-7xl">
            What's next starts <span className="text-brand">here.</span>
          </h2>
          <p className="mt-6 text-xl text-ink-2">
            {PROMISES.map((p) => (
              <span key={p} className="block">{p}</span>
            ))}
          </p>
          <a href="#register" className={`${buttonClasses('primary', 'lg')} mt-10 tracking-[0.2em] uppercase`}>Join Nex</a>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
