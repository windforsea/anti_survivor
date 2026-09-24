// Anti Survivors - 몬스터 스펙 데이터 테이블 (js/enemyData.js)

// [월드 1: 심연의 부유섬 몬스터 15종 스펙]
const ENEMY_TYPES_W1 = {
  bat: { name: '박쥐', hp: 12, speed: 170, radius: 10, color: '#a855f7', exp: 2, damage: 6, isFlying: true },
  slime: { name: '슬라임', hp: 18, speed: 85, radius: 13, color: '#22c55e', exp: 3, damage: 8, isFlying: false },
  miniSlime: { name: '아기 슬라임', hp: 4, speed: 65, radius: 8, color: '#4ade80', exp: 1, damage: 4, isFlying: false },
  zombie: { name: '좀비', hp: 42, speed: 65, radius: 15, color: '#64748b', exp: 3, damage: 12, knockbackResist: 0.45, isFlying: false },
  skeleton: { name: '해골', hp: 34, speed: 105, radius: 13, color: '#f1f5f9', exp: 4, damage: 10, isFlying: false },
  goblin: { name: '고블린', hp: 42, speed: 145, radius: 12, color: '#84cc16', exp: 5, damage: 9, isFlying: false },
  ghost: { name: '유령', hp: 60, speed: 115, radius: 15, color: '#38bdf8', exp: 6, damage: 11, alpha: 0.65, isFlying: true },
  gargoyle: { name: '가고일', hp: 115, speed: 75, radius: 18, color: '#78716c', exp: 7, damage: 16, isFlying: true },
  cultist: { name: '흑마술사', hp: 100, speed: 95, radius: 14, color: '#dc2626', exp: 9, damage: 14, isRanged: true, isFlying: false },
  assassin: { name: '암살자', hp: 60, speed: 155, radius: 13, color: '#18181b', exp: 11, damage: 12, isFlying: false },
  golem: { name: '골렘', hp: 300, speed: 50, radius: 24, color: '#d97706', exp: 25, damage: 25, knockbackResist: 0.85, isFlying: false },
  darkMage: { name: '타락한 마도사', hp: 140, speed: 95, radius: 14, color: '#7e22ce', exp: 12, damage: 16, isRanged: true, isFlying: true },
  bloodHound: { name: '핏빛 사냥개', hp: 110, speed: 210, radius: 12, color: '#dc2626', exp: 10, damage: 18, knockbackResist: 0.35, isFlying: false },
  wraithSwarm: { name: '망령 군단', hp: 55, speed: 145, radius: 11, color: '#06b6d4', exp: 5, damage: 12, alpha: 0.70, isFlying: true },
  abyssTitan: { name: '심연의 거인', hp: 450, speed: 55, radius: 28, color: '#1e1b4b', exp: 28, damage: 32, knockbackResist: 0.70, isFlying: false }
};

// [월드 2: 심해 대협곡 몬스터 15종 스펙]
const ENEMY_TYPES_W2 = {
  plankton: { name: '발광 플랑크톤', hp: 9, speed: 155, radius: 8, color: '#67e8f9', exp: 2, damage: 5, isFlying: true },
  jellyfish: { name: '청록 해파리', hp: 18, speed: 80, radius: 12, color: '#22d3ee', exp: 3, damage: 8, alpha: 0.75, isFlying: true },
  hermitCrab: { name: '뿔소라게', hp: 42, speed: 70, radius: 14, color: '#f97316', exp: 4, damage: 10, knockbackResist: 0.55, isFlying: false },
  flyingFish: { name: '심해 날치', hp: 15, speed: 200, radius: 10, color: '#38bdf8', exp: 3, damage: 7, isFlying: true },
  seaLobster: { name: '갑주 가재', hp: 58, speed: 95, radius: 15, color: '#ef4444', exp: 5, damage: 12, knockbackResist: 0.40, isFlying: false },
  stingray: { name: '전기 가오리', hp: 50, speed: 135, radius: 14, color: '#eab308', exp: 5, damage: 11, isFlying: true },
  coralGolem: { name: '산호 골렘', hp: 260, speed: 48, radius: 24, color: '#14b8a6', exp: 22, damage: 24, knockbackResist: 0.80, isFlying: false },
  seaLeech: { name: '심해 거머리', hp: 35, speed: 160, radius: 11, color: '#881337', exp: 4, damage: 9, isFlying: false },
  anglerFish: { name: '심해 아귀', hp: 95, speed: 105, radius: 16, color: '#0f766e', exp: 8, damage: 15, isFlying: true },
  ghostJelly: { name: '유령 해파리', hp: 75, speed: 95, radius: 15, color: '#a5f3fc', exp: 7, damage: 13, alpha: 0.60, isFlying: true },
  deepShark: { name: '메갈로돈 상어', hp: 175, speed: 175, radius: 20, color: '#1e293b', exp: 14, damage: 22, knockbackResist: 0.50, isFlying: true },
  poisonRay: { name: '독침 가오리', hp: 110, speed: 90, radius: 15, color: '#a855f7', exp: 10, damage: 15, isRanged: true, isFlying: true },
  shadowEel: { name: '심연 그림자장어', hp: 120, speed: 195, radius: 13, color: '#0369a1', exp: 11, damage: 18, isFlying: true },
  voidSeaSerpent: { name: '공허 바다뱀', hp: 380, speed: 85, radius: 26, color: '#090d16', exp: 26, damage: 30, knockbackResist: 0.70, isFlying: true },
  trilobite: { name: '고대 삼엽충', hp: 440, speed: 55, radius: 25, color: '#78350f', exp: 27, damage: 28, knockbackResist: 0.85, isFlying: false }
};

// 전체 몬스터 통합 참조 테이블 (기존 호환성 100% 보장)
const ENEMY_TYPES = {
  ...ENEMY_TYPES_W1,
  ...ENEMY_TYPES_W2
};
