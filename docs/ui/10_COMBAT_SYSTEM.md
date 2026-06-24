# 10_COMBAT_SYSTEM.md

# 模块名称

Combat System

中文：

战斗系统

自动战斗系统

伤害结算系统

---

# 模块定位

整个游戏最终验证层。

玩家所有决策最终通过战斗验证。

包括：

```text
征兵

布阵

扩地

合成

升级

Buff选择
```

最终全部转化为：

```text
输出

击杀

通关
```

---

# 玩家认知目标

玩家必须理解：

```text
放兵

↓

自动攻击

↓

怪物死亡

↓

获得资源
```

无需手动控制。

无需释放技能。

无需点击敌人。

---

# 战斗流程

```text
开始战斗

↓

生成敌人

↓

单位自动攻击

↓

敌人移动

↓

敌人死亡

↓

获得奖励

↓

下一波
```

---

# 战斗阶段

共4个阶段

---

# PHASE_01

准备阶段

---

触发

玩家点击：

```text
开始战斗
```

---

执行

锁定棋盘

禁止拖拽

禁止征兵

禁止扩地

---

持续

```yaml
0.5秒
```

---

# PHASE_02

生成阶段

---

触发

准备阶段结束

---

执行

根据Wave配置生成敌人

---

表现

出生点闪光

敌人出现

---

# PHASE_03

战斗阶段

---

执行

敌人移动

单位攻击

伤害结算

死亡结算

奖励结算

---

持续

直到：

```text
全部敌人死亡

或者

敌人进入终点
```

---

# PHASE_04

结算阶段

---

显示

胜利

失败

奖励

---

恢复

棋盘操作

征兵

扩地

---

# 敌人生成

来源

WaveConfig

---

# Wave01

```yaml
enemyCount:10
enemyType:normal
interval:1s
```

---

# Wave02

```yaml
enemyCount:15
enemyType:normal
interval:0.8s
```

---

# Wave03

```yaml
enemyCount:20
enemyType:mixed
interval:0.8s
```

---

# 敌人出生

位置

SpawnPoint

---

动画

透明

↓

出现

↓

正常移动

---

时长

```yaml
200ms
```

---

# Enemy

组成

Enemy

├─ Body

├─ HpBar

├─ BuffLayer

├─ Shadow

└─ EffectLayer

---

# EnemyBody

敌人主体

---

尺寸

```yaml
48x48
```

---

# HpBar

位置

头顶

---

尺寸

```yaml
40x6
```

---

颜色

绿色

---

血量降低

长度同步减少

---

# EnemyMove

逻辑

按照路径节点移动

---

顺序

```text
P1

↓

P2

↓

P3

↓

P4

↓

P5

↓

P6
```

---

# 移动速度

Normal

```yaml
speed:100
```

---

Fast

```yaml
speed:150
```

---

Elite

```yaml
speed:80
```

---

Boss

```yaml
speed:60
```

---

# 单位索敌

触发

攻击冷却结束

---

搜索范围

单位攻击范围

---

刀兵

最近敌人

---

弓兵

最前方敌人

---

枪兵

直线敌人

---

骑兵

范围敌人

---

# 攻击流程

```text
发现目标

↓

转向目标

↓

播放攻击动画

↓

生成特效

↓

计算伤害

↓

敌人扣血
```

---

# Damage

公式

```ts
damage = attack
```

MVP阶段不加复杂公式

---

# Crit

暴击

---

判定

```ts
Math.random()
```

---

默认

```yaml
5%
```

---

暴击伤害

```yaml
200%
```

---

# Projectile

适用于：

```text
弓兵

枪兵
```

---

# Arrow

速度

```yaml
500
```

---

命中

销毁

---

# Pierce

穿透数量

```yaml
3
```

---

命中后继续飞行

---

# AOE

骑兵使用

---

范围

```yaml
120px
```

---

伤害目标

范围内所有敌人

---

# EnemyHit

受击反馈

---

动画

闪白

---

时长

```yaml
100ms
```

---

# DamageText

位置

敌人头顶

---

普通伤害

白色

---

暴击伤害

黄色

---

动画

向上漂浮

---

位移

```yaml
y:-50
```

---

持续

```yaml
600ms
```

---

# EnemyDeath

触发

HP<=0

---

执行

播放死亡

生成奖励

销毁对象

---

动画

缩放

100%

↓

120%

↓

0%

---

时长

```yaml
200ms
```

---

# RewardDrop

来源

敌人死亡

---

奖励

钱粮

---

动画

金币飞向顶部资源栏

---

路径

Enemy

↓

FoodIcon

---

时长

```yaml
400ms
```

---

# GoalReached

触发

敌人进入终点

---

执行

玩家生命减少

---

普通敌人

```yaml
life:-1
```

---

Boss

```yaml
life:-3
```

---

# LifeZero

触发

生命<=0

---

执行

战斗结束

显示失败

---

# WaveClear

条件

所有敌人死亡

---

执行

显示胜利

---

奖励

金币

道具

经验

---

# BattleUI

战斗中显示

---

Wave

```text
第3波
```

---

KillCount

```text
击杀:18
```

---

Life

```text
生命:3
```

---

Food

```text
钱粮:25
```

---

# Layer层级

Background

↓

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

DamageText

↓

BattleUI

↓

Popup

---

# 程序节点

CombatSystem

├─ WaveManager

├─ SpawnManager

├─ EnemyManager

├─ UnitManager

├─ ProjectileManager

├─ DamageManager

├─ RewardManager

├─ BattleUI

└─ ResultPanel

---

# 数据结构

```ts
interface CombatState {
  wave:number;

  life:number;

  gold:number;

  enemyCount:number;

  killCount:number;

  isFighting:boolean;
}
```

---

# MVP目标

实现：

```text
敌人生成

路径移动

自动攻击

伤害显示

死亡结算

金币奖励

波次推进
```

不实现：

```text
Boss技能

控制效果

元素反应

复杂Buff

复杂AI
```

---

# 设计原则

玩家必须持续获得：

```text
击中反馈

暴击反馈

击杀反馈

收益反馈
```

每1~2秒必须看到：

```text
数字跳动

敌人死亡

金币增加
```

保持正反馈循环。
