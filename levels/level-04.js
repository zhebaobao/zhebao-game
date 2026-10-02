// 第 4 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[4]={
  "config": {
    "total": 17,
    "rows": [
      0,
      1,
      2
    ],
    "plants": [
      "pea",
      "sunflower",
      "wall",
      "potato"
    ],
    "cones": true,
    "crawlers": true,
    "initialSun": 175,
    "firstDelay": 7.5,
    "spawnMin": 6.9,
    "spawnMax": 9.5
  },
  "reward": "lighter"
};
