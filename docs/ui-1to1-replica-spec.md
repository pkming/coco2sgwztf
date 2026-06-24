# 《字战三国》主界面 1:1 复刻规格文档

## 目标

第一阶段先复刻参考图的主界面观感，不优先做完整玩法。页面要像一张已经上线的竖屏手游截图，而不是工程调试界面。

当前参考图放置位置：

```text
assets/art/reference/main_ui_reference.jpg
```

设计基准：

```text
参考图尺寸：1260 × 2800
Cocos 适配尺寸：720 × 1280
画面方向：竖屏
```

---

## 画面分区

按 720 × 1280 设计坐标拆分。

```text
Canvas 720×1280
├── 顶部状态区    y: 560 ~ 640
├── 战斗展示区    y: 90 ~ 520
├── 棋盘构筑区    y: -410 ~ 40
├── 底部操作区    y: -545 ~ -440
└── 底部提示区    y: -620 ~ -560
```

Cocos 坐标以画布中心为原点：

```text
左边界 x = -360
右边界 x = 360
上边界 y = 640
下边界 y = -640
```

---

## Cocos 节点层级

建议最终场景结构：

```text
Canvas
├── BackgroundLayer
│   ├── GlobalBg
│   └── DarkVignette
├── BattleLayer
│   ├── BattleFrame
│   ├── BattleBg
│   ├── PathLayer
│   ├── EnemyLayer
│   ├── ProjectileLayer
│   └── BattleEffectLayer
├── BoardLayer
│   ├── BoardFrame
│   ├── BoardBg
│   ├── CellLayer
│   ├── UnitLayer
│   └── MergeEffectLayer
├── UILayer
│   ├── TopBar
│   ├── ResourceBar
│   ├── ButtonBar
│   └── MessageBar
└── GuideLayer
```

原型阶段可以继续由 `GameBootstrap.ts` 自动生成节点，但资源命名和分区要按上面结构准备。

---

## 页面视觉基调

关键词：

```text
三国
古战场
暗金色
木质棋盘
汉字单位
固定路线
竖屏手游
```

色彩建议：

```text
全局底色：#281D18
深棕框：#4A2A19
战场暗棕：#533D2D
路线土黄：#9B6538
棋盘木色：#462C1C
开放格金棕：#CF9C52
锁定格暗棕：#2B231F
文字金色：#FFE6A4
按钮橙棕：#8E4D26
```

---

## 区域 1：全局背景

### 作用

承载整个页面氛围，让画面从第一眼就像三国手游。

### 尺寸

```text
720 × 1280
```

### 文件

```text
assets/art/ui/bg_full.png
```

### 设计要求

- 深色三国古战场氛围。
- 四周压暗，中间略亮。
- 不要出现大人物。
- 不要有文字。
- 细节不能抢战斗区和棋盘。

### image2 提示词

```text
竖屏手游主界面背景，三国古战场氛围，深棕色和暗金色，四周轻微暗角，中间略亮，宣纸与烟尘质感，适合叠加 UI 和汉字单位，不要人物，不要文字，不要复杂建筑，移动端游戏截图风格，720x1280比例
```

---

## 区域 2：顶部状态栏

### 作用

显示游戏标题、金币、生命、波次。

### 坐标与尺寸

```text
中心坐标：x=0, y=590
尺寸：690 × 80
```

### 文件

```text
assets/art/ui/top_bar.png
```

### 设计要求

- 深木牌或青铜牌质感。
- 左右有轻微装饰。
- 中间可放标题。
- 图片本身不要带文字，文字由 Cocos Label 显示。

### UI 文案

```text
金币 5     字战三国     生命 3
Wave 1
```

### image2 提示词

```text
三国古风手游顶部状态栏 UI，横向木牌和青铜边框，暗棕色底，金色描边，中间留标题位置，左右留资源数字位置，精致但不复杂，不带文字，透明背景，适合竖屏手游
```

---

## 区域 3：战斗展示区

### 作用

展示固定路线、敌人、攻击效果。它是构筑结果的验证层。

### 坐标与尺寸

```text
中心坐标：x=0, y=260
尺寸：690 × 470
```

### 文件

```text
assets/art/battle/battle_frame.png
assets/art/battle/battle_bg.png
```

### 设计要求

战斗区要像参考图里的主视觉区域，有边框、有深度，但不能花。

- 外框：木质或青铜边框。
- 背景：古战场地面，偏暗。
- 中央保留路线区域。
- 背景不要出现大角色。
- 路线和敌人要比背景更清楚。

### image2 提示词：战斗背景

```text
竖屏手游上半屏战斗区背景，三国古战场，暗棕色土地，烟尘，远处营帐和旗帜非常淡，俯视或轻微俯视角度，中间预留塔防路线区域，细节克制，适合叠加敌人和攻击特效，不带文字，不带人物，暗金色手游风格
```

### image2 提示词：战斗框

```text
三国古风手游战斗区域边框，横向圆角矩形，木质与青铜结合，暗棕色，金色描边，四角有轻微云纹或甲片装饰，中间透明，不带文字，适合放在竖屏手游上半屏
```

