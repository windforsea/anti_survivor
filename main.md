# 프로젝트 아키텍처 및 모듈 네비게이션 가이드 (`main.md`)

> **AI 에이전트 필독 가이드**  
> 본 문서는 프로젝트의 전체 디렉토리 구조, 모듈별 책임, 클래스 및 함수 인터페이스를 인덱싱한 맵(Map)입니다.  
> 코드 작성 및 수정 시 전체 코드를 모두 검색하지 말고, 본 문서를 통해 변경할 대상 파일과 함수를 빠르게 식별한 후 **최소 침습적 수정(Surgical Changes)**을 진행하세요.

---

## 1. 프로젝트 디렉토리 맵 (Directory Map)

```text
vam/
├── index.html                   # HTML5 게임 캔버스, HUD 레이어, 모달 뷰 엔트리
├── style.css                    # 다크 판타지 네온 레트로 UI 스타일시트
├── server.js                    # Node.js 경량 로컬 정적 서빙 & 랭킹 API 서버 (내장 모듈만 사용)
├── start_server.bat             # 원클릭 서버 실행 배치 파일
├── generate_assets.js           # 순수 Node.js 119종 픽셀아트 PNG 스프라이트 빌더 (경량화 메인)
├── GEMINI.md                    # [루트] Antigravity 네이티브 프로젝트 표준 작업 규칙
├── AGENTS.md                    # [루트] 멀티 에이전트 공용 표준 지침
├── main.md                      # [본 문서] AI 아키텍처 인덱스 및 Fast Lookup 가이드
├── readme.md                    # 프로젝트 소개, 실행법, 플레이 가이드 및 AI 워크플로우 요약
│
├── .agents/skills/              # 🤖 Antigravity 프로젝트 전용 커스텀 스킬 (VCS 팀/PC 공유)
│   ├── anti-skill-lifecycle/    # 스킬 발굴(ROI 산출), 호출 계측(Telemetry), 스캐폴딩 및 저사용 정리(Prune)
│   ├── anti-content-pipeline/   # 신규 무기/진화/캐릭터/몬스터 추가 파이프라인
│   ├── anti-logic-auditor/      # 전투 엔진 & 스탯 공식 정적 무결성 감사 스크립트
│   ├── pixel-sprite-builder/    # Canvas 2D 픽셀아트 스프라이트 빌더 가이드
│   ├── anti-world-architect/    # 신규 월드(스테이지/지형/장애물/보스/UI) 생성 파이프라인
│   └── anti-balance-simulator/  # 20~25스테이지 난이도 곡선 및 보스 TTK 밸런스 시뮬레이터
│
├── api/                         # Vercel Serverless Function
│   └── champion.js              # Vercel 배포 환경용 명예의 전당 REST API
│
├── docs/                        # 도메인별 심층 명세 문서
│   ├── character.md             # 6종 캐릭터(기사/마도사/암살자/해골성직자/궁수/워록), 16종 패시브, 영구 강화
│   ├── weapons.md               # 17종 기본 무기 & 17대 진화 무기 상세 스펙 및 공격 공식
│   ├── enemies.md               # 15종 일반 몬스터 & 15종 보스 상세 AI, 스탯, 패턴
│   ├── stages.md                # 25스테이지 웨이브 타임라인(총 18분 45초), 사신 강림
│   ├── items.md                 # 필드 장애물(바위/나무/상자), 5종 드랍템, 경험치 보석
│   ├── assets.md                # 119종 스프라이트 에셋 명세표
│   └── system.md                # FNV-1a 보안 체크섬, 무결성 검증
│
├── assets/                      # 게임 에셋 데이터 및 생성된 스프라이트 이미지
│   ├── data/                    # 119종 픽셀아트 도트 매트릭스 분할 데이터 (Node.js/CJS)
│   │   ├── sprites_heroes.js    # 영웅 6종 도트 매트릭스
│   │   ├── sprites_enemies_w1.js# 월드 1 몬스터 15종 도트 매트릭스
│   │   ├── sprites_enemies_w2.js# 월드 2 몬스터 15종 도트 매트릭스
│   │   ├── sprites_bosses.js    # 보스 13종 도트 매트릭스
│   │   ├── sprites_icons.js     # 무기/아이템/패시브 아이콘 54종 도트 매트릭스
│   │   └── sprites_misc.js      # 투사체, 이펙트, 기타 오브젝트 16종 도트 매트릭스
│   └── sprites/                 # 119종 빌드된 픽셀아트 스프라이트 PNG 파일 디렉토리
│
└── js/                          # 🚀 고속 바닐라 JS 코어 런타임 (모듈화 구조)
    ├── main.js                  # Game 클래스: 메인 루프, 입력 이벤트, 렌더링 파이프라인
    ├── player.js                # Player 클래스: 이동, 조작, 피격 판정, 레벨업/경험치 곡선, 공격 모션
    ├── weaponData.js            # WEAPON_CONFIGS: 17종 기본 무기 및 17대 진화 무기 스펙 데이터 테이블
    ├── weapons.js               # WeaponManager 클래스: 코어 스탯 계산, 쿨다운 관리, 무기 레벨업 제어
    ├── weaponExecutors.js       # WeaponManager 발사 확장: 34종 기본/진화 무기별 발사 및 투사체 생성 로직
    ├── weaponRenderer.js        # WeaponManager 렌더러 확장: 투사체 및 무기 이펙트 캔버스 렌더링
    ├── enemyData.js             # ENEMY_TYPES: 월드 1(15종) 및 월드 2(15종) 일반 몬스터 스펙 테이블
    ├── enemies.js               # EnemyManager, Enemy 클래스: 몬스터 스폰, AI 행동, 충돌 판정, 빙결/넉백
    ├── bosses.js                # BossEnemy 클래스: 15종 보스 스펙, 넉백 면역 및 전방위 탄막 패턴 AI
    ├── dropItems.js             # DamageNumber, ExpGem, PickupItem, BossProjectile 독립 클래스
    ├── cards.js                 # CardManager 클래스: 무기/패시브 추첨, 철검 공용화, 직업 제한, 진화 합성
    ├── waveManager.js           # WaveManager 클래스: 25단계 스테이지 타이머, 스폰 제어, 사신 강림
    ├── obstacles.js             # ObstacleManager 클래스: 필드 장애물(바위, 나무, 상자) 충돌 및 파괴
    ├── saveManager.js           # SaveManager 클래스: FNV-1a 해시 체크섬 및 로컬 스토리지 입출력
    ├── audio.js                 # SoundEngine 클래스: Web Audio API 8비트 레트로 신디사이저 사운드
    ├── assets.js                # AssetManager 클래스: 119종 스프라이트 프리로더 및 매니페스트
    ├── ui.js                    # UIManager 클래스: HUD 렌더링, 공용 모달 제어, 전체화면
    ├── lobby.js                 # UIManager 로비 확장: 로비 화면, 영구 강화 상점, 캐릭터/월드 선택
    ├── ranking.js               # UIManager 랭킹 확장: 명예의 전당 랭킹 모달 렌더링
    └── joystick.js              # UIManager 조이스틱 확장: 모바일 터치 가상 조이스틱 이벤트 제어
```

