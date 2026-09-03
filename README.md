# Neve Moves

A web app for running a K-pop dance cover project end to end — from picking a
song to posting the finished video. Built for Neve Moves, a nonprofit dance
cover group in the SF Bay Area.

**Live:** https://neve-moves.vercel.app
**Hosting:** Vercel (app) + Supabase (Postgres database + file storage) — both
free tiers, no card. See [Deployment](#deployment).

Every "AI" feature is a clearly-marked mock that returns a believable result, so
every screen works with no API key. Ships pre-loaded with one example project
and 6 example members, all labelled **SAMPLE DATA**.

---

## Quick start (local development)

```bash
npm install
cp .env.example .env      # then paste your Supabase connection strings — see below
npm run db:seed           # loads the sample data
npm run dev               # http://localhost:3000
```

The app connects to the **Supabase Postgres** database (the same one the live
site uses, unless you point it at your own). Get the two connection strings from
your Supabase project → **Connect** → *ORMs / Prisma*:

- `DATABASE_URL` — the **Transaction pooler** URL (port 6543), plus `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` — the **Session pooler** URL (port 5432)

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) enable the
photo-upload bucket; without them, uploads fall back to `/public/uploads` on
local disk.

### Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Run locally with live reload |
| `npm run db:seed` | **Wipe and reload the sample data** (clears every table first — careful, this hits whatever database `.env` points at) |
| `npm run db:studio` | Prisma Studio — a spreadsheet-like view of the raw data |
| `npm run sync:youtube` | Refresh the saved copy of the channel's videos for the About gallery |
| `npm run build` | Production build (`prisma migrate deploy` + `next build`) |

> After changing `prisma/schema.prisma`: run `npx prisma migrate dev --name <what-changed>`,
> commit the new folder under `prisma/migrations/`, and restart `npm run dev`.
> On the next deploy, Vercel runs `prisma migrate deploy` automatically.

---

## How a project moves through the app

The app models the real workflow. Open a project and the tabs follow it in order:

1. **Overview** — the song (name, group, theme/vibe, links), a live lifecycle
   checklist, and project settings.
2. **Poster** — generate a recruitment poster (a real templated SVG in the brand
   palette + font) aimed at recruiting 4–8 dancers, with a vague date window.
   "Regenerate" cycles through 4 layouts.
3. **Roster** — add members from the directory; mark who is actually dancing
   this cover (vs. on the roster but sitting it out).
4. **Schedule** — 3 practices + 1 film day by default (add/remove/rename).
   Log each member's blocked date ranges on their member page, then use the
   **conflict calendar** here — candidate dates shaded per-dancer red/green, with
   the best date(s) highlighted — *before* you make the Crabfit poll. Paste the
   Crabfit link and record the chosen dates.
5. **Locations** — pick practice cities from an editable Bay Area list; get
   AI-suggested film spots based on the theme, or add your own.
6. **Outfits** — get an AI outfit description to shop from, shown next to a real
   reference photo. Choose one. (For the example project the reference is the
   official aespa "Whiplash" MV thumbnail; for your own projects you paste a
   reference image URL — a live web image search would need a paid API.)
7. **Videographer** — track status (not contacted / contacted / confirmed) and a
   follow-up reminder date. Contact happens off-app over Instagram/WeChat.
8. **Voting** — after filming, log the video takes and have the team vote; then
   do the same for the cover photo. An option only needs a label (e.g. "Take 1");
   the link is optional. Voters pick their own name (no logins yet).
9. **Copy** — generate an Instagram Reel caption and a YouTube description,
   crediting dancers (by their Instagram handle), the videographer, and the song.

