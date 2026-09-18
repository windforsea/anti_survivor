// 🗡️ [기본 무기] 성역 (sanctuary)
// 플레이어 중심 360도 원형 결계로 적들에게 매초 지속 도트 피해를 입힙니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const sanctuaryWeaponConfig = {
  "id": "sanctuary",
  "name": "성역",
  "icon": "⛪",
  "iconSprite": "icon_arcanesanctuary",
  "baseCooldown": 1,
  "baseDamage": 28,
  "baseCount": 1,
  "baseArea": 1,
  "desc": "플레이어 중심 360도 원형 결계로 적들에게 매초 지속 도트 피해를 입힙니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['sanctuary'] = sanctuaryWeaponConfig;
}
