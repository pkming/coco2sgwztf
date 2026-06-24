# 刀兵 1-5 级资源说明

原图：

```text
assets/art/placeholders/刀兵透明背景1-5.png
```

已切分出三套资源：

## 1. raw 横向切片

路径：

```text
assets/art/unit/dao_soldier/dao_soldier_lv1.png
assets/art/unit/dao_soldier/dao_soldier_lv2.png
assets/art/unit/dao_soldier/dao_soldier_lv3.png
assets/art/unit/dao_soldier/dao_soldier_lv4.png
assets/art/unit/dao_soldier/dao_soldier_lv5.png
```

说明：

- 按原图横向 5 等分切出。
- 保留了较多透明边。
- 主要用于回溯和检查原始切分。

## 2. final 透明裁边版

路径：

```text
assets/art/unit/dao_soldier/final/dao_soldier_lv1.png
assets/art/unit/dao_soldier/final/dao_soldier_lv2.png
assets/art/unit/dao_soldier/final/dao_soldier_lv3.png
assets/art/unit/dao_soldier/final/dao_soldier_lv4.png
assets/art/unit/dao_soldier/final/dao_soldier_lv5.png
```

说明：

- 已按 alpha 透明像素裁掉空白。
- 每张尺寸不同。
- 适合做图集前的源文件。

## 3. ready 统一 512 版

路径：

```text
assets/art/unit/dao_soldier/ready/dao_soldier_lv1.png
assets/art/unit/dao_soldier/ready/dao_soldier_lv2.png
assets/art/unit/dao_soldier/ready/dao_soldier_lv3.png
assets/art/unit/dao_soldier/ready/dao_soldier_lv4.png
assets/art/unit/dao_soldier/ready/dao_soldier_lv5.png
```

说明：

- 每张统一为 512×512。
- 角色居中，透明背景。
- Cocos 中建议优先使用这一套，避免等级切换时显示大小跳变。

## Cocos 推荐用法

优先导入：

```text
assets/art/unit/dao_soldier/ready/
```

Sprite 显示尺寸建议：

```text
棋盘字牌内：64×64 或 72×72
战斗单位展示：96×96 到 128×128
详情弹窗：256×256
```

## 已接入 GameBootstrap

刀兵 ready 资源已复制到 Cocos resources 目录：

```text
assets/resources/unit/dao_soldier/dao_soldier_lv1.png
assets/resources/unit/dao_soldier/dao_soldier_lv2.png
assets/resources/unit/dao_soldier/dao_soldier_lv3.png
assets/resources/unit/dao_soldier/dao_soldier_lv4.png
assets/resources/unit/dao_soldier/dao_soldier_lv5.png
```

`GameBootstrap.ts` 当前会在抽到“刀”时通过下面路径加载图片：

```text
resources.load("unit/dao_soldier/dao_soldier_lv" + level + "/spriteFrame")
```

Cocos Creator 注意事项：

1. 回到编辑器后等待资源导入完成。
2. 如果图片没有显示，右键 `assets/resources/unit/dao_soldier` 选择 Reimport。
3. 抽到非“刀”的单位仍显示文字占位。
4. “刀”升级后会自动刷新 Lv 图片。
