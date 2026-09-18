// 🔮 [진화 무기] 모닝스타 선풍 (morningstarTempest)
// 채찍(5Lv) + 표창(5Lv) 합성. 자동 조준 전후방 교차 타격 및 4방향 십자 표창 폭발
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const morningstarTempestWeaponConfig = {
  "id": "morningstarTempest",
  "name": "모닝스타 선풍",
  "icon": "🪢🥷",
  "iconSprite": "icon_morningstartempest",
  "baseCooldown": 0.95,
  "baseDamage": 52,
  "baseCount": 2,
  "baseArea": 1,
  "autoAim": true,
  "desc": "채찍(5Lv) + 표창(5Lv) 합성. 자동 조준 전후방 교차 타격 및 4방향 십자 표창 폭발"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['morningstarTempest'] = morningstarTempestWeaponConfig;
}
