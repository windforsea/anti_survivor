// 🔮✨ [진화 무기] 황혼의 나선 (eclipseSpiral)
// 어둠의 보주(5Lv) + 마법 화살(5Lv) 합성. 3개 암흑 나선 보주가 회전하며 주기적으로 유도 공허 유령탄을 난사합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const eclipseSpiralWeaponConfig = {
  "id": "eclipseSpiral",
  "name": "황혼의 나선",
  "icon": "🔮✨",
  "iconSprite": "icon_eclipsespiral",
  "baseCooldown": 0.85,
  "baseDamage": 55,
  "baseCount": 3,
  "baseArea": 1.2,
  "autoAim": false,
  "desc": "어둠의 보주(5Lv) + 마법 화살(5Lv) 합성. 3중 나선 보주 회전 및 주기적 유도 공허 유령탄 방출"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['eclipseSpiral'] = eclipseSpiralWeaponConfig;
}
