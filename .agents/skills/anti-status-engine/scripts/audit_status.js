// anti-status-engine: 상태이상 정합성 및 무결성 감사 스크립트
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../../');
let errors = [];
let passed = 0;

function check(desc, condition) {
  if (condition) {
    passed++;
    console.log(`  [OK] ${desc}`);
  } else {
    errors.push(desc);
    console.error(`  [FAIL] ${desc}`);
  }
}

console.log('=== [anti-status-engine] 상태이상 시스템 무결성 감사 ===\n');

// 1. enemies.js 검사
const enemiesPath = path.join(rootDir, 'js/enemies.js');
const enemiesCode = fs.readFileSync(enemiesPath, 'utf8');

check('enemies.js: 피격 플래시 0.05초 최적화', enemiesCode.includes('this.hitFlashTimer = 0.05'));
check('enemies.js: 중독 최대 3중첩 적용', enemiesCode.includes('Math.min(3, (this.poisonStacks || 0) + 1)'));
check('enemies.js: 중독 만료 시 스택 초기화', enemiesCode.includes('this.poisonStacks = 0'));
check('enemies.js: 중독 틱 데미지 스택 비례 적용', enemiesCode.includes('(this.poisonDps || 10) * 0.5 * stacks'));
check('enemies.js: 피격 시 shadowBlur 네온 연산 건너뛰기 최적화', enemiesCode.includes('if (!isHit) {') && enemiesCode.includes('ctx.shadowBlur = 10;'));

// 2. weaponExecutors.js 검사
const executorsPath = path.join(rootDir, 'js/weaponExecutors.js');
const executorsCode = fs.readFileSync(executorsPath, 'utf8');

check('weaponExecutors.js: 번개반지 25% 확률 0.4초 기절 추가', executorsCode.includes('Math.random() < 0.25') && executorsCode.includes('e.freeze(0.4)'));
check('weaponExecutors.js: 벼락검 30% 확률 0.5초 기절 추가', executorsCode.includes('Math.random() < 0.30') && executorsCode.includes('enemy.freeze(0.5)'));
check('weaponExecutors.js: 뇌전포 25% 확률 0.4초 기절 추가', executorsCode.includes('hitEnemy.freeze(0.4)') && executorsCode.includes('other.freeze(0.4)'));
check('weaponExecutors.js: 블리자드 냉기단검(frostDagger) 방출', executorsCode.includes("type: 'frostDagger'"));
check('weaponExecutors.js: 섀도우 차크람 독화살 분리 방출(triggerShadowVortexShards)', executorsCode.includes('triggerShadowVortexShards'));

// 3. weapons.js 검사
const weaponsPath = path.join(rootDir, 'js/weapons.js');
const weaponsCode = fs.readFileSync(weaponsPath, 'utf8');

check('weapons.js: frostDagger 1초 감속 부여', weaponsCode.includes('enemy.slowTimer = Math.max(enemy.slowTimer || 0, 1.0)') && weaponsCode.includes('enemy.slowMult = 0.60'));
check('weapons.js: shadowVortex 충돌 시 triggerShadowVortexShards 연동', weaponsCode.includes('this.triggerShadowVortexShards(enemy.x, enemy.y, p.area'));

// 4. cards.js 검사
const cardsPath = path.join(rootDir, 'js/cards.js');
const cardsCode = fs.readFileSync(cardsPath, 'utf8');

check('cards.js: 뇌전포 기절 설명 포함', cardsCode.includes('고전압 뇌전 산탄 일제 사격 및 체인 라이트닝·낙뢰 폭격 (25% 확률 0.4초 기절)'));
check('cards.js: 블리자드 감속 설명 포함', cardsCode.includes('거대 서리 구체 전진 파동 및 8방향 냉기단검 폭발 방출 (1초간 대폭 감속)'));
check('cards.js: 벼락검 기절 설명 포함', cardsCode.includes('전방 강타 베기 및 타겟 적 벼락 강타 (30% 확률 0.5초 기절)'));

console.log(`\n검사 결과: 통과 ${passed}건 / 실패 ${errors.length}건`);
if (errors.length > 0) {
  console.error('\n실패 항목:');
  errors.forEach(e => console.error(` - ${e}`));
  process.exit(1);
} else {
  console.log('\n모든 상태이상 시스템 정합성 감사를 완벽히 통과했습니다!');
}
