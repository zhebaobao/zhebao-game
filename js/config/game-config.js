// Data registry composer. Plant and level files load before this file.
(()=>{
const plantDefs=window.ZHEBAO_PLANTS||{};
const levelDefs=window.ZHEBAO_LEVELS||{};
const zombieDefs=window.ZHEBAO_ZOMBIES||{};
if(Object.keys(plantDefs).length!==8)throw new Error('Plant configuration is incomplete');
if(Object.keys(levelDefs).length!==10)throw new Error('Level configuration is incomplete');
if(Object.keys(zombieDefs).length!==10)throw new Error('Zombie configuration is incomplete');

const LEVELS={},LEVEL_PLANT_REWARDS={};
for(const [id,entry] of Object.entries(levelDefs)){
  LEVELS[id]=entry.config;
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
const ZOMBIE_ARCHETYPES=zombieDefs;
window.ZHEBAO_CONFIG={LEVELS,costs,maxHP,cooldownMax,TEST_MODE,FINAL_TEST_UNLOCK_ALL,SAVE_KEY,LEVEL_PLANT_REWARDS,plantNames,PLANT_PORTRAITS,ZOMBIE_ARCHETYPES};
})();
