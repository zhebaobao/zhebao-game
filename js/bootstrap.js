// Loads registry modules in manifest order, then starts the game runtime.
(()=>{
const manifest=window.ZHEBAO_MODULE_MANIFEST;
if(!manifest)throw new Error('Module manifest is missing');
const registryQueue=[...manifest.plants,...manifest.levels,...manifest.zombies].map(entry=>entry.src);
const runtimeQueue=manifest.runtime;
const version=encodeURIComponent(manifest.version||'dev');
const seen=new Set();
function loadScript(src){
  if(seen.has(src))return Promise.reject(new Error('Duplicate module path: '+src));
  seen.add(src);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src+(src.includes('?')?'&':'?')+'v='+version;
    script.async=false;script.dataset.zhebaoModule=src;
    script.onload=()=>resolve(src);
    script.onerror=()=>reject(new Error('Failed to load module: '+src));
    document.body.appendChild(script);
  });
}
const loadingFill=document.getElementById('loadingFill');
const loadingText=document.getElementById('loadingText');
const total=registryQueue.length+runtimeQueue.length;
let loaded=0;
function reportLoaded(){
  loaded++;
  const progress=Math.min(96,Math.max(4,Math.round(loaded/total*96)));
  if(loadingFill)loadingFill.style.width=progress+'%';
  if(loadingText)loadingText.textContent='加载资源 '+progress+'%';
}
async function boot(){
  await Promise.all(registryQueue.map(src=>loadScript(src).then(reportLoaded)));
  for(const src of runtimeQueue)await loadScript(src).then(reportLoaded);
  document.documentElement.dataset.zhebaoReady='true';
}
window.ZHEBAO_BOOT_READY=boot().catch(error=>{
  console.error(error);
  document.documentElement.dataset.zhebaoReady='false';
  const notice=document.createElement('div');
  notice.className='bootErrorNotice';
  notice.textContent='游戏资源加载失败，请刷新页面重试。';
  document.body.appendChild(notice);
  throw error;
});
})();
