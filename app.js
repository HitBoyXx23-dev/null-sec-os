const express = require("express");
const path = require("node:path");
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");

const health = require("./api/health");
const qr = require("./api/qr");
const proxy = require("./api/proxy");
const dns = require("./api/osint/dns");
const rdap = require("./api/osint/rdap");
const ct = require("./api/osint/ct");
const headers = require("./api/osint/headers");
const robots = require("./api/osint/robots");
const username = require("./api/osint/username");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

app.get("/api/health", health);
app.get("/api/qr", qr);
app.all("/api/proxy", proxy);
app.get("/api/osint/dns", dns);
app.get("/api/osint/rdap", rdap);
app.get("/api/osint/ct", ct);
app.get("/api/osint/headers", headers);
app.get("/api/osint/robots", robots);
app.get("/api/osint/username", username);


/* ---------------- Dual proxy vendor routes: real UV + Scramjet ---------------- */
let uvStatic = null;
let epoxyStatic = null;
let baremuxStatic = null;
let uvVendorReady = null;

function getUvVendorReady() {
  if (uvVendorReady) return uvVendorReady;
  uvVendorReady = Promise.all([
    import("@titaniumnetwork-dev/ultraviolet"),
    import("@mercuryworkshop/epoxy-transport"),
    import("@mercuryworkshop/bare-mux/node")
  ]).then(([uvMod, epoxyMod, baremuxMod]) => {
    uvStatic = express.static(uvMod.uvPath);
    epoxyStatic = express.static(epoxyMod.epoxyPath);
    baremuxStatic = express.static(baremuxMod.baremuxPath);
    return true;
  }).catch((error) => {
    uvVendorReady = null;
    throw error;
  });
  return uvVendorReady;
}

app.get("/uv/sw.js", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("application/javascript");
  res.sendFile(path.join(__dirname, "public", "uv", "sw.js"));
});

app.use("/uv/", async (req, res, next) => {
  try { await getUvVendorReady(); uvStatic(req, res, next); } catch (e) { next(e); }
});
app.use("/epoxy/", async (req, res, next) => {
  try { await getUvVendorReady(); epoxyStatic(req, res, next); } catch (e) { next(e); }
});
app.use("/baremux/", async (req, res, next) => {
  try { await getUvVendorReady(); baremuxStatic(req, res, next); } catch (e) { next(e); }
});

app.get("/api/uv-status", async (req, res) => {
  try {
    await getUvVendorReady();
    const checks = {};
    for (const asset of ["uv.bundle.js","uv.config.js","uv.sw.js","uv.handler.js"]) {
      checks[asset] = true;
    }
    res.json({
      ok:true,
      staticBase:"/uv/",
      expectedWorker:"/uv/sw.js",
      expectedPrefix:"/uv/service/",
      assets:checks,
      baremux:"/baremux/",
      epoxy:"/epoxy/",
      wisp:"/wisp/"
    });
  } catch (error) {
    res.status(500).json({ok:false,error:error.message});
  }
});

app.get("/api/proxy-status", async (req, res) => {
  const fs = require("node:fs");
  try {
    await getUvVendorReady();
    const sjFiles = [
      "vendor/controller/controller.api.js",
      "vendor/controller/controller.sw.js",
      "vendor/controller/controller.inject.js",
      "vendor/scramjet/scramjet.js",
      "vendor/scramjet/scramjet.wasm",
      "vendor/libcurl/index.mjs"
    ];
    const missing = sjFiles.filter(x => !fs.existsSync(path.join(__dirname, "public", x)));
    res.status(missing.length ? 500 : 200).json({
      ok: missing.length === 0,
      engines: {
        scramjet: { ok: missing.length === 0, missing },
        ultraviolet: { ok: true, routes: ["/uv/", "/baremux/", "/epoxy/"] }
      },
      wisp: "/wisp/"
    });
  } catch (error) {
    res.status(500).json({ ok:false, error:error.message });
  }
});

/* ---------------- Native Null Media data + HLS gateway ---------------- */
const { Readable } = require("node:stream");

const TV_SOURCES = [
  (code) => `https://raw.githubusercontent.com/iptv-org/iptv/master/streams/${code}.m3u`,
  (code) => `https://cdn.jsdelivr.net/gh/iptv-org/iptv@master/streams/${code}.m3u`,
  (code) => `https://raw.githubusercontent.com/iptv-org/iptv/main/streams/${code}.m3u`
];

