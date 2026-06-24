import { _decorator, Camera, Canvas, Color, Component, Graphics, Label, Layers, Node, UITransform, Vec3, view } from 'cc';

const { ccclass } = _decorator;

type CellColor = 'white' | 'dark' | 'route';

@ccclass('ReplicaBootstrap')
export class ReplicaBootstrap extends Component {
  private root!: Node;
  private mapLayer!: Node;
  private routeLayer!: Node;
  private darkCellLayer!: Node;
  private whiteCellLayer!: Node;
  private unitLayer!: Node;
  private topLayer!: Node;
  private bottomLayer!: Node;

  start() {
    console.log('[字战三国] ReplicaBootstrap map-layout start');
    this.node.removeAllChildren();
    view.setDesignResolutionSize(720, 1280, 2);
    this.ensureCanvas();
    this.buildPage();
  }

  private ensureCanvas() {
    this.node.layer = Layers.Enum.UI_2D;
    let transform = this.node.getComponent(UITransform);
    if (!transform) transform = this.node.addComponent(UITransform);
    transform.setContentSize(720, 1280);

    const canvas = this.node.getComponent(Canvas) ?? this.node.addComponent(Canvas);
    const cameraNode = new Node('ReplicaUICamera');
    cameraNode.layer = Layers.Enum.UI_2D;
    cameraNode.setParent(this.node);
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.visibility = Layers.Enum.UI_2D;
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 640;
    camera.clearColor = new Color(235, 203, 221, 255);
    canvas.cameraComponent = camera;
  }

  private buildPage() {
    this.root = this.rect('RootBg', this.node, 0, 0, 720, 1280, new Color(236, 204, 224, 255));
    this.mapLayer = this.nodeOnly('MapLayer', this.root, 0, 110, 720, 860);
    this.routeLayer = this.nodeOnly('RouteLayer', this.mapLayer, 0, 0, 720, 860);
    this.darkCellLayer = this.nodeOnly('DarkCellLayer', this.mapLayer, 0, 0, 720, 860);
    this.whiteCellLayer = this.nodeOnly('WhiteCellLayer', this.mapLayer, 0, 0, 720, 860);
    this.unitLayer = this.nodeOnly('UnitLayer', this.mapLayer, 0, 0, 720, 860);
    this.topLayer = this.nodeOnly('TopLayer', this.root, 0, 575, 720, 130);
    this.bottomLayer = this.nodeOnly('BottomLayer', this.root, 0, -505, 720, 270);

    this.buildTopArea();
    this.buildMapArea();
    this.buildBottomArea();
  }

  private buildTopArea() {
    this.iconButton('Pause', this.topLayer, -318, 28, 54, 40, 'Ⅱ', new Color(235, 220, 230, 255), new Color(40, 35, 40, 255));
    this.circle('ResourceIcon', this.topLayer, -248, 28, 18, Color.WHITE);
    this.label('ResourceText', this.topLayer, -205, 28, '20', 30, Color.WHITE);
    this.label('MapName', this.topLayer, 0, 38, '云梦泽', 32, new Color(126, 62, 190, 255));
    this.label('WaveText', this.topLayer, 0, 4, '第1波', 26, Color.WHITE);

    this.rect('ToolCapsule', this.topLayer, 258, 34, 126, 46, new Color(165, 160, 168, 255));
    this.label('ToolDots', this.topLayer, 238, 34, '...', 28, Color.WHITE);
    this.circle('ToolRound', this.topLayer, 298, 34, 18, new Color(220, 220, 225, 255));

    const topIcons = ['农', '速', '手', '土', '酒'];
    for (let i = 0; i < topIcons.length; i++) {
      const x = -160 + i * 80;
      this.circle(`TopSkill_${i}`, this.topLayer, x, -48, 24, new Color(240, 225, 238, 255));
      this.label(`TopSkillText_${i}`, this.topLayer, x, -48, topIcons[i], 20, new Color(80, 60, 75, 255));
    }
  }

  private buildMapArea() {
    this.rect('MapBg', this.mapLayer, 0, 0, 720, 860, new Color(230, 190, 215, 255));
    this.drawRouteBlocks();
    this.drawDarkExtensionCells();
    this.drawWhitePlaceCells();
    this.drawRouteMarksAndArrows();
    this.drawDemoUnits();
  }

  private drawRouteBlocks() {
    const route = new Color(238, 181, 210, 255);
    const blocks = [
      [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3],
      [2, 2], [2, 1], [1, 1], [0, 1], [-1, 1], [-2, 1],
      [-2, 0], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
      [2, -2], [2, -3], [1, -3], [0, -3], [-1, -3], [-2, -3], [-3, -3],
    ];
    for (const [col, row] of blocks) this.mapCell(`Route_${col}_${row}`, col, row, 'route', route);
  }

  private drawDarkExtensionCells() {
    const dark = new Color(202, 107, 165, 255);
    const cells = [
      [-3, 2], [-2, 2], [-1, 2],
      [-3, 1], [-3, 0], [-1, 0], [0, 0], [1, 0],
      [-3, -1], [3, 1], [3, 0], [3, -1],
      [-3, -2], [-2, -2], [-1, -2], [0, -2], [1, -2], [3, -2],
    ];
    for (const [col, row] of cells) this.mapCell(`Dark_${col}_${row}`, col, row, 'dark', dark);
  }

  private drawWhitePlaceCells() {
    const white = new Color(250, 244, 249, 255);
    const topCells = [[-1, 4], [0, 4], [1, 4], [-1, 3], [0, 3], [1, 3]];
    const bottomCells = [[-1, -4], [0, -4], [1, -4], [-1, -3], [0, -3], [1, -3]];
    for (const [col, row] of [...topCells, ...bottomCells]) this.mapCell(`White_${col}_${row}`, col, row, 'white', white);
  }

