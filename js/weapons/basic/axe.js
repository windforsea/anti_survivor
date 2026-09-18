// 🗡️ [기본 무기] 도끼 (axe)
// 플레이어 주변을 크게 원형으로 베어내며 적을 밀쳐냅니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const axeWeaponConfig = {
  "id": "axe",
  "name": "도끼",
  "icon": "🪓",
  "iconSprite": "anim_axe",
  "baseCooldown": 1.1,
  "baseDamage": 55,
  "baseCount": 1,
  "baseArea": 1,
  "desc": "플레이어 주변을 크게 원형으로 베어내며 적을 밀쳐냅니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['axe'] = axeWeaponConfig;
}
