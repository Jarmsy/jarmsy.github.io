// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { load } from 'js-yaml';

// The site's domain lives in site.yaml so it's set in one place.
const site = /** @type {{ url?: string }} */ (load(readFileSync('./site.yaml', 'utf8')));

// https://astro.build/config
export default defineConfig({
  site: site.url ?? 'https://example.com',
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/inbox/thanks/') })],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Addresses never die: anything that moves gets a redirect here.
  redirects: {
    '/work/': '/made/',
    '/work/[...slug]': '/made/[...slug]',
  },
});
