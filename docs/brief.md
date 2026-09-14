# Site brief

Rev 1 · 2026-09-13 · Status: living document

This is the constitution of the site. Every later decision — a new room, a design change, a piece
of content — gets checked against it. Revise it when the intent changes; don't let the site drift
away from it silently.

## 1. The one thing

**Motto:** Systems are made of people.
**Corollary:** wording pending — John wants it to carry the *weight* he gives to understanding
people within his quest to understand systems, not a sequence ("first" is out). Candidates:
"There's no understanding a system without understanding the people in it." /
"I want to design and understand systems. Most of that is understanding people." /
"Understanding people is the heart of understanding systems."
**One-liner:** Mechanical engineer turned policy researcher. Pilot.

Through-line, in John's own words from a graduate statement: *how beliefs, decisions and policies
emerge from the systems that produce them.* Evidence that this is the real thread, not a slogan:
machine guarding designed around operator fatigue; the fuel-tank lesson from flight training
(cognitive failures, not mechanical); FAA mental-health policy shaping what data can exist;
ragebait as incentive architecture; the reactionary mind as an immune response.

Underneath it, from the 2025 "Who I am" page: a worldview stack running physics → biology →
neuroscience → psychology → human behavior, with institutions and policy as the top floor added
since. And the phrase **robust, loosely held** — which becomes the subtitle of the Takes page.

The About page is a trajectory, not a bio: "soul searching for some intersection of engineering and
politics" (2025) → computational policy research (2026).

## 2. Audiences

| Visitor | Needs in ten seconds | Gets it from |
|---|---|---|
| Recruiter | What he does, proof he can do it, how to reach him | Home → Work → CV → email |
| Professor | The intellectual arc; whether he can think and write | About → Writing → Questions |
| Colleague | What he's working on now; where the overlap is | Now → Work → Questions |
| Friend | The human: what he's into, flying, taste | Taste → Photos → Takes |

One site, one person. The personal isn't hidden to look professional — it's the differentiator.

## 3. Openness policy (editorial rule — not published on the site)

**Open about your mind. Careful with other people's lives. Fair before loud.**

1. Write freely about ideas, mechanisms and your own experience.
2. Other people's private circumstances stay private — family, friends, coworkers — even when
   written with love. Anonymize or ask first.
3. Named living people appear only as public figures acting in public, and only where the point
   outlives the example. Prefer the mechanism to the personality.
4. Political and moral writing is welcome when it's about how things work and includes yourself in
   the critique. Current-events partisanship is not the site's signature.
5. One contact surface: a single email. No phone number, no street address, no student address.
   The web CV is scrubbed to match.
6. Takes are opinions, not verdicts. Spice and retirement keep them honest.
7. AI assistance disclosed once, in the colophon, in one sentence. *(John to confirm — see open decisions.)*

Applied: *Ragebait and the Architecture of Influence* publishes with a light edit.
*The Reactionary Mindset* stays unpublished until revised per rules 2–3 (not scheduled yet).

## 4. Rooms

| Room | Purpose | Unit of contribution | Cadence | Mostly for |
|---|---|---|---|---|
| **Must** | | | | |
| Home | Front door: motto, corollary, one-liner, a now-strip, doors to the rooms | — | as rooms change | everyone |
| About | The story told once, well. Values. The pivot. | a paragraph | yearly | professors, friends |
| Now | This season, dated. The heartbeat. | five bullets | quarterly | colleagues |
| Writing | Essays and Notes in one place, marked by kind and status | a post | notes monthly · essays yearly | everyone |
| Work | Research and projects as case studies: problem, what he did, what happened | a case study | per project | recruiters |
| Takes | Short opinions with spice and an as-of date; retire when he changes his mind | one sentence | whenever | friends, everyone |
| Taste | Books, film, music, shows. One line each. Links out. | one line | weekly | friends |
| CV | Web page plus print-ready PDF | — | per change | recruiters |
| **Should** | | | | |
| Photos | A curated set. The cockpit is the signature. *(No photos yet — design imagery-light with slots.)* | an image | seasonal | friends |
| Questions | Things he's trying to figure out | one question | whenever | professors |
| Colophon | How the site is made, the AI note, a changelog | a line | per change | the curious |
| **Later** | | | | |
| TIL | Research notes and small things learned | a paragraph | — | colleagues |
| Uses | Tools and setup | a line | — | the curious |

Rule: a room nobody has touched in a year gets cut.

## 5. Seed content

**About:** the stack; then-and-now; where flying came from (a lifelong habit of testing coordination
— sports, games, driving); the shop floor and the ramp; what he wants (to be a positive force, to
create more, deep connection, values-aligned work).

