import { motion } from 'framer-motion';
import { CHAPTERS } from '@/components/story/chapters';
import { useActiveChapter } from '@/components/story/useActiveChapter';

/**
 * "Where am I in the story?" — a quiet vertical index on wide screens. Each
 * chapter is a link, so it doubles as navigation; the current one shows its
 * name.
 */
export function ChapterIndicator() {
  const active = useActiveChapter();
  return (
    <nav
      aria-label="Story chapters"
      className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 xl:block"
    >
      <ol className="flex flex-col items-end gap-3">
        {CHAPTERS.map((chapter, i) => {
          const current = i === active;
          return (
            <li key={chapter.number}>
              <a
                href={`#${chapter.ids[0]}`}
                aria-current={current ? 'step' : undefined}
                className="group flex items-center gap-3 py-0.5"
              >
                <span
                  className={`label-condensed text-[0.6rem] transition-all duration-300 ${
                    current ? 'translate-x-0 text-ink opacity-100' : 'translate-x-1 text-ink-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`}
                >
                  {chapter.number} / {chapter.label}
                </span>
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${current ? 'bg-brand' : 'bg-ink-4 group-hover:bg-ink-3'}`} />
                  {current && (
                    <motion.span
                      layoutId="chapter-ring"
                      className="absolute -inset-1 rounded-full border border-brand/60"
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
