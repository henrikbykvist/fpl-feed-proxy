// api/ping.js
export default function handler(req, res) {
  res
    .status(200)
    .setHeader('Content-Type','application/json')
    .json({ ok: true, ts: Date.now(), hint: 'ping' });
}
