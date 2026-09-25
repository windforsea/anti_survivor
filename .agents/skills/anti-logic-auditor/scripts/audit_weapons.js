// Anti Survivors 전투 엔진 및 무기 로직 정적 감사 스크립트
// 실행법: node .agents/skills/anti-logic-auditor/scripts/audit_weapons.js

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../../');
const weaponDataFile = path.join(rootDir, 'js/weaponData.js');
const weaponsFile = path.join(rootDir, 'js/weapons.js');
const weaponExecutorsFile = path.join(rootDir, 'js/weaponExecutors.js');
const cardsFile = path.join(rootDir, 'js/cards.js');

console.log('🔍 [Anti Survivors] 전투 엔진 및 무기 정합성 감사 시작...\n');

if (!fs.existsSync(weaponDataFile) || !fs.existsSync(weaponsFile) || !fs.existsSync(cardsFile)) {
  console.error('❌ 필수 JS 파일을 찾을 수 없습니다. 경로를 확인하세요.');
  process.exit(1);
}

const weaponDataContent = fs.readFileSync(weaponDataFile, 'utf8');
const weaponsContent = fs.readFileSync(weaponsFile, 'utf8') + (fs.existsSync(weaponExecutorsFile) ? '\n' + fs.readFileSync(weaponExecutorsFile, 'utf8') : '');
const cardsContent = fs.readFileSync(cardsFile, 'utf8');

// 1. WEAPON_CONFIGS의 고유 무기 ID 파싱 (중복 제거)
const weaponIdRegex = /([a-zA-Z0-9_]+):\s*{\s*id:\s*['"]([a-zA-Z0-9_]+)['"]/g;
const weaponIdSet = new Set();
let match;
while ((match = weaponIdRegex.exec(weaponDataContent)) !== null) {
  weaponIdSet.add(match[2]);
}

const weaponIds = Array.from(weaponIdSet);
console.log(`📋 등록된 고유 무기 총 ${weaponIds.length}종 감지됨.`);

// 2. 각 무기별 발사 엔진 검사
const results = [];
let errorCount = 0;
let warningCount = 0;

weaponIds.forEach(id => {
  // weapons.js에 해당 무기 키가 참조되는지 검사
  const hasRef = weaponsContent.includes(`'${id}'`) || weaponsContent.includes(`"${id}"`);

  // execute 메서드 탐색
  const capitalized = id.charAt(0).toUpperCase() + id.slice(1);
  const funcRegex = new RegExp(`execute[a-zA-Z0-9_]*${capitalized}[a-zA-Z0-9_]*\\s*\\([^)]*\\)\\s*{([\\s\\S]*?)(?:\\n\\s*\\/\\/|\\n\\s*execute|\\n\\s*draw|\\n\\s*})`, 'i');
  let funcBody = '';
  const bodyMatch = weaponsContent.match(funcRegex);
  if (bodyMatch) {
    funcBody = bodyMatch[1];
  }

  const usesDmg = funcBody.includes('getDamage(');
  const usesArea = funcBody.includes('getArea(');
  const usesCount = funcBody.includes('getCount(');

  // 근접 공격 및 오라형 무기는 getCount 미사용 정상
  const isMeleeOrAura = ['sword', 'axe', 'whip', 'sanctuary', 'heavenlySanctuary', 'bladeStorm', 'frostWhip', 'plague', 'shadowOrb', 'eclipseSpiral'].includes(id);
  let status = '✅ 정상';
  let issue = '';

  if (!hasRef) {
    status = '❌ 에러';
    issue = 'weapons.js 내 무기 키 참조 부재';
    errorCount++;
  } else if (!isMeleeOrAura && !usesCount && funcBody.includes('projectiles.push')) {
    status = '⚠️ 경고';
    issue = '투사체 무기이나 getCount() 미사용 (투사체 증가 미적용 가능성)';
    warningCount++;
  }

  results.push({
    id,
    status,
    usesDmg: usesDmg ? 'O' : (id === 'shadowOrb' || id === 'eclipseSpiral' ? '-' : 'X'),
    usesCount: usesCount ? 'O' : (isMeleeOrAura ? '-' : 'X'),
    usesArea: usesArea ? 'O' : (id === 'magicMissile' || id === 'lightningRing' ? '-' : 'X'),
    issue
  });
});

console.table(results);

// 3. 진화 무기 합성 공식 검증
console.log('\n🧬 [진화 합성 공식 정합성 검사]');
const evoPairRegex = /w1:\s*['"]([a-zA-Z0-9_]+)['"],\s*w2:\s*['"]([a-zA-Z0-9_]+)['"],\s*evoId:\s*['"]([a-zA-Z0-9_]+)['"]/g;
let evoCount = 0;
while ((match = evoPairRegex.exec(cardsContent)) !== null) {
  const [, w1, w2, evoId] = match;
  evoCount++;
  const hasW1 = weaponIdSet.has(w1);
  const hasW2 = weaponIdSet.has(w2);
  const hasEvo = weaponIdSet.has(evoId);

  if (!hasW1 || !hasW2 || !hasEvo) {
    console.error(`❌ 진화 합성 불일치: [${w1} + ${w2} -> ${evoId}] (존재하지 않는 무기 ID 참조)`);
    errorCount++;
  }
}
console.log(`✨ 17대 진화 무기 쌍 ${evoCount}종 정상 검증 완료.`);

console.log(`\n========================================`);
console.log(`검사 완료: 에러 ${errorCount}건, 경고 ${warningCount}건`);
console.log(`========================================\n`);

if (errorCount > 0) {
  process.exit(1);
}
