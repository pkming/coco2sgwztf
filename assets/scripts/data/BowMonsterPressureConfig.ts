export type MonsterArchetype = 'small' | 'brute' | 'elite';

export interface MonsterConfig {
  id: MonsterArchetype;
  name: string;
  hpMultiplier: number;
  speedMultiplier: number;
  rewardWeight: number;
  role: string;
}

export interface WaveSpawnGroup {
  monsterId: MonsterArchetype;
  count: number;
  interval: number;
}

export interface WaveConfig {
  wave: number;
  goal: string;
  groups: WaveSpawnGroup[];
}

export const BOW_MONSTERS: Record<MonsterArchetype, MonsterConfig> = {
  small: {
    id: 'small',
    name: '小怪',
    hpMultiplier: 1,
    speedMultiplier: 1,
    rewardWeight: 1,
    role: '低血量、大数量，用于验证多重箭和连射清怪效率。',
  },
  brute: {
    id: 'brute',
    name: '厚血怪',
    hpMultiplier: 3.5,
    speedMultiplier: 0.82,
    rewardWeight: 2,
    role: '高血量、中数量，用于验证穿透和暴击对硬目标的价值。',
  },
  elite: {
    id: 'elite',
    name: '精英怪',
    hpMultiplier: 9,
    speedMultiplier: 0.72,
    rewardWeight: 6,
    role: '少量高血量压力点，用于验证单体爆发和 build 成型度。',
  },
};

export const P0_BASE_MONSTER_HP = 30;
export const P0_BASE_MONSTER_SPEED = 36;
export const P0_TARGET_RUN_SECONDS = 180;

export const P0_BOW_WAVES: WaveConfig[] = [
  {
    wave: 1,
    goal: '验证基础箭和连射能否快速清理低血量小怪。',
    groups: [{ monsterId: 'small', count: 10, interval: 0.75 }],
  },
  {
    wave: 2,
    goal: '提高小怪密度，验证攻速和箭矢数量的爽感。',
    groups: [{ monsterId: 'small', count: 18, interval: 0.55 }],
  },
  {
    wave: 3,
    goal: '加入厚血怪，验证穿透箭和暴击路线。',
    groups: [
      { monsterId: 'small', count: 12, interval: 0.5 },
      { monsterId: 'brute', count: 4, interval: 1.4 },
    ],
  },
  {
    wave: 4,
    goal: '混合数量和血量压力，验证三条 build 的差异。',
    groups: [
      { monsterId: 'small', count: 20, interval: 0.45 },
      { monsterId: 'brute', count: 6, interval: 1.15 },
    ],
  },
  {
    wave: 5,
    goal: '首个精英压力点，验证装备和技能树是否能处理硬目标。',
    groups: [
      { monsterId: 'small', count: 16, interval: 0.45 },
      { monsterId: 'brute', count: 4, interval: 1.1 },
      { monsterId: 'elite', count: 1, interval: 0.1 },
    ],
  },
];
