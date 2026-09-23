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
├── generate_assets.js           # 순수 Node.js 94종 픽셀아트 PNG 스프라이트 빌더
├── champion.json                # 명예의 전당 랭킹 데이터 (1~3위 닉네임, 시간, 직업)
├── AGENTS.md                    # [루트] 깃허브 공용 AI 에이전트 표준 지침
├── main.md                      # [본 문서] AI 아키텍처 인덱스 및 Fast Lookup 가이드
├── readme.md                    # 프로젝트 소개, 실행법, 플레이 가이드 및 AI 워크플로우 요약
│
├── api/                         # Vercel Serverless Function
│   └── champion.js              # Vercel 배포 환경용 명예의 전당 REST API
│
├── docs/                        # 도메인별 심층 명세 문서
│   ├── character.md             # 6종 캐릭터(기사/마도사/암살자/해골성직자/궁수/워록), 16종 패시브, 영구 강화
│   ├── weapons.md               # 14종 기본 무기 & 14대 진화 무기 상세 스펙 및 공격 공식
│   ├── enemies.md               # 15종 일반 몬스터 & 11종 보스 상세 AI, 스탯, 패턴
│   ├── stages.md                # 25스테이지 웨이브 타임라인(총 18분 45초), 사신 강림
│   ├── items.md                 # 필드 장애물(바위/나무/상자), 5종 드랍템, 경험치 보석
│   ├── assets.md                # 94종 스프라이트 에셋 명세표
│   └── system.md                # FNV-1a 보안 체크섬, 무결성 검증
│
├── js/                          # 🚀 고속 바닐라 JS 코어 런타임 (더미 파일 완전 제거)
│   ├── main.js                  # Game 클래스: 메인 루프, 입력 이벤트, 렌더링 파이프라인
│   ├── player.js                # Player 클래스: 이동, 조작, 피격 판정, 레벨업/경험치 곡선, 공격 모션
│   ├── weapons.js               # WeaponManager 클래스: 14종 기본/14종 진화 무기 엔진, 투사체 및 장판 시뮬레이션
│   ├── enemies.js               # EnemyManager 클래스: 15종 몬스터/11종 보스 스폰, AI 행동, 충돌 판정, 빙결/넉백
│   ├── cards.js                 # CardManager 클래스: 타직업 시그니처 5종 차단 & 공용 8종 개방 카드 풀, 진화 합성
│   ├── waveManager.js           # WaveManager 클래스: 25단계 스테이지 타이머, 스폰 제어, 사신 강림
│   ├── obstacles.js             # ObstacleManager 클래스: 필드 장애물(바위, 나무, 상자) 충돌 및 파괴
│   ├── saveManager.js           # SaveManager 클래스: FNV-1a 해시 체크섬 및 로컬 스토리지 입출력
│   ├── audio.js                 # SoundEngine 클래스: Web Audio API 8비트 레트로 신디사이저 사운드
│   ├── assets.js                # AssetManager 클래스: 94종 스프라이트 프리로더 및 매니페스트
│   └── ui.js                    # UIManager 클래스: HUD 렌더링, 모달 제어, 조이스틱, XSS 살균
│
└── assets/sprites/              # 94종 픽셀아트 스프라이트 PNG 파일 디렉토리
```

---

## 2. 모듈 및 핵심 클래스/함수 인터페이스 명세

### 2.1 코어 게임 루프 및 플레이어 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/main.js`](js/main.js) | `Game` | 전체 게임 루프, 상태(로비/플레이/일시정지/승리/게임오버) 관리, 캔버스 렌더링 총괄 | `init()`, `start()`, `update(dt)`, `draw()`, `triggerBomb()` |
| [`js/player.js`](js/player.js) | `Player` | 캐릭터 이동, 입력 제어, 무적 시간, 경험치 획득, 레벨업 요구량 계산, 부활 및 공격 모션 | `update(dt)`, `gainExp(amt)`, `takeDamage(dmg)`, `triggerAttackAnim()` |
| [`js/saveManager.js`](js/saveManager.js) | `SaveManager` | 유저 골드 및 영구 강화 스탯의 로컬 저장/로드, FNV-1a 해시 체크섬 검증 | `load()`, `save()`, `calculateChecksum(data)` |
| [`js/waveManager.js`](js/waveManager.js) | `WaveManager` | 25스테이지(총 18분 45초) 타임라인 진행, 몬스터 스폰 주기, 사신 강림 트리거 | `update(dt)`, `nextStage()`, `spawnReaper()` |

### 2.2 무기 및 전투 시뮬레이션 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/weapons.js`](js/weapons.js) | `WeaponManager` | 14종 기본 무기 및 14대 2단계 진화 무기 통합 관리, 쿨다운/데미지/사거리/투사체/도트 장판 시뮬레이션 | `update(dt, enemies)`, `fireWeapon(w, enemies)`, `getCooldown(w)`, `getDamage(w)` |

