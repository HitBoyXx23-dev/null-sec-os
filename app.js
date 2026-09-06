const express = require('express');
const path = require('node:path');

const health = require('./api/health');
const qr = require('./api/qr');
const proxy = require('./api/proxy');
const dns = require('./api/osint/dns');
const rdap = require('./api/osint/rdap');
const ct = require('./api/osint/ct');
const headers = require('./api/osint/headers');
const robots = require('./api/osint/robots');

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', health);
app.get('/api/qr', qr);
app.all('/api/proxy', proxy);
app.get('/api/osint/dns', dns);
app.get('/api/osint/rdap', rdap);
app.get('/api/osint/ct', ct);
app.get('/api/osint/headers', headers);
app.get('/api/osint/robots', robots);

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Null Sec OS listening on ${port}`));
}

module.exports = app;
