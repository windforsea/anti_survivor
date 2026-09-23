// 11종 특수 기믹 보스 AI, 넉백 면역 및 전방위 보스 탄막 패턴 시스템

class BossEnemy extends Enemy {
  constructor(bossStage, x, y) {
    super('golem', x, y, 1.0);
    this.isBoss = true;
    this.bossStage = bossStage;
    // 공중 부유/비행형 보스는 장애물 무시 관통 (4: 그림자 마법사, 6: 혼돈의 눈, 12: 심연의 리치, 15: 종말의 사신, 18: 공허의 지네, 20: 혼돈의 절대신, 25: 심연의 군주, 99: 진 붉은 사신)
    this.isFlying = (bossStage === 4 || bossStage === 6 || bossStage === 12 || bossStage === 15 || bossStage === 18 || bossStage === 20 || bossStage === 25 || bossStage === 99);

    // 보스별 특화 설정
    if (bossStage === 2) {
      // 2스테이지 보스: 순간가속형 돌진 맹수 (Dire Boar)
      this.name = '돌진 맹수 (Dire Boar)';
      this.maxHp = 1600;
      this.hp = this.maxHp;
      this.radius = 28;
      this.color = '#b45309'; // 맹수 주황
      this.speed = 100;
      this.damage = 32;
      this.exp = 150;
      
      this.chargeCooldown = 2.0; // 4.0 -> 2.0 (기믹 2배 가속)
      this.chargeTimer = 1.0;
      this.isCharging = false;
      this.isAiming = false;
      this.aimTimer = 0;
      this.chargeDir = { x: 1, y: 0 };
    } else if (bossStage === 4) {
      // 4스테이지 보스: 순간이동형 그림자 마법사 (Void Sorcerer)
      this.name = '그림자 마법사 (Void Sorcerer)';
      this.maxHp = 3400;
      this.hp = this.maxHp;
      this.radius = 26;
      this.color = '#7e22ce'; // 보라빛
      this.speed = 80;
      this.damage = 38;
      this.exp = 250;

      this.teleportCooldown = 2.25; // 4.5 -> 2.25 (기믹 2배 가속)
      this.teleportTimer = 2.0;
    } else if (bossStage === 6) {
      // 6스테이지 보스: 탄막형 베홀더 (Chaos Eye)
      this.name = '혼돈의 눈 (Chaos Eye)';
      this.maxHp = 5800;
      this.hp = this.maxHp;
      this.radius = 32;
      this.color = '#e11d48'; // 피빛 레드
      this.speed = 60;
      this.damage = 42;
      this.exp = 400;

      this.bulletSpiralAngle = 0;
      this.bulletTimer = 0;
    } else if (bossStage === 8) {
      // 8스테이지 보스: 넉백면역형 불멸의 골렘 (Ironclad Colossus)
      this.name = '불멸의 골렘 (Ironclad Colossus)';
      this.maxHp = 9800;
      this.hp = this.maxHp;
      this.radius = 36;
      this.color = '#475569'; // 짙은 강철색
      this.speed = 70;
      this.damage = 52;
      this.exp = 600;
      this.knockbackImmune = true; // 100% 넉백 무시!

      this.stompTimer = 2.0; // 4.5 -> 2.0 (기믹 2배 가속)
    } else if (bossStage === 10) {
      // 10스테이지 최종 보스: 파멸의 군주 (Lord of Doom)
      this.name = '파멸의 군주 (Lord of Doom)';
      this.maxHp = 18000;
      this.hp = this.maxHp;
      this.radius = 42;
      this.color = '#991b1b'; // 심홍색
      this.speed = 110;
      this.damage = 60;
      this.exp = 1000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 2.5; // 5.0 -> 2.5 (기믹 2배 가속)
      this.chargeTimer = 2.0;
    } else if (bossStage === 12) {
      // 12스테이지 보스: 심연의 리치 (Abyss Lich)
      this.name = '심연의 리치 (Abyss Lich)';
      this.maxHp = 26000;
      this.hp = this.maxHp;
      this.radius = 38;
      this.color = '#38bdf8'; // 혹한의 영혼불빛
      this.speed = 95;
      this.damage = 68;
      this.exp = 1600;
      this.knockbackImmune = true;

      this.teleportCooldown = 2.0; // 4.0 -> 2.0 (기믹 2배 가속)
      this.teleportTimer = 1.8;
      this.frostNovaTimer = 0.9;  // 2.0 -> 0.9 (기믹 2배 가속)
    } else if (bossStage === 15) {
      // 15스테이지 종말의 보스: 종말의 사신 (Grim Reaper)
      this.name = '종말의 사신 (Grim Reaper)';
      this.maxHp = 52000;
      this.hp = this.maxHp;
      this.radius = 44;
      this.color = '#18181b'; // 심연의 칠흑빛
      this.speed = 135;
      this.damage = 88;
      this.exp = 3500;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 2.25; // 4.5 -> 2.25 (기믹 2배 가속)
      this.scytheChargeTimer = 2.0; // 4.0 -> 2.0
      this.isCharging = false;
      this.chargeDuration = 0;
      this.chargeDir = { x: 1, y: 0 };
    } else if (bossStage === 18) {
      // 18스테이지 보스: 공허의 지네 (Void Wyrm)
      this.name = '공허의 지네 (Void Wyrm)';
      this.maxHp = 75000;
      this.hp = this.maxHp;
      this.radius = 46;
      this.color = '#a855f7'; // 아케인 퍼플
      this.speed = 145;
      this.damage = 95;
      this.exp = 5000;
      this.knockbackImmune = true;

      this.wyrmZigTimer = 0;
      this.wyrmSpitTimer = 0.95; // 1.9 -> 0.95 (기믹 2배 가속)
    } else if (bossStage === 20) {
      // 20스테이지 진 보스: 혼돈의 절대신 (Chaos Overlord)
      this.name = '혼돈의 절대신 (Chaos Overlord)';
      this.maxHp = 68000;
      this.hp = this.maxHp;
      this.radius = 52;
      this.color = '#e11d48'; // 절대 크림슨
      this.speed = 125;
      this.damage = 120;
      this.exp = 10000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 1.9; // 3.8 -> 1.9 (기믹 2배 가속)
      this.beamTimer = 1.2;     // 2.4 -> 1.2 (기믹 2배 가속)
    } else if (bossStage === 25) {
      // 25스테이지 진 최종 보스: 심연의 군주 (Abyss Sovereign)
      this.name = '심연의 군주 (Abyss Sovereign)';
      this.maxHp = 95000;
      this.hp = this.maxHp;
      this.radius = 54;
      this.color = '#4c1d95'; // 깊은 심연 보라
      this.speed = 130;
      this.damage = 135;
      this.exp = 15000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.sovereignWaveTimer = 1.5;
      this.sovereignWarpTimer = 2.2;
    } else if (bossStage === 99) {
      // 엔드게임 특수 보스: 진 붉은 사신 (The Red Death)
      this.name = '진 붉은 사신 (The Red Death)';
      this.maxHp = 666666;
      this.hp = this.maxHp;
      this.radius = 48;
      this.color = '#ef4444'; // 핏빛 진홍색
      this.speed = 360;       // 압도적인 추격 속도 (플레이어 220 대비 1.6배 이상)
      this.damage = 99999;    // 스치면 1방 즉사
      this.exp = 66666;
      this.knockbackImmune = true;
      this.isFlying = true;
      this.isRedReaper = true;

      this.scytheTimer = 0.4; // 0.8 -> 0.4 (기믹 2배 가속)
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

    // 일반 데미지 표기는 프레임 최적화를 위해 생략하고, 크리티컬(치명타) 시에만 느낌표(!) 표기
    if (isCrit && window.game && window.game.damageNumbers) {
      const isSuperCrit = !!(window.game.player && window.game.player.ownedPassives && window.game.player.ownedPassives['stat_crit_dmg']);
      window.game.damageNumbers.push(new DamageNumber(this.x, this.y, amount, true, isSuperCrit));
    }

    // 넉백 면역 보스는 뒤로 밀리지 않음!
    if (!this.knockbackImmune && knockbackDir && knockbackForce > 0) {
      this.kbX += knockbackDir.x * (knockbackForce * 0.25); // 보스는 넉백 75% 감소
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

    // ================= 보스별 고유 기믹 AI =================
    if (this.bossStage === 2) {
      // [순간가속 돌진형]
      this.chargeTimer -= dt;

      if (this.isAiming) {
        this.aimTimer -= dt;
        if (this.aimTimer <= 0) {
          // 돌진 발동!
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
          // 0.5초간 조준선 표시 후 대기 (기존 1.0초에서 2배 가속)
          this.isAiming = true;
          this.aimTimer = 0.5;
          const len = Math.hypot(dx, dy) || 1;
          this.chargeDir = { x: dx / len, y: dy / len };
          this.vx = 0;
          this.vy = 0;
        } else {
          // 통상 추적
          if (dist > 0.1) {
            this.vx = (dx / dist) * this.speed + this.kbX;
            this.vy = (dy / dist) * this.speed + this.kbY;
          }
        }
      }
    } else if (this.bossStage === 4) {
      // [순간이동형]
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.teleportTimer = this.teleportCooldown;
        sounds.playBossTeleport();

        // 플레이어 주변 180~250px 거리 랜덤 위치로 순간이동
        const angle = Math.random() * Math.PI * 2;
        const tpDist = 180 + Math.random() * 80;
        this.x = player.x + Math.cos(angle) * tpDist;
        this.y = player.y + Math.sin(angle) * tpDist;

        // 순간이동 직후 8방향 탄환 폭발 발사
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
      // [탄막형 베홀더]
      this.bulletTimer -= dt;
      if (this.bulletTimer <= 0) {
        this.bulletTimer = 0.11; // 0.11초마다 나선형 탄막 회전 방출 (기존 0.22초에서 2배 가속)
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
      // [넉백면역형 불멸의 골렘 + 지진 충격파]
      this.stompTimer -= dt;
      if (this.stompTimer <= 0) {
        this.stompTimer = 2.0; // 2.0초마다 지진 충격파 (기존 4.0초에서 2배 가속)
        sounds.playBossStomp();
        // 16방향 지진 파동 발사
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

      // 묵직하게 전진
      if (dist > 0.1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      }
    } else if (this.bossStage === 10) {
      // [최종 보스 파멸의 군주: 복합 탄막 + 순간이동]
      this.phaseTimer += dt;
      this.teleportTimer -= dt;

      // 상시 나선형 탄막 방출 (2배 가속)
      if (Math.floor(this.phaseTimer * 8) % 2 === 0 && Math.random() < 0.35) {
        const bAngle = this.phaseTimer * 2.8;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(bAngle) * 280, Math.sin(bAngle) * 280,
          9, '#ef4444', 26
        ));
      }

      // 주기적 순간이동 및 12방향 탄막 폭발 (2.5초 주기)
      if (this.teleportTimer <= 0) {
        this.teleportTimer = 2.5; // 기존 5.0s -> 2.5s
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
      // [12스테이지 보스: 심연의 리치 - 순간이동 프로스트 노바 & 3갈래 한기 탄환]
      this.teleportTimer -= dt;
      this.frostNovaTimer -= dt;

      // 주기적 3갈래 한기 탄환 발사 (0.9초 주기)
      if (this.frostNovaTimer <= 0) {
        this.frostNovaTimer = 0.9; // 1.8 -> 0.9
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

      // 2초마다 순간이동 + 10방향 심연의 얼음 파동 방출 (2.0초 주기)
      if (this.teleportTimer <= 0) {
        this.teleportTimer = this.teleportCooldown; // 2.0
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
      // [15스테이지 진 최종 보스: 종말의 사신 - 나선형 암흑 참격 탄막 + 초고속 낫 돌진 + 순간이동]
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.scytheChargeTimer -= dt;

      // 상시 4방향 고속 회전 암흑 탄환 방출 (2배 가속)
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

      // 사신 돌진 상태 업데이트
      if (this.isCharging) {
        this.chargeDuration -= dt;
        this.vx = this.chargeDir.x * 460;
        this.vy = this.chargeDir.y * 460;
        if (this.chargeDuration <= 0) {
          this.isCharging = false;
        }
      } else {
        // 2초마다 고속 참격 돌진 감행 (기존 4.0초에서 2배 가속)
        if (this.scytheChargeTimer <= 0) {
          this.scytheChargeTimer = 2.0;
          sounds.playBossCharge();
          this.isCharging = true;
          this.chargeDuration = 0.65;
          if (dist > 0.1) {
            this.chargeDir = { x: dx / dist, y: dy / dist };
          }
        }

        // 2.25초마다 플레이어 근처 순간이동 + 14방향 사신의 절망 폭발 (기존 4.5초에서 2배 가속)
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
      // [18스테이지 보스: 공허의 지네 - 지그재그 기동 + 공허 화염 탄환 난사]
      this.wyrmZigTimer += dt * 4.0;
      this.wyrmSpitTimer -= dt;

      // 지그재그 우회 기동
      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const wave = Math.sin(this.wyrmZigTimer) * 120;
      const targetAngle = Math.atan2(dy, dx);
      this.vx = Math.cos(targetAngle) * this.speed + Math.cos(perpAngle) * wave;
      this.vy = Math.sin(targetAngle) * this.speed + Math.sin(perpAngle) * wave;

      // 0.95초마다 5갈래 공허 침 탄환 발사 (기존 1.9초에서 2배 가속)
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
      // [20스테이지 진 보스: 혼돈의 절대신 - 16방향 나선 탄막 + 빔 레이저 + 텔레포트 절망 폭발]
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.beamTimer -= dt;

      // 1. 상시 16방향 초고속 나선 탄막
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

      // 2. 1.2초마다 플레이어 방향 3연사 고속 혼돈 빔 탄환 (기존 2.4초에서 2배 가속)
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

      // 3. 1.9초마다 순간이동 + 16방향 혼돈 폭발 (기존 3.8초에서 2배 가속)
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
      // [25스테이지 진 최종 보스: 심연의 군주 (Abyss Sovereign) - 공간 왜곡 텔레포트 + 5연속 암흑 파동]
      this.phaseTimer += dt;
      this.sovereignWaveTimer -= dt;
      this.sovereignWarpTimer -= dt;

      // 1. 상시 나선형 심연 탄막
      if (Math.floor(this.phaseTimer * 8) % 2 === 0 && Math.random() < 0.45) {
        const sAngle = this.phaseTimer * 3.2;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(sAngle) * 320, Math.sin(sAngle) * 320,
          10, '#a855f7', 48
        ));
      }

      // 2. 1.2초마다 5갈래 심연의 암흑 파동 발사
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

      // 3. 2.0초마다 공간 왜곡 순간이동 + 18방향 심연 폭발
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
    } else if (this.bossStage === 99) {
      // [엔드게임 특수 보스: 진 붉은 사신 - 초고속 360 추격 + 넉백/지형 무시 + 주기적 사신의 낫 섬광]
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

    // 보스 역시 화면 밖으로 멀어질 경우 플레이어 앞길(180도 반대편)로 재배치
    this.checkOffscreenRespawn(dt, player);

    // 플레이어 충돌 공격 판정
    if (dist < player.radius + this.radius) {
      player.takeDamage(this.damage);
    }
  }

  draw(ctx) {
    // 돌진 조준선 (Stage 2 보스)
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
      99: 'boss_reaper'
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

    // 보스 발밑 위협적인 마법진 오라
    if (this.bossStage === 99) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
    } else {
      ctx.strokeStyle = this.knockbackImmune ? 'rgba(245, 158, 11, 0.4)' : 'rgba(225, 29, 72, 0.4)';
      ctx.lineWidth = 2;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 다크 판타지 보스 도트 스프라이트 렌더링
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

    // 황금/사신 왕관 표식
    ctx.fillStyle = this.bossStage === 99 ? '#ef4444' : '#fde047';
    ctx.beginPath();
    ctx.moveTo(-14, -this.radius - 4);
    ctx.lineTo(-7, -this.radius - 14);
    ctx.lineTo(0, -this.radius - 6);
    ctx.lineTo(7, -this.radius - 14);
    ctx.lineTo(14, -this.radius - 4);
    ctx.closePath();
    ctx.fill();

    // 보스 머리 위 체력바
    const barW = this.radius * 2.4;
    const barH = 6;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-barW / 2, -this.radius - 24, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barW / 2, -this.radius - 24, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -this.radius - 24, barW, barH);

    ctx.restore();
  }
}
