# 07_ACTION_BAR.md

# 模块名称

Action Bar

中文：

主操作区

战斗操作栏

核心交互栏

---

# 模块定位

位于征兵缓存区下方。

承担当前局最重要操作。

玩家点击频率仅次于：

```text
征兵
```

---

# 玩家认知目标

玩家必须理解：

```text
中间大按钮
= 主要操作

左右圆按钮
= 辅助操作
```

---

# 布局结构

```text
[左功能]

[征兵]

[右功能]
```

视觉中心：

```text
征兵按钮
```

---

# 区域尺寸

```yaml
width:720
height:120
```

位置：

```yaml
y:1040
```

---

# 视觉层级

优先级：

```text
征兵按钮

↓

左右功能按钮

↓

背景
```

---

# ACTION_BAR_BG

名称：

操作栏背景

---

# 作用

承载三个按钮

---

# 样式

颜色：

```yaml
#3D2B1F
```

透明度：

```yaml
85%
```

---

# LEFT_ACTION_BUTTON

名称：

左功能按钮

---

# 当前截图内容

黑色石块

---

# 定位

功能技能入口

主动技能入口

---

# 尺寸

```yaml
width:72
height:72
```

---

# 外框

颜色：

```yaml
#8B5A2B
```

宽度：

```yaml
3px
```

---

# 背景

颜色：

```yaml
#1F1F1F
```

---

# 图标尺寸

```yaml
48x48
```

---

# 默认状态

表现：

```text
正常显示
```

---

# 点击状态

动画：

```text
100%

↓

92%

↓

100%
```

时长：

```yaml
100ms
```

---

# 冷却状态

表现：

```text
灰色遮罩

冷却数字
```

---

# 可用状态

表现：

```text
边框发光
```

---

# 技能准备完成

动画：

```text
边框脉冲

金色扩散
```

周期：

```yaml
1s
```

---

# RECRUIT_BUTTON

名称：

征兵按钮

---

# 模块定位

全局核心按钮

---

# 玩家点击频率

最高

---

# 视觉优先级

全页面第一

---

# 尺寸

```yaml
width:180
height:90
```

---

# 背景

主色：

```yaml
#F39C12
```

高光：

```yaml
#FFD36A
```

阴影：

```yaml
rgba(0,0,0,0.3)
```

---

# 圆角

```yaml
12px
```

---

# 内容布局

```text
征兵

包子图标 10
```

---

# 标题

文字：

```text
征兵
```

字体：

```yaml
size:28
weight:bold
color:#FFFFFF
```

---

# 价格区域

布局：

```text
[包子] 10
```

---

# 包子图标

尺寸：

```yaml
24x24
```

---

# 数字

字体：

```yaml
20px
```

颜色：

```yaml
#FFFFFF
```

---

# 正常状态

表现：

```text
橙色
```

---

# 按下状态

动画：

```text
100%

↓

95%

↓

100%
```

---

# 钱粮不足

表现：

```text
整体变灰

透明度60%
```

---

# 缓存区满

表现：

```text
整体变灰

禁止点击
```

---

# 可点击提示

动画：

```text
轻微呼吸
```

周期：

```yaml
1.2s
```

---

# 连续点击

允许

---

# 点击后

顺序：

```text
扣除资源

↓

生成单位

↓

播放动画

↓

填充缓存区
```

---

# RIGHT_ACTION_BUTTON

名称：

右功能按钮

---

# 当前截图内容

蓝色箱子

---

# 模块定位

奖励入口

宝箱入口

特殊功能入口

---

# 尺寸

```yaml
width:72
height:72
```

---

# 外框

颜色：

```yaml
#E0A53A
```

宽度：

```yaml
3px
```

---

# 图标尺寸

```yaml
48x48
```

---

# 默认状态

显示宝箱

---

# 可领取状态

表现：

```text
边框发光

上下浮动
```

---

# 浮动动画

位移：

```yaml
y:-4
```

周期：

```yaml
0.8s
```

---

# 点击状态

动画：

```text
缩小

↓

恢复
```

---

# 宝箱开启

动画：

```text
宝箱打开

金光扩散

奖励弹出
```

---

# ActionBar运行逻辑

每帧无需更新

---

# 状态变化来源

征兵按钮：

```text
资源变化

缓存区变化
```

---

# 左按钮

```text
技能CD变化
```

---

# 右按钮

```text
奖励状态变化
```

---

# 层级结构

ActionBar

├─ ActionBarBg

├─ LeftActionButton

├─ RecruitButton

│  ├─ RecruitTitle

│  ├─ CostIcon

│  └─ CostText

└─ RightActionButton

---

# 数据结构

```ts
interface ActionBarState {
  recruitCost:number;

  canRecruit:boolean;

  recruitSlotsFull:boolean;

  leftSkillReady:boolean;

  rewardAvailable:boolean;
}
```

---

# MVP阶段

保留：

```text
征兵按钮
左功能按钮
右功能按钮
```

关闭：

```text
广告
礼包
活动
商城
```

---

# 设计原则

玩家进入游戏后：

```text
第一眼看到征兵

第二眼看到棋盘

第三眼看到路线
```

征兵按钮必须始终保持最高视觉权重。
