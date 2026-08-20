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
  NEX_INVITE_LINK="<the Messenger invite link — see team/approval-email.md>" \
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
