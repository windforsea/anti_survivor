// 25스테이지 웨이브 매니저 및 몬스터 스폰 스케줄러 (총 18분 45초, 사신 강림)

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
      1: { mobs: ['bat', 'slime'], interval: 0.8, batch: 2, hpScale: 1.0, boss: null },
      2: { mobs: ['slime', 'zombie'], interval: 0.7, batch: 2, hpScale: 1.15, bossTime: 22, bossStage: 2 },
      3: { mobs: ['zombie', 'skeleton', 'goblin'], interval: 0.6, batch: 3, hpScale: 1.65, boss: null }, // [체력 점프 1구간 + 20s 박쥐떼 이벤트]
      4: { mobs: ['skeleton', 'goblin', 'ghost'], interval: 0.55, batch: 6, hpScale: 1.85, bossTime: 22, bossStage: 4 }, // [물량 2배 구간: batch 6]
      5: { mobs: ['ghost', 'gargoyle', 'cultist'], interval: 0.5, batch: 3, hpScale: 2.25, boss: null }, // [20s 슬라임 대폭주 이벤트]
      6: { mobs: ['cultist', 'gargoyle', 'assassin'], interval: 0.45, batch: 4, hpScale: 3.40, bossTime: 22, bossStage: 6 }, // [체력 점프 2구간 보강]
      7: { mobs: ['gargoyle', 'assassin', 'golem'], interval: 0.4, batch: 4, hpScale: 4.60, boss: null }, // [20s 암살자 매복 이벤트]
      8: { mobs: ['assassin', 'golem', 'cultist'], interval: 0.35, batch: 8, hpScale: 5.40, bossTime: 22, bossStage: 8 }, // [물량 2배 구간: batch 8]
      9: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.28, batch: 5, hpScale: 6.80, boss: null }, // [체력 점프 3구간]
      10: { mobs: ['gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.24, batch: 5, hpScale: 8.50, bossTime: 12, bossStage: 10 },
      // --- 11~15 Hell 난이도 ---
      11: { mobs: ['bloodHound', 'assassin'], interval: 0.24, batch: 5, hpScale: 9.5, boss: null }, // [초고속 돌진 맹견 떼]
      12: { mobs: ['darkMage', 'bloodHound', 'gargoyle'], interval: 0.22, batch: 5, hpScale: 12.0, bossTime: 14, bossStage: 12 }, // [원거리 마법 탄막 + 리치 보스]
      13: { mobs: ['wraithSwarm', 'bat', 'ghost'], interval: 0.20, batch: 8, hpScale: 15.0, boss: null }, // [망령 군단 대습격 8마리 스웜]
      14: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm'], interval: 0.18, batch: 6, hpScale: 18.5, boss: null }, // [심연 타이탄 방벽 + 원거리 포격]
      15: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'golem'], interval: 0.15, batch: 7, hpScale: 23.0, bossTime: 12, bossStage: 15 }, // [사신 강림]
      // --- 16~20 Abyss Chaos 난이도 ---
      16: { mobs: ['darkMage', 'bloodHound', 'assassin', 'gargoyle'], interval: 0.16, batch: 6, hpScale: 20.0, boss: null },
      17: { mobs: ['wraithSwarm', 'ghost', 'cultist'], interval: 0.15, batch: 6, hpScale: 22.0, boss: null }, // [20s 망령 대군단 이벤트]
      18: { mobs: ['abyssTitan', 'golem', 'bloodHound'], interval: 0.14, batch: 7, hpScale: 25.0, bossTime: 12, bossStage: 18 }, // [공허의 지네 보스]
      19: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound', 'wraithSwarm', 'abyssTitan'], interval: 0.12, batch: 7, hpScale: 28.0, boss: null }, // [전 몬스터 총출동 난전]
      20: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'assassin'], interval: 0.12, batch: 8, hpScale: 30.0, bossTime: 12, bossStage: 20 }, // [혼돈의 절대신]
      // --- 21~25 The Abyss Sovereign 난이도 (확장 구간) ---
      21: { mobs: ['darkMage', 'cultist', 'bloodHound', 'assassin'], interval: 0.12, batch: 7, hpScale: 32.0, boss: null },
      22: { mobs: ['abyssTitan', 'wraithSwarm', 'gargoyle'], interval: 0.11, batch: 8, hpScale: 34.0, boss: null },
      23: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'golem'], interval: 0.11, batch: 8, hpScale: 36.0, boss: null },
      24: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound', 'wraithSwarm', 'abyssTitan'], interval: 0.10, batch: 9, hpScale: 38.0, boss: null },
      25: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'assassin'], interval: 0.10, batch: 8, hpScale: 42.0, bossTime: 12, bossStage: 25 }
    };

    // 월드 2 (심해 대협곡 20스테이지)
    this.world2StageConfigs = {
      1: { mobs: ['plankton', 'jellyfish'], interval: 0.8, batch: 2, hpScale: 1.0, boss: null },
      2: { mobs: ['jellyfish', 'hermitCrab'], interval: 0.7, batch: 2, hpScale: 1.15, boss: null },
      3: { mobs: ['hermitCrab', 'flyingFish', 'plankton'], interval: 0.6, batch: 3, hpScale: 1.6, boss: null },
      4: { mobs: ['flyingFish', 'seaLobster', 'hermitCrab'], interval: 0.55, batch: 6, hpScale: 1.85, boss: null },
      5: { mobs: ['seaLobster', 'plankton', 'flyingFish'], interval: 0.5, batch: 3, hpScale: 2.3, bossTime: 14, bossStage: 205 }, // 1대 보스: 크라켄
      6: { mobs: ['seaLobster', 'stingray', 'hermitCrab'], interval: 0.45, batch: 4, hpScale: 3.4, boss: null },
      7: { mobs: ['stingray', 'coralGolem', 'seaLeech'], interval: 0.4, batch: 4, hpScale: 4.6, boss: null },
      8: { mobs: ['coralGolem', 'seaLeech', 'stingray'], interval: 0.35, batch: 8, hpScale: 5.5, boss: null },
      9: { mobs: ['coralGolem', 'seaLeech', 'anglerFish', 'ghostJelly'], interval: 0.28, batch: 5, hpScale: 6.8, boss: null },
      10: { mobs: ['anglerFish', 'ghostJelly', 'coralGolem'], interval: 0.24, batch: 5, hpScale: 8.5, bossTime: 12, bossStage: 210 }, // 2대 보스: 타이탄 크랩
      11: { mobs: ['deepShark', 'seaLeech', 'flyingFish'], interval: 0.24, batch: 5, hpScale: 10.0, boss: null },
      12: { mobs: ['deepShark', 'poisonRay', 'anglerFish'], interval: 0.22, batch: 5, hpScale: 12.5, boss: null },
      13: { mobs: ['poisonRay', 'deepShark', 'ghostJelly'], interval: 0.20, batch: 8, hpScale: 15.0, boss: null },
      14: { mobs: ['shadowEel', 'poisonRay', 'deepShark'], interval: 0.18, batch: 6, hpScale: 18.5, boss: null },
      15: { mobs: ['shadowEel', 'deepShark', 'voidSeaSerpent'], interval: 0.16, batch: 6, hpScale: 23.0, bossTime: 12, bossStage: 215 }, // 3대 보스: 레비아탄
      16: { mobs: ['voidSeaSerpent', 'trilobite', 'shadowEel'], interval: 0.15, batch: 7, hpScale: 26.0, boss: null },
      17: { mobs: ['trilobite', 'voidSeaSerpent', 'stingray'], interval: 0.14, batch: 7, hpScale: 29.0, boss: null },
      18: { mobs: ['trilobite', 'voidSeaSerpent', 'deepShark', 'poisonRay'], interval: 0.13, batch: 7, hpScale: 33.0, boss: null },
      19: { mobs: ['plankton', 'jellyfish', 'hermitCrab', 'flyingFish', 'seaLobster', 'stingray', 'coralGolem', 'seaLeech', 'anglerFish', 'ghostJelly', 'deepShark', 'poisonRay', 'shadowEel', 'voidSeaSerpent', 'trilobite'], interval: 0.11, batch: 8, hpScale: 37.0, boss: null },
      20: { mobs: ['voidSeaSerpent', 'trilobite', 'deepShark', 'shadowEel'], interval: 0.10, batch: 8, hpScale: 42.0, bossTime: 10, bossStage: 220 } // 최종 보스: 다곤
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

    // 보스 스폰 조건 검사 (해당 스테이지에 보스가 있고 아직 스폰되지 않았을 때)
    if (config.bossStage && !this.bossSpawnedThisStage) {
      if (elapsed >= config.bossTime) {
        this.spawnBoss(config.bossStage);
      }
    }

    // [최종 20스테이지 기믹] 시간 제한 만료 시 즉사급 붉은 사신(The Red Death) 강림 및 60초마다 추가 소환
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
          this.triggerEventWave('🌊 [돌발 웨이브] 청록 해파리 무리의 집단 발광!', 'jellyfish', 26, config.hpScale);
        } else if (this.currentStage === 8) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🦀 [돌발 웨이브] 뿔소라게 떼의 바닥 행진!', 'hermitCrab', 24, config.hpScale);
        } else if (this.currentStage === 13) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('🦈 [돌발 웨이브] 메갈로돈 상어 떼의 피의 추격!', 'deepShark', 20, config.hpScale);
        } else if (this.currentStage === 17) {
          this.eventWaveTriggered = true;
          this.triggerEventWave('⚡ [돌발 웨이브] 심연 전기 가오리의 번개 폭풍!', 'stingray', 22, config.hpScale);
        }
      } else {
      if (this.currentStage === 3) {
        this.eventWaveTriggered = true;
        this.triggerEventWave('🦇 [돌발 웨이브] 박쥐 떼의 공중 대습격!', 'bat', 24, config.hpScale);
      } else if (this.currentStage === 5) {
        this.eventWaveTriggered = true;
        this.triggerEventWave('🟢 [돌발 웨이브] 슬라임 군단의 대폭주!', 'slime', 16, config.hpScale);
      } else if (this.currentStage === 7) {
        this.eventWaveTriggered = true;
        this.triggerEventWave('🗡️ [돌발 웨이브] 그림자 암살자단의 기습 매복!', 'assassin', 8, config.hpScale);
      } else if (this.currentStage === 17) {
        this.eventWaveTriggered = true;
        this.triggerEventWave('🌌 [돌발 웨이브] 원혼과 망령 군단의 대습격!', 'wraithSwarm', 22, config.hpScale);
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
      // 보스 처치 즉시 1회 업그레이드 카드 선택창 오픈
      this.game.triggerBossRewardCard();

      if (isRedReaper || this.currentStage >= this.maxStage) {
        // 진 붉은 사신 또는 20스테이지 진 최종 보스(혼돈의 절대신) 격파 시 대망의 최종 승리!
        this.game.triggerVictory();
      } else {
        if (this.stageTimeLeft <= 0 || config.bossStage) {
          this.advanceStage();
        }
      }
    } else if (!config.bossStage && this.stageTimeLeft <= 0) {
      // 일반 스테이지는 타이머 종료 시 다음 스테이지로
      if (this.currentStage < this.maxStage) {
        this.advanceStage();
      }
    }
  }

  // 돌발 이벤트 웨이브 발동
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

      // [밸런스 조정] 원거리 몬스터(흑마술사, 타락한 마도사 등) 생성량을 기존의 2/3로 감소
      // 원거리 몬스터가 추첨되었을 때 1/3(33.3%) 확률로 비원거리 몬스터로 교체하거나 스폰 생략
      if (typeDef.isRanged && Math.random() < (1 / 3)) {
        const meleeMobs = mobs.filter(m => !(ENEMY_TYPES[m] && ENEMY_TYPES[m].isRanged));
        if (meleeMobs.length > 0) {
          mobKey = meleeMobs[Math.floor(Math.random() * meleeMobs.length)];
          typeDef = ENEMY_TYPES[mobKey] || {};
        } else {
          // 비원거리 대체 몹이 없는 경우 해당 1마리 스폰 건너뛰기
          continue;
        }
      }

      const isFlying = !!typeDef.isFlying;

      const angle = Math.random() * Math.PI * 2;
      let x, y;

      if (isFlying) {
        // 공중 몬스터: 부유섬 밖 머나먼 우주 공간(spawnDistance + 120)에서도 자유롭게 생성되어 섬으로 비행 진입
        const dist = spawnDistance + Math.random() * 140;
        x = player.x + Math.cos(angle) * dist;
        y = player.y + Math.sin(angle) * dist;
      } else {
        // 그라운드 몬스터: 우주로 떨어지지 않고 반드시 부유섬 내부 [-islandBound, islandBound] 영역에서만 스폰
        const dist = spawnDistance + Math.random() * 60;
        let targetX = player.x + Math.cos(angle) * dist;
        let targetY = player.y + Math.sin(angle) * dist;

        // 부유섬 지면 내부로 위치 제한
        targetX = Math.max(-boundW, Math.min(boundW, targetX));
        targetY = Math.max(-boundH, Math.min(boundH, targetY));

        // 플레이어와 너무 가깝게 클램핑된 경우 안전 거리(최소 260px) 유지 재보정
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

    // 보스가 공중형/자유비행(4, 12, 15, 18, 20)이 아닌 경우 부유섬 내부로 보정
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

    // 경보 사운드 및 HUD 배너 알림
    sounds.playBossAlarm();
    this.game.ui.showBossAlert(boss.name);
  }

  // 20스테이지 시간 만료 시 즉사급 붉은 사신(The Red Death) 소환
  spawnRedReaper() {
    const player = this.game.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 520;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const reaper = new BossEnemy(99, x, y);
    this.game.enemies.push(reaper);

    // 긴급 사운드, 햅틱 진동, HUD 경고 배너
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
      // 최종 스테이지 클리어! 승리 모달
      this.game.triggerVictory();
      return;
    }

    // 다음 스테이지로 전이
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
