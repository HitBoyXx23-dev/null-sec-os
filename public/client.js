const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const desktop=$('#desktop'),boot=$('#boot'),layer=$('#window-layer'),tpl=$('#window-template'),taskButtons=$('#task-buttons'),startMenu=$('#start-menu');
let z=20,seq=0;const wins=new Map();
const state={notes:localStorage.getItem('nullsec.notes')||'[ NULL SEC SCRATCHPAD ]\n\nOperator notes are stored locally in this browser.',browserMode:(localStorage.getItem('nullsec.browserMode')==='relay'?'relay':'smart')};

const bootLines=['NULL SEC BOOTLOADER','[OK] verifying browser runtime','[OK] mounting local vault','[OK] loading 50+ application manifests','[OK] binding Vercel relay','[OK] initializing media bridge','[OK] operator: hitboyxx23','[OK] desktop ready'];
let bi=0;const bootLog=$('#boot-log');const bt=setInterval(()=>{if(bi<bootLines.length)bootLog.textContent+=bootLines[bi++]+'\n';else clearInterval(bt)},120);
setTimeout(()=>{boot.classList.add('hidden');desktop.classList.remove('hidden');openApp('dashboard')},1650);

function updateNet(){const e=$('#net-status');e.textContent=navigator.onLine?'NET ●':'NET ○';e.className=navigator.onLine?'ok':'bad'} addEventListener('online',updateNet);addEventListener('offline',updateNet);updateNet();
async function checkApi(){const e=$('#api-status');try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw 0;e.textContent='RELAY ●';e.className='ok'}catch{e.textContent='RELAY ○';e.className='bad'}} checkApi();

const appDefs=[
['dashboard','Dashboard','system','⌁','System overview'],['browser','Null Browser','system','◎','Smart web relay'],['terminal','NullSH','system','>_','Local shell'],['files','Vault','system','▦','Encrypted local secrets and notes'],['ops','Ops Center','system','◫','Telemetry'],['notes','Scratchpad','system','✎','Local notes'],['settings','Config','system','⚙','OS settings'],['about','System Info','system','N','Build details'],
['media','Null Media','media','▶','Media'],['movies','Movies','media','M','Movie browser'],['series','Series','media','S','Series browser'],['livetv','Null Live TV','media','TV','Live channels'],['cinema','Null Cinema','media','◫','Movies and series'],['player','Media Player','media','▷','Direct player'],['radio','Signal Radio','media','◉','In-OS radio browser'],['youtube','YouTube Bridge','media','YT','Official embed helper'],
['calculator','Calculator','tools','∑','Fast calculator'],['clock','World Clock','tools','◷','Clock and date'],['calendar','Calendar','tools','▣','Monthly calendar'],['stopwatch','Stopwatch','tools','⏱','Time laps'],['timer','Timer','tools','⌛','Countdown timer'],['paint','Null Paint','tools','✣','Canvas sketchpad'],['markdown','Markdown Pad','tools','M↓','Markdown preview'],['json','JSON Lab','tools','{}','Format JSON'],['base64','Base64','tools','64','Encode and decode'],['urlcodec','URL Codec','tools','%','URL encode/decode'],['uuid','UUID Forge','tools','ID','Generate UUIDs'],['password','Password Forge','tools','***','Generate passwords'],['hash','Hash Lab','tools','#','SHA-256 digest'],['regex','Regex Lab','tools','.*','Test patterns'],['color','Color Lab','tools','◈','Color converter'],['text','Text Lab','tools','Aa','Case and stats'],['ascii','ASCII Studio','tools','A#','Text banners'],['unit','Unit Convert','tools','⇄','Common conversions'],['random','Random Lab','tools','?','Random values'],['clipboard','Clipboard','tools','▤','Copy helper'],['systemmon','System Monitor','tools','▥','Browser runtime info'],['storage','Storage Inspector','tools','◧','LocalStorage viewer'],['network','Network Tools','tools','⌁','URL and connection info'],['qrcode','QR Forge','tools','QR','Node-powered QR generator'],
['osintcenter','OSINT Center','intel','◎','Passive intelligence dashboard'],['usernameintel','Username OSINT','intel','@','Public username footprint checker'],['nullcrypt','Null Chat','comms','◈','Public chat + E2EE private DMs by username'],
['dnsintel','DNS Lens','intel','DNS','Public DNS records'],['rdapintel','RDAP Lens','intel','R','Domain and IP registration'],['ctintel','Cert Lens','intel','CRT','Certificate transparency'],['headerintel','Header Scope','intel','HDR','Security header inspector'],['robotsintel','Robots Viewer','intel','BOT','Public robots.txt viewer'],['urlclean','URL Sanitizer','intel','URL','Strip tracking parameters'],['leakscan','Leak Scanner','intel','LS','Local text exposure scan'],['fileintel','File Intel','intel','FILE','Local file metadata and hash'],['jwtscope','JWT Peek','intel','JWT','Decode JWT locally'],['passaudit','Password Audit','intel','KEY','Local entropy estimate'],['privacycheck','OPSEC Checklist','intel','OP','Privacy hygiene checklist'],
['snake','Snake','games','S','Classic snake'],['pong','Pong','games','P','Arcade pong'],['breakout','Breakout','games','B','Brick breaker'],['tictactoe','Tic Tac Toe','games','XO','3x3 game'],['memory','Memory','games','◇','Match cards'],['mines','Mines','games','✹','Mine puzzle'],['clicker','Null Clicker','games','+1','Score clicker'],['reaction','Reaction Test','games','!','Reaction speed'],['typing','Typing Test','games','⌨','Typing speed'],['guess','Number Guess','games','?','Guess 1 to 100'],['dice','Dice','games','⚄','Dice roller'],['coin','Coin Flip','games','◐','Heads or tails'],['rps','Rock Paper Scissors','games','RPS','Play CPU'],['lights','Lights Out','games','▦','Toggle grid'],['simon','Simon','games','●','Memory sequence'],['maze','Maze Runner','games','⌗','Keyboard maze'],['2048','2048','games','2K','Number merge']
];
const apps={};appDefs.forEach(([id,title,cat,icon,desc])=>apps[id]={id,title,cat,icon,desc,render:resolveRenderer(id)});
function resolveRenderer(id){return ({dashboard:renderDashboard,browser:renderBrowser,terminal:renderTerminal,files:renderFiles,ops:renderOps,notes:renderNotes,settings:renderSettings,about:renderAbout,media:renderMedia,movies:renderMovies,series:renderSeries,livetv:renderLiveTV,cinema:renderCinema,player:renderPlayer,radio:renderRadio,youtube:renderYouTube,calculator:renderCalculator,clock:renderClock,calendar:renderCalendar,stopwatch:renderStopwatch,timer:renderTimer,paint:renderPaint,markdown:renderMarkdown,json:renderJSON,base64:renderBase64,urlcodec:renderUrlCodec,uuid:renderUUID,password:renderPassword,hash:renderHash,regex:renderRegex,color:renderColor,text:renderText,ascii:renderAscii,unit:renderUnit,random:renderRandom,clipboard:renderClipboard,systemmon:renderSystemMon,storage:renderStorage,network:renderNetwork,qrcode:renderQR,osintcenter:renderOSINTCenter,usernameintel:renderUsernameIntel,nullcrypt:renderNullCrypt,dnsintel:renderDNSIntel,rdapintel:renderRDAPIntel,ctintel:renderCTIntel,headerintel:renderHeaderIntel,robotsintel:renderRobotsIntel,urlclean:renderURLClean,leakscan:renderLeakScan,fileintel:renderFileIntel,jwtscope:renderJWTPeek,passaudit:renderPassAudit,privacycheck:renderPrivacyCheck,snake:renderSnake,pong:renderPong,breakout:renderBreakout,tictactoe:renderTicTacToe,memory:renderMemory,mines:renderMines,clicker:renderClicker,reaction:renderReaction,typing:renderTyping,guess:renderGuess,dice:renderDice,coin:renderCoin,rps:renderRPS,lights:renderLights,simon:renderSimon,maze:renderMaze,'2048':render2048}[id]||renderPlaceholder)}

function buildLaunchers(){const favorites=['browser','osintcenter','terminal','files','ops','media','snake','calculator'];$('#desktop-icons').innerHTML=favorites.map(id=>`<button class="desktop-icon" data-open="${id}"><span class="ico">${apps[id].icon}</span><small>${apps[id].title}</small></button>`).join('');renderAppGrid()}
function renderAppGrid(filter='',cat='all'){const q=filter.toLowerCase();$('#app-grid').innerHTML=appDefs.filter(([id,title,c,,desc])=>(cat==='all'||c===cat)&&(`${title} ${desc}`.toLowerCase().includes(q))).map(([id,title,,icon,desc])=>`<button class="app-tile" data-open="${id}"><b>${icon}</b><span>${title}</span><small>${desc}</small></button>`).join('')}
buildLaunchers();
$('#app-search').addEventListener('input',e=>renderAppGrid(e.target.value,$('.start-tabs .active').dataset.cat));$$('.start-tabs button').forEach(b=>b.onclick=()=>{$$('.start-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAppGrid($('#app-search').value,b.dataset.cat)});
document.addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){openApp(o.dataset.open);startMenu.classList.add('hidden')}});$('#start-btn').onclick=()=>startMenu.classList.toggle('hidden');$('#restart-btn').onclick=()=>location.reload();
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#start-menu')&&!e.target.closest('#start-btn'))startMenu.classList.add('hidden')});

function openApp(id){if(wins.has(id)){const w=wins.get(id).el;w.classList.remove('hidden');focusWin(w);return}const app=apps[id];if(!app)return;const el=tpl.content.firstElementChild.cloneNode(true);el.dataset.app=id;el.style.left=`${10+(seq%9)*2.1}%`;el.style.top=`${5+(seq%8)*1.8}%`;seq++;el.querySelector('.title').textContent=`${app.title.toUpperCase()} // NULL SEC`;layer.append(el);app.render(el.querySelector('.window-body'),el);const task=document.createElement('button');task.className='task-app active';task.textContent=app.title;task.onclick=()=>toggleTask(id);taskButtons.append(task);wins.set(id,{el,task});wireWindow(el,id);focusWin(el)}
function wireWindow(el,id){const bar=el.querySelector('.titlebar');let drag=null;bar.onpointerdown=e=>{if(e.target.closest('button')||el.classList.contains('maximized'))return;focusWin(el);drag={x:e.clientX,y:e.clientY,l:el.offsetLeft,t:el.offsetTop};bar.setPointerCapture(e.pointerId)};bar.onpointermove=e=>{if(!drag)return;el.style.left=Math.max(0,drag.l+e.clientX-drag.x)+'px';el.style.top=Math.max(0,drag.t+e.clientY-drag.y)+'px'};bar.onpointerup=()=>drag=null;el.onpointerdown=()=>focusWin(el);el.querySelector('[data-action=close]').onclick=()=>closeWin(id);el.querySelector('[data-action=minimize]').onclick=()=>{el.classList.add('hidden');wins.get(id).task.classList.remove('active')};el.querySelector('[data-action=maximize]').onclick=()=>el.classList.toggle('maximized');const r=el.querySelector('.resize-handle');let rs=null;r.onpointerdown=e=>{rs={x:e.clientX,y:e.clientY,w:el.offsetWidth,h:el.offsetHeight};r.setPointerCapture(e.pointerId)};r.onpointermove=e=>{if(!rs||el.classList.contains('maximized'))return;el.style.width=Math.max(350,rs.w+e.clientX-rs.x)+'px';el.style.height=Math.max(240,rs.h+e.clientY-rs.y)+'px'};r.onpointerup=()=>rs=null}
function focusWin(el){z++;el.style.zIndex=z;$$('.window').forEach(w=>w.classList.toggle('focused',w===el));for(const {el:w,task} of wins.values())task.classList.toggle('active',w===el&&!w.classList.contains('hidden'))}
function closeWin(id){const x=wins.get(id);if(!x)return;x.el.remove();x.task.remove();wins.delete(id)}function toggleTask(id){const x=wins.get(id);if(!x)return;if(x.el.classList.contains('hidden')){x.el.classList.remove('hidden');focusWin(x.el)}else if(x.el.classList.contains('focused')){x.el.classList.add('hidden');x.task.classList.remove('active')}else focusWin(x.el)}

function renderDashboard(b){b.innerHTML=`<div class="app-pad classic-dash"><div class="section-tag">SYSTEM</div><h1>NULL SEC</h1><div class="ops-grid"><div class="metric"><label>APPS</label><strong>${appDefs.length}</strong><small>INSTALLED</small></div><div class="metric"><label>NETWORK</label><strong>${navigator.onLine?'UP':'DOWN'}</strong><small>CLIENT</small></div><div class="metric"><label>RELAY</label><strong id="dash-relay">...</strong><small>SERVER</small></div></div><div class="classic-launch">${['browser','media','nullcrypt','terminal','files','osintcenter'].map(id=>`<button class="panel btn" data-open="${id}">${apps[id].icon}<span>${apps[id].title}</span></button>`).join('')}</div></div>`;fetch('/api/health').then(r=>{const e=b.querySelector('#dash-relay');e.textContent=r.ok?'UP':'DOWN'}).catch(()=>{b.querySelector('#dash-relay').textContent='DOWN'})}

function normalizeTarget(raw){raw=(raw||'').trim();if(!raw)return'';if(/^https?:\/\//i.test(raw))return raw;if(raw.includes('.')&&!raw.includes(' '))return'https://'+raw;return'https://www.google.com/search?q='+encodeURIComponent(raw)}
function youtubeId(u){try{const x=new URL(u);if(x.hostname.includes('youtu.be'))return x.pathname.split('/')[1]||'';if(x.hostname.includes('youtube.com'))return x.searchParams.get('v')||((x.pathname.match(/\/shorts\/([^/?]+)/)||[])[1]||'')}catch{}return''}
let nullSjController=null;
let nullSjTransport=null;

let nullUvConnection=null;

async function ensureRealUV(){
  if(!window.BareMux||!window.__uv$config)throw new Error('Ultraviolet assets did not load');
  if(!('serviceWorker' in navigator))throw new Error('Service workers are unavailable');

  for(const asset of ['/uv/uv.bundle.js','/uv/uv.config.js','/uv/uv.sw.js','/uv/sw.js','/baremux/index.js','/epoxy/index.mjs']){
    const r=await fetch(asset,{cache:'no-store'});
    if(!r.ok)throw new Error('Missing UV asset: '+asset+' ('+r.status+')');
  }

  const swUrl='/uv/sw.js';
  const scope='/uv/service/';
  let reg=await navigator.serviceWorker.getRegistration(scope);

  if(reg){
    const scripts=[reg.active,reg.waiting,reg.installing].filter(Boolean).map(w=>{try{return new URL(w.scriptURL).pathname}catch{return ''}});
    if(!scripts.includes(swUrl)){
      await reg.unregister();
      reg=null;
    }
  }

  if(!reg)reg=await navigator.serviceWorker.register(swUrl,{scope,updateViaCache:'none'});
  await reg.update().catch(()=>{});

  const worker=reg.installing||reg.waiting||reg.active;
  if(worker&&worker.state!=='activated'){
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('UV worker activation timed out')),12000);
      const done=()=>{clearTimeout(timer);resolve()};
      worker.addEventListener('statechange',()=>{
        if(worker.state==='activated')done();
        else if(worker.state==='redundant'){clearTimeout(timer);reject(new Error('UV worker became redundant'))}
      });
      if(worker.state==='activated')done();
    });
  }
  if(!reg.active)throw new Error('UV worker did not activate');

  if(!nullUvConnection)nullUvConnection=new BareMux.BareMuxConnection('/baremux/worker.js');
  const wisp=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
  const current=await nullUvConnection.getTransport();
  if(current!=='/epoxy/index.mjs'){
    await nullUvConnection.setTransport('/epoxy/index.mjs',[{wisp}]);
  }
  return nullUvConnection;
}

