const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      p[0] >= 224;
  }
  const s = ip.toLowerCase();
  return s === '::1' || s === '::' || s.startsWith('fc') || s.startsWith('fd') ||
    s.startsWith('fe8') || s.startsWith('fe9') || s.startsWith('fea') || s.startsWith('feb') ||
    s.startsWith('ff') || s.startsWith('2001:db8:');
}

async function assertPublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS are allowed');
  if (url.username || url.password) throw new Error('Credentialed URLs are blocked');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Local targets are blocked');
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(r => isPrivateIp(r.address))) throw new Error('Private or unresolved targets are blocked');
  return url;
}

async function safeFetch(start) {
  let current = await assertPublicUrl(start);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'NullSecRelay/2.0 (+browser viewer)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.8'
      },
      signal: AbortSignal.timeout(12000)
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) return { response, finalUrl: current };
      current = await assertPublicUrl(new URL(location, current).href);
      continue;
    }
    return { response, finalUrl: current };
  }
  throw new Error('Too many redirects');
}

function escapeAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

function injectRelay(html, finalUrl) {
  const base = `<base href="${escapeAttr(finalUrl.href)}">`;
  const relayScript = `<script>(function(){
    function route(u){try{return '/api/proxy?url='+encodeURIComponent(new URL(u,document.baseURI).href)}catch(e){return u}}
    document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||a.target==='_blank')return;var h=a.getAttribute('href');if(!h||h.startsWith('#')||h.startsWith('javascript:')||h.startsWith('mailto:')||h.startsWith('tel:'))return;e.preventDefault();location.href=route(h)},true);
    document.addEventListener('submit',function(e){var f=e.target;if(!f||String(f.method||'get').toLowerCase()!=='get')return;e.preventDefault();var u=new URL(f.action||document.baseURI,document.baseURI);new FormData(f).forEach(function(v,k){u.searchParams.append(k,v)});location.href=route(u.href)},true);
  })();<\/script>`;
  const marker = /<head[^>]*>/i;
  if (marker.test(html)) return html.replace(marker, m => m + base + relayScript);
  return `<!doctype html><html><head>${base}${relayScript}</head><body>${html}</body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const target = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!target) return res.status(400).send('Null Relay: missing ?url= target');
  try {
    const { response, finalUrl } = await safeFetch(target);
    const type = (response.headers.get('content-type') || 'text/plain').toLowerCase();
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml') && !type.startsWith('text/plain')) {
      return res.status(415).send('Null Relay: this viewer only relays HTML and text pages');
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BYTES) return res.status(413).send('Null Relay: response too large');
    let text = buffer.toString('utf8');
    if (type.includes('html') || type.includes('xhtml')) text = injectRelay(text, finalUrl);
    res.status(response.ok ? 200 : response.status);
    res.setHeader('Content-Type', type.includes('html') || type.includes('xhtml') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
    res.setHeader('X-Null-Relay-Target', finalUrl.origin);
    return res.send(text);
  } catch (err) {
    return res.status(502).send(`Null Relay blocked or failed: ${err.message}`);
  }
};
