const { safeFetch } = require('../../lib/relay');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const target = String(req.query.url || '').trim();
    const { response, finalUrl } = await safeFetch(target);
    const keep = ['content-type','content-length','server','date','last-modified','etag','cache-control',
      'content-security-policy','strict-transport-security','x-frame-options','x-content-type-options',
      'referrer-policy','permissions-policy','cross-origin-opener-policy','cross-origin-resource-policy'];
    const headers = {};
    for (const k of keep) { const v = response.headers.get(k); if (v) headers[k] = v; }
    try { await response.body?.cancel(); } catch {}
    return res.status(200).json({ requested: target, finalUrl: finalUrl.href, status: response.status, headers });
  } catch (err) { return res.status(400).json({ error: err.message }); }
};
