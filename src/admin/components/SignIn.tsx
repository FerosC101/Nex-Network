import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

interface SignInProps {
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await onSignIn(email, password);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Logo size={30} />
        <h1 className="mt-8 text-3xl font-semibold text-ink">Review queue</h1>
        <p className="mt-2 text-sm text-ink-3">For the Nex team.</p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" disabled={busy || !email || !password}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-ink-4">
          Accounts are created by an admin in Supabase — there's no sign-up here.
        </p>
      </div>
    </div>
  );
}
