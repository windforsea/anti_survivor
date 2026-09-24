#!/usr/bin/env node

/**
 * Anti Survivors 신규 월드 스캐폴더 (scaffold_world.js)
 * 신규 월드(3, 4 등)를 생성할 때 필요한 7대 핵심 파일의 뼈대 코드 조각을 일괄 생성합니다.
 */

const args = process.argv.slice(2);
const worldNum = parseInt(args[0]) || 3;
const worldName = args[1] || `월드 ${worldNum}`;
const mapW = parseInt(args[2]) || 6000;
const mapH = parseInt(args[3]) || 1800;

const halfW = Math.round(mapW / 2);
const halfH = Math.round(mapH / 2);
const boundW = halfW - 50;
const boundH = halfH - 40;

console.log(`========================================================`);
console.log(`🗺️ [Anti Survivors] 월드 ${worldNum}: ${worldName} 스캐폴딩 생성기`);
console.log(`   맵 규격: ${mapW} x ${mapH} px (경계: ±${boundW}, ±${boundH})`);
console.log(`========================================================\n`);

console.log(`--- [1. index.html - #stageSelectModal 내 추가할 카드 마크업] ---`);
console.log(`
<!-- 월드 ${worldNum}: ${worldName} -->
<div class="stage-card" data-world="${worldNum}">
  <div class="stage-card-badge world${worldNum}">WORLD ${worldNum} · 20 STAGES</div>
  <div class="stage-avatar-box world${worldNum}-box">
    <span class="stage-icon">🔥</span>
  </div>
  <h3 class="stage-name">${worldName}</h3>
  <p class="stage-type-tag">협곡/필드형 (${mapW} x ${mapH})</p>
  <p class="stage-desc">${worldName}의 극한 환경. 15종 전용 마물과 4대 보스가 도사리고 있습니다.</p>
  <div class="stage-info-list">
    <div class="stage-info-row"><span>주요 지형</span><strong>전용 필드 (${mapW} x ${mapH})</strong></div>
    <div class="stage-info-row"><span>환경 장애물</span><strong>바위, 자연물, 보물상자</strong></div>
    <div class="stage-info-row"><span>최종 보스</span><strong style="color: #ef4444;">👑 4대 대군주</strong></div>
  </div>
  <button class="stage-select-btn world${worldNum}-btn" data-world="${worldNum}">${worldName} 출격</button>
</div>
`);

console.log(`--- [2. js/main.js - getWorldBoundaries() 분기 추가] ---`);
console.log(`
// js/main.js - getWorldBoundaries() 내 추가:
else if (this.currentWorld === ${worldNum}) {
  return { boundW: ${boundW}, boundH: ${boundH} };
}
`);

console.log(`--- [3. js/waveManager.js - setWorld() 및 타임라인 설정] ---`);
console.log(`
// js/waveManager.js - world${worldNum}StageConfigs 정의:
this.world${worldNum}StageConfigs = {
  1: { mobs: ['w${worldNum}_mob1', 'w${worldNum}_mob2'], interval: 0.8, batch: 2, hpScale: 1.0, boss: null },
  2: { mobs: ['w${worldNum}_mob2', 'w${worldNum}_mob3'], interval: 0.7, batch: 2, hpScale: 1.15, boss: null },
  3: { mobs: ['w${worldNum}_mob3', 'w${worldNum}_mob4'], interval: 0.6, batch: 3, hpScale: 1.6, boss: null },
  4: { mobs: ['w${worldNum}_mob4', 'w${worldNum}_mob5'], interval: 0.55, batch: 6, hpScale: 1.85, boss: null },
  5: { mobs: ['w${worldNum}_mob5', 'w${worldNum}_mob1'], interval: 0.5, batch: 3, hpScale: 2.3, bossTime: 18, bossStage: ${worldNum}05 }, // 1대 미니보스
  // 6 ~ 9 스테이지...
  10: { mobs: ['w${worldNum}_mob6', 'w${worldNum}_mob7'], interval: 0.24, batch: 5, hpScale: 8.5, bossTime: 14, bossStage: ${worldNum}10 }, // 2대 중간보스
  // 11 ~ 14 스테이지...
  15: { mobs: ['w${worldNum}_mob10', 'w${worldNum}_mob11'], interval: 0.16, batch: 6, hpScale: 23.0, bossTime: 14, bossStage: ${worldNum}15 }, // 3대 대보스
  // 16 ~ 19 스테이지...
  20: { mobs: ['w${worldNum}_mob14', 'w${worldNum}_mob15'], interval: 0.10, batch: 8, hpScale: 42.0, bossTime: 12, bossStage: ${worldNum}20 } // 4대 최종보스
};
`);

console.log(`--- [4. js/bosses.js - 4대 보스 ID 및 HP 권장 규격] ---`);
console.log(`
- 보스 1 (Stage ${worldNum}-5 / ID: ${worldNum}05) : HP 9,000 ~ 11,000, 쾌속 돌진 & 3발 탄막
- 보스 2 (Stage ${worldNum}-10 / ID: ${worldNum}10) : HP 25,000 ~ 28,000, 넉백 면역 & 광역 슬로우 강타
- 보스 3 (Stage ${worldNum}-15 / ID: ${worldNum}15) : HP 65,000 ~ 75,000, 나선형 특수 탄막 & 전방위 파동
- 보스 4 (Stage ${worldNum}-20 / ID: ${worldNum}20) : HP 130,000 ~ 150,000, 진 최종 보스 (3중 복합 탄막)
`);

console.log(`✨ 월드 ${worldNum} 스캐폴딩 뼈대 출력 완료!`);
