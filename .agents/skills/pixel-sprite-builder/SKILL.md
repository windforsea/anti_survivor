---
name: pixel-sprite-builder
description: Anti Survivors 순수 JS Canvas 2D 픽셀아트 생성 및 스프라이트 빌드 스킬. 레트로 픽셀 도트 좌표 계산, 다크 판타지 네온 색상 팔레트, generate_assets.js 등록 및 assets.js 매니페스트 동기화 워크플로우를 제공합니다.
---

# Anti Survivors 픽셀아트 스프라이트 빌더 스킬 (`pixel-sprite-builder`)

본 프로젝트는 외부 그래픽 툴이나 이미지 파일 의존 없이, 순수 Node.js 환경에서 HTML5 Canvas 2D API를 이용해 113종의 레트로 픽셀아트 PNG를 직접 굽는 자체 에셋 파이프라인([`generate_assets.js`](generate_assets.js))을 채택하고 있습니다.

---

## 1. 픽셀아트 규격 및 해상도 표준

| 용도 | 캔버스 해상도 | 권장 도트 픽셀 크기 | 데이터 정의 위치 | 파일 저장 위치 |
| :--- | :--- | :--- | :--- | :--- |
| **무기/패시브 아이콘** | 32 x 32 또는 48 x 48 | 1~2px 단위 도트 | `assets/data/sprites_icons.js` | `assets/sprites/icon_*.png` |
| **플레이어 캐릭터** | 32 x 32 | 1px 단위 도트 | `assets/data/sprites_heroes.js` | `assets/sprites/player_*.png` |
| **일반 몬스터 (W1/W2)** | 32 x 32 | 1~2px 단위 도트 | `assets/data/sprites_enemies_w*.js` | `assets/sprites/enemy_*.png` |
| **보스 마물** | 64 x 64 | 2px 단위 도트 | `assets/data/sprites_bosses.js` | `assets/sprites/boss_*.png` |
| **바닥 타일/장애물/투사체** | 48 x 48 또는 64 x 64 | 2px 단위 도트 | `assets/data/sprites_misc.js` | `assets/sprites/*.png` |

---

## 2. 다크 판타지 네온 컬러 팔레트 가이드

픽셀아트를 그릴 때는 게임의 '네온 다크 판타지' 테마에 맞춰 아래의 표준 색상을 우선적으로 조합합니다:

* **화염 (Fire / Burn)**: `#dc2626` (딥 레드), `#ef4444` (코어 레드), `#f97316` (오렌지), `#fde047` (화염 하이라이트 옐로우)
* **빙결/바람 (Frost / Wind)**: `#0284c7` (딥 블루), `#38bdf8` (네온 스카이), `#a5f3fc` (빙결 하이라이트), `#10b981` (비취빛 바람)
* **번개/신성 (Thunder / Holy)**: `#ca8a04` (골드 앰버), `#facc15` (눈부신 레몬 골드), `#fef08a` (빛의 하이라이트), `#ffffff` (코어 스파크)
* **암흑/심연 (Shadow / Dark)**: `#1e1b4b` (심연 네이비), `#581c87` (딥 퍼플), `#a855f7` (네온 바이올렛), `#c084fc` (마력 라벤더)
* **독/산성 (Poison / Acid)**: `#064e3b` (딥 포레스트), `#059669` (에메랄드), `#34d399` (네온 민트), `#4ade80` (맹독 라임)

---

## 3. 신규 스프라이트 생성 표준 절차

1. 에셋의 성격에 맞는 [`assets/data/`](assets/data/) 분할 모듈 열기:
   * 영웅 캐릭터: `assets/data/sprites_heroes.js`
   * 월드 1 마물: `assets/data/sprites_enemies_w1.js`
   * 월드 2 마물: `assets/data/sprites_enemies_w2.js`
   * 보스 마물: `assets/data/sprites_bosses.js`
   * 무기/패시브 아이콘: `assets/data/sprites_icons.js`
   * 투사체/타일/기타: `assets/data/sprites_misc.js`
2. 해당 모듈의 `SPRITES` 객체에 도트 그리기 함수 추가:
   ```javascript
   'icon_myweapon': (canvas, ctx) => {
     ctx.fillStyle = '#facc15';
     ctx.fillRect(20, 10, 8, 28);
     // ...
   }
   ```
3. 터미널에서 에셋 빌더 실행:
   ```bash
   node generate_assets.js
   ```
   *분할된 모든 모듈이 자동으로 취합되어 `assets/sprites/*.png`로 고속 렌더링됩니다.*
4. [`js/assets.js`](js/assets.js)의 `this.manifest`에 등록:
   ```javascript
   'icon_myweapon': 'assets/sprites/icon_myweapon.png',
   ```
5. 완성된 에셋을 게임 엔진, 무기, 몬스터, 카드에서 사용.
