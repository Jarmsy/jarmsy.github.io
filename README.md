# Personal website

A markdown-powered personal site built with [Astro](https://astro.build).
All content lives as plain text files — the site is just a thin template
layer over a folder of markdown you own forever.

## Everyday tasks

### Add a hot take

Create a new `.md` file in `src/content/takes/` (any filename):

```markdown
---
topics: [food, travel]   # tags for the filter chips — invent new ones freely
spice: 2                  # 1 = mild, 2 = spicy, 3 = will die on this hill
date: 2026-07-06
---

Your take goes here. Markdown works — *italics*, **bold**, links.
```

### Retire a take (changed your mind)

Add to its frontmatter:

```yaml
retired: true
retiredNote: "Why you changed your mind (optional but fun)."
```

### Add a longer piece

Create a `.md` file in `src/content/writing/`:

```markdown
---
title: 'The title'
description: 'One-line teaser shown in lists.'
date: 2026-07-06
---

The piece...
```

Use `.mdx` instead of `.md` if you want components like `<Figure>` —
see `src/content/writing/sample-essay.mdx` for a working example.

### Edit fixed pages

- Your name, tagline, intro, and social links: `src/config.ts`
- The About page: `src/pages/about.md`

## Running it

```powershell
npm install       # first time only
npm run dev       # local preview at http://localhost:4321
npm run build     # production build into dist/
```

## Where things live

```
src/
  config.ts            ← your name, tagline, links
  content/
    takes/             ← one file per hot take
    writing/           ← one file per longer piece
  pages/
    about.md           ← the About page (plain markdown)
    index.astro        ← homepage template
    takes/index.astro  ← hot takes page (filter chips live here)
  components/          ← Figure, TakeCard, SpiceMeter
  layouts/             ← page shells (header/footer)
  styles/global.css    ← all styling; design tokens at the top
public/
  images/              ← images referenced as /images/...
```
