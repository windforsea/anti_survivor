// 플레이어 클래스 및 컨트롤러
class Player {
  constructor(x, y, characterType = 'knight') {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.characterType = characterType;
    
    // 캐릭터별 기본 베이스 스탯 및 스프라이트
    if (characterType === 'mage') {
      this.spriteKey = 'player_mage';
      this.charName = '화염 마도사';
      this.maxHp = 80;
      this.hp = 80;
      this.baseSpeed = 210;
      this.speed = 210;
      this.armor = 0;
      this.atkPowerMult = 1.20;
      this.globalCooldownMult = 1.10;
      this.bonusProjSpeedMult = 1.15;
    } else if (characterType === 'assassin') {
      this.spriteKey = 'player_assassin';
      this.charName = '그림자 암살자';
      this.maxHp = 90;
      this.hp = 90;
      this.baseSpeed = 260;
      this.speed = 260;
      this.armor = 0;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
    } else if (characterType === 'cleric') {
      this.spriteKey = 'player_cleric';
      this.charName = '해골 성직자';
      this.maxHp = 100;
      this.hp = 100;
      this.baseSpeed = 215;
      this.speed = 215;
      this.armor = 0;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
      this.hasRevive = true;
      this.reviveCount = 1;
      this.hpRegen = 0.6;
      this.bonusAreaMult = 1.15;
    } else if (characterType === 'sylph') {
      this.spriteKey = 'player_sylph';
      this.charName = '바람의 궁수';
      this.maxHp = 90;
      this.hp = 90;
      this.baseSpeed = 240;
      this.speed = 240;
      this.armor = 0;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.30;
      this.bonusAreaMult = 1.25;
    } else if (characterType === 'malakar') {
      this.spriteKey = 'player_malakar';
      this.charName = '심연의 워록';
      this.maxHp = 110;
      this.hp = 110;
      this.baseSpeed = 220;
      this.speed = 220;
      this.armor = 0;
      this.atkPowerMult = 1.15;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
      this.vampireChance = 0.03;
    } else {
      this.spriteKey = 'player';
      this.charName = '방랑 기사';
      this.maxHp = 120;
      this.hp = 120;
      this.baseSpeed = 220;
      this.speed = 220;
      this.armor = 1;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
    }

    this.thornsPercent = 0.0;
    this.hpRegen = 0.0;
    this.baseMagnetRadius = characterType === 'assassin' ? 155 : 130;
    this.magnetRadius = this.baseMagnetRadius;
    this.bonusProjectiles = 0;
    this.bonusAreaMult = 1.0;
    this.critChance = characterType === 'assassin' ? 0.20 : 0.05;
    this.critDamageMult = 2.0;
    this.expMult = 1.0;
    this.dropRateBonus = 0.0;
    this.ownedPassives = {};

    this.vampireChance = 0.0;
    this.maxShieldStacks = 0;
    this.currentShieldStacks = 0;
    this.shieldCooldown = 18.0;
    this.shieldTimer = 0.0;
    this.shieldAngle = 0.0;

    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;
    this.totalKills = 0;

    this.rerollCount = 3;
    this.maxRerolls = 3;

    this.vx = 0;
    this.vy = 0;
    this.facing = { x: 1, y: 0 };
    
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 0.8;
    this.isDead = false;

    this.gold = 0;
    this.goldMult = 1.0;
    this.hasRevive = false;
    this.reviveCount = 0;

    this.attackAnims = [];
    this.bobTimer = 0;
  }

  triggerAttackAnim(type, angle, duration = 0.16, extra = {}) {
    this.attackAnims.push({
      type,
      angle,
      startAngle: angle - 0.4,
      timer: duration,
      duration: duration,
      ...extra
    });
  }

