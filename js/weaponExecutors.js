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
    arc: 0.72,
    range: 80 * area,
    damage: dmg,
    knockbackDir: { x: Math.cos(angle), y: Math.sin(angle) },
    knockbackForce: 130,
    life: 0.10,
    maxLife: 0.10,
    hitEnemies: new Set(),
    hitObstacles: new Set()
  });
};

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
    canParryProjectiles: true, // 💡 도끼 회전 베기 고유 투사체 패링 활성화
    hitEnemies: new Set(),
    hitObstacles: new Set()
  });
};

WeaponManager.prototype.executeWhipStrike = function(w, isBack = false, baseAngle = null) {
  sounds.playWhip();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  let targetAngle = baseAngle;
  if (targetAngle === null || targetAngle === undefined) {
    targetAngle = (w.lastTargetAngle !== undefined) ? w.lastTargetAngle : Math.atan2(this.player.facing.y, this.player.facing.x);
  }
  const angle = isBack ? (targetAngle + Math.PI) : targetAngle;

  const arc = 1.95;
  const range = 165 * area;
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
};

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
};

WeaponManager.prototype.executeMorningstarTempest = function(w, isBack = false, baseAngle = null) {
  sounds.playWhip();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  let targetAngle = baseAngle;
  if (targetAngle === null || targetAngle === undefined) {
    targetAngle = (w.lastTargetAngle !== undefined) ? w.lastTargetAngle : Math.atan2(this.player.facing.y, this.player.facing.x);
  }
  const angle = isBack ? (targetAngle + Math.PI) : targetAngle;

  const arc = 2.05;
  const range = 210 * area;
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
};

WeaponManager.prototype.triggerMorningstar4Shurikens = function(tx, ty, w) {
  sounds.playSlash();
  const dmg = Math.round(this.getDamage(w) * 0.75);
  const area = this.getArea(w);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 520 * projSpeedBonus;

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
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
};

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
      pierce: 1,
      splashRadius: 90 * area,
      splashDamage: Math.round(dmg * 0.90),
      knockbackForce: 220,
      life: 1.4,
      homing: true,
      color: '#ef4444',
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

WeaponManager.prototype.executeBladeStorm = function(w, enemies) {
  // 상시 궤도 회전만 동작 (검기 미발사)
};

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
      pierce: 1,
      knockbackForce: 200,
      life: 0.60,
      homing: false,
      color: '#38bdf8',
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

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
};

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

    if (!this.lightningIndicators) this.lightningIndicators = [];
    this.lightningIndicators.push({
      x: tx,
      y: ty,
      radius: radius,
      timer: 0.20 + i * 0.04,
      maxTimer: 0.20 + i * 0.04,
      rotAngle: Math.random() * Math.PI * 2,
      damage: dmg
    });
  }
};

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
};

WeaponManager.prototype.triggerTeslaStrike = function(p, hitEnemy, enemies) {
  sounds.playLightning();
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

  if (this.game && this.game.addParticles) {
    this.game.addParticles(tx, ty, '#38bdf8', 12);
    this.game.addParticles(tx, ty, '#ffffff', 8);
  }

  if (Math.random() < 0.25) (hitEnemy.stun ? hitEnemy.stun(0.4) : hitEnemy.freeze(0.4));

  let chained = 0;
  for (const other of enemies) {
    if (other === hitEnemy || other.isDead) continue;
    const d = Math.hypot(other.x - tx, other.y - ty);
    if (d < 160) {
      other.takeDamage(Math.round(p.damage * 0.7), null, 80);
      if (Math.random() < 0.25) (other.stun ? other.stun(0.4) : other.freeze(0.4));
      if (this.game && this.game.addParticles) {
        this.game.addParticles(other.x, other.y, '#38bdf8', 6);
        this.game.addParticles(other.x, other.y, '#ffffff', 4);
      }
      chained++;
      if (chained >= 3) break;
    }
  }
};

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
};

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
};

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
};

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
};

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
};

