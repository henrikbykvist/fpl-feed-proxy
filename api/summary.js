// api/summary.js
const PRIMARY = 'https://cdn.jsdelivr.net/gh/henrikbykvist/fpl-feed-raakens-disipler@main/data/latest.json';
const FALLBACK = 'https://raw.githubusercontent.com/henrikbykvist/fpl-feed-raakens-disipler/main/data/latest.json';

// "Last known good" cache i minnet
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

function pickElementFields(el) {
  // Velg bare det analysen trenger
  return {
    id: el.id,
    web_name: el.web_name,
    first_name: el.first_name,
    second_name: el.second_name,
    team: el.team,
    element_type: el.element_type, // 1=GK,2=DEF,3=MID,4=FWD
    now_cost: el.now_cost,         // i tiendedeler (55 => 5.5)
    selected_by_percent: el.selected_by_percent,
    minutes: el.minutes,
    form: el.form,
    points_per_game: el.points_per_game,
    ict_index: el.ict_index,
    status: el.status,             // 'a','d','i','u','s'
    chance_of_playing_next_round: el.chance_of_playing_next_round
  };
}

function pickTeamFields(t) {
  return { id: t.id, name: t.name, short_name: t.short_name, strength: t.strength };
}

function pickFixtureFields(fx) {
  return {
    id: fx.id,
    event: fx.event,
    kickoff_time: fx.kickoff_time,
    team_h: fx.team_h,
    team_a: fx.team_a,
    team_h_difficulty: fx.team_h_difficulty,
    team_a_difficulty: fx.team_a_difficulty
  };
}

export default async function handler(req, res) {
  try {
    // Query params (valgfritt): gw=1, fixtures=10, topn=300
    const urlGw = parseInt(req.query.gw ?? '0', 10);
    const fixturesLimit = Math.max(0, Math.min(parseInt(req.query.fixtures ?? '40', 10), 200));
    const topN = Math.max(0, Math.min(parseInt(req.query.topn ?? '350', 10), 600)); // begrens spillere

    let data;
    try { data = await fetchWithTimeout(PRIMARY, 3500); }
    catch { data = await fetchWithTimeout(FALLBACK, 3500); }

    lastGood = data; lastGoodTs = Date.now();

    // --- Slank ut ---
    const bs = data?.fpl?.bootstrap_static ?? {};
    const fixtures = (data?.fpl?.fixtures ?? []).map(pickFixtureFields);
    const teams = (bs.teams ?? []).map(pickTeamFields);

    // Filtrer fixtures på gw hvis oppgitt
    const fixturesOut = urlGw ? fixtures.filter(fx => Number(fx.event) === urlGw) : fixtures;
    const fixturesLimited = fixturesOut.slice(0, fixturesLimit);

    // Begrens spillere til topN etter e.g. minutes/points_per_game/price som heuristikk (enkel og rask)
    const elementsRaw = bs.elements ?? [];
    // Grov sort: høyere minutes -> høyere ppg -> lavere pris
    const elementsSorted = elementsRaw.slice().sort((a, b) => {
      const ma = a.minutes ?? 0, mb = b.minutes ?? 0;
      if (mb !== ma) return mb - ma;
      const pga = parseFloat(a.points_per_game ?? '0') || 0;
      const pgb = parseFloat(b.points_per_game ?? '0') || 0;
      if (pgb !== pga) return pgb - pga;
      const ca = a.now_cost ?? 0, cb = b.now_cost ?? 0;
      return ca - cb;
    });
    const elements = elementsSorted.slice(0, topN).map(pickElementFields);

    // Ta med bare nødvendige meta-felt + entry/leagues hvis finnes
    const summary = {
      _generated_at_utc: new Date().toISOString(),
      _source_note: 'summary',
      _note: data._note,
      _stale_ms: data._stale_ms,
      fpl: {
        events: bs.events ?? [],
        teams,
        elements,               // slank liste
        fixtures: fixturesLimited,
        entry: data?.fpl?.entry ?? null,
        leagues: data?.fpl?.leagues ?? null
      },
      set_pieces: data?.set_pieces ?? null,
      injuries: data?.injuries ?? null,
      elite: data?.elite ?? null,
      odds: data?.odds ?? null
    };

    res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
      .json(summary);
  } catch (err) {
    if (lastGood) {
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=300')
        .json({ _note: 'served_stale', _stale_ms: Date.now() - lastGoodTs, ...lastGood });
    }
    const isTimeout = (err?.name || '').includes('Abort');
    res
      .status(isTimeout ? 504 : 502)
      .setHeader('Content-Type', 'application/json')
      .json({ ok: false, error: isTimeout ? 'Upstream timeout' : String(err) });
  }
}
