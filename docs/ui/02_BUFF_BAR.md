# 02_BUFF_BAR.md

## 模块名称

BuffBar

中文

增益栏

---

# 功能定位

显示当前局已获得Buff

不显示详细描述

仅显示图标

---

# 区域尺寸

位置

TopBar下方

x:240

y:75

width:260

height:36

---

# 结构

固定5个格子

横向排列

间距

18px

---

# SLOT_01

节点

BuffSlot01

位置

x:250

y:75

width:32

height:32

内容

农

作用

经济类Buff

---

# SLOT_02

节点

BuffSlot02

内容

攻速

作用

攻击速度Buff

---

# SLOT_03

节点

BuffSlot03

内容

手掌

作用

操作类Buff

---

# SLOT_04

节点

BuffSlot04

内容

土地

作用

扩展类Buff

---

# SLOT_05

节点

BuffSlot05

内容

酒

作用

战斗类Buff

---

# 空状态

透明

不显示

---

# 获得Buff

动画

scale

0

↓

1.2

↓

1

时长

300ms

---

# 点击

显示详情弹窗

内容

名称

等级

效果

来源

---

# 程序节点

BuffBar

├─ BuffSlot01

├─ BuffSlot02

├─ BuffSlot03

├─ BuffSlot04

└─ BuffSlot05
