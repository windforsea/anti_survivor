---
name: anti-status-engine
description: Anti Survivors 상태이상(빙결, 기절, 감속, 중독 3중첩 등) 메커니즘 정합성 검사 및 스탯/무기 연동 무결성 감사 스킬.
---

# Anti Survivors 상태이상 엔진 스킬 (Anti Status Engine)

본 스킬은 Anti Survivors 게임 내 모든 상태이상(Status Effect) 시스템의 무결성을 검증하고, 무기 및 적 엔티티(`enemies.js`, `weaponExecutors.js`, `weapons.js`, `cards.js`)의 상태이상 구현 정합성을 정적으로 감사(Audit)하는 전문 스킬입니다.

---

## 1. 핵심 상태이상 명세표

| 상태이상 | 주요 발동 무기/엔진 | 효과 및 파라미터 | 중첩 및 제한 |
| :--- | :--- | :--- | :--- |
| **빙결 (Freeze)** | 얼음지팡이, 얼음채찍, 오브 | `enemy.freeze(duration)`: 일반 몬스터 완전 정지, 보스/엘리트 40% 감속 | 시간 갱신(최댓값 보장) |
| **기절 (Stun)** | 번개반지(25%, 0.4s), 벼락검(30%, 0.5s), 뇌전포(25%, 0.4s), 저지먼트(30%, 0.5s) | `enemy.freeze(duration)` 기반 전기 쇼크 효과 | 시간 갱신, 보스 내성(40% 감속) 연동 |
| **감속 (Slow)** | 블리자드 냉기단검, 서리구체, 슬로우 필드 | `enemy.slowTimer = 1.0`, `enemy.slowMult = 0.60` (이동속도 40% 저하) | 시간 갱신 |
| **중독 (Poison)** | 독단검, 역병, 섀도우 차크람 | `poisonTimer = 3.0s`, `poisonStacks` (최대 3중첩), 초당 `(poisonDps * 0.5 * stacks)` 피해 | 최대 3스택 제한, 만료 시 스택 초기화 |

---

## 2. 사용 가능한 도구 및 스크립트

### 상태이상 정합성 정적 감사 스크립트
```bash
node .agents/skills/anti-status-engine/scripts/audit_status.js
```
- 검사항목:
  1. `enemies.js`: `poisonStacks` 최대 3중첩 로직 및 만료 시 초기화 처리 확인.
  2. `enemies.js`: 피격 플래시(`isHit`) 시간 0.05초 최적화 및 `shadowBlur` 바이패스 로직 확인.
  3. `weaponExecutors.js`: 번개 트리 3종(번개반지, 벼락검, 뇌전포)의 기절(`freeze`) 옵션 구현 확인.
  4. `weaponExecutors.js`: 블리자드(`venomBlizzard`)의 냉기단검(`frostDagger`) 방출 및 감속 부여 확인.
  5. `cards.js`: 진화 및 무기 메타 설명 내 상태이상 설명 누락 여부 확인.
