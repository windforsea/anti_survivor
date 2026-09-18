// 🗡️ [기본 무기] 마법 화살 (magicMissile)
// 가장 가까운 적을 조준하여 유도 마법탄을 발사합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const magicMissileWeaponConfig = {
  "id": "magicMissile",
  "name": "마법 화살",
  "icon": "🔮",
  "iconSprite": "icon_missile",
  "baseCooldown": 0.55,
  "baseDamage": 25,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 적을 조준하여 유도 마법탄을 발사합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['magicMissile'] = magicMissileWeaponConfig;
}
