function cleanText(value, max = 500) {
  if (Array.isArray(value)) value = value[0];
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeId(value) {
  const id = String(value || "");
  return /^[A-Za-z0-9._-]{1,160}$/.test(id) ? id : null;
}
function safeFile(value) {
  const name = String(value || "");
  if (!name || name.length > 500 || name.includes("..") || name.startsWith("/") || name.includes("\\")) return null;
  return name;
}
function mediaFiles(files) {
  return (Array.isArray(files) ? files : [])
    .filter(f => f && f.name && !String(f.name).startsWith("__"))
    .map(f => ({name:String(f.name),size:Number(f.size||0),format:String(f.format||"").toLowerCase(),source:String(f.source||"")}))
    .filter(f => {
      const n=f.name.toLowerCase();
      return n.endsWith('.mp4')||n.endsWith('.webm')||n.endsWith('.ogv')||f.format.includes('mpeg4')||f.format.includes('h.264');
    })
    .sort((a,b)=>{
      const rank=x=>x.name.toLowerCase().endsWith('.mp4')?0:x.name.toLowerCase().endsWith('.webm')?1:2;
      return rank(a)-rank(b)||b.size-a.size;
    });
}
function archiveHosts(data) {
  const out=[];
  for (const h of [data?.d1,data?.d2,'archive.org']) {
    const host=String(h||'').trim().toLowerCase();
    if (/^[a-z0-9.-]+$/.test(host) && (host==='archive.org'||host.endsWith('.archive.org')) && !out.includes(host)) out.push(host);
  }
  return out;
}
async function metadata(id) {
  const r=await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`,{headers:{'User-Agent':'Null-Sec-OS/6.2'},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error('Archive metadata unavailable');
  return r.json();
}

async function catalog(req,res) {
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');
  try {
    const mode=String(req.query.mode||'search');
    if(mode==='details') {
      const id=safeId(req.query.id); if(!id) return res.status(400).json({error:'Invalid identifier'});
      const data=await metadata(id), meta=data.metadata||{}, files=mediaFiles(data.files), file=files[0]||null, hosts=archiveHosts(data);
      const mirrors=file?hosts.map((host,i)=>({label:i===0?'PRIMARY':`MIRROR ${i}`,host,url:`https://${host}/download/${encodeURIComponent(id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`})):[];
      return res.json({
        id,title:cleanText(meta.title,180)||id,description:cleanText(meta.description,1400),year:cleanText(meta.year||meta.date,40),creator:cleanText(meta.creator,180),
        thumbnail:`https://archive.org/services/img/${encodeURIComponent(id)}`,page:`https://archive.org/details/${encodeURIComponent(id)}`,
        media:file?{name:file.name,format:file.format,stream:`/api/media/stream?id=${encodeURIComponent(id)}&file=${encodeURIComponent(file.name)}`,mirrors}:null
      });
    }
    const q=cleanText(req.query.q,120), page=Math.max(1,Math.min(50,Number(req.query.page||1)||1));
    let query='(collection:feature_films OR collection:prelinger) AND mediatype:movies';
    if(q){const safe=q.replace(/["\\]/g,' ').replace(/[^\w\s.\'-]/g,' ').trim(); if(safe)query+=` AND (title:("${safe}") OR description:("${safe}") OR creator:("${safe}"))`;}
    const params=new URLSearchParams(); params.set('q',query); ['identifier','title','description','year','creator','downloads'].forEach(x=>params.append('fl[]',x)); params.set('rows','30');params.set('page',String(page));params.set('sort[]','downloads desc');params.set('output','json');
    const r=await fetch(`https://archive.org/advancedsearch.php?${params}`,{headers:{'User-Agent':'Null-Sec-OS/6.2'},signal:AbortSignal.timeout(12000)});
    if(!r.ok)return res.status(502).json({error:'Archive search unavailable'});
    const data=await r.json(), docs=data?.response?.docs||[];
    const items=docs.map(d=>({id:String(d.identifier||''),title:cleanText(d.title,160)||String(d.identifier||'Untitled'),description:cleanText(d.description,260),year:cleanText(d.year,24),creator:cleanText(d.creator,120),downloads:Number(d.downloads||0),thumbnail:`https://archive.org/services/img/${encodeURIComponent(String(d.identifier||''))}`})).filter(x=>x.id);
    res.json({query:q,page,total:Number(data?.response?.numFound||items.length),items});
  } catch(error) { res.status(500).json({error:error?.name==='TimeoutError'?'Media source timed out':'Media catalog error'}); }
}

async function stream(req,res) {
  const id=safeId(req.query.id), file=safeFile(req.query.file);
  if(!id||!file)return res.status(400).json({error:'Invalid media request'});
  try {
    const data=await metadata(id), allowed=mediaFiles(data.files).some(x=>x.name===file);
    if(!allowed)return res.status(404).json({error:'Media file not found'});
    const hosts=archiveHosts(data), encoded=file.split('/').map(encodeURIComponent).join('/'), range=req.headers.range;
    let upstream=null,lastStatus=502;
    for(const host of hosts){
      try{
        const headers={'User-Agent':'Null-Sec-OS/6.2'}; if(range)headers.Range=range;
        const r=await fetch(`https://${host}/download/${encodeURIComponent(id)}/${encoded}`,{headers,redirect:'follow',signal:AbortSignal.timeout(15000)});
        lastStatus=r.status;
        if(r.ok||r.status===206){upstream=r;break;}
      }catch{}
    }
    if(!upstream)return res.status(lastStatus||502).json({error:'All open-media mirrors failed'});
    for(const h of ['content-type','content-length','content-range','accept-ranges','etag','last-modified']){const v=upstream.headers.get(h);if(v)res.setHeader(h,v)}
    res.setHeader('Cache-Control','public, max-age=3600'); res.status(upstream.status);
    if(!upstream.body)return res.end();
    const {Readable}=require('node:stream'); Readable.fromWeb(upstream.body).pipe(res);
  } catch(error){ if(!res.headersSent)res.status(502).json({error:'Open-media stream unavailable'}); else res.end(); }
}

module.exports=catalog;
module.exports.stream=stream;
