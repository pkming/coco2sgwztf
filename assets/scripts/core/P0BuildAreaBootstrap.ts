import { _decorator, Camera, Canvas, Color, Component, EventTouch, Graphics, Label, LabelOutline, Layers, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3, view } from 'cc';

const { ccclass } = _decorator;

type CellKind = 'build' | 'locked' | 'route' | 'cache';
type UnitType = '刀' | '弓' | '枪' | '骑';
type PieceType = UnitType | '铲';
type EnemyType = '兵' | '盾' | '轻';

interface GridCellView {
  id: string;
  kind: CellKind;
  node: Node;
  x: number;
  y: number;
  unitId: string | null;
}

interface UnitView {
  id: string;
  type: PieceType;
  level: number;
  node: Node;
  currentCellId: string;
  homeX: number;
  homeY: number;
  attackCooldown: number;
}

interface EnemyView {
  id: string;
  type: EnemyType;
  node: Node;
  label: Label;
  pathIndex: number;
  speed: number;
  hp: number;
}

interface UnitBattleConfig {
  color: Color;
  damage: number;
  range: number;
  attackInterval: number;
}

interface EnemyConfig {
  color: Color;
  hpMultiplier: number;
  speedMultiplier: number;
}

const START_LIFE = 3;
const START_FOOD = 10;
const START_REFRESH_COST = 10;
const REFRESH_COST_GROWTH = 1.2;
const KILL_REWARD = 6;
const WAVE_CLEAR_REWARD = 12;
const BASE_ENEMY_HP = 18;
const ENEMY_HP_GROWTH = 4;
const BASE_ENEMY_SPEED = 86;
const ENEMY_SPEED_GROWTH = 2;
const BASE_ENEMY_COUNT = 3;
const WAVE_BREAK_TIME = 2;
const BOARD_COLS = 8;
const BOARD_ROWS = 5;
const GRID_GAP = 86;
const MAP_CELL_SIZE = 80;
const UNIT_SIZE = 86;
const CACHE_CELL_SIZE = 84;
const CACHE_GAP = 90;
const DROP_DISTANCE = 66;
const DRAG_START_DISTANCE = 8;
const CAVALRY_SWEEP_VISUAL_SCALE = 0.58;
const SPEAR_PIERCE_CELLS = 2;
const SPEAR_PIERCE_WIDTH = 42;
const BACKGROUND_COVER_WIDTH = 1920;
const BACKGROUND_COVER_HEIGHT = 1280;

const UNIT_CONFIGS: Record<UnitType, UnitBattleConfig> = {
  刀: {
    color: new Color(218, 68, 56, 255),
    damage: 9,
    range: 150,
    attackInterval: 0.75,
  },
  弓: {
    color: new Color(69, 132, 230, 255),
    damage: 5,
    range: 230,
    attackInterval: 0.9,
  },
  枪: {
    color: new Color(61, 174, 112, 255),
    damage: 8,
    range: 180,
    attackInterval: 0.8,
  },
  骑: {
    color: new Color(232, 181, 54, 255),
    damage: 7,
    range: 165,
    attackInterval: 0.65,
  },
};

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  兵: {
    color: new Color(96, 32, 30, 255),
    hpMultiplier: 1,
    speedMultiplier: 1,
  },
  盾: {
    color: new Color(74, 66, 58, 255),
    hpMultiplier: 1.65,
    speedMultiplier: 0.72,
  },
  轻: {
    color: new Color(125, 67, 36, 255),
    hpMultiplier: 0.72,
    speedMultiplier: 1.35,
  },
};

const PIECE_COLORS: Record<PieceType, Color> = {
  刀: new Color(174, 54, 48, 255),
  弓: new Color(54, 91, 150, 255),
  枪: new Color(55, 128, 80, 255),
  骑: new Color(176, 132, 48, 255),
  铲: new Color(116, 82, 54, 255),
};

const UI_COLORS = {
  root: new Color(50, 44, 41, 255),
  top: new Color(46, 36, 32, 160),
  map: new Color(52, 41, 34, 46),
  panel: new Color(59, 43, 36, 178),
  panelStroke: new Color(27, 21, 18, 210),
  roadEdge: new Color(91, 55, 42, 0),
  road: new Color(129, 74, 53, 0),
  build: new Color(219, 203, 164, 188),
  buildInner: new Color(245, 234, 198, 126),
  locked: new Color(76, 63, 58, 92),
  lockedInner: new Color(112, 94, 86, 56),
  cache: new Color(215, 196, 154, 230),
  text: new Color(241, 226, 192, 255),
  darkText: new Color(43, 35, 32, 255),
  accent: new Color(195, 117, 57, 255),
};

@ccclass('P0BuildAreaBootstrap')
export class P0BuildAreaBootstrap extends Component {
  private root!: Node;
  private topLayer!: Node;
  private mapLayer!: Node;
  private bottomLayer!: Node;
  private cells: GridCellView[] = [];
  private units: UnitView[] = [];
  private enemies: EnemyView[] = [];
  private food = START_FOOD;
  private life = START_LIFE;
  private refreshCost = START_REFRESH_COST;
  private expandedCount = 0;
  private killCount = 0;
  private leakCount = 0;
  private nextUnitId = 1;
  private nextEnemyId = 1;
  private wave = 1;
  private battleStarted = false;
  private waveActive = false;
  private paused = false;
  private gameFailed = false;
  private enemiesToSpawn = 0;
  private spawnTimer = 0;
  private waveBreakTimer = 0;
  private enemyPath: Vec3[] = [];
  private foodValueLabel!: Label;
  private lifeValueLabel!: Label;
  private waveLabel!: Label;
  private runStatsLabel!: Label;
  private pauseLabel!: Label;
  private battleButtonLabel!: Label;
  private debugLayer!: Node;
  private debugLabel!: Label;
  private bottomTipLabel!: Label;
  private draggedUnit: UnitView | null = null;
  private dragOffset = new Vec3();
  private dragStartPosition = new Vec3();
  private hasDraggedUnit = false;

  start() {
    console.log('[文字三国] P0BuildAreaBootstrap start');
    this.node.removeAllChildren();
    view.setDesignResolutionSize(720, 1280, 2);
    this.ensureCanvas();
    this.buildStaticPage();
  }

