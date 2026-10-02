// Stable data-only configuration. Keep gameplay behavior in js/game.js.
(()=>{
const LEVELS={
  1:{total:8,rows:[0,1],plants:['pea','sunflower'],cones:false,initialSun:175,firstDelay:7.5,spawnMin:10.5,spawnMax:13.5},
  2:{total:12,rows:[0,1,2],plants:['pea','sunflower','wall'],cones:true,initialSun:175,firstDelay:7.5,spawnMin:8,spawnMax:11},
  3:{total:14,rows:[0,1,2],plants:['pea','sunflower','wall','potato'],cones:true,crawlers:true,initialSun:175,firstDelay:7.5,spawnMin:7.5,spawnMax:10.5},
  4:{total:17,rows:[0,1,2],plants:['pea','sunflower','wall','potato'],cones:true,crawlers:true,initialSun:175,firstDelay:7.5,spawnMin:6.9,spawnMax:9.5},
  5:{total:18,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan'],cones:true,crawlers:true,imps:true,initialSun:175,firstDelay:7.5,spawnMin:6.6,spawnMax:9.1},
  6:{total:22,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan'],cones:true,crawlers:true,imps:true,longhairs:true,initialSun:175,firstDelay:7.5,spawnMin:6.3,spawnMax:8.7},
  7:{total:26,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan'],cones:true,buckets:true,crawlers:true,imps:true,longhairs:true,initialSun:175,firstDelay:7.5,spawnMin:6.0,spawnMax:8.2},
  8:{total:28,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan','magnet','crossfan'],cones:true,buckets:true,crawlers:true,imps:true,longhairs:true,brains:true,initialSun:200,firstDelay:7.0,spawnMin:5.8,spawnMax:7.9},
  9:{total:32,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan','magnet','crossfan'],cones:true,buckets:true,crawlers:true,imps:true,longhairs:true,brains:true,miners:true,initialSun:225,firstDelay:7.0,spawnMin:5.4,spawnMax:7.4},
  10:{total:25,rows:[0,1,2,3,4],plants:['pea','sunflower','wall','potato','fan','magnet','crossfan'],cones:true,buckets:true,crawlers:true,brains:true,initialSun:250,firstDelay:8.0,spawnMin:7.5,spawnMax:10.5}
};
const costs={pea:125,sunflower:50,wall:50,potato:25,fan:175,lighter:75,magnet:100,crossfan:150},maxHP={pea:100,sunflower:100,wall:1000,potato:100,fan:160,lighter:24,magnet:120,crossfan:140},cooldownMax={pea:2,sunflower:2,wall:15,potato:10,fan:20,lighter:10,magnet:12,crossfan:18,glove:5};
const TEST_MODE=false;
const FINAL_TEST_UNLOCK_ALL=false;
const SAVE_KEY='pixelLawnBattle.save.v1';
const LEVEL_PLANT_REWARDS={1:'wall',2:'potato',3:'fan',4:'lighter',5:'magnet',6:'crossfan'};
const plantNames={pea:'豌豆射手',sunflower:'向日葵',wall:'坚果',potato:'土豆地雷',fan:'寒风扇',lighter:'打火机',magnet:'吸铁石',crossfan:'十字吹风机'};
window.ZHEBAO_CONFIG={LEVELS,costs,maxHP,cooldownMax,TEST_MODE,FINAL_TEST_UNLOCK_ALL,SAVE_KEY,LEVEL_PLANT_REWARDS,plantNames};
})();
