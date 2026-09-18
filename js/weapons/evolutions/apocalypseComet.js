// 🔮 [진화 무기] 멸망의 혜성 (apocalypseComet)
// 화염 지팡이(5Lv) + 마법 화살(5Lv) 합성. 초고열 화염 혜성 연속 발사 및 초대형 폭발
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const apocalypseCometWeaponConfig = {
  "id": "apocalypseComet",
  "name": "멸망의 혜성",
  "icon": "🔥🔮",
  "iconSprite": "icon_apocalypsecomet",
  "baseCooldown": 0.85,
  "baseDamage": 62,
  "baseCount": 2,
  "baseArea": 1.4,
  "autoAim": true,
  "desc": "화염 지팡이(5Lv) + 마법 화살(5Lv) 합성. 초고열 화염 혜성 연속 발사 및 초대형 폭발"
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['apocalypseComet'] = apocalypseCometWeaponConfig;
}
