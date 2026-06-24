# 12_UI_STYLE_GUIDE.md

# 项目名称

文字三国

---

# 项目定位

类型：

```text
Roguelike
塔防
背包构筑
自动战斗
合成升级
```

核心卖点：

```text
征兵

拖拽

合成

扩地

自动战斗
```

---

# UI设计目标

玩家进入游戏：

3秒理解玩法

10秒完成征兵

30秒完成第一次合成

1分钟进入成长循环

---

# 视觉关键词

核心关键词：

```text
三国

古战场

木质

青铜

宣纸

军阵

沙盘
```

---

# 禁止风格

禁止：

```text
赛博朋克

二次元

Q版泡泡风

卡通风

欧美魔幻
```

---

# 美术方向

参考：

```text
率土之滨

三国志战略版

无悔华夏

黑神话UI
```

---

# 主色系统

# Primary Gold

用途：

```text
主按钮

重点提示

高亮
```

颜色：

```yaml
#D8A24A
```

---

# Dark Gold

用途：

```text
边框

标题
```

颜色：

```yaml
#A9782C
```

---

# Bronze

用途：

```text
次级边框
```

颜色：

```yaml
#7D5A32
```

---

# Wood

用途：

```text
背景

面板
```

颜色：

```yaml
#4A2F20
```

---

# Parchment

用途：

```text
格子

信息面板
```

颜色：

```yaml
#F5F0E8
```

---

# Danger Red

用途：

```text
危险

扩展地

删除
```

颜色：

```yaml
#C05A5A
```

---

# Success Green

用途：

```text
可合成

成功
```

颜色：

```yaml
#6FAF64
```

---

# Rare Blue

用途：

```text
弓兵

远程

稀有
```

颜色：

```yaml
#4A8DD8
```

---

# Epic Purple

用途：

```text
史诗品质
```

颜色：

```yaml
#8B5ED1
```

---

# 字体系统

# 主标题

用途：

```text
地图名

章节名
```

大小：

```yaml
32
```

颜色：

```yaml
#FFFFFF
```

描边：

```yaml
#000000
```

---

# 二级标题

用途：

```text
面板标题
```

大小：

```yaml
24
```

---

# 普通文本

用途：

```text
按钮

描述
```

大小：

```yaml
18
```

---

# 数字

用途：

```text
金币

生命

伤害
```

大小：

```yaml
20
```

粗体：

```yaml
true
```

---

# 暴击数字

颜色：

```yaml
#FFD700
```

大小：

```yaml
28
```

---

# 圆角规范

按钮：

```yaml
12px
```

---

# 格子

```yaml
6px
```

---

# 面板

```yaml
10px
```

---

# 阴影规范

统一：

```yaml
offsetY:2

blur:4

opacity:15%
```

---

# 按钮系统

# 主按钮

用途：

```text
征兵

开始战斗
```

颜色：

```yaml
#F39C12
```

尺寸：

```yaml
180x90
```

---

# 次按钮

用途：

```text
技能

宝箱
```

尺寸：

```yaml
72x72
```

---

# 危险按钮

用途：

```text
删除

出售
```

颜色：

```yaml
#C05A5A
```

---

# 格子系统

# Build Cell

颜色：

```yaml
#F5F0E8
```

作用：

```text
放兵
```

---

# Expand Cell

颜色：

```yaml
#C05A5A
```

作用：

```text
扩地
```

---

# Merge Cell

颜色：

```yaml
#6FAF64
```

作用：

```text
可合成
```

---

# 单位颜色规范

# 刀兵

主色：

```yaml
#D9534F
```

关键词：

```text
爆发

近战
```

---

# 弓兵

主色：

```yaml
#4A8DD8
```

关键词：

```text
精准

远程
```

---

# 枪兵

主色：

```yaml
#5CB85C
```

关键词：

```text
穿透

贯穿
```

---

# 骑兵

主色：

```yaml
#F0AD4E
```

关键词：

```text
范围

冲锋
```

---

# 品质颜色

普通

```yaml
#CCCCCC
```

---

优秀

```yaml
#6FAF64
```

---

稀有

```yaml
#4A8DD8
```

---

史诗

```yaml
#8B5ED1
```

---

传说

```yaml
#FFD700
```

---

# 特效规范

# 刀兵

颜色：

```yaml
#D9534F
```

形态：

```text
弧形刀光
```

---

# 弓兵

颜色：

```yaml
#4A8DD8
```

形态：

```text
箭矢轨迹
```

---

# 枪兵

颜色：

```yaml
#5CB85C
```

形态：

```text
直线穿刺
```

---

# 骑兵

颜色：

```yaml
#F0AD4E
```

形态：

```text
圆形冲击波
```

---

# 合成特效

颜色：

```yaml
#FFD700
```

时长：

```yaml
300ms
```

---

# UI层级

```text
Layer 01 Background

Layer 02 Path

Layer 03 ExpandTile

Layer 04 BuildCell

Layer 05 Unit

Layer 06 Projectile

Layer 07 Effect

Layer 08 DamageText

Layer 09 TopBar

Layer 10 ToolBar

Layer 11 Popup
```

---

# 统一动画规范

点击：

```yaml
1.0

↓

0.95

↓

1.0
```

100ms

---

获得：

```yaml
0

↓

1.2

↓

1.0
```

300ms

---

升级：

```yaml
1.0

↓

1.3

↓

1.0
```

300ms

---

# MVP资源数量

单位：

```text
刀兵 Lv1~Lv5

弓兵 Lv1~Lv5

枪兵 Lv1~Lv5

骑兵 Lv1~Lv5
```

共：

```text
20个单位资源
```

---

敌人：

```text
普通

快速

盾兵

精英

Boss
```

共：

```text
5个资源
```

---

特效：

```text
刀光

箭矢

穿刺

AOE

合成
```

共：

```text
5个资源
```

---

# MVP验收标准

玩家第一次进入游戏：

```text
知道哪里征兵

知道哪里放兵

知道哪里扩地

知道怎么合成

知道敌人怎么走
```

30秒内完成一次：

```text
征兵

拖拽

合成

战斗

获得奖励
```

即通过MVP验证。
