# PROJECT_MAP

本文件只用于快速定位，不复制实现代码。修改前先读 `AGENTS.md`，再按下表读取最小相关区域。

## 当前结构

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面 DOM 结构与外部资源加载；不再包含主 CSS/JavaScript |
| `css/game.css` | 全部游戏样式、响应式布局、动画与移动端适配 |
| `js/game.js` | 当前主游戏逻辑；保持原有 IIFE 和执行顺序，后续再分阶段拆分 |
| `assets/` | 音乐、图片等外部资源 |
| `AGENTS.md` | 长期开发与安全规则 |
| `PROJECT_MAP.md` | 本导航文件 |

## js/game.js 快速入口

以下为当前大致起始行；文件变化后可按“搜索词”定位，不要默认读取整个文件。

| 修改方向 | 起始行 | 搜索词 |
| --- | ---: | --- |
| 存档、解锁与全局状态 | 357 | `const SAVE_KEY=` |
| 植物放置与卡片使用 | 486 | `function place(` |
| 第十关战车与 Boss | 816 | `function updateLevel10(` |
| 僵尸创建与基础数据 | 926 | `function makeZombie(` |
| 僵尸受伤、击退与硬直 | 1070 | `function damageZombie(` |
| 战斗主更新循环 | 1178 | `function update(dt)` |
| 植物绘制入口 | 1961 | `function drawPea(` |
| 普通僵尸绘制入口 | 2882 | `function drawZombie(` |
| DOM/Canvas 总渲染 | 4046 | `function render(` |
| 通关、奖励与关卡 UI | 4417 | `function finish(` |
| 选卡流程 | 4649 | `function openPlantSelect(` |
| 图鉴渲染 | 4701 | `function renderAlmanac(` |

## 修改路由

- UI、布局、手机适配：先读 `css/game.css` 的相关选择器；需要 DOM 时再读 `index.html`。
- 植物或僵尸逻辑：只读 `js/game.js` 中对应函数附近的行段。
- 关卡/Boss：搜索对应的 `updateLevelN`、`LEVELS` 或事件名。
- 音频与图片：优先查看 `assets/` 路径及 `js/game.js` 中的资源引用，不分析二进制内容。
- 新增、删除、移动文件或改变职责后，更新本文件。

## 分阶段模块化状态

- [x] CSS 从 `index.html` 独立
- [x] JavaScript 从 `index.html` 独立
- [ ] 核心系统拆分
- [ ] 植物模块拆分
- [ ] 僵尸模块拆分
- [ ] 关卡数据化
- [ ] UI 与存档独立

后续每次只拆一个低耦合区域，并确保每阶段都可在 GitHub Pages 直接运行。
