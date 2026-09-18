// 🗡️ [기본 무기] 성수 (holyWater)
// 바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const holyWaterWeaponConfig = {
  "id": "holyWater",
  "name": "성수",
  "icon": "🧪",
  "iconSprite": "icon_holywater",
  "baseCooldown": 2,
  "baseDamage": 14,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['holyWater'] = holyWaterWeaponConfig;
}
