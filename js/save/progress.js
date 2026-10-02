// Persistent progress serialization. UI refresh and gameplay state remain in js/game.js.
(()=>{
function normalize(raw,levelIds){
  const allowed=Array.isArray(levelIds)&&levelIds.length?new Set(levelIds.map(Number)):null;
  const c=[...new Set(Array.isArray(raw?.completedLevels)?raw.completedLevels.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&(allowed?allowed.has(n):n<=10)):[])].sort((a,b)=>a-b);
  return {version:2,completedLevels:c,
    wallUnlocked:!!raw?.wallUnlocked||c.includes(1),
    potatoUnlocked:!!raw?.potatoUnlocked||c.includes(2),
    fanUnlocked:!!raw?.fanUnlocked||c.includes(3),
    lighterUnlocked:!!raw?.lighterUnlocked||c.includes(4),
    magnetUnlocked:!!raw?.magnetUnlocked||c.includes(5),
    crossfanUnlocked:!!raw?.crossfanUnlocked||c.includes(6)};
}
function read(key,levelIds){
  try{
    const raw=localStorage.getItem(key);
    return raw?normalize(JSON.parse(raw),levelIds):null;
  }catch(e){return null}
}
function write(key,data){
  try{localStorage.setItem(key,JSON.stringify(data));return true}catch(e){return false}
}
window.ZHEBAO_SAVE={normalize,read,write};
})();
