const { dns, cleanDomain } = require('../../lib/relay');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const domain = cleanDomain(req.query.domain);
    const types = ['A','AAAA','MX','TXT','NS','CNAME'];
    const records = {};
    await Promise.all(types.map(async type => {
      try { records[type] = await dns.resolve(domain, type); } catch { records[type] = []; }
    }));
    return res.status(200).json({ domain, records });
  } catch (err) { return res.status(400).json({ error: err.message }); }
};
