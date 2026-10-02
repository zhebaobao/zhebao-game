// 第 1 关：数据配置。特殊事件逻辑仍在 js/game.js，后续分阶段迁移。
window.ZHEBAO_LEVELS=window.ZHEBAO_LEVELS||{};
window.ZHEBAO_LEVELS[1]={
  "config": {
    "total": 8,
    "rows": [
      0,
      1
    ],
    "plants": [
      "pea",
      "sunflower"
    ],
    "cones": false,
    "initialSun": 175,
    "firstDelay": 7.5,
    "spawnMin": 10.5,
    "spawnMax": 13.5
  },
  "reward": "wall",
  "ui": {
    "note": "第 1 关：两条草坪路线",
    "subtitle": "1-1 · 特勤试炼 · 双线防守"
  }
};
