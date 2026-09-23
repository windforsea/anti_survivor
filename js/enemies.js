// 15종 일반 몬스터 및 EnemyManager 관리자 (11종 특수 기믹 보스 AI는 js/bosses.js로 분리)

class DamageNumber {
  constructor(x, y, damage, isCrit = false, isSuperCrit = false) {
    this.x = x + (Math.random() - 0.5) * 16;
    this.y = y - 10;
    this.damage = damage;
    this.isCrit = isCrit;
    this.isSuperCrit = isSuperCrit;
    this.life = 0.55;
    this.maxLife = 0.55;
    this.vy = -70 - Math.random() * 25;
    this.vx = (Math.random() - 0.5) * 35;
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
    if (this.isSuperCrit) {
      // 사신의 낫(크리티컬 데미지 증가) 보유 시: 강력한 핏빛 느낌표 (!)
      ctx.font = '900 22px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText('!', this.x, this.y);
      ctx.fillText('!', this.x, this.y);
    } else if (this.isCrit) {
      // 일반 크리티컬: 황금빛 느낌표 (!)
      ctx.font = '900 18px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.0;
      ctx.strokeText('!', this.x, this.y);
      ctx.fillText('!', this.x, this.y);
    } else {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(this.damage, this.x, this.y);
      ctx.fillText(this.damage, this.x, this.y);
    }
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

    // 장애물 내부 끼임 방지 (장애물 밖으로 밀어냄)
    if (window.game && window.game.obstacleManager) {
      for (const obs of window.game.obstacleManager.obstacles) {
        if (obs.isDead) continue;
        const od = Math.hypot(this.x - obs.x, this.y - obs.y);
        const minD = obs.radius + this.radius + 6;
        if (od < minD && od > 0.01) {
          this.x = obs.x + ((this.x - obs.x) / od) * minD;
          this.y = obs.y + ((this.y - obs.y) / od) * minD;
        }
      }
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
  constructor(type, x, y, goldValue = 1) {
    this.type = type; // 'heal', 'magnet', 'bomb', 'freeze', 'gold'
    this.x = x;
    this.y = y;
    this.radius = type === 'gold' ? 12 : 14;
    this.goldValue = goldValue;
    this.life = Infinity; // 영구 보존 (시간 경과로 소멸되지 않음)
    this.bobTimer = Math.random() * 10;
    this.magnetized = false;
    this.magnetSpeed = 0;
  }

  update(dt, player) {
    this.bobTimer += dt * 4;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    // 자석 효과 발동 중이거나 금화가 플레이어 자석 반경 내에 들어오면 플레이어를 향해 가속 흡수
    if (this.magnetized || (this.type === 'gold' && dist < player.magnetRadius)) {
      const speed = 360 + this.magnetSpeed;
      this.magnetSpeed += dt * 500;
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;
    } else if (window.game && window.game.obstacleManager) {
      // 장애물 내부 끼임 방지 (장애물 밖으로 밀어냄)
      for (const obs of window.game.obstacleManager.obstacles) {
        if (obs.isDead) continue;
        const od = Math.hypot(this.x - obs.x, this.y - obs.y);
        const minD = obs.radius + this.radius + 8;
        if (od < minD && od > 0.01) {
          this.x = obs.x + ((this.x - obs.x) / od) * minD;
          this.y = obs.y + ((this.y - obs.y) / od) * minD;
        }
      }
    }

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
      freeze: 'rgba(165, 243, 252, 0.55)',
      gold: 'rgba(251, 191, 36, 0.65)'
    };
    ctx.fillStyle = auraColors[this.type] || 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 1, this.radius * 1.15, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 픽셀 스프라이트 렌더링
    const drawn = assets.drawSprite(ctx, spriteKey, this.x, this.y + bob, this.type === 'gold' ? 24 : 32);

    // 에셋 로드 전 폴백 또는 금화
    if (!drawn) {
      ctx.translate(this.x, this.y + bob);
      ctx.font = this.type === 'gold' ? '18px sans-serif' : '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const emojis = { heal: '🧪', magnet: '🧲', bomb: '💣', freeze: '❄️', gold: '🪙' };
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

// 15종 일반 몬스터 스펙 테이블 (공중/지상 구분, 고유 특색 기믹)
const ENEMY_TYPES = {
  bat: { name: '박쥐', hp: 12, speed: 170, radius: 10, color: '#a855f7', exp: 2, damage: 6, isFlying: true },
  slime: { name: '슬라임', hp: 18, speed: 85, radius: 13, color: '#22c55e', exp: 3, damage: 8, isFlying: false },
  miniSlime: { name: '아기 슬라임', hp: 4, speed: 65, radius: 8, color: '#4ade80', exp: 1, damage: 4, isFlying: false },
  zombie: { name: '좀비', hp: 42, speed: 65, radius: 15, color: '#64748b', exp: 3, damage: 12, knockbackResist: 0.45, isFlying: false },
  skeleton: { name: '해골', hp: 34, speed: 105, radius: 13, color: '#f1f5f9', exp: 4, damage: 10, isFlying: false },
  goblin: { name: '고블린', hp: 42, speed: 145, radius: 12, color: '#84cc16', exp: 5, damage: 9, isFlying: false },
  ghost: { name: '유령', hp: 60, speed: 115, radius: 15, color: '#38bdf8', exp: 6, damage: 11, alpha: 0.65, isFlying: true },
  gargoyle: { name: '가고일', hp: 115, speed: 75, radius: 18, color: '#78716c', exp: 7, damage: 16, isFlying: true },
  cultist: { name: '흑마술사', hp: 100, speed: 95, radius: 14, color: '#dc2626', exp: 9, damage: 14, isRanged: true, isFlying: false },
  assassin: { name: '암살자', hp: 60, speed: 155, radius: 13, color: '#18181b', exp: 11, damage: 12, isFlying: false },
  golem: { name: '골렘', hp: 300, speed: 50, radius: 24, color: '#d97706', exp: 25, damage: 25, knockbackResist: 0.85, isFlying: false },

  // [신규 특색 몬스터 4종]
  darkMage: { name: '타락한 마도사', hp: 140, speed: 95, radius: 14, color: '#7e22ce', exp: 12, damage: 16, isRanged: true, isFlying: true },
  bloodHound: { name: '핏빛 사냥개', hp: 110, speed: 210, radius: 12, color: '#dc2626', exp: 10, damage: 18, knockbackResist: 0.35, isFlying: false }, // 속도 완화 (275 -> 210)
  wraithSwarm: { name: '망령 군단', hp: 55, speed: 145, radius: 11, color: '#06b6d4', exp: 5, damage: 12, alpha: 0.70, isFlying: true },
  abyssTitan: { name: '심연의 거인', hp: 450, speed: 55, radius: 28, color: '#1e1b4b', exp: 28, damage: 32, knockbackResist: 0.70, isFlying: false } // HP(650->450) 및 넉백저항(0.92->0.70) 완화
};

class Enemy {
  constructor(typeKey, x, y, hpScale = 1.0) {
    const config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.bat;
    this.typeKey = typeKey;
    this.name = config.name;
    this.hpScale = (typeof hpScale === 'number' && !isNaN(hpScale)) ? hpScale : 1.0;
    this.maxHp = Math.round(config.hp * this.hpScale);
    this.hp = this.maxHp;
    this.speed = config.speed;
    this.radius = config.radius;
    this.color = config.color;
    this.exp = config.exp;
    this.damage = config.damage;
    this.alpha = config.alpha || 1.0;
    this.knockbackResist = config.knockbackResist || 0; // 넉백 저항 수치
    this.isFlying = config.isFlying || false;           // 공중/비행 몬스터 여부
    this.isRanged = config.isRanged || false;           // 원거리 사격 여부
    this.shootTimer = 1.0 + Math.random() * 1.5;
    this.isBoss = false;

    // 빙결 및 슬로우 상태
    this.freezeTimer = 0;
    this.freezeCooldownTimer = 0;
    this.slowTimer = 0;
    this.slowMult = 1.0;

    // 고유 기믹 타이머
    this.dashTimer = 2.0 + Math.random() * 1.5;
    this.dashDuration = 0;
    this.phaseTimer = Math.random() * 3;
    this.isPhased = false;
    this.reviveState = 0; // 0: 정상, 1: 뼈무덤(사망 대기), 2: 부활 완료
    this.reviveTimer = 0;
    this.stompTimer = 3.5 + Math.random() * 2.0;

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

  takeDamage(amount, knockbackDir, knockbackForce, isCrit = null) {
    if (this.isDead) return;
    if (this.isPhased) return; // 유령 위상 변이(무적) 상태 시 피해 무시
    if (this.reviveState === 1) return; // 뼈무덤 상태 시 타격 불가

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

    if (knockbackDir && knockbackForce > 0) {
      // 몬스터별 넉백 저항 적용 (빙결된 적은 얼음 무게로 70% 추가 감쇄)
      let effectiveForce = knockbackForce * (1 - this.knockbackResist);
      if (this.freezeTimer > 0) effectiveForce *= 0.30;
      this.kbX += knockbackDir.x * effectiveForce;
      this.kbY += knockbackDir.y * effectiveForce;
    }

    if (this.hp <= 0) {
      // 해골 1회 뼈 재조립 부활 기믹
      if (this.typeKey === 'skeleton' && this.reviveState === 0) {
        this.reviveState = 1;
        this.reviveTimer = 2.0;
        this.freezeTimer = 0; // 뼈무덤 진입 시 기존 얼음 즉시 해제!
        this.hp = 0;
        return;
      }
      this.hp = 0;
      this.isDead = true;
    }
  }

  // 빙결 및 감속 부여 (천상의 성역 등)
  freeze(duration = 1.5) {
    if (this.isDead) return;
    // 유령 무적(isPhased) 또는 해골 뼈무덤 상태(reviveState === 1), 또는 빙결 면역 쿨타임 중에는 빙결 무효화
    if (this.isPhased || this.reviveState === 1 || this.freezeCooldownTimer > 0) return;

    if (this.isBoss) {
      // 보스는 완전 정지 대신 40% 감속 1.0초
      this.slowTimer = 1.0;
      this.slowMult = 0.60;
    } else {
      this.freezeTimer = Math.max(this.freezeTimer, duration);
    }
    if (window.game) {
      window.game.addParticles(this.x, this.y, '#38bdf8', 6);
      window.game.addParticles(this.x, this.y, '#e0f2fe', 4);
    }
  }

  // 중독 효과 부여 (맹독 비수, 베놈 블리자드)
  poison(duration = 3.0, dps = 10) {
    if (this.isDead) return;
    this.poisonTimer = Math.max(this.poisonTimer || 0, duration);
    this.poisonDps = Math.max(this.poisonDps || 0, dps);
  }

  update(dt, player, allEnemies, enemyProjectiles) {
    if (this.isDead) return;

    // 빙결 면역 쿨타임 차감
    if (this.freezeCooldownTimer > 0) {
      this.freezeCooldownTimer -= dt;
    }

    // 중독 도트 피해 처리
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      this.poisonTickTimer = (this.poisonTickTimer || 0) - dt;
      if (this.poisonTickTimer <= 0) {
        this.poisonTickTimer = 0.5;
        const tickDmg = Math.max(1, Math.round((this.poisonDps || 10) * 0.5));
        this.takeDamage(tickDmg, null, 0, false);
        if (window.game) {
          window.game.addParticles(this.x, this.y, '#22c55e', 3);
        }
      }
    }

    // 해골 뼈무덤 부활 대기 처리 (빙결 검사보다 먼저 실행하여 2초 후 부활 무조건 보장!)
    if (this.reviveState === 1) {
      this.reviveTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      if (this.reviveTimer <= 0) {
        this.reviveState = 2;
        this.hp = Math.round(this.maxHp * 0.35); // 35% 체력으로 부활 (약 12 HP)
        this.name = '붉은 해골';
        this.color = '#ef4444';
        this.freezeTimer = 0;
        this.freezeCooldownTimer = 1.8;
        this.kbX = 0; // 부활 시 잔여 넉백 완전 리셋
        this.kbY = 0;
        this.vx = 0;
        this.vy = 0;
        sounds.playKill();
        if (window.game) {
          window.game.addParticles(this.x, this.y, '#ef4444', 18);
          window.game.addParticles(this.x, this.y, '#f87171', 12);
        }
      }
      return;
    }

    // 빙결 상태 시 이동/공격 정지
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.freezeCooldownTimer = 1.8; // 빙결 해제 후 1.8초간 재빙결 면역 쿨타임 부여!
      }
      this.animTimer += dt * 2;
      return;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
    }

    this.animTimer += dt * 8;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // 넉백 감쇠 (마찰력 적용)
    this.kbX *= Math.max(0, 1 - dt * 8);
    this.kbY *= Math.max(0, 1 - dt * 8);

    // 플레이어를 향해 이동
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    let curSpeed = this.speed * (this.slowTimer > 0 ? (this.slowMult || 0.65) : 1.0);
    let moveDirX = dist > 0.1 ? (dx / dist) : 0;
    let moveDirY = dist > 0.1 ? (dy / dist) : 0;

      // 1. 박쥐 (bat): Sine-wave 지그재그 출렁임 비행
      if (this.typeKey === 'bat') {
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const flutter = Math.sin(this.animTimer * 1.8) * 0.55;
        moveDirX = (dx / dist) * 0.85 + perpX * flutter;
        moveDirY = (dy / dist) * 0.85 + perpY * flutter;
      }

      // 2. 고블린 (goblin): 220px 거리 접근 시 측면 선회 포위 기동
      else if (this.typeKey === 'goblin' && dist < 220) {
        moveDirX = (dx / dist) * 0.45 - (dy / dist) * 0.85;
        moveDirY = (dy / dist) * 0.45 + (dx / dist) * 0.85;
      }

      // 3. 유령 (ghost): 3.5초 주기 중 0.6초간만 위상 변이 (반투명 무적 영체화)
      else if (this.typeKey === 'ghost') {
        this.phaseTimer += dt;
        const cycle = this.phaseTimer % 3.5;
        const prevPhased = this.isPhased;
        this.isPhased = cycle < 0.6;
        this.alpha = this.isPhased ? 0.20 : 0.70;
        if (this.isPhased && !prevPhased) {
          this.kbX = 0; // 무적 영체화 진입 시 잔여 넉백 즉시 리셋
          this.kbY = 0;
        }
      }

      // 4. 암살자 (assassin): 210px 근접 시 0.35초간 그림자 돌진 (Shadow Dash - 너프 적용)
      else if (this.typeKey === 'assassin') {
        this.dashTimer -= dt;
        if (this.dashDuration > 0) {
          this.dashDuration -= dt;
          curSpeed = 280; // 돌진 속도 완화 (380 -> 280)
          if (window.game && Math.random() < 0.4) {
            window.game.addParticles(this.x, this.y, '#18181b', 2);
          }
        } else if (dist < 210 && this.dashTimer <= 0) {
          this.dashDuration = 0.35; // 돌진 지속시간 소폭 단축 (0.4 -> 0.35)
          this.dashTimer = 4.5; // 돌진 쿨타임 증가 (3.5 -> 4.5)
          sounds.playSlash();
        }
      }

      // 5. 골렘 (golem): 4.5초 주기 지진 발구르기 슬로우 충격파
      else if (this.typeKey === 'golem') {
        this.stompTimer -= dt;
        if (this.stompTimer <= 0) {
          this.stompTimer = 4.5;
          sounds.playBossStomp();
          if (window.game) {
            window.game.addParticles(this.x, this.y, '#d97706', 14);
          }
          if (dist < 115) {
            player.speed = player.baseSpeed * 0.65;
            setTimeout(() => {
              if (player) player.speed = player.baseSpeed;
            }, 1200);
          }
        }
      }

      // 6. 원거리 사격형 몬스터 (흑마술사, 타락한 마도사 등) 카이팅 & 저주탄 발사 AI
      if (this.isRanged) {
        if (!this.shootTimer) this.shootTimer = 1.0 + Math.random() * 1.5;
        this.shootTimer -= dt;

        const idealDist = this.typeKey === 'cultist' ? 310 : 280;
        if (dist < idealDist - 40) {
          moveDirX = -dx / dist;
          moveDirY = -dy / dist;
        } else if (dist > idealDist + 60) {
          moveDirX = dx / dist;
          moveDirY = dy / dist;
        } else {
          // 측면 횡이동 선회
          moveDirX = -dy / dist;
          moveDirY = dx / dist;
        }

        // 사거리 내 플레이어에게 암흑/저주 탄환 조준 발사
        if (this.shootTimer <= 0) {
          this.shootTimer = this.typeKey === 'cultist' ? 5.2 : 2.2; // 교단사제 발사 주기 2배 지연 (2.6s -> 5.2s)
          if (enemyProjectiles && dist < 550) {
            const bulletSpeed = this.typeKey === 'cultist' ? 190 : 240;
            const bulletColor = this.typeKey === 'cultist' ? '#ef4444' : '#c026d3';
            const bvx = (dx / (dist || 1)) * bulletSpeed;
            const bvy = (dy / (dist || 1)) * bulletSpeed;
            enemyProjectiles.push(new BossProjectile(this.x, this.y, bvx, bvy, 6, bulletColor, this.damage));
            sounds.playMagic();
          }
        }
      }

      // 몬스터 간 간단한 분리(밀어내기) 처리 (유령 무적 위상 변이 상태이거나 뼈무덤 상태인 적은 통과)
      let sepX = 0;
      let sepY = 0;
      if (!this.isPhased && this.reviveState !== 1) {
        let neighbors = 0;
        for (const other of allEnemies) {
          if (other === this || other.isDead || other.isPhased || other.reviveState === 1) continue;
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
      }

      this.vx = moveDirX * curSpeed + sepX * 2.5 + this.kbX;
      this.vy = moveDirY * curSpeed + sepY * 2.5 + this.kbY;

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
    // 1. 해골 뼈무덤 상태 (1회 사망 후 2초간 바닥에서 재조립 대기)
    if (this.typeKey === 'skeleton' && this.reviveState === 1) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // 뼈무덤 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 5, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바닥에 흩어진 뼈 조각들
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;

      // 뼈 조각 1
      ctx.save();
      ctx.rotate(0.35);
      ctx.fillRect(-7, 2, 14, 3.5);
      ctx.strokeRect(-7, 2, 14, 3.5);
      ctx.restore();

      // 뼈 조각 2
      ctx.save();
      ctx.rotate(-0.45);
      ctx.fillRect(-6, 3, 12, 3.5);
      ctx.strokeRect(-6, 3, 12, 3.5);
      ctx.restore();

      // 두개골 (부활 직전 격렬하게 떨림)
      const shake = (Math.random() - 0.5) * (this.reviveTimer < 0.7 ? 3.5 : 1.2);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(shake, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 꿈틀대는 붉은 부활 안광
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(shake - 2.5, 0, 1.6, 0, Math.PI * 2);
      ctx.arc(shake + 2.5, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const bob = Math.sin(this.animTimer) * 2;
    const isHit = this.hitFlashTimer > 0;
    const facingX = (this.vx && Math.abs(this.vx) > 5) ? (this.vx < 0 ? -1 : 1) : 1;
    const spriteSize = Math.max(28, this.radius * 2.4);

    // 붉은 해골(부활 완료된 2차 해골) 판정
    const isRedSkeleton = (this.typeKey === 'skeleton' && this.reviveState === 2);

    // 그림자 (월드 좌표)
    ctx.save();
    ctx.fillStyle = isRedSkeleton ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 2, this.radius * 0.85, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (isRedSkeleton) {
      // 붉은 해골: 강렬한 핏빛 네온 아우라
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
    }

    // 다크 판타지 도트 스프라이트 렌더링
    const drawn = assets.drawSprite(ctx, this.typeKey, this.x, this.y + bob, spriteSize, facingX, isHit);

    // 붉은 해골 전용 시각 효과 오버레이 (핏빛 색조 + 붉은 안광)
    if (isRedSkeleton && drawn) {
      // 1. 스프라이트 표면 핏빛 붉은 틴트 오버레이
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.beginPath();
      ctx.arc(0, 0, spriteSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. 번뜩이는 붉은 악마 안광 (Red Eye Flare)
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      const eyeDir = facingX;
      ctx.beginPath();
      ctx.arc(eyeDir * 2 - 2, -4, 2, 0, Math.PI * 2);
      ctx.arc(eyeDir * 2 + 3, -4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    if (!drawn) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = isHit ? '#ffffff' : (isRedSkeleton ? '#ef4444' : this.color);
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 빙결 시 서리빛 얼음 결계 및 틴트 렌더링
    if (this.freezeTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}


// ========================================================
// 11종 특수 기믹 보스 클래스(BossEnemy)는 js/bosses.js에 분리되어 있습니다.
// ========================================================
