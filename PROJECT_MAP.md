# PROJECT_MAP

修改前先读 `AGENTS.md`，再按本文件只读取当前任务需要的文件。

## 核心入口

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面 DOM 与模块加载顺序 |
| `css/game.css` | UI、响应式布局和 CSS 动画 |
| `js/config/game-config.js` | 汇总植物、关卡和僵尸注册表；保存测试开关与存档键 |
| `js/game.js` | 尚未拆出的战斗、角色行为、绘制和 UI 逻辑 |
| `assets/portraits/` | 植物立绘资源 |

## 植物栏目

| 植物 | 文件 |
| --- | --- |
| 豌豆射手 | `plants/peashooter.js` |
| 向日葵 | `plants/sunflower.js` |
| 坚果 | `plants/wallnut.js` |
| 土豆地雷 | `plants/potato-mine.js` |
| 寒风扇 | `plants/cold-fan.js` |
| 打火机 | `plants/lighter.js` |
| 吸铁石 | `plants/magnet.js` |
| 十字吹风机 | `plants/cross-fan.js` |

价格、生命、卡片冷却、名称和立绘路径在对应植物文件修改。

## 僵尸栏目

| 僵尸 | 文件 | 已迁入参数 |
| --- | --- | --- |
| 普通僵尸 | `zombies/normal.js` | 生命、速度、步态 |
| 路障僵尸 | `zombies/cone.js` | 基础属性、50 护甲 |
| 铁桶僵尸 | `zombies/bucket.js` | 基础属性、200 护甲 |
| 爬行僵尸 | `zombies/crawler.js` | 基础属性、肠道锚点、击退/硬直免疫 |
| 小鬼僵尸 | `zombies/imp.js` | 基础属性、步态 |
| 长发女鬼 | `zombies/longhair.js` | 基础属性、反弹冷却 |
| 脑浆僵尸 | `zombies/brain.js` | 基础属性 |
| 中型巨人 | `zombies/giant.js` | 基础属性、攻击间隔、变异步态 |
| 矿工僵尸 | `zombies/miner.js` | 基础属性、初始钻地状态 |
| 包工头 Boss | `zombies/workboss.js` | 基础属性 |

修改以上数值只读对应文件。AI、攻击和绘制仍在 `js/game.js`，后续继续迁移。

## 关卡栏目

`levels/level-01.js` 至 `levels/level-10.js`：每关路线、敌人数、经济、出怪间隔、敌人类型和奖励。修改单关只读对应文件。

## js/game.js 余下入口

| 修改方向 | 起始行 | 搜索词 |
| --- | ---: | --- |
| 僵尸创建 | 908 | `function makeZombie(` |
| 受伤、击退与硬直 | 1052 | `function damageZombie(` |
| 战斗主循环 | 1161 | `function update(dt)` |
| 普通僵尸绘制 | 2864 | `function drawZombie(` |
| 矿工绘制 | 2589 | `function drawMinerZombie(` |
| 长发女鬼绘制 | 3453 | `function drawLongHairZombie(` |
| 巨人绘制 | 3168 | `function drawMutantGiant(` |

植物放置搜索 `function place(`；第十关搜索 `function updateLevel10(`；选卡搜索 `function openPlantSelect(`。

## 模块化进度

- [x] HTML、CSS、JavaScript 分离
- [x] Base64 立绘资源化
- [x] 每种植物独立配置
- [x] 每个关卡独立数据文件
- [x] 每种僵尸独立基础配置
- [ ] 植物专属行为与绘制迁移
- [ ] 僵尸 AI、攻击与绘制迁移
- [ ] 核心战斗、UI 与存档拆分

新增、删除、移动文件或改变职责后更新本文件。每次只拆一个低耦合区域，并保持 GitHub Pages 可直接运行。
