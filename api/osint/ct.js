const { cleanDomain, safeFetch } = require('../../lib/relay');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const domain = cleanDomain(req.query.domain);
    const { response } = await safeFetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`);
    if (!response.ok) throw new Error(`CT service returned ${response.status}`);
    const text = await response.text();
    if (text.length > 4 * 1024 * 1024) throw new Error('CT response too large');
    const rows = JSON.parse(text);
    const names = [...new Set(rows.flatMap(r => String(r.name_value || '').split(/\n/))
      .map(x => x.trim().toLowerCase()).filter(Boolean))].slice(0, 250);
    return res.status(200).json({ domain, count: names.length, names, truncated: names.length >= 250 });
  } catch (err) { return res.status(400).json({ error: err.message }); }
};
