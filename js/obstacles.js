// 필드 장애물 시스템: 비파괴(돌기둥) 및 파괴 가능(나무 상자) 장애물 관리

class Obstacle {
  constructor(x, y, type = 'rock') {
    this.x = x;
    this.y = y;
    this.type = type; // 'rock', 'tree', 'crate' (월드 1) / 'reefRock', 'seaKelp', 'sunkenChest' (월드 2)
    
    if (this.type === 'rock' || this.type === 'tree' || this.type === 'reefRock') {
      this.radius = 48; // 비파괴 대형 장애물 (48px)
      this.isDestructible = false;
      this.hp = 999999;
      this.maxHp = 999999;
      this.isPassable = false;
    } else if (this.type === 'seaKelp') {
      // 🌿 거대 해초: 물풀이므로 플레이어와 마물이 헤엄쳐 통과 가능 (끼임 완벽 방지)
      this.radius = 28;
      this.isDestructible = false;
      this.hp = 999999;
      this.maxHp = 999999;
      this.isPassable = true;
    } else {
      this.radius = 20;
      this.isDestructible = true;
      this.maxHp = 22;
      this.hp = 22;
      this.isPassable = false;
    }

    this.isDead = false;
    this.hitFlashTimer = 0;
    this.kelpWaveTimer = Math.random() * Math.PI * 2;
  }

