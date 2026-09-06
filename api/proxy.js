const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TEXT_TYPES = ['text/html','application/xhtml+xml','text/plain','text/css','application/javascript','text/javascript','application/json','application/xml','text/xml','image/svg+xml'];
const BINARY_PREFIX = ['image/','font/','audio/'];

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
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Local targets are blocked');
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(r => isPrivateIp(r.address))) throw new Error('Private or unresolved targets are blocked');
  return url;
}

async function safeFetch(start) {
  let current = await assertPublicUrl(start);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      method: 'GET', redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 NullSecRelay/3.0',
        'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.8'
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

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function relayUrl(raw, base){
  try {
    if (!raw || /^(data:|blob:|javascript:|mailto:|tel:|#)/i.test(raw)) return raw;
    return '/api/proxy?url=' + encodeURIComponent(new URL(raw, base).href);
  } catch { return raw; }
}
function rewriteCss(css, base){return css.replace(/url\((['"]?)(.*?)\1\)/gi,(m,q,u)=>`url(${q}${relayUrl(u,base)}${q})`).replace(/@import\s+(['"])(.*?)\1/gi,(m,q,u)=>`@import ${q}${relayUrl(u,base)}${q}`)}
function injectRelay(html, finalUrl) {
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi,'');
  html = html.replace(/\s(src|href|poster|action)=(['"])(.*?)\2/gi,(m,a,q,u)=>` ${a}=${q}${relayUrl(u,finalUrl)}${q}`);
  html = html.replace(/\ssrcset=(['"])(.*?)\1/gi,(m,q,v)=>` srcset=${q}${v.split(',').map(part=>{const p=part.trim().split(/\s+/);p[0]=relayUrl(p[0],finalUrl);return p.join(' ')}).join(', ')}${q}`);
  const base = `<base href="${esc(finalUrl.href)}">`;
  const bridge = `<script>(function(){
    var ORIGIN=${JSON.stringify(finalUrl.origin)};
    function route(u){try{var x=new URL(u,document.baseURI);if(!/^https?:$/.test(x.protocol))return u;return '/api/proxy?url='+encodeURIComponent(x.href)}catch(e){return u}}
    document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||a.target==='_blank')return;var h=a.getAttribute('href');if(!h||/^(#|javascript:|mailto:|tel:)/i.test(h))return;e.preventDefault();location.href=route(h)},true);
    document.addEventListener('submit',function(e){var f=e.target;if(!f||String(f.method||'get').toLowerCase()!=='get')return;e.preventDefault();var u=new URL(f.action||document.baseURI,document.baseURI);new FormData(f).forEach(function(v,k){u.searchParams.append(k,v)});location.href=route(u.href)},true);
  })();<\/script>`;
  const marker=/<head[^>]*>/i;
  return marker.test(html)?html.replace(marker,m=>m+base+bridge):`<!doctype html><html><head>${base}${bridge}</head><body>${html}</body></html>`;
}

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET') return res.status(405).json({error:'GET only'});
  const target=Array.isArray(req.query.url)?req.query.url[0]:req.query.url;
  if(!target) return res.status(400).send('Null Relay: missing ?url= target');
  try{
    const {response,finalUrl}=await safeFetch(target);
    const type=(response.headers.get('content-type')||'application/octet-stream').toLowerCase();
    const length=Number(response.headers.get('content-length')||0);
    if(length>MAX_BYTES) return res.status(413).send('Null Relay: response too large');
    const allowed=TEXT_TYPES.some(t=>type.includes(t))||BINARY_PREFIX.some(t=>type.startsWith(t));
    if(!allowed) return res.status(415).send('Null Relay: unsupported content type');
    const buffer=Buffer.from(await response.arrayBuffer());
    if(buffer.length>MAX_BYTES) return res.status(413).send('Null Relay: response too large');
    res.status(response.ok?200:response.status);
    res.setHeader('X-Null-Relay-Target',finalUrl.origin);
    if(type.includes('text/html')||type.includes('application/xhtml+xml')){
      res.setHeader('Content-Type','text/html; charset=utf-8');
      return res.send(injectRelay(buffer.toString('utf8'),finalUrl));
    }
    if(type.includes('text/css')){
      res.setHeader('Content-Type','text/css; charset=utf-8');
      return res.send(rewriteCss(buffer.toString('utf8'),finalUrl));
    }
    res.setHeader('Content-Type',response.headers.get('content-type')||'application/octet-stream');
    return res.send(buffer);
  }catch(err){return res.status(502).send(`Null Relay blocked or failed: ${err.message}`)}
};
