// Anti Survivors - 몬스터 스펙 데이터 테이블 (js/enemyData.js)
// [밸런스 패치]
// 1. 기본 HP를 상향된 무기 공격력에 맞춰 +30%~45% 재조정
// 2. 이동 속도 15%~25% 상향 및 공격력 30%~50% 상향 (제자리 정지 시 2~3초 내 포위 사망 압박감 부여)

// [월드 1: 심연의 부유섬 몬스터 15종 스펙]
const ENEMY_TYPES_W1 = {
  bat: { name: '박쥐', hp: 16, speed: 195, radius: 10, color: '#a855f7', exp: 2, damage: 8, isFlying: true },
  slime: { name: '슬라임', hp: 24, speed: 105, radius: 13, color: '#22c55e', exp: 3, damage: 10, isFlying: false },
  miniSlime: { name: '아기 슬라임', hp: 6, speed: 85, radius: 8, color: '#4ade80', exp: 1, damage: 5, isFlying: false },
  zombie: { name: '좀비', hp: 56, speed: 85, radius: 15, color: '#64748b', exp: 3, damage: 16, knockbackResist: 0.50, isFlying: false },
  skeleton: { name: '해골', hp: 46, speed: 130, radius: 13, color: '#f1f5f9', exp: 4, damage: 14, isFlying: false },
  goblin: { name: '고블린', hp: 56, speed: 175, radius: 12, color: '#84cc16', exp: 5, damage: 14, isFlying: false },
  ghost: { name: '유령', hp: 80, speed: 140, radius: 15, color: '#38bdf8', exp: 6, damage: 15, alpha: 0.65, isFlying: true },
  gargoyle: { name: '가고일', hp: 155, speed: 105, radius: 18, color: '#78716c', exp: 7, damage: 24, knockbackResist: 0.40, isFlying: true },
  cultist: { name: '흑마술사', hp: 135, speed: 115, radius: 14, color: '#dc2626', exp: 9, damage: 20, isRanged: true, isFlying: false },
  assassin: { name: '암살자', hp: 82, speed: 190, radius: 13, color: '#18181b', exp: 11, damage: 18, isFlying: false },
  golem: { name: '골렘', hp: 400, speed: 70, radius: 24, color: '#d97706', exp: 25, damage: 38, knockbackResist: 0.88, isFlying: false },
  darkMage: { name: '타락한 마도사', hp: 185, speed: 115, radius: 14, color: '#7e22ce', exp: 12, damage: 24, isRanged: true, isFlying: true },
  bloodHound: { name: '핏빛 사냥개', hp: 150, speed: 240, radius: 12, color: '#dc2626', exp: 10, damage: 26, knockbackResist: 0.40, isFlying: false },
  wraithSwarm: { name: '망령 군단', hp: 75, speed: 175, radius: 11, color: '#06b6d4', exp: 5, damage: 16, alpha: 0.70, isFlying: true },
  abyssTitan: { name: '심연의 거인', hp: 600, speed: 75, radius: 28, color: '#1e1b4b', exp: 28, damage: 45, knockbackResist: 0.75, isFlying: false }
};

// [월드 2: 심해 대협곡 몬스터 15종 스펙]
const ENEMY_TYPES_W2 = {
  plankton: { name: '발광 플랑크톤', hp: 12, speed: 180, radius: 8, color: '#67e8f9', exp: 2, damage: 8, isFlying: true },
  jellyfish: { name: '청록 해파리', hp: 24, speed: 105, radius: 12, color: '#22d3ee', exp: 3, damage: 12, alpha: 0.75, isFlying: true },
  hermitCrab: { name: '뿔소라게', hp: 56, speed: 90, radius: 14, color: '#f97316', exp: 4, damage: 14, knockbackResist: 0.60, isFlying: false },
  flyingFish: { name: '심해 날치', hp: 20, speed: 230, radius: 10, color: '#38bdf8', exp: 3, damage: 12, isFlying: true },
  seaLobster: { name: '갑주 가재', hp: 78, speed: 125, radius: 15, color: '#ef4444', exp: 5, damage: 18, knockbackResist: 0.45, isFlying: false },
  stingray: { name: '전기 가오리', hp: 68, speed: 160, radius: 14, color: '#eab308', exp: 5, damage: 16, isFlying: true },
  coralGolem: { name: '산호 골렘', hp: 350, speed: 70, radius: 24, color: '#14b8a6', exp: 22, damage: 36, knockbackResist: 0.85, isFlying: false },
  seaLeech: { name: '심해 거머리', hp: 48, speed: 190, radius: 11, color: '#881337', exp: 4, damage: 14, isFlying: false },
  anglerFish: { name: '심해 아귀', hp: 130, speed: 130, radius: 16, color: '#0f766e', exp: 8, damage: 22, isFlying: true },
  ghostJelly: { name: '유령 해파리', hp: 100, speed: 115, radius: 15, color: '#a5f3fc', exp: 7, damage: 18, alpha: 0.60, isFlying: true },
  deepShark: { name: '메갈로돈 상어', hp: 240, speed: 210, radius: 20, color: '#1e293b', exp: 14, damage: 32, knockbackResist: 0.55, isFlying: true },
  poisonRay: { name: '독침 가오리', hp: 150, speed: 115, radius: 15, color: '#a855f7', exp: 10, damage: 22, isRanged: true, isFlying: true },
  shadowEel: { name: '심연 그림자장어', hp: 165, speed: 225, radius: 13, color: '#0369a1', exp: 11, damage: 26, isFlying: true },
  voidSeaSerpent: { name: '공허 바다뱀', hp: 520, speed: 110, radius: 26, color: '#090d16', exp: 26, damage: 42, knockbackResist: 0.75, isFlying: true },
  trilobite: { name: '고대 삼엽충', hp: 600, speed: 75, radius: 25, color: '#78350f', exp: 27, damage: 40, knockbackResist: 0.88, isFlying: false }
};

// 전체 몬스터 통합 참조 테이블 (기존 호환성 100% 보장)
const ENEMY_TYPES = {
  ...ENEMY_TYPES_W1,
  ...ENEMY_TYPES_W2
};
