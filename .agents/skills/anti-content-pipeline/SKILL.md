---
name: anti-content-pipeline
description: Anti Survivors 전용 신규 무기, 진화 무기, 캐릭터, 몬스터 추가 및 수정 파이프라인. 스펙 정의(weaponData.js), 발사 엔진(weapons.js), 레벨업 카드(cards.js), 문서(docs/, main.md)를 누락 없이 일괄 동기화합니다.
---

# Anti Survivors 콘텐츠 추가 및 수정 파이프라인 (`anti-content-pipeline`)

Anti Survivors 게임에 새로운 기본 무기, 2단계 진화 무기, 캐릭터, 몬스터를 추가하거나 기존 스펙을 수정할 때 반드시 따라야 하는 표준 워크플로우와 체크리스트입니다.

---

## 1. 신규 무기 및 진화 무기 추가 표준 파이프라인

무기 하나를 추가할 때는 **반드시 아래 모듈들이 누락 없이 동기화**되어야 합니다.

```text
[1. js/weaponData.js]                     -> 스펙, 기본 수치, 레벨 정의
      ↓
[2. js/weapons.js & weaponExecutors.js & weaponRenderer.js] 
                                         -> weapons.js: fireWeapon() 라우팅 및 스탯/쿨다운 관리
                                         -> weaponExecutors.js: executeX() 발사 로직 및 투사체 생성
                                         -> weaponRenderer.js: drawWeapons() 캔버스 그래픽 렌더링
      ↓
[3. js/cards.js]                         -> 레벨업 카드 풀, 진화 합성 조건(선행 무기 5Lv + 5Lv)
      ↓
[4. assets/data/sprites_icons.js & generate_assets.js & js/assets.js] 
                                         -> 도트 매트릭스 등록 ➔ node generate_assets.js 빌드 ➔ assets.js 매니페스트 등록
      ↓
[5. docs/weapons.md & main.md]            -> 스펙 명세 동기화 및 audit_weapons.js 무결성 검증
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

### Step 2. 발사 엔진 & 렌더러 구현 (⚠️ 핵심 점검 사항)
1. **발사 로직 분리 ([`js/weaponExecutors.js`](js/weaponExecutors.js))**:
   * `WeaponManager.prototype.executeMyNewWeapon = function(w, enemies, player) { ... }` 작성.
   * **⚠️ 필수 검증 규칙**:
     - 데미지 계산: 반드시 `const dmg = this.getDamage(w);` 사용.
     - 공격 범위: 반드시 `const area = this.getArea(w);` 사용.
     - **투사체 개수**: 원거리/다중 투사체 무기는 **반드시 `const count = this.getCount(w);`를 조회하고 `for (let i = 0; i < count; i++)` 루프를 돌릴 것!** (부채꼴 각도 `spread = count > 1 ? (i - (count - 1) / 2) * spreadAngle : 0;` 적용)
     - 투사체는 `this.projectiles.push({...})`, 근접 베기는 `this.slashes.push({...})`에 등록.
2. **발사 라우팅 ([`js/weapons.js`](js/weapons.js))**:
   * `fireWeapon(w, enemies)` 내 `switch(w.id)`에 새 케이스 추가:
     ```javascript
     case 'myNewWeapon':
       this.executeMyNewWeapon(w, enemies, this.game.player);
       break;
     ```
   * 쿨다운 리셋 시 `w.cooldownTimer = this.getCooldown(w);` 적용.
3. **캔버스 렌더러 ([`js/weaponRenderer.js`](js/weaponRenderer.js))**:
   * `drawWeapons(ctx, player)` 내에서 투사체 또는 고유 이펙트의 2D 캔버스 드로잉 구현.

---

### Step 3. `js/cards.js` 레벨업 카드 풀 & 진화 트리 등록
1. **진화 무기인 경우**:
   * `CardManager.constructor`의 `this.evolutionPairs` 배열에 합성 공식 등록:
     ```javascript
     { w1: 'baseWeapon1', w2: 'baseWeapon2', evoId: 'myEvoWeapon', evoName: '진화 무기명', evoIcon: '✨', evoIconKey: 'icon_myevoweapon' }
     ```
   * `generateCards()`의 진화 카드 생성 분기에 5Lv 달성 조건 및 획득 로직 연결.
2. **기본 무기/진화 무기 강화 카드**:
   * 데미지, 범위, 쿨타임, **투사체(count)** 카드 설명 텍스트 분기 등록.

---

### Step 4. 스프라이트 에셋 연동
1. [`assets/data/sprites_icons.js`](assets/data/sprites_icons.js)에 신규 무기 아이콘 도트 매트릭스 추가. (투사체의 경우 [`assets/data/sprites_misc.js`](assets/data/sprites_misc.js))
2. 터미널에서 `node generate_assets.js` 실행하여 PNG 파일 생성.
3. [`js/assets.js`](js/assets.js)의 `this.manifest`에 새 스프라이트 키 및 경로 등록.

---

### Step 5. 정적 감사 및 문서 동기화 (Maintenance Rule)
1. 전투 엔진 무결성 감사 실행:
   ```bash
   node .agents/skills/anti-logic-auditor/scripts/audit_weapons.js
   ```
2. `docs/weapons.md` 테이블에 기본 또는 진화 무기 스펙 행 추가.
3. `main.md`의 디렉토리 맵, 인터페이스 명세표 및 빠른 참조 맵 동기화.

---

## 2. 신규 몬스터 추가 파이프라인

1. **스펙 정의 ([`js/enemyData.js`](js/enemyData.js))**:
   * 해당 월드 테이블(`ENEMY_TYPES_W1`, `ENEMY_TYPES_W2` 등)에 HP, 이동속도, 크기, 피해량, 비행 여부 등 등록.
2. **AI 및 물리 처리 ([`js/enemies.js`](js/enemies.js))**:
   * 특수 기믹(무적 회피, 분신, 투사체 발사 등)이 필요한 경우 `Enemy.prototype.update` 또는 `EnemyManager`에 분기 추가.
3. **도트 스프라이트 ([`assets/data/sprites_enemies_w*.js`](assets/data/))**:
   * 월드별 몬스터 도트 파일에 매트릭스 등록 후 `node generate_assets.js` 실행.
4. **웨이브 타임라인 연동 ([`js/waveManager.js`](js/waveManager.js))**:
   * 스테이지 구성 객체의 `mobs` 배열에 몬스터 ID 배치.

---

## 2. 신규 캐릭터 추가 파이프라인

1. **스탯 및 특성**: [`js/player.js`](js/player.js)의 `applyCharacterStats(type)`에 고유 패시브 및 스탯 보정치 작성.
2. **시작 무기**: [`js/main.js`](js/main.js)의 `restart()` 내 `startWeaponMap`에 시그니처 시작 무기 등록.
3. **선택 UI**: [`index.html`](index.html)의 `#characterSelectModal`에 캐릭터 카드 마크업 추가.
4. **문서 동기화**: [`docs/character.md`](docs/character.md) 및 [`main.md`](main.md) 업데이트.
