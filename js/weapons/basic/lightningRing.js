// 🗡️ [기본 무기] 번개 반지 (lightningRing)
// 무작위 적에게 하늘에서 벼락을 내리꽂아 지면 폭발 피해를 입힙니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const lightningRingWeaponConfig = {
  "id": "lightningRing",
  "name": "번개 반지",
  "icon": "⚡",
  "iconSprite": "icon_lightning",
  "baseCooldown": 1.1,
  "baseDamage": 42,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "무작위 적에게 하늘에서 벼락을 내리꽂아 지면 폭발 피해를 입힙니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['lightningRing'] = lightningRingWeaponConfig;
}
