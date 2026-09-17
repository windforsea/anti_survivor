// 필드 장애물 시스템: 비파괴(돌기둥) 및 파괴 가능(나무 상자) 장애물 관리

class Obstacle {
  constructor(x, y, type = 'rock') {
    this.x = x;
    this.y = y;
    this.type = type; // 'rock' (바위), 'tree' (고대 나무), 'crate' (파괴가능 나무상자)
    
    if (this.type === 'rock' || this.type === 'tree') {
      this.radius = 48; // 안부셔지는 장애물 크기 2배 (기존 24 -> 48)
      this.isDestructible = false;
      this.hp = 999999;
      this.maxHp = 999999;
    } else {
      this.radius = 20;
      this.isDestructible = true;
      this.maxHp = 22;
      this.hp = 22;
    }

    this.isDead = false;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, game) {
    if (!this.isDestructible || this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    // 타격 데미지 텍스트 팝업
    if (game && game.damageNumbers) {
      game.damageNumbers.push(new DamageNumber(this.x, this.y - 10, amount, false));
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.destroy(game);
    }
  }

  destroy(game) {
    if (this.isDead) return;
    this.isDead = true;

    sounds.playHit();

    if (!game) return;

    // 나무 파편 파티클 방출
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      game.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#78350f' : '#b45309',
        life: 0.45,
        maxLife: 0.45
      });
    }

    // 파괴 시 드랍 보상 (경험치 보석 또는 유용한 회복/특수 아이템)
    const roll = Math.random();
    if (roll < 0.35) {
      // 체력 회복 포션 (체력 회복)
      game.pickupItems.push(new PickupItem('heal', this.x, this.y));
    } else if (roll < 0.65) {
      // 대형 경험치 보석 (EXP 20)
      game.expGems.push(new ExpGem(this.x, this.y, 20));
    } else if (roll < 0.77) {
      // 자석
      game.pickupItems.push(new PickupItem('magnet', this.x, this.y));
    } else if (roll < 0.89) {
      // 폭탄
      game.pickupItems.push(new PickupItem('bomb', this.x, this.y));
    } else if (roll < 0.96) {
      // 얼음
      game.pickupItems.push(new PickupItem('freeze', this.x, this.y));
    }
  }

  update(dt) {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();

    // 장애물 하단 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.75, this.radius * 1.05, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    let imgKey = 'obstacle_rock';
    if (this.type === 'tree') imgKey = 'obstacle_tree';
    else if (this.type === 'crate') imgKey = 'obstacle_crate';

    const img = assets.images[imgKey];
    const size = this.radius * 2.2;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;

      // 피격 플래시 (파괴형 상자만)
      if (this.hitFlashTimer > 0) {
        ctx.filter = 'brightness(2.2) saturate(0.2)';
      }

      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
      ctx.filter = 'none';
    } else {
      // 폴백 드로잉
      ctx.fillStyle = this.type === 'rock' ? '#64748b' : '#92400e';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

class ObstacleManager {
  constructor(game) {
    this.game = game;
    this.chunkSize = 480;
    this.generatedChunks = new Set();
    this.obstacles = [];
  }

  reset() {
    this.generatedChunks.clear();
    this.obstacles = [];
  }

  update(dt, playerX, playerY) {
    // 플레이어 주변 넓은 청크 확인 및 사전 생성 (전장 1600px 내부)
    const currentChunkX = Math.floor(playerX / this.chunkSize);
    const currentChunkY = Math.floor(playerY / this.chunkSize);

    for (let cx = currentChunkX - 4; cx <= currentChunkX + 4; cx++) {
      for (let cy = currentChunkY - 4; cy <= currentChunkY + 4; cy++) {
        // 전장 경계(-1600 ~ 1600) 내부 및 인접 청크만 생성
        if (Math.abs(cx * this.chunkSize) > 1750 || Math.abs(cy * this.chunkSize) > 1750) continue;

        const key = `${cx},${cy}`;
        if (!this.generatedChunks.has(key)) {
          this.generatedChunks.add(key);
          this.generateChunk(cx, cy);
        }
      }
    }

    // 장애물 상태 갱신
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt);
      if (obs.isDead) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  generateChunk(cx, cy) {
    // 시작 지점(0,0 주변)은 안전 구역으로 장애물 최소화
    const isSpawnChunk = Math.abs(cx) <= 0 && Math.abs(cy) <= 0;
    
    // 단순 의사난수 생성기 (청크 좌표 기반 결정론적)
    const seed = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453) % 1;
    const count = isSpawnChunk ? 0 : Math.floor(seed * 3) + 1; // 청크당 1~3개

    const originX = cx * this.chunkSize;
    const originY = cy * this.chunkSize;

    for (let i = 0; i < count; i++) {
      const subSeedX = Math.abs(Math.sin((cx + i * 3) * 31.41 + cy * 17.13) * 23421.1) % 1;
      const subSeedY = Math.abs(Math.cos(cx * 19.87 + (cy + i * 5) * 47.61) * 31415.9) % 1;
      const typeSeed = Math.abs(Math.sin(cx * 91.1 + cy * 13.7 + i * 19.3) * 11111.1) % 1;

      const ox = originX + 50 + subSeedX * (this.chunkSize - 100);
      const oy = originY + 50 + subSeedY * (this.chunkSize - 100);

      // 시작 플레이어 스폰 위치(0,0)와 150px 이상 거리 유지
      const distToCenter = Math.hypot(ox, oy);
      if (distToCenter < 140) continue;

      // 부셔지는 장애물(나무 상자) 숫자를 반으로 축소 (약 20%만 상자 출현)
      let type = 'rock';
      if (typeSeed < 0.20) {
        type = 'crate';
      } else if (typeSeed < 0.60) {
        type = 'tree';
      } else {
        type = 'rock';
      }
      this.obstacles.push(new Obstacle(ox, oy, type));
    }
  }

  // 플레이어 및 몬스터 밀어내기 원형 충돌 판정
  resolveCollisions(entity) {
    for (const obs of this.obstacles) {
      if (obs.isDead) continue;
      const minDist = obs.radius + entity.radius;
      const dx = entity.x - obs.x;
      const dy = entity.y - obs.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;

        entity.x += pushX;
        entity.y += pushY;
      }
    }
  }

  draw(ctx, camera, viewWidth, viewHeight) {
    // 렌더링 거리를 500px 확장하여 화면 진입 시 깜빡임 없이 원거리까지 사전 렌더링
    const halfW = viewWidth / 2 + 500;
    const halfH = viewHeight / 2 + 500;

    for (const obs of this.obstacles) {
      // 화면 밖 컬링 (원거리 버퍼 적용)
      if (Math.abs(obs.x - camera.x) > halfW || Math.abs(obs.y - camera.y) > halfH) {
        continue;
      }
      obs.draw(ctx);
    }
  }
}
