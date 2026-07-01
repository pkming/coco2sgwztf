import { _decorator, Camera, Canvas, Color, Component, Graphics, Label, Layers, Node, UITransform, Vec3, view } from 'cc';
import { BOW_PROTOTYPE_V0_1 } from '../data/BowPrototypeConfig';
import { createBowBattleRuntimeStats, createBowBattleSimulation } from '../battle/BowAutoBattleSimulator';
import { BOW_MONSTERS, P0_BASE_MONSTER_HP, P0_BASE_MONSTER_SPEED, WaveConfig } from '../data/BowMonsterPressureConfig';

const { ccclass } = _decorator;

interface RuntimeMonster {
  node: Node;
  hp: number;
  maxHp: number;
  speed: number;
  rewardWeight: number;
  x: number;
  y: number;
}

interface RuntimeArrow {
  node: Node;
  x: number;
  y: number;
  speed: number;
  damage: number;
  pierceLeft: number;
  hitMonsters: Set<RuntimeMonster>;
}

const FIELD_WIDTH = 640;
const FIELD_HEIGHT = 980;
const PLAYER_X = 0;
const PLAYER_Y = -415;
const MONSTER_SPAWN_Y = 430;
const MONSTER_END_Y = PLAYER_Y + 54;
const ARROW_DESPAWN_Y = 470;
const BATTLE_SPEED_SCALE = 1.0;
const ATTACK_INTERVAL_SCALE = 3.6;
const ARROW_SPEED = 430;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private previewStarted = false;
  private root!: Node;
  private uiCamera: Camera | null = null;
  private titleLabel!: Label;
  private roleLabel!: Label;
  private skillTreeLabel!: Label;
  private equipmentLabel!: Label;
  private monsterLabel!: Label;
  private runHintLabel!: Label;
  private battleStatusLabel!: Label;
  private fieldLayer!: Node;
  private playerNode!: Node;
  private arrowLayer!: Node;
  private monsterLayer!: Node;
  private battleRuntime = createBowBattleRuntimeStats(BOW_PROTOTYPE_V0_1.buildSnapshot);
  private currentWaveIndex = 0;
  private currentWaveElapsed = 0;
  private nextGroupSpawnTimes: number[] = [];
  private spawnedGroupCounts: number[] = [];
  private battleElapsed = 0;
  private shootElapsed = 0;
  private totalKills = 0;
  private totalEscaped = 0;
  private monsters: RuntimeMonster[] = [];
  private arrows: RuntimeArrow[] = [];
  private battleFinished = false;

  start() {
    console.log('[弓箭原型] GameBootstrap start');
    this.ensureCanvasRoot();
    this.buildScene();
    this.applyPrototypeText();
    this.startBattleSimulation();
  }

  update(deltaTime: number) {
    try {
      if (!this.previewStarted) {
        this.previewStarted = true;
        this.spawnMonster('small', 0);
        this.spawnMonster('small', 2);
        this.spawnMonster('brute', 4);
      }
      this.updateBattle(Math.min(deltaTime, 0.05));
    } catch (error) {
      console.error('[弓箭原型] 运行时异常，已暂停战斗循环避免预览卡死', error);
      this.battleFinished = true;
      this.enabled = false;
    }
  }

  private ensureCanvasRoot() {
    let transform = this.node.getComponent(UITransform);
    if (!transform) {
      transform = this.node.addComponent(UITransform);
    }
    transform.setContentSize(1280, 720);

    this.node.layer = Layers.Enum.UI_2D;

    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    this.uiCamera = this.ensureUICamera();
    canvas.cameraComponent = this.uiCamera;

    this.node.setPosition(0, 0, 0);
    view.setDesignResolutionSize(1280, 720, 2);
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
    camera.visibility = 0xffffffff;
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 720;
    camera.clearColor = new Color(26, 22, 18, 255);
    return camera;
  }

  private buildScene() {
    this.node.removeAllChildren();
    this.uiCamera = this.ensureUICamera();
    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    canvas.cameraComponent = this.uiCamera;
    this.root = this.createNode('BowPrototypeRoot', this.node, 0, 0, 720, 1280, new Color(26, 22, 18, 255));

    const header = this.createNode('Header', this.root, 0, 585, 690, 74, new Color(52, 37, 28, 255));
    const field = this.createNode('BattleField', this.root, 0, 40, FIELD_WIDTH, 980, new Color(24, 34, 28, 255));
    const footer = this.createNode('Footer', this.root, 0, -585, 690, 70, new Color(44, 32, 24, 255));

    this.titleLabel = this.createLabel('Title', header, -300, 12, '弓箭原型', 30, new Color(255, 229, 170, 255));
    this.roleLabel = this.createLabel('Role', header, -280, -22, '固定站位 · 怪物自上而下', 17, new Color(235, 210, 170, 255));
    this.skillTreeLabel = this.createLabel('SkillTree', header, 90, 12, 'Build：连射 / 穿透 / 元素', 18, new Color(246, 225, 182, 255));
    this.equipmentLabel = this.createLabel('Equipment', header, 90, -18, '装备：+技能 / 攻速 / 暴击 / 穿透', 16, new Color(220, 205, 175, 255));
    this.monsterLabel = this.createLabel('Monster', footer, -320, 0, '怪物：小怪 / 厚血 / 精英', 17, new Color(220, 205, 175, 255));
    this.battleStatusLabel = this.createLabel('BattleStatus', field, -300, 455, '第 1 波  怪物 0  击杀 0  漏怪 0', 18, new Color(212, 238, 190, 255));
    this.fieldLayer = field;
    this.arrowLayer = this.createTransparentLayer('ArrowLayer', field);
    this.monsterLayer = this.createTransparentLayer('MonsterLayer', field);
    this.playerNode = this.createNode('Archer', field, PLAYER_X, PLAYER_Y, 58, 78, new Color(90, 168, 96, 255));
    this.createLabel('ArcherLabel', this.playerNode, -22, 0, '弓', 24, new Color(255, 246, 205, 255));
    this.runHintLabel = this.createLabel('RunHint', footer, 0, 0, 'P0：先看怪物压力、射击节奏和 Build 差异。', 18, new Color(238, 220, 190, 255));
  }

  private applyPrototypeText() {
    this.titleLabel.string = '弓箭防守原型';
    this.roleLabel.string = '怪物自上而下 · 玩家固定在底部';
    this.skillTreeLabel.string = 'Build：连射 / 穿透 / 元素';
    this.equipmentLabel.string = '装备：+技能等级 / 攻速 / 穿透';
    this.monsterLabel.string = 'P0 怪物：小怪 / 厚血 / 精英';
    this.runHintLabel.string = '目标：先验证射击节奏、怪物压力和 Build 差异';
    console.log('[弓箭原型] Build Snapshot', BOW_PROTOTYPE_V0_1.buildSnapshot);
    console.log('[弓箭原型] Battle Simulation', createBowBattleSimulation(BOW_PROTOTYPE_V0_1.buildSnapshot));
  }

  private startBattleSimulation() {
    this.currentWaveIndex = 0;
    this.currentWaveElapsed = 0;
    this.nextGroupSpawnTimes = [];
    this.spawnedGroupCounts = [];
    this.battleElapsed = 0;
    this.shootElapsed = 0;
    this.totalKills = 0;
    this.totalEscaped = 0;
    this.monsters = [];
    this.arrows = [];
    this.battleFinished = false;
    this.prepareWave(BOW_PROTOTYPE_V0_1.monsterPressure.waves[0]);
  }

  private updateBattle(deltaTime: number) {
    if (this.battleFinished || !this.fieldLayer) return;

    const scaledDelta = deltaTime * BATTLE_SPEED_SCALE;
    this.battleElapsed += scaledDelta;
    this.currentWaveElapsed += scaledDelta;
    this.shootElapsed += scaledDelta;

    const wave = BOW_PROTOTYPE_V0_1.monsterPressure.waves[this.currentWaveIndex];
    if (wave) {
      this.spawnWaveGroups(wave);
    }

    this.updateShooting();
    this.updateArrows(scaledDelta);
    this.updateMonsters(scaledDelta);
    this.cleanupDeadObjects();
    this.tryAdvanceWave(wave);
    this.refreshBattleStatus();
  }

  private prepareWave(wave: WaveConfig | undefined) {
    this.currentWaveElapsed = 0;
    this.nextGroupSpawnTimes = [];
    this.spawnedGroupCounts = [];
    if (!wave) return;

    for (let index = 0; index < wave.groups.length; index++) {
      this.nextGroupSpawnTimes[index] = index * 0.8;
      this.spawnedGroupCounts[index] = 0;
    }
  }

  private spawnWaveGroups(wave: WaveConfig) {
    for (let index = 0; index < wave.groups.length; index++) {
      const group = wave.groups[index];
      const spawnedCount = this.spawnedGroupCounts[index] ?? 0;
      const nextTime = this.nextGroupSpawnTimes[index] ?? 0;
      if (spawnedCount >= group.count || this.currentWaveElapsed < nextTime) continue;

      this.spawnMonster(group.monsterId, spawnedCount);
      this.spawnedGroupCounts[index] = spawnedCount + 1;
      this.nextGroupSpawnTimes[index] = nextTime + group.interval;
    }
  }

  private spawnMonster(monsterId: keyof typeof BOW_MONSTERS, spawnIndex: number) {
    const config = BOW_MONSTERS[monsterId];
    const maxHp = P0_BASE_MONSTER_HP * config.hpMultiplier;
    const x = -260 + ((spawnIndex * 83 + this.currentWaveIndex * 47) % 520);
    const size = monsterId === 'elite' ? 46 : monsterId === 'brute' ? 36 : 26;
    const color = monsterId === 'elite' ? new Color(185, 72, 66, 255) : monsterId === 'brute' ? new Color(170, 126, 62, 255) : new Color(104, 122, 86, 255);
    const node = this.createNode(`Monster_${monsterId}`, this.monsterLayer, x, MONSTER_SPAWN_Y, size, size, color);
    this.createLabel('Hp', node, -size / 2, size / 2 + 6, `${Math.round(maxHp)}`, 12, new Color(255, 245, 215, 255));
    this.monsters.push({
      node,
      hp: maxHp,
      maxHp,
      speed: P0_BASE_MONSTER_SPEED * config.speedMultiplier,
      rewardWeight: config.rewardWeight,
      x,
      y: MONSTER_SPAWN_Y,
    });
  }

  private updateShooting() {
    const interval = ATTACK_INTERVAL_SCALE / Math.max(0.2, this.battleRuntime.attacksPerSecond);
    let safetyCount = 0;
    while (this.shootElapsed >= interval && safetyCount < 5) {
      safetyCount++;
      this.shootElapsed -= interval;
      this.fireArrowVolley();
    }
    if (safetyCount >= 5) {
      this.shootElapsed = 0;
    }
  }

  private fireArrowVolley() {
    const target = this.findLeadMonster();
    if (!target) return;

    const arrowCount = Math.max(1, this.battleRuntime.arrowsPerShot);
    for (let index = 0; index < arrowCount; index++) {
      const yOffset = (index - (arrowCount - 1) / 2) * 18;
      const arrow = this.createNode('Arrow', this.arrowLayer, target.x + yOffset, PLAYER_Y + 48, 6, 30, new Color(255, 218, 96, 255));
      this.arrows.push({
        node: arrow,
        x: PLAYER_X + 34,
        y: target.y + yOffset,
        speed: ARROW_SPEED,
        damage: this.rollArrowDamage(),
        pierceLeft: Math.max(0, this.battleRuntime.pierceCount),
        hitMonsters: new Set<RuntimeMonster>(),
      });
    }
  }

  private rollArrowDamage(): number {
    const isCrit = Math.random() < this.battleRuntime.critRate;
    return this.battleRuntime.damagePerArrow * (isCrit ? this.battleRuntime.critDamageMultiplier : 1);
  }

  private findLeadMonster(): RuntimeMonster | null {
    if (this.monsters.length <= 0) return null;
    return this.monsters.reduce((lead, monster) => (monster.y < lead.y ? monster : lead), this.monsters[0]);
  }

  private updateArrows(deltaTime: number) {
    for (const arrow of this.arrows) {
      arrow.y += arrow.speed * deltaTime;
      arrow.node.setPosition(arrow.x, arrow.y, 0);
      for (const monster of this.monsters) {
        if (arrow.hitMonsters.has(monster)) continue;
        if (Math.abs(arrow.x - monster.x) > 18 || Math.abs(arrow.y - monster.y) > 20) continue;
        monster.hp -= arrow.damage;
        arrow.hitMonsters.add(monster);
        this.updateMonsterHpLabel(monster);
        if (arrow.pierceLeft > 0) {
          arrow.pierceLeft--;
        } else {
          arrow.y = ARROW_DESPAWN_Y + 1;
          break;
        }
      }
    }
  }

  private updateMonsters(deltaTime: number) {
    for (const monster of this.monsters) {
      monster.y -= monster.speed * deltaTime;
      monster.node.setPosition(monster.x, monster.y, 0);
      if (monster.y <= MONSTER_END_Y) {
        monster.hp = 0;
        this.totalEscaped++;
      }
    }
  }

  private cleanupDeadObjects() {
    const aliveMonsters: RuntimeMonster[] = [];
    for (const monster of this.monsters) {
      if (monster.hp > 0) {
        aliveMonsters.push(monster);
      } else {
        if (monster.hp <= 0) this.totalKills += monster.rewardWeight;
        monster.node.destroy();
      }
    }
    this.monsters = aliveMonsters;

    const activeArrows: RuntimeArrow[] = [];
    for (const arrow of this.arrows) {
      if (arrow.y <= ARROW_DESPAWN_Y) {
        activeArrows.push(arrow);
      } else {
        arrow.node.destroy();
      }
    }
    this.arrows = activeArrows;
  }

  private tryAdvanceWave(wave: WaveConfig | undefined) {
    if (!wave) return;
    const allGroupsSpawned = wave.groups.every((group, index) => (this.spawnedGroupCounts[index] ?? 0) >= group.count);
    if (!allGroupsSpawned || this.monsters.length > 0) return;

    this.currentWaveIndex++;
    const nextWave = BOW_PROTOTYPE_V0_1.monsterPressure.waves[this.currentWaveIndex];
    if (!nextWave) {
      this.battleFinished = true;
      this.battleStatusLabel.string = `战斗完成：击杀权重 ${this.totalKills}，漏怪 ${this.totalEscaped}，耗时 ${Math.round(this.battleElapsed)} 秒。`;
      return;
    }
    this.prepareWave(nextWave);
  }

  private refreshBattleStatus() {
    if (this.battleFinished) return;
    const wave = BOW_PROTOTYPE_V0_1.monsterPressure.waves[this.currentWaveIndex];
    const waveText = wave ? `第 ${wave.wave}/5 波` : '结算中';
    this.battleStatusLabel.string = `${waveText}  怪物 ${this.monsters.length}  击杀 ${this.totalKills}  漏怪 ${this.totalEscaped}`;
  }

  private updateMonsterHpLabel(monster: RuntimeMonster) {
    const hpNode = monster.node.getChildByName('Hp');
    const hpLabel = hpNode?.getComponent(Label);
    if (hpLabel) {
      hpLabel.string = `${Math.max(0, Math.ceil(monster.hp))}`;
    }
  }

  private createTransparentLayer(name: string, parent: Node) {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(0, 0, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(FIELD_WIDTH, FIELD_HEIGHT);
    return node;
  }

  private createNode(name: string, parent: Node, x: number, y: number, width: number, height: number, color: Color) {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    return node;
  }

  private createLabel(name: string, parent: Node, x: number, y: number, text: string, fontSize: number, color: Color) {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(640, fontSize + 12);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = color;
    label.overflow = Label.Overflow.RESIZE_HEIGHT;
    label.lineHeight = fontSize + 8;
    return label;
  }

  private showMessage(message: string) {
    if (this.runHintLabel) {
      this.runHintLabel.string = message;
    }
    console.log(message);
  }
}
