# Neve Moves — Phase 1 fixes, prompt for Claude Code

I looked at the running app (roster and dashboard pages) before writing this, so the design notes below are grounded in what's actually there, not generic advice. Paste the block into the same Claude Code session/folder.

## What I saw

Right now everything sits on plain white, in thin-gray-bordered boxy sections, with one purple accent doing all the work (button, active tab, badges) and no imagery anywhere — that combination is exactly what reads as "unstyled AI scaffold" rather than a real product. The fix isn't more decoration, it's borrowing your actual brand: you already have a YouTube channel with a profile picture and banner — that's real visual material sitting unused.

## The prompt

```
Here's a round of fixes for the Neve Moves prototype, based on using it. Read
through all of it, tell me your plan and ask what you need clarified, same as
before — then implement. Flag anything that would require a paid API key or
paid service rather than adding it silently; default to the free alternative
I describe unless I say otherwise. Nothing here should require any signup or
spend to run.

1) OVERALL DESIGN PASS
Right now the app is plain white with thin gray borders, one purple accent
doing every job (button, active tab underline, badges), and no imagery
anywhere — it reads as an unstyled scaffold rather than a real product for
the group. Fix this by grounding the design in our actual brand instead of
inventing one:
   - Our YouTube channel is https://www.youtube.com/@nevemove
     (channel ID UC2hjb73iySbjKOTXnIEZcAw). Download the channel's profile
     picture and banner image ONCE and save them as static files in
     /public/brand — don't fetch them live on every page load, that's
     fragile and unnecessary for images that rarely change.
   - Use the banner image as real hero/header imagery (behind the site
     header, or on the About page, or both) — with a dark gradient overlay
     so text stays legible on top of it, not as a full-bleed distraction.
   - Pull an actual color palette from those images (2-3 real colors plus a
     neutral base) instead of the single default purple, and use it
     consistently across buttons, badges, and active states.
   - Pair a body font with a display font that has some character for
     headings (Google Fonts, free) instead of the default system sans —
     pick something that fits a dance/performance group, not corporate SaaS.
   - Give cards real visual weight: thumbnails/images where we have them
     (see #3 below), not just text in a bordered box.
   This is a real design pass, not just color swaps — take the space to make
   it feel like it belongs to us.

2) DASHBOARD — CALENDAR VIEW
Add an actual calendar view (month grid) for upcoming events, alongside the
existing list — a toggle or tab between "List" and "Calendar" is fine.
Clicking a date shows what's happening that day (practice, film day,
videographer reminder, etc.). Use a lightweight free approach — either
hand-rolled or a small MIT-licensed library — no paid calendar service.

3) PROJECT CARDS — SHOW A PICTURE
Project cards (dashboard "Active projects", and the projects list) should
show a picture, not just text — use the project's (mock) generated poster
as its thumbnail once one exists, with a neutral placeholder for projects
that don't have one yet.

4) MEMBERS — PHOTO UPLOAD
Let me actually upload a photo per member, not just have a photo field.
Store uploaded files locally on disk (e.g. /public/uploads) referenced by
path in the database — no cloud storage service, that's unnecessary cost
and setup for a local prototype.

5) ABOUT PAGE — REAL PAST COVERS FROM YOUTUBE
Replace the fake seed "past covers" gallery with our real uploaded videos,
pulled for free with no API key: use the channel's public RSS feed,
   https://www.youtube.com/feeds/videos.xml?channel_id=UC2hjb73iySbjKOTXnIEZcAw
which returns real recent video titles, links, and thumbnails as XML — no
Google Cloud signup, no key, no cost. Parse that server-side and list the
videos as gallery cards. (The YouTube Data API v3 would give more detail,
but needs a Google Cloud API key/signup — skip that for now, the RSS feed
is enough for a gallery.)

6) NEW PROJECT FLOW
  6a. POSTER — make the generated (mock) poster template actually good-
      looking (use the real brand palette/fonts from #1, a background
      treated to the song's theme rather than a plain box), and add a
      "Regenerate" button that cycles through a few visual variations —
      still no real image-generation API, just a better and repeatable
      mock template.

  6b. DATE/SCHEDULING — I asked about pulling results directly from
      Crabfit automatically; on reflection, don't build that — Crabfit has
      no public API, and scraping their page is fragile and not worth
      relying on for something the team depends on. Instead, get me the
      same outcome a different way: take the conflict grid you already
      built (candidate dates × member blocked dates) and turn IT into the
      calendar-with-blocked/good-time view I wanted — shade each candidate
      date red/green per member and highlight the best overlapping window.
      That's the same value, built entirely from data we already collect,
      with nothing to fetch and nothing to break.

  6c. OUTFIT — for the seed/example project (aespa "Whiplash"), do your own
      one-time research now (you have web search/fetch available) to find
      one real, appropriately linked reference image of the actual stage
      outfit, and show it next to the AI wording suggestion. For NEW
      projects I create later, don't wire up live reference-image search —
      that needs a paid image-search API. Instead add a manual "paste a
      reference image URL" field next to the AI wording suggestion, so I
      can drop in a real photo myself when I create a project. Note this
      tradeoff in the plan so I see it before you build it.

  6d. VOTING — options shouldn't require a link to add; a plain label
      (e.g. "Take 1", "Take 2") should be enough. Keep a link field, but
      make it optional/placeholder, not required.

Ask your clarifying questions now.
```

## Two honest tradeoffs worth reading before you paste this in

**Crabfit (6b).** You asked whether the app could pull the actual poll results from Crabfit automatically. It can't do that reliably for free — Crabfit doesn't offer an API, so the only way in is scraping their page, which is fragile (breaks if they change their site) and not something worth depending on for real scheduling. The prompt above redirects that ask toward something that gets you the same visual payoff — a calendar with blocked/good time shaded in — built entirely from the member blocked-date data the app already has, so nothing external is involved at all.

**Outfit reference images (6c).** Claude Code can genuinely go find a real photo of aespa's Whiplash stage outfit right now, because it has its own web access while it's building — that's a one-time, $0 research step for your seed example. But that's different from the *app itself* being able to search the web for a photo every time you start a new project in the future — that would need a paid image-search API wired into the running app. The prompt keeps the free path (a manual "paste a link" field) for future projects and saves the real automated search for later, if you ever decide it's worth paying for.
