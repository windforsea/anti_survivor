// 🗡️ [기본 무기] 맹독 비수 (poisonDagger)
// 가장 가까운 적을 자동 조준하여 독비수를 쾌속 연사합니다.
// 수정 가이드: baseCooldown(쿨타임), baseDamage(공격력), baseCount(투사체수), baseArea(공격범위)

export const poisonDaggerWeaponConfig = {
  "id": "poisonDagger",
  "name": "맹독 비수",
  "icon": "🗡️🧪",
  "iconSprite": "icon_poisondagger",
  "baseCooldown": 0.48,
  "baseDamage": 18,
  "baseCount": 1,
  "baseArea": 1,
  "autoAim": true,
  "desc": "가장 가까운 적을 자동 조준하여 독비수를 쾌속 연사합니다."
};

if (typeof window !== 'undefined') {
  window.WeaponConfigs = window.WeaponConfigs || {};
  window.WeaponConfigs['poisonDagger'] = poisonDaggerWeaponConfig;
}
