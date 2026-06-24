import { _decorator, Camera, Canvas, Color, Component, EventTouch, Graphics, Label, Layers, Node, tween, UITransform, Vec3, view } from 'cc';

const { ccclass } = _decorator;

type CellKind = 'build' | 'locked' | 'route' | 'cache';
type UnitType = '刀' | '弓' | '枪' | '骑';
type PieceType = UnitType | '铲';

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
const DISMISS_REFUND = 2;
const GRID_GAP = 104;
const MAP_CELL_SIZE = 96;
const UNIT_SIZE = 86;
const CACHE_CELL_SIZE = 84;
const CACHE_GAP = 90;
const DROP_DISTANCE = 66;

const UNIT_CONFIGS: Record<UnitType, UnitBattleConfig> = {
  刀: {
    color: new Color(218, 68, 56, 255),
    damage: 8,
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
    damage: 6,
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

const PIECE_COLORS: Record<PieceType, Color> = {
  刀: UNIT_CONFIGS.刀.color,
  弓: UNIT_CONFIGS.弓.color,
  枪: UNIT_CONFIGS.枪.color,
  骑: UNIT_CONFIGS.骑.color,
  铲: new Color(132, 91, 52, 255),
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
  private gameFailed = false;
  private enemiesToSpawn = 0;
  private spawnTimer = 0;
  private enemyPath: Vec3[] = [];
  private foodValueLabel!: Label;
  private lifeValueLabel!: Label;
  private waveLabel!: Label;
  private runStatsLabel!: Label;
  private bottomTipLabel!: Label;
  private draggedUnit: UnitView | null = null;
  private dragOffset = new Vec3();

  start() {
    console.log('[文字三国] P0BuildAreaBootstrap start');
    this.node.removeAllChildren();
    view.setDesignResolutionSize(720, 1280, 2);
    this.ensureCanvas();
    this.buildStaticPage();
  }

  update(deltaTime: number) {
    if (this.gameFailed) return;
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
    camera.clearColor = new Color(236, 204, 224, 255);
    canvas.cameraComponent = camera;
  }

  private buildStaticPage() {
    this.root = this.rect('RootBg', this.node, 0, 0, 720, 1280, new Color(236, 204, 224, 255));
    this.topLayer = this.nodeOnly('TopLayer', this.root, 0, 575, 720, 120);
    this.mapLayer = this.nodeOnly('MapLayer', this.root, 0, 95, 720, 860);
    this.bottomLayer = this.nodeOnly('BottomLayer', this.root, 0, -520, 720, 250);

    this.buildTopBar();
    this.buildMapArea();
    this.buildRecruitAndActions();
    this.refreshRunStats();
  }

  private buildTopBar() {
    this.rect('TopBg', this.topLayer, 0, 0, 720, 120, new Color(214, 168, 202, 255));
    this.label('FoodIcon', this.topLayer, -260, 18, '包子', 22, Color.WHITE);
    this.foodValueLabel = this.label('FoodValue', this.topLayer, -190, 18, String(this.food), 32, Color.WHITE);
    this.waveLabel = this.label('WaveText', this.topLayer, 0, 18, '第1波', 30, new Color(40, 35, 40, 255));
    this.label('LifeIcon', this.topLayer, 190, 18, '生命', 24, new Color(40, 35, 40, 255));
    this.lifeValueLabel = this.label('LifeValue', this.topLayer, 260, 18, String(this.life), 32, Color.WHITE);
    this.runStatsLabel = this.label('RunStatsText', this.topLayer, 0, -35, '', 20, new Color(80, 60, 75, 255));
    this.refreshRunStats();
  }

  private buildMapArea() {
    this.rect('MapBg', this.mapLayer, 0, 0, 720, 860, new Color(230, 190, 215, 255));
    this.drawRouteCells();
    this.drawLockedCells();
    this.drawBuildCells();
    this.drawLegend();
  }

  private drawRouteCells() {
    const routeCells = [
      [-3, -3], [-3, -2], [-3, -1], [-3, 0], [-3, 1], [-3, 2],
      [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2],
      [3, 1], [3, 0], [3, -1], [3, -2], [3, -3],
    ];

    for (const [col, row] of routeCells) {
      this.gridCell('route_' + col + '_' + row, col, row, 'route', '路', new Color(239, 86, 88, 255));
    }

    this.enemyPath = routeCells.map(([col, row]) => new Vec3(this.mapLayer.position.x + col * GRID_GAP, this.mapLayer.position.y + row * GRID_GAP, 0));
    this.label('Entrance', this.mapLayer, -312, -390, '入口', 22, new Color(45, 35, 45, 255));
    this.label('Exit', this.mapLayer, 312, -390, '终点', 22, new Color(45, 35, 45, 255));
  }

  private drawLockedCells() {
    const lockedCells = [
      [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3],
      [-2, 1], [-2, 0], [-2, -1],
      [2, 1], [2, 0], [2, -1],
      [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
      [-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3],
    ];

    for (const [col, row] of lockedCells) {
      this.gridCell('locked_' + col + '_' + row, col, row, 'locked', '锁', new Color(185, 74, 132, 255));
    }
  }

  private drawBuildCells() {
    const buildCells = [
      [-1, 1], [0, 1], [1, 1],
      [-1, 0], [0, 0], [1, 0],
    ];

    for (const [col, row] of buildCells) {
      this.gridCell('build_' + col + '_' + row, col, row, 'build', '空', Color.WHITE);
    }

    this.label('BuildTopLabel', this.mapLayer, 0, 170, '已解锁：白格可放兵', 20, new Color(65, 45, 60, 255));
    this.label('BuildBottomLabel', this.mapLayer, 0, -145, '外圈紫格拖铲子解锁', 20, new Color(65, 45, 60, 255));
  }

  private drawLegend() {
    this.rect('LegendBg', this.mapLayer, 0, -392, 260, 66, new Color(255, 255, 255, 190));
    this.label('Legend1', this.mapLayer, 0, -374, '白=放兵  紫=铲地  红=路线', 18, new Color(45, 35, 45, 255));
    this.label('Legend2', this.mapLayer, 0, -400, '先守中间，再向外铲地', 18, new Color(45, 35, 45, 255));
  }

  private buildRecruitAndActions() {
    this.rect('RecruitBarBg', this.bottomLayer, 0, 82, 680, 78, new Color(222, 196, 214, 255));
    this.label('CampIcon', this.bottomLayer, -295, 82, '营', 28, new Color(70, 55, 65, 255));

    for (let index = 0; index < 5; index++) {
      const x = -200 + index * CACHE_GAP;
      this.cacheCell('cache_' + index, x, 82);
    }

    const recruitButton = this.button('RecruitButton', -215, -28, 150, 74, '刷新\n消耗' + this.refreshCost);
    recruitButton.on(Node.EventType.TOUCH_END, this.refreshShop, this);

    const dismissButton = this.button('DismissButton', 0, -28, 150, 74, '遣散\n返还' + DISMISS_REFUND);
    dismissButton.on(Node.EventType.TOUCH_END, this.dismissUnit, this);

    const battleButton = this.button('BattleButton', 215, -28, 150, 74, '开始战斗');
    battleButton.on(Node.EventType.TOUCH_END, this.startBattle, this);

    this.bottomTipLabel = this.label('BottomTip', this.bottomLayer, 0, -102, '刷新一次出5个：兵或铲子', 20, new Color(80, 60, 75, 255));
  }

  private startBattle() {
    if (this.gameFailed) {
      this.showTip('本局已失败：请重新运行后再挑战');
      return;
    }

    if (this.waveActive || this.enemies.length > 0 || this.enemiesToSpawn > 0) {
      this.showTip('当前波次进行中：仍可征兵、拖拽、合成');
      return;
    }

    this.battleStarted = true;
    this.startWave();
  }

  private startWave() {
    this.waveActive = true;
    this.enemiesToSpawn = BASE_ENEMY_COUNT + this.wave - 1;
    this.spawnTimer = 0;
    this.waveLabel.string = '第' + this.wave + '波';
    this.showTip('第' + this.wave + '波开始：本波敌人 ' + this.enemiesToSpawn + ' 个');
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
    this.waveLabel.string = '第' + this.wave + '波';
    this.showTip('波次清空：包子 +' + WAVE_CLEAR_REWARD + '，自动进入第' + this.wave + '波');
    this.startWave();
  }

  private spawnEnemy() {
    if (this.enemyPath.length === 0) return;
    const start = this.enemyPath[0];
    const id = 'enemy_' + this.nextEnemyId;
    this.nextEnemyId += 1;
    const node = this.rect(id, this.root, start.x, start.y, 54, 54, new Color(35, 35, 38, 255));
    this.label(id + '_label', node, 0, 10, '兵', 20, Color.WHITE);
    const hp = BASE_ENEMY_HP + (this.wave - 1) * ENEMY_HP_GROWTH;
    const label = this.label(id + '_hp', node, 0, -16, String(hp), 14, Color.WHITE);
    const speed = BASE_ENEMY_SPEED + (this.wave - 1) * ENEMY_SPEED_GROWTH;
    this.enemies.push({ id, node, label, pathIndex: 0, speed, hp });
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
    enemy.node.destroy();
    this.enemies.splice(enemyIndex, 1);
    this.leakCount += 1;
    this.life = Math.max(0, this.life - 1);
    this.refreshLife();
    this.refreshRunStats();

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

    for (const enemy of this.enemies) enemy.node.destroy();
    this.enemies = [];
    this.showTip('失败：生命为0，本局结束');
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
      this.damageEnemy(target, this.getUnitDamage(unit, unitType), unitType);
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

  private damageEnemy(enemy: EnemyView, damage: number, unitType: UnitType) {
    enemy.hp -= damage;
    enemy.label.string = String(Math.max(0, enemy.hp));
    this.showDamageText(enemy.node.position, damage, UNIT_CONFIGS[unitType].color);
    if (enemy.hp > 0) return;

    const index = this.enemies.indexOf(enemy);
    if (index >= 0) this.enemies.splice(index, 1);
    enemy.node.destroy();
    this.killCount += 1;
    this.food += KILL_REWARD;
    this.foodValueLabel.string = String(this.food);
    this.refreshRunStats();
    this.showTip('击杀敌人：包子 +' + KILL_REWARD);
  }

  private showDamageText(position: Vec3, damage: number, color: Color) {
    const label = this.label('DamageText', this.root, position.x, position.y + 34, '-' + damage, 24, color);
    label.node.setSiblingIndex(999);
    tween(label.node)
      .by(0.45, { position: new Vec3(0, 34, 0) })
      .call(() => label.node.destroy())
      .start();
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

    this.clearCachePieces();
    this.food -= this.refreshCost;
    this.foodValueLabel.string = String(this.food);

    const cacheCells = this.cells.filter((cell) => cell.kind === 'cache');
    for (const cell of cacheCells) {
      this.drawPiece(this.pickRandomPiece(), cell);
    }

    const paid = this.refreshCost;
    this.refreshCost = Math.ceil(this.refreshCost * REFRESH_COST_GROWTH);
    this.refreshButtonText();
    this.showTip('刷新消耗 ' + paid + '：获得5个候选');
  }

  private clearCachePieces() {
    const cacheIds = new Set(this.cells.filter((cell) => cell.kind === 'cache').map((cell) => cell.id));
    for (const cell of this.cells) {
      if (cell.kind === 'cache') cell.unitId = null;
    }

    for (const unit of [...this.units]) {
      if (!cacheIds.has(unit.currentCellId)) continue;
      if (this.draggedUnit === unit) this.draggedUnit = null;
      unit.node.destroy();
      this.units = this.units.filter((item) => item.id !== unit.id);
    }
  }

  private pickRandomPiece(): PieceType {
    const pool: PieceType[] = ['刀', '弓', '枪', '骑', '铲'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private refreshButtonText() {
    const label = this.bottomLayer.getChildByName('RecruitButtonLabel')?.getComponent(Label);
    if (label) label.string = '刷新\n消耗' + this.refreshCost;
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
    this.food += DISMISS_REFUND;
    this.foodValueLabel.string = String(this.food);
    this.showTip('遣散 ' + unit.type + ' Lv' + unit.level + '：包子 +' + DISMISS_REFUND);
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

  private drawPiece(pieceType: PieceType, cell: GridCellView) {
    const unit: UnitView = {
      id: 'unit_' + this.nextUnitId,
      type: pieceType,
      level: 1,
      node: this.rect('unit_' + this.nextUnitId, this.root, cell.x, cell.y, UNIT_SIZE, UNIT_SIZE, PIECE_COLORS[pieceType]),
      currentCellId: cell.id,
      homeX: cell.x,
      homeY: cell.y,
      attackCooldown: 0,
    };
    this.nextUnitId += 1;
    cell.unitId = unit.id;
    this.label(unit.id + '_label', unit.node, 0, 8, pieceType, 32, Color.WHITE);
    this.label(unit.id + '_level', unit.node, 0, -25, pieceType === '铲' ? '开地' : 'Lv1', 15, Color.WHITE);
    unit.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onUnitTouchStart(event, unit), this);
    unit.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onUnitTouchMove(event, unit), this);
    unit.node.on(Node.EventType.TOUCH_END, () => this.onUnitTouchEnd(unit), this);
    unit.node.on(Node.EventType.TOUCH_CANCEL, () => this.onUnitTouchEnd(unit), this);
    this.units.push(unit);
  }

  private onUnitTouchStart(event: EventTouch, unit: UnitView) {
    if (this.gameFailed) return;
    this.draggedUnit = unit;
    const local = this.getRootPoint(event);
    Vec3.subtract(this.dragOffset, unit.node.position, local);
    unit.node.setSiblingIndex(999);
    if (unit.type === '铲') {
      this.showTip('拖拽铲子到紫色格，解锁为白格');
    } else {
      this.showTip('拖拽 ' + unit.type + ' Lv' + unit.level + ' 到白格，拖到已有单位可交换');
    }
  }

  private onUnitTouchMove(event: EventTouch, unit: UnitView) {
    if (this.gameFailed || this.draggedUnit !== unit) return;
    const local = this.getRootPoint(event);
    local.add(this.dragOffset);
    unit.node.setPosition(local);
  }

  private onUnitTouchEnd(unit: UnitView) {
    if (this.gameFailed || this.draggedUnit !== unit) return;
    this.draggedUnit = null;

    if (unit.type === '铲') {
      this.useShovel(unit);
      return;
    }

    const target = this.findNearestBuildCell(unit.node.position);
    if (!target) {
      this.returnUnitHome(unit, '只能放到白格');
      return;
    }

    if (target.unitId) {
      const other = this.units.find((item) => item.id === target.unitId);
      if (other && other.type !== '铲' && unit.type !== '铲' && other.type === unit.type && other.level === unit.level) {
        this.mergeUnits(unit, other, target);
        return;
      }
      this.swapUnitWithCell(unit, target);
      this.showTip(unit.type + ' Lv' + unit.level + ' 已交换位置');
      return;
    }

    this.moveUnitToCell(unit, target);
    this.showTip(unit.type + ' Lv' + unit.level + ' 已放入白格');
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
  }

  private findNearestBuildCell(position: Vec3): GridCellView | null {
    let best: GridCellView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (const cell of this.cells) {
      if (cell.kind !== 'build') continue;
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

  private mergeUnits(sourceUnit: UnitView, targetUnit: UnitView, targetCell: GridCellView) {
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
    targetUnit.node.setPosition(targetCell.x, targetCell.y, 0);
    targetUnit.homeX = targetCell.x;
    targetUnit.homeY = targetCell.y;
    targetUnit.currentCellId = targetCell.id;
    targetCell.unitId = targetUnit.id;

    this.showTip(targetUnit.type + ' 合成成功：Lv' + targetUnit.level);
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
    const node = this.rect(id, this.bottomLayer, x, y, CACHE_CELL_SIZE, CACHE_CELL_SIZE, Color.WHITE);
    this.stroke(node, CACHE_CELL_SIZE, CACHE_CELL_SIZE, new Color(190, 180, 190, 255));
    this.label(id + '_label', this.bottomLayer, x, y, '空', 20, new Color(110, 100, 110, 255));
    this.cells.push({ id, kind: 'cache', node, x: rootX, y: rootY, unitId: null });
  }

  private gridCell(id: string, col: number, row: number, kind: CellKind, text: string, color: Color) {
    const size = MAP_CELL_SIZE;
    const localX = col * GRID_GAP;
    const localY = row * GRID_GAP;
    const rootX = this.mapLayer.position.x + localX;
    const rootY = this.mapLayer.position.y + localY;
    const node = this.rect(id, this.mapLayer, localX, localY, size, size, color);
    this.stroke(node, size, size, new Color(150, 105, 135, 255));
    const labelText = kind === 'locked' ? '铲' : text;
    const cellLabel = this.label(id + '_label', this.mapLayer, localX, localY, labelText, 20, new Color(75, 55, 70, 255));
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
    this.repaintCell(cell, Color.WHITE, new Color(190, 180, 190, 255));
    this.setCellLabel(cell, '空', new Color(75, 55, 70, 255));
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
    const node = this.rect(name, this.bottomLayer, x, y, width, height, new Color(230, 138, 54, 255));
    this.label(name + '_label', this.bottomLayer, x, y, text, 24, Color.WHITE);
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

  private stroke(node: Node, width: number, height: number, color: Color) {
    const graphics = node.getComponent(Graphics);
    if (!graphics) return;
    graphics.lineWidth = 3;
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
    return label;
  }
}
