# PROJECT_MAP

修改前先读 `AGENTS.md`，再按本文件只读取当前任务需要的文件。

## 核心入口

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面 DOM 与脚本加载顺序 |
| `css/game.css` | UI、响应式布局和 CSS 动画 |
| `js/config/game-config.js` | 汇总植物/关卡注册表，保存测试开关与存档键 |
| `js/game.js` | 尚未拆出的战斗、角色行为、绘制和 UI 逻辑 |
| `assets/portraits/` | 植物立绘资源 |

## 植物栏目

| 植物 | 配置文件 | 立绘 |
| --- | --- | --- |
| 豌豆射手 | `plants/peashooter.js` | `assets/portraits/pea.webp` |
| 向日葵 | `plants/sunflower.js` | `assets/portraits/sunflower.webp` |
| 坚果 | `plants/wallnut.js` | `assets/portraits/wall.webp` |
| 土豆地雷 | `plants/potato-mine.js` | `assets/portraits/potato.webp` |
| 寒风扇 | `plants/cold-fan.js` | `assets/portraits/fan.webp` |
| 打火机 | `plants/lighter.js` | 当前由 Canvas 生成 |
| 吸铁石 | `plants/magnet.js` | 当前由 Canvas 生成 |
| 十字吹风机 | `plants/cross-fan.js` | 当前由 Canvas 生成 |

价格、生命、卡片冷却、名称和立绘路径只在对应植物文件修改。专属行为与绘制仍按下方入口定位，后续继续迁移。

## 关卡栏目

`levels/level-01.js` 至 `levels/level-10.js`：每关的路线、总敌数、初始阳光、出怪间隔、可用僵尸类型和通关植物奖励。

修改单独关卡时只读取对应文件。特殊事件逻辑暂时仍在 `js/game.js`，搜索 `updateLevelN` 或事件名。

## js/game.js 快速入口

| 修改方向 | 起始行 | 搜索词 |
| --- | ---: | --- |
| 植物放置与卡片使用 | 469 | `function place(` |
| 第十关战车与 Boss | 798 | `function updateLevel10(` |
| 僵尸创建与基础数据 | 908 | `function makeZombie(` |
| 僵尸受伤、击退与硬直 | 1052 | `function damageZombie(` |
| 战斗主更新循环 | 1160 | `function update(dt)` |
| 植物绘制入口 | 1943 | `function drawPea(` |
| 普通僵尸绘制入口 | 2863 | `function drawZombie(` |
| DOM/Canvas 总渲染 | 4025 | `function render(` |
| 通关与关卡 UI | 4396 | `function finish(` |
| 选卡流程 | 4619 | `function openPlantSelect(` |
| 图鉴渲染 | 4671 | `function renderAlmanac(` |

## 模块化进度

- [x] HTML、CSS、JavaScript 分离
- [x] Base64 立绘资源化
- [x] 每种植物独立配置
- [x] 每个关卡独立数据文件
- [ ] 植物专属行为与绘制迁移
- [ ] 僵尸行为与绘制拆分
- [ ] 核心战斗、UI 与存档拆分

新增、删除、移动文件或改变职责后更新本文件。每次只拆一个低耦合区域，并保持 GitHub Pages 可直接运行。
