# Auto-send the invite on approval

When an admin approves a registration at `/admin`, a database trigger posts the
row to the `send-invite` Edge Function, which emails the Messenger link and
stamps `invite_sent_at`.

The invite link lives as a **function secret**, not in this repo and not in the
browser bundle — the same reason the review step exists at all.

If the send fails, `invite_sent_at` stays null, the row keeps showing under
**Awaiting invite** in `/admin`, and you can send it by hand and press
*Mark invite sent*.

## Setup

**1. Resend account** — https://resend.com (free tier: 3,000 emails/month).
Create an API key. For the `from` address you need either:
- a domain you own, verified in Resend (best — `nex@yourdomain.ph`), or
- Resend's `onboarding@resend.dev` for testing, which **only delivers to your
  own account email**, so it is not usable for real students.

**2. Install and link the Supabase CLI**

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref kbtjvnytsmutwkrmycnw
```

**3. Set the function secrets**

```bash
supabase secrets set \
  RESEND_API_KEY="re_xxxxxxxx" \
  NEX_INVITE_LINK="<the Messenger invite link — see team/approval-email.md>" \
  SENDER_EMAIL="nex@yourdomain.ph" \
  CONTACT_EMAIL="vincevillar02@gmail.com" \
  WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

Note the generated `WEBHOOK_SECRET` — step 5 needs the same value. Read it back
later with `supabase secrets list` (values are hidden; if you lose it, just set
a new one and update the trigger).

**4. Deploy**

```bash
supabase functions deploy send-invite --no-verify-jwt
```

`--no-verify-jwt` is required: the caller is the database, not a signed-in user.
The function is protected by `WEBHOOK_SECRET` instead — it rejects any request
without the matching header, so it is not an open endpoint.

**5. Create the trigger**

Open `auto-invite.sql`, replace `<PROJECT_REF>` and `<WEBHOOK_SECRET>` with the
real values, and run it in the SQL editor. Do not commit it with the secret in
place.

## Testing

Approve someone at `/admin` and watch the logs:

```bash
supabase functions logs send-invite
```

Expected: `{"sent":true,...}` and `invite_sent_at` filled in. To re-test with
the same person, clear the stamp and set them back:

```sql
update members set status = 'pending', invite_sent_at = null, reviewed_at = null
where email = 'them@example.com';
```

## Turning it off

```sql
drop trigger if exists members_invite_on_approval on public.members;
```

Approvals keep working; invites go back to being sent by hand.
