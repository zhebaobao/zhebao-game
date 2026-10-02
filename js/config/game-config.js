// Registry composer. The bootstrap loads every manifest entry before this file.
(()=>{
const manifest=window.ZHEBAO_MODULE_MANIFEST;
const plantDefs=window.ZHEBAO_PLANTS||{};
const levelDefs=window.ZHEBAO_LEVELS||{};
const zombieDefs=window.ZHEBAO_ZOMBIES||{};
if(!manifest)throw new Error('Module manifest is missing');

function validateRegistry(label,entries,registry){
  const ids=entries.map(entry=>String(entry.id));
  if(new Set(ids).size!==ids.length)throw new Error(label+' manifest contains duplicate IDs');
  const missing=ids.filter(id=>!Object.prototype.hasOwnProperty.call(registry,id));
  if(missing.length)throw new Error(label+' configuration is incomplete: '+missing.join(', '));
}
validateRegistry('Plant',manifest.plants,plantDefs);
validateRegistry('Level',manifest.levels,levelDefs);
validateRegistry('Zombie',manifest.zombies,zombieDefs);

const LEVEL_IDS=manifest.levels.map(entry=>Number(entry.id));
const LEVELS={},LEVEL_PLANT_REWARDS={},LEVEL_UI={};
for(const id of LEVEL_IDS){
  const entry=levelDefs[id];
  LEVELS[id]=entry.config;
  LEVEL_UI[id]=entry.ui||{};
  if(entry.reward)LEVEL_PLANT_REWARDS[id]=entry.reward;
}

const costs={},maxHP={},cooldownMax={glove:5},plantNames={},PLANT_PORTRAITS={};
for(const [id,entry] of Object.entries(plantDefs)){
  costs[id]=entry.cost;
  maxHP[id]=entry.maxHP;
  cooldownMax[id]=entry.cooldown;
  plantNames[id]=entry.name;
  if(entry.portrait)PLANT_PORTRAITS[id]=entry.portrait;
}

const TEST_MODE=false;
const FINAL_TEST_UNLOCK_ALL=false;
const SAVE_KEY='pixelLawnBattle.save.v1';
const PLANT_ARCHETYPES=plantDefs;
const ZOMBIE_ARCHETYPES=zombieDefs;
window.ZHEBAO_CONFIG={LEVELS,LEVEL_IDS,LEVEL_UI,costs,maxHP,cooldownMax,TEST_MODE,FINAL_TEST_UNLOCK_ALL,SAVE_KEY,LEVEL_PLANT_REWARDS,plantNames,PLANT_PORTRAITS,PLANT_ARCHETYPES,ZOMBIE_ARCHETYPES};
})();