---

## 区域 4：固定路线

### 作用

让玩家一眼看懂敌人从哪里来、往哪里走。

### 路线坐标

战斗区内部坐标：

```ts
[
  { x: 310, y: 130 },
  { x: 110, y: 130 },
  { x: 110, y: 40 },
  { x: -160, y: 40 },
  { x: -160, y: -105 },
  { x: -320, y: -105 }
]
```

### 文件

```text
assets/art/battle/path_straight.png
assets/art/battle/path_corner.png
assets/art/battle/path_start.png
assets/art/battle/path_end.png
```

### 设计要求

- 路线宽度约 26px 到 34px。
- 底色为深土路。
- 内层有浅黄色高光边。
- 起点和终点要能区分。
- 拐角要自然，不要像程序线。

### image2 提示词

```text
塔防手游路径贴图，三国古战场土路，俯视角，深棕土路，浅金色边缘高光，可拼接，包含直线和拐角，干净清晰，不带文字，不带角色，透明背景
```

---

## 区域 5：棋盘构筑区

### 作用

这是核心玩法区域。玩家在这里征兵、拖拽、升级、保留文字。

### 坐标与尺寸

```text
中心坐标：x=0, y=-190
棋盘外框：430 × 430
格子数量：4 × 4
单格尺寸：78 × 78
格子间距：约 12
```

### 文件

```text
assets/art/board/board_frame.png
assets/art/board/board_bg.png
assets/art/board/cell_open.png
assets/art/board/cell_locked.png
assets/art/board/cell_highlight.png
```

### 设计要求

- 看起来像木质背包、军阵沙盘或竹简棋盘。
- 开放格偏亮，锁定格偏暗。
- 格子边界必须清晰。
- 单格要能容纳一个大汉字。
- 锁定格可显示锁图标，图片不要带文字。

### image2 提示词：棋盘外框

```text
三国古风手游棋盘背包区域，木质外框，4x4方格布局，暗金色和深棕色，格子清晰，适合放置大号中文汉字单位，像军阵沙盘和木质棋盘结合，不带文字，不带人物，透明背景
```

### image2 提示词：开放格

```text
手游棋盘开放格子，方形圆角，木质和宣纸质感，金棕色，边缘有轻微阴影，中间留白，适合放置一个大汉字，不带文字，透明背景
```

### image2 提示词：锁定格

```text
手游棋盘锁定格子，方形圆角，深棕色木质格，带简洁锁形图案，低亮度，和开放格同尺寸，不带文字，透明背景
```

---

## 区域 6：文字单位字牌

### 作用

字牌是整个游戏最重要的视觉焦点。

### 尺寸

```text
72 × 72
```

### 文件

```text
assets/art/unit/unit_tile_red.png      刀
assets/art/unit/unit_tile_orange.png   骑
assets/art/unit/unit_tile_blue.png     弓
assets/art/unit/unit_tile_green.png    枪
assets/art/unit/unit_level_badge.png   等级角标
assets/art/unit/unit_drag_glow.png     拖拽高亮
```

### 设计要求

- 图片只做底牌，不要把汉字画死在图片里。
- 汉字由 Cocos Label 显示，方便后续扩展关、羽、张、飞等字。
- 中央留出 50×50 以上的干净区域。
- 四种颜色要区分明显，但统一古风边框。

### 四类单位视觉

| 单位 | 颜色 | 功能 | 视觉气质 |
|---|---|---|---|
| 刀 | 赤红 | 单体攻击高 | 厚重、锋利、爆发 |
| 骑 | 金橙 | 范围攻击 | 冲击、扩散、扫荡 |
| 弓 | 蓝色 | 远程攻击 | 精准、远射、冷静 |
| 枪 | 绿色 | 穿刺攻击 | 直线、贯穿、利落 |

### image2 提示词：通用字牌

```text
三国古风手游汉字单位卡牌底座，方形圆角，宣纸底和金属边框，中间大面积留白用于放一个中文汉字，边缘有轻微磨损和发光，适合72x72小尺寸显示，不带任何文字，透明背景
```

### image2 提示词：刀字牌底

```text
赤红色三国古风汉字单位卡牌底座，方形圆角，锋利金属边框，厚重爆发感，中间留白用于放中文汉字，不带文字，透明背景
```

### image2 提示词：骑字牌底

```text
金橙色三国古风汉字单位卡牌底座，方形圆角，冲击和范围扩散感，边缘有马蹄或风尘暗纹，中间留白用于放中文汉字，不带文字，透明背景
```

### image2 提示词：弓字牌底

```text
蓝色三国古风汉字单位卡牌底座，方形圆角，远程精准感，边缘有弓弦和箭羽暗纹，中间留白用于放中文汉字，不带文字，透明背景
```

### image2 提示词：枪字牌底

```text
绿色三国古风汉字单位卡牌底座，方形圆角，直线穿刺感，边缘有长枪和锋线暗纹，中间留白用于放中文汉字，不带文字，透明背景
```

