import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { OPPORTUNITIES, isPast, type Opportunity } from '@/data/opportunities';
import { ACTIVITIES } from '@/data/activities';

// Kinds of opportunity, scattered across an empty screen and found one at a
// time — the intro. The real listings (data/opportunities.ts) follow it.
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
  // Gone entirely once the real listing arrives, so nothing sits behind it.
  const opacity = useTransform(progress, [t, t + 0.05, 0.7, 0.78], [0, 1, 1, 0]);
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


/**
 * One real opportunity: the poster, then the facts — the date first and big,
 * since it decides whether you can still go.
 */
function OpportunityCard({ o }: { o: Opportunity }) {
  const past = isPast(o);
  const eventIndex = o.eventTitle ? ACTIVITIES.findIndex((a) => a.title === o.eventTitle) : -1;
  const d = new Date(`${o.dateTime}T00:00:00`);
  const weekday = d.toLocaleString('en', { weekday: 'short' });
  const month = d.toLocaleString('en', { month: 'short' });
  return (
    <article className="flex gap-4 rounded-panel border border-line bg-surface/80 p-3 text-left shadow-lift backdrop-blur-md sm:gap-6 sm:p-4">
      {o.poster && (
        <a
          href={o.poster.src}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="view"
          aria-label={`${o.poster.alt} — open full size`}
          className="group block w-24 shrink-0 self-start overflow-hidden rounded-card border border-line sm:w-[min(15rem,30svh)]"
        >
          <img
            src={o.poster.src}
            alt={o.poster.alt}
            decoding="async"
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
          />
        </a>
      )}
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{o.category}</Badge>
          {past ? <Badge tone="neutral">Completed</Badge> : <Badge>Upcoming</Badge>}
        </div>
        <h3 className="mt-3 text-lg leading-snug font-bold text-ink sm:text-2xl">{o.title}</h3>
        <p className="mt-1 text-xs text-ink-3 sm:text-sm">{o.organizer}</p>

        <div className="mt-4 flex items-center gap-4">
          <time
            dateTime={o.dateTime}
            className={`flex shrink-0 flex-col items-center rounded-control border px-3 py-1.5 leading-none ${
              past ? 'border-slate text-ink-3' : 'border-brand/50 bg-brand/10 text-brand'
            }`}
          >
            <span className="text-[0.6rem] font-semibold tracking-widest uppercase">{month}</span>
            <span className="mt-1 font-display text-2xl font-extrabold text-ink">{d.getDate()}</span>
          </time>
          <ul className="space-y-1 text-xs text-ink-2 sm:text-sm">
            {o.time && (
              <li className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                {weekday}, {o.time}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              {o.location}
            </li>
            {o.access && (
              <li className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                {o.access}
              </li>
            )}
          </ul>
        </div>

        <p className="mt-4 hidden text-sm leading-relaxed text-ink-3 sm:block">{o.description}</p>

        <a
          href={past && eventIndex >= 0 ? `#event-${eventIndex}` : '#register'}
          className="group mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand sm:mt-auto sm:pt-4"
        >
          {past && eventIndex >= 0 ? 'See how it went' : 'Join Nex to take part'}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </article>
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

      {/* The answer to "What's next?": the real opportunities, latest first. */}
      <motion.div
        style={{ opacity: endOpacity, y: endY, pointerEvents: endPointer }}
        className="absolute inset-0 mx-auto flex w-full max-w-page flex-col justify-center gap-6 px-6 pt-16 lg:flex-row lg:items-center lg:gap-14"
      >
        <div className="lg:w-[38%]">
          <p className="label-condensed text-xs text-brand">04 · Opportunities</p>
          <h2 className="mt-4 text-[clamp(1.9rem,4.2vw,3.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
            Opportunities, found together.
          </h2>
          <p className="mt-4 max-w-md text-ink-2">
            Hackathons, competitions, internships, scholarships, and the people to prepare with. The full
            board is coming — here's the latest.
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-1">
          {OPPORTUNITIES.slice(0, 1).map((o) => (
            <OpportunityCard key={o.title} o={o} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/** 07 — "What's next?": opportunity types are discovered, then the real ones. */
export function ComingSoon() {
  return (
    <StickyTrack
      id="opportunities"
      screens={3.5}
      ariaLabel="Opportunities"
      fallback={
        <div className="mx-auto max-w-page px-6 py-24">
          <p className="label-condensed text-xs text-brand">04 · Opportunities</p>
          <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">What's next? Opportunities, found together.</h2>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            {FINDS.map((f) => f.label).join(', ')} — and the people to prepare with. The full board is coming.
          </p>
          <div className="mt-10 flex max-w-3xl flex-col gap-4">
            {OPPORTUNITIES.map((o) => (
              <OpportunityCard key={o.title} o={o} />
            ))}
          </div>
          <a href="#register" className={`${buttonClasses('secondary', 'lg')} mt-9`}>Join Nex</a>
        </div>
      }
    >
      {(progress) => <Scene progress={progress} />}
    </StickyTrack>
  );
}
