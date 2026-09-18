// 👾 몬스터 및 보스 중앙 레지스트리
import { batConfig } from './monsters/bat.js';
import { slimeConfig } from './monsters/slime.js';
import { miniSlimeConfig } from './monsters/miniSlime.js';
import { zombieConfig } from './monsters/zombie.js';
import { skeletonConfig } from './monsters/skeleton.js';
import { goblinConfig } from './monsters/goblin.js';
import { ghostConfig } from './monsters/ghost.js';
import { gargoyleConfig } from './monsters/gargoyle.js';
import { cultistConfig } from './monsters/cultist.js';
import { assassinConfig } from './monsters/assassin.js';
import { golemConfig } from './monsters/golem.js';
import { darkMageConfig } from './monsters/darkMage.js';
import { bloodHoundConfig } from './monsters/bloodHound.js';
import { wraithSwarmConfig } from './monsters/wraithSwarm.js';
import { abyssTitanConfig } from './monsters/abyssTitan.js';
import { direBoarBossConfig } from './bosses/direBoar.js';
import { voidSorcererBossConfig } from './bosses/voidSorcerer.js';
import { chaosEyeBossConfig } from './bosses/chaosEye.js';
import { ironcladColossusBossConfig } from './bosses/ironcladColossus.js';
import { lordOfDoomBossConfig } from './bosses/lordOfDoom.js';
import { abyssLichBossConfig } from './bosses/abyssLich.js';
import { grimReaperBossConfig } from './bosses/grimReaper.js';
import { voidWyrmBossConfig } from './bosses/voidWyrm.js';
import { chaosOverlordBossConfig } from './bosses/chaosOverlord.js';
import { redDeathBossConfig } from './bosses/redDeath.js';

export const ENEMY_TYPES = {
  bat: batConfig,
  slime: slimeConfig,
  miniSlime: miniSlimeConfig,
  zombie: zombieConfig,
  skeleton: skeletonConfig,
  goblin: goblinConfig,
  ghost: ghostConfig,
  gargoyle: gargoyleConfig,
  cultist: cultistConfig,
  assassin: assassinConfig,
  golem: golemConfig,
  darkMage: darkMageConfig,
  bloodHound: bloodHoundConfig,
  wraithSwarm: wraithSwarmConfig,
  abyssTitan: abyssTitanConfig,
};

export const BOSS_CONFIGS = {
  2: direBoarBossConfig,
  4: voidSorcererBossConfig,
  6: chaosEyeBossConfig,
  8: ironcladColossusBossConfig,
  10: lordOfDoomBossConfig,
  12: abyssLichBossConfig,
  15: grimReaperBossConfig,
  18: voidWyrmBossConfig,
  20: chaosOverlordBossConfig,
  99: redDeathBossConfig,
};

if (typeof window !== 'undefined') {
  window.ENEMY_TYPES = ENEMY_TYPES;
  window.BOSS_CONFIGS = BOSS_CONFIGS;
}
