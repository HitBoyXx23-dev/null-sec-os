const { assertPublicUrl, cleanDomain, safeFetch } = require('../../lib/relay');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const raw = String(req.query.url || '').trim();
    const parsed = await assertPublicUrl(/^https?:\/\//i.test(raw) ? raw : `https://${cleanDomain(raw)}`);
    const target = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const { response, finalUrl } = await safeFetch(target);
    const text = await response.text();
    if (text.length > 256 * 1024) throw new Error('robots.txt too large');
    return res.status(response.ok ? 200 : response.status).json({ url: finalUrl.href, status: response.status, text });
  } catch (err) { return res.status(400).json({ error: err.message }); }
};
