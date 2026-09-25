// 메인 게임 엔진 및 60 FPS 무렉 수묵화 렌더링 루프

class Game {

  // 전통 닥종이(한지) 및 수묵 텍스처 오프스크린 1회 베이킹 (프레임 부하 0%)
  initHanjiTexture() {
    // 1. 월드 1용 깊은 흑회색 닥종이(한지) 수묵 텍스처 (512x512)
    const c1 = document.createElement('canvas');
    c1.width = 512;
    c1.height = 512;
    const ctx1 = c1.getContext('2d');
    
    // 깊이 있는 조선 닥종이 흑회색 바탕
    ctx1.fillStyle = '#141724';
    ctx1.fillRect(0, 0, 512, 512);

    // 굵고 옅은 수묵 먹물 번짐 농담 (Shades of Ink) 4구역
    const spots = [
      { x: 130, y: 130, r: 120, color: 'rgba(8, 10, 16, 0.75)' },
      { x: 380, y: 370, r: 140, color: 'rgba(10, 12, 20, 0.70)' },
      { x: 390, y: 120, r: 110, color: 'rgba(28, 34, 52, 0.40)' },
      { x: 120, y: 390, r: 130, color: 'rgba(9, 11, 18, 0.72)' }
    ];
    for (const sp of spots) {
      const g = ctx1.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r);
      g.addColorStop(0, sp.color);
      g.addColorStop(1, 'transparent');
      ctx1.fillStyle = g;
      ctx1.beginPath();
      ctx1.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx1.fill();
    }

