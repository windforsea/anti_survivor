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
      this.atkPowerMult = 1.20;            // 기본 공격력 +20%
      this.globalCooldownMult = 1.10;      // 쿨타임 -10%
      this.bonusProjSpeedMult = 1.15;      // 투사체 속도 +15%
    } else if (characterType === 'assassin') {
      this.spriteKey = 'player_assassin';
      this.charName = '그림자 암살자';
      this.maxHp = 90;
      this.hp = 90;
      this.baseSpeed = 260;                // 초고속 이동 속도
      this.speed = 260;
      this.armor = 0;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
    } else if (characterType === 'cleric') {
      // 해골 성직자 (Mortis)
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
      this.hasRevive = true;               // 불사의 해골: 기본 1회 부활 내장
      this.reviveCount = 1;
      this.hpRegen = 0.6;                  // 신성한 기도: 초당 체력 회복 +0.6 HP/s
      this.bonusAreaMult = 1.15;           // 신성 구역: 공격 범위 +15%
    } else if (characterType === 'sylph') {
      // 신규 직업: 바람의 궁수 (Sylph) - 스나이퍼
      this.spriteKey = 'player_sylph';
      this.charName = '바람의 궁수';
      this.maxHp = 90;
      this.hp = 90;
      this.baseSpeed = 240;
      this.speed = 240;
      this.armor = 0;
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.30;      // 투사체 속도 +30%
      this.bonusAreaMult = 1.25;           // 사거리/시야 +25%
    } else if (characterType === 'malakar') {
      // 신규 직업: 심연의 워록 (Malakar) - 흡혈/반격형 흑마도사
      this.spriteKey = 'player_malakar';
      this.charName = '심연의 워록';
      this.maxHp = 110;
      this.hp = 110;
      this.baseSpeed = 220;
      this.speed = 220;
      this.armor = 0;
      this.atkPowerMult = 1.15;            // 기본 공격력 +15%
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
      this.vampireChance = 0.03;           // 기본 3% 흡혈 내장
    } else {
      // knight (기본)
      this.spriteKey = 'player';
      this.charName = '방랑 기사';
      this.maxHp = 120;                    // 체력 +20
      this.hp = 120;
      this.baseSpeed = 220;
      this.speed = 220;
      this.armor = 1;                      // 기본 방어력 1
      this.atkPowerMult = 1.0;
      this.globalCooldownMult = 1.0;
      this.bonusProjSpeedMult = 1.0;
    }

    this.thornsPercent = 0.0;           // 가시갑옷 반사 피해 비율 (stat_thorns)

    this.hpRegen = 0.0;                 // 초당 체력 재생
    this.baseMagnetRadius = characterType === 'assassin' ? 155 : 130;
    this.magnetRadius = this.baseMagnetRadius;
    this.bonusProjectiles = 0;          // 캐릭터 투사체 개수 증가 (최대 3회 제한)
    this.bonusAreaMult = 1.0;           // 캐릭터 전체 무기 공격 범위 배율
    this.critChance = characterType === 'assassin' ? 0.20 : 0.05; // 암살자 20%, 기본 5%
    this.critDamageMult = 2.0;          // 치명타 피해량 2배
    this.expMult = 1.0;                 // 경험치 획득 배율 1.0배
    this.dropRateBonus = 0.0;           // 특수 아이템 드랍률 보너스
    this.ownedPassives = {};            // 보유한 패시브 스탯

    // 신규 패시브: 흡혈 및 방벽 쉴드
    this.vampireChance = 0.0;           // 처치 시 체력 회복 확률 (stat_vampire)
    this.maxShieldStacks = 0;           // 최대 쉴드 개수 (stat_shield, 최대 2)
    this.currentShieldStacks = 0;       // 현재 쉴드 개수
    this.shieldCooldown = 18.0;         // 쉴드 충전 쿨다운 (초)
    this.shieldTimer = 0.0;
    this.shieldAngle = 0.0;             // 쉴드 회전 렌더링 각도

    // 레벨 및 경험치
    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;
    this.totalKills = 0;

    // 카드 선택 편의 시스템 (한 게임당 새로고침 3회)
    this.rerollCount = 3;
    this.maxRerolls = 3;

    // 이동 및 방향
    this.vx = 0;
    this.vy = 0;
    this.facing = { x: 1, y: 0 }; // 마지막 바라본 방향
    
    // 무적 시간 및 상태
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 0.8; // 피격 시 0.8초 무적
    this.isDead = false;

    // 금화 및 영구 업그레이드 연동 변수
    this.gold = 0;                      // 이번 런에서 획득한 금화
    this.goldMult = 1.0;                // 금화 획득량 배율
    this.hasRevive = false;             // 부활 보유 여부
    this.reviveCount = 0;               // 잔여 부활 횟수

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

    // 쉴드 쿨다운 충전 로직 (빛의 성벽 패시브)
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

    // 전장 외곽 낭떠러지/협곡 벽 밖으로 추락하지 않도록 동적 테두리 제한
    const bounds = (window.game && window.game.getWorldBoundaries) ? window.game.getWorldBoundaries() : { boundW: 1560, boundH: 1560 };
    const bW = (bounds.boundW || 1580) - 20;
    const bH = (bounds.boundH || 1580) - 20;
    this.x = Math.max(-bW, Math.min(bW, this.x));
    this.y = Math.max(-bH, Math.min(bH, this.y));
  }

  // 몬스터 처치 시 호출 (흡혈 패시브 연동)
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

    // 빛의 성벽 방벽 쉴드 방어 판정
    if (this.currentShieldStacks > 0) {
      this.currentShieldStacks -= 1;
      this.invulnerableTimer = 0.6; // 피격 무적
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

    // 복합 방어력 적용: 고정 감쇄(-armor) + 받는 피해 비율 경감(레벨당 4%, 최대 50%)
    const reductionRatio = Math.min(0.50, this.armor * 0.04);
    const reducedDamage = (amount - this.armor) * (1 - reductionRatio);
    const actualDamage = Math.max(1, Math.round(reducedDamage));
    this.hp -= actualDamage;
    this.invulnerableTimer = this.invulnerableDuration;

    sounds.playPlayerHurt();
    if (window.game && window.game.ui) {
      window.game.ui.triggerHaptic(35);
    }

    // [특성 1] 심연의 워록 피격 시 암흑 충격파 반격 (반경 140px 내 적들에게 50 광역 피해)
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

    // [특성 2] 가시갑옷 (stat_thorns) 피격 시 주변 120px 적들에게 받은 피해의 N% 가시 반사
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
        this.invulnerableTimer = 3.0; // 부활 시 3초간 무적
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

  // 로비에서 구매한 영구 업그레이드 수치 적용
  applyPermanentUpgrades(upgrades = {}) {
    if (!upgrades) return;
    // 1. 공격력 (+4% per Lv)
    if (upgrades.atk) this.atkPowerMult += upgrades.atk * 0.04;
    // 2. 쿨타임 감소 (-3% per Lv)
    if (upgrades.cooldown) this.globalCooldownMult *= (1 + upgrades.cooldown * 0.03);
    // 3. 공격 범위 (+5% per Lv)
    if (upgrades.area) this.bonusAreaMult += upgrades.area * 0.05;
    // 4. 최대 체력 (+15 per Lv)
    if (upgrades.hp) {
      this.maxHp += upgrades.hp * 15;
      this.hp = this.maxHp;
    }
    // 5. 이동 속도 (+3% per Lv)
    if (upgrades.speed) {
      const bonus = this.baseSpeed * (upgrades.speed * 0.03);
      this.baseSpeed += bonus;
      this.speed += bonus;
    }
    // 6. 체력 재생 (+0.3 HP/s per Lv)
    if (upgrades.regen) this.hpRegen += upgrades.regen * 0.3;
    // 7. 자석 반경 (+20px per Lv)
    if (upgrades.magnet) this.magnetRadius += upgrades.magnet * 20;
    // 8. 금화 획득량 (+10% per Lv)
    if (upgrades.greed) this.goldMult += upgrades.greed * 0.10;
    // 9. 부활 (1회 50% HP)
    if (upgrades.revive && upgrades.revive > 0) {
      this.hasRevive = true;
      this.reviveCount = (this.reviveCount || 0) + 1;
    }
  }

  // 모든 무기(6종 5Lv) 및 패시브(6종 MAX) 풀업 여부 검사
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

  // 레벨업 요구 경험치 곡선 (풀업 이후에는 거듭제곱 곡선으로 급격히 증가하여 레벨업 둔화)
  getNextMaxExp(level) {
    if (this.isFullyUpgraded || this.checkIsAllUpgraded()) {
      if (!this.isFullyUpgraded) {
        this.isFullyUpgraded = true;
        this.fullUpgradeLevel = level;
      }
      const extraLv = Math.max(0, level - this.fullUpgradeLevel);
      const baseAtFull = 2441 + Math.max(0, this.fullUpgradeLevel - 50) * 120;
      // 풀업 이후: 레벨업 주기가 기하급수적으로 길어지도록 1.85 거듭제곱 곡선 적용
      return Math.round(Math.max(2500, baseAtFull) + Math.pow(extraLv, 1.85) * 260);
    }

    if (level < 15) {
      return 15 + (level - 1) * 14; // Lv.1: 15, Lv.5: 71, Lv.10: 141, Lv.15: 211
    } else if (level < 30) {
      return 211 + (level - 15) * 42; // Lv.20: 421, Lv.25: 631, Lv.30: 841
    } else if (level < 50) {
      return 841 + (level - 30) * 80; // Lv.35: 1241, Lv.40: 1641, Lv.50: 2441
    } else {
      return 2441 + (level - 50) * 120;
    }
  }

  gainExp(amount, onLevelUp) {
    if (this.isDead) return;

    // 지혜의 왕관 패시브 적용 (경험치 증폭)
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
    const currentSprite = this.spriteKey || 'player';
    const drawn = assets.drawSprite(ctx, currentSprite, this.x, this.y + bobOffset - 2, 38, this.facing.x, false);

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

    // 빛의 성벽 방벽 쉴드 회전 렌더링
    if (this.currentShieldStacks > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.shieldAngle);
      for (let i = 0; i < this.currentShieldStacks; i++) {
        const a = (i * Math.PI * 2) / Math.max(1, this.currentShieldStacks);
        const sx = Math.cos(a) * (this.radius + 12);
        const sy = Math.sin(a) * (this.radius + 12);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
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

    // 공격 무기 휘두르기 및 발사 이펙트 스프라이트 렌더링 (무기 범위 증가 시 에셋 크기도 비례 확대)
    for (const anim of this.attackAnims) {
      const progress = Math.max(0, Math.min(1, 1 - (anim.timer / anim.duration)));
      const area = anim.area || 1.0;

      if (anim.type === 'sword' || anim.type === 'dagger') {
        const thrustDist = (16 + Math.sin(progress * Math.PI) * 30) * Math.sqrt(area);
        const px = this.x + Math.cos(anim.angle) * thrustDist;
        const py = this.y + Math.sin(anim.angle) * thrustDist;
        const spriteKey = anim.type === 'sword' ? 'anim_sword' : 'anim_dagger';
        const img = assets.images[spriteKey] || assets.images['anim_dagger'];
        const size = Math.round(30 * area);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(anim.angle + Math.PI / 4);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      } else if (anim.type === 'thunderBlade') {
        // [벼락검] 원의 4분의 1 (90도 = Math.PI / 2) 전격 대검 회전 베기 렌더링
        const sweepArc = anim.arc || (Math.PI / 2);
        const startAngle = anim.angle - sweepArc / 2;
        const curAngle = startAngle + progress * sweepArc;
        const swordDist = (28 + Math.sin(progress * Math.PI) * 18) * Math.sqrt(area);
        const px = this.x + Math.cos(curAngle) * swordDist;
        const py = this.y + Math.sin(curAngle) * swordDist;

        ctx.save();
        // 1. 번개 전격 90도 부채꼴 검기 잔상 궤적
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = Math.round(4 * Math.sqrt(area));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, swordDist + 12, startAngle, curAngle, false);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, swordDist + 8, startAngle, curAngle, false);
        ctx.stroke();

        // 2. 휘두르는 번개 대검 스프라이트
        const img = assets.images['anim_sword'];
        const size = Math.round(38 * area);
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
        const orbitDist = 42 * area;
        const px = this.x + Math.cos(orbitAngle) * orbitDist;
        const py = this.y + Math.sin(orbitAngle) * orbitDist;
        const img = assets.images['anim_axe'];
        const size = Math.round(36 * area);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(orbitAngle + Math.PI / 2);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      } else if (anim.type === 'whip' || anim.type === 'morningstar' || anim.type === 'morningstartempest' || anim.type === 'bladewhip') {
        const isTempest = anim.type === 'morningstartempest' || anim.type === 'bladewhip';
        const sweepArc = anim.arc || (isTempest ? 2.35 : 1.95);
        const maxRange = anim.range || ((isTempest ? 260 : 165) * area);

        // 부채꼴 호(Arc)를 따라 좌에서 우로 긁어내며 회전 스윙
        const sweepAngle = (anim.angle - sweepArc / 2) + progress * sweepArc;
        const currentDist = (36 + Math.sin(progress * Math.PI) * (maxRange - 42));

        const px = this.x + Math.cos(sweepAngle) * currentDist;
        const py = this.y + Math.sin(sweepAngle) * currentDist;

        ctx.save();
        // 1. 강철 쇠사슬 줄 궤적 (Metallic Chain Link)
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

        // 쇠사슬 점선 하이라이트 (체인 링크 효과)
        ctx.strokeStyle = isTempest ? '#fef08a' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(cx, cy, px, py);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. 채찍 끝에 달린 묵직한 모닝스타 가시 철퇴 헤드 스프라이트
        const img = assets.images['anim_whip'];
        const sz = Math.round((isTempest ? 44 : 34) * area);
        ctx.translate(px, py);
        // 철퇴가 휘둘러지며 회전하는 자체 각도
        ctx.rotate(sweepAngle + progress * Math.PI * 4);
        ctx.imageSmoothingEnabled = false;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
        } else {
          // 폴백: 가시 박힌 모닝스타 원형 렌더링
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
