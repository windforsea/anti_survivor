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
    this.projectiles = [];
    this.slashes = [];
    this.damagePools = [];

    // 콤보 큐
    this.swordComboQueue = 0;
    this.swordComboTimer = 0;
    this.axeComboQueue = 0;
    this.axeComboTimer = 0;
    this.whipStrikesQueue = [];
    this.whipStrikeTimer = 0;
    this.bladeWhipStrikesQueue = [];
    this.bladeWhipStrikeTimer = 0;

    // 기본 지급 무기: 일반 검 (근접 속도형)
    this.unlockWeapon('sword');
  }

  unlockWeapon(type) {
    if (this.weapons[type]) return;

    const baseConfigs = {
      sword: {
        id: 'sword',
        name: '일반 검 (근접 속도)',
        icon: '🗡️',
        desc: '바라보는 방향으로 날렵하게 검을 휘둘러 벱니다.',
        baseCooldown: 0.40,
        baseDamage: 32,
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      axe: {
        id: 'axe',
        name: '도끼 (근접 범위)',
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
        name: '채찍 (전후방 교차)',
        icon: '🪢',
        desc: '사거리가 길며 강화에 따라 전방과 후방을 번갈아 호쾌하게 연타합니다.',
        baseCooldown: 0.95,
        baseDamage: 42,
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      throwingDagger: {
        id: 'throwingDagger',
        name: '던지는 단검 (직진 관통)',
        icon: '🔪',
        desc: '가장 가까운 몬스터를 향해 직진하여 다수의 적을 관통하는 단검을 던집니다.',
        baseCooldown: 0.50,
        baseDamage: 18,
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      magicMissile: {
        id: 'magicMissile',
        name: '마법 화살 (원거리 유도)',
        icon: '🔮',
        desc: '가장 가까운 적을 조준하여 빠른 속도로 유도 마법탄을 발사합니다.',
        baseCooldown: 0.70,
        baseDamage: 15,
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      shotgun: {
        id: 'shotgun',
        name: '산탄 총포 (원거리 산탄)',
        icon: '💥',
        desc: '바라보는 방향으로 전방 부채꼴 형태로 여러 발의 산탄을 일제히 사격합니다.',
        baseCooldown: 1.30,
        baseDamage: 32, // 자동조준 불가 리스크 보상: 16 -> 32 (2배 상향)
        baseCount: 3, // 기본 3발
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        speedProjLevel: 0,
        cooldownTimer: 0
      },
      holyWater: {
        id: 'holyWater',
        name: '성수 (범위형 도트)',
        icon: '🧪',
        desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.',
        baseCooldown: 2.0,
        baseDamage: 12, // 틱당 피해 상향
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // 신규 무기: 성역 (플레이어 중심 360도 원형 도트 결계, 검 사거리 80px부터 시작, 공속 영향 X)
      sanctuary: {
        id: 'sanctuary',
        name: '성역 (원형 결계)',
        icon: '⛪',
        desc: '플레이어 중심 360도 원형 결계로 적들에게 매초 지속 도트 피해를 입힙니다. (공속 영향 없음)',
        baseCooldown: 1.0, // 고정 1초 주기 틱
        baseDamage: 24,    // 초당 도트 피해
        baseCount: 1,
        baseArea: 1.0,     // 기본 반경 80px (일반 검 사거리와 동일)
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // 이전 버전 호환용 alias
      acidPool: {
        id: 'holyWater',
        name: '성수 (범위형 도트)',
        icon: '🧪',
        desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.',
        baseCooldown: 2.0,
        baseDamage: 12,
        baseCount: 1,
        baseArea: 1.0,
        speedLevel: 0,
        countLevel: 0,
        areaLevel: 0,
        cooldownTimer: 0
      },
      // 진화 무기 1: 회전 도끼 (검 6강 + 도끼 6강)
      spinningAxe: {
        id: 'spinningAxe',
        name: '회전 도끼 (진화 무기)',
        icon: '🪓',
        desc: '거대한 도끼들이 플레이어 주위를 초고속 회전하며 적을 갈아냅니다.',
        baseCooldown: 9999, // 상시 회전 유지
        baseDamage: 68,
        baseCount: 4,      // 기본 4개 회전 도끼
        baseArea: 1.0,     // 회전 반경 연동
        speedLevel: 6,
        countLevel: 3,
        areaLevel: 6,
        speedProjLevel: 6, // 회전 속도 연동
        orbitAngle: 0,
        hitTimers: new Map(),
        cooldownTimer: 9999
      },
      // 진화 무기 2: 칼날 채찍 (채찍 6강 + 던지는 단검 6강)
      bladeWhip: {
        id: 'bladeWhip',
        name: '칼날 채찍 (진화 무기)',
        icon: '⛓️',
        desc: '채찍 끝에 날카로운 단검들이 결합되어 초장거리 광역 부채꼴로 전후방을 휩쓸어버립니다.',
        baseCooldown: 0.85,
        baseDamage: 76,
        baseCount: 3,
        baseArea: 1.25,
        speedLevel: 6,
        countLevel: 3,
        areaLevel: 6,
        speedProjLevel: 6,
        cooldownTimer: 0
      },
      // 진화 무기 3: 홀리 산탄총 (산탄총 6강 + 성수 6강)
      holyShotgun: {
        id: 'holyShotgun',
        name: '홀리 산탄총 (진화 무기)',
        icon: '✨',
        desc: '바라보는 방향으로 성스러운 산탄들을 일제히 발사하며, 적중 시 좁은 범위의 성스러운 폭발을 일으킵니다.',
        baseCooldown: 1.25,
        baseDamage: 56, // 산탄총 상향 연동: 28 -> 56 (2배 상향)
        baseCount: 6,      // 6발 산탄
        baseArea: 1.0,
        speedLevel: 6,
        countLevel: 3,
        areaLevel: 6,
        speedProjLevel: 6,
        cooldownTimer: 0
      }
    };

    if (baseConfigs[type]) {
      this.weapons[type] = { ...baseConfigs[type] };
    }
  }

  getTotalUpgrades(w) {
    if (!w) return 0;
    return (w.speedLevel || 0) + (w.countLevel || 0) + (w.areaLevel || 0) + (w.speedProjLevel || 0);
  }

  upgradeWeapon(type, statType) {
    const w = this.weapons[type];
    if (!w) return;

    if (this.getTotalUpgrades(w) >= 6) return;

    if (statType === 'speed') {
      w.speedLevel = (w.speedLevel || 0) + 1;
    } else if (statType === 'count') {
      w.countLevel = Math.min(3, (w.countLevel || 0) + 1);
    } else if (statType === 'area') {
      w.areaLevel = (w.areaLevel || 0) + 1;
    } else if (statType === 'speedProj') {
      w.speedProjLevel = (w.speedProjLevel || 0) + 1;
    }
  }

  getCooldown(w) {
    // 성역은 공격속도 증가 영향 없음 (고정 1초 도트 틱)
    if (w.id === 'sanctuary') {
      return w.baseCooldown;
    }
    const speedBonus = 1 + (w.speedLevel || 0) * 0.10; // 무기 공속 10% 증가로 개편
    const totalMult = this.player.globalCooldownMult * speedBonus;
    return Math.max(0.08, w.baseCooldown / totalMult);
  }

  getDamage(w) {
    return Math.round(w.baseDamage * this.player.atkPowerMult);
  }

  getCount(w) {
    return w.baseCount + w.countLevel + (this.player.bonusProjectiles || 0);
  }

  getArea(w) {
    const areaBonus = 1 + (w.areaLevel || 0) * 0.20; // 무기 범위 20% 증가로 개편
    return w.baseArea * areaBonus * (this.player.bonusAreaMult || 1.0);
  }

  // 1. 일반 검 (sword): 바라보는 방향 날렵한 근접 베기 (판정 슬림화, 원형선 제거)
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
      arc: 0.68,          // 슬림한 부채꼴 각도
      range: 80 * area,   // 날렵한 사거리
      damage: dmg,
      knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
      knockbackForce: 140,
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

  // 3. 채찍 (whip): 전방 / 후방 교차 부채꼴 긁어내기 (부채꼴 전체 피격 판정)
  executeWhipStrike(w, isBack = false) {
    sounds.playWhip();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    const angle = isBack ? (baseAngle + Math.PI) : baseAngle;

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

  // [진화 무기 2] 칼날 채찍 (bladeWhip): 초장거리 광역 부채꼴 긁어내기 스윙 (부채꼴 전체 피격 판정)
  executeBladeWhipStrike(w, isBack = false) {
    sounds.playWhip();
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    const angle = isBack ? (baseAngle + Math.PI) : baseAngle;

    const arc = 2.35; // 약 135도의 초대형 광역 부채꼴 호
    const range = 310 * area; // 화면 끝까지 휩쓰는 초장거리 사거리
    this.player.triggerAttackAnim('bladewhip', angle, 0.24, { arc, range, area });

    this.slashes.push({
      type: 'cone',
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      arc: arc,
      range: range,
      damage: dmg,
      knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
      knockbackForce: 340,
      life: 0.22,
      maxLife: 0.22,
      drawSector: true,
      maxAlpha: 0.32,
      startColor: 'rgba(239, 68, 68, 0.45)',
      midColor: 'rgba(245, 158, 11, 0.28)',
      endColor: 'rgba(251, 191, 36, 0.60)',
      strokeColor: 'rgba(254, 240, 138, 0.85)',
      lineWidth: 4,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // [신규 무기] 성역 (sanctuary): 플레이어 중심 360도 원형 결계 도트 틱 (검 사거리 80px 기준, 공속 영향 X)
  executeSanctuaryTick(w, enemies) {
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 80 * area;
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

    let hitCount = 0;
    // 360도 범위 내 적 타격
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= radius + enemy.radius) {
        const kbDir = {
          x: (enemy.x - this.player.x) / (dist || 1),
          y: (enemy.y - this.player.y) / (dist || 1)
        };
        enemy.takeDamage(dmg, kbDir, 50);
        hitCount++;
      }
    }

    // 360도 범위 내 파괴 가능 장애물 타격
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

  update(dt, enemies) {
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];

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
        if (whip) this.executeWhipStrike(whip, isBack);
      }
    }

    // 칼날 채찍 전후방 초광역 연타 큐 처리
    if (this.bladeWhipStrikesQueue.length > 0) {
      this.bladeWhipStrikeTimer -= dt;
      if (this.bladeWhipStrikeTimer <= 0) {
        const isBack = this.bladeWhipStrikesQueue.shift();
        this.bladeWhipStrikeTimer = 0.09;
        const bladeWhip = this.weapons['bladeWhip'];
        if (bladeWhip) this.executeBladeWhipStrike(bladeWhip, isBack);
      }
    }

    // [진화 무기 1] 회전 도끼 (spinningAxe) 상시 궤도 회전 타격
    const spinAxe = this.weapons['spinningAxe'];
    if (spinAxe) {
      const projSpeedMult = (1 + (spinAxe.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbitSpeed = 4.2 * projSpeedMult;
      spinAxe.orbitAngle = (spinAxe.orbitAngle || 0) + orbitSpeed * dt;

      const orbitRadius = 82 * this.getArea(spinAxe);
      const count = this.getCount(spinAxe);
      const dmg = this.getDamage(spinAxe);

      if (!spinAxe.hitTimers) spinAxe.hitTimers = new Map();
      for (const [target, timer] of spinAxe.hitTimers.entries()) {
        const nextTimer = timer - dt;
        if (nextTimer <= 0 || target.isDead) {
          spinAxe.hitTimers.delete(target);
        } else {
          spinAxe.hitTimers.set(target, nextTimer);
        }
      }

      for (let i = 0; i < count; i++) {
        const angle = spinAxe.orbitAngle + (i * Math.PI * 2) / count;
        const bx = this.player.x + Math.cos(angle) * orbitRadius;
        const by = this.player.y + Math.sin(angle) * orbitRadius;
        const bladeRadius = 18;

        // 적 타격
        for (const enemy of enemies) {
          if (enemy.isDead || spinAxe.hitTimers.has(enemy)) continue;
          const dist = Math.hypot(enemy.x - bx, enemy.y - by);
          if (dist <= bladeRadius + enemy.radius) {
            spinAxe.hitTimers.set(enemy, 0.20);
            const kbDir = {
              x: (enemy.x - this.player.x) / (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) || 1),
              y: (enemy.y - this.player.y) / (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) || 1)
            };
            enemy.takeDamage(dmg, kbDir, 180);
            sounds.playSlash();
          }
        }

        // 파괴 가능 장애물 타격
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible || spinAxe.hitTimers.has(obs)) continue;
          const dist = Math.hypot(obs.x - bx, obs.y - by);
          if (dist <= bladeRadius + obs.radius) {
            spinAxe.hitTimers.set(obs, 0.25);
            obs.takeDamage(dmg, this.game);
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
        }
      }
    }

    // 2. 원거리 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 유도 로직 (마법 화살)
      if (p.homing && enemies.length > 0) {
        let closest = null;
        let minDist = 450;
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

          if (p.splashRadius > 0) {
            this.triggerHolySplash(p, enemies, obstacles);
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
              this.triggerHolySplash(p, enemies, obstacles);
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
        pool.tickTimer = 0.45; // 0.45초마다 틱 피해
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
        // 전후방 교차 패턴: 총 공격 횟수 = count
        // 1회: 앞 / 2회: 앞-뒤 / 3회: 앞-뒤-앞 / 4회: 앞-뒤-앞-뒤 / 5회: 앞-뒤-앞-뒤-앞 / 6회: 앞-뒤-앞-뒤-앞-뒤
        const pattern = [];
        for (let i = 0; i < count; i++) {
          pattern.push(i % 2 === 1); // 0: front, 1: back, 2: front, 3: back...
        }
        this.executeWhipStrike(w, pattern[0]);
        this.whipStrikesQueue = pattern.slice(1);
        this.whipStrikeTimer = 0.11;
        break;
      }

      case 'bladeWhip': {
        // 칼날 채찍: 6회 전후방 폭풍 채찍질
        const pattern = [false, true, false, true, false, true];
        this.executeBladeWhipStrike(w, pattern[0]);
        this.bladeWhipStrikesQueue = pattern.slice(1);
        this.bladeWhipStrikeTimer = 0.09;
        break;
      }

      case 'throwingDagger': {
        // 던지는 단검: 몬스터 방향으로 조준하여 직진 관통 투사체 발사 (사거리 290px 제한)
        sounds.playSlash();
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        const speed = 520 * projSpeedBonus;
        const maxDist = 290 * area;
        const lifeTime = maxDist / speed; // 도달 즉시 소멸

        for (let i = 0; i < count; i++) {
          const spread = count > 1 ? (i - (count - 1) / 2) * 0.14 : 0;
          const angle = baseAngle + spread;
          this.projectiles.push({
            type: 'dagger',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 5 * area, // 슬림한 투사체 판정
            area: area,       // 스프라이트 렌더링 스케일용
            damage: dmg,
            pierce: 3,        // 3체 관통
            knockbackForce: 130,
            life: lifeTime,
            homing: false,
            color: '#38bdf8',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
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
            life: 1.6, // 긴 사거리 (약 700px)
            homing: true,
            color: '#a855f7',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      case 'shotgun': {
        // 산탄 총포: 바라보는 방향으로 전방 부채꼴 산탄 (사거리 약 280px 제한)
        sounds.playShotgun();
        const baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
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
            life: 0.52, // 사거리 제한 (약 280px)
            homing: false,
            color: '#f97316',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      case 'holyShotgun': {
        // 홀리 산탄총: 바라보는 방향으로 성스러운 산탄 발사 및 적중 시 좁은 범위 폭발 (사거리 약 310px)
        sounds.playShotgun();
        const baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        this.player.triggerAttackAnim('muzzle', baseAngle, 0.15, { area });

        const totalPellets = count;
        const spreadTotal = 0.68;
        const speed = 560 * projSpeedBonus;
        const splashRadius = 35 * area;
        const splashDmg = Math.round(35 * this.player.atkPowerMult); // 스플래시 피해도 상향

        for (let i = 0; i < totalPellets; i++) {
          const angleOffset = (Math.random() - 0.5) * spreadTotal;
          const angle = baseAngle + angleOffset;
          this.projectiles.push({
            type: 'holyPellet',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 6 * area,
            area: area,
            damage: dmg,
            pierce: 1, // 적중 시 성스러운 폭발 발생
            splashRadius: splashRadius,
            splashDamage: splashDmg,
            knockbackForce: 180,
            life: 0.55, // 사거리 약 310px
            homing: false,
            color: '#fef08a',
            hitEnemies: new Set(),
            hitObstacles: new Set()
          });
        }
        break;
      }

      case 'sanctuary': {
        // 신규 무기: 성역 (플레이어 중심 360도 원형 도트 결계)
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
    }
  }

  draw(ctx) {
    // 0. 성역 (sanctuary) 360도 오라 결계 렌더링
    const sanctuary = this.weapons['sanctuary'];
    if (sanctuary) {
      const area = this.getArea(sanctuary);
      const radius = 80 * area;
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

    // 1. 도트 장판 바닥 렌더링
    for (const pool of this.damagePools) {
      const alpha = Math.min(0.5, pool.life * 0.3);
      const isHoly = pool.isHoly || false;
      ctx.save();
      ctx.fillStyle = isHoly ? `rgba(56, 189, 248, ${alpha})` : `rgba(34, 197, 94, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isHoly ? `rgba(186, 230, 253, ${alpha + 0.25})` : `rgba(134, 239, 172, ${alpha + 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const bubbleTime = Date.now() * 0.005;
      for (let b = 0; b < 3; b++) {
        const bx = pool.x + Math.sin(bubbleTime + b * 2) * (pool.radius * 0.6);
        const by = pool.y + Math.cos(bubbleTime + b * 2) * (pool.radius * 0.6);
        ctx.fillStyle = isHoly ? `rgba(224, 242, 254, ${alpha + 0.35})` : `rgba(187, 247, 208, ${alpha + 0.3})`;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. 근접 베기 렌더링: 투명 인디케이터(부채꼴/원형 선) 완전 제거 (순수 무기 휘두르기 스프라이트 연출만 표시)

    // 3. 투사체 렌더링 (범위 증가 시 투사체 크기도 비례 확대)
    for (const p of this.projectiles) {
      ctx.save();
      const projArea = p.area || 1.0;

      if (p.type === 'dagger') {
        // 던지는 단검 스프라이트 렌더링
        const img = assets.images['proj_dagger'];
        const angle = Math.atan2(p.vy, p.vx);
        const size = Math.round(20 * projArea);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.translate(p.x, p.y);
          ctx.rotate(angle + Math.PI / 2);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
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

    // 4. [진화 무기 1] 회전 도끼 (spinningAxe) 상시 궤도 회전 렌더링 (범위 증가 시 도끼 크기 및 궤도 확대)
    const spinAxe = this.weapons['spinningAxe'];
    if (spinAxe) {
      const area = this.getArea(spinAxe);
      const orbitRadius = 82 * area;
      const count = this.getCount(spinAxe);
      const img = assets.images['anim_axe'];
      const axeSize = Math.round(36 * area);

      for (let i = 0; i < count; i++) {
        const angle = spinAxe.orbitAngle + (i * Math.PI * 2) / count;
        const bx = this.player.x + Math.cos(angle) * orbitRadius;
        const by = this.player.y + Math.sin(angle) * orbitRadius;

        ctx.save();
        ctx.translate(bx, by);
        // 도끼 회전 자체 각도
        ctx.rotate(angle * 3);
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 12;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -axeSize / 2, -axeSize / 2, axeSize, axeSize);
        } else {
          ctx.fillStyle = '#d97706';
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