const COUNTRY_CATALOG = [
['us','United States','US'],['ca','Canada','CA'],['gb','United Kingdom','GB'],['au','Australia','AU'],['nz','New Zealand','NZ'],
['ie','Ireland','IE'],['fr','France','FR'],['de','Germany','DE'],['es','Spain','ES'],['it','Italy','IT'],['pt','Portugal','PT'],['nl','Netherlands','NL'],
['be','Belgium','BE'],['ch','Switzerland','CH'],['at','Austria','AT'],['se','Sweden','SE'],['no','Norway','NO'],['dk','Denmark','DK'],['fi','Finland','FI'],
['pl','Poland','PL'],['cz','Czechia','CZ'],['sk','Slovakia','SK'],['hu','Hungary','HU'],['ro','Romania','RO'],['bg','Bulgaria','BG'],['gr','Greece','GR'],
['tr','Turkey','TR'],['ua','Ukraine','UA'],['hr','Croatia','HR'],['rs','Serbia','RS'],['si','Slovenia','SI'],['ba','Bosnia & Herzegovina','BA'],
['jp','Japan','JP'],['kr','South Korea','KR'],['cn','China','CN'],['hk','Hong Kong','HK'],['tw','Taiwan','TW'],['in','India','IN'],['pk','Pakistan','PK'],
['bd','Bangladesh','BD'],['id','Indonesia','ID'],['my','Malaysia','MY'],['sg','Singapore','SG'],['th','Thailand','TH'],['vn','Vietnam','VN'],['ph','Philippines','PH'],
['br','Brazil','BR'],['mx','Mexico','MX'],['ar','Argentina','AR'],['cl','Chile','CL'],['co','Colombia','CO'],['pe','Peru','PE'],['uy','Uruguay','UY'],['ve','Venezuela','VE'],
['za','South Africa','ZA'],['ng','Nigeria','NG'],['ke','Kenya','KE'],['gh','Ghana','GH'],['eg','Egypt','EG'],['ma','Morocco','MA'],['dz','Algeria','DZ'],['tn','Tunisia','TN'],
['il','Israel','IL'],['ae','United Arab Emirates','AE'],['sa','Saudi Arabia','SA'],['qa','Qatar','QA'],['kw','Kuwait','KW'],['jo','Jordan','JO'],['lb','Lebanon','LB'],
['ru','Russia','RU'],['kz','Kazakhstan','KZ'],['ge','Georgia','GE'],['az','Azerbaijan','AZ']
].map(([code,name,flag])=>({code,name,flag}));

function parseM3U(text) {
  const lines=String(text||'').split(/\r?\n/); const out=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim(); if(!line.startsWith('#EXTINF')) continue;
    const info=line;
    let j=i+1; while(j<lines.length && (!lines[j].trim() || lines[j].trim().startsWith('#'))) j++;
    const url=String(lines[j]||'').trim(); if(!/^https?:\/\//i.test(url)) continue;
    const attr=(name)=>{const m=info.match(new RegExp(name+'="([^"]*)"','i')); return m?m[1]:''};
    const comma=info.indexOf(',');
    const title=(comma>=0?info.slice(comma+1):attr('tvg-name')||'Untitled').trim().slice(0,180);
    out.push({title,url,logo:attr('tvg-logo'),group:attr('group-title'),id:attr('tvg-id'),language:attr('tvg-language')});
    i=j;
  }
  return out;
}

app.get('/null-data/tv/countries', (req,res)=>{
  res.setHeader('Cache-Control','public,max-age=3600,s-maxage=86400');
  res.json({ok:true,items:COUNTRY_CATALOG});
});

app.get('/null-data/tv/playlist/:code', async (req,res)=>{
  const code=String(req.params.code||'').toLowerCase();
  if(!/^[a-z]{2}$/.test(code)) return res.status(400).json({ok:false,error:'Invalid country code'});
  let last='';
  for(const makeUrl of TV_SOURCES){
    try{
      const r=await fetch(makeUrl(code),{headers:{'User-Agent':'Null-Sec-OS/6.4'},signal:AbortSignal.timeout(12000)});
      if(!r.ok){last='HTTP '+r.status;continue}
      const text=await r.text();
      if(!text.includes('#EXTM3U')&&!text.includes('#EXTINF')){last='Invalid playlist';continue}
      const items=parseM3U(text);
      res.setHeader('Cache-Control','public,max-age=120,s-maxage=300');
      return res.json({ok:true,code,items,source:'iptv-org'});
    }catch(e){last=e.message||String(e)}
  }
  res.status(502).json({ok:false,error:'No playlist mirror responded',detail:last});
});

