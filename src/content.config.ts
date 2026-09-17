// ============================================================
// Content collections — what each folder/file in content/ may
// contain. Every field here is checked when the site builds, and
// a mistake is reported with the file name and the message below.
// ============================================================
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { allowEmpty, yamlList, yamlObject } from './lib/loaders';

// Files whose name starts with "_" are ignored — handy for drafts and examples.
const MARKDOWN = ['**/*.{md,mdx}', '!**/_*'];

const date = (field: string) =>
  z.coerce.date({ error: `${field} must be a date written like 2026-07-06` });

const topics = z
  .array(z.string(), { error: 'topics must be a list, like [aviation, policy]' })
  .default([]);

const href = z
  .string()
  .regex(/^(\/|https?:\/\/|mailto:)/, {
    error: 'href must start with / (a page on this site), https://, or mailto:',
  });

const link = z.object({
  label: z.string({ error: 'each link needs a label' }),
  href,
});

// ---------- site.yaml ----------------------------------------
const settings = defineCollection({
  loader: yamlObject('site.yaml', 'site'),
  schema: z.object({
    name: z.string({ error: 'name is required — your full name' }).min(1),
    short_name: z.string().optional(),
    motto: z.string().default(''),
    corollary: z.string().default(''),
    one_liner: z.string().default(''),
    email: z.email({ error: 'email must look like name@example.com' }),
    url: z.url({ error: 'url must be a full address like https://example.com' }),
    nav: z.array(link).default([]),
    footer: z.array(link).default([]),
    links: z.array(link).default([]),
    home: z
      .array(
        z.object({
          section: z.enum(['now', 'takes', 'writing', 'made', 'taste', 'questions'], {
            error: 'home section must be one of: now, takes, writing, made, taste, questions',
          }),
          count: z.number().int().positive({ error: 'count must be a whole number, 1 or more' }).default(3),
        }),
      )
      .default([]),
    theme: z
      .object({
        default: z.enum(['system', 'light', 'dark'], {
          error: 'theme.default must be system, light, or dark',
        }).default('system'),
        toggle: z.boolean({ error: 'theme.toggle must be true or false' }).default(true),
      })
      .prefault({}),
    takes: z
      .object({
        subtitle: z.string().default(''),
        spice: z
          .tuple([z.string(), z.string(), z.string()], {
            error: 'takes.spice must be exactly three labels, for spice levels 1, 2 and 3',
          })
          .default(['mild', 'spicy', 'will die on this hill']),
      })
      .prefault({}),
    dates: z.object({ locale: z.string().default('en-US') }).prefault({}),
    inbox: z
      .object({
        enabled: z.boolean({ error: 'inbox.enabled must be true or false' }).default(false),
        intro: z.string().default('Leave me a note. Anonymous is fine.'),
        action: z
          .union([z.literal(''), z.url({ error: 'inbox.action must be blank (inbox closed) or the full URL of your form service' })])
          .default(''),
      })
      .prefault({}),
    letterboxd: z
      .object({
        username: z.string().default(''),
        top_count: z
          .number()
          .int()
          .positive({ error: 'letterboxd.top_count must be a whole number, 1 or more' })
          .default(3),
      })
      .prefault({}),
  }),
});

// ---------- content/pages/*.md — About, Now, Colophon, CV -----
const pages = defineCollection({
  loader: glob({ pattern: MARKDOWN, base: './content/pages' }),
  schema: z.object({
    title: z.string({ error: 'title is required' }),
    description: z.string().optional(),
    summary: z.string().optional(),
    updated: date('updated'),
  }),
});

// ---------- content/writing/*.md — essays and notes -----------
const writing = defineCollection({
  loader: allowEmpty(glob({ pattern: MARKDOWN, base: './content/writing' })),
  schema: z.object({
    title: z.string({ error: 'title is required' }),
    description: z.string().optional(),
    date: date('date'),
    updated: date('updated').optional(),
    kind: z.enum(['essay', 'note'], { error: 'kind must be essay or note' }).default('note'),
    status: z
      .enum(['evergreen', 'dated', 'draft'], { error: 'status must be evergreen, dated, or draft' })
      .default('evergreen'),
    topics,
  }),
});

// ---------- content/takes/*.md — hot takes --------------------
const takes = defineCollection({
  loader: allowEmpty(glob({ pattern: MARKDOWN, base: './content/takes' })),
  schema: z.object({
    topics: z.array(z.string()).default(['misc']),
    spice: z.number().int().min(1).max(3, { error: 'spice must be 1, 2 or 3' }).default(1),
    date: date('date'),
    updated: date('updated').optional(),
    retired: z.boolean({ error: 'retired must be true or false' }).default(false),
    retiredNote: z.string().optional(),
  }),
});

// ---------- content/made/*.md — things John has made -----------
// Told as stories, not case studies: what it was, why, what happened,
// what it taught him. The extra fields are context, all optional.
const made = defineCollection({
  loader: allowEmpty(glob({ pattern: MARKDOWN, base: './content/made' })),
  schema: ({ image }) =>
    z.object({
      title: z.string({ error: 'title is required' }),
      summary: z.string({ error: 'summary is required — one or two sentences' }),
      date: date('date'),
      period: z.string().optional(),
      org: z.string().optional(),
      role: z.string().optional(),
      tools: z.array(z.string()).default([]),
      outcome: z.string().optional(),
      links: z.array(link).default([]),
      cover: image().optional(),
      topics,
      featured: z.boolean().default(false),
    }),
});

// ---------- content/taste/*.yaml — books, creators -------------
// (films and music are covered live by the Letterboxd and Spotify
// widgets on the Taste page — see src/components/LetterboxdReviews.astro
// and SpotifyTopTracks.astro — so there's no manual list for those.)
const tasteItem = z.object({
  title: z.string({ error: 'each entry needs a title' }),
  by: z.string().optional(),
  year: z.number().int({ error: 'year must be a number like 2016' }).optional(),
  note: z.string().optional(),
  rating: z.number().int().min(1).max(5, { error: 'rating must be a whole number from 1 to 5' }).optional(),
  link: z.url({ error: 'link must be a full address like https://…' }).optional(),
});

const books = defineCollection({ loader: yamlList('content/taste/books.yaml'), schema: tasteItem });
const creators = defineCollection({ loader: yamlList('content/taste/creators.yaml'), schema: tasteItem });

// ---------- content/questions.yaml ----------------------------
const questions = defineCollection({
  loader: yamlList('content/questions.yaml'),
  schema: z.object({
    question: z.string({ error: 'each entry needs a question' }),
    since: date('since').optional(),
    note: z.string().optional(),
    status: z.enum(['open', 'answered'], { error: 'status must be open or answered' }).default('open'),
    topics,
  }),
});

// ---------- content/photos/photos.yaml ------------------------
const photos = defineCollection({
  loader: yamlList('content/photos/photos.yaml'),
  schema: ({ image }) =>
    z.object({
      src: image(),
      alt: z.string({ error: 'alt is required — describe the picture in a sentence' }),
      caption: z.string().optional(),
      date: date('date').optional(),
      place: z.string().optional(),
    }),
});

export const collections = {
  settings,
  pages,
  writing,
  takes,
  made,
  books,
  creators,
  questions,
  photos,
};