  takeDamage(amount, game) {
    if (!this.isDestructible || this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    // 프레임 최적화를 위해 장애물 일반 데미지 표기 생략
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

    // 파괴 시 드랍 보상 (기존 대비 50% 수준으로 드랍률 하향)
    const safePos = game.obstacleManager ? game.obstacleManager.getUnblockedPosition(this.x, this.y, 16) : { x: this.x, y: this.y };
    const roll = Math.random();
    if (roll < 0.115) {
      // 체력 회복 포션 (기존 23% -> 11.5%로 반감)
      game.pickupItems.push(new PickupItem('heal', safePos.x, safePos.y));
    } else if (roll < 0.35) {
      // 대형 경험치 보석 (EXP 20)
      game.expGems.push(new ExpGem(safePos.x, safePos.y, 20));
    } else if (roll < 0.46) {
      // 금화 자루 (5~15G, 기존 22% -> 11%로 반감)
      const goldVal = Math.floor(Math.random() * 11) + 5;
      game.pickupItems.push(new PickupItem('gold', safePos.x, safePos.y, goldVal));
    } else if (roll < 0.50) {
      // 자석 (기존 8% -> 4%로 반감)
      game.pickupItems.push(new PickupItem('magnet', safePos.x, safePos.y));
    } else if (roll < 0.54) {
      // 폭탄 (기존 8% -> 4%로 반감)
      game.pickupItems.push(new PickupItem('bomb', safePos.x, safePos.y));
    } else if (roll < 0.565) {
      // 얼음 (기존 5% -> 2.5%로 반감)
      game.pickupItems.push(new PickupItem('freeze', safePos.x, safePos.y));
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

    if (img && img.complete && img.naturalWidth > 0 && (this.type === 'rock' || this.type === 'tree' || this.type === 'crate')) {
      ctx.imageSmoothingEnabled = false;

      // 피격 플래시 (파괴형 상자만)
      if (this.hitFlashTimer > 0) {
        ctx.filter = 'brightness(2.2) saturate(0.2)';
      }

      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
      ctx.filter = 'none';
    } else if (this.type === 'reefRock') {
      // 🌊 [월드 2] 심해 산호 암초 바위 (비파괴형 대형 암석)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 산호 돌출부 및 발광 따개비
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(this.x - 14, this.y - 12, 10, 0, Math.PI * 2);
      ctx.arc(this.x + 16, this.y - 8, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f43f5e'; // 핑크 산호 포인트
      ctx.beginPath();
      ctx.arc(this.x + 2, this.y + 12, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'seaKelp') {
      // 🌿 [월드 2] 거대 해초 숲 (비파괴형 대형 해초 기둥)
      const time = Date.now() * 0.0025 + this.kelpWaveTimer;
      const sway = Math.sin(time) * 12;

      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(this.x, this.y + 16, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 물결치듯 흔들리는 해초 줄기들
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - 16, this.y + 20);
      ctx.quadraticCurveTo(this.x - 8 + sway, this.y - 10, this.x - 14 + sway * 1.5, this.y - 42);
      ctx.stroke();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(this.x + 2, this.y + 22);
      ctx.quadraticCurveTo(this.x + 12 + sway * 0.8, this.y - 15, this.x + 4 + sway * 1.8, this.y - 48);
      ctx.stroke();

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(this.x + 18, this.y + 18);
      ctx.quadraticCurveTo(this.x + 24 - sway, this.y - 8, this.x + 18 + sway, this.y - 36);
      ctx.stroke();
    } else if (this.type === 'sunkenChest') {
      // 📦 [월드 2] 침몰선 보물상자 (파괴 가능한 궤짝)
      if (this.hitFlashTimer > 0) {
        ctx.filter = 'brightness(2.2) saturate(0.2)';
      }
      ctx.fillStyle = '#0f766e'; // 청록빛 침몰선 목재
      ctx.fillRect(this.x - 18, this.y - 14, 36, 28);
      ctx.strokeStyle = '#facc15'; // 금빛 쇠테두리
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 18, this.y - 14, 36, 28);
      ctx.fillStyle = '#fde047'; // 자물쇠
      ctx.fillRect(this.x - 4, this.y - 2, 8, 8);
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

  getBoundaries() {
    // 월드 1: 사각 부유섬 (1520 x 1520 이내) / 월드 2: 가로 협곡 (2850 x 1050 이내)
    if (this.game && this.game.currentWorld === 2) {
      return { boundW: 2850, boundH: 525 };
    }
    return { boundW: 1520, boundH: 1520 };
  }

  update(dt, playerX, playerY) {
    const { boundW, boundH } = this.getBoundaries();
    const currentChunkX = Math.floor(playerX / this.chunkSize);
    const currentChunkY = Math.floor(playerY / this.chunkSize);

    for (let cx = currentChunkX - 4; cx <= currentChunkX + 4; cx++) {
      for (let cy = currentChunkY - 4; cy <= currentChunkY + 4; cy++) {
        // 전장 바운더리 벗어난 청크는 아예 생성 검사 제외
        if (Math.abs(cx * this.chunkSize) > boundW + this.chunkSize || Math.abs(cy * this.chunkSize) > boundH + this.chunkSize) {
          continue;
        }

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
    const { boundW, boundH } = this.getBoundaries();
    const isWorld2 = this.game && this.game.currentWorld === 2;
    
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

      // 🛡️ [핵심 버그 수정]: 맵 바운더리 밖으로 벗어나는 장애물 스폰 원천 차단!
      if (Math.abs(ox) > boundW || Math.abs(oy) > boundH) continue;

      // 시작 플레이어 스폰 위치(0,0)와 150px 이상 거리 유지
      const distToCenter = Math.hypot(ox, oy);
      if (distToCenter < 140) continue;

      // 월드별 장애물 타입 분기
      let type = isWorld2 ? 'reefRock' : 'rock';
      if (typeSeed < 0.20) {
        type = isWorld2 ? 'sunkenChest' : 'crate';
      } else if (typeSeed < 0.60) {
        type = isWorld2 ? 'seaKelp' : 'tree';
      } else {
        type = isWorld2 ? 'reefRock' : 'rock';
      }
      this.obstacles.push(new Obstacle(ox, oy, type));
    }
  }

  // 플레이어 및 몬스터 밀어내기 원형 충돌 판정 (공중 몬스터는 장애물 무시 관통)
  resolveCollisions(entity) {
    if (entity.isFlying) return; // 공중 비행 엔티티는 장애물 통과

    for (const obs of this.obstacles) {
      if (obs.isDead || obs.isPassable) continue;
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

  // 아이템/보석이 장애물(비파괴 바위, 나무 등) 내부에 겹쳐서 습득 불가능한 상태가 되지 않도록 안전 위치 계산
  getUnblockedPosition(x, y, itemRadius = 14) {
    let outX = x;
    let outY = y;
    for (const obs of this.obstacles) {
      if (obs.isDead) continue;
      const dist = Math.hypot(outX - obs.x, outY - obs.y);
      const minDist = obs.radius + itemRadius + 14; // 여유 안전 거리 14px
      if (dist < minDist) {
        if (dist < 0.1) {
          outX = obs.x + minDist;
          outY = obs.y;
        } else {
          outX = obs.x + ((outX - obs.x) / dist) * minDist;
          outY = obs.y + ((outY - obs.y) / dist) * minDist;
        }
      }
    }
    return { x: outX, y: outY };
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