async function waitForExactServiceWorker(reg, expectedPath, timeoutMs=12000){
  const expected=new URL(expectedPath,location.origin).pathname;
  const workerPath=w=>{try{return new URL(w?.scriptURL||'',location.origin).pathname}catch{return ''}};

  let worker=[reg.installing,reg.waiting,reg.active].find(w=>workerPath(w)===expected);
  if(!worker)throw new Error('Expected service worker not found: '+expected);

  if(worker.state!=='activated'){
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Service worker activation timed out: '+expected)),timeoutMs);
      const finish=()=>{clearTimeout(timer);resolve()};
      worker.addEventListener('statechange',()=>{
        if(worker.state==='activated')finish();
        else if(worker.state==='redundant'){
          clearTimeout(timer);
          reject(new Error('Service worker became redundant: '+expected));
        }
      });
      if(worker.state==='activated')finish();
    });
  }
  return worker;
}

async function ensureScramjet(){
  if(!window.$scramjetController){
    let detail='controller.api.js was not loaded';
    try{
      const r=await fetch('/api/scramjet-status',{cache:'no-store'});
      const text=await r.text();
      let d={};try{d=JSON.parse(text)}catch{}
      if(!r.ok||!d.ok)detail=d.error||('status returned '+r.status);
      else detail='server assets exist but controller API did not initialize';
    }catch{}
    throw new Error('Scramjet controller unavailable: '+detail);
  }
  if(!('serviceWorker' in navigator))throw new Error('Service workers are unavailable');

  const required=[
    '/vendor/controller/controller.api.js',
    '/vendor/controller/controller.sw.js',
    '/vendor/controller/controller.inject.js',
    '/vendor/scramjet/scramjet.js',
    '/vendor/scramjet/scramjet.wasm',
    '/vendor/libcurl/index.mjs'
  ];
  for(const asset of required){
    const r=await fetch(asset,{cache:'no-store'});
    if(!r.ok)throw new Error('Missing Scramjet asset '+asset+' ('+r.status+')');
  }

  let reg=await navigator.serviceWorker.getRegistration('/');
  const pathOf=w=>{try{return new URL(w?.scriptURL||'',location.origin).pathname}catch{return ''}};
  const hasExact=reg&&[reg.active,reg.waiting,reg.installing].some(w=>pathOf(w)==='/sw.js');

  if(reg&&!hasExact){
    await reg.unregister().catch(()=>{});
    reg=null;
  }
  if(!reg)reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
  await reg.update().catch(()=>{});
  const sw=await waitForExactServiceWorker(reg,'/sw.js');

  if(!nullSjController){
    const wisp=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
    const mod=await import('/vendor/libcurl/index.mjs');
    const LibcurlClient=mod.default;
    nullSjTransport=new LibcurlClient({wisp});
    if(typeof nullSjTransport.init==='function')await nullSjTransport.init();

    nullSjController=new $scramjetController.Controller({
      serviceworker:sw,
      transport:nullSjTransport,
      config:{
        prefix:'/~/sj/',
        scramjetPath:'/vendor/scramjet/scramjet.js',
        injectPath:'/vendor/controller/controller.inject.js',
        wasmPath:'/vendor/scramjet/scramjet.wasm'
      }
    });
    await nullSjController.wait();
  }
  return nullSjController;
}


function installNullBrowserShield(iframe,onNavigate){
  const apply=()=>{
    try{
      const d=iframe.contentDocument;
      if(!d)return;
      d.addEventListener('click',e=>{
        const a=e.target?.closest?.('a[href]');
        if(!a)return;
        let href='';
        try{href=a.href||''}catch{}
        if(!href)return;
        const target=(a.getAttribute('target')||'').toLowerCase();
        if(target==='_blank'||target==='_new'){
          e.preventDefault();
          e.stopPropagation();
          if(typeof onNavigate==='function')onNavigate(href);
          return;
        }
        const videoId=nullYoutubeVideoId(href);
        if(videoId && typeof onNavigate==='function'){
          e.preventDefault();
          e.stopPropagation();
          onNavigate('nullsec-youtube:'+videoId);
        }
      },true);
    }catch{}
  };
  iframe.addEventListener('load',()=>setTimeout(apply,80));
}

function nullYoutubeVideoId(raw){
  try{
    const u=new URL(String(raw),location.href);
    const h=u.hostname.replace(/^www\./,'').toLowerCase();
    if(h==='youtu.be'){
      const id=u.pathname.split('/').filter(Boolean)[0];
      return /^[A-Za-z0-9_-]{6,20}$/.test(id||'')?id:null;
    }
    if(h==='youtube.com'||h.endsWith('.youtube.com')){
      if(u.pathname==='/watch'){
        const id=u.searchParams.get('v');
        return /^[A-Za-z0-9_-]{6,20}$/.test(id||'')?id:null;
      }
      const m=u.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{6,20})/);
      if(m)return m[1];
    }
  }catch{}
  return null;
}
function nullYoutubeEmbedUrl(id){
  return 'https://www.youtube.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0&playsinline=1&origin='+encodeURIComponent(location.origin);
}

function renderBrowser(b){
  const saved=localStorage.getItem('nullsec.proxyEngine')||'auto';
  const history=[],historyEngines=[];
  let historyIndex=-1,current='',activeEngine='',sjFrame=null,busy=false;

  b.innerHTML=`<div class="browser classic-browser">
    <div class="browser-bar">
      <button class="back" title="Back">←</button>
      <button class="forward" title="Forward">→</button>
      <button class="home" title="Home">⌂</button>
      <button class="reload" title="Reload">↻</button>
      <select class="field proxy-engine">
        <option value="auto">AUTO</option>
        <option value="scramjet">SJ</option>
        <option value="uv">UV</option>
      </select>
      <div class="browser-address"><input class="url" placeholder="Search or enter address"></div>
      <button class="go">GO</button>
      <button class="browser-more" title="Diagnostics">⋮</button>
    </div>

    <div class="browser-diagnostics hidden">
      <div><b>PROXY STATUS</b><span class="diag-summary">NOT TESTED</span></div>
      <div class="diag-grid">
        <span>SCRAMJET</span><b class="diag-sj">...</b>
        <span>ULTRAVIOLET</span><b class="diag-uv">...</b>
        <span>WISP</span><b class="diag-wisp">...</b>
        <span>ACTIVE</span><b class="diag-active">NONE</b>
      </div>
      <button class="btn diag-run">RUN CHECK</button>
      <button class="btn diag-reset">RESET WORKERS</button>
    </div>

    <div class="browser-view">
      <div class="browser-home">
        <div class="browser-card classic-browser-home">
          <div class="glyph">◎</div>
          <h1>NULL BROWSER</h1>
          <form><input placeholder="Search or enter address"><button>GO</button></form>
          <div class="quick-sites">
            <button data-url="https://www.google.com">Google</button>
            <button data-url="https://www.youtube.com">YouTube</button>
            <button data-url="https://www.wikipedia.org">Wikipedia</button>
          </div>
        </div>
      </div>
      <div class="sj-host"></div>
      <iframe class="frame uv-frame" allow="fullscreen; autoplay; encrypted-media; picture-in-picture; microphone; camera; clipboard-read; clipboard-write"></iframe>
      <iframe class="frame yt-frame" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
      <div class="browser-loading hidden"><div>CONNECTING...</div></div>
      <div class="browser-error">
        <div>
          <b>PAGE FAILED</b>
          <span></span>
          <div class="browser-error-actions">
            <button class="btn retry">RETRY</button>
            <button class="btn try-other">TRY OTHER ENGINE</button>
            <button class="btn show-diag">DIAGNOSTICS</button>
          </div>
        </div>
      </div>
    </div>

    <div class="browser-note">
      <span>ENGINE <b class="engine-state">AUTO</b></span>
      <span class="browser-url-state">READY</span>
    </div>
  </div>`;

  const host=b.querySelector('.sj-host'),uvFrame=b.querySelector('.uv-frame'),ytFrame=b.querySelector('.yt-frame'),
        home=b.querySelector('.browser-home'),url=b.querySelector('.url'),err=b.querySelector('.browser-error'),
        select=b.querySelector('.proxy-engine'),engineState=b.querySelector('.engine-state'),
        urlState=b.querySelector('.browser-url-state'),loading=b.querySelector('.browser-loading'),
        diag=b.querySelector('.browser-diagnostics');

  select.value=saved;
  err.style.display='none';

  function showEngine(name){
    activeEngine=name;
    engineState.textContent=name.toUpperCase();
    b.querySelector('.diag-active').textContent=name.toUpperCase();
    host.style.display=name==='scramjet'?'block':'none';
    uvFrame.style.display=name==='uv'?'block':'none';
    ytFrame.style.display=name==='youtube'?'block':'none';
  }

  function setBusy(v,msg='CONNECTING'){
    busy=v;
    loading.classList.toggle('hidden',!v);
    if(v)loading.firstElementChild.textContent=msg;
  }

  async function ensureSjFrame(){
    const controller=await ensureScramjet();
    if(!sjFrame){
      const iframe=document.createElement('iframe');
      iframe.className='frame sj-frame';
      iframe.setAttribute('allow','fullscreen; autoplay; encrypted-media; picture-in-picture; microphone; camera; clipboard-read; clipboard-write');
      host.replaceChildren(iframe);
      installNullBrowserShield(iframe,href=>navigate(href));
      sjFrame=controller.createFrame(iframe);
    }
    return sjFrame;
  }

  async function loadWith(engine,target){
    if(engine==='scramjet'){
      const frame=await ensureSjFrame();
      showEngine('scramjet');
      await Promise.resolve(frame.go(target));
      return;
    }
    if(engine==='uv'){
      await ensureRealUV();
      showEngine('uv');
      uvFrame.src=__uv$config.prefix+__uv$config.encodeUrl(target);
      return;
    }
    throw new Error('Unknown engine '+engine);
  }

  function engineOrder(target,forced){
    if(forced)return [forced];
    const pref=select.value;
    if(pref!=='auto')return [pref];
    try{
      const h=new URL(target).hostname.replace(/^www\./,'').toLowerCase();
      if(h==='youtube.com'||h.endsWith('.youtube.com')||h==='youtu.be')return ['uv','scramjet'];
    }catch{}
    return ['scramjet','uv'];
  }

  function pushHistory(target,engine){
    if(historyIndex<history.length-1){
      history.splice(historyIndex+1);
      historyEngines.splice(historyIndex+1);
    }
    history.push(target);
    historyEngines.push(engine||'auto');
    historyIndex=history.length-1;
  }

  async function navigate(raw,opts={}){
    if(busy)return;
    const target=normalizeTarget(raw||url.value);
    if(!target)return;
    current=target;
    url.value=target;
    home.style.display='none';
    err.style.display='none';
    setBusy(true);
    urlState.textContent='CONNECTING';

    const vid=nullYoutubeVideoId(target)||youtubeId(target);
    if(vid){
      showEngine('youtube');
      ytFrame.src=nullYoutubeEmbedUrl(vid);
      urlState.textContent='YOUTUBE PLAYER';
      if(!opts.noHistory)pushHistory(target,'youtube');
      setBusy(false);
      return;
    }

    try{
      const u=new URL(target);
      const h=u.hostname.replace(/^www\./,'').toLowerCase();
      if(select.value==='auto'&&(h==='youtube.com'||h.endsWith('.youtube.com')||h==='youtu.be')){
        openApp('youtube');
        home.style.display='grid';
        urlState.textContent='NATIVE YOUTUBE';
        setBusy(false);
        return;
      }
    }catch{}

    let lastErr=null,workedEngine='';
    for(const eng of engineOrder(target,opts.forceEngine)){
      try{
        await loadWith(eng,target);
        workedEngine=eng;
        urlState.textContent='LOADED';
        if(!opts.noHistory)pushHistory(target,eng);
        setBusy(false);
        return;
      }catch(e){
        lastErr=e;
      }
    }

    setBusy(false);
    err.style.display='grid';
    urlState.textContent='FAILED';
    err.querySelector('span').textContent=lastErr?.message||String(lastErr||'Proxy failed');
  }

  async function runDiagnostics(){
    const sj=b.querySelector('.diag-sj'),uv=b.querySelector('.diag-uv'),wisp=b.querySelector('.diag-wisp'),summary=b.querySelector('.diag-summary');
    sj.textContent=uv.textContent=wisp.textContent='CHECKING';
    summary.textContent='RUNNING';
    let ok=0;
    try{
      const r=await fetch('/api/proxy-status',{cache:'no-store'});
      const text=await r.text();
      const d=JSON.parse(text);
      sj.textContent=d?.engines?.scramjet?.ok?'OK':'FAIL';
      uv.textContent=d?.engines?.ultraviolet?.ok?'OK':'FAIL';
      if(d?.engines?.scramjet?.ok)ok++;
      if(d?.engines?.ultraviolet?.ok)ok++;
    }catch{
      sj.textContent='FAIL';
      uv.textContent='FAIL';
    }
    try{
      const proto=location.protocol==='https:'?'wss:':'ws:';
      await new Promise((resolve,reject)=>{
        const ws=new WebSocket(proto+'//'+location.host+'/wisp/');
        const timer=setTimeout(()=>{try{ws.close()}catch{};reject(new Error('timeout'))},4000);
        ws.onopen=()=>{clearTimeout(timer);ws.close();resolve()};
        ws.onerror=()=>{clearTimeout(timer);reject(new Error('websocket'))};
      });
      wisp.textContent='OK';ok++;
    }catch{wisp.textContent='FAIL'}
    summary.textContent=ok===3?'ALL SYSTEMS READY':ok+' / 3 READY';
  }

  async function resetWorkers(){
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const reg of regs){
        const scope=new URL(reg.scope).pathname;
        if(scope==='/'||scope==='/uv/service/'||scope.startsWith('/uv/service/'))await reg.unregister();
      }
      nullSjController=null;
      nullSjTransport=null;
      nullUvConnection=null;
      sjFrame=null;
      host.replaceChildren();
      urlState.textContent='WORKERS RESET';
      b.querySelector('.diag-summary').textContent='RESET COMPLETE';
    }catch(e){
      b.querySelector('.diag-summary').textContent='RESET FAILED: '+e.message;
    }
  }

  select.onchange=()=>{
    localStorage.setItem('nullsec.proxyEngine',select.value);
    engineState.textContent=select.value.toUpperCase();
    if(current)navigate(current,{noHistory:true,forceEngine:select.value==='auto'?null:select.value});
  };
  b.querySelector('.go').onclick=()=>navigate();
  url.onkeydown=e=>{if(e.key==='Enter')navigate()};
  b.querySelector('form').onsubmit=e=>{e.preventDefault();navigate(e.target.querySelector('input').value)};
  b.querySelectorAll('[data-url]').forEach(x=>x.onclick=()=>navigate(x.dataset.url));

  b.querySelector('.back').onclick=()=>{
    if(historyIndex<=0)return;
    historyIndex--;
    navigate(history[historyIndex],{noHistory:true,forceEngine:historyEngines[historyIndex]==='youtube'?null:historyEngines[historyIndex]});
  };
  b.querySelector('.forward').onclick=()=>{
    if(historyIndex>=history.length-1)return;
    historyIndex++;
    navigate(history[historyIndex],{noHistory:true,forceEngine:historyEngines[historyIndex]==='youtube'?null:historyEngines[historyIndex]});
  };
  b.querySelector('.home').onclick=()=>{
    current='';url.value='';host.style.display='none';uvFrame.style.display='none';ytFrame.style.display='none';ytFrame.src='about:blank';
    home.style.display='grid';err.style.display='none';setBusy(false);
    engineState.textContent=select.value.toUpperCase();urlState.textContent='READY';
  };
  b.querySelector('.reload').onclick=()=>current&&navigate(current,{noHistory:true,forceEngine:activeEngine==='youtube'?null:activeEngine});
  b.querySelector('.retry').onclick=()=>current&&navigate(current,{noHistory:true});
  b.querySelector('.try-other').onclick=()=>{
    if(!current)return;
    const other=activeEngine==='scramjet'?'uv':'scramjet';
    navigate(current,{noHistory:true,forceEngine:other});
  };

  b.querySelector('.browser-more').onclick=()=>diag.classList.toggle('hidden');
  b.querySelector('.show-diag').onclick=()=>{diag.classList.remove('hidden');runDiagnostics()};
  b.querySelector('.diag-run').onclick=runDiagnostics;
  b.querySelector('.diag-reset').onclick=resetWorkers;
}

