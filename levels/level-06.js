// 第 6 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[6]={
  "config": {
    "total": 22,
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
      "fan"
    ],
    "cones": true,
    "crawlers": true,
    "imps": true,
    "longhairs": true,
    "initialSun": 175,
    "firstDelay": 7.5,
    "spawnMin": 6.3,
    "spawnMax": 8.7
  },
  "reward": "crossfan",
  "ui": {
    "note": "第 6 关：五路草坪 · 长发丧尸 · 反弹豌豆",
    "subtitle": "1-6 · 阴发来袭 · 长发丧尸登场"
  }
};
