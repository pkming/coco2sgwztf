export type BowSkillLine = 'rapid' | 'pierce' | 'elemental';

export type SkillEffectType =
  | 'baseDamagePercent'
  | 'attackSpeedPercent'
  | 'critRatePercent'
  | 'pierceCount'
  | 'elementDamagePercent';

export interface SkillLevelEffect {
  type: SkillEffectType;
  baseValue: number;
  valuePerLevel: number;
}

export interface BowSkillConfig {
  id: string;
  name: string;
  line: BowSkillLine;
  tier: number;
  maxLevel: number;
  prerequisites: string[];
  description: string;
  p0: boolean;
  effects: SkillLevelEffect[];
  buildTags: string[];
}

export const BOW_SKILL_LINES: Record<BowSkillLine, { name: string; role: string }> = {
  rapid: {
    name: '多重箭 / 连射',
    role: '通过攻速和箭矢密度压制大量低血量怪物。',
  },
  pierce: {
    name: '穿透 / 狙击',
    role: '通过单箭质量、穿透和暴击处理厚血目标。',
  },
  elemental: {
    name: '元素箭',
    role: '通过元素附加形成持续伤害、控制和范围变化。',
  },
};

export const BOW_SKILL_TREE: BowSkillConfig[] = [
  {
    id: 'basic_arrow',
    name: '基础箭',
    line: 'rapid',
    tier: 1,
    maxLevel: 5,
    prerequisites: [],
    description: '提升基础箭伤害，是弓箭职业最早的稳定输出节点。',
    p0: true,
    effects: [{ type: 'baseDamagePercent', baseValue: 8, valuePerLevel: 8 }],
    buildTags: ['starter', 'damage'],
  },
  {
    id: 'rapid_shot',
    name: '连射',
    line: 'rapid',
    tier: 2,
    maxLevel: 5,
    prerequisites: ['basic_arrow'],
    description: '提高射击频率，用更高攻击节奏清理小怪。',
    p0: true,
    effects: [{ type: 'attackSpeedPercent', baseValue: 10, valuePerLevel: 6 }],
    buildTags: ['rapid', 'attack_speed'],
  },
  {
    id: 'aimed_shot',
    name: '瞄准射击',
    line: 'pierce',
    tier: 1,
    maxLevel: 5,
    prerequisites: [],
    description: '提升单发命中质量，为穿透和狙击路线提供基础。',
    p0: true,
    effects: [{ type: 'critRatePercent', baseValue: 5, valuePerLevel: 3 }],
    buildTags: ['starter', 'crit'],
  },
  {
    id: 'piercing_arrow',
    name: '穿透箭',
    line: 'pierce',
    tier: 2,
    maxLevel: 5,
    prerequisites: ['aimed_shot'],
    description: '箭矢可以穿透目标，适合处理纵向队列和厚血压力。',
    p0: true,
    effects: [{ type: 'pierceCount', baseValue: 1, valuePerLevel: 1 }],
    buildTags: ['pierce', 'elite'],
  },
  {
    id: 'elemental_infusion',
    name: '元素附着',
    line: 'elemental',
    tier: 1,
    maxLevel: 5,
    prerequisites: [],
    description: '让普通箭附加元素伤害，是元素箭路线的入口。',
    p0: true,
    effects: [{ type: 'elementDamagePercent', baseValue: 10, valuePerLevel: 8 }],
    buildTags: ['starter', 'elemental'],
  },
];

export const P0_BOW_SKILL_IDS = BOW_SKILL_TREE.filter((skill) => skill.p0).map((skill) => skill.id);

export function getBowSkillConfig(skillId: string): BowSkillConfig | undefined {
  return BOW_SKILL_TREE.find((skill) => skill.id === skillId);
}

export function getEffectiveSkillLevel(baseLevel: number, skillLevelBonus = 0, allBowSkillLevelBonus = 0): number {
  return Math.max(0, baseLevel + skillLevelBonus + allBowSkillLevelBonus);
}

export function getSkillEffectValue(effect: SkillLevelEffect, effectiveLevel: number): number {
  if (effectiveLevel <= 0) return 0;
  return effect.baseValue + effect.valuePerLevel * (effectiveLevel - 1);
}