    // 화선지 고유의 섬유질 붓결 텍스처
    ctx1.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 600; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const rw = 2 + Math.random() * 10;
      const rh = 1 + Math.random() * 2;
      ctx1.fillRect(rx, ry, rw, rh);
    }

    // 단아하고 뚜렷한 조선 전통 창살 묵선 격자 (256x256 타일링)
    ctx1.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx1.lineWidth = 1.5;
    ctx1.strokeRect(0.5, 0.5, 256, 256);
    ctx1.strokeRect(256.5, 0.5, 256, 256);
    ctx1.strokeRect(0.5, 256.5, 256, 256);
    ctx1.strokeRect(256.5, 256.5, 256, 256);

    // 격자 모서리 전통 십자 묵흔
    ctx1.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx1.lineWidth = 1;
    const crosses = [[0, 0], [256, 0], [512, 0], [0, 256], [256, 256], [512, 256], [0, 512], [256, 512], [512, 512]];
    for (const [cx, cy] of crosses) {
      ctx1.beginPath();
      ctx1.moveTo(cx - 8, cy); ctx1.lineTo(cx + 8, cy);
      ctx1.moveTo(cx, cy - 8); ctx1.lineTo(cx, cy + 8);
      ctx1.stroke();
    }

    this.hanjiPatternCanvas = c1;

    // 2. 월드 2용 심해 옥빛 수묵 텍스처 (512x512)
    const c2 = document.createElement('canvas');
    c2.width = 512;
    c2.height = 512;
    const ctx2 = c2.getContext('2d');
    ctx2.fillStyle = '#061726';
    ctx2.fillRect(0, 0, 512, 512);

    const tealSpots = [
      { x: 150, y: 180, r: 140, color: 'rgba(4, 47, 54, 0.65)' },
      { x: 350, y: 340, r: 160, color: 'rgba(8, 51, 68, 0.60)' }
    ];
    for (const sp of tealSpots) {
      const g = ctx2.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r);
      g.addColorStop(0, sp.color);
      g.addColorStop(1, 'transparent');
      ctx2.fillStyle = g;
      ctx2.beginPath();
      ctx2.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.strokeStyle = 'rgba(14, 116, 144, 0.40)';
    ctx2.lineWidth = 1.5;
    ctx2.strokeRect(0.5, 0.5, 256, 256);
    ctx2.strokeRect(256.5, 0.5, 256, 256);

    this.tealInkPatternCanvas = c2;
  }

  // 화면 리사이즈 시 다크 잉크 비네팅 마스크 1회 오프스크린 베이킹 (GC 0%, 렌더 렉 0%)
  updateInkVignette(width, height) {
    if (!this.vignetteCanvas || this.vignetteCanvas.width !== width || this.vignetteCanvas.height !== height) {
      const vc = document.createElement('canvas');
      vc.width = width;
      vc.height = height;
      const vctx = vc.getContext('2d');
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(cx, cy);

      const grad = vctx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.68, 'rgba(4, 6, 10, 0.42)');
      grad.addColorStop(1, 'rgba(2, 3, 6, 0.88)');

      vctx.fillStyle = grad;
      vctx.fillRect(0, 0, width, height);
      this.vignetteCanvas = vc;
    }
  }

  constructor() {
    this.initHanjiTexture();
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.input = {
      keys: {},
      joystick: { active: false, x: 0, y: 0 }
    };

    this.gameState = 'PLAYING';
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
    this.currentWorld = 1;
    this.cosmicStars = [];
    this.stardustStream = [];
    this.underwaterBubbles = [];
    this.initEnvironmentEffects(1);

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
    this.gameState = 'LOBBY';
    this.ui.showLobby();
  }

  initCosmicStars() {
    this.cosmicStars = [];
    for (let i = 0; i < 320; i++) {
      this.cosmicStars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 6000,
        size: Math.random() < 0.2 ? (Math.random() * 2.2 + 1.2) : (Math.random() * 1.5 + 0.5),
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1.2 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.25 ? '#38bdf8' : (Math.random() < 0.4 ? '#c084fc' : (Math.random() < 0.55 ? '#fef08a' : '#ffffff'))
      });
    }
  }

  getWorldBoundaries() {
    if (this.currentWorld === 2) {
      return { boundW: 2950, boundH: 525 };
    }
    return { boundW: 1580, boundH: 1580 };
  }

  initEnvironmentEffects(worldNum = 1) {
    if (worldNum === 2) {
      this.initUnderwaterBubbles();
    } else {
      this.initCosmicStars();
      this.initStardustStream();
    }
  }

  // 월드 2 심해 기포 고정 객체 풀 (90개 고정 재사용으로 GC 렉 차단)
  initUnderwaterBubbles() {
    this.underwaterBubbles = [];
    for (let i = 0; i < 90; i++) {
      this.underwaterBubbles.push({
        x: (Math.random() - 0.5) * 5900,
        y: (Math.random() - 0.5) * 1050,
        r: Math.random() * 3.5 + 1.2,
        speed: 25 + Math.random() * 55,
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.5 + Math.random() * 2.5
      });
    }
  }

  // 월드 1 우주 에테르 성운 먼지 스트림 풀 (40개 고정 재사용)
  initStardustStream() {
    this.stardustStream = [];
    for (let i = 0; i < 40; i++) {
      this.stardustStream.push({
        x: (Math.random() - 0.5) * 3160,
        y: (Math.random() - 0.5) * 3160,
        r: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        alpha: 0.2 + Math.random() * 0.5,
        color: Math.random() < 0.5 ? '#c084fc' : '#38bdf8'
      });
    }
  }

  initCanvasResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.updateInkVignette(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      sounds.ensureContext();

      if (this.ui && this.ui.isCardModalOpen) {
        const handled = this.ui.handleCardModalKeydown(e);
        if (handled) return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
        return;
      }
      this.input.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    window.addEventListener('pointerdown', () => {
      sounds.ensureContext();
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

  startRun() {
    this.startRunWithCharacter(this.currentCharacter || 'knight');
  }

  startRunWithCharacter(charType = 'knight') {
    this.startRunWithCharacterAndStage(charType, this.currentWorld || 1);
  }

  startRunWithCharacterAndStage(charType = 'knight', worldNum = 1) {
    this.currentWorld = worldNum;
    this.currentCharacter = charType;
    this.restart(charType, worldNum);
  }

  goToLobby() {
    this.gameState = 'LOBBY';
    if (this.ui) {
      this.ui.hideGameOver();
      this.ui.hideVictory();
      this.ui.hidePauseModal();
      this.ui.hideCharacterSelect();
      if (this.ui.hideStageSelect) this.ui.hideStageSelect();
      this.ui.showChampionBanner();
      this.ui.showLobby();
    }
  }

  applyUpgradesFromSave() {
    try {
      const data = saveManager.load();
      if (data && data.upgrades) {
        this.player.applyPermanentUpgrades(data.upgrades);
      }
    } catch (e) {
      console.warn('영구 업그레이드 로드 실패:', e);
    }
  }

  restart(charType = this.currentCharacter || 'knight', worldNum = this.currentWorld || 1) {
    this.currentCharacter = charType;
    this.currentWorld = worldNum;
    this.gameState = 'PLAYING';
    this.totalElapsedTime = 0;
    this.enemies = [];
    this.expGems = [];
    this.pickupItems = [];
    this.damageNumbers = [];
    this.bossProjectiles = [];
    this.particles = [];
    this.initEnvironmentEffects(worldNum);
    this.freezeTimer = 0;
    this.bombFlashTimer = 0;

    this.player = new Player(0, 0, charType);
    this.applyUpgradesFromSave();
    this.obstacleManager.reset(worldNum);
    this.weaponManager = new WeaponManager(this.player, this);
    this.cardManager = new CardManager(this.player, this.weaponManager);
    if (this.waveManager.setWorld) {
      this.waveManager.setWorld(worldNum);
    } else {
      this.waveManager.reset();
    }
    if (this.ui) {
      this.ui.hidePauseModal();
      this.ui.hideLobby();
      this.ui.hideCharacterSelect();
      if (this.ui.hideStageSelect) this.ui.hideStageSelect();
      this.ui.hideGameOver();
      this.ui.hideVictory();
    }

    const startWeaponMap = {
      knight: 'sword',
      mage: 'flamePillar',
      assassin: 'chakram',
      cleric: 'holyCross',
      sylph: 'windBow',
      malakar: 'shadowOrb'
    };
    const weaponKey = startWeaponMap[charType] || 'sword';
    this.weaponManager.unlockWeapon(weaponKey);
    this.lastTime = performance.now();
  }

  presentStartingWeaponSelection() {
    this.gameState = 'LEVEL_UP';
    const render = () => {
      const cards = this.cardManager.generateStartingWeaponCards();
      this.ui.showCardSelection(
        cards,
        (selectedCard) => {
          selectedCard.apply();
          this.gameState = 'PLAYING';
          this.lastTime = performance.now();
        },
        () => {
          if (this.player.rerollCount > 0) {
            this.player.rerollCount -= 1;
            render();
          }
        },
        null,
        false,
        true
      );
    };
    render();
  }

  presentCardSelection(isBossReward = false) {
    this.gameState = 'LEVEL_UP';
    const render = () => {
      const cards = this.cardManager.generateCards();
      this.ui.showCardSelection(
        cards,
        (selectedCard) => {
          selectedCard.apply();
          this.gameState = 'PLAYING';
        },
        () => {
          if (this.player.rerollCount > 0) {
            this.player.rerollCount -= 1;
            render();
          }
        },
        () => {
          const healAmt = 20;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
          this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 14, `+${healAmt}`, false, '#22c55e'));
          this.addParticles(this.player.x, this.player.y, '#22c55e', 14);
          this.gameState = 'PLAYING';
        },
        isBossReward
      );
    };
    render();
  }

  onPlayerLevelUp(newLevel) {
    this.presentCardSelection(false);
  }

  triggerBossRewardCard() {
    this.presentCardSelection(true);
  }

  applyPickupItem(item) {
    const type = typeof item === 'string' ? item : item.type;

    if (type === 'heal') {
      sounds.playLevelUp();
      const healAmt = 10;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 14, `+${healAmt}`, false, '#22c55e'));
      this.addParticles(this.player.x, this.player.y, '#22c55e', 18);
    } else if (type === 'magnet') {
      sounds.playLevelUp();
      for (const gem of this.expGems) {
        gem.magnetized = true;
      }
      for (const p of this.pickupItems) {
        if (p.type === 'gold') {
          p.magnetized = true;
        }
      }
      this.addParticles(this.player.x, this.player.y, '#38bdf8', 20);
    } else if (type === 'bomb') {
      sounds.playShotgun();
      this.bombFlashTimer = 0.28;
      const bombRadius = Math.min(this.canvas.width, this.canvas.height) * (2 / 3);
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist <= bombRadius + enemy.radius) {
          const dmg = enemy.isBoss ? Math.min(250, Math.round(enemy.maxHp * 0.10)) : 600;
          enemy.takeDamage(dmg, null, 0);
        }
      }
      this.addParticles(this.player.x, this.player.y, '#ef4444', 36);
    } else if (type === 'freeze') {
      sounds.playBossAlarm();
      this.freezeTimer = 4.5;
      this.addParticles(this.player.x, this.player.y, '#a5f3fc', 24);
    } else if (type === 'gold') {
      const rawVal = item.goldValue || 1;
      const earned = Math.max(1, Math.round(rawVal * (this.player.goldMult || 1.0)));
      this.player.gold = (this.player.gold || 0) + earned;
      sounds.playGem();
      this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 16, `+${earned}G`, false, '#fbbf24'));
      this.addParticles(this.player.x, this.player.y, '#f59e0b', 12);
    }
  }

  saveEarnedGold() {
    try {
      const earned = this.player.gold || 0;
      saveManager.addGold(earned);
    } catch (e) {
      console.warn('골드 저장 실패:', e);
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';
    this.saveEarnedGold();
    const m = Math.floor(this.totalElapsedTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.totalElapsedTime % 60).toString().padStart(2, '0');
    this.ui.showGameOver({
      time: `${m}:${s}`,
      stage: this.waveManager.currentStage,
      level: this.player.level,
      kills: this.player.totalKills,
      gold: this.player.gold || 0
    });
  }

  triggerVictory() {
    this.gameState = 'VICTORY';
    this.saveEarnedGold();
    const m = Math.floor(this.totalElapsedTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.totalElapsedTime % 60).toString().padStart(2, '0');
    this.ui.showVictory({
      time: `${m}:${s}`,
      timeSeconds: Math.floor(this.totalElapsedTime),
      level: this.player.level,
      kills: this.player.totalKills,
      gold: this.player.gold || 0,
      hero: this.player.characterType || 'knight'
    });
  }

  addParticles(x, y, color, count = 6) {
    // [무렉 아키텍처] 파티클 하드캡 및 동적 감쇠(LOD)
    const curLen = this.particles.length;
    if (curLen >= 120) return; // 120개 도달 시 신규 파티클 생성 완전 차단 (프레임 방어)
    let effCount = count;
    if (curLen >= 80) effCount = Math.max(1, Math.floor(count * 0.5)); // 80개 이상 시 50% 감쇠

    for (let i = 0; i < effCount; i++) {
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

    if (this.currentWorld === 2 && this.underwaterBubbles) {
      for (const b of this.underwaterBubbles) {
        b.y -= b.speed * dt;
        b.phase += b.wobbleSpeed * dt;
        b.x += Math.sin(b.phase) * 12 * dt;
        if (b.y < -1050) {
          b.y = 1050;
          b.x = (Math.random() - 0.5) * 5900;
        }
      }
    }

    this.obstacleManager.update(dt, this.player.x, this.player.y);

    this.player.update(dt, this.input);
    this.obstacleManager.resolveCollisions(this.player);

    const { boundW, boundH } = this.getWorldBoundaries();
    this.player.x = Math.max(-boundW, Math.min(boundW, this.player.x));
    this.player.y = Math.max(-boundH, Math.min(boundH, this.player.y));

    if (this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    this.camera.x = this.player.x;
    this.camera.y = this.player.y;

    if (this.bombFlashTimer > 0) this.bombFlashTimer -= dt;
    const isFrozen = this.freezeTimer > 0;
    if (isFrozen) this.freezeTimer -= dt;

    this.waveManager.update(dt);
    this.weaponManager.update(dt, this.enemies);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!isFrozen) {
        enemy.update(dt, this.player, this.enemies, this.bossProjectiles);
        if (!enemy.isFlying) {
          this.obstacleManager.resolveCollisions(enemy);
        }
      }

      if (!enemy.isFlying && !enemy.isBoss) {
        enemy.x = Math.max(-boundW, Math.min(boundW, enemy.x));
        enemy.y = Math.max(-boundH, Math.min(boundH, enemy.y));
      }

      if (enemy.isDead) {
        if (enemy.reviveState === 1) {
          continue;
        }

        if (enemy.typeKey === 'slime' && !enemy.isMini) {
          const parentScale = (typeof enemy.hpScale === 'number' && !isNaN(enemy.hpScale)) ? enemy.hpScale : 1.0;
          for (let s = -1; s <= 1; s += 2) {
            const mini = new Enemy('miniSlime', enemy.x + s * 16, enemy.y + (Math.random() - 0.5) * 12, parentScale * 0.7);
            mini.isMini = true;
            this.enemies.push(mini);
          }
        }

        const clampX = Math.max(-boundW + 40, Math.min(boundW - 40, enemy.x));
        const clampY = Math.max(-boundH + 40, Math.min(boundH - 40, enemy.y));
        const safePos = this.obstacleManager ? this.obstacleManager.getUnblockedPosition(clampX, clampY, 14) : { x: clampX, y: clampY };

        this.expGems.push(new ExpGem(safePos.x, safePos.y, enemy.exp));

        const dropBonus = 1 + (this.player.dropRateBonus || 0);
        const itemDropChance = enemy.isBoss ? 1.0 : (0.0055 * dropBonus);
        if (Math.random() < itemDropChance) {
          const types = ['magnet', 'bomb', 'freeze'];
          const picked = types[Math.floor(Math.random() * types.length)];
          this.pickupItems.push(new PickupItem(picked, safePos.x, safePos.y));
        }

        const goldDropChance = enemy.isBoss ? 1.0 : (0.0055 * dropBonus);
        if (Math.random() < goldDropChance) {
          const goldVal = enemy.isBoss ? 50 : Math.floor(Math.random() * 3) + 1;
          this.pickupItems.push(new PickupItem('gold', safePos.x, safePos.y, goldVal));
        }

        this.addParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 24 : 8);
        this.player.onKillEnemy(enemy);
        sounds.playKill();

        if (enemy.isRedReaper || enemy.bossStage === 99) {
          this.triggerVictory();
        }

        this.enemies.splice(i, 1);
      }
    }

    if (!isFrozen) {
      for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
        const bp = this.bossProjectiles[i];
        const removed = bp.update(dt, this.player);
        if (removed) {
          this.bossProjectiles.splice(i, 1);
        }
      }
    }

    for (let i = this.pickupItems.length - 1; i >= 0; i--) {
      const item = this.pickupItems[i];
      const collected = item.update(dt, this.player);
      if (collected) {
        this.applyPickupItem(item);
        this.pickupItems.splice(i, 1);
      }
    }

    for (let i = this.expGems.length - 1; i >= 0; i--) {
      const gem = this.expGems[i];
      const collected = gem.update(dt, this.player);
      if (collected) {
        sounds.playGem();
        this.player.gainExp(gem.value, (newLv) => this.onPlayerLevelUp(newLv));
        this.expGems.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // [무렉 아키텍처] 크리티컬 이펙트 최대 30개 상한 제한
    if (this.damageNumbers.length > 30) {
      this.damageNumbers.splice(0, this.damageNumbers.length - 30);
    }
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.update(dt);
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    this.ui.updateHUD(this.player, this.waveManager, this.totalElapsedTime);
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.fillStyle = this.currentWorld === 2 ? '#020813' : '#030308';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(Math.round(width / 2 - this.camera.x), Math.round(height / 2 - this.camera.y));

    if (this.currentWorld === 2) {
      this.renderDeepSeaSpace(ctx);
      this.renderTrenchFloorGrid(ctx);
      this.drawTrenchBoundary(ctx);
    } else {
      this.renderCosmicSpace(ctx);
      this.renderFloorGrid(ctx);
      this.drawWorldBoundary(ctx);
    }

    this.obstacleManager.draw(ctx, this.camera, width, height);
    this.weaponManager.draw(ctx);

    const halfW = width / 2;
    const halfH = height / 2;
    const cMargin = 90;
    const vMinX = this.camera.x - halfW - cMargin;
    const vMaxX = this.camera.x + halfW + cMargin;
    const vMinY = this.camera.y - halfH - cMargin;
    const vMaxY = this.camera.y + halfH + cMargin;

    for (const item of this.pickupItems) {
      if (item.x >= vMinX && item.x <= vMaxX && item.y >= vMinY && item.y <= vMaxY) {
        item.draw(ctx);
      }
    }

    for (const gem of this.expGems) {
      if (gem.x >= vMinX && gem.x <= vMaxX && gem.y >= vMinY && gem.y <= vMaxY) {
        gem.draw(ctx);
      }
    }

    for (const enemy of this.enemies) {
      const r = enemy.radius || 20;
      if (enemy.x + r >= vMinX && enemy.x - r <= vMaxX && enemy.y + r >= vMinY && enemy.y - r <= vMaxY) {
        enemy.draw(ctx);
      }
    }

    this.player.draw(ctx);

    for (const bp of this.bossProjectiles) {
      if (bp.x >= vMinX && bp.x <= vMaxX && bp.y >= vMinY && bp.y <= vMaxY) {
        bp.draw(ctx);
      }
    }

    for (const p of this.particles) {
      if (p.x >= vMinX && p.x <= vMaxX && p.y >= vMinY && p.y <= vMaxY) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    for (const dn of this.damageNumbers) {
      if (dn.x >= vMinX && dn.x <= vMaxX && dn.y >= vMinY && dn.y <= vMaxY) {
        dn.draw(ctx);
      }
    }

    ctx.restore();

    this.updateInkVignette(width, height);
    if (this.vignetteCanvas) {
      ctx.drawImage(this.vignetteCanvas, 0, 0);
    }

    if (this.freezeTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(165, 243, 252, 0.12)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, width, height);
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

  renderCosmicSpace(ctx) {
    const time = Date.now() * 0.001;
    ctx.save();

    const nebulas = [
      { x: -1200, y: -1100, r: 650, color: 'rgba(79, 70, 229, 0.08)' },
      { x: 1300, y: -900, r: 750, color: 'rgba(192, 132, 252, 0.07)' },
      { x: 0, y: 1400, r: 850, color: 'rgba(6, 182, 212, 0.06)' }
    ];
    for (const neb of nebulas) {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.cosmicStars) {
      for (const s of this.cosmicStars) {
        const alpha = s.baseAlpha * (0.6 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.4);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1.0, alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  renderFloorGrid(ctx) {
    const bound = 1600;
    if (!this.hanjiPattern && this.hanjiPatternCanvas) {
      this.hanjiPattern = ctx.createPattern(this.hanjiPatternCanvas, 'repeat');
    }

    if (this.hanjiPattern) {
      ctx.fillStyle = this.hanjiPattern;
    } else {
      ctx.fillStyle = '#0a0b10';
    }
    ctx.fillRect(-bound, -bound, bound * 2, bound * 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bound, -bound, bound * 2, bound * 2);
  }

  drawWorldBoundary(ctx) {
    const bound = 1600;
    const time = Date.now() * 0.002;
    const pulse = 0.6 + Math.sin(time) * 0.2;

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeRect(-bound - 4, -bound - 4, (bound + 4) * 2, (bound + 4) * 2);

    ctx.strokeStyle = `rgba(185, 28, 28, ${pulse})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(-bound, -bound, bound * 2, bound * 2);

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-bound + 8, -bound + 8, (bound - 8) * 2, (bound - 8) * 2);

    const monoliths = [
      [-bound, -bound], [bound, -bound],
      [bound, bound], [-bound, bound],
      [0, -bound], [bound, 0], [0, bound], [-bound, 0]
    ];
    for (const [cx, cy] of monoliths) {
      ctx.fillStyle = '#0a0a0f';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderDeepSeaSpace(ctx) {
    ctx.save();
    const lightGradients = [
      { x: -1600, y: -400, r: 800, color: 'rgba(6, 182, 212, 0.06)' },
      { x: 0, y: -500, r: 900, color: 'rgba(14, 165, 233, 0.07)' },
      { x: 1800, y: -400, r: 800, color: 'rgba(20, 184, 166, 0.06)' }
    ];
    for (const lg of lightGradients) {
      const grad = ctx.createRadialGradient(lg.x, lg.y, 0, lg.x, lg.y, lg.r);
      grad.addColorStop(0, lg.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lg.x, lg.y, lg.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.underwaterBubbles) {
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      for (const b of this.underwaterBubbles) {
        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  renderTrenchFloorGrid(ctx) {
    const boundW = 3000;
    const boundH = 550;
    if (!this.tealInkPattern && this.tealInkPatternCanvas) {
      this.tealInkPattern = ctx.createPattern(this.tealInkPatternCanvas, 'repeat');
    }

    if (this.tealInkPattern) {
      ctx.fillStyle = this.tealInkPattern;
    } else {
      ctx.fillStyle = '#030d17';
    }
    ctx.fillRect(-boundW, -boundH, boundW * 2, boundH * 2);
  }

  drawTrenchBoundary(ctx) {
    const boundW = 3000;
    const boundH = 550;
    const time = Date.now() * 0.003;
    const pulse = 0.55 + Math.sin(time) * 0.25;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 22;
    ctx.strokeRect(-boundW - 11, -boundH - 11, (boundW + 11) * 2, (boundH + 11) * 2);

    ctx.strokeStyle = `rgba(6, 182, 212, ${pulse})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(-boundW, -boundH, boundW * 2, boundH * 2);

    ctx.strokeStyle = `rgba(45, 212, 191, ${pulse * 0.7})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-boundW + 14, -boundH + 14, (boundW - 14) * 2, (boundH - 14) * 2);

    const reefBeacons = [
      [-boundW, -boundH], [boundW, -boundH],
      [boundW, boundH], [-boundW, boundH],
      [-1500, -boundH], [0, -boundH], [1500, -boundH],
      [-1500, boundH], [0, boundH], [1500, boundH],
      [-boundW, 0], [boundW, 0]
    ];
    for (const [cx, cy] of reefBeacons) {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

}

window.addEventListener('load', () => {
  saveManager.load();

  assets.loadAll(() => {
    console.log('⚔️ 수묵화풍(Ink-Wash) 다크 판타지 에셋 로드 완료!');
  });
  window.game = new Game();
});
