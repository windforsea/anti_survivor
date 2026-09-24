# Anti Survivors Antigravity Project Rules (`GEMINI.md`)

본 문서는 **Anti Survivors(안티 서바이버즈)** 저장소의 Antigravity 네이티브 프로젝트 표준 작업 규칙입니다.

---

## 1. 프로젝트 네비게이션 및 아키텍처 원칙

1. **`main.md` 사전 참조 필수**:
   - 코드 검색이나 파일 수정 전, 반드시 저장소 루트의 [main.md](main.md)를 먼저 확인하여 디렉토리 구조, 모듈별 역할, 클래스/함수 인터페이스를 파악합니다.
   - 전체 코드베이스를 무차별적으로 검색하지 않고, [main.md](main.md)의 **'빠른 참조 맵(Fast Lookup)'**을 활용해 변경할 타겟 파일만 특정합니다.
2. **구조 동기화 의무 (Maintenance Rules)**:
   - 새로운 모듈, 무기, 몬스터, 카드, 월드, 스킬, UI 컴포넌트를 추가하거나 인터페이스를 변경한 경우, 반드시 [main.md](main.md)의 디렉토리 맵과 명세표에도 동일하게 반영해야 합니다.
3. **AI 작업 표준 워크플로우**:
   ```text
   작업 지시 수신 ➔ main.md 읽기 ➔ (필요 시 스킬 추천) ➔ 작업 수행 (최소 침습적 수정) ➔ main.md & docs/ 갱신
   ```

---

## 2. 기술 스택 및 환경 관리 규칙

1. **순수 바닐라 JS 및 웹 표준 준수**:
   - 본 프로젝트는 외부 프레임워크나 무거운 번들러 없이 **HTML5 Canvas, Pure Vanilla JavaScript (ES6+), Web Audio API**로 구현된 초경량 네이티브 게임 엔진입니다.
   - 불필요한 외부 라이브러리 추가를 금지하며, 웹 표준 Canvas 2D 렌더링 파이프라인을 존중합니다.
2. **패키지 및 도구 설치 사전 승인**:
   - 패키지, 라이브러리, CLI 도구 설치가 필요한 경우 임의로 실행하지 않고, 용도와 필요성을 설명한 뒤 사용자의 명시적 허락을 받고 진행합니다.

---

## 3. 핵심 게임 시스템 및 설계 불변 원칙

1. **세이브 데이터 무결성 보호**:
   - 로컬 스토리지에 저장되는 유저 재화(Gold) 및 영구 강화 스탯은 **FNV-1a 32비트 해시 체크섬**으로 변조를 방지합니다 ([`js/saveManager.js`](js/saveManager.js)).
   - 세이브 데이터 구조를 변경할 때는 체크섬 계산 함수와의 정합성을 반드시 검증해야 합니다.

---

## 4. 스킬 수명주기 관리 연동 규칙 (Skill Telemetry)

1. **스킬 호출 시 자동 기록**:
   - `.agents/skills/` 내의 스킬을 참조하거나 실행할 때는 호출 카운터를 누적합니다:
     ```bash
     node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js record <스킬명> "[작업 사유]"
     ```
2. **스킬 통계 리포트 및 미사용 정리**:
   - 스킬 통계 조회: `node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js report`
   - 미사용(0회) 또는 극저빈도 스킬 발견 시 사용자에게 삭제(`prune`)를 권고합니다.

---

## 5. 버전 관리 및 푸시 통제

1. **Git 원자적 커밋 (Atomic Commits)**:
   - 커밋은 성격별(`feat:`, `fix:`, `docs:`, `balance:`, `refactor:`, `chore:`)로 분리하여 한글로 명확하게 작성합니다.
2. **Git Push 임의 실행 절대 금지**:
   - 원격 저장소(`git push`) 푸시는 사용자가 직접 명시적으로 요청한 경우에만 수행합니다.
