const desktop=document.querySelector('#desktop');
const boot=document.querySelector('#boot');
const layer=document.querySelector('#window-layer');
const tpl=document.querySelector('#window-template');
const taskButtons=document.querySelector('#task-buttons');
const startMenu=document.querySelector('#start-menu');
let z=10,seq=0;
const wins=new Map();
const state={
  notes:localStorage.getItem('nullsec.notes')||'[ NULL SEC SCRATCHPAD ]\n\nOperator notes are stored locally in this browser.',
  browserMode:localStorage.getItem('nullsec.browserMode')||'relay'
};

const bootLines=['NULL SEC BOOTLOADER 2.0','[OK] mounting virtual workspace','[OK] loading window manager','[OK] initializing local vault','[OK] binding relay interface','[OK] operator: hitboyxx23','[OK] session ready'];
let bi=0;const bootLog=document.querySelector('#boot-log');
const bootTimer=setInterval(()=>{if(bi<bootLines.length){bootLog.textContent+=bootLines[bi++]+'\n'}else clearInterval(bootTimer)},145);
setTimeout(()=>{boot.classList.add('hidden');desktop.classList.remove('hidden');openApp('terminal')},1600);

function tickClock(){const d=new Date();document.querySelector('#clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});document.querySelector('#hud-time').textContent=d.toISOString().replace('T',' // ').slice(0,19)}
tickClock();setInterval(tickClock,1000);
window.addEventListener('online',updateNet);window.addEventListener('offline',updateNet);updateNet();checkApi();
function updateNet(){const el=document.querySelector('#net-status');const ok=navigator.onLine;el.textContent=ok?'NET ●':'NET ○';el.className=ok?'ok':'bad'}
async function checkApi(){const el=document.querySelector('#api-status');try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw 0;el.textContent='RELAY ●';el.className='ok'}catch{el.textContent='RELAY ○';el.className='bad'}}

const apps={
  browser:{title:'NULL RELAY // WEB',render:renderBrowser},
  terminal:{title:'NULLSH // TERMINAL',render:renderTerminal},
  files:{title:'VAULT // FILES',render:renderFiles},
  ops:{title:'OPS CENTER // TELEMETRY',render:renderOps},
  notes:{title:'SCRATCHPAD // NOTES',render:renderNotes},
  settings:{title:'SYSTEM // CONFIG',render:renderSettings},
  about:{title:'NULL SEC // SYSTEM INFO',render:renderAbout}
};

document.addEventListener('click',e=>{const opener=e.target.closest('[data-open]');if(opener){openApp(opener.dataset.open);startMenu.classList.add('hidden')}});
document.querySelector('#start-btn').onclick=()=>startMenu.classList.toggle('hidden');
document.querySelector('#restart-btn').onclick=()=>location.reload();
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#start-menu')&&!e.target.closest('#start-btn'))startMenu.classList.add('hidden')});

function openApp(id){
  if(wins.has(id)){const w=wins.get(id).el;w.classList.remove('hidden');focusWin(w);return}
  const app=apps[id];if(!app)return;
  const el=tpl.content.firstElementChild.cloneNode(true);el.dataset.app=id;el.dataset.win=++seq;
  el.style.left=`${11+seq*2.2}%`;el.style.top=`${7+seq*2}%`;el.querySelector('.title').textContent=app.title;
  layer.append(el);app.render(el.querySelector('.window-body'),el);
  const task=document.createElement('button');task.className='task-app active';task.textContent=app.title.split('//')[0].trim();task.onclick=()=>toggleTask(id);
  taskButtons.append(task);wins.set(id,{el,task});wireWindow(el,id);focusWin(el);
}
function wireWindow(el,id){
  const bar=el.querySelector('.titlebar');let drag=null;
  bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||el.classList.contains('maximized'))return;focusWin(el);drag={x:e.clientX,y:e.clientY,l:el.offsetLeft,t:el.offsetTop};bar.setPointerCapture(e.pointerId)});
  bar.addEventListener('pointermove',e=>{if(!drag)return;el.style.left=Math.max(0,drag.l+e.clientX-drag.x)+'px';el.style.top=Math.max(0,drag.t+e.clientY-drag.y)+'px'});bar.addEventListener('pointerup',()=>drag=null);
  el.addEventListener('pointerdown',()=>focusWin(el));el.querySelector('[data-action=close]').onclick=()=>closeWin(id);
  el.querySelector('[data-action=minimize]').onclick=()=>{el.classList.add('hidden');wins.get(id).task.classList.remove('active')};
  el.querySelector('[data-action=maximize]').onclick=()=>el.classList.toggle('maximized');
  const r=el.querySelector('.resize-handle');let rs=null;r.onpointerdown=e=>{rs={x:e.clientX,y:e.clientY,w:el.offsetWidth,h:el.offsetHeight};r.setPointerCapture(e.pointerId)};r.onpointermove=e=>{if(!rs||el.classList.contains('maximized'))return;el.style.width=Math.max(330,rs.w+e.clientX-rs.x)+'px';el.style.height=Math.max(230,rs.h+e.clientY-rs.y)+'px'};r.onpointerup=()=>rs=null;
}
function focusWin(el){z++;el.style.zIndex=z;document.querySelectorAll('.window').forEach(w=>w.classList.toggle('focused',w===el));for(const {el:w,task} of wins.values())task.classList.toggle('active',w===el&&!w.classList.contains('hidden'))}
function closeWin(id){const x=wins.get(id);if(!x)return;x.el.remove();x.task.remove();wins.delete(id)}
function toggleTask(id){const x=wins.get(id);if(!x)return;if(x.el.classList.contains('hidden')){x.el.classList.remove('hidden');focusWin(x.el)}else if(x.el.classList.contains('focused')){x.el.classList.add('hidden');x.task.classList.remove('active')}else focusWin(x.el)}

