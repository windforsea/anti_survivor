// 메인 게임 엔진 및 렌더링 루프

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.input = {
      keys: {},
      joystick: { active: false, x: 0, y: 0 }
    };

    this.gameState = 'PLAYING'; // 'PLAYING', 'LEVEL_UP', 'GAME_OVER', 'VICTORY'
    this.totalElapsedTime = 0;

    // 카메라
    this.camera = { x: 0, y: 0 };

    // 엔티티 컬렉션
    this.enemies = [];
    this.expGems = [];
    this.pickupItems = [];
    this.damageNumbers = [];
    this.bossProjectiles = [];
    this.particles = [];

    // 필드 상태 효과 (얼음 빙결, TNT 폭탄 플래시)
    this.freezeTimer = 0;
    this.bombFlashTimer = 0;

    // 시스템 인스턴스화
    this.player = new Player(0, 0);
    this.obstacleManager = new ObstacleManager(this);
    this.weaponManager = new WeaponManager(this.player, this);
    this.cardManager = new CardManager(this.player, this.weaponManager);
    this.ui = new UIManager(this);
    this.waveManager = new WaveManager(this);

    this.lastTime = performance.now();

    this.initCanvasResize();
    this.initInputListeners();
    this.start();
  }

  initCanvasResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
        return;
      }
      this.input.keys[e.code] = true;
      sounds.ensureContext(); // 사용자 첫 키보드 입력 시 오디오 활성화
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    window.addEventListener('pointerdown', () => {
      sounds.ensureContext(); // 모바일 터치 또는 클릭 시 오디오 활성화
    });
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.ui.showPauseModal();
    } else if (this.gameState === 'PAUSED') {
      this.resumeGame();
    }
  }

  resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.lastTime = performance.now();
      this.ui.hidePauseModal();
    }
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  restart() {
    this.gameState = 'PLAYING';
    this.totalElapsedTime = 0;
    this.enemies = [];
    this.expGems = [];
    this.pickupItems = [];
    this.damageNumbers = [];
    this.bossProjectiles = [];
    this.particles = [];
    this.freezeTimer = 0;
    this.bombFlashTimer = 0;

    this.player = new Player(0, 0);
    this.obstacleManager.reset();
    this.weaponManager = new WeaponManager(this.player, this);
    this.cardManager = new CardManager(this.player, this.weaponManager);
    this.waveManager.reset();
    this.ui.hidePauseModal();
  }

  onPlayerLevelUp(newLevel) {
    this.gameState = 'LEVEL_UP';
    const cards = this.cardManager.generateCards();
    this.ui.showCardSelection(cards, (selectedCard) => {
      selectedCard.apply();
      this.gameState = 'PLAYING';
    });
  }

  // 보스 격파 즉시 1회 무료 업그레이드 보상
  triggerBossRewardCard() {
    this.gameState = 'LEVEL_UP';
    const cards = this.cardManager.generateCards();
    this.ui.showCardSelection(cards, (selectedCard) => {
      selectedCard.apply();
      this.gameState = 'PLAYING';
    }, true);
  }

  // 필드 특수 드랍 아이템 발동
  applyPickupItem(type) {
    if (type === 'heal') {
      // 체력 포션: 체력 35 즉시 회복
      sounds.playLevelUp();
      const healAmt = 35;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 14, `+${healAmt}`, false, '#22c55e'));
      this.addParticles(this.player.x, this.player.y, '#22c55e', 18);
    } else if (type === 'magnet') {
      // 자석: 전체 맵의 모든 경험치 보석 즉시 진공 회수
      sounds.playLevelUp();
      for (const gem of this.expGems) {
        gem.magnetized = true;
      }
      this.addParticles(this.player.x, this.player.y, '#38bdf8', 20);
    } else if (type === 'bomb') {
      // 폭탄(TNT): 전체 적 화면 폭발 플래시 및 광역 피해 (일반 몬스터 600, 보스는 최대 HP의 10% 또는 최대 250으로 제한)
      sounds.playShotgun();
      this.bombFlashTimer = 0.28;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dmg = enemy.isBoss ? Math.min(250, Math.round(enemy.maxHp * 0.10)) : 600;
        enemy.takeDamage(dmg, null, 0);
      }
      this.addParticles(this.player.x, this.player.y, '#ef4444', 28);
    } else if (type === 'freeze') {
      // 얼음(눈결정): 모든 적의 이동 및 공격 4.5초간 완전 정지
      sounds.playBossAlarm();
      this.freezeTimer = 4.5;
      this.addParticles(this.player.x, this.player.y, '#a5f3fc', 24);
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';
    const m = Math.floor(this.totalElapsedTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.totalElapsedTime % 60).toString().padStart(2, '0');
    this.ui.showGameOver({
      time: `${m}:${s}`,
      stage: this.waveManager.currentStage,
      level: this.player.level,
      kills: this.player.totalKills
    });
  }

  triggerVictory() {
    this.gameState = 'VICTORY';
    const m = Math.floor(this.totalElapsedTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.totalElapsedTime % 60).toString().padStart(2, '0');
    this.ui.showVictory({
      time: `${m}:${s}`,
      level: this.player.level,
      kills: this.player.totalKills
    });
  }

  addParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.gameState === 'PLAYING') {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.totalElapsedTime += dt;

    // 0. 필드 장애물 청크 갱신 및 상태 업데이트
    this.obstacleManager.update(dt, this.player.x, this.player.y);

    // 1. 플레이어 업데이트
    this.player.update(dt, this.input);
    this.obstacleManager.resolveCollisions(this.player);
    if (this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    // 카메라 플레이어 중심 추적
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;

    // 상태 타이머 차감
    if (this.bombFlashTimer > 0) this.bombFlashTimer -= dt;
    const isFrozen = this.freezeTimer > 0;
    if (isFrozen) this.freezeTimer -= dt;

    // 2. 웨이브 및 몬스터 스폰 업데이트
    this.waveManager.update(dt);

    // 3. 무기 발사 및 히트박스 판정
    this.weaponManager.update(dt, this.enemies);

    // 4. 몬스터 업데이트 & 사망 처리 (빙결 상태 시 이동 및 공격 일시 정지)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!isFrozen) {
        if (enemy.isBoss) {
          enemy.update(dt, this.player, this.enemies, this.bossProjectiles);
        } else {
          enemy.update(dt, this.player, this.enemies);
        }
        this.obstacleManager.resolveCollisions(enemy);
      }

      if (enemy.isDead) {
        // 경험치 보석 드랍 (뒤 5종 마물은 대량 경험치 보석)
        this.expGems.push(new ExpGem(enemy.x, enemy.y, enemy.exp));

        // 특수 아이템 드랍 (일반몹 약 1.67%로 2/3 하향 조정, 보스는 100% 확정 드랍)
        const dropChance = enemy.isBoss ? 1.0 : 0.0167;
        if (Math.random() < dropChance) {
          const types = ['magnet', 'bomb', 'freeze'];
          const picked = types[Math.floor(Math.random() * types.length)];
          this.pickupItems.push(new PickupItem(picked, enemy.x, enemy.y));
        }

        // 사망 파티클
        this.addParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 24 : 8);
        this.player.totalKills += 1;
        this.enemies.splice(i, 1);
      }
    }

    // 5. 보스 투사체 업데이트 (빙결 상태 시 궤적 일시 정지)
    if (!isFrozen) {
      for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
        const bp = this.bossProjectiles[i];
        const removed = bp.update(dt, this.player);
        if (removed) {
          this.bossProjectiles.splice(i, 1);
        }
      }
    }

    // 6. 특수 드랍 아이템(자석, 폭탄, 얼음) 업데이트 및 습득 판정
    for (let i = this.pickupItems.length - 1; i >= 0; i--) {
      const item = this.pickupItems[i];
      const collected = item.update(dt, this.player);
      if (item.life <= 0) {
        this.pickupItems.splice(i, 1);
        continue;
      }
      if (collected) {
        this.applyPickupItem(item.type);
        this.pickupItems.splice(i, 1);
      }
    }

    // 7. 경험치 보석 흡수 판정
    for (let i = this.expGems.length - 1; i >= 0; i--) {
      const gem = this.expGems[i];
      const collected = gem.update(dt, this.player);
      if (collected) {
        sounds.playGem();
        this.player.gainExp(gem.value, (newLv) => this.onPlayerLevelUp(newLv));
        this.expGems.splice(i, 1);
      }
    }

    // 8. 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 9. 데미지 텍스트 업데이트
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.update(dt);
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // 10. HUD 갱신
    this.ui.updateHUD(this.player, this.waveManager, this.totalElapsedTime);
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 배경 클리어
    ctx.fillStyle = '#0c0f1d';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // 카메라 좌표계 변환 (플레이어가 항상 중앙)
    ctx.translate(Math.round(width / 2 - this.camera.x), Math.round(height / 2 - this.camera.y));

    // 무한 격자 타일 던전 바닥 렌더링
    this.renderFloorGrid(ctx);

    // 필드 장애물 (돌기둥, 나무 상자)
    this.obstacleManager.draw(ctx, this.camera, width, height);

    // 1. 바닥 도트 장판
    this.weaponManager.draw(ctx);

    // 2. 특수 아이템 드랍 (자석, 폭탄, 얼음)
    for (const item of this.pickupItems) {
      item.draw(ctx);
    }

    // 3. 경험치 보석
    for (const gem of this.expGems) {
      gem.draw(ctx);
    }

    // 4. 몬스터
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // 5. 플레이어
    this.player.draw(ctx);

    // 6. 보스 투사체
    for (const bp of this.bossProjectiles) {
      bp.draw(ctx);
    }

    // 7. 파티클
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 8. 데미지 숫자 텍스트
    for (const dn of this.damageNumbers) {
      dn.draw(ctx);
    }

    ctx.restore();

    // 화면 오버레이 이펙트 (빙결, 폭탄 플래시)
    if (this.freezeTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(165, 243, 252, 0.16)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, width, height);
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.fillText(`❄️ ENEMY FROZEN (${this.freezeTimer.toFixed(1)}s) ❄️`, width / 2, 74);
      ctx.restore();
    }

    if (this.bombFlashTimer > 0) {
      ctx.save();
      const flashAlpha = Math.min(0.65, this.bombFlashTimer * 2.6);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  renderFloorGrid(ctx) {
    const tileSize = 64;
    const halfW = this.canvas.width / 2;
    const halfH = this.canvas.height / 2;
    const startX = Math.floor((this.camera.x - halfW) / tileSize) * tileSize;
    const endX = this.camera.x + halfW + tileSize;
    const startY = Math.floor((this.camera.y - halfH) / tileSize) * tileSize;
    const endY = this.camera.y + halfH + tileSize;

    const floorTile = assets.images['tile_floor'];

    if (floorTile && floorTile.complete && floorTile.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      for (let x = startX; x <= endX; x += tileSize) {
        for (let y = startY; y <= endY; y += tileSize) {
          ctx.drawImage(floorTile, x, y, tileSize, tileSize);
        }
      }
    } else {
      ctx.strokeStyle = '#1a1f36';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += tileSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += tileSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }
  }
}

// 게임 기동 및 다크 판타지 에셋 로드
window.addEventListener('load', () => {
  assets.loadAll(() => {
    console.log('⚔️ 다크 판타지 픽셀 아트 에셋 로드 완료!');
  });
  window.game = new Game();
});
