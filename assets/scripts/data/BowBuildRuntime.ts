import { BOW_SKILL_TREE, getEffectiveSkillLevel, getSkillEffectValue, SkillEffectType } from './BowSkillTreeConfig';
import { EquipmentAffixRoll, EquipmentItemConfig, P0_SAMPLE_EQUIPMENT } from './EquipmentAffixConfig';

export type SkillLevelMap = Record<string, number>;
export type SkillEffectTotals = Record<SkillEffectType, number>;

export interface BowBuildStats {
  skillLevels: SkillLevelMap;
  allBowSkillLevelBonus: number;
  skillLevelBonus: SkillLevelMap;
  skillDamagePercent: number;
  attackSpeedPercent: number;
  critRatePercent: number;
  critDamagePercent: number;
  pierceCount: number;
  extraProjectileCount: number;
  elementDamagePercent: number;
  skillEffects: SkillEffectTotals;
}

export interface BowBuildSnapshot {
  stats: BowBuildStats;
  equippedItems: EquipmentItemConfig[];
  summaryLines: string[];
}

export const P0_STARTER_SKILL_LEVELS: SkillLevelMap = {
  basic_arrow: 1,
  rapid_shot: 1,
  aimed_shot: 1,
  piercing_arrow: 1,
  elemental_infusion: 1,
};

export function createEmptyBowBuildStats(skillLevels: SkillLevelMap = {}): BowBuildStats {
  return {
    skillLevels: { ...skillLevels },
    allBowSkillLevelBonus: 0,
    skillLevelBonus: {},
    skillDamagePercent: 0,
    attackSpeedPercent: 0,
    critRatePercent: 0,
    critDamagePercent: 0,
    pierceCount: 0,
    extraProjectileCount: 0,
    elementDamagePercent: 0,
    skillEffects: {
      baseDamagePercent: 0,
      attackSpeedPercent: 0,
      critRatePercent: 0,
      pierceCount: 0,
      elementDamagePercent: 0,
    },
  };
}

export function applyEquipmentItem(stats: BowBuildStats, item: EquipmentItemConfig): void {
  for (const affix of item.affixes) {
    applyEquipmentAffix(stats, affix);
  }
}

export function applyEquipmentAffix(stats: BowBuildStats, affix: EquipmentAffixRoll): void {
  switch (affix.affixId) {
    case 'skill_level':
      if (!affix.skillId) return;
      stats.skillLevelBonus[affix.skillId] = (stats.skillLevelBonus[affix.skillId] ?? 0) + affix.value;
      return;
    case 'all_bow_skill_level':
      stats.allBowSkillLevelBonus += affix.value;
      return;
    case 'skill_damage_percent':
      stats.skillDamagePercent += affix.value;
      return;
    case 'attack_speed_percent':
      stats.attackSpeedPercent += affix.value;
      return;
    case 'crit_rate_percent':
      stats.critRatePercent += affix.value;
      return;
    case 'crit_damage_percent':
      stats.critDamagePercent += affix.value;
      return;
    case 'pierce_count':
      stats.pierceCount += affix.value;
      return;
    case 'extra_projectile_count':
      stats.extraProjectileCount += affix.value;
      return;
    case 'element_damage_percent':
      stats.elementDamagePercent += affix.value;
      return;
  }
}

export function calculateSkillEffects(stats: BowBuildStats): SkillEffectTotals {
  const totals: SkillEffectTotals = {
    baseDamagePercent: 0,
    attackSpeedPercent: 0,
    critRatePercent: 0,
    pierceCount: 0,
    elementDamagePercent: 0,
  };

  for (const skill of BOW_SKILL_TREE) {
    const baseLevel = stats.skillLevels[skill.id] ?? 0;
    const skillBonus = stats.skillLevelBonus[skill.id] ?? 0;
    const effectiveLevel = getEffectiveSkillLevel(baseLevel, skillBonus, stats.allBowSkillLevelBonus);
    if (effectiveLevel <= 0) continue;

    for (const effect of skill.effects) {
      totals[effect.type] += getSkillEffectValue(effect, effectiveLevel);
    }
  }

  stats.skillEffects = totals;
  return totals;
}

export function createP0BowBuildSnapshot(
  skillLevels: SkillLevelMap = P0_STARTER_SKILL_LEVELS,
  equipment: EquipmentItemConfig[] = P0_SAMPLE_EQUIPMENT,
): BowBuildSnapshot {
  const stats = createEmptyBowBuildStats(skillLevels);
  for (const item of equipment) {
    applyEquipmentItem(stats, item);
  }
  calculateSkillEffects(stats);

  return {
    stats,
    equippedItems: equipment,
    summaryLines: summarizeBowBuild(stats, equipment),
  };
}

export function getTotalAttackSpeedPercent(stats: BowBuildStats): number {
  return stats.attackSpeedPercent + stats.skillEffects.attackSpeedPercent;
}

export function getTotalCritRatePercent(stats: BowBuildStats): number {
  return stats.critRatePercent + stats.skillEffects.critRatePercent;
}

export function getTotalPierceCount(stats: BowBuildStats): number {
  return stats.pierceCount + Math.floor(stats.skillEffects.pierceCount);
}

export function getTotalElementDamagePercent(stats: BowBuildStats): number {
  return stats.elementDamagePercent + stats.skillEffects.elementDamagePercent;
}

export function summarizeBowBuild(stats: BowBuildStats, equipment: EquipmentItemConfig[]): string[] {
  return [
    `装备 ${equipment.length} 件：${equipment.map((item) => item.name).join(' / ')}`,
    `技能加成：全部弓箭技能 +${stats.allBowSkillLevelBonus}，技能伤害 +${stats.skillDamagePercent}%`,
    `输出节奏：攻速 +${getTotalAttackSpeedPercent(stats)}%，暴击率 +${getTotalCritRatePercent(stats)}%`,
    `箭矢机制：穿透 ${getTotalPierceCount(stats)}，额外箭矢 ${stats.extraProjectileCount}`,
    `元素方向：元素伤害 +${getTotalElementDamagePercent(stats)}%`,
  ];
}
