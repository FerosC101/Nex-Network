import { useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, UserPlus } from 'lucide-react';
import type { MembersRow } from '@/types/database';

interface ToAddPanelProps {
  /** Approved members who sent a Facebook profile and aren't in the chat yet. */
  members: MembersRow[];
  busyId: string | null;
  onMarkAdded: (id: string) => Promise<void>;
}

/**
 * The group chat to-do list: one compact row per collected profile, oldest
 * submission first, so the team can open each, add them in Messenger, and tick
 * them off without scrolling through full review cards.
 */
export function ToAddPanel({ members, busyId, onMarkAdded }: ToAddPanelProps) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    await navigator.clipboard.writeText(members.map((m) => m.facebook_url).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="mt-8 rounded-2xl border border-brand/30 bg-brand/[0.05] p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">
            To add to the group chat
            <span className="ml-2 text-sm font-normal text-ink-3">{members.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Open each profile, check the name and photo match the registration, add them in
            Messenger, then mark them added.
          </p>
        </div>
        {members.length > 0 && (
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-brand/50 hover:text-brand"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy all links'}
          </button>
        )}
      </header>

      {members.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">No profiles waiting. Everyone who sent one is in.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-void/60">
          {members.map((m) => {
            const busy = busyId === m.id;
            const name = [m.first_name, m.last_name].filter(Boolean).join(' ');
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-medium text-ink">
                    {name}
                    {m.preferred_name && m.preferred_name !== m.first_name && (
                      <span className="ml-1.5 font-normal text-ink-3">“{m.preferred_name}”</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-4">
                    {m.school}
                    {m.facebook_submitted_at && ` · sent ${new Date(m.facebook_submitted_at).toLocaleString()}`}
                  </p>
                </div>
                <a
                  href={m.facebook_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm text-brand underline-offset-4 hover:underline sm:max-w-64"
                >
                  <span className="truncate">{m.facebook_url?.replace(/^https:\/\/(www\.)?/, '')}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMarkAdded(m.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-[#10171a] transition-colors hover:bg-brand-soft disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                  Mark added
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
