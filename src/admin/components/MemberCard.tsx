import { useState } from 'react';
import { Check, X, Copy, Mail, Loader2 } from 'lucide-react';
import type { MembersRow } from '@/types/database';

interface MemberCardProps {
  member: MembersRow;
  onReview: (id: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  onMarkInvited: (id: string) => Promise<void>;
  busy: boolean;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="label-condensed text-[0.65rem] text-ink-4">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-2">{value}</dd>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  approved: 'border-brand/40 bg-brand/12 text-brand',
  rejected: 'border-red-400/30 bg-red-400/10 text-red-300',
};

export function MemberCard({ member, onReview, onMarkInvited, busy }: MemberCardProps) {
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const name = [member.first_name, member.last_name].filter(Boolean).join(' ');
  const awaitingInvite = member.status === 'approved' && !member.invite_sent_at;

  async function copyEmail() {
    await navigator.clipboard.writeText(member.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="rounded-2xl border border-line bg-surface/70 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">
            {name}
            {member.preferred_name && member.preferred_name !== member.first_name && (
              <span className="ml-2 text-sm font-normal text-ink-3">“{member.preferred_name}”</span>
            )}
          </h3>
          <button
            type="button"
            onClick={copyEmail}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-brand"
            title="Copy email"
          >
            {member.email}
            <Copy className="h-3 w-3" aria-hidden="true" />
            {copied && <span className="text-brand">copied</span>}
          </button>
        </div>
        <span
          className={`label-condensed rounded-full border px-2.5 py-1 text-[0.65rem] ${STATUS_STYLES[member.status] ?? ''}`}
        >
          {member.status}
          {awaitingInvite && ' · needs invite'}
        </span>
      </header>

      {/* Location and school first — that is what verifies a Batangas student. */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Field label="Location" value={[member.city, member.province].filter(Boolean).join(', ')} />
        <Field label="School" value={member.school} />
        <Field label="Course" value={`${member.course_program} · ${member.year_level}`} />
        <Field label="Age" value={String(member.age)} />
        <Field label="Mobile" value={member.mobile_number} />
        <Field label="Registered" value={new Date(member.created_at).toLocaleDateString()} />
      </dl>

      {member.interests.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.interests.map((i) => (
            <span key={i} className="rounded-full border border-line bg-void px-2.5 py-1 text-xs text-ink-3">
              {i}
            </span>
          ))}
        </div>
      )}

      {(member.building_status || member.project_name) && (
        <div className="mt-4 rounded-xl border border-line bg-void/60 p-3">
          <p className="text-xs text-ink-3">
            <span className="text-ink-2">{member.building_status}</span>
            {member.project_name && ` · ${member.project_name}`}
          </p>
          {member.project_description && (
            <p className="mt-1 text-sm text-ink-2">{member.project_description}</p>
          )}
        </div>
      )}

      {member.additional_notes && (
        <p className="mt-3 text-sm text-ink-3 italic">“{member.additional_notes}”</p>
      )}

      {member.review_notes && (
        <p className="mt-3 text-xs text-ink-4">Review note: {member.review_notes}</p>
      )}

      {member.status === 'pending' && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (optional, saved with the decision)"
            className="min-w-0 flex-1 rounded-lg border border-line bg-void px-3 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview(member.id, 'approved', notes)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-[#10171a] transition-colors hover:bg-brand-soft disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview(member.id, 'rejected', notes)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm text-ink-2 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      )}

      {awaitingInvite && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="flex-1 text-xs text-ink-3">
            Approved — the invite email sends automatically. Use this only if you sent it by hand.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onMarkInvited(member.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-50"
          >
            <Mail className="h-3 w-3" />
            Mark invite sent
          </button>
        </div>
      )}

      {member.invite_sent_at && (
        <p className="mt-3 text-xs text-ink-4">
          Invite sent {new Date(member.invite_sent_at).toLocaleString()}
        </p>
      )}
    </article>
  );
}