function renderTerminal(b){
  b.innerHTML=`<div class="terminal-app"><div class="term-output"></div><div class="term-line"><span>null@sec:$</span><input class="term-input" autocomplete="off" spellcheck="false" placeholder="type help"></div></div>`;
  const out=b.querySelector('.term-output'),input=b.querySelector('.term-input');
  const print=(text='')=>{const line=document.createElement('div');line.textContent=String(text);out.append(line);out.scrollTop=out.scrollHeight};
  const help=()=>print('help  clear  date  echo <text>  apps  open <app>  net  whoami  pwd  storage  vault  browser <url>');
  print('NULLSH // LOCAL BROWSER SHELL');
  print('Type help for commands. Commands run locally unless explicitly opening a Null Sec app.');
  input.onkeydown=e=>{
    if(e.key!=='Enter')return;
    const raw=input.value.trim();input.value='';
    if(!raw)return;
    print('null@sec:$ '+raw);
    const [cmd,...args]=raw.split(/\s+/);const rest=args.join(' ');
    switch((cmd||'').toLowerCase()){
      case 'help':help();break;
      case 'clear':out.innerHTML='';break;
      case 'date':print(new Date().toString());break;
      case 'echo':print(rest);break;
      case 'apps':print(appDefs.map(x=>x[0]).join('  '));break;
      case 'open':if(apps[args[0]])openApp(args[0]);else print('unknown app: '+(args[0]||''));break;
      case 'net':print(navigator.onLine?'ONLINE':'OFFLINE');break;
      case 'whoami':print('null-operator');break;
      case 'pwd':print('/home/null');break;
      case 'storage':print(`${localStorage.length} localStorage entries`);break;
      case 'vault':openApp('files');break;
      case 'browser':if(rest)openInNullBrowser(rest);else openApp('browser');break;
      default:print('command not found: '+cmd);break;
    }
  };
  setTimeout(()=>input.focus(),20);
}

function openInNullBrowser(url){openApp('browser');setTimeout(()=>{const w=wins.get('browser');const inp=w?.el.querySelector('.url');if(inp){inp.value=url;inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))}},40)}
function renderMedia(b){
  const apps2=[['movies','M','MOVIES','Browse movies'],['series','S','SERIES','Browse shows'],['livetv','TV','LIVE TV','Channels'],['youtube','YT','YOUTUBE','Video player'],['radio','R','RADIO','Radio'],['player','▷','PLAYER','Direct URL']];
  b.innerHTML=`<div class="native-media"><div class="native-media-head"><b>NULL MEDIA</b><span>LOCAL APPS</span></div><div class="native-media-grid">${apps2.map(x=>`<button data-open="${x[0]}"><i>${x[1]}</i><strong>${x[2]}</strong><small>${x[3]}</small></button>`).join('')}</div></div>`;
}
function renderLiveTV(b){
  const FAV='nullsec.tv.favorites.v2';
  const getFav=()=>{try{return JSON.parse(localStorage.getItem(FAV)||'[]')}catch{return[]}};
  const saveFav=v=>localStorage.setItem(FAV,JSON.stringify(v.slice(0,200)));
  let all=[],filtered=[],hls=null,currentCountry='',currentGroup='ALL';

  b.innerHTML=`<div class="tv-native">
    <div class="tv-native-head"><div><div class="section-tag">NULL LIVE TV // NATIVE</div><h1>LIVE CHANNEL MATRIX</h1><p>HitBoyStream-style IPTV sources, rebuilt as a real Null Sec app.</p></div><div class="tv-signal">● SOURCE BUS ONLINE</div></div>
    <div class="tv-toolbar"><select class="field tv-country"><option value="">SELECT COUNTRY</option></select><input class="field tv-filter" placeholder="Search channels" disabled><select class="field tv-group" disabled><option>ALL</option></select><button class="btn tv-favs">★ FAVORITES</button><button class="btn tv-refresh">REFRESH</button></div>
    <div class="tv-layout"><div class="tv-channel-pane"><div class="tv-count">0 CHANNELS</div><div class="tv-channel-list"></div></div><div class="tv-player-pane"><div class="tv-screen"><video class="tv-video" controls playsinline autoplay></video><div class="tv-empty">SELECT A CHANNEL</div><div class="tv-now hidden"></div></div><div class="tv-player-info"><b class="tv-title">NO CHANNEL</b><span class="tv-meta">WAITING FOR SOURCE</span></div><div class="tv-health"></div></div></div>
    <div class="panel muted tv-status">Loading internal country catalog...</div>
  </div>`;
  const country=b.querySelector('.tv-country'),filter=b.querySelector('.tv-filter'),group=b.querySelector('.tv-group'),list=b.querySelector('.tv-channel-list'),count=b.querySelector('.tv-count'),status=b.querySelector('.tv-status'),video=b.querySelector('.tv-video'),empty=b.querySelector('.tv-empty'),now=b.querySelector('.tv-now'),title=b.querySelector('.tv-title'),meta=b.querySelector('.tv-meta'),health=b.querySelector('.tv-health');

  async function getJson(url){
    const r=await fetch(url,{cache:'no-store'}); const text=await r.text();
    let d; try{d=JSON.parse(text)}catch{throw new Error('Server returned non-JSON: '+text.slice(0,80).replace(/\s+/g,' '))}
    if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status)); return d;
  }
  function favKey(x){return [x.id,x.title,x.url].join('|')}
  function isFav(x){const k=favKey(x);return getFav().some(y=>favKey(y)===k)}
  function toggleFav(x){let f=getFav(),k=favKey(x);f=f.some(y=>favKey(y)===k)?f.filter(y=>favKey(y)!==k):[x,...f];saveFav(f);draw()}
  function rebuildGroups(){const gs=['ALL',...new Set(all.map(x=>x.group||'OTHER'))].sort();group.innerHTML=gs.map(g=>`<option>${escapeHtml(g)}</option>`).join('');group.value='ALL';currentGroup='ALL'}
  function draw(){
    const q=filter.value.trim().toLowerCase();
    filtered=all.filter(x=>(currentGroup==='ALL'||(x.group||'OTHER')===currentGroup)&&(!q||(`${x.title} ${x.group} ${x.language}`.toLowerCase().includes(q))));
    count.textContent=filtered.length+' CHANNELS';
    list.innerHTML=filtered.slice(0,1200).map((x,i)=>`<button class="tv-row" data-i="${i}"><span class="tv-logo">${x.logo?`<img loading="lazy" src="${x.logo}" alt="">`:'TV'}</span><span class="tv-row-info"><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.group||'UNGROUPED')}</small></span><span class="tv-star" data-star="${i}">${isFav(x)?'★':'☆'}</span><span class="tv-watch">WATCH ›</span></button>`).join('')||'<div class="panel muted">No channels match.</div>';
    list.querySelectorAll('.tv-row').forEach(row=>row.onclick=e=>{const i=Number(row.dataset.i);if(e.target.closest('[data-star]')){e.stopPropagation();toggleFav(filtered[i]);return}play(filtered[i])});
  }
  function stop(){try{hls?.destroy()}catch{}hls=null;video.pause();video.removeAttribute('src');video.load()}
  function play(ch){
    stop();empty.classList.add('hidden');now.classList.remove('hidden');now.textContent='CONNECTING';title.textContent=ch.title;meta.textContent=[currentCountry.toUpperCase(),ch.group,ch.language].filter(Boolean).join(' // ');health.textContent='';
    const src='/null-media/hls?u='+encodeURIComponent(ch.url);
    try{
      if(window.Hls&&Hls.isSupported()){
        hls=new Hls({enableWorker:true,lowLatencyMode:true,backBufferLength:30,maxBufferLength:20});hls.loadSource(src);hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED,()=>{now.textContent='● LIVE';video.play().catch(()=>{})});
        hls.on(Hls.Events.ERROR,(_,d)=>{if(d?.fatal){health.textContent='STREAM ERROR // '+(d.details||d.type||'HLS');now.textContent='ERROR'}});
      }else if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=src;video.play().catch(()=>{});now.textContent='● LIVE'}
      else throw new Error('HLS unsupported');
    }catch(e){health.textContent='PLAYBACK FAILED // '+e.message;now.textContent='ERROR'}
  }
  async function loadCountry(code){
    currentCountry=code;status.textContent='Loading '+code.toUpperCase()+' playlist through Null source adapters...';filter.disabled=true;group.disabled=true;list.innerHTML='<div class="cinema-loading">PARSING CHANNELS...</div>';
    try{const d=await getJson('/null-data/tv/playlist/'+encodeURIComponent(code));all=d.items||[];rebuildGroups();filter.disabled=false;group.disabled=false;status.textContent=`${all.length} channels loaded // source: ${d.source||'adapter'}`;draw()}catch(e){all=[];list.innerHTML='<div class="panel bad">'+escapeHtml(e.message)+'</div>';status.textContent='TV SOURCE ERROR // '+e.message}
  }
  getJson('/null-data/tv/countries').then(d=>{country.innerHTML='<option value="">SELECT COUNTRY</option>'+d.items.map(x=>`<option value="${x.code}">${escapeHtml(x.flag+' // '+x.name)}</option>`).join('');status.textContent=d.items.length+' country adapters ready'}).catch(e=>status.textContent='TV SOURCE ERROR // '+e.message);
  country.onchange=()=>country.value&&loadCountry(country.value);filter.oninput=draw;group.onchange=()=>{currentGroup=group.value;draw()};b.querySelector('.tv-refresh').onclick=()=>currentCountry&&loadCountry(currentCountry);b.querySelector('.tv-favs').onclick=()=>{all=getFav();currentCountry='FAV';rebuildGroups();filter.disabled=false;group.disabled=false;status.textContent=all.length+' saved favorites';draw()};
}

function renderCinema(b){
  b.innerHTML=`<div class="native-media"><div class="native-media-head"><b>NULL CINEMA</b><span>LIBRARY</span></div><div class="native-media-grid cinema-two"><button data-open="movies"><i>M</i><strong>MOVIES</strong><small>Search and previews</small></button><button data-open="series"><i>S</i><strong>SERIES</strong><small>Shows and seasons</small></button></div></div>`;
}

function renderMovies(b){renderCatalogApp(b,'movie')}
function renderSeries(b){renderCatalogApp(b,'series')}

