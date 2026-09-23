// 🔮 [진화 무기] 블리자드 (venomBlizzard)
// 독비수(5Lv) + 빙결 보주(5Lv) 합성. 가장 가까운 적을 향해 거대 서리 구체 발사 및 8방향 파편 폭발
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const venomBlizzardWeaponConfig = {
  "id": "venomBlizzard",
  "name": "블리자드",
  "icon": "❄️🧪",
  "iconSprite": "icon_venomblizzard",
  "baseCooldown": 1.8,
  "baseDamage": 45,
  "baseCount": 1,
  "baseArea": 1.0,
  "autoAim": true,
  "desc": "독비수(5Lv) + 빙결 보주(5Lv) 합성. 서리 구체 발사 및 2초 후 폭발하여 8방향 독단검 일제 발사"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['venomBlizzard'] = venomBlizzardWeaponConfig;
}
