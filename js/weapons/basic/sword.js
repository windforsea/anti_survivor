// 🗡️ [기본 무기] 철검 (sword)
// 가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const swordWeaponConfig = {
  "id": "sword",
  "name": "철검",
  "icon": "🗡️",
  "iconSprite": "anim_sword",
  "baseCooldown": 0.45,
  "baseDamage": 20,
  "baseCount": 1,
  "baseArea": 1,
  "desc": "가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['sword'] = swordWeaponConfig;
}
