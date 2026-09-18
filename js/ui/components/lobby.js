// 🏛️ [UI 도메인] 9종 영구 강화 로비 상점 명세 풀
export const LOBBY_UPGRADES_CONFIG = [
  { id: 'atk', name: '완력 단련', icon: '⚔️', desc: '모든 무기의 기본 공격력이 영구히 증가합니다.', effect: '+5% 공격력', baseCost: 15, costInc: 15, maxLevel: 5 },
  { id: 'maxHp', name: '생명력 강화', icon: '❤️', desc: '캐릭터의 최대 체력이 영구히 증가합니다.', effect: '+10 최대 체력', baseCost: 10, costInc: 10, maxLevel: 5 },
  { id: 'armor', name: '강철 피부', icon: '🛡️', desc: '받는 피해가 영구히 감소합니다.', effect: '+1 방어력', baseCost: 20, costInc: 20, maxLevel: 3 },
  { id: 'speed', name: '신속의 발걸음', icon: '👟', desc: '이동 속도가 영구히 빨라집니다.', effect: '+5% 이동 속도', baseCost: 15, costInc: 15, maxLevel: 5 },
  { id: 'cooldown', name: '정신의 집중', icon: '⌛', desc: '모든 무기의 재사용 대기시간이 단축됩니다.', effect: '-4% 쿨다운', baseCost: 25, costInc: 25, maxLevel: 5 },
  { id: 'area', name: '범위 확장', icon: '🕯️', desc: '공격 및 폭발, 장판의 범위가 영구히 넓어집니다.', effect: '+8% 공격 범위', baseCost: 20, costInc: 20, maxLevel: 3 },
  { id: 'magnet', name: '보석 흡인력', icon: '🧲', desc: '보석 및 아이템 자석 흡수 반경이 증가합니다.', effect: '+20% 자석 반경', baseCost: 10, costInc: 10, maxLevel: 5 },
  { id: 'growth', name: '영웅의 재능', icon: '👑', desc: '적 처치 시 얻는 경험치 획득량이 증가합니다.', effect: '+8% 경험치 획득', baseCost: 20, costInc: 20, maxLevel: 5 },
  { id: 'greed', name: '황금의 탐욕', icon: '🪙', desc: '드랍되는 금화량이 증가합니다.', effect: '+10% 금화 획득', baseCost: 15, costInc: 15, maxLevel: 5 }
];

if (typeof window !== 'undefined') {
  window.LOBBY_UPGRADES_CONFIG = LOBBY_UPGRADES_CONFIG;
}