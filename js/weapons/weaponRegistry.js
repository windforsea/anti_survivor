// 🗡️ 무기 중앙 레지스트리
import { swordWeaponConfig } from './basic/sword.js';
import { axeWeaponConfig } from './basic/axe.js';
import { whipWeaponConfig } from './basic/whip.js';
import { shurikenWeaponConfig } from './basic/shuriken.js';
import { magicMissileWeaponConfig } from './basic/magicMissile.js';
import { shotgunWeaponConfig } from './basic/shotgun.js';
import { holyWaterWeaponConfig } from './basic/holyWater.js';
import { sanctuaryWeaponConfig } from './basic/sanctuary.js';
import { lightningRingWeaponConfig } from './basic/lightningRing.js';
import { fireWandWeaponConfig } from './basic/fireWand.js';
import { poisonDaggerWeaponConfig } from './basic/poisonDagger.js';
import { frostOrbWeaponConfig } from './basic/frostOrb.js';
import { heavenlySanctuaryWeaponConfig } from './evolutions/heavenlySanctuary.js';
import { morningstarTempestWeaponConfig } from './evolutions/morningstarTempest.js';
import { apocalypseCometWeaponConfig } from './evolutions/apocalypseComet.js';
import { slayerBladeStormWeaponConfig } from './evolutions/slayerBladeStorm.js';
import { teslaShotgunWeaponConfig } from './evolutions/teslaShotgun.js';
import { venomBlizzardWeaponConfig } from './evolutions/venomBlizzard.js';

export const ALL_WEAPON_CONFIGS = {
  sword: swordWeaponConfig,
  axe: axeWeaponConfig,
  whip: whipWeaponConfig,
  shuriken: shurikenWeaponConfig,
  magicMissile: magicMissileWeaponConfig,
  shotgun: shotgunWeaponConfig,
  holyWater: holyWaterWeaponConfig,
  sanctuary: sanctuaryWeaponConfig,
  lightningRing: lightningRingWeaponConfig,
  fireWand: fireWandWeaponConfig,
  poisonDagger: poisonDaggerWeaponConfig,
  frostOrb: frostOrbWeaponConfig,
  heavenlySanctuary: heavenlySanctuaryWeaponConfig,
  morningstarTempest: morningstarTempestWeaponConfig,
  apocalypseComet: apocalypseCometWeaponConfig,
  slayerBladeStorm: slayerBladeStormWeaponConfig,
  teslaShotgun: teslaShotgunWeaponConfig,
  venomBlizzard: venomBlizzardWeaponConfig,
};

if (typeof window !== 'undefined') {
  window.ALL_WEAPON_CONFIGS = ALL_WEAPON_CONFIGS;
}
