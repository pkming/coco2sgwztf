# 09_UNIT_SYSTEM.md

# 模块名称

Unit System

中文：

单位系统

兵种系统

战斗单位系统

---

# 模块定位

整个游戏战斗核心。

玩家所有构筑最终转化为单位。

单位负责：

```text
输出

控制

成长

合成

战斗表现
```

---

# 玩家认知目标

玩家必须理解：

```text
兵放到棋盘

↓

自动攻击

↓

获得收益

↓

升级变强
```

---

# MVP单位

当前仅开放：

```text
刀兵

弓兵

枪兵

骑兵
```

---

# 单位层级

```text
Lv1

Lv2

Lv3

Lv4

Lv5
```

---

# 单位显示规范

显示位置：

BuildArea

---

# 单位尺寸

推荐：

```yaml
64x64
```

最大：

```yaml
72x72
```

---

# 锚点

```yaml
anchorX:0.5
anchorY:0.5
```

---

# 透明背景

必须

---

# 禁止

```text
卡牌底图

头像框

大立绘
```

---

# 单位组成

Unit

├─ Body

├─ Weapon

├─ LevelBadge

├─ BuffEffect

└─ SelectEffect

---

# BODY

角色主体

---

# 作用

显示兵种

---

# MVP方案

角色不换

---

# 升级时

仅换：

```text
武器

边框

特效
```

---

# WEAPON

武器层

---

# 作用

显示等级成长

---

# 刀兵

Lv1

木刀

---

Lv2

铁刀

---

Lv3

精钢刀

---

Lv4

宝刀

---

Lv5

龙纹刀

---

# 弓兵

Lv1

木弓

---

Lv2

铁弓

---

Lv3

长弓

---

Lv4

连弩

---

Lv5

神弓

---

# 枪兵

Lv1

木枪

---

Lv2

铁枪

---

Lv3

长枪

---

Lv4

重枪

---

Lv5

龙胆枪

---

# 骑兵

Lv1

普通战马

---

Lv2

护甲马

---

Lv3

精锐骑兵

---

Lv4

重骑兵

---

Lv5

神驹

---

# LEVEL_BADGE

位置

右上角

---

# 尺寸

```yaml
20x20
```

---

# 内容

```text
1
2
3
4
5
```

---

# 字体

白色

粗体

---

# BUFF_EFFECT

作用

显示增益

---

# 攻击加成

红色光环

---

# 攻速加成

黄色光环

---

# 范围加成

蓝色光环

---

# SELECT_EFFECT

作用

选中反馈

---

# 样式

黄色描边

---

# 动画

呼吸发光

---

# UNIT_STATE_IDLE

状态

待机

---

# 表现

站立

轻微上下浮动

---

# UNIT_STATE_ATTACK

状态

攻击

---

# 表现

播放攻击动作

---

# 时长

```yaml
100ms~300ms
```

---

# UNIT_STATE_HIT

状态

受击

---

# 表现

闪白

---

# UNIT_STATE_DEAD

状态

死亡

---

# 表现

缩小

透明

消失

---

# KNIFE_UNIT

名称

刀兵

---

# 定位

单体输出

---

# 攻击距离

```yaml
1格
```

---

# 攻击目标

最近敌人

---

# 攻击频率

```yaml
1.0s
```

---

# 攻击特效

刀光

---

# 视觉颜色

红色

---

# 玩家印象

```text
高伤害

近战
```

---

# ARCHER_UNIT

名称

弓兵

---

# 定位

远程输出

---

# 攻击距离

```yaml
5格
```

---

# 攻击目标

最前方敌人

---

# 攻击频率

```yaml
1.2s
```

---

# 攻击特效

箭矢

---

# 视觉颜色

蓝色

---

# 玩家印象

```text
远程

稳定
```

---

# SPEAR_UNIT

名称

枪兵

---

# 定位

穿透输出

---

# 攻击距离

```yaml
3格
```

---

# 攻击目标

直线敌人

---

# 穿透数量

```yaml
3
```

---

# 攻击特效

穿刺线

---

# 视觉颜色

绿色

---

# 玩家印象

```text
贯穿

群伤
```

---

# CAVALRY_UNIT

名称

骑兵

---

# 定位

范围输出

---

# 攻击距离

```yaml
2格
```

---

# 攻击范围

```yaml
120px
```

---

# 攻击目标

中心目标

---

# 攻击特效

冲击波

---

# 视觉颜色

橙色

---

# 玩家印象

```text
AOE

清怪
```

---

# 合成系统

条件：

```text
同兵种

同等级
```

---

# 示例

```text
刀Lv1

+

刀Lv1
```

↓

```text
刀Lv2
```

---

# 合成动画

阶段1

吸附

---

阶段2

闪光

---

阶段3

生成新单位

---

# 总时长

```yaml
300ms
```

---

# 战斗生成

战斗开始

↓

读取BuildArea

↓

生成BattleUnit

↓

进入战斗

---

# BattleUnit属性

```ts
interface BattleUnit {
  id:string;

  type:string;

  level:number;

  hp:number;

  attack:number;

  attackSpeed:number;

  range:number;

  crit:number;
}
```

---

# Layer层级

Path

↓

Enemy

↓

Unit

↓

Projectile

↓

Effect

↓

Damage

---

# 程序节点

UnitRoot

├─ Body

├─ Weapon

├─ LevelBadge

├─ BuffEffect

├─ SelectEffect

└─ Shadow

---

# MVP目标

仅实现：

```text
刀兵

弓兵

枪兵

骑兵

5级成长

合成升级

自动攻击
```

---

# 后续扩展

开放：

```text
关羽

张飞

赵云

马超

黄忠

吕布
```

作为英雄单位。

基础兵种保持不变。

---

# 设计原则

玩家必须做到：

```text
看一眼单位

立即知道：

是什么兵

多少级

强不强

能干什么
```

禁止出现：

```text
看不出兵种

看不出等级

看不出成长
```
