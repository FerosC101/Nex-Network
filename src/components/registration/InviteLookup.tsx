import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CircleCheck, Clock, Loader2, MailQuestion, SearchX, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { env } from '@/config/env';
import { scrollToSection } from '@/lib/scrollToSection';
import {
  lookupInvite,
  submitFacebookProfile,
  type InviteLookup as LookupResult,
} from '@/services/inviteLookupService';

/**
 * Where a registered student checks their status and, once approved, sends us
 * their Facebook profile so the team can add them to the group chat.
 *
 * The approval email links straight here as `/?find=<email>#find-invite`, which
 * opens the box and runs the lookup, so an approved member lands directly on
 * the Facebook form. It also stays the recovery path for anyone whose email
 * went to spam.
 */
export function InviteLookup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function runLookup(address: string) {
    setIsLoading(true);
    setResult(null);
    setResult(await lookupInvite(address));
    setIsLoading(false);
  }

  // Arriving from the approval email: open, fill in, look up, scroll here.
  // The address is then removed from the URL so it isn't left in history or
  // passed along if the page is shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromEmail = params.get('find')?.trim();
    if (!fromEmail) return;

    params.delete('find');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);

    setOpen(true);
    setEmail(fromEmail);
    void runLookup(fromEmail);
    requestAnimationFrame(() => scrollToSection('find-invite'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isLoading) return;
    await runLookup(email.trim());
  }

  return (
    <div id="find-invite" ref={containerRef} className="mt-6 scroll-mt-24">
      {!open ? (
        // Deliberately loud. The people who need this are the ones who already
        // registered, got nothing back, and have no reason to scroll a form
        // they have already filled in — a muted text link goes unread by
        // exactly the audience it is for.
        <div className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-5 shadow-[0_0_40px_-12px_rgba(0,229,200,0.25)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <MailQuestion className="h-5 w-5 text-brand" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">Already registered?</p>
              <p className="mt-1 text-sm text-ink-2">
                Check your status with your email. Once you're approved, send us your Facebook
                profile and we'll add you to the group chat.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setOpen(true)}
              className="shrink-0 sm:self-center"
            >
              Find my invite
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-2xl border border-line bg-panel/60 p-6"
        >
          <h3 className="text-lg font-semibold text-ink">Find your invite</h3>
          <p className="mt-1.5 text-sm text-ink-3">
            Enter the email you registered with to check where you are.
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
                  <ApprovedPanel email={email.trim()} result={result} onResult={setResult} />
                )}

                {result.status === 'pending' && (
                  <div className="flex gap-3 rounded-xl border border-line bg-surface p-5">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-ink">You're registered — still under review.</p>
                      <p className="mt-1 text-sm text-ink-3">
                        Someone on the team is checking your details. We'll email you once you're
                        verified, usually within {env.reviewWindow}.
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

type Approved = Extract<LookupResult, { status: 'approved' }>;

/**
 * The approved state: the Facebook form, or where things stand once it's in.
 */
function ApprovedPanel({
  email,
  result,
  onResult,
}: {
  email: string;
  result: Approved;
  onResult: (r: LookupResult) => void;
}) {
  const [facebookUrl, setFacebookUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const greeting = result.name ? `You're in, ${result.name}. ⚡` : "You're in. ⚡";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facebookUrl.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    const next = await submitFacebookProfile(email, facebookUrl.trim());
    setIsSaving(false);
    // Validation errors stay on the form so the paste can be fixed in place.
    if (next.status === 'error') setError(next.message);
    else onResult(next);
  }

  if (result.addedToChat) {
    return (
      <div className="flex gap-3 rounded-xl border border-brand/30 bg-brand/10 p-5">
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-brand">{greeting}</p>
          <p className="mt-1.5 text-sm text-ink-2">
            You've already been added to the group chat. Check your Messenger chats — and your
            message requests, if you don't see it.
          </p>
        </div>
      </div>
    );
  }

  if (result.facebookSubmitted) {
    return (
      <div className="flex gap-3 rounded-xl border border-brand/30 bg-brand/10 p-5">
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-brand">
            {result.justSubmitted ? 'Got it, thanks!' : greeting}
          </p>
          <p className="mt-1.5 text-sm text-ink-2">
            We have your Facebook profile. Someone on the team will add you to the group chat
            soon — keep an eye on Messenger, including message requests.
          </p>
          <p className="mt-2 text-xs text-ink-3">
            Sent the wrong profile? Email{' '}
            <a href={`mailto:${env.contactEmail}`} className="text-brand underline-offset-4 hover:underline">
              {env.contactEmail}
            </a>{' '}
            and we'll fix it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/10 p-5">
      <p className="text-sm font-medium text-brand">{greeting}</p>
      <p className="mt-1.5 text-sm text-ink-2">
        Send us your Facebook profile and we'll add you to the Nex group chat.
      </p>
      <p className="mt-1.5 text-xs text-ink-3">
        Our Messenger invite link is down right now, so for the moment we're adding everyone by hand.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
        <TextField
          label="Facebook profile link"
          type="url"
          inputMode="url"
          autoComplete="url"
          maxLength={300}
          // Profile IDs contain long runs of zeros (100000…), which the
          // default anti-spam limit would silently collapse.
          maxConsecutive={30}
          placeholder="facebook.com/your.name"
          hint="On Facebook, open your profile, tap ⋯ → Copy link, and paste it here."
          error={error ?? undefined}
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={isSaving || !facebookUrl.trim()}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add me to the group chat
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