  update(dt, input) {
    if (this.isDead) return;

    for (let i = this.attackAnims.length - 1; i >= 0; i--) {
      const anim = this.attackAnims[i];
      anim.timer -= dt;
      if (anim.timer <= 0) {
        this.attackAnims.splice(i, 1);
      }
    }

    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    let moveX = 0;
    let moveY = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

    if (input.joystick && input.joystick.active) {
      moveX = input.joystick.x;
      moveY = input.joystick.y;
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 0.05) {
      this.vx = (moveX / len) * this.speed;
      this.vy = (moveY / len) * this.speed;
      this.facing.x = moveX / len;
      this.facing.y = moveY / len;
      this.bobTimer += dt * 12;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.maxShieldStacks > 0 && this.currentShieldStacks < this.maxShieldStacks) {
      this.shieldTimer += dt;
      if (this.shieldTimer >= this.shieldCooldown) {
        this.shieldTimer = 0;
        this.currentShieldStacks += 1;
        if (window.game && window.game.damageNumbers) {
          window.game.damageNumbers.push(new DamageNumber(this.x, this.y - 25, '방벽 충전!', false));
        }
      }
    }
    this.shieldAngle += dt * 2.5;

    const bounds = (window.game && window.game.getWorldBoundaries) ? window.game.getWorldBoundaries() : { boundW: 1560, boundH: 1560 };
    const bW = (bounds.boundW || 1580) - 20;
    const bH = (bounds.boundH || 1580) - 20;
    this.x = Math.max(-bW, Math.min(bW, this.x));
    this.y = Math.max(-bH, Math.min(bH, this.y));
  }

