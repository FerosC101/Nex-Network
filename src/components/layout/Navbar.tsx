import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { CHAPTERS } from '@/components/story/chapters';
import { useActiveChapter } from '@/components/story/useActiveChapter';

interface NavItem {
  id: string;
  label: string;
  /** Index into CHAPTERS — the link lights up while that chapter is on screen. */
  chapter: number;
  /** Marks a section that is a teaser for something not built yet. */
  soon?: boolean;
}

// The story's chapters, as places to jump to. Opportunities is an honest
// "coming soon" chapter, so it says so.
const NAV_ITEMS: NavItem[] = [
  { id: 'community', label: 'Community', chapter: 1 },
  { id: 'enables', label: 'Build', chapter: 2 },
  { id: 'opportunities', label: 'Opportunities', chapter: 3, soon: true },
  { id: 'events', label: 'Events', chapter: 4 },
  { id: 'people', label: 'People', chapter: 5 },
];

/**
 * Sticky, compact, and transparent over the hero; it picks up a blurred
 * surface and a hairline border once the page scrolls, so it never fights the
 * hero visual but stays readable over everything below it.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const chapter = useActiveChapter();
  // Overall progress through the story, shown as a hairline under the bar.
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape, and whenever the viewport grows past it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 ${
        solid ? 'border-b border-line bg-void/75 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-6 px-6">
        <a href="#top" aria-label="Nex Network — back to top" className="shrink-0 rounded-control">
          {/* Mark only on phones, where the bar also carries the chapter label. */}
          <Logo size={28} className="sm:hidden" withWordmark={false} />
          <Logo size={28} className="hidden sm:flex" />
        </a>
        {/* Phones have no room for the links, so the bar says where you are. */}
        <AnimatePresence mode="wait">
          <motion.span
            key={chapter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="label-condensed mr-auto -ml-3 text-[0.6rem] text-ink-3 md:hidden"
          >
            {CHAPTERS[chapter].number} / {CHAPTERS[chapter].label}
          </motion.span>
        </AnimatePresence>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={chapter === item.chapter ? 'true' : undefined}
                className={`group relative inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-sm transition-colors duration-200 ${
                  chapter === item.chapter ? 'text-ink' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {/* Hover underline, drawn from the left. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-ink/40 transition-transform duration-300 ease-out-soft group-hover:scale-x-100"
                />
                {/* The active marker glides between sections. */}
                {chapter === item.chapter && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-px bg-brand shadow-[0_0_10px_var(--color-brand)]"
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                {item.label}
                {item.soon && <Badge>Soon</Badge>}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a href="#find-invite" className="hidden rounded-control px-3 py-2 text-sm text-ink-3 transition-colors hover:text-ink lg:inline-flex">
            Find my invite
          </a>
          <a href="#register" className={`${buttonClasses('primary')} !px-4 !py-2.5 whitespace-nowrap`}>
            Join Nex
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-slate text-ink-2 transition-colors hover:text-ink md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: scrollYProgress }}
        className="absolute inset-x-0 -bottom-px h-px origin-left bg-brand/80"
      />

      <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-line px-6 pb-6 md:hidden"
        >
          <ul className="flex flex-col py-2">
            {[...NAV_ITEMS, { id: 'find-invite', label: 'Find my invite', chapter: -1 } as NavItem].map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.03 * i }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-line-soft py-3.5 text-base text-ink-2 transition-colors hover:text-ink"
                >
                  {item.label}
                  {item.soon && <span className="text-xs font-semibold tracking-wide text-brand uppercase">Soon</span>}
                </a>
              </motion.li>
            ))}
          </ul>
          <a href="#register" onClick={() => setOpen(false)} className={`${buttonClasses('primary', 'lg')} mt-4 w-full`}>
            Join Nex
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