WeaponManager.prototype.triggerVenomBlizzardShards = function(x, y, area, damage) {
  sounds.playSlash();
  if (window.game) {
    window.game.addParticles(x, y, '#ffffff', 30);
    window.game.addParticles(x, y, '#38bdf8', 30);
  }
  const daggerSpeed = 520;
  const daggerDmg = Math.round(damage * 1.35);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    this.projectiles.push({
      type: 'frostDagger',
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
      color: '#38bdf8',
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

WeaponManager.prototype.triggerShadowVortexShards = function(x, y, area, damage) {
  sounds.playSlash();
  if (window.game) {
    window.game.addParticles(x, y, '#10b981', 8);
    window.game.addParticles(x, y, '#6366f1', 8);
  }
  const shardSpeed = 520;
  const shardDmg = Math.round(damage * 1.35);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    this.projectiles.push({
      type: 'poisonDagger',
      x: x,
      y: y,
      vx: Math.cos(angle) * shardSpeed,
      vy: Math.sin(angle) * shardSpeed,
      radius: 7 * area,
      area: area,
      damage: shardDmg,
      pierce: 3,
      knockbackForce: 130,
      life: 0.35,
      color: '#22c55e',
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

// [신규 진화 7] 벼락검 (thunderBlade): 90도 전방 번개 대검 회전 베기 + 타겟 위치 즉각 낙뢰
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
  const angleJitter = (Math.random() - 0.5) * 0.12;
  const finalAngle = targetAngle + angleJitter;

  this.player.triggerAttackAnim('thunderBlade', finalAngle, 0.16, { arc: Math.PI / 2, range, area: area * 1.35, color: '#facc15' });

  let hitTarget = null;
  const halfArc = Math.PI / 4;
  for (const enemy of enemies) {
    if (enemy.isDead) continue;
    const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
    if (dist <= range + enemy.radius) {
      const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
      let diff = Math.abs(angleToEnemy - finalAngle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff <= halfArc) {
        const kbDir = { x: Math.cos(finalAngle), y: Math.sin(finalAngle) };
        enemy.takeDamage(dmg, kbDir, 170);
        if (Math.random() < 0.30) (enemy.stun ? enemy.stun(0.5) : enemy.freeze(0.5));
        if (!hitTarget) hitTarget = enemy;
      }
    }
  }

  const obstacles = this.game && this.game.obstacleManager ? this.game.obstacleManager.obstacles : [];
  for (const obs of obstacles) {
    if (obs.isDead || !obs.isDestructible) continue;
    const dist = Math.hypot(obs.x - this.player.x, obs.y - this.player.y);
    if (dist <= range + obs.radius) {
      const angleToObs = Math.atan2(obs.y - this.player.y, obs.x - this.player.x);
      let diff = Math.abs(angleToObs - finalAngle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff <= halfArc) {
        obs.takeDamage(dmg, this.game);
      }
    }
  }

  // 2단계: 벼락 낙뢰 발동
  const lightningTarget = hitTarget || closestEnemy;
  sounds.playThunder();
  let lx, ly;
  if (lightningTarget) {
    lx = lightningTarget.x + (Math.random() - 0.5) * 16;
    ly = lightningTarget.y + (Math.random() - 0.5) * 16;
  } else {
    lx = this.player.x + Math.cos(finalAngle) * (range * 0.75);
    ly = this.player.y + Math.sin(finalAngle) * (range * 0.75);
  }

  const strikeDmg = Math.round(dmg * 1.35);
  const strikeRadius = 75 * area;

  const segments = [{ x: lx, y: ly - 420 }];
  const steps = 6;
  for (let s = 1; s < steps; s++) {
    segments.push({
      x: lx + (Math.random() - 0.5) * 35,
      y: (ly - 420) + 420 * (s / steps)
    });
  }
  segments.push({ x: lx, y: ly });

  this.lightningStrikes.push({
    x: lx,
    y: ly,
    segments: segments,
    radius: strikeRadius,
    life: 0.16,
    maxLife: 0.16
  });

  for (const e of enemies) {
    if (e.isDead) continue;
    if (Math.hypot(e.x - lx, e.y - ly) <= strikeRadius + e.radius) {
      e.takeDamage(strikeDmg, null, 80);
      if (Math.random() < 0.30) (e.stun ? e.stun(0.5) : e.freeze(0.5));
    }
  }

  for (const obs of obstacles) {
    if (obs.isDead || !obs.isDestructible) continue;
    if (Math.hypot(obs.x - lx, obs.y - ly) <= strikeRadius + obs.radius) {
      obs.takeDamage(strikeDmg, this.game);
    }
  }

  if (window.game && window.game.addParticles) {
    window.game.addParticles(lx, ly, '#facc15', 12);
    window.game.addParticles(lx, ly, '#ffffff', 6);
  }
};

WeaponManager.prototype.executeFireAxe = function(w, enemies) {
  sounds.playSlash();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const radius = 115 * area;

  // 1. 화염도끼 회전 베기 애니메이션 트리거
  this.player.triggerAttackAnim('fireAxe', 0, 0.22, { area, color: '#f97316' });

  // 2. 근접 원형 슬래시 판정 및 적 타격 (도끼 고유 투사체 패링 활성화)
  this.slashes.push({
    type: 'circle',
    x: this.player.x,
    y: this.player.y,
    radius: radius,
    damage: dmg,
    knockbackDir: null,
    knockbackForce: 180,
    life: 0.22,
    maxLife: 0.22,
    isFireAxe: true,
    canParryProjectiles: true,
    hitEnemies: new Set(),
    hitObstacles: new Set()
  });

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

  // 3. 근접 범위 내 보스 투사체 패링(삭제)
  if (this.game && this.game.bossProjectiles && this.game.bossProjectiles.length > 0) {
    for (let pIdx = this.game.bossProjectiles.length - 1; pIdx >= 0; pIdx--) {
      const bp = this.game.bossProjectiles[pIdx];
      const pDist = Math.hypot(bp.x - this.player.x, bp.y - this.player.y);
      if (pDist <= radius + (bp.radius || 6)) {
        this.game.bossProjectiles.splice(pIdx, 1);
      }
    }
  }

  // 4. 장애물 타격
  if (this.game && this.game.obstacleManager && this.game.obstacleManager.obstacles) {
    for (const obs of this.game.obstacleManager.obstacles) {
      if (obs.isDead || !obs.isDestructible) continue;
      const dist = Math.hypot(obs.x - this.player.x, obs.y - this.player.y);
      if (dist <= radius + obs.radius) {
        obs.takeDamage(dmg, this.game);
      }
    }
  }

  // 5. 파이어볼 발사: 연타 횟수에 따라 십자가(+)와 대각선(X) 교차 발사
  sounds.playFire();
  w.fireCycle = (w.fireCycle || 0) + 1;
  const isDiagonal = (w.fireCycle % 2 === 0);
  const baseOffset = isDiagonal ? (Math.PI / 4) : 0;
  const speed = 400;

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + baseOffset;
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
};

WeaponManager.prototype.executeFrostWhip = function(w, enemies) {
  sounds.playSlash();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const closest = this.getClosestEnemy(enemies);
  let baseAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
  if (closest) {
    baseAngle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
  }

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
            enemy.freeze(1.0);
          }
        }
      }
    }
  };
  strike(baseAngle);
  setTimeout(() => strike(baseAngle + Math.PI), 100);
};

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
};

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
};

