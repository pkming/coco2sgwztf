import { BOW_SKILL_LINES, BOW_SKILL_TREE, P0_BOW_SKILL_IDS } from './BowSkillTreeConfig';
import { BUILD_AFFIX_MAPPING, EQUIPMENT_AFFIXES, EQUIPMENT_SLOTS, P0_EQUIPMENT_SLOTS, P0_SAMPLE_EQUIPMENT } from './EquipmentAffixConfig';
import { BOW_MONSTERS, P0_BASE_MONSTER_HP, P0_BASE_MONSTER_SPEED, P0_BOW_WAVES, P0_TARGET_RUN_SECONDS } from './BowMonsterPressureConfig';
import { createP0BowBuildSnapshot } from './BowBuildRuntime';

export const BOW_PROTOTYPE_V0_1 = {
  version: '0.1.0',
  title: '弓箭职业首发玩法原型',
  role: '固定站位弓箭主角，依靠职业技能树、装备词条和局内强化抵御怪物进攻。',
  skillTree: {
    lines: BOW_SKILL_LINES,
    skills: BOW_SKILL_TREE,
    p0SkillIds: P0_BOW_SKILL_IDS,
  },
  equipment: {
    affixes: EQUIPMENT_AFFIXES,
    slots: EQUIPMENT_SLOTS,
    p0Slots: P0_EQUIPMENT_SLOTS,
    buildAffixMapping: BUILD_AFFIX_MAPPING,
    samples: P0_SAMPLE_EQUIPMENT,
  },
  monsterPressure: {
    baseHp: P0_BASE_MONSTER_HP,
    baseSpeed: P0_BASE_MONSTER_SPEED,
    targetRunSeconds: P0_TARGET_RUN_SECONDS,
    monsters: BOW_MONSTERS,
    waves: P0_BOW_WAVES,
  },
  buildSnapshot: createP0BowBuildSnapshot(),
} as const;

export type BowPrototypeConfig = typeof BOW_PROTOTYPE_V0_1;
