// 🔮 [진화 무기] 생츄어리 (heavenlySanctuary)
// 성역(5Lv) + 성수(5Lv) 합성. 초대형 결계 및 5% 확률 적 완전 빙결
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const heavenlySanctuaryWeaponConfig = {
  "id": "heavenlySanctuary",
  "name": "생츄어리",
  "icon": "⛪✨",
  "iconSprite": "icon_heavenlysanctuary",
  "baseCooldown": 0.80,
  "baseDamage": 36,
  "baseCount": 1,
  "baseArea": 1.35,
  "desc": "성역(5Lv) + 성수(5Lv) 합성. 초대형 결계 및 5% 확률 적 완전 빙결"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['heavenlySanctuary'] = heavenlySanctuaryWeaponConfig;
}
