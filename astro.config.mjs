// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Set this to your real domain once you have one, e.g. 'https://johnharms.com'
  // (sitemap.xml and rss.xml both need this to generate correct absolute URLs)
  site: 'https://example.com',
  integrations: [mdx(), sitemap()],
});
