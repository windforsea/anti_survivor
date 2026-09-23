// 🔮 [진화 무기] 역병 (plague)
// 독비수(5Lv) + 성역(5Lv) 합성. 360도 독기 결계로 지속 중독 및 30초마다 화면 전체 대폭발
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const plagueWeaponConfig = {
  "id": "plague",
  "name": "역병",
  "icon": "☣️💀",
  "iconSprite": "icon_plague",
  "baseCooldown": 0.4,
  "baseDamage": 22,
  "baseCount": 1,
  "baseArea": 1.5,
  "desc": "독비수(5Lv) + 성역(5Lv) 합성. 독기 결계로 지속 중독 및 30초마다 화면 전체 대폭발"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['plague'] = plagueWeaponConfig;
}
