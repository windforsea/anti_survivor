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
import { windBowWeaponConfig } from './basic/windBow.js';
import { shadowOrbWeaponConfig } from './basic/shadowOrb.js';
import { heavenlySanctuaryWeaponConfig } from './evolutions/heavenlySanctuary.js';
import { morningstarTempestWeaponConfig } from './evolutions/morningstarTempest.js';
import { apocalypseCometWeaponConfig } from './evolutions/apocalypseComet.js';
import { slayerBladeStormWeaponConfig } from './evolutions/slayerBladeStorm.js';
import { teslaShotgunWeaponConfig } from './evolutions/teslaShotgun.js';
import { venomBlizzardWeaponConfig } from './evolutions/venomBlizzard.js';
import { thunderBladeWeaponConfig } from './evolutions/thunderBlade.js';
import { fireAxeWeaponConfig } from './evolutions/fireAxe.js';
import { frostWhipWeaponConfig } from './evolutions/frostWhip.js';
import { scatterShurikenWeaponConfig } from './evolutions/scatterShuriken.js';
import { holyArrowWeaponConfig } from './evolutions/holyArrow.js';
import { plagueWeaponConfig } from './evolutions/plague.js';
import { cycloneBowWeaponConfig } from './evolutions/cycloneBow.js';
import { eclipseSpiralWeaponConfig } from './evolutions/eclipseSpiral.js';

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
  windBow: windBowWeaponConfig,
  shadowOrb: shadowOrbWeaponConfig,
  heavenlySanctuary: heavenlySanctuaryWeaponConfig,
  morningstarTempest: morningstarTempestWeaponConfig,
  apocalypseComet: apocalypseCometWeaponConfig,
  slayerBladeStorm: slayerBladeStormWeaponConfig,
  teslaShotgun: teslaShotgunWeaponConfig,
  venomBlizzard: venomBlizzardWeaponConfig,
  thunderBlade: thunderBladeWeaponConfig,
  fireAxe: fireAxeWeaponConfig,
  frostWhip: frostWhipWeaponConfig,
  scatterShuriken: scatterShurikenWeaponConfig,
  holyArrow: holyArrowWeaponConfig,
  plague: plagueWeaponConfig,
  cycloneBow: cycloneBowWeaponConfig,
  eclipseSpiral: eclipseSpiralWeaponConfig,
};

if (typeof window !== 'undefined') {
  window.ALL_WEAPON_CONFIGS = ALL_WEAPON_CONFIGS;
}

