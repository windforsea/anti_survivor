// 11종 특수 기믹 보스 AI, 넉백 면역 및 전방위 보스 탄막 패턴 시스템

class BossEnemy extends Enemy {
  constructor(bossStage, x, y) {
    super('golem', x, y, 1.0);
    this.isBoss = true;
    this.bossStage = bossStage;
    // 공중 부유/비행형 보스는 장애물 무시 관통
    this.isFlying = (bossStage === 4 || bossStage === 6 || bossStage === 12 || bossStage === 15 || bossStage === 18 || bossStage === 20 || bossStage === 25 || bossStage === 99 || bossStage === 205 || bossStage === 215 || bossStage === 220);

    // 보스별 특화 설정
    if (bossStage === 2) {
      this.name = '돌진 맹수 (Dire Boar)';
      this.maxHp = 1600;
      this.hp = this.maxHp;
      this.radius = 28;
      this.color = '#b45309';
      this.speed = 100;
      this.damage = 32;
      this.exp = 150;
      
      this.chargeCooldown = 2.0;
      this.chargeTimer = 1.0;
      this.isCharging = false;
      this.isAiming = false;
      this.aimTimer = 0;
      this.chargeDir = { x: 1, y: 0 };
    } else if (bossStage === 4) {
      this.name = '그림자 마법사 (Void Sorcerer)';
      this.maxHp = 3400;
      this.hp = this.maxHp;
      this.radius = 26;
      this.color = '#7e22ce';
      this.speed = 80;
      this.damage = 38;
      this.exp = 250;

      this.teleportCooldown = 2.25;
      this.teleportTimer = 2.0;
    } else if (bossStage === 6) {
      this.name = '혼돈의 눈 (Chaos Eye)';
      this.maxHp = 5800;
      this.hp = this.maxHp;
      this.radius = 32;
      this.color = '#e11d48';
      this.speed = 60;
      this.damage = 42;
      this.exp = 400;

      this.bulletSpiralAngle = 0;
      this.bulletTimer = 0;
    } else if (bossStage === 8) {
      this.name = '불멸의 골렘 (Ironclad Colossus)';
      this.maxHp = 9800;
      this.hp = this.maxHp;
      this.radius = 36;
      this.color = '#475569';
      this.speed = 70;
      this.damage = 52;
      this.exp = 600;
      this.knockbackImmune = true;

      this.stompTimer = 2.0;
    } else if (bossStage === 10) {
      this.name = '파멸의 군주 (Lord of Doom)';
      this.maxHp = 18000;
      this.hp = this.maxHp;
      this.radius = 42;
      this.color = '#991b1b';
      this.speed = 110;
      this.damage = 60;
      this.exp = 1000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 2.5;
      this.chargeTimer = 2.0;
    } else if (bossStage === 12) {
      this.name = '심연의 리치 (Abyss Lich)';
      this.maxHp = 26000;
      this.hp = this.maxHp;
      this.radius = 38;
      this.color = '#38bdf8';
      this.speed = 95;
      this.damage = 68;
      this.exp = 1600;
      this.knockbackImmune = true;

      this.teleportCooldown = 2.0;
      this.teleportTimer = 1.8;
      this.frostNovaTimer = 0.9;
    } else if (bossStage === 15) {
      this.name = '종말의 사신 (Grim Reaper)';
      this.maxHp = 52000;
      this.hp = this.maxHp;
      this.radius = 44;
      this.color = '#18181b';
      this.speed = 135;
      this.damage = 88;
      this.exp = 3500;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 2.25;
      this.scytheChargeTimer = 2.0;
      this.isCharging = false;
      this.chargeDuration = 0;
      this.chargeDir = { x: 1, y: 0 };
    } else if (bossStage === 18) {
      this.name = '공허의 지네 (Void Wyrm)';
      this.maxHp = 48000;
      this.hp = this.maxHp;
      this.radius = 46;
      this.color = '#a855f7';
      this.speed = 145;
      this.damage = 95;
      this.exp = 5000;
      this.knockbackImmune = true;

      this.wyrmZigTimer = 0;
      this.wyrmSpitTimer = 0.95;
    } else if (bossStage === 20) {
      this.name = '혼돈의 절대신 (Chaos Overlord)';
      this.maxHp = 68000;
      this.hp = this.maxHp;
      this.radius = 52;
      this.color = '#e11d48';
      this.speed = 125;
      this.damage = 100;
      this.exp = 10000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 1.9;
      this.beamTimer = 1.2;
    } else if (bossStage === 25) {
      this.name = '심연의 군주 (Abyss Sovereign)';
      this.maxHp = 88000;
      this.hp = this.maxHp;
      this.radius = 54;
      this.color = '#4c1d95';
      this.speed = 130;
      this.damage = 110;
      this.exp = 15000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.sovereignWaveTimer = 1.5;
      this.sovereignWarpTimer = 2.2;
    } else if (bossStage === 99) {
      this.name = '진 붉은 사신 (The Red Death)';
      this.maxHp = 666666;
      this.hp = this.maxHp;
      this.radius = 48;
      this.color = '#ef4444';
      this.speed = 360;
      this.damage = 99999;
      this.exp = 66666;
      this.knockbackImmune = true;
      this.isFlying = true;
      this.isRedReaper = true;

      this.scytheTimer = 0.4;
    } else if (bossStage === 205) {
      this.name = '심해 대왕 문어 (Kraken)';
      this.maxHp = 4200;
      this.hp = this.maxHp;
      this.radius = 34;
      this.color = '#0e7490';
      this.speed = 105;
      this.damage = 36;
      this.exp = 450;
      this.knockbackImmune = false;
      this.isFlying = true;

      this.whipTimer = 1.8;
      this.inkTimer = 3.2;
    } else if (bossStage === 210) {
      this.name = '강철 집게 타이탄 크랩 (Titan Crab)';
      this.maxHp = 16000;
      this.hp = this.maxHp;
      this.radius = 38;
      this.color = '#f97316';
      this.speed = 75;
      this.damage = 55;
      this.exp = 1100;
      this.knockbackImmune = true;

      this.slamTimer = 2.2;
      this.bubbleTimer = 1.4;
    } else if (bossStage === 215) {
      this.name = '심해의 지배자 레비아탄 (Leviathan)';
      this.maxHp = 38000;
      this.hp = this.maxHp;
      this.radius = 42;
      this.color = '#0284c7';
      this.speed = 135;
      this.damage = 75;
      this.exp = 3200;
      this.knockbackImmune = true;
      this.isFlying = true;

      this.dashTimer = 2.5;
      this.isDashing = false;
      this.dashDuration = 0;
      this.dashDir = { x: 1, y: 0 };
      this.whirlpoolTimer = 3.0;
    } else if (bossStage === 220) {
      this.name = '심연의 고대신 다곤 (Dagon)';
      this.maxHp = 78000;
      this.hp = this.maxHp;
      this.radius = 48;
      this.color = '#0f766e';
      this.speed = 120;
      this.damage = 95;
      this.exp = 6500;
      this.knockbackImmune = true;
      this.isFlying = true;

      this.tridentTimer = 1.2;
      this.waveTimer = 2.8;
      this.abyssOrbTimer = 4.2;
    }
  }

