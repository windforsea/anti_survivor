// 개편된 무기 시스템:
// 1. 일반 검 (sword) - 근접 속도형 기본 무기 (슬림 찌르기/베기)
// 2. 도끼 (axe) - 근접 범위형 (원형 휘두르기)
// 3. 채찍 (whip) - 근거리 전후방 교차 연타 (강화에 따라 앞뒤 교차 난무)
// 4. 던지는 단검 (throwingDagger) - 직진 관통 투사체 (사거리 290px, 몬스터 방향 조준)
// 5. 마법 화살 (magicMissile) - 원거리 유도 (사거리 700px)
// 6. 산탄 총포 (shotgun) - 원거리 산탄 (사거리 280px, 바라보는 방향)
// 7. 성수 (holyWater) - 바닥 도트 지속 정화 장판
// [진화 무기 1] 회전 도끼 (spinningAxe) - 검(6강) + 도끼(6강) 합성
// [진화 무기 2] 칼날 채찍 (bladeWhip) - 채찍(6강) + 단검(6강) 합성
// [진화 무기 3] 홀리 산탄총 (holyShotgun) - 산탄총(6강) + 성수(6강) 합성

class WeaponManager {
  constructor(player, game) {
    this.player = player;
    this.game = game;
    this.weapons = {};
    this.consumedWeapons = new Set(); // 진화 합성에 소모되어 영구 소멸된 무기 추적
    this.projectiles = [];
    this.slashes = [];
    this.damagePools = [];
    this.lightningStrikes = [];
    this.plasmaStrikes = [];

    // 콤보 큐
    this.swordComboQueue = 0;
    this.swordComboTimer = 0;
    this.axeComboQueue = 0;
    this.axeComboTimer = 0;
    this.whipStrikesQueue = [];
    this.whipStrikeTimer = 0;
    this.bladeWhipStrikesQueue = [];
    this.bladeWhipStrikeTimer = 0;

    // 시작 무기는 게임 시작 시 카드 선택을 통해 장착 (기본 지급 제거)
  }