  private drawRouteMarksAndArrows() {
    this.routeMarker('Entrance', 268, 352);
    this.routeMarker('Exit', -268, -352);
    this.label('ArrowRightA', this.mapLayer, 314, 160, '↓', 34, Color.WHITE);
    this.label('ArrowRightB', this.mapLayer, 314, 95, '↓', 34, Color.WHITE);
    this.label('ArrowLeftA', this.mapLayer, -314, -90, '↑', 34, Color.WHITE);
    this.label('ArrowLeftB', this.mapLayer, -314, -155, '↑', 34, Color.WHITE);
  }

  private routeMarker(name: string, x: number, y: number) {
    this.circle(`${name}_Cloud`, this.mapLayer, x, y, 34, Color.WHITE);
    this.label(`${name}_Heart`, this.mapLayer, x - 8, y + 2, '♥', 22, new Color(230, 60, 90, 255));
    this.label(`${name}_Dou`, this.mapLayer, x + 13, y - 2, '斗', 22, new Color(90, 70, 80, 255));
  }

  private drawDemoUnits() {
    this.placeSoldier('刀', -78, 318, 1);
    this.placeSoldier('弓', 78, 318, 1);
    this.placeSoldier('枪', -78, -318, 1);
    this.placeSoldier('骑', 78, -318, 1);
  }

  private buildBottomArea() {
    this.rect('CampBar', this.bottomLayer, 0, 100, 688, 74, new Color(236, 218, 230, 255));
    this.rect('CampIconBg', this.bottomLayer, -292, 100, 66, 58, new Color(194, 138, 82, 255));
    this.label('CampText', this.bottomLayer, -292, 100, '营', 28, Color.WHITE);
    for (let i = 0; i < 5; i++) {
      const x = -190 + i * 76;
      this.rect(`BenchSlot_${i}`, this.bottomLayer, x, 100, 62, 58, new Color(250, 248, 250, 255));
    }

    this.circle('LeftRoundButton', this.bottomLayer, -218, 4, 46, new Color(28, 24, 25, 255));
    this.label('LeftStone', this.bottomLayer, -218, 4, '石', 24, new Color(80, 80, 82, 255));

    this.circle('RecruitButtonOuter', this.bottomLayer, 0, 6, 74, new Color(223, 113, 38, 255));
    this.circle('RecruitButtonInner', this.bottomLayer, 0, 6, 61, new Color(244, 147, 44, 255));
    this.label('RecruitText', this.bottomLayer, 0, 22, '征兵', 28, Color.WHITE);
    this.label('RecruitCost', this.bottomLayer, 0, -13, '10', 24, Color.WHITE);
    this.circle('RecruitCostIcon', this.bottomLayer, -34, -13, 10, Color.WHITE);

    this.circle('RightRoundButtonOuter', this.bottomLayer, 218, 4, 46, new Color(237, 167, 45, 255));
    this.circle('RightBox', this.bottomLayer, 218, 4, 30, new Color(70, 150, 230, 255));

    const shortcuts = [
      ['铲', ''],
      ['卷', '升职\nLv.1'],
      ['刀', '刀'],
      ['手', ''],
      ['卷', '招贤'],
    ];
    for (let i = 0; i < shortcuts.length; i++) {
      const x = -288 + i * 144;
      this.rect(`Shortcut_${i}`, this.bottomLayer, x, -101, 118, 82, new Color(234, 218, 230, 255));
      this.label(`ShortcutIcon_${i}`, this.bottomLayer, x, -86, shortcuts[i][0], 26, new Color(80, 60, 70, 255));
      if (shortcuts[i][1]) this.label(`ShortcutText_${i}`, this.bottomLayer, x, -118, shortcuts[i][1], 15, new Color(80, 60, 70, 255));
    }
  }

  private mapCell(name: string, col: number, row: number, type: CellColor, color: Color) {
    const size = type === 'route' ? 72 : 68;
    const x = col * 78;
    const y = row * 78;
    const node = this.rect(name, type === 'white' ? this.whiteCellLayer : type === 'dark' ? this.darkCellLayer : this.routeLayer, x, y, size, size, color);
    this.stroke(node, size, size, type === 'white' ? new Color(210, 205, 210, 255) : new Color(160, 80, 135, 255));
  }

  private placeSoldier(word: string, x: number, y: number, level: number) {
    const node = this.rect(`Unit_${word}_${x}_${y}`, this.unitLayer, x, y, 58, 58, new Color(255, 255, 255, 210));
    if (word === '刀') {
      this.label(`UnitLabel_${word}_${x}`, node, 0, 0, '刀', 28, new Color(190, 50, 45, 255));
    } else {
      this.label(`UnitLabel_${word}_${x}`, node, 0, 0, word, 28, new Color(80, 65, 85, 255));
    }
    this.label(`UnitLv_${word}_${x}`, node, 22, -24, `Lv${level}`, 12, new Color(80, 65, 85, 255));
  }

  private iconButton(name: string, parent: Node, x: number, y: number, width: number, height: number, text: string, bg: Color, fg: Color) {
    this.rect(name, parent, x, y, width, height, bg);
    this.label(`${name}Text`, parent, x, y, text, 22, fg);
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

  private circle(name: string, parent: Node, x: number, y: number, radius: number, color: Color): Node {
    const node = this.nodeOnly(name, parent, x, y, radius * 2, radius * 2);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
    return node;
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
