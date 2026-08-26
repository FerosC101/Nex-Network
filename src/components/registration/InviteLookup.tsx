import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Clock, Copy, Loader2, MailQuestion, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { env } from '@/config/env';
import { lookupInvite, type InviteLookup as LookupResult } from '@/services/inviteLookupService';

/**
 * Recovery path for people who registered but never got their invite email.
 *
 * Email is lossy — invites land in spam, get deleted, or are dropped outright
 * by the receiving provider. Before this, the only way back in was messaging
 * the team by hand.
 */
export function InviteLookup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isLoading) return;
    setIsLoading(true);
    setResult(null);
    setResult(await lookupInvite(email.trim()));
    setIsLoading(false);
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some embedded browsers; the link is visible
      // and selectable anyway, so this needs no error state of its own.
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-xl">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex items-center gap-2 text-sm text-ink-3 transition-colors hover:text-brand"
        >
          <MailQuestion className="h-4 w-4" aria-hidden="true" />
          Already registered but never got your invite?
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-2xl border border-line bg-base/60 p-6"
        >
          <h3 className="text-lg font-semibold text-ink">Find your invite</h3>
          <p className="mt-1.5 text-sm text-ink-3">
            Enter the email you registered with and we'll pull up your group chat link.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <TextField
                label="Email address"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={100}
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !email.trim()}
              className="sm:mt-7"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Checking…
                </>
              ) : (
                <>
                  Find it
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-5"
                role="status"
                aria-live="polite"
              >
                {result.status === 'approved' && (
                  <div className="rounded-xl border border-brand/30 bg-brand/10 p-5">
                    <p className="text-sm font-medium text-brand">
                      {result.name ? `You're in, ${result.name}. ⚡` : "You're in. ⚡"}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-2">
                      Here's your group chat link — see you in there.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <a
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-void transition-opacity hover:opacity-90"
                      >
                        Open the group chat
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.link)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-ink-2 transition-colors hover:border-brand hover:text-brand"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            Copy link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {result.status === 'pending' && (
                  <div className="flex gap-3 rounded-xl border border-line bg-surface p-5">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-ink">You're registered — still under review.</p>
                      <p className="mt-1 text-sm text-ink-3">
                        Someone on the team is checking your details. Your invite arrives by email
                        once you're verified, usually within {env.reviewWindow}.
                      </p>
                    </div>
                  </div>
                )}

                {result.status === 'not_found' && (
                  <div className="flex gap-3 rounded-xl border border-line bg-surface p-5">
                    <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-ink">No registration under that email.</p>
                      <p className="mt-1 text-sm text-ink-3">
                        Double-check the spelling, or fill in the form above to join — it only takes a minute.
                      </p>
                    </div>
                  </div>
                )}

                {result.status === 'error' && (
                  <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                    {result.message}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