function renderCatalogApp(b,type){
  const label=type==='movie'?'MOVIES':'SERIES';
  let page=1,currentQuery='',lastItems=[];

  b.innerHTML=`<div class="catalog-app hbs-catalog">
    <div class="catalog-toolbar">
      <div class="catalog-titlebox"><b>${label}</b><small>TMDB // HITBOYSTREAM CATALOG METHOD</small></div>
      <input class="field catalog-q" placeholder="Search ${label.toLowerCase()}">
      <button class="btn catalog-go">SEARCH</button>
      <button class="btn catalog-trending">TRENDING</button>
    </div>
    <div class="catalog-subbar">
      <span class="catalog-status">LOADING...</span>
      <div><button class="btn catalog-prev">←</button><span class="catalog-page">PAGE 1</span><button class="btn catalog-next">→</button></div>
    </div>
    <div class="catalog-grid"></div>
    <div class="catalog-modal hidden">
      <button class="catalog-close">×</button>
      <div class="catalog-detail"></div>
    </div>
  </div>`;

  const q=b.querySelector('.catalog-q'),grid=b.querySelector('.catalog-grid'),status=b.querySelector('.catalog-status'),
        modal=b.querySelector('.catalog-modal'),detail=b.querySelector('.catalog-detail'),pageLabel=b.querySelector('.catalog-page');

  async function fetchJson(url){
    const r=await fetch(url,{cache:'no-store'});
    const text=await r.text();
    let data;
    try{data=JSON.parse(text)}catch{throw new Error('Media backend returned non-JSON')}
    if(!r.ok||!data.ok)throw new Error(data.error||'Media request failed');
    return data;
  }

  function stars(n){return Number(n||0).toFixed(1)}

  function draw(items){
    lastItems=items;
    grid.innerHTML=items.map((x,i)=>`<button class="catalog-card hbs-card" data-i="${i}">
      <div class="catalog-poster">
        ${x.poster?`<img loading="lazy" src="${x.poster}" alt="">`:'<span>NO POSTER</span>'}
        <div class="hbs-rating">★ ${stars(x.rating)}</div>
        ${x.year?`<div class="hbs-year">${escapeHtml(x.year)}</div>`:''}
        <div class="catalog-hoverplay">${type==='movie'?'▶':'→'}</div>
      </div>
      <b>${escapeHtml(x.title)}</b>
      <small>${escapeHtml(x.description||'').slice(0,130)}</small>
    </button>`).join('')||'<div class="panel muted">No results.</div>';

    grid.querySelectorAll('[data-i]').forEach(el=>{
      el.onclick=()=>openItem(items[Number(el.dataset.i)]);
    });
  }

  async function load(){
    status.textContent='LOADING '+label;
    grid.innerHTML='<div class="panel muted">FETCHING TMDB...</div>';
    try{
      const url='/null-data/catalog?type='+type+'&q='+encodeURIComponent(currentQuery)+'&page='+page;
      const d=await fetchJson(url);
      pageLabel.textContent='PAGE '+page;
      status.textContent=(currentQuery?'SEARCH':'TRENDING')+' // '+d.items.length+' TITLES';
      draw(d.items);
    }catch(e){
      status.textContent='ERROR';
      grid.innerHTML='<div class="panel bad">'+escapeHtml(e.message)+'</div>';
    }
  }

  async function openItem(x){
    modal.classList.remove('hidden');
    detail.innerHTML='<div class="catalog-loading">LOADING DETAILS...</div>';
    try{
      const d=await fetchJson('/null-data/catalog/details?type='+type+'&id='+encodeURIComponent(x.id));
      const item=d.item;
      const providerNames=[
        ...(item.providers?.flatrate||[]),
        ...(item.providers?.rent||[]),
        ...(item.providers?.buy||[])
      ];
      const providers=[...new Map(providerNames.map(p=>[p.name,p])).values()];

      detail.innerHTML=`<div class="hbs-detail">
        <div class="hbs-backdrop" ${item.backdrop?`style="background-image:linear-gradient(90deg,rgba(0,5,2,.96),rgba(0,5,2,.48)),url('${item.backdrop}')"`:''}></div>
        <div class="catalog-detail-grid hbs-detail-grid">
          ${item.poster?`<img class="hbs-detail-poster" src="${item.poster}" alt="">`:''}
          <div class="hbs-detail-copy">
            <div class="section-tag">${label} // TMDB ${escapeHtml(item.id)}</div>
            <h2>${escapeHtml(item.title)}</h2>
            <div class="catalog-facts">${escapeHtml([
              item.year,
              item.genres?.join(' / '),
              item.rating?('★ '+stars(item.rating)):null,
              type==='movie'&&item.runtime?item.runtime+' MIN':null,
              type==='series'&&item.numberOfSeasons?item.numberOfSeasons+' SEASONS':null
            ].filter(Boolean).join(' // '))}</div>
            <p>${escapeHtml(item.description||'No description available.')}</p>

            <div class="catalog-actions">
              ${item.trailer?'<button class="btn hbs-trailer">PLAY TRAILER</button>':''}
              ${item.providers?.link?'<button class="btn hbs-watch">WHERE TO WATCH</button>':''}
              ${item.homepage?'<button class="btn hbs-home">OFFICIAL SITE</button>':''}
            </div>

            ${item.trailer?'<div class="hbs-trailer-stage hidden"><iframe allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>':''}

            ${providers.length?`<div class="hbs-providers"><b>PROVIDERS</b><div>${providers.map(p=>`<span>${p.logo?`<img src="${p.logo}" alt="">`:''}${escapeHtml(p.name)}</span>`).join('')}</div></div>`:''}

            ${type==='series'?`<div class="hbs-seasons">
              <div class="hbs-season-head"><b>SEASONS</b><select class="field hbs-season-select">
                ${(item.seasons||[]).map(s=>`<option value="${s.seasonNumber}">${escapeHtml(s.name)} // ${s.episodeCount} EP</option>`).join('')}
              </select></div>
              <div class="hbs-episodes"><div class="panel muted">Select a season.</div></div>
            </div>`:''}
          </div>
        </div>
      </div>`;

      const trailerBtn=detail.querySelector('.hbs-trailer');
      if(trailerBtn&&item.trailer?.key){
        trailerBtn.onclick=()=>{
          const stage=detail.querySelector('.hbs-trailer-stage'),frame=stage.querySelector('iframe');
          frame.src=nullYoutubeEmbedUrl(item.trailer.key);
          stage.classList.remove('hidden');
        };
      }
      const watchBtn=detail.querySelector('.hbs-watch');
      if(watchBtn)watchBtn.onclick=()=>openInNullBrowser(item.providers.link);
      const homeBtn=detail.querySelector('.hbs-home');
      if(homeBtn)homeBtn.onclick=()=>openInNullBrowser(item.homepage);

      if(type==='series'){
        const select=detail.querySelector('.hbs-season-select');
        const eps=detail.querySelector('.hbs-episodes');

        async function loadSeason(){
          if(!select||select.value==='')return;
          eps.innerHTML='<div class="panel muted">LOADING EPISODES...</div>';
          try{
            const sd=await fetchJson('/null-data/catalog/season?id='+encodeURIComponent(item.id)+'&season='+encodeURIComponent(select.value));
            const season=sd.season;
            eps.innerHTML=(season.episodes||[]).map(ep=>`<div class="hbs-episode">
              <div class="hbs-episode-img">${ep.still?`<img loading="lazy" src="${ep.still}" alt="">`:'<span>EP '+ep.episodeNumber+'</span>'}</div>
              <div><b>E${String(ep.episodeNumber).padStart(2,'0')} // ${escapeHtml(ep.title)}</b>
              <small>${escapeHtml([ep.airDate,ep.runtime?ep.runtime+' min':'',ep.rating?'★ '+stars(ep.rating):''].filter(Boolean).join(' // '))}</small>
              <p>${escapeHtml(ep.description||'No episode description.')}</p></div>
            </div>`).join('')||'<div class="panel muted">No episodes found.</div>';
          }catch(e){
            eps.innerHTML='<div class="panel bad">'+escapeHtml(e.message)+'</div>';
          }
        }

        if(select){
          select.onchange=loadSeason;
          if(select.options.length)loadSeason();
        }
      }
    }catch(e){
      detail.innerHTML='<div class="panel bad">'+escapeHtml(e.message)+'</div>';
    }
  }

  b.querySelector('.catalog-go').onclick=()=>{
    currentQuery=q.value.trim();
    page=1;
    load();
  };
  q.onkeydown=e=>{if(e.key==='Enter')b.querySelector('.catalog-go').click()};
  b.querySelector('.catalog-trending').onclick=()=>{
    currentQuery='';
    q.value='';
    page=1;
    load();
  };
  b.querySelector('.catalog-prev').onclick=()=>{if(page>1){page--;load()}};
  b.querySelector('.catalog-next').onclick=()=>{page++;load()};
  b.querySelector('.catalog-close').onclick=()=>{
    modal.classList.add('hidden');
    detail.innerHTML='';
  };

  load();
}

function renderPlayer(b){b.innerHTML=`<div class="video-shell"><video class="media-el" controls playsinline></video><div class="video-tools"><input class="field media-url" placeholder="Direct .mp4, .webm, .mp3, .ogg or stream URL"><button class="btn media-load">LOAD</button></div></div>`;b.querySelector('.media-load').onclick=()=>{b.querySelector('.media-el').src=b.querySelector('.media-url').value.trim();b.querySelector('.media-el').play().catch(()=>{})}}
function renderRadio(b){
  const stations=[
    ['Radio Garden','Explore live radio stations by location','https://radio.garden/'],
    ['SomaFM','Listener-supported internet radio','https://somafm.com/'],
    ['Internet Archive Audio','Public audio collections','https://somafm.com']
  ];
  b.innerHTML=`<div class="tool-wrap"><div class="tool-head"><div><div class="section-tag">NULL RADIO</div><h2>Signal Radio</h2></div></div><div class="media-grid">${stations.map(([name,desc,url])=>`<button class="media-card radio-link" data-url="${url}"><div class="poster">◉</div><b>${name}</b><small>${desc}</small></button>`).join('')}</div><div class="panel muted" style="margin-top:10px">Stations open inside Null Browser through Scramjet.</div></div>`;
  b.querySelectorAll('.radio-link').forEach(x=>x.onclick=()=>openInNullBrowser(x.dataset.url));
}

