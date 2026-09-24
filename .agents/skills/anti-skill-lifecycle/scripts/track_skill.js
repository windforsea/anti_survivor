#!/usr/bin/env node

/**
 * Anti Survivors 스킬 사용량 계측 및 수명주기 관리자 (track_skill.js)
 * 
 * 명령어:
 *   node track_skill.js init                     - 기존 스킬 스캔 및 메트릭 초기화
 *   node track_skill.js record <skill> [reason]  - 스킬 호출 횟수 카운트 (+1)
 *   node track_skill.js report                   - 사용량 통계 대시보드 출력
 *   node track_skill.js prune <skill>            - 저사용/미사용 스킬 안전 삭제
 */

const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve(__dirname, '..', '..'); // .agents/skills
const metricsFile = path.resolve(__dirname, '..', 'skill_metrics.json');

function loadMetrics() {
  if (fs.existsSync(metricsFile)) {
    try {
      return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    } catch (e) {
      console.warn('⚠️ 메트릭 파일 파싱 실패, 새로 초기화합니다.');
    }
  }
  return {
    totalCalls: 0,
    lastUpdated: new Date().toISOString(),
    skills: {}
  };
}

function saveMetrics(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2), 'utf8');
}

function getExistingSkillFolders() {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'anti-skill-lifecycle')
    .map(dirent => dirent.name);
}

// 1. 초기화 명령 (init)
function handleInit() {
  const metrics = loadMetrics();
  const currentSkills = getExistingSkillFolders();
  let addedCount = 0;

  for (const sName of currentSkills) {
    if (!metrics.skills[sName]) {
      metrics.skills[sName] = {
        name: sName,
        callCount: 0,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        callHistory: []
      };
      addedCount++;
    }
  }

  saveMetrics(metrics);
  console.log(`✅ 스킬 메트릭 초기화 완료: 총 ${Object.keys(metrics.skills).length}개 스킬 등록 (${addedCount}개 신규 감지)`);
}

// 2. 호출 기록 명령 (record)
function handleRecord(skillName, reason = '') {
  if (!skillName) {
    console.error('❌ 호출할 스킬명을 지정해야 합니다. (예: node track_skill.js record anti-balance-simulator)');
    process.exit(1);
  }

  const metrics = loadMetrics();
  if (!metrics.skills[skillName]) {
    metrics.skills[skillName] = {
      name: skillName,
      callCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      callHistory: []
    };
  }

  const skill = metrics.skills[skillName];
  skill.callCount = (skill.callCount || 0) + 1;
  skill.lastUsedAt = new Date().toISOString();
  metrics.totalCalls = (metrics.totalCalls || 0) + 1;

  if (reason) {
    if (!skill.callHistory) skill.callHistory = [];
    skill.callHistory.unshift({
      timestamp: new Date().toISOString(),
      reason: reason
    });
    // 히스토리는 최근 15개까지만 보관
    if (skill.callHistory.length > 15) skill.callHistory.pop();
  }

  saveMetrics(metrics);
  const ratio = ((skill.callCount / metrics.totalCalls) * 100).toFixed(1);
  console.log(`📈 [스킬 호출 기록] '${skillName}' 호출 횟수: ${skill.callCount}회 (전체 점유율: ${ratio}%, 총 호출: ${metrics.totalCalls}회)`);
}

// 3. 사용량 통계 대시보드 출력 (report)
function handleReport() {
  const metrics = loadMetrics();
  const diskSkills = getExistingSkillFolders();

  // 디스크에는 있는데 메트릭에 없는 스킬 동기화
  for (const s of diskSkills) {
    if (!metrics.skills[s]) {
      metrics.skills[s] = {
        name: s,
        callCount: 0,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        callHistory: []
      };
    }
  }

  const total = metrics.totalCalls || 0;
  console.log(`\n========================================================================================`);
  console.log(`📊 [Anti Survivors] 스킬 라이프사이클 및 호출 통계 대시보드 (총 스킬 호출: ${total}회)`);
  console.log(`========================================================================================`);

  const rows = [];
  const skillKeys = Object.keys(metrics.skills);

  // 호출 수 기준 내림차순 정렬
  skillKeys.sort((a, b) => (metrics.skills[b].callCount || 0) - (metrics.skills[a].callCount || 0));

  for (const name of skillKeys) {
    const s = metrics.skills[name];
    const count = s.callCount || 0;
    const ratio = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%';

    let status = '🟢 활성 (ACTIVE)';
    if (count === 0) {
      status = '🚨 미사용 (정리 권고)';
    } else if (total >= 10 && (count / total) < 0.05) {
      status = '⚠️ 저빈도 (LOW_FREQ)';
    } else if ((count / total) < 0.15) {
      status = '🟡 일반 (NORMAL)';
    }

    const lastUsed = s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString('ko-KR') : '사용 이력 없음';

    rows.push({
      '스킬명': name,
      '호출 횟수': `${count}회`,
      '점유율 (%)': ratio,
      '상태': status,
      '최근 사용 일시': lastUsed
    });
  }

  if (rows.length === 0) {
    console.log('등록된 스킬이 없습니다.');
  } else {
    console.table(rows);
  }

  console.log(`\n💡 관리 가이드:`);
  console.log(`- 🚨 미사용(0회) 스킬은 컨텍스트 최적화를 위해 삭제(prune)를 권장합니다.`);
  console.log(`- 삭제 명령: node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js prune <스킬명>`);
}

// 4. 스킬 삭제/정리 명령 (prune)
function handlePrune(skillName) {
  if (!skillName) {
    console.error('❌ 정리할 스킬명을 지정해야 합니다.');
    process.exit(1);
  }

  const targetDir = path.join(skillsDir, skillName);
  const metrics = loadMetrics();

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log(`🗑️ 디스크에서 스킬 디렉토리 삭제 완료: ${targetDir}`);
  } else {
    console.log(`ℹ️ 디스크에 해당 스킬 디렉토리가 없습니다: ${targetDir}`);
  }

  if (metrics.skills[skillName]) {
    delete metrics.skills[skillName];
    saveMetrics(metrics);
    console.log(`🧹 메트릭 데이터베이스에서 '${skillName}' 항목 제거 완료.`);
  }

  console.log(`✅ 스킬 '${skillName}' 정리가 안전하게 완료되었습니다.`);
}

// CLI 엔트리포인트
const args = process.argv.slice(2);
const command = args[0] || 'report';

switch (command) {
  case 'init':
    handleInit();
    break;
  case 'record':
    handleRecord(args[1], args[2] || '');
    break;
  case 'report':
    handleReport();
    break;
  case 'prune':
    handlePrune(args[1]);
    break;
  default:
    console.log(`사용법:
  node track_skill.js init
  node track_skill.js record <스킬명> "[작업 사유]"
  node track_skill.js report
  node track_skill.js prune <스킬명>`);
    break;
}
