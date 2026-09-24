// 14종 기본 무기 및 14대 2단계 특수 진화 무기 기본 스펙 데이터 테이블

const WEAPON_CONFIGS = {
      sword: {
        id: 'sword',
        name: '철검',
        icon: '🗡️',
        iconSprite: 'icon_sword',
        desc: '가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다.',
        baseCooldown: 0.45, // 0.45초 쿨다운으로 경쾌한 슬래시
        baseDamage: 20,     // 공격력 상향 (16 -> 20, 슬라임 및 잡몹 1~2타 처치)
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
        desc: '플레이어 주변을 크게 원형으로 베어내며 적을 밀쳐냅니다.',
        baseCooldown: 1.10,
        baseDamage: 62,     // 데미지형 한방 강화 (55 -> 62)
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
        desc: '가장 가까운 적을 자동 조준하여 휘두르고, 강화에 따라 반대 방향과 번갈아 교차 강타합니다.',
        baseCooldown: 0.95,
        baseDamage: 44,
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
        desc: '가장 가까운 몬스터를 향해 고속 회전하며 다수의 적을 관통하는 표창을 던집니다.',
        baseCooldown: 0.42,
        baseDamage: 24,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // 구 단검 호환용 alias (중복 코드 제거)
      throwingDagger: { id: 'shuriken' },
      magicMissile: {
        id: 'magicMissile',
        name: '마법 화살',
        icon: '🔮',
        iconSprite: 'icon_missile',
        desc: '가장 가까운 적을 조준하여 빠른 속도로 유도 마법탄을 발사합니다.',
        baseCooldown: 0.55,
        baseDamage: 25,
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
        desc: '바라보는 방향으로 전방 부채꼴 형태로 여러 발의 산탄을 일제히 사격합니다.',
        baseCooldown: 1.30,
        baseDamage: 32,
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
        desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.',
        baseCooldown: 2.0,
        baseDamage: 14,
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
        desc: '플레이어 중심 360도 원형 결계로 적들에게 매초 지속 도트 피해를 입힙니다.',
        baseCooldown: 1.0,
        baseDamage: 28,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // 구 산성웅덩이 호환용 alias (중복 코드 제거)
      acidPool: { id: 'holyWater' },
      lightningRing: {
        id: 'lightningRing',
        name: '번개 반지',
        icon: '⚡',
        iconSprite: 'icon_lightning',
        desc: '무작위 적의 머리 위로 하늘에서 벼락을 내리꽂아 반경 범위 피해를 입힙니다.',
        baseCooldown: 1.10,
        baseDamage: 42,
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
        desc: '가장 가까운 적을 향해 화염구를 발사하며, 명중 시 폭발하여 주변 적들에게 화염 피해를 입힙니다.',
        baseCooldown: 1.00,
        baseDamage: 42,     // 데미지형 한방 폭발 강화 (36 -> 42)
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // ================= 12대 정통 특수 진화 무기 (5렙+5렙 조합, 1레벨 시작 및 5레벨까지 강화 가능) =================
      // [진화 1] 생츄어리 (heavenlySanctuary) = 성역(5렙) + 성수(5렙)
      heavenlySanctuary: {
        id: 'heavenlySanctuary',
        name: '생츄어리',
        icon: '⛪✨',
        iconSprite: 'icon_heavenlysanctuary',
        desc: '초대형 룬 결계를 형성하여 초고속 도트 피해를 입히며 낮은 확률로 적을 얼립니다.',
        baseCooldown: 0.80, // 도트 틱 주기 (0.8초)
        baseDamage: 36,
        baseCount: 1,
        baseArea: 1.40,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // [진화 2] 모닝스타 (morningstarTempest) = 채찍(5렙) + 표창(5렙)
      morningstarTempest: {
        id: 'morningstarTempest',
        name: '모닝스타',
        icon: '⛓️🌪️',
        iconSprite: 'icon_morningstartempest',
        desc: '일반 채찍과 동일하게 휘두르며 첫 번째 타겟 적중 시 4방향으로 관통 표창을 발사합니다.',
        baseCooldown: 0.95,
        baseDamage: 52,
        baseCount: 2, // 2연타 기본
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 3] 메테오 (apocalypseComet) = 불 지팡이(5렙) + 마법 화살(5렙)
      apocalypseComet: {
        id: 'apocalypseComet',
        name: '메테오',
        icon: '☄️🔥',
        iconSprite: 'icon_apocalypsecomet',
        desc: '적을 유도 추적하는 거대한 초고열 화염 혜성을 연사 발사하며, 명중 시 초대형 헬파이어 연쇄 폭발을 일으킵니다.',
        baseCooldown: 0.85,
        baseDamage: 62,
        baseCount: 2,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      // [진화 4] 폭풍검 (slayerBladeStorm) = 철검(5렙) + 도끼(5렙)
      slayerBladeStorm: {
        id: 'slayerBladeStorm',
        name: '폭풍검',
        icon: '⚔️🌪️',
        iconSprite: 'icon_slayerbladestorm',
        desc: '거대 대검과 도끼들이 플레이어 주위를 초고속 상시 회전하며 접근하는 모든 적을 갈아냅니다.',
        baseCooldown: 0.50,
        baseDamage: 56,
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
      // [진화 5] 뇌전포 (teslaShotgun) = 산탄총(5렙) + 번개 반지(5렙)
      teslaShotgun: {
        id: 'teslaShotgun',
        name: '뇌전포',
        icon: '⚡💥',
        iconSprite: 'icon_teslashotgun',
        desc: '전방 부채꼴로 고전압 뇌전 탄환들을 일제 산탄 사격하며, 적중 시 체인 라이트닝과 하늘에서 낙뢰가 동시 폭격됩니다.',
        baseCooldown: 1.25,
        baseDamage: 45,
        baseCount: 6,
        baseArea: 1.20,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기] 독비수 (poisonDagger)
      poisonDagger: {
        id: 'poisonDagger',
        name: '독비수',
        icon: '🗡️🧪',
        iconSprite: 'icon_poisondagger',
        desc: '바라보는 방향으로 독이 묻은 비수를 쾌속 연사하며 피격된 적에게 중독 피해를 입힙니다.',
        baseCooldown: 0.48,
        baseDamage: 18,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기] 빙결 보주 (frostOrb)
      frostOrb: {
        id: 'frostOrb',
        name: '빙결 보주',
        icon: '❄️🔮',
        iconSprite: 'icon_frostorb',
        desc: '전방으로 천천히 전진하며 주변 적들에게 지속적인 냉기 파동을 발산하여 감속시키고 피해를 입힙니다.',
        baseCooldown: 2.20,
        baseDamage: 24,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // [진화 6] 블리자드 (venomBlizzard = 독비수 5Lv + 빙결 보주 5Lv)
      venomBlizzard: {
        id: 'venomBlizzard',
        name: '블리자드',
        icon: '❄️🧪',
        iconSprite: 'icon_venomblizzard',
        desc: '서리독 구체를 전방으로 발사합니다. 구체는 전진하며 초당 2회 냉기 파동(반경 51px)을 방출하고, 발사 2초 후 폭발하여 8방향으로 독단검을 일제 사격합니다.',
        baseCooldown: 1.80,
        baseDamage: 45,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 7] 벼락검 (thunderBlade = 철검 5Lv + 번개 반지 5Lv)
      thunderBlade: {
        id: 'thunderBlade',
        name: '벼락검',
        icon: '⚡🗡️',
        iconSprite: 'icon_thunderblade',
        desc: '전방을 날카롭게 강타 베기하며, 베어낸 타겟 위치에 즉시 강력한 벼락이 내리꽂힙니다.',
        baseCooldown: 0.55,
        baseDamage: 55,
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 8] 화염도끼 (fireAxe = 도끼 5Lv + 불 지팡이 5Lv)
      fireAxe: {
        id: 'fireAxe',
        name: '화염도끼',
        icon: '🪓🔥',
        iconSprite: 'icon_fireaxe',
        desc: '360도 도끼 회전 베기 직후, 사방 4방향으로 폭발 화염구를 일제 방출합니다.',
        baseCooldown: 1.05,
        baseDamage: 62,
        baseCount: 1,
        baseArea: 1.30,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 9] 얼음채찍 (frostWhip = 채찍 5Lv + 빙결 보주 5Lv)
      frostWhip: {
        id: 'frostWhip',
        name: '얼음채찍',
        icon: '🪢❄️',
        iconSprite: 'icon_frostwhip',
        desc: '전방과 후방을 교차 강타하며, 피격된 적을 낮은 확률(8%)로 1초간 빙결시킵니다.',
        baseCooldown: 0.90,
        baseDamage: 52,
        baseCount: 2,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 10] 산탄표창 (scatterShuriken = 표창 5Lv + 산탄총 5Lv)
      scatterShuriken: {
        id: 'scatterShuriken',
        name: '산탄표창',
        icon: '🥷💥',
        iconSprite: 'icon_scattershuriken',
        desc: '전방 부채꼴로 5개의 대형 회전 관통 표창을 일제히 투척하여 적들을 밀쳐냅니다.',
        baseCooldown: 0.70,
        baseDamage: 38,
        baseCount: 5,
        baseArea: 1.20,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 11] 신성화살 (holyArrow = 마법 화살 5Lv + 성수 5Lv)
      holyArrow: {
        id: 'holyArrow',
        name: '신성화살',
        icon: '🏹✨',
        iconSprite: 'icon_holyarrow',
        desc: '가장 가까운 적을 유도 추적하는 빛의 화살 2발을 발사하며, 착탄 위치에 3초간 지속되는 정화 장판을 생성합니다.',
        baseCooldown: 0.65,
        baseDamage: 42,
        baseCount: 2,
        baseArea: 1.15,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 12] 역병 (plague = 독비수 5Lv + 성역 5Lv)
      plague: {
        id: 'plague',
        name: '역병',
        icon: '☠️⛪',
        iconSprite: 'icon_plague',
        desc: '플레이어 주변에 성스러운 독기 결계를 유지하며, 30초마다 화면 전체에 거대한 역병 폭발을 일으킵니다.',
        baseCooldown: 0.80,
        baseDamage: 36,
        baseCount: 1,
        baseArea: 1.40,
        burstTimer: 30.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기 13] 바람 활 (windBow)
      windBow: {
        id: 'windBow',
        name: '바람 활',
        icon: '🏹',
        iconSprite: 'icon_windbow',
        desc: '가장 가까운 적을 향해 날카로운 돌풍 화살을 쏘아 적들을 꿰뚫고 뒤로 밀쳐냅니다.',
        baseCooldown: 0.60,
        baseDamage: 32,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기 14] 어둠의 보주 (shadowOrb)
      shadowOrb: {
        id: 'shadowOrb',
        name: '어둠의 보주',
        icon: '🔮',
        iconSprite: 'icon_shadoworb',
        desc: '가장 가까운 적을 자율 추적하여 날아가 밀착 다단히트 피해를 입히며, 적이 없을 때는 플레이어를 호위합니다.',
        baseCooldown: 1.10,
        baseDamage: 34,
        baseCount: 2,
        baseArea: 1.0,
        orbitAngle: 0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 13] 태풍의 눈 (cycloneBow = 바람 활 5Lv + 표창 5Lv)
      cycloneBow: {
        id: 'cycloneBow',
        name: '태풍의 눈',
        icon: '🌀🏹',
        iconSprite: 'icon_cyclonebow',
        desc: '바람 활과 표창을 합성 진화합니다! 초대형 관통 회오리 화살을 발사하며, 착탄 위치에 주변 적들을 빨아들이는 블랙홀을 일으킵니다.',
        baseCooldown: 0.65,
        baseDamage: 48,
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 14] 황혼의 나선 (eclipseSpiral = 어둠의 보주 5Lv + 마법 화살 5Lv)
      eclipseSpiral: {
        id: 'eclipseSpiral',
        name: '황혼의 나선',
        icon: '🌌🔮',
        iconSprite: 'icon_eclipsespiral',
        desc: '3체의 황혼 사역마가 적을 자율 추적하여 밀착 다단히트하며, 주기적으로 8방향 관통 마법 화살을 일제 난사합니다.',
        baseCooldown: 0.85,
        baseDamage: 55,
        baseCount: 3,
        baseArea: 1.30,
        orbitAngle: 0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기 15] 화염 기둥 (flamePillar - 화염 마도사 시그니처)
      flamePillar: {
        id: 'flamePillar',
        name: '화염 기둥',
        icon: '🌋🔥',
        iconSprite: 'icon_flamepillar',
        desc: '가장 가까운 적 발밑에서 거대한 지옥 화염 기둥을 솟구치게 하여 폭발 피해를 입힙니다.',
        baseCooldown: 1.10,
        baseDamage: 44,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기 16] 차크람 (chakram - 그림자 암살자 시그니처)
      chakram: {
        id: 'chakram',
        name: '차크람',
        icon: '💫🗡️',
        iconSprite: 'icon_chakram',
        desc: '날카로운 톱날 원반을 던져 적들을 관통한 뒤 플레이어에게 되돌아오며 2중 피해를 입힙니다.',
        baseCooldown: 0.80,
        baseDamage: 34,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [기본 무기 17] 십자가 (holyCross - 해골 성직자 시그니처)
      holyCross: {
        id: 'holyCross',
        name: '십자가',
        icon: '✝️✨',
        iconSprite: 'icon_holycross',
        desc: '신성한 빛의 십자가를 투척하여 비행 후 상하좌우 4방향으로 십자 성광을 발산하며 폭발합니다.',
        baseCooldown: 1.00,
        baseDamage: 38,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 15] 인페르노 (infernoCataclysm = 화염 기둥 5Lv + 불 지팡이 5Lv)
      infernoCataclysm: {
        id: 'infernoCataclysm',
        name: '인페르노',
        icon: '🌋☄️',
        iconSprite: 'icon_infernocataclysm',
        desc: '화염 기둥과 불 지팡이가 융합하여 적 위치에 4개의 초대형 화염 분화구를 연속 폭발시키고 헬파이어 용암 장판을 남깁니다.',
        baseCooldown: 1.05,
        baseDamage: 65,
        baseCount: 4,
        baseArea: 1.30,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 16] 섀도우 차크람 (shadowVortex = 차크람 5Lv + 독비수 5Lv)
      shadowVortex: {
        id: 'shadowVortex',
        name: '섀도우 차크람',
        icon: '🌀🗡️',
        iconSprite: 'icon_shadowvortex',
        desc: '차크람과 독비수가 융합하여 초대형 암흑 맹독 차크람이 2회 왕복 회귀하며 적중 시 6방향 맹독 파편을 사방 폭쇄합니다.',
        baseCooldown: 0.75,
        baseDamage: 48,
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // [신규 진화 17] 저지먼트 (divineJudgement = 십자가 5Lv + 성수 5Lv)
      divineJudgement: {
        id: 'divineJudgement',
        name: '저지먼트',
        icon: '✝️⚡',
        iconSprite: 'icon_divinejudgement',
        desc: '십자가와 성수가 융합하여 거대 대천사 십자가를 투척하고, 착탄 시 심판의 성광 기둥 낙뢰와 함께 30% 확률로 0.5초 기절시킵니다.',
        baseCooldown: 1.15,
        baseDamage: 58,
        baseCount: 1,
        baseArea: 1.35,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },

      // 이전 진화 무기 호환용
      spinningAxe: { id: 'slayerBladeStorm' },
      bladeWhip: { id: 'morningstarTempest' },
      holyShotgun: { id: 'heavenlySanctuary' },
      arcaneSanctuary: { id: 'apocalypseComet' },
      plasmaTempest: { id: 'teslaShotgun' }
};