function blockedMediaHost(hostname){
  const h=String(hostname||'').toLowerCase();
  if(!h||h==='localhost'||h.endsWith('.local')) return true;
  if(h==='0.0.0.0'||h==='127.0.0.1'||h==='::1') return true;
  if(/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)) return true;
  const m=h.match(/^172\.(\d+)\./); if(m&&Number(m[1])>=16&&Number(m[1])<=31) return true;
  return false;
}
function mediaGatewayUrl(raw){return '/null-media/hls?u='+encodeURIComponent(raw)}
function rewriteM3U(text,base){
  const rewrite=(raw)=>{try{return mediaGatewayUrl(new URL(raw,base).href)}catch{return raw}};
  return String(text).split(/\r?\n/).map(line=>{
    if(!line)return line;
    if(line.startsWith('#')) return line.replace(/URI="([^"]+)"/g,(_,u)=>`URI="${rewrite(u)}"`);
    return rewrite(line.trim());
  }).join('\n');
}

app.get('/null-media/hls', async (req,res)=>{
  try{
    const raw=String(req.query.u||''); if(raw.length>4096) return res.status(400).end('URL too long');
    const u=new URL(raw); if(!['http:','https:'].includes(u.protocol)||blockedMediaHost(u.hostname)) return res.status(400).end('Blocked media URL');
    if(u.port && !['80','443','8080','8000','8443'].includes(u.port)) return res.status(400).end('Blocked media port');
    const headers={'User-Agent':'Mozilla/5.0 NullSecMedia/6.4','Accept':'*/*'};
    if(req.headers.range)headers.Range=req.headers.range;
    const upstream=await fetch(u,{headers,redirect:'follow',signal:AbortSignal.timeout(20000)});
    const ct=String(upstream.headers.get('content-type')||'application/octet-stream');
    const finalUrl=upstream.url||u.href;
    res.status(upstream.status);
    for(const h of ['content-type','content-length','content-range','accept-ranges','cache-control']){const v=upstream.headers.get(h);if(v)res.setHeader(h,v)}
    res.setHeader('Access-Control-Allow-Origin','*');
    if(/mpegurl|m3u8|application\/vnd\.apple\.mpegurl|application\/x-mpegurl/i.test(ct)||/\.m3u8?(?:$|\?)/i.test(finalUrl)){
      const text=await upstream.text();
      res.removeHeader('content-length');
      res.setHeader('content-type','application/vnd.apple.mpegurl; charset=utf-8');
      return res.send(rewriteM3U(text,finalUrl));
    }
    if(!upstream.body)return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  }catch(e){res.status(502).end('Media gateway failed')}
});



/* ---------------- Native media catalog + RTC config ---------------- */
app.get("/null-data/rtc-config", (req, res) => {
  const iceServers = [
    { urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }
  ];
  const turnUrl = process.env.TURN_URL;
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;
  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({ urls: turnUrl.split(",").map(x => x.trim()).filter(Boolean), username: turnUsername, credential: turnCredential });
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok:true, iceServers, turnConfigured:Boolean(turnUrl && turnUsername && turnCredential) });
});

const HITBOYSTREAM_TMDB_FALLBACK = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyYmYwZmFlZWIzZjc3OWRhZDdkOWM3MjY4ZGM0NmNmNiIsIm5iZiI6MTcyMzkzMjM1MS4xNDEyNzIsInN1YiI6IjY2YzExZTJmOTk5ZmYwYTFjNTE2YWRhNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.vwZW4D57fT-wlqLgHt_4vhnfTbuIwFOOrWE2DBlRHMQ";

async function tmdbFetch(pathname, params = {}) {
  const token = process.env.TMDB_TOKEN || HITBOYSTREAM_TMDB_FALLBACK;
  const url = new URL("https://api.themoviedb.org/3/" + String(pathname || "").replace(/^\/+/, ""));
  for (const [k,v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k, String(v));
  }
  const r = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + token,
      "User-Agent": "Null-Sec-OS/6.7"
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!r.ok) throw new Error("TMDB HTTP " + r.status);
  return r.json();
}

function tmdbImage(pathname, size="w500") {
  return pathname ? `https://image.tmdb.org/t/p/${size}${pathname}` : "";
}