function normalizeTarget(raw){raw=(raw||'').trim();if(!raw)return'';if(/^https?:\/\//i.test(raw))return raw;if(raw.includes('.')&&!raw.includes(' '))return'https://'+raw;return'https://www.google.com/search?q='+encodeURIComponent(raw)}
function renderBrowser(body){
  body.innerHTML=`<div class="browser"><div class="browser-bar"><button class="back" title="Back">←</button><button class="home" title="Home">⌂</button><button class="reload" title="Reload">↻</button><input class="url" placeholder="target.domain or search query"><select class="mode"><option value="relay">SECURE RELAY</option><option value="direct">DIRECT FRAME</option></select><button class="go">↵</button></div><div class="browser-view"><div class="browser-home"><div><div class="glyph">◎</div><h1>NULL RELAY</h1><p>Server-assisted web viewer. Relay mode sends public HTTP/HTTPS pages through this deployment's Vercel Function. Private network targets are blocked. Some complex sites can still reject or break embedded browsing.</p><form><input placeholder="ENTER TARGET OR SEARCH"><button>CONNECT</button></form></div></div><iframe class="frame" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads"></iframe></div><div class="browser-note"><span>MODE: <b class="mode-label">RELAY</b></span><span>BACKEND: /api/proxy</span><span>LOCAL/PRIVATE TARGETS: BLOCKED</span></div></div>`;
  const frame=body.querySelector('.frame'),home=body.querySelector('.browser-home'),url=body.querySelector('.url'),mode=body.querySelector('.mode'),label=body.querySelector('.mode-label');mode.value=state.browserMode;
  let current='';
  const go=raw=>{const target=normalizeTarget(raw||url.value);if(!target)return;current=target;url.value=target;home.style.display='none';frame.src=mode.value==='relay'?'/api/proxy?url='+encodeURIComponent(target):target};
  mode.onchange=()=>{state.browserMode=mode.value;localStorage.setItem('nullsec.browserMode',mode.value);label.textContent=mode.value.toUpperCase();if(current)go(current)};mode.onchange();
  body.querySelector('.go').onclick=()=>go();url.onkeydown=e=>{if(e.key==='Enter')go()};body.querySelector('form').onsubmit=e=>{e.preventDefault();go(e.target.querySelector('input').value)};
  body.querySelector('.home').onclick=()=>{frame.src='about:blank';home.style.display='grid';url.value='';current=''};body.querySelector('.back').onclick=()=>{try{frame.contentWindow.history.back()}catch{}};body.querySelector('.reload').onclick=()=>{if(current)go(current)};
}
function renderFiles(body){body.innerHTML=`<div class="file-layout"><aside class="file-sidebar"><div class="side-title">NULL://VAULT</div><button>▸ /home</button><button>▸ /notes</button><button>▸ /system</button><button>▸ /relay</button><button>▸ /logs</button></aside><main class="file-main"><div class="section-tag">LOCAL VIRTUAL STORAGE</div><h3>/home/operator</h3><div class="file-cards"><div class="file-card">▤<b>README.NFO</b><small>system manifest</small></div><div class="file-card">▦<b>notes/</b><small>local scratch data</small></div><div class="file-card">⌁<b>relay.cfg</b><small>browser mode</small></div><div class="file-card">⚙<b>system/</b><small>core modules</small></div><div class="file-card">◌<b>session.log</b><small>ephemeral telemetry</small></div></div></main></div>`}
function renderTerminal(body){
  body.innerHTML=`<div class="terminal"><div class="term-output">NULL SEC shell 2.0\nOperator session established.\nType 'help' for local commands.\n\n</div><div class="term-line"><span class="term-prompt">hitboyxx23@nullsec:~$</span><input class="term-input" autofocus autocomplete="off"></div></div>`;
  const out=body.querySelector('.term-output'),input=body.querySelector('.term-input');
  const run=s=>{const [c,...a]=s.trim().split(/\s+/);const cmds={help:'help  clear  date  echo  whoami  uname  ls  pwd  status  open [app]  neofetch',date:()=>new Date().toString(),whoami:'hitboyxx23',uname:'Null Sec OS 2.0 / web runtime',pwd:'/home/operator',ls:'README.NFO  notes/  system/  relay.cfg  session.log',status:()=>`network: ${navigator.onLine?'online':'offline'}\nrelay: /api/proxy\nmode: ${state.browserMode}`,neofetch:'[ NULL//SEC ]\nOS: Null Sec 2.0\nRuntime: Browser + Vercel Functions\nShell: nullsh\nTheme: Null Sec\nOperator: hitboyxx23'};if(c==='clear'){out.textContent='';return''}if(c==='echo')return a.join(' ');if(c==='open'){openApp(a[0]||'browser');return`opened ${a[0]||'browser'}`};return typeof cmds[c]==='function'?cmds[c]():cmds[c]??`nullsh: command not found: ${c}`};
  input.onkeydown=e=>{if(e.key==='Enter'){const s=input.value;out.textContent+=`hitboyxx23@nullsec:~$ ${s}\n${run(s)}\n`;input.value='';body.querySelector('.terminal').scrollTop=99999}};setTimeout(()=>input.focus(),50);
}
function renderOps(body){
  body.innerHTML=`<div class="ops"><div class="ops-head"><div><div class="section-tag">LOCAL SESSION TELEMETRY</div><h2>OPS CENTER</h2></div><div class="live-dot">● LIVE</div></div><div class="ops-grid"><div class="metric"><label>SESSION UPTIME</label><strong id="uptime">00:00:00</strong><small>local UI runtime</small></div><div class="metric"><label>RELAY STATUS</label><strong id="relaystat">CHECK</strong><small>Vercel function health</small></div><div class="metric"><label>VIEWPORT LOAD</label><strong id="loadval">00%</strong><div class="spark" id="spark"></div></div><div class="metric"><label>NETWORK STATE</label><strong>${navigator.onLine?'ONLINE':'OFFLINE'}</strong><small>browser connectivity</small></div></div><div class="activity"><h3>EVENT STREAM</h3><div class="activity-log" id="activity">[init] ops console mounted\n[info] telemetry is simulated UI data\n[info] no network scanning is performed</div></div></div>`;
  const started=Date.now(),up=body.querySelector('#uptime'),load=body.querySelector('#loadval'),spark=body.querySelector('#spark'),relay=body.querySelector('#relaystat');let bars=[];
  const update=()=>{const s=Math.floor((Date.now()-started)/1000);up.textContent=new Date(s*1000).toISOString().slice(11,19);const v=18+Math.floor(Math.random()*47);load.textContent=String(v).padStart(2,'0')+'%';bars.push(v);bars=bars.slice(-18);spark.innerHTML=bars.map(x=>`<i style="height:${x}%"></i>`).join('')};update();const timer=setInterval(update,1000);body.closest('.window').addEventListener('DOMNodeRemoved',()=>clearInterval(timer),{once:true});fetch('/api/health').then(r=>{relay.textContent=r.ok?'ONLINE':'ERROR'}).catch(()=>relay.textContent='OFFLINE');
}
function renderNotes(body){body.innerHTML=`<div class="notes-wrap"><textarea spellcheck="true"></textarea></div>`;const t=body.querySelector('textarea');t.value=state.notes;t.oninput=()=>{state.notes=t.value;localStorage.setItem('nullsec.notes',t.value)}}
function renderSettings(body){body.innerHTML=`<div class="app-pad"><div class="section-tag">SYSTEM CONTROL</div><h2>NULL SEC CONFIG</h2><div class="settings-grid"><div class="setting"><div><b>DEFAULT BROWSER PATH</b><div class="muted">Relay uses the included Vercel backend. Direct uses a normal iframe.</div></div><select id="mode"><option value="relay">Secure Relay</option><option value="direct">Direct Frame</option></select></div><div class="setting"><div><b>RELAY HEALTH</b><div class="muted">Test /api/health and confirm the Node backend is online.</div></div><button id="test">TEST RELAY</button></div><div class="setting"><div><b>RESET LOCAL STATE</b><div class="muted">Clears scratchpad and Null Sec preferences from this browser.</div></div><button id="reset">RESET</button></div></div></div>`;const m=body.querySelector('#mode');m.value=state.browserMode;m.onchange=()=>{state.browserMode=m.value;localStorage.setItem('nullsec.browserMode',m.value)};body.querySelector('#test').onclick=async e=>{const b=e.currentTarget;b.textContent='CHECKING';try{const r=await fetch('/api/health',{cache:'no-store'});b.textContent=r.ok?'ONLINE':'ERROR'}catch{b.textContent='OFFLINE'}};body.querySelector('#reset').onclick=()=>{if(confirm('Reset Null Sec local state?')){localStorage.clear();location.reload()}}}
function renderAbout(body){body.innerHTML=`<div class="app-pad"><div class="about-logo">NULL//SEC</div><div class="section-tag">BROWSER OPERATING ENVIRONMENT</div><h2>Null Sec OS 2.0</h2><p class="muted">A cyber themed browser desktop built with plain HTML, CSS and JavaScript, plus a Node.js Vercel Function for the relay browser.</p><p>Operator profile: <b>hitboyxx23</b></p><hr class="rule"><p class="muted">Relay mode is a lightweight public-web viewer, not a VPN or anonymity service. It blocks localhost and private network destinations. Complex sites with authentication, strict anti-bot systems, streaming, WebSockets, or heavy client routing may not work correctly inside the embedded viewer.</p></div>`}
