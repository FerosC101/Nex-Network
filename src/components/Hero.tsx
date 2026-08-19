import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Model3D } from '@/components/Model3D';
import { GlowBackground } from '@/components/layout/GlowBackground';
import { VideoBackdrop } from '@/components/layout/VideoBackdrop';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <header className="relative isolate flex min-h-svh flex-col overflow-hidden px-6 pt-8 pb-24 sm:pt-10">
      <VideoBackdrop />
      <GlowBackground />

      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Logo size={32} />
        </motion.div>
        <motion.a
          href="#register"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
          className="label-condensed text-xs text-ink-3 transition-colors hover:text-brand"
        >
          Join Nex
        </motion.a>
      </nav>

      <div className="mx-auto my-auto grid w-full max-w-6xl items-center gap-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-center lg:text-left"
        >
          <p className="label-condensed text-brand text-sm">A student builder community · Batangas</p>

          <h1 className="mt-5 text-5xl leading-[1.02] font-semibold text-balance sm:text-6xl lg:text-7xl">
            <span className="text-brand-gradient">Your next</span>
            <br />
            starts here.
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-2 text-balance lg:mx-0">
            Join Nex, a community for students across Batangas who want to learn, build, collaborate,
            compete, and connect.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3.5 lg:items-start">
            <Button
              variant="primary"
              className="px-9 py-4 text-base"
              onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Join Nex
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-sm text-ink-3">No experience required. Just start.</p>
          </div>
        </motion.div>

        {/* The 3D brand render — screen-blended so its studio backdrop drops away */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative order-first lg:order-last"
        >
          <div
            aria-hidden="true"
            className="animate-breathe absolute inset-0 m-auto h-3/5 w-3/5 rounded-full bg-brand/20 blur-[90px]"
          />
          <div className="relative mx-auto aspect-square w-full max-w-76 lg:max-w-104">
            <Model3D
              url="/nex-logo.glb"
              fallbackSrc="/nex-mark-3d.png"
              fallbackAlt="The Nex mark"
            />
          </div>
        </motion.div>
      </div>
    </header>
  );
}
