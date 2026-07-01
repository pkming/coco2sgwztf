import { BowBuildSnapshot, getTotalAttackSpeedPercent, getTotalCritRatePercent, getTotalElementDamagePercent, getTotalPierceCount } from '../data/BowBuildRuntime';
import { BOW_MONSTERS, P0_BASE_MONSTER_HP, P0_BASE_MONSTER_SPEED, P0_BOW_WAVES, WaveConfig } from '../data/BowMonsterPressureConfig';

export interface BowBattleRuntimeStats {
  damagePerArrow: number;
  arrowsPerShot: number;
  attacksPerSecond: number;
  critRate: number;
  critDamageMultiplier: number;
  pierceCount: number;
  elementDamagePercent: number;
  estimatedDps: number;
}

export interface BowWaveSimulationResult {
  wave: number;
  goal: string;
  monsterCount: number;
  totalMonsterHp: number;
  estimatedClearSeconds: number;
  pressureRating: 'safe' | 'tense' | 'danger';
}

export interface BowBattleSimulationResult {
  runtimeStats: BowBattleRuntimeStats;
  waves: BowWaveSimulationResult[];
  summaryLines: string[];
}

const BASE_DAMAGE_PER_ARROW = 18;
const BASE_ATTACKS_PER_SECOND = 0.72;
const BASE_CRIT_DAMAGE_MULTIPLIER = 1.5;
const BASE_ARROW_COUNT = 1;

export function createBowBattleSimulation(build: BowBuildSnapshot): BowBattleSimulationResult {
  const stats = createBowBattleRuntimeStats(build);
  const waves = P0_BOW_WAVES.map((wave) => simulateWave(wave, stats));
  return {
    runtimeStats: stats,
    waves,
    summaryLines: summarizeBattleSimulation(stats, waves),
  };
}

export function createBowBattleRuntimeStats(build: BowBuildSnapshot): BowBattleRuntimeStats {
  const stats = build.stats;
  const baseDamageBonus = stats.skillEffects.baseDamagePercent + stats.skillDamagePercent;
  const elementDamagePercent = getTotalElementDamagePercent(stats);
  const damagePerArrow = BASE_DAMAGE_PER_ARROW * (1 + (baseDamageBonus + elementDamagePercent) / 100);
  const arrowsPerShot = BASE_ARROW_COUNT + stats.extraProjectileCount;
  const attacksPerSecond = BASE_ATTACKS_PER_SECOND * (1 + getTotalAttackSpeedPercent(stats) / 100);
  const critRate = Math.min(0.85, getTotalCritRatePercent(stats) / 100);
  const critDamageMultiplier = BASE_CRIT_DAMAGE_MULTIPLIER + stats.critDamagePercent / 100;
  const pierceCount = getTotalPierceCount(stats);
  const pierceEfficiency = 1 + Math.min(2.2, pierceCount * 0.28);
  const critEfficiency = 1 + critRate * (critDamageMultiplier - 1);
  const estimatedDps = damagePerArrow * arrowsPerShot * attacksPerSecond * pierceEfficiency * critEfficiency;

  return {
    damagePerArrow: round1(damagePerArrow),
    arrowsPerShot,
    attacksPerSecond: round2(attacksPerSecond),
    critRate: round2(critRate),
    critDamageMultiplier: round2(critDamageMultiplier),
    pierceCount,
    elementDamagePercent,
    estimatedDps: round1(estimatedDps),
  };
}

function simulateWave(wave: WaveConfig, stats: BowBattleRuntimeStats): BowWaveSimulationResult {
  let monsterCount = 0;
  let totalMonsterHp = 0;

  for (const group of wave.groups) {
    const monster = BOW_MONSTERS[group.monsterId];
    monsterCount += group.count;
    totalMonsterHp += group.count * P0_BASE_MONSTER_HP * monster.hpMultiplier;
  }

  const estimatedClearSeconds = totalMonsterHp / Math.max(1, stats.estimatedDps);
  const spawnDuration = getWaveSpawnDuration(wave);
  const pressureRatio = estimatedClearSeconds / Math.max(1, spawnDuration + 4);

  return {
    wave: wave.wave,
    goal: wave.goal,
    monsterCount,
    totalMonsterHp: Math.round(totalMonsterHp),
    estimatedClearSeconds: round1(estimatedClearSeconds),
    pressureRating: pressureRatio < 0.7 ? 'safe' : pressureRatio < 1.1 ? 'tense' : 'danger',
  };
}

function getWaveSpawnDuration(wave: WaveConfig): number {
  return wave.groups.reduce((total, group) => total + group.count * group.interval, 0);
}

function summarizeBattleSimulation(stats: BowBattleRuntimeStats, waves: BowWaveSimulationResult[]): string[] {
  const lastWave = waves[waves.length - 1];
  const dangerCount = waves.filter((wave) => wave.pressureRating === 'danger').length;
  return [
    `自动射击：${stats.arrowsPerShot} 箭/次，${stats.attacksPerSecond} 次/秒，估算 DPS ${stats.estimatedDps}`,
    `关键机制：穿透 ${stats.pierceCount}，暴击率 ${Math.round(stats.critRate * 100)}%，元素伤害 +${stats.elementDamagePercent}%`,
    `怪物压力：${waves.length} 波，最终波 ${lastWave.monsterCount} 只怪，总血量 ${lastWave.totalMonsterHp}`,
    `压力评级：${dangerCount > 0 ? `${dangerCount} 波危险，需要装备/技能强化` : '当前样例 build 可通关 P0 压力'}`,
  ];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
