# 11_DATA_MODEL.md

# 模块名称

Data Model

中文：

数据模型

游戏状态模型

运行时数据结构

---

# 模块定位

整个项目唯一数据中心。

所有模块数据最终汇总到这里。

包括：

```text
TopBar

BuffBar

PathSystem

BuildArea

ExpandSystem

RecruitSystem

ActionBar

ToolBar

CombatSystem
```

---

# 数据流原则

禁止：

```text
UI直接修改UI

模块直接修改模块
```

必须：

```text
数据变化

↓

State变化

↓

UI刷新
```

---

# RootState

全局状态

```ts
interface RootState {
  game: GameState;

  player: PlayerState;

  board: BoardState;

  recruit: RecruitState;

  expand: ExpandState;

  combat: CombatState;

  tools: ToolState;

  buffs: BuffState;
}
```

---

# GameState

游戏状态

---

# 作用

管理当前局生命周期

---

# 数据结构

```ts
interface GameState {
  gameId:string;

  status:
    | 'prepare'
    | 'battle'
    | 'result'
    | 'pause';

  currentWave:number;

  maxWave:number;

  startTime:number;

  playTime:number;
}
```

---

# status

prepare

准备阶段

---

battle

战斗阶段

---

result

结算阶段

---

pause

暂停

---

# PlayerState

玩家状态

---

# 作用

保存玩家当前资源

---

# 数据结构

```ts
interface PlayerState {
  gold:number;

  life:number;

  exp:number;

  level:number;
}
```

---

# gold

钱粮

---

# 来源

```text
击杀

奖励

Boss

宝箱
```

---

# 消耗

```text
征兵

扩地

道具
```

---

# life

生命

---

# 初始

```yaml
3
```

---

# 归零

失败

---

# BoardState

棋盘状态

---

# 作用

保存全部布阵格

---

# 数据结构

```ts
interface BoardState {
  cells: BuildCell[];
}
```

---

# BuildCell

```ts
interface BuildCell {
  id:number;

  row:number;

  col:number;

  unlocked:boolean;

  unitId:string|null;

  unitLevel:number;
}
```

---

# 示例

```ts
{
 id:1,

 row:0,

 col:0,

 unlocked:true,

 unitId:'knife',

 unitLevel:2
}
```

---

# RecruitState

征兵状态

---

# 数据结构

```ts
interface RecruitState {
  recruitCost:number;

  maxSlots:number;

  slots: RecruitSlot[];
}
```

---

# RecruitSlot

```ts
interface RecruitSlot {
  index:number;

  unit:UnitData|null;
}
```

---

# 示例

```ts
{
 index:0,

 unit:{
   id:'archer',
   level:1
 }
}
```

---

# ExpandState

扩地状态

---

# 数据结构

```ts
interface ExpandState {
  tiles: ExpandTile[];
}
```

---

# ExpandTile

```ts
interface ExpandTile {
  id:number;

  row:number;

  col:number;

  unlocked:boolean;
}
```

---

# 示例

```ts
{
 id:12,

 row:4,

 col:2,

 unlocked:false
}
```

---

# ToolState

道具状态

---

# 数据结构

```ts
interface ToolState {
  items: ToolItem[];
}
```

---

# ToolItem

```ts
interface ToolItem {
  id:string;

  level:number;

  count:number;
}
```

---

# 示例

```ts
{
 id:'shovel',

 level:1,

 count:2
}
```

---

# BuffState

Buff状态

---

# 数据结构

```ts
interface BuffState {
  buffs: BuffItem[];
}
```

---

# BuffItem

```ts
interface BuffItem {
  id:string;

  level:number;

  stack:number;
}
```

---

# 示例

```ts
{
 id:'attack_speed',

 level:1,

 stack:3
}
```

---

# UnitData

单位基础数据

---

# 数据结构

```ts
interface UnitData {
  id:string;

  type:
    | 'knife'
    | 'archer'
    | 'spear'
    | 'cavalry';

  level:number;
}
```

---

# CombatState

战斗状态

---

# 数据结构

```ts
interface CombatState {
  wave:number;

  enemyAlive:number;

  enemyKilled:number;

  battleTime:number;

  isFighting:boolean;
}
```

---

# EnemyData

敌人实例

---

# 数据结构

```ts
interface EnemyData {
  id:string;

  type:string;

  hp:number;

  maxHp:number;

  speed:number;

  pathIndex:number;

  progress:number;
}
```

---

# 示例

```ts
{
 id:'enemy_001',

 type:'normal',

 hp:100,

 maxHp:100,

 speed:100,

 pathIndex:2,

 progress:0.35
}
```

---

# BattleUnit

战斗单位实例

---

# 数据结构

```ts
interface BattleUnit {
  id:string;

  type:string;

  level:number;

  attack:number;

  attackSpeed:number;

  range:number;

  crit:number;
}
```

---

# MVP数值

刀兵

```yaml
attack:20
attackSpeed:1.0
range:80
crit:0.05
```

---

弓兵

```yaml
attack:15
attackSpeed:1.2
range:250
crit:0.05
```

---

枪兵

```yaml
attack:12
attackSpeed:1.0
range:180
crit:0.05
pierce:3
```

---

骑兵

```yaml
attack:10
attackSpeed:1.5
range:120
aoeRadius:120
crit:0.05
```

---

# UnitLevelConfig

单位升级配置

---

```ts
interface UnitLevelConfig {
  level:number;

  attackMultiplier:number;
}
```

---

# MVP

```yaml
Lv1: 1.0
Lv2: 2.0
Lv3: 4.0
Lv4: 8.0
Lv5:16.0
```

---

# WaveConfig

波次配置

---

```ts
interface WaveConfig {
  wave:number;

  enemyCount:number;

  enemyHp:number;

  enemySpeed:number;

  rewardGold:number;
}
```

---

# MVP

Wave1

```yaml
enemyCount:10
enemyHp:50
rewardGold:10
```

---

Wave2

```yaml
enemyCount:15
enemyHp:80
rewardGold:15
```

---

Wave3

```yaml
enemyCount:20
enemyHp:120
rewardGold:20
```

---

# SaveData

局内存档

---

```ts
interface SaveData {
  version:string;

  game:GameState;

  player:PlayerState;

  board:BoardState;

  recruit:RecruitState;

  expand:ExpandState;

  tools:ToolState;

  buffs:BuffState;
}
```

---

# Store结构

推荐

```text
stores

├── gameStore.ts
├── playerStore.ts
├── boardStore.ts
├── recruitStore.ts
├── expandStore.ts
├── toolStore.ts
├── buffStore.ts
└── combatStore.ts
```

---

# 数据更新原则

允许

```text
Store → UI
Store → Combat
Store → Save
```

---

禁止

```text
UI → UI

Combat → UI

UI直接改数据
```

---

# MVP最终数据流

```text
征兵

↓

RecruitState

↓

拖入棋盘

↓

BoardState

↓

开始战斗

↓

CombatState

↓

击杀

↓

PlayerState.gold

↓

继续征兵
```

---

# 设计原则

所有系统最终围绕：

```text
PlayerState

BoardState

CombatState
```

三个核心状态运行。

其它模块全部视为附属系统。
