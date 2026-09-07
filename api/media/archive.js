function cleanText(value, max = 500) {
  if (Array.isArray(value)) value = value[0];
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeId(value) {
  const id = String(value || "");
  return /^[A-Za-z0-9._-]{1,160}$/.test(id) ? id : null;
}

function mediaFile(files) {
  const candidates = (Array.isArray(files) ? files : [])
    .filter(f => f && f.name && !String(f.name).startsWith("__"))
    .map(f => ({
      name: String(f.name),
      size: Number(f.size || 0),
      format: String(f.format || "").toLowerCase(),
      source: String(f.source || "")
    }))
    .filter(f => {
      const n = f.name.toLowerCase();
      return n.endsWith(".mp4") || n.endsWith(".webm") || n.endsWith(".ogv") ||
             f.format.includes("mpeg4") || f.format.includes("h.264");
    })
    .sort((a,b) => {
      const rank = x => x.name.toLowerCase().endsWith(".mp4") ? 0 :
                        x.name.toLowerCase().endsWith(".webm") ? 1 : 2;
      return rank(a) - rank(b) || b.size - a.size;
    });
  return candidates[0] || null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");

  try {
    const mode = String(req.query.mode || "search");

    if (mode === "details") {
      const id = safeId(req.query.id);
      if (!id) return res.status(400).json({ error: "Invalid identifier" });

      const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
        headers: { "User-Agent": "Null-Sec-OS/6.0" },
        signal: AbortSignal.timeout(12000)
      });
      if (!r.ok) return res.status(502).json({ error: "Archive metadata unavailable" });
      const data = await r.json();
      const meta = data.metadata || {};
      const file = mediaFile(data.files);

      return res.json({
        id,
        title: cleanText(meta.title, 180) || id,
        description: cleanText(meta.description, 1400),
        year: cleanText(meta.year || meta.date, 40),
        creator: cleanText(meta.creator, 180),
        thumbnail: `https://archive.org/services/img/${encodeURIComponent(id)}`,
        page: `https://archive.org/details/${encodeURIComponent(id)}`,
        media: file ? {
          name: file.name,
          url: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(file.name)}`,
          format: file.format
        } : null
      });
    }

    const q = cleanText(req.query.q, 120);
    const page = Math.max(1, Math.min(50, Number(req.query.page || 1) || 1));

    let query = '(collection:feature_films OR collection:prelinger) AND mediatype:movies';
    if (q) {
      const safe = q.replace(/["\\]/g, " ").replace(/[^\w\s.'-]/g, " ").trim();
      if (safe) query += ` AND (title:("${safe}") OR description:("${safe}") OR creator:("${safe}"))`;
    }

    const params = new URLSearchParams();
    params.set("q", query);
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "description");
    params.append("fl[]", "year");
    params.append("fl[]", "creator");
    params.append("fl[]", "downloads");
    params.set("rows", "30");
    params.set("page", String(page));
    params.set("sort[]", q ? "downloads desc" : "downloads desc");
    params.set("output", "json");

    const r = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`, {
      headers: { "User-Agent": "Null-Sec-OS/6.0" },
      signal: AbortSignal.timeout(12000)
    });
    if (!r.ok) return res.status(502).json({ error: "Archive search unavailable" });

    const data = await r.json();
    const docs = data?.response?.docs || [];
    const items = docs.map(d => ({
      id: String(d.identifier || ""),
      title: cleanText(d.title, 160) || String(d.identifier || "Untitled"),
      description: cleanText(d.description, 260),
      year: cleanText(d.year, 24),
      creator: cleanText(d.creator, 120),
      downloads: Number(d.downloads || 0),
      thumbnail: `https://archive.org/services/img/${encodeURIComponent(String(d.identifier || ""))}`
    })).filter(x => x.id);

    res.json({
      query: q,
      page,
      total: Number(data?.response?.numFound || items.length),
      items
    });
  } catch (error) {
    res.status(500).json({ error: error?.name === "TimeoutError" ? "Media source timed out" : "Media catalog error" });
  }
};