function mapTmdbItem(x, type) {
  const isMovie = type === "movie";
  const date = isMovie ? x.release_date : x.first_air_date;
  return {
    id: String(x.id || ""),
    type,
    title: String(isMovie ? (x.title || x.original_title || "") : (x.name || x.original_name || "")),
    originalTitle: String(isMovie ? (x.original_title || "") : (x.original_name || "")),
    year: String(date || "").slice(0,4),
    date: String(date || ""),
    poster: tmdbImage(x.poster_path, "w500"),
    backdrop: tmdbImage(x.backdrop_path, "w1280"),
    description: String(x.overview || "").slice(0,1600),
    rating: Number(x.vote_average || 0),
    votes: Number(x.vote_count || 0),
    popularity: Number(x.popularity || 0),
    language: String(x.original_language || "")
  };
}

app.get("/null-data/catalog", async (req, res) => {
  try {
    const type = req.query.type === "series" ? "series" : "movie";
    const media = type === "movie" ? "movie" : "tv";
    const q = String(req.query.q || "").trim().slice(0,100);
    const page = Math.max(1, Math.min(20, Number(req.query.page || 1) || 1));
    const language = String(req.query.language || "en-US").slice(0,12);

    const data = q
      ? await tmdbFetch(`search/${media}`, {
          query:q, include_adult:"false", language, page
        })
      : await tmdbFetch(`trending/${media}/week`, {
          language, page
        });

    const now = Date.now();
    const items = (Array.isArray(data.results) ? data.results : [])
      .filter(x => {
        const date = type === "movie" ? x.release_date : x.first_air_date;
        return !date || new Date(date).getTime() <= now;
      })
      .map(x => mapTmdbItem(x, type))
      .filter(x => x.id && x.title);

    res.setHeader("Cache-Control", q ? "public,max-age=60,s-maxage=120" : "public,max-age=300,s-maxage=900");
    res.json({ok:true,type,query:q,page,totalPages:Number(data.total_pages||1),items});
  } catch (e) {
    res.status(502).json({ok:false,error:e?.name==="TimeoutError" ? "TMDB timed out" : (e.message || "TMDB catalog failed")});
  }
});

app.get("/null-data/catalog/details", async (req, res) => {
  try {
    const type = req.query.type === "series" ? "series" : "movie";
    const media = type === "movie" ? "movie" : "tv";
    const id = String(req.query.id || "");
    if (!/^\d{1,12}$/.test(id)) return res.status(400).json({ok:false,error:"Invalid title id"});
    const language = String(req.query.language || "en-US").slice(0,12);

    const data = await tmdbFetch(`${media}/${id}`, {
      language,
      append_to_response:"videos,watch/providers,external_ids"
    });

    const trailerCandidates = data?.videos?.results || [];
    const trailer = trailerCandidates.find(v => v.site==="YouTube" && v.type==="Trailer" && v.official)
      || trailerCandidates.find(v => v.site==="YouTube" && v.type==="Trailer")
      || trailerCandidates.find(v => v.site==="YouTube");

    const base = mapTmdbItem({
      ...data,
      title:data.title,
      name:data.name,
      poster_path:data.poster_path,
      backdrop_path:data.backdrop_path,
      overview:data.overview,
      release_date:data.release_date,
      first_air_date:data.first_air_date,
      vote_average:data.vote_average,
      vote_count:data.vote_count,
      popularity:data.popularity,
      original_language:data.original_language
    }, type);

    const providers = data?.["watch/providers"]?.results?.US || null;
    res.setHeader("Cache-Control","public,max-age=300,s-maxage=900");
    res.json({
      ok:true,
      item:{
        ...base,
        runtime:type==="movie" ? Number(data.runtime||0) : 0,
        status:String(data.status||""),
        genres:(data.genres||[]).map(g=>g.name).filter(Boolean),
        homepage:String(data.homepage||""),
        imdbId:String(data.imdb_id || data?.external_ids?.imdb_id || ""),
        seasons:type==="series" ? (data.seasons||[]).filter(s=>Number(s.season_number)>=0).map(s=>({
          id:String(s.id||""),
          seasonNumber:Number(s.season_number||0),
          name:String(s.name||`Season ${s.season_number}`),
          episodeCount:Number(s.episode_count||0),
          airDate:String(s.air_date||""),
          poster:tmdbImage(s.poster_path,"w500")
        })) : [],
        numberOfSeasons:Number(data.number_of_seasons||0),
        numberOfEpisodes:Number(data.number_of_episodes||0),
        trailer:trailer ? {
          key:String(trailer.key||""),
          name:String(trailer.name||"Trailer"),
          url:"https://www.youtube.com/watch?v="+encodeURIComponent(String(trailer.key||""))
        } : null,
        providers:providers ? {
          link:String(providers.link||""),
          flatrate:(providers.flatrate||[]).map(p=>({name:String(p.provider_name||""),logo:tmdbImage(p.logo_path,"w92")})),
          rent:(providers.rent||[]).map(p=>({name:String(p.provider_name||""),logo:tmdbImage(p.logo_path,"w92")})),
          buy:(providers.buy||[]).map(p=>({name:String(p.provider_name||""),logo:tmdbImage(p.logo_path,"w92")}))
        } : null
      }
    });
  } catch (e) {
    res.status(502).json({ok:false,error:e?.name==="TimeoutError" ? "TMDB timed out" : (e.message || "TMDB details failed")});
  }
});

