// 25스테이지 웨이브 매니저 및 몬스터 스폰 스케줄러 (js/waveManager.js)
// [밸런스 패치] 후반부 물량 난사 스파이크(⚠️ SPIKE) 완화 및 점진적 긴장감 곡선 유지

class WaveManager {
  constructor(game) {
    this.game = game;
    this.currentWorld = 1;
    this.currentStage = 1;
    this.maxStage = 25;
    this.stageDuration = 45.0;
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;

    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
    this.eventWaveTriggered = false;
    this.isStageClearing = false;

    // 월드 1 (심연의 부유섬 25스테이지)
    this.world1StageConfigs = {
      1: { mobs: ['bat', 'slime'], interval: 0.9, batch: 2, hpScale: 1.0, boss: null },
      2: { mobs: ['slime', 'zombie'], interval: 0.9, batch: 2, hpScale: 0.80, bossTime: 22, bossStage: 2 },
      3: { mobs: ['zombie', 'skeleton', 'goblin'], interval: 0.8, batch: 2, hpScale: 0.72, boss: null },
      4: { mobs: ['skeleton', 'goblin', 'ghost'], interval: 0.7, batch: 2, hpScale: 0.85, bossTime: 22, bossStage: 4 },
      5: { mobs: ['ghost', 'gargoyle', 'cultist'], interval: 0.7, batch: 2, hpScale: 0.58, boss: null },
      6: { mobs: ['cultist', 'gargoyle', 'assassin'], interval: 0.65, batch: 2, hpScale: 0.75, bossTime: 22, bossStage: 6 },
      7: { mobs: ['gargoyle', 'assassin', 'golem'], interval: 0.7, batch: 2, hpScale: 0.62, boss: null },
      8: { mobs: ['assassin', 'golem', 'cultist'], interval: 0.6, batch: 2, hpScale: 0.68, bossTime: 22, bossStage: 8 },
      9: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.5, batch: 3, hpScale: 0.90, boss: null },
      10: { mobs: ['gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.5, batch: 2, hpScale: 0.95, bossTime: 12, bossStage: 10 },
      // --- 11~15 Hell 난이도 (스파이크 완화 및 정예화) ---
      11: { mobs: ['bloodHound', 'assassin'], interval: 0.45, batch: 3, hpScale: 1.30, boss: null },
      12: { mobs: ['darkMage', 'bloodHound', 'gargoyle'], interval: 0.45, batch: 3, hpScale: 1.10, bossTime: 14, bossStage: 12 },
      13: { mobs: ['wraithSwarm', 'bat', 'ghost'], interval: 0.35, batch: 5, hpScale: 1.70, boss: null }, // 망령 스웜 집단 습격
      14: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm'], interval: 0.45, batch: 2, hpScale: 1.42, boss: null },
      15: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'golem'], interval: 0.45, batch: 2, hpScale: 1.58, bossTime: 12, bossStage: 15 },
      // --- 16~20 Abyss Chaos 난이도 ---
      16: { mobs: ['darkMage', 'bloodHound', 'assassin', 'gargoyle'], interval: 0.35, batch: 3, hpScale: 2.05, boss: null },
      17: { mobs: ['wraithSwarm', 'ghost', 'cultist'], interval: 0.30, batch: 4, hpScale: 2.20, boss: null },
      18: { mobs: ['abyssTitan', 'golem', 'bloodHound'], interval: 0.45, batch: 2, hpScale: 1.88, bossTime: 12, bossStage: 18 },
      19: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound', 'wraithSwarm', 'abyssTitan'], interval: 0.35, batch: 4, hpScale: 2.10, boss: null },
      20: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'assassin'], interval: 0.40, batch: 3, hpScale: 2.55, bossTime: 12, bossStage: 20 },
      // --- 21~25 The Abyss Sovereign 난이도 ---
      21: { mobs: ['darkMage', 'cultist', 'bloodHound', 'assassin'], interval: 0.35, batch: 4, hpScale: 2.85, boss: null },
      22: { mobs: ['abyssTitan', 'wraithSwarm', 'gargoyle'], interval: 0.40, batch: 3, hpScale: 2.35, boss: null },
      23: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'golem'], interval: 0.40, batch: 3, hpScale: 2.45, boss: null },
      24: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound', 'wraithSwarm', 'abyssTitan'], interval: 0.35, batch: 5, hpScale: 2.65, boss: null },
      25: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'assassin'], interval: 0.40, batch: 4, hpScale: 2.75, bossTime: 12, bossStage: 25 }
    };

    // 월드 2 (심해 대협곡 20스테이지)
    this.world2StageConfigs = {
      1: { mobs: ['plankton', 'jellyfish'], interval: 0.9, batch: 2, hpScale: 1.10, boss: null },
      2: { mobs: ['jellyfish', 'hermitCrab'], interval: 0.9, batch: 2, hpScale: 0.80, boss: null },
      3: { mobs: ['hermitCrab', 'flyingFish', 'plankton'], interval: 0.8, batch: 2, hpScale: 1.30, boss: null },
      4: { mobs: ['flyingFish', 'seaLobster', 'hermitCrab'], interval: 0.7, batch: 2, hpScale: 1.00, boss: null },
      5: { mobs: ['seaLobster', 'plankton', 'flyingFish'], interval: 0.6, batch: 3, hpScale: 1.10, bossTime: 14, bossStage: 205 }, // 1대 보스: 크라켄
      6: { mobs: ['seaLobster', 'stingray', 'hermitCrab'], interval: 0.65, batch: 2, hpScale: 1.38, boss: null },
      7: { mobs: ['stingray', 'coralGolem', 'seaLeech'], interval: 0.7, batch: 2, hpScale: 0.85, boss: null },
      8: { mobs: ['coralGolem', 'seaLeech', 'stingray'], interval: 0.6, batch: 2, hpScale: 0.90, boss: null },
      9: { mobs: ['coralGolem', 'seaLeech', 'anglerFish', 'ghostJelly'], interval: 0.5, batch: 2, hpScale: 0.90, boss: null },
      10: { mobs: ['anglerFish', 'ghostJelly', 'coralGolem'], interval: 0.5, batch: 2, hpScale: 0.95, bossTime: 12, bossStage: 210 }, // 2대 보스: 타이탄 크랩
      11: { mobs: ['deepShark', 'seaLeech', 'flyingFish'], interval: 0.45, batch: 3, hpScale: 1.48, boss: null },
      12: { mobs: ['deepShark', 'poisonRay', 'anglerFish'], interval: 0.45, batch: 3, hpScale: 1.05, boss: null },
      13: { mobs: ['poisonRay', 'deepShark', 'ghostJelly'], interval: 0.40, batch: 3, hpScale: 1.15, boss: null },
      14: { mobs: ['shadowEel', 'poisonRay', 'deepShark'], interval: 0.40, batch: 3, hpScale: 1.17, boss: null },
      15: { mobs: ['shadowEel', 'deepShark', 'voidSeaSerpent'], interval: 0.45, batch: 2, hpScale: 1.48, bossTime: 12, bossStage: 215 }, // 3대 보스: 레비아탄
      16: { mobs: ['voidSeaSerpent', 'trilobite', 'shadowEel'], interval: 0.45, batch: 2, hpScale: 1.34, boss: null },
      17: { mobs: ['trilobite', 'voidSeaSerpent', 'stingray'], interval: 0.40, batch: 2, hpScale: 1.45, boss: null },
      18: { mobs: ['trilobite', 'voidSeaSerpent', 'deepShark', 'poisonRay'], interval: 0.45, batch: 3, hpScale: 1.28, boss: null },
      19: { mobs: ['plankton', 'jellyfish', 'hermitCrab', 'flyingFish', 'seaLobster', 'stingray', 'coralGolem', 'seaLeech', 'anglerFish', 'ghostJelly', 'deepShark', 'poisonRay', 'shadowEel', 'voidSeaSerpent', 'trilobite'], interval: 0.35, batch: 4, hpScale: 1.85, boss: null },
      20: { mobs: ['voidSeaSerpent', 'trilobite', 'deepShark', 'shadowEel'], interval: 0.40, batch: 3, hpScale: 1.48, bossTime: 10, bossStage: 220 } // 최종 보스: 다곤
    };

    this.stageConfigs = this.world1StageConfigs;
  }

  setWorld(worldNum = 1) {
    this.currentWorld = worldNum;
    if (worldNum === 2) {
      this.maxStage = 20;
      this.stageConfigs = this.world2StageConfigs;
    } else {
      this.maxStage = 25;
      this.stageConfigs = this.world1StageConfigs;
    }
    this.reset();
  }

  reset() {
    this.currentStage = 1;
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;
    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
    this.eventWaveTriggered = false;
    this.isStageClearing = false;
    this.redReaperSpawned = false;
    this.redReaperTimer = 0;
  }

  update(dt) {
    const config = this.stageConfigs[this.currentStage];
    if (!config) return;

    // 스테이지 타이머 차감
    if (this.stageTimeLeft > 0) {
      this.stageTimeLeft -= dt;
      if (this.stageTimeLeft < 0) this.stageTimeLeft = 0;
    }

    const elapsed = this.stageDuration - this.stageTimeLeft;

    // 보스 스폰 조건 검사
    if (config.bossStage && !this.bossSpawnedThisStage) {
      if (elapsed >= config.bossTime) {
        this.spawnBoss(config.bossStage);
      }
    }

    // [최종 스테이지 기믹] 시간 제한 만료 시 즉사급 붉은 사신 강림
    if (this.currentStage === this.maxStage && this.stageTimeLeft <= 0) {
      if (!this.redReaperSpawned) {
        this.redReaperSpawned = true;
        this.spawnRedReaper();
        this.redReaperTimer = 60.0;
      } else {
        this.redReaperTimer -= dt;
        if (this.redReaperTimer <= 0) {
          this.redReaperTimer = 60.0;
          this.spawnRedReaper();
        }
      }
    }

    // 돌발 이벤트 웨이브 검사
    if (!this.eventWaveTriggered && elapsed >= 20) {
      if (this.currentWorld === 2) {
        if (this.currentStage === 3) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🌊 [돌발 웨이브] 청록 해파리 무리의 집단 발광!', 'jellyfish', 20, config.hpScale);
        } else if (this.currentStage === 8) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🦀 [돌발 웨이브] 뿔소라게 떼의 바닥 행진!', 'hermitCrab', 18, config.hpScale);
        } else if (this.currentStage === 13) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🦈 [돌발 웨이브] 메갈로돈 상어 떼의 피의 추격!', 'deepShark', 14, config.hpScale);
        } else if (this.currentStage === 17) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('⚡ [돌발 웨이브] 심연 전기 가오리의 번개 폭풍!', 'stingray', 16, config.hpScale);
        }
      } else {
        if (this.currentStage === 3) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🦇 [돌발 웨이브] 박쥐 떼의 공중 대습격!', 'bat', 20, config.hpScale);
        } else if (this.currentStage === 5) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🟢 [돌발 웨이브] 슬라임 군단의 대폭주!', 'slime', 14, config.hpScale);
        } else if (this.currentStage === 7) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🗡️ [돌발 웨이브] 그림자 암살자단의 기습 매복!', 'assassin', 8, config.hpScale);
        } else if (this.currentStage === 17) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🌌 [돌발 웨이브] 원혼과 망령 군단의 대습격!', 'wraithSwarm', 18, config.hpScale);
        }
      }
    }

    // 일반 몬스터 스폰 루프
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = config.interval;
      this.spawnBatch(config.mobs, config.batch, config.hpScale);
    }

    // 보스 격파 여부 확인
    if (this.activeBoss && this.activeBoss.isDead) {
      const isRedReaper = (this.activeBoss.bossStage === 99 || this.activeBoss.isRedReaper);
      this.activeBoss = null;
      this.game.triggerBossRewardCard();

      if (isRedReaper || this.currentStage >= this.maxStage) {
        this.game.triggerVictory();
      } else {
        if (this.stageTimeLeft <= 0 || config.bossStage) {
          this.advanceStage();
        }
      }
    } else if (!config.bossStage && this.stageTimeLeft <= 0) {
      if (this.currentStage < this.maxStage) {
        this.advanceStage();
      }
    }
  }

  triggerEventWave(title, mobKey, count, hpScale) {
    sounds.playBossAlarm();
    if (this.game.ui && this.game.ui.showBossAlert) {
      this.game.ui.showBossAlert(title);
    }
    this.spawnBatch([mobKey], count, hpScale * 1.1);
  }

  spawnBatch(mobs, count, hpScale) {
    const player = this.game.player;
    const viewWidth = this.game.canvas.width;
    const viewHeight = this.game.canvas.height;
    const spawnDistance = Math.max(viewWidth, viewHeight) / 2 + 100;
    const bounds = (this.game && this.game.getWorldBoundaries) ? this.game.getWorldBoundaries() : { boundW: 1540, boundH: 1540 };
    const boundW = bounds.boundW - 40;
    const boundH = bounds.boundH - 40;

    for (let i = 0; i < count; i++) {
      let mobKey = mobs[Math.floor(Math.random() * mobs.length)];
      let typeDef = ENEMY_TYPES[mobKey] || {};

      if (typeDef.isRanged && Math.random() < (1 / 3)) {
        const meleeMobs = mobs.filter(m => !(ENEMY_TYPES[m] && ENEMY_TYPES[m].isRanged));
        if (meleeMobs.length > 0) {
          mobKey = meleeMobs[Math.floor(Math.random() * meleeMobs.length)];
          typeDef = ENEMY_TYPES[mobKey] || {};
        } else {
          continue;
        }
      }

      const isFlying = !!typeDef.isFlying;
      const angle = Math.random() * Math.PI * 2;
      let x, y;

      if (isFlying) {
        const dist = spawnDistance + Math.random() * 140;
        x = player.x + Math.cos(angle) * dist;
        y = player.y + Math.sin(angle) * dist;
        if (this.currentWorld === 2) {
          y = Math.max(-boundH - 80, Math.min(boundH + 80, y));
        }
      } else {
        const dist = spawnDistance + Math.random() * 60;
        let targetX = player.x + Math.cos(angle) * dist;
        let targetY = player.y + Math.sin(angle) * dist;

        targetX = Math.max(-boundW, Math.min(boundW, targetX));
        targetY = Math.max(-boundH, Math.min(boundH, targetY));

        const d = Math.hypot(targetX - player.x, targetY - player.y);
        if (d < 260) {
          const escapeAngle = Math.atan2(targetY - player.y, targetX - player.x) || angle;
          targetX = Math.max(-boundW, Math.min(boundW, player.x + Math.cos(escapeAngle) * 320));
          targetY = Math.max(-boundH, Math.min(boundH, player.y + Math.sin(escapeAngle) * 320));
        }

        x = targetX;
        y = targetY;
      }

      const enemy = new Enemy(mobKey, x, y, hpScale);
      this.game.enemies.push(enemy);
    }
  }

  spawnBoss(bossStage) {
    this.bossSpawnedThisStage = true;
    const player = this.game.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 380;
    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;

    const isFlyingBoss = (bossStage === 4 || bossStage === 12 || bossStage === 15 || bossStage === 18 || bossStage === 20 || bossStage === 205 || bossStage === 215 || bossStage === 220);
    if (!isFlyingBoss) {
      const bW = (this.game && this.game.getWorldBoundaries) ? this.game.getWorldBoundaries().boundW - 60 : 1500;
      const bH = (this.game && this.game.getWorldBoundaries) ? this.game.getWorldBoundaries().boundH - 60 : 1500;
      x = Math.max(-bW, Math.min(bW, x));
      y = Math.max(-bH, Math.min(bH, y));
    }

    const boss = new BossEnemy(bossStage, x, y);
    this.activeBoss = boss;
    this.game.enemies.push(boss);

    sounds.playBossAlarm();
    this.game.ui.showBossAlert(boss.name);
  }

  spawnRedReaper() {
    const player = this.game.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 520;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const reaper = new BossEnemy(99, x, y);
    this.game.enemies.push(reaper);

    if (typeof sounds !== 'undefined' && sounds.playBossAlarm) {
      sounds.playBossAlarm();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (e) {}
    }
    if (this.game.ui && this.game.ui.showBossAlert) {
      this.game.ui.showBossAlert('☠️ [재앙 강림] 시간 만료! 진 붉은 사신이 영혼을 거두러 옵니다! ☠️');
    }
  }

  advanceStage() {
    if (this.isStageClearing) return;
    this.isStageClearing = true;

    if (this.currentStage >= this.maxStage) {
      this.game.triggerVictory();
      return;
    }

    sounds.playVictory();
    this.game.ui.showStageClear(this.currentStage);

    setTimeout(() => {
      this.currentStage += 1;
      this.stageTimeLeft = this.stageDuration;
      this.bossSpawnedThisStage = false;
      this.eventWaveTriggered = false;
      this.activeBoss = null;
      this.isStageClearing = false;
    }, 2000);
  }
}