---

## 2. 모듈 및 핵심 클래스/함수 인터페이스 명세

### 2.1 코어 게임 루프 및 플레이어 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/main.js`](js/main.js) | `Game` | 전체 게임 루프, 상태(로비/플레이/일시정지/승리/게임오버) 관리, 캔버스 렌더링 총괄 | `init()`, `start()`, `update(dt)`, `draw()`, `triggerBomb()`, `goToLobby()` |
| [`js/player.js`](js/player.js) | `Player` | 캐릭터 이동, 입력 제어, 무적 시간, 경험치 획득, 레벨업 요구량 계산, 부활 및 공격 모션 | `update(dt)`, `gainExp(amt)`, `takeDamage(dmg)`, `triggerAttackAnim()` |
| [`js/saveManager.js`](js/saveManager.js) | `SaveManager` | 유저 골드 및 영구 강화 스탯의 로컬 저장/로드, FNV-1a 해시 체크섬 검증 | `load()`, `save()`, `calculateChecksum(data)` |
| [`js/waveManager.js`](js/waveManager.js) | `WaveManager` | 25스테이지(총 18분 45초) 타임라인 진행, 몬스터 스폰 주기, 사신 강림 트리거 | `update(dt)`, `nextStage()`, `spawnReaper()` |

### 2.2 무기 및 전투 시뮬레이션 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/weaponData.js`](js/weaponData.js) | `WEAPON_CONFIGS` | 17종 기본 무기 및 17대 2단계 진화 무기 기본 스펙, 쿨다운, 피해량, 범위 데이터 정의 | `sword`, `axe`, `slayerBladeStorm`, `eclipseSpiral`, `divineJudgement` 등 34종 스펙 |
| [`js/weapons.js`](js/weapons.js) | `WeaponManager` | 무기 코어: 스탯 계산 공식(getCount, getDamage, getArea 등), 쿨다운 관리, 레벨업 | `update(dt, enemies)`, `fireWeapon(w, enemies)`, `getCooldown(w)`, `getDamage(w)` |
| [`js/weaponExecutors.js`](js/weaponExecutors.js) | `WeaponManager` 프로토타입 확장 | 34종 기본/진화 무기별 실제 발사 로직 및 투사체 인스턴스 생성 | `executeSword()`, `executeAxe()`, `executeEclipseSpiral()`, `executeDivineJudgement()` 등 34종 실행기 |
| [`js/weaponRenderer.js`](js/weaponRenderer.js) | `WeaponManager` 프로토타입 확장 | 34종 무기의 캔버스 2D 투사체 및 특수 이펙트 렌더링 | `drawWeapons(ctx, player)` |

