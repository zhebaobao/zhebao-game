// 第 2 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[2]={
  "config": {
    "total": 12,
    "rows": [
      0,
      1,
      2
    ],
    "plants": [
      "pea",
      "sunflower",
      "wall"
    ],
    "cones": true,
    "initialSun": 175,
    "firstDelay": 7.5,
    "spawnMin": 8,
    "spawnMax": 11
  },
  "reward": "potato",
  "ui": {
    "note": "第 2 关：三条草坪路线",
    "subtitle": "1-2 · 狂暴来袭 · 三线防守"
  }
};