function renderYouTube(b){
  b.innerHTML=`<div class="youtube-app yt-native">
    <div class="catalog-toolbar">
      <b>YOUTUBE</b>
      <input class="field yt-url" placeholder="Paste watch / Shorts / youtu.be URL">
      <button class="btn yt-load">PLAY</button>
    </div>
    <div class="yt-stage">
      <div class="yt-empty">PASTE A YOUTUBE VIDEO LINK</div>
      <iframe class="yt-official hidden" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    </div>
    <div class="yt-meta hidden"></div>
    <div class="yt-searchbox">
      <input class="field yt-search" placeholder="Search YouTube">
      <button class="btn yt-search-go">SEARCH</button>
      <span class="yt-search-note">Native search uses YOUTUBE_API_KEY. Direct URL playback does not.</span>
    </div>
    <div class="yt-results"></div>
  </div>`;

  const frame=b.querySelector('.yt-official'),empty=b.querySelector('.yt-empty'),meta=b.querySelector('.yt-meta'),results=b.querySelector('.yt-results');

  async function playRaw(raw){
    const id=nullYoutubeVideoId(raw)||youtubeId(raw);
    if(!id){empty.textContent='INVALID YOUTUBE VIDEO URL';return}
    empty.textContent='LOADING...';
    frame.src=nullYoutubeEmbedUrl(id);
    frame.classList.remove('hidden');
    empty.classList.add('hidden');
    meta.classList.add('hidden');

    try{
      const r=await fetch('/null-data/youtube/oembed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{cache:'no-store'});
      const d=await r.json();
      if(r.ok&&d.ok){
        meta.innerHTML=`${d.thumbnail?`<img src="${d.thumbnail}" alt="">`:''}<div><b>${escapeHtml(d.title)}</b><small>${escapeHtml(d.author)}</small></div>`;
        meta.classList.remove('hidden');
      }
    }catch{}
  }

  b.querySelector('.yt-load').onclick=()=>playRaw(b.querySelector('.yt-url').value.trim());
  b.querySelector('.yt-url').onkeydown=e=>{if(e.key==='Enter')playRaw(e.target.value.trim())};

  b.querySelector('.yt-search-go').onclick=async()=>{
    const q=b.querySelector('.yt-search').value.trim();
    if(!q)return;
    results.innerHTML='<div class="panel muted">SEARCHING...</div>';
    try{
      const r=await fetch('/null-data/youtube/search?q='+encodeURIComponent(q),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok||!d.ok){
        results.innerHTML=`<div class="panel ${d.needsKey?'muted':'bad'}">${escapeHtml(d.error||'Search failed')}</div>`;
        return;
      }
      results.innerHTML=d.items.map(x=>`<button class="yt-result" data-id="${x.id}">
        ${x.thumbnail?`<img src="${x.thumbnail}" alt="">`:''}
        <span><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.channel)}</small><p>${escapeHtml(x.description)}</p></span>
      </button>`).join('')||'<div class="panel muted">No videos found.</div>';
      results.querySelectorAll('[data-id]').forEach(x=>x.onclick=()=>playRaw('https://www.youtube.com/watch?v='+x.dataset.id));
    }catch(e){
      results.innerHTML='<div class="panel bad">'+escapeHtml(e.message)+'</div>';
    }
  };
}
function vaultB64(bytes){
  let s='';
  bytes.forEach(v=>s+=String.fromCharCode(v));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function vaultUnb64(s){
  s=String(s).replace(/-/g,'+').replace(/_/g,'/');
  s+='='.repeat((4-s.length%4)%4);
  return Uint8Array.from(atob(s),c=>c.charCodeAt(0));
}
async function vaultKey(password,salt){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},
    material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
  );
}
async function vaultEncrypt(password,data,saltInput=null){
  const salt=saltInput||crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await vaultKey(password,salt);
  const plain=new TextEncoder().encode(JSON.stringify(data));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain));
  return {v:1,salt:vaultB64(salt),iv:vaultB64(iv),ct:vaultB64(cipher)};
}
async function vaultDecrypt(password,box){
  const salt=vaultUnb64(box.salt),iv=vaultUnb64(box.iv),ct=vaultUnb64(box.ct);
  const key=await vaultKey(password,salt);
  const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
  return JSON.parse(new TextDecoder().decode(raw));
}
function renderFiles(b){
  const STORE='nullsec.vault.v1';
  let password='',items=[];

  b.innerHTML=`<div class="vault-app">
    <div class="vault-lock">
      <div class="section-tag">LOCAL AES-GCM VAULT</div>
      <h2>VAULT</h2>
      <p class="muted">Encrypted locally in this browser. Your password is never sent to the server.</p>
      <input class="field vault-pass" type="password" autocomplete="current-password" placeholder="Vault password">
      <div class="vault-actions"><button class="btn unlock">UNLOCK / CREATE</button><button class="btn import">IMPORT</button></div>
      <textarea class="field vault-import" style="display:none;height:100px" placeholder="Paste encrypted vault export"></textarea>
      <div class="vault-status"></div>
    </div>
    <div class="vault-open" style="display:none">
      <div class="vault-toolbar"><div><div class="section-tag">ENCRYPTED LOCAL STORAGE</div><h2>VAULT // UNLOCKED</h2></div><div><button class="btn export">EXPORT</button> <button class="btn lock">LOCK</button></div></div>
      <div class="vault-editor">
        <input class="field item-name" maxlength="80" placeholder="Entry name">
        <textarea class="field item-value" placeholder="Secret, note, recovery code, or other text"></textarea>
        <button class="btn save">SAVE ENTRY</button>
      </div>
      <div class="vault-list"></div>
    </div>
  </div>`;

  const lockView=b.querySelector('.vault-lock'),openView=b.querySelector('.vault-open'),status=b.querySelector('.vault-status');
  const pass=b.querySelector('.vault-pass'),list=b.querySelector('.vault-list');

  function draw(){
    list.innerHTML='';
    if(!items.length){
      list.innerHTML='<div class="panel muted">Vault is empty.</div>';
      return;
    }
    items.slice().reverse().forEach((item,revIndex)=>{
      const index=items.length-1-revIndex;
      const row=document.createElement('div');row.className='vault-entry';
      const meta=document.createElement('div');
      const name=document.createElement('b');name.textContent=item.name;
      const value=document.createElement('pre');value.textContent=item.value;
      meta.append(name,value);
      const del=document.createElement('button');del.className='btn';del.textContent='DELETE';
      del.onclick=async()=>{items.splice(index,1);await persist();draw()};
      row.append(meta,del);list.append(row);
    });
  }
  async function persist(){
    const box=await vaultEncrypt(password,{items,updatedAt:Date.now()});
    localStorage.setItem(STORE,JSON.stringify(box));
  }
  async function unlock(){
    password=pass.value;
    if(password.length<8){status.textContent='Use at least 8 characters.';return}
    try{
      const raw=localStorage.getItem(STORE);
      if(raw){
        const data=await vaultDecrypt(password,JSON.parse(raw));
        items=Array.isArray(data.items)?data.items:[];
      }else{
        items=[];
        await persist();
      }
      pass.value='';
      lockView.style.display='none';openView.style.display='block';draw();
    }catch{
      password='';status.textContent='Wrong password or damaged vault.';
    }
  }
  b.querySelector('.unlock').onclick=unlock;
  pass.onkeydown=e=>{if(e.key==='Enter')unlock()};
  b.querySelector('.save').onclick=async()=>{
    const name=b.querySelector('.item-name').value.trim();
    const value=b.querySelector('.item-value').value;
    if(!name||!value)return;
    items.push({name,value,createdAt:Date.now()});
    await persist();
    b.querySelector('.item-name').value='';b.querySelector('.item-value').value='';draw();
  };
  b.querySelector('.lock').onclick=()=>{
    password='';items=[];openView.style.display='none';lockView.style.display='block';status.textContent='Vault locked.';
  };
  b.querySelector('.export').onclick=()=>{
    const raw=localStorage.getItem(STORE)||'';
    const blob=new Blob([raw],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='null-sec-vault.enc.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  b.querySelector('.import').onclick=()=>{
    const t=b.querySelector('.vault-import');t.style.display=t.style.display==='none'?'block':'none';
    if(t.style.display==='block'){
      t.onchange=t.onblur=()=>{
        const raw=t.value.trim();if(!raw)return;
        try{
          const parsed=JSON.parse(raw);
          if(!parsed.salt||!parsed.iv||!parsed.ct)throw 0;
          localStorage.setItem(STORE,JSON.stringify(parsed));status.textContent='Encrypted vault imported. Enter its password to unlock.';
        }catch{status.textContent='Invalid encrypted vault export.'}
      };
    }
  };
}
function renderOps(b){b.innerHTML=`<div class="app-pad"><div class="section-tag">LOCAL TELEMETRY</div><h2>Ops Center</h2><p class="muted">Visual system telemetry only. No remote scanning is performed.</p><div class="ops-grid"><div class="metric"><label>APP COUNT</label><strong>${appDefs.length}</strong></div><div class="metric"><label>OPEN WINDOWS</label><strong id="ow">${wins.size+1}</strong></div><div class="metric"><label>MEMORY EST.</label><strong>${performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576)+'MB':'N/A'}</strong></div><div class="metric"><label>ONLINE</label><strong>${navigator.onLine?'YES':'NO'}</strong></div><div class="metric"><label>CORES</label><strong>${navigator.hardwareConcurrency||'?'}</strong></div><div class="metric"><label>LANG</label><strong>${navigator.language}</strong></div></div><div class="panel" style="margin-top:10px"><pre id="oplog">[OK] desktop compositor\n[OK] local vault\n[OK] app registry\n[OK] media bridge\n[OK] relay health probe queued</pre></div></div>`;fetch('/api/health').then(r=>b.querySelector('#oplog').textContent+=r.ok?'\n[OK] relay online':'\n[WARN] relay unavailable').catch(()=>b.querySelector('#oplog').textContent+='\n[LOCAL] static preview mode')}
function renderNotes(b){b.innerHTML=`<textarea class="notes-area"></textarea>`;const t=b.querySelector('textarea');t.value=state.notes;t.oninput=()=>{state.notes=t.value;localStorage.setItem('nullsec.notes',state.notes)}}
function renderSettings(b){b.innerHTML=`<div class="app-pad"><div class="section-tag">SYSTEM CONFIG</div><h2>Null Sec Preferences</h2><div class="settings-list"><div class="setting"><div><b>Default Browser Mode</b><div class="muted">Scramjet 2 is the built-in browser engine</div></div><select class="field mode"><option value="smart">SMART</option><option value="relay">RELAY</option><option value="direct">DIRECT</option></select></div><div class="setting"><div><b>Local Data</b><div class="muted">Notes and preferences stored in this browser</div></div><button class="btn clear">CLEAR LOCAL DATA</button></div><div class="setting"><div><b>Relay Health</b><div class="muted">Check backend function</div></div><button class="btn health">CHECK</button></div></div></div>`;const m=b.querySelector('.mode');m.value=state.browserMode;m.onchange=()=>{state.browserMode=m.value;localStorage.setItem('nullsec.browserMode',m.value)};b.querySelector('.clear').onclick=()=>{localStorage.clear();alert('Local Null Sec data cleared.')};b.querySelector('.health').onclick=async e=>{try{const r=await fetch('/api/health');e.target.textContent=r.ok?'ONLINE':'FAILED'}catch{e.target.textContent='OFFLINE'}}}
function renderAbout(b){b.innerHTML=`<div class="app-pad"><div class="about-logo">NULL SEC</div><h2>OS 3.0</h2><p class="muted">A browser-native cyber desktop with ${appDefs.length} built-in apps and games, local storage, Scramjet 2 browsing, realtime username chat, E2EE private DMs, OSINT tools, media apps, and games.</p><div class="panel"><b>Operator</b><p>hitboyxx23</p><b>Runtime</b><p>HTML + CSS + JavaScript + Node.js Vercel Functions</p><b>Deployment</b><p>GitHub to Vercel</p></div></div>`}

function renderCalculator(b){b.innerHTML=`<div class="app-pad"><input class="field calc-display" value="0"><div class="calc-grid">${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+','(',')','%','='].map(x=>`<button class="btn">${x}</button>`).join('')}</div></div>`;const d=b.querySelector('.calc-display');b.querySelectorAll('.calc-grid button').forEach(x=>x.onclick=()=>{const v=x.textContent;if(v==='C')d.value='0';else if(v==='='){try{if(!/^[0-9+\-*/().%\s]+$/.test(d.value))throw 0;d.value=Function(`"use strict";return (${d.value})`)()}catch{d.value='ERR'}}else d.value=d.value==='0'?v:d.value+v})}
function renderClock(b){b.innerHTML=`<div class="app-pad"><div class="section-tag">LOCAL TIME</div><div class="clock-big"></div><h2 class="date"></h2><div class="panel muted">Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}</div></div>`;const f=()=>{const d=new Date();b.querySelector('.clock-big').textContent=d.toLocaleTimeString();b.querySelector('.date').textContent=d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})};f();const i=setInterval(f,1000);b.closest('.window')?.querySelector('[data-action=close]')?.addEventListener('click',()=>clearInterval(i),{once:true})}
function renderCalendar(b){const d=new Date(),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells=['SUN','MON','TUE','WED','THU','FRI','SAT'];for(let i=0;i<first;i++)cells.push('');for(let n=1;n<=days;n++)cells.push(n);b.innerHTML=`<div class="app-pad"><div class="section-tag">CALENDAR</div><h2>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><div class="calendar-grid">${cells.map((x,i)=>`<div class="${typeof x==='number'&&x===d.getDate()?'today':''}">${x}</div>`).join('')}</div></div>`}
function renderStopwatch(b){b.innerHTML=`<div class="app-pad"><div class="clock-big sw">00:00.000</div><button class="btn start">START</button> <button class="btn reset">RESET</button><div class="result laps"></div></div>`;let start=0,elapsed=0,t=null;const draw=()=>{const x=Date.now()-start+elapsed;const min=Math.floor(x/60000),sec=Math.floor(x/1000)%60,ms=x%1000;b.querySelector('.sw').textContent=`${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(ms).padStart(3,'0')}`};b.querySelector('.start').onclick=e=>{if(t){clearInterval(t);elapsed+=Date.now()-start;t=null;e.target.textContent='START'}else{start=Date.now();t=setInterval(draw,25);e.target.textContent='STOP'}};b.querySelector('.reset').onclick=()=>{elapsed=0;start=Date.now();draw()}}
function renderTimer(b){b.innerHTML=`<div class="app-pad"><input class="field mins" type="number" min="0" value="5"> minutes <button class="btn go">START</button><div class="clock-big out">05:00</div></div>`;let i;b.querySelector('.go').onclick=()=>{clearInterval(i);let s=Math.max(0,Number(b.querySelector('.mins').value)*60);const f=()=>{b.querySelector('.out').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;if(s--<=0)clearInterval(i)};f();i=setInterval(f,1000)}}
function renderPaint(b){b.innerHTML=`<div class="paint-wrap"><div class="paint-tools"><input type="color" value="#31ff78" class="color"><input type="range" min="1" max="30" value="4" class="size"><button class="btn clear">CLEAR</button></div><canvas></canvas></div>`;const c=b.querySelector('canvas'),ctx=c.getContext('2d');function fit(){const r=c.getBoundingClientRect();const img=ctx.getImageData(0,0,c.width||1,c.height||1);c.width=Math.max(1,r.width);c.height=Math.max(1,r.height);ctx.fillStyle='#f5f5f5';ctx.fillRect(0,0,c.width,c.height);try{ctx.putImageData(img,0,0)}catch{}}setTimeout(fit,20);let down=false,last;function p(e){const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}c.onpointerdown=e=>{down=true;last=p(e);c.setPointerCapture(e.pointerId)};c.onpointermove=e=>{if(!down)return;const q=p(e);ctx.strokeStyle=b.querySelector('.color').value;ctx.lineWidth=+b.querySelector('.size').value;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...q);ctx.stroke();last=q};c.onpointerup=()=>down=false;b.querySelector('.clear').onclick=()=>{ctx.fillStyle='#f5f5f5';ctx.fillRect(0,0,c.width,c.height)}}
function toolShell(b,title,placeholder='Input'){b.innerHTML=`<div class="app-pad"><div class="section-tag">${title}</div><div class="tool-form"><textarea class="field inp" placeholder="${placeholder}"></textarea><div><button class="btn run">RUN</button></div><div class="result out"></div></div></div>`;return{inp:b.querySelector('.inp'),out:b.querySelector('.out'),run:b.querySelector('.run')}}
function renderMarkdown(b){const x=toolShell(b,'MARKDOWN PAD','# Hello\n\n**bold**  `code`');x.run.onclick=()=>{let s=x.inp.value.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])).replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/`(.*?)`/g,'<code>$1</code>').replace(/\n/g,'<br>');x.out.innerHTML=s}}
function renderJSON(b){const x=toolShell(b,'JSON LAB','{"nullsec":true}');x.run.onclick=()=>{try{x.out.textContent=JSON.stringify(JSON.parse(x.inp.value),null,2)}catch(e){x.out.textContent=e.message}}}
function renderBase64(b){const x=toolShell(b,'BASE64','Text to encode or Base64 to decode');x.run.insertAdjacentHTML('afterend',' <button class="btn decode">DECODE</button>');x.run.onclick=()=>{try{x.out.textContent=btoa(unescape(encodeURIComponent(x.inp.value)))}catch(e){x.out.textContent=e.message}};b.querySelector('.decode').onclick=()=>{try{x.out.textContent=decodeURIComponent(escape(atob(x.inp.value.trim())))}catch(e){x.out.textContent=e.message}}}
function renderUrlCodec(b){const x=toolShell(b,'URL CODEC','Text or encoded URL component');x.run.textContent='ENCODE';x.run.insertAdjacentHTML('afterend',' <button class="btn decode">DECODE</button>');x.run.onclick=()=>x.out.textContent=encodeURIComponent(x.inp.value);b.querySelector('.decode').onclick=()=>{try{x.out.textContent=decodeURIComponent(x.inp.value)}catch(e){x.out.textContent=e.message}}}
function renderUUID(b){b.innerHTML=`<div class="app-pad"><button class="btn gen">GENERATE UUID</button><div class="result out" style="margin-top:10px"></div></div>`;b.querySelector('.gen').onclick=()=>b.querySelector('.out').textContent=crypto.randomUUID();b.querySelector('.gen').click()}
function renderPassword(b){b.innerHTML=`<div class="app-pad"><label>Length <input class="field len" type="number" value="20" min="6" max="128"></label> <button class="btn gen">GENERATE</button><div class="result out" style="margin-top:10px"></div></div>`;b.querySelector('.gen').onclick=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=';const n=Math.max(6,Math.min(128,+b.querySelector('.len').value||20));const a=new Uint32Array(n);crypto.getRandomValues(a);b.querySelector('.out').textContent=[...a].map(v=>chars[v%chars.length]).join('')}}
function renderHash(b){const x=toolShell(b,'SHA-256 HASH','Text to hash');x.run.onclick=async()=>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x.inp.value));x.out.textContent=[...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,'0')).join('')}}
function renderRegex(b){b.innerHTML=`<div class="app-pad"><input class="field pat" placeholder="pattern"><input class="field flags" value="gi" placeholder="flags"><textarea class="field txt" style="width:100%;height:140px;margin-top:8px" placeholder="test text"></textarea><button class="btn run" style="margin-top:8px">TEST</button><div class="result out" style="margin-top:8px"></div></div>`;b.querySelector('.run').onclick=()=>{try{const r=new RegExp(b.querySelector('.pat').value,b.querySelector('.flags').value),m=[...b.querySelector('.txt').value.matchAll(r)];b.querySelector('.out').textContent=m.length?m.map((x,i)=>`${i+1}: ${x[0]} @ ${x.index}`).join('\n'):'No matches'}catch(e){b.querySelector('.out').textContent=e.message}}}
function renderColor(b){b.innerHTML=`<div class="app-pad"><input type="color" class="pick" value="#62ff98"><input class="field hex" value="#62ff98"><button class="btn run">CONVERT</button><div class="result out" style="margin-top:10px"></div></div>`;const f=()=>{const h=b.querySelector('.hex').value.replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return;const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));b.querySelector('.out').textContent=`HEX #${h.toUpperCase()}\nRGB ${rgb.join(', ')}\nCSS rgb(${rgb.join(' ')})`;b.querySelector('.pick').value='#'+h};b.querySelector('.pick').oninput=e=>{b.querySelector('.hex').value=e.target.value;f()};b.querySelector('.run').onclick=f;f()}
function renderText(b){const x=toolShell(b,'TEXT LAB','Paste text');x.run.textContent='ANALYZE';x.run.insertAdjacentHTML('afterend',' <button class="btn upper">UPPER</button> <button class="btn lower">LOWER</button>');x.run.onclick=()=>{const s=x.inp.value;x.out.textContent=`Characters: ${s.length}\nWords: ${(s.trim().match(/\S+/g)||[]).length}\nLines: ${s.split('\n').length}`};b.querySelector('.upper').onclick=()=>x.out.textContent=x.inp.value.toUpperCase();b.querySelector('.lower').onclick=()=>x.out.textContent=x.inp.value.toLowerCase()}
function renderAscii(b){const x=toolShell(b,'ASCII STUDIO','NULL SEC');x.run.onclick=()=>{const s=x.inp.value.toUpperCase().slice(0,24);x.out.textContent=`[ ${s} ]\n${'='.repeat(s.length+4)}\n< ${s.split('').join(' ')} >`}}
function renderUnit(b){b.innerHTML=`<div class="app-pad"><input class="field val" type="number" value="1"><select class="field from"><option value="km-mi">km → miles</option><option value="mi-km">miles → km</option><option value="c-f">°C → °F</option><option value="f-c">°F → °C</option><option value="kg-lb">kg → lb</option><option value="lb-kg">lb → kg</option></select><button class="btn run">CONVERT</button><div class="result out" style="margin-top:10px"></div></div>`;b.querySelector('.run').onclick=()=>{const v=+b.querySelector('.val').value,t=b.querySelector('.from').value;const r={ 'km-mi':v*.621371,'mi-km':v/ .621371,'c-f':v*9/5+32,'f-c':(v-32)*5/9,'kg-lb':v*2.20462,'lb-kg':v/2.20462}[t];b.querySelector('.out').textContent=String(Math.round(r*10000)/10000)}}
function renderRandom(b){b.innerHTML=`<div class="app-pad"><input class="field min" type="number" value="1"> to <input class="field max" type="number" value="100"> <button class="btn run">RANDOM</button><div class="clock-big out"></div></div>`;b.querySelector('.run').onclick=()=>{const a=+b.querySelector('.min').value,c=+b.querySelector('.max').value;b.querySelector('.out').textContent=Math.floor(Math.random()*(c-a+1))+a}}
function renderClipboard(b){const x=toolShell(b,'CLIPBOARD HELPER','Text to copy');x.run.textContent='COPY';x.run.onclick=async()=>{try{await navigator.clipboard.writeText(x.inp.value);x.out.textContent='Copied to clipboard.'}catch{x.out.textContent='Clipboard permission unavailable.'}}}
function renderSystemMon(b){b.innerHTML=`<div class="app-pad"><div class="section-tag">BROWSER RUNTIME</div><div class="result">User agent: ${navigator.userAgent}\nPlatform: ${navigator.platform}\nLanguage: ${navigator.language}\nCPU cores: ${navigator.hardwareConcurrency||'?'}\nOnline: ${navigator.onLine}\nCookies: ${navigator.cookieEnabled}\nScreen: ${screen.width}x${screen.height}\nViewport: ${innerWidth}x${innerHeight}</div></div>`}
function renderStorage(b){const rows=Object.keys(localStorage).map(k=>`${k} = ${localStorage.getItem(k)}`).join('\n')||'No localStorage entries.';b.innerHTML=`<div class="app-pad"><div class="section-tag">LOCAL STORAGE</div><div class="result">${escapeHtml(rows)}</div></div>`}
function renderNetwork(b){b.innerHTML=`<div class="app-pad"><input class="field url" placeholder="https://example.com"><button class="btn inspect">INSPECT URL</button><div class="result out" style="margin-top:10px"></div></div>`;b.querySelector('.inspect').onclick=()=>{try{const u=new URL(b.querySelector('.url').value);b.querySelector('.out').textContent=`protocol: ${u.protocol}\nhost: ${u.host}\nhostname: ${u.hostname}\nport: ${u.port||'(default)'}\npath: ${u.pathname}\nquery: ${u.search||'(none)'}\nhash: ${u.hash||'(none)'}`}catch(e){b.querySelector('.out').textContent=e.message}}}
function renderQR(b){b.innerHTML=`<div class="app-pad"><div class="section-tag">NODE QR FORGE</div><h2>Generate QR locally through /api/qr</h2><p class="muted">The Node backend generates the PNG and returns it directly to this app. Nothing opens in another tab.</p><div class="row"><input class="field txt" style="flex:1" placeholder="Text or URL"><button class="btn go">GENERATE</button></div><div class="panel" style="margin-top:14px;min-height:300px;display:grid;place-items:center"><img class="qr-out" alt="Generated QR" style="max-width:280px;image-rendering:pixelated"></div></div>`;b.querySelector('.go').onclick=()=>{const v=b.querySelector('.txt').value;if(!v)return;b.querySelector('.qr-out').src='/api/qr?text='+encodeURIComponent(v)+'&t='+Date.now()}}

