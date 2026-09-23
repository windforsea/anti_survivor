// 🔮🖤 [기본 무기] 어둠의 보주 (shadowOrb)
// 플레이어 주변을 공전하며 적에게 지속 암흑 피해를 입힙니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const shadowOrbWeaponConfig = {
  "id": "shadowOrb",
  "name": "어둠의 보주",
  "icon": "🔮🖤",
  "iconSprite": "icon_shadoworb",
  "baseCooldown": 1.10,
  "baseDamage": 34,
  "baseCount": 2,
  "baseArea": 1.0,
  "autoAim": false,
  "desc": "플레이어 주변을 공전하며 적에게 지속 암흑 피해를 입힙니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['shadowOrb'] = shadowOrbWeaponConfig;
}
