// 15스테이지 웨이브 매니저 및 몬스터 스폰 스케줄러

class WaveManager {
  constructor(game) {
    this.game = game;
    this.currentStage = 1;
    this.maxStage = 20;
    this.stageDuration = 45.0; // 스테이지당 45초 (웨이브 템포 단축)
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;

    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
    this.eventWaveTriggered = false;
    this.isStageClearing = false;

    // 20개 스테이지별 몬스터 구성 및 기하급수 지옥 난이도 스케일링 설정
    this.stageConfigs = {
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
      12: { mobs: ['darkMage', 'bloodHound', 'gargoyle'], interval: 0.22, batch: 5, hpScale: 12.0, bossTime: 22, bossStage: 12 }, // [원거리 마법 탄막 + 리치 보스]
      13: { mobs: ['wraithSwarm', 'bat', 'ghost'], interval: 0.20, batch: 8, hpScale: 15.0, boss: null }, // [망령 군단 대습격 8마리 스웜]
      14: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm'], interval: 0.18, batch: 6, hpScale: 18.5, boss: null }, // [심연 타이탄 방벽 + 원거리 포격]
      15: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'golem'], interval: 0.15, batch: 7, hpScale: 23.0, bossTime: 12, bossStage: 15 }, // [사신 강림]
      // --- 16~20 Abyss Chaos 난이도 (20웨이브 확장) ---
      16: { mobs: ['darkMage', 'bloodHound', 'assassin', 'gargoyle'], interval: 0.14, batch: 7, hpScale: 27.0, boss: null },
      17: { mobs: ['wraithSwarm', 'ghost', 'cultist'], interval: 0.13, batch: 8, hpScale: 32.0, boss: null }, // [20s 망령 대군단 이벤트]
      18: { mobs: ['abyssTitan', 'golem', 'bloodHound'], interval: 0.12, batch: 8, hpScale: 37.0, bossTime: 20, bossStage: 18 }, // [공허의 지네 보스]
      19: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound', 'wraithSwarm', 'abyssTitan'], interval: 0.11, batch: 9, hpScale: 44.0, boss: null }, // [전 몬스터 총출동 난전]
      20: { mobs: ['abyssTitan', 'darkMage', 'bloodHound', 'wraithSwarm', 'assassin'], interval: 0.10, batch: 10, hpScale: 52.0, bossTime: 12, bossStage: 20 } // [진 최종 결전: 혼돈의 절대신]
    };
  }

  reset() {
    this.currentStage = 1;
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;
    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
    this.eventWaveTriggered = false;
    this.isStageClearing = false;
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

    // 돌발 이벤트 웨이브 검사
    if (!this.eventWaveTriggered && elapsed >= 20) {
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

    // 일반 몬스터 스폰 루프
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = config.interval;
      this.spawnBatch(config.mobs, config.batch, config.hpScale);
    }

    // 보스 격파 여부 확인
    if (this.activeBoss && this.activeBoss.isDead) {
      this.activeBoss = null;
      // 보스 처치 즉시 1회 업그레이드 카드 선택창 오픈
      this.game.triggerBossRewardCard();
      // 보스가 처치되었고 타이머가 만료되었거나 보스 처치로 조기 클리어
      if (this.stageTimeLeft <= 0 || config.bossStage) {
        this.advanceStage();
      }
    } else if (!config.bossStage && this.stageTimeLeft <= 0) {
      // 일반 스테이지는 타이머 종료 시 다음 스테이지로
      this.advanceStage();
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
    const islandBound = 1540;

    for (let i = 0; i < count; i++) {
      const mobKey = mobs[Math.floor(Math.random() * mobs.length)];
      const typeDef = ENEMY_TYPES[mobKey] || {};
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
        targetX = Math.max(-islandBound, Math.min(islandBound, targetX));
        targetY = Math.max(-islandBound, Math.min(islandBound, targetY));

        // 플레이어와 너무 가깝게 클램핑된 경우 안전 거리(최소 260px) 유지 재보정
        const d = Math.hypot(targetX - player.x, targetY - player.y);
        if (d < 260) {
          const escapeAngle = Math.atan2(targetY - player.y, targetX - player.x) || angle;
          targetX = Math.max(-islandBound, Math.min(islandBound, player.x + Math.cos(escapeAngle) * 320));
          targetY = Math.max(-islandBound, Math.min(islandBound, player.y + Math.sin(escapeAngle) * 320));
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
    const isFlyingBoss = (bossStage === 4 || bossStage === 12 || bossStage === 15 || bossStage === 18 || bossStage === 20);
    if (!isFlyingBoss) {
      x = Math.max(-1500, Math.min(1500, x));
      y = Math.max(-1500, Math.min(1500, y));
    }

    const boss = new BossEnemy(bossStage, x, y);
    this.activeBoss = boss;
    this.game.enemies.push(boss);

    // 경보 사운드 및 HUD 배너 알림
    sounds.playBossAlarm();
    this.game.ui.showBossAlert(boss.name);
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
