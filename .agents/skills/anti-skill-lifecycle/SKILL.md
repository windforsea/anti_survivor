---
name: anti-skill-lifecycle
description: >-
  Anti Survivors 스킬 수명주기(Lifecycle) 관리 전담 메타 스킬. 신규 스킬 발굴 시 효율성(ROI) 산출 및 추천 템플릿 생성,
  스킬 호출 횟수/비율 계측(Telemetry), 사용 빈도가 극도로 적거나 쓰이지 않는 스킬을 식별하여 삭제(Prune)하는 관리 도구를 제공합니다.
---

# 🔄 스킬 라이프사이클 관리자 (`anti-skill-lifecycle`)

본 스킬은 Anti Survivors 저장소 내의 모든 프로젝트 스킬(`.agents/skills/`)의 **생성·추천 ➔ 자동 스캐폴딩 ➔ 호출 계측 ➔ 통계 분석 ➔ 저사용 스킬 정리(Prune)**로 이어지는 전체 생명주기를 총괄 관리하는 **메타 스킬(Meta-Skill)**입니다.

---

## 🎯 1. 스킬 발굴 및 추천 기준

AI 에이전트는 다음 상황을 만났을 때, 즉시 코딩을 시작하지 않고 사용자에게 **스킬 생성을 선제적으로 추천**해야 합니다:

1. **다중 파일 일괄 동기화 작업**: 하나의 변경 사항이 3개 이상의 파일(`data.js`, `logic.js`, `docs/`, `main.md` 등)에 파급되는 경우.
2. **복잡한 수치/공식 시뮬레이션**: 밸런스, TTK, DPS 등 사람이 수작업으로 계산하기 어려운 정량적 모델링이 필요한 경우.
3. **규격화된 뼈대 생성 작업**: 신규 월드, 캐릭터, 무기 등 정형화된 폴더 및 파일 구조를 반복 생성해야 하는 경우.

### 💡 스킬 추천 시 필수 보고 양식 (ROI 제시)

```markdown
> 💡 **[스킬 생성 제안: <스킬명>]**
> - **대상 작업**: (예: 신규 월드 3 테마 맵 및 장애물 일괄 설계)
> - **도입 배경**: 맵 경계 계산, 장애물 3종 스펙, 몬스터 스폰 타임라인 등 수작업 시 누락 위험 발생
> - **예상 효율 향상치 (ROI)**:
>   - ⏱️ **작업 시간**: 수작업 40분 ➔ 자동 생성 및 검증 **5분 (87.5% 단축)**
>   - 🛡️ **휴먼 에러 방지**: 맵 경계 좌표 오차 및 파일 누락 **0건 (100% 무결성)**
>   - 🔄 **재사용성**: 향후 월드 4, 5 추가 시 100% 재사용 가능
> - **스킬 구성 계획**: `.agents/skills/<스킬명>/` (SKILL.md, scaffold 스크립트 등)
```

---

## 🛠️ 2. 핵심 관리 도구 및 명령어

모든 스킬 관리 스크립트는 `.agents/skills/anti-skill-lifecycle/scripts/`에 위치합니다.

### 2.1 스킬 호출 기록 (Telemetry Record)
스킬의 `SKILL.md`를 참조하거나 관련 도구를 실행했을 때 카운트를 +1 증가시킵니다.
```bash
node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js record <스킬명> "[작업 사유]"
```
- 예시:
  ```bash
  node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js record anti-balance-simulator "월드 1 및 2 보스 밸런스 패치 검증"
  ```

### 2.2 스킬 사용 통계 대시보드 출력 (Report)
현재 등록된 모든 스킬의 누적 호출 수, 전체 대비 점유율(%), 상태를 터미널 표로 출력합니다.
```bash
node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js report
```

### 2.3 저사용 / 미사용 스킬 정리 (Prune)
호출 수가 0이거나 사용 빈도가 극도로 적은 스킬을 안전하게 정리(삭제)합니다.
```bash
node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js prune <스킬명>
```

### 2.4 신규 스킬 자동 뼈대 생성 (Scaffold)
Antigravity 표준 스킬 디렉토리 구조(`SKILL.md`, `scripts/`, `references/`)를 단번에 생성하고 메트릭 DB에 자동 등록합니다.
```bash
node .agents/skills/anti-skill-lifecycle/scripts/scaffold_skill.js <스킬명> "<스킬 설명>"
```

---

## 📊 3. 스킬 상태 분류 기준 (Health Status)

| 상태 | 조건 | 조치 방안 |
| :--- | :--- | :--- |
| **🟢 활성 (`ACTIVE`)** | 최근 30일 이내 사용 & 호출 점유율 >= 15% | 유지 및 지속적 최적화 |
| **🟡 일반 (`NORMAL`)** | 호출 횟수 >= 1회 & 점유율 5% ~ 15% | 정상 유지 |
| **⚠️ 저빈도 (`LOW_FREQ`)** | 호출 점유율 < 5% | 필요성 재검토 |
| **🚨 미사용 (`UNUSED`)** | 호출 횟수 0회 | **사용자에게 삭제(Prune) 적극 권고** |

---

## 📁 4. 메트릭 데이터베이스 (`skill_metrics.json`)

통계 데이터는 JSON 형식으로 안전하게 관리되며, 각 스킬의 `callCount`, `firstCreatedAt`, `lastUsedAt`, `callHistory`를 영구 기록합니다.
