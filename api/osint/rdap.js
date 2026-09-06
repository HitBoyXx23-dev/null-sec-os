const { net, isPrivateIp, cleanDomain, safeFetch } = require('../../lib/relay');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length > 253) throw new Error('Invalid query');
    const kind = net.isIP(q) ? 'ip' : 'domain';
    const value = kind === 'domain' ? cleanDomain(q) : q;
    if (kind === 'ip' && isPrivateIp(value)) throw new Error('Private/local IPs are not queried');
    const { response } = await safeFetch(`https://rdap.org/${kind}/${encodeURIComponent(value)}`);
    const text = await response.text();
    if (text.length > 1024 * 1024) throw new Error('RDAP response too large');
    res.status(response.ok ? 200 : response.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) { return res.status(400).json({ error: err.message }); }
};