  update(deltaTime: number) {
    if (this.gameFailed || this.paused) return;
    this.updateWaveBreak(deltaTime);
    this.updateWaveSpawning(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateUnitAttacks(deltaTime);
    this.checkWaveClear();
  }

  private ensureCanvas() {
    this.node.layer = Layers.Enum.UI_2D;
    let transform = this.node.getComponent(UITransform);
    if (!transform) transform = this.node.addComponent(UITransform);
    transform.setContentSize(720, 1280);

    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    const cameraNode = new Node('P0UICamera');
    cameraNode.layer = Layers.Enum.UI_2D;
    cameraNode.setParent(this.node);
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.visibility = Layers.Enum.UI_2D;
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 640;
    camera.clearColor = UI_COLORS.root;
    canvas.cameraComponent = camera;
  }

  private buildStaticPage() {
    this.root = this.rect('RootBg', this.node, 0, 0, 720, 1280, UI_COLORS.root);
    this.spriteImage('BattleBackground', this.root, 0, 0, BACKGROUND_COVER_WIDTH, BACKGROUND_COVER_HEIGHT, 'ui/background/battle_bg');
    this.rect('BattleBackgroundShade', this.root, 0, 0, 720, 1280, new Color(16, 12, 10, 78));
    this.topLayer = this.nodeOnly('TopLayer', this.root, 0, 575, 720, 120);
    this.mapLayer = this.nodeOnly('MapLayer', this.root, 0, 160, 720, 650);
    this.bottomLayer = this.nodeOnly('BottomLayer', this.root, 0, -430, 720, 300);

    this.buildTopBar();
    this.buildMapArea();
    this.buildRecruitAndActions();
    this.buildDebugPanel();
    this.refreshRunStats();
  }

  private buildTopBar() {
    this.framedRect('TopBg', this.topLayer, 0, 0, 720, 112, UI_COLORS.top, new Color(27, 21, 18, 120), 2);
    this.spriteImage('TopBarArt', this.topLayer, 0, 0, 720, 120, 'ui/top_bar');
    const pauseButton = this.framedRect('PauseButton', this.topLayer, -320, 18, 70, 48, UI_COLORS.accent, UI_COLORS.panelStroke, 3);
    this.pauseLabel = this.label('PauseButtonLabel', this.topLayer, -320, 18, '暂停', 22, Color.WHITE);
    pauseButton.on(Node.EventType.TOUCH_END, this.togglePause, this);
    this.pauseLabel.node.on(Node.EventType.TOUCH_END, this.togglePause, this);
    this.label('FoodIcon', this.topLayer, -260, 18, '包子', 22, UI_COLORS.text);
    this.foodValueLabel = this.label('FoodValue', this.topLayer, -190, 18, String(this.food), 32, Color.WHITE);
    this.waveLabel = this.label('WaveText', this.topLayer, 0, 18, '准备中', 30, UI_COLORS.text);
    this.label('LifeIcon', this.topLayer, 190, 18, '生命', 24, UI_COLORS.text);
    this.lifeValueLabel = this.label('LifeValue', this.topLayer, 260, 18, String(this.life), 32, Color.WHITE);
    this.runStatsLabel = this.label('RunStatsText', this.topLayer, 0, -35, '', 20, new Color(211, 190, 154, 255));
    this.refreshRunStats();
  }

  private buildMapArea() {
    this.framedRect('MapBg', this.mapLayer, 0, 0, 700, 452, UI_COLORS.map, new Color(21, 16, 14, 74), 1);
    this.drawBoardCells();
  }

  private drawBoardCells() {
    const buildCells = [
      [2, 1], [3, 1], [4, 1],
      [2, 2], [3, 2], [4, 2],
    ];
    const routeCells = this.getRouteCells();
    const buildKeys = new Set(buildCells.map(([col, row]) => col + '_' + row));
    const routeKeys = new Set(routeCells.map(([col, row]) => col + '_' + row));

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const key = col + '_' + row;
        const kind: CellKind = routeKeys.has(key) ? 'route' : buildKeys.has(key) ? 'build' : 'locked';
        const color = kind === 'route' ? UI_COLORS.road : kind === 'build' ? UI_COLORS.build : UI_COLORS.locked;
        this.gridCell(kind + '_' + col + '_' + row, col, row, kind, '', color);
      }
    }