The **Dashboard** shows active projects (with the generated poster as each
card's thumbnail) and a **List / Calendar** toggle for everything coming up —
practices, film days and reminders across all projects. Click a calendar day for
its details.

The **About Neve Moves** page has the group blurb, the channel link, and a
gallery of the group's **real YouTube covers** (see "The About page gallery").

---

## The "AI" features (and how to make them real)

Every AI helper lives in [`src/lib/ai/`](src/lib/ai/) and is a **real, callable
function** the app uses today. For Phase 1 each one has a clearly-marked mock:

```ts
// --- MOCK START ---
// TODO: replace with real Claude API call — see README ("Wiring in real AI").
...
// --- MOCK END ---
```

| Function | File | Phase 1 behaviour |
|---|---|---|
| `generatePosterSvg` | `ai/poster.ts` | **Real** — renders a themed SVG from a template (brand palette + embedded Marcellus font, theme-reactive background, 4 layouts). Only the tagline is mocked. No AI *artwork* / photo background (not possible for free). |
| `generateMemberBio` | `ai/bios.ts` | Mock — templated bio. Saved on the member and reused across projects. |
| `suggestFilmSpots` | `ai/filmSpots.ts` | Mock — scores a curated Bay Area spot list (`src/lib/constants.ts`) against the theme keywords. |
| `suggestOutfit` | `ai/outfit.ts` | Mock — templated shoppable description. |
| `generateInstagramCaption` / `generateYoutubeDescription` | `ai/socialCopy.ts` | Mock — templated captions using the real roster / videographer / song data. |

### Wiring in real AI

When you have an Anthropic API key you're ready to pay for:

1. `npm install @anthropic-ai/sdk`
2. Add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. In each file under `src/lib/ai/`, replace the code between `// --- MOCK START ---`
   and `// --- MOCK END ---` with a real call, e.g.:
   ```ts
   import Anthropic from "@anthropic-ai/sdk";
   const anthropic = new Anthropic();

   const msg = await anthropic.messages.create({
     model: "claude-sonnet-4-5",
     max_tokens: 400,
     messages: [{ role: "user", content: prompt }],
   });
   return msg.content[0].type === "text" ? msg.content[0].text : "";
   ```
   The function **inputs and return types don't change**, so the rest of the app
   keeps working.
4. Set `AI_IS_MOCKED = false` in `src/lib/ai/types.ts` (this only controls the
   "sample AI output" badges in the UI).

These functions run on the server (Next.js server actions), so the API key is
never exposed to the browser.

---

## How the data works

- **Database:** Supabase Postgres. Connection via a pooled URL at runtime
  (`DATABASE_URL`) and a direct URL for migrations (`DIRECT_URL`).
- **Schema:** [`prisma/schema.prisma`](prisma/schema.prisma) — readable, heavily
  commented. "One of a fixed set" fields are plain strings validated against
  `src/lib/constants.ts`; they can be promoted to Prisma enums if you want.
- **File storage:** member photos go to a public Supabase Storage bucket
  (`uploads`). Poster images aren't files — they're SVG stored in a DB column.
- **Sample data:** [`prisma/seed.ts`](prisma/seed.ts). Everything it creates has
  `isSample: true` and a `[SAMPLE]` tag in its name so it's never mistaken for a
  real roster. Delete sample rows any time; `npm run db:seed` clears every table
  and reloads them.

### Project structure

```
src/
  app/
    page.tsx                     Dashboard
    about/                       About Neve Moves + gallery
    members/                     Directory, member detail, blocked dates, bio
    projects/
      new/                       Create a project
      [id]/                      One project:
        layout.tsx               header + phase control + tab nav
        page.tsx                 Overview + lifecycle checklist + settings
        poster/  roster/  schedule/  locations/
        outfits/  videographer/  votes/  copy/
        <each folder has> page.tsx + actions.ts
  lib/
    db.ts                        Prisma client (one shared instance)
    brand.ts                     Palette / font / link constants from the channel
    constants.ts                 The "fixed set" values: phases, cities,
                                 statuses, default event template, film spots
    dates.ts                     Date parsing/formatting + conflict logic
    reminders.ts                 Dashboard "Upcoming" list + calendar items
    youtube.ts                   Fetch + parse the channel RSS for the gallery
    format.ts                    Small display helpers
    ai/                          All AI helpers (see above)
  components/                    Shared UI (MonthCalendar, ProjectCard, Section, …)
    storage.ts                   Supabase Storage client (member photos)
  data/youtube-covers.json       Saved copy of the gallery (npm run sync:youtube)
scripts/sync-youtube.ts          Refreshes the saved gallery copy
public/brand/                    Channel avatar + banner (downloaded once)
public/uploads/                  Member photo uploads — local-dev fallback (git-ignored)
```

Data changes go through **server actions** (`actions.ts` files) — plain
functions with `"use server"` at the top. No hand-written API routes.

New in this pass: `components/MonthCalendar.tsx` (the shared month grid used on
the dashboard and the schedule), `components/ProjectCard.tsx`, `lib/brand.ts`
(palette / fonts / links pulled from the real channel), `lib/youtube.ts`, and
`scripts/sync-youtube.ts`.

---

## Design & brand

The look is pulled from the group's own YouTube channel, not invented:

- **Images:** `public/brand/` holds the channel avatar and a cropped banner,
  downloaded once (not fetched live). The banner is the hero image on the
  Dashboard and About pages, behind a legibility gradient.
- **Palette:** icy frost blue-greys, white, silver, periwinkle → slate — defined
  as CSS variables at the top of `src/app/globals.css`. Change them there.
- **Fonts:** Marcellus (display / headings, the channel wordmark) + Inter (body),
  both from Google Fonts via `next/font`. The poster embeds a subset of Marcellus
  (`src/lib/ai/posterFont.ts`) so the downloaded SVG is self-contained.

## The About page gallery

The gallery shows the channel's **real videos**, pulled for free with no API key
from the public RSS feed
(`youtube.com/feeds/videos.xml?channel_id=…`). Layered fallback:

1. live RSS fetch (cached 1 hour)
2. `src/data/youtube-covers.json` — a saved copy
3. an empty state linking to the channel

Some networks (and cloud hosts) block that feed. If the gallery is empty, run
**`npm run sync:youtube`** from a normal connection — it fetches the videos
(RSS, then a page-scrape fallback) and writes the JSON copy, which *is* checked
into git. Re-run it whenever you want the gallery refreshed.

The YouTube Data API v3 would give more detail (view counts, descriptions) but
needs a Google Cloud signup + key, so it's deliberately not used.

---

## Deployment

The app is live at **https://neve-moves.vercel.app**, hosted for $0:

| Piece | Service | Notes |
|---|---|---|
| App | **Vercel** (Hobby) | Project `neve-moves`. Env vars `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` set for Production/Preview/Development. |
| Database | **Supabase** Postgres (Free) | Project `neve-moves`, region `us-west-1`. Free projects pause after ~7 days idle — one click in the Supabase dashboard wakes it. |
| File storage | **Supabase Storage** | Public bucket `uploads`, 5 MB / image types only. |

### Redeploying

```bash
git push                 # if the Vercel Git integration is connected (see below)
# — or, any time —
npx vercel --prod        # deploy the current working directory
```

The Vercel build runs `prisma migrate deploy` then `next build`, so committed
migrations apply automatically.

### Connect Git for auto-deploy (optional, one browser step)

Right now deploys are manual (`npx vercel --prod`). To deploy automatically on
every `git push`:

1. Install the **Vercel GitHub App**: https://github.com/apps/vercel → *Install* → select `amyyang027/neve-moves`.
2. `npx vercel git connect`

### What's still not done

| Area | Status | To finish |
|---|---|---|
| **Login / identity** | Voters pick their name; anyone with the link can edit | Add [Supabase Auth](https://supabase.com/docs/guides/auth). Add `Member.userId`, gate the server actions, replace `voterMemberId` with the signed-in user. |
| **Reminder delivery** | Shown on the dashboard / calendar only | A [Vercel Cron](https://vercel.com/docs/cron-jobs) route that checks `reminderDate`s daily and emails via a free tier (e.g. Resend). |
| **Real AI** | Mocks in `src/lib/ai/` | Add `ANTHROPIC_API_KEY`, swap the mock bodies — see "Wiring in real AI" above. |
| **Outfit references** | Paste an image URL per outfit | Optional paid image-search API to auto-find MV/stage photos. |
| **Vote thumbnails / take links** | Pasted URLs | Could reuse the Storage bucket. |
| **Scheduling** | Assistive — conflict calendar + paste Crabfit link | Stays this way on purpose. Crabfit has no public API. |

---

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · Supabase (Postgres
+ Storage) · Tailwind CSS 4 · hosted on Vercel. **No third-party runtime
dependencies** beyond the database client — the calendar, XML parsing, image
handling and uploads are all hand-rolled.
