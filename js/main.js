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

  // 월드 2 심해 기포 고정 객체 풀 (90개 고정 재사용으로 GC 렉 완벽 차단)
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
    };
    window.addEventListener('resize', resize);
    resize();
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      sounds.ensureContext(); // 사용자 첫 키보드 입력 시 오디오 활성화

      // 카드 선택 모달(시작 무기/레벨업) 오픈 시 키보드 방향키/엔터/숫자키 처리
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
      this.ui.showChampionBanner(); // 사망 또는 로비 진입 시 챔피언 배너 띄움
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
    this.applyUpgradesFromSave(); // 영구 업그레이드 스탯 적용!
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

    // 선택된 캐릭터의 전용 시그니처 시작 무기 지급
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

  // 게임 시작 시 3종의 기본 무기 중 1종 선택
  presentStartingWeaponSelection() {
    this.gameState = 'LEVEL_UP';
    const render = () => {
      const cards = this.cardManager.generateStartingWeaponCards();
      this.ui.showCardSelection(
        cards,
        // onSelect
        (selectedCard) => {
          selectedCard.apply();
          this.gameState = 'PLAYING';
          this.lastTime = performance.now();
        },
        // onReroll
        () => {
          if (this.player.rerollCount > 0) {
            this.player.rerollCount -= 1;
            render();
          }
        },
        // onSkip (시작 무기는 반드시 선택해야 하므로 null)
        null,
        false, // isBossReward
        true   // isStarting
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
        // onSelect
        (selectedCard) => {
          selectedCard.apply();
          this.gameState = 'PLAYING';
        },
        // onReroll
        () => {
          if (this.player.rerollCount > 0) {
            this.player.rerollCount -= 1;
            render();
          }
        },
        // onSkip
        () => {
          // 스킵 시 체력 20 즉시 회복
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

  // 보스 격파 즉시 1회 무료 업그레이드 보상
  triggerBossRewardCard() {
    this.presentCardSelection(true);
  }

  // 필드 특수 드랍 아이템 발동
  // 필드 특수 드랍 아이템 발동
  applyPickupItem(item) {
    const type = typeof item === 'string' ? item : item.type;

    if (type === 'heal') {
      // 체력 포션: 체력 10 즉시 회복
      sounds.playLevelUp();
      const healAmt = 10;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 14, `+${healAmt}`, false, '#22c55e'));
      this.addParticles(this.player.x, this.player.y, '#22c55e', 18);
    } else if (type === 'magnet') {
      // 자석: 전체 맵의 모든 경험치 보석 및 필드 금화 즉시 진공 회수
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
      // 폭탄(TNT): 플레이어 중심 화면 2/3 범위 내 적 광역 피해 (일반 몬스터 600, 보스는 최대 HP의 10% 또는 최대 250 제한)
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
      // 얼음(눈결정): 모든 적의 이동 및 공격 4.5초간 완전 정지
      sounds.playBossAlarm();
      this.freezeTimer = 4.5;
      this.addParticles(this.player.x, this.player.y, '#a5f3fc', 24);
    } else if (type === 'gold') {
      // 금화 습득
      const rawVal = item.goldValue || 1;
      const earned = Math.max(1, Math.round(rawVal * (this.player.goldMult || 1.0)));
      this.player.gold = (this.player.gold || 0) + earned;
      sounds.playGem();
      this.damageNumbers.push(new DamageNumber(this.player.x, this.player.y - 16, `+${earned}G`, false, '#fbbf24'));
      this.addParticles(this.player.x, this.player.y, '#f59e0b', 12);
    }
  }

  // 획득한 골드를 로컬 영구 저장소에 무결성 서명과 함께 합산 저장
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

    // 심해 기포 파티클 풀 업데이트 (월드 2)
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

    // 0. 필드 장애물 청크 갱신 및 상태 업데이트
    this.obstacleManager.update(dt, this.player.x, this.player.y);

    // 1. 플레이어 업데이트
    this.player.update(dt, this.input);
    this.obstacleManager.resolveCollisions(this.player);

    // 전장 외곽 경계 충돌 (플레이어가 맵 끝에 걸려 밖으로 나가지 못하게 차단)
    const { boundW, boundH } = this.getWorldBoundaries();
    this.player.x = Math.max(-boundW, Math.min(boundW, this.player.x));
    this.player.y = Math.max(-boundH, Math.min(boundH, this.player.y));

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
        enemy.update(dt, this.player, this.enemies, this.bossProjectiles);
        if (!enemy.isFlying) {
          this.obstacleManager.resolveCollisions(enemy);
        }
      }

      // 그라운드 몬스터는 부유섬 밖 우주로 나가지 못하도록 경계 제한 [-1580, 1580]
      if (!enemy.isFlying && !enemy.isBoss) {
        enemy.x = Math.max(-boundW, Math.min(boundW, enemy.x));
        enemy.y = Math.max(-boundH, Math.min(boundH, enemy.y));
      }

      if (enemy.isDead) {
        // 해골 몬스터 부활 대기 중일 때는 사망 제거 및 드랍 유예
        if (enemy.reviveState === 1) {
          continue;
        }

        // 슬라임 분열 기믹: 일반 슬라임 사망 시 2마리의 미니 슬라임으로 분열 생성
        if (enemy.typeKey === 'slime' && !enemy.isMini) {
          const parentScale = (typeof enemy.hpScale === 'number' && !isNaN(enemy.hpScale)) ? enemy.hpScale : 1.0;
          for (let s = -1; s <= 1; s += 2) {
            const mini = new Enemy('miniSlime', enemy.x + s * 16, enemy.y + (Math.random() - 0.5) * 12, parentScale * 0.7);
            mini.isMini = true;
            this.enemies.push(mini);
          }
        }

        // 공중 몬스터가 맵 밖에서 사망하더라도 보석은 플레이어가 먹을 수 있는 그라운드 테두리로 안전 낙하
        const clampX = Math.max(-boundW + 40, Math.min(boundW - 40, enemy.x));
        const clampY = Math.max(-boundH + 40, Math.min(boundH - 40, enemy.y));
        const safePos = this.obstacleManager ? this.obstacleManager.getUnblockedPosition(clampX, clampY, 14) : { x: clampX, y: clampY };

        // 경험치 보석 드랍 (뒤 5종 마물은 대량 경험치 보석)
        this.expGems.push(new ExpGem(safePos.x, safePos.y, enemy.exp));

        // 1) 특수 아이템 드랍 (일반몹 약 0.55%로 기존 대비 50% 추가 감소, 보스는 100% 확정 드랍)
        const dropBonus = 1 + (this.player.dropRateBonus || 0);
        const itemDropChance = enemy.isBoss ? 1.0 : (0.0055 * dropBonus);
        if (Math.random() < itemDropChance) {
          const types = ['magnet', 'bomb', 'freeze'];
          const picked = types[Math.floor(Math.random() * types.length)];
          this.pickupItems.push(new PickupItem(picked, safePos.x, safePos.y));
        }

        // 2) 금화 드랍 (특수 아이템과 동일한 약 0.55% 확률, 보스는 100% 확정 50G 보너스)
        const goldDropChance = enemy.isBoss ? 1.0 : (0.0055 * dropBonus);
        if (Math.random() < goldDropChance) {
          const goldVal = enemy.isBoss ? 50 : Math.floor(Math.random() * 3) + 1;
          this.pickupItems.push(new PickupItem('gold', safePos.x, safePos.y, goldVal));
        }

        // 사망 파티클 및 킬 카운트/흡혈 처리
        this.addParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 24 : 8);
        this.player.onKillEnemy(enemy);
        sounds.playKill();

        if (enemy.isRedReaper || enemy.bossStage === 99) {
          this.triggerVictory();
        }

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

    // 6. 특수 드랍 아이템(자석, 폭탄, 얼음, 회복, 금화) 업데이트 및 습득 판정 (영구 보존)
    for (let i = this.pickupItems.length - 1; i >= 0; i--) {
      const item = this.pickupItems[i];
      const collected = item.update(dt, this.player);
      if (collected) {
        this.applyPickupItem(item);
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

    // 배경 클리어 (월드 1: 심연 우주 암흑, 월드 2: 심해 네이비)
    ctx.fillStyle = this.currentWorld === 2 ? '#020813' : '#030308';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // 카메라 좌표계 변환 (플레이어가 항상 중앙)
    ctx.translate(Math.round(width / 2 - this.camera.x), Math.round(height / 2 - this.camera.y));

    if (this.currentWorld === 2) {
      // 월드 2: 심해 협곡 공간, 해저 타일, 절벽 암벽 렌더링
      this.renderDeepSeaSpace(ctx);
      this.renderTrenchFloorGrid(ctx);
      this.drawTrenchBoundary(ctx);
    } else {
      // 월드 1: 부유섬 외곽 광활한 우주 공간 및 성운 별빛, 지면, 결계선
      this.renderCosmicSpace(ctx);
      this.renderFloorGrid(ctx);
      this.drawWorldBoundary(ctx);
    }

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

  // 부유섬 바깥 광활한 우주 성운 및 반짝이는 별빛 렌더링
  renderCosmicSpace(ctx) {
    const time = Date.now() * 0.001;
    ctx.save();

    // 성운 (Nebula) 은은한 배경 발광 3곳
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

    // 별빛 렌더링
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
    const tileSize = 64;
    const islandBound = 1600;
    const halfW = this.canvas.width / 2;
    const halfH = this.canvas.height / 2;
    const startX = Math.floor((this.camera.x - halfW) / tileSize) * tileSize;
    const endX = this.camera.x + halfW + tileSize;
    const startY = Math.floor((this.camera.y - halfH) / tileSize) * tileSize;
    const endY = this.camera.y + halfH + tileSize;

    // 부유섬 지면 [-islandBound, islandBound] 영역에만 타일 배치
    const renderStartX = Math.max(-islandBound, startX);
    const renderEndX = Math.min(islandBound, endX);
    const renderStartY = Math.max(-islandBound, startY);
    const renderEndY = Math.min(islandBound, endY);

    if (renderStartX >= renderEndX || renderStartY >= renderEndY) return;

    const floorTile = assets.images['tile_floor'];

    // 부유섬 밑바탕 짙은 석조 바닥
    ctx.fillStyle = '#0f1423';
    ctx.fillRect(renderStartX, renderStartY, renderEndX - renderStartX, renderEndY - renderStartY);

    if (floorTile && floorTile.complete && floorTile.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      for (let x = renderStartX; x < renderEndX; x += tileSize) {
        for (let y = renderStartY; y < renderEndY; y += tileSize) {
          const w = Math.min(tileSize, renderEndX - x);
          const h = Math.min(tileSize, renderEndY - y);
          ctx.drawImage(floorTile, 0, 0, w, h, x, y, w, h);
        }
      }
    } else {
      ctx.strokeStyle = '#1e2540';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = renderStartX; x <= renderEndX; x += tileSize) {
        ctx.moveTo(x, renderStartY);
        ctx.lineTo(x, renderEndY);
      }
      for (let y = renderStartY; y <= renderEndY; y += tileSize) {
        ctx.moveTo(renderStartX, y);
        ctx.lineTo(renderEndX, y);
      }
      ctx.stroke();
    }
  }

  drawWorldBoundary(ctx) {
    const bound = 1600;
    const time = Date.now() * 0.003;
    const pulse = 0.55 + Math.sin(time) * 0.25;

    ctx.save();
    // 1. 부유섬 절벽 외곽 심연 그림자
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 18;
    ctx.strokeRect(-bound - 9, -bound - 9, (bound + 9) * 2, (bound + 9) * 2);

    // 2. 외곽 고대 우주 룬 결계 발광 라인
    ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 20;
    ctx.strokeRect(-bound, -bound, bound * 2, bound * 2);

    // 3. 내부 청록빛 룬 보조 라인
    ctx.strokeStyle = `rgba(56, 189, 248, ${pulse * 0.75})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.strokeRect(-bound + 12, -bound + 12, (bound - 12) * 2, (bound - 12) * 2);

    // 4. 4개 모서리 및 사방 중앙 결계석
    const monoliths = [
      [-bound, -bound],
      [bound, -bound],
      [bound, bound],
      [-bound, bound],
      [0, -bound],
      [bound, 0],
      [0, bound],
      [-bound, 0]
    ];
    for (const [cx, cy] of monoliths) {
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 월드 2 심해 협곡 외곽 수중 연출 및 기포 렌더링 (60fps 무렉)
  renderDeepSeaSpace(ctx) {
    ctx.save();

    // 1. 심해 해류 광원 (부드러운 청록빛 수중 빛기둥)
    const time = Date.now() * 0.001;
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

    // 2. 심해 기포 파티클 풀 렌더링 (순수 arc 렌더링으로 프레임 드랍 0%)
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

  // 월드 2 심해 협곡 지면 격자 렌더링 (가로 6000 x 세로 1600)
  renderTrenchFloorGrid(ctx) {
    const tileSize = 64;
    const boundW = 3000;
    const boundH = 550;
    const halfW = this.canvas.width / 2;
    const halfH = this.canvas.height / 2;
    const startX = Math.floor((this.camera.x - halfW) / tileSize) * tileSize;
    const endX = this.camera.x + halfW + tileSize;
    const startY = Math.floor((this.camera.y - halfH) / tileSize) * tileSize;
    const endY = this.camera.y + halfH + tileSize;

    const renderStartX = Math.max(-boundW, startX);
    const renderEndX = Math.min(boundW, endX);
    const renderStartY = Math.max(-boundH, startY);
    const renderEndY = Math.min(boundH, endY);

    if (renderStartX >= renderEndX || renderStartY >= renderEndY) return;

    // 해저 모래 및 암반 짙은 청회색 바탕
    ctx.fillStyle = '#061325';
    ctx.fillRect(renderStartX, renderStartY, renderEndX - renderStartX, renderEndY - renderStartY);

    // 해저 미세 격자선
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = renderStartX; x <= renderEndX; x += tileSize) {
      ctx.moveTo(x, renderStartY);
      ctx.lineTo(x, renderEndY);
    }
    for (let y = renderStartY; y <= renderEndY; y += tileSize) {
      ctx.moveTo(renderStartX, y);
      ctx.lineTo(renderEndX, y);
    }
    ctx.stroke();
  }

  // 월드 2 협곡 절벽 및 심해 경계선 렌더링
  drawTrenchBoundary(ctx) {
    const boundW = 3000;
    const boundH = 550;
    const time = Date.now() * 0.003;
    const pulse = 0.55 + Math.sin(time) * 0.25;

    ctx.save();
    // 1. 상하단 해저 절벽 외곽 암흑 그림자
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 22;
    ctx.strokeRect(-boundW - 11, -boundH - 11, (boundW + 11) * 2, (boundH + 11) * 2);

    // 2. 심해 협곡 청록색 발광 경계선
    ctx.strokeStyle = `rgba(6, 182, 212, ${pulse})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 18;
    ctx.strokeRect(-boundW, -boundH, boundW * 2, boundH * 2);

    // 3. 내부 해양 네온 보조 라인
    ctx.strokeStyle = `rgba(45, 212, 191, ${pulse * 0.7})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.strokeRect(-boundW + 14, -boundH + 14, (boundW - 14) * 2, (boundH - 14) * 2);

    // 4. 협곡 모서리 및 거점 발광 산호 표식
    const reefBeacons = [
      [-boundW, -boundH], [boundW, -boundH],
      [boundW, boundH], [-boundW, boundH],
      [-1500, -boundH], [0, -boundH], [1500, -boundH],
      [-1500, boundH], [0, boundH], [1500, boundH],
      [-boundW, 0], [boundW, 0]
    ];
    for (const [cx, cy] of reefBeacons) {
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
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

// 게임 기동 및 다크 판타지 에셋 로드
window.addEventListener('load', () => {
  // 세이브 데이터 1차 무결성 검증
  saveManager.load();

  assets.loadAll(() => {
    console.log('⚔️ 다크 판타지 픽셀 아트 에셋 로드 완료!');
  });
  window.game = new Game();
});
