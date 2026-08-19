import { motion } from 'framer-motion';
import { BookOpen, Hammer, Users, Trophy, type LucideIcon } from 'lucide-react';
import { Section } from '@/components/layout/Section';
import { ConnectionField } from '@/components/layout/ConnectionField';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    title: 'Learn',
    description: 'AI, Machine Learning, programming, emerging technologies, product development, and more.',
  },
  {
    icon: Hammer,
    title: 'Build',
    description: 'Work on projects, turn ideas into prototypes, and get feedback.',
  },
  {
    icon: Users,
    title: 'Connect',
    description: 'Find teammates, collaborators, testers, mentors, and like-minded students.',
  },
  {
    icon: Trophy,
    title: 'Compete',
    description:
      'Discover hackathons, ideathons, startup competitions, pitching opportunities, and other challenges.',
  },
];

export function WhyNex() {
  return (
    <Section id="why-nex" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto max-w-3xl opacity-30"
      >
        <ConnectionField />
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="label-condensed text-brand text-sm"
        >
          Why Nex
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          className="mt-4 text-4xl font-semibold text-balance sm:text-5xl"
        >
          The talent is already here.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.12 }}
          className="mt-6 space-y-4 text-ink-2"
        >
          <p>
            We've seen talented students with incredible ideas and skills, but many don't know where to
            start, where to find opportunities, or who to build with.
          </p>
          <p>
            Nex connects students with people, opportunities, knowledge, and experiences that can help turn
            ideas into something real.
          </p>
        </motion.div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
            className="group rounded-2xl border border-line bg-surface/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/45 hover:bg-surface"
          >
            <div className="inline-flex rounded-xl border border-line-soft bg-brand/10 p-3 transition-colors duration-300 group-hover:bg-brand/20">
              <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-3">{description}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
