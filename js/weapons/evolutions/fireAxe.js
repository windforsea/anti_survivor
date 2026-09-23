// 🔮 [진화 무기] 화염도끼 (fireAxe)
// 도끼(5Lv) + 불 지팡이(5Lv) 합성. 360도 도끼 회전 후 4방향 화염구 폭발
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const fireAxeWeaponConfig = {
  "id": "fireAxe",
  "name": "화염도끼",
  "icon": "🪓🔥",
  "iconSprite": "icon_fireaxe",
  "baseCooldown": 1.2,
  "baseDamage": 40,
  "baseCount": 4,
  "baseArea": 1.2,
  "desc": "도끼(5Lv) + 불 지팡이(5Lv) 합성. 도끼 360도 회전 후 4방향 화염구 폭발"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['fireAxe'] = fireAxeWeaponConfig;
}
