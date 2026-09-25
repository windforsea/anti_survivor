// 17종 기본 무기 및 17종 특수 진화 무기(총 34종) 기본 스펙 데이터 테이블
// [밸런스 패치] 말뚝딜 방지를 위한 단발 공격력 상향(35~50%) 및 기본 쿨타임 증가(27~44%) 적용

const WEAPON_CONFIGS = {
      sword: {
        id: 'sword',
        name: '철검',
        icon: '🗡️',
        iconSprite: 'icon_sword',
        desc: '검을 휘둘러 벱니다.',
        baseCooldown: 0.65, // 기존 0.45초 -> 0.65초 (44% 증가, 무빙 딜레이 확보)
        baseDamage: 30,     // 기존 20 -> 30 (50% 상향, 묵직한 슬래시)
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      axe: {
        id: 'axe',
        name: '도끼',
        icon: '🪓',
        iconSprite: 'icon_axe',
        desc: '원형으로 베어내며 적을 밀쳐냅니다.',
        baseCooldown: 1.45, // 기존 1.10초 -> 1.45초 (32% 증가)
        baseDamage: 92,     // 기존 62 -> 92 (48% 상향, 강력한 광역 한방)
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      whip: {
        id: 'whip',
        name: '채찍',
        icon: '🪢',
        iconSprite: 'icon_whip',
        desc: '교차 강타합니다.',
        baseCooldown: 1.25, // 기존 0.95초 -> 1.25초 (32% 증가)
        baseDamage: 64,     // 기존 44 -> 64 (45% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      shuriken: {
        id: 'shuriken',
        name: '표창',
        icon: '🥷',
        iconSprite: 'icon_shuriken',
        desc: '관통하는 표창을 던집니다.',
        baseCooldown: 0.58, // 기존 0.42초 -> 0.58초 (38% 증가)
        baseDamage: 34,     // 기존 24 -> 34 (42% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      magicMissile: {
        id: 'magicMissile',
        name: '마법 화살',
        icon: '🔮',
        iconSprite: 'icon_missile',
        desc: '유도 마법탄을 발사합니다.',
        baseCooldown: 0.75, // 기존 0.55초 -> 0.75초 (36% 증가)
        baseDamage: 36,     // 기존 25 -> 36 (44% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      shotgun: {
        id: 'shotgun',
        name: '산탄총',
        icon: '💥',
        iconSprite: 'icon_shotgun',
        desc: '여러 발의 산탄을 사격합니다.',
        baseCooldown: 1.70, // 기존 1.30초 -> 1.70초 (31% 증가)
        baseDamage: 46,     // 기존 32 -> 46 (44% 상향)
        baseCount: 3,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      holyWater: {
        id: 'holyWater',
        name: '성수',
        icon: '🧪',
        iconSprite: 'icon_holywater',
        desc: '바닥에 지속 피해를 입히는 성수를 투척합니다.',
        baseCooldown: 2.60, // 기존 2.0초 -> 2.60초 (30% 증가)
        baseDamage: 21,     // 기존 14 -> 21 (50% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      sanctuary: {
        id: 'sanctuary',
        name: '성역',
        icon: '⛪',
        iconSprite: 'icon_sanctuary',
        desc: '결계로 적들에게 피해를 입힙니다.',
        baseCooldown: 1.30, // 기존 1.0초 -> 1.30초 (30% 증가)
        baseDamage: 40,     // 기존 28 -> 40 (43% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      lightningRing: {
        id: 'lightningRing',
        name: '번개 반지',
        icon: '⚡',
        iconSprite: 'icon_lightning',
        desc: '벼락을 내리꽂아 범위 피해를 입힙니다.',
        baseCooldown: 1.45, // 기존 1.10초 -> 1.45초 (32% 증가)
        baseDamage: 60,     // 기존 42 -> 60 (43% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      fireWand: {
        id: 'fireWand',
        name: '불 지팡이',
        icon: '🔥',
        iconSprite: 'icon_firewand',
        desc: '화염구를 발사하며, 명중 시 폭발합니다.',
        baseCooldown: 1.35, // 기존 1.00초 -> 1.35초 (35% 증가)
        baseDamage: 62,     // 기존 42 -> 62 (48% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      poisonDagger: {
        id: 'poisonDagger',
        name: '독비수',
        icon: '🗡️🧪',
        iconSprite: 'icon_poisondagger',
        desc: '독이 묻은 비수를 투척하여 중독 피해를 입힙니다.',
        baseCooldown: 0.65, // 기존 0.48초 -> 0.65초 (35% 증가)
        baseDamage: 26,     // 기존 18 -> 26 (44% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      frostOrb: {
        id: 'frostOrb',
        name: '빙결 보주',
        icon: '❄️🔮',
        iconSprite: 'icon_frostorb',
        desc: '천천히 전진하며 지속적인 냉기 파동을 발산합니다.',
        baseCooldown: 2.80, // 기존 2.20초 -> 2.80초 (27% 증가)
        baseDamage: 36,     // 기존 24 -> 36 (50% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      windBow: {
        id: 'windBow',
        name: '바람 활',
        icon: '🏹',
        iconSprite: 'icon_windbow',
        desc: '화살을 쏘아 적들을 꿰뚫고 밀쳐냅니다.',
        baseCooldown: 0.82, // 기존 0.60초 -> 0.82초 (37% 증가)
        baseDamage: 46,     // 기존 32 -> 46 (44% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      shadowOrb: {
        id: 'shadowOrb',
        name: '어둠의 보주',
        icon: '🔮',
        iconSprite: 'icon_shadoworb',
        desc: '자율 추적하여 플레이어를 호위합니다.',
        baseCooldown: 1.45, // 기존 1.10초 -> 1.45초 (32% 증가)
        baseDamage: 50,     // 기존 34 -> 50 (47% 상향)
        baseCount: 2,
        baseArea: 1.0,
        orbitAngle: 0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      flamePillar: {
        id: 'flamePillar',
        name: '화염 기둥',
        icon: '🌋🔥',
        iconSprite: 'icon_flamepillar',
        desc: '화염 기둥을 솟구치게 하여 폭발 피해를 입힙니다.',
        baseCooldown: 1.45, // 기존 1.10초 -> 1.45초 (32% 증가)
        baseDamage: 65,     // 기존 44 -> 65 (48% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      chakram: {
        id: 'chakram',
        name: '차크람',
        icon: '💫🗡️',
        iconSprite: 'icon_chakram',
        desc: '관통한 뒤 되돌아오며 2중 피해를 입힙니다.',
        baseCooldown: 1.08, // 기존 0.80초 -> 1.08초 (35% 증가)
        baseDamage: 48,     // 기존 34 -> 48 (41% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      holyCross: {
        id: 'holyCross',
        name: '십자가',
        icon: '✝️✨',
        iconSprite: 'icon_holycross',
        desc: '십자가를 투척하여 폭발합니다.',
        baseCooldown: 1.32, // 기존 1.00초 -> 1.32초 (32% 증가)
        baseDamage: 55,     // 기존 38 -> 55 (45% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // ================= 17대 특수 진화 무기 (5렙+5렙 조합) =================
      // [진화 1] 생츄어리 = 성역(5렙) + 성수(5렙)
      heavenlySanctuary: {
        id: 'heavenlySanctuary',
        name: '생츄어리',
        icon: '⛪✨',
        iconSprite: 'icon_heavenlysanctuary',
        desc: '결계를 형성하여 낮은 확률로 적을 얼립니다.',
        baseCooldown: 1.05, // 기존 0.80초 -> 1.05초 (31% 증가)
        baseDamage: 52,     // 기존 36 -> 52 (44% 상향)
        baseCount: 1,
        baseArea: 1.40,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 2] 모닝스타 = 채찍(5렙) + 표창(5렙)
      morningstarTempest: {
        id: 'morningstarTempest',
        name: '모닝스타',
        icon: '⛓️🌪️',
        iconSprite: 'icon_morningstartempest',
        desc: '타겟 적중 시 관통 표창을 발사합니다.',
        baseCooldown: 1.25, // 기존 0.95초 -> 1.25초 (32% 증가)
        baseDamage: 75,     // 기존 52 -> 75 (44% 상향)
        baseCount: 2,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 3] 메테오 = 불 지팡이(5렙) + 마법 화살(5렙)
      apocalypseComet: {
        id: 'apocalypseComet',
        name: '메테오',
        icon: '☄️🔥',
        iconSprite: 'icon_apocalypsecomet',
        desc: '화염 혜성을 발사하며, 연쇄 폭발을 일으킵니다.',
        baseCooldown: 1.18, // 기존 0.85초 -> 1.18초 (39% 증가)
        baseDamage: 90,     // 기존 62 -> 90 (45% 상향)
        baseCount: 2,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 4] 폭풍칼날 = 철검(5렙) + 도끼(5렙)
      bladeStorm: {
        id: 'bladeStorm',
        name: '폭풍칼날',
        icon: '⚔️🌪️',
        iconSprite: 'icon_bladestorm',
        desc: '검과 도끼들이 주위를 상시 회전합니다.',
        baseCooldown: 0.68, // 기존 0.50초 -> 0.68초 (36% 증가)
        baseDamage: 80,     // 기존 56 -> 80 (43% 상향)
        baseCount: 4,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        orbitAngle: 0,
        hitTimers: new Map(),
        cooldownTimer: 0
      },
      // [진화 5] 뇌전포 = 산탄총(5렙) + 번개 반지(5렙)
      teslaShotgun: {
        id: 'teslaShotgun',
        name: '뇌전포',
        icon: '⚡💥',
        iconSprite: 'icon_teslashotgun',
        desc: '산탄 사격하며, 적중 시 낙뢰가 폭격됩니다.',
        baseCooldown: 1.65, // 기존 1.25초 -> 1.65초 (32% 증가)
        baseDamage: 65,     // 기존 45 -> 65 (44% 상향)
        baseCount: 6,
        baseArea: 1.20,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 6] 블리자드 = 독비수(5렙) + 빙결 보주(5렙)
      venomBlizzard: {
        id: 'venomBlizzard',
        name: '블리자드',
        icon: '❄️🧪',
        iconSprite: 'icon_venomblizzard',
        desc: '구체는 전진하며 2초 후 폭발하여 독단검을 일제 사격합니다.',
        baseCooldown: 2.35, // 기존 1.80초 -> 2.35초 (31% 증가)
        baseDamage: 66,     // 기존 45 -> 66 (47% 상향)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 7] 벼락검 = 철검(5렙) + 번개 반지(5렙)
      thunderBlade: {
        id: 'thunderBlade',
        name: '벼락검',
        icon: '⚡🗡️',
        iconSprite: 'icon_thunderblade',
        desc: '베어낸 위치에 벼락이 내리꽂힙니다.',
        baseCooldown: 0.75, // 기존 0.55초 -> 0.75초 (36% 증가)
        baseDamage: 80,     // 기존 55 -> 80 (45% 상향)
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 8] 화염도끼 = 도끼(5렙) + 불 지팡이(5렙)
      fireAxe: {
        id: 'fireAxe',
        name: '화염도끼',
        icon: '🪓🔥',
        iconSprite: 'icon_fireaxe',
        desc: '도끼 베기 직후, 화염구를 방출합니다.',
        baseCooldown: 1.40, // 기존 1.05초 -> 1.40초 (33% 증가)
        baseDamage: 90,     // 기존 62 -> 90 (45% 상향)
        baseCount: 1,
        baseArea: 1.30,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 9] 얼음채찍 = 채찍(5렙) + 빙결 보주(5렙)
      frostWhip: {
        id: 'frostWhip',
        name: '얼음채찍',
        icon: '🪢❄️',
        iconSprite: 'icon_frostwhip',
        desc: '낮은 확률로 빙결시킵니다.',
        baseCooldown: 1.20, // 기존 0.90초 -> 1.20초 (33% 증가)
        baseDamage: 75,     // 기존 52 -> 75 (44% 상향)
        baseCount: 2,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 10] 산탄표창 = 표창(5렙) + 산탄총(5렙)
      scatterShuriken: {
        id: 'scatterShuriken',
        name: '산탄표창',
        icon: '🥷💥',
        iconSprite: 'icon_scattershuriken',
        desc: '회전 관통 표창을 일제히 발사 적들을 밀쳐냅니다.',
        baseCooldown: 0.95, // 기존 0.70초 -> 0.95초 (36% 증가)
        baseDamage: 55,     // 기존 38 -> 55 (45% 상향)
        baseCount: 5,
        baseArea: 1.20,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 11] 신성화살 = 마법 화살(5렙) + 성수(5렙)
      holyArrow: {
        id: 'holyArrow',
        name: '신성화살',
        icon: '🏹✨',
        iconSprite: 'icon_holyarrow',
        desc: '빛의 화살 2발을 발사하며, 착탄 위치에 성역을 생성합니다.',
        baseCooldown: 0.88, // 기존 0.65초 -> 0.88초 (35% 증가)
        baseDamage: 60,     // 기존 42 -> 60 (43% 상향)
        baseCount: 2,
        baseArea: 1.15,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 12] 역병 = 독비수(5렙) + 성역(5렙)
      plague: {
        id: 'plague',
        name: '역병',
        icon: '☠️⛪',
        iconSprite: 'icon_plague',
        desc: '일정 시간마다 화면 전체에 역병 폭발을 일으킵니다.',
        baseCooldown: 1.05, // 기존 0.80초 -> 1.05초 (31% 증가)
        baseDamage: 52,     // 기존 36 -> 52 (44% 상향)
        baseCount: 1,
        baseArea: 1.40,
        burstTimer: 30.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 13] 태풍의 눈 = 바람 활(5렙) + 표창(5렙)
      cycloneBow: {
        id: 'cycloneBow',
        name: '태풍의 눈',
        icon: '🌀🏹',
        iconSprite: 'icon_cyclonebow',
        desc: '블랙홀 관통 화살을 발사합니다.',
        baseCooldown: 0.88, // 기존 0.65초 -> 0.88초 (35% 증가)
        baseDamage: 70,     // 기존 48 -> 70 (46% 상향)
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 14] 황혼의 나선 = 어둠의 보주(5렙) + 마법 화살(5렙)
      eclipseSpiral: {
        id: 'eclipseSpiral',
        name: '황혼의 나선',
        icon: '🌌🔮',
        iconSprite: 'icon_eclipsespiral',
        desc: '사역마가 마법 화살을 난사합니다.',
        baseCooldown: 1.15, // 기존 0.85초 -> 1.15초 (35% 증가)
        baseDamage: 80,     // 기존 55 -> 80 (45% 상향)
        baseCount: 3,
        baseArea: 1.30,
        orbitAngle: 0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 15] 인페르노 = 화염 기둥(5렙) + 불 지팡이(5렙)
      infernoCataclysm: {
        id: 'infernoCataclysm',
        name: '인페르노',
        icon: '🌋☄️',
        iconSprite: 'icon_infernocataclysm',
        desc: '화염 분화구와 화염지대를 남깁니다.',
        baseCooldown: 1.40, // 기존 1.05초 -> 1.40초 (33% 증가)
        baseDamage: 95,     // 기존 65 -> 95 (46% 상향)
        baseCount: 4,
        baseArea: 1.30,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 16] 섀도우 차크람 = 차크람(5렙) + 독비수(5렙)
      shadowVortex: {
        id: 'shadowVortex',
        name: '섀도우 차크람',
        icon: '🌀🗡️',
        iconSprite: 'icon_shadowvortex',
        desc: '적중 시 6방향 맹독 파편을 뿌립니다.',
        baseCooldown: 1.02, // 기존 0.75초 -> 1.02초 (36% 증가)
        baseDamage: 70,     // 기존 48 -> 70 (46% 상향)
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 17] 저지먼트 = 십자가(5렙) + 성수(5렙)
      divineJudgement: {
        id: 'divineJudgement',
        name: '저지먼트',
        icon: '✝️⚡',
        iconSprite: 'icon_divinejudgement',
        desc: '십자가를 투척하고, 낙뢰로 기절시킵니다.',
        baseCooldown: 1.52, // 기존 1.15초 -> 1.52초 (32% 증가)
        baseDamage: 85,     // 기존 58 -> 85 (47% 상향)
        baseCount: 1,
        baseArea: 1.35,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      }
};
