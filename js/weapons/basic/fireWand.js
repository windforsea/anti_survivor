// 🗡️ [기본 무기] 화염 지팡이 (fireWand)
// 적을 향해 화염구를 발사하여 착탄 시 폭발 화염 피해를 입힙니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const fireWandWeaponConfig = {
  "id": "fireWand",
  "name": "화염 지팡이",
  "icon": "🔥",
  "iconSprite": "icon_firewand",
  "baseCooldown": 1,
  "baseDamage": 36,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "적을 향해 화염구를 발사하여 착탄 시 폭발 화염 피해를 입힙니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['fireWand'] = fireWandWeaponConfig;
}