WeaponManager.prototype.executePlagueTick = function(w, enemies) {
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const radius = 105 * area;

  for (const enemy of enemies) {
    if (enemy.isDead) continue;
    const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
    if (dist <= radius + enemy.radius) {
      enemy.takeDamage(dmg, null, 0);
      enemy.poison(3.0, Math.round(dmg * 0.35));
    }
  }

  w.burstTimer = (w.burstTimer === undefined ? 30.0 : w.burstTimer) - (w.baseCooldown || 0.8);
  if (w.burstTimer <= 0) {
    w.burstTimer = 30.0;
    sounds.playThunder();
    sounds.playAcid();
    const burstDmg = dmg * 8;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      enemy.takeDamage(burstDmg, null, 0);
    }

    if (window.game) {
      for (let k = 0; k < 60; k++) {
        const rx = this.player.x + (Math.random() - 0.5) * 1200;
        const ry = this.player.y + (Math.random() - 0.5) * 800;
        window.game.addParticles(rx, ry, k % 2 === 0 ? '#a855f7' : '#22c55e', 3);
      }
    }
  }
};

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
};

WeaponManager.prototype.executeShadowOrb = function(w, enemies) {
  // update() 루프에서 상시 동작
};

WeaponManager.prototype.executeCycloneBow = function(w, enemies) {
  sounds.playShoot();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const closest = this.getClosestEnemy(enemies);
  const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 290 * projSpeedBonus;

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
      life: 1.4,
      maxLife: 1.4,
      color: '#34d399',
      hitCooldowns: new Map(),
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

WeaponManager.prototype.executeEclipseSpiral = function(w, enemies) {
  // update() 루프에서 상시 동작
};

// 💡 [개편]: 타겟 위치 기반 수직 화염기둥 - 지상/공중 몬스터 전방위 타격 및 수직 부유 넉백
WeaponManager.prototype.executeFlamePillar = function(w, enemies) {
  sounds.playFire();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const radius = 75 * area;

  const validEnemies = enemies.filter(e => !e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 450);
  validEnemies.sort((a, b) => Math.hypot(a.x - this.player.x, a.y - this.player.y) - Math.hypot(b.x - this.player.x, b.y - this.player.y));

  for (let i = 0; i < count; i++) {
    let targetX, targetY;
    if (validEnemies[i]) {
      targetX = validEnemies[i].x;
      targetY = validEnemies[i].y;
    } else {
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 140;
      targetX = this.player.x + Math.cos(ang) * dist;
      targetY = this.player.y + Math.sin(ang) * dist;
    }

    // 수직 화염기둥 슬래시 (패링 없음, 위치 고정, 수직 상승 넉백)
    this.slashes.push({
      type: 'circle',
      x: targetX,
      y: targetY,
      radius: radius,
      height: 230 * area, // 렌더러가 참조할 수직 기둥 높이
      damage: dmg,
      knockbackDir: { x: (Math.random() - 0.5) * 0.3, y: -1.0 }, // 수직 띄우기 넉백
      knockbackForce: 160,
      life: 0.36,
      maxLife: 0.36,
      isFlamePillar: true,
      canParryProjectiles: false, // 투사체 삭제 옵션 영구 제거
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });

    if (window.game && window.game.addParticles) {
      window.game.addParticles(targetX, targetY, '#f97316', 16);
      window.game.addParticles(targetX, targetY, '#ef4444', 10);
      window.game.addParticles(targetX, targetY, '#fde047', 8);
    }
  }
};

WeaponManager.prototype.executeChakram = function(w, enemies) {
  sounds.playSlash();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const closest = this.getClosestEnemy(enemies);
  const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 520 * projSpeedBonus;

  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * 0.16 : 0;
    const angle = baseAngle + spread;
    this.projectiles.push({
      type: 'chakram',
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      initialSpeed: speed,
      radius: 12 * area,
      area: area,
      damage: dmg,
      pierce: 999,
      knockbackForce: 130,
      life: 1.1,
      maxLife: 1.1,
      rotAngle: 0,
      returning: false,
      hitCooldowns: new Map(),
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

WeaponManager.prototype.executeHolyCross = function(w, enemies) {
  sounds.playMagic();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const closest = this.getClosestEnemy(enemies);
  const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 400 * projSpeedBonus;

  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * 0.20 : 0;
    const angle = baseAngle + spread;
    this.projectiles.push({
      type: 'holyCross',
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 14 * area,
      area: area,
      damage: dmg,
      pierce: 999,
      knockbackForce: 150,
      life: 0.90,
      maxLife: 0.90,
      rotAngle: 0,
      hitCooldowns: new Map(),
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

// 💡 [개편]: 대재앙 인페르노 - 거대 수직 화염기둥 폭발과 투과형 용암 아지랑이 생성
WeaponManager.prototype.executeInfernoCataclysm = function(w, enemies) {
  sounds.playFire();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = 4 + (this.getCount(w) - 1);
  const radius = 95 * area;

  const validEnemies = enemies.filter(e => !e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 550);
  validEnemies.sort(() => 0.5 - Math.random());

  for (let i = 0; i < count; i++) {
    let targetX, targetY;
    if (validEnemies[i]) {
      targetX = validEnemies[i].x;
      targetY = validEnemies[i].y;
    } else {
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 200;
      targetX = this.player.x + Math.cos(ang) * dist;
      targetY = this.player.y + Math.sin(ang) * dist;
    }

    this.slashes.push({
      type: 'circle',
      x: targetX,
      y: targetY,
      radius: radius,
      height: 300 * area,
      damage: dmg,
      knockbackDir: { x: (Math.random() - 0.5) * 0.4, y: -1.0 },
      knockbackForce: 200,
      life: 0.40,
      maxLife: 0.40,
      isInferno: true,
      canParryProjectiles: false, // 투사체 삭제 옵션 영구 제거
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });

    this.projectiles.push({
      type: 'lavaPool',
      x: targetX,
      y: targetY,
      radius: radius * 0.85,
      area: area,
      damage: Math.round(dmg * 0.4),
      life: 4.0,
      maxLife: 4.0,
      tickTimer: 0.4,
      color: '#f97316'
    });

    if (window.game && window.game.addParticles) {
      window.game.addParticles(targetX, targetY, '#ef4444', 20);
      window.game.addParticles(targetX, targetY, '#facc15', 14);
      window.game.addParticles(targetX, targetY, '#f97316', 10);
    }
  }
};

WeaponManager.prototype.executeShadowVortex = function(w, enemies) {
  sounds.playSlash();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const closest = this.getClosestEnemy(enemies);
  const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 560 * projSpeedBonus;

  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * 0.18 : 0;
    const angle = baseAngle + spread;
    this.projectiles.push({
      type: 'shadowVortex',
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      initialSpeed: speed,
      radius: 18 * area,
      area: area,
      damage: dmg,
      pierce: 999,
      knockbackForce: 160,
      life: 1.4,
      maxLife: 1.4,
      rotAngle: 0,
      returning: false,
      hitCooldowns: new Map(),
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};

WeaponManager.prototype.executeDivineJudgement = function(w, enemies) {
  sounds.playMagic();
  const dmg = this.getDamage(w);
  const area = this.getArea(w);
  const count = this.getCount(w);
  const closest = this.getClosestEnemy(enemies);
  const baseAngle = closest ? Math.atan2(closest.y - this.player.y, closest.x - this.player.x) : Math.atan2(this.player.facing.y, this.player.facing.x);
  const projSpeedBonus = (1 + (w.speedProjLevel || 0) * 0.18) * (this.player.bonusProjSpeedMult || 1.0);
  const speed = 440 * projSpeedBonus;

  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
    const angle = baseAngle + spread;
    this.projectiles.push({
      type: 'divineJudgement',
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 20 * area,
      area: area,
      damage: dmg,
      pierce: 999,
      knockbackForce: 180,
      life: 1.0,
      maxLife: 1.0,
      rotAngle: 0,
      hitCooldowns: new Map(),
      hitEnemies: new Set(),
      hitObstacles: new Set()
    });
  }
};
