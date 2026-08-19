# Nex Network — Registration

> The talent is already here. We're here to connect it.

Registration site for **Nex Network**, a student builder community connecting students across Batangas to opportunities, people, knowledge, and experiences.

## How the flow works

1. A student fills out the multi-step registration form.
2. The registration lands in the database as **`status = 'pending'`**.
3. The Nex team reviews it and confirms the applicant really is a student in Batangas.
4. On approval, the team **emails them the community group chat invite**.

The group chat link is deliberately **never in this codebase**. Anything in a `VITE_*` variable is compiled into the public JS bundle and readable by every visitor — which would defeat the review step entirely. Keep the invite link in your mail tooling.

## Stack

React + TypeScript + Vite + Tailwind CSS v4, `react-hook-form` + `zod` for validation, `framer-motion` for motion, Supabase (Postgres) for storage.

## Getting started

```bash
npm install
cp .env.example .env   # fill in contact emails and Supabase credentials
npm run dev
```

The app runs and is fully browsable before Supabase is configured — the form shows a friendly "temporarily unavailable" message on submit until `.env` is filled in. See [`supabase/README.md`](./supabase/README.md) for database setup and the review-queue queries.

## Brand assets

| File | What it is | Used for |
| --- | --- | --- |
| `public/nex-logo.glb` | **Live 3D S mark** (84 KB) | Hero centerpiece |
| `public/nex-wordmark.glb` | **Live 3D "nex" wordmark** (256 KB) | Footer |
| `public/nex-rebrand.mp4` | Rebrand film, 720p (3.4 MB) | Hero background |
| `public/nex-rebrand-poster.jpg` | Film poster frame (81 KB) | Hero background fallback |
| `public/nex-mark.png` | Flat Nex S mark, transparent | Nav, favicon, touch icon |
| `public/nex-mark-3d.png` | 3D S mark, transparent still | Hero fallback, success screen |
| `public/nex-wordmark-3d.png` | 3D wordmark, transparent still | Footer fallback |
| `public/nex-og.jpg` | Opaque social preview | `og:image` |
| `brand/nex_logo_only.blend` | Blender source for both GLBs | Re-exporting the models |
| `brand/Nex.blend` | Full rebrand project | Re-rendering the stills |
| `brand/NEX VIDEO REBRAND.mp4` | Film master, 1080p (70 MB) | Re-encoding the web video |

The film master and both `.blend` files are kept out of `public/` deliberately — see the note under the stills.

### The live 3D mark

The hero renders `nex-logo.glb` and the footer renders `nex-wordmark.glb`, both with react-three-fiber — real geometry, lit in the browser, with a slow idle sway that follows the pointer. `Model3D` wraps both. Four things keep them from being a liability:

- **Code-split.** three.js sits in its own lazy chunk (~256 KB gz) that never blocks first paint; the main bundle is unchanged at ~198 KB gz.
- **Only the visible one is mounted.** `Model3D` mounts a scene on scroll-in and unmounts on scroll-out. The hero and footer are never co-visible, so exactly one WebGL context is ever live, and no offscreen render loop burns battery.
- **Degrades.** It probes for WebGL and wraps the scene in both a Suspense boundary and an error boundary. While the chunk loads, on devices without WebGL, if the scene throws, or if the context is lost, the matching pre-rendered still renders instead — neither spot is ever empty.
- **Respects `prefers-reduced-motion`**, holding a fixed pose instead of animating.

Lighting is a small emissive scene baked with `PMREMGenerator`, not drei's `<Environment>`. That matters: `<Environment>` spins up its own `WebGLRenderer`, which cost ~3 WebGL contexts per scene and was enough to trigger `webglcontextlost` once two scenes existed. PMREM reuses the canvas's renderer — no extra context, no HDRI download, no external host.

> A related trap worth remembering: a naive `hasWebGL()` probe that calls `getContext('webgl2')` on a throwaway canvas **holds that context**. One per component was enough to push the page over the limit on its own. The probe now runs once per page and releases itself via `WEBGL_lose_context`.

