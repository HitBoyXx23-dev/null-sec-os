const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TEXT_TYPES = [
  'text/html', 'application/xhtml+xml', 'text/plain', 'text/css',
  'application/javascript', 'text/javascript', 'application/json',
  'application/xml', 'text/xml', 'image/svg+xml', 'application/manifest+json'
];
const BINARY_TYPES = ['application/wasm', 'application/octet-stream'];
const BINARY_PREFIX = ['image/', 'font/', 'audio/', 'video/'];

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
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

function relayUrl(raw, base, proxyOrigin) {
  try {
    if (!raw || /^(data:|blob:|javascript:|mailto:|tel:|#)/i.test(raw)) return raw;
    const resolved = new URL(raw, base);
    if (resolved.origin === proxyOrigin && resolved.pathname.startsWith('/api/proxy') && resolved.searchParams.has('url')) {
      return resolved.href;
    }
    return proxyOrigin + '/api/proxy?url=' + encodeURIComponent(resolved.href);
  } catch {
    return raw;
  }
}

function rewriteCss(css, base, proxyOrigin) {
  return css
    .replace(/url\((['"]?)(.*?)\1\)/gi, (m, q, u) => `url(${q}${relayUrl(u, base, proxyOrigin)}${q})`)
    .replace(/@import\s+(['"])(.*?)\1/gi, (m, q, u) => `@import ${q}${relayUrl(u, base, proxyOrigin)}${q}`);
}

function injectRelay(html, finalUrl, proxyOrigin) {
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
  html = html.replace(/\s(src|href|poster|action)=(['"])(.*?)\2/gi,
    (m, a, q, u) => ` ${a}=${q}${relayUrl(u, finalUrl, proxyOrigin)}${q}`);
  html = html.replace(/\ssrcset=(['"])(.*?)\1/gi, (m, q, v) => {
    const mapped = v.split(',').map((part) => {
      const p = part.trim().split(/\s+/);
      p[0] = relayUrl(p[0], finalUrl, proxyOrigin);
      return p.join(' ');
    }).join(', ');
    return ` srcset=${q}${mapped}${q}`;
  });

  const base = `<base href="${esc(finalUrl.href)}">`;
  const bridge = `<script>(function(){
    var RELAY=${JSON.stringify(proxyOrigin)};
    function route(u){
      try{
        var x=new URL(u,document.baseURI);
        if(!/^https?:$/.test(x.protocol))return u;
        if(x.origin===RELAY&&x.pathname.indexOf('/api/proxy')===0&&x.searchParams.has('url'))return x.href;
        return RELAY+'/api/proxy?url='+encodeURIComponent(x.href);
      }catch(e){return u}
    }
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');
      if(!a||e.defaultPrevented||e.button!==0)return;
      var h=a.getAttribute('href');
      if(!h||/^(#|javascript:|mailto:|tel:)/i.test(h))return;
      e.preventDefault(); location.href=route(h);
    },true);
    document.addEventListener('submit',function(e){
      var f=e.target;
      if(!f||String(f.method||'get').toLowerCase()!=='get')return;
      e.preventDefault();
      var u=new URL(f.action||document.baseURI,document.baseURI);
      new FormData(f).forEach(function(v,k){u.searchParams.append(k,v)});
      location.href=route(u.href);
    },true);
    var nativeFetch=window.fetch;
    if(nativeFetch)window.fetch=function(input,init){
      try{var u=typeof input==='string'?input:input.url;return nativeFetch.call(this,route(u),init)}
      catch(e){return nativeFetch.call(this,input,init)}
    };
    var NativeXHR=window.XMLHttpRequest;
    if(NativeXHR){
      window.XMLHttpRequest=function(){
        var x=new NativeXHR(),open=x.open;
        x.open=function(m,u){arguments[1]=route(u);return open.apply(x,arguments)};
        return x
      };
      window.XMLHttpRequest.prototype=NativeXHR.prototype
    }
  })();<\/script>`;

  const marker = /<head[^>]*>/i;
  return marker.test(html)
    ? html.replace(marker, (m) => m + base + bridge)
    : `<!doctype html><html><head>${base}${bridge}</head><body>${html}</body></html>`;
}

function cleanDomain(input) {
  const raw = String(input || '').trim().toLowerCase();
  const host = raw.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].replace(/^\.+|\.+$/g, '');
  if (!host || host.length > 253 || !/^[a-z0-9.-]+$/.test(host) || host.includes('..')) throw new Error('Invalid domain');
  return host;
}

function getOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = {
  dns, net, MAX_BYTES, TEXT_TYPES, BINARY_TYPES, BINARY_PREFIX,
  isPrivateIp, assertPublicUrl, safeFetch, rewriteCss, injectRelay, cleanDomain, getOrigin
};