  onKillEnemy(enemy) {
    this.totalKills += 1;
    if (this.vampireChance > 0 && Math.random() < this.vampireChance) {
      if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + 1);
        if (window.game && window.game.damageNumbers) {
          window.game.damageNumbers.push(new DamageNumber(this.x, this.y - 20, '+1 HP', false));
        }
      }
    }
  }

  takeDamage(amount) {
    if (this.isDead || this.invulnerableTimer > 0) return 0;

    if (this.currentShieldStacks > 0) {
      this.currentShieldStacks -= 1;
      this.invulnerableTimer = 0.6;
      this.shieldTimer = 0;
      sounds.playWeaponHit();
      if (window.game) {
        window.game.addParticles(this.x, this.y, '#38bdf8', 35);
        window.game.addParticles(this.x, this.y, '#fef08a', 20);
        if (window.game.damageNumbers) {
          window.game.damageNumbers.push(new DamageNumber(this.x, this.y - 28, '방벽 방어!', false));
        }
      }
      return 0;
    }

    const reductionRatio = Math.min(0.50, this.armor * 0.04);
    const reducedDamage = (amount - this.armor) * (1 - reductionRatio);
    const actualDamage = Math.max(1, Math.round(reducedDamage));
    this.hp -= actualDamage;
    this.invulnerableTimer = this.invulnerableDuration;

    sounds.playPlayerHurt();
    if (window.game && window.game.ui) {
      window.game.ui.triggerHaptic(35);
    }

    if (this.characterType === 'malakar' && window.game && window.game.enemies) {
      const darkRadius = 140;
      for (const e of window.game.enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= darkRadius + e.radius) {
          e.takeDamage(50, { x: (e.x - this.x) / (d || 1), y: (e.y - this.y) / (d || 1) }, 160);
        }
      }
      if (window.game) {
        window.game.addParticles(this.x, this.y, '#a855f7', 30);
      }
    }

    if (this.thornsPercent > 0 && window.game && window.game.enemies) {
      const thornsDmg = Math.max(1, Math.round(actualDamage * this.thornsPercent));
      const thornsRadius = 120;
      for (const e of window.game.enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= thornsRadius + e.radius) {
          e.takeDamage(thornsDmg, { x: (e.x - this.x) / (d || 1), y: (e.y - this.y) / (d || 1) }, 140);
        }
      }
      if (window.game) {
        window.game.addParticles(this.x, this.y, '#22c55e', 25);
      }
    }

    if (this.hp <= 0) {
      if (this.hasRevive && this.reviveCount > 0) {
        this.reviveCount -= 1;
        this.hp = Math.round(this.maxHp * 0.5);
        this.invulnerableTimer = 3.0;
        sounds.playVictory();
        if (window.game) {
          window.game.addParticles(this.x, this.y, '#f59e0b', 40);
          window.game.addParticles(this.x, this.y, '#ef4444', 30);
          if (window.game.damageNumbers) {
            window.game.damageNumbers.push(new DamageNumber(this.x, this.y - 30, '부활!', false));
          }
        }
      } else {
        this.hp = 0;
        this.isDead = true;
      }
    }

    return actualDamage;
  }

  applyPermanentUpgrades(upgrades = {}) {
    if (!upgrades) return;
    if (upgrades.atk) this.atkPowerMult += upgrades.atk * 0.04;
    if (upgrades.cooldown) this.globalCooldownMult *= (1 + upgrades.cooldown * 0.03);
    if (upgrades.area) this.bonusAreaMult += upgrades.area * 0.05;
    if (upgrades.hp) {
      this.maxHp += upgrades.hp * 15;
      this.hp = this.maxHp;
    }
    if (upgrades.speed) {
      const bonus = this.baseSpeed * (upgrades.speed * 0.03);
      this.baseSpeed += bonus;
      this.speed += bonus;
    }
    if (upgrades.regen) this.hpRegen += upgrades.regen * 0.3;
    if (upgrades.magnet) this.magnetRadius += upgrades.magnet * 20;
    if (upgrades.greed) this.goldMult += upgrades.greed * 0.10;
    if (upgrades.revive && upgrades.revive > 0) {
      this.hasRevive = true;
      this.reviveCount = (this.reviveCount || 0) + 1;
    }
  }

  checkIsAllUpgraded() {
    if (!window.game || !window.game.weaponManager) return false;
    const wm = window.game.weaponManager;
    const weapons = Object.values(wm.weapons || {});
    if (weapons.length < 6) return false;
    for (const w of weapons) {
      if (wm.getLevel(w) < 5) return false;
    }
    const passives = Object.values(this.ownedPassives || {});
    if (passives.length < 6) return false;
    for (const p of passives) {
      if (p.level < p.maxLevel) return false;
    }
    return true;
  }

  getNextMaxExp(level) {
    if (this.isFullyUpgraded || this.checkIsAllUpgraded()) {
      if (!this.isFullyUpgraded) {
        this.isFullyUpgraded = true;
        this.fullUpgradeLevel = level;
      }
      const extraLv = Math.max(0, level - this.fullUpgradeLevel);
      const baseAtFull = 2441 + Math.max(0, this.fullUpgradeLevel - 50) * 120;
      return Math.round(Math.max(2500, baseAtFull) + Math.pow(extraLv, 1.85) * 260);
    }

    if (level < 15) {
      return 15 + (level - 1) * 14;
    } else if (level < 30) {
      return 211 + (level - 15) * 42;
    } else if (level < 50) {
      return 841 + (level - 30) * 80;
    } else {
      return 2441 + (level - 50) * 120;
    }
  }

  gainExp(amount, onLevelUp) {
    if (this.isDead) return;

    const gained = Math.round(amount * (this.expMult || 1.0));
    this.exp += gained;
    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level += 1;
      this.maxExp = this.getNextMaxExp(this.level);
      sounds.playLevelUp();
      if (window.game && window.game.ui) {
        window.game.ui.triggerHaptic([30, 40, 30]);
      }
      if (onLevelUp) onLevelUp(this.level);
    }
  }

  draw(ctx) {
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      return;
    }

    const bobOffset = Math.sin(this.bobTimer) * 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 2, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const currentSprite = this.spriteKey || 'player';
    const drawn = assets.drawSprite(ctx, currentSprite, this.x, this.y + bobOffset - 2, 38, this.facing.x, false);

    if (!drawn) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#1e2235';
      ctx.beginPath();
      ctx.arc(0, bobOffset, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8290be';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    if (this.currentShieldStacks > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.shieldAngle);
      for (let i = 0; i < this.currentShieldStacks; i++) {
        const a = (i * Math.PI * 2) / Math.max(1, this.currentShieldStacks);
        const sx = Math.cos(a) * (this.radius + 12);
        const sy = Math.sin(a) * (this.radius + 12);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const anim of this.attackAnims) {
      const progress = Math.max(0, Math.min(1, 1 - (anim.timer / anim.duration)));
      const area = anim.area || 1.0;

      if (anim.type === 'sword') {
        // ⚔️ [철검]: 전통 서예 삼묵법(농묵·중묵·비백) 초승달 수묵 베기 모션 - 칼날 끝(Tip) 1:1 일치화
        const sweepArc = 2.1;
        const startAngle = anim.angle - sweepArc / 2;
        const curAngle = startAngle + progress * sweepArc;
        const size = Math.round(34 * area);
        const swordDist = (28 + Math.sin(progress * Math.PI) * 16) * area;
        
        // 칼날 끝(Tip)의 정확한 궤적 반경: 손잡이 위치 + 검신 길이의 60%
        const slashRadius = swordDist + size * 0.60;

        const px = this.x + Math.cos(curAngle) * swordDist;
        const py = this.y + Math.sin(curAngle) * swordDist;
        const img = assets.images['anim_sword'];

        ctx.save();

        // 1. [초승달 수묵 패스] - 외곽 농묵(濃墨)과 중묵(中墨)
        const tailArc = Math.min(curAngle - startAngle, 1.4);
        const tailStart = curAngle - tailArc;
        const crescentThickness = (10 + Math.sin(progress * Math.PI) * 6) * area;
        const outerR = slashRadius;
        const innerR = Math.max(8, slashRadius - crescentThickness);

        if (tailArc > 0.05) {
          // 외곽 농묵(濃墨) 바탕 초승달 면 채우기
          ctx.beginPath();
          ctx.arc(this.x, this.y, outerR, tailStart, curAngle, false);
          ctx.arc(this.x, this.y, innerR, curAngle, tailStart, true);
          ctx.closePath();
          ctx.fillStyle = 'rgba(12, 14, 20, 0.78)';
          ctx.fill();

          // 중묵(中墨) 먹선 덧칠
          ctx.strokeStyle = '#05070a';
          ctx.lineWidth = Math.max(1.5, Math.round(3.5 * Math.sqrt(area)));
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // 은은한 먹빛/담묵 잔향
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = Math.max(1, 1.2 * Math.sqrt(area));
          ctx.beginPath();
          ctx.arc(this.x, this.y, (outerR + innerR) * 0.5 - 1.5, tailStart, curAngle, false);
          ctx.stroke();
        }

        // 2. [칼날 비백(飛白) 림] - 칼날 끝(Tip)을 따라 번뜩이는 은백색 칼날 예기
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, Math.round(3.2 * Math.sqrt(area) * (1 - progress * 0.25)));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, slashRadius, tailStart, curAngle, false);
        ctx.stroke();

        ctx.restore();

        // 3. 칼날 스프라이트 회전 렌더링
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(curAngle + Math.PI / 4 + 0.35);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      } else if (anim.type === 'dagger') {
        const thrustDist = (16 + Math.sin(progress * Math.PI) * 30) * area;
        const px = this.x + Math.cos(anim.angle) * thrustDist;
        const py = this.y + Math.sin(anim.angle) * thrustDist;
        const img = assets.images['anim_dagger'];
        const size = Math.round(26 * area);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(anim.angle + Math.PI / 4);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      } else if (anim.type === 'thunderBlade') {
        const sweepArc = anim.arc || (Math.PI / 2);
        const startAngle = anim.angle - sweepArc / 2;
        const curAngle = startAngle + progress * sweepArc;
        const size = Math.round(38 * area);
        const swordDist = (28 + Math.sin(progress * Math.PI) * 18) * area;
        const slashRadius = swordDist + size * 0.60;
        const px = this.x + Math.cos(curAngle) * swordDist;
        const py = this.y + Math.sin(curAngle) * swordDist;

        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = Math.round(4 * Math.sqrt(area));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, slashRadius, startAngle, curAngle, false);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, Math.round(1.8 * Math.sqrt(area)));
        ctx.beginPath();
        ctx.arc(this.x, this.y, slashRadius - 3 * area, startAngle, curAngle, false);
        ctx.stroke();

        const img = assets.images['anim_sword'];
        ctx.translate(px, py);
        ctx.rotate(curAngle + Math.PI / 4);
        ctx.imageSmoothingEnabled = false;
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-size / 2, -size / 2, size, size);
        }
        ctx.restore();
      } else if (anim.type === 'axe') {
        const orbitAngle = anim.startAngle + progress * Math.PI * 2.2;
        const orbitDist = 44 * area;
        const size = Math.round(36 * area);
        const px = this.x + Math.cos(orbitAngle) * orbitDist;
        const py = this.y + Math.sin(orbitAngle) * orbitDist;
        const img = assets.images['anim_axe'];

        // 🪓 도끼날 끝단(Tip)을 따르는 수묵 회전 바람 궤적
        const tipDist = orbitDist + size * 0.55;
        const tailArc = Math.min(progress * Math.PI * 2, 1.25);
        const tailStart = orbitAngle - tailArc;
        if (tailArc > 0.05) {
          ctx.save();
          ctx.strokeStyle = anim.color || 'rgba(12, 14, 20, 0.75)';
          ctx.lineWidth = Math.max(2, Math.round(4.5 * Math.sqrt(area)));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(this.x, this.y, tipDist, tailStart, orbitAngle, false);
          ctx.stroke();

          // 날카로운 은백색/주홍 비백 림
          ctx.strokeStyle = anim.color === '#f97316' ? '#fdba74' : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = Math.max(1, Math.round(2 * Math.sqrt(area)));
          ctx.beginPath();
          ctx.arc(this.x, this.y, tipDist, tailStart, orbitAngle, false);
          ctx.stroke();
          ctx.restore();
        }

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(orbitAngle + Math.PI / 2);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      } else if (anim.type === 'whip' || anim.type === 'morningstar' || anim.type === 'morningstartempest') {
        const isTempest = anim.type === 'morningstartempest';
        const sweepArc = anim.arc || (isTempest ? 2.35 : 1.95);
        const maxRange = anim.range || ((isTempest ? 260 : 165) * area);

        const sweepAngle = (anim.angle - sweepArc / 2) + progress * sweepArc;
        const currentDist = (36 + Math.sin(progress * Math.PI) * (maxRange - 42));

        const px = this.x + Math.cos(sweepAngle) * currentDist;
        const py = this.y + Math.sin(sweepAngle) * currentDist;

        ctx.save();
        ctx.strokeStyle = isTempest ? 'rgba(251, 191, 36, 0.90)' : 'rgba(203, 213, 225, 0.85)';
        ctx.lineWidth = Math.round((isTempest ? 5 : 3.5) * Math.sqrt(area));
        ctx.lineCap = 'round';
        ctx.beginPath();
        const midAngle = sweepAngle - 0.20;
        const midDist = currentDist * 0.55;
        const cx = this.x + Math.cos(midAngle) * midDist;
        const cy = this.y + Math.sin(midAngle) * midDist;
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(cx, cy, px, py);
        ctx.stroke();

        ctx.strokeStyle = isTempest ? '#fef08a' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(cx, cy, px, py);
        ctx.stroke();
        ctx.setLineDash([]);

        const img = assets.images['anim_whip'];
        const sz = Math.round((isTempest ? 44 : 34) * area);
        ctx.translate(px, py);
        ctx.rotate(sweepAngle + progress * Math.PI * 4);
        ctx.imageSmoothingEnabled = false;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(0, 0, sz * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      } else if (anim.type === 'muzzle') {
        const muzzleDist = 24 * area;
        const px = this.x + Math.cos(anim.angle) * muzzleDist;
        const py = this.y + Math.sin(anim.angle) * muzzleDist;
        const img = assets.images['anim_muzzle'];
        const size = Math.round(28 * area);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(anim.angle);
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, anim.timer / anim.duration);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }
    }
  }
}