function gameTitle(b,title,html=''){b.innerHTML=`<div class="game-wrap"><div class="game-panel"><div class="section-tag">NULL ARCADE</div><h2>${title}</h2>${html}</div></div>`}
function renderTicTacToe(b){gameTitle(b,'TIC TAC TOE','<div class="tic"></div><p class="muted status">X to move</p>');let board=Array(9).fill(''),turn='X';const t=b.querySelector('.tic'),status=b.querySelector('.status');for(let i=0;i<9;i++){const x=document.createElement('button');x.className='btn';x.onclick=()=>{if(board[i])return;board[i]=turn;x.textContent=turn;const w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(a=>a.every(j=>board[j]===turn));if(w)status.textContent=turn+' wins';else{turn=turn==='X'?'O':'X';status.textContent=turn+' to move'}};t.append(x)}}
function renderMemory(b){const vals=['◆','●','▲','■','✦','✚','◉','⌁'];let deck=[...vals,...vals].sort(()=>Math.random()-.5),open=[];gameTitle(b,'MEMORY','<div class="memory-grid"></div><p class="muted status">Match all pairs</p>');const g=b.querySelector('.memory-grid');deck.forEach((v,i)=>{const x=document.createElement('button');x.className='btn memory-card';x.textContent='?';x.onclick=()=>{if(x.dataset.done||open.includes(i)||open.length===2)return;x.textContent=v;open.push(i);if(open.length===2){const[a,c]=open;if(deck[a]===deck[c]){[a,c].forEach(j=>g.children[j].dataset.done='1');open=[]}else setTimeout(()=>{[a,c].forEach(j=>g.children[j].textContent='?');open=[]},600)}};g.append(x)})}
function renderClicker(b){gameTitle(b,'NULL CLICKER','<div class="clock-big score">0</div><button class="btn click-zone">CLICK</button>');let n=0;b.querySelector('.click-zone').onclick=()=>b.querySelector('.score').textContent=++n}
function renderReaction(b){gameTitle(b,'REACTION TEST','<div class="reaction">CLICK TO ARM</div><p class="muted out"></p>');const z=b.querySelector('.reaction'),o=b.querySelector('.out');let ready=false,start=0,t;z.onclick=()=>{if(ready){o.textContent=`${Date.now()-start} ms`;ready=false;z.textContent='CLICK TO ARM';z.style.background=''}else{z.textContent='WAIT...';o.textContent='';clearTimeout(t);t=setTimeout(()=>{ready=true;start=Date.now();z.textContent='CLICK NOW';z.style.background='#0b2a14'},800+Math.random()*2200)}}}
function renderTyping(b){const phrase='null sec os runs entirely inside your browser';gameTitle(b,'TYPING TEST',`<p>${phrase}</p><input class="field type" style="width:100%" placeholder="Type the sentence"><p class="muted out"></p>`);let start;b.querySelector('.type').onfocus=()=>start||=Date.now();b.querySelector('.type').oninput=e=>{if(e.target.value===phrase){const mins=(Date.now()-start)/60000;b.querySelector('.out').textContent=`Complete: ${Math.round(phrase.split(' ').length/mins)} WPM`}}}
function renderGuess(b){const n=Math.floor(Math.random()*100)+1;gameTitle(b,'NUMBER GUESS','<input class="field g" type="number" min="1" max="100"><button class="btn go">GUESS</button><p class="muted out"></p>');b.querySelector('.go').onclick=()=>{const v=+b.querySelector('.g').value;b.querySelector('.out').textContent=v===n?'Correct':v<n?'Higher':'Lower'}}
function renderDice(b){gameTitle(b,'DICE','<div class="clock-big out">⚀</div><button class="btn go">ROLL</button>');const d=['⚀','⚁','⚂','⚃','⚄','⚅'];b.querySelector('.go').onclick=()=>b.querySelector('.out').textContent=d[Math.floor(Math.random()*6)]}
function renderCoin(b){gameTitle(b,'COIN FLIP','<div class="clock-big out">◐</div><button class="btn go">FLIP</button>');b.querySelector('.go').onclick=()=>b.querySelector('.out').textContent=Math.random()<.5?'HEADS':'TAILS'}
function renderRPS(b){gameTitle(b,'ROCK PAPER SCISSORS','<div><button class="btn" data-v="ROCK">ROCK</button> <button class="btn" data-v="PAPER">PAPER</button> <button class="btn" data-v="SCISSORS">SCISSORS</button></div><p class="muted out"></p>');const vals=['ROCK','PAPER','SCISSORS'];b.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{const p=x.dataset.v,c=vals[Math.floor(Math.random()*3)],win=(p==='ROCK'&&c==='SCISSORS')||(p==='PAPER'&&c==='ROCK')||(p==='SCISSORS'&&c==='PAPER');b.querySelector('.out').textContent=`CPU: ${c} | ${p===c?'DRAW':win?'YOU WIN':'CPU WINS'}`})}
function renderLights(b){gameTitle(b,'LIGHTS OUT','<div class="memory-grid lights"></div>');const g=b.querySelector('.lights');let s=Array(16).fill(0).map(()=>Math.random()>.5?1:0);function draw(){g.innerHTML='';s.forEach((v,i)=>{const x=document.createElement('button');x.className='btn memory-card';x.style.background=v?'#143d22':'#030805';x.onclick=()=>{[i,i-1,i+1,i-4,i+4].forEach(j=>{if(j>=0&&j<16&&!(i%4===0&&j===i-1)&&!(i%4===3&&j===i+1))s[j]^=1});draw()};g.append(x)})}draw()}
function renderSimon(b){gameTitle(b,'SIMON','<div class="grid2 simon"></div><p class="muted out">Press START</p><button class="btn start">START</button>');const g=b.querySelector('.simon');for(let i=0;i<4;i++){const x=document.createElement('button');x.className='btn';x.textContent=i+1;x.style.height='90px';g.append(x)}let seq=[],idx=0,locked=true;function flash(i){const x=g.children[i];x.style.background='#124322';setTimeout(()=>x.style.background='',300)}function play(){locked=true;let k=0;const t=setInterval(()=>{flash(seq[k++]);if(k===seq.length){clearInterval(t);setTimeout(()=>{locked=false;idx=0},350)}},500)}b.querySelector('.start').onclick=()=>{seq=[];next()};function next(){seq.push(Math.floor(Math.random()*4));b.querySelector('.out').textContent=`Round ${seq.length}`;play()}[...g.children].forEach((x,i)=>x.onclick=()=>{if(locked)return;flash(i);if(i!==seq[idx]){b.querySelector('.out').textContent='Game over';locked=true;return}if(++idx===seq.length)setTimeout(next,500)})}
function renderMines(b){gameTitle(b,'MINES','<div class="mines"></div><p class="muted out">10 mines</p>');const N=81,mines=new Set();while(mines.size<10)mines.add(Math.floor(Math.random()*N));const g=b.querySelector('.mines'),opened=new Set();function count(i){let c=0;const r=Math.floor(i/9),col=i%9;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=col+dc,j=rr*9+cc;if(rr>=0&&rr<9&&cc>=0&&cc<9&&mines.has(j))c++}return c}for(let i=0;i<N;i++){const x=document.createElement('button');x.className='btn';x.onclick=()=>{if(opened.has(i))return;opened.add(i);if(mines.has(i)){x.textContent='✹';b.querySelector('.out').textContent='Boom'}else{x.textContent=count(i)||'';x.style.background='#09130c'}};g.append(x)}}
function canvasGame(b,title,w,h,setup){gameTitle(b,title,`<canvas class="game-canvas" width="${w}" height="${h}"></canvas><p class="muted out"></p>`);setup(b.querySelector('canvas'),b.querySelector('.out'))}
function renderSnake(b){canvasGame(b,'SNAKE',420,300,(c,out)=>{const x=c.getContext('2d'),S=15,cols=28,rows=20;let snake=[[8,10],[7,10],[6,10]],d=[1,0],food=[18,10],score=0,alive=true;function foodNew(){food=[Math.floor(Math.random()*cols),Math.floor(Math.random()*rows)]}addEventListener('keydown',key);function key(e){const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(m&&!(m[0]===-d[0]&&m[1]===-d[1]))d=m}const t=setInterval(()=>{if(!alive){clearInterval(t);removeEventListener('keydown',key);return}const h=[snake[0][0]+d[0],snake[0][1]+d[1]];if(h[0]<0||h[1]<0||h[0]>=cols||h[1]>=rows||snake.some(s=>s[0]===h[0]&&s[1]===h[1])){alive=false;out.textContent=`Game over. Score ${score}`;return}snake.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){score++;foodNew()}else snake.pop();x.fillStyle='#010302';x.fillRect(0,0,c.width,c.height);x.fillStyle='#62ff98';snake.forEach(s=>x.fillRect(s[0]*S+1,s[1]*S+1,S-2,S-2));x.fillStyle='#ff5f79';x.fillRect(food[0]*S+2,food[1]*S+2,S-4,S-4);out.textContent=`Score ${score}`},100)})}
function renderPong(b){canvasGame(b,'PONG',520,300,(c,out)=>{const x=c.getContext('2d');let py=120,ey=120,bx=260,by=150,dx=3,dy=2,ps=0,es=0;function move(e){const r=c.getBoundingClientRect();py=Math.max(0,Math.min(240,e.clientY-r.top-30))}c.addEventListener('pointermove',move);const t=setInterval(()=>{ey+=(by-ey-30)*.05;bx+=dx;by+=dy;if(by<5||by>295)dy*=-1;if(bx<22&&by>py&&by<py+60)dx=Math.abs(dx);if(bx>498&&by>ey&&by<ey+60)dx=-Math.abs(dx);if(bx<0){es++;bx=260}if(bx>520){ps++;bx=260}x.fillStyle='#010302';x.fillRect(0,0,520,300);x.fillStyle='#62ff98';x.fillRect(10,py,8,60);x.fillRect(502,ey,8,60);x.fillRect(bx-4,by-4,8,8);out.textContent=`${ps} : ${es}`},16);b.closest('.window').querySelector('[data-action=close]').addEventListener('click',()=>clearInterval(t),{once:true})})}
function renderBreakout(b){canvasGame(b,'BREAKOUT',520,320,(c,out)=>{const x=c.getContext('2d');let paddle=220,bx=260,by=250,dx=3,dy=-3,score=0;let bricks=[];for(let r=0;r<4;r++)for(let k=0;k<8;k++)bricks.push({x:20+k*62,y:20+r*25,on:1});c.onpointermove=e=>{const r=c.getBoundingClientRect();paddle=Math.max(0,Math.min(440,e.clientX-r.left-40))};const t=setInterval(()=>{bx+=dx;by+=dy;if(bx<5||bx>515)dx*=-1;if(by<5)dy=Math.abs(dy);if(by>290&&by<305&&bx>paddle&&bx<paddle+80)dy=-Math.abs(dy);for(const q of bricks)if(q.on&&bx>q.x&&bx<q.x+54&&by>q.y&&by<q.y+16){q.on=0;dy*=-1;score++}if(by>330){out.textContent=`Game over. Score ${score}`;clearInterval(t)}x.fillStyle='#010302';x.fillRect(0,0,520,320);x.fillStyle='#62ff98';x.fillRect(paddle,300,80,8);x.fillRect(bx-4,by-4,8,8);bricks.filter(q=>q.on).forEach(q=>x.fillRect(q.x,q.y,54,16));out.textContent=`Score ${score}`},16)})}
function renderMaze(b){canvasGame(b,'MAZE RUNNER',360,360,(c,out)=>{const x=c.getContext('2d'),N=12,S=30;let p=[0,0],goal=[11,11];const walls=new Set();for(let i=0;i<45;i++)walls.add(`${Math.floor(Math.random()*N)},${Math.floor(Math.random()*N)}`);walls.delete('0,0');walls.delete('11,11');function draw(){x.fillStyle='#010302';x.fillRect(0,0,360,360);x.fillStyle='#14331e';walls.forEach(v=>{const[a,d]=v.split(',').map(Number);x.fillRect(a*S,d*S,S-1,S-1)});x.fillStyle='#62ff98';x.fillRect(p[0]*S+5,p[1]*S+5,S-10,S-10);x.fillStyle='#ff5f79';x.fillRect(goal[0]*S+8,goal[1]*S+8,S-16,S-16)}function key(e){const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(!m)return;const n=[p[0]+m[0],p[1]+m[1]];if(n[0]>=0&&n[1]>=0&&n[0]<N&&n[1]<N&&!walls.has(`${n[0]},${n[1]}`))p=n;draw();if(p[0]===11&&p[1]===11){out.textContent='Escaped';removeEventListener('keydown',key)}}addEventListener('keydown',key);draw()})}
function render2048(b){gameTitle(b,'2048','<div class="memory-grid board2048"></div><p class="muted out">Use arrow keys</p>');const g=b.querySelector('.board2048');let a=Array(16).fill(0);function add(){const e=a.map((v,i)=>v?null:i).filter(v=>v!==null);if(e.length)a[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4}add();add();function draw(){g.innerHTML='';a.forEach(v=>{const x=document.createElement('button');x.className='btn memory-card';x.textContent=v||'';g.append(x)})}function compress(row){let q=row.filter(Boolean);for(let i=0;i<q.length-1;i++)if(q[i]===q[i+1]){q[i]*=2;q.splice(i+1,1)}while(q.length<4)q.push(0);return q}function move(key){let old=a.join(',');if(key==='ArrowLeft'||key==='ArrowRight')for(let r=0;r<4;r++){let row=a.slice(r*4,r*4+4);if(key==='ArrowRight')row.reverse();row=compress(row);if(key==='ArrowRight')row.reverse();a.splice(r*4,4,...row)}else for(let c=0;c<4;c++){let row=[a[c],a[c+4],a[c+8],a[c+12]];if(key==='ArrowDown')row.reverse();row=compress(row);if(key==='ArrowDown')row.reverse();[0,1,2,3].forEach((r,i)=>a[c+r*4]=row[i])}if(a.join(',')!==old)add();draw()}function key(e){if(e.key.startsWith('Arrow')){e.preventDefault();move(e.key)}}addEventListener('keydown',key);draw()}

function intelShell(b,title,subtitle,placeholder,button='QUERY'){
  b.innerHTML=`<div class="intel-shell"><div class="intel-head"><div><div class="section-tag">PASSIVE INTELLIGENCE // NULL SEC</div><h2>${title}</h2></div><span class="intel-badge">PUBLIC DATA</span></div><p class="intel-note">${subtitle}</p><div class="intel-form"><input class="field intel-input" placeholder="${placeholder}"><button class="btn intel-run">${button}</button></div><div class="intel-out">READY.</div></div>`;
  return {input:b.querySelector('.intel-input'),run:b.querySelector('.intel-run'),out:b.querySelector('.intel-out')};
}
async function intelFetch(out,url){out.textContent='QUERYING...';try{const r=await fetch(url,{cache:'no-store'});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={error:text}}if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}catch(e){out.textContent='ERROR: '+e.message;throw e}}
function pretty(v){return JSON.stringify(v,null,2)}
function renderOSINTCenter(b){const ids=['usernameintel','dnsintel','rdapintel','ctintel','headerintel','robotsintel','urlclean','leakscan','fileintel','jwtscope','passaudit','privacycheck'];b.innerHTML=`<div class="intel-shell"><div class="intel-head"><div><div class="section-tag">NULL SEC INTELLIGENCE WORKBENCH</div><h2>OSINT + OPSEC Center</h2></div><span class="intel-badge">PASSIVE MODE</span></div><p class="intel-note">Public-record lookups and local privacy tools. Network modules avoid port scanning, credential testing, private-network access, or intrusive collection.</p><div class="intel-grid">${ids.map(id=>`<button class="intel-card btn" data-open="${id}"><b>${apps[id].icon} ${apps[id].title}</b><span>${apps[id].desc}</span></button>`).join('')}</div></div>`}

