// 14종 기본 무기(5강 MAX) 및 14대 2단계 특수 진화 무기 통합 매니저 (WeaponManager)
// - 기본 무기 14종: 철검, 도끼, 채찍, 표창, 마법화살, 산탄총, 성수, 성역, 번개반지, 불지팡이, 독비수, 빙결보주, 바람활, 어둠의보주
// - 진화 무기 14대: 생츄어리, 모닝스타, 메테오, 폭풍검, 뇌전포, 블리자드, 벼락검, 화염도끼, 얼음채찍, 산탄표창, 신성화살, 역병, 태풍의눈, 황혼의나선

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

    if (typeof WEAPON_CONFIGS !== 'undefined' && WEAPON_CONFIGS[type]) {
      const targetId = WEAPON_CONFIGS[type].id || type;
      const cfg = WEAPON_CONFIGS[targetId] || WEAPON_CONFIGS[type];
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
    // 공속류 무기는 쿨감 카드 몰빵 시 초고속 연사 체감을 위해 레벨당 18% 단축 (일반 15%)
    const isRapidType = ['sword', 'shuriken', 'poisonDagger', 'magicMissile', 'thunderBlade', 'scatterShuriken'].includes(w.id);
    const cdRate = isRapidType ? 0.18 : 0.15;
    const cooldownBonus = 1 + cdLevel * cdRate;
    const totalMult = this.player.globalCooldownMult * cooldownBonus;
    return Math.max(0.08, w.baseCooldown / totalMult);
  }

  getDamage(w) {
    const dmgBonus = 1 + (w.damageLevel || 0) * 0.30; // 레벨당 데미지 30% 증가
    return Math.round(w.baseDamage * dmgBonus * this.player.atkPowerMult);
  }

  getCount(w) {
    const extra = (w.countLevel || 0) + (this.player.bonusProjectiles || 0);
    if (w.id === 'shotgun' || w.id === 'teslaShotgun') {
      return w.baseCount + extra * 2; // 산탄총: 투사체 추가시마다 2발씩 추가
    }
    return w.baseCount + extra;
  }

  getArea(w) {
    const areaBonus = 1 + (w.areaLevel || 0) * 0.20; // 레벨당 범위 20% 증가
    return w.baseArea * areaBonus * (this.player.bonusAreaMult || 1.0);
  }

  // 1. 일반 검 (sword): 가장 가까운 적을 향해 날렵한 근접 베기 (360도 자동 조준)
  // ※ 28종 기본/진화 무기 발사 로직은 js/weaponExecutors.js로 분리됨
  // ※ 무기 투사체 및 장판 렌더러(draw)는 js/weaponRenderer.js로 분리됨

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

    // [진화 1] 생츄어리 (heavenlySanctuary) 상시 성수 도트 결계 & 빙결
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

    // [진화 2] 모닝스타 전후방 교차 연타 큐 처리
    if (this.bladeWhipStrikesQueue.length > 0) {
      this.bladeWhipStrikeTimer -= dt;
      if (this.bladeWhipStrikeTimer <= 0) {
        const isBack = this.bladeWhipStrikesQueue.shift();
        this.bladeWhipStrikeTimer = 0.10;
        const msTempest = this.weapons['morningstarTempest'] || this.weapons['bladeWhip'];
        if (msTempest) this.executeMorningstarTempest(msTempest, isBack, msTempest.lastTargetAngle);
      }
    }

    // [진화 4] 폭풍검 (slayerBladeStorm) 상시 궤도 회전 타격
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

    // [기본 무기 14] 어둠의 보주 (shadowOrb) 자율 추적 사역마(소환수 구체) 다단히트
    const shadowOrb = this.weapons['shadowOrb'];
    if (shadowOrb) {
      const projSpeedMult = (1 + (shadowOrb.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbSpeed = 420 * projSpeedMult;
      const count = this.getCount(shadowOrb);
      const dmg = this.getDamage(shadowOrb);
      const orbRadius = 14 * this.getArea(shadowOrb);
      const hitInterval = Math.max(0.18, 0.30 / (1 + (shadowOrb.cooldownLevel || 0) * 0.08));

      if (!shadowOrb.familiars) shadowOrb.familiars = [];
      // 구체 개수 동기화
      while (shadowOrb.familiars.length < count) {
        const idx = shadowOrb.familiars.length;
        shadowOrb.familiars.push({
          x: this.player.x + (Math.random() - 0.5) * 30,
          y: this.player.y + (Math.random() - 0.5) * 30,
          target: null,
          hitTimer: 0,
          hoverAngle: (idx * Math.PI * 2) / Math.max(1, count),
          trail: []
        });
      }
      if (shadowOrb.familiars.length > count) {
        shadowOrb.familiars.length = count;
      }

      // 각 사역마 구체 업데이트
      for (let i = 0; i < shadowOrb.familiars.length; i++) {
        const fam = shadowOrb.familiars[i];

        // 0. 플레이어와의 거리 및 리쉬(Leash) 검사
        const famDistToPlayer = Math.hypot(fam.x - this.player.x, fam.y - this.player.y);
        const maxLeashDist = 420;
        const maxPlayerRange = 380;
        if (famDistToPlayer > maxLeashDist || (fam.target && Math.hypot(fam.target.x - this.player.x, fam.target.y - this.player.y) > maxPlayerRange)) {
          fam.target = null;
        }

        // 1. 타겟 유효성 검사 (타겟이 없거나 사망 시 새 타겟 탐색)
        if (!fam.target || fam.target.isDead) {
          fam.target = null;
          let closest = null;
          let minDist = maxPlayerRange;
          const otherTargets = new Set(shadowOrb.familiars.filter((f, idx) => idx !== i && f.target && !f.target.isDead).map(f => f.target));
          for (const e of enemies) {
            if (e.isDead) continue;
            const dToPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            const effectiveDist = otherTargets.has(e) ? dToPlayer + 80 : dToPlayer;
            if (effectiveDist < minDist) {
              minDist = effectiveDist;
              closest = e;
            }
          }
          fam.target = closest;
        }

        // 2. 이동 로직
        if (fam.target && famDistToPlayer <= maxLeashDist) {
          const dx = fam.target.x - fam.x;
          const dy = fam.target.y - fam.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 5) {
            const moveStep = Math.min(dist, orbSpeed * dt);
            fam.x += (dx / dist) * moveStep;
            fam.y += (dy / dist) * moveStep;
          }

          // 3. 다단히트 타격 (적과 밀착 시)
          if (dist <= orbRadius + fam.target.radius + 10) {
            fam.hitTimer = (fam.hitTimer || 0) - dt;
            if (fam.hitTimer <= 0) {
              fam.hitTimer = hitInterval;
              const kbDir = { x: dx / (dist || 1), y: dy / (dist || 1) };
              fam.target.takeDamage(dmg, kbDir, 80);
              sounds.playHit();
              if (this.game && this.game.addParticles) {
                this.game.addParticles(fam.x, fam.y, '#9333ea', 3);
              }
              // 타격으로 적 사망 시 즉시 타겟 해제 -> 다음 프레임 다른 적으로 신속 전환
              if (fam.target.isDead) {
                fam.target = null;
              }
            }
          }
        } else {
          // 적이 없을 때: 플레이어 주변 호위 선회
          fam.hoverAngle = (fam.hoverAngle || 0) + 2.4 * dt;
          const targetX = this.player.x + Math.cos(fam.hoverAngle + (i * Math.PI * 2) / count) * 45;
          const targetY = this.player.y + Math.sin(fam.hoverAngle + (i * Math.PI * 2) / count) * 45;
          const dx = targetX - fam.x;
          const dy = targetY - fam.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            const returnSpeedMult = famDistToPlayer > 100 ? 1.4 : 0.8;
            const step = Math.min(dist, orbSpeed * returnSpeedMult * dt);
            fam.x += (dx / dist) * step;
            fam.y += (dy / dist) * step;
          }
        }

        // 잔상(Trail) 갱신 (최대 5개)
        if (!fam.trail) fam.trail = [];
        fam.trail.unshift({ x: fam.x, y: fam.y });
        if (fam.trail.length > 5) fam.trail.pop();

        // 파괴 가능 장애물 접촉 시 타격
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible) continue;
          const dist = Math.hypot(obs.x - fam.x, obs.y - fam.y);
          if (dist <= orbRadius + obs.radius) {
            obs.takeDamage(dmg, this.game);
          }
        }
      }
    }

    // [진화 14] 황혼의 나선 (eclipseSpiral) 자율 추적 사역마 3체 + 비전 매직 미사일 소환 난사
    const eclipseSpiral = this.weapons['eclipseSpiral'];
    if (eclipseSpiral) {
      const projSpeedMult = (1 + (eclipseSpiral.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbSpeed = 520 * projSpeedMult;
      const count = 3; // 진화 시 항상 3체
      const dmg = this.getDamage(eclipseSpiral);
      const orbRadius = 18 * this.getArea(eclipseSpiral);
      const hitInterval = 0.20; // 0.20초 초고속 다단히트

      if (!eclipseSpiral.familiars) eclipseSpiral.familiars = [];
      while (eclipseSpiral.familiars.length < count) {
        const idx = eclipseSpiral.familiars.length;
        eclipseSpiral.familiars.push({
          x: this.player.x + (Math.random() - 0.5) * 40,
          y: this.player.y + (Math.random() - 0.5) * 40,
          target: null,
          hitTimer: 0,
          missileTimer: 0.6 * idx, // 3체 0.6초 교차 엇박자 발사
          hoverAngle: (idx * Math.PI * 2) / 3,
          trail: []
        });
      }
      if (eclipseSpiral.familiars.length > count) {
        eclipseSpiral.familiars.length = count;
      }

      // 화면 내 잔존 미사일 개수 카운트 (후반 렉 원천 차단: 최대 32발 제한)
      let currentGhostCount = 0;
      for (let pIdx = 0; pIdx < this.projectiles.length; pIdx++) {
        if (this.projectiles[pIdx].type === 'voidGhostMissile') currentGhostCount++;
      }

      for (let i = 0; i < eclipseSpiral.familiars.length; i++) {
        const fam = eclipseSpiral.familiars[i];

        // 0. 플레이어와의 거리 및 리쉬(Leash) 검사
        const famDistToPlayer = Math.hypot(fam.x - this.player.x, fam.y - this.player.y);
        const maxLeashDist = 480;
        const maxPlayerRange = 440;
        if (famDistToPlayer > maxLeashDist || (fam.target && Math.hypot(fam.target.x - this.player.x, fam.target.y - this.player.y) > maxPlayerRange)) {
          fam.target = null;
        }

        // 1. 타겟 유효성 검사 (서로 다른 타겟 분산 우선)
        if (!fam.target || fam.target.isDead) {
          fam.target = null;
          let closest = null;
          let minDist = maxPlayerRange;
          const otherTargets = new Set(eclipseSpiral.familiars.map(f => f.target).filter(t => t && !t.isDead));

          for (const e of enemies) {
            if (e.isDead) continue;
            const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            const effectiveDist = otherTargets.has(e) ? d + 120 : d;
            if (effectiveDist < minDist) {
              minDist = effectiveDist;
              closest = e;
            }
          }
          fam.target = closest;
        }

        // 2. 이동
        if (fam.target && famDistToPlayer <= maxLeashDist) {
          const dx = fam.target.x - fam.x;
          const dy = fam.target.y - fam.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 6) {
            const moveStep = Math.min(dist, orbSpeed * dt);
            fam.x += (dx / dist) * moveStep;
            fam.y += (dy / dist) * moveStep;
          }

          // 3. 초고속 다단히트 타격
          if (dist <= orbRadius + fam.target.radius + 12) {
            fam.hitTimer = (fam.hitTimer || 0) - dt;
            if (fam.hitTimer <= 0) {
              fam.hitTimer = hitInterval;
              const kbDir = { x: dx / (dist || 1), y: dy / (dist || 1) };
              fam.target.takeDamage(dmg, kbDir, 110);
              sounds.playHit();
              if (this.game && this.game.addParticles) {
                this.game.addParticles(fam.x, fam.y, '#c084fc', 4);
                this.game.addParticles(fam.x, fam.y, '#f3e8ff', 2);
              }
              if (fam.target.isDead) {
                fam.target = null;
              }
            }
          }
        } else {
          // 호위 선회
          fam.hoverAngle = (fam.hoverAngle || 0) + 3.0 * dt;
          const targetX = this.player.x + Math.cos(fam.hoverAngle + (i * Math.PI * 2) / 3) * 60;
          const targetY = this.player.y + Math.sin(fam.hoverAngle + (i * Math.PI * 2) / 3) * 60;
          const dx = targetX - fam.x;
          const dy = targetY - fam.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            const returnSpeedMult = famDistToPlayer > 120 ? 1.4 : 0.85;
            const step = Math.min(dist, orbSpeed * returnSpeedMult * dt);
            fam.x += (dx / dist) * step;
            fam.y += (dy / dist) * step;
          }
        }

        // 4. 비전 매직 미사일 보주 외곽 8방향 방출 (후반 렉 방지 가드: 화면 최대 32발 제한)
        fam.missileTimer = (fam.missileTimer !== undefined ? fam.missileTimer : (0.6 * i)) - dt;
        if (fam.missileTimer <= 0) {
          fam.missileTimer = 1.8; // 1.8초 주기 (3체가 0.6초 간격으로 번갈아 8방향 발사)

          if (currentGhostCount < 32) {
            sounds.playMagic();
            const spawnOffset = orbRadius + 14; // 보주 외곽 위치 (약 32px)
            const missileDmg = Math.max(1, Math.round(dmg * 0.45));
            const areaMult = this.getArea(eclipseSpiral);

            for (let k = 0; k < 8; k++) {
              const ang = (k / 8) * Math.PI * 2;
              const spawnX = fam.x + Math.cos(ang) * spawnOffset;
              const spawnY = fam.y + Math.sin(ang) * spawnOffset;
              this.projectiles.push({
                type: 'voidGhostMissile',
                x: spawnX,
                y: spawnY,
                vx: Math.cos(ang) * 440,
                vy: Math.sin(ang) * 440,
                radius: 7 * areaMult,
                damage: missileDmg,
                pierce: 2,
                homing: false,
                life: 1.1,
                color: '#e879f9',
                hitEnemies: new Set(),
                hitObstacles: new Set()
              });
              currentGhostCount++;
            }

            if (this.game && this.game.addParticles) {
              this.game.addParticles(fam.x, fam.y, '#e879f9', 8);
              this.game.addParticles(fam.x, fam.y, '#c084fc', 6);
            }
          }
        }

        // 잔상(Trail) 갱신 (최대 6개)
        if (!fam.trail) fam.trail = [];
        fam.trail.unshift({ x: fam.x, y: fam.y });
        if (fam.trail.length > 6) fam.trail.pop();

        // 파괴 가능 장애물
        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible) continue;
          const dist = Math.hypot(obs.x - fam.x, obs.y - fam.y);
          if (dist <= orbRadius + obs.radius) {
            obs.takeDamage(dmg, this.game);
          }
        }
      }
    }

    // 무기 쿨다운 업데이트 및 발사 트리거
    for (const key in this.weapons) {
      const w = this.weapons[key];
      if (w.id === 'spinningAxe' || w.id === 'slayerBladeStorm' || w.id === 'shadowOrb' || w.id === 'eclipseSpiral') continue; // 상시 지속 회전
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
          let kbDir = s.knockbackDir;
          if (!kbDir) {
            if (dist > 1) {
              kbDir = { x: (enemy.x - s.x) / dist, y: (enemy.y - s.y) / dist };
            } else {
              kbDir = { x: this.player.facing.x || 1, y: this.player.facing.y || 0 };
            }
          }
          enemy.takeDamage(s.damage, kbDir, s.knockbackForce);
          sounds.playHit();

          // 모닝스타: 첫 번째 적중 시 적중 위치에서 4방향 관통 표창 방출
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

          // 모닝스타: 장애물에 첫 적중 시에도 4방향 관통 표창 방출
          if (s.isMorningstarTempest && !s.shurikenSpawned) {
            s.shurikenSpawned = true;
            this.triggerMorningstar4Shurikens(obs.x, obs.y, s.weaponRef);
          }
        }
      }

      // [도끼 / 화염도끼 특수 기믹] 360도 원형 회전 베기 시 적 및 보스 투사체 요격 및 즉시 삭제
      if (s.type === 'circle' && this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
        for (let pIdx = this.game.bossProjectiles.length - 1; pIdx >= 0; pIdx--) {
          const bp = this.game.bossProjectiles[pIdx];
          const pDist = Math.hypot(bp.x - s.x, bp.y - s.y);
          if (pDist <= s.radius + (bp.radius || 6)) {
            this.game.bossProjectiles.splice(pIdx, 1);
          }
        }
      }
    }

    // 2. 원거리 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

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

      // 빙결 보주 & 블리자드 보주 비행 중 주기적 냉기 파동 발산
      if (p.type === 'frostOrb' || p.type === 'venomBlizzardOrb') {
        p.pulseTimer = (p.pulseTimer || 0) - dt;
        if (p.pulseTimer <= 0) {
          p.pulseTimer = p.type === 'venomBlizzardOrb' ? 0.30 : 0.35;
          const pulseRadius = 51 * (p.area || 1.0);
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

      // 태풍의 눈 (cycloneArrow) 2단계: 주변 적을 화살 중심으로 강력 흡인 (블랙홀)
      if (p.type === 'cycloneArrow') {
        const maxLife = p.maxLife || 0.95;
        const elapsed = Math.max(0, maxLife - p.life);
        const safeDelay = 0.10;
        const growthDuration = 0.35;
        let growthProg = 0;
        if (elapsed > safeDelay) {
          growthProg = Math.min(1.0, (elapsed - safeDelay) / growthDuration);
        }
        const maxPullRadius = 150 * (p.area || 1.0);
        const pullRadius = maxPullRadius * growthProg;
        p.currentPullRadius = pullRadius;
        p.growthProg = growthProg;
        if (pullRadius > 8) {
          for (const e of enemies) {
          if (e.isDead) continue;
          const ed = Math.hypot(p.x - e.x, p.y - e.y);
          if (ed < pullRadius && ed > 10) {
            const pullForce = (1 - ed / pullRadius) * 240 * dt;
            e.x += ((p.x - e.x) / ed) * pullForce;
            e.y += ((p.y - e.y) / ed) * pullForce;
          }
        }
          if (window.game && Math.random() < (0.2 + growthProg * 0.3)) {
          window.game.addParticles(p.x, p.y, '#6ee7b7', 2);
          }
        }
      }

      if (p.hitCooldowns) {
        for (const [target, timer] of p.hitCooldowns.entries()) {
          const next = timer - dt;
          if (next <= 0 || target.isDead) p.hitCooldowns.delete(target);
          else p.hitCooldowns.set(target, next);
        }
      }

      // 유도 로직 (마법 화살 & 메테오 & 비전 미사일 & 유도 유령탄)
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

      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;

      // 적 충돌 검사
      for (const enemy of enemies) {
        if (enemy.isDead || (p.hitCooldowns ? p.hitCooldowns.has(enemy) : p.hitEnemies.has(enemy))) continue;

        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= p.radius + enemy.radius) {
          if (p.hitCooldowns) {
            p.hitCooldowns.set(enemy, 0.28);
          } else {
            p.hitEnemies.add(enemy);
          }
          const kbDir = { x: (p.vx || (enemy.x - p.x)) / (Math.hypot(p.vx || 1, p.vy || 1) || 1), y: (p.vy || (enemy.y - p.y)) / (Math.hypot(p.vx || 1, p.vy || 1) || 1) };
          enemy.takeDamage(p.damage, kbDir, p.knockbackForce || 100);
          sounds.playHit();

          // 독비수 및 독 파편 적중 시 중독 부여
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

          // 뇌전탄 적중 시 체인 라이트닝 + 하늘 낙뢰
          if (p.type === 'teslaPellet') {
            this.triggerTeslaStrike(p, enemy, enemies);
          }

          // 신성화살: 적중 시 정화 장판 생성
          if (p.type === 'holyArrow') {
            this.damagePools.push({
              x: enemy.x,
              y: enemy.y,
              radius: 55 * (p.area || 1.0),
              damage: Math.round(p.damage * 0.45),
              life: 3.0,
              tickTimer: 0,
              color: '#fef08a',
              isHoly: true
            });
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

      // [진화 2] 모닝스타 (morningstarTempest): 일반 채찍과 동일하게 자동 조준 및 교차 연타
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

      // [진화 4] 폭풍검 (slayerBladeStorm: 검기 삭제 완료 - 상시 궤도 회전만 동작)
      case 'slayerBladeStorm':
      case 'spinningAxe': {
        break;
      }

      // [진화 3] 메테오 (apocalypseComet)
      case 'apocalypseComet':
      case 'arcaneSanctuary': {
        this.executeApocalypseComet(w, enemies);
        break;
      }

      // [진화 5] 뇌전포 (teslaShotgun)
      case 'teslaShotgun':
      case 'plasmaTempest':
      case 'holyShotgun': {
        this.executeTeslaShotgun(w, enemies);
        break;
      }

      // [진화 1] 생츄어리 (heavenlySanctuary)
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
        // 산탄총: 가장 가까운 적을 향해 전방 부채꼴 산탄 (자동 조준)
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

      case 'thunderBlade': {
        this.executeThunderBlade(w, enemies);
        break;
      }

      case 'fireAxe': {
        this.executeFireAxe(w, enemies);
        break;
      }

      case 'frostWhip': {
        this.executeFrostWhip(w, enemies);
        break;
      }

      case 'scatterShuriken': {
        this.executeScatterShuriken(w, enemies);
        break;
      }

      case 'holyArrow': {
        this.executeHolyArrow(w, enemies);
        break;
      }

      case 'plague': {
        this.executePlagueTick(w, enemies);
        break;
      }

      case 'windBow': {
        this.executeWindBow(w, enemies);
        break;
      }

      case 'shadowOrb': {
        this.executeShadowOrb(w, enemies);
        break;
      }

      case 'cycloneBow': {
        this.executeCycloneBow(w, enemies);
        break;
      }

      case 'eclipseSpiral': {
        this.executeEclipseSpiral(w, enemies);
        break;
      }
    }
  }

  // 11. 독비수 (poisonDagger): 플레이어 조준 방향으로 쾌속 직진 비수 연사 및 중독
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