app.get("/null-data/catalog/season", async (req, res) => {
  try {
    const id = String(req.query.id || "");
    const season = Number(req.query.season);
    if (!/^\d{1,12}$/.test(id) || !Number.isInteger(season) || season < 0 || season > 200)
      return res.status(400).json({ok:false,error:"Invalid season request"});

    const data = await tmdbFetch(`tv/${id}/season/${season}`, {language:"en-US"});
    const episodes = (data.episodes||[]).map(ep=>({
      id:String(ep.id||""),
      episodeNumber:Number(ep.episode_number||0),
      seasonNumber:Number(ep.season_number||season),
      title:String(ep.name||`Episode ${ep.episode_number}`),
      description:String(ep.overview||"").slice(0,1000),
      airDate:String(ep.air_date||""),
      runtime:Number(ep.runtime||0),
      rating:Number(ep.vote_average||0),
      still:tmdbImage(ep.still_path,"w780")
    }));

    res.setHeader("Cache-Control","public,max-age=300,s-maxage=900");
    res.json({
      ok:true,
      season:{
        id:String(data.id||""),
        name:String(data.name||`Season ${season}`),
        seasonNumber:Number(data.season_number||season),
        description:String(data.overview||"").slice(0,1400),
        poster:tmdbImage(data.poster_path,"w500"),
        episodes
      }
    });
  } catch (e) {
    res.status(502).json({ok:false,error:e?.name==="TimeoutError" ? "TMDB timed out" : (e.message || "TMDB season failed")});
  }
});


const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  }
}));

let wisp = null;
let wispReadyPromise = null;

function getWispReady() {
  if (wispReadyPromise) return wispReadyPromise;
  wispReadyPromise = import("@mercuryworkshop/wisp-js/server")
    .then((mod) => {
      wisp = mod.server;
      return wisp;
    })
    .catch((error) => {
      wispReadyPromise = null;
      throw error;
    });
  return wispReadyPromise;
}

app.get("/api/scramjet-status", (req, res) => {
  const fs = require("node:fs");
  const files = {
    controllerApi: path.join(publicDir, "vendor/controller/controller.api.js"),
    controllerSw: path.join(publicDir, "vendor/controller/controller.sw.js"),
    controllerInject: path.join(publicDir, "vendor/controller/controller.inject.js"),
    scramjetJs: path.join(publicDir, "vendor/scramjet/scramjet.js"),
    scramjetWasm: path.join(publicDir, "vendor/scramjet/scramjet.wasm"),
    libcurl: path.join(publicDir, "vendor/libcurl/index.mjs")
  };
  const missing = Object.entries(files).filter(([, file]) => !fs.existsSync(file)).map(([name]) => name);
  res.status(missing.length ? 500 : 200).json({
    ok: missing.length === 0,
    mode: "vendored-static-assets",
    missing,
    urls: {
      controllerApi: "/vendor/controller/controller.api.js",
      controllerSw: "/vendor/controller/controller.sw.js",
      controllerInject: "/vendor/controller/controller.inject.js",
      scramjetJs: "/vendor/scramjet/scramjet.js",
      scramjetWasm: "/vendor/scramjet/scramjet.wasm",
      libcurl: "/vendor/libcurl/index.mjs",
      serviceWorker: "/sw.js",
      wisp: "/wisp/"
    }
  });
});


// Scramjet rewritten navigations must reach the app shell so the root-scoped
// service worker can intercept and route them. Returning JSON 404 here breaks
// controller-managed navigation such as /~/sj/<session>/... .
app.get(/^\/~\/sj\/.*/, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/vendor/") || req.path.startsWith("/uv/") || req.path.startsWith("/epoxy/") || req.path.startsWith("/baremux/")) {
    return next();
  }
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Null Sec server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = createServer(app);