  takeDamage(amount, knockbackDir, knockbackForce, isCrit = null) {
    if (this.isDead) return;

    if (isCrit === null && window.game && window.game.player) {
      isCrit = Math.random() < (window.game.player.critChance || 0.05);
      if (isCrit) {
        amount = Math.round(amount * (window.game.player.critDamageMult || 2.0));
      }
    }

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (isCrit && window.game && window.game.damageNumbers) {
      const isSuperCrit = !!(window.game.player && window.game.player.ownedPassives && window.game.player.ownedPassives['stat_crit_dmg']);
      window.game.damageNumbers.push(new DamageNumber(this.x, this.y, amount, true, isSuperCrit));
    }

    if (!this.knockbackImmune && knockbackDir && knockbackForce > 0) {
      this.kbX += knockbackDir.x * (knockbackForce * 0.25);
      this.kbY += knockbackDir.y * (knockbackForce * 0.25);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  update(dt, player, allEnemies, bossProjectiles) {
    if (this.isDead) return;

    this.animTimer += dt * 6;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    this.kbX *= Math.max(0, 1 - dt * 10);
    this.kbY *= Math.max(0, 1 - dt * 10);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.bossStage === 2) {
      this.chargeTimer -= dt;

      if (this.isAiming) {
        this.aimTimer -= dt;
        if (this.aimTimer <= 0) {
          this.isAiming = false;
          this.isCharging = true;
          this.chargeDuration = 0.6;
          sounds.playBossCharge();
        }
      } else if (this.isCharging) {
        this.chargeDuration -= dt;
        this.vx = this.chargeDir.x * 520;
        this.vy = this.chargeDir.y * 520;
        if (this.chargeDuration <= 0) {
          this.isCharging = false;
          this.chargeTimer = this.chargeCooldown;
        }
      } else {
        if (this.chargeTimer <= 0) {
          this.isAiming = true;
          this.aimTimer = 0.5;
          const len = Math.hypot(dx, dy) || 1;
          this.chargeDir = { x: dx / len, y: dy / len };
          this.vx = 0;
          this.vy = 0;
        } else {
          if (dist > 0.1) {
            this.vx = (dx / dist) * this.speed + this.kbX;
            this.vy = (dy / dist) * this.speed + this.kbY;
          }
        }
      }
    } else if (this.bossStage === 4) {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.teleportTimer = this.teleportCooldown;
        sounds.playBossTeleport();

        const angle = Math.random() * Math.PI * 2;
        const tpDist = 180 + Math.random() * 80;
        this.x = player.x + Math.cos(angle) * tpDist;
        this.y = player.y + Math.sin(angle) * tpDist;

        for (let i = 0; i < 8; i++) {
          const bAngle = (i / 8) * Math.PI * 2;
          const bSpd = 260;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(bAngle) * bSpd, Math.sin(bAngle) * bSpd,
            8, '#c084fc', 20
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed + this.kbX;
        this.vy = (dy / dist) * this.speed + this.kbY;
      }
    } else if (this.bossStage === 6) {
      this.bulletTimer -= dt;
      if (this.bulletTimer <= 0) {
        this.bulletTimer = 0.11;
        this.bulletSpiralAngle += 0.35;
        for (let s = 0; s < 3; s++) {
          const curAngle = this.bulletSpiralAngle + (s * (Math.PI * 2 / 3));
          const bSpd = 220;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(curAngle) * bSpd, Math.sin(curAngle) * bSpd,
            7, '#fb7185', 18
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed + this.kbX;
        this.vy = (dy / dist) * this.speed + this.kbY;
      }
    } else if (this.bossStage === 8) {
      this.stompTimer -= dt;
      if (this.stompTimer <= 0) {
        this.stompTimer = 2.0;
        sounds.playBossStomp();
        for (let i = 0; i < 16; i++) {
          const sAngle = (i / 16) * Math.PI * 2;
          const sSpd = 200;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(sAngle) * sSpd, Math.sin(sAngle) * sSpd,
            9, '#f59e0b', 28
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 10) {
      this.phaseTimer += dt;
      this.teleportTimer -= dt;

      if (Math.floor(this.phaseTimer * 8) % 2 === 0 && Math.random() < 0.35) {
        const bAngle = this.phaseTimer * 2.8;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(bAngle) * 280, Math.sin(bAngle) * 280,
          9, '#ef4444', 26
        ));
      }

      if (this.teleportTimer <= 0) {
        this.teleportTimer = 2.5;
        sounds.playBossTeleport();
        const angle = Math.random() * Math.PI * 2;
        this.x = player.x + Math.cos(angle) * 220;
        this.y = player.y + Math.sin(angle) * 220;

        for (let i = 0; i < 12; i++) {
          const novaAngle = (i / 12) * Math.PI * 2;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(novaAngle) * 300, Math.sin(novaAngle) * 300,
            8, '#dc2626', 28
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 12) {
      this.teleportTimer -= dt;
      this.frostNovaTimer -= dt;

      if (this.frostNovaTimer <= 0) {
        this.frostNovaTimer = 0.9;
        const baseAngle = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) {
          const shotAngle = baseAngle + (i * 0.28);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(shotAngle) * 260, Math.sin(shotAngle) * 260,
            8, '#38bdf8', 30
          ));
        }
      }

      if (this.teleportTimer <= 0) {
        this.teleportTimer = this.teleportCooldown;
        sounds.playBossTeleport();
        const angle = Math.random() * Math.PI * 2;
        this.x = player.x + Math.cos(angle) * 210;
        this.y = player.y + Math.sin(angle) * 210;

        for (let i = 0; i < 10; i++) {
          const novaAngle = (i / 10) * Math.PI * 2;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(novaAngle) * 280, Math.sin(novaAngle) * 280,
            9, '#0284c7', 34
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 15) {
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.scytheChargeTimer -= dt;

      if (Math.floor(this.phaseTimer * 10) % 2 === 0 && Math.random() < 0.45) {
        const spiralBase = this.phaseTimer * 3.5;
        for (let s = 0; s < 4; s++) {
          const sAngle = spiralBase + (s * Math.PI / 2);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(sAngle) * 290, Math.sin(sAngle) * 290,
            9, '#7c3aed', 36
          ));
        }
      }

      if (this.isCharging) {
        this.chargeDuration -= dt;
        this.vx = this.chargeDir.x * 460;
        this.vy = this.chargeDir.y * 460;
        if (this.chargeDuration <= 0) {
          this.isCharging = false;
        }
      } else {
        if (this.scytheChargeTimer <= 0) {
          this.scytheChargeTimer = 2.0;
          sounds.playBossCharge();
          this.isCharging = true;
          this.chargeDuration = 0.65;
          if (dist > 0.1) {
            this.chargeDir = { x: dx / dist, y: dy / dist };
          }
        }

        if (this.teleportTimer <= 0) {
          this.teleportTimer = 2.25;
          sounds.playBossTeleport();
          const angle = Math.random() * Math.PI * 2;
          this.x = player.x + Math.cos(angle) * 190;
          this.y = player.y + Math.sin(angle) * 190;

          for (let i = 0; i < 14; i++) {
            const novaAngle = (i / 14) * Math.PI * 2;
            bossProjectiles.push(new BossProjectile(
              this.x, this.y,
              Math.cos(novaAngle) * 320, Math.sin(novaAngle) * 320,
              9, '#dc2626', 42
            ));
          }
        }

        if (!this.isCharging && dist > 0.1) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed;
        }
      }
    } else if (this.bossStage === 18) {
      this.wyrmZigTimer += dt * 4.0;
      this.wyrmSpitTimer -= dt;

      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const wave = Math.sin(this.wyrmZigTimer) * 120;
      const targetAngle = Math.atan2(dy, dx);
      this.vx = Math.cos(targetAngle) * this.speed + Math.cos(perpAngle) * wave;
      this.vy = Math.sin(targetAngle) * this.speed + Math.sin(perpAngle) * wave;

      if (this.wyrmSpitTimer <= 0) {
        this.wyrmSpitTimer = 0.95;
        sounds.playBossCharge();
        const baseA = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const shotA = baseA + (i * 0.22);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(shotA) * 280, Math.sin(shotA) * 280,
            9, '#a855f7', 38
          ));
        }
      }
    } else if (this.bossStage === 20) {
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.beamTimer -= dt;

      if (Math.floor(this.phaseTimer * 10) % 2 === 0 && Math.random() < 0.5) {
        const spiralBase = this.phaseTimer * 3.8;
        for (let s = 0; s < 4; s++) {
          const sAngle = spiralBase + (s * Math.PI / 2);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(sAngle) * 310, Math.sin(sAngle) * 310,
            10, '#f43f5e', 45
          ));
        }
      }

      if (this.beamTimer <= 0) {
        this.beamTimer = 1.2;
        const beamAngle = Math.atan2(dy, dx);
        for (let b = 0; b < 3; b++) {
          setTimeout(() => {
            if (!this.isDead) {
              bossProjectiles.push(new BossProjectile(
                this.x, this.y,
                Math.cos(beamAngle) * 380, Math.sin(beamAngle) * 380,
                11, '#fde047', 50
              ));
            }
          }, b * 110);
        }
      }

      if (this.teleportTimer <= 0) {
        this.teleportTimer = 1.9;
        sounds.playBossTeleport();
        const a = Math.random() * Math.PI * 2;
        this.x = player.x + Math.cos(a) * 220;
        this.y = player.y + Math.sin(a) * 220;

        for (let i = 0; i < 16; i++) {
          const burstA = (i / 16) * Math.PI * 2;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(burstA) * 340, Math.sin(burstA) * 340,
            10, '#e11d48', 48
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 25) {
      this.phaseTimer += dt;
      this.sovereignWaveTimer -= dt;
      this.sovereignWarpTimer -= dt;

      if (Math.floor(this.phaseTimer * 8) % 2 === 0 && Math.random() < 0.45) {
        const sAngle = this.phaseTimer * 3.2;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(sAngle) * 320, Math.sin(sAngle) * 320,
          10, '#a855f7', 48
        ));
      }

      if (this.sovereignWaveTimer <= 0) {
        this.sovereignWaveTimer = 1.2;
        sounds.playBossCharge();
        const baseA = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const shotA = baseA + (i * 0.20);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(shotA) * 330, Math.sin(shotA) * 330,
            11, '#6366f1', 52
          ));
        }
      }

      if (this.sovereignWarpTimer <= 0) {
        this.sovereignWarpTimer = 2.0;
        sounds.playBossTeleport();
        const a = Math.random() * Math.PI * 2;
        this.x = player.x + Math.cos(a) * 230;
        this.y = player.y + Math.sin(a) * 230;

        for (let i = 0; i < 18; i++) {
          const burstA = (i / 18) * Math.PI * 2;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(burstA) * 350, Math.sin(burstA) * 350,
            11, '#4c1d95', 55
          ));
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 205) {
      this.whipTimer -= dt;
      this.inkTimer -= dt;

      if (this.whipTimer <= 0) {
        this.whipTimer = 1.8;
        if (bossProjectiles && dist < 700) {
          const baseAngle = Math.atan2(dy, dx);
          const spread = [-0.25, 0, 0.25];
          for (const s of spread) {
            const angle = baseAngle + s;
            const spd = 260;
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(angle) * spd, Math.sin(angle) * spd, 7, '#06b6d4', 22));
          }
          sounds.playMagic();
        }
      }

      if (this.inkTimer <= 0) {
        this.inkTimer = 3.5;
        if (bossProjectiles) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(a) * 180, Math.sin(a) * 180, 8, '#0f172a', 26));
          }
          sounds.playShotgun();
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 210) {
      this.slamTimer -= dt;
      this.bubbleTimer -= dt;

      if (this.slamTimer <= 0) {
        this.slamTimer = 2.4;
        sounds.playBossStomp();
        if (window.game) {
          window.game.addParticles(this.x, this.y, '#f97316', 20);
        }
        if (bossProjectiles) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(a) * 210, Math.sin(a) * 210, 8, '#fdba74', 28));
          }
        }
        if (dist < 140) {
          player.speed = player.baseSpeed * 0.55;
          setTimeout(() => { if (player) player.speed = player.baseSpeed; }, 1400);
        }
      }

      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = 1.5;
        if (bossProjectiles && dist < 650) {
          const spd = 200;
          bossProjectiles.push(new BossProjectile(this.x, this.y, (dx / (dist || 1)) * spd, (dy / (dist || 1)) * spd, 7, '#38bdf8', 20));
          sounds.playMagic();
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 215) {
      this.dashTimer -= dt;
      this.whirlpoolTimer -= dt;

      if (this.isDashing) {
        this.dashDuration -= dt;
        this.vx = this.dashDir.x * 540;
        this.vy = this.dashDir.y * 540;
        if (window.game && Math.random() < 0.6) {
          window.game.addParticles(this.x, this.y, '#0284c7', 3);
        }
        if (this.dashDuration <= 0) {
          this.isDashing = false;
          this.dashTimer = 2.4;
        }
      } else if (this.dashTimer <= 0) {
        this.isDashing = true;
        this.dashDuration = 0.55;
        const len = Math.hypot(dx, dy) || 1;
        this.dashDir = { x: dx / len, y: dy / len };
        sounds.playBossCharge();
      } else {
        if (dist > 0.1) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed;
        }
      }

      if (this.whirlpoolTimer <= 0) {
        this.whirlpoolTimer = 3.0;
        if (bossProjectiles) {
          const count = 12;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + this.animTimer;
            const spd = 230;
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(angle) * spd, Math.sin(angle) * spd, 7, '#0ea5e9', 30));
          }
          sounds.playMagic();
        }
      }
    } else if (this.bossStage === 220) {
      this.tridentTimer -= dt;
      this.waveTimer -= dt;
      this.abyssOrbTimer -= dt;

      if (this.tridentTimer <= 0) {
        this.tridentTimer = 1.3;
        if (bossProjectiles && dist < 850) {
          const baseAngle = Math.atan2(dy, dx);
          const spread = [-0.2, 0, 0.2];
          for (const s of spread) {
            const a = baseAngle + s;
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(a) * 340, Math.sin(a) * 340, 7, '#2dd4bf', 34));
          }
          sounds.playLaser();
        }
      }

      if (this.waveTimer <= 0) {
        this.waveTimer = 2.8;
        if (bossProjectiles) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
            bossProjectiles.push(new BossProjectile(this.x, this.y, Math.cos(a) * 220, Math.sin(a) * 220, 8, '#06b6d4', 38));
          }
          sounds.playShotgun();
        }
      }

      if (this.abyssOrbTimer <= 0) {
        this.abyssOrbTimer = 4.2;
        if (bossProjectiles && dist > 10) {
          const spd = 160;
          bossProjectiles.push(new BossProjectile(this.x, this.y, (dx / dist) * spd, (dy / dist) * spd, 14, '#134e4a', 50));
          sounds.playMagic();
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 99) {
      this.scytheTimer = (this.scytheTimer || 0.8) - dt;
      if (this.scytheTimer <= 0) {
        this.scytheTimer = 1.0;
        if (typeof sounds !== 'undefined' && sounds.playBossCharge) {
          sounds.playBossCharge();
        }
        if (window.game && window.game.addParticles) {
          window.game.addParticles(this.x, this.y, '#ef4444', 12);
        }
      }

      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.checkOffscreenRespawn(dt, player);

    if (dist < player.radius + this.radius) {
      player.takeDamage(this.damage);
    }
  }

  draw(ctx) {
    if (this.isAiming) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.chargeDir.x * 600, this.y + this.chargeDir.y * 600);
      ctx.stroke();
      ctx.restore();
    }

    const bossKeyMap = {
      2: 'boss_boar',
      4: 'boss_void',
      6: 'boss_eye',
      8: 'boss_colossus',
      10: 'boss_doom',
      12: 'boss_lich',
      15: 'boss_reaper',
      18: 'boss_wyrm',
      20: 'boss_overlord',
      25: 'boss_overlord',
      99: 'boss_reaper',
      205: 'boss_kraken',
      210: 'boss_titancrab',
      215: 'boss_leviathan',
      220: 'boss_dagon'
    };
    const bossKey = bossKeyMap[this.bossStage] || 'boss_reaper';
    const isHit = this.hitFlashTimer > 0;
    const facingX = (this.vx && Math.abs(this.vx) > 5) ? (this.vx < 0 ? -1 : 1) : 1;
    const spriteSize = Math.max(50, this.radius * 2.5);

    // 보스 그림자
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 2, this.radius * 0.95, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 보스 발밑 마법진 오라
    if (this.bossStage === 99) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = this.knockbackImmune ? 'rgba(245, 158, 11, 0.4)' : 'rgba(225, 29, 72, 0.4)';
      ctx.lineWidth = 2;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 다크 판타지 보스 수묵화 스프라이트 렌더링
    const drawn = assets.drawSprite(ctx, bossKey, this.x, this.y, spriteSize, facingX, isHit);

    if (!drawn) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = isHit ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.knockbackImmune ? '#f59e0b' : '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // 보스 머리 위 체력바 (불필요한 왕관 표식 완전 제거)
    const barW = this.radius * 2.4;
    const barH = 6;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-barW / 2, -this.radius - 14, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barW / 2, -this.radius - 14, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -this.radius - 14, barW, barH);

    ctx.restore();
  }
}
