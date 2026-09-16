// Serverless function: returns a pool of John's top 50 Spotify tracks (not
// just a fixed top 5) so the widget can shuffle through more than a
// handful — see SpotifyTopTracks.astro, which picks a weighted random
// sample favouring the most-played but gives every track in the pool
// a real chance to show.
//
// Needs three secrets set in the Netlify dashboard (Site configuration →
// Environment variables) — never in this repo:
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
//
// Query string: ?range=short  (last ~4 weeks, default) or ?range=medium (last ~6 months)

const RANGES = { short: 'short_term', medium: 'medium_term' };

async function getAccessToken() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Spotify is not configured (missing environment variables).');
  }

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export default async (req) => {
  const url = new URL(req.url);
  const range = RANGES[url.searchParams.get('range')] ?? RANGES.short;

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      // 50 is the most Spotify returns in one request — a deep pool for the shuffle.
      `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`Spotify top-tracks request failed: ${res.status}`);
    const data = await res.json();

    // rank: 1 for the most-played track, counting down — used to weight
    // the widget's shuffle so heavier plays are more likely without
    // making the rest of the pool unreachable.
    const tracks = data.items.map((track, index) => ({
      title: track.name,
      by: track.artists.map((a) => a.name).join(', '),
      link: track.external_urls.spotify,
      cover: track.album.images.at(-1)?.url ?? null, // smallest image
      rank: data.items.length - index,
    }));

    return new Response(JSON.stringify({ tracks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 minutes — top tracks don't change fast enough to need more.
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
