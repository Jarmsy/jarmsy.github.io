import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ------------------------------------------------------------
// Hot Takes: one small markdown file per take in src/content/takes/
// The body of the file IS the take. Frontmatter:
//   topics:  list of topic tags (used for the filter chips)
//   spice:   1 (mild) | 2 (spicy) | 3 (will die on this hill)
//   date:    when you wrote it ("as of" stamp)
//   retired: true to move it to the "Retired takes" section
//   retiredNote: optional one-liner on why you changed your mind
// ------------------------------------------------------------
const takes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/takes' }),
  schema: z.object({
    topics: z.array(z.string()).default(['misc']),
    spice: z.number().int().min(1).max(3).default(1),
    date: z.coerce.date(),
    retired: z.boolean().default(false),
    retiredNote: z.string().optional(),
  }),
});

// ------------------------------------------------------------
// Writing: longer pieces in src/content/writing/
// Use .md for plain pieces, .mdx if you want components (Figure, etc.)
// ------------------------------------------------------------
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    topics: z.array(z.string()).default([]),
  }),
});

export const collections = { takes, writing };