  unlockWeapon(type) {
    if (this.weapons[type] || (this.consumedWeapons && this.consumedWeapons.has(type))) return;

    const baseConfigs = {
      sword: {
        id: 'sword',
        name: '철검',
        icon: '🗡️',
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
        desc: '플레이어 주변을 크게 원형으로 베어내며 적을 밀쳐냅니다.',
        baseCooldown: 1.10,
        baseDamage: 55,
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
      // 구 단검 호환용 alias
      throwingDagger: {
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
      magicMissile: {
        id: 'magicMissile',
        name: '마법 화살',
        icon: '🔮',
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
        name: '산탄 총포',
        icon: '💥',
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
      acidPool: {
        id: 'holyWater',
        name: '성수',
        icon: '🧪',
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
        name: '화염 지팡이',
        icon: '🔥',
        iconSprite: 'icon_firewand',
        desc: '가장 가까운 적을 향해 화염구를 발사하며, 명중 시 폭발하여 주변 적들에게 화염 피해를 입힙니다.',
        baseCooldown: 1.00,
        baseDamage: 36,
        baseCount: 1,
        baseArea: 1.0,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // ================= 5대 정통 특수 진화 무기 (5렙+5렙 조합, 1레벨 시작 및 5레벨까지 강화 가능) =================
      // [진화 1] 천상의 성역 (heavenlySanctuary) = 성역(5렙) + 성수(5렙)
      heavenlySanctuary: {
        id: 'heavenlySanctuary',
        name: '천상의 성역',
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
      // [진화 2] 모닝스타 선풍 (morningstarTempest) = 채찍(5렙) + 표창(5렙)
      morningstarTempest: {
        id: 'morningstarTempest',
        name: '모닝스타 선풍',
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
      // [진화 3] 멸망의 혜성 (apocalypseComet) = 화염 지팡이(5렙) + 마법 화살(5렙)
      apocalypseComet: {
        id: 'apocalypseComet',
        name: '멸망의 혜성',
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
      // [진화 4] 학살자의 폭풍검 (slayerBladeStorm) = 철검(5렙) + 도끼(5렙)
      slayerBladeStorm: {
        id: 'slayerBladeStorm',
        name: '학살자의 폭풍검',
        icon: '⚔️🌪️',
        iconSprite: 'icon_slayerbladestorm',
        desc: '거대 대검과 도끼들이 플레이어 주위를 초고속 상시 회전하며 접근하는 모든 적을 갈아냅니다.',
        baseCooldown: 0.50,
        baseDamage: 56,     // 검기 삭제 보상으로 기본 공격력 대폭 상향 (46 -> 56)
        baseCount: 4,       // 회전 무기 4개
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        orbitAngle: 0,
        hitTimers: new Map(),
        cooldownTimer: 0
      },
      // [진화 5] 테슬라 뇌전포 (teslaShotgun) = 산탄 총포(5렙) + 번개 반지(5렙)
      teslaShotgun: {
        id: 'teslaShotgun',
        name: '테슬라 뇌전포',
        icon: '⚡💥',
        iconSprite: 'icon_teslashotgun',
        desc: '전방 부채꼴로 고전압 뇌전 탄환들을 일제 산탄 사격하며, 적중 시 체인 라이트닝과 하늘에서 낙뢰가 동시 폭격됩니다.',
        baseCooldown: 1.25,
        baseDamage: 45,
        baseCount: 6,       // 6발 뇌전 산탄
        baseArea: 1.20,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // [신규 기본 무기 1] 맹독 비수 (poisonDagger)
      poisonDagger: {
        id: 'poisonDagger',
        name: '맹독 비수',
        icon: '🗡️🧪',
        iconSprite: 'icon_poisondagger',
        desc: '바라보는 방향으로 독이 묻은 비수를 쾌속 연사하며 피격된 적에게 중독 피해를 입힙니다.',
        baseCooldown: 0.38,
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

      // [신규 기본 무기 2] 빙결 보주 (frostOrb)
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

      // [진화 6] 베놈 블리자드 (venomBlizzard = 맹독 비수 5Lv + 빙결 보주 5Lv, 추천안 C 2단계 원거리 발사형)
      venomBlizzard: {
        id: 'venomBlizzard',
        name: '베놈 블리자드',
        icon: '❄️🧪',
        iconSprite: 'icon_venomblizzard',
        desc: '거대한 서리독 구체를 전방으로 발사합니다. 구체는 전진하며 초당 2회 냉기 파동을 방출하고, 수명 종료 시 8방향으로 독성 얼음 파편을 폭발 방출합니다.',
        baseCooldown: 1.80,
        baseDamage: 45,
        baseCount: 1,
        baseArea: 1.25,
        cooldownLevel: 0,
        damageLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },

      // 이전 진화 무기 호환용
      spinningAxe: { id: 'slayerBladeStorm' },
      bladeWhip: { id: 'morningstarTempest' },
      holyShotgun: { id: 'heavenlySanctuary' },
      arcaneSanctuary: { id: 'apocalypseComet' },
      plasmaTempest: { id: 'teslaShotgun' }
    };

    if (baseConfigs[type]) {
      const targetId = baseConfigs[type].id || type;
      const cfg = baseConfigs[targetId] || baseConfigs[type];
      this.weapons[targetId] = { ...cfg };
    }
  }

  getTotalUpgrades(w) {
    if (!w) return 0;
    return (w.cooldownLevel || w.speedLevel || 0) + (w.damageLevel || 0) + (w.countLevel || 0) + (w.areaLevel || 0) + (w.speedProjLevel || 0);
  }

  getLevel(w) {
    if (!w) return 0;
    return Math.min(5, 1 + this.getTotalUpgrades(w));
  }

  upgradeWeapon(type, statType) {
    // 호환용 키 보정
    let targetKey = type;
    if (!this.weapons[targetKey]) {
      if (type === 'throwingDagger') targetKey = 'shuriken';
      else if (type === 'spinningAxe') targetKey = 'slayerBladeStorm';
      else if (type === 'bladeWhip') targetKey = 'morningstarTempest';
      else if (type === 'holyShotgun') targetKey = 'heavenlySanctuary';
      else if (type === 'arcaneSanctuary') targetKey = 'apocalypseComet';
      else if (type === 'plasmaTempest') targetKey = 'teslaShotgun';
    }
    const w = this.weapons[targetKey];
    if (!w) return;

    // 5레벨 MAX (초기 1레벨 + 4회 강화로 5레벨 완성)
    if (this.getTotalUpgrades(w) >= 4) return;

    if (statType === 'cooldown' || statType === 'speed') {
      w.cooldownLevel = (w.cooldownLevel || w.speedLevel || 0) + 1;
      w.speedLevel = w.cooldownLevel;
    } else if (statType === 'damage') {
      w.damageLevel = (w.damageLevel || 0) + 1;
    } else if (statType === 'count') {
      w.countLevel = (w.countLevel || 0) + 1;
    } else if (statType === 'area') {
      w.areaLevel = (w.areaLevel || 0) + 1;
    } else if (statType === 'speedProj') {
      w.speedProjLevel = (w.speedProjLevel || 0) + 1;
    }
  }

  getCooldown(w) {
    const cdLevel = (w.cooldownLevel !== undefined) ? w.cooldownLevel : (w.speedLevel || 0);
    const cooldownBonus = 1 + cdLevel * 0.15; // 레벨당 쿨다운 15% 단축 (기존 10%에서 5% 상향)
    const totalMult = this.player.globalCooldownMult * cooldownBonus;
    return Math.max(0.10, w.baseCooldown / totalMult);
  }

  getDamage(w) {
    const dmgBonus = 1 + (w.damageLevel || 0) * 0.30; // 레벨당 데미지 30% 증가
    return Math.round(w.baseDamage * dmgBonus * this.player.atkPowerMult);
  }

  getCount(w) {
    const extra = (w.countLevel || 0) + (this.player.bonusProjectiles || 0);
    if (w.id === 'shotgun' || w.id === 'teslaShotgun') {
      return w.baseCount + extra * 2; // 산탄총포: 투사체 추가시마다 2발씩 추가
    }
    return w.baseCount + extra;
  }

  getArea(w) {
    const areaBonus = 1 + (w.areaLevel || 0) * 0.20; // 레벨당 범위 20% 증가
    return w.baseArea * areaBonus * (this.player.bonusAreaMult || 1.0);
  }

  // 1. 일반 검 (sword): 가장 가까운 적을 향해 날렵한 근접 베기 (360도 자동 조준)
  executeSwordSlash(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const closestEnemy = this.getClosestEnemy(enemies);
    let targetAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      targetAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }
    const angle = targetAngle + (Math.random() - 0.5) * 0.1;
    this.player.triggerAttackAnim('sword', angle, 0.12, { area });

    this.slashes.push({
      type: 'cone',
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      arc: 0.72,          // 날렵한 부채꼴 각도
      range: 80 * area,   // 사거리
      damage: dmg,
      knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
      knockbackForce: 130, // 넉백 보강 (100 -> 130)
      life: 0.10,
      maxLife: 0.10,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // 2. 도끼 (axe): 원형 회전 베기
  executeAxeSlash(w) {
    sounds.playWhip();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const defaultAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    this.player.triggerAttackAnim('axe', defaultAngle, 0.22, { area });

    this.slashes.push({
      type: 'circle',
      x: this.player.x,
      y: this.player.y,
      radius: 95 * area,
      damage: dmg,
      knockbackDir: null,
      knockbackForce: 240,
      life: 0.22,
      maxLife: 0.22,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // 3. 채찍 (whip): 자동 타겟 방향 및 반대 방향 교차 부채꼴 긁어내기
  executeWhipStrike(w, isBack = false, baseAngle = null) {
    sounds.playWhip();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    let targetAngle = baseAngle;
    if (targetAngle === null || targetAngle === undefined) {
      targetAngle = (w.lastTargetAngle !== undefined) ? w.lastTargetAngle : Math.atan2(this.player.facing.y, this.player.facing.x);
    }
    const angle = isBack ? (targetAngle + Math.PI) : targetAngle;

    const arc = 1.95; // 약 112도의 넓은 부채꼴 호
    const range = 165 * area; // 긴 사거리
    this.player.triggerAttackAnim('whip', angle, 0.20, { arc, range, area });

    this.slashes.push({
      type: 'cone',
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      arc: arc,
      range: range,
      damage: dmg,
      knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
      knockbackForce: 210,
      life: 0.18,
      maxLife: 0.18,
      drawSector: true,
      maxAlpha: 0.26,
      startColor: 'rgba(251, 191, 36, 0.35)',
      midColor: 'rgba(245, 158, 11, 0.20)',
      endColor: 'rgba(251, 191, 36, 0.40)',
      strokeColor: 'rgba(253, 224, 71, 0.70)',
      lineWidth: 3,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // [진화 1] 천상의 성역 (heavenlySanctuary): 초대형 결계 + 내부 성수 정화 도트 + 적 빙결(동결) 효과
  executeHeavenlySanctuaryTick(w, enemies) {
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 135 * area;
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

    let hitCount = 0;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= radius + enemy.radius) {
        enemy.takeDamage(dmg, null, 0);
        hitCount++;

        // 낮은 확률로 적 얼림(동결 1.5초, 보스는 40% 감속) 효과 부여 (약 5%)
        if (Math.random() < 0.05 && !enemy.isDead && typeof enemy.freeze === 'function') {
          enemy.freeze(1.5);
        }
      }
    }

    for (const obs of obstacles) {
      if (obs.isDead || !obs.isDestructible) continue;
      const dist = Math.hypot(obs.x - this.player.x, obs.y - this.player.y);
      if (dist <= radius + obs.radius) {
        obs.takeDamage(dmg, this.game);
        hitCount++;
      }
    }

    if (hitCount > 0) {
      sounds.playAcid();
    }
  }

  // [진화 2] 모닝스타 선풍 (morningstarTempest): 일반 채찍과 동일하게 휘두르며 첫 번째 타겟 적중 시 4방향 관통 표창 방출
  executeMorningstarTempest(w, isBack = false, baseAngle = null) {
    sounds.playWhip();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    let targetAngle = baseAngle;
    if (targetAngle === null || targetAngle === undefined) {
      targetAngle = (w.lastTargetAngle !== undefined) ? w.lastTargetAngle : Math.atan2(this.player.facing.y, this.player.facing.x);
    }
    const angle = isBack ? (targetAngle + Math.PI) : targetAngle;

    const arc = 2.05; // 채찍과 유사한 약 118도의 넓은 부채꼴 호
    const range = 210 * area; // 채찍보다 확장된 사거리
    this.player.triggerAttackAnim('whip', angle, 0.20, { arc, range, area });

    // 타격 슬래시 등록 (첫 타겟 적중 시 4방향 표창 생성 트리거 포함)
    this.slashes.push({
      type: 'cone',
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      arc: arc,
      range: range,
      damage: dmg,
      knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
      knockbackForce: 280,
      life: 0.20,
      maxLife: 0.20,
      drawSector: true,
      maxAlpha: 0.30,
      startColor: 'rgba(251, 191, 36, 0.40)',
      midColor: 'rgba(245, 158, 11, 0.25)',
      endColor: 'rgba(251, 191, 36, 0.50)',
      strokeColor: 'rgba(254, 240, 138, 0.85)',
      lineWidth: 4,
      isMorningstarTempest: true,
      weaponRef: w,
      shurikenSpawned: false,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // 모닝스타 선풍: 첫 번째 타겟 적중 위치에서 4방향 관통 표창 발사
  triggerMorningstar4Shurikens(tx, ty, w) {
    sounds.playSlash();
    const dmg = Math.round(this.getDamage(w) * 0.75);
    const area = this.getArea(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 520 * projSpeedBonus;

    // 4방향(상, 하, 좌, 우) 관통 표창 발사
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2; // 0, 90, 180, 270도
      this.projectiles.push({
        type: 'shuriken',
        x: tx,
        y: ty,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 * area,
        area: area,
        damage: dmg,
        pierce: 3 + Math.floor((w.countLevel || 0) / 2),
        knockbackForce: 150,
        life: 0.65,
        homing: false,
        rotAngle: Math.random() * Math.PI * 2,
        color: '#facc15',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }

    if (this.game) {
      this.game.addParticles(tx, ty, '#facc15', 12);
      this.game.addParticles(tx, ty, '#38bdf8', 8);
    }
  }

  // [진화 3] 멸망의 혜성 (apocalypseComet): 유도 고열 화염 혜성 연사 및 초대형 연쇄 폭발
  executeApocalypseComet(w, enemies) {
    const count = this.getCount(w);
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 520 * projSpeedBonus;

    sounds.playShoot();
    sounds.playMagic();

    const closestEnemy = this.getClosestEnemy(enemies);
    let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'apocalypseComet',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 9 * area,
        area: area,
        damage: dmg,
        pierce: 1, // 착탄 시 폭발
        splashRadius: 90 * area, // 초대형 폭발
        splashDamage: Math.round(dmg * 0.90),
        knockbackForce: 220,
        life: 1.4,
        homing: true,
        color: '#ef4444',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [진화 4] 학살자의 폭풍검 (slayerBladeStorm): 상시 회전 칼날은 update에서 처리 (검기 삭제)
  executeSlayerBladeStorm(w, enemies) {
    // 검기 삭제 완료 - 상시 궤도 회전 대검/도끼로만 전투 수행
  }

  // [진화 5] 테슬라 뇌전포 (teslaShotgun): 고전압 뇌전 산탄 + 체인 라이트닝 + 즉시 낙뢰 폭격
  executeTeslaShotgun(w, enemies) {
    sounds.playShotgun();
    sounds.playLightning();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 580 * projSpeedBonus;

    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    this.player.triggerAttackAnim('muzzle', baseAngle, 0.16, { area });

    const spreadTotal = 0.85;
    for (let i = 0; i < count; i++) {
      const angleOffset = (Math.random() - 0.5) * spreadTotal;
      const angle = baseAngle + angleOffset;
      this.projectiles.push({
        type: 'teslaPellet',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 * area,
        area: area,
        damage: dmg,
        pierce: 1, // 착탄 시 번개 및 낙뢰 발동
        knockbackForce: 200,
        life: 0.60,
        homing: false,
        color: '#38bdf8',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // 이전 진화무기 호환용 메소드들
  executeBladeWhipStrike(w, isBack = false) {
    this.executeMorningstarTempest(w, isBack);
  }

  executeArcaneSanctuary(w, enemies) {
    this.executeApocalypseComet(w, enemies);
  }

  executePlasmaTempest(w, enemies) {
    this.executeTeslaShotgun(w, enemies);
  }

  // 기본 무기 성역 (sanctuary)
  executeSanctuaryTick(w, enemies) {
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 90 * area;
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

    let hitCount = 0;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= radius + enemy.radius) {
        enemy.takeDamage(dmg, null, 0);
        hitCount++;
      }
    }

    for (const obs of obstacles) {
      if (obs.isDead || !obs.isDestructible) continue;
      const dist = Math.hypot(obs.x - this.player.x, obs.y - this.player.y);
      if (dist <= radius + obs.radius) {
        obs.takeDamage(dmg, this.game);
        hitCount++;
      }
    }

    if (hitCount > 0) {
      sounds.playAcid();
    }
  }

  // 기본 무기 번개 반지 (lightningRing)
  executeLightningStrike(w, enemies) {
    const count = this.getCount(w);
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 48 * area;
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

    const aliveEnemies = enemies.filter(e => !e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 650);

    for (let i = 0; i < count; i++) {
      let tx, ty;
      if (aliveEnemies.length > 0) {
        const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        tx = target.x + (Math.random() - 0.5) * 16;
        ty = target.y + (Math.random() - 0.5) * 16;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 160;
        tx = this.player.x + Math.cos(angle) * dist;
        ty = this.player.y + Math.sin(angle) * dist;
      }

      const segments = [{ x: tx, y: ty - 450 }];
      const steps = 7;
      for (let s = 1; s < steps; s++) {
        const frac = s / steps;
        segments.push({
          x: tx + (Math.random() - 0.5) * 45,
          y: (ty - 450) + 450 * frac
        });
      }
      segments.push({ x: tx, y: ty });

      this.lightningStrikes.push({
        x: tx,
        y: ty,
        segments: segments,
        radius: radius,
        life: 0.18,
        maxLife: 0.18
      });

      for (const e of enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d <= radius + e.radius) {
          const kbDir = {
            x: (e.x - tx) / (d || 1),
            y: (e.y - ty) / (d || 1)
          };
          e.takeDamage(dmg, kbDir, 160);
        }
      }

      for (const obs of obstacles) {
        if (obs.isDead || !obs.isDestructible) continue;
        const d = Math.hypot(obs.x - tx, obs.y - ty);
        if (d <= radius + obs.radius) {
          obs.takeDamage(dmg, this.game);
        }
      }

      if (this.game) {
        this.game.addParticles(tx, ty, '#38bdf8', 8);
        this.game.addParticles(tx, ty, '#fef08a', 8);
      }
    }

    sounds.playLightning();
  }

  // 기본 무기 화염 지팡이 (fireWand)
  executeFireWand(w, enemies) {
    const count = this.getCount(w);
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 460 * projSpeedBonus;

    sounds.playShoot();
    const closestEnemy = this.getClosestEnemy(enemies);
    let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.18 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'fireball',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7 * area,
        area: area,
        damage: dmg,
        pierce: 1,
        splashRadius: 65 * area,
        splashDamage: Math.round(dmg * 0.85),
        knockbackForce: 170,
        life: 0.82,
        homing: false,
        color: '#f97316',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  update(dt, enemies) {
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

    // 번개 및 플라즈마 이펙트 수명 업데이트
    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      this.lightningStrikes[i].life -= dt;
      if (this.lightningStrikes[i].life <= 0) {
        this.lightningStrikes.splice(i, 1);
      }
    }
    for (let i = this.plasmaStrikes.length - 1; i >= 0; i--) {
      this.plasmaStrikes[i].life -= dt;
      if (this.plasmaStrikes[i].life <= 0) {
        this.plasmaStrikes.splice(i, 1);
      }
    }

    // [진화 1] 천상의 성역 (heavenlySanctuary) 상시 성수 도트 결계 & 빙결
    const heavenly = this.weapons['heavenlySanctuary'] || this.weapons['holyShotgun'];
    if (heavenly) {
      heavenly.cooldownTimer -= dt;
      if (heavenly.cooldownTimer <= 0) {
        this.executeHeavenlySanctuaryTick(heavenly, enemies);
        heavenly.cooldownTimer = this.getCooldown(heavenly);
      }
    }

    // 일반 검 연속 베기 콤보
    if (this.swordComboQueue > 0) {
      this.swordComboTimer -= dt;
      if (this.swordComboTimer <= 0) {
        this.swordComboQueue--;
        this.swordComboTimer = 0.08;
        const sword = this.weapons['sword'];
        if (sword) this.executeSwordSlash(sword, enemies);
      }
    }

    // 도끼 연속 베기 콤보
    if (this.axeComboQueue > 0) {
      this.axeComboTimer -= dt;
      if (this.axeComboTimer <= 0) {
        this.axeComboQueue--;
        this.axeComboTimer = 0.12;
        const axe = this.weapons['axe'];
        if (axe) this.executeAxeSlash(axe);
      }
    }

    // 채찍 전후방 교차 연타 큐 처리
    if (this.whipStrikesQueue.length > 0) {
      this.whipStrikeTimer -= dt;
      if (this.whipStrikeTimer <= 0) {
        const isBack = this.whipStrikesQueue.shift();
        this.whipStrikeTimer = 0.11;
        const whip = this.weapons['whip'];
        if (whip) this.executeWhipStrike(whip, isBack, whip.lastTargetAngle);
      }
    }

    // [진화 2] 모닝스타 선풍 전후방 교차 연타 큐 처리
    if (this.bladeWhipStrikesQueue.length > 0) {
      this.bladeWhipStrikeTimer -= dt;
      if (this.bladeWhipStrikeTimer <= 0) {
        const isBack = this.bladeWhipStrikesQueue.shift();
        this.bladeWhipStrikeTimer = 0.10;
        const msTempest = this.weapons['morningstarTempest'] || this.weapons['bladeWhip'];
        if (msTempest) this.executeMorningstarTempest(msTempest, isBack, msTempest.lastTargetAngle);
      }
    }

    // [진화 4] 학살자의 폭풍검 (slayerBladeStorm) 상시 궤도 회전 타격
    const bladeStorm = this.weapons['slayerBladeStorm'] || this.weapons['spinningAxe'];
    if (bladeStorm) {
      const projSpeedMult = (1 + (bladeStorm.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbitSpeed = 4.8 * projSpeedMult;
      bladeStorm.orbitAngle = (bladeStorm.orbitAngle || 0) + orbitSpeed * dt;

      const orbitRadius = 82 * this.getArea(bladeStorm);
      const count = this.getCount(bladeStorm);
      const dmg = this.getDamage(bladeStorm);

      if (!bladeStorm.hitTimers) bladeStorm.hitTimers = new Map();
      for (const [target, timer] of bladeStorm.hitTimers.entries()) {
        const nextTimer = timer - dt;
        if (nextTimer <= 0 || target.isDead) {
          bladeStorm.hitTimers.delete(target);
        } else {
          bladeStorm.hitTimers.set(target, nextTimer);
        }
      }

      for (let i = 0; i < count; i++) {
        const angle = bladeStorm.orbitAngle + (i * Math.PI * 2) / count;
        const bx = this.player.x + Math.cos(angle) * orbitRadius;
        const by = this.player.y + Math.sin(angle) * orbitRadius;
        const bladeRadius = 22 * this.getArea(bladeStorm);

        // 적 타격
        for (const enemy of enemies) {
          if (enemy.isDead || bladeStorm.hitTimers.has(enemy)) continue;
          const dist = Math.hypot(enemy.x - bx, enemy.y - by);
          if (dist <= bladeRadius + enemy.radius) {
            bladeStorm.hitTimers.set(enemy, 0.30);
            const kbDir = {
              x: (enemy.x - this.player.x) / (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) || 1),
              y: (enemy.y - this.player.y) / (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) || 1)
            };
            enemy.takeDamage(dmg, kbDir, 240); // 넉백 상향 (180 -> 240)
            sounds.playSlash();
          }
        }

        // 파괴 가능 장애물 타격
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible || bladeStorm.hitTimers.has(obs)) continue;
          const dist = Math.hypot(obs.x - bx, obs.y - by);
          if (dist <= bladeRadius + obs.radius) {
            bladeStorm.hitTimers.set(obs, 0.25);
            obs.takeDamage(dmg, this.game);
          }
        }

        // [특수 기믹] 몬스터 및 보스 원거리 투사체 요격 및 삭제 (패링)
        // 후반부 다량의 탄막 삭제 시 렉 방지를 위해 파티클/사운드 없이 무음·무이펙트로 즉시 삭제
        if (this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
          for (let pIdx = this.game.bossProjectiles.length - 1; pIdx >= 0; pIdx--) {
            const bp = this.game.bossProjectiles[pIdx];
            const pDist = Math.hypot(bp.x - bx, bp.y - by);
            if (pDist <= bladeRadius + (bp.radius || 6)) {
              // 투사체 즉시 제거 (플레이어 피격 방지, 0ms 부하 없는 무음·무이펙트 처리)
              this.game.bossProjectiles.splice(pIdx, 1);
            }
          }
        }
      }
    }

    // 무기 쿨다운 업데이트 및 발사 트리거
    for (const key in this.weapons) {
      const w = this.weapons[key];
      if (w.id === 'spinningAxe') continue; // 상시 지속 회전
      w.cooldownTimer -= dt;

      if (w.cooldownTimer <= 0) {
        this.fireWeapon(w, enemies);
        w.cooldownTimer = this.getCooldown(w);
      }
    }

    // 1. 근접 베기 판정 업데이트
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
        continue;
      }

      // 플레이어 이동과 함께 부채꼴 중심 동기화
      s.x = this.player.x;
      s.y = this.player.y;

      // 적 타격
      for (const enemy of enemies) {
        if (enemy.isDead || s.hitEnemies.has(enemy)) continue;
        const dist = Math.hypot(enemy.x - s.x, enemy.y - s.y);
        let inHitbox = false;

        if (s.type === 'circle') {
          inHitbox = dist <= s.radius + enemy.radius;
        } else if (s.type === 'cone') {
          // 부채꼴 전체 판정: 플레이어 중심(거리 0)부터 사거리 끝(s.range)까지
          if (dist <= s.range + enemy.radius) {
            // 아주 근접한 적(28px 이내)은 각도 무관 즉시 타격
            if (dist <= 28 + enemy.radius) {
              inHitbox = true;
            } else {
              const angleToEnemy = Math.atan2(enemy.y - s.y, enemy.x - s.x);
              let diff = Math.abs(angleToEnemy - s.angle);
              while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
              if (diff <= s.arc / 2) {
                inHitbox = true;
              }
            }
          }
        }

        if (inHitbox) {
          s.hitEnemies.add(enemy);
          const kbDir = s.knockbackDir || {
            x: (enemy.x - s.x) / (dist || 1),
            y: (enemy.y - s.y) / (dist || 1)
          };
          enemy.takeDamage(s.damage, kbDir, s.knockbackForce);
          sounds.playHit();

          // 모닝스타 선풍: 첫 번째 적중 시 적중 위치에서 4방향 관통 표창 방출
          if (s.isMorningstarTempest && !s.shurikenSpawned) {
            s.shurikenSpawned = true;
            this.triggerMorningstar4Shurikens(enemy.x, enemy.y, s.weaponRef);
          }
        }
      }

      // 파괴 가능 장애물 타격
      for (const obs of obstacles) {
        if (obs.isDead || !obs.isDestructible || s.hitObstacles.has(obs)) continue;
        const dist = Math.hypot(obs.x - s.x, obs.y - s.y);
        let inHitbox = false;

        if (s.type === 'circle') {
          inHitbox = dist <= s.radius + obs.radius;
        } else if (s.type === 'cone') {
          if (dist <= s.range + obs.radius) {
            const angleToObs = Math.atan2(obs.y - s.y, obs.x - s.x);
            let diff = Math.abs(angleToObs - s.angle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff <= s.arc / 2) inHitbox = true;
          }
        }

        if (inHitbox) {
          s.hitObstacles.add(obs);
          obs.takeDamage(s.damage, this.game);

          // 모닝스타 선풍: 장애물에 첫 적중 시에도 4방향 관통 표창 방출
          if (s.isMorningstarTempest && !s.shurikenSpawned) {
            s.shurikenSpawned = true;
            this.triggerMorningstar4Shurikens(obs.x, obs.y, s.weaponRef);
          }
        }
      }
    }

    // 2. 원거리 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.type === 'shuriken') {
        p.rotAngle = (p.rotAngle || 0) + dt * 32;
      }

      if (p.life <= 0) {
        if ((p.type === 'fireball' || p.type === 'apocalypseComet') && p.splashRadius > 0 && !p.exploded) {
          p.exploded = true;
          this.triggerFireSplash(p, enemies, obstacles);
        }
        if (p.type === 'venomBlizzardOrb' && !p.exploded) {
          p.exploded = true;
          this.triggerVenomBlizzardShards(p.x, p.y, p.area, p.damage);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // 빙결 보주 & 베놈 블리자드 보주 비행 중 주기적 냉기 파동 발산
      if (p.type === 'frostOrb' || p.type === 'venomBlizzardOrb') {
        p.pulseTimer = (p.pulseTimer || 0) - dt;
        if (p.pulseTimer <= 0) {
          p.pulseTimer = p.type === 'venomBlizzardOrb' ? 0.30 : 0.35;
          const pulseRadius = (p.type === 'venomBlizzardOrb' ? 125 : 85) * (p.area || 1.0);
          for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
            if (dist <= pulseRadius + enemy.radius) {
              enemy.takeDamage(p.damage, null, 0);
              if (p.type === 'venomBlizzardOrb') {
                enemy.freeze(1.5);
                enemy.poison(3.0, Math.round(p.damage * 0.5));
              } else {
                enemy.slowTimer = 1.5;
                enemy.slowMult = 0.65;
              }
            }
          }
          if (window.game) {
            window.game.addParticles(p.x, p.y, p.color, 4);
          }
        }
      }

      // 유도 로직 (마법 화살 & 멸망의 혜성 & 비전 미사일)
      if (p.homing && enemies.length > 0) {
        let closest = null;
        let minDist = 550;
        for (const e of enemies) {
          if (e.isDead) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < minDist) {
            minDist = d;
            closest = e;
          }
        }
        if (closest) {
          const targetAngle = Math.atan2(closest.y - p.y, closest.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + diff * Math.min(1, dt * 10);
          const spd = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(newAngle) * spd;
          p.vy = Math.sin(newAngle) * spd;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 적 충돌 검사
      for (const enemy of enemies) {
        if (enemy.isDead || p.hitEnemies.has(enemy)) continue;

        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= p.radius + enemy.radius) {
          p.hitEnemies.add(enemy);
          const kbDir = { x: p.vx / (Math.hypot(p.vx, p.vy) || 1), y: p.vy / (Math.hypot(p.vx, p.vy) || 1) };
          enemy.takeDamage(p.damage, kbDir, p.knockbackForce);
          sounds.playHit();

          // 맹독 비수 및 독 파편 적중 시 중독 부여
          if (p.type === 'poisonDagger' || p.type === 'poisonShard') {
            enemy.poison(3.0, Math.round(p.damage * 0.45));
          }

          if (p.splashRadius > 0) {
            if (p.type === 'fireball' || p.type === 'apocalypseComet') {
              p.exploded = true;
              this.triggerFireSplash(p, enemies, obstacles);
            } else {
              this.triggerHolySplash(p, enemies, obstacles);
            }
          }

          // 테슬라 뇌전탄 적중 시 체인 라이트닝 + 하늘 낙뢰
          if (p.type === 'teslaPellet') {
            this.triggerTeslaStrike(p, enemy, enemies);
          }

          p.pierce -= 1;
          if (p.pierce <= 0) {
            p.life = 0;
            break;
          }
        }
      }

      // 파괴 가능 장애물 충돌 검사
      if (p.life > 0) {
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible || p.hitObstacles.has(obs)) continue;
          const dist = Math.hypot(obs.x - p.x, obs.y - p.y);
          if (dist <= p.radius + obs.radius) {
            p.hitObstacles.add(obs);
            obs.takeDamage(p.damage, this.game);

            if (p.splashRadius > 0) {
              if (p.type === 'fireball' || p.type === 'apocalypseComet') {
                p.exploded = true;
                this.triggerFireSplash(p, enemies, obstacles);
              } else {
                this.triggerHolySplash(p, enemies, obstacles);
              }
            }

            p.pierce -= 1;
            if (p.pierce <= 0) {
              p.life = 0;
              break;
            }
          }
        }
      }
    }

    // 3. 도트 장판 업데이트
    for (let i = this.damagePools.length - 1; i >= 0; i--) {
      const pool = this.damagePools[i];
      pool.life -= dt;
      pool.tickTimer -= dt;

      if (pool.tickTimer <= 0) {
        pool.tickTimer = 0.80; // 0.80초마다 틱 피해
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const dist = Math.hypot(enemy.x - pool.x, enemy.y - pool.y);
          if (dist <= pool.radius + enemy.radius) {
            enemy.takeDamage(pool.damage, null, 0);
          }
        }
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible) continue;
          const dist = Math.hypot(obs.x - pool.x, obs.y - pool.y);
          if (dist <= pool.radius + obs.radius) {
            obs.takeDamage(pool.damage, this.game);
          }
        }
      }

      if (pool.life <= 0) {
        this.damagePools.splice(i, 1);
      }
    }
  }

  triggerTeslaStrike(p, hitEnemy, enemies) {
    sounds.playLightning();
    // 1. 적 머리 위로 즉시 낙뢰 생성
    const tx = hitEnemy.x;
    const ty = hitEnemy.y;
    const segments = [{ x: tx, y: ty - 400 }];
    for (let s = 1; s < 5; s++) {
      segments.push({
        x: tx + (Math.random() - 0.5) * 35,
        y: (ty - 400) + 400 * (s / 5)
      });
    }
    segments.push({ x: tx, y: ty });
    this.lightningStrikes.push({
      x: tx,
      y: ty,
      segments,
      radius: 42,
      life: 0.16,
      maxLife: 0.16
    });

    // 테슬라 뇌전포 낙뢰 착탄 고전압 스파크 파티클 연출
    if (this.game && this.game.addParticles) {
      this.game.addParticles(tx, ty, '#38bdf8', 12);
      this.game.addParticles(tx, ty, '#ffffff', 8);
    }

    // 2. 주변 적 2~3마리 체인 라이트닝 감전
    let chained = 0;
    for (const other of enemies) {
      if (other === hitEnemy || other.isDead) continue;
      const d = Math.hypot(other.x - tx, other.y - ty);
      if (d < 160) {
        other.takeDamage(Math.round(p.damage * 0.7), null, 80);
        if (this.game && this.game.addParticles) {
          this.game.addParticles(other.x, other.y, '#38bdf8', 6);
          this.game.addParticles(other.x, other.y, '#ffffff', 4);
        }
        chained++;
        if (chained >= 3) break;
      }
    }
  }

  triggerHolySplash(p, enemies, obstacles) {
    if (this.game) {
      this.game.addParticles(p.x, p.y, '#fef08a', 12);
      this.game.addParticles(p.x, p.y, '#38bdf8', 8);
    }
    sounds.playSlash();
    const splashR = p.splashRadius;
    const splashDmg = p.splashDamage;

    for (const enemy of enemies) {
      if (enemy.isDead || p.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d <= splashR + enemy.radius) {
        p.hitEnemies.add(enemy);
        const kbDir = {
          x: (enemy.x - p.x) / (d || 1),
          y: (enemy.y - p.y) / (d || 1)
        };
        enemy.takeDamage(splashDmg, kbDir, 100);
      }
    }

    for (const obs of obstacles) {
      if (obs.isDead || !obs.isDestructible || p.hitObstacles.has(obs)) continue;
      const d = Math.hypot(obs.x - p.x, obs.y - p.y);
      if (d <= splashR + obs.radius) {
        p.hitObstacles.add(obs);
        obs.takeDamage(splashDmg, this.game);
      }
    }
  }

  triggerFireSplash(p, enemies, obstacles) {
    if (this.game) {
      this.game.addParticles(p.x, p.y, '#f97316', 14);
      this.game.addParticles(p.x, p.y, '#ef4444', 10);
      this.game.addParticles(p.x, p.y, '#fef08a', 8);
    }
    sounds.playExplosion();
    const splashR = p.splashRadius;
    const splashDmg = p.splashDamage;

    for (const enemy of enemies) {
      if (enemy.isDead || p.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d <= splashR + enemy.radius) {
        p.hitEnemies.add(enemy);
        const kbDir = {
          x: (enemy.x - p.x) / (d || 1),
          y: (enemy.y - p.y) / (d || 1)
        };
        enemy.takeDamage(splashDmg, kbDir, 160);
      }
    }

    for (const obs of obstacles) {
      if (obs.isDead || !obs.isDestructible || p.hitObstacles.has(obs)) continue;
      const d = Math.hypot(obs.x - p.x, obs.y - p.y);
      if (d <= splashR + obs.radius) {
        p.hitObstacles.add(obs);
        obs.takeDamage(splashDmg, this.game);
      }
    }
  }

  fireWeapon(w, enemies) {
    const count = this.getCount(w);
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);

    switch (w.id) {
      case 'sword': {
        this.executeSwordSlash(w, enemies);
        if (count > 1) {
          this.swordComboQueue = count - 1;
          this.swordComboTimer = 0.08;
        }
        break;
      }

      case 'axe': {
        this.executeAxeSlash(w);
        if (count > 1) {
          this.axeComboQueue = count - 1;
          this.axeComboTimer = 0.12;
        }
        break;
      }

      case 'whip': {
        // 채찍: 가장 가까운 몬스터 자동 타겟팅
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        w.lastTargetAngle = baseAngle;

        // 연속공격 업그레이드 시 교차 연타 순서:
        // 1회(기본): 타겟 방향 1회 (앞)
        // 2회: 타겟 1회(앞) ➔ 반대 방향 1회(뒤)
        // 3회: 타겟 1회(앞) ➔ 반대 1회(뒤) ➔ 타겟 1회(앞)
        // 4회: 타겟 ➔ 반대 ➔ 타겟 ➔ 반대
        const pattern = [];
        for (let i = 0; i < count; i++) {
          pattern.push(i % 2 === 1); // false: 타겟 방향, true: 반대 방향
        }
        this.executeWhipStrike(w, pattern[0], baseAngle);
        this.whipStrikesQueue = pattern.slice(1);
        this.whipStrikeTimer = 0.11;
        break;
      }

      case 'shuriken':
      case 'throwingDagger': {
        // 표창: 몬스터 방향으로 고속 회전하며 관통하는 수리검 투척
        sounds.playSlash();
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        const speed = 560 * projSpeedBonus;
        const maxDist = 310 * area;
        const lifeTime = maxDist / speed;

        for (let i = 0; i < count; i++) {
          const spread = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
          const angle = baseAngle + spread;
          this.projectiles.push({
            type: 'shuriken',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 6 * area,
            area: area,
            damage: dmg,
            pierce: 3 + Math.floor((w.countLevel || 0) / 2),
            knockbackForce: 130,
            life: lifeTime,
            homing: false,
            rotAngle: Math.random() * Math.PI * 2,
            color: '#38bdf8',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      // [진화 2] 모닝스타 선풍 (morningstarTempest): 일반 채찍과 동일하게 자동 조준 및 교차 연타
      case 'morningstarTempest':
      case 'bladeWhip': {
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        w.lastTargetAngle = baseAngle;

        const pattern = [];
        for (let i = 0; i < count; i++) {
          pattern.push(i % 2 === 1); // false: 타겟 방향, true: 반대 방향
        }
        this.executeMorningstarTempest(w, pattern[0], baseAngle);
        this.bladeWhipStrikesQueue = pattern.slice(1);
        this.bladeWhipStrikeTimer = 0.10;
        break;
      }

      // [진화 4] 학살자의 폭풍검 (slayerBladeStorm: 검기 삭제 완료 - 상시 궤도 회전만 동작)
      case 'slayerBladeStorm':
      case 'spinningAxe': {
        break;
      }

      // [진화 3] 멸망의 혜성 (apocalypseComet)
      case 'apocalypseComet':
      case 'arcaneSanctuary': {
        this.executeApocalypseComet(w, enemies);
        break;
      }

      // [진화 5] 테슬라 뇌전포 (teslaShotgun)
      case 'teslaShotgun':
      case 'plasmaTempest':
      case 'holyShotgun': {
        this.executeTeslaShotgun(w, enemies);
        break;
      }

      // [진화 1] 천상의 성역 (heavenlySanctuary)
      case 'heavenlySanctuary': {
        // 상시 오라 틱 및 충격파는 update()에서 처리
        this.executeHeavenlySanctuaryTick(w, enemies);
        break;
      }

      case 'magicMissile': {
        // 원거리 유도 마법 화살 (장거리 사거리 약 700px)
        sounds.playMagic();
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }

        const speed = 440 * projSpeedBonus;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.22;
          const angle = baseAngle + spread;
          this.projectiles.push({
            type: 'magic',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 7 * area,
            area: area,
            damage: dmg,
            pierce: 1,
            knockbackForce: 90,
            life: 1.6,
            homing: true,
            color: '#a855f7',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      case 'shotgun': {
        // 산탄 총포: 가장 가까운 적을 향해 전방 부채꼴 산탄 (자동 조준)
        sounds.playShotgun();
        const closest = this.getClosestEnemy(enemies);
        const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
        this.player.triggerAttackAnim('muzzle', baseAngle, 0.15, { area });

        const totalPellets = count;
        const spreadTotal = 0.72;
        const speed = 540 * projSpeedBonus;

        for (let i = 0; i < totalPellets; i++) {
          const angleOffset = (Math.random() - 0.5) * spreadTotal;
          const angle = baseAngle + angleOffset;
          this.projectiles.push({
            type: 'shotgun',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 5 * area,
            area: area,
            damage: dmg,
            pierce: 2,
            knockbackForce: 160,
            life: 0.52,
            homing: false,
            color: '#f97316',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      case 'sanctuary': {
        this.executeSanctuaryTick(w, enemies);
        break;
      }

      case 'holyWater':
      case 'acidPool': {
        sounds.playAcid();
        for (let i = 0; i < count; i++) {
          const randomEnemy = this.getRandomAliveEnemy(enemies, 700);
          let targetX = this.player.x + (Math.random() - 0.5) * 140;
          let targetY = this.player.y + (Math.random() - 0.5) * 140;

          if (randomEnemy) {
            targetX = randomEnemy.x + (Math.random() - 0.5) * 20;
            targetY = randomEnemy.y + (Math.random() - 0.5) * 20;
          }

          this.damagePools.push({
            x: targetX,
            y: targetY,
            radius: 60 * area,
            damage: dmg,
            life: 4.5,
            tickTimer: 0,
            color: '#38bdf8',
            isHoly: true
          });
        }
        break;
      }

      case 'lightningRing': {
        this.executeLightningStrike(w, enemies);
        break;
      }

      case 'fireWand': {
        this.executeFireWand(w, enemies);
        break;
      }

      case 'poisonDagger': {
        this.executePoisonDagger(w, enemies);
        break;
      }

      case 'frostOrb': {
        this.executeFrostOrb(w, enemies);
        break;
      }

      case 'venomBlizzard': {
        this.executeVenomBlizzard(w, enemies);
        break;
      }
    }
  }

  // 11. 맹독 비수 (poisonDagger): 플레이어 조준 방향으로 쾌속 직진 비수 연사 및 중독
  executePoisonDagger(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.20) * (this.player.bonusProjSpeedMult || 1.0);
    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    const speed = 520 * projSpeedBonus;

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.14 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'poisonDagger',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7 * area,
        area: area,
        damage: dmg,
        pierce: 2 + Math.floor((w.countLevel || 0) / 2),
        knockbackForce: 110,
        life: 0.65,
        color: '#22c55e',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // 12. 빙결 보주 (frostOrb): 천천히 전진하며 주변 지속 냉기 파동 발산 및 감속
  executeFrostOrb(w, enemies) {
    sounds.playMagic();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.20) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 130 * projSpeedBonus;

    const closestEnemy = this.getClosestEnemy(enemies);
    let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.24 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'frostOrb',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 14 * area,
        area: area,
        damage: dmg,
        pierce: 9999,
        knockbackForce: 50,
        pulseTimer: 0,
        life: 3.2,
        color: '#38bdf8',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [진화 6] 베놈 블리자드 (venomBlizzard: 추천안 C 2단계 원거리 발사형)
  executeVenomBlizzard(w, enemies) {
    sounds.playMagic();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.20) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 145 * projSpeedBonus;

    const closestEnemy = this.getClosestEnemy(enemies);
    let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'venomBlizzardOrb',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 20 * area,
        area: area,
        damage: dmg,
        pierce: 9999,
        knockbackForce: 60,
        pulseTimer: 0,
        life: 2.8,
        color: '#10b981',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // 베놈 블리자드 2단계: 8방향 서리독 파편 폭발
  triggerVenomBlizzardShards(x, y, area, damage) {
    sounds.playSlash();
    if (window.game) {
      window.game.addParticles(x, y, '#10b981', 25);
      window.game.addParticles(x, y, '#38bdf8', 25);
    }
    const shardSpeed = 460;
    const shardDmg = Math.round(damage * 1.35);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.projectiles.push({
        type: 'poisonShard',
        x: x,
        y: y,
        vx: Math.cos(angle) * shardSpeed,
        vy: Math.sin(angle) * shardSpeed,
        radius: 6 * area,
        area: area,
        damage: shardDmg,
        pierce: 3,
        knockbackForce: 130,
        life: 0.55,
        color: '#34d399',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  draw(ctx) {
    // 0. 성역 (sanctuary) 360도 오라 결계 렌더링
    const sanctuary = this.weapons['sanctuary'];
    if (sanctuary) {
      const area = this.getArea(sanctuary);
      const radius = 90 * area;
      const time = Date.now() * 0.002;
      const pulse = 0.16 + Math.sin(time * 3) * 0.05;

      ctx.save();
      // 성스러운 황금빛 오라 바닥
      ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 결계 외곽 테두리선
      ctx.strokeStyle = `rgba(253, 224, 71, ${pulse + 0.35})`;
      ctx.lineWidth = Math.max(2, Math.round(3 * Math.sqrt(area)));
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // 회전하는 8개 성스러운 룬 마커
      const runes = 8;
      for (let r = 0; r < runes; r++) {
        const rAngle = time + (r * Math.PI * 2) / runes;
        const rx = this.player.x + Math.cos(rAngle) * radius;
        const ry = this.player.y + Math.sin(rAngle) * radius;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5 * Math.sqrt(area), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 0.1 [진화 1] 천상의 성역 (heavenlySanctuary) 초대형 황금빛+성수 결계 렌더링
    const heavenly = this.weapons['heavenlySanctuary'] || this.weapons['holyShotgun'];
    if (heavenly) {
      const area = this.getArea(heavenly);
      const radius = 135 * area;
      const time = Date.now() * 0.003;
      const pulse = 0.24 + Math.sin(time * 3.5) * 0.08;

      ctx.save();
      // 성스러운 황금빛 + 청록빛(성수) 이중 결계
      const grad = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.2, this.player.x, this.player.y, radius);
      grad.addColorStop(0, `rgba(56, 189, 248, ${pulse * 0.5})`);
      grad.addColorStop(0.7, `rgba(250, 204, 21, ${pulse * 0.7})`);
      grad.addColorStop(1, `rgba(253, 224, 71, ${pulse * 0.2})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 결계 내부 성수 파동 링
      ctx.strokeStyle = `rgba(56, 189, 248, ${pulse + 0.3})`;
      ctx.lineWidth = Math.max(2, Math.round(2.5 * Math.sqrt(area)));
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius * 0.60, 0, Math.PI * 2);
      ctx.stroke();

      // 외곽 황금 테두리
      ctx.strokeStyle = `rgba(254, 240, 138, ${pulse + 0.45})`;
      ctx.lineWidth = Math.max(3, Math.round(4.5 * Math.sqrt(area)));
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // 회전하는 10개 천상 룬 마커
      const runes = 10;
      for (let r = 0; r < runes; r++) {
        const rAngle = time + (r * Math.PI * 2) / runes;
        const rx = this.player.x + Math.cos(rAngle) * radius;
        const ry = this.player.y + Math.sin(rAngle) * radius;
        ctx.fillStyle = r % 2 === 0 ? '#fef08a' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5 * Math.sqrt(area), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 1. 도트 장판 바닥 렌더링
    for (const pool of this.damagePools) {
      const alpha = Math.min(0.5, pool.life * 0.3);
      const isHoly = pool.isHoly || false;
      const isPlasma = pool.isPlasma || false;
      ctx.save();
      if (isPlasma) {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
      } else if (isHoly) {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();

      if (isPlasma) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${alpha + 0.35})`;
      } else if (isHoly) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha + 0.25})`;
      } else {
        ctx.strokeStyle = `rgba(134, 239, 172, ${alpha + 0.2})`;
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      const bubbleTime = Date.now() * 0.005;
      for (let b = 0; b < 3; b++) {
        const bx = pool.x + Math.sin(bubbleTime + b * 2) * (pool.radius * 0.6);
        const by = pool.y + Math.cos(bubbleTime + b * 2) * (pool.radius * 0.6);
        ctx.fillStyle = isPlasma ? `rgba(254, 240, 138, ${alpha + 0.4})` : (isHoly ? `rgba(224, 242, 254, ${alpha + 0.35})` : `rgba(187, 247, 208, ${alpha + 0.3})`);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 1.5 번개 낙뢰 이펙트 렌더링
    for (const ls of this.lightningStrikes) {
      const alpha = Math.min(1.0, ls.life / (ls.maxLife * 0.7));
      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      if (ls.segments && ls.segments.length > 0) {
        ctx.moveTo(ls.segments[0].x, ls.segments[0].y);
        for (let i = 1; i < ls.segments.length; i++) {
          ctx.lineTo(ls.segments[i].x, ls.segments[i].y);
        }
      }
      ctx.stroke();

      // 밝은 코어 번개선
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 지면 타격 충격 지점
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(ls.x, ls.y, ls.radius * (1 - ls.life / ls.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 1.6 플라즈마 폭풍 이펙트 렌더링
    for (const ps of this.plasmaStrikes) {
      const prog = 1 - (ps.life / ps.maxLife);
      const alpha = Math.min(1.0, ps.life / (ps.maxLife * 0.6));
      ctx.save();
      // 확장되는 플라즈마 충격파
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 5 * (1 - prog);
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * prog, 0, Math.PI * 2);
      ctx.stroke();

      // 중심 초고열 플라즈마 구
      ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * 0.35 * (1 - prog * 0.5), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * 0.18 * (1 - prog * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 근접 베기 렌더링: 투명 인디케이터(부채꼴/원형 선) 완전 제거 (순수 무기 휘두르기 스프라이트 연출만 표시)

    // 3. 투사체 렌더링 (범위 증가 시 투사체 크기도 비례 확대)
    for (const p of this.projectiles) {
      ctx.save();
      const projArea = p.area || 1.0;

      if (p.type === 'shuriken' || p.type === 'dagger') {
        // 표창 스프라이트 렌더링 (고속 회전 연출)
        const img = assets.images['proj_shuriken'] || assets.images['proj_dagger'];
        const size = Math.round(22 * projArea);
        const rot = p.rotAngle !== undefined ? p.rotAngle : (Math.atan2(p.vy, p.vx) + Math.PI / 2);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.translate(p.x, p.y);
          ctx.rotate(rot);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(rot);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-size / 2, -size / 6, size, size / 3);
          ctx.fillRect(-size / 6, -size / 2, size / 3, size);
          ctx.restore();
        }
      } else if (p.type === 'apocalypseComet') {
        // [진화 3] 멸망의 혜성 고열 마도 혜성 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.40, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'teslaPellet') {
        // [진화 5] 테슬라 뇌전포 탄환 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'swordWave') {
        // [진화 4] 폭풍검 초승달 검기 렌더링
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(26 * projArea);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, sz, -Math.PI / 3, Math.PI / 3);
        ctx.quadraticCurveTo(-sz * 0.4, 0, Math.cos(-Math.PI / 3) * sz, Math.sin(-Math.PI / 3) * sz);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'holyPellet') {
        // 홀리 산탄총 성스러운 탄환 렌더링
        const img = assets.images['proj_holypellet'];
        const size = Math.round(16 * projArea);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'fireball') {
        // 화염 지팡이 폭발 화염구 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'arcaneMissile') {
        // 비전 성역 유도탄 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'poisonDagger') {
        // 맹독 비수 렌더링 (녹색 독성 안광 + 고속 직진 비수)
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(18 * projArea);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 12;
        ctx.fillRect(-sz / 2, -3, sz, 6);
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(-sz / 2 + 2, -1.5, sz - 4, 3);
        ctx.restore();
      } else if (p.type === 'frostOrb') {
        // 빙결 보주 렌더링 (시안빛 회전 얼음 구체 + 냉기 펄스 테두리)
        const radius = p.radius;
        const pulse = Math.sin(Date.now() * 0.008) * 4;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (85 * projArea) + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'venomBlizzardOrb') {
        // [진화 6] 베놈 블리자드 보주 렌더링 (맹독 녹색 + 빙결 시안 회전 구체 + 광역 파동 링)
        const radius = p.radius;
        const pulse = Math.sin(Date.now() * 0.010) * 6;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (125 * projArea) + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'poisonShard') {
        // 베놈 블리자드 2단계 독성 얼음 파편 렌더링
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 일반 투사체 (마법 화살, 산탄)
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. [진화 4] 학살자의 폭풍검 (slayerBladeStorm) 상시 궤도 회전 대검 & 도끼 렌더링
    const bladeStorm = this.weapons['slayerBladeStorm'] || this.weapons['spinningAxe'];
    if (bladeStorm) {
      const area = this.getArea(bladeStorm);
      const orbitRadius = 85 * area;
      const count = this.getCount(bladeStorm);
      const imgAxe = assets.images['anim_axe'];
      const imgSword = assets.images['anim_sword'];
      const bladeSize = Math.round(38 * area);

      for (let i = 0; i < count; i++) {
        const angle = bladeStorm.orbitAngle + (i * Math.PI * 2) / count;
        const bx = this.player.x + Math.cos(angle) * orbitRadius;
        const by = this.player.y + Math.sin(angle) * orbitRadius;
        const isAxe = (i % 2 === 0);
        const img = isAxe ? imgAxe : imgSword;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle * 3.5);
        ctx.shadowColor = isAxe ? '#d97706' : '#38bdf8';
        ctx.shadowBlur = 14;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -bladeSize / 2, -bladeSize / 2, bladeSize, bladeSize);
        } else {
          ctx.fillStyle = isAxe ? '#d97706' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 16 * area, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  getClosestEnemy(enemies) {
    let closest = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (e.isDead) continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  getRandomAliveEnemy(enemies, maxRange = 700) {
    const candidates = [];
    for (const e of enemies) {
      if (e.isDead) continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d <= maxRange) {
        candidates.push(e);
      }
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
