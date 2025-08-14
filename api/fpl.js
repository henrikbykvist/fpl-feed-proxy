export default async function handler(req, res) {
  const primary = "https://cdn.jsdelivr.net/gh/henrikbykvist/fpl-feed-raakens-disipler@main/data/latest.json";
  const fallback = "https://raw.githubusercontent.com/henrikbykvist/fpl-feed-raakens-disipler/main/data/latest.json";

  async function fetchWithRetry(url) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        data._proxy = { source: i === 0 ? "primary" : "fallback" };
        return data;
      } catch (err) {
        if (i === 1) throw err;
      }
    }
  }

  try {
    const data = await fetchWithRetry(primary).catch(() => fetchWithRetry(fallback));
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    res.status(503).json({ error: "Unable to fetch feed", details: error.message });
  }
}
