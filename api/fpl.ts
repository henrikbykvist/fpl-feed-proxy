// api/fpl.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRIMARY = 'https://cdn.jsdelivr.net/gh/henrikbykvist/fpl-feed-raakens-disipler@main/data/latest.json';
const FALLBACK = 'https://raw.githubusercontent.com/henrikbykvist/fpl-feed-raakens-disipler/main/data/latest.json';

// Cache i minnet mellom varme kall
let lastGood: any = null;
let lastGoodTs = 0;

async function fetchWithTimeout(url: string, ms = 3500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'fpl-feed-proxy/1.0' },
      cache: 'no-store'
    });
    if (!r.ok) throw new Error(`Upstream ${url} status ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let data: any;
    try {
      data = await fetchWithTimeout(PRIMARY, 3500);
    } catch {
      data = await fetchWithTimeout(FALLBACK, 3500);
    }

    lastGood = data;
    lastGoodTs = Date.now();

    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
      .json(data);
  } catch (err: any) {
    if (lastGood) {
      return res.status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=300')
        .json({ _note: 'served_stale', _stale_ms: Date.now() - lastGoodTs, ...lastGood });
    }
    const isTimeout = (err?.name || '').includes('Abort');
    return res.status(isTimeout ? 504 : 502)
      .setHeader('Content-Type', 'application/json')
      .json({ ok: false, error: isTimeout ? 'Upstream timeout' : String(err) });
  }
}
