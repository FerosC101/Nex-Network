import { motion } from 'framer-motion';
import { EASE_OUT_SOFT } from '@/components/motion/easing';

interface AnimatedTextProps {
  text: string;
  className?: string;
  /** Words from this index on get the accent colour. */
  accentFrom?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  delay?: number;
}

/**
 * A heading that rises in word by word. Screen readers get the sentence once,
 * from aria-label; the animated words themselves are hidden from them.
 */
export function AnimatedText({ text, className, accentFrom, as = 'h2', delay = 0 }: AnimatedTextProps) {
  const Component = motion[as];
  const words = text.split(' ');
  return (
    <Component
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ staggerChildren: 0.05, delayChildren: delay }}
    >
      {words.map((word, i) => (
        // Clipped so each word slides up out of its own line, not the page.
        <span key={`${word}-${i}`} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${accentFrom !== undefined && i >= accentFrom ? 'text-brand' : ''}`}
            variants={{
              hidden: { y: '105%' },
              shown: { y: 0, transition: { duration: 0.45, ease: EASE_OUT_SOFT } },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Component>
  );
}
