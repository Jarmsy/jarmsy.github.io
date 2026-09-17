# John Harms — personal website

A folder of plain-text files that becomes a website. You edit the text; the
site takes care of the rest. Nothing here needs a developer for day-to-day use.

## The two things to know

1. **Everything you write lives in `content/`.** One markdown file per essay,
   take, or thing you made; one short YAML list for books, creators, questions and
   photos. (Films and music are covered live by the Letterboxd and Spotify
   widgets on the Taste page — see below — so there's no manual list for those.)
2. **Everything about the site itself lives in two files.** `site.yaml` for
   *what and where* (name, motto, nav, footer, home-page sections) and
   `src/styles/tokens.css` for *how it looks* (colours, fonts, sizes).

Both are checked every time the site builds. If something's wrong, the message
names the file and the field.

## Running it

| Do this | To |
|---|---|
| Double-click **`dev.cmd`** | Preview at http://localhost:4321 — refreshes as you save. Close the window to stop. |
| Double-click **`check.cmd`** | Check every page for mistakes. Ends with "All good" or the problem. |

Or from a terminal: `npm run dev`, `npm run doctor`, `npm run build` (output in `dist/`).

Editing in VS Code is recommended: open the folder and accept the two suggested
extensions (Astro, YAML) — they flag mistakes as you type.

## I want to…

| … | Edit |
|---|---|
| Change my name, motto, tagline, email, domain | `site.yaml` |
| Swap the front-page portrait | image into `content/photos/`, filename in `site.yaml` → `portrait` |
| Reorder, hide, or add header / footer links | `site.yaml` → `nav`, `footer` |
| Change what the home page shows, and how many | `site.yaml` → `home` |
| Add a profile link (Letterboxd, Spotify…) | `site.yaml` → `links` |
| Change the default theme or hide the light/dark switch | `site.yaml` → `theme` |
| Change the Takes subtitle or spice labels | `site.yaml` → `takes` |
| Open or close the inbox, change its intro, or send notes elsewhere | `site.yaml` → `inbox` |
| Change colours, fonts, text size, line length, spacing | `src/styles/tokens.css` |
| Write an essay or a note | new `.md` file in `content/writing/` |
| Add a take | new `.md` file in `content/takes/` |
| Add something you made | copy `content/made/_example.md`, rename it, fill it in — tell it like a story, not a résumé |
| Add a book, or a creator you admire (channel, podcast, writer) | one entry at the top of `content/taste/books.yaml` or `creators.yaml` |
| Add a question | one entry at the top of `content/questions.yaml` |
| Add a photo | image into `content/photos/`, one entry in `photos.yaml` |
| Update Now / About / Colophon / CV | `content/pages/<name>.md` |
| Add a whole new plain page | new `.md` in `content/pages/` → appears at `/<filename>/` |
| Hide something without deleting it | rename the file to start with `_` |

### Writing (`content/writing/`)

```markdown
---
title: 'The title'
description: 'One line shown in lists and previews.'
date: 2026-07-06
kind: essay          # essay | note          (default: note)
status: evergreen    # evergreen | dated | draft   (default: evergreen)
topics: [media, systems]
---

The piece. Markdown works: *italics*, **bold**, [links](https://…), lists, > quotes.
```

- `draft` still builds (preview it at its address) but is hidden from lists and the RSS feed.
- `dated` adds a small notice that the piece reflects what you thought at the time.
- The filename is the address: `ragebait.md` → `/writing/ragebait/`. Keep it short; never change it once public.
- Need a figure with a caption? Use `.mdx` and see `content/writing/sample-essay.mdx`.

### Takes (`content/takes/`)

```markdown
---
topics: [food, travel]   # invent new ones freely — they become filter chips and topic pages
spice: 2                 # 1 mild · 2 spicy · 3 will die on this hill
date: 2026-07-06         # the "as of" stamp
---

The take. One or two sentences is the sweet spot.
```

Changed your mind? Add `retired: true` and, if you like,
`retiredNote: "Why."` — it moves to the Retired section, struck through, note shown.

### Pages (`content/pages/`)

Every file here is a page. Frontmatter: `title`, `updated` (a date — shown as the
"updated" stamp), optional `description`. `now.md` also takes `summary`, one
line shown on the home page.

### Lists (`content/taste/*.yaml`, `questions.yaml`, `photos/photos.yaml`)

Each file starts with a comment explaining its fields. The top entry shows
first, so add new things at the top. YAML rules of thumb: every entry starts
with `- `, each field is `name: value` on its own line, indented the same; wrap
a value in quotes if it contains a colon.

### Topics

Any `topics:` tag used anywhere gets its own page at `/topics/<tag>/` that
gathers matching writing, takes, work and questions. Nothing to maintain.

### The inbox

`/inbox/` is a plain form: a note, an optional name, an optional way to reach
the sender. The site itself is static (nothing runs on a server), so notes are
delivered by a form service: put its URL in `site.yaml` → `inbox.action` and
the form posts there; each note arrives by email. The site is set up for
[Formspree](https://formspree.io) (free tier: 50 notes a month, anonymous
submissions allowed): create a form there, pick "Redirect after submit" off,
and paste the form's endpoint URL. A hidden honeypot field plus Formspree's
own filtering keep bots out. Nothing secret is in the site — the only thing a
visitor can see is that URL, and the worst it enables is sending you spam,
which the monthly cap bounds. Leave `action` blank (or set `enabled: false`)
to close the inbox; the page then points people to email.

### Spotify ("On repeat" on the Taste page)

A top-tracks widget with a shuffle and a 4-weeks / 6-months toggle. The
tracks are fetched **when the site is built** (`src/lib/spotify.ts`), not by
visitors' browsers and not by a server — GitHub rebuilds the site four times a
day, so the list is never more than a few hours old. This is the site's Music
section — there's no manual `music.yaml`. Needs three secrets set once in
**GitHub → Settings → Secrets and variables → Actions** (never in this repo):
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`. To see
the section in local previews too, copy `.env.example` to `.env` and fill it
in (`.env` is git-ignored). If the secrets are missing or Spotify errors, the
section is left out — nothing else on the page is affected, and the build
still succeeds. The refresh token doesn't expire on its own; if Spotify ever
revokes it, redo the one-time authorization in `docs/spotify-setup.md`.

### Letterboxd ("Last watched" / "Top reviews lately" on the Taste page)

Read from your public diary RSS feed when the site is built
(`src/lib/letterboxd.ts`) — no account, no secrets. Same freshness as
Spotify: a few hours at most; to update it right after logging a film, open
the repo's **Actions** tab → **Deploy** → **Run workflow**. This is the site's
Films section — there's no manual `films.yaml`. Set your username in
`site.yaml` → `letterboxd.username`; leave it blank to turn the widget off.
`letterboxd.top_count` controls how many "top reviews" show at once (only
entries where you actually wrote something are eligible; Shuffle re-picks,
weighted by your star rating). If the feed can't be reached, the section is
left out and the build still succeeds.

## Hosting

The site lives on **GitHub Pages**, built by the workflow in
`.github/workflows/deploy.yml`. It runs on every push to `main`, four times a
day on a schedule (that's what keeps the Spotify and Letterboxd sections
fresh), and whenever you press **Run workflow** in the Actions tab. There is
no hosting account to keep alive and no usage credits to run out of: if a
scheduled build fails (say Spotify is down), the previous version stays up.
The site's address is in `site.yaml` → `url`; change it when you add a domain
(**Settings → Pages → Custom domain** on GitHub, plus a DNS record).

## Where things live

```
site.yaml              settings — the "what and where" dials
content/               everything you write
  pages/               about, now, colophon, cv (one page per file)
  writing/  takes/  made/
  taste/  questions.yaml  photos/
src/
  styles/tokens.css    the "how it looks" dials
  styles/base.css      shared text styles (rarely touched)
  content.config.ts    what each content file may contain — the rules behind the error messages
  components/ layouts/ pages/ lib/    the machinery
public/                files served as-is: favicon.svg, cv.pdf, images/
.github/workflows/     how GitHub builds and publishes the site
docs/brief.md          the site brief — what this site is for and why it's shaped this way
```

## When something breaks

Run `check.cmd`. The last lines say what's wrong, e.g.

```
content/taste/books.yaml has a YAML mistake.
bad indentation of a mapping entry (5:8)
```

or

```
takes → sample-walking data does not match collection schema.
  spice: spice must be 1, 2 or 3
```

Fix the named file, run it again. If it says **All good**, it is.

## Changing a font (the one "developer-ish" task)

Fonts are self-hosted from npm packages so the site never depends on a third
party. To switch: `npm install @fontsource-variable/<name>`, replace the import
in `src/layouts/Base.astro`, then change the family name in `tokens.css`.
