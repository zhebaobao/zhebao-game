// 第 9 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[9]={
  "config": {
    "total": 32,
    "rows": [
      0,
      1,
      2,
      3,
      4
    ],
    "plants": [
      "pea",
      "sunflower",
      "wall",
      "potato",
      "fan",
      "magnet",
      "crossfan"
    ],
    "cones": true,
    "buckets": true,
    "crawlers": true,
    "imps": true,
    "longhairs": true,
    "brains": true,
    "miners": true,
    "initialSun": 225,
    "firstDelay": 7,
    "spawnMin": 5.4,
    "spawnMax": 7.4
  }
};
