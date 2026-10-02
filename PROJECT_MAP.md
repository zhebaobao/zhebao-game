# PROJECT_MAP

本文件只用于快速定位，不复制实现代码。修改前先读 `AGENTS.md`，再按下表读取最小相关区域。

## 当前结构

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面 DOM 结构与脚本/样式加载顺序 |
| `css/game.css` | 全部游戏样式、响应式布局和 CSS 动画 |
| `js/config/game-config.js` | 关卡数据、植物价格/生命/冷却、解锁奖励、名称和正式/测试开关 |
| `js/game.js` | 战斗、角色行为、绘制和 UI 主逻辑；继续分阶段拆分 |
| `assets/portraits/` | 植物选择、奖励和图鉴使用的外部 WebP 立绘 |
| `assets/` | 音乐、图片等其他外部资源 |
| `AGENTS.md` | 长期开发与安全规则 |

## 修改路由

- 调整关卡行数、波次、初始阳光、出怪间隔：`js/config/game-config.js`
- 调整植物价格、生命、冷却、名称或解锁奖励：`js/config/game-config.js`
- 替换植物立绘：`assets/portraits/<植物英文名>.webp`
- UI、布局和手机适配：`css/game.css`；需要 DOM 时再读 `index.html`
- 音频与图片引用：先查 `assets/` 和相关配置，不读取二进制内容
- 战斗逻辑：按下面搜索词只读 `js/game.js` 的相关行段

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
| 通关、奖励与关卡 UI | 4396 | `function finish(` |
| 选卡流程 | 4625 | `function openPlantSelect(` |
| 图鉴渲染 | 4677 | `function renderAlmanac(` |

## 分阶段模块化状态

- [x] CSS 与 JavaScript 从 `index.html` 独立
- [x] Base64 植物立绘资源化
- [x] 关卡与植物固定配置独立
- [ ] 核心战斗系统拆分
- [ ] 植物行为和绘制拆分
- [ ] 僵尸行为和绘制拆分
- [ ] UI 与存档独立

新增、删除、移动文件或改变职责后更新本文件。每次只拆一个低耦合区域，并保持 GitHub Pages 可直接运行。
