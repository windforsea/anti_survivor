---
name: anti-content-pipeline
description: Anti Survivors 전용 신규 무기, 진화 무기, 캐릭터, 몬스터 추가 및 수정 파이프라인. 스펙 정의(weaponData.js), 발사 엔진(weapons.js), 레벨업 카드(cards.js), 문서(docs/, main.md)를 누락 없이 일괄 동기화합니다.
---

# Anti Survivors 콘텐츠 추가 및 수정 파이프라인 (`anti-content-pipeline`)

Anti Survivors 게임에 새로운 기본 무기, 2단계 진화 무기, 캐릭터, 몬스터를 추가하거나 기존 스펙을 수정할 때 반드시 따라야 하는 표준 워크플로우와 체크리스트입니다.

---

## 1. 신규 무기 및 진화 무기 추가 표준 파이프라인

무기 하나를 추가할 때는 **반드시 아래 5개 파일이 누락 없이 동기화**되어야 합니다.

```text
[1. weaponData.js]  -> 스펙, 기본 수치, 레벨 정의
      ↓
[2. weapons.js]     -> update() 라우팅, executeWeapon() 발사 엔진 및 투사체/장판 루프
      ↓
[3. cards.js]       -> 레벨업 카드 풀, 진화 합성 조건(선행 무기 5Lv + 5Lv)
      ↓
[4. generate_assets.js / assets.js] -> 아이콘 및 투사체 스프라이트 등록
      ↓
[5. docs/weapons.md & main.md]      -> 스펙 테이블 최신화
```

---

### Step 1. `js/weaponData.js` 스펙 등록
* `WEAPON_CONFIGS` 객체에 새 무기 ID를 키로 등록합니다.
```javascript
myNewWeapon: {
  id: 'myNewWeapon',
  name: '신규 무기명',
  icon: '⚔️',
  iconSprite: 'icon_mynewweapon',
  desc: '무기 설명',
  baseCooldown: 0.8,
  baseDamage: 30,
  baseCount: 1,      // 투사체 기본 발수
  baseArea: 1.0,       // 공격 범위 계수
  cooldownLevel: 0,
  damageLevel: 0,
  countLevel: 0,
  areaLevel: 0,
  cooldownTimer: 0
}
```

---

### Step 2. `js/weapons.js` 발사 엔진 구현 (⚠️ 핵심 점검 사항)
* `fireWeapon(w, enemies)` 내 `switch(w.id)`에 새 케이스를 추가하고 실행 메서드를 연결합니다.
* **⚠️ 필수 검증 규칙**:
  1. 데미지 계산: 반드시 `const dmg = this.getDamage(w);` 사용.
  2. 공격 범위: 반드시 `const area = this.getArea(w);` 사용.
  3. **투사체 개수**: 원거리/다중 투사체 무기는 **반드시 `const count = this.getCount(w);`를 조회하고 `for (let i = 0; i < count; i++)` 루프를 돌릴 것!** (부채꼴 각도 `spread = count > 1 ? (i - (count - 1) / 2) * spreadAngle : 0;` 적용)
  4. 쿨다운: 타이머 리셋 시 `this.getCooldown(w)` 적용.
* 투사체는 `this.projectiles.push({...})`, 근접 베기는 `this.slashes.push({...})`에 등록.
* `draw(ctx)` 렌더러에 투사체/이펙트 그리기 분기 추가.

---

### Step 3. `js/cards.js` 레벨업 카드 풀 & 진화 트리 등록
1. **진화 무기인 경우**:
   * `CardManager.constructor`의 `this.evolutionPairs` 배열에 합성 공식 등록:
     ```javascript
     { w1: 'baseWeapon1', w2: 'baseWeapon2', evoId: 'myEvoWeapon', evoName: '진화 무기명', evoIcon: '✨', evoIconKey: 'icon_myevoweapon' }
     ```
   * `generateCards()`의 14대 진화 카드 생성 분기에 5Lv 달성 조건 및 획득 로직 연결.
2. **기본 무기/진화 무기 강화 카드**:
   * 데미지, 범위, 쿨타임, **투사체(count)** 카드 설명 텍스트 분기 등록.

---

### Step 4. 스프라이트 에셋 연동
1. `generate_assets.js`에 도트 그리기 함수 추가 후 `node generate_assets.js` 실행하여 PNG 파일 생성.
2. `js/assets.js`의 `this.manifest`에 새 스프라이트 키 및 경로 등록.

---

### Step 5. 문서 동기화 (Maintenance Rule)
1. `docs/weapons.md` 테이블에 14종 기본 무기 또는 14대 진화 무기 스펙 행 추가.
2. `main.md`의 빠른 참조 맵 및 파일 명세 테이블 최신화.

---

## 2. 신규 캐릭터 추가 파이프라인

1. **스탯 및 특성**: [`js/player.js`](js/player.js)의 `applyCharacterStats(type)`에 고유 패시브 및 스탯 보정치 작성.
2. **시작 무기**: [`js/main.js`](js/main.js)의 `restart()` 내 `startWeaponMap`에 시그니처 시작 무기 등록.
3. **선택 UI**: [`index.html`](index.html)의 `#characterSelectModal`에 캐릭터 카드 마크업 추가.
4. **문서 동기화**: [`docs/character.md`](docs/character.md) 및 [`main.md`](main.md) 업데이트.
