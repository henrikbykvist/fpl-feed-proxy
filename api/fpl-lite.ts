// api/fpl-lite.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res
    .status(200)
  .setHeader('Content-Type', 'application/json')
    .json({ ok: true, now: Date.now(), hint: 'Minimal sanity-endepunkt.' });
}
