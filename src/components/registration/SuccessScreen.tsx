import { motion } from 'framer-motion';
import { MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { env } from '@/config/env';

interface SuccessScreenProps {
  /** The address the applicant registered with, echoed back so they know where to look. */
  email: string;
}

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'We check your details',
    body: 'A real person on the Nex team confirms you\'re a student in Batangas. It keeps the community what it says it is.',
  },
  {
    icon: MailCheck,
    title: 'We email you the group chat',
    body: `Once you're verified, your invite lands in your inbox — usually within ${env.reviewWindow}.`,
  },
  {
    icon: Sparkles,
    title: 'You start building',
    body: 'Meet other student builders, find teammates, and jump into what\'s already happening.',
  },
];

export function SuccessScreen({ email }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="py-2"
      role="status"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div
            aria-hidden="true"
            className="animate-breathe absolute inset-0 m-auto h-16 w-16 rounded-full bg-brand/40 blur-2xl"
          />
          <img
            src="/nex-mark-3d.png"
            alt=""
            width={900}
            height={900}
            className="relative w-24"
          />
        </div>

        <h3 className="mt-4 text-3xl font-semibold text-ink">You're on the list. ⚡</h3>
        <p className="mt-3 max-w-sm text-ink-2">
          Welcome to Nex. We got your registration — here's what happens next.
        </p>

        <p className="mt-5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-2">
          We'll reach out at{' '}
          <span className="font-medium break-all text-brand">{email}</span>
        </p>
      </div>

      <ol className="mt-8 space-y-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 + i * 0.1 }}
            className="flex gap-3.5 rounded-2xl border border-line bg-surface/60 p-4"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/12">
              <Icon className="h-4.5 w-4.5 text-brand" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{body}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-4">
        Keep an eye on your spam folder — our invite comes from{' '}
        <span className="text-ink-3">{env.senderEmail}</span>. Questions? Reach us at{' '}
        <a
          href={`mailto:${env.contactEmail}`}
          className="text-brand underline-offset-4 transition-colors hover:underline"
        >
          {env.contactEmail}
        </a>
        .
      </p>
    </motion.div>
  );
}
