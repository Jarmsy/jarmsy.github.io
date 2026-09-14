// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Set this to your real domain once you have one, e.g. 'https://johnharms.com'
  site: 'https://example.com',
  integrations: [mdx()],
});
