// 👤 [UI 도메인] 3종 영웅 선택 명세
export const HERO_CONFIGS = {
  knight: { id: 'knight', name: '방랑 기사 (Alex)', role: 'BALANCE', hp: 120, armor: 1, speed: 220, startWeapon: 'sword', desc: '탄탄한 체력과 견고한 갑옷으로 전선을 사수하는 균형형 전사' },
  mage: { id: 'mage', name: '화염 마도사 (Elena)', role: 'FIRE MAGIC', hp: 80, atkBonus: 0.20, cdBonus: -0.10, speed: 220, startWeapon: 'fireWand', desc: '강력한 원소 마법으로 광역 폭쇄 화력을 쏟아붓는 마도학자' },
  assassin: { id: 'assassin', name: '그림자 암살자 (Kage)', role: 'SHADOW AGILITY', hp: 95, speed: 255, critChance: 0.20, magnetRadius: 155, startWeapon: 'poisonDagger', desc: '극한의 기동성과 치명타로 어둠 속을 누비는 은밀한 살수' },
  cleric: { id: 'cleric', name: '해골 성직자 (Mortis)', role: 'UNDEAD HOLY', hp: 100, speed: 215, hpRegen: 0.6, bonusAreaMult: 1.15, hasRevive: true, startWeapon: 'holyWater', desc: '불사의 저주를 딛고 성스러운 권능으로 전장을 정화하는 사제' }
};

if (typeof window !== 'undefined') {
  window.HERO_CONFIGS = HERO_CONFIGS;
}