    this.enemyPath = routeCells.map(([col, row]) => this.boardCellToRoot(col, row));
  }

  private getRouteCells(): number[][] {
    return [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 3], [2, 3], [3, 3], [4, 3],
      [4, 4], [5, 4], [6, 4], [7, 4],
      [7, 3], [7, 2], [7, 1], [7, 0],
    ];
  }

  private boardPointToLocal(col: number, row: number): Vec3 {
    return new Vec3((col - BOARD_COLS / 2) * GRID_GAP, (row - BOARD_ROWS / 2) * GRID_GAP, 0);
  }

  private boardCellToLocal(col: number, row: number): Vec3 {
    return this.boardPointToLocal(col + 0.5, row + 0.5);
  }

  private boardCellToRoot(col: number, row: number): Vec3 {
    const local = this.boardCellToLocal(col, row);
    return new Vec3(this.mapLayer.position.x + local.x, this.mapLayer.position.y + local.y, 0);
  }

  private buildRecruitAndActions() {
    this.spriteImage('BottomBarArt', this.bottomLayer, 0, 60, 720, 360, 'ui/bottom_bar');
    this.framedRect('RecruitBarBg', this.bottomLayer, 0, 104, 500, 92, UI_COLORS.panel, new Color(24, 19, 16, 155), 2);
    this.label('CampIcon', this.bottomLayer, -275, 104, '营', 28, UI_COLORS.text);

    for (let index = 0; index < 5; index++) {
      const x = -175 + index * CACHE_GAP;
      this.cacheCell('cache_' + index, x, 104);
    }

    const recruitButton = this.button('RecruitButton', -205, 0, 150, 66, '刷新\n消耗' + this.refreshCost);
    recruitButton.on(Node.EventType.TOUCH_END, this.refreshShop, this);

    const dismissButton = this.button('DismissButton', 0, 0, 150, 66, '遣散\n删除');
    dismissButton.on(Node.EventType.TOUCH_END, this.dismissUnit, this);

    const battleButton = this.button('BattleButton', 205, 0, 150, 66, '开始战斗');
    this.battleButtonLabel = this.bottomLayer.getChildByName('BattleButton_label')!.getComponent(Label)!;
    battleButton.on(Node.EventType.TOUCH_END, this.startBattle, this);

    this.bottomTipLabel = this.label('BottomTip', this.bottomLayer, -25, -76, '刷新一次出5个：兵或铲子', 20, UI_COLORS.text);
  }

  private buildDebugPanel() {
    const toggle = this.framedRect('DebugToggle', this.bottomLayer, 300, -76, 70, 34, new Color(70, 64, 60, 255), UI_COLORS.panelStroke, 2);
    this.label('DebugToggle_label', this.bottomLayer, 300, -76, '调试', 16, UI_COLORS.text);
    toggle.on(Node.EventType.TOUCH_END, this.toggleDebugPanel, this);
    this.bottomLayer.getChildByName('DebugToggle_label')?.on(Node.EventType.TOUCH_END, this.toggleDebugPanel, this);

    this.debugLayer = this.nodeOnly('DebugLayer', this.root, 0, -345, 680, 150);
    this.framedRect('DebugPanelBg', this.debugLayer, 0, 0, 680, 150, new Color(56, 47, 43, 235), UI_COLORS.panelStroke, 3);
    this.debugLabel = this.label('DebugStats', this.debugLayer, 0, 48, '', 18, UI_COLORS.text);
    this.debugButton('DebugFood', -255, -25, '+10包子', this.debugAddFood);
    this.debugButton('DebugNextWave', -85, -25, '下一波', this.debugNextWave);
    this.debugButton('DebugClear', 85, -25, '清怪', this.debugClearEnemies);
    this.debugButton('DebugDamage', 255, -25, '掉1血', this.debugLoseLife);
    this.debugLayer.active = false;
  }

  private debugButton(name: string, x: number, y: number, text: string, handler: () => void) {
    const node = this.framedRect(name, this.debugLayer, x, y, 130, 48, UI_COLORS.accent, UI_COLORS.panelStroke, 2);
    this.label(name + '_label', this.debugLayer, x, y, text, 18, Color.WHITE);
    node.on(Node.EventType.TOUCH_END, handler, this);
    this.debugLayer.getChildByName(name + '_label')?.on(Node.EventType.TOUCH_END, handler, this);
  }

  private startBattle() {
    if (this.gameFailed) {
      this.restartGame();
      return;
    }

    if (this.waveActive || this.enemies.length > 0 || this.enemiesToSpawn > 0 || this.waveBreakTimer > 0) {
      this.showTip('当前波次进行中：仍可征兵、拖拽、合成');
      return;
    }

    this.battleStarted = true;
    this.startWave();
  }

  private toggleDebugPanel() {
    if (!this.debugLayer) return;
    this.debugLayer.active = !this.debugLayer.active;
    this.refreshDebugPanel();
  }

  private refreshDebugPanel() {
    if (!this.debugLabel) return;
    const counts = this.getUnitTypeCounts();
    const enemyHp = BASE_ENEMY_HP + (this.wave - 1) * ENEMY_HP_GROWTH;
    const enemySpeed = BASE_ENEMY_SPEED + (this.wave - 1) * ENEMY_SPEED_GROWTH;
    this.debugLabel.string = '波' + this.wave + ' 敌HP' + enemyHp + ' 速' + enemySpeed
      + ' · 本波剩' + (this.enemies.length + this.enemiesToSpawn)
      + ' · 刷新' + this.refreshCost
      + ' · 刀' + counts.刀 + ' 弓' + counts.弓 + ' 枪' + counts.枪 + ' 骑' + counts.骑;
  }

  private refreshDebugPanelIfVisible() {
    if (this.debugLayer?.active) this.refreshDebugPanel();
  }

  private getUnitTypeCounts(): Record<UnitType, number> {
    const counts: Record<UnitType, number> = { 刀: 0, 弓: 0, 枪: 0, 骑: 0 };
    for (const unit of this.units) {
      if (unit.type === '铲') continue;
      counts[unit.type] += 1;
    }
    return counts;
  }

  private debugAddFood() {
    if (this.gameFailed) return;
    this.food += 10;
    this.foodValueLabel.string = String(this.food);
    this.showTip('调试：包子 +10');
    this.refreshDebugPanel();
  }

  private debugNextWave() {
    if (this.gameFailed) return;
    for (const enemy of this.enemies) enemy.node.destroy();
    this.enemies = [];
    this.enemiesToSpawn = 0;
    this.waveActive = false;
    this.waveBreakTimer = 0;
    this.wave += 1;
    this.waveLabel.string = '第' + this.wave + '波';
    this.startWave();
    this.refreshDebugPanel();
  }

  private debugClearEnemies() {
    if (this.gameFailed) return;
    for (const enemy of this.enemies) enemy.node.destroy();
    this.enemies = [];
    this.enemiesToSpawn = 0;
    this.waveActive = false;
    this.showTip('调试：清怪完成');
    this.refreshDebugPanel();
  }

  private debugLoseLife() {
    if (this.gameFailed) return;
    this.life = Math.max(0, this.life - 1);
    this.refreshLife();
    this.leakCount += 1;
    this.refreshRunStats();
    if (this.life <= 0) {
      this.failGame();
      return;
    }
    this.showTip('调试：生命 -1');
    this.refreshDebugPanel();
  }

  private togglePause() {
    if (this.gameFailed) return;
    this.paused = !this.paused;
    if (this.pauseLabel) this.pauseLabel.string = this.paused ? '继续' : '暂停';
    this.showTip(this.paused ? '已暂停' : '继续战斗');
  }

  private startWave() {
    if (this.gameFailed) return;
    this.waveBreakTimer = 0;
    this.waveActive = true;
    this.enemiesToSpawn = BASE_ENEMY_COUNT + this.wave - 1;
    this.spawnTimer = 0;
    this.waveLabel.string = '第' + this.wave + '波';
    this.refreshBattleButtonText();
    this.showTip('第' + this.wave + '波开始：敌人 ' + this.enemiesToSpawn + ' 个');
  }

  private updateWaveBreak(deltaTime: number) {
    if (this.waveBreakTimer <= 0) return;

    this.waveBreakTimer -= deltaTime;
    if (this.waveBreakTimer > 0) return;

    this.startWave();
  }

  private updateWaveSpawning(deltaTime: number) {
    if (!this.waveActive || this.enemiesToSpawn <= 0) return;

    this.spawnTimer -= deltaTime;
    if (this.spawnTimer > 0) return;

    this.spawnEnemy();
    this.enemiesToSpawn -= 1;
    this.spawnTimer = 0.75;
  }

  private checkWaveClear() {
    if (!this.waveActive || this.enemiesToSpawn > 0 || this.enemies.length > 0) return;

    this.waveActive = false;
    this.food += WAVE_CLEAR_REWARD;
    this.foodValueLabel.string = String(this.food);
    this.wave += 1;
    this.waveLabel.string = '准备 第' + this.wave + '波';
    this.waveBreakTimer = WAVE_BREAK_TIME;
    this.refreshBattleButtonText();
    this.showFloatingText(new Vec3(0, 250, 0), '波次完成 +' + WAVE_CLEAR_REWARD + '包子', new Color(245, 255, 210, 255), 26);
    this.showTip('波次清空：' + WAVE_BREAK_TIME + '秒后进入第' + this.wave + '波');
  }

  private spawnEnemy() {
    if (this.enemyPath.length === 0) return;
    const start = this.enemyPath[0];
    const enemyType = this.pickEnemyType();
    const enemyConfig = ENEMY_CONFIGS[enemyType];
    const id = 'enemy_' + this.nextEnemyId;
    this.nextEnemyId += 1;
    const node = this.enemyCard(id, start.x, start.y, enemyType);
    this.label(id + '_label', node, 0, 8, enemyType, 20, Color.WHITE);
    const hp = Math.ceil((BASE_ENEMY_HP + (this.wave - 1) * ENEMY_HP_GROWTH) * enemyConfig.hpMultiplier);
    const label = this.label(id + '_hp', node, 0, -17, String(hp), 13, new Color(250, 215, 174, 255));
    const speed = (BASE_ENEMY_SPEED + (this.wave - 1) * ENEMY_SPEED_GROWTH) * enemyConfig.speedMultiplier;
    this.enemies.push({ id, type: enemyType, node, label, pathIndex: 0, speed, hp });
  }

  private pickEnemyType(): EnemyType {
    const pool = this.getEnemyPoolForWave(this.wave);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getEnemyPoolForWave(wave: number): EnemyType[] {
    if (wave <= 1) return ['兵'];

    const pool: EnemyType[] = ['兵', '兵', '兵'];
    if (wave >= 2) pool.push('轻');
    if (wave >= 3) pool.push('盾');
    if (wave >= 5) {
      pool.push('轻');
      pool.push('盾');
    }
    return pool;
  }

  private updateEnemies(deltaTime: number) {
    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index];
      const nextPathIndex = enemy.pathIndex + 1;
      if (nextPathIndex >= this.enemyPath.length) {
        this.handleEnemyReachEnd(enemy, index);
        if (this.gameFailed) break;
        continue;
      }

      const target = this.enemyPath[nextPathIndex];
      const current = enemy.node.position;
      const direction = new Vec3(target.x - current.x, target.y - current.y, 0);
      const distance = direction.length();
      const moveDistance = enemy.speed * deltaTime;
      if (distance <= moveDistance) {
        enemy.node.setPosition(target.x, target.y, 0);
        enemy.pathIndex = nextPathIndex;
      } else {
        direction.normalize();
        enemy.node.setPosition(current.x + direction.x * moveDistance, current.y + direction.y * moveDistance, 0);
      }
    }
  }

  private handleEnemyReachEnd(enemy: EnemyView, enemyIndex: number) {
    const leakPosition = enemy.node.position.clone();
    enemy.node.destroy();
    this.enemies.splice(enemyIndex, 1);
    this.leakCount += 1;
    this.life = Math.max(0, this.life - 1);
    this.refreshLife();
    this.refreshRunStats();
    this.showFloatingText(leakPosition, '漏怪 -1生命', new Color(255, 80, 80, 255), 24);

    if (this.life <= 0) {
      this.failGame();
      return;
    }

    this.showTip('敌人到达终点：生命 -1，剩余 ' + this.life);
  }

  private refreshLife() {
    if (this.lifeValueLabel) this.lifeValueLabel.string = String(this.life);
  }

  private failGame() {
    this.gameFailed = true;
    this.battleStarted = false;
    this.waveActive = false;
    this.draggedUnit = null;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.waveBreakTimer = 0;

    for (const enemy of this.enemies) enemy.node.destroy();
    this.enemies = [];
    this.waveLabel.string = '失败';
    this.refreshBattleButtonText();
    this.showFloatingText(new Vec3(0, 250, 0), '本局结束', new Color(255, 210, 150, 255), 30);
    this.showTip(this.getRunSummary());
  }

  private getRunSummary(): string {
    return '失败：第' + this.wave + '波 · 击杀' + this.killCount + ' · 漏怪' + this.leakCount + ' · 扩地' + this.expandedCount + ' · 最高Lv' + this.getHighestUnitLevel();
  }

  private getHighestUnitLevel(): number {
    let highest = 0;
    for (const unit of this.units) {
      if (unit.type === '铲') continue;
      if (unit.level > highest) highest = unit.level;
    }
    return highest;
  }

  private restartGame() {
    this.node.removeAllChildren();
    this.resetState();
    this.ensureCanvas();
    this.buildStaticPage();
    this.showTip('新一局开始：先刷新，再布阵');
  }

  private resetState() {
    this.cells = [];
    this.units = [];
    this.enemies = [];
    this.food = START_FOOD;
    this.life = START_LIFE;
    this.refreshCost = START_REFRESH_COST;
    this.expandedCount = 0;
    this.killCount = 0;
    this.leakCount = 0;
    this.nextUnitId = 1;
    this.nextEnemyId = 1;
    this.wave = 1;
    this.battleStarted = false;
    this.waveActive = false;
    this.paused = false;
    this.gameFailed = false;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.waveBreakTimer = 0;
    this.enemyPath = [];
    this.draggedUnit = null;
    this.dragOffset = new Vec3();
    this.dragStartPosition = new Vec3();
    this.hasDraggedUnit = false;
  }

  private updateUnitAttacks(deltaTime: number) {
    for (const unit of this.units) {
      if (unit.type === '铲') continue;
      const cell = this.cells.find((item) => item.id === unit.currentCellId);
      if (!cell || cell.kind !== 'build') continue;

      unit.attackCooldown -= deltaTime;
      if (unit.attackCooldown > 0) continue;

      const target = this.findNearestEnemy(unit);
      if (!target) continue;

      const unitType = unit.type;
      unit.attackCooldown = UNIT_CONFIGS[unitType].attackInterval;
      const damage = this.getUnitDamage(unit, unitType);
      if (unitType === '骑') {
        this.sweepEnemies(unit, target, damage);
        continue;
      }
      if (unitType === '枪') {
        this.pierceEnemies(unit, target, damage);
        continue;
      }
      this.damageEnemy(target, damage, unitType);
    }
  }

  private findNearestEnemy(unit: UnitView): EnemyView | null {
    if (unit.type === '铲') return null;
    let best: EnemyView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    const unitPosition = unit.node.position;
    const range = UNIT_CONFIGS[unit.type].range;

    for (const enemy of this.enemies) {
      const distance = Vec3.distance(unitPosition, enemy.node.position);
      if (distance <= range && distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }

    return best;
  }

  private getUnitDamage(unit: UnitView, unitType: UnitType): number {
    return UNIT_CONFIGS[unitType].damage * unit.level;
  }

  private sweepEnemies(unit: UnitView, target: EnemyView, damage: number) {
    const unitPosition = unit.node.position.clone();
    const range = UNIT_CONFIGS.骑.range;
    const hitEnemies = this.enemies.filter((enemy) => Vec3.distance(enemy.node.position, unitPosition) <= range);
    this.showCavalrySweep(unitPosition, target.node.position, range);
    for (const enemy of hitEnemies) {
      if (this.enemies.includes(enemy)) this.damageEnemy(enemy, damage, '骑');
    }
  }

  private pierceEnemies(unit: UnitView, target: EnemyView, damage: number) {
    const hitEnemies = this.findSpearPierceTargets(unit, target);
    for (const enemy of hitEnemies) {
      if (this.enemies.includes(enemy)) this.damageEnemy(enemy, damage, '枪');
    }
  }

  private findSpearPierceTargets(unit: UnitView, target: EnemyView): EnemyView[] {
    const unitPosition = unit.node.position;
    const targetPosition = target.node.position;
    const direction = new Vec3(targetPosition.x - unitPosition.x, targetPosition.y - unitPosition.y, 0);
    const distanceToTarget = direction.length();
    if (distanceToTarget <= 0) return [target];

    direction.normalize();
    const range = UNIT_CONFIGS.枪.range;
    const pierceEnd = Math.min(range, distanceToTarget + SPEAR_PIERCE_CELLS * GRID_GAP);
    const candidates = this.enemies
      .map((enemy) => {
        const enemyPosition = enemy.node.position;
        const toEnemy = new Vec3(enemyPosition.x - unitPosition.x, enemyPosition.y - unitPosition.y, 0);
        const forwardDistance = toEnemy.x * direction.x + toEnemy.y * direction.y;
        if (forwardDistance < distanceToTarget - MAP_CELL_SIZE * 0.5 || forwardDistance > pierceEnd) return null;

        const closestX = unitPosition.x + direction.x * forwardDistance;
        const closestY = unitPosition.y + direction.y * forwardDistance;
        const sideDistance = Vec3.distance(enemyPosition, new Vec3(closestX, closestY, 0));
        if (sideDistance > SPEAR_PIERCE_WIDTH) return null;

        return { enemy, forwardDistance };
      })
      .filter((item): item is { enemy: EnemyView; forwardDistance: number } => item !== null)
      .sort((a, b) => a.forwardDistance - b.forwardDistance);

    const result = candidates.map((item) => item.enemy);
    return result.includes(target) ? result : [target, ...result.filter((enemy) => enemy !== target)];
  }

  private damageEnemy(enemy: EnemyView, damage: number, unitType: UnitType) {
    enemy.hp -= damage;
    enemy.label.string = String(Math.max(0, enemy.hp));
    this.showEnemyHit(enemy);
    this.showDamageText(enemy.node.position, damage, UNIT_CONFIGS[unitType].color);
    if (enemy.hp > 0) return;

    const index = this.enemies.indexOf(enemy);
    if (index >= 0) this.enemies.splice(index, 1);
    this.showEnemyDeath(enemy.node.position);
    enemy.node.destroy();
    this.killCount += 1;
    this.food += KILL_REWARD;
    this.foodValueLabel.string = String(this.food);
    this.refreshRunStats();
    this.showTip('击杀敌人：包子 +' + KILL_REWARD);
    this.refreshDebugPanelIfVisible();
  }

  private showDamageText(position: Vec3, damage: number, color: Color) {
    const label = this.label('DamageText', this.root, position.x, position.y + 34, '-' + damage, 24, color);
    label.node.setSiblingIndex(999);
    tween(label.node)
      .by(0.45, { position: new Vec3(0, 34, 0) })
      .call(() => label.node.destroy())
      .start();
  }

  private showEnemyHit(enemy: EnemyView) {
    tween(enemy.node)
      .to(0.05, { scale: new Vec3(1.08, 1.08, 1) })
      .to(0.06, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private showFloatingText(position: Vec3, text: string, color: Color, fontSize = 24) {
    const label = this.label('FloatingText', this.root, position.x, position.y + 44, text, fontSize, color);
    label.node.setSiblingIndex(999);
    tween(label.node)
      .by(0.5, { position: new Vec3(0, 42, 0) })
      .call(() => label.node.destroy())
      .start();
  }

  private showCavalrySweep(center: Vec3, target: Vec3, radius: number) {
    const color = new Color(244, 202, 92, 230);
    const startAngle = Math.atan2(target.y - center.y, target.x - center.x) * 180 / Math.PI - 35;
    const visualRadius = radius * CAVALRY_SWEEP_VISUAL_SCALE;
    const pivot = this.nodeOnly('CavalrySpearPivot', this.root, center.x, center.y, visualRadius * 2, visualRadius * 2);
    pivot.setRotationFromEuler(0, 0, startAngle);
    pivot.setSiblingIndex(998);

    const spearLength = visualRadius * 0.82;
    const spear = this.lineEffect('CavalrySpear', new Vec3(0, 0, 0), new Vec3(spearLength, 0, 0), color, 7, pivot);
    spear.setPosition(visualRadius * 0.2, 0, 0);
    const tip = this.rect('CavalrySpearTip', pivot, spearLength + visualRadius * 0.2, 0, 12, 12, color);
    tip.setRotationFromEuler(0, 0, 45);

    tween(pivot)
      .by(0.22, { eulerAngles: new Vec3(0, 0, 310) })
      .call(() => pivot.destroy())
      .start();
  }

  private popNode(node: Node, fromScale: number, peakScale: number) {
    node.setScale(fromScale, fromScale, 1);
    tween(node)
      .to(0.08, { scale: new Vec3(peakScale, peakScale, 1) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private showMergeBurst(position: Vec3, color: Color) {
    for (let index = 0; index < 8; index++) {
      const angle = Math.PI * 2 * index / 8;
      const spark = this.rect('MergeSpark', this.root, position.x, position.y, 8, 8, color);
      spark.setSiblingIndex(998);
      tween(spark)
        .by(0.24, { position: new Vec3(Math.cos(angle) * 42, Math.sin(angle) * 42, 0), scale: new Vec3(0.25, 0.25, 1) })
        .call(() => spark.destroy())
        .start();
    }
  }

  private showEnemyDeath(position: Vec3) {
    const colors = [
      new Color(120, 52, 42, 230),
      new Color(205, 128, 82, 230),
      new Color(58, 46, 42, 230),
    ];

    for (let index = 0; index < 7; index++) {
      const angle = Math.PI * 2 * index / 7;
      const shard = this.rect('EnemyShard', this.root, position.x, position.y, 10, 10, colors[index % colors.length]);
      shard.setRotationFromEuler(0, 0, index * 23);
      shard.setSiblingIndex(998);
      tween(shard)
        .by(0.28, { position: new Vec3(Math.cos(angle) * 34, Math.sin(angle) * 30, 0), eulerAngles: new Vec3(0, 0, 95), scale: new Vec3(0.2, 0.2, 1) })
        .call(() => shard.destroy())
        .start();
    }
  }

  private refreshShop() {
    if (this.gameFailed) {
      this.showTip('本局已失败：不能继续刷新');
      return;
    }

    if (this.food < this.refreshCost) {
      this.showTip('包子不足：刷新需要 ' + this.refreshCost);
      return;
    }

    this.food -= this.refreshCost;
    this.foodValueLabel.string = String(this.food);

    this.clearCachePieces();
    const cacheCells = this.cells.filter((cell) => cell.kind === 'cache');
    for (const cell of cacheCells) {
      const unit = this.drawPiece(this.pickRandomPiece(), cell);
      this.popNode(unit.node, 0.86, 1.08);
    }

    const paid = this.refreshCost;
    this.refreshCost = Math.ceil(this.refreshCost * REFRESH_COST_GROWTH);
    this.refreshButtonText();
    this.showTip('刷新消耗 ' + paid + '：重置 5 个候选');
    this.refreshDebugPanelIfVisible();
  }

  private clearCachePieces() {
    const cacheCellIds = new Set(this.cells.filter((cell) => cell.kind === 'cache').map((cell) => cell.id));
    for (const cell of this.cells) {
      if (cell.kind === 'cache') cell.unitId = null;
    }

    const remainingUnits: UnitView[] = [];
    for (const unit of this.units) {
      if (cacheCellIds.has(unit.currentCellId)) {
        if (this.draggedUnit === unit) this.draggedUnit = null;
        unit.node.destroy();
      } else {
        remainingUnits.push(unit);
      }
    }
    this.units = remainingUnits;
  }

  private pickRandomPiece(): PieceType {
    const pool: PieceType[] = [
      '刀', '刀', '刀', '刀',
      '弓', '弓', '弓', '弓',
      '枪', '枪', '枪', '枪',
      '骑', '骑', '骑',
      '铲',
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private refreshButtonText() {
    const label = this.bottomLayer.getChildByName('RecruitButton_label')?.getComponent(Label);
    if (label) label.string = '刷新\n消耗' + this.refreshCost;
  }

  private refreshBattleButtonText() {
    if (!this.battleButtonLabel) return;
    if (this.gameFailed) {
      this.battleButtonLabel.string = '重新开始';
      return;
    }
    if (this.waveActive || this.enemies.length > 0 || this.enemiesToSpawn > 0) {
      this.battleButtonLabel.string = '战斗中';
      return;
    }
    if (this.waveBreakTimer > 0) {
      this.battleButtonLabel.string = '准备中';
      return;
    }
    this.battleButtonLabel.string = this.battleStarted ? '继续战斗' : '开始战斗';
  }

  private dismissUnit() {
    if (this.gameFailed) {
      this.showTip('本局已失败：不能继续遣散');
      return;
    }

    const unit = this.findDismissTarget();
    if (!unit) {
      this.showTip('没有可遣散的单位');
      return;
    }

    const cell = this.cells.find((item) => item.id === unit.currentCellId);
    if (cell) cell.unitId = null;

    this.draggedUnit = this.draggedUnit === unit ? null : this.draggedUnit;
    this.units = this.units.filter((item) => item.id !== unit.id);
    unit.node.destroy();
    this.showTip('遣散 ' + unit.type + '：释放一个格子');
    this.refreshDebugPanelIfVisible();
  }

  private findDismissTarget(): UnitView | null {
    const cacheUnits = this.units.filter((unit) => {
      const cell = this.cells.find((item) => item.id === unit.currentCellId);
      return cell?.kind === 'cache';
    });
    if (cacheUnits.length > 0) return cacheUnits[cacheUnits.length - 1];

    let target: UnitView | null = null;
    for (const unit of this.units) {
      if (unit.type === '铲') continue;
      const cell = this.cells.find((item) => item.id === unit.currentCellId);
      if (cell?.kind !== 'build') continue;
      if (!target || unit.level < target.level) target = unit;
    }
    return target;
  }

  private drawPiece(pieceType: PieceType, cell: GridCellView): UnitView {
    const unit: UnitView = {
      id: 'unit_' + this.nextUnitId,
      type: pieceType,
      level: 1,
      node: this.pieceCard('unit_' + this.nextUnitId, this.root, cell.x, cell.y, pieceType),
      currentCellId: cell.id,
      homeX: cell.x,
      homeY: cell.y,
      attackCooldown: 0,
    };
    this.nextUnitId += 1;
    cell.unitId = unit.id;
    this.label(unit.id + '_label', unit.node, 0, 10, pieceType, 34, Color.WHITE);
    this.label(unit.id + '_level', unit.node, 0, -25, pieceType === '铲' ? '开地' : 'Lv1', 15, new Color(255, 238, 198, 255));
    unit.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onUnitTouchStart(event, unit), this);
    unit.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onUnitTouchMove(event, unit), this);
    unit.node.on(Node.EventType.TOUCH_END, () => this.onUnitTouchEnd(unit), this);
    unit.node.on(Node.EventType.TOUCH_CANCEL, () => this.onUnitTouchEnd(unit), this);
    this.units.push(unit);
    return unit;
  }

  private onUnitTouchStart(event: EventTouch, unit: UnitView) {
    if (this.gameFailed) return;
    this.draggedUnit = unit;
    this.hasDraggedUnit = false;
    const local = this.getRootPoint(event);
    this.dragStartPosition.set(local.x, local.y, 0);
    Vec3.subtract(this.dragOffset, unit.node.position, local);
    unit.node.setSiblingIndex(999);
    if (unit.type === '铲') {
      this.showTip('拖拽铲子到紫色格，解锁为白格');
    } else {
      this.showTip('拖到目标格：空格放置，同类同级合成');
    }
  }

  private onUnitTouchMove(event: EventTouch, unit: UnitView) {
    if (this.gameFailed || this.draggedUnit !== unit) return;
    const local = this.getRootPoint(event);
    if (!this.hasDraggedUnit && Vec3.distance(local, this.dragStartPosition) < DRAG_START_DISTANCE) return;
    this.hasDraggedUnit = true;
    local.add(this.dragOffset);
    unit.node.setPosition(local);
  }

  private onUnitTouchEnd(unit: UnitView) {
    if (this.gameFailed || this.draggedUnit !== unit) return;
    this.draggedUnit = null;
    if (!this.hasDraggedUnit) {
      this.returnUnitHome(unit, unit.type === '铲' ? '铲子：拖到紫色格解锁' : unit.type + ' Lv' + unit.level + '：拖动后放置或合成');
      return;
    }
    this.hasDraggedUnit = false;

    if (unit.type === '铲') {
      this.useShovel(unit);
      return;
    }

    const target = this.findNearestPlacementCell(unit.node.position);
    if (!target) {
      this.returnUnitHome(unit, '只能放到白格或底部空格');
      return;
    }

    if (target.unitId === unit.id) {
      this.returnUnitHome(unit, '移动距离太短');
      return;
    }

    if (target.unitId) {
      const other = this.units.find((item) => item.id === target.unitId);
      if (other && other.type !== '铲' && unit.type !== '铲' && other.type === unit.type && other.level === unit.level) {
        this.mergeUnits(unit, other);
        return;
      }
      this.swapUnitWithCell(unit, target);
      this.showTip(unit.type + ' Lv' + unit.level + ' 已交换位置');
      this.refreshDebugPanelIfVisible();
      return;
    }

    this.moveUnitToCell(unit, target);
    this.popNode(unit.node, 0.92, 1.08);
    this.showTip(unit.type + ' Lv' + unit.level + (target.kind === 'build' ? ' 已放入白格' : ' 已放入底部'));
    this.refreshDebugPanelIfVisible();
  }

  private useShovel(unit: UnitView) {
    const target = this.findNearestLockedCell(unit.node.position);
    if (!target) {
      this.returnUnitHome(unit, '铲子只能拖到紫色待解锁格');
      return;
    }

    const sourceCell = this.cells.find((cell) => cell.id === unit.currentCellId);
    if (sourceCell) sourceCell.unitId = null;
    this.units = this.units.filter((item) => item.id !== unit.id);
    unit.node.destroy();
    this.unlockCell(target);
    this.showTip('铲地成功：紫格变白格，可放塔丕');
    this.refreshDebugPanelIfVisible();
  }

  private findNearestPlacementCell(position: Vec3): GridCellView | null {
    return this.findNearestCell(position, (cell) => cell.kind === 'build' || cell.kind === 'cache');
  }

  private findNearestCell(position: Vec3, accept: (cell: GridCellView) => boolean): GridCellView | null {
    let best: GridCellView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (const cell of this.cells) {
      if (!accept(cell)) continue;
      const distance = Vec3.distance(position, new Vec3(cell.x, cell.y, 0));
      if (distance < bestDistance) {
        best = cell;
        bestDistance = distance;
      }
    }
    return bestDistance <= DROP_DISTANCE ? best : null;
  }

  private findNearestLockedCell(position: Vec3): GridCellView | null {
    let best: GridCellView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (const cell of this.cells) {
      if (cell.kind !== 'locked') continue;
      const distance = Vec3.distance(position, new Vec3(cell.x, cell.y, 0));
      if (distance < bestDistance) {
        best = cell;
        bestDistance = distance;
      }
    }
    return bestDistance <= DROP_DISTANCE ? best : null;
  }

  private moveUnitToCell(unit: UnitView, target: GridCellView) {
    const oldCell = this.cells.find((cell) => cell.id === unit.currentCellId);
    if (oldCell) oldCell.unitId = null;
    target.unitId = unit.id;
    unit.currentCellId = target.id;
    unit.homeX = target.x;
    unit.homeY = target.y;
    unit.node.setPosition(target.x, target.y, 0);
  }

  private mergeUnits(sourceUnit: UnitView, targetUnit: UnitView) {
    if (sourceUnit === targetUnit || sourceUnit.id === targetUnit.id) {
      this.returnUnitHome(sourceUnit, '不能和自己合成');
      return;
    }

    if (sourceUnit.type === '铲' || targetUnit.type === '铲') {
      this.returnUnitHome(sourceUnit, '铲子不能合成');
      return;
    }

    const sourceCell = this.cells.find((cell) => cell.id === sourceUnit.currentCellId);
    if (!sourceCell) {
      this.returnUnitHome(sourceUnit, '合成失败');
      return;
    }

    sourceCell.unitId = null;
    sourceUnit.node.destroy();
    this.units = this.units.filter((unit) => unit.id !== sourceUnit.id);

    targetUnit.level += 1;
    this.refreshUnitLabel(targetUnit);
    targetUnit.node.setPosition(targetUnit.homeX, targetUnit.homeY, 0);
    this.popNode(targetUnit.node, 1, 1.18);
    this.showMergeBurst(targetUnit.node.position, UNIT_CONFIGS[targetUnit.type].color);

    this.showTip(targetUnit.type + ' 合成成功：Lv' + targetUnit.level);
    this.showFloatingText(targetUnit.node.position, '合成 Lv' + targetUnit.level, new Color(255, 245, 160, 255), 24);
    this.refreshDebugPanelIfVisible();
  }

  private refreshUnitLabel(unit: UnitView) {
    const levelNode = unit.node.getChildByName(unit.id + '_level');
    const levelLabel = levelNode?.getComponent(Label);
    if (levelLabel) levelLabel.string = 'Lv' + unit.level;
  }

  private swapUnitWithCell(unit: UnitView, target: GridCellView) {
    const other = this.units.find((item) => item.id === target.unitId);
    const source = this.cells.find((cell) => cell.id === unit.currentCellId);
    if (!other || !source) {
      this.returnUnitHome(unit, '交换失败');
      return;
    }

    source.unitId = other.id;
    target.unitId = unit.id;

    other.currentCellId = source.id;
    other.homeX = source.x;
    other.homeY = source.y;
    other.node.setPosition(source.x, source.y, 0);

    unit.currentCellId = target.id;
    unit.homeX = target.x;
    unit.homeY = target.y;
    unit.node.setPosition(target.x, target.y, 0);
  }

  private returnUnitHome(unit: UnitView, reason: string) {
    unit.node.setPosition(unit.homeX, unit.homeY, 0);
    this.showTip(reason + '，单位已返回原位');
  }

  private getRootPoint(event: EventTouch): Vec3 {
    const location = event.getUILocation();
    return this.root.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private cacheCell(id: string, x: number, y: number) {
    const rootX = this.bottomLayer.position.x + x;
    const rootY = this.bottomLayer.position.y + y;
    const node = this.framedRect(id, this.bottomLayer, x, y, CACHE_CELL_SIZE, CACHE_CELL_SIZE, UI_COLORS.cache, new Color(34, 27, 23, 220), 3);
    this.rect(id + '_shine', node, 0, 13, CACHE_CELL_SIZE - 16, 18, new Color(255, 243, 199, 42));
    this.label(id + '_label', this.bottomLayer, x, y, '', 20, new Color(110, 100, 110, 255));
    this.cells.push({ id, kind: 'cache', node, x: rootX, y: rootY, unitId: null });
  }

  private gridCell(id: string, col: number, row: number, kind: CellKind, text: string, color: Color) {
    const size = MAP_CELL_SIZE;
    const local = this.boardCellToLocal(col, row);
    const localX = local.x;
    const localY = local.y;
    const rootX = this.mapLayer.position.x + localX;
    const rootY = this.mapLayer.position.y + localY;
    const isRoute = kind === 'route';
    const strokeColor = kind === 'locked' ? new Color(38, 31, 29, 108) : new Color(98, 72, 52, 145);
    const node = isRoute
      ? this.nodeOnly(id, this.mapLayer, localX, localY, size, size)
      : this.framedRect(id, this.mapLayer, localX, localY, size, size, color, strokeColor, 1);
    if (!isRoute) {
      const innerColor = kind === 'locked' ? UI_COLORS.lockedInner : UI_COLORS.buildInner;
      this.rect(id + '_inner', node, 0, 0, size - 24, size - 24, innerColor);
    }
    const labelText = kind === 'locked' || kind === 'route' ? '' : text;
    const cellLabel = this.label(id + '_label', this.mapLayer, localX, localY, labelText, 20, UI_COLORS.darkText);
    const cell: GridCellView = { id, kind, node, x: rootX, y: rootY, unitId: null };
    this.cells.push(cell);

    if (kind === 'locked') {
      node.on(Node.EventType.TOUCH_END, () => this.expandCell(cell), this);
      cellLabel.node.on(Node.EventType.TOUCH_END, () => this.expandCell(cell), this);
    }
  }

  private expandCell(cell: GridCellView) {
    if (this.gameFailed) {
      this.showTip('本局已失败：不能继续扩地');
      return;
    }

    if (cell.kind !== 'locked') return;
    this.showTip('需要把底部铲子拖到紫色格才能解锁');
  }

  private refreshRunStats() {
    if (!this.runStatsLabel) return;
    const buildCount = this.cells.filter((cell) => cell.kind === 'build').length;
    this.runStatsLabel.string = '击杀 ' + this.killCount + ' · 漏怪 ' + this.leakCount + ' · 扩地 ' + this.expandedCount + ' · 布阵位 ' + buildCount;
  }

  private unlockCell(cell: GridCellView) {
    cell.kind = 'build';
    this.expandedCount += 1;
    this.repaintCell(cell, UI_COLORS.build, new Color(95, 73, 56, 255));
    const inner = cell.node.getChildByName(cell.id + '_inner');
    if (inner) this.repaintNode(inner, UI_COLORS.buildInner);
    this.setCellLabel(cell, '', UI_COLORS.darkText);
    this.refreshRunStats();
  }

  private repaintCell(cell: GridCellView, fillColor: Color, strokeColor: Color) {
    const graphics = cell.node.getComponent(Graphics);
    if (!graphics) return;

    const transform = cell.node.getComponent(UITransform);
    const width = transform?.width ?? 68;
    const height = transform?.height ?? 68;
    graphics.clear();
    graphics.fillColor = fillColor;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    graphics.lineWidth = 3;
    graphics.strokeColor = strokeColor;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.stroke();
  }

  private repaintNode(node: Node, fillColor: Color) {
    const graphics = node.getComponent(Graphics);
    if (!graphics) return;
    const transform = node.getComponent(UITransform);
    const width = transform?.width ?? 68;
    const height = transform?.height ?? 68;
    graphics.clear();
    graphics.fillColor = fillColor;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private setCellLabel(cell: GridCellView, text: string, color: Color) {
    const labelNode = this.mapLayer.getChildByName(cell.id + '_label');
    const label = labelNode?.getComponent(Label);
    if (!label) return;
    label.string = text;
    label.color = color;
  }

  private showTip(message: string) {
    if (this.bottomTipLabel) this.bottomTipLabel.string = message;
  }

  private button(name: string, x: number, y: number, width: number, height: number, text: string): Node {
    const node = this.framedRect(name, this.bottomLayer, x, y, width, height, UI_COLORS.accent, UI_COLORS.panelStroke, 3);
    this.label(name + '_label', this.bottomLayer, x, y, text, 24, Color.WHITE);
    return node;
  }

  private pieceCard(name: string, parent: Node, x: number, y: number, pieceType: PieceType): Node {
    const outer = this.framedRect(name, parent, x, y, UNIT_SIZE, UNIT_SIZE, new Color(52, 42, 38, 255), new Color(24, 20, 18, 255), 4);
    this.rect(name + '_face', outer, 0, 0, UNIT_SIZE - 14, UNIT_SIZE - 14, PIECE_COLORS[pieceType]);
    this.stroke(outer.getChildByName(name + '_face')!, UNIT_SIZE - 14, UNIT_SIZE - 14, new Color(235, 210, 157, 255), 2);
    return outer;
  }

  private enemyCard(name: string, x: number, y: number, enemyType: EnemyType): Node {
    const node = this.framedRect(name, this.root, x, y, 56, 62, new Color(50, 38, 36, 255), new Color(20, 16, 15, 255), 3);
    this.rect(name + '_face', node, 0, 5, 44, 42, ENEMY_CONFIGS[enemyType].color);
    this.stroke(node.getChildByName(name + '_face')!, 44, 42, new Color(205, 128, 82, 255), 2);
    return node;
  }

  private lineEffect(name: string, from: Vec3, to: Vec3, color: Color, width: number, parent: Node = this.root): Node {
    const centerX = (from.x + to.x) / 2;
    const centerY = (from.y + to.y) / 2;
    const length = Vec3.distance(from, to);
    const node = this.nodeOnly(name, parent, centerX, centerY, length, width);
    node.setRotationFromEuler(0, 0, Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.rect(-length / 2, -width / 2, length, width);
    graphics.fill();
    return node;
  }

  private rect(name: string, parent: Node, x: number, y: number, width: number, height: number, color: Color): Node {
    const node = this.nodeOnly(name, parent, x, y, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    return node;
  }

  private framedRect(name: string, parent: Node, x: number, y: number, width: number, height: number, fillColor: Color, strokeColor: Color, lineWidth = 3): Node {
    const node = this.rect(name, parent, x, y, width, height, fillColor);
    this.stroke(node, width, height, strokeColor, lineWidth);
    return node;
  }

  private stroke(node: Node, width: number, height: number, color: Color, lineWidth = 3) {
    const graphics = node.getComponent(Graphics);
    if (!graphics) return;
    graphics.lineWidth = lineWidth;
    graphics.strokeColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.stroke();
  }

  private nodeOnly(name: string, parent: Node, x: number, y: number, width: number, height: number): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private spriteImage(name: string, parent: Node, x: number, y: number, width: number, height: number, resourcePath: string): Node {
    const node = this.nodeOnly(name, parent, x, y, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load(resourcePath + '/spriteFrame', SpriteFrame, (err, spriteFrame) => {
      if (err || !spriteFrame || !sprite.isValid) {
        console.warn('[文字三国] 美术资源加载失败', resourcePath, err);
        node.active = false;
        return;
      }
      sprite.spriteFrame = spriteFrame;
    });
    return node;
  }

  private label(name: string, parent: Node, x: number, y: number, text: string, fontSize: number, color: Color): Label {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = color;
    const outline = node.addComponent(LabelOutline);
    outline.color = new Color(18, 13, 11, 190);
    outline.width = Math.max(1, Math.round(fontSize / 12));
    return label;
  }
}
