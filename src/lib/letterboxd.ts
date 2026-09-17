// Letterboxd activity, read once at build time from the public diary RSS
// feed (no account, no secrets). GitHub Actions rebuilds the site on a
// schedule, so "last watched" is hours old at most.
//
// Returns null if the feed can't be read, and the Taste page leaves the
// section out. A failed fetch never fails the build.

import { XMLParser } from 'fast-xml-parser';

export interface Entry {
  title: string;
  year: number | null;
  rating: number | null;
  link: string;
  poster: string | null;
  review: string;
  watchedDate: string | null;
}

export interface Letterboxd {
  mostRecent: Entry;
  /** Every other entry with a written review — the shuffle picks from these. */
  pool: Entry[];
}

// Letterboxd's description is "<p><img poster/></p> <p>review text</p> [<p>Watched on ...</p>]".
// Pull the poster src out, then strip all tags from what's left for plain review text.
function parseDescription(html: string | undefined) {
  if (!html) return { poster: null, review: '' };
  const posterMatch = html.match(/<img[^>]*src="([^"]+)"/);
  const review = html
    .replace(/<p>\s*<img[^>]*>\s*<\/p>/, '')
    .replace(/<p>\s*Watched on[^<]*<\/p>\s*$/i, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { poster: posterMatch?.[1] ?? null, review };
}

function normalize(item: any): Entry {
  const rating = Number(item['letterboxd:memberRating']);
  return {
    title: item['letterboxd:filmTitle'] ?? item.title,
    year: item['letterboxd:filmYear'] ? Number(item['letterboxd:filmYear']) : null,
    rating: Number.isFinite(rating) ? rating : null,
    link: item.link,
    watchedDate: item['letterboxd:watchedDate'] ?? null,
    ...parseDescription(item.description),
  };
}

const cache = new Map<string, Promise<Letterboxd | null>>();

export function getLetterboxd(username: string): Promise<Letterboxd | null> {
  if (!username) return Promise.resolve(null);
  let pending = cache.get(username);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(`https://letterboxd.com/${encodeURIComponent(username)}/rss/`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; personal-site-build)' },
        });
        if (!res.ok) throw new Error(`feed request failed: ${res.status}`);
        const parsed = new XMLParser({ ignoreAttributes: false }).parse(await res.text());
        const items = parsed?.rss?.channel?.item;
        const list: any[] = Array.isArray(items) ? items : items ? [items] : [];
        if (list.length === 0) throw new Error('no diary entries found');

        const entries = list.map(normalize);
        const mostRecent = entries[0];
        // Every other reviewed entry is eligible — not just the highest-rated —
        // so nothing is permanently excluded by a fixed cutoff.
        const pool = entries.filter((e) => e.review && e.rating !== null && e.link !== mostRecent.link);
        return { mostRecent, pool };
      } catch (error) {
        console.warn(`[letterboxd] section left out: ${(error as Error).message}`);
        return null;
      }
    })();
    cache.set(username, pending);
  }
  return pending;
}
