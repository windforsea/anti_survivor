// 🛡️ [카드 도메인] 14종 인게임 패시브 스탯 카드 정의 풀
// 수정 가이드: 각 패시브의 title, desc, effectText, maxLevel 수치 수정 가능
export const PASSIVE_DEFINITIONS = [
  { id: 'stat_armor', title: '철벽 갑옷', icon: '🛡️', iconKey: 'icon_armor', desc: '받는 피해를 감쇄하고 추가 경감합니다.', effectText: '방어력 +1 & 피해 4% 경감', maxLevel: 5 },
  { id: 'stat_speed', title: '바람의 장화', icon: '👟', iconKey: 'icon_speed', desc: '이동 속도를 증가시킵니다.', effectText: '이동 속도 +10%', maxLevel: 5 },
  { id: 'stat_atk', title: '용기의 반지', icon: '💍', iconKey: 'icon_atk', desc: '모든 무기의 기본 공격력을 강화합니다.', effectText: '공격력 +15%', maxLevel: 5 },
  { id: 'stat_hp', title: '활력의 심장', icon: '❤️', iconKey: 'icon_hp', desc: '최대 체력을 증가시키고 체력을 즉시 회복합니다.', effectText: '최대 체력 +25 HP', maxLevel: 5 },
  { id: 'stat_heal', title: '재생의 브로치', icon: '🌿', iconKey: 'icon_heal', desc: '초당 체력 자동 회복량을 늘립니다.', effectText: '초당 체력 회복 +1.5 HP/s', maxLevel: 5 },
  { id: 'stat_magnet', title: '인력의 자석', icon: '🧲', iconKey: 'icon_magnet', desc: '보석 및 아이템 자석 흡수 범위를 대폭 확장합니다.', effectText: '자석 반경 +35%', maxLevel: 5 },
  { id: 'stat_crown', title: '지혜의 왕관', icon: '👑', iconKey: 'icon_crown', desc: '적 처치 시 획득하는 경험치량을 증폭합니다.', effectText: '경험치 획득량 +15%', maxLevel: 5 },
  { id: 'stat_cooldown', title: '시간의 모래시계', icon: '⌛', iconKey: 'icon_cooldown', desc: '모든 무기의 재사용 대기시간(쿨다운)을 줄입니다.', effectText: '쿨다운 -8%', maxLevel: 5 },
  { id: 'stat_area', title: '증폭의 촛대', icon: '🕯️', iconKey: 'icon_area', desc: '모든 공격과 폭발 및 장판 범위를 넓힙니다.', effectText: '공격 범위 +15%', maxLevel: 3 },
  { id: 'stat_projectile', title: '복제의 고서', icon: '📖', iconKey: 'icon_projectile', desc: '모든 원거리 및 연타 무기의 투사체 수를 늘립니다.', effectText: '모든 무기 투사체 +1개', maxLevel: 2 },
  { id: 'stat_projSpeed', title: '선풍의 날개', icon: '🪶', iconKey: 'icon_projspeed', desc: '모든 투사체의 비행 속도를 증가시킵니다.', effectText: '투사체 탄속 +20%', maxLevel: 5 },
  { id: 'stat_luck', title: '행운의 클로버', icon: '🍀', iconKey: 'icon_clover', desc: '치명타 확률과 고급 카드/아이템 출현 확률을 높입니다.', effectText: '치명타율 +5% & 행운 +15%', maxLevel: 5 },
  { id: 'stat_shield', title: '수호의 방벽', icon: '🛡️✨', iconKey: 'icon_barrier', desc: '주기적으로 피해를 완전히 흡수하는 보호막을 생성합니다.', effectText: '최대 방벽 +20 & 재생주기 단축', maxLevel: 5 },
  { id: 'stat_vampire', title: '흡혈의 송곳니', icon: '🧛', iconKey: 'icon_drain', desc: '적 처치 시 일정 확률로 체력을 즉시 흡수 회복합니다.', effectText: '처치 시 8% 확률로 3 HP 회복', maxLevel: 5 }
];

if (typeof window !== 'undefined') {
  window.PASSIVE_DEFINITIONS = PASSIVE_DEFINITIONS;
}