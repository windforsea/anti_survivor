// 🌀🏹 [진화 무기] 태풍의 눈 (cycloneBow)
// 바람 활(5Lv) + 표창(5Lv) 합성. 대형 관통 폭풍 화살을 사격하고 적들을 블랙홀처럼 중심 흡인합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const cycloneBowWeaponConfig = {
  "id": "cycloneBow",
  "name": "태풍의 눈",
  "icon": "🌀🏹",
  "iconSprite": "icon_cyclonebow",
  "baseCooldown": 0.65,
  "baseDamage": 48,
  "baseCount": 1,
  "baseArea": 1.2,
  "autoAim": true,
  "desc": "바람 활(5Lv) + 표창(5Lv) 합성. 초대형 폭풍 화살이 모든 적을 꿰뚫고 중심부로 블랙홀 흡인"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['cycloneBow'] = cycloneBowWeaponConfig;
}