/* ---------------- Realtime username chat ---------------- */
const chatWss = new WebSocketServer({ noServer: true });
const users = new Map();
const recentPublic = [];
const MAX_PUBLIC_HISTORY = 50;

function validName(value) {
  const name = String(value || "").trim();
  return /^[A-Za-z0-9_]{3,20}$/.test(name) ? name : null;
}
function send(ws, packet) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(packet));
}
function presence() {
  return [...users.entries()].map(([name, x]) => ({ username: name, pub: x.pub }));
}
function broadcast(packet, except = null) {
  const raw = JSON.stringify(packet);
  for (const { ws } of users.values()) {
    if (ws !== except && ws.readyState === ws.OPEN) ws.send(raw);
  }
}
function publishPresence() {
  broadcast({ type: "presence", users: presence() });
}

chatWss.on("connection", (ws) => {
  let current = null;

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      return send(ws, { type: "error", message: "Invalid message" });
    }

    if (msg.type === "hello") {
      const name = validName(msg.username);
      const pub = typeof msg.pub === "string" && msg.pub.length < 512 ? msg.pub : null;
      if (!name || !pub) return send(ws, { type: "error", message: "Invalid username or public key" });
      if (users.has(name) && users.get(name).ws !== ws) {
        return send(ws, { type: "error", message: "Username is already online" });
      }
      if (current && current !== name) users.delete(current);
      current = name;
      users.set(name, { ws, pub, joined: Date.now() });
      send(ws, { type: "ready", username: name });
      send(ws, { type: "history", messages: recentPublic });
      publishPresence();
      broadcast({ type: "system", text: `${name} joined public chat` }, ws);
      return;
    }

    if (!current) return send(ws, { type: "error", message: "Choose a username first" });

    if (msg.type === "public") {
      const text = String(msg.text || "").slice(0, 2000);
      if (!text.trim()) return;
      const packet = { type: "public", from: current, text, at: Date.now() };
      recentPublic.push(packet);
      if (recentPublic.length > MAX_PUBLIC_HISTORY) recentPublic.shift();
      broadcast(packet);
      return;
    }


    if (["voice_offer", "voice_answer", "voice_ice", "voice_hangup"].includes(msg.type)) {
      const to = validName(msg.to);
      const peer = to && users.get(to);
      if (!peer) return send(ws, { type: "error", message: "Voice peer is not online" });

      const packet = {
        type: msg.type,
        from: current,
        to,
        at: Date.now()
      };

      if (msg.type === "voice_offer" || msg.type === "voice_answer") {
        if (!msg.sdp || typeof msg.sdp !== "object") return;
        packet.sdp = msg.sdp;
      } else if (msg.type === "voice_ice") {
        if (!msg.candidate || typeof msg.candidate !== "object") return;
        packet.candidate = msg.candidate;
      }

      send(peer.ws, packet);
      return;
    }

    if (msg.type === "dm") {
      const to = validName(msg.to);
      const peer = to && users.get(to);
      if (!peer) return send(ws, { type: "error", message: "User is not online" });
      const envelope = {
        type: "dm",
        from: current,
        to,
        iv: String(msg.iv || "").slice(0, 128),
        ct: String(msg.ct || "").slice(0, 12000),
        pub: users.get(current).pub,
        at: Date.now()
      };
      send(peer.ws, envelope);
      send(ws, { type: "dm_ack", to, at: envelope.at });
      return;
    }
  });

  ws.on("close", () => {
    if (current && users.get(current)?.ws === ws) {
      users.delete(current);
      broadcast({ type: "system", text: `${current} left public chat` });
      publishPresence();
    }
  });
});

/* ---------------- Wisp + chat upgrades ---------------- */
server.on("upgrade", async (req, socket, head) => {
  try {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;

    if (pathname === "/chat/" || pathname === "/chat") {
      chatWss.handleUpgrade(req, socket, head, (ws) => chatWss.emit("connection", ws, req));
      return;
    }

    if (pathname === "/wisp/") {
      await getWispReady();
      req.url = pathname;
      wisp.routeRequest(req, socket, head);
      return;
    }
  } catch (e) {
    console.error("upgrade error", e);
  }
  socket.end();
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`Null Sec OS listening on ${port}`));
}

module.exports = server;
