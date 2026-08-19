import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

interface SignInProps {
  onSend: (email: string) => Promise<{ error: string | null }>;
}

export function SignIn({ onSend }: SignInProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error: err } = await onSend(email);
    setSending(false);
    if (err) setError(err);
    else setSent(true);
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Logo size={30} />
        <h1 className="mt-8 text-3xl font-semibold text-ink">Review queue</h1>
        <p className="mt-2 text-sm text-ink-3">
          For the Nex team. Sign in with your email and we'll send you a link — no password.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-brand/25 bg-brand/8 p-5">
            <Mail className="h-5 w-5 text-brand" aria-hidden="true" />
            <p className="mt-3 text-sm text-ink-2">
              Check <span className="font-medium text-ink">{email}</span> for a sign-in link. It
              opens this page already signed in.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
            <TextField
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" disabled={sending || !email}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Send sign-in link'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
