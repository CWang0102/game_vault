import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = 0;

async function getTwitchToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const { IGDB_CLIENT_ID, IGDB_CLIENT_SECRET } = process.env;
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    throw new Error('IGDB credentials not configured');
  }

  const url = `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to get Twitch token');

  const data = await res.json();
  cachedToken = data.access_token;
  // Expire 60 seconds early to avoid edge cases
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// GET /api/igdb/search?q=<query>
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().replace(/"/g, '');
    if (!q) return res.json({ games: [] });

    const token = await getTwitchToken();
    const { IGDB_CLIENT_ID } = process.env;

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `search "${q}"; fields id,name,cover.url; limit 8;`,
    });

    if (!igdbRes.ok) throw new Error('IGDB request failed');

    const data = await igdbRes.json();
    const games = (data || [])
      .filter((g) => g.name)
      .map((g) => ({
        id: g.id,
        name: g.name,
        cover_url: g.cover?.url
          ? `https:${g.cover.url.replace('t_thumb', 't_cover_big')}`
          : null,
      }));
    res.json({ games });
  } catch (err) {
    next(err);
  }
});

export default router;
