/**
 * Same-page navigation for a page that is ~35 screens of pinned, scroll-driven
 * chapters.
 *
 * The browser's own smooth anchor scrolling is unreliable at that length: it
 * routinely stops short, landing a chapter or two early (the "Join Nex lands
 * on Events" bug). So every in-page jump goes through here instead: long
 * jumps are instant, short ones smooth, and the landing is re-measured and
 * corrected once the scroll settles.
 */

// Section ids from earlier versions of the page, so old shared links still
// land in the right place.
const ALIASES: Record<string, string> = {
  world: 'community',
  about: 'talent',
  activities: 'events',
  'coming-soon': 'opportunities',
};

export function findSection(id: string): HTMLElement | null {
  const clean = id.replace(/^#/, '');
  return document.getElementById(ALIASES[clean] ?? clean);
}

function targetTop(el: HTMLElement) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin);
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scrolls to an element by id (or "top"); returns false if there is none. */
export function scrollToSection(id: string): boolean {
  if (id === 'top' || id === '#top' || id === '' || id === '#') {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }
  const el = findSection(id);
  if (!el) return false;

  const top = targetTop(el);
  const far = Math.abs(top - window.scrollY) > window.innerHeight * 2;
  window.scrollTo({ top, behavior: far || prefersReducedMotion() ? 'instant' : 'smooth' });
  keepOnTarget(el, far ? 0 : 900);
  return true;
}

let stopKeeping: (() => void) | null = null;

/**
 * For a moment after a jump, keeps re-checking the landing and corrects it:
 * a smooth scroll can be cut short, and late layout above the target (web
 * fonts swapping in and re-wrapping text) pushes it down after the jump.
 * Stops the instant the visitor scrolls on their own.
 */
function keepOnTarget(el: HTMLElement, startAfter: number) {
  stopKeeping?.();
  const timers: number[] = [];
  const stop = () => {
    timers.forEach((t) => window.clearTimeout(t));
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) => window.removeEventListener(type, stop));
    if (stopKeeping === stop) stopKeeping = null;
  };
  stopKeeping = stop;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) =>
    window.addEventListener(type, stop, { passive: true, once: true }),
  );
  const check = () => {
    const corrected = targetTop(el);
    if (Math.abs(corrected - window.scrollY) > 2) window.scrollTo({ top: corrected, behavior: 'instant' });
  };
  for (const delay of [startAfter + 16, startAfter + 150, startAfter + 400, startAfter + 800, startAfter + 1300]) {
    timers.push(window.setTimeout(check, delay));
  }
  timers.push(window.setTimeout(stop, startAfter + 1400));
}

/**
 * Takes over clicks on same-page links (href="#…") and keeps the hash out of
 * the address bar, so reopening the site always starts at the top instead of
 * wherever the last click pointed. Call once; returns a cleanup function.
 */
export function installSectionLinks(): () => void {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!.slice(1);
    if (!scrollToSection(id)) return;
    e.preventDefault();
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  };
  document.addEventListener('click', onClick);

  const clearHash = () => history.replaceState(history.state, '', window.location.pathname + window.location.search);

  // Arriving on the page: an intentional deep link (e.g. the approval email's
  // #find-invite) is honoured once the fonts have settled the layout;
  // anything else starts at the top.
  const hash = window.location.hash.slice(1);
  if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  else {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const go = () => {
      if (!scrollToSection(hash)) window.scrollTo({ top: 0, behavior: 'instant' });
      clearHash();
    };
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(go));
  }

  // A hash typed or changed while the page is open goes the same way.
  const onHashChange = () => {
    const next = window.location.hash.slice(1);
    if (next && scrollToSection(next)) clearHash();
  };
  window.addEventListener('hashchange', onHashChange);

  // Coming back via the back/forward cache restores the old position; reset it.
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) window.scrollTo({ top: 0, behavior: 'instant' });
  };
  window.addEventListener('pageshow', onPageShow);

  return () => {
    document.removeEventListener('click', onClick);
    window.removeEventListener('hashchange', onHashChange);
    window.removeEventListener('pageshow', onPageShow);
  };
}
