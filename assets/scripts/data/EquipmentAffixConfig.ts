export type EquipmentSlot = 'weapon' | 'amulet' | 'ring' | 'gloves';

export type AffixId =
  | 'skill_level'
  | 'all_bow_skill_level'
  | 'skill_damage_percent'
  | 'attack_speed_percent'
  | 'crit_rate_percent'
  | 'crit_damage_percent'
  | 'pierce_count'
  | 'extra_projectile_count'
  | 'element_damage_percent';

export type AffixWeight = 'high' | 'medium' | 'low';

export interface AffixConfig {
  id: AffixId;
  name: string;
  description: string;
  weight: AffixWeight;
  minValue: number;
  maxValue: number;
  integerOnly: boolean;
  buildTags: string[];
}

export interface EquipmentSlotConfig {
  slot: EquipmentSlot;
  name: string;
  mainRole: string;
  affixPool: AffixId[];
}

export interface EquipmentAffixRoll {
  affixId: AffixId;
  value: number;
  skillId?: string;
  elementId?: 'fire' | 'ice' | 'lightning';
}

export interface EquipmentItemConfig {
  id: string;
  name: string;
  slot: EquipmentSlot;
  affixes: EquipmentAffixRoll[];
}

export const EQUIPMENT_AFFIXES: Record<AffixId, AffixConfig> = {
  skill_level: {
    id: 'skill_level',
    name: '+技能等级',
    description: '提升指定技能等级，只强化已经拥有的职业技能。',
    weight: 'high',
    minValue: 1,
    maxValue: 2,
    integerOnly: true,
    buildTags: ['skill', 'specialized'],
  },
  all_bow_skill_level: {
    id: 'all_bow_skill_level',
    name: '+全部弓箭技能',
    description: '提升所有弓箭职业技能等级。',
    weight: 'high',
    minValue: 1,
    maxValue: 1,
    integerOnly: true,
    buildTags: ['skill', 'bow'],
  },
  skill_damage_percent: {
    id: 'skill_damage_percent',
    name: '技能伤害%',
    description: '提升指定技能、指定系别或全部技能伤害。',
    weight: 'high',
    minValue: 8,
    maxValue: 30,
    integerOnly: true,
    buildTags: ['damage'],
  },
  attack_speed_percent: {
    id: 'attack_speed_percent',
    name: '攻击速度%',
    description: '提高普通攻击和技能释放频率。',
    weight: 'high',
    minValue: 6,
    maxValue: 20,
    integerOnly: true,
    buildTags: ['rapid', 'tempo'],
  },
  crit_rate_percent: {
    id: 'crit_rate_percent',
    name: '暴击率%',
    description: '提高暴击触发概率。',
    weight: 'medium',
    minValue: 3,
    maxValue: 12,
    integerOnly: true,
    buildTags: ['crit', 'pierce'],
  },
  crit_damage_percent: {
    id: 'crit_damage_percent',
    name: '暴击伤害%',
    description: '提高暴击时的额外伤害。',
    weight: 'medium',
    minValue: 15,
    maxValue: 60,
    integerOnly: true,
    buildTags: ['crit', 'elite'],
  },
  pierce_count: {
    id: 'pierce_count',
    name: '穿透次数',
    description: '提高箭矢可额外穿透的目标数量。',
    weight: 'medium',
    minValue: 1,
    maxValue: 2,
    integerOnly: true,
    buildTags: ['pierce'],
  },
  extra_projectile_count: {
    id: 'extra_projectile_count',
    name: '箭矢数量',
    description: '增加单次射击发射的额外箭矢数量。',
    weight: 'low',
    minValue: 1,
    maxValue: 1,
    integerOnly: true,
    buildTags: ['rapid', 'projectile'],
  },
  element_damage_percent: {
    id: 'element_damage_percent',
    name: '元素伤害%',
    description: '提升火、冰、雷等元素箭伤害。',
    weight: 'medium',
    minValue: 8,
    maxValue: 30,
    integerOnly: true,
    buildTags: ['elemental'],
  },
};

export const EQUIPMENT_SLOTS: Record<EquipmentSlot, EquipmentSlotConfig> = {
  weapon: {
    slot: 'weapon',
    name: '武器',
    mainRole: '主输出位，承载最强 build 词条。',
    affixPool: ['all_bow_skill_level', 'skill_damage_percent', 'attack_speed_percent', 'pierce_count', 'extra_projectile_count', 'element_damage_percent'],
  },
  amulet: {
    slot: 'amulet',
    name: '项链',
    mainRole: '技能提升位，作为通用 build 放大器。',
    affixPool: ['skill_level', 'all_bow_skill_level', 'skill_damage_percent', 'crit_rate_percent', 'crit_damage_percent'],
  },
  ring: {
    slot: 'ring',
    name: '戒指',
    mainRole: '暴击与攻击节奏位，补足输出曲线。',
    affixPool: ['attack_speed_percent', 'crit_rate_percent', 'crit_damage_percent', 'element_damage_percent', 'skill_damage_percent'],
  },
  gloves: {
    slot: 'gloves',
    name: '手套',
    mainRole: '攻击节奏位，强化攻速、箭矢数量和穿透。',
    affixPool: ['attack_speed_percent', 'crit_rate_percent', 'extra_projectile_count', 'pierce_count'],
  },
};

export const P0_EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'amulet', 'ring', 'gloves'];

export const BUILD_AFFIX_MAPPING = {
  rapid: ['attack_speed_percent', 'extra_projectile_count', 'skill_level', 'skill_damage_percent'],
  pierce: ['pierce_count', 'crit_rate_percent', 'crit_damage_percent', 'skill_level'],
  elemental: ['element_damage_percent', 'skill_level', 'skill_damage_percent', 'attack_speed_percent'],
} satisfies Record<string, AffixId[]>;

export const P0_SAMPLE_EQUIPMENT: EquipmentItemConfig[] = [
  {
    id: 'short_bow_of_rapid_shot',
    name: '连射短弓',
    slot: 'weapon',
    affixes: [
      { affixId: 'attack_speed_percent', value: 12 },
      { affixId: 'skill_damage_percent', value: 15, skillId: 'rapid_shot' },
    ],
  },
  {
    id: 'piercing_gloves',
    name: '穿透手套',
    slot: 'gloves',
    affixes: [
      { affixId: 'pierce_count', value: 1 },
      { affixId: 'crit_rate_percent', value: 6 },
    ],
  },
  {
    id: 'amulet_of_bow_skills',
    name: '弓术项链',
    slot: 'amulet',
    affixes: [{ affixId: 'all_bow_skill_level', value: 1 }],
  },
];
