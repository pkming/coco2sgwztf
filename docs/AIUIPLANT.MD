# ART_PIPELINE.md

# 《文字三国》美术资源生产规范 V1.0

---

# 一、目标

建立统一的美术生产流水线。

目标：

```text
统一风格
统一命名
统一尺寸
统一目录
统一生成顺序
```

所有资源必须可替换、可换肤、可复用。

禁止为某个页面单独画资源。

---

# 二、美术风格

主题：

```text
Three Kingdoms
Ancient Battlefield
Dark Bronze
Dark Gold
Ancient Wood
Parchment
```

关键词：

```text
写实
高端手游
古战场
厚重
暗色
移动端
```

禁止：

```text
二次元
欧美卡通
Q版泡泡风
现代UI
```

---

# 三、资源目录

```text
assets/

├── background/
├── ui/
├── board/
├── building/
├── unit/
├── enemy/
├── projectile/
├── effect/
├── icon/
├── number/
├── font/
├── audio/
└── skin/
```

---

# 四、生产顺序

P0

```text
Background
UI
Board
```

P1

```text
Unit
Enemy
```

P2

```text
Projectile
Effect
Icon
```

P3

```text
Audio
Skin
```

---

# 五、Background

目录：

```text
background/
```

资源：

```text
battle_bg.png

home_bg.png

result_bg.png
```

说明：

battle_bg

整个战斗背景

禁止：

```text
棋盘

路线

UI

人物
```

只负责：

```text
古战场氛围
```

---

# 六、UI

目录：

```text
ui/
```

TopBar

```text
topbar_bg.png

gold_bg.png

life_bg.png

wave_bg.png
```

BottomBar

```text
bottom_bg.png
```

Button

```text
btn_primary.png

btn_normal.png

btn_small.png

btn_disable.png
```

Panel

```text
panel_large.png

panel_small.png

panel_dialog.png

panel_reward.png
```

Popup

```text
popup_bg.png

popup_close.png
```

---

# 七、Board

目录：

```text
board/
```

Build Tile

```text
tile_build.png
```

Expand Tile

```text
tile_expand.png
```

Locked Tile

```text
tile_locked.png
```

Selected Tile

```text
tile_selected.png
```

Merge Tile

```text
tile_merge.png
```

Attack Range

```text
tile_range.png
```

---

# 八、Path

目录：

```text
board/path/
```

```text
path_straight.png

path_corner.png

path_cross.png

path_end.png
```

Spawn

```text
spawn_gate.png
```

Goal

```text
goal_castle.png
```

---

# 九、Building

目录：

```text
building/
```

```text
castle_lv1.png

castle_lv2.png

castle_lv3.png

gate.png

camp.png

tower.png
```

---

# 十、Unit

目录：

```text
unit/
```

兵种：

```text
knife

archer

spear

cavalry
```

每个兵种：

```text
idle

attack

dead

icon

shadow
```

等级：

```text
lv1

lv2

lv3

lv4

lv5
```

原则：

```text
模型保持一致

仅更换：

武器

盔甲

颜色

特效
```

---

# 十一、Enemy

目录：

```text
enemy/
```

类型：

```text
normal

fast

shield

elite

boss
```

动画：

```text
idle

walk

attack

dead
```

---

# 十二、Projectile

目录：

```text
projectile/
```

```text
arrow

knife_wave

spear

fireball

lightning

stone
```

全部Prefab。

禁止写死。

---

# 十三、Effect

目录：

```text
effect/
```

```text
slash

hit

critical

upgrade

merge

spawn

coin

blood

explosion

buff

levelup
```

要求：

全部透明背景。

---

# 十四、Icon

目录：

```text
icon/
```

资源：

```text
gold

life

wave

pause

speed

setting

bag

shop

buff

technology

upgrade

delete

recruit

expand
```

统一：

```text
64×64
```

---

# 十五、数字

目录：

```text
number/
```

资源：

```text
damage

critical

heal

gold

combo
```

颜色：

```text
白

黄

红

绿
```

---

# 十六、字体

目录：

```text
font/
```

```text
title.ttf

normal.ttf

number.ttf
```

---

# 十七、音效

目录：

```text
audio/
```

```text
click

attack

merge

coin

upgrade

dead

victory

fail

button
```

---

# 十八、换肤规范

目录：

```text
skin/

classic/

three_kingdoms/

fantasy/

zombie/

cyber/
```

每套必须包含：

```text
background

ui

unit

enemy

effect

projectile
```

代码禁止直接引用图片。

全部通过：

```text
SkinManager
```

读取。

---

# 十九、资源命名规范

统一：

```text
snake_case
```

例如：

```text
knife_lv1.png

enemy_fast.png

btn_primary.png

effect_merge.png
```

禁止：

```text
new.png

1.png

abc.png

最终版.png
```

---

# 二十、AI生产顺序

第一批（立即）

```text
battle_bg

topbar  （金币
生命
波次
标题）

bottom_bar

button

panel

tile_build

tile_expand

tile_locked
```

第二批

```text
knife

archer

spear

cavalry
```

第三批

```text
enemy

castle

gate
```

第四批

```text
effect

projectile

icon
```

第五批

```text
audio

font

skin
```

---

# 二十一、资源复用原则

一个按钮：

```text
全游戏复用
```

一个Panel：

```text
商店

Buff

科技

奖励

结算
```

一个Tile：

```text
所有地图复用
```

一个人物：

```text
Lv1-Lv5

仅升级装备

不更换模型
```

一个特效：

```text
多个兵种复用

仅颜色变化
```

---

# 二十二、MVP资源统计

| 分类         | 数量 |
| ---------- | -: |
| Background |  3 |
| UI         | 18 |
| Board      | 10 |
| Building   |  6 |
| Unit       | 20 |
| Enemy      |  5 |
| Projectile |  6 |
| Effect     | 12 |
| Icon       | 20 |
| Audio      | 15 |
| Font       |  3 |

总计约：

```text
118 个资源
```

其中 MVP 第一版真正需要制作的资源约 **40 个**，其余可以随着版本迭代逐步补充。
