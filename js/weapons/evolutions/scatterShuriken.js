// 🔮 [진화 무기] 산탄표창 (scatterShuriken)
// 표창(5Lv) + 산탄총(5Lv) 합성. 5발 관통 대형 표창 일제 발사 및 강한 넉백
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const scatterShurikenWeaponConfig = {
  "id": "scatterShuriken",
  "name": "산탄표창",
  "icon": "🎯💥",
  "iconSprite": "icon_scattershuriken",
  "baseCooldown": 0.9,
  "baseDamage": 32,
  "baseCount": 5,
  "baseArea": 1.0,
  "desc": "표창(5Lv) + 산탄총(5Lv) 합성. 전방 부채꼴 5발 관통 대형 표창 일제 발사 및 넉백"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['scatterShuriken'] = scatterShurikenWeaponConfig;
}
