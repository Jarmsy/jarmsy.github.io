import { getEntry } from 'astro:content';

/** The validated contents of site.yaml. */
export async function getSite() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('site.yaml could not be loaded — see the error above.');
  const data = entry.data;
  return { ...data, short_name: data.short_name ?? data.name };
}

export type Site = Awaited<ReturnType<typeof getSite>>;
