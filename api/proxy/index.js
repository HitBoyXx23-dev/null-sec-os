const {
  MAX_BYTES, TEXT_TYPES, BINARY_TYPES, BINARY_PREFIX,
  safeFetch, rewriteCss, injectRelay, getOrigin
} = require('../../lib/relay');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const target = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!target) return res.status(400).send('Null Relay: missing ?url= target');

  try {
    const { response, finalUrl } = await safeFetch(target);
    const type = (response.headers.get('content-type') || 'application/octet-stream').toLowerCase();
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');

    const allowed = TEXT_TYPES.some(t => type.includes(t)) ||
      BINARY_TYPES.some(t => type.includes(t)) ||
      BINARY_PREFIX.some(t => type.startsWith(t));
    if (!allowed) return res.status(415).send('Null Relay: unsupported content type');

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');

    res.status(response.ok ? 200 : response.status);
    res.setHeader('X-Null-Relay-Target', finalUrl.origin);

    const proxyOrigin = getOrigin(req);
    if (type.includes('text/html') || type.includes('application/xhtml+xml')) {
      return res.type('html').send(injectRelay(buffer.toString('utf8'), finalUrl, proxyOrigin));
    }
    if (type.includes('text/css')) {
      return res.type('css').send(rewriteCss(buffer.toString('utf8'), finalUrl, proxyOrigin));
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    return res.send(buffer);
  } catch (err) {
    return res.status(502).send(`Null Relay blocked or failed: ${err.message}`);
  }
};
