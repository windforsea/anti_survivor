---
name: anti-balance-simulator
description: Anti Survivors 스테이지별 몬스터 스폰량, 초당 적 총 HP 유입량(DPS 요구치), 보스 예상 처치 시간(TTK) 및 난이도 스파이크를 정량적으로 시뮬레이션하는 밸런스 검증 스킬.
---

# Anti Survivors 난이도 밸런스 시뮬레이터 스킬 (`anti-balance-simulator`)

본 스킬은 20~25개 스테이지의 몬스터 구성, 스폰 간격(`interval`), 무리 수(`batch`), 체력 배율(`hpScale`)을 분석하여 플레이어가 직접 20분간 플레이하지 않아도 **각 구간별 요구 DPS와 보스 격파 소요 시간(TTK)**을 즉시 정량적으로 검증합니다.

---

## 1. 밸런스 황금 기준선 (Standard Metrics)

| 구간 | 스테이지 | 플레이어 예상 스탯 / 진화 상태 | 초당 몬스터 HP 유입 (DPS 요구치) | 보스 권장 TTK |
| :--- | :--- | :--- | :--- | :--- |
| **초반 도입부** | 1 ~ 5 | 기본 무기 1~3Lv, 미진화 | 20 ~ 90 HP/s | 10 ~ 15초 |
| **중반 성장기** | 6 ~ 10 | 2~3종 무기 보유, 패시브 시너지 시작 | 100 ~ 380 HP/s | 15 ~ 20초 |
| **후반 전성기** | 11 ~ 15 | 1차 진화 무기 완성 (광역 화력) | 400 ~ 1,100 HP/s | 18 ~ 25초 |
| **엔드게임** | 16 ~ 20/25 | 2~3종 진화 무기 풀세팅, 영구강화 | 1,200 ~ 2,800 HP/s | 25 ~ 40초 |

* **난이도 스파이크 경고 (`⚠️ SPIKE`)**:
  - 이전 스테이지 대비 초당 HP 유입량이 **2.2배 이상 급증**하여 플레이어가 대처하지 못하고 압살당하는 비정상 구간을 탐지합니다.

---

## 2. 시뮬레이터 실행 방법

터미널에서 다음 명령어를 실행합니다:

```bash
# 전체 월드 (월드 1 부유섬 & 월드 2 심해 협곡) 밸런스 시뮬레이션 실행
node .agents/skills/anti-balance-simulator/scripts/simulate_balance.js

# 특정 월드만 집중 분석 (예: 월드 2)
node .agents/skills/anti-balance-simulator/scripts/simulate_balance.js 2
```

### 주요 출력 정보:
1. **Stage**: 스테이지 번호
2. **Interval / Batch**: 스폰 주기 및 한 번에 스폰되는 마리 수
3. **Spawn Rate**: 초당 스폰 몬스터 수 (mobs/sec)
4. **HP Scale**: 몬스터 체력 배율
5. **DPS Req (HP/s)**: 초당 전장에 쏟아지는 총 적 체력 (화력 요구치)
6. **Boss Info & TTK**: 보스 등장 여부, 보스 체력 및 플레이어 예상 DPS 기준 격파 시간
7. **Status**: 정상(`OK`) 또는 급상승(`⚠️ SPIKE`) 경고
