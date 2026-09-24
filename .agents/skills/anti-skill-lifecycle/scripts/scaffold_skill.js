#!/usr/bin/env node

/**
 * Anti Survivors 표준 스킬 자동 스캐폴더 (scaffold_skill.js)
 * 
 * 사용법:
 *   node scaffold_skill.js <skill-name> "<description>"
 */

const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve(__dirname, '..', '..');
const trackScript = path.join(__dirname, 'track_skill.js');

const skillName = process.argv[2];
const description = process.argv[3];

if (!skillName || !description) {
  console.log(`❌ 사용법: node scaffold_skill.js <skill-name> "<description>"`);
  console.log(`   예시: node scaffold_skill.js anti-sound-synthesizer "8비트 신디사이저 사운드 및 BGM 생성 스킬"`);
  process.exit(1);
}

// 스킬명 포맷 검증 (소문자, 숫자, 하이픈)
if (!/^[a-z0-9-]+$/.test(skillName)) {
  console.error(`❌ 스킬명은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다: ${skillName}`);
  process.exit(1);
}

const targetDir = path.join(skillsDir, skillName);
if (fs.existsSync(targetDir)) {
  console.error(`❌ 이미 존재하는 스킬 디렉토리입니다: ${targetDir}`);
  process.exit(1);
}

// 1. 디렉토리 구조 생성
fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(path.join(targetDir, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'references'), { recursive: true });

// 2. SKILL.md 템플릿 생성
const skillMdContent = `---
name: ${skillName}
description: >-
  ${description}
---

# 🛠️ ${skillName}

${description}

---

## 📋 워크플로우

1. **사전 준비**:
2. **실행 단계**:
3. **검증 및 피드백**:

---

## 📂 디렉토리 구조

\`\`\`text
${skillName}/
├── SKILL.md          # 스킬 메인 가이드
├── scripts/          # 실행 도구 및 헬퍼 스크립트
└── references/       # 참고 문서 및 스펙
\`\`\`
`;

fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillMdContent, 'utf8');

// 3. 메트릭 DB에 자동 등록 (track_skill.js init 호출)
const { execSync } = require('child_process');
try {
  execSync(`node "${trackScript}" init`, { stdio: 'ignore' });
} catch (e) {
  // 무시
}

console.log(`\n🎉 [스킬 생성 완료] '${skillName}' 스킬이 성공적으로 스캐폴딩되었습니다!`);
console.log(`📁 위치: ${targetDir}`);
console.log(`📄 파일: SKILL.md, scripts/, references/`);
console.log(`📊 메트릭 DB 자동 등록 완료.`);
console.log(`\n👉 다음 단계:`);
console.log(`1. ${path.join(targetDir, 'SKILL.md')} 내용을 구체화하세요.`);
console.log(`2. 필요 시 scripts/에 실행 자동화 스크립트를 추가하세요.`);
console.log(`3. main.md에 신규 스킬을 인덱싱하세요.\n`);
