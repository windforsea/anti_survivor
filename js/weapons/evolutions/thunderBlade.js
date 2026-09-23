// 🔮 [진화 무기] 벼락검 (thunderBlade)
// 철검(5Lv) + 번개 반지(5Lv) 합성. 전방 강타 베기 후 즉시 벼락 낙뢰
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const thunderBladeWeaponConfig = {
  "id": "thunderBlade",
  "name": "벼락검",
  "icon": "⚡⚔️",
  "iconSprite": "icon_thunderblade",
  "baseCooldown": 1.0,
  "baseDamage": 45,
  "baseCount": 1,
  "baseArea": 1.2,
  "desc": "철검(5Lv) + 번개 반지(5Lv) 합성. 전방 강타 베기 후 대상에게 벼락 낙뢰"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['thunderBlade'] = thunderBladeWeaponConfig;
}
