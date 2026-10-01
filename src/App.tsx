import { MotionConfig } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { CursorFollower } from '@/components/layout/CursorFollower';
import { ChapterIndicator } from '@/components/story/ChapterIndicator';
import { Hero } from '@/components/Hero';
import { StoryWorld } from '@/components/story/StoryWorld';
import { WhyNex } from '@/components/WhyNex';
import { Enables } from '@/components/story/Enables';
import { IdeaToLaunch } from '@/components/story/IdeaToLaunch';
import { ComingSoon } from '@/components/ComingSoon';
import { Activities } from '@/components/Activities';
import { Community } from '@/components/Community';
import { FinalCta } from '@/components/FinalCta';
import { RegistrationSection } from '@/components/registration/RegistrationSection';
import { Footer } from '@/components/Footer';

/**
 * The page is a story, told in chapters (see story/chapters.ts). Most are
 * pinned scenes driven by scroll progress; with reduced motion each one
 * renders as a plain, fully readable section instead.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-void">
        <a
          href="#register"
          className="sr-only z-[60] rounded-control bg-brand px-4 py-2 font-semibold text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to registration
        </a>
        <CursorFollower />
        <Navbar />
        <ChapterIndicator />
        <main>
          <Hero />          {/* 01 Intro: Connect → Build → Grow */}
          <StoryWorld />    {/* 02 The world of Nex */}
          <WhyNex />        {/* 02 The talent is already here */}
          <Enables />       {/* 03 What Nex enables */}
          <IdeaToLaunch />  {/* 03 From idea to launch */}
          <ComingSoon />    {/* 04 Opportunities */}
          <Activities />    {/* 05 Events */}
          <Community />     {/* 06 People + the network */}
          <FinalCta />      {/* 07 Join */}
          <RegistrationSection />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