### 2.3 몬스터 및 보스 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/enemyData.js`](js/enemyData.js) | `ENEMY_TYPES` | 월드 1(15종) 및 월드 2(15종) 일반 몬스터의 스탯, 색상, 스프라이트 매핑 테이블 | `ENEMY_TYPES.world1`, `ENEMY_TYPES.world2` |
| [`js/enemies.js`](js/enemies.js) | `EnemyManager`, `Enemy` | 몬스터 스폰 주기 관리, AI 이동/추적, 플레이어 및 무기 충돌 판정, 상태이상(빙결/기절/감속/중독 3중첩) 및 피격 최적화 | `update(dt, player)`, `spawnEnemy(type)`, `checkCollisions()`, `draw()` |
| [`js/bosses.js`](js/bosses.js) | `BossEnemy` | 15종 보스 스펙, 넉백 면역 판정, 15대 특수 탄막/돌진/소환/블랙홀 패턴 AI 및 체력바 렌더링 | `update(dt, player)`, `draw(ctx)`, `takeDamage(amount)` |
| [`js/dropItems.js`](js/dropItems.js) | `DamageNumber`, `ExpGem`, `PickupItem`, `BossProjectile` | 몬스터 사망 드랍 보석, 필드 아이템(포션/폭탄/자석/치킨), 보스 탄막, 크리티컬 데미지 텍스트 | `DamageNumber`, `ExpGem`, `PickupItem`, `BossProjectile` |

### 2.4 레벨업 카드, 장애물 및 UI 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/cards.js`](js/cards.js) | `CardManager` | 철검(sword) 전직업 공용화, 타 직업 시그니처 무기 차단(Blacklist), 17대 진화 합성 힌트 및 카드 추첨 | `generateCards()`, `generateStartingWeaponCards()`, `getForbiddenWeaponsForClass()` |
| [`js/obstacles.js`](js/obstacles.js) | `ObstacleManager` | 3종 필드 장애물(바위, 고대나무, 나무상자) 배치 및 충돌/파괴/아이템 드랍 | `update(dt, player)`, `draw(ctx, player)` |
| [`js/ui.js`](js/ui.js) | `UIManager` | HUD(체력, 경험치, 타이머), 레벨업 카드 모달, 일시정지 창, 게임오버/승리 모달, 전체화면 | `showLevelUpModal(cards)`, `showGameOverModal()`, `togglePause()`, `initFullscreen()` |
| [`js/lobby.js`](js/lobby.js) | `UIManager` 프로토타입 확장 | 로비 화면 모달, 영구 강화 상점(골드 구매/환불), 캐릭터 및 월드 선택 창 | `renderPermanentShop()`, `openCharacterSelectModal()`, `selectWorld()` |
| [`js/ranking.js`](js/ranking.js) | `UIManager` 프로토타입 확장 | 명예의 전당 랭킹 조회 및 테이블 렌더링, 랭킹 모달 제어 | `renderHallOfFame()`, `closeHallOfFame()` |
| [`js/joystick.js`](js/joystick.js) | `UIManager` 프로토타입 확장 | 모바일 및 터치 디바이스 가상 조이스틱 이벤트 리스너 및 렌더링 | `initJoystick()`, `updateJoystickPosition()` |

---

## 3. AI 작업 시 빠른 참조 맵 (Fast Lookup)

어떤 기능을 수정해야 할 때 AI가 바로 열람하고 수정해야 하는 타겟 파일 경로입니다.

* **캐릭터 스탯, 이동속도, 경험치 곡선, 부활, 공격 애니메이션을 변경할 때**:
  👉 [`js/player.js`](js/player.js) (`constructor`, `applyCharacterStats`, `triggerAttackAnim`)
* **특정 기본/진화 무기의 기본 스펙(데미지, 쿨다운, 범위 등)을 수정할 때**:
  👉 [`js/weaponData.js`](js/weaponData.js) (스펙 정의) 및 [`js/weapons.js`](js/weapons.js) (공식 계산)
