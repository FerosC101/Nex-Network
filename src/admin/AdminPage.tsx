import { useCallback, useEffect, useState } from 'react';
import { Loader2, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAdminAuth } from '@/admin/useAdminAuth';
import { countsByStatus, fetchMembers, markInviteSent, reviewMember } from '@/admin/adminService';
import { SignIn } from '@/admin/components/SignIn';
import { MemberCard } from '@/admin/components/MemberCard';
import type { MembersRow, MemberStatus } from '@/types/database';

type Tab = MemberStatus | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Declined' },
  { key: 'all', label: 'All' },
];

export default function AdminPage() {
  const { session, isAdmin, loading, sendMagicLink, signOut } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<MembersRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, awaitingInvite: 0 });
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListLoading(true);
    const [{ members: rows, error: err }, c] = await Promise.all([
      fetchMembers({ status: tab, search }),
      countsByStatus(),
    ]);
    setMembers(rows);
    setCounts(c);
    setError(err);
    setListLoading(false);
  }, [tab, search]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function handleReview(id: string, status: 'approved' | 'rejected', notes?: string) {
    setBusyId(id);
    const { error: err } = await reviewMember(id, status, {
      reviewedBy: session?.user.email ?? '',
      notes,
    });
    if (err) setError(err);
    await load();
    setBusyId(null);
  }

  async function handleMarkInvited(id: string) {
    setBusyId(id);
    const { error: err } = await markInviteSent(id);
    if (err) setError(err);
    await load();
    setBusyId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-3" aria-label="Loading" />
      </div>
    );
  }

  if (!session) return <SignIn onSend={sendMagicLink} />;

  // Signed in, but the address isn't on the allow-list in supabase/admin.sql.
  if (isAdmin === false) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-ink-3" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-ink">Not on the team list</h1>
          <p className="mt-2 text-sm text-ink-3">
            You're signed in as {session.user.email}, but that address isn't authorised to review
            registrations. Ask an admin to add it.
          </p>
          <button
            onClick={signOut}
            className="mt-6 text-sm text-brand underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-void px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={28} withWordmark={false} />
            <div>
              <h1 className="text-xl font-semibold text-ink">Review queue</h1>
              <p className="text-xs text-ink-4">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-2 transition-colors hover:border-brand/50 hover:text-brand"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-3 transition-colors hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Pending', value: counts.pending, accent: true },
            { label: 'Approved', value: counts.approved },
            { label: 'Declined', value: counts.rejected },
            { label: 'Awaiting invite', value: counts.awaitingInvite, accent: counts.awaitingInvite > 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-surface/60 p-4">
              <p className="label-condensed text-[0.65rem] text-ink-4">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.accent ? 'text-brand' : 'text-ink'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  tab === t.key
                    ? 'border-brand bg-brand text-[#10171a] font-medium'
                    : 'border-line text-ink-2 hover:border-brand/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, school, city…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand"
          />
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {listLoading && members.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-3">Loading…</p>
          ) : members.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-3">
              {tab === 'pending' ? 'Nothing waiting. All caught up.' : 'No one here yet.'}
            </p>
          ) : (
            members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onReview={handleReview}
                onMarkInvited={handleMarkInvited}
                busy={busyId === m.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
