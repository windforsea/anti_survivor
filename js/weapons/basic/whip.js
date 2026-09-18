// 🗡️ [기본 무기] 채찍 (whip)
// 가장 가까운 적을 자동 조준하여 휘두르고 교차 강타합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const whipWeaponConfig = {
  "id": "whip",
  "name": "채찍",
  "icon": "🪢",
  "iconSprite": "icon_whip",
  "baseCooldown": 0.95,
  "baseDamage": 44,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 적을 자동 조준하여 휘두르고 교차 강타합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['whip'] = whipWeaponConfig;
}
