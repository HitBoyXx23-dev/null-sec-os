const QRCode = require('qrcode');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const text = String(Array.isArray(req.query.text) ? req.query.text[0] : (req.query.text || '')).slice(0, 2048);
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const png = await QRCode.toBuffer(text, { type: 'png', width: 512, margin: 2, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(png);
  } catch {
    return res.status(500).json({ error: 'QR generation failed' });
  }
};
