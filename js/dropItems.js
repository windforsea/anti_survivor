// Anti Survivors - 드랍 아이템, 경험치 보석, 데미지 이펙트 및 보스 투사체 모듈 (js/dropItems.js)

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
    // 치명타 수묵 먹물방울용 시드
    if (this.isCrit || this.isSuperCrit) {
      this.inkAngle = Math.random() * Math.PI * 2;
    }
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const prog = 1 - (this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.isSuperCrit) {
      // 🔴 [슈퍼 치명타]: 강렬한 붉은 진사 십자 참격 섬광(Crimson Cross Slash Spark) & CRIT!!
      const len = 22 * (1 - prog * 0.2);
      const slashAngle = this.inkAngle || 0.78;
      const cosA = Math.cos(slashAngle);
      const sinA = Math.sin(slashAngle);
      const cosB = Math.cos(slashAngle + Math.PI / 2);
      const sinB = Math.sin(slashAngle + Math.PI / 2);

      // (1) 십자 붉은 참격 궤적 1
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(this.x - cosA * len, this.y - sinA * len);
      ctx.lineTo(this.x + cosA * len, this.y + sinA * len);
      ctx.moveTo(this.x - cosB * (len * 0.7), this.y - sinB * (len * 0.7));
      ctx.lineTo(this.x + cosB * (len * 0.7), this.y + sinB * (len * 0.7));
      ctx.stroke();

      // (2) 내부 황금/백색 중심 심선
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // (3) CRIT!! 텍스트 팝업
      ctx.font = '900 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3;
      ctx.strokeText('CRIT!!', this.x, this.y - 14 - prog * 16);
      ctx.fillStyle = '#f87171';
      ctx.fillText('CRIT!!', this.x, this.y - 14 - prog * 16);

    } else if (this.isCrit) {
      // ⚡ [일반 치명타]: 날카로운 황금 비백 참격 섬광(Golden Slash Spark) & CRIT! (독 오인 원천 차단)
      const len = 18 * (1 - prog * 0.2);
      const slashAngle = this.inkAngle || 0.65;
      const cosA = Math.cos(slashAngle);
      const sinA = Math.sin(slashAngle);

      // (1) 날카로운 사선 황금빛 검흔
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(this.x - cosA * len, this.y - sinA * len);
      ctx.lineTo(this.x + cosA * len, this.y + sinA * len);
      ctx.stroke();

      // (2) 중심 백색 비백(飛白) 섬광 심선
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(this.x - cosA * (len * 0.6), this.y - sinA * (len * 0.6));
      ctx.lineTo(this.x + cosA * (len * 0.6), this.y + sinA * (len * 0.6));
      ctx.stroke();

      // (3) 황금빛 CRIT! 텍스트 팝업
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.8;
      ctx.strokeText('CRIT!', this.x, this.y - 12 - prog * 14);
      ctx.fillStyle = '#facc15';
      ctx.fillText('CRIT!', this.x, this.y - 12 - prog * 14);
    } else {
      // 일반 데미지 숫자 표기
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
      const speed = this.magnetized ? 780 : (440 + (1 - dist / player.magnetRadius) * 480);
      this.vx = (dx / (dist || 1)) * speed;
      this.vy = (dy / (dist || 1)) * speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else if (window.game && window.game.obstacleManager) {
      // 바닥에 정지해 있을 때만 장애물 내부 끼임 방지 (흡인 중에는 관통 흡수)
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
    // 수묵화풍 경험치 영석 스프라이트 렌더링
    let gemKey = 'gem_blue';
    let drawSize = 14;
    if (this.value >= 50) {
      gemKey = 'gem_purple';
      drawSize = 22;
    } else if (this.value >= 20) {
      gemKey = 'gem_red';
      drawSize = 18;
    } else if (this.value >= 5) {
      gemKey = 'gem_green';
      drawSize = 16;
    }

    ctx.save();

    // 50EXP 이상 대형 보석: 은은한 수묵 황금빛 후광 펄스 연출
    if (this.value >= 50) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, drawSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    const drawn = assets.drawSprite(ctx, gemKey, this.x, this.y, drawSize);

    // 에셋 로드 전 폴백: 마름모 수묵 테두리 렌더링
    if (!drawn) {
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (this.value >= 50) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// 필드 특수 드랍 아이템 (자석, 폭탄, 얼음, 회복 포션, 골드) - 영구 보존
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

    ctx.save();

    // 바닥 수묵 담묵 번짐 오라 효과
    const auraColors = {
      heal: 'rgba(34, 197, 94, 0.45)',
      magnet: 'rgba(56, 189, 248, 0.45)',
      bomb: 'rgba(239, 68, 68, 0.45)',
      freeze: 'rgba(165, 243, 252, 0.55)',
      gold: 'rgba(245, 158, 11, 0.55)'
    };
    ctx.fillStyle = auraColors[this.type] || 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 1, this.radius * 1.25, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 외곽 담묵 번짐 림
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 수묵화풍 픽셀 스프라이트 렌더링 (금화 24px, 기타 아이템 32px)
    const drawSize = this.type === 'gold' ? 24 : 32;
    const drawn = assets.drawSprite(ctx, spriteKey, this.x, this.y + bob, drawSize);

    // 에셋 로드 전 폴백
    if (!drawn) {
      ctx.translate(this.x, this.y + bob);
      ctx.font = this.type === 'gold' ? '18px sans-serif' : '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const emojis = { heal: '🍶', magnet: '🧲', bomb: '💣', freeze: '❄️', gold: '🪙' };
      ctx.fillText(emojis[this.type] || '⭐', 0, 0);
    }
    ctx.restore();
  }
}

// 보스 투사체 클래스
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
