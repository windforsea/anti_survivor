// 10종 일반 몬스터 & 5종 보스 AI 및 탄막/경험치 보석 시스템

class DamageNumber {
  constructor(x, y, damage, isCrit = false) {
    this.x = x + (Math.random() - 0.5) * 16;
    this.y = y - 10;
    this.damage = damage;
    this.isCrit = isCrit;
    this.life = 0.6;
    this.maxLife = 0.6;
    this.vy = -60 - Math.random() * 30;
    this.vx = (Math.random() - 0.5) * 40;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = this.isCrit ? 'bold 16px sans-serif' : 'bold 13px sans-serif';
    ctx.fillStyle = this.isCrit ? '#facc15' : '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.damage, this.x, this.y);
    ctx.fillText(this.damage, this.x, this.y);
    ctx.restore();
  }
}

class ExpGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.magnetized = false; // 자석 아이템 습득 시 전체 맵 보석 가속 흡수용
    this.radius = value >= 50 ? 8 : (value >= 20 ? 6 : (value >= 5 ? 5 : 4));
    this.color = value >= 50 ? '#facc15' : (value >= 20 ? '#ef4444' : (value >= 5 ? '#22c55e' : '#38bdf8'));
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // 자석 반경 내 접근 시 또는 전체 흡수 자석 발동 시 가속 흡수
    if (this.magnetized || dist < player.magnetRadius) {
      const speed = this.magnetized ? 750 : (420 + (1 - dist / player.magnetRadius) * 480);
      this.vx = (dx / (dist || 1)) * speed;
      this.vy = (dy / (dist || 1)) * speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // 플레이어 습득 판정
    if (dist < player.radius + this.radius) {
      return true; // 획득됨
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.value >= 50 ? 10 : 6;

    // 마름모 보석 형태
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();

    // 50EXP 이상 대형 골드 보석 하이라이트
    if (this.value >= 50) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// 필드 특수 드랍 아이템 (자석, 폭탄, 얼음, 회복 포션) - 영구 보존
class PickupItem {
  constructor(type, x, y) {
    this.type = type; // 'heal', 'magnet', 'bomb', 'freeze'
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.life = Infinity; // 영구 보존 (시간 경과로 소멸되지 않음)
    this.bobTimer = Math.random() * 10;
  }

  update(dt, player) {
    this.bobTimer += dt * 4;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    // 플레이어 충돌 습득 판정
    if (dist < player.radius + this.radius) {
      return true;
    }
    return false;
  }

  draw(ctx) {
    const bob = Math.sin(this.bobTimer) * 4;
    const spriteKey = `item_${this.type}`;

    // 바닥 빛나는 오라 효과
    ctx.save();
    const auraColors = {
      heal: 'rgba(34, 197, 94, 0.55)',
      magnet: 'rgba(56, 189, 248, 0.45)',
      bomb: 'rgba(239, 68, 68, 0.45)',
      freeze: 'rgba(165, 243, 252, 0.55)'
    };
    ctx.fillStyle = auraColors[this.type] || 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 1, this.radius * 1.15, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 픽셀 스프라이트 렌더링
    const drawn = assets.drawSprite(ctx, spriteKey, this.x, this.y + bob, 32);

    // 에셋 로드 전 폴백
    if (!drawn) {
      ctx.translate(this.x, this.y + bob);
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const emojis = { heal: '🧪', magnet: '🧲', bomb: '💣', freeze: '❄️' };
      ctx.fillText(emojis[this.type] || '⭐', 0, 0);
    }
    ctx.restore();
  }
}

class BossProjectile {
  constructor(x, y, vx, vy, radius = 6, color = '#ef4444', damage = 15) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.damage = damage;
    this.life = 5.0;
  }

  update(dt, player) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 플레이어 충돌 판정
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < player.radius + this.radius) {
      player.takeDamage(this.damage);
      return true; // 소멸
    }
    return this.life <= 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 10종 일반 몬스터 스펙 테이블 (뒤 5종 마물 경험치 대폭 상향)
const ENEMY_TYPES = {
  bat: { name: '박쥐', hp: 18, speed: 170, radius: 10, color: '#a855f7', exp: 1, damage: 6 },
  slime: { name: '슬라임', hp: 32, speed: 85, radius: 13, color: '#22c55e', exp: 2, damage: 8 },
  zombie: { name: '좀비', hp: 65, speed: 65, radius: 15, color: '#64748b', exp: 3, damage: 12 },
  skeleton: { name: '해골', hp: 50, speed: 105, radius: 13, color: '#f1f5f9', exp: 4, damage: 10 },
  goblin: { name: '고블린', hp: 42, speed: 145, radius: 12, color: '#84cc16', exp: 5, damage: 9 },
  ghost: { name: '유령', hp: 60, speed: 115, radius: 15, color: '#38bdf8', exp: 8, damage: 11, alpha: 0.65 },
  gargoyle: { name: '가고일', hp: 130, speed: 75, radius: 18, color: '#78716c', exp: 15, damage: 16 },
  cultist: { name: '흑마술사', hp: 100, speed: 95, radius: 14, color: '#dc2626', exp: 25, damage: 14 },
  assassin: { name: '암살자', hp: 85, speed: 180, radius: 13, color: '#18181b', exp: 35, damage: 18 },
  golem: { name: '골렘', hp: 300, speed: 50, radius: 24, color: '#d97706', exp: 80, damage: 25, knockbackResist: 0.85 } // 85% 넉백 저항
};

class Enemy {
  constructor(typeKey, x, y, hpScale = 1.0) {
    const config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.bat;
    this.typeKey = typeKey;
    this.name = config.name;
    this.maxHp = Math.round(config.hp * hpScale);
    this.hp = this.maxHp;
    this.speed = config.speed;
    this.radius = config.radius;
    this.color = config.color;
    this.exp = config.exp;
    this.damage = config.damage;
    this.alpha = config.alpha || 1.0;
    this.knockbackResist = config.knockbackResist || 0; // 넉백 저항 수치
    this.isBoss = false;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.kbX = 0;
    this.kbY = 0;
    this.isDead = false;

    this.hitFlashTimer = 0;
    this.animTimer = Math.random() * 10;
    this.offscreenTimer = 0;
  }

  takeDamage(amount, knockbackDir, knockbackForce) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (window.game && window.game.damageNumbers) {
      window.game.damageNumbers.push(new DamageNumber(this.x, this.y, amount));
    }

    if (knockbackDir && knockbackForce > 0) {
      // 몬스터별 넉백 저항 적용 (골렘 등은 85% 감쇄)
      const effectiveForce = knockbackForce * (1 - this.knockbackResist);
      this.kbX += knockbackDir.x * effectiveForce;
      this.kbY += knockbackDir.y * effectiveForce;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  update(dt, player, allEnemies) {
    if (this.isDead) return;

    this.animTimer += dt * 8;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // 넉백 감쇠
    this.kbX *= Math.max(0, 1 - dt * 8);
    this.kbY *= Math.max(0, 1 - dt * 8);

    // 플레이어를 향해 이동
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.1) {
      let moveDirX = dx / dist;
      let moveDirY = dy / dist;

      // 몬스터 간 간단한 분리(밀어내기) 처리
      let sepX = 0;
      let sepY = 0;
      let neighbors = 0;
      for (const other of allEnemies) {
        if (other === this || other.isDead) continue;
        const ox = this.x - other.x;
        const oy = this.y - other.y;
        const odist = Math.hypot(ox, oy);
        const minDist = this.radius + other.radius;
        if (odist > 0 && odist < minDist) {
          sepX += (ox / odist) * (minDist - odist);
          sepY += (oy / odist) * (minDist - odist);
          neighbors++;
          if (neighbors > 5) break;
        }
      }

      this.vx = moveDirX * this.speed + sepX * 2.5 + this.kbX;
      this.vy = moveDirY * this.speed + sepY * 2.5 + this.kbY;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 플레이어 카메라 시야 이탈 검사 및 180도 반대편(진행방향 앞) 리스폰
    this.checkOffscreenRespawn(dt, player);

    // 플레이어 충돌 공격 판정
    if (dist < player.radius + this.radius) {
      player.takeDamage(this.damage);
    }
  }

  // 플레이어 카메라 시야 밖으로 멀어질 경우 180도 반대편(플레이어 진행방향 정면)으로 재배치
  checkOffscreenRespawn(dt, player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    const viewDist = 820; // 화면 절반(대략 600~700px)보다 넉넉한 화면 밖 거리

    if (dist > viewDist) {
      this.offscreenTimer = (this.offscreenTimer || 0) + dt;
      // 화면 밖에서 2.5초 이상 방치되거나 1150px 이상 멀어지면 플레이어 기준 180도 반대편으로 재배치
      if (this.offscreenTimer >= 2.5 || dist > 1150) {
        const angle = Math.atan2(this.y - player.y, this.x - player.x);
        // 플레이어 기준 180도 반대편(±20도 분산)
        const respawnAngle = angle + Math.PI + (Math.random() - 0.5) * 0.45;
        const respawnDist = 760 + Math.random() * 80;

        let newX = player.x + Math.cos(respawnAngle) * respawnDist;
        let newY = player.y + Math.sin(respawnAngle) * respawnDist;

        // 전장 경계 내부(-1560 ~ 1560)로 안전하게 클램프
        newX = Math.max(-1560, Math.min(1560, newX));
        newY = Math.max(-1560, Math.min(1560, newY));

        this.x = newX;
        this.y = newY;
        this.offscreenTimer = 0;
      }
    } else {
      this.offscreenTimer = 0;
    }
  }

  draw(ctx) {
    const bob = Math.sin(this.animTimer) * 2;
    const isHit = this.hitFlashTimer > 0;
    const facingX = (this.vx && Math.abs(this.vx) > 5) ? (this.vx < 0 ? -1 : 1) : 1;
    const spriteSize = Math.max(28, this.radius * 2.4);

    // 그림자 (월드 좌표)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 2, this.radius * 0.85, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 다크 판타지 도트 스프라이트 렌더링
    const drawn = assets.drawSprite(ctx, this.typeKey, this.x, this.y + bob, spriteSize, facingX, isHit);

    if (!drawn) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = isHit ? '#ffffff' : this.color;
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// 5종 특수 기믹 보스 클래스
class BossEnemy extends Enemy {
  constructor(bossStage, x, y) {
    super('golem', x, y, 1.0);
    this.isBoss = true;
    this.bossStage = bossStage;

    // 보스별 특화 설정
    if (bossStage === 2) {
      // 2스테이지 보스: 순간가속형 돌진 맹수 (Dire Boar)
      this.name = '돌진 맹수 (Dire Boar)';
      this.maxHp = 1600;
      this.hp = this.maxHp;
      this.radius = 28;
      this.color = '#b45309'; // 맹수 주황
      this.speed = 100;
      this.damage = 25;
      this.exp = 150;
      
      this.chargeCooldown = 4.0;
      this.chargeTimer = 2.0;
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
      this.damage = 30;
      this.exp = 250;

      this.teleportCooldown = 4.5;
      this.teleportTimer = 4.0;
    } else if (bossStage === 6) {
      // 6스테이지 보스: 탄막형 베홀더 (Chaos Eye)
      this.name = '혼돈의 눈 (Chaos Eye)';
      this.maxHp = 5800;
      this.hp = this.maxHp;
      this.radius = 32;
      this.color = '#e11d48'; // 피빛 레드
      this.speed = 60;
      this.damage = 32;
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
      this.damage = 40;
      this.exp = 600;
      this.knockbackImmune = true; // 100% 넉백 무시!

      this.stompTimer = 4.5;
    } else if (bossStage === 10) {
      // 10스테이지 최종 보스: 파멸의 군주 (Lord of Doom)
      this.name = '파멸의 군주 (Lord of Doom)';
      this.maxHp = 18000;
      this.hp = this.maxHp;
      this.radius = 42;
      this.color = '#991b1b'; // 심홍색
      this.speed = 110;
      this.damage = 45;
      this.exp = 1000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 5.0;
      this.chargeTimer = 3.5;
    }
  }

  takeDamage(amount, knockbackDir, knockbackForce) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (window.game && window.game.damageNumbers) {
      window.game.damageNumbers.push(new DamageNumber(this.x, this.y, amount, true));
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
          this.chargeDuration = 1.0;
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
          // 1.0초간 조준선 표시 후 대기
          this.isAiming = true;
          this.aimTimer = 1.0;
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
            8, '#c084fc', 16
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
        this.bulletTimer = 0.22; // 0.22초마다 나선형 탄막 회전 방출
        this.bulletSpiralAngle += 0.35;
        for (let s = 0; s < 3; s++) {
          const curAngle = this.bulletSpiralAngle + (s * (Math.PI * 2 / 3));
          const bSpd = 220;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(curAngle) * bSpd, Math.sin(curAngle) * bSpd,
            7, '#fb7185', 14
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
        this.stompTimer = 4.0;
        sounds.playBossStomp();
        // 16방향 지진 파동 발사
        for (let i = 0; i < 16; i++) {
          const sAngle = (i / 16) * Math.PI * 2;
          const sSpd = 200;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(sAngle) * sSpd, Math.sin(sAngle) * sSpd,
            9, '#f59e0b', 22
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

      // 상시 나선형 탄막 방출
      if (Math.floor(this.phaseTimer * 4) % 2 === 0 && Math.random() < 0.3) {
        const bAngle = this.phaseTimer * 2.5;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(bAngle) * 280, Math.sin(bAngle) * 280,
          9, '#ef4444', 20
        ));
      }

      // 주기적 순간이동 및 12방향 탄막 폭발
      if (this.teleportTimer <= 0) {
        this.teleportTimer = 5.0;
        sounds.playBossTeleport();
        const angle = Math.random() * Math.PI * 2;
        this.x = player.x + Math.cos(angle) * 220;
        this.y = player.y + Math.sin(angle) * 220;

        for (let i = 0; i < 12; i++) {
          const novaAngle = (i / 12) * Math.PI * 2;
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(novaAngle) * 300, Math.sin(novaAngle) * 300,
            8, '#dc2626', 22
          ));
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
      10: 'boss_doom'
    };
    const bossKey = bossKeyMap[this.bossStage] || 'boss_doom';
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
    ctx.strokeStyle = this.knockbackImmune ? 'rgba(245, 158, 11, 0.4)' : 'rgba(225, 29, 72, 0.4)';
    ctx.lineWidth = 2;
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

    // 황금 왕관 표식
    ctx.fillStyle = '#fde047';
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
