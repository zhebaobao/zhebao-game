// Loads registry modules in manifest order, then starts the game runtime.
(()=>{
const manifest=window.ZHEBAO_MODULE_MANIFEST;
if(!manifest)throw new Error('Module manifest is missing');
const queue=[...manifest.plants,...manifest.levels,...manifest.zombies].map(entry=>entry.src).concat(manifest.runtime);
const seen=new Set();
function loadScript(src){
  if(seen.has(src))return Promise.reject(new Error('Duplicate module path: '+src));
  seen.add(src);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;script.async=false;script.dataset.zhebaoModule=src;
    script.onload=()=>resolve(src);
    script.onerror=()=>reject(new Error('Failed to load module: '+src));
    document.body.appendChild(script);
  });
}
async function boot(){
  for(const src of queue)await loadScript(src);
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
