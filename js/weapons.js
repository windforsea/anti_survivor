// 14종 기본 무기(5강 MAX) 및 14대 2단계 특수 진화 무기 통합 매니저 (WeaponManager)
// - 기본 무기 14종: 철검, 도끼, 채찍, 표창, 마법화살, 산탄총, 성수, 성역, 번개반지, 불지팡이, 독비수, 빙결보주, 바람활, 어둠의보주
// - 진화 무기 14대: 생츄어리, 모닝스타, 메테오, 폭풍칼날, 뇌전포, 블리자드, 벼락검, 화염도끼, 얼음채찍, 산탄표창, 신성화살, 역병, 태풍의눈, 황혼의나선

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
    this.lightningIndicators = [];
    this.plasmaStrikes = [];

    // 콤보 큐
    this.swordComboQueue = 0;
    this.swordComboTimer = 0;
    this.thunderBladeComboQueue = 0;
    this.thunderBladeComboTimer = 0;
    this.axeComboQueue = 0;
    this.axeComboTimer = 0;
    this.whipStrikesQueue = [];
    this.whipStrikeTimer = 0;
    this.morningstarStrikesQueue = [];
    this.morningstarStrikeTimer = 0;

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
    const w = this.weapons[type];
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
    const heavenly = this.weapons['heavenlySanctuary'];
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

    // 벼락검(thunderBlade) 연속 번개 베기 및 낙뢰 콤보
    if (this.thunderBladeComboQueue > 0) {
      this.thunderBladeComboTimer -= dt;
      if (this.thunderBladeComboTimer <= 0) {
        this.thunderBladeComboQueue--;
        this.thunderBladeComboTimer = 0.08;
        const thunderBlade = this.weapons['thunderBlade'];
        if (thunderBlade) this.executeThunderBlade(thunderBlade, enemies);
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
    if (this.morningstarStrikesQueue.length > 0) {
      this.morningstarStrikeTimer -= dt;
      if (this.morningstarStrikeTimer <= 0) {
        const isBack = this.morningstarStrikesQueue.shift();
        this.morningstarStrikeTimer = 0.10;
        const msTempest = this.weapons['morningstarTempest'];
        if (msTempest) this.executeMorningstarTempest(msTempest, isBack, msTempest.lastTargetAngle);
      }
    }

    // [진화 4] 폭풍칼날 (bladeStorm) 상시 궤도 회전 타격
    const bladeStorm = this.weapons['bladeStorm'];
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
            enemy.takeDamage(dmg, kbDir, 240);
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

        // 보스 원거리 투사체 요격 및 삭제 (패링)
        if (this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
          for (let pIdx = this.game.bossProjectiles.length - 1; pIdx >= 0; pIdx--) {
            const bp = this.game.bossProjectiles[pIdx];
            const pDist = Math.hypot(bp.x - bx, bp.y - by);
            if (pDist <= bladeRadius + (bp.radius || 6)) {
              this.game.bossProjectiles.splice(pIdx, 1);
            }
          }
        }
      }
    }

    // [기본 무기 14] 어둠의 보주 (shadowOrb) 자율 추적 사역마 다단히트
    const shadowOrb = this.weapons['shadowOrb'];
    if (shadowOrb) {
      const projSpeedMult = (1 + (shadowOrb.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbSpeed = 420 * projSpeedMult;
      const count = this.getCount(shadowOrb);
      const dmg = this.getDamage(shadowOrb);
      const orbRadius = 14 * this.getArea(shadowOrb);
      const hitInterval = Math.max(0.18, 0.30 / (1 + (shadowOrb.cooldownLevel || 0) * 0.08));

      if (!shadowOrb.familiars) shadowOrb.familiars = [];
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

      for (let i = 0; i < shadowOrb.familiars.length; i++) {
        const fam = shadowOrb.familiars[i];
        const famDistToPlayer = Math.hypot(fam.x - this.player.x, fam.y - this.player.y);
        const maxLeashDist = 420;
        const maxPlayerRange = 380;
        if (famDistToPlayer > maxLeashDist || (fam.target && Math.hypot(fam.target.x - this.player.x, fam.target.y - this.player.y) > maxPlayerRange)) {
          fam.target = null;
        }

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

        if (fam.target && famDistToPlayer <= maxLeashDist) {
          const dx = fam.target.x - fam.x;
          const dy = fam.target.y - fam.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 5) {
            const moveStep = Math.min(dist, orbSpeed * dt);
            fam.x += (dx / dist) * moveStep;
            fam.y += (dy / dist) * moveStep;
          }

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
              if (fam.target.isDead) {
                fam.target = null;
              }
            }
          }
        } else {
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

        if (!fam.trail) fam.trail = [];
        fam.trail.unshift({ x: fam.x, y: fam.y });
        if (fam.trail.length > 5) fam.trail.pop();

        for (const obs of obstacles) {
          if (obs.isDead || !obs.isDestructible) continue;
          const dist = Math.hypot(obs.x - fam.x, obs.y - fam.y);
          if (dist <= orbRadius + obs.radius) {
            obs.takeDamage(dmg, this.game);
          }
        }
      }
    }

    // [진화 14] 황혼의 나선 (eclipseSpiral) 자율 추적 사역마
    const eclipseSpiral = this.weapons['eclipseSpiral'];
    if (eclipseSpiral) {
      const projSpeedMult = (1 + (eclipseSpiral.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
      const orbSpeed = 520 * projSpeedMult;
      const count = this.getCount(eclipseSpiral);
      const dmg = this.getDamage(eclipseSpiral);
      const orbRadius = 18 * this.getArea(eclipseSpiral);
      const hitInterval = 0.20;

      if (!eclipseSpiral.familiars) eclipseSpiral.familiars = [];
      while (eclipseSpiral.familiars.length < count) {
        const idx = eclipseSpiral.familiars.length;
        eclipseSpiral.familiars.push({
          x: this.player.x + (Math.random() - 0.5) * 40,
          y: this.player.y + (Math.random() - 0.5) * 40,
          target: null,
          hitTimer: 0,
          missileTimer: (1.8 / Math.max(1, count)) * idx,
          hoverAngle: (idx * Math.PI * 2) / Math.max(1, count),
          trail: []
        });
      }
      if (eclipseSpiral.familiars.length > count) {
        eclipseSpiral.familiars.length = count;
      }

      let currentGhostCount = 0;
      for (let pIdx = 0; pIdx < this.projectiles.length; pIdx++) {
        if (this.projectiles[pIdx].type === 'voidGhostMissile') currentGhostCount++;
      }

      for (let i = 0; i < eclipseSpiral.familiars.length; i++) {
        const fam = eclipseSpiral.familiars[i];
        const famDistToPlayer = Math.hypot(fam.x - this.player.x, fam.y - this.player.y);
        const maxLeashDist = 480;
        const maxPlayerRange = 440;
        if (famDistToPlayer > maxLeashDist || (fam.target && Math.hypot(fam.target.x - this.player.x, fam.target.y - this.player.y) > maxPlayerRange)) {
          fam.target = null;
        }

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

        if (fam.target && famDistToPlayer <= maxLeashDist) {
          const dx = fam.target.x - fam.x;
          const dy = fam.target.y - fam.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 6) {
            const moveStep = Math.min(dist, orbSpeed * dt);
            fam.x += (dx / dist) * moveStep;
            fam.y += (dy / dist) * moveStep;
          }

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
          fam.hoverAngle = (fam.hoverAngle || 0) + 3.0 * dt;
          const targetX = this.player.x + Math.cos(fam.hoverAngle + (i * Math.PI * 2) / count) * 60;
          const targetY = this.player.y + Math.sin(fam.hoverAngle + (i * Math.PI * 2) / count) * 60;
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

        fam.missileTimer = (fam.missileTimer !== undefined ? fam.missileTimer : (0.6 * i)) - dt;
        if (fam.missileTimer <= 0) {
          fam.missileTimer = 1.8;

          if (currentGhostCount < 32) {
            sounds.playMagic();
            const spawnOffset = orbRadius + 14;
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

        if (!fam.trail) fam.trail = [];
        fam.trail.unshift({ x: fam.x, y: fam.y });
        if (fam.trail.length > 6) fam.trail.pop();

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
      if (w.id === 'bladeStorm' || w.id === 'shadowOrb' || w.id === 'eclipseSpiral') continue;
      w.cooldownTimer -= dt;

      if (w.cooldownTimer <= 0) {
        if (this.hasTargetInRange(w, enemies)) {
          this.fireWeapon(w, enemies);
          w.cooldownTimer = this.getCooldown(w);
        } else {
          w.cooldownTimer = 0; // 타겟이 범위에 진입할 때까지 즉발 준비 상태 유지
        }
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

      s.x = this.player.x;
      s.y = this.player.y;

      for (const enemy of enemies) {
        if (enemy.isDead || s.hitEnemies.has(enemy)) continue;
        const dist = Math.hypot(enemy.x - s.x, enemy.y - s.y);
        let inHitbox = false;

        if (s.type === 'circle') {
          inHitbox = dist <= s.radius + enemy.radius;
        } else if (s.type === 'cone') {
          if (dist <= s.range + enemy.radius) {
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

          if (s.isMorningstarTempest && !s.shurikenSpawned) {
            s.shurikenSpawned = true;
            this.triggerMorningstar4Shurikens(enemy.x, enemy.y, s.weaponRef);
          }
        }
      }

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

          if (s.isMorningstarTempest && !s.shurikenSpawned) {
            s.shurikenSpawned = true;
            this.triggerMorningstar4Shurikens(obs.x, obs.y, s.weaponRef);
          }
        }
      }

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
        if (p.type === 'holyCross' && !p.exploded) {
          p.exploded = true;
          this.triggerHolyCrossBurst(p, enemies, obstacles);
        }
        if (p.type === 'divineJudgement' && !p.exploded) {
          p.exploded = true;
          this.triggerDivineJudgementStrike(p, enemies, obstacles);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.type === 'chakram' || p.type === 'shadowVortex' || p.type === 'holyCross' || p.type === 'divineJudgement') {
        p.rotAngle = (p.rotAngle || 0) + dt * 26;
      }

      if ((p.type === 'chakram' || p.type === 'shadowVortex') && p.life <= (p.maxLife || 1.1) * 0.55) {
        p.returning = true;
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 28) {
          this.projectiles.splice(i, 1);
          continue;
        }
        const retSpd = (p.initialSpeed || 520) * 1.15;
        p.vx = (dx / dist) * retSpd;
        p.vy = (dy / dist) * retSpd;
      }

      if (p.type === 'lavaPool') {
        p.tickTimer = (p.tickTimer || 0) - dt;
        if (p.tickTimer <= 0) {
          p.tickTimer = 0.40;
          for (const enemy of enemies) {
            if (enemy.isDead) continue;
            if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= p.radius + enemy.radius) {
              enemy.takeDamage(p.damage, null, 0);
            }
          }
        }
        continue;
      }

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

      if (p.type === 'cycloneArrow') {
        const maxLife = p.maxLife || 0.95;
        const elapsed = Math.max(0, maxLife - p.life);
        const safeDelay = 0.10;
        const growthDuration = 0.25;
        let growthProg = 0;
        if (elapsed > safeDelay) {
          growthProg = Math.min(1.0, (elapsed - safeDelay) / growthDuration);
        }
        // 태풍의 눈: 블랙홀 범위 1/3로 축소 (225 -> 75), 흡인력 1/4로 하향 (320 -> 80)
        const maxPullRadius = 75 * (p.area || 1.0);
        const pullRadius = maxPullRadius * growthProg;
        p.currentPullRadius = pullRadius;
        p.growthProg = growthProg;
        if (pullRadius > 8) {
          for (const e of enemies) {
            if (e.isDead) continue;
            const ed = Math.hypot(p.x - e.x, p.y - e.y);
            if (ed < pullRadius && ed > 10) {
              const pullForce = (1 - ed / pullRadius) * 80 * dt;
              e.x += ((p.x - e.x) / ed) * pullForce;
              e.y += ((p.y - e.y) / ed) * pullForce;
            }
          }
          if (window.game && Math.random() < 0.25) {
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

          if (p.type === 'frostDagger') {
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 1.0);
            enemy.slowMult = 0.60;
            if (window.game) {
              window.game.addParticles(enemy.x, enemy.y, '#38bdf8', 6);
              window.game.addParticles(enemy.x, enemy.y, '#ffffff', 4);
            }
          }
          if (p.type === 'poisonDagger' || p.type === 'poisonShard' || p.type === 'shadowVortex') {
            enemy.poison(3.0, Math.round(p.damage * 0.45));
          }
          if (p.type === 'shadowVortex') {
            this.triggerShadowVortexShards(enemy.x, enemy.y, p.area, Math.round(p.damage * 0.5));
          }

          if (p.splashRadius > 0) {
            if (p.type === 'fireball' || p.type === 'apocalypseComet') {
              p.exploded = true;
              this.triggerFireSplash(p, enemies, obstacles);
            } else {
              this.triggerHolySplash(p, enemies, obstacles);
            }
          }

          if (p.type === 'teslaPellet') {
            this.triggerTeslaStrike(p, enemy, enemies);
          }

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
        pool.tickTimer = 0.80;
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

    // 4. 번개 사전 인디케이터 업데이트 (점선 회전 링 대기 후 번개 발동)
    if (this.lightningIndicators) {
      for (let i = this.lightningIndicators.length - 1; i >= 0; i--) {
        const ind = this.lightningIndicators[i];
        ind.timer -= dt;
        ind.rotAngle = (ind.rotAngle || 0) + dt * 14;
        if (ind.timer <= 0) {
          this.triggerLightningStrikeAt(ind.x, ind.y, ind.radius, ind.damage, enemies, obstacles);
          this.lightningIndicators.splice(i, 1);
        }
      }
    }

    // 5. 번개 낙뢰 이펙트 수명 업데이트
    if (this.lightningStrikes) {
      for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
        const ls = this.lightningStrikes[i];
        ls.life -= dt;
        if (ls.life <= 0) {
          this.lightningStrikes.splice(i, 1);
        }
      }
    }
  }

  triggerLightningStrikeAt(tx, ty, radius, dmg, enemies, obstacles) {
    sounds.playLightning();

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
      life: 0.14,
      maxLife: 0.14
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
        if (Math.random() < 0.25) e.freeze(0.4);
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
      this.game.addParticles(tx, ty, '#38bdf8', 10);
      this.game.addParticles(tx, ty, '#fef08a', 10);
      this.game.addParticles(tx, ty, '#ffffff', 6);
    }
  }

  hasTargetInRange(w, enemies) {
    // 0. 사거리 무제한 무기: 맵 전역 낙뢰, 랜덤 낙하, 상시 결계 및 오라 (사거리 체크 없이 상시 발사)
    if (
      w.id === 'lightningRing' ||
      w.id === 'holyWater' ||
      w.id === 'sanctuary' || w.id === 'heavenlySanctuary' ||
      w.id === 'plague' ||
      w.id === 'bladeStorm' ||
      w.id === 'shadowOrb' || w.id === 'eclipseSpiral'
    ) {
      return true;
    }

    const px = this.player.x;
    const py = this.player.y;
    const area = this.getArea(w);

    let checkRadius = 380 * area; // 기본 유효 사거리
    let checkBossProjectiles = false;

    // 캐릭터로부터 직접 발사/휘두르는 무기별 실제 유효 사거리 정밀 매핑
    if (w.id === 'axe') {
      checkRadius = 95 * area + 25;
      checkBossProjectiles = true;
    } else if (w.id === 'fireAxe') {
      checkRadius = 115 * area + 30;
      checkBossProjectiles = true;
    } else if (w.id === 'sword') {
      checkRadius = 80 * area + 25;
    } else if (w.id === 'thunderBlade') {
      checkRadius = 95 * area + 30;
    } else if (w.id === 'whip') {
      checkRadius = 165 * area + 20;
    } else if (w.id === 'morningstarTempest') {
      checkRadius = 175 * area + 25;
    } else if (w.id === 'frostWhip') {
      checkRadius = 170 * area + 25;
    } else if (w.id === 'shuriken' || w.id === 'scatterShuriken') {
      checkRadius = 310 * area;
    } else if (w.id === 'shotgun' || w.id === 'teslaShotgun') {
      checkRadius = 285 * area;
    } else if (w.id === 'magicMissile') {
      checkRadius = 450 * area;
    } else if (w.id === 'fireWand') {
      checkRadius = 380 * area;
    } else if (w.id === 'apocalypseComet') {
      checkRadius = 460 * area;
    } else if (w.id === 'poisonDagger') {
      checkRadius = 320 * area;
    } else if (w.id === 'windBow' || w.id === 'cycloneBow') {
      checkRadius = 480 * area;
    } else if (w.id === 'frostOrb' || w.id === 'venomBlizzard') {
      checkRadius = 360 * area;
    } else if (w.id === 'holyArrow') {
      checkRadius = 450 * area;
    } else if (w.id === 'chakram') {
      checkRadius = 340 * area;
    } else if (w.id === 'holyCross') {
      checkRadius = 380 * area;
    } else if (w.id === 'divineJudgement') {
      checkRadius = 420 * area;
    } else if (w.id === 'flamePillar' || w.id === 'infernoCataclysm') {
      checkRadius = 350 * area;
    } else if (w.id === 'shadowVortex') {
      checkRadius = 360 * area;
    }

    const checkRadiusSq = checkRadius * checkRadius;

    // 1. 도끼류 특수 조건: 보스 원거리 투사체 요격 판정
    if (checkBossProjectiles && this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
      const bpList = this.game.bossProjectiles;
      for (let i = 0; i < bpList.length; i++) {
        const bp = bpList[i];
        const dx = bp.x - px;
        const dy = bp.y - py;
        if (dx * dx + dy * dy <= checkRadiusSq) {
          return true;
        }
      }
    }

    // 2. 살아있는 적 검사
    if (enemies && enemies.length > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.isDead) continue;
        const dx = e.x - px;
        const dy = e.y - py;
        if (dx * dx + dy * dy <= checkRadiusSq) {
          return true;
        }
      }
    }

    // 3. 파괴 가능 장애물 검사 (상자/기암괴석 타격 허용)
    const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : null;
    if (obstacles && obstacles.length > 0) {
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.isDead || !obs.isDestructible) continue;
        const dx = obs.x - px;
        const dy = obs.y - py;
        if (dx * dx + dy * dy <= checkRadiusSq) {
          return true;
        }
      }
    }

    return false;
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

      case 'thunderBlade': {
        this.executeThunderBlade(w, enemies);
        if (count > 1) {
          this.thunderBladeComboQueue = count - 1;
          this.thunderBladeComboTimer = 0.08;
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
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        w.lastTargetAngle = baseAngle;

        const pattern = [];
        for (let i = 0; i < count; i++) {
          pattern.push(i % 2 === 1);
        }
        this.executeWhipStrike(w, pattern[0], baseAngle);
        this.whipStrikesQueue = pattern.slice(1);
        this.whipStrikeTimer = 0.11;
        break;
      }

      case 'shuriken': {
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

      case 'morningstarTempest': {
        const closestEnemy = this.getClosestEnemy(enemies);
        let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
        if (closestEnemy) {
          baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        }
        w.lastTargetAngle = baseAngle;

        const pattern = [];
        for (let i = 0; i < count; i++) {
          pattern.push(i % 2 === 1);
        }
        this.executeMorningstarTempest(w, pattern[0], baseAngle);
        this.morningstarStrikesQueue = pattern.slice(1);
        this.morningstarStrikeTimer = 0.10;
        break;
      }

      case 'bladeStorm': {
        break;
      }

      case 'apocalypseComet': {
        this.executeApocalypseComet(w, enemies);
        break;
      }

      case 'teslaShotgun': {
        this.executeTeslaShotgun(w, enemies);
        break;
      }

      case 'heavenlySanctuary': {
        this.executeHeavenlySanctuaryTick(w, enemies);
        break;
      }

      case 'magicMissile': {
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

      case 'holyWater': {
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

      case 'flamePillar': {
        this.executeFlamePillar(w, enemies);
        break;
      }

      case 'chakram': {
        this.executeChakram(w, enemies);
        break;
      }

      case 'holyCross': {
        this.executeHolyCross(w, enemies);
        break;
      }

      case 'infernoCataclysm': {
        this.executeInfernoCataclysm(w, enemies);
        break;
      }

      case 'shadowVortex': {
        this.executeShadowVortex(w, enemies);
        break;
      }

      case 'divineJudgement': {
        this.executeDivineJudgement(w, enemies);
        break;
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

  triggerHolyCrossBurst(p, enemies, obstacles) {
    sounds.playMagic();
    const area = p.area || 1.0;
    const burstRadius = 80 * area;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= burstRadius + enemy.radius) {
        enemy.takeDamage(Math.round(p.damage * 0.9), null, 100);
      }
    }
    if (window.game && window.game.addParticles) {
      window.game.addParticles(p.x, p.y, '#fef08a', 16);
      window.game.addParticles(p.x, p.y, '#ffffff', 8);
    }
  }

  triggerDivineJudgementStrike(p, enemies, obstacles) {
    sounds.playThunder();
    const area = p.area || 1.0;
    const strikeRadius = 110 * area;
    const strikeDmg = Math.round(p.damage * 1.4);

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= strikeRadius + enemy.radius) {
        enemy.takeDamage(strikeDmg, null, 140);
        if (Math.random() < 0.30) {
          enemy.freeze(0.5);
        }
      }
    }
    if (window.game && window.game.addParticles) {
      window.game.addParticles(p.x, p.y, '#facc15', 24);
      window.game.addParticles(p.x, p.y, '#ffffff', 14);
      window.game.addParticles(p.x, p.y, '#38bdf8', 10);
    }
  }
}
