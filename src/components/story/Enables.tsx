import { AnimatePresence, motion, useTransform, type MotionValue } from 'framer-motion';
import { BookOpen, Code2, Compass, FileText, Hammer, PenTool, PlayCircle, Trophy, Users, type LucideIcon } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { useStep } from '@/components/story/useStep';
import { ACTIVITIES } from '@/data/activities';

interface Capability {
  title: string;
  icon: LucideIcon;
  line: string;
  body: string;
  Visual: () => React.JSX.Element;
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay: 0.08 + i * 0.08 },
});

/* — Visuals. Illustrative, never fake: they show the *kind* of thing, with no
     invented organisations, deadlines, names, or numbers. — */

function DiscoverVisual() {
  const kinds = ['Hackathon', 'Competition', 'Internship', 'Scholarship'];
  return (
    <div className="relative h-full w-full">
      {kinds.map((kind, i) => (
        <motion.div
          key={kind}
          initial={{ opacity: 0, y: 40, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 5 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.09 }}
          style={{ top: `${14 + i * 15}%`, left: `${10 + i * 9}%`, zIndex: i }}
          className="absolute w-[62%] rounded-card border border-slate bg-surface p-5 shadow-lift"
        >
          <span className="label-condensed text-[0.6rem] text-brand">{kind}</span>
          <div className="mt-3 h-2.5 w-3/4 rounded-full bg-slate" />
          <div className="mt-2 h-2.5 w-1/2 rounded-full bg-slate/60" />
          <div className="mt-5 flex items-center justify-between">
            <div className="h-2 w-16 rounded-full bg-slate/60" />
            <div className="h-6 w-14 rounded-md bg-brand/20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BuildVisual() {
  const code = ['def solve(problem):', '    idea = problem.understand()', '    team = nex.find(skills=idea.needs)', '    return team.build(idea)'];
  return (
    <motion.div {...rise(0)} className="flex h-full w-full flex-col overflow-hidden rounded-panel border border-slate bg-surface shadow-lift">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        {[0, 1, 2].map((d) => (
          <span key={d} className="h-2.5 w-2.5 rounded-full bg-slate" />
        ))}
        <span className="ml-3 text-xs text-ink-4">your-project</span>
      </div>
      <div className="flex flex-1">
        <motion.div {...rise(1)} className="hidden w-1/4 space-y-2 border-r border-line p-4 sm:block">
          {[70, 50, 85, 40, 60].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-slate/70" style={{ width: `${w}%` }} />
          ))}
        </motion.div>
        <div className="flex-1 p-5 font-mono text-[0.72rem] leading-6 sm:text-sm">
          {code.map((line, i) => (
            <motion.div key={line} {...rise(i + 2)} className="whitespace-pre text-ink-2">
              <span className="mr-4 text-ink-4 select-none">{i + 1}</span>
              {line.includes('nex') ? (
                <>
                  {line.split('nex')[0]}
                  <span className="text-brand">nex</span>
                  {line.split('nex')[1]}
                </>
              ) : (
                line
              )}
            </motion.div>
          ))}
          <motion.div {...rise(7)} className="mt-6 inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> build passing
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function CollaborateVisual() {
  const people = [
    { role: 'Developer', icon: Code2, x: 22, y: 30 },
    { role: 'Designer', icon: PenTool, x: 78, y: 26 },
    { role: 'Researcher', icon: FileText, x: 50, y: 78 },
  ];
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {people.map((a, i) => {
          const b = people[(i + 1) % people.length];
          return (
            <motion.line
              key={a.role}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              vectorEffect="non-scaling-stroke"
              stroke="var(--color-brand)" strokeWidth={1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.35 + i * 0.15 }}
            />
          );
        })}
      </svg>
      {people.map(({ role, icon: Icon, x, y }, i) => (
        <motion.div
          key={role}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.12 }}
          style={{ left: `${x}%`, top: `${y}%` }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/50 bg-surface shadow-[0_0_40px_-8px_var(--color-brand)] sm:h-20 sm:w-20">
            <Icon className="h-6 w-6 text-brand sm:h-7 sm:w-7" aria-hidden="true" />
          </span>
          <span className="mt-2 text-sm text-ink-2">{role}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LearnVisual() {
  const topics = [
    { name: 'AI & Machine Learning', icon: PlayCircle },
    { name: 'Web Development', icon: FileText },
    { name: 'UI/UX Design', icon: PlayCircle },
    { name: 'Pitching your idea', icon: FileText },
  ];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3">
      {topics.map(({ name, icon: Icon }, i) => (
        <motion.div
          key={name}
          {...rise(i)}
          className="flex items-center gap-4 rounded-card border border-slate bg-surface px-5 py-4 shadow-card"
          style={{ marginLeft: `${i * 6}%` }}
        >
          <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <span className="text-ink-2">{name}</span>
          <span className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-slate">
            <motion.span
              className="block h-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${30 + i * 18}%` }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
            />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function CompeteVisual() {
  // Real events only.
  return (
    <div className="relative flex h-full w-full flex-col justify-center pl-8">
      <motion.span
        aria-hidden="true"
        className="absolute top-[18%] bottom-[18%] left-3 w-px origin-top bg-brand"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.7 }}
      />
      <div className="space-y-8">
        {ACTIVITIES.map((a, i) => (
          <motion.div key={a.title} {...rise(i + 1)} className="relative">
            <span className="absolute top-1.5 -left-[1.6rem] h-3 w-3 rounded-full border-2 border-brand bg-void" />
            <p className="label-condensed text-xs text-brand">{a.date}</p>
            <p className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{a.title}</p>
            {a.podium && <p className="mt-1 text-sm text-ink-3">Champion: {a.podium[0].name}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const CAPABILITIES: Capability[] = [
  { title: 'Discover', icon: Compass, line: 'Find opportunities worth pursuing.', body: 'Hackathons, ideathons, competitions, internships, scholarships, and workshops — surfaced by people who went for them.', Visual: DiscoverVisual },
  { title: 'Build', icon: Hammer, line: 'Turn ideas into real projects.', body: 'Work on projects, turn ideas into prototypes, show your work, and get honest feedback.', Visual: BuildVisual },
  { title: 'Collaborate', icon: Users, line: 'Find people who can build with you.', body: 'Teammates, contributors, testers, and mentors — students whose skills complement yours.', Visual: CollaborateVisual },
  { title: 'Learn', icon: BookOpen, line: 'Learn from students and builders.', body: 'AI, programming, emerging tech, and product development, shared through resources and experience.', Visual: LearnVisual },
  { title: 'Compete', icon: Trophy, line: 'Take your skills beyond the classroom.', body: 'Prepare together for competitions and events — then go for it.', Visual: CompeteVisual },
];

function Scene({ progress }: { progress: MotionValue<number> }) {
  const step = Math.max(0, useStep(progress, CAPABILITIES.length, 0.04, 0.96));
  const fill = useTransform(progress, [0.04, 0.96], [0, 1]);
  const { title, line, body, Visual } = CAPABILITIES[step];

  return (
    <div className="mx-auto grid h-full w-full max-w-page grid-rows-[auto_1fr] items-center gap-6 px-6 pt-20 pb-8 lg:grid-cols-2 lg:grid-rows-1 lg:gap-16 lg:py-0">
      <div>
        <p className="label-condensed text-xs text-brand">03 · What Nex enables</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="font-display text-sm font-bold text-ink-3 tabular-nums">
            {String(step + 1).padStart(2, '0')} / {String(CAPABILITIES.length).padStart(2, '0')}
          </span>
          <span className="relative h-px flex-1 bg-line">
            <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-brand" />
          </span>
        </div>
        <div className="relative mt-6 min-h-[11rem] sm:min-h-[14rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30, clipPath: 'inset(0% 0% 100% 0%)' }}
              animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="label-condensed text-[clamp(1.75rem,3.5vw,3.25rem)] leading-none font-extrabold tracking-[0.04em] text-ink">
                {title}
              </h3>
              <p className="mt-4 text-xl text-ink sm:text-2xl">{line}</p>
              <p className="mt-3 max-w-md text-ink-3">{body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative h-full max-h-[28rem] min-h-0 w-full lg:h-[28rem]" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            className="absolute inset-0"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
          >
            <Visual />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 04 — One capability at a time: the headline changes, the visual assembles. */
export function Enables() {
  return (
    <StickyTrack
      id="enables"
      screens={5}
      ariaLabel="What Nex enables"
      fallback={
        <div className="mx-auto max-w-page px-6 py-24">
          <p className="label-condensed text-xs text-brand">03 · What Nex enables</p>
          <ol className="mt-10 space-y-12">
            {CAPABILITIES.map(({ title, line, body }, i) => (
              <li key={title}>
                <p className="font-display text-sm font-bold text-ink-3">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="label-condensed mt-2 text-4xl text-ink">{title}</h3>
                <p className="mt-3 text-xl text-ink">{line}</p>
                <p className="mt-2 max-w-md text-ink-3">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
