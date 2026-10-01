import { useEffect, useState } from 'react';
import { CHAPTERS } from '@/components/story/chapters';

/** Index into CHAPTERS of whatever is crossing the middle of the viewport. */
export function useActiveChapter() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const owner = new Map<string, number>();
    CHAPTERS.forEach((c, i) => c.ids.forEach((id) => owner.set(id, i)));
    const sections = [...owner.keys()]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(owner.get(entry.target.id) ?? 0);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return active;
}