### 2.3 몬스터 및 보스 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/enemies.js`](js/enemies.js) | `EnemyManager`, `DamageNumber` | 15종 일반 몬스터 및 11종 보스 스폰/AI 행동/충돌 판정, 유령 무적/해골 부활 빙결 면역, 렉 없는 크리티컬 느낌표 표기 | `update(dt, player)`, `spawnEnemy(type)`, `checkCollisions()`, `draw()` |

### 2.4 레벨업 카드, 장애물 및 UI 레이어
| 파일명 | 클래스/함수명 | 역할 및 책임 | 주요 메서드 / 프로퍼티 |
| :--- | :--- | :--- | :--- |
| [`js/cards.js`](js/cards.js) | `CardManager` | 타 직업 시그니처 무기 5종 차단(Blacklist), 공용 8종 무기 개방, 14대 진화 합성 힌트 및 카드 추첨 | `generateCards()`, `generateStartingWeaponCards()`, `getForbiddenWeaponsForClass()` |
| [`js/obstacles.js`](js/obstacles.js) | `ObstacleManager` | 3종 필드 장애물(바위, 고대나무, 나무상자) 배치 및 충돌/파괴/아이템 드랍 | `update(dt, player)`, `draw(ctx, player)` |
| [`js/ui.js`](js/ui.js) | `UIManager` | 체력바, EXP 게이지, 타이머, 레벨업 카드 모달, 승리/패배 모달, 명예의 전당, 가상 조이스틱 | `showLevelUpModal(cards)`, `showGameOverModal()`, `renderHallOfFame()` |

---

## 3. AI 작업 시 빠른 참조 맵 (Fast Lookup)

어떤 기능을 수정해야 할 때 AI가 바로 열람하고 수정해야 하는 타겟 파일 경로입니다. (더미 파일이 제거되어 단일 파일로 즉시 수정 가능)

* **캐릭터 스탯, 이동속도, 경험치 곡선, 부활, 공격 애니메이션을 변경할 때**:
  👉 [`js/player.js`](js/player.js) (`constructor`, `applyCharacterStats`, `triggerAttackAnim`)
* **특정 기본/진화 무기의 데미지, 쿨타임, 투사체 수, 범위를 수정할 때**:
  👉 [`js/weapons.js`](js/weapons.js) (`unlockWeapon`, `executeSwordSlash`, `executeThunderBlade`, `executeEclipseSpiral` 등)
* **캐릭터별 타 직업 시그니처 무기 차단 및 레벨업 카드 출현을 수정할 때**:
  👉 [`js/cards.js`](js/cards.js) (`CHARACTER_SIGNATURE_WEAPONS`, `getForbiddenWeaponsForClass`, `generateCards`)
* **크리티컬 느낌표(!) 타격 표기 및 몬스터 빙결/넉백/스탯을 수정할 때**:
  👉 [`js/enemies.js`](js/enemies.js) (`DamageNumber`, `freeze`, `takeDamage`, `spawnEnemy`)
* **스테이지 진행 시간, 몹 스폰량, 사신 강림 시점을 변경할 때**:
  👉 [`js/waveManager.js`](js/waveManager.js) (`stageConfigs`, `maxStage = 25`)
* **필드 장애물, 드랍 아이템(포션, 폭탄, 자석 등)의 수치나 효과를 수정할 때**:
  👉 [`js/obstacles.js`](js/obstacles.js) 및 [`js/main.js`](js/main.js)
* **HUD, 명예의 전당, 캐릭터 선택, 로비 강화 상점 UI를 수정할 때**:
  👉 [`js/ui.js`](js/ui.js), [`index.html`](index.html), [`style.css`](style.css)
* **픽셀아트 스프라이트 디자인 및 생성을 수정할 때**:
  👉 [`generate_assets.js`](generate_assets.js) (수정 후 `node generate_assets.js` 실행)

---

## 4. 구조 변경 시 동기화 원칙 (Maintenance Rules)

모든 AI 어시스턴트는 작업을 마친 후 다음 원칙을 준수해야 합니다.

1. **신규 모듈/파일 추가 시**:
   - 새 파일 생성 시 본 `main.md`의 **1. 프로젝트 디렉토리 맵**과 **2. 인터페이스 명세표**에 즉시 등록합니다.
2. **밸런스 및 인터페이스 대폭 변경 시**:
   - 파라미터나 로직 구조가 바뀌면 본 문서의 테이블과 `docs/*.md`의 해당 스펙을 최신 상태로 동기화합니다.
3. **작업 완료 후**:
   - `node -c ...`로 문법 오류가 없는지 검증하고, 변경 내역을 명확하게 보고합니다.
