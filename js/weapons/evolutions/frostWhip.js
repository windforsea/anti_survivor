// 🔮 [진화 무기] 얼음채찍 (frostWhip)
// 채찍(5Lv) + 빙결 보주(5Lv) 합성. 전후방 냉기 타격 및 피격 적 1초 완전 동결
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const frostWhipWeaponConfig = {
  "id": "frostWhip",
  "name": "얼음채찍",
  "icon": "❄️⛓️",
  "iconSprite": "icon_frostwhip",
  "baseCooldown": 1.1,
  "baseDamage": 38,
  "baseCount": 2,
  "baseArea": 1.2,
  "desc": "채찍(5Lv) + 빙결 보주(5Lv) 합성. 전후방 냉기 타격 및 피격 적 1초 완전 빙결"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['frostWhip'] = frostWhipWeaponConfig;
}
