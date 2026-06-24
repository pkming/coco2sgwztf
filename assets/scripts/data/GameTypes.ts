import { Color, Vec3 } from 'cc';

export type WordType = '刀' | '骑' | '弓' | '枪';

export interface UnitData {
  id: string;
  word: WordType;
  level: number;
  dps: number;
  boardIndex: number;
}

export interface WordConfig {
  word: WordType;
  role: string;
  description: string;
  color: Color;
  range: number;
  attackInterval: number;
}

export interface EnemyData {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  rewardGold: number;
}

export const BOARD_COLS = 4;
export const BOARD_ROWS = 4;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS;
export const INITIAL_OPEN_CELLS = 12;
export const MAX_UNIT_LEVEL = 4;
export const START_GOLD = 5;
export const START_LIFE = 3;
export const RECRUIT_COST = 3;
export const DELETE_REFUND = 1;
export const KILL_REWARD = 1;
export const WAVE_WIN_REWARD = 5;

export const LEVEL_DPS: Record<number, number> = {
  1: 6,
  2: 12,
  3: 24,
  4: 48,
  5: 96,
};

export const WORD_CONFIGS: Record<WordType, WordConfig> = {
  刀: {
    word: '刀',
    role: '单体攻击高',
    description: '打高血量单体，适合守漏怪压力点。',
    color: new Color(195, 62, 45, 255),
    range: 120,
    attackInterval: 0.85,
  },
  骑: {
    word: '骑',
    role: '范围攻击',
    description: '打成群敌人，适合拐角和聚怪点。',
    color: new Color(191, 126, 39, 255),
    range: 115,
    attackInterval: 1.15,
  },
  弓: {
    word: '弓',
    role: '远程攻击',
    description: '射程最大，适合覆盖多段路线。',
    color: new Color(46, 116, 190, 255),
    range: 205,
    attackInterval: 1,
  },
  枪: {
    word: '枪',
    role: '穿刺攻击',
    description: '打直线队列，适合长直道。',
    color: new Color(58, 142, 93, 255),
    range: 165,
    attackInterval: 1.05,
  },
};

export const WORD_POOL: WordType[] = ['刀', '骑', '弓', '枪'];

export const BATTLE_PATH: Vec3[] = [
  new Vec3(330, 105, 0),
  new Vec3(115, 105, 0),
  new Vec3(115, 10, 0),
  new Vec3(-115, 10, 0),
  new Vec3(-115, -95, 0),
  new Vec3(-330, -95, 0),
];

let nextId = 1;

export function createId(prefix: string): string {
  const id = `${prefix}_${nextId}`;
  nextId += 1;
  return id;
}

export function getDps(level: number): number {
  return LEVEL_DPS[level] ?? LEVEL_DPS[1];
}

export function pickRandomWord(): WordType {
  return WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
}
