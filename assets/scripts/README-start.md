# 《字战三国》P0 原型启动说明

## 当前已实现

- 自动生成竖屏占位界面。
- 上半屏固定路线战斗区。
- 下半屏 4×4 棋盘，前 12 格开放，后 4 格锁定显示。
- 征兵按钮：消耗 3 金币，随机获得 刀 / 骑 / 弓 / 枪。
- 拖拽文字单位：可交换棋盘位置。
- 自动升级：两个相同文字、相同等级会合并升级，最高 Lv4。
- 固定路线战斗：敌人从入口沿折线移动，到终点扣生命。
- 四种基础攻击差异：
  - 刀：单体攻击高。
  - 骑：范围攻击。
  - 弓：远程攻击。
  - 枪：穿刺攻击。

## 在 Cocos Creator 里怎么跑

1. 用 Cocos Dashboard 打开项目：`/Users/barry/Documents/GitHub/coco2d`
2. 创建或打开一个场景，例如 `Game.scene`。
3. 场景里创建 `Canvas`。
4. 在 `Canvas` 下创建一个空节点，命名为 `GameRoot`。
5. 给 `GameRoot` 挂载脚本：`assets/scripts/core/GameBootstrap.ts`。
6. 点击预览运行。

## 先测试什么

```text
1. 点击征兵，确认能生成 刀/骑/弓/枪。
2. 连续征兵，确认两个相同等级会自动升级。
3. 拖拽文字，确认能交换棋盘位置。
4. 点击开始战斗，确认敌人沿固定路线移动。
5. 观察四类单位攻击表现是否能区分。
```

## 新方向：弓箭职业首发玩法原型

项目玩法方向已开始转向固定站位、防守向、暗黑 build 化的弓箭主角游戏。第一版代码先落配置层，不破坏当前《字战三国》P0 入口。

已新增：

- `assets/scripts/data/BowSkillTreeConfig.ts`：弓箭职业固定技能树，P0 先做基础箭、连射、瞄准射击、穿透箭、元素附着。
- `assets/scripts/data/EquipmentAffixConfig.ts`：装备词条配置，P0 先做武器、项链、戒指、手套和 9 类核心词条。
- `assets/scripts/data/BowMonsterPressureConfig.ts`：首关怪物压力配置，先用小怪、厚血怪、精英怪验证血量差异。
- `assets/scripts/data/BowPrototypeConfig.ts`：弓箭首发原型配置汇总入口。

## 下一步建议

- 新建弓箭战斗 Bootstrap，读取 `BOW_PROTOTYPE_V0_1`。
- 实现基础自动射击、攻速、穿透和元素伤害四类效果。
- 用 5 波怪物压力配置验证多重箭/连射、穿透/狙击、元素箭三条 build 雏形。
- 再接装备掉落、技能点分配 UI 和局内随机强化。
