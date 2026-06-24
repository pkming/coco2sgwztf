import { _decorator, Camera, Canvas, Color, Component, EventTouch, Graphics, Label, Layers, Node, UITransform, Vec3, view } from 'cc';

const { ccclass } = _decorator;

type CellKind = 'build' | 'locked' | 'route' | 'cache';
type UnitType = '刀' | '弓' | '枪' | '骑';

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
  type: UnitType;
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

const START_LIFE = 3;
const START_FOOD = 60;
const RECRUIT_COST = 10;
const BASE_EXPAND_COST = 20;
const EXPAND_COST_STEP = 5;
const KILL_REWARD = 6;
const WAVE_CLEAR_REWARD = 12;
const BASE_ENEMY_HP = 18;
const ENEMY_HP_GROWTH = 4;
const BASE_ENEMY_SPEED = 86;
const ENEMY_SPEED_GROWTH = 2;
const BASE_ENEMY_COUNT = 3;

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
  private recruitCost = RECRUIT_COST;
  private expandedCount = 0;
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
  }

  private buildTopBar() {
    this.rect('TopBg', this.topLayer, 0, 0, 720, 120, new Color(214, 168, 202, 255));
    this.label('FoodIcon', this.topLayer, -260, 18, '包子', 22, Color.WHITE);
    this.foodValueLabel = this.label('FoodValue', this.topLayer, -190, 18, String(this.food), 32, Color.WHITE);
    this.waveLabel = this.label('WaveText', this.topLayer, 0, 18, '第1波', 30, new Color(40, 35, 40, 255));
    this.label('LifeIcon', this.topLayer, 190, 18, '生命', 24, new Color(40, 35, 40, 255));
    this.lifeValueLabel = this.label('LifeValue', this.topLayer, 260, 18, String(this.life), 32, Color.WHITE);
    this.label('RuleTip', this.topLayer, 0, -35, 'P0：只用色块验证玩法，不使用美术资源', 20, new Color(80, 60, 75, 255));
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
      [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3],
      [2, 2], [2, 1], [1, 1], [0, 1], [-1, 1], [-2, 1],
      [-2, 0], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
      [2, -2], [2, -3], [1, -3], [0, -3], [-1, -3], [-2, -3], [-3, -3],
    ];

    for (const [col, row] of routeCells) {
      this.gridCell('route_' + col + '_' + row, col, row, 'route', '路', new Color(245, 179, 212, 255));
    }

    this.enemyPath = routeCells.map(([col, row]) => new Vec3(this.mapLayer.position.x + col * 78, this.mapLayer.position.y + row * 78, 0));
    this.label('Entrance', this.mapLayer, 275, 360, '入口', 22, new Color(45, 35, 45, 255));
    this.label('Exit', this.mapLayer, -275, -360, '终点', 22, new Color(45, 35, 45, 255));
  }

  private drawLockedCells() {
    const lockedCells = [
      [-3, 2], [-2, 2], [-1, 2],
      [-3, 1], [-3, 0], [-1, 0], [0, 0], [1, 0],
      [-3, -1], [3, 1], [3, 0], [3, -1],
      [-3, -2], [-2, -2], [-1, -2], [0, -2], [1, -2], [3, -2],
    ];

    for (const [col, row] of lockedCells) {
      this.gridCell('locked_' + col + '_' + row, col, row, 'locked', '锁', new Color(185, 74, 132, 255));
    }
  }

  private drawBuildCells() {
    const buildCells = [
      [-1, 4], [0, 4], [1, 4],
      [-1, 3], [0, 3], [1, 3],
      [-1, -4], [0, -4], [1, -4],
      [-1, -3], [0, -3], [1, -3],
    ];

    for (const [col, row] of buildCells) {
      this.gridCell('build_' + col + '_' + row, col, row, 'build', '空', Color.WHITE);
    }

    this.label('BuildTopLabel', this.mapLayer, 0, 395, '上布阵区：白格可放兵', 20, new Color(65, 45, 60, 255));
    this.label('BuildBottomLabel', this.mapLayer, 0, -395, '下布阵区：白格可放兵', 20, new Color(65, 45, 60, 255));
  }

  private drawLegend() {
    this.rect('LegendBg', this.mapLayer, 0, -5, 220, 94, new Color(255, 255, 255, 190));
    this.label('Legend1', this.mapLayer, 0, 24, '白格=可放兵', 18, new Color(45, 35, 45, 255));
    this.label('Legend2', this.mapLayer, 0, -2, '红格=点击铲地', 18, new Color(45, 35, 45, 255));
    this.label('Legend3', this.mapLayer, 0, -28, '粉格=敌人路线', 18, new Color(45, 35, 45, 255));
  }

  private buildRecruitAndActions() {
    this.rect('RecruitBarBg', this.bottomLayer, 0, 82, 680, 78, new Color(222, 196, 214, 255));
    this.label('CampIcon', this.bottomLayer, -295, 82, '营', 28, new Color(70, 55, 65, 255));

    for (let index = 0; index < 5; index++) {
      const x = -196 + index * 82;
      this.cacheCell('cache_' + index, x, 82);
    }

    const recruitButton = this.button('RecruitButton', -160, -28, 190, 74, '征兵\n消耗' + RECRUIT_COST);
    recruitButton.on(Node.EventType.TOUCH_END, this.recruitUnit, this);

    const battleButton = this.button('BattleButton', 160, -28, 190, 74, '开始战斗');
    battleButton.on(Node.EventType.TOUCH_END, this.startBattle, this);

    this.bottomTipLabel = this.label('BottomTip', this.bottomLayer, 0, -102, '点击征兵：随机单位进入5个缓存格', 20, new Color(80, 60, 75, 255));
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
    const node = this.rect(id, this.root, start.x, start.y, 46, 46, new Color(35, 35, 38, 255));
    this.label(id + '_label', node, 0, 8, '兵', 18, Color.WHITE);
    const hp = BASE_ENEMY_HP + (this.wave - 1) * ENEMY_HP_GROWTH;
    const label = this.label(id + '_hp', node, 0, -14, String(hp), 13, Color.WHITE);
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
    this.life = Math.max(0, this.life - 1);
    this.refreshLife();

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
      const cell = this.cells.find((item) => item.id === unit.currentCellId);
      if (!cell || cell.kind !== 'build') continue;

      unit.attackCooldown -= deltaTime;
      if (unit.attackCooldown > 0) continue;

      const target = this.findNearestEnemy(unit);
      if (!target) continue;

      unit.attackCooldown = 0.8;
      this.damageEnemy(target, this.getUnitDamage(unit));
    }
  }

  private findNearestEnemy(unit: UnitView): EnemyView | null {
    let best: EnemyView | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    const unitPosition = unit.node.position;

    for (const enemy of this.enemies) {
      const distance = Vec3.distance(unitPosition, enemy.node.position);
      if (distance <= 170 && distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }

    return best;
  }

  private getUnitDamage(unit: UnitView): number {
    return 4 * unit.level;
  }

  private damageEnemy(enemy: EnemyView, damage: number) {
    enemy.hp -= damage;
    enemy.label.string = String(Math.max(0, enemy.hp));
    if (enemy.hp > 0) return;

    const index = this.enemies.indexOf(enemy);
    if (index >= 0) this.enemies.splice(index, 1);
    enemy.node.destroy();
    this.food += KILL_REWARD;
    this.foodValueLabel.string = String(this.food);
    this.showTip('击杀敌人：包子 +' + KILL_REWARD);
  }

  private recruitUnit() {
    if (this.gameFailed) {
      this.showTip('本局已失败：不能继续征兵');
      return;
    }

    const emptyCache = this.cells.find((cell) => cell.kind === 'cache' && !cell.unitId);
    if (!emptyCache) {
      this.showTip('缓存区已满：请先拖到白格');
      return;
    }

    if (this.food < this.recruitCost) {
      this.showTip('包子不足：战斗奖励后才能继续征兵');
      return;
    }

    this.food -= this.recruitCost;
    this.foodValueLabel.string = String(this.food);

    const unitTypes: UnitType[] = ['刀', '弓', '枪', '骑'];
    const unitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
    this.drawUnit(unitType, emptyCache);
    this.showTip('征兵获得：' + unitType + ' Lv1，拖到白格即可布阵');
  }

  private drawUnit(unitType: UnitType, cell: GridCellView) {
    const colorMap: Record<UnitType, Color> = {
      刀: new Color(210, 70, 60, 255),
      弓: new Color(70, 120, 220, 255),
      枪: new Color(70, 170, 100, 255),
      骑: new Color(230, 185, 55, 255),
    };
    const unit: UnitView = {
      id: 'unit_' + this.nextUnitId,
      type: unitType,
      level: 1,
      node: this.rect('unit_' + this.nextUnitId, this.root, cell.x, cell.y, 62, 62, colorMap[unitType]),
      currentCellId: cell.id,
      homeX: cell.x,
      homeY: cell.y,
      attackCooldown: 0,
    };
    this.nextUnitId += 1;
    cell.unitId = unit.id;
    this.label(unit.id + '_label', unit.node, 0, 6, unitType, 28, Color.WHITE);
    this.label(unit.id + '_level', unit.node, 0, -21, 'Lv1', 14, Color.WHITE);
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
    this.showTip('拖拽 ' + unit.type + ' Lv' + unit.level + ' 到白格，拖到已有单位可交换');
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

    const target = this.findNearestBuildCell(unit.node.position);
    if (!target) {
      this.returnUnitHome(unit, '只能放到白格');
      return;
    }

    if (target.unitId) {
      const other = this.units.find((item) => item.id === target.unitId);
      if (other && other.type === unit.type && other.level === unit.level) {
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
    return bestDistance <= 48 ? best : null;
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
    const node = this.rect(id, this.bottomLayer, x, y, 72, 72, Color.WHITE);
    this.stroke(node, 72, 72, new Color(190, 180, 190, 255));
    this.label(id + '_label', this.bottomLayer, x, y, '空', 20, new Color(110, 100, 110, 255));
    this.cells.push({ id, kind: 'cache', node, x: rootX, y: rootY, unitId: null });
  }

  private gridCell(id: string, col: number, row: number, kind: CellKind, text: string, color: Color) {
    const size = 68;
    const localX = col * 78;
    const localY = row * 78;
    const rootX = this.mapLayer.position.x + localX;
    const rootY = this.mapLayer.position.y + localY;
    const node = this.rect(id, this.mapLayer, localX, localY, size, size, color);
    this.stroke(node, size, size, new Color(150, 105, 135, 255));
    const labelText = kind === 'locked' ? '铲' + this.getExpandCost() : text;
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

    const cost = this.getExpandCost();
    if (this.food < cost) {
      this.showTip('包子不足：扩地需要 ' + cost);
      return;
    }

    this.food -= cost;
    this.foodValueLabel.string = String(this.food);
    cell.kind = 'build';
    this.expandedCount += 1;
    this.repaintCell(cell, Color.WHITE, new Color(190, 180, 190, 255));
    this.setCellLabel(cell, '空', new Color(75, 55, 70, 255));
    this.refreshLockedCellLabels();
    this.showTip('扩地成功：-' + cost + ' 包子，+1 布阵位');
  }

  private getExpandCost(): number {
    return BASE_EXPAND_COST + this.expandedCount * EXPAND_COST_STEP;
  }

  private refreshLockedCellLabels() {
    const labelText = '铲' + this.getExpandCost();
    for (const cell of this.cells) {
      if (cell.kind === 'locked') this.setCellLabel(cell, labelText, new Color(75, 55, 70, 255));
    }
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
