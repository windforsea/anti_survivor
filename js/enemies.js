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
    if (this.isCrit) {
      ctx.font = '900 18px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#ca8a04';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
    } else {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
    }
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
  gargoyle: { name: '가고일', hp: 130, speed: 75, radius: 18, color: '#78716c', exp: 7, damage: 16, isFlying: true },
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

    // 일반 데미지 표기는 프레임 최적화를 위해 생략하고, 크리티컬(치명타) 시에만 표기
    if (isCrit && window.game && window.game.damageNumbers) {
      window.game.damageNumbers.push(new DamageNumber(this.x, this.y, amount, true));
    }

    if (knockbackDir && knockbackForce > 0) {
      // 몬스터별 넉백 저항 적용 (좀비 80%, 골렘 85% 감쇄)
      const effectiveForce = knockbackForce * (1 - this.knockbackResist);
      this.kbX += knockbackDir.x * effectiveForce;
      this.kbY += knockbackDir.y * effectiveForce;
    }

    if (this.hp <= 0) {
      // 해골 1회 뼈 재조립 부활 기믹
      if (this.typeKey === 'skeleton' && this.reviveState === 0) {
        this.reviveState = 1;
        this.reviveTimer = 2.0;
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

    // 빙결 상태 시 이동/공격 정지
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      this.animTimer += dt * 2;
      return;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
    }

    this.animTimer += dt * 8;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // 넉백 감쇠
    this.kbX *= Math.max(0, 1 - dt * 8);
    this.kbY *= Math.max(0, 1 - dt * 8);

    // 해골 뼈무덤 부활 대기 처리
    if (this.reviveState === 1) {
      this.reviveTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      if (this.reviveTimer <= 0) {
        this.reviveState = 2;
        this.hp = Math.round(this.maxHp * 0.35); // 35% 체력으로 부활 (약 12 HP)
        this.name = '붉은 해골';
        this.color = '#ef4444';
        sounds.playKill();
        if (window.game) {
          window.game.addParticles(this.x, this.y, '#ef4444', 18);
          window.game.addParticles(this.x, this.y, '#f87171', 12);
        }
      }
      return;
    }

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

      // 3. 유령 (ghost): 3.5초 주기 중 0.6초간만 위상 변이 (반투명 무적)
      else if (this.typeKey === 'ghost') {
        this.phaseTimer += dt;
        const cycle = this.phaseTimer % 3.5;
        this.isPhased = cycle < 0.6;
        this.alpha = this.isPhased ? 0.20 : 0.70;
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

// 5종 특수 기믹 보스 클래스
class BossEnemy extends Enemy {
  constructor(bossStage, x, y) {
    super('golem', x, y, 1.0);
    this.isBoss = true;
    this.bossStage = bossStage;
    // 공중 부유/비행형 보스는 장애물 무시 관통 (4: 그림자 마법사, 6: 혼돈의 눈, 12: 심연의 리치, 15: 종말의 사신, 18: 공허의 지네, 20: 혼돈의 절대신, 99: 진 붉은 사신)
    this.isFlying = (bossStage === 4 || bossStage === 6 || bossStage === 12 || bossStage === 15 || bossStage === 18 || bossStage === 20 || bossStage === 99);

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
      this.damage = 38;
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

      this.stompTimer = 4.5;
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
      this.teleportTimer = 5.0;
      this.chargeTimer = 3.5;
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

      this.teleportCooldown = 4.0;
      this.teleportTimer = 3.5;
      this.frostNovaTimer = 2.0;
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
      this.teleportTimer = 4.2;
      this.scytheChargeTimer = 3.0;
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
      this.wyrmSpitTimer = 2.0;
    } else if (bossStage === 20) {
      // 20스테이지 진 최종 보스: 혼돈의 절대신 (Chaos Overlord)
      this.name = '혼돈의 절대신 (Chaos Overlord)';
      this.maxHp = 68000; // 120000 -> 68000 (플레이어 최종 DPS로 적정 시간 내 격파 가능하게 밸런싱)
      this.hp = this.maxHp;
      this.radius = 52;
      this.color = '#e11d48'; // 절대 크림슨
      this.speed = 125;
      this.damage = 120;
      this.exp = 10000;
      this.knockbackImmune = true;

      this.phaseTimer = 0;
      this.teleportTimer = 3.8;
      this.beamTimer = 2.5;
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

      this.scytheTimer = 0.8;
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

    // 일반 데미지 표기는 프레임 최적화를 위해 생략하고, 크리티컬(치명타) 시에만 표기
    if (isCrit && window.game && window.game.damageNumbers) {
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
        this.bulletTimer = 0.22; // 0.22초마다 나선형 탄막 회전 방출
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
        this.stompTimer = 4.0;
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

      // 상시 나선형 탄막 방출
      if (Math.floor(this.phaseTimer * 4) % 2 === 0 && Math.random() < 0.3) {
        const bAngle = this.phaseTimer * 2.5;
        bossProjectiles.push(new BossProjectile(
          this.x, this.y,
          Math.cos(bAngle) * 280, Math.sin(bAngle) * 280,
          9, '#ef4444', 26
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

      // 주기적 3갈래 한기 탄환 발사
      if (this.frostNovaTimer <= 0) {
        this.frostNovaTimer = 1.8;
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

      // 4초마다 순간이동 + 10방향 심연의 얼음 파동 방출
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
      // [15스테이지 진 최종 보스: 종말의 사신 - 나선형 암흑 참격 탄막 + 초고속 낫 돌진 + 순간이동]
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.scytheChargeTimer -= dt;

      // 상시 4방향 고속 회전 암흑 탄환 방출
      if (Math.floor(this.phaseTimer * 5) % 2 === 0 && Math.random() < 0.4) {
        const spiralBase = this.phaseTimer * 3.2;
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
        // 4초마다 고속 참격 돌진 감행
        if (this.scytheChargeTimer <= 0) {
          this.scytheChargeTimer = 4.0;
          sounds.playBossCharge();
          this.isCharging = true;
          this.chargeDuration = 0.75;
          if (dist > 0.1) {
            this.chargeDir = { x: dx / dist, y: dy / dist };
          }
        }

        // 4.5초마다 플레이어 근처 순간이동 + 14방향 사신의 절망 폭발
        if (this.teleportTimer <= 0) {
          this.teleportTimer = 4.5;
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

      // 2초마다 5갈래 공허 침 탄환 발사
      if (this.wyrmSpitTimer <= 0) {
        this.wyrmSpitTimer = 1.9;
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
      // [20스테이지 진 최종 보스: 혼돈의 절대신 - 16방향 나선 탄막 + 빔 레이저 + 텔레포트 절망 폭발]
      this.phaseTimer += dt;
      this.teleportTimer -= dt;
      this.beamTimer -= dt;

      // 1. 상시 16방향 초고속 나선 탄막
      if (Math.floor(this.phaseTimer * 6) % 2 === 0 && Math.random() < 0.45) {
        const spiralBase = this.phaseTimer * 3.5;
        for (let s = 0; s < 4; s++) {
          const sAngle = spiralBase + (s * Math.PI / 2);
          bossProjectiles.push(new BossProjectile(
            this.x, this.y,
            Math.cos(sAngle) * 310, Math.sin(sAngle) * 310,
            10, '#f43f5e', 45
          ));
        }
      }

      // 2. 2.5초마다 플레이어 방향 3연사 고속 혼돈 빔 탄환
      if (this.beamTimer <= 0) {
        this.beamTimer = 2.4;
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
          }, b * 140);
        }
      }

      // 3. 3.8초마다 순간이동 + 16방향 혼돈 폭발
      if (this.teleportTimer <= 0) {
        this.teleportTimer = 3.8;
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
