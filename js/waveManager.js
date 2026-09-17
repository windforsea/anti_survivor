// 10스테이지 웨이브 매니저 및 몬스터 스폰 스케줄러

class WaveManager {
  constructor(game) {
    this.game = game;
    this.currentStage = 1;
    this.maxStage = 10;
    this.stageDuration = 60.0; // 스테이지당 60초 (옵션 A 시간제 웨이브)
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;

    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
    this.isStageClearing = false;

    // 10개 스테이지별 몬스터 구성 및 3웨이브 주기 체력 점프(HP Jump) 스케일링 설정
    this.stageConfigs = {
      1: { mobs: ['bat', 'slime'], interval: 0.8, batch: 2, hpScale: 1.0, boss: null },
      2: { mobs: ['slime', 'zombie'], interval: 0.7, batch: 2, hpScale: 1.15, bossTime: 30, bossStage: 2 },
      3: { mobs: ['zombie', 'skeleton', 'goblin'], interval: 0.6, batch: 3, hpScale: 1.65, boss: null }, // [체력 점프 1구간]
      4: { mobs: ['skeleton', 'goblin', 'ghost'], interval: 0.55, batch: 6, hpScale: 1.85, bossTime: 30, bossStage: 4 }, // [물량 2배 구간: batch 6]
      5: { mobs: ['ghost', 'gargoyle', 'cultist'], interval: 0.5, batch: 3, hpScale: 2.15, boss: null },
      6: { mobs: ['cultist', 'gargoyle', 'assassin'], interval: 0.45, batch: 4, hpScale: 2.80, bossTime: 30, bossStage: 6 }, // [체력 점프 2구간 (+30%)]
      7: { mobs: ['gargoyle', 'assassin', 'golem'], interval: 0.4, batch: 4, hpScale: 3.55, boss: null },
      8: { mobs: ['assassin', 'golem', 'cultist'], interval: 0.35, batch: 8, hpScale: 4.00, bossTime: 30, bossStage: 8 }, // [물량 2배 구간: batch 8]
      9: { mobs: ['bat', 'slime', 'zombie', 'skeleton', 'goblin', 'ghost', 'gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.28, batch: 5, hpScale: 5.60, boss: null }, // [체력 점프 3구간]
      10: { mobs: ['gargoyle', 'cultist', 'assassin', 'golem'], interval: 0.24, batch: 5, hpScale: 7.20, bossTime: 15, bossStage: 10 }
    };
  }

  reset() {
    this.currentStage = 1;
    this.stageTimeLeft = this.stageDuration;
    this.spawnTimer = 0;
    this.activeBoss = null;
    this.bossSpawnedThisStage = false;
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

    // 보스 스폰 조건 검사 (해당 스테이지에 보스가 있고 아직 스폰되지 않았을 때)
    if (config.bossStage && !this.bossSpawnedThisStage) {
      const elapsed = this.stageDuration - this.stageTimeLeft;
      if (elapsed >= config.bossTime) {
        this.spawnBoss(config.bossStage);
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

  spawnBatch(mobs, count, hpScale) {
    const player = this.game.player;
    const viewWidth = this.game.canvas.width;
    const viewHeight = this.game.canvas.height;
    const spawnDistance = Math.max(viewWidth, viewHeight) / 2 + 100;

    for (let i = 0; i < count; i++) {
      const mobKey = mobs[Math.floor(Math.random() * mobs.length)];
      // 화면 밖 원형 위치 계산
      const angle = Math.random() * Math.PI * 2;
      const x = player.x + Math.cos(angle) * (spawnDistance + Math.random() * 80);
      const y = player.y + Math.sin(angle) * (spawnDistance + Math.random() * 80);

      const enemy = new Enemy(mobKey, x, y, hpScale);
      this.game.enemies.push(enemy);
    }
  }

  spawnBoss(bossStage) {
    this.bossSpawnedThisStage = true;
    const player = this.game.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = 380;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

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
      this.activeBoss = null;
      this.isStageClearing = false;
    }, 2000);
  }
}
