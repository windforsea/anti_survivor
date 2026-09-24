#!/usr/bin/env node

/**
 * Anti Survivors 난이도 밸런스 시뮬레이터 (simulate_balance.js)
 * 스테이지별 몬스터 구성, 스폰 주기, 체력 배율 및 보스 TTK를 정량 분석합니다.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../..');
const enemiesFile = path.join(rootDir, 'js', 'enemies.js');
const waveFile = path.join(rootDir, 'js', 'waveManager.js');

if (!fs.existsSync(enemiesFile) || !fs.existsSync(waveFile)) {
  console.error('❌ 핵심 소스 파일을 찾을 수 없습니다.');
  process.exit(1);
}

// 1. ENEMY_TYPES 추출
const enemiesCode = fs.readFileSync(enemiesFile, 'utf8');
const enemyTypesMatch = enemiesCode.match(/const ENEMY_TYPES = \{([\s\S]*?)\n\};/);
if (!enemyTypesMatch) {
  console.error('❌ ENEMY_TYPES 파싱 실패');
  process.exit(1);
}

const enemyHpMap = {};
const typeLines = enemyTypesMatch[1].split('\n');
for (const line of typeLines) {
  const m = line.match(/^\s*(\w+):\s*\{.*hp:\s*(\d+)/);
  if (m) {
    enemyHpMap[m[1]] = parseInt(m[2]);
  }
}

// 2. 보스 HP 스펙 매핑
const bossHpMap = {
  // 월드 1
  2: { name: '돌진 맹수', hp: 1600 },
  4: { name: '그림자 마법사', hp: 3400 },
  6: { name: '혼돈의 눈', hp: 5800 },
  8: { name: '불멸의 골렘', hp: 9800 },
  10: { name: '파멸의 군주', hp: 18000 },
  12: { name: '심연의 리치', hp: 26000 },
  15: { name: '종말의 사신', hp: 52000 },
  18: { name: '공허의 지네', hp: 48000 },
  20: { name: '혼돈의 절대신', hp: 68000 },
  25: { name: '심연의 군주', hp: 88000 },
  // 월드 2
  205: { name: '심해 대왕 문어', hp: 4200 },
  210: { name: '타이탄 크랩', hp: 16000 },
  215: { name: '심해의 레비아탄', hp: 38000 },
  220: { name: '심연 고대신 다곤', hp: 78000 }
};

// 3. 플레이어 평균 예상 DPS 곡선 (레벨/무기 성장 모델)
function getEstimatedPlayerDPS(stageNum) {
  if (stageNum <= 3) return 35 + stageNum * 12; // 1~3: 47 ~ 71 DPS
  if (stageNum <= 5) return 80 + (stageNum - 3) * 35; // 4~5: 115 ~ 150 DPS
  if (stageNum <= 9) return 160 + (stageNum - 5) * 55; // 6~9: 215 ~ 380 DPS
  if (stageNum <= 10) return 480; // 10: 480 DPS
  if (stageNum <= 14) return 550 + (stageNum - 10) * 110; // 11~14: 660 ~ 990 DPS (1차 진화 완료)
  if (stageNum <= 15) return 1200; // 15: 1200 DPS
  if (stageNum <= 19) return 1350 + (stageNum - 15) * 180; // 16~19: 1530 ~ 2070 DPS (2~3차 진화)
  return 2400 + (stageNum - 20) * 150; // 20+: 2400 ~ 3150 DPS
}

// 4. waveManager.js에서 스테이지 설정 로드
const waveCode = fs.readFileSync(waveFile, 'utf8');

function extractStageConfigs(varName) {
  const regex = new RegExp(`this\\.${varName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`);
  const match = waveCode.match(regex);
  if (!match) return null;

  const configs = {};
  const stageBlock = match[1];
  const stageMatches = stageBlock.matchAll(/(\d+):\s*\{([^}]+)\}/g);
  for (const sm of stageMatches) {
    const sNum = parseInt(sm[1]);
    const body = sm[2];
    const mobsM = body.match(/mobs:\s*\[(.*?)\]/);
    const intervalM = body.match(/interval:\s*([\d.]+)/);
    const batchM = body.match(/batch:\s*(\d+)/);
    const hpScaleM = body.match(/hpScale:\s*([\d.]+)/);
    const bossStageM = body.match(/bossStage:\s*(\d+)/);

    configs[sNum] = {
      mobs: mobsM ? mobsM[1].replace(/['"\s]/g, '').split(',') : ['bat'],
      interval: intervalM ? parseFloat(intervalM[1]) : 0.8,
      batch: batchM ? parseInt(batchM[1]) : 2,
      hpScale: hpScaleM ? parseFloat(hpScaleM[1]) : 1.0,
      bossStage: bossStageM ? parseInt(bossStageM[1]) : null
    };
  }
  return configs;
}

const w1Configs = extractStageConfigs('world1StageConfigs');
const w2Configs = extractStageConfigs('world2StageConfigs');

const targetArg = process.argv[2];

function simulateWorld(worldTitle, configs) {
  console.log(`\n========================================================================================`);
  console.log(`📊 [${worldTitle}] 밸런스 시뮬레이션 및 난이도 곡선 분석`);
  console.log(`========================================================================================`);

  const results = [];
  let prevDpsReq = 0;

  for (let s = 1; configs[s]; s++) {
    const cfg = configs[s];
    // 평균 몬스터 기본 HP
    let sumHp = 0;
    for (const m of cfg.mobs) {
      sumHp += (enemyHpMap[m] || 15);
    }
    const avgBaseHp = sumHp / cfg.mobs.length;
    const avgHp = avgBaseHp * cfg.hpScale;

    // 초당 스폰 마리 수 및 초당 적 HP 유입량 (DPS 요구치)
    const spawnPerSec = cfg.batch / cfg.interval;
    const dpsReq = Math.round(spawnPerSec * avgHp);

    // 플레이어 예상 DPS 대비 부담률 (%)
    const playerDPS = getEstimatedPlayerDPS(s);
    const pressurePct = Math.round((dpsReq / playerDPS) * 100);

    // 보스 TTK (Time to Kill)
    let bossInfo = '-';
    let bossTTK = '-';
    if (cfg.bossStage && bossHpMap[cfg.bossStage]) {
      const b = bossHpMap[cfg.bossStage];
      const ttk = Math.round(b.hp / playerDPS);
      bossInfo = `${b.name} (${b.hp.toLocaleString()} HP)`;
      bossTTK = `${ttk}초`;
    }

    // 난이도 스파이크 판정 (이전 스테이지 대비 2.2배 이상 급증)
    let status = '✅ OK';
    if (prevDpsReq > 0 && dpsReq >= prevDpsReq * 2.2) {
      status = '⚠️ SPIKE';
    }
    prevDpsReq = dpsReq;

    results.push({
      Stage: `Stage ${s}`,
      'Interval/Batch': `${cfg.interval}s / ${cfg.batch}마리`,
      'Spawn/s': `${spawnPerSec.toFixed(1)}/s`,
      'HP Scale': `x${cfg.hpScale.toFixed(2)}`,
      'DPS Req (HP/s)': `${dpsReq.toLocaleString()} HP/s`,
      'Player DPS': `${playerDPS} DPS`,
      'Pressure': `${pressurePct}%`,
      'Boss TTK': bossTTK,
      'Status': status
    });
  }

  console.table(results);
}

if (!targetArg || targetArg === '1') {
  if (w1Configs) simulateWorld('월드 1: 심연의 부유섬 (25 Stages)', w1Configs);
}
if (!targetArg || targetArg === '2') {
  if (w2Configs) simulateWorld('월드 2: 심해 대협곡 (20 Stages)', w2Configs);
}

console.log(`\n💡 분석 요약:`);
console.log(`- Pressure < 100%: 플레이어가 적을 수월하게 쓸어담으며 전진하는 쾌감 구간`);
console.log(`- Pressure 100% ~ 180%: 긴장감 있는 교전 및 컨트롤 요구 구간`);
console.log(`- Pressure > 250% 또는 ⚠️ SPIKE: 물량 압살 위험 구간 (스폰 주기 완화 권장)`);
console.log(`- Boss TTK 권장: 10초 ~ 28초 내외 (적정 긴장감 유지)`);
