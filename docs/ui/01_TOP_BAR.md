# 01_TOP_BAR.md

## 模块名称

TopBar

中文：

顶部状态栏

---

# 功能定位

显示当前局核心状态。

玩家视线进入游戏后第一关注区域。

不参与战斗。

不响应拖拽。

---

# 区域尺寸

Canvas

720 × 1280

TopBar

x:0

y:0

width:720

height:120

---

# 背景层

节点

TopBarBg

位置

x:0

y:0

width:720

height:120

样式

深棕木质

青铜描边

透明度100%

层级

zIndex:100

---

# BTN_PAUSE

节点

PauseButton

位置

左上角

left:20

top:20

width:48

height:48

样式

深灰圆角矩形

圆角：

8px

图标：

暂停符号

颜色：

#FFFFFF

点击区域：

64×64

作用

暂停游戏

---

# RESOURCE_FOOD_ICON

节点

FoodIcon

位置

left:90

top:18

width:52

height:52

资源

白色包子

作用

钱粮

当前截图唯一资源

---

# RESOURCE_FOOD_VALUE

节点

FoodValue

位置

left:150

top:18

width:80

height:52

字体

Bold

32px

颜色

#FFFFFF

描边

#000000

2px

示例

20

---

# 数据来源

增加

击杀敌人

波次奖励

道具奖励

活动奖励

减少

征兵

购买道具

扩展土地

---

# MAP_TITLE

节点

MapTitle

位置

x:360

top:10

width:220

height:30

锚点

0.5

字体

紫色

24px

居中

示例

云梦泽

作用

显示当前地图

---

# WAVE_TEXT

节点

WaveText

位置

x:360

top:45

width:120

height:30

字体

白色

20px

居中

示例

第1波

---

# MORE_BUTTON

节点

MoreButton

位置

right:20

top:12

width:120

height:42

样式

灰色胶囊

内容

...

作用

更多菜单

设置

退出

帮助

---

# 层级

TopBarBg

↓

Food

↓

Wave

↓

MapName

↓

Buttons

---

# 程序节点

TopBar

├─ TopBarBg

├─ PauseButton

├─ FoodIcon

├─ FoodValue

├─ MapTitle

├─ WaveText

└─ MoreButton
