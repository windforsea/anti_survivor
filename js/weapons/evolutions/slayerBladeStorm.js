// 🔮 [진화 무기] 학살자의 폭풍검 (slayerBladeStorm)
// 철검(5Lv) + 도끼(5Lv) 합성. 플레이어 주위를 초고속 상시 궤도 회전
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const slayerBladeStormWeaponConfig = {
  "id": "slayerBladeStorm",
  "name": "학살자의 폭풍검",
  "icon": "🗡️🪓",
  "iconSprite": "anim_bladewhip",
  "baseCooldown": 0.5,
  "baseDamage": 56,
  "baseCount": 4,
  "baseArea": 1.2,
  "desc": "철검(5Lv) + 도끼(5Lv) 합성. 플레이어 주위를 초고속 상시 궤도 회전"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['slayerBladeStorm'] = slayerBladeStormWeaponConfig;
}
