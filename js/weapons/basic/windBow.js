// 🏹💨 [기본 무기] 바람 활 (windBow)
// 직선으로 쾌속 관통 바람 화살을 사격하여 적을 밀쳐냅니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const windBowWeaponConfig = {
  "id": "windBow",
  "name": "바람 활",
  "icon": "🏹💨",
  "iconSprite": "icon_windbow",
  "baseCooldown": 0.60,
  "baseDamage": 32,
  "baseCount": 1,
  "baseArea": 1.0,
  "autoAim": true,
  "desc": "직선으로 쾌속 관통 바람 화살을 사격하여 적을 밀쳐냅니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['windBow'] = windBowWeaponConfig;
}
