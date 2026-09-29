# Auto-send the invite on approval

When an admin approves a registration at `/admin`, a database trigger posts the
row to the `send-invite` Edge Function, which emails the approval and stamps
`invite_sent_at`.

The email carries **no chat link**. Its button opens the site's "Find my
invite" box already looked up for that address (`/?find=<email>#find-invite`),
where the member submits their Facebook profile through `lookup-invite`. The
team then adds them to the group chat by hand from the **To add** tab in
`/admin` and presses *Mark added to chat*. See [Facebook profiles](#facebook-profiles-instead-of-an-invite-link)
below.

If the send fails, `invite_sent_at` stays null, the row keeps showing under
**Awaiting invite** in `/admin`, and you can send it by hand and press
*Mark invite sent*.

## Setup

### 1. The Nex mailbox

Create a shared Google account, e.g. `nexnetwork.community@gmail.com`. Worth doing
regardless of email automation: teammates can share it, it outlives any one
person, and it keeps a personal address off the public site.

Then, on that account:
1. Turn on **2-Step Verification** (App Passwords are unavailable without it)
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password named "Nex invites" and copy the 16 characters

That App Password is what the function uses — never the account password, and
it can be revoked on its own if it leaks.

**Why Gmail rather than Resend or Brevo:** sending to arbitrary students needs
a verified sender. Resend requires a domain you own. Brevo and SendGrid will
verify a single Gmail address, but mail sent as `@gmail.com` from their servers
fails DMARC alignment and often lands in spam. Sending through Gmail itself
means Google really is the sender, so SPF/DKIM/DMARC all align. The free limit
is ~500 messages a day, far beyond Nex's volume.

Move to Resend once Nex owns a domain — set `RESEND_API_KEY` instead of the
SMTP secrets and the function switches automatically.

### 2. Install and link the Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref kbtjvnytsmutwkrmycnw
```

### 3. Set the function secrets

```bash
supabase secrets set \
  SMTP_USER="nexnetwork.community@gmail.com" \
  SMTP_PASSWORD="the 16-char app password" \
  SENDER_EMAIL="nexnetwork.community@gmail.com" \
  CONTACT_EMAIL="nexnetwork.community@gmail.com" \
  WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

**Generate `WEBHOOK_SECRET` separately so you can see it**, rather than inline:

```bash
openssl rand -hex 32          # prints the value — copy it
supabase secrets set WEBHOOK_SECRET="<paste it here>"
```

Using `WEBHOOK_SECRET="$(openssl rand -hex 32)"` sets a value that is never
printed anywhere, and `supabase secrets list` shows only a SHA-256 digest, not
the value — so it cannot be recovered. Step 5 needs the same string.

If you have already lost it, nothing is broken: set a new one and use that in
the trigger. The secret is only a shared string between the database and the
function, so rotating it costs nothing as long as both sides match.

### 4. Deploy

```bash
supabase functions deploy send-invite --no-verify-jwt
```

`--no-verify-jwt` is required: the caller is the database, not a signed-in
user. The function is protected by `WEBHOOK_SECRET` instead — it rejects any
request without the matching header, so it is not an open endpoint.

### 5. Create the trigger

Open `auto-invite.sql`, replace `<PROJECT_REF>` and `<WEBHOOK_SECRET>` with the
real values, and run it in the SQL editor. Do not commit it with the secret in
place.

### 6. Point the site at the new address

Once `nexnetwork.community@gmail.com` exists, update the Vercel environment variables so
the public site shows it instead of a personal address:

```
VITE_CONTACT_EMAIL   nexnetwork.community@gmail.com
VITE_SENDER_EMAIL    nexnetwork.community@gmail.com
```

Then redeploy — Vite bakes these in at build time.

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


---

# CAPTCHA (Cloudflare Turnstile)

Turnstile is wired up but **inert until configured** — with no site key the
widget is skipped and registration posts straight to Supabase, exactly as
before. Nothing breaks while you set this up.

**A widget on the page alone protects nothing.** The REST endpoint is publicly
writable with the publishable key, so a bot can post directly and never load
the site. The protection only becomes real after step 4 below, which moves the
insert behind server-side token verification and closes the direct path.

## Setup

**1. Create a Turnstile site** — https://dash.cloudflare.com → Turnstile → Add
site. Free, no domain purchase needed. Add these hostnames:

```
nex-network.vercel.app
localhost
```

You get a **site key** (public) and a **secret key** (private).

**2. Give the function the secret**

```bash
cd /Users/vince/Codes/Nex/Nex-Register
supabase secrets set TURNSTILE_SECRET_KEY="0x4AAA...your-secret"
supabase functions deploy register --no-verify-jwt
```

**3. Give the site the site key** — in Vercel → Settings → Environment
Variables, add `VITE_TURNSTILE_SITE_KEY`, then **redeploy** (Vite bakes it in
at build time).

**4. Close the direct write path** — only after a real registration works
through the widget. Run `supabase/lock-down-insert.sql` in the SQL editor. Until
this runs, the CAPTCHA is decorative.

## Testing

Cloudflare publishes keys that always pass or always fail, useful for local
work:

| Site key | Behaviour |
| --- | --- |
| `1x00000000000000000000AA` | always passes |
| `2x00000000000000000000AB` | always blocks |

Secret keys: `1x0000000000000000000000000000000AA` (pass),
`2x0000000000000000000000000000000AA` (fail).

## Rolling back

If Turnstile causes trouble, clear `VITE_TURNSTILE_SITE_KEY` in Vercel and
redeploy — the direct path resumes. If you already ran step 4, re-create the
insert policy using the statement at the bottom of `lock-down-insert.sql`.

---

# Facebook profiles instead of an invite link

Messenger invite links stopped working, and a link that did work could be
forwarded to anyone once it left our hands. So nobody is sent a link any more:
approved members submit their Facebook profile and the team adds them.

## Rolling it out

1. Run `supabase/facebook-profile.sql` in the SQL editor (adds `facebook_url`,
   `facebook_submitted_at`, `added_to_chat_at`).
2. Deploy both functions:

   ```bash
   supabase functions deploy lookup-invite --no-verify-jwt
   supabase functions deploy send-invite --no-verify-jwt
   ```

3. Push the site (Vercel) so the form and the **To add** tab exist.
4. Remove the dead links: `supabase secrets unset NEX_INVITE_LINK NEX_CHAT_LINK`.
   `send-invite` and `lookup-invite` no longer read them. `send-bump` and
   `send-community` still do, which is intended: with the secret gone they
   refuse to run instead of mailing out a dead link.

Order matters for steps 1–2. Without the columns every profile submission
fails, and the new email would send people to a form that can't save.

## Working the list

Open `/admin` → **To add**. Each card shows the profile link — open it,
**check the name and photo match the registration**, add them to the group
chat in Messenger, then press *Mark added to chat*.

The name check is the one real safeguard left. The site identifies someone only
by the email they type, so anyone who knows an approved member's address could
submit a profile in their name. A profile can be submitted only once, so an
impostor cannot overwrite a real one, but they can get there first. If a
profile doesn't match, don't add it; clear it so the real member can resubmit:

```sql
update members
set facebook_url = null, facebook_submitted_at = null
where email = 'them@example.com';
```

The same query fixes a member who pasted the wrong profile and emailed in.

## Members approved before the switch

Anyone approved earlier was sent a Messenger link that no longer works. They
can use the "Find my invite" box on the site today. To tell them, point them
at `https://nex-network.vercel.app/#find-invite`; there is no automated
resend yet.

---

# The move to a Messenger Community

`send-community` is the one-off announcement that Nex has outgrown the group
chat and is moving to a Messenger Community, with a thank-you for passing
**250+ members across 19 schools**.

It is not wired to a trigger — it is invoked by hand, once, and stamps
`community_notified_at` on each member as it sends so a re-run never emails
anybody twice.

## Setup

**1. Point every path at the Community.** The link is one secret shared by
`send-invite` (approval), `send-bump` and `lookup-invite` (the "find my
invite" box on the site), so this single change moves all of them:

```bash
supabase secrets set NEX_INVITE_LINK="<the Community link — see team/approval-email.md>"
```

Nothing needs redeploying: functions read secrets at request time.

**2. Add the stamp column** — run `supabase/community-migration.sql` in the
SQL editor. A `testTo` preview works without it, deliberately; the dry run and
the real send do not, because both read `community_notified_at`.

**3. Deploy**

```bash
supabase functions deploy send-community --no-verify-jwt
```

## Sending

Every call needs the `x-webhook-secret` header. Set `$FN` and `$SECRET` first:

```bash
FN=https://kbtjvnytsmutwkrmycnw.supabase.co/functions/v1/send-community
SECRET="<WEBHOOK_SECRET>"
```

**Dry run first** — this is the default, so an accidental call sends nothing.
It reports the recipient list and the rendered text (needs the column):

```bash
curl -s -X POST "$FN" -H "x-webhook-secret: $SECRET" \
  -H 'Content-Type: application/json' -d '{"dryRun":true}'
```

**Send one copy to yourself** and read it on a phone, which is where it will
actually be opened. This path runs before the recipient query, so it works
before the migration above has been applied:

```bash
curl -s -X POST "$FN" -H "x-webhook-secret: $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"testTo":"you@example.com"}'
```

**Then send for real, in batches of 25.** Repeat the *identical* call until
`remaining` comes back `0`:

```bash
curl -s -X POST "$FN" -H "x-webhook-secret: $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":false,"limit":25}'
```

There is no `offset`, deliberately. Each row is stamped the moment its send
succeeds, so the query already excludes everyone reached and each call starts
exactly where the last one stopped. Paging *on top of* that shrinking list
would step past people and strand them for good once `remaining` hit zero.

An address that fails is not stamped, so it stays in the list and is retried
on the next call. A permanently bad address therefore occupies one slot in
every batch — visible in `failures`, and worth deleting or correcting once you
have seen it fail twice.

## Letting the database do the batching

259 members at 25 an hour is a ten-hour job, which is a long time to keep a
terminal open. `supabase/community-batch-cron.sql` schedules the same call from
Postgres with pg_cron instead.

This is the right place for it: the webhook secret is already in this database
(`auto-invite.sql` posts it on every approval), so scheduling here means the
secret is never copied somewhere new — which ruled out a cloud agent, since the
file holding it is gitignored and the repo is public.

Fill in the secret, run it in the SQL editor, then watch it:

```sql
select * from cron.job_run_details
where jobname = 'nex-community-migration'
order by start_time desc limit 10;

select count(*) from members
where status = 'approved' and community_notified_at is null;
```

When that count reaches zero, stop it:

```sql
select cron.unschedule('nex-community-migration');
```

Leaving it running is harmless — the query returns nobody and the batch sends
nothing — but an hourly no-op in the logs is noise you don't need.

## Sending limits

`SMTP_HOST` is Brevo's relay, whose free tier allows **300 messages a day**.
A full migration run is 259, so it fits, but with little room left for that
day's approval emails. If you are also working through a review queue, spread
the migration across two days by unscheduling the cron job partway.

## Updating the numbers

`MEMBER_COUNT` and `SCHOOL_COUNT` are constants at the top of
`send-community/index.ts`. They are deliberately not counted from `members` —
that table holds registrations at every status, so a live count would quietly
disagree with the figure the team has been using publicly.
