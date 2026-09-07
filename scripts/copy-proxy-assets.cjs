const fs = require('node:fs');
const path = require('node:path');

function ensureDir(dir){ fs.mkdirSync(dir,{recursive:true}); }
function copyDir(src,dst){
  ensureDir(dst);
  for(const ent of fs.readdirSync(src,{withFileTypes:true})){
    const s=path.join(src,ent.name), d=path.join(dst,ent.name);
    if(ent.isDirectory()) copyDir(s,d);
    else if(ent.isFile()) fs.copyFileSync(s,d);
  }
}
function copyFile(src,dst){ ensureDir(path.dirname(dst)); fs.copyFileSync(src,dst); }
function pkgRootFromEntry(entry,pkgName){
  let dir=path.dirname(entry);
  for(let i=0;i<8;i++){
    const p=path.join(dir,'package.json');
    if(fs.existsSync(p)){
      try{ if(JSON.parse(fs.readFileSync(p,'utf8')).name===pkgName) return dir; }catch{}
    }
    const up=path.dirname(dir); if(up===dir) break; dir=up;
  }
  throw new Error('Package root not found for '+pkgName);
}

(async()=>{
  const root=path.resolve(__dirname,'..');
  const out=path.join(root,'public','vendor');
  fs.rmSync(out,{recursive:true,force:true});
  ensureDir(out);

  // Controller: legal entrypoint resolves inside dist in 0.0.14.
  const controllerEntry=require.resolve('@mercuryworkshop/scramjet-controller');
  const controllerRoot=pkgRootFromEntry(controllerEntry,'@mercuryworkshop/scramjet-controller');
  const controllerDist=path.join(controllerRoot,'dist');
  for(const name of ['controller.api.js','controller.inject.js','controller.sw.js']){
    const src=path.join(controllerDist,name);
    if(!fs.existsSync(src)) throw new Error('Missing controller asset during install: '+src);
    copyFile(src,path.join(out,'controller',name));
  }

  // Scramjet 2 bundle + wasm from its exported path helper.
  const sj=await import('@mercuryworkshop/scramjet/path');
  const scramjetPath=sj.scramjetPath||sj.default;
  if(!scramjetPath) throw new Error('scramjetPath export missing');
  for(const name of ['scramjet.js','scramjet.wasm']){
    const src=path.join(scramjetPath,name);
    if(!fs.existsSync(src)) throw new Error('Missing Scramjet asset during install: '+src);
    copyFile(src,path.join(out,'scramjet',name));
  }

  // Libcurl transport browser distribution.
  const libcurlEntry=require.resolve('@mercuryworkshop/libcurl-transport');
  const libcurlDir=path.dirname(libcurlEntry);
  for(const name of ['index.mjs']){
    const src=path.join(libcurlDir,name);
    if(!fs.existsSync(src)) throw new Error('Missing Libcurl asset during install: '+src);
    copyFile(src,path.join(out,'libcurl',name));
  }


  // HLS.js for HitBoyStream-style Live TV playback.
  const hlsEntry=require.resolve('hls.js');
  const hlsRoot=pkgRootFromEntry(hlsEntry,'hls.js');
  const hlsCandidates=[
    path.join(hlsRoot,'dist','hls.min.js'),
    path.join(hlsRoot,'dist','hls.light.min.js')
  ];
  const hlsSrc=hlsCandidates.find(fs.existsSync);
  if(!hlsSrc) throw new Error('Missing HLS.js browser bundle');
  copyFile(hlsSrc,path.join(out,'hls','hls.min.js'));

  const manifest={
    generatedAt:new Date().toISOString(),
    controller:['controller.api.js','controller.inject.js','controller.sw.js'],
    scramjet:['scramjet.js','scramjet.wasm'],
    libcurl:['index.mjs'],
    hls:['hls.min.js']
  };
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Null Sec proxy assets copied to public/vendor');
})().catch(err=>{console.error(err);process.exit(1)});
