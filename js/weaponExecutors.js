// Anti Survivors - 28종 기본/진화 무기 고유 발사 및 실행기 (js/weaponExecutors.js)

WeaponManager.prototype.executeSwordSlash = function(w, enemies) {
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
WeaponManager.prototype.executeAxeSlash = function(w) {
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
      knockbackForce: 110,
      life: 0.22,
      maxLife: 0.22,
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }

  // 3. 채찍 (whip): 자동 타겟 방향 및 반대 방향 교차 부채꼴 긁어내기
WeaponManager.prototype.executeWhipStrike = function(w, isBack = false, baseAngle = null) {
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

  // [진화 1] 생츄어리 (heavenlySanctuary): 초대형 결계 + 내부 성수 정화 도트 + 적 빙결(동결) 효과
WeaponManager.prototype.executeHeavenlySanctuaryTick = function(w, enemies) {
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

  // [진화 2] 모닝스타 (morningstarTempest): 일반 채찍과 동일하게 휘두르며 첫 번째 타겟 적중 시 4방향 관통 표창 방출
WeaponManager.prototype.executeMorningstarTempest = function(w, isBack = false, baseAngle = null) {
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

  // 모닝스타: 첫 번째 타겟 적중 위치에서 4방향 관통 표창 발사
WeaponManager.prototype.triggerMorningstar4Shurikens = function(tx, ty, w) {
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

  // [진화 3] 메테오 (apocalypseComet): 유도 고열 화염 혜성 연사 및 초대형 연쇄 폭발
WeaponManager.prototype.executeApocalypseComet = function(w, enemies) {
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

  // [진화 4] 폭풍검 (slayerBladeStorm): 상시 회전 칼날은 update에서 처리 (검기 삭제)
WeaponManager.prototype.executeSlayerBladeStorm = function(w, enemies) {
    // 검기 삭제 완료 - 상시 궤도 회전 대검/도끼로만 전투 수행
  }

  // [진화 5] 뇌전포 (teslaShotgun): 고전압 뇌전 산탄 + 체인 라이트닝 + 즉시 낙뢰 폭격
WeaponManager.prototype.executeTeslaShotgun = function(w, enemies) {
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
WeaponManager.prototype.executeBladeWhipStrike = function(w, isBack = false) {
    this.executeMorningstarTempest(w, isBack);
  }

WeaponManager.prototype.executeArcaneSanctuary = function(w, enemies) {
    this.executeApocalypseComet(w, enemies);
  }

WeaponManager.prototype.executePlasmaTempest = function(w, enemies) {
    this.executeTeslaShotgun(w, enemies);
  }

  // 기본 무기 성역 (sanctuary)
WeaponManager.prototype.executeSanctuaryTick = function(w, enemies) {
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
WeaponManager.prototype.executeLightningStrike = function(w, enemies) {
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

  // 기본 무기 불 지팡이 (fireWand)
WeaponManager.prototype.executeFireWand = function(w, enemies) {
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

WeaponManager.prototype.triggerTeslaStrike = function(p, hitEnemy, enemies) {
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

    // 뇌전포 낙뢰 착탄 고전압 스파크 파티클 연출
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

WeaponManager.prototype.triggerHolySplash = function(p, enemies, obstacles) {
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

WeaponManager.prototype.triggerFireSplash = function(p, enemies, obstacles) {
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

WeaponManager.prototype.executePoisonDagger = function(w, enemies) {
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
WeaponManager.prototype.executeFrostOrb = function(w, enemies) {
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
        radius: 8.5 * area,
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

  // [진화 6] 블리자드 (venomBlizzard: 2단계 원거리 발사형)
WeaponManager.prototype.executeVenomBlizzard = function(w, enemies) {
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
        radius: 8.5 * area,
        area: area,
        damage: dmg,
        pierce: 9999,
        knockbackForce: 60,
        pulseTimer: 0,
        life: 2.0,
        color: '#10b981',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // 블리자드 2단계: 2초 후 폭발하여 8방향 독단검(poisonDagger) 발사
WeaponManager.prototype.triggerVenomBlizzardShards = function(x, y, area, damage) {
    sounds.playSlash();
    if (window.game) {
      window.game.addParticles(x, y, '#10b981', 30);
      window.game.addParticles(x, y, '#38bdf8', 30);
    }
    const daggerSpeed = 520;
    const daggerDmg = Math.round(damage * 1.35);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.projectiles.push({
        type: 'poisonDagger',
        x: x,
        y: y,
        vx: Math.cos(angle) * daggerSpeed,
        vy: Math.sin(angle) * daggerSpeed,
        radius: 7 * area,
        area: area,
        damage: daggerDmg,
        pierce: 3,
        knockbackForce: 130,
        life: 0.70,
        color: '#22c55e',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [신규 진화 7] 벼락검 (thunderBlade): 원의 4분의 1(90도) 전방 번개 대검 회전 베기 + 타겟 위치 벼락 낙뢰
WeaponManager.prototype.executeThunderBlade = function(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const range = 115 * area;
    const closestEnemy = this.getClosestEnemy(enemies);
    let targetAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closestEnemy) {
      targetAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }
    // 원의 4분의 1 (90도 = Math.PI / 2) 호를 그리며 번개 대검 회전 베기 애니메이션 트리거
    this.player.triggerAttackAnim('thunderBlade', targetAngle, 0.16, { arc: Math.PI / 2, range, area: area * 1.35, color: '#facc15' });

    let hitTarget = null;
    const halfArc = Math.PI / 4; // 좌우 45도씩 총 90도(원의 1/4)
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= range + enemy.radius) {
        const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        let diff = Math.abs(angleToEnemy - targetAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff <= halfArc) {
          const kbDir = { x: Math.cos(targetAngle), y: Math.sin(targetAngle) };
          enemy.takeDamage(dmg, kbDir, 170);
          if (!hitTarget) hitTarget = enemy;
        }
      }
    }

    // 2단계: 베어낸 타겟(또는 전방)에 즉시 벼락 낙뢰
    const lightningTarget = hitTarget || closestEnemy;
    if (lightningTarget) {
      sounds.playThunder();
      const lx = lightningTarget.x;
      const ly = lightningTarget.y;
      const strikeDmg = Math.round(dmg * 1.35);
      for (const e of enemies) {
        if (e.isDead) continue;
        if (Math.hypot(e.x - lx, e.y - ly) <= 75 * area + e.radius) {
          e.takeDamage(strikeDmg, null, 80);
        }
      }
      if (window.game) {
        window.game.addParticles(lx, ly, '#facc15', 20);
        window.game.addParticles(lx, ly, '#ffffff', 10);
      }
    }
  }

  // [신규 진화 8] 화염도끼 (fireAxe): 360도 도끼 회전 베기 + 4방향 화염구 방출
WeaponManager.prototype.executeFireAxe = function(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 115 * area;
    this.player.triggerAttackAnim('circle', 0, 0.18, { area: area * 1.3, color: '#f97316' });

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= radius + enemy.radius) {
        const kbDir = {
          x: (enemy.x - this.player.x) / (dist || 1),
          y: (enemy.y - this.player.y) / (dist || 1)
        };
        enemy.takeDamage(dmg, kbDir, 200);
      }
    }

    // [특수 기믹] 화염도끼 360도 회전 베기 시 적 및 보스 투사체 요격 및 즉시 삭제 (패링)
    if (this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
      for (let pIdx = this.game.bossProjectiles.length - 1; pIdx >= 0; pIdx--) {
        const bp = this.game.bossProjectiles[pIdx];
        const pDist = Math.hypot(bp.x - this.player.x, bp.y - this.player.y);
        if (pDist <= radius + (bp.radius || 6)) {
          this.game.bossProjectiles.splice(pIdx, 1);
        }
      }
    }

    // 장애물 피해 부여
    if (this.game && this.game.obstacles && this.game.obstacles.obstacles) {
      for (const obs of this.game.obstacles.obstacles) {
        if (obs.isDestroyed) continue;
        const dist = Math.hypot(obs.x - this.player.x, obs.y - this.player.y);
        if (dist <= radius + obs.radius) {
          obs.takeDamage(dmg, this.game);
        }
      }
    }

    // 2단계: 4방향 화염구 방출 및 폭발
    sounds.playFire();
    const speed = 400;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      this.projectiles.push({
        type: 'fireball',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 8 * area,
        area: area,
        damage: Math.round(dmg * 0.8),
        splashRadius: 65 * area,
        splashDamage: Math.round(dmg * 0.8),
        pierce: 1,
        knockbackForce: 120,
        life: 0.85,
        color: '#f97316',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [신규 진화 9] 얼음채찍 (frostWhip): 전후방 교차 타격 + 8% 확률 1초 빙결
WeaponManager.prototype.executeFrostWhip = function(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const closest = this.getClosestEnemy(enemies);
    let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
    if (closest) {
      baseAngle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
    }

    // 1단계 타격 + 2단계 8% 확률 빙결
    const strike = (angle) => {
      this.player.triggerAttackAnim('whip', angle, 0.15, { area, color: '#38bdf8' });
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist <= 180 * area + enemy.radius) {
          const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
          let diff = Math.abs(angleToEnemy - angle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= Math.PI * 0.40) {
            enemy.takeDamage(dmg, { x: Math.cos(angle), y: Math.sin(angle) }, 130);
            if (Math.random() < 0.08) {
              enemy.freeze(1.0); // 8% 확률 1초 빙결
            }
          }
        }
      }
    };
    strike(baseAngle);
    setTimeout(() => strike(baseAngle + Math.PI), 100);
  }

  // [신규 진화 10] 산탄표창 (scatterShuriken): 전방 부채꼴 5발 대형 관통 수리검
WeaponManager.prototype.executeScatterShuriken = function(w, enemies) {
    sounds.playSlash();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = 5;
    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    const speed = 580;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.18;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'shuriken',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 8 * area,
        area: area,
        damage: dmg,
        pierce: 5,
        knockbackForce: 200,
        life: 0.70,
        rotAngle: Math.random() * Math.PI * 2,
        color: '#f43f5e',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [신규 진화 11] 신성화살 (holyArrow): 유도 화살 2발 + 적중 시 정화 장판
WeaponManager.prototype.executeHolyArrow = function(w, enemies) {
    sounds.playMagic();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = 2;
    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    const speed = 460;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.25;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'holyArrow',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7 * area,
        area: area,
        damage: dmg,
        pierce: 1,
        homing: true,
        knockbackForce: 100,
        life: 1.8,
        color: '#fef08a',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [신규 진화 12] 역병 (plague): 결계 기본 도트 + 30초마다 화면 전체 대폭발 (전멸기)
WeaponManager.prototype.executePlagueTick = function(w, enemies) {
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const radius = 105 * area;

    // 1단계: 성스러운 독기 결계 도트 피해
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist <= radius + enemy.radius) {
        enemy.takeDamage(dmg, null, 0);
        enemy.poison(3.0, Math.round(dmg * 0.35));
      }
    }

    // 2단계: 30초 타이머 체크 및 화면 전체 대폭발
    w.burstTimer = (w.burstTimer === undefined ? 30.0 : w.burstTimer) - (w.baseCooldown || 0.8);
    if (w.burstTimer <= 0) {
      w.burstTimer = 30.0;
      sounds.playThunder();
      sounds.playAcid();
      const burstDmg = dmg * 8; // 화면 전체 대형 폭발 피해

      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        enemy.takeDamage(burstDmg, null, 0);
      }

      if (window.game) {
        // 화면 전체 보라색/녹색 역병 파티클 방출
        for (let k = 0; k < 60; k++) {
          const rx = this.player.x + (Math.random() - 0.5) * 1200;
          const ry = this.player.y + (Math.random() - 0.5) * 800;
          window.game.addParticles(rx, ry, k % 2 === 0 ? '#a855f7' : '#22c55e', 3);
        }
      }
    }
  }

  // [기본 무기 13] 바람 활 (windBow): 초고속 관통 돌풍 화살 및 넉백
WeaponManager.prototype.executeWindBow = function(w, enemies) {
    sounds.playShoot();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    const speed = 620 * projSpeedBonus;

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.12 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'windArrow',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 * area,
        area: area,
        damage: dmg,
        pierce: 3 + (w.countLevel || 0),
        knockbackForce: 220,
        life: 0.85,
        color: '#10b981',
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [기본 무기 14] 어둠의 보주 (shadowOrb): 자율 추적 사역마 (update 루프에서 상시 구동)
WeaponManager.prototype.executeShadowOrb = function(w, enemies) {
    // update() 루프에서 사역마(familiars)로 상시 동작
  }

  // [신규 진화 13] 태풍의 눈 (cycloneBow = 바람 활 + 표창): 대형 회오리 화살 + 착탄 블랙홀
WeaponManager.prototype.executeCycloneBow = function(w, enemies) {
    sounds.playShoot();
    const dmg = this.getDamage(w);
    const area = this.getArea(w);
    const count = this.getCount(w);
    const closest = this.getClosestEnemy(enemies);
    const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
    const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
    const speed = 580 * projSpeedBonus;

    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.12 : 0;
      const angle = baseAngle + spread;
      this.projectiles.push({
        type: 'cycloneArrow',
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 14 * area,
        area: area,
        damage: dmg,
        pierce: 999,
        knockbackForce: 190,
        life: 0.95,
        maxLife: 0.95,
        color: '#34d399',
        hitCooldowns: new Map(),
        hitEnemies: new Set(),
        hitObstacles: new Set()
      });
    }
  }

  // [신규 진화 14] 황혼의 나선 (eclipseSpiral = 어둠의 보주 + 마법 화살): 자율 추적 사역마 3체 + 미사일 소환 (update 루프에서 상시 구동)
WeaponManager.prototype.executeEclipseSpiral = function(w, enemies) {
    // update() 루프에서 사역마(familiars)로 상시 동작
  }
