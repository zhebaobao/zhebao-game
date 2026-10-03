// 普通僵尸：基础属性和已确认的专属参数。
window.ZHEBAO_ZOMBIES=window.ZHEBAO_ZOMBIES||{};
window.ZHEBAO_ZOMBIES.normal={
  "name": "普通僵尸",
  "hp": 100,
  "speed": 0.21,
  "armor": 0,
  "armGone": false,
  "gaitCadence": 0.72,
  "animations": {
    "walk": { "frames": 12, "loop": true },
    "hurt": { "frames": 6, "loop": false },
    "death": { "frames": 8, "loop": false },
    "idle": { "frames": 6, "loop": true },
    "turn": { "frames": 4, "loop": false },
    "lungeWarn": { "frames": 8, "loop": false },
    "lungeCrouch": { "frames": 8, "loop": false },
    "lungeAir": { "frames": 10, "loop": false },
    "lungeRecover": { "frames": 6, "loop": false },
    "blood": { "frames": 8, "overlay": true }
  }
};
