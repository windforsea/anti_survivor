// 🗡️ [기본 무기] 빙결 보주 (frostOrb)
// 가장 가까운 적 방향으로 서서히 전진하며 냉기 파동을 발산합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const frostOrbWeaponConfig = {
  "id": "frostOrb",
  "name": "빙결 보주",
  "icon": "❄️🔮",
  "iconSprite": "icon_frostorb",
  "baseCooldown": 2.2,
  "baseDamage": 24,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 적 방향으로 서서히 전진하며 냉기 파동을 발산합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['frostOrb'] = frostOrbWeaponConfig;
}
