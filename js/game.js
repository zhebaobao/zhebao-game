(()=>{
const grid=document.getElementById('grid'),units=document.getElementById('units'),board=document.getElementById('board'),
sunEl=document.getElementById('sun'),killsEl=document.getElementById('kills'),statusEl=document.getElementById('status'),toggle=document.getElementById('toggle'),battleRoot=document.getElementById('battleRoot'),rewardOverlay=document.getElementById('rewardOverlay'),rewardStage=document.getElementById('rewardStage'),rewardCard=document.getElementById('rewardCard'),levelScreen=document.getElementById('levelScreen'),plantSelectScreen=document.getElementById('plantSelectScreen'),plantPool=document.getElementById('plantPool'),chosenTray=document.getElementById('chosenTray');
const settingsGear=document.getElementById('settingsGear'),settingsOverlay=document.getElementById('settingsOverlay'),settingsResume=document.getElementById('settingsResume'),settingsRestart=document.getElementById('settingsRestart'),settingsMenu=document.getElementById('settingsMenu');
const battlePrepOverlay=document.getElementById('battlePrepOverlay'),battlePrepStart=document.getElementById('battlePrepStart');
const mobilePlantToggle=document.getElementById('mobilePlantToggle');
mobilePlantToggle?.addEventListener('click',()=>{const tools=document.querySelector('#battleRoot .tools');const open=!tools.classList.contains('mobileOpen');tools.classList.toggle('mobileOpen',open);mobilePlantToggle.classList.toggle('open',open);mobilePlantToggle.textContent=open?'收起':'植物';mobilePlantToggle.setAttribute('aria-label',open?'收起植物卡':'展开植物卡');});

const idleBgm=document.getElementById('idleBgm');
const battleBgm=document.getElementById('battleBgm');
const bossBgm=document.getElementById('bossBgm');
const MUSIC_VOL_KEY='zhebao.musicVolume';
let musicVolume=Math.max(0,Math.min(1,Number(localStorage.getItem(MUSIC_VOL_KEY)??.60)));
let musicMuted=false,audioUnlocked=false,idleBgmUnlocked=false,idleBgmFadeRAF=0;
function ensureAudioSource(media){
  if(!media||media.getAttribute('src')||!media.dataset.src)return;
  media.src=media.dataset.src;
  media.load();
}
function idleTargetVolume(){return musicMuted?0:musicVolume*.72}
function battleTargetVolume(){return musicMuted?0:musicVolume*.78}
if(idleBgm){idleBgm.volume=idleTargetVolume();}
if(battleBgm){battleBgm.volume=battleTargetVolume();}
if(bossBgm){bossBgm.volume=battleTargetVolume();}
function fadeIdleBgm(target,duration=520){
  if(!idleBgm)return;
  cancelAnimationFrame(idleBgmFadeRAF);
  const from=idleBgm.volume,start=performance.now();
  const step=now=>{
    const q=Math.min(1,(now-start)/duration);
    idleBgm.volume=from+(target-from)*q;
    if(q<1)idleBgmFadeRAF=requestAnimationFrame(step);
    else if(target<=0.001){idleBgm.pause();idleBgm.volume=idleTargetVolume();}
  };
  idleBgmFadeRAF=requestAnimationFrame(step);
}
function playIdleBgm(){
  if(!idleBgm||(battleStarted&&running)||musicMuted)return;
  ensureAudioSource(idleBgm);
  idleBgmUnlocked=true;
  idleBgm.volume=idleTargetVolume();
  if(idleBgm.paused){
    idleBgm.play().then(()=>{audioUnlocked=true;fadeIdleBgm(idleTargetVolume(),180);updateMusicControls();})
      .catch(()=>{audioUnlocked=false;});
  }else fadeIdleBgm(idleTargetVolume(),180);
}
function stopIdleBgm(){if(idleBgm&&!idleBgm.paused)fadeIdleBgm(0,480);}
let battleBgmFadeRAF=0;
function fadeBattleBgm(target,duration=520){
  if(!battleBgm)return;
  cancelAnimationFrame(battleBgmFadeRAF);
  const from=battleBgm.volume,start=performance.now();
  const step=now=>{
    const q=Math.min(1,(now-start)/duration);
    battleBgm.volume=from+(target-from)*q;
    if(q<1)battleBgmFadeRAF=requestAnimationFrame(step);
    else if(target<=0.001){battleBgm.pause();battleBgm.currentTime=0;battleBgm.volume=battleTargetVolume();}
  };
  battleBgmFadeRAF=requestAnimationFrame(step);
}
function playBattleBgm(){
  if(!battleBgm||musicMuted)return;
  if(currentLevel===10&&level10Boss?.musicSwitched){playBossBgm();return;}
  ensureAudioSource(battleBgm);
  stopBossBgm();
  // Pause the menu track immediately. A long fade can keep two media elements active
  // and makes some mobile WebViews reject the second play() call.
  if(idleBgm&&!idleBgm.paused)idleBgm.pause();
  battleBgm.volume=Math.max(.01,battleTargetVolume());
  if(battleBgm.ended||battleBgm.currentTime>1)battleBgm.currentTime=0;
  const start=()=>battleBgm.play().then(()=>{
    audioUnlocked=true;idleBgmUnlocked=true;
    fadeBattleBgm(battleTargetVolume(),260);updateMusicControls();
  }).catch(()=>{audioUnlocked=false;});
  start();
}
function stopBattleBgm(){if(battleBgm&&!battleBgm.paused)fadeBattleBgm(0,520);}
function playBossBgm(){
  if(!bossBgm||musicMuted)return;
  ensureAudioSource(bossBgm);
  if(idleBgm&&!idleBgm.paused)idleBgm.pause();
  // A fade still leaves the battle track playing for several hundred ms. On
  // level 10 that overlaps the boss track (and on some browsers keeps both
  // media decoders busy), so hand the audio bus over atomically.
  cancelAnimationFrame(battleBgmFadeRAF);
  battleBgmFadeRAF=0;
  if(battleBgm){battleBgm.pause();battleBgm.currentTime=0;battleBgm.volume=battleTargetVolume();}
  bossBgm.volume=Math.max(.01,battleTargetVolume());
  if(bossBgm.ended)bossBgm.currentTime=0;
  bossBgm.play().then(()=>{audioUnlocked=true;updateMusicControls();}).catch(()=>{});
}
function stopBossBgm(){if(bossBgm&&!bossBgm.paused){bossBgm.pause();bossBgm.currentTime=0;bossBgm.volume=battleTargetVolume();}}
async function primeBossBgmForLevel10(){
  if(currentLevel!==10||!bossBgm||musicMuted||bossBgm.dataset.primed==='1')return;
  ensureAudioSource(bossBgm);bossBgm.dataset.primed='1';
  const oldVol=bossBgm.volume;bossBgm.volume=.001;
  try{await bossBgm.play();bossBgm.pause();bossBgm.currentTime=0;}catch(e){}
  bossBgm.volume=oldVol;
}

function syncGameMusic(){
  if(musicMuted)return;
  if(battleStarted&&running&&!ended){
    const bossActive=currentLevel===10&&!!level10Boss?.musicSwitched;
    if(bossActive){
      if(battleBgm&&!battleBgm.paused){battleBgm.pause();battleBgm.currentTime=0;}
      if(bossBgm?.paused)playBossBgm();
    }else{
      stopBossBgm();
      if(battleBgm?.paused)playBattleBgm();
    }
  }else{
    stopBossBgm();
    if(battleBgm&&!battleBgm.paused){battleBgm.pause();battleBgm.currentTime=0;}
    if(audioUnlocked||idleBgmUnlocked)playIdleBgm();
  }
}

async function unlockGameAudio(){
  if(musicMuted)return false;
  let ok=false;
  const bossActive=!!(currentLevel===10&&level10Boss?.musicSwitched&&running&&!ended);
  // Only fetch the soundtrack needed for the current screen. Battle starts from
  // its own user gesture, while the Boss track is requested only when the truck opens.
  const activeMedia=bossActive?bossBgm:((battleStarted&&running&&!ended)?battleBgm:idleBgm);
  for(const media of [activeMedia]){
    if(!media)continue;
    ensureAudioSource(media);
    const wasPaused=media.paused,oldVol=media.volume;
    try{
      media.volume=.001;
      await media.play();
      ok=true;
      // The unlock probe briefly calls play(), but exactly one soundtrack may
      // remain active after it: menu, battle, or Boss.
      const keepPlaying=media===bossBgm?bossActive:(media===battleBgm?(battleStarted&&running&&!ended&&!bossActive):!(battleStarted&&running&&!ended));
      if(!keepPlaying){media.pause();if(media!==idleBgm)media.currentTime=0;}
      media.volume=oldVol;
    }catch(e){media.volume=oldVol;}
  }
  if(ok){
    audioUnlocked=true;idleBgmUnlocked=true;
    if(bossActive)playBossBgm();
    else if(battleStarted&&running&&!ended)playBattleBgm();
    else playIdleBgm();
    updateMusicControls();
  }
  return ok;
}
function retryAudioFromGesture(){if(!audioUnlocked||(!(battleStarted&&running&&!ended)&&idleBgm?.paused))unlockGameAudio();}
document.addEventListener('pointerdown',retryAudioFromGesture,{capture:true});
document.addEventListener('touchstart',retryAudioFromGesture,{capture:true,passive:true});
document.getElementById('introStart')?.addEventListener('pointerdown',()=>{unlockGameAudio();},{capture:true});

const audioEnableBtn=document.getElementById('audioEnableBtn'),audioDiag=document.getElementById('audioDiag');
function setAudioDiag(msg){if(audioDiag)audioDiag.textContent='音乐状态：'+msg;}
async function forceEnableMusic(){
  resumeSfx();
  if(!idleBgm){setAudioDiag('找不到待机音频元素');return;}
  musicMuted=false;
  musicVolume=Math.max(.6,musicVolume||0);
  for(const media of [idleBgm,battleBgm,bossBgm])if(media)media.muted=false;
  try{
    const ok=await unlockGameAudio();
    syncGameMusic();
    if(!ok)throw new Error('浏览器仍未允许播放音频');
    setAudioDiag('播放成功 ✓');
    updateMusicControls();
  }catch(err){
    setAudioDiag('播放失败：'+(err?.name||'未知错误')+' '+(err?.message||''));
  }
}
audioEnableBtn?.addEventListener('click',forceEnableMusic);
idleBgm?.addEventListener('playing',()=>setAudioDiag('待机音乐正在播放 ✓'));
idleBgm?.addEventListener('error',()=>setAudioDiag('待机音乐解码/加载失败 code '+(idleBgm.error?.code||'?')));
battleBgm?.addEventListener('playing',()=>setAudioDiag('战斗音乐正在播放 ✓'));
battleBgm?.addEventListener('error',()=>setAudioDiag('战斗音乐解码/加载失败 code '+(battleBgm.error?.code||'?')));

const settingsVolume=document.getElementById('musicVolume'),settingsVolumeLabel=document.getElementById('musicVolumeLabel'),settingsMute=document.getElementById('musicMute');
function updateMusicControls(){
  const pct=Math.round(musicVolume*100);
  if(settingsVolume&&document.activeElement!==settingsVolume)settingsVolume.value=String(pct);
  if(settingsVolumeLabel)settingsVolumeLabel.textContent=pct+'%';
  if(settingsMute)settingsMute.textContent=musicMuted?'恢复音乐':'静音';
}
function applyMusicVolume(v){
  const next=Number(v);
  if(!Number.isFinite(next))return;
  musicVolume=Math.max(0,Math.min(1,next));musicMuted=false;
  try{localStorage.setItem(MUSIC_VOL_KEY,String(musicVolume))}catch(e){}
  if(idleBgm)idleBgm.volume=idleTargetVolume();
  if(battleBgm)battleBgm.volume=battleTargetVolume();
  if(bossBgm)bossBgm.volume=battleTargetVolume();
  if(settingsVolumeLabel)settingsVolumeLabel.textContent=Math.round(musicVolume*100)+'%';
  updateMusicControls();
  if(musicVolume>0)unlockGameAudio();
}
function toggleMusicMute(){
  musicMuted=!musicMuted;
  if(musicMuted){if(idleBgm)idleBgm.volume=0;if(battleBgm)battleBgm.volume=0;if(bossBgm)bossBgm.volume=0;}
  else {if(idleBgm)idleBgm.volume=idleTargetVolume();if(battleBgm)battleBgm.volume=battleTargetVolume();if(bossBgm)bossBgm.volume=battleTargetVolume();unlockGameAudio();}
  updateMusicControls();
}
const onSettingsMusicVolume=e=>applyMusicVolume(Number(e.currentTarget.value)/100);
settingsVolume?.addEventListener('input',onSettingsMusicVolume,{passive:true});
settingsVolume?.addEventListener('change',onSettingsMusicVolume);
settingsMute?.addEventListener('click',toggleMusicMute);
updateMusicControls();

/* -------- Procedural battle SFX: offline, no extra audio files -------- */
const SFX_VOL_KEY='zhebao.sfxVolume';
let sfxVolume=Math.max(0,Math.min(1,Number(localStorage.getItem(SFX_VOL_KEY)??.72)));
let sfxMuted=false,sfxCtx=null,sfxMaster=null,sfxNoiseBuffer=null;
const sfxGateTimes=Object.create(null);
const sfxVolumeEl=document.getElementById('sfxVolume'),sfxVolumeLabel=document.getElementById('sfxVolumeLabel'),sfxMuteEl=document.getElementById('sfxMute');

function ensureSfx(){
  if(sfxCtx)return sfxCtx;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{
    sfxCtx=new AC();
    sfxMaster=sfxCtx.createGain();sfxMaster.gain.value=sfxMuted?0:sfxVolume;
    const comp=sfxCtx.createDynamicsCompressor();
    comp.threshold.value=-12;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.14;
    sfxMaster.connect(comp);comp.connect(sfxCtx.destination);
    const len=Math.max(1,Math.floor(sfxCtx.sampleRate));
    sfxNoiseBuffer=sfxCtx.createBuffer(1,len,sfxCtx.sampleRate);
    const a=sfxNoiseBuffer.getChannelData(0);
    for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*(.72+.28*Math.random());
  }catch(e){sfxCtx=null;sfxMaster=null;}
  return sfxCtx;
}
function resumeSfx(){const c=ensureSfx();if(c?.state==='suspended')c.resume().catch(()=>{});return c;}
function sfxTone(freq,dur,gain=.1,type='sine',endFreq=freq,delay=0,pan=0){
  const c=resumeSfx();if(!c||sfxMuted||sfxVolume<=0)return;
  const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),t);
  if(endFreq!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.006);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  if(c.createStereoPanner){const pn=c.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,pan));o.connect(g);g.connect(pn);pn.connect(sfxMaster);}
  else{o.connect(g);g.connect(sfxMaster);}
  o.start(t);o.stop(t+dur+.025);
}
function sfxNoise(dur,gain=.1,filterType='lowpass',freq=900,delay=0,pan=0,q=.7){
  const c=resumeSfx();if(!c||!sfxNoiseBuffer||sfxMuted||sfxVolume<=0)return;
  const t=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=sfxNoiseBuffer;f.type=filterType;f.frequency.value=freq;f.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.004);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(f);f.connect(g);
  if(c.createStereoPanner){const pn=c.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,pan));g.connect(pn);pn.connect(sfxMaster);}
  else g.connect(sfxMaster);
  src.start(t,Math.random()*.45);src.stop(t+dur+.02);
}
function sfxPan(x){return Number.isFinite(x)?Math.max(-.78,Math.min(.78,(x/COLS)*1.56-.78)):0}
function playSfx(name,strength=1,gateKey='',gateMs=0,x=null){
  if(sfxMuted||sfxVolume<=0)return;
  const now=performance.now(),key=gateKey||name;
  if(gateMs&&now-(sfxGateTimes[key]||0)<gateMs)return;
  if(gateMs)sfxGateTimes[key]=now;
  const k=Math.max(.25,Math.min(1.5,strength)),p=sfxPan(x),r=.94+Math.random()*.12;
  switch(name){
    case 'plant':sfxNoise(.12,.11*k,'lowpass',780*r,0,p);sfxTone(150*r,.15,.075*k,'triangle',260*r,.015,p);break;
    case 'shoot':sfxNoise(.045,.065*k,'bandpass',1250*r,0,p,1.2);sfxTone(260*r,.065,.072*k,'square',125*r,0,p);break;
    case 'fireShoot':sfxNoise(.09,.10*k,'highpass',1100*r,0,p);sfxTone(190*r,.10,.075*k,'sawtooth',85*r,0,p);break;
    case 'fleshHit':sfxNoise(.07,.105*k,'bandpass',620*r,0,p,1.1);sfxTone(92*r,.065,.065*k,'sine',55*r,0,p);break;
    case 'metalHit':sfxTone(1080*r,.13,.075*k,'triangle',570*r,0,p);sfxNoise(.055,.052*k,'highpass',1900*r,0,p);break;
    case 'armorBreak':sfxNoise(.16,.14*k,'highpass',1350*r,0,p);sfxTone(880*r,.23,.095*k,'triangle',310*r,0,p);break;
    case 'zombieDeath':sfxTone(112*r,.34,.085*k,'sawtooth',48*r,0,p);sfxNoise(.22,.095*k,'lowpass',720*r,.025,p);break;
    case 'fireDeath':sfxNoise(.30,.115*k,'highpass',850*r,0,p);sfxTone(145*r,.22,.05*k,'triangle',65*r,0,p);break;
    case 'plantHurt':sfxNoise(.06,.075*k,'lowpass',520*r,0,p);sfxTone(118*r,.07,.048*k,'sine',72*r,0,p);break;
    case 'plantDeath':sfxNoise(.20,.11*k,'bandpass',520*r,0,p);sfxTone(135*r,.18,.055*k,'triangle',70*r,0,p);break;
    case 'footstep':sfxNoise(.055,.052*k,'lowpass',330*r,0,p);sfxTone(74*r,.055,.036*k,'sine',52*r,0,p);break;
    case 'crawl':sfxNoise(.12,.058*k,'bandpass',650*r,0,p,1.5);break;
    case 'bite':sfxNoise(.075,.105*k,'bandpass',850*r,0,p,1.4);sfxTone(132*r,.065,.042*k,'square',76*r,0,p);break;
    case 'jump':sfxNoise(.18,.072*k,'highpass',760*r,0,p);sfxTone(145*r,.18,.052*k,'sine',510*r,0,p);break;
    case 'lunge':sfxNoise(.23,.085*k,'highpass',540*r,0,p);sfxTone(180*r,.16,.045*k,'triangle',410*r,.02,p);break;
    case 'land':sfxNoise(.085,.088*k,'lowpass',430*r,0,p);sfxTone(88*r,.075,.052*k,'sine',48*r,0,p);break;
    case 'explosion':sfxNoise(.46,.28*k,'lowpass',1050*r,0,p);sfxTone(105*r,.38,.19*k,'sine',32*r,0,p);sfxNoise(.18,.10*k,'highpass',1800*r,.025,p);break;
    case 'ignite':sfxNoise(.22,.09*k,'highpass',1200*r,0,p);sfxTone(190*r,.12,.045*k,'triangle',330*r,0,p);break;
    case 'fan':sfxNoise(.34,.075*k,'bandpass',980*r,0,p,.55);sfxTone(185*r,.30,.025*k,'sine',145*r,0,p);break;
    case 'magnet':sfxTone(170*r,.26,.07*k,'square',860*r,0,p);sfxTone(1180*r,.20,.055*k,'triangle',620*r,.12,p);break;
    case 'bucketLift':sfxTone(720*r,.17,.065*k,'triangle',390*r,0,p);sfxNoise(.07,.045*k,'highpass',1500*r,0,p);break;
    case 'bucketEquip':sfxTone(510*r,.16,.085*k,'triangle',245*r,0,p);sfxTone(96*r,.10,.055*k,'sine',58*r,.015,p);break;
    case 'sunSpawn':sfxTone(660*r,.13,.042*k,'sine',880*r,0,p);break;
    case 'sunCollect':sfxTone(880*r,.12,.052*k,'sine',1180*r,0,p);sfxTone(1320*r,.16,.045*k,'sine',1560*r,.075,p);break;
    case 'whip':sfxNoise(.16,.105*k,'highpass',1600*r,0,p);sfxTone(620*r,.11,.043*k,'triangle',280*r,.025,p);break;
    case 'chainsaw':sfxTone(92*r,.48,.095*k,'sawtooth',145*r,0,p);sfxNoise(.42,.12*k,'bandpass',520*r,0,p,2);break;
    case 'zombieSpawn':sfxTone(102*r,.28,.048*k,'sawtooth',72*r,0,p);break;
    case 'wave':sfxTone(196,.25,.065*k,'sawtooth',220,0,0);sfxTone(294,.28,.045*k,'triangle',330,.10,0);break;
    case 'armed':sfxTone(740,.08,.055*k,'square',740,0,p);sfxTone(980,.10,.05*k,'square',980,.11,p);break;
    case 'shovel':sfxNoise(.10,.085*k,'bandpass',430*r,0,p);sfxTone(125*r,.09,.052*k,'triangle',72*r,0,p);break;
    case 'glove':sfxTone(360*r,.08,.043*k,'triangle',520*r,0,p);break;
    case 'reward':sfxTone(523,.18,.055*k,'sine',659,0,0);sfxTone(784,.22,.06*k,'sine',988,.12,0);break;
    case 'win':sfxTone(392,.18,.055*k,'triangle',392,0,0);sfxTone(523,.18,.06*k,'triangle',523,.17,0);sfxTone(784,.32,.07*k,'triangle',784,.34,0);break;
    case 'lose':sfxTone(220,.26,.065*k,'sawtooth',165,0,0);sfxTone(147,.38,.06*k,'triangle',82,.20,0);break;
    case 'plane':sfxNoise(.75,.07*k,'lowpass',460*r,0,p);sfxTone(72*r,.75,.04*k,'sawtooth',105*r,0,p);break;
    case 'metalBuild':sfxNoise(.11,.085*k,'highpass',1500*r,0,p);sfxTone(640*r,.18,.06*k,'triangle',330*r,0,p);break;
    case 'throw':sfxNoise(.17,.07*k,'highpass',760*r,0,p);sfxTone(210*r,.13,.035*k,'triangle',360*r,0,p);break;
  }
}
function updateSfxControls(){
  const pct=Math.round(sfxVolume*100);
  if(sfxVolumeEl)sfxVolumeEl.value=String(pct);
  if(sfxVolumeLabel)sfxVolumeLabel.textContent=pct+'%';
  if(sfxMuteEl)sfxMuteEl.textContent=sfxMuted?'恢复音效':'关闭音效';
}
function applySfxVolume(v){
  sfxVolume=Math.max(0,Math.min(1,v));sfxMuted=false;
  try{localStorage.setItem(SFX_VOL_KEY,String(sfxVolume))}catch(e){}
  if(sfxMaster)sfxMaster.gain.value=sfxVolume;resumeSfx();updateSfxControls();
}
function toggleSfxMute(){
  sfxMuted=!sfxMuted;if(sfxMaster)sfxMaster.gain.value=sfxMuted?0:sfxVolume;
  if(!sfxMuted)resumeSfx();updateSfxControls();
}
sfxVolumeEl?.addEventListener('input',e=>applySfxVolume(Number(e.target.value)/100));
sfxMuteEl?.addEventListener('click',toggleSfxMute);
document.addEventListener('pointerdown',resumeSfx,{capture:true});
document.addEventListener('touchstart',resumeSfx,{capture:true,passive:true});
updateSfxControls();

const waveHud=document.getElementById('waveHud'),waveFill=document.getElementById('waveFill'),waveMidFlag=document.getElementById('waveMidFlag'),waveFinalFlag=document.getElementById('waveFinalFlag'),waveStageText=document.getElementById('waveStageText'),waveStateText=document.getElementById('waveStateText');
let ROWS=2;const COLS=10;
const {LEVELS,LEVEL_UI,costs,maxHP,cooldownMax,TEST_MODE,FINAL_TEST_UNLOCK_ALL,SAVE_KEY,LEVEL_PLANT_REWARDS,plantNames,PLANT_PORTRAITS,PLANT_ARCHETYPES,ZOMBIE_ARCHETYPES}=window.ZHEBAO_CONFIG;
const LEVEL_IDS=window.ZHEBAO_CONFIG.LEVEL_IDS||Object.keys(LEVELS).map(Number).sort((a,b)=>a-b);
const levelSelect=window.ZHEBAO_LEVEL_SELECT||{
  formatNumber:n=>(['零','一','二','三','四','五','六','七','八','九','十'][n]||String(n)),
  render:()=>{}
};
levelSelect.render(document.querySelector('.levelGrid'),LEVEL_IDS,LEVEL_UI);
const BOARD_SCENES=window.ZHEBAO_SCENES||{};

let plants=[],zombies=[],peas=[],suns=[],brainDrops=[],deathFx=[],coneFx=[],blastFx=[],peaImpactFx=[],bloodFx=[],deathBloodDrops=[],groundBloodFx=[],armFx=[],hpBreakFx=[],armorHpBreakFx=[],armorBreakFx=[],fireTiles=[],looseBuckets=[],magnetFx=[],crossFireFx=[],cooldowns={pea:0,sunflower:0,wall:0,potato:0,fan:0,lighter:0,magnet:0,crossfan:0,glove:0},sun=175,kills=0,spawned=0,selected='pea',running=false,battleStarted=false,ended=false,nextId=1,speedMul=1,currentLevel=1,levelCompletePending=false,wallUnlocked=false,potatoUnlocked=false,fanUnlocked=false,lighterUnlocked=false,magnetUnlocked=false,crossfanUnlocked=false,rewardType='wall',pendingLevel=1,selectedPlants=[],completedLevels=[];

let level8FlagIndex=0,level8FlagBurst=[],level9MinerQueue=[],level9MinerIntroDone=false,level9MinerMidDone=false,level9MinerLateDone=false,level10Boss=null,level10IntroTarget=10,bossWrenches=[];
async function requestGameFullscreen(){
  const el=document.documentElement;
  if(document.fullscreenElement||document.webkitFullscreenElement)return true;
  try{
    const fn=el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen;
    if(fn){const r=fn.call(el);if(r&&typeof r.then==='function')await r;}
    try{await screen.orientation?.lock?.('landscape')}catch(e){}
    return !!(document.fullscreenElement||document.webkitFullscreenElement);
  }catch(e){return false}
}

function makeSaveData(){return {version:2,completedLevels:[...new Set(completedLevels)].sort((a,b)=>a-b),wallUnlocked,potatoUnlocked,fanUnlocked,lighterUnlocked,magnetUnlocked,crossfanUnlocked,savedAt:new Date().toISOString()}}
function persistProgress(){if(TEST_MODE||FINAL_TEST_UNLOCK_ALL)return;window.ZHEBAO_SAVE.write(SAVE_KEY,makeSaveData())}
function applySaveData(raw){
  const d=window.ZHEBAO_SAVE.normalize(raw,LEVEL_IDS);completedLevels=d.completedLevels;wallUnlocked=d.wallUnlocked;potatoUnlocked=d.potatoUnlocked;fanUnlocked=d.fanUnlocked;lighterUnlocked=d.lighterUnlocked;magnetUnlocked=d.magnetUnlocked;crossfanUnlocked=d.crossfanUnlocked;
  refreshProgressUI();
}
function loadLocalProgress(){if(TEST_MODE||FINAL_TEST_UNLOCK_ALL)return;const d=window.ZHEBAO_SAVE.read(SAVE_KEY,LEVEL_IDS);if(d)applySaveData(d)}
function refreshProgressUI(){
  document.querySelectorAll('.levelCard').forEach(b=>{
    const n=+b.dataset.level,index=LEVEL_IDS.indexOf(n),previous=index>0?LEVEL_IDS[index-1]:null;
    const done=completedLevels.includes(n),open=FINAL_TEST_UNLOCK_ALL||index===0||(index>0&&completedLevels.includes(previous));
    b.classList.toggle('done',done);b.classList.toggle('locked',!open);b.disabled=!open;
    const no=b.querySelector('.levelNo');if(no)no.textContent=open?`第${levelSelect.formatNumber(n)}关`:'？';
    for(const el of b.children)if(!el.classList.contains('levelNo'))el.style.display=open?'':'none';
    const tag=b.querySelector('.levelTag');if(tag)tag.textContent=open?(done?'已完成 · 可重玩':(n===1?'开始冒险':'新关卡')):'';
    b.setAttribute('aria-label',open?`第 ${n} 关`:'未解锁关卡');
  });
}
function markLevelComplete(n){if(!completedLevels.includes(n))completedLevels.push(n);persistProgress();refreshProgressUI()}
function saveSummary(){const highest=completedLevels.length?Math.max(...completedLevels):0;const owned=['豌豆射手','向日葵',...(wallUnlocked?['坚果']:[]),...(potatoUnlocked?['土豆地雷']:[]),...(fanUnlocked?['寒风扇']:[]),...(lighterUnlocked?['打火机']:[]),...(magnetUnlocked?['吸铁石']:[]),...(crossfanUnlocked?['十字吹风机']:[])];return `已完成关卡：${completedLevels.length?completedLevels.map(n=>'1-'+n).join('、'):'暂无'}<br>最高进度：${highest?('1-'+highest):'尚未通关'}<br>植物：${owned.join('、')}`}

const MOBILE_PERF=matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:900px)').matches;
const DEVICE_DPR=Math.max(1,window.devicePixelRatio||1);
const QUALITY_KEY='zhebao.graphicsQuality';
let qualityMode=localStorage.getItem(QUALITY_KEY)||'auto';
if(!['auto','high','smooth'].includes(qualityMode))qualityMode='auto';
function spriteRenderScale(){return qualityMode==='high'?4:qualityMode==='smooth'?2:(MOBILE_PERF?Math.max(2,Math.min(3,Math.ceil(DEVICE_DPR))):4)}
let MOBILE_RENDER_SCALE=spriteRenderScale();
const MOBILE_FX_SCALE=MOBILE_PERF?(DEVICE_DPR>=2.5?1.15:1):1;
if(MOBILE_PERF)document.documentElement.classList.add('mobilePerf');
let last=performance.now(),spawnClock=0,skySunClock=0,nextSpawnDelay=12,gameTime=0,rewardClaiming=false,dragSuppressUntil=0,glovePlantId=null,gloveFx=null,settingsWasRunning=false,looseBucketDrag=null,impSpawnClock=0,nextImpSpawnDelay=16+Math.random()*4,chainsaws=[],chainsawFx=[],waveBurstRemaining=0,waveTriggeredMid=false,waveTriggeredFinal=false,wavePulseTimer=0,finalRaid=null,level7Event=null;

function say(t){statusEl.textContent=t}
function pctX(x){return (x/COLS*100)+'%'}
function pctY(y){return (y/ROWS*100)+'%'}
function plantAt(r,c){return plants.find(p=>p.row===r&&p.col===c)}
function fireTileAt(r,c){return fireTiles.find(t=>t.row===r&&t.col===c)}
function igniteFireTile(r,c,life=PLANT_ARCHETYPES.lighter.behavior.fireLife){
  let tile=fireTileAt(r,c);
  if(tile){tile.age=0;tile.life=Math.max(tile.life,life);return tile;}
  tile={id:nextId++,row:r,col:c,age:0,life};fireTiles.push(tile);playSfx('ignite',.85,'ignite',130,c+.5);return tile;
}
function applyBurn(z,total=20,duration=2,source='firePeaBurn'){
  if(!z||z.hp<=0)return;
  const dps=Math.max(0,total/Math.max(.01,duration));
  z.burnTime=Math.max(z.burnTime||0,duration);
  z.burnDps=Math.max(z.burnDps||0,dps);
  z.burnSource=source;
}
function updatePlantTargets(){
  const cfg=LEVELS[currentLevel];
  const planting=!!selected&&selected!=='shovel'&&selected!=='glove'&&(TEST_MODE||FINAL_TEST_UNLOCK_ALL||selectedPlants.includes(selected));
  document.querySelectorAll('.cell').forEach(c=>{
    const r=+c.dataset.row,col=+c.dataset.col;
    const existing=plantAt(r,col);
    const lighterFuse=selected==='lighter'&&existing&&(existing.type==='pea'||existing.type==='wall')&&!existing.fireMode&&!(existing.fireTransform>0);
    const crossFanValid=selected==='crossfan'&&!existing&&!!fireTileAt(r,col);
    const valid=!!(planting&&battleStarted&&cfg?.rows.includes(r)&&(selected==='crossfan'?crossFanValid:(!existing||lighterFuse)));
    c.classList.toggle('plantTarget',valid);
  });
}
function plantingBulletTimeActive(){
  if(!battleStarted||ended||!selected)return false;
  return selected!=='shovel'&&selected!=='glove';
}
function syncPlantingBulletTime(){
  battleRoot.classList.toggle('plantBulletTime',plantingBulletTimeActive());
}
function selectTool(t){selected=t||null;document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('sel',!!selected&&b.dataset.tool===selected));if(!selected&&MOBILE_PERF){document.querySelector('#battleRoot .tools')?.classList.remove('mobileOpen');mobilePlantToggle?.classList.remove('open');if(mobilePlantToggle)mobilePlantToggle.textContent='植物';}updatePlantTargets();syncPlantingBulletTime()}

function buildGrid(){
  grid.innerHTML='';
  grid.style.gridTemplateColumns=`repeat(${COLS},1fr)`;
  grid.style.gridTemplateRows=`repeat(${ROWS},1fr)`;
  const scene=BOARD_SCENES[ROWS]||BOARD_SCENES[5];
  if(scene){
    board.style.aspectRatio=String(scene.aspect);
    board.style.backgroundImage=`url("${new URL(scene.image,document.baseURI).href}")`;
    board.style.setProperty('--field-left',scene.field.left+'%');
    board.style.setProperty('--field-right',scene.field.right+'%');
    board.style.setProperty('--field-top',scene.field.top+'%');
    board.style.setProperty('--field-bottom',scene.field.bottom+'%');
    board.dataset.sceneRows=String(ROWS);
  }else{
    board.style.aspectRatio=`${COLS}/${ROWS}`;
  }
  board.style.setProperty('--rows',ROWS);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const b=document.createElement('button');b.className='cell';b.type='button';b.setAttribute('aria-label',`第${r+1}行第${c+1}格`);
    b.dataset.row=r;b.dataset.col=c;b.innerHTML='<span class="plantSpot" aria-hidden="true"></span>';b.addEventListener('click',()=>place(r,c));grid.appendChild(b);
  }
  fitMobileBoard();
}

function fitMobileBoard(){
  if(!MOBILE_PERF)return;
  const vv=window.visualViewport;
  const vw=Math.round(vv?.width||innerWidth),vh=Math.round(vv?.height||innerHeight);
  const landscape=vw>vh;
  const wrap=board.parentElement;
  if(!landscape){
    board.style.width='100%';board.style.minWidth='500px';
    if(wrap){wrap.style.left='50%';wrap.style.top='50%';}
    return;
  }
  // Mobile landscape owns a real left rail for plant cards. The lawn never sits under the drawer.
  const rail=86;
  const sideGap=8;
  const topHud=44;
  const bottomGap=8;
  const usableW=Math.max(320,vw-rail-sideGap*2);
  const usableH=Math.max(150,vh-topHud-bottomGap);
  const sceneAspect=Number(BOARD_SCENES[ROWS]?.aspect)||COLS/ROWS;
  const fitW=Math.min(usableW,usableH*sceneAspect);
  const fitH=fitW/sceneAspect;
  board.style.width=Math.floor(fitW)+'px';
  board.style.minWidth='0';
  if(wrap){
    wrap.style.width=Math.floor(fitW+8)+'px';
    wrap.style.height=Math.floor(fitH+8)+'px';
    wrap.style.left=Math.round(rail+(vw-rail)/2)+'px';
    wrap.style.top=Math.round(topHud+(vh-topHud-bottomGap)/2)+'px';
  }
}
window.addEventListener('resize',()=>fitMobileBoard(),{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(fitMobileBoard,120),{passive:true});
window.visualViewport?.addEventListener('resize',fitMobileBoard,{passive:true});
window.visualViewport?.addEventListener('scroll',fitMobileBoard,{passive:true});

function place(r,c){
  if(ended)return;
  const cfg=LEVELS[currentLevel];
  if(!cfg.rows.includes(r)){say('这一关这里不是草坪路线。');return}
  if(!battleStarted){say('先点击“开始战斗”，游戏开始后才能操作草坪。');return}
  const old=plantAt(r,c);
  if(selected==='glove'){
    if(cooldowns.glove>0){say('手套还在冷却。');return}
    if(glovePlantId==null){
      if(!old){say('先点一个要移动的植物。');return}
      glovePlantId=old.id;gloveFx={kind:'hold',plantId:old.id,age:0};say('已抓住 '+(plantNames[old.type]||'植物')+'，再点目标格子。');return
    }
    const src=plants.find(p=>p.id===glovePlantId&&p.hp>0);
    if(!src){glovePlantId=null;gloveFx=null;say('原植物已经不在了，请重新选择。');return}
    if(old&&old.id===src.id){glovePlantId=null;gloveFx=null;say('已取消手套操作。');return}
    const sr=src.row,sc=src.col;
    if(old){src.row=r;src.col=c;old.row=sr;old.col=sc;old.gloveDrop=.62;say('两株植物已交换位置。')}
    else{src.row=r;src.col=c;say('植物已移动到新位置。')}
    src.gloveDrop=.62;gloveFx={kind:'drop',plantId:src.id,row:r,col:c,age:0,life:.62};playSfx('glove',1,'glove',70,c+.5);
    glovePlantId=null;cooldowns.glove=5;updateCooldownUI();return
  }
  if(!selected){say('先选择一株植物。');return}
  if(selected!=='shovel'&&selected!=='glove'&&!TEST_MODE&&!FINAL_TEST_UNLOCK_ALL&&!selectedPlants.includes(selected)){say('这一关还不能使用这个植物。');return}
  if(selected==='shovel'){if(old){playSfx('shovel',1,'shovel',80,old.col+.5);plants=plants.filter(p=>p!==old);say('植物已铲除。');updatePlantTargets()}return}
  const lighterUpgrade=selected==='lighter'&&old&&(old.type==='pea'||old.type==='wall')&&!old.fireMode;
  if(old&&!lighterUpgrade){
    if(selected==='lighter'&&(old.type==='pea'||old.type==='wall')&&old.fireMode)say(old.type==='pea'?'这株豌豆射手已经是火焰射手了。':'这个坚果已经是熔岩坚果了。');
    else say('这里已经有植物。');
    return;
  }
  if(selected==='crossfan'&&!fireTileAt(r,c)){say('十字吹风机必须放在打火机留下的火坑上！');return}
  if(cooldowns[selected]>0){say('这个植物还在冷却。');return}
  if(sun<costs[selected]){say('阳光不够。');return}
  sun-=costs[selected];cooldowns[selected]=cooldownMax[selected];
  const cell=grid.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if(cell){cell.classList.remove('seedKick');void cell.offsetWidth;cell.classList.add('seedKick');setTimeout(()=>cell.classList.remove('seedKick'),260);}
  if(lighterUpgrade){
    old.fireTransform=PLANT_ARCHETYPES.lighter.behavior.transformDuration;
    old.fireTransformTotal=PLANT_ARCHETYPES.lighter.behavior.transformDuration;
    old.fireMode=false;
    old.fireMorph=0;
    old.charge=0;old.shoot=0;
    if(old.type==='wall'){old.maxHp=PLANT_ARCHETYPES.wall.behavior.fireMaxHP;old.hp=Math.min(old.hp,old.maxHp);}
    say(old.type==='pea'?'打火机正在点燃豌豆射手……':'打火机正在熔铸坚果……');
    updateHUD();updateCooldownUI();selectTool(null);updatePlantTargets();return;
  }
  const isLighter=selected==='lighter';
  plants.push({id:nextId++,type:selected,row:r,col:c,hp:maxHP[selected],maxHp:maxHP[selected],shoot:0,produce:0,anim:0,fireAnim:0,charge:0,lastFrame:0,plantingAge:isLighter?PLANT_ARCHETYPES.lighter.behavior.ignitionDelay:0,throwAge:isLighter?0:null,ignited:false,skipDeath:!!isLighter,arm:selected==='potato'?0:null,armed:false,detonated:false,fireMode:false,fireMorph:0,squashDeath:0,squashDeathTotal:.78,squashByGiant:false,crossActive:selected==='crossfan'?PLANT_ARCHETYPES.crossfan.behavior.duration:0,crossTotal:PLANT_ARCHETYPES.crossfan.behavior.duration}); playSfx(isLighter?'throw':'plant',1,'plant',45,c+.5); if(selected==='crossfan'){crossFireFx.push({id:nextId++,row:r,col:c,age:0,life:PLANT_ARCHETYPES.crossfan.behavior.duration});playSfx('fan',1.15,'crossFan',180,c+.5);say(`十字吹风机启动——四向烈焰持续 ${PLANT_ARCHETYPES.crossfan.behavior.duration} 秒！`);}
  
  updateHUD();updateCooldownUI();selectTool(null);
}

function damagePlant(p,dmg){
  if(p?.type==='crossfan')return;
  if(!p||p.hp<=0||p.squashDeath>0)return;
  if((p.armorHp||0)>0){
    const before=p.armorHp,lost=Math.min(before,dmg);p.armorHp-=lost;dmg-=lost;
    if(before>0&&p.armorHp<=0){
      p.armorHp=0;p.armorMax=0;
      // Reuse the existing steel-bucket break/drop animation when plant armor is destroyed.
      coneFx.push({id:nextId++,x:p.col+.5,y:p.row+.30,age:0,life:.9,dir:Math.random()<.5?-1:1,kind:'bucket'});
    }
  }
  if(dmg>0)p.hp-=dmg;
}
function magnetAbsorb(p){
  if(!p||p.type!=='magnet'||p.hp<=0)return false;
  // A magnet can hold only one stolen bucket, and each successful pull starts a 10 s cooldown.
  if((p.magnetCooldown||0)>0)return false;
  if(looseBuckets.some(b=>b.magnetId===p.id))return false;

  const candidates=zombies.filter(z=>
    z.type==='bucket'&&z.coneHp>0&&z.hp>0&&
    Math.abs(z.x-(p.col+.5))<=PLANT_ARCHETYPES.magnet.behavior.range&&Math.abs(z.row-p.row)<=PLANT_ARCHETYPES.magnet.behavior.range
  );
  if(!candidates.length)return false;

  // Only one bucket per activation: take the nearest valid bucket.
  candidates.sort((a,b)=>Math.hypot(a.x-(p.col+.5),a.row-p.row)-Math.hypot(b.x-(p.col+.5),b.row-p.row));
  const z=candidates[0];
  const bucket={
    id:nextId++,x:z.x,y:z.row+.18,hp:200,maxHp:200,
    magnetId:p.id,state:'pulling',pullAge:0,pullDur:.48,
    fromX:z.x,fromY:z.row+.18
  };
  looseBuckets.push(bucket);
  z.coneHp=0;z.coneMax=0;z.armGone=false;
  p.magnetCooldown=PLANT_ARCHETYPES.magnet.behavior.cooldown;p.magnetFlash=.8;playSfx('magnet',1,'magnet',180,p.col+.5);
  magnetFx.push({id:nextId++,x:p.col+.5,y:p.row+.5,age:0,life:.8});
  say(`吸铁石吸下 1 个铁桶！铁桶会停在吸铁石头上，可拖到任意植物上。冷却 ${PLANT_ARCHETYPES.magnet.behavior.cooldown} 秒。`);
  return true;
}
function waveProgress(){
  if(currentLevel===7&&level7Event)return Math.min(1,((level7Event.wave-1)+Math.min(1,level7Event.waveSpawned[level7Event.wave-1]/Math.max(1,level7Event.waveTargets[level7Event.wave-1])))/4);
  // Level 10 has three paced ground waves followed by the truck's 18 releases.
  // Keep the progress meter tied to those two phases instead of jumping to the
  // final flag as soon as the boss starts emitting.
  if(currentLevel===10){const released=level10Boss?.emitted||0;return level10Boss?Math.min(1,.75+released/5*.25):Math.min(.75,spawned/Math.max(1,level10IntroTarget)*.75);}
  const cfg=LEVELS[currentLevel];return cfg.total?Math.min(1,spawned/cfg.total):0;
}
function waveStage(){if(currentLevel===7&&level7Event)return level7Event.wave-1;if(currentLevel===10)return level10Boss?3:Math.min(2,Math.floor(waveProgress()*4));return Math.min(3,Math.floor(waveProgress()*4));}
function hasMidWave(){return currentLevel>=3;}
let lastWaveUIKey='';
function updateWaveUI(){
  if(!waveFill)return;
  const p=waveProgress();
  const stage=currentLevel===8?Math.min(3,Math.floor(p*3)+1):(currentLevel===10?(level10Boss?4:Math.min(3,Math.floor(p*4)+1)):(currentLevel===7&&level7Event?level7Event.wave:Math.min(4,Math.floor(p*4)+1)));
  const state=currentLevel===10?(level10Boss?(level10Boss.phase==='intermission'?`工头出击 · ${Math.max(0,Math.ceil(20-(level10Boss.intermissionAge||0)))}秒`:(level10Boss.phase==='release'?(level10Boss.releasePaused?'场上僵尸超过 10 只 · 暂停装卸':'每批装卸 5 只 · 无限循环'):'战车突袭')):'前置尸潮'):(currentLevel===7&&level7Event?(level7Event.firstGate?'首敌锁定':(level7Event.planes?.length?'五机突袭':(level7Event.buildAge>0?'铁架施工':''))):(finalRaidBusy()?'卸货突袭':(waveBurstRemaining>0?'尸潮':'')));
  const surge=(finalRaidBusy()||waveBurstRemaining>0)&&wavePulseTimer>0;
  const key=[currentLevel,p,stage,state,surge].join('|');
  if(key===lastWaveUIKey)return;
  lastWaveUIKey=key;
  waveFill.style.width=(p*100)+'%';
  waveStageText.textContent=currentLevel===8?`第 ${stage}/3 波`:(currentLevel===10?(level10Boss?'Boss 战':`第 ${stage}/4 波`):`第 ${stage}/4 波`);
  waveMidFlag.style.display=hasMidWave()?'block':'none';
  waveMidFlag.classList.toggle('reached',hasMidWave()&&p>=(currentLevel===8?1/3:.5));
  waveFinalFlag.classList.toggle('reached',p>=(currentLevel===8?2/3:.75));
  waveStateText.textContent=state;
  waveHud.classList.toggle('surge',surge);
}
function startLevel4FinalRaid(){
  if(currentLevel!==4||finalRaid?.active)return;
  const types=['normal','cone','crawler','normal','cone','crawler','normal','cone'],queue=types.map((type,i)=>({type,row:LEVELS[4].rows[i%LEVELS[4].rows.length]}));
  finalRaid={active:true,age:0,extendDur:5.6,hold:.7,queue,nextDrop:0,dropEvery:.34,closing:false,closeAge:0};
  waveBurstRemaining=0;spawned=LEVELS[4].total;
  say('最后一波！右侧卸货板正在伸入草坪——准备迎接大举突袭！');
}
function throwBossWrench(boss,target){
  if(!boss||!target)return;
  boss.throwTime=.92;boss.throwTargetRow=target.row;
  bossWrenches.push({id:nextId++,bossId:boss.id,targetId:target.id,startX:boss.x-.28,startY:boss.row+.23,targetX:target.col+.5,targetY:target.row+.47,x:boss.x-.28,y:boss.row+.23,age:0,dur:1.12,angle:-.7,hit:false,impactAge:0});
  playSfx('metalBuild',.72,'wrenchThrow',90,boss.x);
}
function updateBossWrenches(dt){
  for(const w of bossWrenches){
    if(!w.hit){
      w.age+=dt;const q=Math.min(1,w.age/w.dur),e=q*q*(3-2*q);
      w.x=w.startX+(w.targetX-w.startX)*e;
      w.y=w.startY+(w.targetY-w.startY)*e-1.28*Math.sin(q*Math.PI);
      w.angle=-.7+q*Math.PI*7.5;
      if(q>=1){
        w.hit=true;w.impactAge=0;w.x=w.targetX;w.y=w.targetY;
        const target=plants.find(p=>p.id===w.targetId&&p.hp>0);
        if(target){damagePlant(target,target.hp+1);target.bumpTime=.55;}
        playSfx('metalHit',1.18,'bossWrenchImpact',80,w.targetX);
        blastFx.push({id:nextId++,x:w.targetX,y:w.targetY,age:0,life:.42,kind:'wrench'});
        battleRoot.animate([{transform:'translate(0,0)'},{transform:'translate(-4px,2px)'},{transform:'translate(4px,-2px)'},{transform:'translate(0,0)'}],{duration:180,iterations:1});
      }
    }else w.impactAge+=dt;
  }
  bossWrenches=bossWrenches.filter(w=>!w.hit||w.impactAge<.34);
}
function makeCargoSlide(start,end){return {phase:'dive',age:0,phaseAge:0,diveDur:1.02,start,end,y:-.16,vy:0,angle:-48,bounceCount:0,impactPulse:0};}
function updateCargoSlide(z,dt){
 const s=z.bossSlide;if(!s)return false;s.age+=dt;s.phaseAge+=dt;s.impactPulse=Math.max(0,(s.impactPulse||0)-dt);
 if(s.phase==='dive'){const q=Math.min(1,s.phaseAge/s.diveDur),e=q*q*(3-2*q);z.x=s.start+(s.end-s.start)*e;s.y=-.16+.16*e-.11*Math.sin(q*Math.PI);s.angle=-48-38*e;z.walkTick=(z.walkTick+dt*.72)%1;if(q>=1){s.phase='impact';s.phaseAge=0;s.y=0;s.vy=0;s.angle=-86;s.impactPulse=.20;playSfx('land',.78,'cargoFaceLand',80,z.x);}return true;}
 if(s.phase==='impact'){const q=Math.min(1,s.phaseAge/.18);s.y=.025*Math.sin(q*Math.PI);s.angle=-86+8*q;if(q>=1){s.phase='tumble';s.phaseAge=0;s.y=0;s.vy=-.67;s.angle=-78;s.bounceCount=0;}return true;}
 if(s.phase==='tumble'){s.vy+=3.05*dt;s.y+=s.vy*dt;const q=Math.min(1,s.phaseAge/.78),e=q*q*(3-2*q);s.angle=-78+170*e;if(s.y>=0&&s.vy>0){s.y=0;s.bounceCount++;s.impactPulse=.15;playSfx('fleshHit',s.bounceCount===1?.44:.27,'cargoBodyBounce'+s.bounceCount,70,z.x);if(s.bounceCount===1)s.vy=-.40;else{s.phase='roll';s.phaseAge=0;s.vy=0;s.angle=92;}}if(s.phaseAge>1.30){s.phase='roll';s.phaseAge=0;s.y=0;s.vy=0;s.angle=92;}return true;}
 if(s.phase==='roll'){const q=Math.min(1,s.phaseAge/.64);s.angle=92+18*Math.sin(q*Math.PI);s.y=.018*Math.sin(q*Math.PI);if(q>=1){s.phase='brace';s.phaseAge=0;s.angle=92;s.y=0;}return true;}
 if(s.phase==='brace'){const q=Math.min(1,s.phaseAge/.72);s.angle=92-20*(q*q*(3-2*q));s.y=.018*Math.sin(q*Math.PI);if(q>=1){s.phase='rise';s.phaseAge=0;s.angle=72;s.y=0;}return true;}
 if(s.phase==='rise'){const q=Math.min(1,s.phaseAge/1.42),e=q*q*(3-2*q);s.angle=72*(1-e);s.y=.026*Math.sin(q*Math.PI);if(q>=1){s.angle=0;s.y=0;z.bossSlide=null;return true;}return true;}z.bossSlide=null;return true;
}
function updateLevel4FinalRaid(dt){
  const r=finalRaid;if(!r||!r.active)return;r.age+=dt;
  if(r.age<r.extendDur+r.hold)return;
  r.nextDrop-=dt;
  if(r.queue.length&&r.nextDrop<=0){
    const item=r.queue.shift(),z=makeZombie(item.type,item.row,COLS+.35);
    z.bossSlide=makeCargoSlide(COLS+.35,5.05);z.hitStun=0;z.hurt=0;z.walkTick=0;zombies.push(z);
    r.nextDrop=r.dropEvery+Math.random()*.10;
  }
  if(!r.queue.length&&!r.closing){r.closing=true;r.closeAge=0;}
  if(r.closing){r.closeAge+=dt;if(r.closeAge>1.25)r.active=false;}
}
function finalRaidBusy(){return !!(finalRaid&&finalRaid.active);}
function triggerWave(kind){
  const cfg=LEVELS[currentLevel];playSfx('wave',1,'wave',700);
  if(kind==='mid'){if(waveTriggeredMid||!hasMidWave())return;waveTriggeredMid=true;waveBurstRemaining=Math.min(4,Math.max(2,Math.ceil(cfg.total*.22)));say('中段旗帜出现！尸潮开始加压。');}
  else{if(waveTriggeredFinal)return;waveTriggeredFinal=true;if(currentLevel===4)startLevel4FinalRaid();else{waveBurstRemaining=Math.min(5,Math.max(2,Math.ceil(cfg.total*.28)));say('最后一波！守住这一轮尸潮！');}}
  wavePulseTimer=1.2;spawnClock=Math.max(spawnClock,nextSpawnDelay*.7);
  updateWaveUI();
}
function checkWaveTrigger(){
  if(currentLevel===7||currentLevel===10)return;
  const p=waveProgress();
  if(hasMidWave()&&!waveTriggeredMid&&p>=.5)triggerWave('mid');
  const finalThreshold=.75;
  if(!waveTriggeredFinal&&p>=finalThreshold)triggerWave('final');
}
function level7Stage(){return level7Event?level7Event.wave:1;}
function startLevel7(){
  level7Event={wave:1,firstGate:true,firstId:null,scaffold:0,buildAge:0,plateAge:-1,plane:null,dropDone:false,waveSpawned:[0,0,0,0],waveTargets:[1,7,8,10]};
  zombies.length=0;spawned=0;spawnClock=0;
  const z=makeZombie('normal',LEVELS[7].rows[Math.floor(Math.random()*LEVELS[7].rows.length)]);
  zombies.push(z);spawned=1;level7Event.firstId=z.id;level7Event.waveSpawned[0]=1;
  say('第一波：先解决这只普通僵尸。它不倒下，后续敌人不会出现。');
}
function advanceLevel7Wave(){
  const e=level7Event;if(!e||e.wave>=4)return;
  e.wave++;e.buildAge=1.15;e.scaffold=e.wave-1;spawnClock=0;nextSpawnDelay=1.4;playSfx('metalBuild',1,'metalBuild',300,COLS-.5);
  if(e.wave===2)say('第二波：五条路线右端同时搭建一格高的铁架斜坡！');
  if(e.wave===3)say('第三波：五条路线的铁架同时升到两格高！');
  if(e.wave===4){say('最后一波：五条路线的三层铁架全部完成——天上有东西掉下来了！');startLevel7Finale();}
  wavePulseTimer=1.2;
}
function startLevel7Finale(){
  const e=level7Event;if(!e)return;
  e.plateAge=0;playSfx('plane',1,'plane',500,COLS-.5);
  e.planes=Array.from({length:ROWS},(_,row)=>({row,age:-row*.16,dur:5.8,dropAt:3.15,dropped:false}));
  e.plane=null;e.dropDone=false;
}
function updateLevel7(dt){
  if(currentLevel!==7||!level7Event)return;
  const e=level7Event;if(e.buildAge>0)e.buildAge=Math.max(0,e.buildAge-dt);
  if(e.plateAge>=0)e.plateAge+=dt;
  if(e.firstGate){
    if(!zombies.some(z=>z.id===e.firstId&&z.hp>0)){e.firstGate=false;advanceLevel7Wave();}
    return;
  }
  if(e.planes?.length){
    for(const plane of e.planes){
      plane.age+=dt;
      if(!plane.dropped&&plane.age>=plane.dropAt){
        plane.dropped=true;
        const z=makeZombie('bucket',plane.row,5.5);
        z.raidDrop={age:0,dur:.82+plane.row*.04,startY:plane.row-.72};
        zombies.push(z);playSfx('metalHit',.75,'raidDrop',90,5.5);spawned++;
      }
    }
    if(e.planes.every(plane=>plane.dropped))e.dropDone=true;
    if(e.planes.every(plane=>plane.age>plane.dur))e.planes=null;
  }
  // Waves 2/3 use normal spawning; wave 4 gets a smaller ground escort because the plane supplies the bucket row.
  const wi=e.wave-1,target=e.waveTargets[wi];
  if(e.wave>=2&&e.waveSpawned[wi]<target&&spawnClock>=nextSpawnDelay){
    spawnClock=0;
    let type=pickZombieType();if(e.wave===2&&type==='bucket')type='normal';
    zombies.push(makeZombie(type,LEVELS[7].rows[Math.floor(Math.random()*LEVELS[7].rows.length)]));
    e.waveSpawned[wi]++;spawned++;nextSpawnDelay=e.wave===4?3.2+Math.random()*2.0:4.0+Math.random()*2.5;
  }
  const alive=zombies.some(z=>z.hp>0);
  if(e.wave===2&&e.waveSpawned[1]>=e.waveTargets[1]&&!alive)advanceLevel7Wave();
  else if(e.wave===3&&e.waveSpawned[2]>=e.waveTargets[2]&&!alive)advanceLevel7Wave();
}
function level7Finished(){const e=level7Event;return currentLevel===7&&e&&e.wave===4&&e.waveSpawned[3]>=e.waveTargets[3]&&e.dropDone&&!e.planes&&zombies.length===0;}
function chooseSpawnDelay(){
  const cfg=LEVELS[currentLevel], stage=waveStage();
  if(waveBurstRemaining>0)return (2.6+Math.random()*2.0);
  const baseMin=cfg.spawnMin,baseMax=cfg.spawnMax;
  const stageMul=[1.38,1.18,1.02,.92][stage];
  return (baseMin+Math.random()*(baseMax-baseMin))*1.2*stageMul;
}
function levelAllowedZombie(type){
  const cfg=LEVELS[currentLevel]||{};
  return type==='normal'||(type==='cone'&&!!cfg.cones)||(type==='bucket'&&!!cfg.buckets)||
    (type==='crawler'&&!!cfg.crawlers)||(type==='imp'&&!!cfg.imps)||
    (type==='longhair'&&!!cfg.longhairs)||(type==='brain'&&!!cfg.brains);
}
function level8FlagPlan(){
  // Flag waves only reprioritize zombies already legal in this level.
  // They never bypass the game's strict zombie introduction order.
  return [
    {at:7,support:['crawler','brain'],escort:['normal','cone']},
    {at:14,support:['imp','crawler','brain'],escort:['normal','cone','bucket']},
    {at:21,support:['brain','imp','crawler'],escort:['cone','bucket','normal']}
  ];
}
function armLevel8FlagIfNeeded(){
  if(currentLevel!==8||level8FlagBurst.length)return;
  const f=level8FlagPlan()[level8FlagIndex];
  if(!f||spawned<f.at)return;
  level8FlagIndex++;
  const support=f.support.filter(levelAllowedZombie);
  const escort=f.escort.filter(levelAllowedZombie);
  level8FlagBurst=[...support,...escort];
  wavePulseTimer=1.2;
  say(`第 ${level8FlagIndex}/3 面旗帜亮起！本关已登场的增益僵尸优先出击！`);
}
function armLevel9MinerSpawns(){
  if(currentLevel!==9)return;
  // New-enemy introductions are scripted, never left to RNG.
  if(!level9MinerIntroDone&&spawned>=5){
    level9MinerIntroDone=true;
    level9MinerQueue.push('miner');
    say('地面传来金属刮擦声……第九关的新敌人正在靠近！');
  }
  if(!level9MinerMidDone&&spawned>=15){
    level9MinerMidDone=true;
    level9MinerQueue.push('miner','miner');
    wavePulseTimer=1.2;
    say('旗帜波：两名矿工僵尸开始破坏地下防线！');
  }
  if(!level9MinerLateDone&&spawned>=24){
    level9MinerLateDone=true;
    level9MinerQueue.push('miner','miner');
    wavePulseTimer=1.2;
    say('最后阶段：矿工僵尸成组钻入草坪！');
  }
}
function ensureBossPresentation(){
  let alert=document.getElementById('bossCinematicAlert');
  if(!alert){alert=document.createElement('div');alert.id='bossCinematicAlert';alert.className='bossCinematicAlert';alert.innerHTML='<span>感染源靠近</span>';battleRoot.appendChild(alert);}
  let hud=document.getElementById('bossGlobalHp');
  if(!hud){hud=document.createElement('div');hud.id='bossGlobalHp';hud.className='bossGlobalHp';hud.innerHTML='<div class="bossGlobalHpName">感染源 · 战车工头</div><div class="bossGlobalHpFrame"><div class="bossGlobalHpFill"></div></div>';battleRoot.appendChild(hud);}
  return {alert,hud,fill:hud.querySelector('.bossGlobalHpFill')};
}
function updateBossPresentation(){
  const ui=ensureBossPresentation(),e=currentLevel===10?level10Boss:null;
  const warning=!!e&&e.phase==='warning';
  ui.alert.classList.toggle('show',warning);battleRoot.classList.toggle('bossWarningShake',warning);
  const boss=e&&zombies.find(z=>z.type==='workboss'&&z.hp>0);
  const visible=!!boss&&Number.isFinite(e.hudAge);
  ui.hud.classList.toggle('show',visible);
  ui.hud.classList.toggle('docked',visible&&e.hudAge>=1.35);
  if(!visible){ui.fill.style.width='0';ui.fill.style.height='calc(100% - 10px)';return;}
  if(e.hudAge<1.35){
    const charge=Math.max(0,Math.min(1,e.hudAge/1.12));
    ui.fill.style.width=`calc(${(charge*100).toFixed(2)}% - ${(charge*10).toFixed(1)}px)`;
    ui.fill.style.height='calc(100% - 10px)';
  }else{
    const hp=Math.max(0,Math.min(1,boss.hp/boss.maxHp));
    ui.fill.style.width='calc(100% - 10px)';ui.fill.style.height=`calc(${(hp*100).toFixed(2)}% - ${(hp*10).toFixed(1)}px)`;
  }
}
function startLevel10Boss(){
  level10Boss={age:0,emitted:0,groupReleased:0,releaseClock:0,phase:'warning',intermissionAge:0,attackStep:0,target:null,lastTargetId:null,truckOpen:0,hudAge:null,bossSpawned:false};
  ensureBossPresentation();updateBossPresentation();
  say('感染源靠近');playSfx('metalHit',1.15,'bossWarning',220,8.8);
}
function updateLevel10(dt){
  if(currentLevel!==10){battleRoot.classList.remove('bossWarningShake');return;}
  // The Boss event begins only after every prelude enemy has actually been cleared.
  if(!level10Boss){
    if(spawned>=level10IntroTarget&&!zombies.some(z=>z.hp>0))startLevel10Boss();
    return;
  }
  const e=level10Boss;e.age+=dt;
  if(e.phase==='warning'){
    updateBossPresentation();
    if(e.age<2.15)return;
    e.phase='truckEntrance';say('警报确认——战车正在驶入！');playSfx('metalBuild',1.1,'bossTruck',300,8.8);
  }
  e.truckOpen=Math.min(1,Math.max(0,(e.age-3.30)/5.6));
  if(!e.bossSpawned&&e.age>=9.05){
    e.bossSpawned=true;e.phase='bossReveal';e.hudAge=0;
    const boss=makeZombie('workboss',2,8.65);boss.hp=1400;boss.maxHp=1400;boss.bossUnit=true;boss.teleportFx=.65;boss.smashTime=0;boss.bossHitFx=0;zombies.push(boss);
    e.musicSwitched=true;playBossBgm();say('感染源现身——Boss 战开始！');
  }
  const boss=zombies.find(z=>z.type==='workboss'&&z.hp>0);
  if(!e.bossSpawned){updateBossPresentation();return;}
  if(!boss){e.phase='defeated';e.emitted=15;spawned=Math.max(spawned,LEVELS[10].total);updateBossPresentation();return;}
  e.hudAge+=dt;boss.teleportFx=Math.max(0,(boss.teleportFx||0)-dt);boss.smashTime=Math.max(0,(boss.smashTime||0)-dt);boss.throwTime=Math.max(0,(boss.throwTime||0)-dt);boss.bossHitFx=Math.max(0,(boss.bossHitFx||0)-dt);
  if(!e.oneThirdRush&&boss.hp>0&&boss.hp<=boss.maxHp/3){
    e.oneThirdRush=true;wavePulseTimer=1.8;
    const dropRows=[1,2,3,1,2,3];
    for(let i=0;i<6;i++){
      const row=dropRows[i],x=Math.max(4.65,boss.x-1.15-(i>=3?.72:0)-Math.random()*.34);
      const imp=makeZombie('imp',row,x);imp.raidDrop={age:0,dur:1.22,startY:-.85};imp.airY=0;imp.hitStun=0;imp.hurt=0;zombies.push(imp);
    }
    playSfx('wave',1.2,'bossOneThirdRush',500);say('Boss 只剩三分之一生命——正前方三行降下 6 只小鬼僵尸！');
    battleRoot.animate([{filter:'brightness(1)'},{filter:'brightness(1.55) saturate(1.4)'},{filter:'brightness(1)'}],{duration:420,iterations:1});
  }
  updateBossPresentation();
  if(e.phase==='bossReveal'&&e.hudAge<2.45)return;
  if(e.phase==='bossReveal'){e.phase='release';e.releaseClock=0;e.groupReleased=0;}
  if(e.phase==='release'){
    const activeMinions=zombies.filter(z=>z.hp>0&&z.type!=='workboss').length;
    if(e.groupReleased===0&&activeMinions>10){
      e.releasePaused=true;e.releaseClock=.55;
    }else{
      e.releasePaused=false;e.releaseClock-=dt;
      if(e.releaseClock<=0){
        const types=['crawler','normal','cone','crawler','brain','normal'];
        const type=types[e.emitted%types.length],truckRows=[1,2,3],row=truckRows[e.emitted%truckRows.length];
        const z=makeZombie(type,row,10.35);z.bossSlide=makeCargoSlide(10.35,5.05);z.hitStun=0;z.hurt=0;zombies.push(z);
        e.emitted++;e.groupReleased++;spawned++;e.releaseClock=1.15;playSfx('metalHit',.6,'bossDrop',100,8.8);
        if(e.groupReleased>=5){
          e.phase='intermission';e.intermissionAge=0;e.attackStep=0;e.target=null;e.jumpLanded=false;e.jumpReturned=false;
          say('本批 5 只僵尸装卸完成——工头从车厢跳下准备投掷扳手！');
        }
      }
    }
  }
  if(e.phase==='intermission'){
    e.intermissionAge+=dt;
    const moveEase=q=>q*q*(3-2*q),downDur=1.25,backStart=16.75,backDur=1.20,deckX=8.65,groundX=7.28;
    if(e.intermissionAge<downDur){
      const q=Math.max(0,Math.min(1,e.intermissionAge/downDur)),ease=moveEase(q);
      boss.x=deckX+(groundX-deckX)*ease;boss.bossAirY=-.62*Math.sin(q*Math.PI);boss.bossJumpTilt=-10*Math.sin(q*Math.PI);
    }else if(e.intermissionAge<backStart){
      boss.x=groundX;boss.bossAirY=0;boss.bossJumpTilt=0;
      if(!e.jumpLanded){e.jumpLanded=true;playSfx('land',1,'bossJumpDown',120,boss.x);say('工头落到战车前方——现在可以集中攻击他！');}
    }else if(e.intermissionAge<backStart+backDur){
      const q=Math.max(0,Math.min(1,(e.intermissionAge-backStart)/backDur)),ease=moveEase(q);
      boss.x=groundX+(deckX-groundX)*ease;boss.bossAirY=-.68*Math.sin(q*Math.PI);boss.bossJumpTilt=12*Math.sin(q*Math.PI);
    }else{
      boss.x=deckX;boss.bossAirY=0;boss.bossJumpTilt=0;
      if(!e.jumpReturned){e.jumpReturned=true;playSfx('land',.82,'bossJumpBack',120,boss.x);say('工头跳回车厢，准备下一轮装卸。');}
    }
    const strike=()=>{
      const candidates=plants.filter(p=>p.hp>0&&p.type!=='crossfan'&&p.id!==e.lastTargetId);
      const fallback=plants.filter(p=>p.hp>0&&p.type!=='crossfan');
      const pool=candidates.length?candidates:fallback,target=pool[Math.floor(Math.random()*pool.length)]||null;
      e.target=target;
      if(target){e.lastTargetId=target.id;throwBossWrench(boss,target);say('工头在战车前抡圆手臂，把扳手投向植物！');}
    };
    if(e.attackStep===0&&e.intermissionAge>=1.48){strike();e.attackStep=1;}
    if(e.attackStep===1&&e.intermissionAge>=10.15){strike();e.attackStep=2;}
    if(e.attackStep===2&&e.intermissionAge>=backStart){e.target=null;e.attackStep=3;}
    if(e.intermissionAge>=20){
      e.groupReleased=0;e.releaseClock=0;e.intermissionAge=0;e.attackStep=0;
      e.phase='release';e.releasePaused=false;
      say('工头回到车上；场上僵尸不超过 10 只时，将继续装卸下一批。');
    }
  }
}
function pickZombieType(){
  const cfg=LEVELS[currentLevel],stage=waveStage(),surge=waveBurstRemaining>0;
  if(currentLevel===9&&level9MinerQueue.length)return level9MinerQueue.shift();
  if(currentLevel===8&&level8FlagBurst.length){const t=level8FlagBurst.shift();if(levelAllowedZombie(t))return t;}
  let type='normal';
  // Before the middle of the level, mostly basic walkers/cones. Special enemies ramp during flags and late game.
  const coneChance=cfg.cones?(stage===0?.16:stage===1?.24:surge?.42:.31):0;
  const crawlChance=cfg.crawlers?(stage===0?.015:stage===1?.07:stage===2?(surge?.30:.17):(surge?.36:.24)):0;
  const impChance=cfg.imps?(stage<2?0:(stage===2?(surge?.18:.08):(surge?.28:.14))):0;
  const hairChance=cfg.longhairs?(stage===0?.04:stage===1?.10:stage===2?(surge?.22:.16):(surge?.28:.21)):0;
  const bucketChance=cfg.buckets?(stage===0?.10:stage===1?.16:stage===2?(surge?.26:.20):(surge?.32:.24)):0;
  const brainChance=cfg.brains?(stage===0?.16:stage===1?.20:stage===2?.24:.28):0;
  const minerChance=cfg.miners?(stage===0?0:stage===1?.10:stage===2?(surge?.28:.17):(surge?.34:.22)):0;
  const r=Math.random();
  if(minerChance&&r<minerChance)return 'miner';
  if(brainChance&&r<brainChance)return 'brain';
  if(bucketChance&&r<brainChance+bucketChance)return 'bucket';
  if(hairChance&&r<brainChance+bucketChance+hairChance)return 'longhair';
  if(impChance&&r<brainChance+bucketChance+hairChance+impChance)return 'imp';
  if(crawlChance&&r<brainChance+bucketChance+hairChance+impChance+crawlChance)return 'crawler';
  if(coneChance&&r<brainChance+bucketChance+hairChance+impChance+crawlChance+coneChance)return 'cone';
  return type;
}
function makeZombie(type,row,x=COLS+.18){
  const archetype=ZOMBIE_ARCHETYPES[type]||ZOMBIE_ARCHETYPES.normal;
  const hp=archetype.hp,speed=archetype.speed,armor=archetype.armor||0;
  return {
    id:nextId++,type,row,x,hp,maxHp:hp,coneHp:armor,coneMax:armor,speed,
    attack:0,eating:false,eatMode:null,eatTargetId:null,walkTick:Math.random()*4,hurt:0,hitStun:0,
    armGone:!!archetype.armGone,lungeTime:0,lungePhase:0,bloodTick:0,gaitPhase:Math.random(),gaitCadence:archetype.gaitCadence,
    hairCooldown:0,hairAttack:0,brainEat:0,brainDropId:null,smashTime:0,smashCooldown:0,giantArmor:null,giantTransform:0,giantTransformTotal:3,giantFromType:null,
    crawlPhase:Math.random(),lungeStartX:null,lungeEndX:null,lungeDuration:1.50,
    entrailAnchorX:archetype.entrailAnchored?x:null,entrailPhase:Math.random()*Math.PI*2,entrailSpawnX:archetype.entrailAnchored?x:null,entrailTravel:0,entrailDetached:false,
    mountedToId:null,carriesImpId:null,airY:0,jumpTime:0,jumpDur:0,jumpMode:null,jumpFromX:null,jumpToX:null,jumpTargetId:null,
    digState:archetype.digState||null,digAge:0,digStartX:null,digEndX:null,digRise:0
  };
}
function spawnZombie(){
  const cfg=LEVELS[currentLevel];
  const row=cfg.rows[Math.floor(Math.random()*cfg.rows.length)];
  let type=pickZombieType();
  if(spawned<2&&type!=='normal'&&type!=='cone')type='normal';

  // 小鬼配合：当本次刷出小鬼时，若本关剩余名额足够，有 50% 概率在它前方同一路线先放一个正常体型僵尸。
  // “前方”是朝植物方向，因此宿主的 x 会比小鬼更小；小鬼随后追上并跳到它头上。
  if(type==='imp' && spawned<=cfg.total-2 && Math.random()<.50){
    const hostType=cfg.cones&&Math.random()<.42?'cone':'normal';
    zombies.push(makeZombie(hostType,row,COLS-1.02));
    zombies.push(makeZombie('imp',row,COLS+.38));playSfx('zombieSpawn',.7,'zombieSpawn',350,COLS-.3);
    spawned+=2;
    if(waveBurstRemaining>0)waveBurstRemaining=Math.max(0,waveBurstRemaining-2);
    checkWaveTrigger();nextSpawnDelay=chooseSpawnDelay();updateWaveUI();
    say('低矮小鬼丧尸出现，前方同时有一只正常体型丧尸可供它骑乘。');
    return;
  }

  zombies.push(makeZombie(type,row));playSfx('zombieSpawn',.65,'zombieSpawn',350,COLS-.3);
  spawned++;
  if(waveBurstRemaining>0)waveBurstRemaining=Math.max(0,waveBurstRemaining-1);
  checkWaveTrigger();nextSpawnDelay=chooseSpawnDelay();updateWaveUI();
  say(type==='miner'?'矿工僵尸拖着矿镐进场了——小心地下的鼓包！':type==='brain'?'脑浆僵尸摇摇晃晃地出现了——它死亡后会留下危险的脑浆。':type==='longhair'?'长发丧尸出现了——她会甩动头发反弹豌豆。':type==='imp'?'低矮小鬼丧尸沿着草地窜了进来。':type==='crawler'?'半身爬行者扒着草地出现了。':type==='cone'?'路障丧尸慢慢晃进来了。':'普通丧尸出现。');
}

function forceSpawnImp(){
  const cfg=LEVELS[currentLevel];
  if(!cfg.imps||spawned>=cfg.total||waveStage()<2)return false;
  const row=cfg.rows[Math.floor(Math.random()*cfg.rows.length)];
  if(spawned<=cfg.total-2&&Math.random()<.50){
    const hostType=cfg.cones&&Math.random()<.42?'cone':'normal';
    zombies.push(makeZombie(hostType,row,COLS-1.02));
    zombies.push(makeZombie('imp',row,COLS+.38));
    spawned+=2;
    if(waveBurstRemaining>0)waveBurstRemaining=Math.max(0,waveBurstRemaining-2);
    say('小鬼强制刷新：前方同时出现正常体型丧尸供它骑乘。');
  }else{
    zombies.push(makeZombie('imp',row));
    spawned++;
    if(waveBurstRemaining>0)waveBurstRemaining=Math.max(0,waveBurstRemaining-1);
    say('低矮小鬼丧尸再次出现。');
  }
  checkWaveTrigger();updateWaveUI();
  impSpawnClock=0;
  nextImpSpawnDelay=22+Math.random()*6;
  return true;
}

function triggerChainsaw(row){
  const saw=chainsaws.find(s=>s.row===row&&!s.used);
  if(!saw)return false;
  saw.used=true;saw.active=true;saw.x=-.08;playSfx('chainsaw',1.1,'chainsaw',300,.2);
  // Let the saw physically travel across the lane. Damage is resolved only when
  // the spinning blade reaches a zombie instead of clearing the whole row up front.
  chainsawFx.push({id:nextId++,row,x:-.08,age:0,life:1.85});
  say('血锯启动！锯片碰到丧尸时才会将它切倒。');
  return true;
}
function showThanksEnding(){
  const o=document.getElementById('thanksOverlay');
  if(o){o.classList.add('show');o.setAttribute('aria-hidden','false');}
}
function showInfection(){
  const o=document.getElementById('infectionOverlay');
  if(o){o.classList.add('show');o.setAttribute('aria-hidden','false');}
}
function drawChainsaw(ctx,spin=0,bloody=true){
  ctx.save();ctx.translate(32,32);ctx.rotate(spin);ctx.translate(-32,-32);
  ctx.fillStyle='#333';ctx.fillRect(14,27,24,11);ctx.fillStyle='#6c7470';ctx.fillRect(18,24,20,17);
  ctx.fillStyle='#181b1a';ctx.fillRect(36,29,13,7);ctx.fillStyle='#5b3a24';ctx.fillRect(47,30,9,5);
  ctx.translate(16,32);ctx.fillStyle='#c0c6bd';ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#343936';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#202321';ctx.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);ctx.lineTo(Math.cos(a)*16,Math.sin(a)*16);ctx.stroke();}
  if(bloody){ctx.strokeStyle='#8c1822';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,11,.2,2.25);ctx.stroke();ctx.fillStyle='#a51d29';ctx.beginPath();ctx.arc(-8,8,2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

function createPlantSun(p){
  p.anim=Math.max(p.anim,0.75);playSfx('sunSpawn',.75,'sunSpawn',140,p.col+.5);
  suns.push({id:nextId++,kind:'plant',x:p.col+.5,y:p.row+.32,startY:p.row+.48,targetY:p.row+.16,age:0,life:8,value:25});
}
function createSkySun(){
  const x=.65+Math.random()*(COLS-1.3),targetY=.65+Math.random()*(ROWS-1.3);
  suns.push({id:nextId++,kind:'sky',x,y:-.28,startY:-.28,targetY,age:0,life:10,value:25});
  say('天空阳光出现，正在自动收集。');
}
function collectSun(id,el){
  const s=suns.find(x=>x.id===id);if(!s||s.collecting)return;
  s.collecting=true;
  // 自动收集时优先拿到场上这个阳光的真实 DOM 位置，保证“落地后再飞向阳光栏”。
  if(!el) el=document.querySelector(`.sunOrb[data-sun-id="${id}"]`);
  const startRect=el?el.getBoundingClientRect():null;
  const targetEl=document.getElementById('sun').parentElement;
  const endRect=targetEl.getBoundingClientRect();
  suns=suns.filter(x=>x!==s);
  if(el){el.disabled=true;el.style.pointerEvents='none';el.style.opacity='0';}

  const finishCollect=()=>{sun+=s.value;playSfx('sunCollect',.8,'sunCollect',90,s.x);updateHUD()};
  if(startRect){
    const fly=document.createElement('div');
    fly.className='sunFlyUI';fly.style.position='fixed';fly.style.left=startRect.left+'px';fly.style.top=startRect.top+'px';fly.style.width=startRect.width+'px';fly.style.height=startRect.height+'px';fly.style.zIndex='200';fly.style.pointerEvents='none';
    fly.appendChild(makeCanvas(drawSun));document.body.appendChild(fly);
    requestAnimationFrame(()=>{
      fly.style.transition='left .62s cubic-bezier(.18,.78,.18,1),top .62s cubic-bezier(.18,.78,.18,1),transform .62s ease,opacity .62s ease';
      fly.style.left=(endRect.left+endRect.width*.18)+'px';fly.style.top=(endRect.top+endRect.height*.02)+'px';fly.style.transform='scale(.34) rotate(10deg)';fly.style.opacity='.18';
    });
    setTimeout(()=>{fly.remove();finishCollect();},640);
  }else{
    finishCollect();
  }
}
function firePea(p){
  p.fireAnim=.54;
  // Spawn from the actual center of the dark muzzle bore (mapped from the 64x64 plant canvas).
  // This keeps the first visible frame inside the mouth instead of appearing in the next tile.
  const muzzleX=p.col+.765, muzzleY=p.row+.466;
  const fireMode=!!p.fireMode;playSfx(fireMode?'fireShoot':'shoot',1,'shoot',35,muzzleX);
  peas.push({id:nextId++,row:p.row,y:muzzleY,x:muzzleX,startX:muzzleX,age:0,speed:PLANT_ARCHETYPES.pea.behavior.projectileSpeed,damage:fireMode?PLANT_ARCHETYPES.pea.behavior.fireProjectileDamage:PLANT_ARCHETYPES.pea.behavior.projectileDamage,fire:fireMode,burnTotal:fireMode?PLANT_ARCHETYPES.pea.behavior.fireBurnTotal:0,burnDuration:fireMode?PLANT_ARCHETYPES.pea.behavior.fireBurnDuration:0});
}
function addDeathFx(z){if(z.type==='brain'){
  playSfx('zombieDeath',.8,'brainDeath',80,z.x);
  // IMPORTANT: create the gameplay drop NOW, not 1.16 s later from deathFx.
  // Mobile FX pruning is allowed to delete corpse animations, but can never delete this independent pickup.
  brainDrops.push({id:nextId++,x:z.x+.20,row:z.row,y:z.row+.54,eaterId:null,done:false,landed:false,landingAge:0,landingDelay:1.16,groundAge:0,groundLife:30,landGrace:.55});
  deathFx.push({id:nextId++,type:'brainZombie',zombieType:'brain',x:z.x,y:z.row+.5,row:z.row,age:0,life:1.55,brainSpawned:true});
  return;
}const burned=['fire','firePea','firePeaBurn','lavaWall','crossFire'].includes(z.deathSource),ashed=z.deathSource==='potato';playSfx(burned?'fireDeath':'zombieDeath',1,'death',55,z.x);deathFx.push({id:nextId++,type:burned?'fireZombie':(ashed?'ashZombie':'zombie'),zombieType:z.type,x:z.x,y:z.row+.5,row:z.row,cone:z.coneHp>0,age:0,life:burned?1.82:(ashed?1.9:1.72),seed:(z.id*37)%97,bloodLanded:false,bloodBurst:false})}
function addPlantDeathFx(p){playSfx('plantDeath',1,'plantDeath',80,p.col+.5);deathFx.push({id:nextId++,type:'plant',plantType:p.type,x:p.col+.5,y:p.row+.5,age:0,life:.72})}
function dropCone(z){playSfx('armorBreak',1,'armorBreak',70,z.x);coneFx.push({id:nextId++,x:z.x,y:z.row+.5,age:0,life:.9,dir:Math.random()<.5?-1:1,kind:z.type==='bucket'?'bucket':'cone'})}
function damageZombie(z,dmg,source=null,isFireDamage=false){
  if(z?.type==='workboss'&&!['intermission','finalStand'].includes(level10Boss?.phase))return;
  if(source)z.lastDamageSource=source;
  const incoming=Math.max(0,dmg);
  let armorLost=0, bodyLost=0;

  // Armor is a true front layer. Record its own lost segment before any spill reaches body HP.
  if(z.coneHp>0&&dmg>0){
    const armorBefore=z.coneHp;
    armorLost=Math.min(armorBefore,dmg);
    z.coneHp=Math.max(0,armorBefore-armorLost);
    dmg-=armorLost;
    if(armorLost>0&&(z.coneMax||0)>0){
      armorHpBreakFx.push({
        id:nextId++,zombieId:z.id,x:z.x,row:z.row,age:0,life:.58,
        from:z.coneHp/z.coneMax,size:Math.max(.08,armorLost/z.coneMax),
        source:source||'normal',fireDamage:!!isFireDamage
      });
    }
    if(armorBefore>0&&z.coneHp<=0){
      armorBreakFx.push({id:nextId++,zombieId:z.id,x:z.x,row:z.row,age:0,life:.72,seed:(z.id*19)%17});
      dropCone(z);
    }
  }

  if(dmg>0&&z.hp>0){
    const bodyBefore=z.hp;
    z.hp-=dmg;
    bodyLost=Math.max(0,bodyBefore-Math.max(0,z.hp));
    if(bodyLost>0&&z.type==='workboss'){z.bossHitFx=.24;z.bossHitFire=!!isFireDamage;}
    if(bodyLost>0&&(z.maxHp||0)>0){
      hpBreakFx.push({
        id:nextId++,zombieId:z.id,x:z.x,row:z.row,age:0,life:.54,
        from:Math.max(0,z.hp)/z.maxHp,size:Math.max(.055,bodyLost/z.maxHp),
        source:source||'normal',fireDamage:!!isFireDamage
      });
    }
  }

  const lost=armorLost+bodyLost;
  if((source==='pea'||source==='firePea')&&armorLost>0)playSfx('metalHit',1,'metalHit',42,z.x);
  else if((source==='pea'||source==='firePea')&&bodyLost>0)playSfx('fleshHit',1,'fleshHit',38,z.x);
  // The ordinary walker loses an arm at the artist-defined two-thirds-health transition.
  // Other existing zombie families retain their established half-health threshold.
  const armBreakAt=z.type==='normal'?(z.maxHp*2/3):(z.maxHp*.5);
  if(z.type!=='giant'&&!z.armGone&&z.hp<=armBreakAt){z.armGone=true;armFx.push({id:nextId++,x:z.x,y:z.row+.5,age:0,life:.9,dir:-1});}
  if(z.hp<=0&&source)z.deathSource=source;
  // Crawlers stay planted low to the ground: pea hits damage them but never stagger or knock them back.
  const controlImmune=ZOMBIE_ARCHETYPES[z.type]?.immuneKnockback||ZOMBIE_ARCHETYPES[z.type]?.immuneStagger;
  const stunHit=(source==='pea'||source==='firePea')&&z.type!=='giant'&&z.type!=='workboss'&&!controlImmune;
  if(stunHit){
    // Pea impact keeps the full 0.4 s stagger and also knocks the zombie
    // one eighth of a lawn cell away from the plants (to the right).
    z.hurt=.40;z.hitStun=.40;
    z.x=Math.min(COLS+.55,z.x+.125);
    // Cancel active bite/lunge ownership so the zombie cannot keep damaging
    // a plant from its old position or snap back after the knockback.
    z.eating=false;z.attack=0;z.eatTargetId=null;z.eatMode=null;
    z.lungeTime=0;z.lungePhase=0;z.lungeStartX=null;z.lungeEndX=null;
  }
  else if(lost>0&&z.type!=='giant'){z.hurt=Math.max(z.hurt||0,.10);}
}
function canHostImp(z){return !!(z&&z.hp>0&&(z.type==='normal'||z.type==='cone'||z.type==='longhair'));}
function startImpJump(z,mode,toX,targetId=null,dur=.46){
  playSfx('jump',.85,'jump',90,z.x);
  z.jumpMode=mode;z.jumpTime=dur;z.jumpDur=dur;z.jumpFromX=z.x;z.jumpToX=toX;z.jumpTargetId=targetId;z.airY=0;
}
function updateImpState(z,dt){
  if(z.type!=='imp')return false;
  z.airY=0;
  if(z.jumpTime>0){
    z.jumpTime=Math.max(0,z.jumpTime-dt);
    const dur=z.jumpDur||.46, u=Math.max(0,Math.min(1,1-z.jumpTime/dur));
    const ease=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
    z.x=(z.jumpFromX??z.x)+((z.jumpToX??z.x)-(z.jumpFromX??z.x))*ease;
    z.airY=-(z.jumpMode==='mount'?.58:.36)*Math.sin(u*Math.PI);
    if(z.jumpTime<=0){
      z.x=z.jumpToX??z.x;playSfx('land',.8,'land',70,z.x);
      if(z.jumpMode==='mount'){
        const host=zombies.find(o=>o.id===z.jumpTargetId&&canHostImp(o));
        if(host){z.mountedToId=host.id;host.carriesImpId=z.id;z.x=host.x+.02;}
      }
      z.jumpMode=null;z.jumpTargetId=null;z.jumpFromX=null;z.jumpToX=null;z.jumpDur=0;z.airY=0;
    }
    return true;
  }
  if(z.mountedToId){
    const host=zombies.find(o=>o.id===z.mountedToId&&o.hp>0);
    if(!host){z.mountedToId=null;z.airY=0;return false;}
    z.row=host.row;z.x=host.x+.02;z.walkTick=host.walkTick;
    // Long-haired ghost carries the imp directly on her head. During the impossible
    // neck-spin the imp rides the skull with a small inertial lag instead of floating.
    if(host.type==='longhair'){
      const hairDur=1.34, ph=(host.hairAttack||0)>0?1-Math.max(0,host.hairAttack)/hairDur:0;
      const spin=(host.hairAttack||0)>0?Math.sin(ph*Math.PI*2):0;
      z.airY=-0.47-Math.abs(spin)*.025;
      z.mountVisualAngle=(host.hairAttack||0)>0?spin*18:0;
      z.mountVisualX=(host.hairAttack||0)>0?spin*.035:0;
    }else{
      z.airY=-0.33;z.mountVisualAngle=0;z.mountVisualX=0;
    }
    if(host.eating){
      const tp=plants.find(p=>p.id===host.eatTargetId&&p.hp>0&&p.type!=='lighter');
      if(tp){host.carriesImpId=null;z.mountedToId=null;startImpJump(z,'drop',Math.max(-.06,tp.col+.08),null,.42);} 
    }
    return true;
  }
  const host=zombies.filter(o=>canHostImp(o)&&!o.carriesImpId&&o.row===z.row&&o.id!==z.id&&o.x<z.x&&(z.x-o.x)<.68).sort((a,b)=>b.x-a.x)[0];
  if(host&&!z.eating){startImpJump(z,'mount',host.x+.02,host.id,.78);host.carriesImpId=z.id;return true;}
  return false;
}

function update(dt){
  if(!running||ended)return;
  dt*=speedMul;
  // Selecting a plant gives the player tactical thinking time: battle simulation runs at 20%.
  // UI/pointer input remains real-time because only simulation dt is scaled.
  if(plantingBulletTimeActive())dt*=.2;
  gameTime+=dt;if(gloveFx){gloveFx.age+=dt;if(gloveFx.kind==='drop'&&gloveFx.age>=(gloveFx.life||.62))gloveFx=null;}
  for(const k of Object.keys(cooldowns))cooldowns[k]=Math.max(0,cooldowns[k]-dt);updateCooldownUI();
  spawnClock+=dt;skySunClock+=dt;if(currentLevel===5&&waveStage()>=2)impSpawnClock+=dt;
  if(wavePulseTimer>0)wavePulseTimer=Math.max(0,wavePulseTimer-dt);
  updateLevel4FinalRaid(dt);
  updateLevel7(dt);
  updateLevel10(dt);
  updateBossWrenches(dt);
  const level10Prelude=currentLevel===10&&!level10Boss&&spawned<level10IntroTarget;
  if(currentLevel!==7&&!finalRaidBusy()&&(currentLevel!==10||level10Prelude)&&spawned<LEVELS[currentLevel].total&&spawnClock>=nextSpawnDelay){spawnClock=0;if(currentLevel===8)armLevel8FlagIfNeeded();if(currentLevel===9)armLevel9MinerSpawns();spawnZombie()}
  if(currentLevel===5&&waveStage()>=2&&spawned<LEVELS[currentLevel].total&&impSpawnClock>=nextImpSpawnDelay)forceSpawnImp();
  updateWaveUI()
  if(skySunClock>=10){skySunClock-=10;createSkySun()}

  for(const z of zombies){z.fanSlow=false;}

  for(const p of plants){
    if((p.bumpTime||0)>0){
      p.bumpTime=Math.max(0,p.bumpTime-dt);p.anim=0;p.fireAnim=0;p.charge=0;
      continue;
    }
    if((p.squashDeath||0)>0){
      p.squashDeath=Math.max(0,p.squashDeath-dt);
      p.anim=0;p.fireAnim=0;p.charge=0;p.shoot=0;
      if(p.squashDeath<=0)p.hp=0;
      continue;
    }
    if(p.type==='crossfan'){
      p.crossActive=Math.max(0,(p.crossActive||0)-dt);
      if(p.crossActive>0){
        for(const z of zombies){
          if(z.hp<=0||z.digState==='underground')continue;
          const inHorizontal=z.row===p.row;
          const inVertical=Math.abs(z.x-(p.col+.5))<PLANT_ARCHETYPES.crossfan.behavior.verticalRadius;
          if(inHorizontal||inVertical)damageZombie(z,PLANT_ARCHETYPES.crossfan.behavior.dps*dt,'crossFire',true);
        }
      }else if(!p.crossExpired){
        p.crossExpired=true;
        p.skipDeath=true;
        playSfx('fan',.55,'crossFanEnd',120,p.col+.5);
      }
      continue;
    }
    if(p.type==='magnet'){
      p.magnetCooldown=Math.max(0,(p.magnetCooldown||0)-dt);
      p.magnetScan=(p.magnetScan||0)-dt;
      if(p.magnetScan<=0){
        if(!looseBuckets.some(b=>b.magnetId===p.id))magnetAbsorb(p);
        p.magnetScan=PLANT_ARCHETYPES.magnet.behavior.scanInterval;
      }
    }
    if(p.plantingAge!=null&&p.plantingAge<.56)p.plantingAge=Math.min(.56,p.plantingAge+dt);
    if(p.anim>0)p.anim=Math.max(0,p.anim-dt);
    if(p.fireAnim>0)p.fireAnim=Math.max(0,p.fireAnim-dt);
    if(p.fireMorph>0)p.fireMorph=Math.max(0,p.fireMorph-dt);
    if(p.fireTransform>0){
      p.fireTransform=Math.max(0,p.fireTransform-dt);
      const elapsed=(p.fireTransformTotal||PLANT_ARCHETYPES.lighter.behavior.transformDuration)-p.fireTransform;
      p.fireMorph=Math.min(1,Math.max(0,(elapsed-.55)/1.20));
      p.charge=0;p.shoot=0;
      if(p.fireTransform<=0){p.fireMode=true;p.fireMorph=1;p.fireAnim=0;playSfx('ignite',1,'transformIgnite',160,p.col+.5);p.shoot=Math.max(p.shoot||0,1.35);say(p.type==='wall'?'浴火熔铸——熔岩坚果完成转化！':'浴火重生——火焰射手完成转化！');}
    }
    if(p.gloveDrop>0)p.gloveDrop=Math.max(0,p.gloveDrop-dt);
    p.lastFrame=Math.floor((gameTime*6+p.id)%4);
    if((p.plantingAge??.56)<.56)continue;
    if(p.type==='sunflower'){
      p.charge=Math.min(1,p.produce/PLANT_ARCHETYPES.sunflower.behavior.productionPeriod);
      p.produce+=dt;
      if(p.produce>=PLANT_ARCHETYPES.sunflower.behavior.productionPeriod){p.produce=0;createPlantSun(p)}
    }
    if(p.type==='pea'){
      if(p.fireTransform>0)continue;
      const has=zombies.some(z=>z.row===p.row&&z.x>p.col+.35&&z.hp>0);
      const shootCd=p.fireMode?PLANT_ARCHETYPES.pea.behavior.fireShootInterval:PLANT_ARCHETYPES.pea.behavior.shootInterval;
      p.shoot+=dt;
      p.charge=has?Math.min(1,p.shoot/shootCd):0;
      if(has&&p.shoot>=shootCd){p.shoot=0;firePea(p)}
      if(!has){p.charge=0; if(p.shoot>0.7)p.shoot=0.7;}
    }
    if(p.type==='fan'){
      const start=p.col+.55,end=start+PLANT_ARCHETYPES.fan.behavior.range;let fanHas=false;
      for(const z of zombies){if(z.hp>0&&z.row===p.row&&z.x>=start&&z.x<=end){z.fanSlow=true;fanHas=true;}}
      if(fanHas){p.sfxFan=(p.sfxFan||0)-dt;if(p.sfxFan<=0){playSfx('fan',.75,'fan',180,p.col+.8);p.sfxFan=.92;}}
    }
    if(p.type==='lighter'){
      p.throwAge=(p.throwAge||0)+dt;
      if(!p.ignited&&p.throwAge>=PLANT_ARCHETYPES.lighter.behavior.ignitionDelay){igniteFireTile(p.row,p.col);p.ignited=true;}
      if(p.throwAge>=PLANT_ARCHETYPES.lighter.behavior.lifetime)p.hp=0;
      continue;
    }
    if(p.type==='potato'){
      if(!p.armed){p.arm+=dt;if(p.arm>=PLANT_ARCHETYPES.potato.behavior.armTime){p.armed=true;p.anim=.55;playSfx('armed',.8,'armed',100,p.col+.5)}}
      if(p.armed&&!p.detonated){
        const target=zombies.find(z=>z.row===p.row&&z.hp>0&&Math.abs(z.x-(p.col+.5))<PLANT_ARCHETYPES.potato.behavior.triggerRadius);
        if(target){
          p.detonated=true;playSfx('explosion',1.25,'explosion',180,p.col+.5);blastFx.push({id:nextId++,x:p.col+.5,y:p.row+.5,age:0,life:1.9});
          for(const z of zombies.filter(z=>z.row===p.row&&Math.abs(z.x-(p.col+.5))<PLANT_ARCHETYPES.potato.behavior.blastRadius&&z.hp>0)) damageZombie(z,PLANT_ARCHETYPES.potato.behavior.damage,'potato');
          p.hp=0;
        }
      }
    }
  }

  // Continuous cold wind: fans only slow enemies; they deal no damage.
  // Overlapping fans do not stack the slowdown.

  // Stolen bucket flies to the magnet's head, then stays attached there until the player drags it.
  for(const b of looseBuckets){
    if(!b.magnetId||looseBucketDrag?.id===b.id)continue;
    const m=plants.find(p=>p.id===b.magnetId&&p.hp>0);
    if(!m){b.magnetId=null;b.state='free';continue;}
    const tx=m.col+.5,ty=m.row+.08;
    if(b.state==='pulling'){
      b.pullAge=(b.pullAge||0)+dt;
      const u=Math.min(1,b.pullAge/(b.pullDur||.48)),e=1-Math.pow(1-u,3);
      b.x=b.fromX+(tx-b.fromX)*e;b.y=b.fromY+(ty-b.fromY)*e;
      if(u>=1)b.state='held';
    }else if(b.state==='held'){
      b.x=tx;b.y=ty;
    }
  }

  const autoSunIds=[];
  for(const s of suns){
    s.age+=dt;
    if(s.kind==='sky'){
      const fallT=Math.min(1,s.age/1.8);s.y=s.startY+(s.targetY-s.startY)*fallT;
    }else{
      const popT=Math.min(1,s.age/.55);s.y=s.startY+(s.targetY-s.startY)*Math.sin(popT*Math.PI/2);
    }
    // Collect on the exact frame the sun reaches its landing/target position: no ground pause.
    const landedAt=s.kind==='sky'?1.8:.55;
    if(s.age>=landedAt)autoSunIds.push(s.id);
    else if(s.age>=s.life)s.done=true;
  }
  for(const id of autoSunIds)collectSun(id,null);
  suns=suns.filter(s=>!s.done);

  // Brain matter persists for 30 seconds unless consumed.
  // Basic walkers eat for 2 s and mutate; an existing giant crouches for 10 s and heals 100 HP.
  for(const b of brainDrops){
    if(b.done)continue;
    if(!b.landed){
      b.landingAge=(b.landingAge||0)+dt;
      if(b.landingAge>=(b.landingDelay||1.16)){
        b.landed=true;b.groundAge=0;b.landGrace=.55;
        playSfx('fleshHit',.7,'brainDrop',100,b.x);
      }else continue;
    }
    b.landGrace=Math.max(0,(b.landGrace||0)-dt);
    let eater=b.eaterId?zombies.find(z=>z.id===b.eaterId&&z.hp>0):null;
    if(b.eaterId&&!eater){
      // The claimant died or vanished: the brain remains on the lawn instead of being orphaned.
      b.eaterId=null;b.landGrace=.25;
    }
    // "30 seconds on the ground" means unattended ground time only; eating time does not burn its lifetime.
    if(!b.eaterId)b.groundAge=(b.groundAge||0)+dt;
    if(!eater&&(b.landGrace||0)<=0){
      eater=zombies.filter(z=>(z.type==='normal'||z.type==='cone'||z.type==='bucket'||z.type==='giant')&&z.hp>0&&z.row===b.row&&z.x>=b.x-.18&&z.x-b.x<1.35&&!z.brainDropId&&!(z.giantTransform>0))
        .sort((a,c)=>Math.abs(a.x-b.x)-Math.abs(c.x-b.x))[0];
      if(eater){
        b.eaterId=eater.id;eater.brainDropId=b.id;eater.brainEat=0;
        eater.eating=false;eater.eatTargetId=null;eater.eatMode=null;eater.lungeTime=0;
        eater.smashPending=false;eater.smashTime=0;
      }
    }
    if(eater){
      const dist=eater.x-b.x;
      if(dist>.20){
        eater.x=Math.max(b.x+.18,eater.x-eater.speed*dt);
        eater.brainEat=0;continue;
      }
      eater.brainEat=(eater.brainEat||0)+dt;
      const eatNeed=eater.type==='giant'?10:2;
      if(eater.brainEat>=eatNeed){
        if(eater.type==='giant'){
          eater.hp=Math.min(eater.maxHp||ZOMBIE_ARCHETYPES.giant.hp,eater.hp+100);
          eater.brainEat=0;eater.brainDropId=null;b.done=true;
          playSfx('fleshHit',1,'giantBrainHeal',120,eater.x);say('中型巨人吞下脑浆，恢复了 100 点生命！');
        }else{
          const oldType=eater.type,armor=oldType==='bucket'?'bucket':(oldType==='cone'?'cone':null),armorHp=eater.coneHp||0;
          eater.giantFromType=oldType;eater.giantArmor=armor;eater.giantArmorCarryHp=armorHp;
          eater.giantTransform=3;eater.giantTransformTotal=3;
          eater.brainEat=0;eater.brainDropId=null;eater.eating=false;eater.eatTargetId=null;eater.eatMode=null;
          eater.hitStun=0;eater.hurt=0;eater.lungeTime=0;eater.attack=0;
          b.done=true;playSfx('zombieSpawn',.85,'mutateStart',180,eater.x);say('脑浆侵入身体——僵尸开始发生巨人变异！');
        }
      }
    }
  }
  brainDrops=brainDrops.filter(b=>!b.done&&(!b.landed||(b.groundAge||0)<(b.groundLife||30)));

  for(const fx of crossFireFx)fx.age+=dt;
  crossFireFx=crossFireFx.filter(fx=>fx.age<fx.life);

  for(const tile of fireTiles){
    tile.age+=dt;
    for(const z of zombies){
      if(z.hp>0&&z.digState!=='underground'&&z.row===tile.row&&Math.abs(z.x-(tile.col+.5))<.45)damageZombie(z,30*dt,'fire',true);
    }
  }
  fireTiles=fireTiles.filter(tile=>tile.age<tile.life);

  for(const z of zombies){
    if((z.burnTime||0)>0&&z.hp>0){
      const tick=Math.min(dt,z.burnTime);
      z.burnTime=Math.max(0,z.burnTime-dt);
      damageZombie(z,(z.burnDps||10)*tick,z.burnSource||'fire');
      if(z.burnTime<=0)z.burnDps=0;
    }
  }

  for(const z of zombies){
    if((z.giantTransform||0)>0){
      z.giantTransform=Math.max(0,z.giantTransform-dt);
      z.eating=false;z.eatTargetId=null;z.eatMode=null;z.attack=0;z.hitStun=0;z.hurt=0;z.lungeTime=0;
      if(z.giantTransform<=0){
        z.type='giant';z.maxHp=ZOMBIE_ARCHETYPES.giant.hp;z.hp=z.maxHp;z.speed=ZOMBIE_ARCHETYPES.giant.speed;
        z.coneMax=z.giantArmor==='bucket'?200:(z.giantArmor==='cone'?50:0);
        z.coneHp=z.giantArmor?Math.max(1,z.giantArmorCarryHp||0):0;
        z.gaitCadence=ZOMBIE_ARCHETYPES.giant.transformedGaitCadence;z.smashCooldown=0;z.giantFromType=null;z.giantArmorCarryHp=0;
        playSfx('explosion',1.15,'mutateImpact',180,z.x);
        playSfx('zombieSpawn',1.2,'mutateFinish',180,z.x);say('变异完成——中型巨人站起来了！');
      }
    }
  }
  for(const z of zombies){if(z.type==='longhair'){z.hairCooldown=Math.max(0,(z.hairCooldown||0)-dt);z.hairAttack=Math.max(0,(z.hairAttack||0)-dt);}}
  for(const pea of peas){
    pea.age+=dt;if(pea.reflectAge>0)pea.reflectAge=Math.max(0,pea.reflectAge-dt);
    if(pea.reflectPending){
      const rz=zombies.find(z=>z.id===pea.reflectPending&&z.hp>0);
      if(!rz){pea.reflectPending=0;pea.speed=Math.abs(pea.speed)||4.25;}
      else{
        const ph=1-Math.max(0,rz.hairAttack||0)/1.34;
        // Hold the incoming pea in the last few pixels of travel so the eye can read the hair actually meeting it.
        pea.x=rz.x-.31+Math.sin(Math.min(1,ph/.50)*Math.PI*.5)*.10;pea.y=rz.row+.43;
        if(ph>=.53){
          pea.reflectPending=0;pea.reflected=true;pea.reflectAge=.34;pea.speed=-4.55;playSfx('whip',1,'whip',120,rz.x);pea.startX=pea.x;pea.age=0;
          peaImpactFx.push({id:nextId++,x:rz.x-.18,y:rz.row+.42,age:0,life:.28});
        }
      }
    }else pea.x+=pea.speed*dt;
  }
  for(const pea of peas){
    if(pea.reflectPending)continue;
    if(pea.reflected){
      const plant=plants.filter(p=>p.row===pea.row&&p.hp>0&&Math.abs((p.col+.5)-pea.x)<.25).sort((a,b)=>b.col-a.col)[0];
      if(plant){damagePlant(plant,pea.damage||10);playSfx('plantHurt',.9,'plantHurt',55,plant.col+.5);pea.hit=true;peaImpactFx.push({id:nextId++,x:plant.col+.58,y:plant.row+.42,age:0,life:.34,fire:!!pea.fire});}
      continue;
    }
    const reflector=zombies.filter(z=>z.type==='longhair'&&z.row===pea.row&&z.hp>0&&!z.mountedToId&&(z.hairCooldown||0)<=0&&pea.x<=z.x&&z.x-pea.x<.58).sort((a,b)=>a.x-b.x)[0];
    if(reflector){
      // Start the body/hair action first. The projectile reverses only when the hair tip reaches it.
      pea.reflectPending=reflector.id;pea.speed=0;pea.y=reflector.row+.43;
      reflector.hairCooldown=ZOMBIE_ARCHETYPES.longhair.reflectCooldown;reflector.hairAttack=1.34;
      continue;
    }
    const target=zombies.filter(z=>z.hp>0&&!z.bossSlide&&z.digState!=='underground'&&!z.mountedToId&&(z.type==='workboss'?['intermission','finalStand'].includes(level10Boss?.phase):z.row===pea.row)&&Math.abs(z.x-pea.x)<.24).sort((a,b)=>a.x-b.x)[0];
    if(target){
      damageZombie(target,pea.damage||10,pea.fire?'firePea':'pea',!!pea.fire);
      if(pea.fire)applyBurn(target,pea.burnTotal||20,pea.burnDuration||2,'firePeaBurn');
      pea.hit=true;peaImpactFx.push({id:nextId++,x:target.x-.05,y:target.row+.42,age:0,life:.34,fire:!!pea.fire})
    }
  }
  peas=peas.filter(p=>!p.hit&&p.x<COLS+.55&&p.x>-.55);

  for(const z of zombies){
    const slowMul=z.fanSlow?PLANT_ARCHETYPES.fan.behavior.slowMultiplier:1;
    if(z.type==='workboss')continue;
    if(z.bossSlide&&updateCargoSlide(z,dt))continue;
    if(z.raidDrop){z.raidDrop.age+=dt;if(z.raidDrop.age<z.raidDrop.dur){z.walkTick=(z.walkTick+dt*2.2)%1;continue;}z.raidDrop=null;z.airY=0;}
    if(z.hurt>0)z.hurt=Math.max(0,z.hurt-dt*slowMul);
    if(z.hitStun>0)z.hitStun=Math.max(0,z.hitStun-dt);
    if((z.lungeCooldown||0)>0)z.lungeCooldown=Math.max(0,z.lungeCooldown-dt*slowMul);
    if(updateImpState(z,dt*slowMul)) continue;
    if(z.lungeTime>0&&z.hitStun<=0){
      z.lungeTime=Math.max(0,z.lungeTime-dt*slowMul);
      if(Number.isFinite(z.lungeStartX)&&Number.isFinite(z.lungeEndX)){
        const dur=z.lungeDuration||1.50, u=Math.max(0,Math.min(1,1-z.lungeTime/dur));
        // Hold position through the warning/crouch, travel only during the forward dive,
        // then stay at the destination while the zombie absorbs impact and pushes upright.
        const travelU=u<.40?0:(u<.80?(u-.40)/.40:1);
        const ease=travelU<.5?2*travelU*travelU:1-Math.pow(-2*travelU+2,2)/2;
        z.x=z.lungeStartX+(z.lungeEndX-z.lungeStartX)*ease;
        if(z.lungeTime<=0){z.x=z.lungeEndX;z.lungeStartX=null;z.lungeEndX=null;z.lungeCooldown=15;}
      }
    }
    if(!Number.isFinite(z.gaitPhase)) z.gaitPhase=Math.random();
    const gaitCadence=z.gaitCadence||.72;
    if(!z.eating && z.hitStun<=0) z.gaitPhase=(z.gaitPhase+dt*slowMul*gaitCadence*(z.lungeTime>0?1.35:1))%1;
    z.walkTick=z.gaitPhase;
    if(!z.eating&&z.hitStun<=0&&z.lungeTime<=0&&!z.raidDrop){
      const stepIv=z.type==='imp'?.29:(z.type==='crawler'?.74:.56);
      if(z.sfxStepClock==null)z.sfxStepClock=Math.random()*stepIv;
      z.sfxStepClock+=dt*slowMul;
      if(z.sfxStepClock>=stepIv){z.sfxStepClock-=stepIv;playSfx(z.type==='crawler'?'crawl':'footstep',z.type==='imp'?.55:.72,'steps',45,z.x);}
    }
    if((z.giantTransform||0)>0){
      z.eating=false;z.eatMode=null;z.attack=0;
      continue;
    }
    if(z.brainDropId&&z.type!=='giant'){
      // Brain-drop movement/eating is resolved in the dedicated brain loop above.
      z.eating=false;z.eatMode=null;z.attack=0;
      continue;
    }
    if(z.type==='miner'){
      // Start digging only after visibly walking onto the lawn.
      if(z.digState==='walk'&&z.x<=COLS-2&&!z.eating&&z.hitStun<=0){
        // After crossing exactly the two rightmost lawn cells, stop at their left boundary.
        z.x=COLS-2;z.digState='digging';z.digAge=0;z.digStartX=z.x;z.digEndX=2.5;
        z.eatTargetId=null;z.eatMode=null;z.eating=false;playSfx('crawl',.85,'minerDig',140,z.x);
      }
      if(z.digState==='digging'){
        z.digAge+=dt*slowMul;
        // Articulated 1.18 s dive: fold, reach, launch, then enter the soil head and hands first.
        if(z.digAge>=1.18){z.digState='underground';z.digAge=0;}
        continue;
      }
      if(z.digState==='underground'){
        // Armed potato mines can detect the moving mound and detonate through the soil.
        const mine=plants.find(p=>p.type==='potato'&&p.armed&&!p.detonated&&p.row===z.row&&Math.abs((p.col+.5)-z.x)<.60);
        if(mine){
          mine.detonated=true;mine.hp=0;playSfx('explosion',1.25,'minerMine',180,mine.col+.5);
          blastFx.push({id:nextId++,x:mine.col+.5,y:mine.row+.5,age:0,life:1.9});damageZombie(z,PLANT_ARCHETYPES.potato.behavior.damage,'potato');
          continue;
        }
        z.x-=(.21*2)*slowMul*dt;
        if(z.x<=z.digEndX){
          // A live fire pit blocks that emergence cell; shift the exit one cell away where possible.
          let exitX=z.digEndX,ec=Math.max(0,Math.min(COLS-1,Math.floor(exitX)));
          if(fireTileAt(z.row,ec)){const left=ec-1,right=ec+1;if(left>=0&&!fireTileAt(z.row,left))exitX=left+.5;else if(right<COLS&&!fireTileAt(z.row,right))exitX=right+.5;}
          z.x=exitX;z.digState='rising';z.digAge=0;playSfx('fleshHit',.75,'minerRise',120,z.x);
          const victim=plants.filter(p=>p.type!=='crossfan'&&p.type!=='lighter'&&p.hp>0&&p.row===z.row&&Math.abs((p.col+.5)-z.x)<.82)
            .sort((a,b)=>Math.abs((a.col+.5)-z.x)-Math.abs((b.col+.5)-z.x))[0];
          if(victim){victim.bumpTime=.60;victim.bumpTotal=.60;playSfx('plantHurt',.65,'minerBump',80,victim.col+.5);}
        }
        continue;
      }
      if(z.digState==='rising'){
        z.digAge+=dt*slowMul;if(z.digAge<.82)continue;
        z.digState='done';z.digAge=0;
      }
    }
    let target=z.eatTargetId?plants.find(p=>p.id===z.eatTargetId&&p.hp>0&&p.type!=='lighter'):null;
    if(!target){
      z.eatTargetId=null;z.eatMode=null;
      const same=plants.filter(p=>p.type!=='crossfan'&&p.row===z.row&&p.hp>0&&p.type!=='lighter'&&!(p.type==='potato'&&p.armed&&!p.detonated));
      const vertical=same.filter(p=>Math.abs(z.x-(p.col+.5))<.28).sort((a,b)=>Math.abs(z.x-(a.col+.5))-Math.abs(z.x-(b.col+.5)))[0];
      const front=same.filter(p=>{const d=z.x-(p.col+.5);return d>=.27&&d<.72}).sort((a,b)=>b.col-a.col)[0];
      target=vertical||front;
      if(target){z.eatTargetId=target.id;z.eatMode=vertical?'vertical':'front';}
      else {
        const leap=same.filter(p=>{const d=z.x-(p.col+.5);return d>=0.72&&d<1.55;}).sort((a,b)=>b.col-a.col)[0];
        if(leap&&z.lungeTime<=0&&(z.lungeCooldown||0)<=0&&['normal','cone','bucket'].includes(z.type)){
          z.lungeDuration=1.50; z.lungeTime=1.50; z.lungePhase=1.50;
          z.lungeStartX=z.x; z.lungeEndX=(leap.col+.5)+.50;playSfx('lunge',1,'lunge',100,z.x);
        }
      }
    }
    if(target){
      if(target.type==='wall'&&target.fireMode&&z.hp>0)damageZombie(z,PLANT_ARCHETYPES.wall.behavior.lavaContactDps*dt,'lavaWall',true);
      if(z.hitStun>0){
        // A hit fully interrupts locomotion and bite damage for the stagger window.
        z.eating=false;
      }else if(z.type==='giant'){
        z.eating=true;z.smashCooldown=(z.smashCooldown||0)+dt*slowMul;
        z.smashTime=Math.max(0,(z.smashTime||0)-dt);
        // Giant attacks once every 4 seconds: twice the previous 2-second interval.
        if(z.smashCooldown>=ZOMBIE_ARCHETYPES.giant.attackInterval){
          z.smashCooldown=0;z.smashTime=.92;z.smashPending=true;playSfx('explosion',.72,'giantSmash',120,z.x);
          // Damage lands later, at the visible hand impact frame.
        }
        if(z.smashPending&&z.smashTime<=.38){
          z.smashPending=false;
          if(target&&target.hp>0&&!(target.squashDeath>0)){
            target.squashDeath=.78;target.squashDeathTotal=.78;target.squashByGiant=true;target.skipDeath=true;
            // Keep HP positive until the flatten animation finishes so the plant cannot vanish on impact.
            blastFx.push({id:nextId++,x:target.col+.5,y:target.row+.62,age:0,life:.72});
            playSfx('explosion',1,'giantImpact',120,z.x);
          }

        }
      }else if(z.type==='miner'){
        // Preserve the old 33 DPS, but deliver each 0.7 s cycle as one visible
        // two-handed pickaxe impact instead of an unrelated bite tick.
        z.eating=true;
        const strikeCycle=.7,oldAttack=z.attack||0;
        z.attack=oldAttack+dt*slowMul;
        if(Math.floor(z.attack/strikeCycle)!==Math.floor(oldAttack/strikeCycle))z.minerStrikeLanded=false;
        const minerStrikePhase=(z.attack%strikeCycle)/strikeCycle;
        if(minerStrikePhase>=.52&&!z.minerStrikeLanded){
          z.minerStrikeLanded=true;
          damagePlant(target,33*strikeCycle);
          bloodFx.push({id:nextId++,x:target.col+.52,y:target.row+.48,age:0,life:.35,mode:z.eatMode});
          playSfx('fleshHit',1,'minerPick',85,z.x);
        }
      }else{
        // One 0.7 s articulated bite cycle. Preserve 33 DPS, but apply it exactly at the visible clamp frame.
        z.eating=true;
        const biteCycle=.7,oldAttack=z.attack||0;
        z.attack=oldAttack+dt*slowMul;
        if(Math.floor(z.attack/biteCycle)!==Math.floor(oldAttack/biteCycle))z.biteLanded=false;
        const biteDamagePhase=(z.attack%biteCycle)/biteCycle;
        if(biteDamagePhase>=.46&&!z.biteLanded){
          z.biteLanded=true;
          damagePlant(target,33*biteCycle);
          bloodFx.push({id:nextId++,x:target.col+.52,y:target.row+.48,age:0,life:.35,mode:z.eatMode});
          playSfx('bite',.9,'bite',85,z.x);
        }
      }
    }else{
      z.eating=false;z.eatMode=null;z.attack=0;z.biteLanded=false;z.minerStrikeLanded=false;
      if(z.hitStun<=0&&z.lungeTime<=0){
        if(z.type==='crawler'){
          z.crawlPhase=(z.crawlPhase+dt*slowMul*.18)%1;
          const t=((z.crawlPhase*2)%1+1)%1;
          const pull=(t>.66&&t<.90)?Math.sin((t-.66)/.24*Math.PI):0;
          const oldX=z.x;
          z.x-=z.speed*slowMul*dt*(.08+3.05*pull);
          z.entrailTravel=(z.entrailTravel||0)+Math.max(0,oldX-z.x);
          // Birth phase: the intestine falls directly out of the belly and piles into loose coils.
          // It grows with distance travelled until roughly three cells are lying on the lawn.
          if(z.entrailSpawnX==null)z.entrailSpawnX=oldX;
          if(!z.entrailDetached){
            const laid=Math.min(3,z.entrailTravel||0);
            z.entrailAnchorX=z.x+Math.max(.18,laid);
            // Once the crawler has moved beyond the first three cells, the belly connection tears loose.
            if((z.entrailTravel||0)>=3){
              z.entrailDetached=true;
              z.entrailAnchorX=z.x+3;
              playSfx('fleshHit',.55,'entrailDetach',100,z.x);
            }
          }else{
            // Detached phase: the old coils are pulled forward and progressively straighten.
            // Maximum physical stretch is five lawn cells.
            const stretched=Math.min(5,3+((z.entrailTravel||0)-3));
            z.entrailAnchorX=z.x+stretched;
          }
        }else if(z.type==='imp'){
          const phase=z.gaitPhase||0; const skitter=.55+.45*(1-Math.cos(phase*Math.PI*4))/2; z.x-=z.speed*slowMul*dt*(.72+skitter*.55);
        }else{
          const phase=z.gaitPhase||0;
          const plantedPulse=z.type==='brain'?(.48+.52*(1-Math.cos(phase*Math.PI*2))/2):(.72+.28*(1-Math.cos(phase*Math.PI*4))/2);
          const onEntrail=zombies.some(c=>c.type==='crawler'&&c.hp>0&&c.row===z.row&&c.entrailAnchorX!=null&&z.x>=c.x+.12&&z.x<=c.entrailAnchorX+.08);
          const trailBoost=onEntrail?1.30:1;
          z.x-=z.speed*trailBoost*slowMul*dt*plantedPulse/.86;
        }
      }
    }
    if(z.x<.18){const saw=chainsaws.find(s=>s.row===z.row&&!s.used);if(saw){triggerChainsaw(z.row);continue;}if(z.x<-.16){finish(false);return}}
  }

  // Chainsaw contact damage: each zombie stays alive until the moving blade
  // actually overlaps it. This makes the row clear progressively from left to right.
  for(const fx of chainsawFx){
    if(fx.age>=fx.life)continue;
    for(const z of zombies){
      if(z.hp<=0||z.row!==fx.row||z.type==='workboss')continue;
      if(Math.abs(z.x-fx.x)<=.42){
        z.hp=0;
        z.hitStun=.08;
      }
    }
  }

  const dead=zombies.filter(z=>z.hp<=0);
  if(dead.length){
    for(const z of dead){
      if(z.carriesImpId){
        const imp=zombies.find(o=>o.id===z.carriesImpId&&o.type==='imp');
        if(imp){imp.mountedToId=null;imp.x=z.x+.06;imp.airY=-.10;}
      }
      addDeathFx(z);
    }
    kills+=dead.length;zombies=zombies.filter(z=>z.hp>0);updateHUD()
  }
  const deadPlants=plants.filter(p=>p.type!=='crossfan'&&p.hp<=0);if(deadPlants.length){for(const p of deadPlants){if(p.type==='wall'&&p.fireMode)igniteFireTile(p.row,p.col,10);if(!p.skipDeath)addPlantDeathFx(p);}}
  plants=plants.filter(p=>p.type==='crossfan'?!p.crossExpired:p.hp>0);

  for(const fx of deathFx){
    fx.age+=dt;
    if((fx.type==='zombie'||fx.type==='ashZombie')&&!fx.bloodBurst&&fx.age>=.90){
      fx.bloodBurst=true;
      // Spray into the corpse lane and both adjacent lanes. The lane offset is
      // intentional: blood should read as a three-row burst, not a single stripe.
      const sprays=[[-1.65,-1.72,.046,-1],[-1.30,-2.05,.034,0],[-1.02,-1.38,.058,1],[-.72,-2.32,.028,-1],[-.42,-1.62,.041,0],[.35,-2.20,.052,1],[.72,-1.58,.064,0],[1.08,-2.02,.037,-1],[1.42,-1.42,.049,1],[1.72,-1.78,.031,0],[-1.86,-.95,.036,1],[1.92,-1.02,.040,-1],[.10,-2.55,.030,0],[-.18,-1.08,.070,1]];
      sprays.forEach((q,i)=>{const lane=Math.max(0,Math.min(ROWS-1,fx.row+q[3]));deathBloodDrops.push({id:nextId++,x:fx.x,y:lane+.48,vx:q[0],vy:q[1],size:q[2]*(.84+((i*17)%7)/20),age:0,life:1.65,rot:(i*.73)%6.28,spawnRow:lane});});
    }
    if((fx.type==='zombie'||fx.type==='ashZombie')&&!fx.bloodLanded&&fx.age>=1.16){fx.bloodLanded=true;}
  }
  deathFx=deathFx.filter(fx=>fx.age<fx.life);
  for(const d of deathBloodDrops){
    d.age+=dt; d.vy+=3.55*dt; d.x+=d.vx*dt; d.y+=d.vy*dt;
    const ground=d.rowGround??(Math.floor(d.y)+.88);
    // Use the corpse lane as the landing plane, not the current falling y.
    const laneGround=(d.spawnRow??Math.max(0,Math.round(d.y-.48)))+.88;
    if(d.y>=laneGround&&!d.landed){d.landed=true;groundBloodFx.push({id:nextId++,x:d.x,y:laneGround,age:0,life:6.2,size:d.size*(.82+((d.id*13)%9)/30),rot:d.rot});}
  }
  deathBloodDrops=deathBloodDrops.filter(d=>!d.landed&&d.age<d.life);
  for(const fx of groundBloodFx)fx.age+=dt;
  groundBloodFx=groundBloodFx.filter(fx=>fx.age<fx.life);
  for(const fx of coneFx)fx.age+=dt;
  coneFx=coneFx.filter(fx=>fx.age<fx.life);
  for(const fx of blastFx)fx.age+=dt;
  blastFx=blastFx.filter(fx=>fx.age<fx.life);
  for(const fx of peaImpactFx)fx.age+=dt;
  peaImpactFx=peaImpactFx.filter(fx=>fx.age<fx.life);
  for(const fx of bloodFx)fx.age+=dt;
  bloodFx=bloodFx.filter(fx=>fx.age<fx.life);
  for(const fx of armFx)fx.age+=dt;
  for(const fx of magnetFx)fx.age+=dt;magnetFx=magnetFx.filter(f=>f.age<f.life);
  armFx=armFx.filter(fx=>fx.age<fx.life);
  for(const fx of hpBreakFx)fx.age+=dt;
  hpBreakFx=hpBreakFx.filter(fx=>fx.age<fx.life);
  for(const fx of armorHpBreakFx)fx.age+=dt;
  armorHpBreakFx=armorHpBreakFx.filter(fx=>fx.age<fx.life);
  for(const fx of armorBreakFx)fx.age+=dt;
  armorBreakFx=armorBreakFx.filter(fx=>fx.age<fx.life);
  for(const fx of chainsawFx){fx.age+=dt;fx.x=-.08+(COLS+1.0)*Math.min(1,fx.age/fx.life);}
  chainsawFx=chainsawFx.filter(fx=>fx.age<fx.life);
  if(MOBILE_PERF){
    if(bloodFx.length>6)bloodFx.splice(0,bloodFx.length-6);
    if(peaImpactFx.length>8)peaImpactFx.splice(0,peaImpactFx.length-8);
    // Gameplay drops (brainDrops) MUST NOT be stored in/pruned with deathFx.
    if(deathFx.length>8)deathFx.splice(0,deathFx.length-8);
    if(groundBloodFx.length>28)groundBloodFx.splice(0,groundBloodFx.length-28);
    if(armFx.length>5)armFx.splice(0,armFx.length-5);
    if(hpBreakFx.length>10)hpBreakFx.splice(0,hpBreakFx.length-10);if(armorHpBreakFx.length>10)armorHpBreakFx.splice(0,armorHpBreakFx.length-10);if(armorBreakFx.length>8)armorBreakFx.splice(0,armorBreakFx.length-8);
  }

  if(((currentLevel===7&&level7Finished())||(currentLevel!==7&&spawned>=LEVELS[currentLevel].total&&!finalRaidBusy()&&zombies.length===0))&&deathFx.length===0&&!levelCompletePending){levelCompletePending=true;finish(true);}
}

const spriteCanvasCache=new Map();
const reusableSpriteCanvases={small:[],large:[]};
function takeSpriteCanvas(size){
  const pool=size===96?reusableSpriteCanvases.large:reusableSpriteCanvases.small;
  const c=pool.pop()||document.createElement('canvas');
  c.removeAttribute('style');
  return c;
}
function resetSpriteCanvas(c,scale){
  const x=c.getContext('2d',{alpha:true});
  if(typeof x.reset==='function')x.reset();
  else c.width=c.width;
  x.setTransform(scale,0,0,scale,0,0);
  x.imageSmoothingEnabled=false;
  return x;
}
function makeCanvas(draw){
  const scale=MOBILE_RENDER_SCALE;
  const c=takeSpriteCanvas(64);if(c.width!==64*scale)c.width=64*scale;if(c.height!==64*scale)c.height=64*scale;c.className='sprite';
  const x=resetSpriteCanvas(c,scale);draw(x);return c;
}
function makeLargeZombieCanvas(draw){
  // 96x96 logical drawing surface gives giant hands/overhead smash a 16px safety gutter on every side.
  const scale=MOBILE_RENDER_SCALE,c=takeSpriteCanvas(96);
  if(c.width!==96*scale)c.width=96*scale;if(c.height!==96*scale)c.height=96*scale;c.className='sprite giantSprite';
  const x=resetSpriteCanvas(c,scale);
  x.translate(16,16);draw(x);return c;
}

function cachedCanvas(key,draw){
  let master=spriteCanvasCache.get(key);
  if(!master){
    master=makeCanvas(draw);
    spriteCanvasCache.set(key,master);
    // Bound the cache so long sessions cannot grow forever.
    if(spriteCanvasCache.size>96){const first=spriteCanvasCache.keys().next().value;spriteCanvasCache.delete(first);}
  }
  const c=takeSpriteCanvas(64);if(c.width!==master.width)c.width=master.width;if(c.height!==master.height)c.height=master.height;c.className='sprite';
  const x=resetSpriteCanvas(c,1);x.drawImage(master,0,0);
  return c;
}
function R(x,c,a,b,w,h){x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),Math.round(w),Math.round(h))}
function outlineRects(x,rects,fill,edge='#152012'){
  for(const [a,b,w,h] of rects){R(x,edge,a-2,b-2,w+4,h+4);R(x,fill,a,b,w,h)}
}
function frame4(seed=0){return Math.floor((gameTime*6+seed)%4)}

function E(x,c,cx,cy,rx,ry){x.fillStyle=c;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);x.fill()}
function S(x,c,w=1){x.strokeStyle=c;x.lineWidth=w;x.lineJoin='round';x.lineCap='round'}
function PA(x,art,pal,ox=0,oy=0,ps=1){for(let yy=0;yy<art.length;yy++){const row=art[yy];for(let xx=0;xx<row.length;xx++){const ch=row[xx];if(ch!=='.'&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(Math.round(ox+xx*ps),Math.round(oy+yy*ps),Math.ceil(ps),Math.ceil(ps));}}}}

function fillPath(ctx,fill,pts){ ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); ctx.fill(); }
function strokePath(ctx,stroke,w,pts){ ctx.strokeStyle=stroke; ctx.lineWidth=w; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke(); }
function drawMagnet(x,f=0,p={},damaged=false){
  x.save();
  const bob=Math.sin(gameTime*3+(p.id||0))*.7;
  x.translate(0,bob);
  x.fillStyle='rgba(0,0,0,.22)';x.beginPath();x.ellipse(32,54,18,4,0,0,Math.PI*2);x.fill();
  // Compact industrial block body inspired by nickel block magnets, with a readable U-magnet face.
  x.fillStyle='#48575c';x.strokeStyle='#172126';x.lineWidth=3;x.fillRect(17,31,30,21);x.strokeRect(17,31,30,21);
  x.fillStyle='#91a0a5';x.fillRect(20,34,24,4);x.fillStyle='#263238';x.fillRect(20,45,24,4);
  x.lineWidth=7;x.lineCap='square';x.strokeStyle='#cf3d43';x.beginPath();x.moveTo(22,31);x.lineTo(22,19);x.quadraticCurveTo(32,10,42,19);x.stroke();
  x.strokeStyle='#315dba';x.beginPath();x.moveTo(42,19);x.lineTo(42,31);x.stroke();
  x.fillStyle='#f1f4e9';x.font='bold 7px monospace';x.fillText('N',18,29);x.fillText('S',40,29);
  x.strokeStyle='rgba(177,222,255,.55)';x.lineWidth=1.5;const q=(gameTime*2)%1;
  x.beginPath();x.arc(32,29,12+q*12,-.25,Math.PI+.25);x.stroke();
  if(damaged){x.strokeStyle='#101719';x.lineWidth=2;x.beginPath();x.moveTo(25,35);x.lineTo(31,41);x.lineTo(27,48);x.stroke();}
  x.restore();
}
function drawCrossFan(x,f=0,p={},damaged=false){
  x.save();
  const spin=gameTime*(p.crossActive>0?15:3.2),cx=32,cy=30;
  x.fillStyle='rgba(0,0,0,.22)';x.beginPath();x.ellipse(32,55,18,4,0,0,Math.PI*2);x.fill();
  x.fillStyle='#39484d';x.strokeStyle='#152126';x.lineWidth=2.5;x.beginPath();x.rect(20,24,24,27);x.fill();x.stroke();
  x.fillStyle='#84989d';x.fillRect(23,28,18,16);
  for(let k=0;k<4;k++){
    x.save();x.translate(cx,cy);x.rotate(spin+k*Math.PI/2);
    x.fillStyle=p.crossActive>0?'#d9f4ff':'#b8d0d5';x.strokeStyle='#32474d';x.lineWidth=1;
    x.beginPath();x.moveTo(3,-3);x.quadraticCurveTo(13,-7,16,-1);x.quadraticCurveTo(10,5,3,3);x.closePath();x.fill();x.stroke();x.restore();
  }
  x.fillStyle='#27363a';x.beginPath();x.arc(cx,cy,5,0,Math.PI*2);x.fill();
  x.strokeStyle=p.crossActive>0?'rgba(210,244,255,.9)':'rgba(180,220,230,.45)';x.lineWidth=1.4;
  x.beginPath();x.moveTo(8,30);x.lineTo(18,30);x.moveTo(46,30);x.lineTo(57,30);x.moveTo(32,7);x.lineTo(32,18);x.moveTo(32,43);x.lineTo(32,57);x.stroke();
  x.fillStyle='#f0c64b';x.fillRect(26,47,12,3);
  if(damaged){x.strokeStyle='#172126';x.lineWidth=2;x.beginPath();x.moveTo(24,34);x.lineTo(31,39);x.lineTo(27,46);x.stroke();}
  x.restore();
}
function drawPlantBody(x,type,f,p,damaged){
  if(type==='pea')drawPea(x,f,p,damaged);
  else if(type==='sunflower')drawSunflower(x,f,p,damaged);
  else if(type==='potato')drawPotato(x,f,p,damaged);
  else if(type==='fan')drawFan(x,f,p,damaged);
  else if(type==='lighter')drawLighter(x,f,p,damaged);
  else if(type==='magnet')drawMagnet(x,f,p,damaged);
  else if(type==='crossfan')drawCrossFan(x,f,p,damaged);
  else if(type==='wall'&&p.fireMode)drawLavaWall(x,f,p,damaged);
  else drawWall(x,f,p.anim>0?p.anim:0,damaged);
}
function drawPlantingBirth(x,type,age,p,f,damaged){
  // Two-beat planting only: seedling -> full plant.
  const total=.56,t=Math.max(0,Math.min(1,age/total));
  x.save();
  x.fillStyle='rgba(22,52,18,.34)';x.beginPath();x.ellipse(32,51,12+6*t,2.5+1.4*t,0,0,Math.PI*2);x.fill();
  if(t<.48){
    // Beat 1: one clear young seedling.
    const u=t/.48,bounce=Math.sin(u*Math.PI)*2.5;
    x.translate(0,-bounce);
    x.strokeStyle='#397d33';x.lineWidth=2.5;x.beginPath();x.moveTo(32,49);x.lineTo(32,37);x.stroke();
    x.fillStyle='#79d85a';x.strokeStyle='#285f2b';x.lineWidth=1.5;
    x.beginPath();x.ellipse(26.5,40,7.5,3.8,-.45,0,Math.PI*2);x.fill();x.stroke();
    x.beginPath();x.ellipse(37.5,39,7.5,3.8,.45,0,Math.PI*2);x.fill();x.stroke();
  }else{
    // Beat 2: the finished plant pops straight out, no seed/growth intermediates.
    const u=(t-.48)/.52;
    const pop=u<.55?(.72+.50*(u/.55)):(1.22-(u-.55)/.45*.22);
    x.translate(32,50);x.scale(pop,pop);x.translate(-32,-50);
    drawPlantBody(x,type,f,p,damaged);
  }
  x.restore();
}
function drawNormalPea(x,f=0,p={},damaged=false){
  const charge=Math.max(0,Math.min(1,p.charge||0));
  const fire=Math.max(0,Math.min(1,(p.fireAnim||0)/.54));
  const progress=1-fire;
  const recoilPulse=fire>0?Math.sin(progress*Math.PI):0;
  const headKick=recoilPulse*5.9;
  const bodyLean=recoilPulse*.085;
  const pre=charge*charge;
  const tt=gameTime+(p.id||1)*.73;
  const breathe=Math.sin(tt*2.0)*0.36;
  const idleSway=Math.sin(tt*.95)*.018;
  const muzzleNod=Math.sin(tt*1.32+.8)*.012;
  const blinkCycle=tt%7.4;
  const eyeBlink=(blinkCycle<.11|| (blinkCycle>.20&&blinkCycle<.29))?.18:1;
  const preTense=Math.max(0,(charge-.55)/.45);
  const preLean=preTense*.02;
  x.save();
  x.translate(0,breathe);

  // heavier shadow so the plant sits on the lawn instead of floating.
  x.fillStyle='rgba(17,41,18,.33)';
  x.beginPath();x.ellipse(31.5,50.6,11.2,2.8,0,0,Math.PI*2);x.fill();

  // root leaves: broader, more readable and less stick-like.
  x.save();x.translate(30,47.5);x.rotate(Math.sin(tt*1.12)*.03);x.translate(-30,-47.5);
  fillPath(x,'#2d7330',[[31,43.7],[19,45.6],[12,50.2],[26.8,49.5],[30.8,47.7]]);x.restore();
  x.save();x.translate(33,47.2);x.rotate(Math.sin(tt*1.08+.9)*.032);x.translate(-33,-47.2);
  fillPath(x,'#5eb953',[[31.2,44.0],[44.0,44.2],[52.5,49.2],[35.4,49.4],[31.0,47.7]]);x.restore();
  x.fillStyle='#8de071';x.beginPath();x.ellipse(25.7,45.9,4.3,1.35,-.38,0,Math.PI*2);x.fill();
  x.fillStyle='#1d4b24';x.beginPath();x.ellipse(31.4,50.2,10.5,2.15,0,0,Math.PI*2);x.fill();

  // Stem and body recoil together to avoid a disconnected head.
  x.save();
  x.translate(31.5,49);x.rotate(idleSway+preLean-bodyLean);x.translate(-31.5,-49);

  // main stem
  x.strokeStyle='#2a6c2f'; x.lineWidth=5.8; x.lineCap='round'; x.beginPath();
  x.moveTo(31.5,47.6);
  x.quadraticCurveTo(30.6-headKick*.09,37.4,35.1-headKick*.18,28.0);
  x.stroke();
  x.strokeStyle='#83d772'; x.lineWidth=1.4; x.beginPath();
  x.moveTo(30.2,46.8); x.quadraticCurveTo(30.2,39.4,33.8-headKick*.10,31.0); x.stroke();

  // side shoulder leaves so the stem no longer feels naked.
  x.save();x.translate(32.6,39.7);x.rotate(-.34-preTense*.09);x.translate(-32.6,-39.7);
  fillPath(x,'#53b44f',[[32.4,39.0],[23.8,38.0],[19.0,40.4],[27.7,43.0],[32.9,41.3]]);x.restore();
  x.save();x.translate(33.1,36.8);x.rotate(.28+preTense*.05);x.translate(-33.1,-36.8);
  fillPath(x,'#75ce63',[[33.0,36.4],[39.0,34.9],[45.8,36.8],[37.1,41.0],[32.8,39.5]]);x.restore();

  // whole cannon/body block gets the secondary recoil.
  x.save();
  x.translate(-headKick*.95,0);
  x.translate(40.5,25.4);x.rotate(muzzleNod*(1-recoilPulse*.65));x.translate(-40.5,-25.4);

  const mouthCharge=Math.max(0,(charge-.58)/.42);
  const spit=Math.max(0,1-Math.abs(progress-.16)/.16);
  const recover=Math.max(0,1-Math.abs(progress-.42)/.22);
  const muzzleScaleX=1 + mouthCharge*.17 + spit*.26 - recover*.07;
  const muzzleScaleY=1 + mouthCharge*.22 - spit*.13 + recover*.04;
  const muzzlePush=mouthCharge*.5 + spit*2.0;
  const headX=38.2-pre*.55;
  const headY=25.0-preTense*.2;
  const muzzleX=54.7-pre*.55 + muzzlePush*.72;
  const muzzleY=25.0;

  // Comic-card silhouette: leafy crest, heavy outer ink and a clean cel-shaded head.
  x.fillStyle='#173d20';x.beginPath();x.moveTo(headX-2.5,15.8);x.quadraticCurveTo(headX-1.5,8.2,headX+4.8,6.1);x.quadraticCurveTo(headX+3.7,12.5,headX+1.0,16.8);x.closePath();x.fill();
  x.fillStyle='#3f9b43';x.beginPath();x.moveTo(headX-1.5,15.7);x.quadraticCurveTo(headX-.3,9.8,headX+3.8,8.1);x.quadraticCurveTo(headX+2.7,13.1,headX+.3,17.0);x.closePath();x.fill();
  x.fillStyle='#173d20'; x.beginPath(); x.ellipse(headX,headY,12.7,11.35,-.02,0,Math.PI*2); x.fill();
  x.fillStyle='#4cb24b'; x.beginPath(); x.ellipse(headX,headY,11.8,10.5,-.02,0,Math.PI*2); x.fill();
  x.fillStyle='#7fe06d'; x.beginPath(); x.ellipse(headX-3.2,21.8,7.6,6.2,-.08,0,Math.PI*2); x.fill();
  x.fillStyle='#2f7032'; x.beginPath(); x.ellipse(headX-3.7,29.5,5.5,2.45,.10,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(245,255,240,.72)'; x.beginPath(); x.ellipse(headX-1.8,18.5,3.0,1.25,-.35,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(20,63,27,.20)';x.beginPath();x.ellipse(headX+3.8,28.1,5.0,2.5,.28,0,Math.PI*2);x.fill();

  // cheek and neck bridge into the cannon.
  fillPath(x,'#55b552',[[41.6-pre*.28,18.8],[48.2-pre*.55,18.8],[52.0-pre*.72,20.7],[52.2-pre*.78,23.2],[48.0-pre*.58,24.0],[41.4-pre*.25,23.5]]);
  fillPath(x,'#70cf61',[[41.8-pre*.22,23.0],[48.3-pre*.48,22.8],[52.2-pre*.62,24.3],[52.4-pre*.70,28.5],[49.1-pre*.63,30.4],[42.2-pre*.22,30.7],[38.7-pre*.10,27.4],[38.5,23.8]]);

  // thick cannon mouth with layered lips.
  x.fillStyle='#163d20'; x.beginPath(); x.ellipse(muzzleX,muzzleY,8.05*muzzleScaleX,10.05*muzzleScaleY,0,0,Math.PI*2); x.fill();
  x.fillStyle='#2f7334'; x.beginPath(); x.ellipse(muzzleX,muzzleY,7.15*muzzleScaleX,9.25*muzzleScaleY,0,0,Math.PI*2); x.fill();
  x.fillStyle='#58c356'; x.beginPath(); x.ellipse(muzzleX-.18,muzzleY,6.25*muzzleScaleX,8.0*muzzleScaleY,0,0,Math.PI*2); x.fill();
  x.fillStyle='#8dea7b'; x.beginPath(); x.ellipse(muzzleX-1.05,muzzleY-1.45,4.45*muzzleScaleX,5.55*muzzleScaleY,-.08,0,Math.PI*2); x.fill();
  x.fillStyle='#285d2d'; x.beginPath(); x.ellipse(muzzleX+.50,muzzleY+.18,4.0*muzzleScaleX,5.45*muzzleScaleY,0,0,Math.PI*2); x.fill();
  x.fillStyle='#0d2813'; x.beginPath(); x.ellipse(muzzleX+.95,muzzleY+.20,2.95*muzzleScaleX,4.05*muzzleScaleY,0,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(236,255,226,.92)'; x.beginPath(); x.ellipse(muzzleX-2.05,muzzleY-3.05,1.25,.78,-.32,0,Math.PI*2); x.fill();
  if(mouthCharge>.04){
    x.globalAlpha=.18+.22*mouthCharge;
    x.strokeStyle='#d0ffc1'; x.lineWidth=1.25+mouthCharge*.6;
    x.beginPath(); x.ellipse(muzzleX-.3,muzzleY,5.0*muzzleScaleX,6.6*muzzleScaleY,0,-2.2,-.58); x.stroke();
    x.globalAlpha=1;
  }

  // clearer face: bigger eye and sharper brow.
  x.fillStyle='#132e16'; x.beginPath(); x.ellipse(headX-4.6,22.25,2.45,2.95*eyeBlink,-.15,0,Math.PI*2); x.fill();
  x.fillStyle='#eef9ea'; x.beginPath(); x.ellipse(headX-5.2,21.3,.86,1.02*eyeBlink,-.15,0,Math.PI*2); x.fill();
  x.strokeStyle='#204d24'; x.lineWidth=2.2; x.beginPath();
  x.moveTo(headX-8.1,18.5); x.lineTo(headX-1.9,19.7); x.stroke();
  x.strokeStyle='#95ea83'; x.lineWidth=1.0; x.beginPath();
  x.moveTo(headX-.8,18.0); x.lineTo(headX+6.2,18.9); x.stroke();

  if(damaged){ strokePath(x,'#264f27',2,[[35.5,20],[40.5,24],[37.0,29.1]]); }
  x.restore();
  x.restore();
  x.restore();
}

function drawInfernoPea(x,f=0,p={},damaged=false){
  const tt=gameTime+(p.id||1)*.71,charge=Math.max(0,Math.min(1,p.charge||0)),fire=Math.max(0,Math.min(1,(p.fireAnim||0)/.54));
  const recoil=fire>0?Math.sin((1-fire)*Math.PI):0,pulse=.5+.5*Math.sin(tt*6.8),heat=.45+.55*Math.sin(tt*10.5+.7),kick=recoil*4.6;
  x.save();x.translate(0,Math.sin(tt*1.7)*.28);
  x.fillStyle='rgba(21,9,7,.42)';x.beginPath();x.ellipse(32,51.5,14.5,3.5,0,0,Math.PI*2);x.fill();
  x.globalAlpha=.18+.12*pulse;x.fillStyle='#ff4b19';x.beginPath();x.ellipse(32,49,11.5,3.4,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  fillPath(x,'#171516',[[31,43],[21,43],[11,49],[25,50],[32,47]]);fillPath(x,'#251718',[[33,43],[44,42],[54,48],[39,50],[31,47]]);
  x.strokeStyle='#ff4a1f';x.lineWidth=1.25;x.beginPath();x.moveTo(17,47);x.lineTo(25,46);x.lineTo(30,48);x.moveTo(47,46);x.lineTo(40,46);x.lineTo(35,49);x.stroke();
  x.strokeStyle='#ff6b22';x.lineWidth=5.8;x.lineCap='round';x.beginPath();x.moveTo(32,47);x.quadraticCurveTo(30,38,36-kick*.12,28);x.stroke();
  x.strokeStyle='#2a2020';x.lineWidth=3.6;x.beginPath();x.moveTo(31,47);x.lineTo(29,40);x.moveTo(34,43);x.lineTo(37-kick*.12,34);x.moveTo(35,31);x.lineTo(38-kick*.15,27);x.stroke();
  x.strokeStyle='#ffd05c';x.lineWidth=.9;x.beginPath();x.moveTo(32,44);x.lineTo(34,39);x.lineTo(32.5,36);x.moveTo(36,33);x.lineTo(37.5,29);x.stroke();
  x.save();x.translate(-kick,0);const hx=38,hy=24.5,mx=55,my=25;
  fillPath(x,'#151315',[[27,19],[29,9],[34,15],[38,5],[42,15],[48,9],[47,21]]);
  x.strokeStyle='#8d2619';x.lineWidth=1.3;x.beginPath();x.moveTo(30,16);x.lineTo(33,12);x.moveTo(38,13);x.lineTo(39,8);x.moveTo(44,16);x.lineTo(47,12);x.stroke();
  fillPath(x,'#100f11',[[27,20],[30,13],[37,11],[44,13],[49,19],[48,28],[43,34],[34,35],[27,30],[24,25]]);
  fillPath(x,'#2a1b1b',[[29,20],[32,15],[38,14],[45,17],[46,24],[42,31],[34,32],[28,28]]);
  x.fillStyle='rgba(255,76,24,'+(.32+.16*pulse)+')';x.beginPath();x.ellipse(37,24,8.5,7.2,0,0,Math.PI*2);x.fill();
  x.strokeStyle='#6e1d16';x.lineWidth=3;x.beginPath();x.moveTo(31,16);x.lineTo(35,20);x.lineTo(32,24);x.lineTo(36,29);x.moveTo(42,15);x.lineTo(40,20);x.lineTo(45,23);x.lineTo(42,29);x.stroke();
  x.strokeStyle='#ff6a21';x.lineWidth=1.45;x.beginPath();x.moveTo(31,16);x.lineTo(35,20);x.lineTo(32,24);x.lineTo(36,29);x.moveTo(42,15);x.lineTo(40,20);x.lineTo(45,23);x.lineTo(42,29);x.stroke();
  x.strokeStyle='rgba(255,224,107,'+(.5+.35*heat)+')';x.lineWidth=.65;x.beginPath();x.moveTo(35,20);x.lineTo(32,24);x.moveTo(40,20);x.lineTo(45,23);x.stroke();
  x.fillStyle='#09090a';x.beginPath();x.ellipse(31.5,22.3,3.6,3.9,-.18,0,Math.PI*2);x.fill();x.fillStyle='#ff5a20';x.beginPath();x.ellipse(31.4,22.1,2.4,2.6,-.18,0,Math.PI*2);x.fill();x.fillStyle='#fff0a2';x.beginPath();x.ellipse(30.8,21.3,.9,1.15,0,0,Math.PI*2);x.fill();
  fillPath(x,'#151315',[[43,18],[50,15],[59,17],[63,22],[63,29],[59,34],[50,34],[43,30]]);fillPath(x,'#322020',[[46,20],[51,18],[58,20],[61,23],[61,28],[57,32],[49,31],[45,28]]);
  x.fillStyle='#8b2619';x.beginPath();x.ellipse(mx,my,7.3+charge,8.4+charge*1.1,0,0,Math.PI*2);x.fill();x.fillStyle='#ff5a1e';x.beginPath();x.ellipse(mx+.3,my,5.5+charge*.9,6.6+charge*.9,0,0,Math.PI*2);x.fill();x.fillStyle='#ffd05c';x.beginPath();x.ellipse(mx+.7,my,3.4+charge*.7,4.4+charge*.7,0,0,Math.PI*2);x.fill();x.fillStyle='#211010';x.beginPath();x.ellipse(mx+1.2,my,2,2.8,0,0,Math.PI*2);x.fill();
  const flash=Math.max(charge*.55,recoil);if(flash>.04){x.globalAlpha=.45+.45*flash;fillPath(x,'#ff5420',[[61,21],[64,18],[63,23],[67,20],[65,26],[68,29],[63,29],[61,33]]);x.fillStyle='#ffd66b';x.beginPath();x.ellipse(62.5,25,2.2+2.3*flash,3.2+2*flash,0,0,Math.PI*2);x.fill();x.globalAlpha=.20+.18*flash;x.strokeStyle='#fff0b3';x.lineWidth=1.2;for(let i=0;i<3;i++){x.beginPath();x.arc(60+i*2,25,7+i*3,-.65,.65);x.stroke();}x.globalAlpha=1;}
  for(let i=0;i<5;i++){const q=(tt*.34+i*.21)%1;x.globalAlpha=(1-q)*(.35+.25*(i%2));x.fillStyle=i%2?'#ff5420':'#ffc44f';x.beginPath();x.arc(28+i*6+Math.sin(tt*2+i)*2,42-q*31,.8+(i%3)*.35,0,Math.PI*2);x.fill();}
  x.globalAlpha=1;if(damaged){x.strokeStyle='#080708';x.lineWidth=2.2;x.beginPath();x.moveTo(35,17);x.lineTo(38,22);x.lineTo(35,27);x.stroke();}x.restore();x.restore();
}
function drawPea(x,f=0,p={},damaged=false){if(p&&p.fireMode){drawInfernoPea(x,f,p,damaged);return;}drawNormalPea(x,f,p,damaged);}
function drawFireTransformFx(x,p){
  if(!(p.fireTransform>0))return;
  const total=p.fireTransformTotal||2.0, e=Math.max(0,Math.min(total,total-p.fireTransform));
  const contact=.72;
  x.save();
  // Stage 1: the brass lighter spins down in a tall arc and lands on the crown.
  if(e<.92){
    const u=Math.min(1,e/.78), ease=1-Math.pow(1-u,3);
    const lx=9+31*ease, ly=-20+34*ease-20*Math.sin(u*Math.PI);
    x.save();x.translate(lx,ly);x.rotate(e*15.5);x.scale(.54,.54);x.translate(-32,-32);drawLighter(x,0,{id:919,throwAge:.22},false);x.restore();
  }
  if(e>=contact){
    const q=Math.min(1,(e-contact)/1.25), pulse=.72+.28*Math.sin(e*18);
    if(q>.22){
      const reveal=Math.min(1,(q-.22)/.70);
      const edgeY=60-reveal*60;
      x.save();x.beginPath();x.rect(0,edgeY,64,64-edgeY);x.clip();
      x.globalAlpha=.55+.45*reveal;
      (p.type==='wall'?drawLavaWall:drawInfernoPea)(x,0,{...p,fireMode:true,fireMorph:1,fireAnim:0,charge:0},false);
      x.restore();
      x.save();x.globalAlpha=.82*(1-reveal*.45);x.strokeStyle='#ffe16b';x.lineWidth=2.4;
      x.beginPath();x.moveTo(8,edgeY);x.quadraticCurveTo(19,edgeY-4,31,edgeY+1);x.quadraticCurveTo(44,edgeY+5,58,edgeY-2);x.stroke();
      x.globalAlpha=.32*(1-reveal);x.fillStyle='#ff531f';x.fillRect(10,edgeY-2,46,5);x.restore();
    }
    // rising phoenix-like flame shell around the whole plant
    x.globalCompositeOperation='source-over';
    for(let i=0;i<9;i++){
      const a=i/8*Math.PI, sway=Math.sin(e*9+i*1.7)*2.2;
      const bx=14+i*4.6+sway, base=53-(i%2)*2;
      const h=(20+22*q)*(0.72+.28*Math.sin(i*2.1+e*5));
      x.globalAlpha=.18+.24*q;
      x.fillStyle=i%3===0?'#ff3b18':(i%2?'#ff7a22':'#ffc34a');
      x.beginPath();x.moveTo(bx-5,base);x.quadraticCurveTo(bx-8,base-h*.48,bx,base-h);x.quadraticCurveTo(bx+7,base-h*.42,bx+5,base);x.closePath();x.fill();
    }
    x.globalAlpha=.55*(1-q*.35);x.strokeStyle='#ffd56b';x.lineWidth=2.2+pulse;
    x.beginPath();x.ellipse(32,37,14+q*12,8+q*5,0,0,Math.PI*2);x.stroke();
    // sparks
    for(let i=0;i<12;i++){const s=(e*1.8+i*.173)%1, ang=i*2.31; x.globalAlpha=(1-s)*.75; x.fillStyle=i%2?'#ffd35a':'#ff6a20';x.beginPath();x.arc(32+Math.cos(ang)*s*27,43-s*38+Math.sin(ang)*5,1.2+(i%3)*.35,0,Math.PI*2);x.fill();}
  }
  x.restore();x.globalAlpha=1;
}

function drawSunflower(x,f=0,p={},damaged=false){
  const a=Math.max(0,Math.min(1,p.anim>0?(p.anim/0.75):0));
  const charge=Math.max(0,Math.min(1,p.charge||0));
  const tt=gameTime+(p.id||1)*.31;
  const wind=Math.sin(tt*1.22);
  const breath=Math.sin(tt*2.05)*.35;
  const stemLean=wind*.90;
  const headLean=wind*.060;
  const blushPow=Math.max(charge>.82?(charge-.82)/.18:0,a>0?Math.sin((1-a)*Math.PI):0);
  const dip=a>0?Math.sin((1-a)*Math.PI)*4.2:0;
  const pop=a>0&&a<.42?-Math.sin((.42-a)/.42*Math.PI)*3.3:0;
  const headY=dip+pop+breath*.14;

  // 每 10 秒做一次“眨巴眨巴眼 + 小舌头舔嘴”
  const cycle=(gameTime+((p.id||1)*.37))%10;
  let blink=1;
  if(cycle<.12) blink=.18+cycle/.12*.18;
  else if(cycle<.24) blink=.36-(cycle-.12)/.12*.18;
  else if(cycle<.38) blink=.14+Math.abs((cycle-.31)/.07)*.5;
  else if(cycle<.50) blink=.18+(cycle-.38)/.12*.82;
  const lickStart=.62, lickEnd=1.22;
  const lickRaw=cycle>lickStart&&cycle<lickEnd ? Math.sin((cycle-lickStart)/(lickEnd-lickStart)*Math.PI) : 0;
  const tongue=lickRaw;

  x.fillStyle='rgba(18,42,19,.30)';x.beginPath();x.ellipse(32,53.2,14.2,3.0,0,0,Math.PI*2);x.fill();
  x.fillStyle='#173f20';x.fillRect(29.1,39.5,5.8,15.8);
  x.fillStyle='#347c36';x.fillRect(30.2,39.2,3.4,15.6);
  const leftLeafWind=Math.sin(tt*1.22-.16)*.16;
  const rightLeafWind=Math.sin(tt*1.22-.31)*.16;
  x.save();x.translate(31,47);x.rotate(leftLeafWind);x.translate(-31,-47);
  fillPath(x,'#245c2a',[[31,47],[24,42.4],[15.5,42.6],[9.8,47.3],[18,51.2],[25.7,50.5]]);
  fillPath(x,'#55b953',[[30.8,46.2],[24,44],[17,44.1],[12.7,47.1],[18.3,49.3],[25.2,49.1]]);x.restore();
  x.save();x.translate(33,47);x.rotate(rightLeafWind);x.translate(-33,-47);
  fillPath(x,'#245c2a',[[33,48],[40,42.4],[48.7,42.5],[54.2,47.4],[46.1,51.2],[38.4,51.2]]);
  fillPath(x,'#63c45b',[[33.4,47.2],[40.3,44],[47.5,44],[51.7,47.2],[45.8,49.4],[39,49.7]]);x.restore();
  fillPath(x,'#225b29',[[28.9,43],[30.1+stemLean,29.5],[35.0+stemLean,29.5],[35.1,43]]);
  fillPath(x,'#419746',[[30.5,42],[31.4+stemLean,30.5],[33.7+stemLean,30.5],[33.8,42]]);

  x.save();
  x.translate(32+stemLean,25+headY);x.rotate(headLean);x.translate(-32,-25);

  // 增加花瓣数量，把整个头部填满；每一瓣根部都粘在头上。
  const petalAngles=[-3.10,-2.82,-2.55,-2.20,-1.88,-1.56,-1.24,-.92,-.54,-.16,.16,.48,.82,1.16,1.52,1.90,2.22,2.54,2.84,3.10];
  petalAngles.forEach((base,i)=>{
    const sway=wind*.082 + Math.sin(tt*1.75+i*.42)*.018;
    const ang=base+sway;
    const rootR=10.6;
    const tipR=20.8 + (i%2?.55:0);
    const rootX=32+Math.cos(ang)*rootR;
    const rootY=25+Math.sin(ang)*rootR;
    const tipX=32+Math.cos(ang)*tipR;
    const tipY=25+Math.sin(ang)*tipR;
    const nx=Math.cos(ang+Math.PI/2), ny=Math.sin(ang+Math.PI/2);
    const rootW=2.25, tipW=5.6;
    x.fillStyle=i%2?'#f4bd3d':'#ffd35c';
    x.beginPath();
    x.moveTo(rootX-nx*rootW,rootY-ny*rootW);
    x.quadraticCurveTo((rootX+tipX)/2-nx*tipW*.55,(rootY+tipY)/2-ny*tipW*.55,tipX,tipY);
    x.quadraticCurveTo((rootX+tipX)/2+nx*tipW*.55,(rootY+tipY)/2+ny*tipW*.55,rootX+nx*rootW,rootY+ny*rootW);
    x.closePath();x.fill();
    x.strokeStyle='#5f421c';x.lineWidth=1.48;x.stroke();
    x.fillStyle='rgba(255,242,165,.35)';
    x.beginPath();x.ellipse((rootX+tipX)/2-nx*.15,(rootY+tipY)/2-ny*.15,1.0,2.7,ang,0,Math.PI*2);x.fill();
  });

  // Portrait-matched cat-ear silhouette tucked inside the petal crown.
  fillPath(x,'#6e451f',[[22.2,18.0],[24.0,9.7],[29.0,16.3]]);fillPath(x,'#6e451f',[[35.0,16.3],[40.0,9.7],[41.8,18.0]]);
  fillPath(x,'#f0b33b',[[23.3,17.8],[24.6,12.2],[28.1,16.8]]);fillPath(x,'#f0b33b',[[35.9,16.8],[39.4,12.2],[40.7,17.8]]);
  x.fillStyle='#4f321d';x.beginPath();x.ellipse(32,25,14.25,12.75,0,0,Math.PI*2);x.fill();
  x.fillStyle='#6e451f';x.beginPath();x.ellipse(32,25,13.6,12.1,0,0,Math.PI*2);x.fill();
  x.fillStyle='#8a5a2a';x.beginPath();x.ellipse(32,25,12.9,11.4,0,0,Math.PI*2);x.fill();
  x.fillStyle='#efc37d';x.beginPath();x.ellipse(32,25,11.7,10.2,0,0,Math.PI*2);x.fill();
  x.fillStyle='#fde6b7';x.beginPath();x.ellipse(30.2,22.4,8.2,6.5,0,0,Math.PI*2);x.fill();
  x.fillStyle='rgba(128,76,31,.14)';x.beginPath();x.ellipse(36.8,28.2,5.2,6.2,.25,0,Math.PI*2);x.fill();
  x.strokeStyle='#5b3b24';x.lineWidth=1.35;x.beginPath();x.ellipse(32,25,11.7,10.2,0,0,Math.PI*2);x.stroke();

  // 猫系萌表情：大眼睛、闪光、小嘴；定期眨眼和舔嘴。
  x.fillStyle='#241d18';
  x.beginPath();x.ellipse(27.2,22.8,2.4,3.55*blink,0,0,Math.PI*2);x.ellipse(36.8,22.8,2.4,3.55*blink,0,0,Math.PI*2);x.fill();
  if(blink>.5){
    x.fillStyle='#fff8ee';x.beginPath();x.ellipse(26.55,21.9,.82,1.1,0,0,Math.PI*2);x.ellipse(36.15,21.9,.82,1.1,0,0,Math.PI*2);x.fill();
    x.fillStyle='#ffffff';x.beginPath();x.ellipse(27.7,24.0,.38,.58,0,0,Math.PI*2);x.ellipse(37.3,24.0,.38,.58,0,0,Math.PI*2);x.fill();
  }else{
    x.strokeStyle='#3c3027';x.lineWidth=1.6;x.beginPath();x.moveTo(24.9,22.9);x.lineTo(29.4,22.9);x.moveTo(34.5,22.9);x.lineTo(39.0,22.9);x.stroke();
  }
  x.strokeStyle='#7a4f31';x.lineWidth=1.2;x.beginPath();x.moveTo(24.5,18.6);x.lineTo(28.8,18.9);x.moveTo(35.2,18.9);x.lineTo(39.4,18.6);x.stroke();
  x.save();x.translate(32,27.4);x.scale(1.28,1.28);x.translate(-32,-27.4);
  x.fillStyle='#a55d43';x.beginPath();x.ellipse(32,26.6,.85,.65,0,0,Math.PI*2);x.fill();
  x.strokeStyle='#75452c';x.lineWidth=1.45;x.beginPath();x.moveTo(32,26.8);x.quadraticCurveTo(29.8,28.6,27.8,28.3);x.moveTo(32,26.8);x.quadraticCurveTo(34.2,28.6,36.2,28.3);x.stroke();
  if(tongue>0){
    x.fillStyle='#ff667c';
    x.beginPath();
    x.moveTo(31.15,28.0);
    x.quadraticCurveTo(31.25,29.5+tongue*2.8,32.0,30.5+tongue*4.8);
    x.quadraticCurveTo(33.35,29.8+tongue*3.8,33.1,28.0);
    x.quadraticCurveTo(32.2,27.35,31.15,28.0);
    x.fill();
    x.strokeStyle='#c94761';x.lineWidth=.85;x.beginPath();x.moveTo(32.0,28.9);x.quadraticCurveTo(32.1,30.3+tongue*2.4,32.0,32.0+tongue*2.0);x.stroke();
  }
  x.restore();
  x.fillStyle=blushPow>.15?'#ff747d':'#f598a6';x.globalAlpha=.74+.22*blushPow;x.beginPath();x.ellipse(22.8,28.2,3.0,2.0,0,0,Math.PI*2);x.ellipse(41.2,28.2,3.0,2.0,0,0,Math.PI*2);x.fill();x.globalAlpha=1;

  if(charge>.68||a>0){const glow=Math.max((charge-.68)/.32,a>0?Math.sin((1-a)*Math.PI):0);x.globalAlpha=.25+.65*glow;x.fillStyle='#ffe674';x.beginPath();x.ellipse(32,7-glow*2,3.5+glow*4,3.5+glow*4,0,0,Math.PI*2);x.fill();x.fillStyle='#fff6c2';x.beginPath();x.ellipse(30.5,5.8-glow*2,1.3+glow,1.0+glow*.7,0,0,Math.PI*2);x.fill();x.globalAlpha=1;}
  if(damaged){strokePath(x,'#7d542c',2,[[21,25],[25,29],[20,33]]);}
  x.restore();
}
function drawLavaWall(x,f=0,p={},damaged=false){
  const tt=gameTime+(p.id||1)*.43, pulse=.5+.5*Math.sin(tt*5.4), y=Math.sin(tt*1.35)*.18;
  x.save();x.lineJoin='round';x.lineCap='round';
  x.fillStyle='rgba(22,7,5,.42)';x.beginPath();x.ellipse(32,54,18,3.5,0,0,Math.PI*2);x.fill();
  x.globalAlpha=.18+.12*pulse;x.fillStyle='#ff481c';x.beginPath();x.ellipse(32,51,14,3,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  // A squat basalt bulwark, built from separate slabs instead of recoloring the walnut silhouette.
  fillPath(x,'#0e0d0f',[[13,50+y],[11,39+y],[14,24+y],[20,13+y],[29,9+y],[36,11+y],[44,9+y],[51,19+y],[54,34+y],[51,49+y],[44,56+y],[21,56+y]]);
  fillPath(x,'#25191a',[[17,48+y],[15,38+y],[18,25+y],[23,16+y],[30,13+y],[36,15+y],[43,13+y],[48,21+y],[50,35+y],[47,47+y],[41,52+y],[23,52+y]]);
  // armor plates
  const slabs=[[[18,25],[27,16],[33,20],[30,30],[19,34]],[[35,17],[44,15],[49,24],[47,33],[37,30]],[[17,37],[29,32],[34,39],[29,50],[20,49]],[[36,33],[49,36],[46,48],[38,52],[32,42]]];
  for(let i=0;i<slabs.length;i++){fillPath(x,i%2?'#1a1517':'#211719',slabs[i].map(q=>[q[0],q[1]+y]));}
  // molten seams
  x.strokeStyle='#7e2117';x.lineWidth=4;x.beginPath();x.moveTo(31,12+y);x.lineTo(34,20+y);x.lineTo(30,28+y);x.lineTo(35,38+y);x.lineTo(31,50+y);x.moveTo(17,35+y);x.lineTo(25,34+y);x.lineTo(30,28+y);x.moveTo(35,38+y);x.lineTo(43,32+y);x.lineTo(49,34+y);x.stroke();
  x.strokeStyle='#ff531f';x.lineWidth=2.1;x.beginPath();x.moveTo(31,12+y);x.lineTo(34,20+y);x.lineTo(30,28+y);x.lineTo(35,38+y);x.lineTo(31,50+y);x.moveTo(17,35+y);x.lineTo(25,34+y);x.lineTo(30,28+y);x.moveTo(35,38+y);x.lineTo(43,32+y);x.lineTo(49,34+y);x.stroke();
  x.strokeStyle='rgba(255,218,92,'+(.55+.35*pulse)+')';x.lineWidth=.8;x.beginPath();x.moveTo(34,20+y);x.lineTo(30,28+y);x.moveTo(35,38+y);x.lineTo(43,32+y);x.stroke();
  // furnace face
  x.fillStyle='#08080a';x.beginPath();x.moveTo(20,26+y);x.lineTo(29,28+y);x.lineTo(27,34+y);x.lineTo(20,32+y);x.closePath();x.fill();x.beginPath();x.moveTo(44,26+y);x.lineTo(35,28+y);x.lineTo(37,34+y);x.lineTo(44,32+y);x.closePath();x.fill();
  x.fillStyle='#ff5b20';x.beginPath();x.ellipse(25,30+y,2.3,2,0,0,Math.PI*2);x.ellipse(39,30+y,2.3,2,0,0,Math.PI*2);x.fill();x.fillStyle='#ffe176';x.beginPath();x.ellipse(24.5,29.5+y,.8,.7,0,0,Math.PI*2);x.ellipse(38.5,29.5+y,.8,.7,0,0,Math.PI*2);x.fill();
  x.fillStyle='#08080a';x.beginPath();x.roundRect(25,40+y,14,5,2);x.fill();x.fillStyle='#ff481d';x.beginPath();x.roundRect(28,41+y,8,2.2,1);x.fill();
  // licking flames + embers
  for(let i=0;i<5;i++){const q=(tt*.42+i*.19)%1;x.globalAlpha=(1-q)*.7;x.fillStyle=i%2?'#ff4c1c':'#ffc84e';x.beginPath();x.arc(17+i*8+Math.sin(tt*2+i)*1.5,45-q*31,1+(i%2)*.45,0,Math.PI*2);x.fill();}
  x.globalAlpha=.72;fillPath(x,'#ff5a20',[[14,48],[12,42],[16,44],[18,37],[20,46],[24,49]]);fillPath(x,'#ff7b24',[[43,49],[46,42],[48,45],[51,38],[52,48]]);x.globalAlpha=1;
  if(damaged){x.strokeStyle='#050506';x.lineWidth=2.5;x.beginPath();x.moveTo(28,15+y);x.lineTo(25,23+y);x.lineTo(29,30+y);x.moveTo(44,35+y);x.lineTo(39,40+y);x.lineTo(42,48+y);x.stroke();}
  x.restore();
}
function drawWall(x,f=0,action=0,damaged=false){
  const bob=[0,.28,0,-.28][f], y=bob;
  x.save(); x.lineJoin='round'; x.lineCap='round';
  // Fortress-nut: broad shoulders, flat planted base, craggy crown. Deliberately avoids the coffee-bean oval.
  x.globalAlpha=.24;x.fillStyle='#20170f';x.beginPath();x.ellipse(32,54+y,17,3.2,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  x.fillStyle='#3d2417';x.beginPath();
  x.moveTo(15,50+y);x.lineTo(12,42+y);x.lineTo(13,28+y);x.lineTo(17,17+y);x.lineTo(23,10+y);x.lineTo(29,8+y);x.lineTo(33,10+y);x.lineTo(39,8+y);x.lineTo(46,14+y);x.lineTo(51,23+y);x.lineTo(52,39+y);x.lineTo(49,50+y);x.lineTo(42,56+y);x.lineTo(21,56+y);x.closePath();x.fill();
  x.fillStyle='#56331d';x.beginPath();
  x.moveTo(17,50+y);x.lineTo(14,42+y);x.lineTo(15,29+y);x.lineTo(18,19+y);x.lineTo(23,13+y);x.lineTo(29,11+y);x.lineTo(33,13+y);x.lineTo(38,11+y);x.lineTo(44,15+y);x.lineTo(48,23+y);x.lineTo(49,38+y);x.lineTo(46,49+y);x.lineTo(41,54+y);x.lineTo(22,54+y);x.closePath();x.fill();
  x.fillStyle='#9a6030';x.beginPath();
  x.moveTo(20,48+y);x.lineTo(18,40+y);x.lineTo(19,28+y);x.lineTo(22,20+y);x.lineTo(27,15+y);x.lineTo(31,14+y);x.lineTo(34,16+y);x.lineTo(38,14+y);x.lineTo(43,18+y);x.lineTo(46,26+y);x.lineTo(46,39+y);x.lineTo(43,48+y);x.lineTo(39,51+y);x.lineTo(24,51+y);x.closePath();x.fill();
  x.fillStyle='#bd7b3d';x.globalAlpha=.52;x.beginPath();
  x.moveTo(22,22+y);x.lineTo(27,16+y);x.lineTo(31,15+y);x.lineTo(29,49+y);x.lineTo(24,48+y);x.lineTo(21,39+y);x.closePath();x.fill();x.globalAlpha=1;
  x.fillStyle='#6d401f';x.globalAlpha=.42;x.beginPath();
  x.moveTo(39,16+y);x.lineTo(43,19+y);x.lineTo(46,27+y);x.lineTo(46,41+y);x.lineTo(42,49+y);x.lineTo(38,50+y);x.closePath();x.fill();x.globalAlpha=1;
  // Large armored shell plates: chunky, readable even on a phone screen.
  x.strokeStyle='#5b351b';x.lineWidth=2.1;
  const plates=[[[22,22],[28,18],[31,22],[29,27],[23,28]],[[36,18],[42,22],[43,29],[37,27],[34,23]],[[20,34],[27,31],[31,35],[28,41],[21,42]],[[35,31],[44,33],[44,41],[38,43],[33,38]],[[24,46],[31,42],[38,47],[37,51],[26,51]]];
  for(const q of plates){x.beginPath();x.moveTo(q[0][0],q[0][1]+y);for(let i=1;i<q.length;i++)x.lineTo(q[i][0],q[i][1]+y);x.stroke();}
  // Deep central ridge, like a natural shield spine rather than a bean crease.
  x.strokeStyle='#452716';x.lineWidth=2.8;x.beginPath();x.moveTo(32,14+y);x.lineTo(31,21+y);x.lineTo(33,27+y);x.lineTo(31,34+y);x.lineTo(33,42+y);x.lineTo(31,51+y);x.stroke();
  x.strokeStyle='#c88a4a';x.lineWidth=1.25;x.globalAlpha=.72;x.beginPath();x.moveTo(23,19+y);x.lineTo(20,29+y);x.moveTo(40,18+y);x.lineTo(44,28+y);x.moveTo(22,45+y);x.lineTo(27,48+y);x.stroke();x.globalAlpha=1;
  // Stern face: heavy brow ridge, narrowed eyes, square grim mouth.
  x.fillStyle='#63391d';x.beginPath();x.moveTo(20.5,26+y);x.lineTo(29.2,28+y);x.lineTo(28.4,31+y);x.lineTo(21.4,29+y);x.closePath();x.fill();x.beginPath();x.moveTo(43.5,26+y);x.lineTo(34.8,28+y);x.lineTo(35.6,31+y);x.lineTo(42.6,29+y);x.closePath();x.fill();
  x.fillStyle='#f0dfb5';x.beginPath();x.ellipse(25.5,31+y,3.2,2.55,-.12,0,Math.PI*2);x.ellipse(38.5,31+y,3.2,2.55,.12,0,Math.PI*2);x.fill();
  x.fillStyle='#251a13';x.beginPath();x.ellipse(26.7,31.5+y,1.15,1.35,0,0,Math.PI*2);x.ellipse(37.3,31.5+y,1.15,1.35,0,0,Math.PI*2);x.fill();
  x.strokeStyle='#2b1a11';x.lineWidth=3.0;x.beginPath();x.moveTo(26,40+y);x.lineTo(30,38.8+y);x.lineTo(34,38.8+y);x.lineTo(38,40+y);x.stroke();
  x.strokeStyle='rgba(241,174,91,.78)';x.lineWidth=1.55;x.beginPath();x.moveTo(21.5,23+y);x.quadraticCurveTo(24,17+y,29,15.7+y);x.moveTo(21,33+y);x.lineTo(20.5,41+y);x.stroke();
  x.strokeStyle='#d39a59';x.lineWidth=1;x.globalAlpha=.55;x.beginPath();x.moveTo(24,17+y);x.lineTo(29,15+y);x.moveTo(20,36+y);x.lineTo(23,33+y);x.moveTo(40,45+y);x.lineTo(43,40+y);x.stroke();x.globalAlpha=1;
  if(damaged){strokePath(x,'#2f1b12',2.5,[[30,15+y],[27,22+y],[31,27+y],[27,34+y],[30,40+y]]);strokePath(x,'#2f1b12',2.2,[[44,31+y],[39,35+y],[43,39+y],[37,45+y]]);}
  x.restore();
}
function drawPotato(x,f=0,p={armed:false,arm:0},damaged=false){
  const arm=Math.max(0,p.arm||0),armed=!!p.armed;
  const rise=armed?1:Math.max(0,Math.min(1,(arm-3.6)/2.4));
  const ease=rise*rise*(3-2*rise), bob=armed?Math.sin(gameTime*3.2+(p.id||0))*.45:0;
  // Once armed, the tuber settles into the soil instead of hovering above it.
  const cy=52-ease*19+(armed?3:0)+bob;
  x.save();

  // Thick broken soil ring makes it read as something buried in the lawn.
  x.fillStyle='#4a2d17';x.beginPath();x.ellipse(32,51,23,7.5,0,0,Math.PI*2);x.fill();
  const rocks=[[10,48,7,5],[16,45,7,6],[23,47,8,6],[31,45,8,6],[39,47,8,6],[47,45,7,6],[53,49,6,5]];
  for(let i=0;i<rocks.length;i++){const [rx,ry,rw,rh]=rocks[i];x.fillStyle=i%2?'#76502d':'#654222';x.beginPath();x.ellipse(rx,ry,rw/2,rh/2,(i-3)*.11,0,Math.PI*2);x.fill();x.strokeStyle='#352215';x.lineWidth=1.2;x.stroke();}

  if(rise<.08){
    // Unarmed: only the trigger stem and a nervous pair of eyes peek through.
    x.fillStyle='#8c6a3a';x.fillRect(29,43,6,8);
    x.fillStyle='#1d1711';x.beginPath();x.ellipse(27,48,2.1,1.5,0,0,Math.PI*2);x.ellipse(37,48,2.1,1.5,0,0,Math.PI*2);x.fill();
  }else{
    // Original potato-mine silhouette: squat tuber dome, not a generic brown blob.
    const top=cy-17, bottom=cy+10;
    x.fillStyle='#3b2819';x.beginPath();x.moveTo(14,cy+6);x.bezierCurveTo(14,top+7,21,top,32,top);x.bezierCurveTo(44,top,51,top+7,51,cy+6);x.quadraticCurveTo(45,bottom,32,bottom);x.quadraticCurveTo(20,bottom,14,cy+6);x.fill();
    x.fillStyle='#c79a51';x.beginPath();x.moveTo(16,cy+5);x.bezierCurveTo(16,top+8,22,top+2,32,top+2);x.bezierCurveTo(42,top+2,49,top+8,49,cy+5);x.quadraticCurveTo(43,bottom-2,32,bottom-1);x.quadraticCurveTo(21,bottom-2,16,cy+5);x.fill();

    // Potato dimples and earthy shading.
    x.fillStyle='rgba(105,66,31,.34)';
    for(const [dx,dy,rx,ry] of [[23,-8,2.2,1.4],[40,-5,2.6,1.5],[19,3,2,1.3],[43,5,2.2,1.3],[33,-12,1.6,1.1]]){x.beginPath();x.ellipse(dx,cy+dy,rx,ry,-.2,0,Math.PI*2);x.fill();}
    x.strokeStyle='rgba(92,53,25,.72)';x.lineWidth=.8;
    for(const [sx,sy,ex,ey] of [[18,-12,22,-14],[27,8,24,10],[37,-10,41,-12],[44,1,47,3],[20,-1,17,1]]){x.beginPath();x.moveTo(sx,cy+sy);x.quadraticCurveTo((sx+ex)/2-1,cy+(sy+ey)/2+1,ex,cy+ey);x.stroke();}
    x.fillStyle='rgba(239,191,111,.48)';
    for(const [hx,hy] of [[20,-6],[36,-8],[45,7],[27,4]]){x.beginPath();x.arc(hx,cy+hy,.7,0,Math.PI*2);x.fill();}

    // Large glossy alert eyes + small buck tooth are the key face read.
    x.fillStyle='#171617';x.beginPath();x.ellipse(25.5,cy-1,3.8,5.0,-.12,0,Math.PI*2);x.ellipse(39.2,cy-1,3.8,5.0,.12,0,Math.PI*2);x.fill();
    x.fillStyle='#fff8df';x.beginPath();x.ellipse(24.4,cy-2.6,1.25,1.6,0,0,Math.PI*2);x.ellipse(38.1,cy-2.6,1.25,1.6,0,0,Math.PI*2);x.fill();
    x.strokeStyle='#4b2a18';x.lineWidth=1.5;x.beginPath();x.moveTo(29,cy+6);x.quadraticCurveTo(32,cy+8,35,cy+6);x.stroke();
    x.fillStyle='#f5ead0';x.fillRect(30.1,cy+6,3.8,4.2);x.strokeStyle='#5a3520';x.lineWidth=1;x.strokeRect(30.1,cy+6,3.8,4.2);

    // Metal detonator stem and red warning bulb. It rises with the potato.
    x.fillStyle='#55585a';x.fillRect(30.1,top-8,3.8,9);
    x.fillStyle='#9b2118';x.beginPath();x.arc(32,top-10,5.2,0,Math.PI*2);x.fill();
    x.fillStyle=armed?'#ff4b32':'#c9442e';x.beginPath();x.arc(32,top-10,4.0,0,Math.PI*2);x.fill();
    x.fillStyle='rgba(255,235,190,.88)';x.beginPath();x.arc(30.6,top-11.4,1.25,0,Math.PI*2);x.fill();
    if(armed){
      const pulse=.5+.5*Math.sin(gameTime*9);
      x.globalAlpha=.18+.20*pulse;x.fillStyle='#ff3c20';x.beginPath();x.arc(32,top-10,8+2*pulse,0,Math.PI*2);x.fill();x.globalAlpha=1;
    }
    if(damaged){x.strokeStyle='#59341d';x.lineWidth=1.8;x.beginPath();x.moveTo(18,cy);x.lineTo(22,cy+3);x.lineTo(20,cy+7);x.stroke();}
  }
  x.restore();
}
function drawPotatoBlast(x,t){
  const life=1.9,u=Math.max(0,Math.min(1,t/life));
  x.save();
  // brief ground shock and dirt kick, then let smoke become the main event
  if(u<.18){
    const q=u/.18, a=1-q;
    x.globalAlpha=.9*a;
    x.strokeStyle='#d5b06b';x.lineWidth=2.2;
    x.beginPath();x.ellipse(32,45,9+q*20,3+q*6,0,0,Math.PI*2);x.stroke();
    x.fillStyle='#8a5a2d';
    for(let i=0;i<8;i++){
      const ang=-Math.PI*.92+i*Math.PI*.23, rr=10+q*(10+(i%3)*3);
      x.beginPath();x.ellipse(32+Math.cos(ang)*rr,43+Math.sin(ang)*rr*.42,1.8,1.1,ang,0,Math.PI*2);x.fill();
    }
  }
  // small hot core only at the beginning; no single-frame flash
  if(u<.28){
    const q=u/.28, a=(1-q)*.85;
    x.globalAlpha=a;
    const r=7+q*8;
    x.fillStyle='#f2a14a';x.beginPath();x.ellipse(32,36,r,r*.72,0,0,Math.PI*2);x.fill();
    x.fillStyle='#ffd98a';x.beginPath();x.ellipse(30,34,r*.48,r*.38,0,0,Math.PI*2);x.fill();
  }
  // layered billowing smoke: expands, rises, separates and fades naturally
  const smokeStart=Math.max(0,(u-.08)/.92);
  const ease=1-Math.pow(1-smokeStart,2.2);
  const fade=Math.max(0,1-Math.pow(smokeStart,1.45));
  const puffs=[
    [-8,5,8,0.0],[-1,2,10,.05],[8,4,8,.12],[-11,-2,6,.18],[5,-4,7,.22],[12,-1,5,.28],
    [-4,-8,7,.32],[3,-10,6,.36],[-14,6,4,.42],[14,7,4,.47]
  ];
  for(let i=0;i<puffs.length;i++){
    const [ox,oy,base,delay]=puffs[i];
    const local=Math.max(0,Math.min(1,(smokeStart-delay)/(1-delay||1)));
    if(local<=0)continue;
    const spread=1+local*.72;
    const rise=local*(9+i%3*2);
    const wob=Math.sin((t*3.1)+i*1.37)*1.2*local;
    const alpha=fade*(.42+(i%3)*.08)*(1-local*.28);
    x.globalAlpha=Math.max(0,alpha);
    x.fillStyle=i%3===0?'#4c4a46':(i%3===1?'#66635d':'#7a766d');
    x.beginPath();
    x.ellipse(32+ox*ease+wob,39+oy*ease-rise,base*spread,base*.72*spread,0,0,Math.PI*2);
    x.fill();
    if(local<.7){
      x.globalAlpha=Math.max(0,alpha*.35);
      x.fillStyle='#aaa59a';
      x.beginPath();x.ellipse(30+ox*ease+wob,36+oy*ease-rise,base*.5*spread,base*.32*spread,0,0,Math.PI*2);x.fill();
    }
  }
  x.restore();
}
function drawFan(x,f=0,p={},damaged=false){
  const tt=gameTime+(p.id||0)*.31;
  const spin=tt*8.4;
  const sway=Math.sin(tt*1.6)*.018;
  x.save();
  x.translate(31.5,49);x.rotate(sway);x.translate(-31.5,-49);
  // broad planted base and stem
  x.fillStyle='#102e2c';x.beginPath();x.ellipse(31.5,51.5,15.2,4.4,0,0,Math.PI*2);x.fill();
  x.fillStyle='#2c6259';x.beginPath();x.ellipse(31.5,50.6,13.6,3.3,0,0,Math.PI*2);x.fill();
  x.fillStyle='#39766b';x.fillRect(28.5,34,6,16);
  x.fillStyle='#1b3d39';x.fillRect(29.8,35,2.2,14);
  // fan cage
  x.strokeStyle='#173b3d';x.lineWidth=4.2;x.beginPath();x.arc(31.5,24.5,15.8,0,Math.PI*2);x.stroke();
  x.strokeStyle=damaged?'#5a6b68':'#9ce0df';x.lineWidth=2.4;x.beginPath();x.arc(31.5,24.5,15.0,0,Math.PI*2);x.stroke();
  x.strokeStyle='#416d6d';x.lineWidth=1.1;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(31.5+Math.cos(a)*5,24.5+Math.sin(a)*5);x.lineTo(31.5+Math.cos(a)*14,24.5+Math.sin(a)*14);x.stroke();}
  // rotating blades
  x.save();x.translate(31.5,24.5);x.rotate(spin);
  for(let i=0;i<4;i++){
    x.save();x.rotate(i*Math.PI/2);
    x.fillStyle='#173b3d';x.beginPath();x.moveTo(1.2,-3.1);x.bezierCurveTo(10.4,-7.0,14.3,-3.5,13.4,1.6);x.bezierCurveTo(9.4,5.8,4.5,5.2,.8,2.5);x.closePath();x.fill();
    x.fillStyle=i%2?'#78e2ed':'#4cc7dc';
    x.beginPath();x.moveTo(2,-2.4);x.bezierCurveTo(10,-6,13,-3,12.5,1.0);x.bezierCurveTo(9,4.8,5,4.4,1.6,2.2);x.closePath();x.fill();
    x.fillStyle='rgba(235,255,255,.55)';x.beginPath();x.ellipse(8.0,-2.0,3.1,.75,-.2,0,Math.PI*2);x.fill();
    x.restore();
  }
  x.fillStyle='#d7eef0';x.beginPath();x.arc(0,0,4.2,0,Math.PI*2);x.fill();
  x.fillStyle='#387f89';x.beginPath();x.arc(0,0,2.2,0,Math.PI*2);x.fill();
  x.restore();
  // small cold outlet fins
  x.fillStyle='#78cbd7';x.fillRect(45,21,4,2);x.fillRect(45,26,4,2);
  x.restore();
}
function drawFanWindCanvas(canvas,p){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=gameTime+(p.id||0)*.17;
  c.clearRect(0,0,w,h);c.lineCap='round';
  const lines=8;
  for(let i=0;i<lines;i++){
    const lane=(i+.5)/lines;
    const phase=(t*(.42+i*.018)+i*.137)%1;
    const start=-90+phase*(w+150);
    const len=135+(i%3)*45;
    const cy=h*(.18+lane*.64);
    c.strokeStyle=`rgba(${95+i*5},${188+i*4},235,${.26+(i%3)*.08})`;
    c.lineWidth=3+(i%2);
    c.beginPath();
    for(let s=0;s<=18;s++){
      const q=s/18,xx=start+q*len;
      const yy=cy+Math.sin(q*Math.PI*2.2+t*4+i)*8+Math.sin(q*Math.PI*4+i*.7)*2.5;
      if(s===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    }
    c.stroke();
    // rotating curl at the nose of each stream
    const hx=start+len,hy=cy+Math.sin(t*4+i)*8;
    c.strokeStyle=`rgba(155,225,255,${.22+(i%2)*.08})`;c.lineWidth=2.2;c.beginPath();
    for(let a=0;a<=Math.PI*1.7;a+=.18){const rr=2.2+a*2.2,xx=hx-Math.cos(a+t*2+i)*rr,yy=hy+Math.sin(a+t*2+i)*rr*.55;if(a===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.stroke();
  }
}
function drawShovel(x){ x.fillStyle='#2c2118'; x.fillRect(29,8,7,34);x.fillStyle='#76553a'; x.fillRect(27,5,11,8);x.fillStyle='#b8b7a9'; x.fillRect(22,38,21,6);x.fillStyle='#8f9189'; x.fillRect(19,44,27,11);x.fillStyle='#60635f'; x.fillRect(22,47,21,6); }
function drawGlove(x){
  x.save();x.translate(4,3);x.rotate(-.12);
  x.fillStyle='#5a3925';x.fillRect(18,39,28,12);x.fillStyle='#7d573a';x.fillRect(20,37,24,10);
  x.fillStyle='#d9c2a0';x.strokeStyle='#4b3829';x.lineWidth=2.2;x.beginPath();
  x.moveTo(21,39);x.lineTo(16,30);x.quadraticCurveTo(14,26,17,24);x.quadraticCurveTo(20,23,22,27);
  x.lineTo(24,31);x.lineTo(24,16);x.quadraticCurveTo(24,12,28,12);x.quadraticCurveTo(31,13,31,17);x.lineTo(31,27);
  x.lineTo(34,14);x.quadraticCurveTo(35,10,39,11);x.quadraticCurveTo(42,12,41,16);x.lineTo(39,29);
  x.lineTo(43,18);x.quadraticCurveTo(44,14,47,15);x.quadraticCurveTo(50,17,49,20);x.lineTo(46,33);
  x.quadraticCurveTo(43,42,35,44);x.lineTo(26,44);x.closePath();x.fill();x.stroke();
  x.strokeStyle='#9b815e';x.lineWidth=1.3;x.beginPath();x.moveTo(27,34);x.lineTo(41,34);x.moveTo(29,38);x.lineTo(38,38);x.stroke();x.restore();
}
function drawGloveAction(x,fx){
  const hold=fx.kind==='hold';
  const life=hold?.42:(fx.life||.62),u=Math.min(1,fx.age/life);
  // grab: open hand descends, closes around the shrinking plant, then stays compact.
  // drop: closed hand arrives, opens, then lifts away as the plant grows/falls out.
  const open=hold?(u<.32?1:Math.max(0,1-(u-.32)/.34)):Math.min(1,u/.34);
  const y=hold?(-9+Math.max(0,1-Math.min(1,u/.34))*-11):(-7-Math.max(0,(u-.48)/.52)*12);
  x.save();x.translate(8,y);x.scale(.78,.78);x.rotate(-.07);
  x.fillStyle='#5a3925';x.fillRect(18,37,28,11);x.fillStyle='#7d573a';x.fillRect(20,35,24,9);
  x.fillStyle='#d9c2a0';x.strokeStyle='#4b3829';x.lineWidth=2.2;x.beginPath();
  x.moveTo(22,38);x.lineTo(17,30);x.quadraticCurveTo(15,26,18,24);x.quadraticCurveTo(21,23,23,27);x.lineTo(25,31);
  const spread=5.5*open;
  x.lineTo(25-spread*.25,17-spread);x.quadraticCurveTo(25,12-spread,29,13-spread);x.quadraticCurveTo(32,14-spread,31,18-spread);x.lineTo(31,29);
  x.lineTo(35+spread*.2,15-spread);x.quadraticCurveTo(36,11-spread,40,12-spread);x.quadraticCurveTo(43,13-spread,42,17-spread);x.lineTo(40,30);
  x.lineTo(44+spread*.45,20-spread*.65);x.quadraticCurveTo(45,16-spread*.65,48,17-spread*.65);x.quadraticCurveTo(51,19-spread*.65,50,22-spread*.65);x.lineTo(46,34);
  x.quadraticCurveTo(43,42,35,44);x.lineTo(27,44);x.closePath();x.fill();x.stroke();
  x.strokeStyle='#9b815e';x.lineWidth=1.2;x.beginPath();x.moveTo(28,34);x.lineTo(41,34);x.stroke();
  x.restore();
}function drawLighter(x,f=0,p={},damaged=false){
  const tt=gameTime+(p.id||1)*.53;
  const thrown=p.throwAge!=null;
  const u=thrown?Math.max(0,Math.min(1,(p.throwAge||0)/.86)):0;
  const arc=Math.sin(Math.min(1,u)*Math.PI);
  const lift=thrown?(arc*arc*.35+arc*.65)*30:Math.sin(tt*1.7)*0.6;
  const rot=thrown?(-.35+u*6.15):Math.sin(tt*1.1)*0.03;
  const flame=Math.max(0,Math.min(1,thrown?((p.throwAge||0)-.06)/.18:1));
  const lid=Math.max(.05,Math.min(1,thrown?(.2+u*1.1):.72));
  x.save();
  x.translate(32,40-lift);x.rotate(rot);
  x.fillStyle='rgba(24,33,18,.28)';x.beginPath();x.ellipse(0,16,11,3.5,0,0,Math.PI*2);x.fill();
  x.fillStyle=damaged?'#a6782a':'#c99a35';x.strokeStyle='#53360f';x.lineWidth=2.2;
  x.beginPath();x.roundRect(-10,-6,20,24,4);x.fill();x.stroke();
  x.fillStyle='#e7bd57';x.fillRect(-7,-3,14,18);
  x.fillStyle='#5e3e12';x.fillRect(-5,9,10,3);
  x.strokeStyle='#70461b';x.beginPath();x.moveTo(-6,2);x.lineTo(6,2);x.moveTo(-6,6);x.lineTo(6,6);x.stroke();
  x.save();x.translate(-8,-4);x.rotate(-1.08*lid);
  x.fillStyle='#d3b25e';x.strokeStyle='#584422';x.lineWidth=2.1;
  x.beginPath();x.roundRect(-2,-8,18,10,4);x.fill();x.stroke();
  x.fillStyle='#b8892e';x.fillRect(2,-5,9,4);x.restore();
  x.fillStyle='#473214';x.fillRect(-1,-9,2,4);
  if(flame>0){
    x.save();x.translate(0,-12);x.scale(1,.9+.15*Math.sin(tt*18));
    x.fillStyle='rgba(255,238,140,.82)';x.beginPath();x.moveTo(0,-10*flame);x.quadraticCurveTo(6,-2,0,5);x.quadraticCurveTo(-6,-2,0,-10*flame);x.fill();
    x.fillStyle='rgba(255,129,34,.92)';x.beginPath();x.moveTo(0,-7*flame);x.quadraticCurveTo(3,-1,0,3.5);x.quadraticCurveTo(-3,-1,0,-7*flame);x.fill();
    x.restore();
  }
  x.restore();
}
function drawCrossFireCanvas(canvas,fx){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);
  const cx=w*.5,cy=h*.5,u=Math.min(1,fx.age/.22),fade=Math.min(1,(fx.life-fx.age)/.28),a=u*fade,t=gameTime*9;
  c.save();c.globalAlpha=a;c.lineCap='round';
  // translucent wind ribbons
  for(let dir=0;dir<4;dir++){
    const ang=dir*Math.PI/2,dx=Math.cos(ang),dy=Math.sin(ang),px=-dy,py=dx;
    for(let k=0;k<5;k++){
      const off=(k-2)*5,phase=(t+k*.83)%1;
      c.strokeStyle=`rgba(205,240,255,${.16+k*.025})`;c.lineWidth=1.5+(k%2);
      c.beginPath();
      for(let q=0;q<=1.001;q+=.08){
        const dist=10+q*Math.max(w,h)*.56;
        const wig=Math.sin(q*18-t*2+k)*4;
        const x=cx+dx*dist+px*(off+wig),y=cy+dy*dist+py*(off+wig);
        if(q===0)c.moveTo(x,y);else c.lineTo(x,y);
      }c.stroke();
      // fire tongues and sparks riding the wind
      for(let n=0;n<4;n++){
        const q=(phase+n*.23)%1,dist=12+q*Math.max(w,h)*.52,wg=Math.sin(q*15+k)*5;
        const x=cx+dx*dist+px*(off*.45+wg),y=cy+dy*dist+py*(off*.45+wg);
        c.fillStyle=n%2?'rgba(255,203,62,.88)':'rgba(255,83,28,.86)';
        c.beginPath();c.arc(x,y,2.2+(1-q)*2.5,0,Math.PI*2);c.fill();
        c.strokeStyle='rgba(255,116,27,.55)';c.lineWidth=3.2;c.beginPath();c.moveTo(x-dx*10,y-dy*10);c.lineTo(x,y);c.stroke();
      }
    }
  }
  c.fillStyle='rgba(255,92,22,.35)';c.beginPath();c.arc(cx,cy,18+Math.sin(t)*3,0,Math.PI*2);c.fill();c.restore();
}

function drawBurningTileCanvas(c,tile){
  const x=c.getContext('2d');if(!x)return;
  const w=c.width,h=c.height,tt=gameTime+tile.id*.31,u=Math.max(0,Math.min(1,tile.age/.72));
  const fade=Math.max(0,Math.min(1,(tile.life-tile.age)/1.15));
  x.clearRect(0,0,w,h);x.save();x.translate(w/2,h/2);
  // The burn is the lawn itself: irregular char creeps outward instead of a separate fire decal.
  const R=w*(.08+.34*u), Ry=h*(.07+.29*u);
  const blobs=[
    [0,.03,1,.76],[-.34,-.08,.54,.55],[.31,-.14,.58,.48],[-.18,.27,.62,.43],[.23,.25,.52,.47],
    [-.48,.17,.34,.31],[.48,.08,.31,.36],[-.08,-.34,.43,.34],[.12,-.39,.31,.29]
  ];
  // singed ochre fringe
  x.globalAlpha=.72*fade;x.fillStyle='#6d5528';
  for(let i=0;i<blobs.length;i++){const b=blobs[i],pulse=.94+.06*Math.sin(tt*1.8+i*2.1);x.beginPath();x.ellipse(b[0]*R,b[1]*Ry,R*b[2]*pulse,Ry*b[3]*pulse,i*.37,0,Math.PI*2);x.fill();}
  // charcoal body, broken into patches so grass still shows between burnt fibers
  x.globalAlpha=.88*fade;x.fillStyle='#282824';
  for(let i=0;i<blobs.length;i++){const b=blobs[i],k=.76+(i%3)*.06;x.beginPath();x.ellipse(b[0]*R,b[1]*Ry,R*b[2]*k,Ry*b[3]*k,i*.41,0,Math.PI*2);x.fill();}
  x.globalAlpha=.92*fade;x.fillStyle='#111512';
  for(let i=0;i<7;i++){const a=i*.91+tile.id*.17,rr=R*(.08+.055*i);x.beginPath();x.ellipse(Math.cos(a)*rr,Math.sin(a*1.3)*rr*.55,R*(.16+(i%2)*.04),Ry*(.10+(i%3)*.025),a,0,Math.PI*2);x.fill();}
  // scorched grass blades/radial cracks
  x.globalAlpha=.78*fade;x.strokeStyle='#151713';x.lineCap='round';
  for(let i=0;i<15;i++){const a=i*.73+tile.id*.11,inner=R*(.12+(i%4)*.035),outer=R*(.52+(i%5)*.065);x.lineWidth=1.3+(i%3)*.45;x.beginPath();x.moveTo(Math.cos(a)*inner,Math.sin(a)*inner*.72);x.quadraticCurveTo(Math.cos(a+.16)*outer*.72,Math.sin(a+.16)*outer*.48,Math.cos(a)*outer,Math.sin(a)*outer*.72);x.stroke();}
  // Only small residual tongues of flame live on the perimeter; they belong to the charred lawn.
  const flameAlpha=Math.min(1,tile.age/.22)*fade;
  for(let i=0;i<6;i++){
    const a=i*1.07+tile.id*.29,rr=R*(.42+(i%2)*.13),px=Math.cos(a)*rr,py=Math.sin(a)*rr*.62;
    const flick=.78+.22*Math.sin(tt*13+i*1.8),fh=(6+(i%3)*2.2)*flick;
    x.globalAlpha=.82*flameAlpha;x.fillStyle='#e85a20';x.beginPath();x.moveTo(px-3,py+2);x.quadraticCurveTo(px-4,py-fh*.35,px,py-fh);x.quadraticCurveTo(px+4,py-fh*.3,px+3,py+2);x.closePath();x.fill();
    x.globalAlpha=.9*flameAlpha;x.fillStyle='#ffc15b';x.beginPath();x.moveTo(px-1.5,py+1);x.quadraticCurveTo(px-2,py-fh*.2,px,py-fh*.58);x.quadraticCurveTo(px+2,py-fh*.18,px+1.5,py+1);x.closePath();x.fill();
  }
  // embers lift off the burnt fibers
  for(let i=0;i<11;i++){const a=i*.79+tile.id,rr=R*(.18+(i%5)*.11),rise=((tt*(15+i%3)*3+i*9)%(h*.23));x.globalAlpha=(.38+(i%3)*.2)*flameAlpha;x.fillStyle=i%2?'#ffb84b':'#ff6b2a';x.beginPath();x.arc(Math.cos(a)*rr,Math.sin(a)*rr*.42-rise*.34,1.1+(i%2)*.7,0,Math.PI*2);x.fill();}
  x.restore();
}
function drawBucketHelmet(x,hp=200){
  const stage=hp<=50?2:(hp<=130?1:0);
  const squash=stage===0?1:(stage===1?.80:.62);
  const y=stage===0?2:(stage===1?6:10), h=24*squash;
  x.save();
  // rear rim
  x.fillStyle='#151b1f';x.fillRect(17,y+20*squash,31,5);
  // steel bucket shell with increasingly crushed silhouette
  x.fillStyle='#222b30';x.strokeStyle='#0b0f11';x.lineWidth=2;
  x.beginPath();x.moveTo(18,y+3);x.lineTo(47,y+2+stage*2);x.lineTo(44,y+h);x.lineTo(20,y+h-1);x.closePath();x.fill();x.stroke();
  x.fillStyle='#59666c';x.beginPath();x.moveTo(21,y+5);x.lineTo(43,y+4+stage*2);x.lineTo(41,y+h-4);x.lineTo(23,y+h-4);x.closePath();x.fill();
  x.fillStyle='#859198';x.fillRect(23,y+6,4,Math.max(4,h-11));
  // top lip
  x.fillStyle='#101518';x.fillRect(16,y+1+stage*2,33,4);
  x.fillStyle='#657178';x.fillRect(19,y+1+stage*2,27,2);
  if(stage>=1){
    // first crush: big dent and torn rim
    x.fillStyle='#1a2024';x.beginPath();x.moveTo(34,y+3);x.lineTo(45,y+6);x.lineTo(39,y+12);x.lineTo(31,y+9);x.closePath();x.fill();
    x.strokeStyle='#0a0d0f';x.lineWidth=2;x.beginPath();x.moveTo(23,y+10);x.lineTo(29,y+14);x.lineTo(26,y+19);x.stroke();
  }
  if(stage>=2){
    // second crush: flatter, uglier, split side and missing steel bite
    x.fillStyle='#0d1113';x.beginPath();x.moveTo(17,y+11);x.lineTo(25,y+9);x.lineTo(22,y+17);x.lineTo(18,y+19);x.closePath();x.fill();
    x.strokeStyle='#050708';x.lineWidth=2.3;x.beginPath();x.moveTo(38,y+8);x.lineTo(33,y+13);x.lineTo(40,y+17);x.lineTo(35,y+21);x.stroke();
  }
  // Real bucket hardware: side lugs + hanging wire handle. On zombies this handle sits around the neck/shoulders.
  const rimY=y+h-1;
  x.fillStyle='#11171a';x.beginPath();x.arc(19,rimY-2,2.3,0,Math.PI*2);x.arc(45,rimY-2,2.3,0,Math.PI*2);x.fill();
  x.strokeStyle='#87949a';x.lineWidth=1.7;x.beginPath();x.moveTo(19,rimY-2);x.quadraticCurveTo(32,rimY+13,45,rimY-2);x.stroke();
  x.strokeStyle='#20282c';x.lineWidth=3.4;x.beginPath();x.moveTo(20,rimY);x.lineTo(44,rimY);x.stroke();
  x.strokeStyle='#69767c';x.lineWidth=1.2;x.beginPath();x.moveTo(22,rimY-.5);x.lineTo(42,rimY-.5);x.stroke();
  x.restore();
}

function drawPlantBucketHelmet(x,p){
  if(!p||(p.armorHp||0)<=0)return;
  const hp=p.armorHp, type=p.type;
  // Each plant has a different crown/face silhouette. Fit the same 200-HP steel bucket
  // to that silhouette instead of stamping one universal zombie helmet over the sprite.
  const fit={
    pea:      {x:1.0,y:-4.8,s:.84,r:-.105},
    sunflower:{x:0.0,y:-5.7,s:.91,r:.015},
    wall:     {x:0.0,y:-1.8,s:1.08,r:-.018},
    potato:   {x:0.0,y:5.0,s:.91,r:.035},
    fan:      {x:0.0,y:-2.8,s:.94,r:-.045},
    magnet:   {x:2.6,y:1.2,s:.88,r:.105}
  }[type]||{x:0,y:-2,s:.94,r:0};

  x.save();
  x.translate(32+fit.x,32+fit.y);
  x.rotate(fit.r);
  x.scale(fit.s,fit.s);
  x.translate(-32,-32);
  drawBucketHelmet(x,hp);
  x.restore();

  // Small plant-specific foreground pieces make the bucket read as "worn around"
  // the model instead of pasted on top of it.
  x.save();
  if(type==='pea'){
    // Pea muzzle/leaf tip remains in front of the lower rim.
    x.globalAlpha=.92;x.fillStyle=p.fireMode?'#ff7a22':'#456f32';
    x.beginPath();x.ellipse(46,25,5.2,3.2,-.18,0,Math.PI*2);x.fill();
  }else if(type==='sunflower'){
    // A few petals escape around the steel rim.
    x.fillStyle='#d8b43e';
    for(const a of [-2.75,-2.2,-.95,-.38]){
      x.save();x.translate(32+Math.cos(a)*17,27+Math.sin(a)*12);x.rotate(a);x.beginPath();x.ellipse(0,0,5.2,2.4,0,0,Math.PI*2);x.fill();x.restore();
    }
  }else if(type==='wall'){
    // Wide nut cheeks sit outside the bucket edges.
    x.fillStyle=p.fireMode?'#7a321c':'#81592f';
    x.beginPath();x.ellipse(16,31,3.4,8.5,.08,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(48,31,3.4,8.5,-.08,0,Math.PI*2);x.fill();
  }else if(type==='potato'){
    // Low tuber shoulders remain visible below the bucket.
    x.fillStyle='#8a6339';x.beginPath();x.ellipse(32,47,15,4.2,0,0,Math.PI*2);x.fill();
  }else if(type==='fan'){
    // Fan side fins poke out beyond the bucket.
    x.fillStyle='#8fb9c4';
    x.beginPath();x.moveTo(15,27);x.lineTo(7,33);x.lineTo(16,35);x.closePath();x.fill();
    x.beginPath();x.moveTo(49,27);x.lineTo(57,33);x.lineTo(48,35);x.closePath();x.fill();
  }else if(type==='magnet'){
    // Magnetic poles stay readable; bucket is intentionally caught crooked between them.
    x.fillStyle='#b73535';x.fillRect(13,16,6,8);
    x.fillStyle='#b9c4c6';x.fillRect(45,16,6,8);
  }
  // Fire variants keep a little flame licking around the rim instead of being buried by steel.
  if(p.fireMode&&(type==='pea'||type==='wall')){
    const t=gameTime||0;
    for(let i=0;i<4;i++){
      const bx=21+i*8+Math.sin(t*7+i)*1.5;
      x.globalAlpha=.75;x.fillStyle=i%2?'#ffc13d':'#ff5b20';
      x.beginPath();x.moveTo(bx,18);x.quadraticCurveTo(bx-3,11-Math.sin(t*8+i)*2,bx,7);x.quadraticCurveTo(bx+4,12,bx+2,19);x.closePath();x.fill();
    }
  }
  x.restore();
}

function minerEase(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)}
function minerPose(z,bitePhase=0){
  const phase=((z.walkTick||0)%1+1)%1*Math.PI*2;
  const digging=z.digState==='digging';
  const rising=Number.isFinite(z.risePose);
  const eating=!!z.eatMode&&!digging&&!rising;
  const u=digging?Math.max(0,Math.min(1,(z.digAge||0)/1.18)):0;
  const bp=eating?Math.max(0,Math.min(1,bitePhase)):0;
  const attackWind=eating?minerEase(bp/.28):0;
  const attackDrop=eating?minerEase((bp-.28)/.24):0;
  const attackRecover=eating?minerEase((bp-.62)/.38):0;
  const toolImpact=eating?Math.exp(-Math.pow((bp-.54)/.05,2)):0;
  let rootX=0,rootY=0,crouch=0,torsoLean=0,shoulderRoll=0,headLag=0;
  let armReach=0,diveReach=0,launch=0,enter=0;
  const walking=!digging&&!rising&&!eating;
  if(walking){
    rootY=Math.sin(phase*2)*.55;
    torsoLean=Math.sin(phase-.55)*.065;
    shoulderRoll=Math.sin(phase+Math.PI)*1.45;
    headLag=Math.sin(phase-.95)*.045;
  }
  if(eating){
    // Two-handed pickaxe attack: raise, drive the head into the plant, recoil, recover.
    const active=attackWind*(1-attackRecover);
    rootX=-3.2*attackDrop*(1-attackRecover)+1.2*toolImpact;
    rootY=-2.0*attackWind*(1-attackDrop)+1.6*toolImpact;
    crouch=2.8*active;
    torsoLean=.13*attackWind*(1-attackDrop)-.38*attackDrop*(1-attackRecover)+.10*toolImpact;
    shoulderRoll=-3.6*active;
    headLag=-.08*active+.13*toolImpact;
    armReach=attackDrop*(1-attackRecover);
  }
  if(digging){
    const bend=minerEase(u/.27);
    diveReach=minerEase((u-.18)/.28);
    launch=minerEase((u-.48)/.22);
    enter=minerEase((u-.67)/.33);
    // No rigid 180-degree sprite flip: pelvis, spine, arms and legs follow a diving chain.
    rootX=-3.5*launch-8.5*enter;
    rootY=-Math.sin(Math.min(1,launch)*Math.PI)*12+66*enter;
    crouch=8.5*bend*(1-launch);
    torsoLean=-.56*bend-.25*diveReach-.12*launch+.12*enter;
    shoulderRoll=-3*diveReach;
    headLag=-.10*diveReach+.06*enter;
  }
  if(rising){
    const ru=minerEase(z.risePose);
    crouch=5.5*(1-ru);
    torsoLean=-.42*(1-ru);
    shoulderRoll=-2.5*(1-ru);
    headLag=.10*(1-ru);
  }
  const gazeX=eating?-.78:(digging?(-.38-.28*diveReach):Math.sin(phase-.85)*.22);
  const gazeY=eating?.46:(digging?.60:.28+Math.sin(phase*.5)*.08);
  return {phase,u,digging,rising,eating,rootX,rootY,crouch,torsoLean,shoulderRoll,headLag,armReach,diveReach,launch,enter,attackWind,attackDrop,attackRecover,toolImpact,gazeX,gazeY};
}
function drawMinerZombie(x,z,bitePhase=0){
  const P=minerPose(z,bitePhase),step=Math.sin(P.phase);
  const liftL=Math.max(0,step),liftR=Math.max(0,-step);
  const joint=(p,len,a)=>({x:p.x+Math.sin(a)*len,y:p.y-Math.cos(a)*len});
  const pelvis={x:32+P.rootX,y:43+P.rootY+P.crouch};
  const spineLen=17-P.crouch*.20;
  const shoulder=joint(pelvis,spineLen,P.torsoLean);
  const neck=joint(shoulder,3.8,P.torsoLean+P.headLag*.35);
  const head=joint(neck,9.4,P.torsoLean*.56+P.headLag);
  const axisX=Math.sin(P.torsoLean),axisY=-Math.cos(P.torsoLean);
  const sideX=Math.cos(P.torsoLean),sideY=Math.sin(P.torsoLean);

  x.save();

  // World-space contact shadow stays planted while the articulated body jumps and dives.
  if(!P.digging||P.u<.83){
    const air=Math.max(0,43-pelvis.y),fade=P.digging?1-Math.max(0,(P.u-.68)/.22):1;
    x.globalAlpha=.24*Math.max(0,fade);x.fillStyle='#111';
    x.beginPath();x.ellipse(32,59,Math.max(5,15-air*.18),3,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  }

  // Legs are three-joint chains. Walking, bracing and the trailing dive all use distinct poses.
  let kneeL,footL,kneeR,footR;
  if(P.digging){
    const trail=P.launch+P.enter;
    kneeL={x:pelvis.x+5+trail*6,y:pelvis.y+7-trail*7};
    footL={x:pelvis.x+10+trail*10,y:pelvis.y+14-trail*13};
    kneeR={x:pelvis.x-1+trail*7,y:pelvis.y+8-trail*5};
    footR={x:pelvis.x+5+trail*13,y:pelvis.y+15-trail*10};
  }else if(P.eating||P.rising){
    const brace=P.armReach||0;
    kneeL={x:pelvis.x-5-brace*2,y:pelvis.y+8};footL={x:pelvis.x-10-brace*2,y:pelvis.y+15};
    kneeR={x:pelvis.x+6,y:pelvis.y+8};footR={x:pelvis.x+10,y:pelvis.y+15};
  }else{
    // A narrow, forward-facing gait: one foot plants while the other lifts and passes it.
    kneeL={x:pelvis.x-2.2-step*2.8,y:pelvis.y+8-liftL*2.2};footL={x:pelvis.x-2.5-step*6.2,y:pelvis.y+15-liftL*4.4};
    kneeR={x:pelvis.x+2.2+step*2.8,y:pelvis.y+8-liftR*2.2};footR={x:pelvis.x+2.5+step*6.2,y:pelvis.y+15-liftR*4.4};
  }
  x.lineCap='round';x.lineJoin='round';x.strokeStyle='#17282d';x.lineWidth=7;
  x.beginPath();x.moveTo(pelvis.x-3,pelvis.y);x.lineTo(kneeL.x,kneeL.y);x.lineTo(footL.x+2,footL.y-1);
  x.moveTo(pelvis.x+3,pelvis.y);x.lineTo(kneeR.x,kneeR.y);x.lineTo(footR.x-2,footR.y-1);x.stroke();
  x.strokeStyle='#241d19';x.lineWidth=4.6;
  x.beginPath();x.moveTo(footL.x-5,footL.y);x.lineTo(footL.x+3,footL.y);x.moveTo(footR.x-5,footR.y);x.lineTo(footR.x+3,footR.y);x.stroke();

  // Torso is built on the pelvis-to-shoulder axis, so hips, chest and shoulders bend continuously.
  const sl={x:shoulder.x-sideX*8.6,y:shoulder.y-sideY*8.6};
  const sr={x:shoulder.x+sideX*8.6,y:shoulder.y+sideY*8.6};
  const pl={x:pelvis.x-sideX*7.2,y:pelvis.y-sideY*7.2};
  const pr={x:pelvis.x+sideX*7.2,y:pelvis.y+sideY*7.2};
  x.fillStyle='#765142';x.strokeStyle='#322822';x.lineWidth=1.2;
  x.beginPath();x.moveTo(sl.x,sl.y);x.quadraticCurveTo(shoulder.x+axisX*2,shoulder.y+axisY*2,sr.x,sr.y);
  x.lineTo(pr.x,pr.y);x.quadraticCurveTo(pelvis.x,pelvis.y+2,pl.x,pl.y);x.closePath();x.fill();x.stroke();
  const bibTop=joint(pelvis,11.5,P.torsoLean);
  x.fillStyle='#314b56';x.strokeStyle='#182c33';
  x.beginPath();x.moveTo(bibTop.x-sideX*5.7,bibTop.y-sideY*5.7);x.lineTo(bibTop.x+sideX*5.7,bibTop.y+sideY*5.7);
  x.lineTo(pr.x,pr.y);x.quadraticCurveTo(pelvis.x,pelvis.y+2,pl.x,pl.y);x.closePath();x.fill();x.stroke();
  x.strokeStyle='#496b77';x.lineWidth=2.5;
  x.beginPath();x.moveTo(sl.x+sideX*2,sl.y+sideY*2);x.lineTo(bibTop.x-sideX*3.8,bibTop.y-sideY*3.8);
  x.moveTo(sr.x-sideX*2,sr.y-sideY*2);x.lineTo(bibTop.x+sideX*3.8,bibTop.y+sideY*3.8);x.stroke();

  // Arm targets are state-specific. The front arm visibly reaches the plant during eating;
  // both hands spear ahead before the dive, with elbows following instead of teleporting.
  const frontShoulder={x:sl.x+axisX*P.shoulderRoll*.25,y:sl.y+P.shoulderRoll};
  const rearShoulder={x:sr.x-axisX*P.shoulderRoll*.18,y:sr.y-P.shoulderRoll*.72};
  let frontHand,rearHand,frontElbow,rearElbow;
  if(P.digging){
    frontHand={x:head.x-9-8*P.diveReach,y:head.y+7+2*P.enter};
    rearHand={x:head.x-5-7*P.diveReach,y:head.y+12+3*P.enter};
    frontElbow={x:(frontShoulder.x+frontHand.x)*.5-3*P.diveReach,y:(frontShoulder.y+frontHand.y)*.5+3};
    rearElbow={x:(rearShoulder.x+rearHand.x)*.5+1,y:(rearShoulder.y+rearHand.y)*.5+4};
  }else if(P.eating){
    const wind=P.attackWind*(1-P.attackDrop)*(1-P.attackRecover);
    const strike=P.attackDrop*(1-P.attackRecover);
    frontHand={x:frontShoulder.x-4+wind*6-strike*13,y:frontShoulder.y+12-wind*21-strike*2};
    rearHand={x:rearShoulder.x+4-wind*2-strike*14,y:rearShoulder.y+13-wind*18-strike*1};
    frontElbow={x:(frontShoulder.x+frontHand.x)*.5-3*strike,y:(frontShoulder.y+frontHand.y)*.5};
    rearElbow={x:(rearShoulder.x+rearHand.x)*.5+2*wind,y:(rearShoulder.y+rearHand.y)*.5};
  }else{
    const swing=Math.sin(P.phase)*4;
    frontHand={x:frontShoulder.x-4+swing,y:frontShoulder.y+13};
    rearHand={x:rearShoulder.x+4-swing,y:rearShoulder.y+13};
    frontElbow={x:frontShoulder.x-6+swing*.45,y:frontShoulder.y+6};
    rearElbow={x:rearShoulder.x+6-swing*.45,y:rearShoulder.y+6};
  }

  // Both hands drive the pickaxe during the attack; digging keeps the same connected grip.
  const toolHand=P.eating?frontHand:(P.digging?{x:(frontHand.x+rearHand.x)*.5,y:(frontHand.y+rearHand.y)*.5}:rearHand);
  const toolAngle=P.eating?(-1.28+P.attackDrop*1.92-P.attackRecover*.62):(P.digging?(-1.15+.20*P.diveReach+.16*P.enter):(-.58+step*.14));
  x.save();x.translate(toolHand.x,toolHand.y);x.rotate(toolAngle);
  x.strokeStyle='#704b2b';x.lineWidth=3;x.beginPath();x.moveTo(-1,-2);x.lineTo(2,23);x.stroke();
  x.strokeStyle='#4d5557';x.lineWidth=3.2;x.beginPath();x.moveTo(-10,-2);x.quadraticCurveTo(0,-7,11,-2);x.stroke();x.restore();

  x.strokeStyle='#252c27';x.lineWidth=6;
  x.beginPath();x.moveTo(frontShoulder.x,frontShoulder.y);x.lineTo(frontElbow.x,frontElbow.y);x.lineTo(frontHand.x,frontHand.y);
  x.moveTo(rearShoulder.x,rearShoulder.y);x.lineTo(rearElbow.x,rearElbow.y);x.lineTo(rearHand.x,rearHand.y);x.stroke();
  x.strokeStyle='#687461';x.lineWidth=3.8;
  x.beginPath();x.moveTo(frontShoulder.x,frontShoulder.y);x.lineTo(frontElbow.x,frontElbow.y);x.lineTo(frontHand.x,frontHand.y);
  x.moveTo(rearShoulder.x,rearShoulder.y);x.lineTo(rearElbow.x,rearElbow.y);x.lineTo(rearHand.x,rearHand.y);x.stroke();

  // The pickaxe impact travels back through the head and chest.
  const headKick=P.toolImpact*2.4;
  x.save();x.translate(head.x+headKick,head.y-P.toolImpact*.7);x.rotate(P.torsoLean*.52+P.headLag);
  x.fillStyle='#66725f';x.strokeStyle='#20261f';x.lineWidth=1.4;
  x.beginPath();x.moveTo(-7,-8);x.bezierCurveTo(1,-11,9,-7,8,1);x.bezierCurveTo(8,8,4,11,-2,12);x.bezierCurveTo(-9,11,-12,5,-10,-2);x.closePath();x.fill();x.stroke();

  // Small, hooded, asymmetric eyes: animation comes from lids and gaze, not giant rolling whites.
  const blink=(!P.eating&&!P.digging&&Math.sin(P.phase*.5+z.id)>.965)?.30:1;
  const eye=(ex,ey,rx,ry,lid,gazeScale)=>{
    x.save();x.beginPath();x.ellipse(ex,ey,rx,Math.max(.35,ry*blink),0,0,Math.PI*2);x.clip();
    x.fillStyle='#d8d2b9';x.fillRect(ex-rx-1,ey-ry-1,rx*2+2,ry*2+2);
    x.fillStyle='#1c211b';x.beginPath();x.arc(ex+P.gazeX*gazeScale,ey+P.gazeY*.45,.72,0,Math.PI*2);x.fill();
    x.restore();
    x.fillStyle='#66725f';x.fillRect(ex-rx-1,ey-ry-1,rx*2+2,Math.max(.45,lid));
  };
  eye(-3.6,-1.0,2.35,1.65,1.25,1);eye(3.2,-1.8,2.05,1.42,1.52,.82);
  x.strokeStyle='#30382e';x.lineWidth=1.15;x.beginPath();x.moveTo(-6.4,-3.0);x.quadraticCurveTo(-3.8,-4.2,-1.5,-3.1);
  x.moveTo(1.0,-3.7);x.quadraticCurveTo(3.0,-4.8,5.2,-3.4);x.stroke();

  // Closed, grim mouth; the pickaxe carries the attack instead of a bite.
  x.fillStyle='#2b2520';x.beginPath();x.moveTo(-4.8,6.4);x.quadraticCurveTo(.2,5.1,5.1,6.5);
  x.quadraticCurveTo(.4,9.0,-4.5,7.8);x.closePath();x.fill();
  x.strokeStyle='#171a16';x.lineWidth=1;x.beginPath();x.moveTo(-3.8,7.0);x.quadraticCurveTo(.2,8.0,4.0,7.0);x.stroke();

  // Helmet remains attached to the skull through every lean, strike and dive.
  x.fillStyle='#c69a2c';x.strokeStyle='#45371d';x.beginPath();x.arc(0,-8,10,Math.PI,Math.PI*2);x.lineTo(11,-7);x.lineTo(-11,-7);x.closePath();x.fill();x.stroke();
  x.fillStyle='#e6b83b';x.fillRect(-12,-8,24,2.5);
  x.fillStyle='#f3e8aa';x.strokeStyle='#5a4b28';x.beginPath();x.arc(-7,-9,3.1,0,Math.PI*2);x.fill();x.stroke();
  x.restore();

  // Soil contact follows the hands/head entry; the trailing knees and feet remain visible until last.
  if(P.digging&&P.u>.60){
    const q=Math.min(1,(P.u-.60)/.40);x.fillStyle='rgba(91,65,40,.88)';
    for(let i=0;i<9;i++){const a=i*.83+gameTime*5,r=4+q*19;x.beginPath();x.arc(22+Math.cos(a)*r,58-Math.abs(Math.sin(a))*r*.48,1.2+(i%3),0,Math.PI*2);x.fill();}
  }
  x.restore();
}
function drawMinerMound(x,z){
  x.save();
  const t=gameTime,seed=(z.id||1)*1.731;
  const rising=z.digState==='rising';
  const speedPulse=.5+.5*Math.sin(t*15+seed);
  const heave=Math.sin(t*11+seed)*1.6;
  const squash=1+Math.sin(t*13+seed)*.055;
  const cx=32,ground=48;

  // Soft disturbed-earth shadow: anchors the effect to the lawn.
  x.fillStyle='rgba(20,15,9,.24)';
  x.beginPath();x.ellipse(cx+2,ground+5,25,5.2,0,0,Math.PI*2);x.fill();

  // During the 0.82 s emergence the same articulated miner rises through a moving
  // soil mask: head, shoulders, waist, knees and feet become visible in sequence.
  if(rising){
    const ru=Math.max(0,Math.min(1,(z.digAge||0)/.82));
    const rise=minerEase(ru),soilLine=ground+12*rise;
    x.save();x.beginPath();x.rect(0,0,64,soilLine);x.clip();
    x.translate(0,(1-rise)*45);
    drawMinerZombie(x,{...z,digState:'emergingPose',risePose:ru,eatMode:null},0);
    x.restore();
  }

  // A short wake behind the moving mound. Individual clods lag instead of translating as one sprite.
  for(let i=0;i<7;i++){
    const age=((t*1.55+i*.173+seed*.07)%1);
    const bx=cx+12+age*22;
    const by=ground+1-Math.sin(age*Math.PI)*3.5;
    const rr=(1-age)*(2.7+(i%3)*.65);
    x.globalAlpha=.48*(1-age);
    x.fillStyle=i%2?'#5b4028':'#765235';
    x.beginPath();x.ellipse(bx,by,Math.max(.5,rr*1.45),Math.max(.4,rr),-.25,0,Math.PI*2);x.fill();
  }
  x.globalAlpha=1;

  // Lower dark soil first, then a highlighted crest. The asymmetry makes it read as a rolling soil wave.
  x.save();x.translate(cx,ground+heave);x.scale(squash,1/squash);
  x.fillStyle='#3b2b1e';x.strokeStyle='#251c15';x.lineWidth=1.25;
  x.beginPath();x.moveTo(-24,4);
  x.bezierCurveTo(-19,-2,-13,-1,-9,-7);
  x.bezierCurveTo(-4,-13,4,-13,9,-8);
  x.bezierCurveTo(14,-4,19,-5,24,3);
  x.quadraticCurveTo(10,9,-24,4);x.closePath();x.fill();x.stroke();

  x.fillStyle='#6d4c30';
  x.beginPath();x.moveTo(-19,2);x.bezierCurveTo(-13,-3,-8,-2,-5,-7);
  x.bezierCurveTo(1,-11,8,-8,11,-4);x.bezierCurveTo(15,-2,17,0,19,3);
  x.quadraticCurveTo(2,6,-19,2);x.fill();

  x.fillStyle='rgba(153,111,68,.55)';
  x.beginPath();x.ellipse(-3,-6,8,2.3,-.12,0,Math.PI*2);x.fill();

  // Broken turf plates along the crest.
  x.fillStyle='#7f5b39';
  for(let i=0;i<5;i++){
    const px=-15+i*7+Math.sin(t*9+i+seed)*1.2;
    const py=-2-Math.abs(Math.sin(t*8+i*.8+seed))*4;
    x.save();x.translate(px,py);x.rotate(Math.sin(t*6+i)*.45);
    x.fillRect(-2.4,-1.2,4.8,2.4);x.restore();
  }
  x.restore();

  // Front lip repeatedly bursts open. These particles use ballistic arcs, not a shared translation.
  for(let i=0;i<12;i++){
    const cycle=(t*(1.55+(i%3)*.16)+i*.119+seed)%1;
    const life=cycle;
    const dir=-1; // zombie travels left while underground
    const launchX=cx-14+((i%4)-1.5)*2.1;
    const vx=dir*(8+(i%5)*3.2);
    const vy=-(11+(i%4)*3.5);
    const px=launchX+vx*life;
    const py=ground-4+vy*life+20*life*life;
    const size=Math.max(.65,(1-life)*(1.7+(i%3)*.8));
    x.globalAlpha=Math.max(0,1-life*.92);
    x.fillStyle=i%3===0?'#8a623e':(i%3===1?'#60442c':'#a27447');
    x.save();x.translate(px,py);x.rotate((t*7+i)*1.4);
    x.beginPath();x.moveTo(-size,-size*.6);x.lineTo(size*.8,-size);x.lineTo(size,size*.65);x.lineTo(-size*.7,size);x.closePath();x.fill();
    x.restore();
  }
  x.globalAlpha=1;

  // Fine grit spray at the leading edge.
  for(let i=0;i<16;i++){
    const q=(t*(2.4+(i%4)*.12)+i*.071+seed*.3)%1;
    const px=cx-12-q*(10+(i%5)*2.4);
    const py=ground-3-Math.sin(q*Math.PI)*(5+(i%4)*2)+Math.sin(i*3.1)*1.2;
    x.globalAlpha=(1-q)*.65;
    x.fillStyle=i%2?'#9a7047':'#513925';
    x.fillRect(px,py,1+(i%2),1+(i%3===0));
  }
  x.globalAlpha=1;

  // Cracks flicker underneath and slightly behind the mound, giving the soil a tearing rather than sliding motion.
  x.strokeStyle='rgba(45,31,20,.82)';x.lineWidth=1.15;
  for(let i=0;i<4;i++){
    const q=(t*.72+i*.23+seed*.11)%1;
    const ox=8+q*27;
    x.globalAlpha=(1-q)*.72;
    x.beginPath();x.moveTo(cx+ox,ground+1);
    x.lineTo(cx+ox+3,ground+4);x.lineTo(cx+ox+7,ground+2);x.lineTo(cx+ox+10,ground+5);x.stroke();
  }
  x.globalAlpha=1;

  // Every so often one larger clod pops high, making the underground travel readable even at a glance.
  const big=(t*.82+seed)%1;
  if(big<.72){
    const q=big/.72,px=cx-10-22*q,py=ground-7-18*Math.sin(q*Math.PI)+5*q;
    x.save();x.translate(px,py);x.rotate(q*7+seed);
    x.fillStyle='#6a492e';x.strokeStyle='#3c2a1c';x.lineWidth=.8;
    x.beginPath();x.moveTo(-3,-2);x.lineTo(2,-3);x.lineTo(4,1);x.lineTo(0,3);x.lineTo(-4,1);x.closePath();x.fill();x.stroke();x.restore();
  }

  // The mound heaves and spits dirt around the continuously emerging body.
  if(rising){
    const ru=Math.max(0,Math.min(1,(z.digAge||0)/.82));
    const pulse=Math.sin(Math.min(1,ru/.72)*Math.PI);
    for(let i=0;i<10;i++){
      const ang=-Math.PI*.88+i*(Math.PI*.76/9);
      const rr=(8+20*pulse)*(1+(i%3)*.08);
      const px=cx+Math.cos(ang)*rr,py=ground+Math.sin(ang)*rr-10*pulse;
      x.globalAlpha=.25+.75*(1-ru);x.fillStyle=i%2?'#815a38':'#5b4029';
      x.beginPath();x.arc(px,py,2.4+(i%3),0,Math.PI*2);x.fill();
    }
    x.globalAlpha=1;
  }

  x.restore();
}
function drawCargoArticulated(x,z,drawBase){
 const s=z.bossSlide,src=document.createElement('canvas');src.width=64;src.height=64;const b=src.getContext('2d');b.imageSmoothingEnabled=false;drawBase(b);
 const p=s.phase,q=p==='dive'?Math.min(1,s.phaseAge/s.diveDur):p==='impact'?Math.min(1,s.phaseAge/.18):p==='tumble'?Math.min(1,s.phaseAge/1.30):p==='roll'?Math.min(1,s.phaseAge/.64):p==='brace'?Math.min(1,s.phaseAge/.72):Math.min(1,s.phaseAge/1.42);
 let curl=0,head=0,ll=0,rl=0,reach=0;
 if(p==='dive'){curl=.28*Math.sin(q*Math.PI);head=-.14*(1-q);ll=.34*(1-q);rl=-.22*(1-q);reach=.9;}else if(p==='impact'){curl=.48*(1-q);head=.28*(1-q);ll=-.36;rl=.29;reach=1;}else if(p==='tumble'){curl=-.34*Math.sin(q*Math.PI);head=-.22*Math.sin(q*Math.PI*1.35);ll=.52*Math.sin(q*Math.PI*2);rl=-.46*Math.sin(q*Math.PI*2+.8);reach=.72*(1-q);}else if(p==='roll'){curl=.30*Math.sin(q*Math.PI);head=-.16*Math.sin(q*Math.PI);ll=-.42;rl=.30;reach=.48;}else if(p==='brace'){curl=.44*(1-q);head=.18*(1-q);ll=-.62+.30*q;rl=.44-.18*q;reach=1;}else{curl=.34*(1-q);head=.12*(1-q);ll=-.34*(1-q);rl=.27*(1-q);reach=1-q*.65;}
 const part=(sx,sy,sw,sh,px,py,a,dx=0,dy=0)=>{x.save();x.translate(px+dx,py+dy);x.rotate(a);x.translate(-px,-py);x.beginPath();x.rect(sx,sy,sw,sh);x.clip();x.drawImage(src,0,0);x.restore();};
 x.save();x.translate(32,34);x.rotate((s.angle||0)*Math.PI/180);x.translate(-32,-34);part(4,38,29,26,27,42,ll,0,Math.abs(Math.sin(ll))*1.5);part(31,38,29,26,37,42,rl,0,Math.abs(Math.sin(rl))*1.5);part(7,20,50,31,32,43,curl);part(9,0,46,31,32,26,curl+head,Math.sin(curl)*2,-Math.abs(curl)*2);
 x.strokeStyle='#667b55';x.lineWidth=4.2;x.lineCap='round';x.lineJoin='round';const hy=p==='dive'?25:55,sp=10+reach*10;x.beginPath();x.moveTo(24,28);x.quadraticCurveTo(18,38,32-sp,hy);x.moveTo(40,29);x.quadraticCurveTo(45,39,32+sp,hy);x.stroke();x.fillStyle='#526747';x.beginPath();x.arc(32-sp,hy,2.7,0,Math.PI*2);x.arc(32+sp,hy,2.7,0,Math.PI*2);x.fill();x.restore();
 if((s.impactPulse||0)>0){const u=1-Math.min(1,s.impactPulse/.20);x.save();x.globalAlpha=1-u;x.fillStyle='#8b704d';for(let i=0;i<6;i++){const a=-2.8+i*.34,r=5+u*(8+i*2);x.beginPath();x.arc(32+Math.cos(a)*r,58+Math.sin(a)*r,Math.max(.7,1.7-u*.7),0,Math.PI*2);x.fill();}x.restore();}
}
const NORMAL_ZOMBIE_SPRITES={
  walk:{src:'assets/sprites/zombies/normal-walk.png?v=2026.10.03.14',cols:12,rows:1,frames:12},
  bite:{src:'assets/sprites/zombies/normal-bite.png?v=2026.10.03.14',cols:8,rows:1,frames:8},
  lunge:{src:'assets/sprites/zombies/normal-lunge.png?v=2026.10.03.14',cols:4,rows:2,frames:8},
  reactions:{src:'assets/sprites/zombies/normal-reactions.png?v=2026.10.03.14',cols:20,rows:1,frames:20},
  damage:{src:'assets/sprites/zombies/normal-damage.png?v=2026.10.03.14',cols:3,rows:1,frames:3}
};
for(const sheet of Object.values(NORMAL_ZOMBIE_SPRITES)){sheet.image=new Image();sheet.image.decoding='async';sheet.bounds=[];sheet.image.addEventListener('load',()=>{sheet.bounds.length=0;if(typeof render==='function')render();},{once:true});sheet.image.src=sheet.src;}
function normalZombieFrameBounds(sheet,index){
  if(sheet.bounds[index])return sheet.bounds[index];
  const img=sheet.image;if(!img.complete||!img.naturalWidth)return null;
  const cw=img.naturalWidth/sheet.cols,ch=img.naturalHeight/sheet.rows,col=index%sheet.cols,row=Math.floor(index/sheet.cols);
  const scan=document.createElement('canvas');scan.width=Math.max(1,Math.ceil(cw));scan.height=Math.max(1,Math.ceil(ch));
  const g=scan.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;
  g.drawImage(img,col*cw,row*ch,cw,ch,0,0,scan.width,scan.height);
  const data=g.getImageData(0,0,scan.width,scan.height).data;let minX=scan.width,minY=scan.height,maxX=-1,maxY=-1;
  for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(data[(y*scan.width+x)*4+3]>18){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  const b=maxX<0?{x:0,y:0,w:scan.width,h:scan.height}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  sheet.bounds[index]=b;return b;
}
function drawNormalZombieSpriteFrame(ctx,key,index){
  const sheet=NORMAL_ZOMBIE_SPRITES[key],img=sheet?.image;if(!sheet||!img.complete||!img.naturalWidth)return false;
  index=Math.max(0,Math.min(sheet.frames-1,Math.floor(index)));
  const cw=img.naturalWidth/sheet.cols,ch=img.naturalHeight/sheet.rows,col=index%sheet.cols,row=Math.floor(index/sheet.cols);
  const b=normalZombieFrameBounds(sheet,index);if(!b)return false;
  const fitW=key==='lunge'?54:48,fitH=key==='lunge'?50:55;
  const scale=Math.min(fitW/b.w,fitH/b.h),dw=b.w*scale,dh=b.h*scale;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Supplied art faces right; gameplay approaches plants on the left.
  ctx.translate(64,0);ctx.scale(-1,1);
  ctx.drawImage(img,col*cw+b.x,row*ch+b.y,b.w,b.h,32-dw/2,63-dh,dw,dh);
  ctx.restore();return true;
}
function drawNormalZombieSprite(ctx,z,bitePhase=0){
  const hit=(z.hitStun||0)>0;
  ctx.save();
  if(hit)ctx.translate(-Math.min(2.2,z.hitStun*7),0);
  let drawn=false;
  if((z.lungeTime||0)>0){
    const u=Math.max(0,Math.min(1,1-z.lungeTime/(z.lungeDuration||1.5)));
    drawn=drawNormalZombieSpriteFrame(ctx,'lunge',Math.min(7,Math.floor(u*8)));
  }else if(z.eatMode||z.eating){
    drawn=drawNormalZombieSpriteFrame(ctx,'bite',Math.min(7,Math.floor(Math.max(0,bitePhase)*8)));
  }else{
    const stage=z.hp<=z.maxHp/3?2:(z.hp<=z.maxHp*2/3?1:0);
    if(stage>0)drawn=drawNormalZombieSpriteFrame(ctx,'damage',stage);
    else drawn=drawNormalZombieSpriteFrame(ctx,'walk',Math.floor((gameTime*7.5+(z.id||0)*.37)%12));
  }
  if(!drawn)drawn=drawNormalZombieSpriteFrame(ctx,'damage',0);
  ctx.restore();
  return drawn;
}
function drawZombie(x,cone,f=0,eatMode=null,hurt=false,armGone=false,lunge=0,bitePhase=0,hitStun=0,bucketHp=0,plainModel=true,damageStage=0){
  const front=eatMode==='front', vertical=eatMode==='vertical';
  // The unarmoured walker has its own art direction; cone/bucket/brain variants keep their established silhouettes.
  const plain=plainModel&&!cone&&bucketHp<=0;
  const idleMode=f==null;
  const woundStage=plain?Math.max(0,Math.min(2,damageStage||0)):0;
  const torn=woundStage>=1,critical=woundStage>=2;
  // One readable bite cycle: approach -> open -> clamp -> pull back. Damage timing stays independent.
  const bp=(front||vertical)?Math.max(0,Math.min(1,bitePhase)):0;
  // Eight-key-pose bite supplied by the artist: brace, lift/open, dive, clamp, tear, recoil, reset.
  const poseSample=points=>{
    if(!(front||vertical))return 0;
    for(let i=1;i<points.length;i++)if(bp<=points[i][0]){
      const a=points[i-1],b=points[i],u=(bp-a[0])/(b[0]-a[0]||1);
      const s=u*u*(3-2*u);return a[1]+(b[1]-a[1])*s;
    }
    return points[points.length-1][1];
  };
  const biteReach=poseSample([[0,0],[.13,0],[.27,2.2],[.40,7.6],[.52,9.4],[.65,8.2],[.82,3.4],[1,0]]);
  const jawOpen=poseSample([[0,0],[.13,.12],[.27,1],[.40,.92],[.48,.18],[.58,.05],[.72,.72],[.84,.18],[1,0]]);
  const biteClamp=(front||vertical)&&((bp>=.43&&bp<.62)||(bp>=.78&&bp<.86));
  const biteBody=poseSample([[0,0],[.13,.4],[.27,2.5],[.40,6.3],[.52,7.4],[.65,6.6],[.82,3.0],[1,0]]);
  const biteDrop=poseSample([[0,0],[.13,-.6],[.27,-.2],[.40,3.2],[.52,4.8],[.65,3.7],[.82,1.2],[1,0]]);
  const biteHeadDrop=poseSample([[0,0],[.13,-1.2],[.27,-.4],[.40,4.4],[.52,7.2],[.65,5.5],[.82,2.0],[1,0]]);
  const biteHeadRoll=poseSample([[0,0],[.13,-.05],[.27,-.12],[.40,.11],[.52,.22],[.65,.12],[.82,.04],[1,0]]);
  const biteArmReach=poseSample([[0,.08],[.13,.12],[.27,.38],[.40,.82],[.52,1],[.65,.88],[.82,.45],[1,.08]]);
  const leapDur=1.50, lp=Math.max(0,Math.min(leapDur,lunge)), prog=lp>0?1-lp/leapDur:0;
  let crouch=0,air=0,lean=0,lungeCurl=0,lungeReach=0,lungeImpact=0;
  if(lp>0){
    if(prog<.18){const q=prog/.18;crouch=q*3.2;lean=q*1.2;lungeCurl=q*.08;lungeReach=q*.18;}
    else if(prog<.40){const q=(prog-.18)/.22;crouch=3.2+q*9.0;lean=1.2+q*3.2;lungeCurl=.08+q*.22;lungeReach=.18+q*.35;}
    else if(prog<.58){const q=(prog-.40)/.18;crouch=12.2*(1-q);air=-Math.sin(q*Math.PI*.72)*10.5;lean=4.4+q*7.5;lungeCurl=.30*(1-q);lungeReach=.53+q*.47;}
    else if(prog<.80){const q=(prog-.58)/.22;air=-10.5+q*7.0;lean=11.9;lungeCurl=-.04+q*.10;lungeReach=1;}
    else if(prog<.90){const q=(prog-.80)/.10;crouch=5.0+q*7.5;lean=11.9-q*2.2;lungeCurl=.06+q*.34;lungeReach=1-q*.20;lungeImpact=Math.sin(q*Math.PI);}
    else{const q=(prog-.90)/.10;crouch=12.5*(1-q);lean=9.7*(1-q);lungeCurl=.40*(1-q);lungeReach=.80*(1-q);}
  }
  // Normal-zombie pea hit is articulated above the hips; do not shove the whole body like a rigid board.
  const recoil=(hurt&&hitStun<=0)?2.2:0;
  let hitTorso=0,hitHead=0,hitStretch=0,hitShear=0;
  if(hitStun>0){
    const u=Math.max(0,Math.min(1,1-hitStun/.40));
    // 0-.14 impact: waist folds fast. .14-.48: chest hangs back. .48-.84: core snaps forward with a tiny overshoot.
    if(u<.14){const q=u/.14;hitTorso=1-Math.pow(1-q,3);}
    else if(u<.48){const q=(u-.14)/.34;hitTorso=1-.10*q+.035*Math.sin(q*Math.PI);}
    else if(u<.84){const q=(u-.48)/.36;hitTorso=(1-q)*.90-q*.13;}
    else{const q=(u-.84)/.16;hitTorso=-.13*(1-q);}
    // Head/shoulders trail the waist, then whip through slightly later.
    const hu=Math.max(0,u-.055);
    if(hu<.16)hitHead=(hu/.16);
    else if(hu<.56)hitHead=1-.08*((hu-.16)/.40);
    else if(hu<.90){const q=(hu-.56)/.34;hitHead=(1-q)*.92-q*.18;}
    else hitHead=-.18*Math.max(0,1-(hu-.90)/.10);
    hitStretch=Math.min(1,Math.abs(hitTorso));
    hitShear=.055*hitTorso;
  }
  // Base vertical offset for the whole zombie. This was accidentally dropped in the previous gait rewrite.
  const oy=crouch+air;
  // Deliberate forward-stepping gait.
  // Zombies travel LEFT on the lawn, so a swinging foot must visibly lift and reach LEFT,
  // then stay planted while the pelvis moves past it. This removes the old moonwalk/back-step read.
  // Twelve authored walking phases; idle uses its own six-pose breathing/sway loop.
  const gp=lp>0?.48:(idleMode?0:(((f||0)%1+1)%1)), walkFrame=Math.floor(gp*12)%12, cyc=gp*Math.PI*2;
  const idleFrame=idleMode?(Math.floor(gameTime*4.2)%6):0,idleCyc=idleFrame/6*Math.PI*2;
  const smooth=t=>t*t*(3-2*t);
  const bob=idleMode?(Math.sin(idleCyc)*.32):((.5-.5*Math.cos(cyc*2))*.72);
  const hipSway=idleMode?0:Math.sin(cyc)*.72;
  const oy2=oy+bob, hipY=38+oy2;
  const legPose=(phase,side)=>{
    const q=(gp+phase)%1;
    let footOff=0,lift=0,kneeLead=0,kneeLift=0,heel=0;

    // 0.00-0.12: toe-off. Rear foot peels off the turf.
    if(q<.12){
      const u=smooth(q/.12);
      footOff=6.0-3.2*u; lift=2.7*u; kneeLead=-1.6*u; kneeLift=2.4*u; heel=u;
    }
    // 0.12-0.38: leg swings forward (screen-left). Knee leads first.
    else if(q<.38){
      const u=smooth((q-.12)/.26);
      footOff=2.8-10.8*u; lift=2.7+3.0*Math.sin(u*Math.PI*.82);
      kneeLead=-1.6-5.0*Math.sin(u*Math.PI); kneeLift=2.4+4.1*Math.sin(u*Math.PI); heel=1;
    }
    // 0.38-0.50: lower leg extends and heel reaches for the next step.
    else if(q<.50){
      const u=smooth((q-.38)/.12);
      footOff=-8.0-2.5*u; lift=4.4*(1-u);
      kneeLead=-3.8*(1-u)-1.0*u; kneeLift=3.0*(1-u); heel=1-u;
    }
    // 0.50-0.58: heel strike -> full sole contact. Tiny compression gives weight.
    else if(q<.58){
      const u=smooth((q-.50)/.08);
      footOff=-10.5+1.0*u; lift=0;
      kneeLead=-1.0+1.4*u; kneeLift=-1.0*Math.sin(u*Math.PI); heel=0;
    }
    // 0.58-1.00: stance. Foot stays on the ground while the body advances LEFT past it.
    else{
      const u=smooth((q-.58)/.42);
      footOff=-9.5+15.5*u; lift=0;
      kneeLead=.4+1.2*u; kneeLift=0; heel=0;
    }

    const hipX=32+side*3.6+hipSway*.30;
    const footX=hipX+footOff, footY=59+oy2-lift;
    // Knee bends strongly during swing, then straightens before heel strike.
    const kneeX=hipX+footOff*.42+kneeLead+side*.38;
    const kneeY=49+oy2-kneeLift-lift*.18;
    return {hipX,footX,footY,kneeX,kneeY,heel};
  };
  const L=legPose(0,-1), R=legPose(.5,1);
  if(lp>0){
    const tuck=Math.sin(Math.min(1,Math.max(0,(prog-.38)/.48))*Math.PI);
    L.kneeX+=2.5*tuck;L.kneeY-=5.5*tuck;L.footX+=5.0*tuck;L.footY-=4.0*tuck;
    R.kneeX-=1.5*tuck;R.kneeY-=4.0*tuck;R.footX+=2.5*tuck;R.footY-=5.5*tuck;
  }
  x.save(); x.translate(-lean+recoil,lungeImpact*1.4); x.rotate(-.045-lean*.006+lungeCurl);
  x.globalAlpha=.25;x.fillStyle='#141b15';x.beginPath();x.ellipse(32,60.3+oy,14.5,3.0,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
  // Long legs use a dark silhouette pass plus an inner material pass.
  x.lineCap='round'; x.strokeStyle='#171b18'; x.lineWidth=6.3; x.beginPath();
  x.moveTo(L.hipX,hipY);x.lineTo(L.kneeX,L.kneeY);x.lineTo(L.footX,L.footY);
  x.moveTo(R.hipX,hipY);x.lineTo(R.kneeX,R.kneeY);x.lineTo(R.footX,R.footY);x.stroke();
  x.strokeStyle='#485047'; x.lineWidth=4.0; x.beginPath();
  x.moveTo(L.hipX,hipY);x.lineTo(L.kneeX,L.kneeY);x.lineTo(L.footX,L.footY);
  x.moveTo(R.hipX,hipY);x.lineTo(R.kneeX,R.kneeY);x.lineTo(R.footX,R.footY);x.stroke();
  // Feet: toe points in travel direction (left); during swing the heel lifts,
  // then the sole flattens on contact so every step has a readable landing.
  x.strokeStyle='#181b18';x.lineWidth=3.2;x.beginPath();
  x.moveTo(L.footX+3.2,L.footY-L.heel*1.8);x.lineTo(L.footX-4.9,L.footY);
  x.moveTo(R.footX+3.2,R.footY-R.heel*1.8);x.lineTo(R.footX-4.9,R.footY);x.stroke();
  // Upper body bends from the waist while the legs stay planted. This is the soft 'noodle' hit reaction.
  x.save();
  // Shoulder/chest inertia follows the 12-step leg cycle; the six-frame idle breath is quieter and slower.
  const torsoCycle=idleMode?Math.sin(idleCyc)*.018:Math.sin(cyc-.48)*.040;
  x.translate(32,39+oy2);x.rotate(torsoCycle);x.translate((idleMode?Math.sin(idleCyc)*.22:Math.sin(cyc-.9)*.55),0);x.translate(-32,-39-oy2);
  if(hitStun>0){
    const waistX=32,waistY=39+oy2;
    x.translate(waistX,waistY);
    x.rotate(hitTorso*.235);
    x.transform(1-hitStretch*.035,0,hitShear,1+hitStretch*.050,0,0);
    x.translate(-waistX,-waistY);
  }
  x.translate(-biteBody,biteDrop);
  if(front||vertical) x.rotate(-biteBody*.010);
  // Torn trousers and the normal walker's long, filthy off-white work shirt.
  fillPath(x,plain?'#29272a':'#252b29',[[25,35+oy2],[39,35+oy2],[40,43+oy2],[35,42+oy2],[32,46+oy2],[28,42+oy2],[23,43+oy2]]);
  fillPath(x,'#1c211d',[[24,22+oy2],[39,21+oy2],[43,35+oy2],[37,41+oy2],[26,40+oy2],[20,31+oy2]]);
  fillPath(x,plain?'#aaa398':'#52594f',[[25,23+oy2],[38,22+oy2],[42,35+oy2],[38,43+oy2],[33,41+oy2],[29,46+oy2],[26,40+oy2],[21,42+oy2],[22,31+oy2]]);
  fillPath(x,plain?'#d2cbc0':'#6a7164',[[26,24+oy2],[32,23+oy2],[30,36+oy2],[26,39+oy2],[23.5,31+oy2]]);
  if(plain){
    // Collar, torn hem and dangling cloth reproduce the supplied hunched worker silhouette.
    fillPath(x,'#ddd5c8',[[24,22+oy2],[30,21+oy2],[32,26+oy2],[27,29+oy2]]);
    fillPath(x,'#5b5550',[[34,22+oy2],[39,21+oy2],[37,29+oy2],[32,26+oy2]]);
    fillPath(x,'#827b72',[[22,34+oy2],[28,38+oy2],[25,47+oy2],[21,44+oy2]]);
    fillPath(x,'#c1b9ad',[[35,37+oy2],[41,34+oy2],[39,44+oy2],[35,42+oy2]]);
    x.strokeStyle='#5a504b';x.lineWidth=1.05;x.beginPath();x.moveTo(31,25+oy2);x.lineTo(31,40+oy2);x.stroke();
    if(torn){
      // Two-thirds HP: sleeve and flank tear open, with a larger blood-soaked shoulder gap.
      fillPath(x,'#531b20',[[22,26+oy2],[27,24+oy2],[29,30+oy2],[25,35+oy2],[21,33+oy2]]);
      fillPath(x,'#272522',[[36,30+oy2],[42,28+oy2],[40,39+oy2],[35,37+oy2]]);
      x.fillStyle='#a3242b';x.beginPath();x.ellipse(24.8,29.5+oy2,2.2,4.1,.28,0,Math.PI*2);x.fill();
    }
    if(critical){
      // One-third HP: the remaining shirt is shredded and heavily stained.
      fillPath(x,'#211f1e',[[23,35+oy2],[28,33+oy2],[27,43+oy2],[22,46+oy2]]);
      fillPath(x,'#642026',[[31,26+oy2],[38,24+oy2],[40,34+oy2],[34,38+oy2],[29,34+oy2]]);
      x.strokeStyle='#a3222b';x.lineWidth=2.5;x.beginPath();x.moveTo(28,25+oy2);x.lineTo(25,42+oy2);x.moveTo(35,24+oy2);x.lineTo(38,41+oy2);x.stroke();
    }
  }
  // ripped shirt holes / ribs hints
  fillPath(x,'#2a2d29',[[27,25+oy2],[34,24+oy2],[32,28+oy2],[27,29+oy2]]); fillPath(x,'#2a2d29',[[35,31+oy2],[40,29+oy2],[39,35+oy2],[34,36+oy2]]);
  x.strokeStyle='#8e9585';x.lineWidth=1.15;x.beginPath();x.moveTo(28,30+oy2);x.lineTo(34,31+oy2);x.moveTo(28,33+oy2);x.lineTo(34,34+oy2);x.stroke();
  // blood soaked chest streaks
  x.strokeStyle='#7e1720';x.lineWidth=2.3;x.beginPath();x.moveTo(31,25+oy2);x.lineTo(30,37+oy2);x.moveTo(35,27+oy2);x.lineTo(37,35+oy2);x.stroke();
  x.fillStyle='#a51e29';x.beginPath();x.ellipse(29,28+oy2,2.4,3.3,-.3,0,Math.PI*2);x.ellipse(37,34+oy2,2,2.7,.2,0,Math.PI*2);x.fill();
  // Arms hang loose beside the torso while walking, with a soft delayed noodle-like swing.
  const armSwing=idleMode?Math.sin(idleCyc)*.55:Math.sin(cyc-.55)*2.0, armLag=idleMode?Math.sin(idleCyc-.5)*.35:Math.sin(cyc-.95)*1.15;
  let lHandX=23+armSwing*.55, lHandY=48+oy2+Math.abs(armLag)*.7;
  let rHandX=41-armSwing*.55, rHandY=48+oy2+Math.abs(armLag)*.7;
  x.strokeStyle='#1a1e1a';x.lineWidth=5.5;x.beginPath();
  if(!armGone){
    if(front){lHandX=23-13*biteArmReach;lHandY=48+oy2-6*biteArmReach;rHandX=41-25*biteArmReach;rHandY=48+oy2-5*biteArmReach;x.moveTo(25,27+oy2);x.lineTo(24-8*biteArmReach,36+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,27+oy2);x.lineTo(39-15*biteArmReach,38+oy2);x.lineTo(rHandX,rHandY);}
    else if(vertical){lHandX=21;lHandY=49+oy2;rHandX=40;rHandY=49+oy2;x.moveTo(25,28+oy2);x.lineTo(20,40+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,28+oy2);x.lineTo(42,40+oy2);x.lineTo(rHandX,rHandY);}
    else if(lp>0){lHandX=23-20*lungeReach;lHandY=48+oy2-13*lungeReach;rHandX=41-31*lungeReach;rHandY=48+oy2-11*lungeReach;x.moveTo(25,27+oy2);x.lineTo(20-9*lungeReach,35+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,27+oy2);x.lineTo(32-13*lungeReach,36+oy2);x.lineTo(rHandX,rHandY);}
    else{x.moveTo(25,27+oy2);x.quadraticCurveTo(24+armSwing*.35,37+oy2,23+armSwing*.45,41+oy2);x.quadraticCurveTo(22+armLag*.55,45+oy2,lHandX,lHandY);x.moveTo(38,27+oy2);x.quadraticCurveTo(40-armSwing*.35,37+oy2,40-armSwing*.45,41+oy2);x.quadraticCurveTo(42-armLag*.55,45+oy2,rHandX,rHandY);}
  }else{if(front){rHandX=16;rHandY=43+oy2;x.moveTo(38,27+oy2);x.lineTo(24,39+oy2);x.lineTo(rHandX,rHandY);}else if(vertical){rHandX=40;rHandY=49+oy2;x.moveTo(38,28+oy2);x.lineTo(42,40+oy2);x.lineTo(rHandX,rHandY);}else{x.moveTo(38,27+oy2);x.quadraticCurveTo(40-armSwing*.35,37+oy2,40-armSwing*.45,41+oy2);x.quadraticCurveTo(42-armLag*.55,45+oy2,rHandX,rHandY);}}x.stroke();
  x.strokeStyle='#77816f';x.lineWidth=3.2;x.beginPath();
  if(!armGone){
    if(front){x.moveTo(25,27+oy2);x.lineTo(24-8*biteArmReach,36+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,27+oy2);x.lineTo(39-15*biteArmReach,38+oy2);x.lineTo(rHandX,rHandY);}
    else if(vertical){x.moveTo(25,28+oy2);x.lineTo(20,40+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,28+oy2);x.lineTo(42,40+oy2);x.lineTo(rHandX,rHandY);}
    else if(lp>0){x.moveTo(25,27+oy2);x.lineTo(20-9*lungeReach,35+oy2);x.lineTo(lHandX,lHandY);x.moveTo(38,27+oy2);x.lineTo(32-13*lungeReach,36+oy2);x.lineTo(rHandX,rHandY);}
    else{x.moveTo(25,27+oy2);x.quadraticCurveTo(24+armSwing*.35,37+oy2,23+armSwing*.45,41+oy2);x.quadraticCurveTo(22+armLag*.55,45+oy2,lHandX,lHandY);x.moveTo(38,27+oy2);x.quadraticCurveTo(40-armSwing*.35,37+oy2,40-armSwing*.45,41+oy2);x.quadraticCurveTo(42-armLag*.55,45+oy2,rHandX,rHandY);}
  }else{
    if(front){x.moveTo(38,27+oy2);x.lineTo(24,39+oy2);x.lineTo(rHandX,rHandY);}
    else if(vertical){x.moveTo(38,28+oy2);x.lineTo(42,40+oy2);x.lineTo(rHandX,rHandY);}
    else{x.moveTo(38,27+oy2);x.quadraticCurveTo(40-armSwing*.35,37+oy2,40-armSwing*.45,41+oy2);x.quadraticCurveTo(42-armLag*.55,45+oy2,rHandX,rHandY);}
  }x.stroke();
  const claw=(cx,cy,flip=1)=>{x.strokeStyle='#2b2d28';x.lineWidth=1.35;for(let i=-1;i<=1;i++){x.beginPath();x.moveTo(cx,cy+i*1.5);x.lineTo(cx+flip*(4.5+Math.abs(i)),cy+i*2.1+2);x.stroke();}};
  if(!armGone)claw(lHandX,lHandY,front?-1:-.35); claw(rHandX,rHandY,front?-1:.35);
  // bloody forearms/hands follow the hanging arm endpoints instead of forming a rigid V.
  x.strokeStyle='#8e1b24';x.lineWidth=2.4;x.beginPath();if(!armGone){x.moveTo(lHandX+(front?3:0),lHandY-4);x.lineTo(lHandX,lHandY);}x.moveTo(rHandX+(front?4:0),rHandY-4);x.lineTo(rHandX,rHandY);x.stroke();
  if(plain&&armGone){
    // Visible torn shoulder stump after the two-thirds-health arm break.
    x.fillStyle='#651b20';x.beginPath();x.ellipse(24.8,28.2+oy2,3.2,4.0,-.35,0,Math.PI*2);x.fill();
    x.fillStyle='#b53a35';x.beginPath();x.ellipse(24.2,27.4+oy2,1.25,2.0,-.35,0,Math.PI*2);x.fill();
  }
  // Gaunt infected 3/4 face: the skull trails the torso by a few frames, then snaps back after the waist.
  x.save();
  // Head trails the shoulders by one walking pose, matching the supplied 12-frame lurch.
  if(lp>0){const neckX=32,neckY=26+oy2;x.translate(neckX,neckY);x.rotate(lungeCurl*.38-lungeImpact*.16);x.translate(-lungeReach*2.2,lungeImpact*2.4);x.translate(-neckX,-neckY);}
  else if(!front&&!vertical&&hitStun<=0){const neckX=32,neckY=26+oy2,headLag=idleMode?Math.sin(idleCyc-.65)*.025:Math.sin(cyc-.92)*.055;x.translate(neckX,neckY);x.rotate(headLag);x.translate(idleMode?0:Math.sin(cyc-1.15)*.45,0);x.translate(-neckX,-neckY);}
  if(hitStun>0){const neckX=32,neckY=26+oy2;x.translate(neckX,neckY);x.rotate(hitHead*.105);x.translate(hitHead*1.15,-Math.abs(hitHead)*.35);x.translate(-neckX,-neckY);}
  if(front||vertical){const neckX=32,neckY=26+oy2;x.translate(neckX,neckY);x.rotate(biteHeadRoll);x.translate(-neckX,-neckY);}
  x.translate(-biteReach,(vertical?biteReach*.12:0)+biteHeadDrop);
  x.fillStyle='#1b201c';x.beginPath();x.moveTo(26,2.8+oy2);x.bezierCurveTo(36,1+oy2,42.5,7.2+oy2,41.8,15.5+oy2);x.bezierCurveTo(41.4,20+oy2,39.4,23.2+oy2,36.8,25.6+oy2);x.lineTo(29.2,28.6+oy2);x.bezierCurveTo(21.5,26.4+oy2,19.8,20.5+oy2,20.7,12.4+oy2);x.bezierCurveTo(21.2,7+oy2,23.3,4.5+oy2,26,2.8+oy2);x.fill();
  x.fillStyle=plain?'#899077':'#60695d';x.beginPath();x.moveTo(27,4+oy2);x.bezierCurveTo(36,2+oy2,41,8+oy2,40,15+oy2);x.bezierCurveTo(40,19+oy2,38,22+oy2,36,24+oy2);x.lineTo(30,27+oy2);x.bezierCurveTo(23,25+oy2,21,20+oy2,22,13+oy2);x.bezierCurveTo(22,8+oy2,24,6+oy2,27,4+oy2);x.fill();
  // exposed cheek plane and sickly forehead highlight
  x.fillStyle=plain?'#a4a88c':'#7c8574';x.beginPath();x.moveTo(26,6+oy2);x.quadraticCurveTo(33,4+oy2,37,8+oy2);x.lineTo(34,13+oy2);x.lineTo(25,12+oy2);x.closePath();x.fill();
  // Deep, unequal sockets under a hard brow.
  x.fillStyle='#211d1b';x.beginPath();x.ellipse(26.8,14.2+oy2,3.8,3.1,-.22,0,Math.PI*2);x.ellipse(35.5,14.8+oy2,2.7,2.8,.18,0,Math.PI*2);x.fill();
  x.strokeStyle='#34392f';x.lineWidth=2.0;x.beginPath();x.moveTo(22.8,10.7+oy2);x.lineTo(29.6,12.0+oy2);x.moveTo(32.8,11.8+oy2);x.lineTo(38.6,11.0+oy2);x.stroke();
  x.fillStyle='#d83a34';x.beginPath();x.ellipse(27.2,14.5+oy2,.72,.88,0,0,Math.PI*2);x.ellipse(35.3,15.0+oy2,.48,.64,0,0,Math.PI*2);x.fill();
  // Missing flesh at temple/cheek, kept stylized but much less childlike.
  x.fillStyle='#542428';x.beginPath();x.moveTo(38,8+oy2);x.lineTo(41,11+oy2);x.lineTo(39,17+oy2);x.lineTo(36.8,18.5+oy2);x.lineTo(37.5,13+oy2);x.closePath();x.fill();
  x.strokeStyle='#9b2a2f';x.lineWidth=1.2;x.beginPath();x.moveTo(39,10+oy2);x.lineTo(37.5,17+oy2);x.stroke();
  // Crooked nose in three-quarter profile, pointing toward the plant.
  x.fillStyle='#6e7768';x.beginPath();x.moveTo(28,15.5+oy2);x.lineTo(22.2,18.8+oy2);x.lineTo(28.4,19.6+oy2);x.closePath();x.fill();
  x.fillStyle='#2a2420';x.beginPath();x.ellipse(23.7,18.7+oy2,.9,.62,-.18,0,Math.PI*2);x.fill();
  // Torn lips and broken, irregular teeth; lower jaw drops during the bite.
  x.fillStyle='#251416';x.beginPath();x.moveTo(23.5,20.5+oy2);x.quadraticCurveTo(30,18.7+oy2,39.2,21.0+oy2);x.lineTo(37.2,26.1+oy2+jawOpen*3.4);x.quadraticCurveTo(30.2,29.0+oy2+jawOpen*3.5,22.8,24.1+oy2);x.closePath();x.fill();
  x.fillStyle='#c7c09a';const teeth=[[26.1,20.6,1.4,2.7],[28.5,20.2,1.1,1.8],[31.0,20.1,1.55,2.5],[34.1,20.4,1.05,1.7],[36.2,20.8,1.4,2.3]];for(const t of teeth)x.fillRect(t[0],t[1]+oy2,t[2],t[3]);
  if(jawOpen>.15){for(const t of [[27,24.7,1.1,1.8],[30.2,25.2,1.45,2.0],[34,24.9,1.0,1.5]])x.fillRect(t[0],t[1]+oy2+jawOpen*2.0,t[2],t[3]);}
  x.fillStyle='#8d1822';x.beginPath();x.ellipse(34.8,25.5+oy2+jawOpen*1.4,4.0,1.7,.18,0,Math.PI*2);x.fill();
  // split lip, dried blood and a dangling fresh drip
  x.strokeStyle='#851923';x.lineWidth=1.8;x.beginPath();x.moveTo(24.2,22.8+oy2);x.lineTo(21.8,26.2+oy2);x.moveTo(38.1,22.8+oy2);x.lineTo(39.6,30.2+oy2);x.stroke();
  const drip=Math.abs(Math.sin(gameTime*4.2+(f||0)));x.fillStyle='#a91d28';x.beginPath();x.ellipse(39.5,30.5+oy2+drip*2,1.0,1.9,0,0,Math.PI*2);x.fill();
  // cheek cuts / exposed bone hint
  x.strokeStyle='#c2b99a';x.lineWidth=1.0;x.beginPath();x.moveTo(24.5,21.0+oy2);x.lineTo(27.5,22.1+oy2);x.moveTo(37.0,18.6+oy2);x.lineTo(39.1,19.5+oy2);x.stroke();
  if(biteClamp){x.strokeStyle='rgba(190,35,45,.8)';x.lineWidth=1.1;x.beginPath();x.moveTo(39,25+oy2);x.lineTo(43,27+oy2);x.stroke();}
  x.restore();
  // Dense, uneven black hair for the supplied reference; armoured variants retain the older sparse hair.
  if(plain){
    fillPath(x,'#211d20',critical?[[21,10+oy2],[22,5+oy2],[25,2+oy2],[28,4+oy2],[31,1+oy2],[34,5+oy2],[38,3+oy2],[41,7+oy2],[40,11+oy2],[36,8+oy2],[34,13+oy2],[31,8+oy2],[28,13+oy2],[26,8+oy2]]:[[21,10+oy2],[22,4+oy2],[26,1+oy2],[31,0+oy2],[37,2+oy2],[41,6+oy2],[40,11+oy2],[36,8+oy2],[34,13+oy2],[31,8+oy2],[28,13+oy2],[26,8+oy2]]);
    if(critical){
      // One-third HP: missing crown hair exposes torn scalp and pale skull.
      x.fillStyle='#7d2027';x.beginPath();x.ellipse(31.5,3.6+oy2,5.4,3.5,-.12,0,Math.PI*2);x.fill();
      x.fillStyle='#d0b58f';x.beginPath();x.ellipse(31.2,3.1+oy2,2.8,1.7,-.12,0,Math.PI*2);x.fill();
      x.strokeStyle='#b82d32';x.lineWidth=1.2;x.beginPath();x.moveTo(28,2.7+oy2);x.lineTo(34.5,4.6+oy2);x.stroke();
    }
    x.strokeStyle='#171417';x.lineWidth=1.8;x.beginPath();x.moveTo(23,7+oy2);x.lineTo(20,10+oy2);x.moveTo(27,4+oy2);x.lineTo(25,10+oy2);x.moveTo(31,3+oy2);x.lineTo(30,9+oy2);x.moveTo(36,4+oy2);x.lineTo(38,10+oy2);x.stroke();
  }else{
    x.strokeStyle='#262823';x.lineWidth=1.7;x.beginPath();x.moveTo(26,6+oy2);x.lineTo(23,2+oy2);x.moveTo(29,5+oy2);x.lineTo(28,0+oy2);x.moveTo(33,5+oy2);x.lineTo(35,1+oy2);x.moveTo(36,6+oy2);x.lineTo(40,3+oy2);x.stroke();
  }
  // cone variant keeps armor identity, but dirtier/darker
  if(cone){
    fillPath(x,'#4b2d1d',[[22,-1+oy2],[41,1+oy2],[47,15.5+oy2],[17.5,15.5+oy2]]);
    fillPath(x,'#b75b24',[[23,0+oy2],[40,2+oy2],[45,14+oy2],[19,14+oy2]]);
    fillPath(x,'#dc7b33',[[25,1.2+oy2],[31,2.2+oy2],[27,13+oy2],[20.5,13+oy2]]);
    x.fillStyle='#2e241b';x.fillRect(18.5,14+oy2,28,4);
    x.fillStyle='#d98a3d';x.fillRect(21,14.3+oy2,22,1.2);
    x.strokeStyle='#6d2a1f';x.lineWidth=1.4;x.beginPath();x.moveTo(27,5+oy2);x.lineTo(38,9+oy2);x.stroke();
  }
  // Bucket zombie: the head is physically inside the bucket. Draw it before leaving the
  // articulated upper-body transform so recoil/bites carry the helmet with the skull.
  if(bucketHp>0){
    x.save();
    // Lower/deeper than the old pasted-on helmet: lower rim reaches the neck/shoulder line.
    x.translate(0,8.8+oy2*.02);
    x.scale(1.05,1.08);
    x.translate(-1.5,-1.0);
    drawBucketHelmet(x,bucketHp);
    // Neck shadow under the bucket mouth makes the head read as inserted into the shell.
    x.globalAlpha=.52;x.fillStyle='#090d0f';x.beginPath();x.ellipse(32,31,11.5,3.2,0,0,Math.PI*2);x.fill();
    x.restore();
  }
  x.restore(); // upper-body bite lean
  x.restore();
}
function drawImp(x,f=0,eatMode=null,hurt=false,mounted=false,bitePhase=0){
  const gp=((f||0)%1+1)%1, cyc=gp*Math.PI*2;
  const bp=eatMode?Math.max(0,Math.min(1,bitePhase)):0;
  const biteReach=eatMode?(bp<.34?bp/.34*4.6:bp<.68?4.6:(1-(bp-.68)/.32)*4.6):0;
  const bodyBob=mounted?-.8:Math.sin(cyc*2)*.6;
  x.save();
  if(hurt)x.translate(1.1,0);
  x.translate(0,bodyBob);
  const legA=Math.sin(cyc)*4.2, legB=Math.sin(cyc+1.8)*4.0;
  x.strokeStyle='#2b2c26';x.lineWidth=2.9;x.lineCap='round';
  const legs=[
    [20,33,10+legA,24,7+legA*1.1,17],[20,35,10+legA*.6,36,5+legA*.8,43],[24,37,15+legB*.4,46,13+legB*.7,55],
    [42,33,52-legA,24,55-legA*1.1,17],[42,35,52-legA*.6,36,57-legA*.8,43],[38,37,47-legB*.4,46,49-legB*.7,55]
  ];
  for(const L of legs){x.beginPath();x.moveTo(L[0],L[1]);x.lineTo(L[2],L[3]);x.lineTo(L[4],L[5]);x.stroke();}
  const lean=eatMode?-biteReach:0;
  x.save();x.translate(lean,0);
  x.fillStyle='#4a5249';x.beginPath();x.ellipse(31,31,11.5,8.8,-.06,0,Math.PI*2);x.fill();
  x.fillStyle='#6c7468';x.beginPath();x.ellipse(29,28.5,6.6,4.8,-.14,0,Math.PI*2);x.fill();
  x.fillStyle='#2a2927';x.beginPath();x.ellipse(26,31,3.4,2.8,-.16,0,Math.PI*2);x.ellipse(35.4,30.2,2.6,2.3,.12,0,Math.PI*2);x.fill();
  x.fillStyle='#c72d30';x.beginPath();x.ellipse(26.3,31.1,.82,.78,0,0,Math.PI*2);x.ellipse(35.2,30.4,.55,.55,0,0,Math.PI*2);x.fill();
  x.strokeStyle='#25231f';x.lineWidth=1.4;x.beginPath();x.moveTo(22.5,27.6);x.lineTo(29,28.8);x.moveTo(32.6,28.4);x.lineTo(38.4,27.6);x.stroke();
  x.fillStyle='#65191d';x.beginPath();x.moveTo(22.5,35.0);x.quadraticCurveTo(30.5,32.5,39.8,35.2);x.lineTo(38.4,39.6);x.quadraticCurveTo(29.8,43.3,21.8,38.6);x.closePath();x.fill();
  x.fillStyle='#d7d0b2';for(const t of [[25.2,35.0],[28.2,34.4],[31.4,34.5],[34.8,35.0]])x.fillRect(t[0],t[1],1.5,2.4);
  x.fillStyle='#8f1d23';x.beginPath();x.ellipse(37.2,39.3,1.0,1.8,.08,0,Math.PI*2);x.fill();
  x.fillStyle='#7a2329';x.beginPath();x.ellipse(38.8,30.8,2.2,3.4,.12,0,Math.PI*2);x.fill();
  x.strokeStyle='#20231f';x.lineWidth=1.2;x.beginPath();x.moveTo(27,24);x.lineTo(24,20);x.moveTo(32,23);x.lineTo(33,19);x.moveTo(36,24);x.lineTo(39,20);x.stroke();
  x.restore();
  if(mounted){x.strokeStyle='#171a15';x.lineWidth=1.4;x.beginPath();x.moveTo(18,46);x.lineTo(23,43);x.moveTo(44,46);x.lineTo(39,43);x.stroke();}
  x.restore();
}

function drawBrainEatingOverlay(x,z){
  const q=Math.max(0,Math.min(1,(z.brainEat||0)/2)), chew=Math.sin(q*Math.PI*8);
  // Arms repeatedly reach to the ground and return to the mouth; head dips visibly.
  x.save();x.strokeStyle='#5e6b58';x.lineWidth=4.2;x.lineCap='round';
  const reach=.5+.5*Math.sin(q*Math.PI*8);
  x.beginPath();x.moveTo(24,29);x.lineTo(19,39+reach*7);x.lineTo(25,50+reach*5);x.stroke();
  x.beginPath();x.moveTo(39,29);x.lineTo(43,38+(1-reach)*7);x.lineTo(36,49+(1-reach)*5);x.stroke();
  x.fillStyle='#f28bb4';x.beginPath();x.ellipse(32,25+chew*.8,2.2,1.5,0,0,Math.PI*2);x.fill();x.restore();
}

function drawBrainZombie(x,z,bitePhase=0){
  // Start from the familiar walker silhouette, then expose the broken crown and pink brain.
  const wobble=Math.sin((z.walkTick||0)*Math.PI*2)*.12;
  x.save();x.translate(32,35);x.rotate(wobble);x.translate(-32,-35);
  drawZombie(x,false,z.walkTick,z.eatMode,(z.hurt>0||z.hitStun>0),z.armGone,z.lungeTime,bitePhase,z.hitStun,0,false);
  x.fillStyle='#171817';x.beginPath();x.moveTo(23,7);x.lineTo(27,2);x.lineTo(31,5);x.lineTo(35,1);x.lineTo(41,7);x.closePath();x.fill();
  x.fillStyle='#f28bb4';x.strokeStyle='#7d3152';x.lineWidth=1.2;x.beginPath();x.ellipse(32,7,9,5.7,-.08,0,Math.PI*2);x.fill();x.stroke();
  x.strokeStyle='#b84e7b';x.lineWidth=1.1;
  for(let i=0;i<4;i++){x.beginPath();x.arc(27+i*3.2,7+(i%2?1:-1),2.3,0,Math.PI*1.45);x.stroke();}
  x.restore();
}
function drawGiantMutation(x,z){
  const total=z.giantTransformTotal||3,elapsed=total-(z.giantTransform||0),u=Math.max(0,Math.min(1,elapsed/total));
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
  // 0-.25 collapses forward; .25-.68 grows while prone; .68-1 pushes upright.
  const fall=smooth(Math.min(1,u/.25));
  const grow=smooth(Math.max(0,Math.min(1,(u-.18)/.50)));
  const rise=smooth(Math.max(0,Math.min(1,(u-.68)/.32)));
  const twitch=Math.sin(u*Math.PI*18)*(1-rise)*(grow*.9);
  const shake=(1-rise)*grow;
  x.save();
  // Repeated shock rings, torn turf and dust make the mutation read at game scale.
  x.globalAlpha=(.22+.38*grow)*(1-rise*.55);x.strokeStyle='#caff75';x.lineWidth=2.2;
  for(let i=0;i<2;i++){
    const wave=(u*3.2+i*.5)%1;
    x.beginPath();x.ellipse(32,46,8+wave*25,4+wave*10,0,0,Math.PI*2);x.stroke();
  }
  x.globalAlpha=.75*grow;x.strokeStyle='#33281c';x.lineWidth=2;
  for(let i=0;i<5;i++){const a=-.52+i*.26;x.beginPath();x.moveTo(32,55);x.lineTo(32+Math.cos(a)*22*grow,55+Math.sin(a)*8*grow);x.stroke();}
  x.fillStyle='#70563a';
  for(let i=0;i<7;i++){const a=i*.9+u*9,r=8+grow*18;x.globalAlpha=.65*grow*(1-rise);x.beginPath();x.arc(32+Math.cos(a)*r,49-Math.abs(Math.sin(a))*12*grow,1.2+(i%3)*.45,0,Math.PI*2);x.fill();}
  x.globalAlpha=1;
  // Keep the whole metamorphosis comfortably inside the 64px sprite.
  x.translate(32+Math.sin(u*Math.PI*34)*1.5*shake,48+Math.cos(u*Math.PI*28)*.8*shake);
  x.rotate(-fall*1.18*(1-rise));
  x.scale(1+grow*.16,1+grow*.12);
  x.translate(-32,-48);
  // Draw the familiar source zombie while it collapses and swells.
  x.save();x.translate(0,fall*7-rise*5);x.scale(1+grow*.08,1+grow*.06);
  drawZombie(x,z.giantFromType==='cone'&&(z.coneHp||0)>0,0,null,false,false,0,0,0,z.giantFromType==='bucket'?(z.coneHp||0):0);
  x.restore();
  // Growing back/shoulder mass visibly emerges while prone.
  x.globalAlpha=Math.max(0,(grow-.08)/.92);
  x.fillStyle='#6f7d68';x.strokeStyle='#20281f';x.lineWidth=2;
  x.beginPath();x.ellipse(32+twitch,35-fall*3,11+grow*8,6+grow*5,-.08,0,Math.PI*2);x.fill();x.stroke();
  // Forearms lengthen along the ground, then become supports for standing.
  const armDrop=(1-rise)*7;
  x.lineCap='round';x.strokeStyle='#20291f';x.lineWidth=7+grow*3;
  x.beginPath();x.moveTo(23,34);x.lineTo(14-grow*5,45+armDrop);x.moveTo(42,34);x.lineTo(50+grow*5,45+armDrop);x.stroke();
  x.strokeStyle='#74816c';x.lineWidth=4+grow*2.5;
  x.beginPath();x.moveTo(23,34);x.lineTo(14-grow*5,45+armDrop);x.moveTo(42,34);x.lineTo(50+grow*5,45+armDrop);x.stroke();
  x.globalAlpha=1;
  // Final third: body pushes off the turf and straightens into the giant silhouette.
  if(rise>0){
    x.globalAlpha=rise;
    x.save();x.translate(0,(1-rise)*11);x.scale(.68+rise*.32,.68+rise*.32);
    drawMutantGiant(x,{...z,type:'giant',walkTick:0,smashTime:0,brainDropId:null,brainEat:0});
    x.restore();x.globalAlpha=1;
  }
  x.restore();
}
function drawMutantGiant(x,z){
  const g=((z.walkTick||0)%1+1)%1,cyc=g*Math.PI*2;
  const smash=z.smashTime||0,su=smash>0?1-Math.min(1,smash/.92):0;
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
  let raise=0,slam=0,recover=0;
  if(smash>0){if(su<.34)raise=smooth(su/.34);else if(su<.55)raise=1;else if(su<.72){raise=1-smooth((su-.55)/.17);slam=smooth((su-.55)/.17)}else if(su<.84)slam=1;else recover=smooth((su-.84)/.16)}
  const brainFeast=z.brainDropId?Math.max(0,Math.min(1,(z.brainEat||0)/10)):0;
  const feastCrouch=z.brainDropId?(7+Math.sin(brainFeast*Math.PI*20)*.45):0;
  const walking=smash<=0&&!z.eating&&!z.brainDropId,bob=walking?Math.abs(Math.sin(cyc))*1.0:0;
  const hipY=40+bob+feastCrouch;
  function leg(phase,side){
    const q=(g+phase)%1;let off,lift;
    if(q<.58){const u=q/.58;off=-7.5+15*u;lift=0}else{const u=(q-.58)/.42;off=7.5-15*smooth(u);lift=Math.sin(u*Math.PI)*4.5}
    const hx=32+side*4.2,fx=hx+off,fy=58.5+bob-lift,kx=hx+off*.44-side*.8,ky=49+bob-lift*.42;
    return {hx,fx,fy,kx,ky}
  }
  const L=leg(0,-1),R=leg(.5,1);
  x.save();x.translate(32,34);x.scale(1.25,1.25);x.translate(-32,-34);
  // grounded shadow
  x.fillStyle='rgba(8,12,8,.30)';x.beginPath();x.ellipse(32,60,19,3.3,0,0,Math.PI*2);x.fill();
  // boots: broad, layered soles and torn uppers
  for(const p of [L,R]){
    x.fillStyle='#171716';x.strokeStyle='#090a09';x.lineWidth=1.5;x.beginPath();x.roundRect(p.fx-6,p.fy-3.5,12,5.8,2);x.fill();x.stroke();
    x.fillStyle='#3a3028';x.beginPath();x.roundRect(p.fx-5.2,p.fy-4.8,10.5,3.8,1.5);x.fill();
    x.strokeStyle='#756356';x.lineWidth=.8;x.beginPath();x.moveTo(p.fx-3,p.fy-2.8);x.lineTo(p.fx+2,p.fy-2.8);x.stroke();
  }
  // trousers and articulated legs
  x.lineCap='round';x.strokeStyle='#151b19';x.lineWidth=9;x.beginPath();x.moveTo(L.hx,hipY);x.lineTo(L.kx,L.ky);x.lineTo(L.fx,L.fy-4);x.moveTo(R.hx,hipY);x.lineTo(R.kx,R.ky);x.lineTo(R.fx,R.fy-4);x.stroke();
  x.strokeStyle='#343b42';x.lineWidth=6;x.beginPath();x.moveTo(L.hx,hipY);x.lineTo(L.kx,L.ky);x.lineTo(L.fx,L.fy-4);x.moveTo(R.hx,hipY);x.lineTo(R.kx,R.ky);x.lineTo(R.fx,R.fy-4);x.stroke();
  // ripped trouser edges at knees
  x.strokeStyle='#171c20';x.lineWidth=1.5;for(const p of [L,R]){x.beginPath();x.moveTo(p.kx-3,p.ky-1);x.lineTo(p.kx,p.ky+2);x.lineTo(p.kx+3,p.ky-.5);x.stroke()}

  x.save();
  const gaitLean=walking?Math.sin(cyc)*.035:0,attackLean=raise*.18-slam*.23;
  x.translate(32,40+bob);x.rotate(gaitLean+attackLean);x.translate(-32,-40-bob);
  // belly/waist underlayer
  x.fillStyle='#73806b';x.strokeStyle='#20291f';x.lineWidth=2;x.beginPath();x.ellipse(32,38+bob,12.5,9.5,0,0,Math.PI*2);x.fill();x.stroke();
  // skin mottling on exposed belly
  x.fillStyle='rgba(54,67,50,.45)';x.beginPath();x.ellipse(27,39+bob,3.2,2,0,0,Math.PI*2);x.ellipse(36,35+bob,2.4,1.4,0,0,Math.PI*2);x.fill();
  // thick neck
  x.fillStyle='#697763';x.strokeStyle='#20281f';x.lineWidth=2;x.beginPath();x.roundRect(27,17+bob,12,11,4);x.fill();x.stroke();
  // huge trapezius / shoulders
  x.fillStyle='#6f7d68';x.beginPath();x.moveTo(15,27+bob);x.quadraticCurveTo(18,17+bob,28,19+bob);x.quadraticCurveTo(32,23+bob,38,19+bob);x.quadraticCurveTo(48,18+bob,51,28+bob);x.lineTo(45,40+bob);x.lineTo(20,40+bob);x.closePath();x.fill();x.stroke();
  // torn sleeveless vest, two asymmetrical panels
  x.fillStyle='#382f2b';x.strokeStyle='#181411';x.lineWidth=1.7;
  x.beginPath();x.moveTo(16,23+bob);x.lineTo(27,20+bob);x.lineTo(29,38+bob);x.lineTo(22,42+bob);x.lineTo(18,36+bob);x.lineTo(20,32+bob);x.lineTo(16,29+bob);x.closePath();x.fill();x.stroke();
  x.beginPath();x.moveTo(39,20+bob);x.lineTo(49,24+bob);x.lineTo(47,31+bob);x.lineTo(50,34+bob);x.lineTo(43,42+bob);x.lineTo(36,38+bob);x.closePath();x.fill();x.stroke();
  // cloth tears / stitching
  x.strokeStyle='#78655a';x.lineWidth=1;x.beginPath();x.moveTo(20,27+bob);x.lineTo(25,30+bob);x.moveTo(42,26+bob);x.lineTo(47,28+bob);x.moveTo(23,36+bob);x.lineTo(27,34+bob);x.stroke();
  // belt with buckle
  x.fillStyle='#221d19';x.fillRect(21,40+bob,23,3.2);x.fillStyle='#80704b';x.fillRect(30,39.6+bob,5,4);x.fillStyle='#29251c';x.fillRect(31.2,40.5+bob,2.6,2.1);
  // collarbones / scars
  x.strokeStyle='#485442';x.lineWidth=1.2;x.beginPath();x.moveTo(26,25+bob);x.lineTo(31,27+bob);x.moveTo(40,25+bob);x.lineTo(35,27+bob);x.moveTo(33,30+bob);x.lineTo(38,33+bob);x.stroke();

  // Giant face keeps the normal-zombie family resemblance, but it is no longer a frozen mask.
  // Normal walkers get loose asymmetry/head inertia; brain eating looks down; smash compresses the brow and opens the jaw.
  const headLag=walking?Math.sin(cyc-.65)*1.35:raise*-2.2+slam*2.4;
  const faceT=gameTime*2.25+(z.id||0)*.73;
  const feast=!!z.brainDropId,attacking=smash>0;
  const alert=!feast&&!attacking&&(z.eatTargetId||z.smashCooldown>1.25);
  const lookX=feast?-1.25:(attacking?-1.45:(alert?-1.05:Math.sin(faceT)*.72));
  const lookY=feast?1.30:(raise?-.72:(slam?1.0:Math.sin(faceT*.63)*.32));
  const blink=(!attacking&&!feast&&Math.sin(faceT*.41)>0.965)?0.28:1;
  const jawWalk=walking?(1.1+Math.max(0,Math.sin(cyc-.85))*1.25):0;
  const chew=feast?(2.2+Math.abs(Math.sin(brainFeast*Math.PI*20))*2.8):0;
  const rage=attacking?(raise*.85+slam):0;
  const jawOpen=Math.max(jawWalk,chew,rage*5.2);
  const headTilt=feast?.13:(attacking?(-raise*.10+slam*.14):Math.sin(cyc-.5)*.035);
  const hx=33+headLag,hy=14+bob+feastCrouch*.42+(feast?1.7:0);

  x.save();x.translate(hx,hy);x.rotate(headTilt);x.scale(1.10,1.10);x.translate(-32,-15);

  // Long, slightly crooked skull: same visual family as the regular zombie rather than a round giant face.
  x.fillStyle='#626d60';x.strokeStyle='#20261f';x.lineWidth=1.7;
  x.beginPath();x.moveTo(27.5,4);x.bezierCurveTo(34.5,1.8,41.5,7.4,40.4,15.2);x.bezierCurveTo(40,19.4,38.1,21.7,36.2,23.5+jawOpen*.18);x.lineTo(30,27+jawOpen*.34);x.bezierCurveTo(23,25.6+jawOpen*.22,20.9,20.2,22,13);x.bezierCurveTo(22.1,8.1,24.1,5.8,27.5,4);x.fill();x.stroke();
  // Uneven forehead plane gives the silhouette the same vacant-but-unsettling normal-zombie character.
  x.fillStyle='#7c8574';x.beginPath();x.moveTo(25.8,6);x.quadraticCurveTo(33,3.8,37.8,8);x.lineTo(34.2,12.5);x.lineTo(24.7,11.8);x.closePath();x.fill();

  // Brow animation: relaxed/uneven while walking, sharply compressed during the overhead smash.
  const browDrop=rage*2.0,inner=rage*1.5;
  x.strokeStyle='#34392f';x.lineWidth=2.25;x.lineCap='round';x.beginPath();
  x.moveTo(22.6,10.5+browDrop*.15);x.lineTo(29.7,11.8+browDrop+inner);
  x.moveTo(32.6,11.8+browDrop+inner);x.lineTo(39.1,10.7+browDrop*.1);x.stroke();

  // Unequal sockets and unequal eyelids are the key normal-zombie family feature.
  x.fillStyle='#211d1b';x.beginPath();
  x.ellipse(26.7,14.25,4.15,3.35*blink,-.20,0,Math.PI*2);
  x.ellipse(35.65,14.85,2.85,2.9*Math.max(.55,blink),.18,0,Math.PI*2);x.fill();
  x.fillStyle='#d9d7a7';x.beginPath();
  x.ellipse(27.0,14.5,2.25,2.35*blink,-.10,0,Math.PI*2);
  x.ellipse(35.55,15.0,1.7,2.0*Math.max(.58,blink),.10,0,Math.PI*2);x.fill();

  // Pupils do not stare dead-centre: both track left toward plants, with a tiny independent drift.
  x.fillStyle='#171816';x.beginPath();
  x.arc(27.45+lookX*.42,14.72+lookY*.42,.84,0,Math.PI*2);
  x.arc(35.35+lookX*.31+Math.sin(faceT*1.37)*.18,15.18+lookY*.34,.68,0,Math.PI*2);x.fill();
  // Small highlights keep the eyes readable at game scale.
  x.fillStyle='rgba(245,244,206,.75)';x.beginPath();x.arc(27.15+lookX*.42,14.38+lookY*.42,.24,0,Math.PI*2);x.arc(35.15+lookX*.31,14.87+lookY*.34,.18,0,Math.PI*2);x.fill();

  // Crooked wedge nose + nostril, shifted slightly toward the direction of travel.
  x.fillStyle='#6e7768';x.beginPath();x.moveTo(28.2,15.4);x.lineTo(21.9,18.9);x.lineTo(28.6,19.7);x.closePath();x.fill();
  x.fillStyle='#292522';x.beginPath();x.ellipse(23.5,18.8,.95,.64,-.18,0,Math.PI*2);x.fill();

  // Jaw is genuinely animated instead of just stretching the old mouth polygon.
  const mouthTop=20.3,mouthBottom=25.0+jawOpen;
  x.fillStyle='#251416';x.strokeStyle='#3a2020';x.lineWidth=.7;x.beginPath();
  x.moveTo(23.2,mouthTop);x.quadraticCurveTo(30.2,18.6-rage*.5,39.2,20.9);
  x.lineTo(37.1,mouthBottom);x.quadraticCurveTo(30.0,28.1+jawOpen,22.5,24.1+jawOpen*.55);x.closePath();x.fill();x.stroke();

  // Irregular teeth stay attached to the upper jaw; lower teeth separate as the mouth opens.
  x.fillStyle='#c7c09a';
  for(const t of [[25.8,20.4,1.5,2.8],[28.4,20.0,1.1,1.9],[31.0,20.0,1.6,2.6],[34.1,20.35,1.05,1.8],[36.25,20.7,1.45,2.35]])x.fillRect(...t);
  if(jawOpen>1.4){x.fillRect(27.2,25.0+jawOpen*.62,1.25,1.65);x.fillRect(32.8,25.5+jawOpen*.68,1.5,1.85);}
  x.fillStyle='#8d1822';x.beginPath();x.ellipse(34.4,24.9+jawOpen*.70,4.2,1.65,.18,0,Math.PI*2);x.fill();

  // Cheek/temple creases deepen during a smash, helping the face read as angry rather than vacant.
  x.strokeStyle=rage>0?'#3b4437':'#4a5346';x.lineWidth=1.05;x.beginPath();
  x.moveTo(22.8,21.7);x.lineTo(20.9-rage,24.9+jawOpen*.2);
  x.moveTo(39.0,20.8);x.lineTo(40.0+rage,24.8+jawOpen*.35);
  if(rage>.25){x.moveTo(24.0,9.0);x.lineTo(28.5,10.3);x.moveTo(38.0,9.2);x.lineTo(34.1,10.4);}
  x.stroke();

  // A couple of loose hairs bounce opposite the head inertia.
  x.strokeStyle='#252a23';x.lineWidth=1.25;x.beginPath();
  x.moveTo(27.0,4.5);x.quadraticCurveTo(24.5-headLag*.18,1.4,25.4,0);
  x.moveTo(34.2,4.0);x.quadraticCurveTo(36.5-headLag*.12,1.0,35.6,-.5);x.stroke();
  x.restore();
  function arm(side){
    const sx=32+side*16,sy=26+bob+feastCrouch*.35;
    if(z.brainDropId){
      const chew=.5+.5*Math.sin(brainFeast*Math.PI*20+(side>0?Math.PI:0));
      const px=27+side*3,py=51+feastCrouch*.18-chew*10;
      return {sx,sy,ex:sx+(px-sx)*.52,ey:sy+(py-sy)*.50+4,hx:px,hy:py};
    }
    if(smash>0){
      const ox=32+side*5,oy=3+bob,ix=15+side*3,iy=49+bob;let px,py;
      if(su<.55){px=sx+(ox-sx)*raise;py=sy+(oy-sy)*raise}
      else if(su<.84){px=ox+(ix-ox)*slam;py=oy+(iy-oy)*slam}
      else{px=ix+(sx-ix)*recover;py=iy+(sy-iy)*recover}
      return {sx,sy,ex:sx+(px-sx)*.48+side*(raise?5:2),ey:sy+(py-sy)*.42-(raise?4:0),hx:px,hy:py}
    }
    const a=Math.sin(cyc+(side>0?Math.PI:0));return {sx,sy,ex:sx+side*5+a*2.5,ey:35+bob-a*2,hx:sx+side*7+a*5.5,hy:46+bob-a*2.4}
  }
  const arms=[arm(-1),arm(1)];
  for(const a of arms){
    // thick upper/forearms with dark outline
    x.strokeStyle='#20291f';x.lineWidth=11;x.beginPath();x.moveTo(a.sx,a.sy);x.lineTo(a.ex,a.ey);x.lineTo(a.hx,a.hy);x.stroke();
    x.strokeStyle='#74816c';x.lineWidth=7.3;x.beginPath();x.moveTo(a.sx,a.sy);x.lineTo(a.ex,a.ey);x.lineTo(a.hx,a.hy);x.stroke();
    // forearm veins/scars
    x.strokeStyle='#4c5947';x.lineWidth=1;x.beginPath();x.moveTo(a.ex,a.ey);x.lineTo((a.ex+a.hx)/2,(a.ey+a.hy)/2);x.stroke();
    // palm
    x.fillStyle='#7d8a73';x.strokeStyle='#20281f';x.lineWidth=1.4;x.beginPath();x.ellipse(a.hx,a.hy,5.7,4.7,0,0,Math.PI*2);x.fill();x.stroke();
    // four chunky fingers
    const dir=a.hx<32?-1:1;
    x.strokeStyle='#273126';x.lineWidth=1.2;
    for(let i=0;i<4;i++){const fy=a.hy-2.5+i*1.7;x.beginPath();x.moveTo(a.hx+dir*2.4,fy);x.lineTo(a.hx+dir*(5.2+(i%2)*.7),fy+.4);x.stroke()}
  }

  // inherited armor is fitted to the new skull rather than pasted to the canvas origin.
  if(z.giantArmor==='cone'&&z.coneHp>0){
    x.fillStyle='#c86b2c';x.strokeStyle='#432c1d';x.lineWidth=1.4;x.beginPath();x.moveTo(hx-7,hy-8);x.lineTo(hx+5,hy-8);x.lineTo(hx+10,hy+3);x.lineTo(hx-11,hy+3);x.closePath();x.fill();x.stroke();
    x.fillStyle='#3a2c22';x.fillRect(hx-12,hy+2,23,2.5);x.strokeStyle='#e7954e';x.beginPath();x.moveTo(hx-4,hy-6);x.lineTo(hx+3,hy+1);x.stroke();
  }
  if(z.giantArmor==='bucket'&&z.coneHp>0){
    x.save();x.translate(hx-32,hy-15);x.scale(.93,.90);drawBucketHelmet(x,z.coneHp);x.restore();
  }
  x.restore();x.restore();
}
function drawBrainZombieDeath(x,fx){
  const u=Math.min(1,fx.age/1.20),ease=1-Math.pow(1-u,3);
  // Travel direction is LEFT, so positive canvas rotation makes the corpse fall BACK toward screen-right.
  x.save();x.translate(32,47);x.rotate(ease*1.36);x.translate(-32,-47);
  drawZombie(x,false,0,null,false,false,0,0,0,0);
  x.fillStyle='#ef83ad';x.strokeStyle='#7c2e4f';x.lineWidth=1.2;x.beginPath();x.ellipse(32,7,9,5.5,0,0,Math.PI*2);x.fill();x.stroke();
  x.restore();
  // The brain visibly separates from the skull before becoming a persistent world pickup.
  if(fx.age>.48&&fx.age<1.24){
    const q=Math.min(1,(fx.age-.48)/.76);
    const bx=33+q*16, by=8+q*34-10*Math.sin(q*Math.PI);
    x.fillStyle='#f58ab5';x.strokeStyle='#762a4b';x.lineWidth=1.2;x.beginPath();x.ellipse(bx,by,7.2,5.3,q*.7,0,Math.PI*2);x.fill();x.stroke();
    x.strokeStyle='#b74473';x.beginPath();x.arc(bx-2,by,2.2,0,Math.PI*1.5);x.arc(bx+2.5,by-1,2,0,Math.PI*1.45);x.stroke();
  }
}
function drawBrainDrop(x,b){
  const pulse=1.02+Math.sin(gameTime*4+b.id)*.025;
  x.save();x.translate(32,36);x.scale(1.28*pulse,1.28*pulse);x.translate(-32,-36);
  // Ground contact shadow makes it unmistakably a world object, not a fading particle.
  x.fillStyle='rgba(20,10,15,.32)';x.beginPath();x.ellipse(32,47,15,4.2,0,0,Math.PI*2);x.fill();
  x.fillStyle='#ef83ad';x.strokeStyle='#65213f';x.lineWidth=1.7;
  x.beginPath();x.moveTo(20,37);x.bezierCurveTo(20,29,27,26,32,29);x.bezierCurveTo(38,25,45,30,44,37);x.bezierCurveTo(46,43,39,46,33,44);x.bezierCurveTo(27,47,19,44,20,37);x.fill();x.stroke();
  x.strokeStyle='#a93e69';x.lineWidth=1.35;
  x.beginPath();x.moveTo(32,29);x.bezierCurveTo(29,32,35,34,31,37);x.bezierCurveTo(27,40,34,42,31,44);x.stroke();
  for(let i=0;i<4;i++){x.beginPath();x.arc(24+i*5,35+(i%2?3:-1),2.6,0,Math.PI*1.55);x.stroke();}
  x.fillStyle='rgba(255,190,214,.55)';x.beginPath();x.ellipse(26,31,3.5,1.7,-.3,0,Math.PI*2);x.fill();
  x.restore();
}
function drawCrawler(x,f=0,eatMode=null,hurt=false,bitePhase=0,crawlPhase=0){
  const cp=((Number.isFinite(crawlPhase)?crawlPhase:0)%1+1)%1;
  const bite=eatMode?Math.sin(Math.max(0,Math.min(1,bitePhase))*Math.PI):0;
  const activeLeft=cp<.5, t=(cp*2)%1;
  const clamp=u=>Math.max(0,Math.min(1,u));
  const smooth=u=>{u=clamp(u);return u*u*(3-2*u)};
  const accel=u=>Math.pow(clamp(u),3.4); // slow start -> fast whip snap
  const lerp=(a,b,u)=>a+(b-a)*u;
  const shoulderL={x:22,y:35}, shoulderR={x:40,y:35};

  function armPose(shoulder,isActive,side){
    if(!isActive){
      // Passive arm stays braced on the lawn. No alternating swimming motion.
      return {hand:{x:shoulder.x-5+side*2,y:48},elbow:{x:shoulder.x-2+side,y:42},straight:false,planted:true};
    }
    if(t<.48){
      // Big slow wind-up above and behind the shoulder.
      const u=accel(t/.48), ang=lerp(-.35,Math.PI*.78,u), radius=31;
      const hand={x:shoulder.x-Math.sin(ang)*radius,y:shoulder.y-Math.cos(ang)*25};
      const eang=lerp(-.18,Math.PI*.56,Math.pow(clamp(t/.48),2.2));
      const elbow={x:shoulder.x-Math.sin(eang)*17,y:shoulder.y-Math.cos(eang)*15};
      return {hand,elbow,straight:t>.38,planted:false};
    }
    if(t<.66){
      // Whip snap: the arm becomes a real straight segment and accelerates into the ground.
      const u=accel((t-.48)/.18);
      const hand={x:lerp(4,-16,u),y:lerp(25,49,u)};
      const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y;
      const elbow={x:shoulder.x+dx*.50,y:shoulder.y+dy*.50};
      return {hand,elbow,straight:true,planted:false};
    }
    if(t<.80){
      // Hand is pinned. Keep the whole arm almost ruler-straight for a readable impact hold.
      const hand={x:-16,y:49};
      const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y;
      return {hand,elbow:{x:shoulder.x+dx*.50,y:shoulder.y+dy*.50},straight:true,planted:true};
    }
    if(t<.94){
      // Only after the grip is established does the elbow bend to haul the torso forward.
      const u=smooth((t-.80)/.14),hand={x:-16+u*2.5,y:49-u*.5};
      return {hand,elbow:{x:lerp(shoulder.x-19,shoulder.x-11,u),y:lerp(42,45,u)},straight:false,planted:true};
    }
    const u=smooth((t-.94)/.06);
    return {hand:{x:lerp(-13.5,shoulder.x-5,u),y:lerp(48.5,48,u)},elbow:{x:lerp(shoulder.x-11,shoulder.x-2,u),y:lerp(45,42,u)},straight:false,planted:true};
  }

  const LA=armPose(shoulderL,activeLeft,-1),RA=armPose(shoulderR,!activeLeft,1);
  const pull=t>.80&&t<.94?Math.sin((t-.80)/.14*Math.PI):0;
  const impact=t>.59&&t<.72?Math.sin((t-.59)/.13*Math.PI):0;
  const torsoShift=-pull*7.2-bite*2.0;
  const pressDown=impact*.9+pull*1.15;

  x.save();x.translate(torsoShift,13+pressDown);if(hurt)x.translate(1.5,0);
  // Only the torn connection remains on the body. The long intestine trail is rendered in world space.
  x.fillStyle='#542026';x.beginPath();x.ellipse(43,44,8,3.2,.15,0,Math.PI*2);x.fill();
  x.strokeStyle='#8e3036';x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(42,44);x.bezierCurveTo(48,47,52,45,58,48);x.stroke();

  // Very low torso: chest and jaw are nearly scraping the lawn.
  fillPath(x,'#334039',[[15,37],[28,33],[42,34],[49,39],[46,44],[34,47],[21,46],[13,42]]);
  fillPath(x,'#667363',[[18,35],[31,33],[41,35],[45,39],[40,43],[28,44],[17,42],[14,39]]);
  x.strokeStyle='#4b2028';x.lineWidth=2;x.beginPath();x.moveTo(19,41);x.lineTo(26,45);x.moveTo(34,42);x.lineTo(39,46);x.stroke();

  function drawArm(shoulder,pose){
    const hx=pose.hand.x,hy=pose.hand.y;
    let ex=pose.elbow.x,ey=pose.elbow.y;
    if(pose.straight){
      // Exact collinearity: shoulder -> elbow -> hand is mathematically straight.
      ex=shoulder.x+(hx-shoulder.x)*.50;ey=shoulder.y+(hy-shoulder.y)*.50;
    }
    x.strokeStyle='#798473';x.lineWidth=4.6;x.lineCap='round';x.lineJoin='round';x.beginPath();
    x.moveTo(shoulder.x,shoulder.y);x.lineTo(ex,ey);x.lineTo(hx,hy);x.stroke();
    x.strokeStyle='#252b25';x.lineWidth=1.5;x.beginPath();x.moveTo(hx-3,hy);x.lineTo(hx+3.5,hy);
    x.moveTo(hx-1.5,hy);x.lineTo(hx-5.6,hy+3.5);x.moveTo(hx+1.2,hy);x.lineTo(hx+5.8,hy+3);x.stroke();
    if(pose.planted){x.strokeStyle='#52663d';x.lineWidth=1.1;x.beginPath();x.moveTo(hx-7,hy+3.4);x.lineTo(hx+7,hy+3.4);x.stroke();}
  }
  drawArm(shoulderL,LA);drawArm(shoulderR,RA);

  // Face pushed down toward the grass: nose, mouth and chin sit just above the hand line.
  const headX=23-bite*3.8,headY=36-bite*.6;
  x.fillStyle='#7d8778';x.beginPath();x.ellipse(headX,headY,10.4,7.4,-.30,0,Math.PI*2);x.fill();
  x.fillStyle='#aeb6a5';x.beginPath();x.ellipse(headX-2.7,headY-2.1,5.4,3.5,-.28,0,Math.PI*2);x.fill();
  x.fillStyle='#2e312d';x.beginPath();x.ellipse(headX-5.1,headY-1.0,3.5,2.8,0,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(headX+2.0,headY-2.0,2.5,2.1,0,0,Math.PI*2);x.fill();
  x.fillStyle='#b22d2f';x.beginPath();x.ellipse(headX-5.0,headY-.9,1.05,.8,0,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(headX+2.0,headY-1.9,.82,.62,0,0,Math.PI*2);x.fill();
  fillPath(x,'#461619',[[headX-11,headY+3.7],[headX-2,headY+2.1],[headX+4,headY+3.8],[headX+1.5,headY+7.4],[headX-8.5,headY+7.7]]);
  x.fillStyle='#d5cdaa';for(const q of [[headX-8,headY+3.1],[headX-4.2,headY+2.8],[headX-.4,headY+3.1]])x.fillRect(q[0],q[1],1.8,2.8);
  x.fillStyle='#7d1d23';x.fillRect(headX-9.4,headY+6.7,7,1.8);x.beginPath();x.ellipse(headX-10.5,headY+8.1,1.1,1.8,0,0,Math.PI*2);x.fill();
  x.restore();
}

function drawLongHairZombie(x,z,bitePhase=0){
  const walk=z?.walkTick||0,hurt=(z?.hurt||0)>0;
  const remain=Math.max(0,z?.hairAttack||0),dur=1.34,phase=remain>0?1-remain/dur:0;
  const step=Math.sin(walk*Math.PI*2),sway=Math.sin(walk*Math.PI*2+.8);
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const active=remain>0;
  // Attack is driven by an impossible zombie neck spin, not by autonomous hair.
  // 0-.18 coil, .18-.72 full 360deg snap, .72-1 follow-through and settle.
  const coil=active?(phase<.18?smooth(phase/.18):(phase<.28?1-smooth((phase-.18)/.10):0)):0;
  const spinU=active?smooth((phase-.12)/.70):0;
  const settle=active&&phase>.72?Math.sin(clamp((phase-.72)/.28)*Math.PI*2)*(1-clamp((phase-.72)/.28)):0;
  const theta=spinU*Math.PI*2;
  const faceCos=Math.cos(theta),faceSin=Math.sin(theta);
  const shoulderTwist=active?Math.sin(theta)*3.2-coil*2.0:0;
  x.save();x.lineJoin='round';x.lineCap='round';x.translate(shoulderTwist,Math.abs(step)*.35);
  x.globalAlpha=.23;x.fillStyle='#121714';x.beginPath();x.ellipse(32,60.3,14.8,3.0,0,0,Math.PI*2);x.fill();x.globalAlpha=1;

  // Hair lives BEHIND her at rest. Each strand follows the rotating skull with delayed tip inertia.
  // Root -> mid -> tip have increasing lag, so the rear hair sweeps through the foreground as a whip.
  const rootCX=32,rootCY=12;
  for(let i=0;i<16;i++){
    const lane=(i-7.5)/7.5;
    const rootLag=i*.0028;
    const midLag=.030+i*.0030;
    const tipLag=.078+i*.0052;
    const ru=smooth((phase-.12-rootLag)/.70),mu=smooth((phase-.12-midLag)/.70),tu=smooth((phase-.12-tipLag)/.70);
    const ra=ru*Math.PI*2,ma=mu*Math.PI*2,ta=tu*Math.PI*2;
    const restX=37+lane*7+sway*.35,restY=43+Math.abs(lane)*5+(i%2)*1.2;
    const rr=7+Math.abs(lane)*2,mr=18+Math.abs(lane)*3,tr=34+Math.abs(lane)*5;
    // Rotation ellipse is deliberately wider than tall: readable side-on lash across the lane.
    const rx=rootCX+Math.sin(ra)*rr+lane*5;
    const ry=rootCY+6+(1-Math.cos(ra))*2+Math.abs(lane);
    const mx=active?rootCX+Math.sin(ma)*mr+lane*7:35+lane*7;
    const my=active?22+Math.cos(ma)*5+Math.abs(lane)*3:27+Math.abs(lane)*4;
    let tx=active?rootCX+Math.sin(ta)*tr+lane*8:restX;
    let ty=active?29+Math.cos(ta)*10+Math.abs(lane)*5:restY;
    // At the forward strike quadrant, tips snap farther left into the incoming pea.
    const strike=Math.max(0,1-Math.abs(((ta%(Math.PI*2))+Math.PI*2)%(Math.PI*2)-Math.PI*1.5)/.48);
    tx-=strike*(15+Math.abs(lane)*3);ty-=strike*(5-lane*2);
    x.strokeStyle=i%5===0?'#4f5a55':(i%3===0?'#29302d':'#0b0f0e');
    x.lineWidth=i%5===0?2.0:1.0+(i%4)*.22;
    x.beginPath();x.moveTo(rx,ry);x.bezierCurveTo((rx+mx)*.5,ry+5,mx,my,tx,ty);x.stroke();
    if(i%3===0){x.globalAlpha=.48;x.strokeStyle='#7b8881';x.lineWidth=.48;x.beginPath();x.moveTo(rx+.7,ry+1);x.bezierCurveTo(mx-2,my-4,mx+2,my+2,tx+2,ty+1);x.stroke();x.globalAlpha=1;}
  }

  // Full female zombie body. Hips stay mostly planted while shoulders visibly twist with the head.
  x.fillStyle='#1d231f';x.fillRect(23.8,47+step*1.1,7.4,13);x.fillRect(34.8,47-step*1.1,7.4,13);
  x.fillStyle='#465049';x.fillRect(25,48+step*1.1,5,12);x.fillRect(36,48-step*1.1,5,12);
  x.fillStyle='#161b18';x.fillRect(21.5,58+step*1.1,11,3.4);x.fillRect(34,58-step*1.1,11,3.4);
  fillPath(x,'#6f7770',[[22+shoulderTwist*.25,26],[42+shoulderTwist*.25,26],[46,39],[50,57],[42,58],[38,56],[33,59],[28,56],[23,59],[16,57],[19,39]]);
  fillPath(x,'#d8ddd7',[[23+shoulderTwist*.25,27],[41+shoulderTwist*.25,27],[44.7,39],[47.5,55.5],[40.3,56.2],[36.8,54.2],[32.6,57.1],[27.8,54.7],[24.2,57],[17.8,55.7],[20,39]]);
  fillPath(x,'#aab3ab',[[20,31],[26,29],[28,54.8],[23.5,56.1],[18.2,54.5],[18,48]]);
  fillPath(x,'#eef0ea',[[34,29],[40,30],[45.7,54.5],[40,56.1],[36.5,53.5]]);
  x.strokeStyle='#89938b';x.lineWidth=1.2;x.beginPath();x.moveTo(26,36);x.lineTo(24,55);x.moveTo(34,35);x.lineTo(36,55);x.moveTo(41,37);x.lineTo(44,54);x.stroke();
  x.strokeStyle='#c6cec6';x.lineWidth=4.1;x.beginPath();x.moveTo(23+shoulderTwist,30);x.lineTo(17-shoulderTwist*.35,42);x.lineTo(16,52);x.moveTo(41+shoulderTwist,30);x.lineTo(46+shoulderTwist*.35,42);x.lineTo(45,52);x.stroke();
  x.fillStyle='#939d96';x.beginPath();x.ellipse(16,52,2.3,3,0,0,Math.PI*2);x.ellipse(45,52,2.3,3,0,0,Math.PI*2);x.fill();

  // Neck and skull visibly perform the full impossible rotation. Face width collapses at profile,
  // disappears at the back of the head, then returns from the other side.
  const headX=32+faceSin*2.3,headY=18;
  x.fillStyle='#aeb7af';x.fillRect(29+shoulderTwist*.35,23,6,6);
  x.fillStyle='#252b27';x.beginPath();x.ellipse(headX,headY,9.3*(.62+.38*Math.abs(faceCos)),10.6,-faceSin*.12,0,Math.PI*2);x.fill();
  x.fillStyle=hurt?'#efd0ce':'#cdd3cc';x.beginPath();x.ellipse(headX,headY,8.5*(.62+.38*Math.abs(faceCos)),9.8,-faceSin*.12,0,Math.PI*2);x.fill();
  x.fillStyle='rgba(244,247,240,.35)';x.beginPath();x.ellipse(headX-2.2*faceCos,headY-3.0,3.4*Math.max(.45,Math.abs(faceCos)),2.2,-faceSin*.12,0,Math.PI*2);x.fill();
  // Rear skull hair cap gets dominant when the face is turned away.
  const backness=(1-faceCos)*.5;
  x.strokeStyle='#101514';x.lineWidth=4.5;x.beginPath();x.arc(headX,14,9.6,Math.PI*1.02,Math.PI*1.95);x.stroke();
  if(backness>.35){x.globalAlpha=clamp((backness-.35)/.65);x.fillStyle='#151a19';x.beginPath();x.ellipse(headX,18,7.2,8.2,0,0,Math.PI*2);x.fill();x.globalAlpha=1;}
  // Face features only when the face side is actually visible; their lateral shift sells rotation.
  const vis=clamp((faceCos+.18)/1.18);
  if(vis>0){x.globalAlpha=vis;x.fillStyle='#48504b';const eyeSep=4.2*Math.abs(faceCos);x.fillRect(headX-eyeSep-1,17,2,1.5);x.fillRect(headX+eyeSep-1,17,2,1.5);if(active){x.fillStyle='#74151c';x.fillRect(headX-eyeSep-.7,17,1.3,1.3);x.fillRect(headX+eyeSep-.7,17,1.3,1.3);}x.strokeStyle='#777f78';x.lineWidth=1;x.beginPath();x.moveTo(headX-3*Math.abs(faceCos),23);x.quadraticCurveTo(headX,24.1,headX+3*Math.abs(faceCos),23);x.stroke();x.globalAlpha=1;}
  // Only one or two wispy front strands; they rotate with the skull instead of masking the body.
  x.strokeStyle='#171c1b';x.lineWidth=1.05;x.beginPath();x.moveTo(headX-3*faceCos,10);x.quadraticCurveTo(headX-5*faceCos+faceSin*3,18,headX-3*faceCos+faceSin*5,29);x.stroke();
  x.beginPath();x.moveTo(headX+3.5*faceCos,10.5);x.quadraticCurveTo(headX+5*faceCos+faceSin*2,18,headX+3.5*faceCos+faceSin*4,27);x.stroke();

  // Strong strike accent at the forward sweep, synchronized with the reflected pea squash.
  const impact=active&&phase>.50&&phase<.66?Math.sin((phase-.50)/.16*Math.PI):0;
  if(impact>0){x.globalAlpha=impact;x.strokeStyle='#f4f6ef';x.lineWidth=2.2;x.beginPath();x.moveTo(0,23);x.lineTo(11,30);x.moveTo(0,36);x.lineTo(11,30);x.moveTo(4,29);x.lineTo(14,30);x.stroke();x.globalAlpha=1;}
  x.restore();
}
function drawFireZombieDeath(x,fx){
  const t=fx.age, life=fx.life||1.82;
  const char=Math.min(1,t/.48), crumble=Math.max(0,Math.min(1,(t-.42)/.98)), fade=Math.max(0,1-Math.max(0,t-1.34)/.48);
  const seed=fx.seed||1;
  x.save();x.globalAlpha=fade;
  // The corpse chars in place first: ember-red seams collapse into matte charcoal/ash.
  const bodyCol=char<.55?'#56372b':(char<.9?'#302c29':'#171a18');
  x.fillStyle=bodyCol;
  x.fillRect(23,39,7,17);x.fillRect(35,39,7,17);
  x.beginPath();x.moveTo(19,25);x.lineTo(45,25);x.lineTo(47,45);x.lineTo(17,45);x.closePath();x.fill();
  x.fillStyle=char<.72?'#5b5549':'#242623';x.beginPath();x.ellipse(31,17,9,8,0,0,Math.PI*2);x.fill();
  if(fx.cone){x.fillStyle=char<.6?'#9a5125':'#302822';x.beginPath();x.moveTo(24,10);x.lineTo(36,8);x.lineTo(42,18);x.lineTo(20,18);x.closePath();x.fill();}
  // Ember cracks extinguish while the silhouette is still readable.
  if(t<.72){x.globalAlpha=fade*(1-t/.78);x.strokeStyle='#ff7a28';x.lineWidth=1.35;for(let i=0;i<6;i++){const yy=18+i*5,xx=23+((i*7+seed)%15);x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+4+(i%2)*2,yy+3);x.lineTo(xx+2,yy+6);x.stroke();}}
  x.globalAlpha=fade;
  // Wind eats the body from left to right; dusty fragments accelerate rightward and upward.
  if(crumble>0){
    const wipe=crumble*58;
    x.globalCompositeOperation='destination-out';x.fillStyle='#000';x.fillRect(4,4,wipe,58);x.globalCompositeOperation='source-over';
    for(let i=0;i<30;i++){
      const q=((i*37+seed*11)%101)/100, q2=((i*61+seed*7)%97)/96;
      const delay=q*.52, u=Math.max(0,Math.min(1,(crumble-delay)/(1-delay)));
      if(u<=0)continue;
      const sx=17+q*28, sy=10+q2*46;
      const drift=8+u*(22+q*32), rise=Math.sin(u*Math.PI)*(3+q2*7);
      const sz=1.1+(i%5)*.42;
      x.globalAlpha=fade*(1-u*.72);
      x.fillStyle=i%4===0?'#8c8173':(i%3===0?'#5c554e':'#2a2d29');
      x.save();x.translate(sx+drift,sy-rise+Math.sin(t*10+i)*1.4);x.rotate(u*4+i);x.fillRect(-sz,-sz*.55,sz*2,sz*1.1);x.restore();
    }
  }
  x.restore();x.globalAlpha=1;
}
function drawNormalZombieFallDeath(x,t){
  // Eight authored poses: stand -> buckle -> hand down -> knees -> shoulder impact -> prone -> settle.
  const u=Math.max(0,Math.min(1,t/1.55));
  const sample=pts=>{for(let i=1;i<pts.length;i++)if(u<=pts[i][0]){const a=pts[i-1],b=pts[i],q=(u-a[0])/(b[0]-a[0]||1),s=q*q*(3-2*q);return a[1]+(b[1]-a[1])*s;}return pts[pts.length-1][1];};
  const bodyRot=sample([[0,0],[.14,.02],[.28,.13],[.42,.38],[.56,.76],[.70,1.12],[.84,1.40],[1,1.48]]);
  const headRot=sample([[0,0],[.14,-.03],[.28,.04],[.42,.25],[.56,.54],[.70,.90],[.84,1.24],[1,1.38]]);
  const drop=sample([[0,0],[.14,.4],[.28,2.2],[.42,6.8],[.56,11.8],[.70,15.8],[.84,18.0],[1,18.5]]);
  const slide=sample([[0,0],[.28,0],[.42,1.0],[.56,3.8],[.70,7.5],[1,10.5]]);
  const src=document.createElement('canvas');src.width=64;src.height=64;const s=src.getContext('2d');s.imageSmoothingEnabled=false;
  drawZombie(s,false,0,null,false,true,0,0,0,0,true,2);
  const part=(sx,sy,sw,sh,px,py,a,dx=0,dy=0)=>{x.save();x.translate(px+dx,py+dy);x.rotate(a);x.translate(-px,-py);x.beginPath();x.rect(sx,sy,sw,sh);x.clip();x.drawImage(src,0,0);x.restore();};
  x.save();x.translate(slide,drop);
  // Legs fold first, torso follows, and the head lags until the shoulder hits the ground.
  part(5,37,54,27,31,48,bodyRot*.38,-slide*.15,0);
  part(10,18,45,31,30,42,bodyRot,0,0);
  part(12,0,42,28,31,25,headRot,Math.sin(u*Math.PI)*1.2,-Math.sin(u*Math.PI)*1.0);
  x.restore();
  if(u>.38){const q=Math.min(1,(u-.38)/.62);x.save();x.globalAlpha=.30+.55*q;x.fillStyle='#67151d';x.beginPath();x.ellipse(34+q*8,58,4+q*13,1+q*2.4,0,0,Math.PI*2);x.fill();x.restore();}
}
function drawZombieDeath(x,cone,t,zombieType=null){
  if(zombieType==='normal'&&!cone){const u=Math.max(0,Math.min(1,t/1.55));x.save();x.translate(32,61);x.rotate(-Math.min(1.36,u*1.58));x.translate(-32,-61);drawNormalZombieSpriteFrame(x,'damage',u>.55?2:1);x.restore();return;}
  // Other zombie families retain their established internal-struggle rupture.
  // Long, readable internal struggle, then rupture. The spikes are silhouette deformation, not smoke.
  const struggleEnd=.90,burstStart=.90,end=1.72;
  const struggle=Math.min(1,t/struggleEnd),burst=Math.max(0,Math.min(1,(t-burstStart)/(end-burstStart)));
  const beat=Math.floor(t/.095),dirs=[[-1,-.15],[.95,-.35],[-.55,.72],[.72,.58],[0,-1],[-.95,.35],[.92,.12]];
  const [dx,dy]=dirs[beat%dirs.length];
  const pulse=t<struggleEnd?Math.pow(Math.max(0,Math.sin((t%0.095)/.095*Math.PI)),.42):0;
  const spike=(10+struggle*18)*pulse,shake=t<struggleEnd?Math.sin(t*72)*(.25+struggle*.65):0;
  const fade=burst>0?Math.max(0,1-burst*1.5):1;
  x.save();x.translate(shake,0);x.globalAlpha=fade;x.lineJoin='miter';
  x.fillStyle='#424943';x.fillRect(23,39,7,17);x.fillRect(35,39,7,17);
  // torso polygon itself grows a sharp point in the current impact direction.
  const cx=32,cy=34,px=cx+dx*spike,py=cy+dy*spike;
  x.fillStyle='#626b61';x.beginPath();x.moveTo(19,25);x.lineTo(45,25);x.lineTo(48,45);
  if(dy>.25){x.lineTo(39,45);x.lineTo(px,py);x.lineTo(25,45);}else if(dx>.25){x.lineTo(px,py);x.lineTo(17,45);}else{x.lineTo(17,45);if(dx<-.25)x.lineTo(px,py);}
  x.closePath();x.fill();
  // unmistakable pale, pointed pressure cone pushing from INSIDE the belly.
  if(t<struggleEnd){
    const baseX=cx-dx*2,baseY=cy-dy*2,perpX=-dy,perpY=dx;
    x.fillStyle='#899288';x.beginPath();x.moveTo(baseX+perpX*4,baseY+perpY*4);x.lineTo(px,py);x.lineTo(baseX-perpX*4,baseY-perpY*4);x.closePath();x.fill();
    x.strokeStyle='#b9c0b7';x.lineWidth=1.2;x.beginPath();x.moveTo(cx-dx*3,cy-dy*3);x.lineTo(px,py);x.stroke();
    // stress cracks radiate away from the point.
    x.strokeStyle='#303630';x.lineWidth=1.3;for(let i=-1;i<=1;i++){const a=Math.atan2(dy,dx)+i*.55;x.beginPath();x.moveTo(cx+Math.cos(a)*3,cy+Math.sin(a)*3);x.lineTo(cx+Math.cos(a)*(7+spike*.35),cy+Math.sin(a)*(6+spike*.25));x.stroke();}
  }
  x.fillStyle='#303630';x.fillRect(19,42,29,4);x.fillStyle='#929b8d';x.beginPath();x.ellipse(31,17,9,8,0,0,Math.PI*2);x.fill();x.fillStyle='#242823';x.fillRect(25,15,3,2);x.fillRect(35,15,3,2);
  if(cone)fillPath(x,'#df842f',[[24,10],[36,8],[42,18],[20,18]]);x.restore();
  if(burst>0){
    const e=1-Math.pow(1-burst,2),mistFade=Math.max(0,1-burst*1.25);
    // compact blood mist behind the droplets.
    x.save();x.globalAlpha=mistFade*.72;for(const [ox,oy,r] of [[0,0,11],[-.7,.15,7],[.7,-.2,8],[.25,.6,6]]){x.fillStyle='#6f0713';x.beginPath();x.arc(32+ox*e*19,34+oy*e*14,r*(.45+e*.65),0,Math.PI*2);x.fill();}x.restore();
    // ballistic blood drops: fly, fall under gravity, then remain as little ground splats.
    const drops=[[-26,-27,3.5],[-20,-38,2.6],[-15,-23,3.1],[-9,-43,2.1],[8,-39,3.0],[15,-26,3.7],[24,-34,2.7],[-29,-17,2.8],[30,-19,3.2],[3,-47,2.6],[20,-12,2.2],[-18,-11,2.4]];
    x.save();
    drops.forEach((d,i)=>{const tt=burst*.95,vx=d[0],vy=d[1],gx=32+vx*tt,gy=34+vy*tt+38*tt*tt;const ground=57-(i%3)*.7;if(gy>=ground){const land=Math.min(1,(gy-ground)/5+.35);x.globalAlpha=Math.max(0,1-burst*.45);x.fillStyle=i%2?'#74151f':'#9d1c29';x.beginPath();x.ellipse(gx,ground,3.5+land*2.5,1.1+land*.45,0,0,Math.PI*2);x.fill();}else{x.globalAlpha=Math.max(.25,1-burst*.7);x.fillStyle=i%2?'#a51f2c':'#cf3540';x.beginPath();x.ellipse(gx,gy,d[2],d[2]*1.45,Math.atan2(vy+76*tt,vx),0,Math.PI*2);x.fill();}});
    x.restore();
  }
}
function drawAshZombieDeath(x,fx){
  // Potato mines still throw the same satisfying blood spray, then the body
  // collapses into dry gray ash instead of using the ordinary death silhouette.
  drawZombieDeath(x,fx.cone,fx.age);
  const u=Math.max(0,Math.min(1,(fx.age-.28)/1.62)),fade=Math.max(0,1-u);
  x.save();x.globalAlpha=.72*fade;
  for(let i=0;i<26;i++){
    const seed=(fx.seed||1)+i*17, q=((seed*13)%101)/100, q2=((seed*29)%97)/96;
    const drift=(q-.5)*(8+u*38), lift=Math.sin(u*Math.PI)*(4+q2*12)+u*9;
    const size=.7+(i%4)*.42;
    x.fillStyle=i%3?'#77766b':'#b2aa91';
    x.save();x.translate(32+drift,42-lift+q2*12);x.rotate(u*4+i*.7);x.fillRect(-size,-size*.55,size*2,size);x.restore();
  }
  x.restore();
}
function drawBucketDrop(x,t,dir){
  const u=Math.min(1,t/.9),fade=Math.max(0,1-u),cx=31+dir*u*25,cy=14-u*20+u*u*45;
  x.save();x.globalAlpha=fade;x.translate(cx,cy);x.rotate(dir*u*2.8);
  x.fillStyle='#1b2327';x.strokeStyle='#090d0f';x.lineWidth=2;x.fillRect(-14,-8,28,19);x.strokeRect(-14,-8,28,19);
  x.fillStyle='#59666c';x.fillRect(-10,-5,18,13);x.fillStyle='#8a969b';x.fillRect(-8,-4,3,11);
  x.fillStyle='#101518';x.fillRect(-16,-10,32,4);x.restore();
}
function drawConeDrop(x,t,dir){ const u=Math.min(1,t/.9),fade=Math.max(0,1-u),cx=30+dir*u*24,cy=9-u*18+u*u*42; x.globalAlpha=fade; fillPath(x,'#df7928',[[cx-8,cy],[cx+6,cy+1],[cx+11,cy+12],[cx-12,cy+12]]); x.fillStyle='#3a2a17'; x.fillRect(cx-11,cy+12,24,4); x.globalAlpha=1; }
function drawArmDrop(x,t,dir){ const u=Math.min(1,t/.9), fade=Math.max(0,1-u), ax=32+dir*u*18, ay=28-u*15+u*u*30; x.globalAlpha=fade; x.strokeStyle='#7c8779'; x.lineWidth=5; x.beginPath(); x.moveTo(ax,ay); x.lineTo(ax+10,ay+4); x.lineTo(ax+15,ay+9); x.stroke(); x.globalAlpha=1; }
function drawPlantDeath(x,type,t){ const fade=Math.max(0,1-t/.72);x.globalAlpha=fade; if(type==='pea')drawPea(x,2,0,true); else if(type==='sunflower')drawSunflower(x,2,0,true); else if(type==='potato')drawPotato(x,2,{armed:true,arm:2.2},true); else drawWall(x,2,0,true); x.globalAlpha=1; }
function drawGroundBlood(x,fx){
  const grow=Math.min(1,fx.age/.58),fade=fx.age>4.1?Math.max(0,1-(fx.age-4.1)/1.1):1;
  const e=1-Math.pow(1-grow,3);x.save();x.globalAlpha=fade;x.translate(32,45);x.rotate(fx.rot||0);
  const scale=.54+(((fx.id||1)*17)%19)/34, skew=.72+(((fx.id||1)*7)%11)/18;
  x.fillStyle='#5e1119';x.beginPath();x.ellipse(0,0,(6+e*17)*scale,(2.2+e*5.2)*scale*skew,0,0,Math.PI*2);x.fill();
  x.fillStyle='#8d1722';x.beginPath();x.ellipse(-3,-1,(3+e*9)*scale,(1.2+e*2.8)*scale,.18,0,Math.PI*2);x.fill();
  x.fillStyle='#b52631';for(const q of [[-17,-5,2.1],[14,-6,1.7],[19,2,1.4],[-21,3,1.3]]){x.beginPath();x.arc(q[0]*e,q[1]*e,q[2]*scale,0,Math.PI*2);x.fill();}
  x.restore();
}
function drawBloodBurst(x,t){ const u=Math.min(1,t/.35), fade=Math.max(0,1-u); x.globalAlpha=fade; [[30,30],[36,24],[23,35],[40,33],[32,18],[19,28],[44,28]].forEach((b,i)=>R(x,i%2?'#ff6b57':'#b6182d',b[0]+(i-2)*u*8,b[1]-u*8,3+(i%3),3+(i%2))); x.globalAlpha=1; }
const peaProjectileSheet=new Image();
peaProjectileSheet.decoding='async';
peaProjectileSheet.src='assets/pea-projectile-sheet.png';
const PEA_FLIGHT_FRAMES=12,PEA_IMPACT_FRAMES=5,PEA_TOTAL_FRAMES=17;
const peaFrameCache={green:[],fire:[]};
let peaSpriteMetrics=null;
function preparePeaSpriteMetrics(){
  if(peaSpriteMetrics||!peaProjectileSheet.complete||!peaProjectileSheet.naturalWidth)return peaSpriteMetrics;
  const sw=peaProjectileSheet.naturalWidth/PEA_TOTAL_FRAMES,sh=peaProjectileSheet.naturalHeight,bounds=[];
  let flightW=1,flightH=1,impactW=1,impactH=1;
  for(let frame=0;frame<PEA_TOTAL_FRAMES;frame++){
    const scan=document.createElement('canvas');scan.width=Math.max(1,Math.ceil(sw));scan.height=sh;
    const sg=scan.getContext('2d',{willReadFrequently:true});sg.imageSmoothingEnabled=false;
    sg.drawImage(peaProjectileSheet,frame*sw,0,sw,sh,0,0,scan.width,scan.height);
    const data=sg.getImageData(0,0,scan.width,scan.height).data;
    let minX=scan.width,minY=scan.height,maxX=-1,maxY=-1;
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){
      if(data[(y*scan.width+x)*4+3]>12){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
    }
    if(maxX<minX){minX=0;minY=0;maxX=scan.width-1;maxY=scan.height-1;}
    const box={x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
    bounds.push(box);
    if(frame<PEA_FLIGHT_FRAMES){flightW=Math.max(flightW,box.w);flightH=Math.max(flightH,box.h);}
    else{impactW=Math.max(impactW,box.w);impactH=Math.max(impactH,box.h);}
  }
  // Size the painted pixels, not the transparent source cell. This preserves the
  // artist's relative frame sizes while making the projectile readable on the lawn.
  peaSpriteMetrics={sw,sh,bounds,flightScale:Math.min(50/flightW,40/flightH),impactScale:Math.min(57/impactW,54/impactH)};
  return peaSpriteMetrics;
}
function getPeaSpriteFrame(frame,fire=false){
  if(!peaProjectileSheet.complete||!peaProjectileSheet.naturalWidth)return null;
  frame=Math.max(0,Math.min(PEA_TOTAL_FRAMES-1,frame|0));
  const bank=fire?peaFrameCache.fire:peaFrameCache.green;
  if(bank[frame])return bank[frame];
  const metrics=preparePeaSpriteMetrics();if(!metrics)return null;
  const box=metrics.bounds[frame],scale=frame<PEA_FLIGHT_FRAMES?metrics.flightScale:metrics.impactScale;
  const dw=Math.max(2,Math.round(box.w*scale)),dh=Math.max(2,Math.round(box.h*scale));
  const centerX=frame<PEA_FLIGHT_FRAMES?34:32;
  const c=document.createElement('canvas'),g=c.getContext('2d',{willReadFrequently:fire});
  c.width=c.height=64;g.imageSmoothingEnabled=false;
  g.drawImage(peaProjectileSheet,frame*metrics.sw+box.x,box.y,box.w,box.h,Math.round(centerX-dw/2),Math.round(32-dh/2),dw,dh);
  if(fire){
    const im=g.getImageData(0,0,64,64),d=im.data;
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]<8)continue;
      const energy=Math.max(d[i+1],(d[i]+d[i+1]+d[i+2])/3);
      if(energy>190){d[i]=255;d[i+1]=216;d[i+2]=61;}
      else if(energy>92){d[i]=239;d[i+1]=105;d[i+2]=19;}
      else{d[i]=31;d[i+1]=18;d[i+2]=10;}
    }
    g.putImageData(im,0,0);
  }
  bank[frame]=c;return c;
}
function drawPeaProjectile(x,p){
  x.save();if(p.reflected||p.speed<0){x.translate(64,0);x.scale(-1,1);}
  const age=p.age||0,travel=Math.abs(p.x-(p.startX??p.x)),wake=Math.max(0,Math.min(1,travel/.85));
  const frame=Math.floor(age*18)%PEA_FLIGHT_FRAMES,sprite=getPeaSpriteFrame(frame,!!p.fire);
  if(p.fire&&wake>.04){
    const seed=(p.id||0)*1.731;
    for(let i=0;i<5;i++){
      const q=(age*(2.7+i*.13)+i*.211+seed)%1;
      const px=22-q*19,py=32+Math.sin(age*18+i*2.17)*5+(i-2)*1.7;
      x.globalAlpha=(1-q)*(.48+(i%2)*.16);
      x.fillStyle=i%3===0?'#25150b':i%2?'#ffcf3d':'#ed6716';
      x.beginPath();x.moveTo(px-3-q*2,py);x.lineTo(px+2,py-2.2);x.lineTo(px+1,py+2.4);x.closePath();x.fill();
    }
    x.globalAlpha=1;
  }
  if(sprite){
    x.imageSmoothingEnabled=false;
    const squash=p.reflected&&p.reflectAge>0?Math.sin(Math.min(1,p.reflectAge/.34)*Math.PI):0;
    if(squash>0){x.translate(34,32);x.scale(1+.45*squash,1-.4*squash);x.translate(-34,-32);}
    x.drawImage(sprite,0,0);
  }else{
    x.fillStyle=p.fire?'#ed761a':'#63d64d';x.beginPath();x.arc(34,32,9.2,0,Math.PI*2);x.fill();
    x.fillStyle=p.fire?'#ffd83d':'#caffb9';x.beginPath();x.arc(31,29,3,0,Math.PI*2);x.fill();
  }
  x.restore();
}
function drawPeaImpact(x,t,fire=false){
  const u=Math.min(1,t/.34),frame=PEA_FLIGHT_FRAMES+Math.min(PEA_IMPACT_FRAMES-1,Math.floor(u*PEA_IMPACT_FRAMES));
  const sprite=getPeaSpriteFrame(frame,fire);
  x.save();x.globalAlpha=Math.max(.08,1-u*.88);x.imageSmoothingEnabled=false;
  // Pea momentum continues to the right, through the hit plane and behind the zombie.
  x.translate(u*11,0);x.transform(1+u*.18,0,0,1-u*.12,0,0);
  if(sprite)x.drawImage(sprite,0,0);
  else{x.fillStyle=fire?'#ed761a':'#67d44d';x.beginPath();x.arc(32,32,Math.max(2,9*(1-u)),0,Math.PI*2);x.fill();}
  x.restore();
  // Uneven fragments lead to the right rather than expanding as a centered pancake.
  x.save();
  for(let i=0;i<8;i++){
    const seed=((i*37+11)%17)/17,lead=8+u*(15+i*3.1),rise=(i%2?1:-1)*(3+u*(3+i*.72));
    const px=31+lead,py=32+rise+Math.sin(i*2.4)*2;
    x.globalAlpha=Math.max(0,(1-u)*(.58+seed*.38));
    x.fillStyle=fire?(i%3===0?'#24140a':i%2?'#ffd83d':'#ed6716'):(i%3===0?'#2e762b':i%2?'#9bf27a':'#58c744');
    x.save();x.translate(px,py);x.rotate(u*4+i*.73);x.fillRect(-1.5-seed*1.2,-1,3+seed*2.4,2+(i%2));x.restore();
  }
  x.restore();
}
function drawSun(x){
  x.clearRect(0,0,64,64);x.lineJoin='round';x.lineCap='round';
  // soft chunky sun rays
  x.fillStyle='#f2ad27';
  [[30,1,5,10],[30,53,5,10],[1,30,10,5],[53,30,10,5],[8,8,9,9],[47,8,9,9],[8,47,9,9],[47,47,9,9],[19,3,6,10],[40,3,6,10],[19,51,6,10],[40,51,6,10]].forEach(r=>x.fillRect(...r));
  x.fillStyle='#ffca43';
  [[16,8,7,9],[41,8,7,9],[8,16,9,7],[49,16,9,7],[8,41,9,7],[49,41,9,7],[16,49,7,9],[41,49,7,9]].forEach(r=>x.fillRect(...r));
  // round cat-face sun body
  x.fillStyle='#ffd968';x.beginPath();x.ellipse(32,32,19.2,18.5,0,0,Math.PI*2);x.fill();
  // ears sit inside the solar disk so it still reads as a sun at tiny mobile scale
  x.fillStyle='#ffd968';
  x.beginPath();x.moveTo(17,22);x.lineTo(21,10);x.lineTo(29,19);x.closePath();x.fill();
  x.beginPath();x.moveTo(35,19);x.lineTo(43,10);x.lineTo(47,22);x.closePath();x.fill();
  x.fillStyle='#f5a8a0';
  x.beginPath();x.moveTo(20.4,18.7);x.lineTo(22,13.3);x.lineTo(26.2,18.1);x.closePath();x.fill();
  x.beginPath();x.moveTo(37.8,18.1);x.lineTo(42,13.3);x.lineTo(43.6,18.7);x.closePath();x.fill();
  // warm face highlight
  x.fillStyle='#fff1a8';x.beginPath();x.ellipse(27,25,8.2,6.6,-.25,0,Math.PI*2);x.fill();
  x.fillStyle='#fff7d1';x.beginPath();x.ellipse(24.6,21.2,3.2,2.3,-.25,0,Math.PI*2);x.fill();
  // big friendly kitten eyes
  x.fillStyle='#725015';x.beginPath();x.ellipse(25.5,30,2.6,3.2,0,0,Math.PI*2);x.ellipse(38.5,30,2.6,3.2,0,0,Math.PI*2);x.fill();
  x.fillStyle='#fff9db';x.beginPath();x.ellipse(24.7,28.9,.85,1.05,0,0,Math.PI*2);x.ellipse(37.7,28.9,.85,1.05,0,0,Math.PI*2);x.fill();
  // tiny triangle nose + cat mouth
  x.fillStyle='#a86a23';x.beginPath();x.moveTo(32,34);x.lineTo(29.7,32.6);x.lineTo(34.3,32.6);x.closePath();x.fill();
  x.strokeStyle='#8b5c1c';x.lineWidth=1.8;x.beginPath();x.moveTo(32,34);x.lineTo(32,35.4);x.bezierCurveTo(32,38,28.7,38.8,27.2,36.8);x.moveTo(32,35.4);x.bezierCurveTo(32,38,35.3,38.8,36.8,36.8);x.stroke();
  // whiskers and blush
  x.strokeStyle='#9a6720';x.lineWidth=1.2;x.beginPath();x.moveTo(19.3,34.2);x.lineTo(24,35);x.moveTo(19,37);x.lineTo(24,36.8);x.moveTo(40,35);x.lineTo(44.7,34.2);x.moveTo(40,36.8);x.lineTo(45,37);x.stroke();
  x.fillStyle='#f4a5a5';x.beginPath();x.ellipse(20.8,39,3.2,2,0,0,Math.PI*2);x.ellipse(43.2,39,3.2,2,0,0,Math.PI*2);x.fill();
}

function drawCrawlerTrailCanvas(canvas,z){
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
  const w=canvas.width,h=canvas.height,phase=(z.entrailPhase||0)+gameTime*.75;
  const travel=Math.max(0,z.entrailTravel||0),detached=!!z.entrailDetached;
  const stretch=Math.max(.18,Math.min(5,(z.entrailAnchorX??z.x)-(z.x+.12)));
  const straighten=detached?Math.max(0,Math.min(1,(stretch-3)/2)):0;
  c.lineCap='round';c.lineJoin='round';

  // Wet smear underneath makes the cord feel dragged across grass rather than floating.
  c.strokeStyle='rgba(78,19,27,.48)';c.lineWidth=Math.max(5,h*.22);c.beginPath();
  c.moveTo(3,h*.60);
  for(let i=1;i<=12;i++){const q=i/12,amp=(1-straighten)*(h*.18)*(1-q*.35);c.lineTo(q*(w-8),h*.60+Math.sin(q*Math.PI*5.2+phase)*amp);}
  c.stroke();

  // Two intestinal loops. At birth they are heavily coiled; after detachment tension pulls
  // those coils flatter but never perfectly ruler-straight.
  for(let k=0;k<2;k++){
    c.strokeStyle=k===0?'#76242b':'#a94d51';c.lineWidth=k===0?Math.max(5,h*.18):Math.max(3,h*.11);
    c.beginPath();
    for(let i=0;i<=28;i++){
      const q=i/28;
      const birthCoil=(1-straighten)*(h*(.22-k*.035))*Math.sin(q*Math.PI*(6.2-k*.7)+phase+k*1.8);
      const pulledWave=h*.055*Math.sin(q*Math.PI*3.1+phase*.55+k);
      // Newly spawned entrails visibly droop out of the abdomen before settling on the turf.
      const bellyDrop=!detached?(1-q)*(-h*.20*Math.max(0,1-Math.min(1,travel/.65))):0;
      const yy=h*(.55+k*.06)+birthCoil+pulledWave*straighten+bellyDrop;
      const xx=3+q*(w-10);
      if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    }
    c.stroke();
  }

  // Belly end: a small torn, wet attachment. After 3 cells it becomes a loose dragged end.
  c.fillStyle=detached?'#8e2b34':'#b24d54';c.beginPath();c.ellipse(5,h*.54,Math.max(4,h*.12),Math.max(3,h*.10),-.25,0,Math.PI*2);c.fill();
  if(detached){
    c.strokeStyle='#d06a70';c.lineWidth=Math.max(1,h*.035);c.beginPath();c.moveTo(4,h*.50);c.lineTo(12,h*.61);c.stroke();
  }
  // Far end is organic now—no artificial stake/pin.
  c.fillStyle='#6d2029';c.beginPath();c.ellipse(w-7,h*.58,Math.max(4,h*.10),Math.max(3,h*.08),.3,0,Math.PI*2);c.fill();
}
const workerBossSheet=new Image();
workerBossSheet.decoding='async';
workerBossSheet.src='assets/worker-boss-sprite.png';
const workerBossFrameCache=[];
function getWorkerBossFrame(frame){
  if(!workerBossSheet.complete||!workerBossSheet.naturalWidth)return null;
  frame=Math.max(0,Math.min(3,frame|0));if(workerBossFrameCache[frame])return workerBossFrameCache[frame];
  const sw=workerBossSheet.naturalWidth/4,sh=workerBossSheet.naturalHeight,scan=document.createElement('canvas');
  scan.width=Math.max(1,Math.ceil(sw));scan.height=sh;
  const sg=scan.getContext('2d',{willReadFrequently:true});sg.imageSmoothingEnabled=false;sg.drawImage(workerBossSheet,frame*sw,0,sw,sh,0,0,scan.width,scan.height);
  const data=sg.getImageData(0,0,scan.width,scan.height).data;let minX=scan.width,minY=scan.height,maxX=-1,maxY=-1;
  for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(data[(y*scan.width+x)*4+3]>10){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  if(maxX<minX)return null;
  const bw=maxX-minX+1,bh=maxY-minY+1,scale=Math.min(284/bw,348/bh),dw=Math.round(bw*scale),dh=Math.round(bh*scale);
  const out=document.createElement('canvas');out.width=300;out.height=360;const g=out.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(workerBossSheet,frame*sw+minX,minY,bw,bh,Math.round((300-dw)/2),356-dh,dw,dh);
  // Remove stray near-transparent edge pixels, but preserve a soft one-pixel antialiased contour.
  const cleaned=g.getImageData(0,0,300,360),px=cleaned.data;
  for(let i=3;i<px.length;i+=4){if(px[i]<14)px[i]=0;else if(px[i]<72)px[i]=Math.min(255,Math.round(px[i]*1.22));}
  g.putImageData(cleaned,0,0);
  workerBossFrameCache[frame]=out;return out;
}
function drawThrownWrench(c,w){
  const u=Math.min(1,w.age/w.dur);c.clearRect(0,0,c.canvas.width,c.canvas.height);c.save();c.translate(c.canvas.width/2,c.canvas.height/2);
  if(!w.hit){
    c.rotate(w.angle);
    c.globalAlpha=.16;c.strokeStyle='#e4e0d6';c.lineWidth=5;for(let i=1;i<=3;i++){c.beginPath();c.arc(0,0,20+i*4,-1.5,-.2);c.stroke();}
    c.globalAlpha=1;
  }else c.rotate(-.35);
  c.scale(c.canvas.width/96,c.canvas.height/96);
  c.strokeStyle='#211d19';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-23,0);c.lineTo(20,0);c.stroke();
  c.strokeStyle='#8e897f';c.lineWidth=4;c.beginPath();c.moveTo(-23,0);c.lineTo(20,0);c.stroke();
  c.fillStyle='#494640';c.strokeStyle='#171513';c.lineWidth=4;c.beginPath();c.arc(-29,0,11,.45,Math.PI*1.55);c.lineTo(-25,0);c.closePath();c.fill();c.stroke();
  c.fillStyle='#6f6a61';c.beginPath();c.arc(25,0,8,0,Math.PI*2);c.fill();c.strokeStyle='#191715';c.lineWidth=3;c.stroke();c.fillStyle='#171513';c.beginPath();c.arc(25,0,3.2,0,Math.PI*2);c.fill();
  c.strokeStyle='#b8b2a6';c.lineWidth=1.5;c.beginPath();c.moveTo(-19,-2);c.lineTo(18,-2);c.stroke();
  if(w.hit){const a=Math.max(0,1-w.impactAge/.34);c.globalAlpha=a;for(let i=0;i<8;i++){const ang=i*.82-.35,len=17+(i%3)*6;c.strokeStyle=i%2?'#ffd74a':'#f29227';c.lineWidth=2.4;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(ang)*len,Math.sin(ang)*len);c.stroke();}}
  c.restore();
}
function drawWorkBossFallback(c,z){
  const w=c.canvas.width,h=c.canvas.height,t=gameTime,bob=Math.sin(t*3.5)*1.4;
  const throwing=(z.throwTime||0)>0,q=throwing?1-z.throwTime/.92:0;
  const wind=q<.38?q/.38:1,release=Math.max(0,Math.min(1,(q-.38)/.30)),recover=Math.max(0,Math.min(1,(q-.68)/.32));
  const lean=throwing?wind*9-recover*7:3+Math.sin(t*2.2)*1.5;
  c.save();c.clearRect(0,0,w,h);c.translate(w*.5,h*.54);c.scale(w/150,h/180);c.rotate(lean*Math.PI/180);
  if((z.teleportFx||0)>0){const a=Math.min(.42,z.teleportFx/.65*.42);c.fillStyle=`rgba(200,236,255,${a})`;c.fillRect(-58,-84,116,158);}
  // Grounded, uneven worker boots and torn trouser legs.
  c.fillStyle='rgba(5,8,7,.48)';c.beginPath();c.ellipse(1,68,45,9,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#273036';c.lineWidth=17;c.lineCap='round';c.beginPath();c.moveTo(-13,22);c.lineTo(-23,57+bob);c.moveTo(13,22);c.lineTo(22,58-bob);c.stroke();
  c.strokeStyle='#50606a';c.lineWidth=4;c.beginPath();c.moveTo(-18,31);c.lineTo(-24,52);c.moveTo(18,31);c.lineTo(22,52);c.stroke();
  c.fillStyle='#171c20';c.strokeStyle='#090b0c';c.lineWidth=3;c.beginPath();c.roundRect(-42,54+bob,35,16,4);c.roundRect(8,55-bob,37,16,4);c.fill();c.stroke();
  c.fillStyle='#62504a';c.fillRect(-34,56+bob,18,5);c.fillRect(17,57-bob,18,5);
  // Rotten torso, open blood-stained safety vest and exposed rib cage.
  c.fillStyle='#566a50';c.strokeStyle='#20291f';c.lineWidth=3;c.beginPath();c.moveTo(-27,-28);c.lineTo(25,-30);c.lineTo(31,28);c.lineTo(-25,27);c.closePath();c.fill();c.stroke();
  c.fillStyle='#2b1719';c.beginPath();c.ellipse(0,-2,20,29,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#d3cab0';c.lineWidth=4;for(let i=0;i<4;i++){const yy=-18+i*9;c.beginPath();c.moveTo(-4,yy);c.quadraticCurveTo(-16,yy+1,-17,yy+7);c.moveTo(4,yy);c.quadraticCurveTo(16,yy+1,17,yy+7);c.stroke();}
  c.strokeStyle='#6f171c';c.lineWidth=3;c.beginPath();c.moveTo(0,-21);c.lineTo(0,19);c.stroke();
  c.fillStyle='#d7d1bd';c.strokeStyle='#4c4840';c.lineWidth=3;c.beginPath();c.moveTo(-28,-27);c.lineTo(-10,-23);c.lineTo(-17,28);c.lineTo(-33,20);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(27,-29);c.lineTo(10,-23);c.lineTo(16,27);c.lineTo(32,18);c.closePath();c.fill();c.stroke();
  c.fillStyle='#8d2025';c.fillRect(-29,-13,8,6);c.fillRect(19,3,9,5);c.fillRect(-22,17,7,5);
  // Back arm hangs loose; throwing arm winds behind the head then snaps forward.
  c.strokeStyle='#526b50';c.lineWidth=12;c.beginPath();c.moveTo(25,-18);c.lineTo(39,12+bob);c.lineTo(42,35+bob);c.stroke();
  c.fillStyle='#435b45';c.beginPath();c.ellipse(43,39+bob,7,12,.1,0,Math.PI*2);c.fill();
  const handX=throwing?(-34+release*54-recover*18):(-40),handY=throwing?(-5-wind*42+release*32+recover*16):(23+bob);
  c.strokeStyle='#5f7757';c.lineWidth=12;c.beginPath();c.moveTo(-24,-18);c.lineTo(-36,-1-wind*18);c.lineTo(handX,handY);c.stroke();
  c.fillStyle='#465f48';c.beginPath();c.ellipse(handX,handY,8,10,-.3,0,Math.PI*2);c.fill();
  // Neck, hanging jaw, asymmetric dead eyes.
  c.fillStyle='#52684d';c.fillRect(-9,-41,17,18);c.fillStyle='#657d59';c.strokeStyle='#20291f';c.lineWidth=3;c.beginPath();c.ellipse(-3,-51,23,24,-.13,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#251416';c.beginPath();c.moveTo(-18,-47);c.lineTo(-4,-43);c.lineTo(-10,-29);c.lineTo(-21,-35);c.closePath();c.fill();
  c.fillStyle='#d7d2b5';for(let i=0;i<4;i++)c.fillRect(-17+i*5,-43+(i%2),3,5);
  c.fillStyle='#dedbbd';c.beginPath();c.ellipse(-11,-57,4.5,2.7,-.2,0,Math.PI*2);c.ellipse(5,-55,3.8,2.3,.15,0,Math.PI*2);c.fill();
  c.fillStyle='#54151b';c.beginPath();c.arc(-10,-57,1.5,0,Math.PI*2);c.arc(5,-55,1.4,0,Math.PI*2);c.fill();
  // Bright construction hardhat: the strongest silhouette cue from the reference.
  c.fillStyle='#f5bb0b';c.strokeStyle='#4c3505';c.lineWidth=4;c.beginPath();c.arc(-4,-66,27,Math.PI,Math.PI*2);c.lineTo(25,-61);c.lineTo(-35,-60);c.closePath();c.fill();c.stroke();
  c.fillStyle='#ffd82e';c.beginPath();c.roundRect(-9,-91,11,25,4);c.fill();c.stroke();c.fillStyle='#fff2a1';c.fillRect(-6,-87,3,13);
  c.fillStyle='#f0ad08';c.strokeStyle='#4c3505';c.lineWidth=3;c.beginPath();c.moveTo(-37,-62);c.lineTo(31,-62);c.lineTo(24,-55);c.lineTo(-34,-55);c.closePath();c.fill();c.stroke();
  // Wrench remains in the grip during wind-up and leaves the hand at release.
  if(!throwing||q<.48){
    c.save();c.translate(handX,handY);c.rotate(throwing?(-1.1+wind*.55):1.42);c.strokeStyle='#302d29';c.lineWidth=7;c.beginPath();c.moveTo(0,0);c.lineTo(0,41);c.stroke();c.strokeStyle='#9a958b';c.lineWidth=3;c.beginPath();c.moveTo(0,1);c.lineTo(0,39);c.stroke();c.fillStyle='#58534c';c.beginPath();c.arc(0,46,10,.35,Math.PI*1.65);c.lineTo(0,46);c.closePath();c.fill();c.restore();
  }
  if((z.bossHitFx||0)>0){const a=Math.min(.72,z.bossHitFx/.24*.72);c.globalCompositeOperation='source-atop';c.globalAlpha=a;c.fillStyle=z.bossHitFire?'#ff4d18':'#f2f3ef';c.fillRect(-75,-100,150,180);c.globalCompositeOperation='source-over';c.globalAlpha=1;}
  c.restore();
}
function drawWorkBoss(c,z){
  const throwing=(z.throwTime||0)>0,q=throwing?1-z.throwTime/.92:0;
  const frame=!throwing?0:(q<.36?1:(q<.62?2:3)),sprite=getWorkerBossFrame(frame);
  if(!sprite){drawWorkBossFallback(c,z);return;}
  const w=c.canvas.width,h=c.canvas.height,bob=!throwing?Math.sin(gameTime*3.2)*1.3:0;
  c.clearRect(0,0,w,h);c.save();c.translate(w*.5,h*.5+bob);
  const wind=throwing&&q<.36?q/.36:0,follow=throwing&&q>=.62?(q-.62)/.38:0;
  c.rotate(((-wind*3.5+follow*2.2)+(z.bossJumpTilt||0))*Math.PI/180);c.translate(-w*.5,-h*.5);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.shadowColor='rgba(7,10,8,.72)';c.shadowBlur=1.35;c.shadowOffsetY=1;c.drawImage(sprite,0,0,w,h);c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;
  if((z.bossHitFx||0)>0){const a=Math.min(.68,z.bossHitFx/.24*.68);c.globalCompositeOperation='source-atop';c.globalAlpha=a;c.fillStyle=z.bossHitFire?'#ff4d18':'#f2f3ef';c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';c.globalAlpha=1;}
  c.restore();
}
function drawBossTruck(c,open=0){
  const w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);c.save();c.translate(w*.5,h*.5);c.scale(w/240,h/230);c.lineJoin='round';c.lineCap='round';
  const door=Math.max(0,Math.min(1,open));
  // Heavy chassis and three visible off-road wheels establish the rear three-quarter angle.
  c.fillStyle='#171c1b';c.strokeStyle='#070a09';c.lineWidth=6;c.beginPath();c.moveTo(-113,55);c.lineTo(82,54);c.lineTo(108,82);c.lineTo(-100,91);c.closePath();c.fill();c.stroke();
  for(const [x,y,r] of [[-85,75,22],[-38,78,21],[16,79,20]]){
    c.fillStyle='#111514';c.strokeStyle='#050706';c.lineWidth=5;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();
    c.strokeStyle='#38403d';c.lineWidth=5;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5));c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke();}
    c.fillStyle='#626b67';c.beginPath();c.arc(x,y,r*.38,0,Math.PI*2);c.fill();c.fillStyle='#202624';c.beginPath();c.arc(x,y,r*.17,0,Math.PI*2);c.fill();
  }
  // Olive cargo-box side recedes to the left; roof and panel ribs catch the light.
  const olive=c.createLinearGradient(-110,-90,25,48);olive.addColorStop(0,'#526238');olive.addColorStop(.46,'#293d2d');olive.addColorStop(1,'#172a25');
  c.fillStyle=olive;c.strokeStyle='#0b1210';c.lineWidth=6;c.beginPath();c.moveTo(-106,-87);c.lineTo(26,-91);c.lineTo(47,-70);c.lineTo(40,54);c.lineTo(-108,53);c.closePath();c.fill();c.stroke();
  c.fillStyle='#637249';c.beginPath();c.moveTo(-102,-89);c.lineTo(27,-94);c.lineTo(47,-76);c.lineTo(-88,-71);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#718064';c.lineWidth=3;for(const x of [-84,-49,-14,20]){c.beginPath();c.moveTo(x,-68);c.lineTo(x,45);c.stroke();}
  c.strokeStyle='#14231e';c.lineWidth=5;c.beginPath();c.moveTo(-105,35);c.lineTo(40,36);c.moveTo(-102,-34);c.lineTo(43,-32);c.stroke();
  c.fillStyle='#151d1a';for(const [x,y] of [[-92,-55],[-58,-52],[-22,-52],[-91,14],[-55,15],[-18,13]]){c.fillRect(x,y,5,8);}
  // Rear armored frame and open, deep cargo bay.
  c.fillStyle='#555b56';c.strokeStyle='#111614';c.lineWidth=7;c.beginPath();c.moveTo(25,-78);c.lineTo(98,-66);c.lineTo(106,56);c.lineTo(36,53);c.closePath();c.fill();c.stroke();
  c.fillStyle='#080d0d';c.strokeStyle='#9b9990';c.lineWidth=5;c.beginPath();c.moveTo(36,-64);c.lineTo(88,-56);c.lineTo(94,43);c.lineTo(42,42);c.closePath();c.fill();c.stroke();
  // Crates, drums and wall braces remain visible through the doorway.
  c.strokeStyle='#303a36';c.lineWidth=3;c.beginPath();c.moveTo(47,-56);c.lineTo(49,38);c.moveTo(68,-58);c.lineTo(71,40);c.moveTo(89,-50);c.lineTo(91,39);c.stroke();
  const crate=(x,y,ww,hh,col)=>{c.fillStyle=col;c.strokeStyle='#171b16';c.lineWidth=3;c.fillRect(x,y,ww,hh);c.strokeRect(x,y,ww,hh);c.strokeStyle='rgba(230,213,139,.35)';c.beginPath();c.moveTo(x+4,y+4);c.lineTo(x+ww-4,y+hh-4);c.stroke();};
  crate(45,10,22,29,'#5a6437');crate(68,17,21,23,'#75603a');crate(54,-15,29,26,'#3d5131');
  c.fillStyle='#343d3b';c.strokeStyle='#111';c.lineWidth=2;c.beginPath();c.ellipse(43,25,7,4,0,0,Math.PI*2);c.fill();c.fillRect(36,25,14,17);c.beginPath();c.ellipse(43,42,7,4,0,0,Math.PI*2);c.fill();
  // Twin rear doors swing outward instead of behaving like a flat shutter.
  if(door>.02){
    const leftX=34-door*35,rightX=97+door*22;
    c.fillStyle='#39413d';c.strokeStyle='#101412';c.lineWidth=5;
    c.beginPath();c.moveTo(35,-65);c.lineTo(leftX-19,-54-door*7);c.lineTo(leftX-16,42+door*5);c.lineTo(39,43);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(90,-57);c.lineTo(rightX+13,-43+door*3);c.lineTo(rightX+14,48+door*5);c.lineTo(93,43);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#7d817a';c.lineWidth=2;c.strokeRect(leftX-13,-44-door*5,13,40);c.strokeRect(rightX+1,-34+door*2,9,36);
    c.fillStyle='#d5a928';for(const yy of [-48,-24,0,24]){c.fillRect(leftX-19,yy,5,11);c.fillRect(rightX+12,yy+5,5,11);}
  }else{
    c.fillStyle='#48504d';c.strokeStyle='#151a18';c.lineWidth=4;c.fillRect(38,-60,53,101);c.strokeRect(38,-60,53,101);
    c.strokeStyle='#8a918c';c.lineWidth=2;c.beginPath();c.moveTo(64,-57);c.lineTo(64,38);c.stroke();
  }
  // Lamps, armor bolts, hinges and hanging chains.
  c.fillStyle='#bf2d24';c.fillRect(31,-74,14,7);c.fillRect(79,-66,13,7);
  c.fillStyle='#d4aa2d';for(const [x,y] of [[31,47],[91,48],[-98,45]])c.fillRect(x,y,12,7);
  c.fillStyle='#c2c2b7';for(const [x,y] of [[31,-67],[98,-53],[37,36],[96,37],[-96,-73],[-96,38]]){c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fill();}
  if(door>.12){c.strokeStyle='#90958f';c.lineWidth=3;for(const side of [0,1]){c.beginPath();for(let i=0;i<8;i++){const q=i/7,x=(side?98:38)+(side?1:-1)*door*(8+i*2.1),y=-42+i*12;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}}
  c.restore();
}
function drawRaidRamp(c,extend,closing){
  const w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);c.save();c.lineJoin='round';c.lineCap='round';
  const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
  const p1=smooth(extend/.38),p2=smooth((extend-.27)/.40),p3=smooth((extend-.61)/.39);
  // Perspective flares toward the lawn: narrow at the truck, broad and threatening at the near edge.
  const hingeX=w*.94,tipX=w*.045,hingeTop=h*.25,hingeBottom=h*.75,tipTop=h*.055,tipBottom=h*.945;
  const settle=p3>.84?Math.sin((p3-.84)/.16*Math.PI)*h*.015:0;
  const point=(q,edge)=>({x:hingeX+(tipX-hingeX)*q,y:(edge==='top'?hingeTop:hingeBottom)+((edge==='top'?tipTop:tipBottom)-(edge==='top'?hingeTop:hingeBottom))*q+(q>.66?settle:0)});
  const lerp=(A,B,t)=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});
  const panel=(from,to,progress,index)=>{
    if(progress<=.002)return;
    const q0=from,q1=from+(to-from)*progress,A=point(q0,'top'),B=point(q1,'top'),C=point(q1,'bottom'),D=point(q0,'bottom');
    const grad=c.createLinearGradient(A.x,A.y,C.x,C.y);grad.addColorStop(0,['#69706c','#59615d','#4c5551'][index]);grad.addColorStop(.52,['#343c39','#303936','#29322f'][index]);grad.addColorStop(1,'#171d1b');
    c.fillStyle=grad;c.strokeStyle='#0b100f';c.lineWidth=8;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.lineTo(C.x,C.y);c.lineTo(D.x,D.y);c.closePath();c.fill();c.stroke();
    // Wide edge rails and two raised longitudinal wheel guides.
    for(const lane of [.08,.34,.66,.92]){const S=lerp(A,D,lane),E=lerp(B,C,lane);c.strokeStyle=(lane<.1||lane>.9)?'#a5aaa3':'#858b85';c.lineWidth=(lane<.1||lane>.9)?6:4;c.beginPath();c.moveTo(S.x,S.y);c.lineTo(E.x,E.y);c.stroke();c.strokeStyle='#202725';c.lineWidth=2;c.beginPath();c.moveTo(S.x,S.y+2);c.lineTo(E.x,E.y+2);c.stroke();}
    // Cross braces, diamond-plate dots and battered seams.
    for(let i=1;i<=3;i++){const q=q0+(q1-q0)*i/4,T=point(q,'top'),U=point(q,'bottom');c.strokeStyle=i%2?'#79807b':'#222a27';c.lineWidth=4;c.beginPath();c.moveTo(T.x+5,T.y+5);c.lineTo(U.x+5,U.y-5);c.stroke();}
    c.fillStyle='rgba(194,198,187,.68)';for(let ix=1;ix<7;ix++)for(let iy=1;iy<5;iy++){const q=q0+(q1-q0)*ix/7,T=point(q,'top'),U=point(q,'bottom'),P=lerp(T,U,iy/5);c.fillRect(P.x+(iy%2)*2,P.y,2,2);}
    // Yellow/black warning stripe spans the full moving nose.
    const strips=10;for(let i=0;i<strips;i++){const y0=B.y+(C.y-B.y)*i/strips,y1=B.y+(C.y-B.y)*(i+1)/strips;c.strokeStyle=i%2?'#171b19':'#e0ae24';c.lineWidth=7;c.beginPath();c.moveTo(B.x-2,y0);c.lineTo(B.x-2,y1);c.stroke();}
    // Riveted hinge lugs and side spikes echo the reference vehicle.
    c.fillStyle='#bd9229';c.strokeStyle='#121716';c.lineWidth=3;for(const P of [lerp(B,C,.08),lerp(B,C,.92)]){c.beginPath();c.arc(P.x,P.y,6,0,Math.PI*2);c.fill();c.stroke();}
    if(index===2&&progress>.75){c.fillStyle='#8f958f';c.strokeStyle='#111514';c.lineWidth=2;for(const k of [.12,.38,.64,.88]){const P=lerp(B,C,k),dir=k<.5?-1:1;c.beginPath();c.moveTo(P.x,P.y);c.lineTo(P.x-17,P.y+dir*7);c.lineTo(P.x-3,P.y+dir*12);c.closePath();c.fill();c.stroke();}}
  };
  panel(2/3,1,p3,2);panel(1/3,2/3,p2,1);panel(0,1/3,p1,0);
  // Hydraulic rams and hinge drums visibly carry the ramp's weight.
  c.fillStyle='#c39527';c.strokeStyle='#111715';c.lineWidth=4;
  for(const y of [hingeTop+8,hingeBottom-8]){c.beginPath();c.arc(hingeX,y,10,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#d8d8cc';c.beginPath();c.arc(hingeX,y,3.5,0,Math.PI*2);c.fill();c.fillStyle='#c39527';}
  const r1=point(Math.max(.04,p1*.31),'top'),r2=point(Math.max(.04,p1*.31),'bottom');
  c.strokeStyle='#202725';c.lineWidth=10;c.beginPath();c.moveTo(w*.98,h*.33);c.lineTo(r1.x,r1.y+9);c.moveTo(w*.98,h*.67);c.lineTo(r2.x,r2.y-9);c.stroke();
  c.strokeStyle='#bec3bd';c.lineWidth=4;c.beginPath();c.moveTo(w*.98,h*.33);c.lineTo(r1.x,r1.y+9);c.moveTo(w*.98,h*.67);c.lineTo(r2.x,r2.y-9);c.stroke();
  // Sagging safety chains follow both outer edges as the three sections unfold.
  if(p1>.08){for(const edge of ['top','bottom']){c.strokeStyle='#aeb2aa';c.lineWidth=3;c.beginPath();for(let i=0;i<=18;i++){const q=p1*(i/18),P=point(q,edge),sag=Math.sin(i/18*Math.PI)*h*.055*(edge==='top'?1:-1);if(i)c.lineTo(P.x,P.y+sag);else c.moveTo(P.x,P.y);}c.stroke();}}
  c.restore();
}
function moveLooseBucketPointer(e){
  if(!looseBucketDrag||e.pointerId!==looseBucketDrag.pointerId)return;
  const b=looseBuckets.find(x=>x.id===looseBucketDrag.id);if(!b)return;
  const br=grid.getBoundingClientRect();
  const gx=Math.max(.05,Math.min(COLS-.05,(e.clientX-br.left)/br.width*COLS));
  const gy=Math.max(.05,Math.min(ROWS-.05,(e.clientY-br.top)/br.height*ROWS));
  const target=plants.find(p=>p.hp>0&&Math.abs((p.col+.5)-gx)<.5&&Math.abs((p.row+.5)-gy)<.5);
  if(target){
    // Entering a planted cell visibly snaps the lifted bucket to that cell.
    b.x=target.col+.5;b.y=target.row+.18;
    looseBucketDrag.snapPlantId=target.id;
  }else{
    b.x=gx;b.y=gy;looseBucketDrag.snapPlantId=null;
  }
}
function releaseLooseBucketPointer(e){
  if(!looseBucketDrag||e.pointerId!==looseBucketDrag.pointerId)return;
  const drag=looseBucketDrag;looseBucketDrag=null;
  const b=looseBuckets.find(x=>x.id===drag.id);if(!b)return;
  const br=grid.getBoundingClientRect(),gx=(e.clientX-br.left)/br.width*COLS,gy=(e.clientY-br.top)/br.height*ROWS;
  const snapped=drag.snapPlantId?plants.find(p=>p.id===drag.snapPlantId&&p.hp>0&&p.type!=='crossfan'):null;
  const nearest=plants.filter(p=>p.hp>0&&p.type!=='crossfan').sort((a,c)=>Math.hypot((a.col+.5)-gx,(a.row+.5)-gy)-Math.hypot((c.col+.5)-gx,(c.row+.5)-gy))[0];
  const target=snapped||(nearest&&Math.abs((nearest.col+.5)-gx)<.5&&Math.abs((nearest.row+.5)-gy)<.5?nearest:null);
  if(target){
    target.armorHp=200;target.armorMax=200;playSfx('bucketEquip',1,'bucketEquip',90,target.col+.5);
    looseBuckets=looseBuckets.filter(x=>x.id!==b.id);
    say('铁桶装到 '+(plantNames[target.type]||'植物')+' 头上：获得 200 点钢铁护甲！');
  }else{
    b.state='free';b.magnetId=null;b.x=Math.max(.05,Math.min(COLS-.05,gx));b.y=Math.max(.05,Math.min(ROWS-.05,gy));
  }
}
document.addEventListener('pointermove',e=>{
  if(!looseBucketDrag)return;
  e.preventDefault();e.stopPropagation();moveLooseBucketPointer(e);
},{capture:true,passive:false});
document.addEventListener('pointerup',e=>{
  if(!looseBucketDrag)return;
  e.preventDefault();e.stopPropagation();releaseLooseBucketPointer(e);
},{capture:true,passive:false});
document.addEventListener('pointercancel',e=>{
  if(looseBucketDrag?.pointerId===e.pointerId)looseBucketDrag=null;
},{capture:true});

function render(){
  reusableSpriteCanvases.small.length=0;
  reusableSpriteCanvases.large.length=0;
  for(const c of units.querySelectorAll('canvas.sprite')){
    if(c.width===64*MOBILE_RENDER_SCALE&&reusableSpriteCanvases.small.length<256)reusableSpriteCanvases.small.push(c);
    else if(c.width===96*MOBILE_RENDER_SCALE&&reusableSpriteCanvases.large.length<64)reusableSpriteCanvases.large.push(c);
  }
  const frameUnits=document.createDocumentFragment();
  // Browser layout work is the current bottleneck; isolate this rapidly changing layer.
  // All children remain absolutely positioned inside the existing battlefield.
  for(const fx of groundBloodFx){const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=3;d.style.pointerEvents='none';d.appendChild(makeCanvas(c=>drawGroundBlood(c,fx)));frameUnits.appendChild(d)}
  for(const b of deathBloodDrops){const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(b.x);d.style.top=pctY(b.y);d.style.zIndex=15;d.style.pointerEvents='none';d.appendChild(makeCanvas(c=>{c.save();c.translate(32,32);c.rotate(Math.atan2(b.vy,b.vx)+1.57);const scale=.42+((b.id*11)%17)/25;c.fillStyle='#9f0718';c.beginPath();c.ellipse(0,0,Math.max(.55,b.size*24)*scale,Math.max(1.4,b.size*44)*scale,0,0,Math.PI*2);c.fill();c.fillStyle='#e12b39';c.beginPath();c.ellipse(-.5,-1,Math.max(.3,b.size*9)*scale,Math.max(.6,b.size*14)*scale,0,0,Math.PI*2);c.fill();c.restore();}));frameUnits.appendChild(d)}

  // Fourth-level finale uses the same three-lane battle truck as level 10.
  if(finalRaidBusy()){
    const r=finalRaid;
    const drive=Math.max(0,Math.min(1,r.age/.95)),driveEase=drive*drive*(3-2*drive);
    const truckX=11.60+(9.35-11.60)*driveEase;
    let ext=Math.max(0,Math.min(1,(r.age-.78)/Math.max(.2,r.extendDur-.78)));
    if(r.closing)ext*=Math.max(0,1-r.closeAge/1.25);
    if(ext>.01){
      const ramp=document.createElement('div');ramp.className='entity raidRamp';ramp.style.left=pctX(truckX-1.98);ramp.style.top=pctY(ROWS/2);ramp.style.width=(5.15/COLS*100)+'%';ramp.style.height=(100/ROWS*3.38)+'%';ramp.style.zIndex='4';ramp.style.pointerEvents='none';
      const rc=document.createElement('canvas');rc.width=MOBILE_PERF?300:480;rc.height=MOBILE_PERF?160:220;rc.style.width='100%';rc.style.height='100%';drawRaidRamp(rc.getContext('2d'),ext,!!r.closing);ramp.appendChild(rc);frameUnits.appendChild(ramp);
    }
    const d=document.createElement('div');d.className='entity raidRamp';d.style.left=pctX(truckX);d.style.top=pctY(ROWS/2);
    d.style.width=(3.75/COLS*100)+'%';d.style.height=(100/ROWS*3.38)+'%';d.style.zIndex='12';d.style.pointerEvents='none';
    const c=document.createElement('canvas');c.width=200;c.height=220;c.style.width='100%';c.style.height='100%';drawBossTruck(c.getContext('2d'),ext);d.appendChild(c);frameUnits.appendChild(d);
  }
  if(currentLevel===10&&level10Boss&&level10Boss.age>=2.15){
    const drive=Math.max(0,Math.min(1,(level10Boss.age-2.15)/1.15)),driveEase=drive*drive*(3-2*drive),truckX=11.60+(9.35-11.60)*driveEase;
    if(level10Boss.truckOpen>.01){
      const ramp=document.createElement('div');ramp.className='entity raidRamp';ramp.style.left=pctX(truckX-1.98);ramp.style.top=pctY(ROWS/2);ramp.style.width=(5.15/COLS*100)+'%';ramp.style.height=(100/ROWS*3.38)+'%';ramp.style.zIndex='4';ramp.style.pointerEvents='none';
      const rc=document.createElement('canvas');rc.width=MOBILE_PERF?300:480;rc.height=MOBILE_PERF?160:220;rc.style.width='100%';rc.style.height='100%';drawRaidRamp(rc.getContext('2d'),level10Boss.truckOpen,false);ramp.appendChild(rc);frameUnits.appendChild(ramp);
    }
    const truck=document.createElement('div');truck.className='entity raidRamp';truck.style.left=pctX(truckX);truck.style.top=pctY(ROWS/2);truck.style.width=(3.75/COLS*100)+'%';truck.style.height=(100/ROWS*3.38)+'%';truck.style.zIndex='12';truck.style.pointerEvents='none';
    const tc=document.createElement('canvas');tc.width=200;tc.height=220;tc.style.width='100%';tc.style.height='100%';drawBossTruck(tc.getContext('2d'),level10Boss.truckOpen);truck.appendChild(tc);frameUnits.appendChild(truck);
  }
  if(currentLevel===7&&level7Event){
    const e=level7Event;
    // Every lawn lane owns a scaffold. Wave 2/3/4 raises ALL five lane ramps to 1/2/3 tiers.
    for(let row=0;row<ROWS;row++){
      for(let tier=0;tier<e.scaffold;tier++){
        const d=document.createElement('div');d.className='raidRamp';
        d.style.left=pctX(COLS-.72-tier*.42);
        d.style.top=pctY(row+.50-tier*.16);
        d.style.width=(1.35/COLS*100)+'%';d.style.height=(100/ROWS*.82)+'%';d.style.zIndex='5';d.style.pointerEvents='none';
        const c=cachedCanvas('raidScaffold',x=>{
          x.save();x.scale(64/240,64/150);
          x.strokeStyle='#151b1e';x.lineWidth=10;x.beginPath();
          x.moveTo(14,132);x.lineTo(220,18);x.moveTo(35,132);x.lineTo(35,72);x.moveTo(120,76);x.lineTo(120,45);x.moveTo(205,31);x.lineTo(205,13);x.stroke();
          x.strokeStyle='#69757a';x.lineWidth=4;x.beginPath();
          x.moveTo(14,128);x.lineTo(220,14);x.moveTo(35,128);x.lineTo(35,72);x.moveTo(120,72);x.lineTo(120,45);x.moveTo(35,91);x.lineTo(120,54);x.moveTo(120,60);x.lineTo(205,23);x.stroke();x.restore();
        });
        d.appendChild(c);frameUnits.appendChild(d);
      }
    }
    if(e.plateAge>=0&&e.plateAge<2.0){const d=document.createElement('div');d.className='raidRamp';const u=Math.min(1,e.plateAge/1.1);d.style.left=pctX(COLS-.9);d.style.top=pctY(-.4+u*(ROWS-.8));d.style.width=(1.2/COLS*100)+'%';d.style.height=(100/ROWS*.42)+'%';d.style.zIndex='25';const c=document.createElement('canvas');c.width=260;c.height=90;const x=c.getContext('2d');x.translate(130,45);x.rotate(e.plateAge*3.5);x.fillStyle='#20282c';x.strokeStyle='#78858a';x.lineWidth=8;x.fillRect(-100,-18,200,36);x.strokeRect(-100,-18,200,36);d.appendChild(c);frameUnits.appendChild(d);}
    if(e.planes?.length){
      for(const plane of e.planes){
        if(plane.age<0||plane.age>plane.dur)continue;
        const u=Math.min(1,plane.age/plane.dur),d=document.createElement('div');d.className='raidRamp';
        const climb=u<.58?0:Math.min(1,(u-.58)/.42);
        d.style.left=pctX(COLS+1.0-u*(COLS+2.0));
        d.style.top=pctY(plane.row+.5-climb*1.15);
        d.style.width=(1.55/COLS*100)+'%';d.style.height=(100/ROWS*.58)+'%';d.style.zIndex='24';d.style.pointerEvents='none';
        const c=document.createElement('canvas');c.width=320;c.height=120;const x=c.getContext('2d');
        x.fillStyle='#222a2e';x.strokeStyle='#77858b';x.lineWidth=6;
        x.beginPath();x.moveTo(14,63);x.lineTo(225,44);x.lineTo(304,60);x.lineTo(224,78);x.closePath();x.fill();x.stroke();
        x.fillStyle='#46535a';x.beginPath();x.moveTo(128,50);x.lineTo(184,8);x.lineTo(210,48);x.closePath();x.fill();
        x.beginPath();x.moveTo(128,72);x.lineTo(184,112);x.lineTo(210,75);x.closePath();x.fill();
        x.fillStyle='#a7c7d0';x.fillRect(240,53,29,9);d.appendChild(c);frameUnits.appendChild(d);
      }
    }
  }
  for(const saw of chainsaws){
    if(saw.used)continue;
    const d=document.createElement('div');d.className='chainsawUnit';d.style.left=pctX(-.08);d.style.top=pctY(saw.row+.5);
    d.appendChild(makeCanvas(c=>drawChainsaw(c,Math.sin(gameTime*2)*.05,true)));frameUnits.appendChild(d);
  }
  for(const fx of chainsawFx){
    const d=document.createElement('div');d.className='chainsawUnit fly';d.style.left=pctX(fx.x);d.style.top=pctY(fx.row+.5);
    d.appendChild(makeCanvas(c=>drawChainsaw(c,fx.age*28,true)));frameUnits.appendChild(d);
  }
  for(const fx of crossFireFx){
    const d=document.createElement('div');d.className='crossFireFx';d.style.position='absolute';d.style.inset='0';d.style.zIndex='16';d.style.pointerEvents='none';
    const c=document.createElement('canvas');c.width=MOBILE_PERF?640:1280;c.height=Math.round(c.width*ROWS/COLS);c.style.width='100%';c.style.height='100%';c.style.display='block';
    // translate source plant cell into the full-board canvas coordinate system
    const ctx=c.getContext('2d');ctx.save();ctx.translate((fx.col+.5)/COLS*c.width,(fx.row+.5)/ROWS*c.height);
    const temp=document.createElement('canvas');temp.width=c.width*2;temp.height=c.height*2;drawCrossFireCanvas(temp,fx);
    ctx.drawImage(temp,-temp.width/2,-temp.height/2);ctx.restore();d.appendChild(c);frameUnits.appendChild(d);
  }
  for(const tile of fireTiles){
    const d=document.createElement('div');d.className='entity tileFire';d.style.left=pctX(tile.col+.5);d.style.top=pctY(tile.row+.5);d.style.width=(1/COLS*100)+'%';d.style.height=(100/ROWS)+'%';d.style.transform='translate(-50%,-50%)';d.style.zIndex='3';d.style.pointerEvents='none';
    const c=document.createElement('canvas');c.width=MOBILE_PERF?112:220;c.height=MOBILE_PERF?112:220;c.style.width='100%';c.style.height='100%';c.style.display='block';drawBurningTileCanvas(c,tile);d.appendChild(c);frameUnits.appendChild(d);
  }
  for(const p of plants){
    const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(p.col+.5);d.style.top=pctY(p.row+.5);d.style.zIndex='8';d.style.visibility='visible';
    if(p.type==='magnet'&&looseBuckets.some(b=>b.magnetId===p.id&&b.state==='held'))d.classList.add('magnetBucketReady');
    const held=glovePlantId===p.id;
    if((p.squashDeath||0)>0){
      const total=p.squashDeathTotal||.78,u=1-p.squashDeath/total;
      // Impact: fast vertical crush + horizontal spread; then a short flattened hold/fade.
      const hit=Math.min(1,u/.42),ease=1-Math.pow(1-hit,3);
      const sy=Math.max(.12,1-ease*.86),sx=1+ease*.46;
      const shake=(1-hit)*Math.sin(u*Math.PI*16)*3.2;
      const sink=ease*19;
      d.style.transform=`translate(calc(-50% + ${shake.toFixed(1)}px),calc(-50% + ${sink.toFixed(1)}px)) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
      d.style.transformOrigin='50% 86%';d.style.zIndex='9';
      d.style.filter=`drop-shadow(0 ${Math.round(3+ease*5)}px ${Math.round(2+ease*3)}px rgba(0,0,0,.38))`;
      if(u>.76)d.style.opacity=String(Math.max(0,(1-u)/.24));
    }else if(held){
      const gf=(gloveFx&&gloveFx.kind==='hold'&&gloveFx.plantId===p.id)?gloveFx:null;
      const u=Math.min(1,(gf?.age||0)/.42), grab=u<.34?(u/.34):1;
      const shrink=u<.34?1:(1-Math.min(1,(u-.34)/.66)*.86);
      const lift=grab*15;
      d.style.transform=`translate(-50%,calc(-50% - ${lift.toFixed(1)}px)) scale(${shrink.toFixed(3)})`;
      d.style.opacity=u>.88?String(Math.max(0,(1-u)/.12)):'1';
      d.style.zIndex='28';d.style.filter='drop-shadow(0 6px 3px rgba(0,0,0,.30))';
    }
    else if(p.gloveDrop>0){
      const u=1-p.gloveDrop/.62;
      const appear=Math.max(0,Math.min(1,(u-.10)/.62));
      const scale=.16+.84*(1-Math.pow(1-appear,2));
      const lift=(1-appear)*18-Math.sin(Math.min(1,appear)*Math.PI)*3;
      d.style.transform=`translate(-50%,calc(-50% - ${lift.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
      d.style.opacity=String(Math.min(1,appear*2.8));d.style.zIndex='27';
    }
    const f=p.lastFrame;
    d.appendChild(makeCanvas(ctx=>{
      const damaged=p.hp<=p.maxHp*.5;
      const age=p.plantingAge??.56;
      // Planting was intentionally shortened to two beats and now completes at .56 s.
      // Do not keep routing the plant through the birth renderer after that point,
      // otherwise fire transformation FX can never become visible.
      if(age<.56){drawPlantingBirth(ctx,p.type,age,p,f,damaged);return;}
      if((p.type==='pea'||p.type==='wall')&&p.fireTransform>0){
        const transformBase={...p,fireMode:false,fireMorph:0,fireAnim:0,charge:0};
        drawPlantBody(ctx,p.type,f,transformBase,damaged);
        drawFireTransformFx(ctx,p);
      }else{
        drawPlantBody(ctx,p.type,f,p,damaged);
      }
    }));
    // Every plant now has a green body HP bar; equipped bucket armor sits above it in steel.
    const ph=document.createElement('div');ph.className='plantHp';const pf=document.createElement('div');pf.className='plantHpFill';pf.style.width=(Math.max(0,Math.min(1,p.hp/p.maxHp))*100)+'%';ph.appendChild(pf);d.appendChild(ph);
    if((p.armorHp||0)>0){
      const ah=document.createElement('div');ah.className='plantArmorHp';const af=document.createElement('div');af.className='plantArmorHpFill';af.style.width=(Math.max(0,Math.min(1,p.armorHp/(p.armorMax||200)))*100)+'%';ah.appendChild(af);d.appendChild(ah);
      const helmet=makeCanvas(c=>drawPlantBucketHelmet(c,p));helmet.style.position='absolute';helmet.style.inset='0';helmet.style.pointerEvents='none';d.appendChild(helmet);
    }
    frameUnits.appendChild(d);
  }
  // Detached buckets are draggable equipment. Drag state lives outside the rebuilt DOM,
  // so mouse/finger dragging remains stable even though units are redrawn every frame.
  for(const b of looseBuckets){
    const d=document.createElement('div');d.className='looseBucket';d.dataset.bucketId=b.id;
    d.style.left=pctX(b.x);d.style.top=pctY(b.y);
    if(b.state==='held'&&b.magnetId)d.classList.add('magnetReady');
    if(looseBucketDrag?.id===b.id){d.classList.add('dragging');if(looseBucketDrag.snapPlantId)d.classList.add('snapTarget');}
    d.appendChild(cachedCanvas('looseBucket:'+((b.hp<=50)?2:(b.hp<=130?1:0)),c=>drawBucketHelmet(c,b.hp)));
    d.addEventListener('pointerdown',e=>{
      e.preventDefault();e.stopPropagation();
      // units is rebuilt every frame, so drag ownership must live in game state,
      // not on this short-lived DOM node.
      looseBucketDrag={id:b.id,pointerId:e.pointerId,snapPlantId:null};playSfx('bucketLift',.9,'bucketLift',80,b.x);
      b.magnetId=null;b.state='dragging';
      moveLooseBucketPointer(e);
    });
    frameUnits.appendChild(d);
  }
  for(const fx of magnetFx){const u=fx.age/fx.life,d=document.createElement('div');d.className='magnetPulse';d.style.left=pctX(fx.x-2);d.style.top=pctY(fx.y-2);d.style.width=(4/COLS*100)+'%';d.style.height=(4/ROWS*100)+'%';d.style.opacity=String(1-u);frameUnits.appendChild(d);}
  if(gloveFx){
    const gp=plants.find(p=>p.id===gloveFx.plantId&&p.hp>0);
    if(gp){
      const d=document.createElement('div');d.className='entity gloveAnim';d.style.left=pctX(gp.col+.5);d.style.top=pctY(gp.row+.5);d.style.zIndex='30';d.style.pointerEvents='none';
      const c=makeCanvas(ctx=>drawGloveAction(ctx,gloveFx));d.appendChild(c);frameUnits.appendChild(d);
    }
  }
  // Fan wind is a four-cell world-space stream of animated cold lines.
  for(const p of plants){
    if(p.type!=='fan'||p.hp<=0)continue;
    const d=document.createElement('div');d.className='fanWind';
    d.style.position='absolute';d.style.left=pctX(p.col+.72);d.style.top=pctY(p.row+.5);
    d.style.width=(4/COLS*100)+'%';d.style.height=(100/ROWS*.64)+'%';d.style.transform='translateY(-50%)';d.style.zIndex='6';d.style.pointerEvents='none';
    const c=document.createElement('canvas');c.width=MOBILE_PERF?300:900;c.height=MOBILE_PERF?60:150;c.style.width='100%';c.style.height='100%';c.style.display='block';drawFanWindCanvas(c,p);d.appendChild(c);frameUnits.appendChild(d);
  }
  // Crawler entrails are world-space trails, separate from the crawler sprite.
  for(const z of zombies){
    if(z.type!=='crawler'||z.hp<=0||z.entrailAnchorX==null)continue;
    const startX=z.x+.12,endX=Math.min(startX+5,Math.max(startX+.18,z.entrailAnchorX));
    const mid=(startX+endX)/2, widthPct=((endX-startX)/COLS*100);
    const d=document.createElement('div');d.className='crawlerTrail';
    d.style.position='absolute';d.style.left=pctX(mid);d.style.top=pctY(z.row+.72);
    d.style.width=widthPct+'%';d.style.height=(100/ROWS*.34)+'%';d.style.transform='translate(-50%,-50%)';d.style.zIndex='3';d.style.pointerEvents='none';
    const c=document.createElement('canvas');c.width=MOBILE_PERF?240:768;c.height=MOBILE_PERF?48:112;c.style.width='100%';c.style.height='100%';c.style.display='block';
    drawCrawlerTrailCanvas(c,z);d.appendChild(c);frameUnits.appendChild(d);
  }
  for(const b of brainDrops){
    const d=document.createElement('div');d.className='entity brainDrop';
    const life=b.groundLife||30;
    d.dataset.life=String(Math.max(0,life-(b.groundAge||0)).toFixed(1));
    d.style.left=pctX(b.x);
    if(b.landed){
      d.style.top=pctY(b.y??(b.row+.54));
    }else{
      const q=Math.max(0,Math.min(1,(b.landingAge||0)/(b.landingDelay||1.16)));
      // Separate visible fall from the corpse, then settle onto the lawn.
      const fallY=(b.row+.18)+(b.row+.54-(b.row+.18))*q-.18*Math.sin(q*Math.PI);
      d.style.top=pctY(fallY);
      d.style.transform=`translate(-50%,-50%) rotate(${(q*320).toFixed(1)}deg)`;
    }
    d.style.zIndex='19';d.style.pointerEvents='none';
    d.appendChild(makeCanvas(c=>drawBrainDrop(c,b)));frameUnits.appendChild(d);
  }
  for(const w of bossWrenches){
    const d=document.createElement('div');d.className='entity';d.style.left=pctX(w.x);d.style.top=pctY(w.y);d.style.width=(.92/COLS*100)+'%';d.style.height=(100/ROWS*.92)+'%';d.style.zIndex='27';d.style.pointerEvents='none';
    const wc=document.createElement('canvas');wc.width=96*MOBILE_RENDER_SCALE;wc.height=96*MOBILE_RENDER_SCALE;wc.style.width='100%';wc.style.height='100%';drawThrownWrench(wc.getContext('2d'),w);d.appendChild(wc);frameUnits.appendChild(d);
  }
  for(const z of zombies){
    const d=document.createElement('div');d.className='entity zombie'+(z.eating?' bite':'')+((z.hurt>0||z.stun>0)?' hurt':'')+(z.fanSlow?' chilled':'')+(z.brainDropId?' brainEating':'');
    if(z.type==='workboss'){
      d.classList.add('workBoss');d.style.left=pctX(z.x);d.style.top=pctY(z.row+.5+(z.bossAirY||0));d.style.width=(1.38/COLS*100)+'%';d.style.height=(100/ROWS*1.72)+'%';d.style.zIndex='18';d.style.pointerEvents='none';
      const bc=document.createElement('canvas');bc.width=150*MOBILE_RENDER_SCALE;bc.height=180*MOBILE_RENDER_SCALE;bc.style.width='100%';bc.style.height='100%';bc.style.imageRendering='auto';drawWorkBoss(bc.getContext('2d'),z);d.appendChild(bc);
      frameUnits.appendChild(d);continue;
    }
    const bitePhase=z.eating?((z.attack%0.7)/0.7):0;
    if(z.type==='imp'){
      const bob=z.eating?0:Math.sin((z.walkTick||0)*Math.PI*2)*0.012;
      d.style.left=pctX(z.x+(z.eatMode==='front'?-0.02:0)+(z.mountVisualX||0));
      const raidU=z.raidDrop?Math.max(0,Math.min(1,z.raidDrop.age/z.raidDrop.dur)):1;const raidY=z.raidDrop?(z.raidDrop.startY+(z.row+.68-z.raidDrop.startY)*raidU-.18*Math.sin(raidU*Math.PI)):(z.row+.68+(z.airY||0)+bob);d.style.top=pctY(raidY);
      if(z.mountedToId&&z.mountVisualAngle)d.style.transform=`translate(-50%,-50%) rotate(${z.mountVisualAngle.toFixed(2)}deg)`;
      d.style.zIndex=z.mountedToId?'14':'11';
      d.appendChild(makeCanvas(c=>drawImp(c,z.walkTick,z.eatMode,(z.hurt>0||z.stun>0),!!z.mountedToId,bitePhase)));
    }else{
      const airborne=z.lungeTime>0?-0.075*Math.sin(Math.max(0,Math.min(1,((1-z.lungeTime/(z.lungeDuration||1.50))-.40)/.40))*Math.PI):0; const wobbleY=z.eating?0:[0,-0.02,0,0.02][Math.floor(z.walkTick)%4]+airborne;
      const biteBodyLean=z.eating?(bitePhase<.34?bitePhase/.34*.025:bitePhase<.62?.025:(1-(bitePhase-.62)/.38)*.025):0;
      const poseX=z.eatMode==='front'?(-0.055-biteBodyLean):0;
      if((z.type==='normal'||z.type==='cone'||z.type==='bucket')&&z.hitStun>0)d.classList.add('normalHit');
      if(z.type==='giant'||(z.giantTransform||0)>0)d.classList.add('giantUnit');
      if((z.giantTransform||0)>0)d.classList.add('giantTransforming');else if(z.brainDropId&&z.type==='giant')d.classList.add('giantBrainEating');
      const raidU=z.raidDrop?Math.max(0,Math.min(1,z.raidDrop.age/z.raidDrop.dur)):1;const slideY=z.bossSlide?(z.bossSlide.y||0):0;const raidY=z.raidDrop?(z.raidDrop.startY+(z.row+.5-z.raidDrop.startY)*raidU-.22*Math.sin(raidU*Math.PI)):(z.row+.5+(z.bossSlide?slideY:wobbleY));d.style.left=pctX(z.x+poseX);d.style.top=pctY(raidY);
      if(z.bossSlide){d.dataset.landingPhase=z.bossSlide.phase;d.style.zIndex='15';}
      if((z.giantTransform||0)>0)d.appendChild(makeLargeZombieCanvas(c=>drawGiantMutation(c,z)));
      else if(z.type==='giant')d.appendChild(makeLargeZombieCanvas(c=>drawMutantGiant(c,z)));
      else d.appendChild(makeCanvas(c=>{
        const drawBase=ctx=>{
          if(z.type==='miner'){if(z.digState==='underground'||z.digState==='rising')drawMinerMound(ctx,z);else drawMinerZombie(ctx,z,bitePhase);}
          else if(z.type==='brain')drawBrainZombie(ctx,z,bitePhase);
          else if(z.type==='crawler')drawCrawler(ctx,z.walkTick,z.eatMode,(z.hurt>0||z.stun>0),bitePhase,z.crawlPhase);
          else if(z.type==='longhair')drawLongHairZombie(ctx,z,bitePhase);
          else if(z.type==='normal')drawNormalZombieSprite(ctx,z,bitePhase);
          else drawZombie(ctx,z.type==='cone'&&z.coneHp>0,z.walkTick,z.eatMode,(z.hurt>0||z.stun>0),z.armGone,z.lungeTime,bitePhase,(z.type==='cone'||z.type==='bucket')?z.hitStun:0,z.type==='bucket'?z.coneHp:0);
        };if(z.bossSlide)drawCargoArticulated(c,z,drawBase);else drawBase(c);
      }));
      if(z.brainDropId&&z.type!=='giant')d.appendChild(makeCanvas(c=>drawBrainEatingOverlay(c,z)));
    }
    const hpMax=(z.type==='miner'&&z.digState==='underground')?0:(z.maxHp||0), hpNow=Math.max(0,z.hp||0);
    if(hpMax>0&&!z.bossSlide){
      const bar=document.createElement('div');bar.className='chalkHp';
      const fill=document.createElement('div');fill.className='chalkHpFill';fill.style.height=(Math.max(0,Math.min(1,hpNow/hpMax))*100)+'%';
      bar.appendChild(fill);d.appendChild(bar);
    }
    if((z.coneMax||0)>0&&z.coneHp>0){
      const armor=document.createElement('div');armor.className='armorHp';
      const af=document.createElement('div');af.className='armorHpFill';af.style.height=(Math.max(0,Math.min(1,z.coneHp/z.coneMax))*100)+'%';
      armor.appendChild(af);d.appendChild(armor);
    }
    frameUnits.appendChild(d);
  }
  for(const fx of armorBreakFx){
    const host=zombies.find(z=>z.id===fx.zombieId&&z.hp>0);
    const bx=host?host.x:fx.x, row=host?host.row:fx.row, u=Math.min(1,fx.age/fx.life);
    // brief cracked remnant, then 4 black-steel shards burst away.
    if(u<.28){
      const rem=document.createElement('div');rem.className='armorBreak';
      rem.style.left=pctX(bx+.43);rem.style.top=pctY(row+.5-.315);
      rem.style.height=(100/ROWS*.14)+'%';rem.style.opacity=String(1-u/.28);
      rem.style.transform='translate(-50%,-50%) scaleY(1.08)';
      frameUnits.appendChild(rem);
    }
    for(let i=0;i<4;i++){
      const q=Math.max(0,(u-.08)/.92), dir=i<2?-1:1, spread=(i%2?1:.55);
      const shard=document.createElement('div');shard.className='armorBreak';
      shard.style.left=pctX(bx+.43);shard.style.top=pctY(row+.5-.315);
      shard.style.height=(100/ROWS*(.045+.022*(i%2)))+'%';
      shard.style.opacity=String(Math.max(0,1-q));
      shard.style.transform=`translate(-50%,-50%) translate(${dir*q*(11+9*spread)}px,${(-Math.sin(q*Math.PI)*10+q*q*12+(i-1.5)*2).toFixed(1)}px) rotate(${dir*q*(45+17*i)}deg)`;
      frameUnits.appendChild(shard);
    }
  }
  for(const fx of armorHpBreakFx){
    const host=zombies.find(z=>z.id===fx.zombieId&&z.hp>0);
    const bx=host?host.x:fx.x,row=host?host.row:fx.row,u=Math.min(1,fx.age/fx.life);
    const piece=document.createElement('div');piece.className='armorBreak';
    // Spawn exactly from the black-steel armor bar, not the white body bar.
    piece.style.left=pctX(bx+.43);
    piece.style.top=pctY(row+.5-.315-(fx.from+fx.size*.5)*.14);
    piece.style.height=Math.max(3,fx.size*(100/ROWS*.14))+'%';
    // Fresh chip is black steel; while drifting it oxidizes/fades toward neutral gray.
    const g=Math.round(38+u*105), hi=Math.round(73+u*88), lo=Math.round(18+u*92);
    piece.style.background=`linear-gradient(90deg,rgb(${lo},${lo+5},${lo+8}),rgb(${hi},${hi+7},${hi+11}) 48%,rgb(${g},${g+5},${g+8}))`;
    piece.style.boxShadow=`inset 1px 0 rgba(155,170,178,${.72*(1-u)}),inset -2px 0 rgba(5,8,10,.65),2px 3px 2px rgba(0,0,0,.28)`;
    piece.style.opacity=String(Math.max(0,1-u));
    piece.style.transform=`translate(-50%,-50%) translate(${(u*27).toFixed(1)}px,${(-u*4).toFixed(1)}px) rotate(${(u*13).toFixed(1)}deg)`;
    frameUnits.appendChild(piece);
  }
  for(const fx of hpBreakFx){
    const host=zombies.find(z=>z.id===fx.zombieId&&z.hp>0);
    const x=host?host.x:fx.x, row=host?host.row:fx.row, u=Math.min(1,fx.age/fx.life);
    const piece=document.createElement('div');piece.className='chalkBreak';
    // The bar rides immediately behind the zombie (right side, since zombies face left).
    // A damaged chunk keeps its full size: it snaps off and slides sideways like a broken chalk block.
    piece.style.left=pctX(x+.43);piece.style.top=pctY(row+.5 + .245-(fx.from+fx.size*.5)*.49);
    piece.style.height=Math.max(3,fx.size*(100/ROWS*.49))+'%';
    if(fx.fireDamage){
      piece.style.background=u<.28?'linear-gradient(90deg,#fff59a,#ffe22e 35%,#ffad16 68%,#ff6818)':(u<.68?'linear-gradient(90deg,#ffe43b,#ffb014 48%,#ff711c)':'linear-gradient(90deg,#ffc51d,#ff8b18 62%,#ef5b18)');
      piece.style.boxShadow=`0 0 ${Math.max(2,8*(1-u))}px rgba(255,150,24,${Math.max(0,.9-u)}),inset 2px 0 rgba(255,247,142,.8),inset -2px 0 rgba(153,55,10,.35)`;
      piece.style.filter=`drop-shadow(2px 2px 1px rgba(0,0,0,.28)) brightness(${1.12-u*.18})`;
    }else{
      piece.style.background=u<.24?'linear-gradient(90deg,#fff,#e9e9e5 68%,#bfc0bb)':(u<.60?'linear-gradient(90deg,#c7c7c2,#9f9f9a)':'linear-gradient(90deg,#e0e0dc,#c9c9c5)');
    }
    piece.style.opacity=String(Math.max(0,1-u));
    piece.style.transform=fx.fireDamage
      ?`translate(-50%,-50%) translate(${(u*31).toFixed(1)}px,${(-u*15-Math.sin(u*Math.PI)*8).toFixed(1)}px) rotate(${(u*22).toFixed(1)}deg) scale(${(1+u*.18).toFixed(2)})`
      :`translate(-50%,-50%) translateX(${u*18}px)`;
    frameUnits.appendChild(piece);
  }
  for(const fx of coneFx){
    const d=document.createElement('div');d.className='entity zombie';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=8;
    d.appendChild(makeCanvas(c=>fx.kind==='bucket'?drawBucketDrop(c,fx.age,fx.dir):drawConeDrop(c,fx.age,fx.dir)));frameUnits.appendChild(d);
  }
  for(const fx of blastFx){
    const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=12;
    d.appendChild(makeCanvas(c=>drawPotatoBlast(c,fx.age)));frameUnits.appendChild(d);
  }
  for(const fx of deathFx){
    const d=document.createElement('div');d.className='entity '+((fx.type==='zombie'||fx.type==='brainZombie')?'zombie':'plant');d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);
    d.appendChild(makeCanvas(c=>fx.type==='brainZombie'?drawBrainZombieDeath(c,fx):(fx.type==='zombie'?drawZombieDeath(c,fx.cone,fx.age,fx.zombieType):(fx.type==='ashZombie'?drawAshZombieDeath(c,fx):(fx.type==='fireZombie'?drawFireZombieDeath(c,fx):drawPlantDeath(c,fx.plantType,fx.age))))));frameUnits.appendChild(d);
  }
  for(const p of peas){const d=document.createElement('div');d.className='entity peaShot';d.style.left=pctX(p.x);d.style.top=pctY(p.y??(p.row+.39));d.appendChild(makeCanvas(c=>drawPeaProjectile(c,p)));frameUnits.appendChild(d)}
  for(const fx of peaImpactFx){const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=11;d.appendChild(makeCanvas(c=>drawPeaImpact(c,fx.age,!!fx.fire)));frameUnits.appendChild(d)}
  for(const fx of bloodFx){const d=document.createElement('div');d.className='entity plant';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=12; d.appendChild(makeCanvas(c=>drawBloodBurst(c,fx.age))); frameUnits.appendChild(d)}
  for(const fx of armFx){const d=document.createElement('div');d.className='entity zombie';d.style.left=pctX(fx.x);d.style.top=pctY(fx.y);d.style.zIndex=8; d.appendChild(makeCanvas(c=>drawArmDrop(c,fx.age,fx.dir))); frameUnits.appendChild(d)}
  for(const s of suns){
    const d=document.createElement('button');d.type='button';d.className='entity sunOrb';d.dataset.sunId=s.id;d.setAttribute('aria-label','阳光（自动收集）');d.style.left=pctX(s.x);d.style.top=pctY(s.y);
    d.appendChild(cachedCanvas('sun',drawSun));
    // 阳光会自动收集；仍保留点按/划过作为即时收集反馈。
    const sweepCollect=e=>{e.stopPropagation();collectSun(s.id,d)};
    d.addEventListener('pointerenter',sweepCollect);
    d.addEventListener('pointerdown',sweepCollect);
    d.addEventListener('click',sweepCollect);
    frameUnits.appendChild(d);
  }
  units.replaceChildren(frameUnits);
}

// 手机端手指在棋盘上滑过阳光时收集；不需要抬手或精准点击。
let sunSweepPointer=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')sunSweepPointer=e.pointerId},{passive:true});
document.addEventListener('pointermove',e=>{
  if(sunSweepPointer!==e.pointerId)return;
  const hit=document.elementFromPoint(e.clientX,e.clientY);
  const orb=hit&&hit.closest?hit.closest('.sunOrb'):null;
  if(orb)orb.dispatchEvent(new PointerEvent('pointerenter',{bubbles:false,pointerId:e.pointerId,pointerType:e.pointerType}));
},{passive:true});
document.addEventListener('pointerup',e=>{if(sunSweepPointer===e.pointerId)sunSweepPointer=null},{passive:true});
document.addEventListener('pointercancel',e=>{if(sunSweepPointer===e.pointerId)sunSweepPointer=null},{passive:true});

const cooldownCards=[...document.querySelectorAll('.tool[data-tool]')];
function updateCooldownUI(){for(const b of cooldownCards){const t=b.dataset.tool;if(!cooldownMax[t])continue;const rem=cooldowns[t]||0,max=cooldownMax[t],cooling=rem>0;const label=cooling?(rem<10?rem.toFixed(1):Math.ceil(rem))+'s':'';const pct=Math.ceil(rem/max*100)+'%';if(b.classList.contains('cooling')!==cooling)b.classList.toggle('cooling',cooling);if(b.dataset.cd!==label)b.dataset.cd=label;if(b.style.getPropertyValue('--cd-pct')!==pct)b.style.setProperty('--cd-pct',pct)}}
function updateHUD(){sunEl.textContent=Math.floor(sun);killsEl.textContent=`${kills}`}

function isPlantUnlocked(t){if(FINAL_TEST_UNLOCK_ALL)return true;return t==='pea'||t==='sunflower'||(t==='wall'&&wallUnlocked)||(t==='potato'&&potatoUnlocked)||(t==='fan'&&fanUnlocked)||(t==='lighter'&&lighterUnlocked)||(t==='magnet'&&magnetUnlocked)||(t==='crossfan'&&crossfanUnlocked)}
function finish(win){
  ended=true;running=false;battleRoot.classList.remove('plantBulletTime');stopBattleBgm();syncGameMusic();toggle.disabled=true;toggle.textContent='战斗结束';
  if(!win){playSfx('lose',1.15,'finish',1000);say('防线被突破，你被感染了。');showInfection();return}
  playSfx('win',1.1,'finish',1000);say('守住了！关卡完成！');markLevelComplete(currentLevel);
  if(currentLevel===10){setTimeout(showThanksEnding,650);return;}
  const reward=LEVEL_PLANT_REWARDS[currentLevel];
  if(reward&&!isPlantUnlocked(reward)){rewardType=reward;pendingLevel=currentLevel;selectedPlants=[];setTimeout(showReward,420);}
  else setTimeout(showLevelSelect,650);
}
function applyLevelUI(){
  const cfg=LEVELS[currentLevel];
  document.querySelectorAll('.cell').forEach(c=>c.classList.toggle('laneLocked',!cfg.rows.includes(+c.dataset.row)));
  document.querySelectorAll('.tool[data-tool]').forEach(b=>{
    const t=b.dataset.tool;if(t==='shovel'||t==='glove')return;
    const allowed=selectedPlants.includes(t);
    b.classList.toggle('hiddenPlant',!allowed);
    b.hidden=!allowed;
    b.setAttribute('aria-hidden',allowed?'false':'true');
  });
  const levelUi=LEVEL_UI[currentLevel]||{};
  document.getElementById('levelNote').textContent=levelUi.note||`第 ${currentLevel} 关`;
  document.querySelector('.sub').textContent=levelUi.subtitle||`1-${currentLevel} · 测试关卡`;
}
function startLevel(n){
  cancelAnimationFrame(battleBgmFadeRAF);battleBgmFadeRAF=0;
  if(battleBgm){battleBgm.pause();battleBgm.currentTime=0;battleBgm.volume=battleTargetVolume();}
  stopBossBgm();
  level10Boss=null;level10IntroTarget=10;battleRoot.classList.remove('bossWarningShake');document.getElementById('bossCinematicAlert')?.classList.remove('show');document.getElementById('bossGlobalHp')?.classList.remove('show','docked');
  currentLevel=n;const cfg=LEVELS[n];ROWS=cfg.rows.length;buildGrid();
  battleRoot.classList.remove('out');levelScreen.classList.remove('show');plantSelectScreen.classList.remove('show');rewardOverlay.classList.remove('show');rewardStage.classList.remove('go');
  plants=[];zombies=[];bossWrenches=[];brainDrops=[];level8FlagIndex=0;level8FlagBurst=[];level9MinerQueue=[];level9MinerIntroDone=false;level9MinerMidDone=false;level9MinerLateDone=false;peas=[];suns=[];looseBuckets=[];looseBucketDrag=null;magnetFx=[];deathFx=[];coneFx=[];blastFx=[];peaImpactFx=[];bloodFx=[];deathBloodDrops=[];groundBloodFx=[];armFx=[];hpBreakFx=[];fireTiles=[];chainsawFx=[];chainsaws=cfg.rows.map(row=>({row,used:false,active:false,x:-.08}));document.getElementById('infectionOverlay')?.classList.remove('show');cooldowns={pea:0,sunflower:0,wall:0,potato:0,fan:0,lighter:0,glove:0};sun=cfg.initialSun;kills=0;spawned=0;selected=null;running=false;battleStarted=false;glovePlantId=null;gloveFx=null;gloveFx=null;ended=false;levelCompletePending=false;nextId=1;
  spawnClock=0;skySunClock=0;nextSpawnDelay=cfg.firstDelay;impSpawnClock=0;nextImpSpawnDelay=22+Math.random()*6;waveBurstRemaining=0;waveTriggeredMid=false;waveTriggeredFinal=false;wavePulseTimer=0;finalRaid=null;level7Event=null;gameTime=0;last=performance.now();toggle.disabled=false;toggle.textContent='开始战斗';speedMul=1;document.getElementById('speed').textContent='1.0×';document.getElementById('speed').classList.remove('on');selectTool(null);applyLevelUI();fitMobileBoard();battlePrepOverlay.classList.add('show');battlePrepOverlay.setAttribute('aria-hidden','false');say('点击“开始战斗”后才能操作草坪。');updateHUD();updateCooldownUI();updateWaveUI();render();
}
function reset(){startLevel(currentLevel)}
function showReward(){
  running=false;syncGameMusic();
  rewardClaiming=false;rewardStage.classList.remove('focus');rewardOverlay.classList.remove('focus');document.getElementById('unlockFlash').classList.remove('on');document.getElementById('newPlantToast').classList.remove('show');
  const name=({wall:'坚果',potato:'土豆地雷',fan:'寒风扇',lighter:'打火机',magnet:'吸铁石',crossfan:'十字吹风机'}[rewardType]||'新植物');document.getElementById('rewardName').textContent=name;document.getElementById('rewardTitle').textContent='新的植物从草坪里钻出来了';document.getElementById('newPlantToast').textContent='获得新植物：'+name+'！';
  const portrait=document.getElementById('rewardPortrait');portrait.src=plantPortraitSrc(rewardType);portrait.alt='待揭晓的新植物';
  rewardCard.classList.remove('revealing');rewardCard.classList.add('mystery');
  document.getElementById('rewardName').textContent='？？？';
  rewardCard.querySelector('small').textContent='点击卡片揭晓';
  rewardOverlay.classList.add('show');
  requestAnimationFrame(()=>requestAnimationFrame(()=>rewardStage.classList.add('go')));
}
function showLevelSelect(){
  running=false;stopBattleBgm();syncGameMusic();
  document.getElementById('infectionOverlay')?.classList.remove('show');
  document.getElementById('mainMenuScreen')?.classList.remove('show');
  battleRoot.classList.add('out');
  setTimeout(()=>levelScreen.classList.add('show'),260);
}
function claimReward(){
  if(rewardClaiming)return;rewardClaiming=true;
  const unlockedType=rewardType;
  const name=unlockedType==='wall'?'坚果':(unlockedType==='potato'?'土豆地雷':(unlockedType==='fan'?'寒风扇':'吸铁石'));

  // First reveal the card itself: mystery -> full portrait, while it grows toward the viewer.
  rewardCard.classList.remove('mystery');rewardCard.classList.add('revealing');playSfx('reward',1.1,'reward',500);
  document.getElementById('rewardPortrait').alt=name+' 美漫立绘';
  document.getElementById('rewardName').textContent=name;
  rewardCard.querySelector('small').textContent='新植物已获得';
  document.getElementById('rewardTitle').textContent='你获得了 '+name;
  rewardStage.classList.add('focus');rewardOverlay.classList.add('focus');
  document.getElementById('unlockFlash').classList.add('on');

  if(unlockedType==='wall')wallUnlocked=true;
  else if(unlockedType==='potato')potatoUnlocked=true;
  else if(unlockedType==='fan')fanUnlocked=true;
  else if(unlockedType==='lighter')lighterUnlocked=true;
  else if(unlockedType==='magnet')magnetUnlocked=true;
  else if(unlockedType==='crossfan')crossfanUnlocked=true;
  persistProgress();refreshProgressUI();

  const toast=document.getElementById('newPlantToast');
  toast.textContent='获得新植物：'+name+'！';
  setTimeout(()=>toast.classList.add('show'),430);

  {const b=document.querySelector(`.levelCard[data-level="${currentLevel}"]`);
   if(b){b.classList.add('done');b.classList.remove('locked');const tag=b.querySelector('.levelTag');if(tag)tag.textContent='已完成 · 可重玩';}
   const next=document.querySelector(`.levelCard[data-level="${currentLevel+1}"]`);
   if(next&&!TEST_MODE){next.classList.remove('locked');const tag=next.querySelector('.levelTag');if(tag)tag.textContent='新关卡';}}

  // Natural hand-off: fade reward scene, open the almanac at the exact newly unlocked slot,
  // then light that former black question-mark slot.
  setTimeout(()=>{
    rewardOverlay.classList.remove('show','focus');rewardStage.classList.remove('go','focus');
    almanacReturn='levels';openAlmanac(unlockedType);
    setTimeout(()=>{
      const card=almanacGrid.querySelector(`[data-dex="${unlockedType}"]`);
      if(card){card.scrollIntoView({block:'center',behavior:'smooth'});card.classList.add('unlockingDex');}
    },180);
  },1450);
}

const LIGHTER_TUTOR_KEY='zhebao.lighterTutorialSeen.v1';
let lighterTutorStep=0,lighterTutorBusy=false,lighterTutorResolve=null;
const lighterTutorial=document.getElementById('lighterTutorial'),tutorText=document.getElementById('tutorText'),tutorNext=document.getElementById('tutorNext');
const tutorLighter=document.getElementById('tutorLighter'),tutorPea=document.getElementById('tutorPea'),tutorWall=document.getElementById('tutorWall'),tutorGroundFire=document.getElementById('tutorGroundFire'),tutorPeaShot=document.getElementById('tutorPeaShot');
const tutorZ=[document.getElementById('tutorZ1'),document.getElementById('tutorZ2'),document.getElementById('tutorZ3')],tutorWait=ms=>new Promise(r=>setTimeout(r,ms));
function lighterTutorSeen(){try{return localStorage.getItem(LIGHTER_TUTOR_KEY)==='1'}catch(e){return false}}
function resetLighterTutorVisuals(){tutorPea.textContent='🌱';tutorWall.textContent='🪨';tutorPea.classList.remove('fireMode');tutorWall.classList.remove('fireMode');tutorGroundFire.classList.remove('on');tutorPeaShot.classList.remove('go');tutorLighter.classList.remove('fly');tutorLighter.style.left='47%';tutorLighter.style.top='17%';tutorZ.forEach(z=>{z.classList.remove('go','hit');z.style.left='91%';z.style.opacity='0'})}
async function tutorThrow(top,after){tutorLighter.style.left='47%';tutorLighter.style.top=top;tutorLighter.classList.add('fly');playSfx('throw',1,'tutorThrow',100);await tutorWait(130);tutorLighter.style.left='22%';await tutorWait(600);playSfx('ignite',1,'tutorIgnite',100);after();tutorLighter.classList.remove('fly');await tutorWait(300)}
async function runLighterTutorial(){
 if(lighterTutorBusy)return;lighterTutorBusy=true;tutorNext.disabled=true;resetLighterTutorVisuals();
 tutorText.textContent='第一行：打火机扔到豌豆射手上，会把它转化为火焰射手。火焰豌豆命中后还能继续灼烧僵尸。';
 await tutorThrow('17%',()=>{tutorPea.textContent='🔥🌱';tutorPea.classList.add('fireMode')});
 tutorText.textContent='第二行：打火机扔到坚果上，会熔铸成熔岩坚果。僵尸贴近它时会持续受到灼烧。';
 await tutorThrow('50%',()=>{tutorWall.textContent='🔥🪨';tutorWall.classList.add('fireMode')});
 tutorText.textContent='第三行：打火机也能直接扔到空地。地面会持续燃烧，经过这一格的僵尸都会受到火焰伤害。';
 await tutorThrow('83%',()=>tutorGroundFire.classList.add('on'));
 tutorText.textContent='三种效果准备完毕。现在三行各放出一只僵尸，直接看它们在实战里的区别。';
 tutorZ.forEach(z=>{z.style.opacity='1';requestAnimationFrame(()=>z.classList.add('go'))});playSfx('zombieSpawn',.8,'tutorSpawn',100);
 await tutorWait(1050);void tutorPeaShot.offsetWidth;tutorPeaShot.classList.add('go');playSfx('fireShoot',1,'tutorShot',50);
 await tutorWait(720);tutorZ[0].classList.add('hit');playSfx('fleshHit',1,'tutorHit1',50);playSfx('ignite',.7,'tutorBurn1',50);
 await tutorWait(430);tutorZ[1].classList.add('hit');playSfx('ignite',.8,'tutorBurn2',50);
 await tutorWait(330);tutorZ[2].classList.add('hit');playSfx('ignite',.9,'tutorBurn3',50);
 await tutorWait(650);tutorText.textContent='打火机有三种核心用法：强化豌豆、熔铸坚果、点燃空地。根据僵尸路线选择目标，效果完全不同。';
 tutorNext.textContent='我明白了';tutorNext.disabled=false;lighterTutorStep=2;lighterTutorBusy=false;
}
function openLighterTutorial(){
 if(lighterTutorSeen())return Promise.resolve(false);
 return new Promise(resolve=>{lighterTutorResolve=resolve;lighterTutorStep=0;resetLighterTutorVisuals();tutorText.textContent='新工具：打火机。先看一遍三种用法，演示期间不用操作草坪。';tutorNext.textContent='开始演示';tutorNext.disabled=false;lighterTutorial.classList.add('show');lighterTutorial.setAttribute('aria-hidden','false');syncGameMusic()});
}
function closeLighterTutorial(){try{localStorage.setItem(LIGHTER_TUTOR_KEY,'1')}catch(e){}lighterTutorial.classList.remove('show');lighterTutorial.setAttribute('aria-hidden','true');const r=lighterTutorResolve;lighterTutorResolve=null;if(r)r(true)}
tutorNext.addEventListener('click',()=>{resumeSfx();if(lighterTutorStep===0){lighterTutorStep=1;runLighterTutorial()}else if(lighterTutorStep===2)closeLighterTutorial()});


const runtimePortraits={};
function plantPortraitSrc(t){
  if(PLANT_PORTRAITS[t])return PLANT_PORTRAITS[t]||'';
  if(t==='lighter'){
    if(!runtimePortraits.lighter){
      const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d');
      x.fillStyle='#223223';x.fillRect(0,0,192,192);
      x.fillStyle='rgba(255,153,45,.22)';x.beginPath();x.arc(96,98,48,0,Math.PI*2);x.fill();
      x.save();x.translate(96,106);x.scale(1.65,1.65);drawLighter(x,0,{id:777},false);x.restore();
      runtimePortraits.lighter=c.toDataURL('image/png');
    }
    return runtimePortraits.lighter;
  }
  if(t==='magnet'){
    if(!runtimePortraits.magnet){
      const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d');
      x.fillStyle='#1f2f33';x.fillRect(0,0,192,192);x.save();x.translate(48,48);x.scale(1.5,1.5);drawMagnet(x,0,{id:778},false);x.restore();
      runtimePortraits.magnet=c.toDataURL('image/png');
    }
    return runtimePortraits.magnet;
  }
  if(t==='crossfan'){
    try{
      if(!runtimePortraits.crossfan){
        const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d');
        x.fillStyle='#20333a';x.fillRect(0,0,192,192);x.save();x.translate(48,48);x.scale(1.5,1.5);
        drawCrossFan(x,0,{id:779,crossActive:1},false);x.restore();
        runtimePortraits.crossfan=c.toDataURL('image/png');
      }
      return runtimePortraits.crossfan;
    }catch(err){
      // Portrait generation is cosmetic; never let it abort game startup.
      return 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%2320333a"/%3E%3C/svg%3E';
    }
  }
  return '';
}
function availablePlantsForLevel(n){
  if(FINAL_TEST_UNLOCK_ALL)return ['pea','sunflower','wall','potato','fan','lighter','magnet','crossfan'];
  const base=['pea','sunflower'];
  if(wallUnlocked)base.push('wall');
  if(potatoUnlocked)base.push('potato');
  if(fanUnlocked)base.push('fan');
  if(lighterUnlocked)base.push('lighter');
  if(magnetUnlocked)base.push('magnet');
  if(crossfanUnlocked)base.push('crossfan');
  return base;
}
function drawPlantIcon(ctx,t){ctx.clearRect(0,0,64,64);ctx.imageSmoothingEnabled=false;if(t==='pea')drawPea(ctx,0,0,false);else if(t==='sunflower')drawSunflower(ctx,0,0,false);else if(t==='wall')drawWall(ctx,0,0,false);else if(t==='potato')drawPotato(ctx,0,{armed:true,arm:6},false);else if(t==='fan')drawFan(ctx,0,{id:9},false);else if(t==='magnet')drawMagnet(ctx,0,{id:10},false);else if(t==='crossfan')drawCrossFan(ctx,0,{id:11,crossActive:0},false);else drawLighter(ctx,0,{id:999},false)}
function drawMiniSun(ctx){ctx.clearRect(0,0,16,16);ctx.imageSmoothingEnabled=false;ctx.save();ctx.scale(.25,.25);drawSun(ctx);ctx.restore()}
function makePickVisual(t,cls='flyPick'){
  const d=document.createElement('div');d.className=cls;const c=document.createElement('canvas');c.width=64;c.height=64;d.appendChild(c);drawPlantIcon(c.getContext('2d'),t);return d;
}
function slotCenter(index){const slots=[...chosenTray.querySelectorAll('.traySlot')],el=slots[Math.min(index,slots.length-1)];if(!el)return chosenTray.getBoundingClientRect();return el.getBoundingClientRect()}
function flyPlantToTray(source,t,targetIndex,done){
  const a=source.getBoundingClientRect(),b=slotCenter(targetIndex),g=makePickVisual(t);
  const x=a.left+a.width/2-37,y=a.top+a.height/2-42;
  g.style.left=x+'px';g.style.top=y+'px';g.style.transform='translate3d(0,0,0) scale(1)';document.body.appendChild(g);
  const dx=b.left+b.width/2-37-x,dy=b.top+b.height/2-42-y;
  requestAnimationFrame(()=>{g.style.transform=`translate3d(${dx}px,${dy}px,0) scale(.92)`});
  setTimeout(()=>{g.remove();done&&done()},300);
}
function makeTrayCard(t){
  const d=document.createElement('div');d.className='trayCard';d.title='点击移除';d.innerHTML=`<canvas width="64" height="64"></canvas><span>${plantNames[t]}</span>`;
  drawPlantIcon(d.querySelector('canvas').getContext('2d'),t);d.addEventListener('click',()=>removeSelectedPlant(t));return d;
}
function syncPlantSelectState(){
  const slots=chosenTray.querySelectorAll('.traySlot');
  slots.forEach((slot,i)=>{const want=selectedPlants[i]||'';if(slot.dataset.plant===want)return;slot.replaceChildren();slot.dataset.plant=want;if(want)slot.appendChild(makeTrayCard(want))});
  plantPool.querySelectorAll('.pickCard').forEach(b=>b.classList.toggle('chosen',selectedPlants.includes(b.dataset.plant)));
}
function addSelectedPlant(t,source){
  if(selectedPlants.includes(t)||selectedPlants.length>=7)return;
  const targetIndex=selectedPlants.length;selectedPlants.push(t);source.classList.add('chosen');
  flyPlantToTray(source,t,targetIndex,()=>syncPlantSelectState());
}
function removeSelectedPlant(t){const i=selectedPlants.indexOf(t);if(i>=0){selectedPlants.splice(i,1);syncPlantSelectState()}}
function attachDrag(b,t){
  let down=false,dragging=false,sx=0,sy=0,ghost=null,pid=null;
  b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||selectedPlants.includes(t))return;down=true;dragging=false;sx=e.clientX;sy=e.clientY;pid=e.pointerId;b.setPointerCapture?.(pid)});
  b.addEventListener('pointermove',e=>{if(!down)return;const dist=Math.hypot(e.clientX-sx,e.clientY-sy);if(!dragging&&dist>8){dragging=true;ghost=makePickVisual(t,'dragGhost');document.body.appendChild(ghost)}if(dragging&&ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';const r=chosenTray.getBoundingClientRect(),hot=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;chosenTray.classList.toggle('trayHot',hot)}});
  const end=e=>{if(!down)return;down=false;chosenTray.classList.remove('trayHot');if(dragging){dragSuppressUntil=performance.now()+300;const r=chosenTray.getBoundingClientRect(),hit=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;ghost?.remove();if(hit&&selectedPlants.length<7&&!selectedPlants.includes(t)){selectedPlants.push(t);renderPlantSelect()}}dragging=false;ghost=null};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
}
function renderPlantSelect(){
  plantPool.innerHTML='';chosenTray.innerHTML='';
  for(let i=0;i<7;i++){const slot=document.createElement('div');slot.className='traySlot';slot.dataset.plant=selectedPlants[i]||'';if(selectedPlants[i])slot.appendChild(makeTrayCard(selectedPlants[i]));chosenTray.appendChild(slot)}
  for(const t of availablePlantsForLevel(pendingLevel)){
    const b=document.createElement('button');b.className='pickCard'+(selectedPlants.includes(t)?' chosen':'');b.type='button';b.dataset.plant=t;
    b.innerHTML=`<strong>${plantNames[t]}</strong><img class="art" src="${plantPortraitSrc(t)}" alt="${plantNames[t]}立绘"><span class="pickCost"><canvas width="16" height="16"></canvas>${costs[t]}</span>`;
    drawMiniSun(b.querySelector('.pickCost canvas').getContext('2d'));
    b.addEventListener('click',()=>{if(performance.now()<dragSuppressUntil)return;if(selectedPlants.includes(t))removeSelectedPlant(t);else addSelectedPlant(t,b)});attachDrag(b,t);plantPool.appendChild(b);
  }
}
function openPlantSelect(n){
  pendingLevel=n;const available=availablePlantsForLevel(n);
  if(available.length<=7){
    selectedPlants=[...available];levelScreen.classList.remove('show');plantSelectScreen.classList.remove('show');
    startLevel(n);setTimeout(fitMobileBoard,120);return;
  }
  selectedPlants=[];document.getElementById('plantSelectTitle').textContent=`1-${n} · 选择 7 种植物`;
  levelScreen.classList.remove('show');renderPlantSelect();plantPool.scrollTop=0;setTimeout(()=>plantSelectScreen.classList.add('show'),180);
}
document.getElementById('backLevels').addEventListener('click',()=>{plantSelectScreen.classList.remove('show');setTimeout(()=>levelScreen.classList.add('show'),180)});
document.getElementById('enterBattle').addEventListener('click',()=>{startLevel(pendingLevel);setTimeout(fitMobileBoard,120)});

const almanacScreen=document.getElementById('almanacScreen'),almanacGrid=document.getElementById('almanacGrid');
let almanacRAF=0,almanacFocus=null,almanacReturn='levels';
const dexEntries=window.ZHEBAO_ALMANAC_ENTRIES;
function drawDex(ctx,id,t){ctx.clearRect(0,0,64,64);ctx.imageSmoothingEnabled=false;if(id==='pea')drawPea(ctx,0,{id:3,charge:(Math.sin(t*1.2)+1)*.18},false);else if(id==='sunflower')drawSunflower(ctx,0,{id:5},false);else if(id==='lighter')drawLighter(ctx,0,{id:15},false);else if(id==='wall')drawWall(ctx,0,0,false);else if(id==='potato')drawPotato(ctx,0,{armed:true,arm:6},false);else if(id==='fan')drawFan(ctx,0,{id:12},false);else if(id==='magnet')drawMagnet(ctx,0,{id:13},false);else if(id==='miner')drawMinerZombie(ctx,{id:19,type:'miner',walkTick:(t*.7)%1,eatMode:null,hurt:0,stun:0,armGone:false,lungeTime:0,hitStun:0},0);else if(id==='crawler')drawCrawler(ctx,(t*.45)%1,null,false,0,(t*.42)%1);else if(id==='imp')drawImp(ctx,(t*.9)%1,null,false,false,0);else if(id==='longhair')drawLongHairZombie(ctx,{walkTick:(t*.6)%1,hairAttack:(Math.sin(t*1.4)>.75?.36:0),hurt:0},0);else if(id==='brain')drawBrainZombie(ctx,{walkTick:(t*.38)%1,hurt:0,hitStun:0,armGone:false,lungeTime:0},0);else if(id==='giant')drawMutantGiant(ctx,{walkTick:(t*.35)%1,smashTime:Math.sin(t*1.5)>.7?.5:0,giantArmor:null,coneHp:0});else if(id==='normal')drawNormalZombieSprite(ctx,{type:'normal',hp:100,maxHp:100,walkTick:0,hitStun:0,lungeTime:0,eating:false,spriteIdle:true},0);else drawZombie(ctx,id==='cone',(t*.7)%1,null,false,false,0,0)}
function isDexUnlocked(id){
  if(TEST_MODE||FINAL_TEST_UNLOCK_ALL)return true;
  if(id==='pea'||id==='sunflower')return true;
  if(id==='lighter')return lighterUnlocked;
  if(id==='wall')return wallUnlocked;
  if(id==='potato')return potatoUnlocked;
  if(id==='fan')return fanUnlocked;
  if(id==='magnet')return magnetUnlocked;
  if(id==='crossfan')return crossfanUnlocked;
  // Enemy pages appear only after the player has already survived the level that introduced them.
  if(id==='normal')return completedLevels.includes(1);
  if(id==='cone')return completedLevels.includes(2);
  if(id==='crawler')return completedLevels.includes(3);
  if(id==='imp')return completedLevels.includes(5);
  if(id==='longhair')return completedLevels.includes(6);
  if(id==='brain'||id==='giant')return completedLevels.includes(8);
  if(id==='miner')return completedLevels.includes(9);
  return false;
}
function renderAlmanac(){
  almanacGrid.innerHTML='';
  for(const e of dexEntries){
    const unlocked=isDexUnlocked(e.id),card=document.createElement('button');
    card.type='button';card.dataset.dex=e.id;card.dataset.unlocked=unlocked?'1':'0';
    card.className='dexCard'+(unlocked&&almanacFocus===e.id?' focused':'')+(unlocked?'':' lockedDex');
    if(unlocked){
      const plantArt=e.kind==='植物'&&plantPortraitSrc(e.id);
      if(plantArt){card.classList.add('plantDex');card.innerHTML=`<img class="dexPortrait" src="${plantArt}" alt="${e.name}立绘"><span class="dexType">${e.kind}</span><strong>${e.name}</strong><p>${e.desc}</p>`;}
      else card.innerHTML=`<canvas width="64" height="64"></canvas><span class="dexType">${e.kind}</span><strong>${e.name}</strong><p>${e.desc}</p>`;
      card.addEventListener('click',()=>{almanacFocus=e.id;renderAlmanac()});
    }else{
      // No canvas and no real name/description: locked entries cannot leak future art or abilities.
      card.innerHTML=`<div class="dexMystery" aria-hidden="true">?</div>`;card.setAttribute('aria-label','？');
      card.disabled=true;
    }
    almanacGrid.appendChild(card);
  }
}
function animateAlmanac(){if(!almanacScreen.classList.contains('show'))return;const t=performance.now()/1000;for(const card of almanacGrid.querySelectorAll('.dexCard[data-unlocked="1"]')){const canvas=card.querySelector('canvas');if(canvas)drawDex(canvas.getContext('2d'),card.dataset.dex,t)}almanacRAF=requestAnimationFrame(animateAlmanac)}
function openAlmanac(focus=null){
  stopBattleBgm();
  if(idleBgmUnlocked&&!battleStarted)playIdleBgm();
  almanacFocus=focus&&isDexUnlocked(focus)?focus:null;renderAlmanac();almanacScreen.classList.add('show');almanacScreen.setAttribute('aria-hidden','false');cancelAnimationFrame(almanacRAF);animateAlmanac();
  const panel=almanacScreen.querySelector('.almanacPanel');if(panel)panel.scrollTop=0;
  if(almanacFocus)setTimeout(()=>almanacGrid.querySelector(`[data-dex="${almanacFocus}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}),80);
}
function closeAlmanac(){
  if(!almanacScreen.classList.contains('show'))return;
  almanacScreen.classList.remove('show');almanacScreen.setAttribute('aria-hidden','true');cancelAnimationFrame(almanacRAF);almanacFocus=null;
  if(almanacReturn==='main'){document.getElementById('mainMenuScreen').classList.add('show');}
  else{showLevelSelect();}
}
document.getElementById('openAlmanac').addEventListener('click',()=>{almanacReturn='levels';openAlmanac()});
document.getElementById('closeAlmanac').addEventListener('click',closeAlmanac);
almanacScreen.addEventListener('click',e=>{if(e.target===almanacScreen)closeAlmanac()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&almanacScreen.classList.contains('show'))closeAlmanac()});

function openSettings(){
  if(ended||levelScreen.classList.contains('show')||plantSelectScreen.classList.contains('show'))return;
  settingsWasRunning=running;
  running=false;
  settingsOverlay.classList.add('show');
  settingsOverlay.setAttribute('aria-hidden','false');
  if(battleStarted)toggle.textContent='继续战斗';
  say('游戏已暂停。');
}
function closeSettings(resume=true){
  settingsOverlay.classList.remove('show');
  settingsOverlay.setAttribute('aria-hidden','true');
  if(resume&&settingsWasRunning&&!ended){running=true;toggle.textContent='暂停';say('继续战斗。');}
  settingsWasRunning=false;
}

settingsGear.addEventListener('click',openSettings);
const qualityToggle=document.getElementById('qualityToggle');
function syncQualityToggle(){qualityToggle.textContent='画质：'+({auto:'自动',high:'高清',smooth:'流畅'}[qualityMode]);}
qualityToggle.addEventListener('click',()=>{
  qualityMode=qualityMode==='auto'?'high':qualityMode==='high'?'smooth':'auto';
  MOBILE_RENDER_SCALE=spriteRenderScale();
  spriteCanvasCache.clear();
  reusableSpriteCanvases.small.length=0;reusableSpriteCanvases.large.length=0;
  try{localStorage.setItem(QUALITY_KEY,qualityMode)}catch(e){}
  syncQualityToggle();
  if(!battleRoot.classList.contains('out'))render();
});
syncQualityToggle();
settingsResume.addEventListener('click',()=>closeSettings(true));
settingsRestart.addEventListener('click',()=>{settingsOverlay.classList.remove('show');settingsOverlay.setAttribute('aria-hidden','true');settingsWasRunning=false;reset();});
settingsMenu.addEventListener('click',()=>{
  settingsOverlay.classList.remove('show');settingsOverlay.setAttribute('aria-hidden','true');settingsWasRunning=false;running=false;battleStarted=false;glovePlantId=null;gloveFx=null;
  syncGameMusic();
  toggle.textContent='开始战斗';
  battlePrepOverlay.classList.remove('show');battlePrepOverlay.setAttribute('aria-hidden','true');battleRoot.classList.add('out');levelScreen.classList.remove('show');plantSelectScreen.classList.remove('show');document.getElementById('mainMenuScreen').classList.add('show');
});
settingsOverlay.addEventListener('click',e=>{if(e.target===settingsOverlay)closeSettings(true)});

document.getElementById('thanksReturn')?.addEventListener('click',()=>{
  const o=document.getElementById('thanksOverlay');o?.classList.remove('show');o?.setAttribute('aria-hidden','true');showMainMenu();
});
document.getElementById('rewardPortrait').src=plantPortraitSrc('wall');
rewardCard.addEventListener('click',claimReward);
function drawToolCards(){
  document.querySelectorAll('.tool[data-tool]').forEach(b=>{
    const t=b.dataset.tool, art=b.querySelector('.cardArt');if(art){const c=art.getContext('2d');c.clearRect(0,0,64,64);c.imageSmoothingEnabled=false;if(t==='pea')drawPea(c,0,0,false);else if(t==='sunflower')drawSunflower(c,0,0,false);else if(t==='wall')drawWall(c,0,0,false);else if(t==='potato')drawPotato(c,0,{armed:true,arm:6},false);else if(t==='fan')drawFan(c,0,{id:6},false);else if(t==='lighter')drawLighter(c,0,{id:314},false);else if(t==='magnet')drawMagnet(c,0,{id:315},false);else if(t==='crossfan')drawCrossFan(c,0,{id:316,crossActive:0},false);else if(t==='glove')drawGlove(c);else drawShovel(c);}
    const ms=b.querySelector('.miniSun');if(ms){const c=ms.getContext('2d');c.clearRect(0,0,16,16);c.imageSmoothingEnabled=false;c.save();c.scale(.25,.25);drawSun(c);c.restore();}
  });
}
drawToolCards();const ssi=document.getElementById('sunStripIcon').getContext('2d');ssi.imageSmoothingEnabled=false;drawSun(ssi);
document.querySelectorAll('.levelCard').forEach(b=>{if(TEST_MODE){b.classList.remove('locked');const tag=b.querySelector('.levelTag');if(tag&&!b.classList.contains('done'))tag.textContent='测试开放';}b.addEventListener('click',()=>{const n=+b.dataset.level;if(!TEST_MODE&&b.classList.contains('locked')){b.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:180});return}openPlantSelect(n)})});
document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{if(b.hidden||b.classList.contains('hiddenPlant'))return;const t=b.dataset.tool;if(selected==='glove'&&t!=='glove'){glovePlantId=null;gloveFx=null;}if(selected===t){if(t==='glove'){glovePlantId=null;gloveFx=null;}selectTool(null);say('已取消选择。');return;}selectTool(t)}));
function beginBattle(){
  if(ended||battleStarted)return;
  battleStarted=true;running=true;syncPlantingBulletTime();stopIdleBgm();playBattleBgm();primeBossBgmForLevel10();resumeSfx();playSfx('wave',.8,'battleStart',800);
  spawnClock=0;skySunClock=0;gameTime=0;last=performance.now();updatePlantTargets();
  battlePrepOverlay.classList.remove('show');battlePrepOverlay.setAttribute('aria-hidden','true');
  toggle.textContent='暂停';say('战斗开始，约 7.5 秒后第一只僵尸出现。');
if(currentLevel===7)startLevel7();}
battlePrepStart.addEventListener('click',beginBattle);
toggle.addEventListener('click',()=>{if(ended)return;if(!battleStarted){beginBattle();return}running=!running;syncGameMusic();toggle.textContent=running?'暂停':'继续战斗';say(running?'继续战斗。':'已暂停，可以调整植物位置。')});
document.getElementById('restart').addEventListener('click',reset);
document.getElementById('speed').addEventListener('click',()=>{speedMul=speedMul===1?1.5:1;const b=document.getElementById('speed');b.textContent=speedMul.toFixed(1)+'×';b.classList.toggle('on',speedMul>1);say(speedMul===1?'已恢复 1.0× 速度。':'已开启 1.5× 加速。')});
let lastVisualFrame=0;
// Render every display refresh (normally 60 Hz) on mobile too. The cheaper mobile canvases/effects remain enabled.
let renderWasActive=true;
let lastFrameErrorAt=0;
function frame(now){
  // High-refresh screens need no more than 100 full game updates per second.
  if(now-last<10){requestAnimationFrame(frame);return;}
  const dt=Math.min(.04,(now-last)/1000);last=now;
  try{
    update(dt);
    const battleVisible=!battleRoot.classList.contains('out')&&!document.hidden;
    const shouldRender=battleVisible&&(running||battleStarted);
    if(shouldRender){render();renderWasActive=true;lastVisualFrame=now}
    else if(renderWasActive&&battleVisible){render();renderWasActive=false;lastVisualFrame=now}
  }catch(err){
    // Never let one gameplay/visual exception permanently kill the RAF chain.
    if(now-lastFrameErrorAt>1000){
      lastFrameErrorAt=now;
      console.error('battle frame recovered:',err);
    }
  }finally{
    requestAnimationFrame(frame);
  }
}
loadLocalProgress();refreshProgressUI();selectedPlants=['pea','sunflower'];startLevel(1);
const introScreen=document.getElementById('introScreen'),introStart=document.getElementById('introStart');
const loadingScreen=document.getElementById('loadingScreen'),loadingFill=document.getElementById('loadingFill'),loadingText=document.getElementById('loadingText');
const mainMenuScreen=document.getElementById('mainMenuScreen'),exitScreen=document.getElementById('exitScreen');
function showMainMenu(){
  running=false;battleStarted=false;battleRoot.classList.remove('plantBulletTime');settingsOverlay.classList.remove('show');battlePrepOverlay.classList.remove('show');battlePrepOverlay.setAttribute('aria-hidden','true');levelScreen.classList.remove('show');plantSelectScreen.classList.remove('show');rewardOverlay.classList.remove('show');almanacScreen.classList.remove('show');exitScreen.classList.remove('show');
  syncGameMusic();
  battleRoot.classList.add('out');mainMenuScreen.classList.add('show');
}
// 初始战斗界面保持在开场层后方；先给手机一个明确的加载反馈，再进入开场。
let bootProgress=4;
const bootTimer=setInterval(()=>{bootProgress=Math.min(92,bootProgress+8+Math.floor(Math.random()*9));loadingFill.style.width=bootProgress+'%';loadingText.textContent='加载资源 '+bootProgress+'%';if(bootProgress>=92)clearInterval(bootTimer)},90);
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  clearInterval(bootTimer);loadingFill.style.width='100%';loadingText.textContent='加载完成 100%';introScreen.classList.add('ready');
  setTimeout(()=>loadingScreen.classList.add('done'),220);
}));
introStart.addEventListener('click',async()=>{
  introStart.disabled=true;
  // One user-gesture request restores the landscape/fullscreen viewport that the mobile layout is designed around.
  // Later screens never request it again, so the browser cannot stack repeated permission prompts.
  await requestGameFullscreen();
  introScreen.classList.add('exit');
  battleRoot.classList.add('out');plantSelectScreen.classList.remove('show');rewardOverlay.classList.remove('show');levelScreen.classList.remove('show');
  setTimeout(()=>{mainMenuScreen.classList.add('show');fitMobileBoard();},260);
});
document.addEventListener('fullscreenchange',()=>setTimeout(fitMobileBoard,80));
document.addEventListener('webkitfullscreenchange',()=>setTimeout(fitMobileBoard,80));
window.addEventListener('orientationchange',()=>setTimeout(fitMobileBoard,180));
const saveScreen=document.getElementById('saveScreen'),saveInfo=document.getElementById('saveInfo'),saveMsg=document.getElementById('saveMsg'),saveFileInput=document.getElementById('saveFileInput');
function openSaveScreen(){saveInfo.innerHTML=saveSummary();saveMsg.textContent='';saveScreen.classList.add('show');saveScreen.setAttribute('aria-hidden','false')}
function closeSaveScreen(){saveScreen.classList.remove('show');saveScreen.setAttribute('aria-hidden','true')}
document.getElementById('mainSave').addEventListener('click',openSaveScreen);
document.getElementById('saveClose').addEventListener('click',closeSaveScreen);
document.getElementById('saveContinue').addEventListener('click',()=>{if(!TEST_MODE)loadLocalProgress();refreshProgressUI();closeSaveScreen();mainMenuScreen.classList.remove('show');showLevelSelect()});
document.getElementById('saveExport').addEventListener('click',()=>{const data=JSON.stringify(makeSaveData(),null,2),blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='zhebao-存档.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);saveMsg.textContent='存档文件已下载。';});
document.getElementById('saveImport').addEventListener('click',()=>saveFileInput.click());
saveFileInput.addEventListener('change',async()=>{const f=saveFileInput.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());applySaveData(d);if(!TEST_MODE)localStorage.setItem(SAVE_KEY,JSON.stringify(makeSaveData()));saveInfo.innerHTML=saveSummary();saveMsg.textContent=TEST_MODE?'已读取存档；测试模式下不会覆盖本机正式进度。':'导入成功，已保存到本机。';}catch(e){saveMsg.textContent='这个存档文件无法读取。';}finally{saveFileInput.value='';}});
document.getElementById('mainChooseLevel').addEventListener('click',()=>{mainMenuScreen.classList.remove('show');showLevelSelect();});
document.getElementById('mainAlmanac').addEventListener('click',()=>{mainMenuScreen.classList.remove('show');almanacReturn='main';openAlmanac();});
document.getElementById('mainExit').addEventListener('click',()=>{running=false;mainMenuScreen.classList.remove('show');exitScreen.classList.add('show');exitScreen.setAttribute('aria-hidden','false');});
document.getElementById('exitReturn').addEventListener('click',()=>{exitScreen.classList.remove('show');exitScreen.setAttribute('aria-hidden','true');mainMenuScreen.classList.add('show');});
requestAnimationFrame(frame);
})();