---

## 区域 7：底部操作区

### 坐标与尺寸

```text
按钮区中心：y=-485
单按钮尺寸：170 × 62
按钮间距：约 50
```

### 文件

```text
assets/art/ui/button_normal.png
assets/art/ui/button_primary.png
assets/art/ui/button_disabled.png
assets/art/ui/bottom_panel.png
```

### 按钮文案

```text
征兵 -3
删除返 1
开始战斗
```

### 设计要求

- 像古风木牌按钮。
- 主按钮更亮，普通按钮略暗。
- 图片不要带文字。
- 文字由 Cocos Label 显示。

### image2 提示词

```text
三国古风手游按钮底图，木牌质感，圆角矩形，暗棕色底，金色边框，轻微高光，适合放中文按钮文字，不带文字，透明背景
```

---

## 区域 8：敌人资源

### 文件

```text
assets/art/enemy/enemy_normal.png
assets/art/enemy/enemy_shield.png
assets/art/enemy/enemy_fast.png
assets/art/enemy/enemy_elite.png
```

### 尺寸

```text
48 × 48 或 64 × 64
```

### 设计要求

- 小尺寸可读。
- 轮廓清楚。
- 不能比汉字单位更抢眼。
- 保持三国小兵感。

### image2 提示词：普通兵

```text
三国题材手游普通小兵图标，Q版小尺寸，深棕盔甲，轮廓清晰，适合沿塔防路径移动，透明背景，不带文字
```

### image2 提示词：盾兵

```text
三国题材手游盾兵图标，Q版小尺寸，大盾牌轮廓明显，厚重防御感，深色盔甲，透明背景，不带文字
```

### image2 提示词：快速怪

```text
三国题材手游快速士兵图标，Q版小尺寸，轻甲，速度感，轻微残影，轮廓清晰，透明背景，不带文字
```

### image2 提示词：精英怪

```text
三国题材手游精英敌人图标，Q版小尺寸，比普通兵更高大，暗红盔甲，压迫感，轮廓清晰，透明背景，不带文字
```

---

## 区域 9：攻击特效

### 文件

```text
assets/art/effect/hit_slash.png       刀命中特效
assets/art/effect/aoe_ring.png        骑范围特效
assets/art/effect/arrow_projectile.png 弓箭矢
assets/art/effect/pierce_line.png     枪穿刺线
assets/art/effect/merge_flash.png     合成闪光
```

### image2 提示词：刀

```text
手游战斗刀砍命中特效，赤红色短弧形斩击，干净清晰，小尺寸，透明背景，不带文字
```

### image2 提示词：骑

```text
手游战斗范围冲击特效，金橙色圆形冲击波，尘土扩散，适合AOE攻击，透明背景，不带文字
```

### image2 提示词：弓

```text
手游战斗箭矢飞行特效，蓝色高光箭矢，细长清晰，适合远程攻击，透明背景，不带文字
```

### image2 提示词：枪

```text
手游战斗穿刺直线特效，绿色长线刺击，锋利贯穿感，适合穿过多个敌人，透明背景，不带文字
```

---

## 静态复刻优先级

先不接玩法，先完成静态还原。

### 第一批必须有

```text
bg_full.png
battle_frame.png
battle_bg.png
path_straight.png
path_corner.png
board_frame.png
cell_open.png
cell_locked.png
unit_tile_red.png
unit_tile_orange.png
unit_tile_blue.png
unit_tile_green.png
button_normal.png
button_primary.png
```

### 第二批再补

```text
enemy_normal.png
enemy_shield.png
enemy_fast.png
hit_slash.png
aoe_ring.png
arrow_projectile.png
pierce_line.png
merge_flash.png
```

---

## 1:1 静态摆放假数据

静态页面先摆这些单位：

```text
第 1 行：刀1、弓1、空、锁
第 2 行：骑1、枪1、空、锁
第 3 行：弓2、空、刀1、锁
第 4 行：空、空、空、锁
```

顶部显示：

```text
金币 5
生命 3
Wave 1
```

底部按钮：

```text
征兵 -3
删除返 1
开始战斗
```

战斗区：

```text
画出固定折线路线
放 2 个普通兵在路线中段
入口和终点可用小图标，不直接写大字
```

---

## Cocos 接入顺序

1. 先把所有 PNG 放到对应目录。
2. 在 Cocos 里确认图片导入成功。
3. 用 Sprite 替换 `GameBootstrap.ts` 里的 Graphics 色块。
4. 保留 Label 显示汉字、等级、金币、生命。
5. 截图对比参考图。
6. 先调位置和比例，再接玩法逻辑。

---

## 还原验收标准

截图时看这几点：

```text
上半屏像三国战场，不像纯色块
下半屏像木质背包棋盘
路线清楚，敌人路径一眼能懂
汉字单位最醒目
按钮像手游按钮
顶部资源栏有包装感
整体暗金、深棕、古战场风格统一
```

达到这些，再恢复征兵、拖拽、升级、战斗等动态功能。
