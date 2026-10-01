import { AnimatePresence, motion, useTransform, type MotionValue } from 'framer-motion';
import { MapPin, Trophy } from 'lucide-react';
import { StickyTrack } from '@/components/story/StickyTrack';
import { useProgressValue } from '@/components/story/useStep';
import { ACTIVITIES, type Activity } from '@/data/activities';

const START = 0.06;
const END = 0.94;

const monthDay = (a: Activity) => {
  const d = new Date(`${a.dateTime}T00:00:00`);
  return { month: d.toLocaleString('en', { month: 'short' }), day: d.getDate() };
};

function EventDetails({ activity }: { activity: Activity }) {
  return (
    <>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-3">
        <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
        {activity.place}
      </p>
      <p className="mt-3 max-w-md text-ink-2">{activity.description}</p>
      {activity.podium && (
        <div className="mt-4">
          <p className="label-condensed inline-flex items-center gap-1.5 text-[0.65rem] text-ink-3">
            <Trophy className="h-3 w-3 text-brand" aria-hidden="true" /> Winners
          </p>
          <ol className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {activity.podium.map(({ place, name }, i) => (
              <li key={name}>
                <span className={`label-condensed mr-1.5 text-[0.62rem] ${i === 0 ? 'text-brand' : 'text-ink-4'}`}>{place}</span>
                <span className={i === 0 ? 'font-medium text-ink' : 'text-ink-2'}>{name}</span>
              </li>
            ))}
          </ol>
          {activity.podiumNote && <p className="mt-1.5 text-xs text-ink-4">{activity.podiumNote}</p>}
        </div>
      )}
    </>
  );
}

function Scene({ progress }: { progress: MotionValue<number> }) {
  const n = ACTIVITIES.length;
  // Which event, and which of its photos, the scroll is on.
  const position = useProgressValue(progress, (v) => {
    const t = Math.min(0.9999, Math.max(0, (v - START) / (END - START))) * n;
    const event = Math.floor(t);
    const photos = ACTIVITIES[event].photos.length;
    return `${event}:${Math.floor((t - event) * photos)}`;
  });
  const [eventIndex, photoIndex] = position.split(':').map(Number);
  const active = ACTIVITIES[eventIndex];
  const photo = active.photos[photoIndex] ?? active.photos[0];
  const rail = useTransform(progress, [START, END], [0, 1]);

  return (
    <div className="mx-auto grid h-full w-full max-w-page grid-rows-[minmax(0,0.9fr)_auto] gap-6 px-6 pt-20 pb-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:items-center lg:gap-14 lg:py-0">
      <div className="order-2 lg:order-1">
        <p className="label-condensed text-xs text-brand">05 · Events</p>
        <h2 className="mt-3 text-2xl sm:text-4xl">What Nex has been up to.</h2>

        <ol className="relative mt-8 space-y-6 pl-8">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[0.45rem] w-px bg-line" />
          <motion.span
            aria-hidden="true"
            style={{ scaleY: rail }}
            className="absolute top-2 bottom-2 left-[0.45rem] w-px origin-top bg-brand"
          />
          {ACTIVITIES.map((a, i) => {
            const on = i === eventIndex;
            const { month, day } = monthDay(a);
            return (
              <li key={a.title} className={`relative transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-35'}`}>
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 -left-8 h-3.5 w-3.5 rounded-full border-2 transition-all duration-500 ${
                    on ? 'border-brand bg-brand shadow-[0_0_14px_var(--color-brand)]' : 'border-ink-4 bg-void'
                  }`}
                />
                <time dateTime={a.dateTime} className="flex items-baseline gap-2">
                  <span className="label-condensed text-xs text-brand">{month}</span>
                  <span className={`font-display font-extrabold transition-all duration-500 ${on ? 'text-4xl text-ink' : 'text-2xl text-ink-3'}`}>
                    {day}
                  </span>
                </time>
                <h3 className={`mt-1 font-semibold transition-all duration-500 ${on ? 'text-xl text-ink sm:text-2xl' : 'text-base text-ink-3'}`}>
                  {a.title}
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <EventDetails activity={a} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The active event's photos, revealed through a mask as the scroll moves. */}
      <div className="relative order-1 h-full min-h-0 overflow-hidden rounded-panel border border-line lg:order-2 lg:h-[72svh]">
        <AnimatePresence initial={false}>
          <motion.a
            key={photo.src}
            href={photo.src}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="view"
            aria-label={`${photo.alt} — open full size`}
            initial={{ clipPath: 'inset(0% 0% 0% 100%)', scale: 1.08 }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.3 } }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              decoding="async"
              style={photo.position ? { objectPosition: photo.position } : undefined}
              className="h-full w-full object-cover"
            />
          </motion.a>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-void/85 to-transparent px-5 pt-12 pb-4 text-xs text-ink-2">
          <span>{active.title}</span>
          <span className="tabular-nums">
            {photoIndex + 1} / {active.photos.length}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 08 — A timeline the scroll walks through; the active event lights up. */
export function Activities() {
  return (
    <StickyTrack
      id="events"
      screens={ACTIVITIES.length * 1.6 + 0.6}
      ariaLabel="Events"
      fallback={
        <div className="mx-auto max-w-page px-6 py-24">
          <p className="label-condensed text-xs text-brand">05 · Events</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">What Nex has been up to.</h2>
          <ol className="mt-10 space-y-14">
            {ACTIVITIES.map((a) => (
              <li key={a.title} className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="label-condensed text-xs text-brand">{a.date}</p>
                  <h3 className="mt-1 text-2xl font-semibold">{a.title}</h3>
                  <EventDetails activity={a} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {a.photos.map((p) => (
                    <img key={p.src} src={p.src} alt={p.alt} loading="lazy" className="aspect-square rounded-control object-cover" />
                  ))}
                </div>
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
