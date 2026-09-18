// 🔮 [진화 무기] 테슬라 뇌전포 (teslaShotgun)
// 산탄 총포(5Lv) + 번개 반지(5Lv) 합성. 가장 가까운 적을 향해 6발 뇌전 탄환 일제 산탄 사격 및 낙뢰 폭격
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const teslaShotgunWeaponConfig = {
  "id": "teslaShotgun",
  "name": "테슬라 뇌전포",
  "icon": "⚡💥",
  "iconSprite": "icon_plasmatempest",
  "baseCooldown": 1.25,
  "baseDamage": 45,
  "baseCount": 6,
  "baseArea": 1.2,
  "autoAim": true,
  "desc": "산탄 총포(5Lv) + 번개 반지(5Lv) 합성. 가장 가까운 적을 향해 6발 뇌전 탄환 일제 산탄 사격 및 낙뢰 폭격"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['teslaShotgun'] = teslaShotgunWeaponConfig;
}