**Re-exporting the models:** `brand/nex_logo_only.blend` is the source for both (`brand/export_logo_glb.py` handles the S mark; `Curve.009` is the S and `Curve.008` + `Curve.007` are the "nex" letterforms — the other `Curve.*` objects are stacked duplicates used for the animation's motion trail and are redundant in a static export). The export needs `use_active_scene=True` (without it the exporter pulls in all seven scenes and the file balloons past 11 MB), a planar decimate pass, and the material alpha forced to 1.0 — the source materials carry `alpha 0.76`, which renders the mark semi-transparent in a browser. Materials are retuned on export to brand cyan `#5cd6d7` with metalness pulled back from Blender's 1.0, because the small procedural environment can't light a fully metallic surface the way Blender's studio rig does.

> The file originally supplied as `nex_logo_only.glb` was not a GLB — it was a zstd-compressed `.blend` of the whole rebrand project (77 MB) that had been given a `.glb` extension. It's preserved as `brand/nex_logo_only.blend`; `public/nex-logo.glb` is a real GLB exported from it.

### The rebrand film (hero background)

`public/nex-rebrand.mp4` is the 1080p master re-encoded to 720p H.264 at CRF 27 — 70 MB down to 3.4 MB, with `+faststart` so it can begin playing before it finishes downloading. A VP9/WebM alternate was tried and came out *larger* than the H.264, so it was dropped.

`VideoBackdrop` plays it as the hero's background. It is permanently muted with no controls, which is the whole reason it can be a background: a backdrop that makes noise or that the viewer can't stop is a nuisance.

**It does not load for everyone.** This sits above the fold, so the 3.4 MB file is skipped entirely — no `<video>` element is even rendered — when the viewer has asked for reduced motion, has Data Saver on, or is on a 2G-class connection. Those visitors get the poster alone, which reads as an intentional textured backdrop rather than something broken. When it does load, it is deferred a beat past first paint so it never competes with the hero's own render.

Two things about this that are easy to get wrong:

- **The poster is a deliberately abstract frame ~2s in, and the video starts at `#t=2` to match.** The film's closing logo frame is the obvious choice and the wrong one: as a backdrop it sits directly behind the 3D mark and reads as a duplicated, blurry logo.
- **The legibility stack is shaped, not flat.** A blur plus a slight upscale knocks the footage back so it reads as texture, then three passes darken it: heaviest on the left where the headline and CTA sit, lighter across the right where it plays behind the 3D mark, fading to solid at top and bottom. Measured across the loop, the backdrop under the copy stays at 18–26 luma, roughly 11:1 contrast for the body text. The left-weighted pass is `lg:`-only, since the copy is centred on mobile.

> The hero carries `isolate` for this to work at all. Without its own stacking context, the backdrop's negative `z-index` layers paint behind the app wrapper's opaque background and vanish completely — the video plays, perfectly invisible.

### The pre-rendered stills

`nex-mark-3d.png` and `nex-wordmark-3d.png` are Cycles renders of the shipped `.glb` models with `film_transparent`, so they carry a real alpha channel and drop onto any background as-is.

They were previously frames lifted from the rebrand video, which came off a near-black studio backdrop and needed a `mix-blend-mode: screen` hack plus a mask to hide it. That hack had a failure mode: the mask is sized to the *element*, so as soon as `object-contain` letterboxed the artwork inside a differently-shaped box, the fade landed outside the image and the backdrop showed as a hard rectangle — which is exactly what happened when the footer wordmark moved into a square container. Rendering real alpha removes the hack and the whole class of bug.

`brand/render_still.py` regenerates them. It renders from the `.glb`, not the `.blend`, on purpose: the source objects are animated, so at the default frame the mark is still scaled to zero and at the end frame it is mirrored and scattered. The GLBs already hold the correct rest pose, orientation and materials. Lighting is emissive planes with `visible_camera = False`, so they light and reflect without appearing in frame.

`nex-og.jpg` is the same mark composited onto brand dark for `og:image` — social platforms composite alpha unpredictably, often onto white.

The `.blend` files and the video master live outside `public/` on purpose — Vite copies `public/` verbatim into `dist/`, so keeping them there would ship ~225 MB to every deploy.

### Typography

The brand sheet specifies **Capitana** for text and **Dimensions 3000** for display. Both are commercial fonts with no web-licensed source in this repo, so the closest free analogs stand in: **Hanken Grotesk** for text (near-identical geometric-humanist proportions, and it ships the Thin/Regular/Semibold weights the sheet calls out) and **Big Shoulders Display** for the condensed uppercase labels. If Nex licenses webfont versions of the real faces, swap the `<link>` in `index.html` and the `--font-*` tokens in `src/index.css` — nothing else needs to change.

## Project structure

```
src/
  components/
    registration/   multi-step form: one component per step + orchestrator
    ui/             reusable form primitives (TextField, CheckboxPillGroup, ...)
    layout/         Section wrapper + decorative background pieces
    three/          the lazy-loaded 3D logo scene (react-three-fiber)
    Model3D.tsx     mounts the live 3D model only while it is on screen,
                    with the pre-rendered still as the fallback
    layout/VideoBackdrop.tsx  the rebrand film as the hero background
  config/env.ts     all runtime config — nothing environment-specific is
                    hardcoded elsewhere
  hooks/useRegistrationForm.ts   step state, per-step validation, submit flow
  schemas/          zod validation, one schema per step + a combined schema
  services/registrationService.ts   the only place that talks to the database
  types/registration.ts   the domain model (interests, goals, year levels, ...)
  types/database.ts       typed mirror of supabase/schema.sql
supabase/
  schema.sql        members table, indexes, row-level security
  README.md         setup + review-queue and matching queries
brand/
  nex_logo_only.blend   source for both .glb models
  export_logo_glb.py    the Blender export script, with its gotchas encoded
  render_still.py       regenerates the transparent fallback stills
  Nex.blend             full rebrand project, source for the stills
  NEX VIDEO REBRAND.mp4 film master, re-encoded into public/
```

## Design notes for extending this later

- **Swapping the backend**: every database call goes through `submitRegistration()` in `src/services/registrationService.ts`. Point it at a different backend and nothing else in the app changes.
- **Admin / matching features**: `members` uses array columns (`interests`, `goals`, `collaboration_needs`) with GIN indexes specifically so "find students interested in X" / "find students looking for testers" queries are fast from day one. See query examples in `supabase/README.md`.
- **Approval automation**: `status`, `reviewed_at`, `reviewed_by`, `review_notes`, and `invite_sent_at` already exist on `members`. A future admin UI or a Supabase Edge Function that emails invites on approval can build on those columns without a migration. `invite_sent_at` exists specifically so an automated sender can avoid double-sending.
- **Future features** (profiles, project listings, collaboration board, events, mentorship matching, notifications, …): each should be a new table with a `member_id` foreign key back to `members.id`, added as its own migration — not a rewrite of the registration flow.
