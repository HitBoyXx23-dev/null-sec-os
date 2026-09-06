const express = require('express');
const path = require('node:path');
const dns = require('node:dns').promises;
const net = require('node:net');
const QRCode = require('qrcode');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TEXT_TYPES = [
  'text/html', 'application/xhtml+xml', 'text/plain', 'text/css',
  'application/javascript', 'text/javascript', 'application/json',
  'application/xml', 'text/xml', 'image/svg+xml'
];
const BINARY_PREFIX = ['image/', 'font/', 'audio/'];

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
  }
  const s = ip.toLowerCase();
  return s === '::1' || s === '::' || s.startsWith('fc') || s.startsWith('fd') ||
    /^fe[89ab]/.test(s) || s.startsWith('ff') || s.startsWith('2001:db8:');
}

async function assertPublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS are allowed');
  if (url.username || url.password) throw new Error('Credentialed URLs are blocked');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Local targets are blocked');
  }
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error('Private or unresolved targets are blocked');
  }
  return url;
}

async function safeFetch(start) {
  let current = await assertPublicUrl(start);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 NullSecRelay/3.2',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.8'
      },
      signal: AbortSignal.timeout(12000)
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) return { response, finalUrl: current };
      current = await assertPublicUrl(new URL(location, current).href);
      continue;
    }
    return { response, finalUrl: current };
  }
  throw new Error('Too many redirects');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function relayUrl(raw, base) {
  try {
    if (!raw || /^(data:|blob:|javascript:|mailto:|tel:|#)/i.test(raw)) return raw;
    return '/api/proxy?url=' + encodeURIComponent(new URL(raw, base).href);
  } catch {
    return raw;
  }
}

function rewriteCss(css, base) {
  return css
    .replace(/url\((['"]?)(.*?)\1\)/gi, (m, q, u) => `url(${q}${relayUrl(u, base)}${q})`)
    .replace(/@import\s+(['"])(.*?)\1/gi, (m, q, u) => `@import ${q}${relayUrl(u, base)}${q}`);
}

function injectRelay(html, finalUrl) {
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
  html = html.replace(/\s(src|href|poster|action)=(['"])(.*?)\2/gi,
    (m, a, q, u) => ` ${a}=${q}${relayUrl(u, finalUrl)}${q}`);
  html = html.replace(/\ssrcset=(['"])(.*?)\1/gi, (m, q, v) => {
    const mapped = v.split(',').map((part) => {
      const p = part.trim().split(/\s+/);
      p[0] = relayUrl(p[0], finalUrl);
      return p.join(' ');
    }).join(', ');
    return ` srcset=${q}${mapped}${q}`;
  });

  const base = `<base href="${esc(finalUrl.href)}">`;
  const bridge = `<script>(function(){
    function route(u){try{var x=new URL(u,document.baseURI);if(!/^https?:$/.test(x.protocol))return u;return '/api/proxy?url='+encodeURIComponent(x.href)}catch(e){return u}}
    document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0)return;var h=a.getAttribute('href');if(!h||/^(#|javascript:|mailto:|tel:)/i.test(h))return;e.preventDefault();location.href=route(h)},true);
    document.addEventListener('submit',function(e){var f=e.target;if(!f||String(f.method||'get').toLowerCase()!=='get')return;e.preventDefault();var u=new URL(f.action||document.baseURI,document.baseURI);new FormData(f).forEach(function(v,k){u.searchParams.append(k,v)});location.href=route(u.href)},true);
  })();<\/script>`;

  const marker = /<head[^>]*>/i;
  return marker.test(html)
    ? html.replace(marker, (m) => m + base + bridge)
    : `<!doctype html><html><head>${base}${bridge}</head><body>${html}</body></html>`;
}

app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, service: 'null-sec-node', runtime: process.version, time: new Date().toISOString() });
});

app.get('/api/qr', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const text = String(Array.isArray(req.query.text) ? req.query.text[0] : (req.query.text || '')).slice(0, 2048);
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const png = await QRCode.toBuffer(text, { type: 'png', width: 512, margin: 2, errorCorrectionLevel: 'M' });
    res.type('png').send(png);
  } catch {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.get('/api/proxy', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const target = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!target) return res.status(400).send('Null Relay: missing ?url= target');

  try {
    const { response, finalUrl } = await safeFetch(target);
    const type = (response.headers.get('content-type') || 'application/octet-stream').toLowerCase();
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');

    const allowed = TEXT_TYPES.some((t) => type.includes(t)) || BINARY_PREFIX.some((t) => type.startsWith(t));
    if (!allowed) return res.status(415).send('Null Relay: unsupported content type');

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');

    res.status(response.ok ? 200 : response.status);
    res.setHeader('X-Null-Relay-Target', finalUrl.origin);

    if (type.includes('text/html') || type.includes('application/xhtml+xml')) {
      res.type('html').send(injectRelay(buffer.toString('utf8'), finalUrl));
      return;
    }
    if (type.includes('text/css')) {
      res.type('css').send(rewriteCss(buffer.toString('utf8'), finalUrl));
      return;
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.send(buffer);
  } catch (err) {
    res.status(502).send(`Null Relay blocked or failed: ${err.message}`);
  }
});

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Null Sec OS listening on port ${PORT}`);
});

module.exports = app;