**Work (from the CV):** 3M machine vision for web-chatter detection ($100k+/yr scrap eliminated);
3M intern innovation lead (vision inspection for molding defects); Subzero fixtures ($15k → $2k) and
contingency protocols ($600k in eight months); PEM electrolysis TPMS transport layer (senior
design); Bakke Rec Center solar feasibility (NREL SAM); ESW solar dehydrator for a local farmer;
parametric drone frame with topology optimization. Images: the Google Slides portfolio.

**Writing:** Ragebait (ready). Reactionary Mindset (revise before publishing). Proposed, drawn from
the graduate statements: *Safety is a property of people*; *The data that doesn't exist*; *What the
shop floor taught me about policy*.

**Questions:** How do you evaluate a safety policy when disclosure itself carries professional risk?
Which indirect indicators actually predict safety outcomes in aviation? How much of media
polarization is designed versus demanded? What makes a mind open under threat instead of closing?

**Taste:** first bookshelf = the essay's further reading (Fromm, Adorno, Haidt, Solomon/Greenberg/
Pyszczynski, Festinger). Film, music, shows: John's.

**Takes:** John's. Starting topics: engineering, aviation, media, policy, food, music, life.

## 6. Structure

```
/                home
/about           the story, values
/now             this season, dated
/writing         essays + notes, filter by kind and topic
/writing/<slug>
/work            case studies
/work/<slug>
/takes
/taste           books · film · music · shows
/photos
/questions
/cv              + /cv.pdf
/colophon
/rss.xml         /sitemap-index.xml
```

Nav (5): About · Writing · Work · Takes · Taste
Footer: Now · Photos · Questions · CV · Colophon · RSS · Email
Topics cut across rooms and produce topic pages for free.

Built 2026-09-13. How the structure is held together:
- `site.yaml` owns identity, nav, footer, profile links, home-page composition, theme default,
  Takes labels. `src/styles/tokens.css` owns every colour, font and size. Nothing else declares them.
- `content/` owns every word: markdown per essay/take/case study, small YAML lists for taste,
  questions and photos, one markdown file per plain page (a new file there is a new page).
- Every file is schema-checked at build time with plain-English errors; `check.cmd` runs the check.
- A file whose name starts with `_` is ignored — drafts and examples live in plain sight.
- Rooms with no content show a quiet "nothing here yet" and are simply left out of the nav.

Permanence rules: lowercase slugs; no dates or file extensions in URLs; never delete — retire and
redirect, with the redirect map in the repo; every page carries a last-updated stamp; content stays
plain files.

## 7. Look and feel

Warm editorial, dark and light. A well-made book with an engineer's margins. Three words a visitor
should reach for: **curious, warm, precise.**

- Type: a serif with character for reading (Newsreader is the leading candidate); a mono for
  metadata — dates, spice, as-of stamps, labels. Self-hosted.
- Motif: the logbook. Every page shows when it was last touched; Now reads like a logbook entry.
- Imagery: John's photographs only, cockpit when possible. None exist yet — leave slots.
- Signature: the spice meter; a monogram; one accent colour.
- Motion: view transitions, prefetch, light/dark/system toggle, reduced motion respected, no JS
  unless it earns its place, pages under 100 KB.

## 8. Maintenance contract

| When | What | Minutes |
|---|---|---|
| Weekly-ish | One Taste line or one Take | 2 |
| Monthly | One Note | 20–40 |
| Quarterly | Update Now; scan Takes for ones to retire | 30 |
| Yearly | One Essay; refresh About and CV | a weekend |

## 9. Decisions

Decided 2026-09-13:
- Motto "Systems are made of people." with John's corollary. ✔
- Openness policy adopted as an internal editorial rule, not published. ✔
- Writing to start with: the Ragebait essay, light edit. ✔ (Revision of Reactionary Mindset and the
  three proposed essays: not scheduled.)
- Photos: none yet; design imagery-light with slots. ✔
- Status: John started a graduate program in fall 2026. Program and city: *to be filled in.*

Open:
- Which program, which city (feeds Now and About).
- The one-sentence AI note in the colophon — keep or drop.
- Domain: full name or something else (needed at hosting time).
- Taste platforms he actually keeps (needed when building Taste).

## 10. Process

1. Brief agreed (this document). Revise as decisions land. ✔
2. Structure first (John's call, 2026-09-13): every room, config-driven, self-editable. ✔
3. Real content: About, Now, five to ten takes, the case studies from the CV.
4. Design pass on the built structure: mockups of the home page and one room; refine tokens,
   signature elements (monogram, accent), photography once it exists.
5. Polish; then domain and hosting when John is ready.
