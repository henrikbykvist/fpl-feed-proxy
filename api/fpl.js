// api/fpl.js
const PRIMARY = 'https://cdn.jsdelivr.net/gh/henrikbykvist/fpl-feed-raakens-disipler@main/data/latest.json';
const FALLBACK = 'https://raw.githubusercontent.com/henrikbykvist/fpl-feed-raakens-disipler/main/data/latest.json';

// "Last known good" i minnet mellom varme kall
let lastGood = null;
let lastGoodTs = 0;

async function fetchWithTimeout(url, ms = 3500) {
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

export default async function handler(req, res) {
  try {
    let data;
    try {
      data = await fetchWithTimeout(PRIMARY, 3500);
    } catch {
      data = await fetchWithTimeout(FALLBACK, 3500);
    }

    // Oppdater cache
    lastGood = data;
    lastGoodTs = Date.now();

    res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
      .json(data);
  } catch (err) {
    // Server "sist kjente gode" hvis vi har det
    if (lastGood) {
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=300')
        .json({ _note: 'served_stale', _stale_ms: Date.now() - lastGoodTs, ...lastGood });
    }

    // Viktig: aldri 503 (GPT takler 502/504 bedre og prøver gjerne igjen)
    const isTimeout = (err?.name || '').includes('Abort');
    res
      .status(isTimeout ? 504 : 502)
      .setHeader('Content-Type', 'application/json')
      .json({ ok: false, error: isTimeout ? 'Upstream timeout' : String(err) });
  }
}
