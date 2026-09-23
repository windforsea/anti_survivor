// 🗡️ [기본 무기] 산탄총 (shotgun)
// 가장 가까운 적을 향해 전방 부채꼴 형태로 여러 발의 산탄을 일제히 사격합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const shotgunWeaponConfig = {
  "id": "shotgun",
  "name": "산탄총",
  "icon": "💥",
  "iconSprite": "icon_holyshotgun",
  "baseCooldown": 1.3,
  "baseDamage": 32,
  "baseCount": 3,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 적을 향해 전방 부채꼴 형태로 여러 발의 산탄을 일제히 사격합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['shotgun'] = shotgunWeaponConfig;
}