* **특정 기본/진화 무기의 발사 형태나 투사체 동작을 수정할 때**:
  👉 [`js/weaponExecutors.js`](js/weaponExecutors.js) (34종 무기 발사 로직)
* **무기 투사체나 공격 이펙트의 캔버스 그래픽을 수정할 때**:
  👉 [`js/weaponRenderer.js`](js/weaponRenderer.js) (`drawWeapons`)
* **일반 몬스터의 스펙(HP, 속도, 공격력, 색상)을 수정할 때**:
  👉 [`js/enemyData.js`](js/enemyData.js) (`ENEMY_TYPES.world1`, `ENEMY_TYPES.world2`)
* **일반 몬스터의 AI, 충돌 판정, 빙결/넉백 상태이상을 수정할 때**:
  👉 [`js/enemies.js`](js/enemies.js) (`update`, `takeDamage`, `spawnEnemy`)
* **보스 15종 탄막 패턴, 돌진, 소환, 넉백 면역을 수정할 때**:
  👉 [`js/bosses.js`](js/bosses.js) (`BossEnemy`, `takeDamage`, `update`)
* **보스 투사체, 드랍 아이템(보석, 포션 등), 데미지 텍스트를 수정할 때**:
  👉 [`js/dropItems.js`](js/dropItems.js) (`BossProjectile`, `ExpGem`, `PickupItem`, `DamageNumber`)
* **스테이지 진행 시간, 몹 스폰량, 사신 강림 시점을 변경할 때**:
  👉 [`js/waveManager.js`](js/waveManager.js) (`stageConfigs`, `maxStage = 25`)
* **필드 장애물(바위, 나무, 상자)의 수치나 효과를 수정할 때**:
  👉 [`js/obstacles.js`](js/obstacles.js)
* **HUD, 레벨업 카드 선택, 일시정지 창을 수정할 때**:
  👉 [`js/ui.js`](js/ui.js), [`index.html`](index.html), [`style.css`](style.css)
* **로비 화면, 영구 강화 상점, 캐릭터/월드 선택창을 수정할 때**:
  👉 [`js/lobby.js`](js/lobby.js)
* **명예의 전당 랭킹 모달을 수정할 때**:
  👉 [`js/ranking.js`](js/ranking.js)
* **가상 조이스틱 터치 입력을 수정할 때**:
  👉 [`js/joystick.js`](js/joystick.js)
* **픽셀아트 스프라이트 디자인 및 도트 매트릭스를 수정할 때**:
  👉 `assets/data/` 디렉토리 내 해당 파일 수정 후 `node generate_assets.js` 실행
* **신규 월드(3, 4 등) 지형/장애물/보스/타임라인을 추가할 때**:
  👉 `.agents/skills/anti-world-architect/` (`node .agents/skills/anti-world-architect/scripts/scaffold_world.js`)
* **전투 엔진 및 무기 공식 정합성을 감사할 때**:
  👉 `.agents/skills/anti-logic-auditor/` (`node .agents/skills/anti-logic-auditor/scripts/audit_weapons.js`)
* **스테이지 난이도 곡선 및 보스 처치 시간(TTK) 밸런스를 검증할 때**:
  👉 `.agents/skills/anti-balance-simulator/` (`node .agents/skills/anti-balance-simulator/scripts/simulate_balance.js`)
* **스킬 추천, 효율(ROI) 산출, 호출 통계 대시보드 조회 및 미사용 스킬을 정리할 때**:
  👉 `.agents/skills/anti-skill-lifecycle/` (`node .agents/skills/anti-skill-lifecycle/scripts/track_skill.js report`)
* **상태이상(빙결, 기절, 중독 3중첩, 감속) 시스템 및 피격 최적화를 감사할 때**:
  👉 `.agents/skills/anti-status-engine/` (`node .agents/skills/anti-status-engine/scripts/audit_status.js`)

---

## 4. 구조 변경 시 동기화 원칙 (Maintenance Rules)

모든 AI 어시스턴트는 작업을 마친 후 다음 원칙을 준수해야 합니다.

1. **신규 모듈/파일 추가 시**:
   - 새 파일 생성 시 본 `main.md`의 **1. 프로젝트 디렉토리 맵**과 **2. 인터페이스 명세표**에 즉시 등록합니다.
2. **밸런스 및 인터페이스 대폭 변경 시**:
   - 파라미터나 로직 구조가 바뀌면 본 문서의 테이블과 `docs/*.md`의 해당 스펙을 최신 상태로 동기화합니다.
3. **작업 완료 후**:
   - `node -c ...`로 문법 오류가 없는지 검증하고, 변경 내역을 명확하게 보고합니다.
