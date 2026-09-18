// 🗡️ [기본 무기] 표창 (shuriken)
// 가장 가까운 몬스터를 향해 관통 표창을 던집니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const shurikenWeaponConfig = {
  "id": "shuriken",
  "name": "표창",
  "icon": "🥷",
  "iconSprite": "icon_shuriken",
  "baseCooldown": 0.42,
  "baseDamage": 24,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 몬스터를 향해 관통 표창을 던집니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['shuriken'] = shurikenWeaponConfig;
}
