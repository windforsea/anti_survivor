// 🔮 [진화 무기] 신성화살 (holyArrow)
// 마법 화살(5Lv) + 성수(5Lv) 합성. 유도 신성 화살 발사 후 착탄 장판 생성
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const holyArrowWeaponConfig = {
  "id": "holyArrow",
  "name": "신성화살",
  "icon": "🏹✨",
  "iconSprite": "icon_holyarrow",
  "baseCooldown": 1.2,
  "baseDamage": 35,
  "baseCount": 2,
  "baseArea": 1.2,
  "desc": "마법 화살(5Lv) + 성수(5Lv) 합성. 유도 신성 화살 발사 후 착탄 위치 3초 정화 장판 생성"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['holyArrow'] = holyArrowWeaponConfig;
}
