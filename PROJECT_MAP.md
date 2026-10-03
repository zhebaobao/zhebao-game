# PROJECT_MAP

修改前先读 `AGENTS.md`，再按本文件只读取当前任务需要的文件。

## 核心入口

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面 DOM 容器；只加载模块清单和启动器 |
| `js/config/module-manifest.js` | 植物、关卡、僵尸与运行时脚本的唯一加载清单；改动模块后同步更新 `version` |
| `js/bootstrap.js` | 按清单顺序加载模块并启动游戏 |
| `css/game.css` | UI、响应式布局和 CSS 动画 |
| `js/config/game-config.js` | 汇总植物、关卡和僵尸注册表；保存测试开关与存档键 |
| `js/save/progress.js` | 存档规范化与 localStorage 读写 |
| `js/ui/almanac-data.js` | 图鉴静态名称与说明文字 |
| `js/ui/level-select.js` | 根据关卡注册表生成选关卡片与关卡编号 |
| `js/game.js` | 尚未拆出的战斗流程、动画绘制和动态 UI |
| `assets/portraits/` | 植物立绘资源 |

## 植物栏目

| 植物 | 文件 | 已迁入内容 |
| --- | --- | --- |
| 豌豆射手 | `plants/peashooter.js` | 价格、生命、冷却、射速、弹速、伤害、火焰伤害 |
| 向日葵 | `plants/sunflower.js` | 价格、生命、冷却、阳光生产周期 |
| 坚果 | `plants/wallnut.js` | 价格、生命、冷却、熔岩生命与接触伤害 |
| 土豆地雷 | `plants/potato-mine.js` | 准备时间、触发/爆炸范围、伤害 |
| 寒风扇 | `plants/cold-fan.js` | 作用范围、减速倍率 |
| 打火机 | `plants/lighter.js` | 点火延迟、寿命、火坑时间、转化时间 |
| 吸铁石 | `plants/magnet.js` | 吸取范围、冷却、扫描间隔 |
| 十字吹风机 | `plants/cross-fan.js` | 持续时间、每秒伤害、纵向判定 |

修改植物数值或玩法参数，只读取对应植物文件。共享放置、更新和绘制流程暂时仍在 `js/game.js`。

## 僵尸栏目

`zombies/` 下每种僵尸一个文件，包含生命、速度、护甲、步态及已迁入的专属参数：

- 爬行僵尸：`zombies/crawler.js`
- 长发女鬼：`zombies/longhair.js`
- 中型巨人：`zombies/giant.js`
- 矿工僵尸：`zombies/miner.js`
- 包工头 Boss：`zombies/workboss.js`

其余普通、路障、铁桶、小鬼、脑浆僵尸按英文类型名位于同目录。

## 关卡栏目

`levels/level-01.js` 至 `levels/level-10.js`：每关路线、敌人数、经济、出怪间隔、敌人类型、奖励，以及关卡标题/副标题。新增关卡时创建对应文件，并在 `js/config/module-manifest.js` 的 `levels` 清单登记。

## js/game.js 余下定位

- 植物放置：搜索 `function place(`
- 植物共享更新：搜索 `if(p.type==='sunflower')`
- 僵尸创建：搜索 `function makeZombie(`
- 僵尸受伤：搜索 `function damageZombie(`
- 第十关 Boss：搜索 `function updateLevel10(`
- 植物绘制：搜索 `function drawPea(`
- 僵尸绘制：搜索 `function drawZombie(`
- 选卡：搜索 `function openPlantSelect(`

## 模块化进度

- [x] HTML、CSS、JavaScript 分离
- [x] Base64 立绘资源化
- [x] 每种植物独立配置与玩法参数
- [x] 每个关卡独立数据文件
- [x] 清单驱动的模块加载与可扩展选关入口
- [x] 每种僵尸独立基础配置
- [ ] 植物专属行为函数与绘制迁移
- [ ] 僵尸 AI、攻击与绘制迁移
- [x] 存档序列化与图鉴静态数据拆分
- [ ] 核心战斗与动态 UI 拆分

`npm run check` 可检查脚本语法、清单路径和注册表完整性。

新增、删除、移动文件或改变职责后更新本文件。每次只拆一个低耦合区域，并保持 GitHub Pages 可直接运行。
