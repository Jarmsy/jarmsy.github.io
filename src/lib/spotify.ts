// Spotify top tracks, fetched once at build time (not in the browser, and
// not from a server): GitHub Actions rebuilds the site on a schedule, so the
// numbers are hours old at most. The three secrets live in GitHub → Settings
// → Secrets (and in a local .env for previews) — never in this repo.
//
// Returns null when Spotify isn't configured or errors, and the Taste page
// simply leaves the section out. A failed fetch never fails the build.

export interface Track {
  title: string;
  by: string;
  link: string;
  cover: string | null;
  /** 1 for the least-played track in the pool, up to 50 for the most-played. */
  rank: number;
}

export type Range = 'short' | 'medium';
export type TopTracks = Record<Range, Track[]>;

const RANGES: Record<Range, string> = { short: 'short_term', medium: 'medium_term' };

async function getAccessToken(): Promise<string> {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = import.meta.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('not configured (SPOTIFY_* variables missing)');
  }
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: SPOTIFY_REFRESH_TOKEN }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  return (await res.json()).access_token;
}

async function fetchRange(token: string, range: Range): Promise<Track[]> {
  // 50 is the most Spotify returns in one request — a deep pool for the shuffle.
  const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${RANGES[range]}&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`top-tracks request failed: ${res.status}`);
  const data = await res.json();
  return data.items.map((track: any, index: number) => ({
    title: track.name,
    by: track.artists.map((a: any) => a.name).join(', '),
    link: track.external_urls.spotify,
    cover: track.album.images.at(-1)?.url ?? null, // smallest image
    rank: data.items.length - index,
  }));
}

let cached: Promise<TopTracks | null> | undefined;

export function getTopTracks(): Promise<TopTracks | null> {
  cached ??= (async () => {
    try {
      const token = await getAccessToken();
      const [short, medium] = await Promise.all([fetchRange(token, 'short'), fetchRange(token, 'medium')]);
      if (short.length === 0) throw new Error('no tracks returned');
      return { short, medium };
    } catch (error) {
      console.warn(`[spotify] section left out: ${(error as Error).message}`);
      return null;
    }
  })();
  return cached;
}
