module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, service: 'null-sec-functions', runtime: process.version, time: new Date().toISOString() });
};
