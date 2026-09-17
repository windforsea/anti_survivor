// 플레이어 클래스 및 컨트롤러
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    
    // 기본 스탯 (카드 업그레이드로 강화 가능)
    this.maxHp = 100;
    this.hp = 100;
    this.baseSpeed = 220;
    this.speed = 220;
    this.armor = 0;                     // 피해 고정 감쇄 (최소 피해 1)
    this.atkPowerMult = 1.0;            // 공격력 %
    this.hpRegen = 0.0;                 // 초당 체력 재생
    this.globalCooldownMult = 1.0;      // 전체 무기 쿨다운 단축 (공격속도 증가)
    this.magnetRadius = 130;            // 기본 자석 흡수 반경
    this.bonusProjectiles = 0;          // 캐릭터 투사체 개수 증가 (최대 3회 제한)
    this.bonusProjSpeedMult = 1.0;      // 캐릭터 원거리 투사체 속도 배율
    this.ownedPassives = {};            // 보유한 패시브 스탯 { id: { level, maxLevel, iconKey, title } } (최대 6종 슬롯 제한)

    // 레벨 및 경험치
    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;
    this.totalKills = 0;

    // 이동 및 방향
    this.vx = 0;
    this.vy = 0;
    this.facing = { x: 1, y: 0 }; // 마지막 바라본 방향
    
    // 무적 시간 및 상태
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 0.25; // 0.25초 무적
    this.isDead = false;

    // 공격 애니메이션 연출 큐
    this.attackAnims = [];

    // 시각 효과
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

    // 공격 애니메이션 타이머 갱신
    for (let i = this.attackAnims.length - 1; i >= 0; i--) {
      const anim = this.attackAnims[i];
      anim.timer -= dt;
      if (anim.timer <= 0) {
        this.attackAnims.splice(i, 1);
      }
    }

    // 체력 재생
    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }

    // 무적 시간 차감
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // 이동 처리
    let moveX = 0;
    let moveY = 0;

    // 키보드 입력
    if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

    // 조이스틱 입력 (모바일 대응)
    if (input.joystick && input.joystick.active) {
      moveX = input.joystick.x;
      moveY = input.joystick.y;
    }

    // 대각선 이동 정규화
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
  }

  takeDamage(amount) {
    if (this.isDead || this.invulnerableTimer > 0) return 0;

    // 방어력 적용 (최소 1의 피해는 받음)
    const actualDamage = Math.max(1, Math.round(amount - this.armor));
    this.hp -= actualDamage;
    this.invulnerableTimer = this.invulnerableDuration;

    sounds.playPlayerHurt();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }

    return actualDamage;
  }

  gainExp(amount, onLevelUp) {
    if (this.isDead) return;

    this.exp += amount;
    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level += 1;
      this.maxExp = Math.floor(this.maxExp * 1.3) + 10;
      sounds.playLevelUp();
      if (onLevelUp) onLevelUp(this.level);
    }
  }

  draw(ctx) {
    // 무적 시간 중에는 깜빡임 효과
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      return;
    }

    const bobOffset = Math.sin(this.bobTimer) * 2;

    // 플레이어 그림자
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius - 2, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 다크 판타지 도트 스프라이트 렌더링 (방향 반전 및 걸음 흔들림 적용)
    const drawn = assets.drawSprite(ctx, 'player', this.x, this.y + bobOffset - 2, 38, this.facing.x, false);

    // 폴백 (에셋 로드 전)
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

    // 공격 무기 휘두르기 및 발사 이펙트 스프라이트 렌더링
    for (const anim of this.attackAnims) {
      const progress = Math.max(0, Math.min(1, 1 - (anim.timer / anim.duration)));

      if (anim.type === 'sword' || anim.type === 'dagger') {
        const thrustDist = 16 + Math.sin(progress * Math.PI) * 30;
        const px = this.x + Math.cos(anim.angle) * thrustDist;
        const py = this.y + Math.sin(anim.angle) * thrustDist;
        const spriteKey = anim.type === 'sword' ? 'anim_sword' : 'anim_dagger';
        const img = assets.images[spriteKey] || assets.images['anim_dagger'];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(anim.angle + Math.PI / 4);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -15, -15, 30, 30);
          ctx.restore();
        }
      } else if (anim.type === 'axe') {
        const orbitAngle = anim.startAngle + progress * Math.PI * 2.2;
        const orbitDist = 42;
        const px = this.x + Math.cos(orbitAngle) * orbitDist;
        const py = this.y + Math.sin(orbitAngle) * orbitDist;
        const img = assets.images['anim_axe'];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(orbitAngle + Math.PI / 2);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -18, -18, 36, 36);
          ctx.restore();
        }
      } else if (anim.type === 'whip' || anim.type === 'bladewhip') {
        const isBlade = anim.type === 'bladewhip';
        const sweepArc = anim.arc || (isBlade ? 2.2 : 1.85);
        const maxRange = anim.range || (isBlade ? 280 : 150);

        // 부채꼴 호(Arc)를 따라 좌에서 우로 긁어내며 회전 스윙
        const sweepAngle = (anim.angle - sweepArc / 2) + progress * sweepArc;
        const currentDist = 36 + Math.sin(progress * Math.PI) * (maxRange - 42);

        const px = this.x + Math.cos(sweepAngle) * currentDist;
        const py = this.y + Math.sin(sweepAngle) * currentDist;

        ctx.save();
        // 긁어내는 채찍 줄 궤적 (이등변 삼각형 밑변 원주를 훑는 곡선)
        ctx.strokeStyle = isBlade ? 'rgba(251, 191, 36, 0.85)' : 'rgba(245, 158, 11, 0.75)';
        ctx.lineWidth = isBlade ? 5 : 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const midAngle = sweepAngle - 0.22;
        const midDist = currentDist * 0.58;
        const cx = this.x + Math.cos(midAngle) * midDist;
        const cy = this.y + Math.sin(midAngle) * midDist;
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(cx, cy, px, py);
        ctx.stroke();

        // 채찍 끝에 달린 휘두르는 무기 스프라이트
        const spriteKey = isBlade ? 'anim_bladewhip' : 'anim_whip';
        const img = assets.images[spriteKey] || assets.images['anim_whip'];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.translate(px, py);
          ctx.rotate(sweepAngle + Math.PI / 2);
          ctx.imageSmoothingEnabled = false;
          const sz = isBlade ? 42 : 32;
          ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
        }
        ctx.restore();
      } else if (anim.type === 'muzzle') {
        const muzzleDist = 24;
        const px = this.x + Math.cos(anim.angle) * muzzleDist;
        const py = this.y + Math.sin(anim.angle) * muzzleDist;
        const img = assets.images['anim_muzzle'];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(anim.angle);
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, anim.timer / anim.duration);
          ctx.drawImage(img, -14, -14, 28, 28);
          ctx.restore();
        }
      }
    }
  }
}
