// 第 10 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[10]={
  "config": {
    "total": 25,
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
    "brains": true,
    "initialSun": 250,
    "firstDelay": 8,
    "spawnMin": 7.5,
    "spawnMax": 10.5
  }
};
