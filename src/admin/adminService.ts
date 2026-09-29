import { getSupabaseClient } from '@/lib/supabaseClient';
import type { MembersRow, MemberStatus } from '@/types/database';

/**
 * Reads and reviews registrations.
 *
 * Every call here is still subject to the RLS policies in
 * `supabase/admin.sql` — if the signed-in address isn't on the allow-list the
 * queries simply return nothing and updates affect no rows. The UI gate is a
 * convenience; the database is the actual boundary.
 */

/** 'to_add': sent a Facebook profile, not yet added to the group chat. */
export type QueueView = MemberStatus | 'all' | 'to_add';

export interface QueueFilters {
  status?: QueueView;
  search?: string;
}

export async function fetchMembers({ status = 'pending', search = '' }: QueueFilters = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { members: [] as MembersRow[], error: 'Database not configured.' };

  let query = supabase.from('members').select('*');
  if (status === 'to_add') {
    // Oldest submission first: whoever has waited longest gets added next.
    query = query
      .eq('status', 'approved')
      .not('facebook_url', 'is', null)
      .is('added_to_chat_at', null)
      .order('facebook_submitted_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: true });
    if (status !== 'all') query = query.eq('status', status);
  }

  const term = search.trim();
  if (term) {
    // Match across the fields you actually scan when verifying someone.
    const escaped = term.replace(/[%,()]/g, '');
    query = query.or(
      `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,` +
        `email.ilike.%${escaped}%,school.ilike.%${escaped}%,city.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) return { members: [] as MembersRow[], error: error.message };
  return { members: (data ?? []) as MembersRow[], error: null };
}

export async function countsByStatus() {
  const supabase = getSupabaseClient();
  if (!supabase) return { pending: 0, approved: 0, rejected: 0, awaitingInvite: 0, toAdd: 0 };

  const [pending, approved, rejected, awaitingInvite, toAdd] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('invite_sent_at', null),
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .not('facebook_url', 'is', null)
      .is('added_to_chat_at', null),
  ]);

  return {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    awaitingInvite: awaitingInvite.count ?? 0,
    toAdd: toAdd.count ?? 0,
  };
}

export async function reviewMember(
  id: string,
  status: Extract<MemberStatus, 'approved' | 'rejected'>,
  options: { reviewedBy: string; notes?: string } = { reviewedBy: '' },
) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database not configured.' };

  const { error } = await supabase
    .from('members')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: options.reviewedBy || null,
      review_notes: options.notes || null,
    })
    .eq('id', id);

  return { error: error?.message ?? null };
}

/** Stamped once the invite email has actually gone out, so nobody double-sends. */
export async function markInviteSent(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database not configured.' };

  const { error } = await supabase
    .from('members')
    .update({ invite_sent_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error?.message ?? null };
}

/** Stamped once someone on the team has actually added them to the group chat. */
export async function markAddedToChat(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database not configured.' };

  const { error } = await supabase
    .from('members')
    .update({ added_to_chat_at: new Date().toISOString() })
    .eq('id', id);

  return { error: error?.message ?? null };
}
