// Serverless function: returns John's most recent Letterboxd entry, plus the
// full pool of his other reviewed entries, parsed from his public diary RSS
// feed. No secrets needed — Letterboxd's feed is public. Username comes from
// the caller (the Taste page passes it from site.yaml).
//
// The client does the picking (see LetterboxdReviews.astro): a weighted
// random sample favouring higher ratings, not a fixed "top N by rating" —
// otherwise the same handful of tied 5-star reviews would win forever and
// everything else would never be shown.

import { XMLParser } from 'fast-xml-parser';

function starsToNumber(rating) {
  const n = Number(rating);
  return Number.isFinite(n) ? n : null;
}

// Letterboxd's description is "<p><img poster/></p> <p>review text</p> [<p>Watched on ...</p>]".
// Pull the poster src out, then strip all tags from what's left for plain review text.
function parseDescription(html) {
  if (!html) return { poster: null, reviewText: '' };
  const posterMatch = html.match(/<img[^>]*src="([^"]+)"/);
  const withoutPoster = html.replace(/<p>\s*<img[^>]*>\s*<\/p>/, '');
  const withoutWatchedLine = withoutPoster.replace(/<p>\s*Watched on[^<]*<\/p>\s*$/i, '');
  const reviewText = withoutWatchedLine
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { poster: posterMatch?.[1] ?? null, reviewText };
}

function normalize(item) {
  const lb = 'letterboxd:';
  const { poster, reviewText } = parseDescription(item.description);
  return {
    title: item[`${lb}filmTitle`] ?? item.title,
    year: item[`${lb}filmYear`] ? Number(item[`${lb}filmYear`]) : null,
    rating: starsToNumber(item[`${lb}memberRating`]),
    link: item.link,
    poster,
    review: reviewText,
    hasReview: reviewText.length > 0,
    watchedDate: item[`${lb}watchedDate`] ?? null,
  };
}

export default async (req) => {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response(JSON.stringify({ error: 'No Letterboxd username configured.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`https://letterboxd.com/${encodeURIComponent(username)}/rss/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; personal-site-widget)' },
    });
    if (!res.ok) throw new Error(`Letterboxd feed request failed: ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    const list = Array.isArray(items) ? items : items ? [items] : [];
    if (list.length === 0) throw new Error('No diary entries found.');

    const entries = list.map(normalize);
    const mostRecent = entries[0];
    // Every other reviewed entry is eligible — not just the highest-rated —
    // so nothing is permanently excluded by a fixed cutoff. Capped at 30 as
    // a sane payload limit; the feed itself only carries recent history anyway.
    const pool = entries
      .filter((e) => e.hasReview && e.rating !== null && e.link !== mostRecent.link)
      .slice(0, 30);

    return new Response(JSON.stringify({ mostRecent, pool }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 minutes — a diary doesn't change fast enough to need more.
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