function chatB64(bytes){
  let s='';bytes.forEach(v=>s+=String.fromCharCode(v));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function chatUnb64(s){
  s=String(s).replace(/-/g,'+').replace(/_/g,'/');
  s+='='.repeat((4-s.length%4)%4);
  return Uint8Array.from(atob(s),c=>c.charCodeAt(0));
}
async function chatExportPub(key){
  return chatB64(new Uint8Array(await crypto.subtle.exportKey('raw',key)));
}
async function chatImportPub(raw){
  return crypto.subtle.importKey('raw',chatUnb64(raw),{name:'ECDH',namedCurve:'P-256'},false,[]);
}
async function chatSharedKey(priv,remoteRaw){
  const remote=await chatImportPub(remoteRaw);
  const bits=await crypto.subtle.deriveBits({name:'ECDH',public:remote},priv,256);
  return crypto.subtle.importKey('raw',bits,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function chatEncrypt(key,text){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text)));
  return {iv:chatB64(iv),ct:chatB64(ct)};
}
async function chatDecrypt(key,iv,ct){
  const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:chatUnb64(iv)},key,chatUnb64(ct));
  return new TextDecoder().decode(raw);
}
async function chatFingerprint(pubRaw){
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',chatUnb64(pubRaw)));
  return [...hash.slice(0,12)].map(v=>v.toString(16).padStart(2,'0')).join(':');
}
function renderNullCrypt(b){
  b.innerHTML=`<div class="chat-shell">
    <aside class="chat-side">
      <div class="section-tag">NULL COMMS</div><h2>NULL CHAT</h2>
      <div class="chat-login">
        <input class="field username" maxlength="20" placeholder="username">
        <button class="btn connect">GO ONLINE</button>
      </div>
      <div class="chat-me">OFFLINE</div>
      <div class="chat-section">CHANNELS</div>
      <button class="chat-peer active" data-public="1"># PUBLIC</button>
      <div class="chat-section">ONLINE USERS</div>
      <div class="peer-list"></div>
    </aside>
    <main class="chat-main">
      <header class="chat-head">
        <div><b class="chat-target"># PUBLIC</b><small class="chat-security">WSS transport encrypted</small></div>
        <div class="chat-callbar">
          <button class="btn call" disabled>CALL</button>
          <button class="btn answer" style="display:none">ANSWER</button>
          <button class="btn mute" disabled>MUTE</button>
          <button class="btn hang" disabled>HANG UP</button>
          <span class="chat-state">OFFLINE</span>
        </div>
      </header>
      <div class="chat-log"><div class="chat-system">Choose a username to join.</div></div>
      <div class="chat-compose"><input class="field message" placeholder="Message" disabled><button class="btn send" disabled>SEND</button></div>
      <audio class="chat-audio" autoplay></audio>
    </main>
  </div>`;

  let ws=null,keypair=null,myPub='',me='',target='public';
  let pc=null,micStream=null,pendingOffer=null,pendingCaller='',muted=false,callPeer='',remoteReady=false;
  let pendingIce=[];let rtcConfig={iceServers:[{urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302']}]};
  fetch('/null-data/rtc-config',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d?.ok&&Array.isArray(d.iceServers))rtcConfig={iceServers:d.iceServers}}).catch(()=>{});
  const peers=new Map();
  const side=b.querySelector('.peer-list'),log=b.querySelector('.chat-log'),stateEl=b.querySelector('.chat-state');
  const targetEl=b.querySelector('.chat-target'),secEl=b.querySelector('.chat-security');
  const input=b.querySelector('.message'),sendBtn=b.querySelector('.send');
  const callBtn=b.querySelector('.call'),answerBtn=b.querySelector('.answer'),muteBtn=b.querySelector('.mute'),hangBtn=b.querySelector('.hang');
  const audio=b.querySelector('.chat-audio');

  const historyKey=()=>me?'nullsec.chat.history.'+me:null;
  function savedHistory(){
    try{return JSON.parse(localStorage.getItem(historyKey())||'[]')}catch{return[]}
  }
  function remember(kind,from,text){
    if(!me||kind==='system')return;
    const arr=savedHistory();
    arr.push({kind,from,text,at:Date.now()});
    localStorage.setItem(historyKey(),JSON.stringify(arr.slice(-100)));
  }
  function clearRenderedMessages(){
    log.innerHTML='';
  }
  function add(kind,from,text,save=true){
    const row=document.createElement('div');row.className='chat-msg '+kind;
    const who=document.createElement('b');who.textContent=from;
    const body=document.createElement('span');body.textContent=text;
    row.append(who,body);log.append(row);log.scrollTop=log.scrollHeight;
    if(save)remember(kind,from,text);
  }
  function system(t){add('system','SYSTEM',t,false)}
  function restoreLocal(){
    const arr=savedHistory();
    if(!arr.length)return;
    system('LOCAL RECENT HISTORY');
    arr.forEach(x=>add(x.kind,x.from,x.text,false));
  }
  function choose(next){
    target=next;
    b.querySelectorAll('.chat-peer').forEach(x=>x.classList.toggle('active',(next==='public'&&x.dataset.public)||(x.dataset.user===next)));
    const isPeer=next!=='public'&&peers.has(next);
    callBtn.disabled=!isPeer||!ws||ws.readyState!==1;
    if(next==='public'){
      targetEl.textContent='# PUBLIC';secEl.textContent='Public channel, WSS transport encrypted';
    }else{
      targetEl.textContent='@'+next;
      const p=peers.get(next);
      secEl.textContent=p?'E2EE DM • verify '+p.fp:'E2EE DM';
    }
  }
  async function redrawUsers(list){
    peers.clear();side.innerHTML='';
    for(const u of list){
      if(u.username===me)continue;
      const fp=await chatFingerprint(u.pub).catch(()=>'?');
      peers.set(u.username,{pub:u.pub,fp});
      const btn=document.createElement('button');
      btn.className='chat-peer';btn.dataset.user=u.username;
      btn.innerHTML=`<span>@${escapeHtml(u.username)}</span><small>${escapeHtml(fp)}</small>`;
      btn.onclick=()=>choose(u.username);
      side.append(btn);
    }
    if(target!=='public'&&!peers.has(target))choose('public');else choose(target);
  }

  async function ensureMic(){
    if(micStream)return micStream;
    micStream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    });
    return micStream;
  }
  async function flushIce(){
    if(!pc||!pc.remoteDescription)return;
    const queue=pendingIce.splice(0);
    for(const cand of queue){try{await pc.addIceCandidate(cand)}catch(e){system('ICE ERROR: '+e.message)}}
  }
  async function makePeer(peerName){
    if(pc){try{pc.close()}catch{}}
    pendingIce=[];remoteReady=false;callPeer=peerName;
    const stream=await ensureMic();
    pc=new RTCPeerConnection(rtcConfig);
    stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    pc.ontrack=async e=>{audio.srcObject=e.streams[0]||new MediaStream([e.track]);try{await audio.play()}catch{}system('VOICE CONNECTED @'+peerName)};
    pc.onicecandidate=e=>{if(e.candidate&&ws?.readyState===1)ws.send(JSON.stringify({type:'voice_ice',to:peerName,candidate:e.candidate}))};
    pc.onicecandidateerror=e=>{if(e.errorText)system('ICE: '+e.errorText)};
    pc.onconnectionstatechange=()=>{if(!pc)return;const s=pc.connectionState;stateEl.textContent=s==='connected'?'VOICE':s==='connecting'?'CALLING':'ONLINE';if(s==='connected')system('CALL ACTIVE @'+peerName);if(['failed','closed'].includes(s)){system('VOICE '+s.toUpperCase());hangup(false)}};
    muteBtn.disabled=false;hangBtn.disabled=false;return pc;
  }
  async function startCall(){
    if(target==='public'||!peers.has(target)||!ws||ws.readyState!==1)return;
    try{const peer=await makePeer(target);const offer=await peer.createOffer({offerToReceiveAudio:true});await peer.setLocalDescription(offer);ws.send(JSON.stringify({type:'voice_offer',to:target,sdp:peer.localDescription}));stateEl.textContent='CALLING';system('CALLING @'+target)}catch(e){system('VOICE ERROR: '+e.message)}
  }
  async function answerCall(){
    if(!pendingOffer||!pendingCaller)return;
    try{choose(pendingCaller);const peer=await makePeer(pendingCaller);await peer.setRemoteDescription(pendingOffer);remoteReady=true;await flushIce();const answer=await peer.createAnswer();await peer.setLocalDescription(answer);ws.send(JSON.stringify({type:'voice_answer',to:pendingCaller,sdp:peer.localDescription}));pendingOffer=null;pendingCaller='';answerBtn.style.display='none';stateEl.textContent='CONNECTING'}catch(e){system('VOICE ERROR: '+e.message)}
  }
  function hangup(notify=true){
    const peerName=callPeer||target;if(notify&&peerName&&peerName!=='public'&&ws?.readyState===1)ws.send(JSON.stringify({type:'voice_hangup',to:peerName}));try{pc?.close()}catch{}pc=null;pendingIce=[];remoteReady=false;callPeer='';audio.srcObject=null;muteBtn.disabled=true;hangBtn.disabled=true;muted=false;muteBtn.textContent='MUTE';if(ws?.readyState===1)stateEl.textContent='ONLINE';
  }

  async function connect(){
    const name=b.querySelector('.username').value.trim();
    if(!/^[A-Za-z0-9_]{3,20}$/.test(name)){system('Username must be 3-20 letters, numbers, or underscore.');return}
    try{
      keypair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
      myPub=await chatExportPub(keypair.publicKey);me=name;
      clearRenderedMessages();restoreLocal();
      const proto=location.protocol==='https:'?'wss':'ws';
      ws=new WebSocket(`${proto}://${location.host}/chat/`);
      stateEl.textContent='CONNECTING';
      ws.onopen=()=>ws.send(JSON.stringify({type:'hello',username:me,pub:myPub}));
      ws.onclose=()=>{stateEl.textContent='OFFLINE';input.disabled=true;sendBtn.disabled=true;callBtn.disabled=true;hangup(false);system('Connection closed.')};
      ws.onerror=()=>system('Realtime chat connection error.');
      ws.onmessage=async e=>{
        let m;try{m=JSON.parse(e.data)}catch{return}
        if(m.type==='ready'){
          stateEl.textContent='ONLINE';b.querySelector('.chat-me').textContent='@'+me;
          input.disabled=false;sendBtn.disabled=false;choose(target);system('Connected as @'+me);
          return;
        }
        if(m.type==='history'){
          if(Array.isArray(m.messages)&&m.messages.length){
            system('SERVER PUBLIC RECENT');
            m.messages.forEach(x=>add('public','@'+x.from,x.text,false));
          }
          return;
        }
        if(m.type==='presence'){await redrawUsers(m.users||[]);return}
        if(m.type==='system'){system(m.text);return}
        if(m.type==='error'){system('ERROR: '+m.message);return}
        if(m.type==='public'){add('public','@'+m.from,m.text);return}
        if(m.type==='dm'){
          try{
            const key=await chatSharedKey(keypair.privateKey,m.pub);
            const text=await chatDecrypt(key,m.iv,m.ct);
            add('private','@'+m.from,text);
          }catch{system('Could not decrypt DM from @'+m.from)}
          return;
        }
        if(m.type==='voice_offer'){
          pendingOffer=m.sdp;pendingCaller=m.from;answerBtn.style.display='inline-block';
          system('INCOMING VOICE CALL FROM @'+m.from+' • press ANSWER');
          return;
        }
        if(m.type==='voice_answer'){
          try{if(pc){await pc.setRemoteDescription(m.sdp);remoteReady=true;await flushIce();stateEl.textContent='CONNECTING'}}catch(e){system('VOICE ANSWER ERROR: '+e.message)}
          return;
        }
        if(m.type==='voice_ice'){
          if(!m.candidate)return;
          if(!pc||!pc.remoteDescription){pendingIce.push(m.candidate);return}
          try{await pc.addIceCandidate(m.candidate)}catch(e){system('ICE ERROR: '+e.message)}
          return;
        }
        if(m.type==='voice_hangup'){
          hangup(false);system('@'+m.from+' ENDED THE CALL');return;
        }
      };
    }catch(e){system('ERROR: '+e.message)}
  }

  async function sendMessage(){
    const text=input.value.trim();if(!text||!ws||ws.readyState!==1)return;
    if(target==='public'){
      ws.send(JSON.stringify({type:'public',text}));
      input.value='';return;
    }
    const p=peers.get(target);if(!p){system('That user is offline.');return}
    try{
      const key=await chatSharedKey(keypair.privateKey,p.pub);
      const enc=await chatEncrypt(key,text);
      ws.send(JSON.stringify({type:'dm',to:target,...enc}));
      add('private','YOU → @'+target,text);
      input.value='';
    }catch(e){system('Encryption failed: '+e.message)}
  }

  b.querySelector('.connect').onclick=connect;
  b.querySelector('.chat-peer[data-public]').onclick=()=>choose('public');
  sendBtn.onclick=sendMessage;input.onkeydown=e=>{if(e.key==='Enter')sendMessage()};
  callBtn.onclick=startCall;answerBtn.onclick=answerCall;
  muteBtn.onclick=()=>{
    if(!micStream)return;
    muted=!muted;micStream.getAudioTracks().forEach(t=>t.enabled=!muted);
    muteBtn.textContent=muted?'UNMUTE':'MUTE';
  };
  hangBtn.onclick=()=>hangup(true);

  const close=b.closest('.window')?.querySelector('[data-action=close]');
  close?.addEventListener('click',()=>{
    try{ws&&ws.close()}catch{}
    hangup(false);
    try{micStream?.getTracks().forEach(t=>t.stop())}catch{}
  },{once:true});
}
function renderUsernameIntel(b){
  b.innerHTML=`<div class="intel-shell">
    <div class="intel-head"><div><div class="section-tag">PASSIVE ACCOUNT DISCOVERY</div><h2>Username OSINT</h2></div><span class="intel-badge">PUBLIC ONLY</span></div>
    <p class="intel-note">Checks whether a public profile URL appears to exist across selected services. No login attempts, password testing, private APIs, or account enumeration behind authentication.</p>
    <div class="intel-row"><input class="field uname" placeholder="username"><button class="btn run">CHECK FOOTPRINT</button></div>
    <div class="intel-out">READY.</div>
  </div>`;
  const input=b.querySelector('.uname'), out=b.querySelector('.intel-out'), run=b.querySelector('.run');
  async function scan(){
    const u=input.value.trim();
    if(!u){out.textContent='Enter a username.';return}
    run.disabled=true;out.textContent='CHECKING PUBLIC PROFILE PAGES...';
    try{
      const r=await fetch('/api/osint/username?username='+encodeURIComponent(u),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
      const icon=s=>s==='found'?'[+]':s==='not_found'?'[-]':'[?]';
      const rows=d.results.map(x=>`${icon(x.state)} ${x.platform.padEnd(14)} ${String(x.status??'---').padEnd(3)} ${x.state.toUpperCase()}\n    ${x.url}`).join('\n');
      out.textContent=`USERNAME: ${d.username}\nCHECKED: ${d.checked}\nFOUND: ${d.summary.found||0}  NOT FOUND: ${d.summary.not_found||0}  UNCERTAIN: ${d.summary.uncertain||0}\n\n${rows}\n\n${d.disclaimer}`;
    }catch(e){out.textContent='ERROR: '+e.message}
    finally{run.disabled=false}
  }
  run.onclick=scan; input.onkeydown=e=>{if(e.key==='Enter')scan()};
}
function renderDNSIntel(b){const x=intelShell(b,'DNS Lens','Resolve public DNS records using the Null Sec Node backend.','example.com');x.run.onclick=async()=>{const d=await intelFetch(x.out,'/api/osint/dns?domain='+encodeURIComponent(x.input.value));if(d)x.out.textContent=Object.entries(d.records).map(([k,v])=>`${k}\n${v.length?pretty(v):'  (none)'}`).join('\n\n')}}
function renderRDAPIntel(b){const x=intelShell(b,'RDAP Lens','Inspect public registration data for a domain or public IP.','example.com or 8.8.8.8');x.run.onclick=async()=>{const d=await intelFetch(x.out,'/api/osint/rdap?q='+encodeURIComponent(x.input.value));if(d){const ev=Array.isArray(d.events)?d.events.map(e=>`${e.eventAction}: ${e.eventDate}`).join('\n'):'';x.out.textContent=[`handle: ${d.handle||'(none)'}`,`name: ${d.ldhName||d.name||'(none)'}`,`status: ${(d.status||[]).join(', ')||'(none)'}`,ev&&`events:\n${ev}`,d.entities&&`entities: ${d.entities.length}`].filter(Boolean).join('\n')}}}
function renderCTIntel(b){const x=intelShell(b,'Cert Lens','List hostnames observed in public certificate-transparency logs.','example.com');x.run.onclick=async()=>{const d=await intelFetch(x.out,'/api/osint/ct?domain='+encodeURIComponent(x.input.value));if(d)x.out.textContent=`DOMAIN: ${d.domain}\nUNIQUE NAMES: ${d.count}${d.truncated?' +':''}\n\n${d.names.join('\n')}`}}
function renderHeaderIntel(b){const x=intelShell(b,'Header Scope','Inspect public HTTP response and common defensive headers.','https://example.com');x.run.onclick=async()=>{const d=await intelFetch(x.out,'/api/osint/headers?url='+encodeURIComponent(x.input.value));if(d)x.out.textContent=`STATUS: ${d.status}\nFINAL: ${d.finalUrl}\n\n${Object.entries(d.headers).map(([k,v])=>`${k}: ${v}`).join('\n')||'(no selected headers)'}`}}
function renderRobotsIntel(b){const x=intelShell(b,'Robots Viewer','Fetch the public robots.txt file for a site.','example.com');x.run.onclick=async()=>{const d=await intelFetch(x.out,'/api/osint/robots?url='+encodeURIComponent(x.input.value));if(d)x.out.textContent=`${d.url}\nHTTP ${d.status}\n\n${d.text}`}}
function renderURLClean(b){const x=intelShell(b,'URL Sanitizer','Runs entirely locally. Removes common tracking parameters while preserving the destination.','https://example.com/page?utm_source=x&id=7','CLEAN');x.run.onclick=()=>{try{const u=new URL(x.input.value);const bad=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','fbclid','msclkid','mc_cid','mc_eid','ref','ref_src'];for(const k of [...u.searchParams.keys()])if(bad.includes(k.toLowerCase())||k.toLowerCase().startsWith('utm_'))u.searchParams.delete(k);x.out.textContent=u.href}catch(e){x.out.textContent='ERROR: '+e.message}}}
function renderLeakScan(b){b.innerHTML=`<div class="intel-shell"><div class="intel-head"><div><div class="section-tag">LOCAL OPSEC</div><h2>Leak Scanner</h2></div><span class="intel-badge">NO UPLOAD</span></div><p class="intel-note">Paste text to identify obvious exposure markers locally. This is a hygiene check, not a breach-database lookup.</p><textarea class="field leak" style="width:100%;height:170px" placeholder="Paste text, config, log output or a draft here"></textarea><button class="btn scan" style="margin-top:8px">SCAN LOCALLY</button><div class="intel-out">READY.</div></div>`;const out=b.querySelector('.intel-out');b.querySelector('.scan').onclick=()=>{const t=b.querySelector('.leak').value;const tests=[['EMAIL',/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],['PUBLIC/IP-LIKE',/\b(?:\d{1,3}\.){3}\d{1,3}\b/g],['URL',/https?:\/\/[^\s"'<>]+/gi],['JWT-LIKE',/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*\b/g],['AWS KEY-LIKE',/\bAKIA[0-9A-Z]{16}\b/g],['PRIVATE KEY MARKER',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]];const found=[];for(const [n,r] of tests){const m=t.match(r)||[];if(m.length)found.push(`${n}: ${m.length}\n${[...new Set(m)].slice(0,8).join('\n')}`)}out.textContent=found.length?found.join('\n\n'):'No obvious exposure markers found.'}}
function renderFileIntel(b){b.innerHTML=`<div class="intel-shell"><div class="intel-head"><div><div class="section-tag">LOCAL FILE OPSEC</div><h2>File Intel</h2></div><span class="intel-badge">NO UPLOAD</span></div><p class="intel-note">Inspect browser-visible file metadata and calculate SHA-256 locally. File contents never leave this device.</p><label class="dropzone">SELECT FILE<input class="pick" type="file" style="display:block;margin:10px auto 0"></label><div class="intel-out">READY.</div></div>`;const pick=b.querySelector('.pick'),out=b.querySelector('.intel-out');pick.onchange=async()=>{const f=pick.files[0];if(!f)return;out.textContent='HASHING...';const hash=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());const hex=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');out.textContent=`name: ${f.name}\ntype: ${f.type||'(unknown)'}\nsize: ${f.size.toLocaleString()} bytes\nlastModified: ${new Date(f.lastModified).toISOString()}\nsha256: ${hex}\n\nNote: browser file APIs do not expose filesystem paths.`}}
function renderJWTPeek(b){const x=intelShell(b,'JWT Peek','Decode JWT header and payload locally without verifying the signature. Do not treat decoded claims as trusted.','eyJ...','DECODE');x.run.onclick=()=>{try{const parts=x.input.value.trim().split('.');if(parts.length<2)throw new Error('Expected JWT format');const dec=p=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(p.length/4)*4,'=')),c=>c.charCodeAt(0))));x.out.textContent='HEADER\n'+pretty(dec(parts[0]))+'\n\nPAYLOAD\n'+pretty(dec(parts[1]))+'\n\nSIGNATURE: not verified'}catch(e){x.out.textContent='ERROR: '+e.message}}}
function renderPassAudit(b){const x=intelShell(b,'Password Audit','Local-only rough entropy and pattern audit. Nothing is transmitted.','Enter a password','AUDIT');x.input.type='password';x.run.onclick=()=>{const p=x.input.value;let pool=0;if(/[a-z]/.test(p))pool+=26;if(/[A-Z]/.test(p))pool+=26;if(/\d/.test(p))pool+=10;if(/[^A-Za-z0-9]/.test(p))pool+=33;const bits=p.length&&pool?Math.round(p.length*Math.log2(pool)):0;const issues=[];if(p.length<14)issues.push('shorter than 14 characters');if(/(.)\1\1/.test(p))issues.push('repeated characters');if(/password|qwerty|letmein|admin|welcome|1234/i.test(p))issues.push('common pattern/word');const rating=bits>=80&&!issues.length?'STRONG':bits>=55?'MODERATE':'WEAK';x.out.textContent=`rating: ${rating}\nrough entropy ceiling: ${bits} bits\nlength: ${p.length}\ncharacter pool: ~${pool}\nissues: ${issues.join(', ')||'none detected'}\n\nPrefer a password manager and unique passwords. This estimate does not check breach databases.`}}
function renderPrivacyCheck(b){const items=['Use unique passwords stored in a password manager','Enable MFA or passkeys on important accounts','Review browser extension permissions','Remove tracking parameters before sharing sensitive links','Separate public usernames from private recovery details','Check files for metadata before publishing','Keep recovery codes offline and protected','Review active sessions on important accounts','Avoid posting real-time location or travel details','Keep software and browser extensions updated'];b.innerHTML=`<div class="intel-shell"><div class="intel-head"><div><div class="section-tag">OPSEC HYGIENE</div><h2>Privacy Checklist</h2></div><span class="intel-badge">LOCAL STATE</span></div><p class="intel-note">A simple personal checklist. Checked state is stored only in this browser.</p><div class="checklist">${items.map((v,i)=>`<label class="check-item"><input type="checkbox" data-i="${i}"><span>${v}</span></label>`).join('')}</div><div class="intel-out score"></div></div>`;const key='nullsec.opsecChecklist',saved=JSON.parse(localStorage.getItem(key)||'[]'),boxes=[...b.querySelectorAll('input[type=checkbox]')],out=b.querySelector('.score');boxes.forEach((x,i)=>x.checked=!!saved[i]);function draw(){const vals=boxes.map(x=>x.checked);localStorage.setItem(key,JSON.stringify(vals));const n=vals.filter(Boolean).length;out.textContent=`OPSEC HYGIENE: ${n}/${vals.length} items reviewed\nThis checklist is guidance, not a guarantee of anonymity or security.`}boxes.forEach(x=>x.onchange=draw);draw()}

function renderPlaceholder(b){b.innerHTML='<div class="app-pad"><h2>Null Sec App</h2><p class="muted">Module loaded.</p></div>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

// subtle matrix field
(()=>{const c=$('#matrix-bg'),x=c.getContext('2d');function fit(){c.width=innerWidth;c.height=innerHeight}fit();addEventListener('resize',fit);const chars='01NULLSEC';setInterval(()=>{x.fillStyle='rgba(0,0,0,.08)';x.fillRect(0,0,c.width,c.height);x.fillStyle='#36ff76';x.font='11px monospace';for(let i=0;i<18;i++)x.fillText(chars[Math.floor(Math.random()*chars.length)],Math.random()*c.width,Math.random()*c.height)},80)})();
