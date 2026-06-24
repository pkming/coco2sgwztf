import { _decorator, Button, Camera, Canvas, Color, Component, EventTouch, Graphics, Label, Layers, Node, resources, Sprite, SpriteFrame, UITransform, Vec3, view } from 'cc';
import {
  BATTLE_PATH,
  BOARD_COLS,
  BOARD_SIZE,
  DELETE_REFUND,
  EnemyData,
  INITIAL_OPEN_CELLS,
  KILL_REWARD,
  MAX_UNIT_LEVEL,
  RECRUIT_COST,
  START_GOLD,
  START_LIFE,
  UnitData,
  WAVE_WIN_REWARD,
  WORD_CONFIGS,
  createId,
  getDps,
  pickRandomWord,
} from '../data/GameTypes';

const { ccclass } = _decorator;

type UnitView = {
  node: Node;
  data: UnitData;
  attackTimer: number;
};

type EnemyView = {
  node: Node;
  label: Label;
  data: EnemyData;
};

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private gold = START_GOLD;
  private life = START_LIFE;
  private wave = 1;
  private battleRunning = false;

  private root!: Node;
  private uiCamera: Camera | null = null;
  private battleLayer!: Node;
  private boardLayer!: Node;
  private unitLayer!: Node;
  private enemyLayer!: Node;
  private messageLabel!: Label;
  private goldLabel!: Label;
  private lifeLabel!: Label;
  private waveLabel!: Label;

  private cellPositions: Vec3[] = [];
  private boardUnits: Array<UnitView | null> = new Array(BOARD_SIZE).fill(null);
  private enemies: EnemyView[] = [];
  private draggedUnit: UnitView | null = null;
  private dragOffset = new Vec3();
  private spawnTimer = 0;
  private spawnCount = 0;

  start() {
    console.log('[字战三国] GameBootstrap start');
    this.buildScene();
    this.ensureCanvasRoot();
    this.refreshHud();
    this.showMessage('点击征兵，拖拽文字整理棋盘；两个相同等级会自动升级。');
  }

  update(deltaTime: number) {
    if (!this.battleRunning) return;
    this.updateSpawn(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateUnits(deltaTime);
    this.checkBattleEnd();
  }

  private ensureCanvasRoot() {
    let transform = this.node.getComponent(UITransform);
    if (!transform) {
      transform = this.node.addComponent(UITransform);
    }
    transform.setContentSize(720, 1280);

    this.node.layer = Layers.Enum.UI_2D;

    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    this.uiCamera = this.ensureUICamera();
    canvas.cameraComponent = this.uiCamera;

    this.node.setPosition(0, 0, 0);
    view.setDesignResolutionSize(720, 1280, 2);
  }

  private ensureUICamera(): Camera {
    let cameraNode = this.node.getChildByName('AutoUICamera');
    if (!cameraNode) {
      cameraNode = new Node('AutoUICamera');
      cameraNode.setParent(this.node);
    }
    cameraNode.layer = Layers.Enum.UI_2D;
    cameraNode.setPosition(0, 0, 1000);

    const camera = cameraNode.getComponent(Camera) ?? cameraNode.addComponent(Camera);
    camera.visibility = Layers.Enum.UI_2D;
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 640;
    camera.clearColor = new Color(40, 29, 24, 255);
    return camera;
  }

  private buildScene() {
    this.node.removeAllChildren();
    this.uiCamera = null;
    this.root = this.createNode('GameRoot', this.node, 0, 0, 720, 1280, new Color(40, 29, 24, 255));

    this.battleLayer = this.createNode('BattleLayer', this.root, 0, 250, 690, 470, new Color(83, 61, 45, 255));
    this.boardLayer = this.createNode('BoardLayer', this.root, 0, -190, 430, 430, new Color(70, 44, 28, 255));
    this.unitLayer = this.createNode('UnitLayer', this.boardLayer, 0, 0, 430, 430);
    this.enemyLayer = this.createNode('EnemyLayer', this.battleLayer, 0, 0, 690, 470);

    this.createPageChrome();
    this.drawBattlePath();
    this.createBoard();
    this.createHud();
    this.createControls();
  }

  private createPageChrome() {
    this.createNode('TopBar', this.root, 0, 585, 690, 70, new Color(73, 42, 25, 255));
    this.createLabel('TitleText', this.root, 0, 625, '字战三国', 34, new Color(255, 230, 164, 255));
    this.createLabel('BattleTitle', this.root, -275, 485, '战场路线', 22, new Color(255, 220, 150, 255));
    this.createLabel('BoardTitle', this.root, -145, 45, '文字棋盘', 22, new Color(255, 220, 150, 255));
    this.createLabel('TipText', this.root, 0, -405, '征兵抽字 · 拖拽整理 · 相同文字自动升级', 20, new Color(235, 205, 145, 255));
  }

  private createHud() {
    this.goldLabel = this.createLabel('GoldText', this.root, -245, 575, '金币 0', 28, new Color(70, 45, 24, 255));
    this.lifeLabel = this.createLabel('LifeText', this.root, 0, 575, '生命 0', 28, new Color(70, 45, 24, 255));
    this.waveLabel = this.createLabel('WaveText', this.root, 245, 575, 'Wave 1', 28, new Color(70, 45, 24, 255));
    this.messageLabel = this.createLabel('MessageText', this.root, 0, -555, '', 22, new Color(92, 66, 40, 255));
  }

  private createControls() {
    this.createButton('RecruitButton', this.root, -220, -485, '征兵 -3', () => this.recruit());
    this.createButton('DeleteButton', this.root, 0, -485, '删除返 1', () => this.deleteSelectedOrLast());
    this.createButton('BattleButton', this.root, 220, -485, '开始战斗', () => this.startBattle());
  }

  private createBoard() {
    const startX = -135;
    const startY = 135;
    const gap = 90;

    for (let index = 0; index < BOARD_SIZE; index += 1) {
      const col = index % BOARD_COLS;
      const row = Math.floor(index / BOARD_COLS);
      const x = startX + col * gap;
      const y = startY - row * gap;
      const open = index < INITIAL_OPEN_CELLS;
      const cell = this.createNode(`Cell_${index}`, this.boardLayer, x, y, 78, 78, open ? new Color(207, 156, 82, 255) : new Color(43, 35, 31, 255));
      this.createLabel(`CellLabel_${index}`, cell, 0, 0, open ? '' : '锁', 22, Color.WHITE);
      this.cellPositions.push(new Vec3(x, y, 0));
    }
  }

  private recruit() {
    if (this.battleRunning) {
      this.showMessage('战斗中不能征兵。');
      return;
    }
    if (this.gold < RECRUIT_COST) {
      this.showMessage('金币不足，击杀敌人或过波后再征兵。');
      return;
    }
    const emptyIndex = this.findEmptyOpenCell();
    if (emptyIndex < 0) {
      this.showMessage('棋盘已满：考虑删除低价值字，或等待后续解锁。');
      return;
    }

    this.gold -= RECRUIT_COST;
    const word = pickRandomWord();
    const unit: UnitData = {
      id: createId('unit'),
      word,
      level: 1,
      dps: getDps(1),
      boardIndex: emptyIndex,
    };
    this.addUnit(unit);
    this.refreshHud();
    this.showMessage(`征兵获得「${word}」：${WORD_CONFIGS[word].role}`);
    this.tryMergeAll();
  }

  private addUnit(data: UnitData) {
    const node = this.createNode(`Unit_${data.id}`, this.unitLayer, this.cellPositions[data.boardIndex].x, this.cellPositions[data.boardIndex].y, 72, 72, WORD_CONFIGS[data.word].color);
    const wordLabel = this.createLabel('WordLabel', node, 0, 8, data.word, 34, Color.WHITE);
    wordLabel.lineHeight = 38;
    this.createLabel('LevelLabel', node, 20, -24, `Lv${data.level}`, 14, Color.WHITE);
    const viewData: UnitView = { node, data, attackTimer: 0 };
    this.boardUnits[data.boardIndex] = viewData;
    this.refreshUnitArt(viewData);

    node.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onUnitTouchStart(event, viewData), this);
    node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onUnitTouchMove(event, viewData), this);
    node.on(Node.EventType.TOUCH_END, () => this.onUnitTouchEnd(viewData), this);
    node.on(Node.EventType.TOUCH_CANCEL, () => this.onUnitTouchEnd(viewData), this);
  }

  private onUnitTouchStart(event: EventTouch, unit: UnitView) {
    if (this.battleRunning) return;
    this.draggedUnit = unit;
    const local = this.getBoardLocalPoint(event);
    Vec3.subtract(this.dragOffset, unit.node.position, local);
    unit.node.setSiblingIndex(999);
    this.showMessage(`拖拽「${unit.data.word}${unit.data.level}」整理棋盘。`);
  }

  private onUnitTouchMove(event: EventTouch, unit: UnitView) {
    if (this.draggedUnit !== unit || this.battleRunning) return;
    const local = this.getBoardLocalPoint(event);
    local.add(this.dragOffset);
    unit.node.setPosition(local);
  }

  private onUnitTouchEnd(unit: UnitView) {
    if (this.draggedUnit !== unit || this.battleRunning) return;
    this.draggedUnit = null;
    const targetIndex = this.findNearestOpenCell(unit.node.position);
    this.moveOrSwapUnit(unit, targetIndex);
    this.tryMergeAll();
  }

  private moveOrSwapUnit(unit: UnitView, targetIndex: number) {
    const fromIndex = unit.data.boardIndex;
    if (targetIndex < 0 || targetIndex >= INITIAL_OPEN_CELLS) {
      unit.node.setPosition(this.cellPositions[fromIndex]);
      return;
    }

    const targetUnit = this.boardUnits[targetIndex];
    this.boardUnits[fromIndex] = targetUnit;
    this.boardUnits[targetIndex] = unit;
    unit.data.boardIndex = targetIndex;
    unit.node.setPosition(this.cellPositions[targetIndex]);

    if (targetUnit) {
      targetUnit.data.boardIndex = fromIndex;
      targetUnit.node.setPosition(this.cellPositions[fromIndex]);
    }
  }

  private tryMergeAll() {
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < INITIAL_OPEN_CELLS; i += 1) {
        const a = this.boardUnits[i];
        if (!a || a.data.level >= MAX_UNIT_LEVEL) continue;
        for (let j = i + 1; j < INITIAL_OPEN_CELLS; j += 1) {
          const b = this.boardUnits[j];
          if (!b) continue;
          if (a.data.word === b.data.word && a.data.level === b.data.level) {
            this.mergeUnits(a, b);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }
  }

  private mergeUnits(keep: UnitView, remove: UnitView) {
    this.boardUnits[remove.data.boardIndex] = null;
    remove.node.destroy();
    const previousLevel = keep.data.level;
    keep.data.level += 1;
    keep.data.dps = getDps(keep.data.level);
    this.refreshUnitView(keep);
    this.showMessage(`${keep.data.word}${previousLevel} + ${keep.data.word}${previousLevel} = ${keep.data.word}${keep.data.level}`);
  }

  private refreshUnitView(unit: UnitView) {
    const levelLabel = unit.node.getChildByName("LevelLabel")?.getComponent(Label);
    if (levelLabel) levelLabel.string = "Lv" + unit.data.level;
    this.refreshUnitArt(unit);
  }

  private refreshUnitArt(unit: UnitView) {
    const wordLabel = unit.node.getChildByName("WordLabel");
    let spriteNode = unit.node.getChildByName("DaoSoldierSprite");

    if (unit.data.word !== "刀") {
      if (spriteNode) spriteNode.active = false;
      if (wordLabel) wordLabel.active = true;
      return;
    }

    if (wordLabel) wordLabel.active = false;

    if (!spriteNode) {
      spriteNode = new Node("DaoSoldierSprite");
      spriteNode.layer = Layers.Enum.UI_2D;
      spriteNode.setParent(unit.node);
      spriteNode.setPosition(0, 2, 0);
      const transform = spriteNode.addComponent(UITransform);
      transform.setContentSize(70, 70);
      spriteNode.addComponent(Sprite);
    }

    spriteNode.active = true;
    const sprite = spriteNode.getComponent(Sprite);
    if (!sprite) return;

    const level = Math.min(5, Math.max(1, unit.data.level));
    const path = "unit/dao_soldier/dao_soldier_lv" + level + "/spriteFrame";
    resources.load(path, SpriteFrame, (err, frame) => {
      if (err || !frame || !sprite.isValid) {
        if (wordLabel) wordLabel.active = true;
        if (spriteNode) spriteNode.active = false;
        console.warn("[字战三国] 刀兵图片加载失败", path, err);
        return;
      }
      sprite.spriteFrame = frame;
    });
  }

  private deleteSelectedOrLast() {
    if (this.battleRunning) {
      this.showMessage('战斗中不能删除。');
      return;
    }
    const units = this.boardUnits.filter((unit): unit is UnitView => Boolean(unit));
    const unit = this.draggedUnit ?? units[units.length - 1] ?? null;
    if (!unit) {
      this.showMessage('没有可删除的文字。');
      return;
    }
    this.boardUnits[unit.data.boardIndex] = null;
    unit.node.destroy();
    this.gold += DELETE_REFUND;
    this.refreshHud();
    this.showMessage(`删除一个「${unit.data.word}」，返还 ${DELETE_REFUND} 金币。`);
  }

  private startBattle() {
    if (this.battleRunning) return;
    if (this.boardUnits.every((unit) => !unit)) {
      this.showMessage('至少先征兵一个文字再开战。');
      return;
    }
    this.battleRunning = true;
    this.spawnTimer = 0;
    this.spawnCount = 0;
    this.enemies.forEach((enemy) => enemy.node.destroy());
    this.enemies = [];
    this.showMessage(`Wave ${this.wave} 开始：固定路线验证当前构筑。`);
  }

  private updateSpawn(deltaTime: number) {
    this.spawnTimer -= deltaTime;
    const maxSpawn = 5 + this.wave;
    if (this.spawnCount >= maxSpawn || this.spawnTimer > 0) return;
    this.spawnEnemy();
    this.spawnCount += 1;
    this.spawnTimer = Math.max(0.45, 1.1 - this.wave * 0.03);
  }

  private spawnEnemy() {
    const hp = Math.round(20 * Math.pow(1.15, this.wave - 1));
    const data: EnemyData = {
      id: createId('enemy'),
      hp,
      maxHp: hp,
      speed: 70 + this.wave * 2,
      pathIndex: 0,
      rewardGold: KILL_REWARD,
    };
    const node = this.createNode(`Enemy_${data.id}`, this.enemyLayer, BATTLE_PATH[0].x, BATTLE_PATH[0].y, 48, 48, new Color(72, 55, 47, 255));
    const label = this.createLabel('HpLabel', node, 0, 0, `${data.hp}`, 16, Color.WHITE);
    this.enemies.push({ node, label, data });
  }

  private updateEnemies(deltaTime: number) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const nextIndex = enemy.data.pathIndex + 1;
      if (nextIndex >= BATTLE_PATH.length) {
        this.life -= 1;
        enemy.node.destroy();
        this.enemies.splice(i, 1);
        this.refreshHud();
        this.showMessage('敌人进入终点，生命 -1。');
        if (this.life <= 0) this.endBattle(false);
        continue;
      }

      const current = enemy.node.position;
      const target = BATTLE_PATH[nextIndex];
      const direction = new Vec3(target.x - current.x, target.y - current.y, 0);
      const distance = direction.length();
      const move = enemy.data.speed * deltaTime;
      if (distance <= move) {
        enemy.node.setPosition(target);
        enemy.data.pathIndex = nextIndex;
      } else {
        direction.normalize();
        enemy.node.setPosition(current.x + direction.x * move, current.y + direction.y * move, 0);
      }
    }
  }

  private updateUnits(deltaTime: number) {
    for (const unit of this.boardUnits) {
      if (!unit) continue;
      unit.attackTimer -= deltaTime;
      if (unit.attackTimer > 0) continue;
      const config = WORD_CONFIGS[unit.data.word];
      const target = this.findTarget(unit, config.range);
      if (!target) continue;
      unit.attackTimer = config.attackInterval;
      this.applyAttack(unit, target);
    }
  }

  private findTarget(unit: UnitView, range: number): EnemyView | null {
    const unitWorld = this.boardLayer.getComponent(UITransform)!.convertToWorldSpaceAR(unit.node.position);
    const unitInBattle = this.battleLayer.getComponent(UITransform)!.convertToNodeSpaceAR(unitWorld);
    let best: EnemyView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (const enemy of this.enemies) {
      const distance = Vec3.distance(unitInBattle, enemy.node.position);
      if (distance <= range && distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }

  private applyAttack(unit: UnitView, target: EnemyView) {
    const damage = unit.data.dps;
    const config = WORD_CONFIGS[unit.data.word];

    if (unit.data.word === '骑') {
      for (const enemy of this.enemies) {
        if (Vec3.distance(enemy.node.position, target.node.position) <= 70) this.damageEnemy(enemy, Math.round(damage * 0.7));
      }
    } else if (unit.data.word === '枪') {
      const targetY = target.node.position.y;
      for (const enemy of this.enemies) {
        if (Math.abs(enemy.node.position.y - targetY) <= 28) this.damageEnemy(enemy, Math.round(damage * 0.75));
      }
    } else {
      this.damageEnemy(target, damage);
    }

    this.flashUnit(unit, config.color);
  }

  private damageEnemy(enemy: EnemyView, damage: number) {
    enemy.data.hp -= damage;
    enemy.label.string = `${Math.max(0, enemy.data.hp)}`;
    if (enemy.data.hp > 0) return;
    const index = this.enemies.indexOf(enemy);
    if (index >= 0) this.enemies.splice(index, 1);
    enemy.node.destroy();
    this.gold += enemy.data.rewardGold;
    this.refreshHud();
  }

  private checkBattleEnd() {
    const maxSpawn = 5 + this.wave;
    if (this.spawnCount < maxSpawn || this.enemies.length > 0) return;
    this.endBattle(true);
  }

  private endBattle(win: boolean) {
    if (!this.battleRunning) return;
    this.battleRunning = false;
    if (win) {
      this.gold += WAVE_WIN_REWARD;
      this.wave += 1;
      this.showMessage(`胜利！奖励 ${WAVE_WIN_REWARD} 金币。继续征兵构筑。`);
    } else {
      this.showMessage('失败：生命归零。可调整构筑后在编辑器重新运行。');
    }
    this.refreshHud();
  }

  private findEmptyOpenCell(): number {
    for (let i = 0; i < INITIAL_OPEN_CELLS; i += 1) {
      if (!this.boardUnits[i]) return i;
    }
    return -1;
  }

  private findNearestOpenCell(position: Vec3): number {
    let bestIndex = -1;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < INITIAL_OPEN_CELLS; i += 1) {
      const distance = Vec3.distance(position, this.cellPositions[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  private getBoardLocalPoint(event: EventTouch): Vec3 {
    const location = event.getUILocation();
    return this.boardLayer.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private drawBattlePath() {
    const pathNode = new Node('PathGraphics');
    pathNode.setParent(this.battleLayer);
    const graphics = pathNode.addComponent(Graphics);
    graphics.lineWidth = 26;
    graphics.strokeColor = new Color(145, 101, 58, 255);
    graphics.moveTo(BATTLE_PATH[0].x, BATTLE_PATH[0].y);
    for (let i = 1; i < BATTLE_PATH.length; i += 1) graphics.lineTo(BATTLE_PATH[i].x, BATTLE_PATH[i].y);
    graphics.stroke();

    graphics.lineWidth = 4;
    graphics.strokeColor = new Color(255, 235, 180, 255);
    graphics.moveTo(BATTLE_PATH[0].x, BATTLE_PATH[0].y);
    for (let i = 1; i < BATTLE_PATH.length; i += 1) graphics.lineTo(BATTLE_PATH[i].x, BATTLE_PATH[i].y);
    graphics.stroke();

    const end = BATTLE_PATH[BATTLE_PATH.length - 1];
    this.createLabel('StartText', this.battleLayer, BATTLE_PATH[0].x, BATTLE_PATH[0].y + 42, '入口', 18, new Color(80, 58, 40, 255));
    this.createLabel('EndText', this.battleLayer, end.x, end.y - 42, '终点', 18, new Color(150, 40, 35, 255));
  }

  private refreshHud() {
    if (this.goldLabel) this.goldLabel.string = `金币 ${this.gold}`;
    if (this.lifeLabel) this.lifeLabel.string = `生命 ${this.life}`;
    if (this.waveLabel) this.waveLabel.string = `Wave ${this.wave}`;
  }

  private showMessage(message: string) {
    if (this.messageLabel) this.messageLabel.string = message;
  }

  private flashUnit(unit: UnitView, color: Color) {
    const graphics = unit.node.getComponent(Graphics);
    if (!graphics) return;
    this.paintRoundedRect(graphics, 72, 72, Color.WHITE, 12);
    this.scheduleOnce(() => {
      if (!graphics.isValid) return;
      this.paintRoundedRect(graphics, 72, 72, color, 12);
    }, 0.08);
  }

  private createNode(name: string, parent: Node, x: number, y: number, width: number, height: number, color?: Color): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    if (color) {
      const graphics = node.addComponent(Graphics);
      this.paintRoundedRect(graphics, width, height, color, Math.min(14, width / 6));
    }
    return node;
  }

  private paintRoundedRect(graphics: Graphics, width: number, height: number, color: Color, radius: number) {
    void radius;
    graphics.clear();
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private createLabel(name: string, parent: Node, x: number, y: number, text: string, fontSize: number, color: Color): Label {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = color;
    return label;
  }

  private createButton(name: string, parent: Node, x: number, y: number, text: string, callback: () => void) {
    const node = this.createNode(name, parent, x, y, 170, 62, new Color(142, 77, 38, 255));
    node.addComponent(Button);
    this.createLabel(`${name}Label`, node, 0, 0, text, 24, Color.WHITE);
    node.on(Button.EventType.CLICK, callback, this);
  }
}
