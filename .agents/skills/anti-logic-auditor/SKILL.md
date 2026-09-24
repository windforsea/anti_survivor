---
name: anti-logic-auditor
description: Anti Survivors 전투 엔진 및 무기 로직 무결성 정적 검사 스킬. 28종 무기의 스탯 공식(getCount, getDamage, getArea) 누락 여부, 진화 조합 일치 여부, 세이브 데이터 해시 무결성을 정적 스캔하여 버그를 사전에 차단합니다.
---

# Anti Survivors 무기 로직 & 전투 엔진 무결성 감사 스킬 (`anti-logic-auditor`)

본 스킬은 무기 추가, 진화 합성, 밸런스 조정, 스탯 계산 공식 변경 후 발생할 수 있는 휴먼 에러(예: 투사체 증가 미적용, 쿨타임/범위 공식 미호출, 진화 공식 오기재)를 정적 분석으로 사전 탐지합니다.

---

## 1. 정적 검사 스크립트 실행

무기나 카드, 전투 로직을 수정한 직후 다음 명령어를 실행하여 무결성을 검증합니다:

```bash
node .agents/skills/anti-logic-auditor/scripts/audit_weapons.js
```

### 주요 검사 항목:
1. **28종 전체 무기 등록 여부**: `weaponData.js`와 `weapons.js` 사이의 ID 누락 및 오탈자 검사.
2. **스탯 계산 공식 호출 검사**:
   * 데미지: `getDamage(w)`를 통해 플레이어 공격력 증폭이 정상 적용되는가?
   * 범위: `getArea(w)`를 통해 범위 증가가 적용되는가?
   * **투사체 수**: 원거리 투사체 무기가 `getCount(w)`를 호출하여 레벨업/패시브에 따른 다중 사격 루프를 도는가?
3. **14대 진화 무기 합성 공식 1:1 정합성**: `cards.js`의 `evolutionPairs`가 실제 존재하는 무기 ID를 참조하고 있는가?

---

## 2. 코드 수정 시 필수 준수 수칙

* **투사체 발사 시 필수 패턴**:
  ```javascript
  const count = this.getCount(w);
  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? (i - (count - 1) / 2) * 0.12 : 0;
    const angle = baseAngle + spread;
    this.projectiles.push({
      // angle 기반 투사체 속도 벡터 vx, vy 계산
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ...
    });
  }
  ```
* **세이브 데이터 변경 시 주의**:
  * [`js/saveManager.js`](js/saveManager.js)의 FNV-1a 32비트 체크섬 해시 알고리즘과 저장 구조의 정합성을 반드시 검증해야 합니다.
