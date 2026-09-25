# 프로젝트 아키텍처 및 모듈 네비게이션 가이드 (`main.md`)

> **Anti Survivors 수묵화풍(Ink-Wash Calligraphy Dark Fantasy) 비주얼 리메이크 총괄 가이드**  
> 본 문서는 프로젝트의 전체 디렉토리 구조, 모듈별 책임, 클래스 및 함수 인터페이스, 수묵화 비주얼 렌더링 파이프라인을 체계적으로 인덱싱한 맵(Map)입니다.  
> 코드 작성 및 수정 시 본 문서를 기준으로 대상을 식별하고 **최소 침습적 수정(Surgical Changes)**을 진행하십시오.

---

## 1. 프로젝트 디렉토리 맵 (Directory Map)

```text
anti_survivor/
├── index.html                   # HTML5 Canvas 뷰포트 및 UI 컨테이너
├── style.css                    # 다크 판타지 수묵화풍 UI/HUD 스타일시트
├── generate_assets.js           # 🖌️ 통합 수묵화풍(Ink-Wash) 마스터 에셋 빌더 (Zero-dependency)
├── main.md                      # 프로젝트 아키텍처 및 빠른 참조 인덱스 (본 문서)
├── README.md                    # 프로젝트 공식 개요 및 릴리즈 노트
├── AGENTS.md / GEMINI.md        # AI 에이전트 공통 표준 작업 규칙
│
├── js/                          # 핵심 게임 엔진 모듈 (순수 바닐라 ES6+)
│   ├── main.js                  # 메인 게임 루프, 입력 처리, 씬 전환
│   ├── assets.js                # 에셋 프리로더 및 Canvas 2D 렌더링 인터페이스
│   ├── player.js                # 플레이어 이동, 스탯 공식, 60fps 무렉 초승달 수묵 베기 모션 & 칼끝 궤적 일치
│   ├── weapons.js               # 34종 무기 발사 엔진, 유효 사거리 체크, 홀드 파이어, 투사체/범위 계산, 콤보큐
│   ├── weaponData.js            # 34종 고유 무기 상세 스펙, 공식 계수, 진화 트리 정의 (레거시 키 완전 제거)
│   ├── weaponExecutors.js       # 무기별 개별 발사 및 액션 실행 로직
│   ├── weaponRenderer.js        # 무기별 수묵 서예 궤적, 결계, 회전 칼날 렌더링
│   ├── cards.js                 # 레벨업/상자 카드 풀, 17대 진화 합성, 패시브 카드풀
│   ├── enemies.js               # 일반 몬스터 30종 AI, 스폰 테이블, 충돌 처리
│   ├── bosses.js                # 보스 13종 패턴, 탄막, 체력바 렌더링
│   ├── obstacles.js             # 필드 장애물(기암괴석, 고목, 궤짝, 심해 장애물 3종) 시스템 및 조류 만곡 애니메이션
│   ├── dropItems.js             # 특수 드랍 아이템(자석, 폭탄, 빙결, 회복, 골드) 및 영석
│   ├── stage.js / world.js      # 월드 1(사각 부유섬), 월드 2(심해 대협곡) 지형/웨이브
│   ├── saveManager.js           # FNV-1a 해시 체크섬 기반 세이브 무결성 관리
│   └── sounds.js                # Web Audio API 절차적 사운드 신시사이저
│
├── assets/                      # 게임 리소스
│   ├── data/
│   │   ├── ink_emblems.js       # 128x128 수묵 엠블럼 래스터라이저 (무기/패시브/진화 51종)
│   │   ├── ink_bosses.js        # 128x128 고해상도 수묵 보스 래스터라이저 (13종 전원)
│   │   └── ink_enemies.js       # 128x128 고해상도 수묵 일반 몬스터 래스터라이저 (30종 전원)
│   └── sprites/                 # 100% 수묵화풍 고화질 PNG 스프라이트 (빌드 결과물)
│       ├── player*.png          # 영웅 6종 128x128 고해상도 수묵 스프라이트
│       ├── boss_*.png           # 보스 13종 128x128 고해상도 수묵 스프라이트
│       ├── enemy_*.png          # 일반 몬스터 30종 128x128 고해상도 수묵 스프라이트
│       ├── icon_*.png           # 128x128 단청 수묵 엠블럼 51종
│       ├── obstacle_*.png       # 64x64 수묵 기암괴석/고목/궤짝 및 심해 암초/해초/침몰선 6종
│       ├── item_*.png           # 단청 수묵 특수 드랍 아이템 5종
│       ├── gem_*.png            # 단청 수묵 경험치 영석 4종
│       └── proj_*.png / effect_*.png # 수묵 서예 투사체 및 스킬 광역 이펙트 22종
│
└── scripts/                     # 서브 수묵 빌더 모듈 (generate_assets.js가 일괄 호출)
    ├── generate_sumie_items.js  # 수묵 장애물 6종, 드랍 아이템 5종, 영석 4종 생성기
    ├── generate_sumie_enemies.js# 수묵 일반 몬스터 30종 생성기 (ink_enemies.js 연동)
    ├── generate_sumie_projectiles.js # 수묵 투사체 18종 및 광역 이펙트 생성기
    └── generate_sumie_bosses.js # 수묵 보스 13종 렌더러 (ink_bosses.js 연동)
```

---

## 2. 100% 수묵화풍 에셋 파이프라인 불변 원칙

1. **레거시 16×16 도트 및 구형 별칭 완전 퇴출 (Zero-Legacy & Unified Identifiers)**:
   - 과거 16×16 깍두기 도트 파일은 완전히 영구 제거되었습니다.
   - 프로토타입 무기 별칭(`acidPool`, `throwingDagger`, `spinningAxe`, `bladeWhip`, `holyShotgun`, `arcaneSanctuary`, `plasmaTempest`)을 완전 삭제하고 정규 무기 ID 34종으로 전역 단일화되었습니다.
   - 모든 에셋은 `node generate_assets.js` 단일 명령어로 일괄 빌드됩니다.
2. **에셋별 렌더링 규격**:
   - **영웅 6종**: 128×128 고해상도 수묵화풍 단청 스프라이트 (`imageSmoothingEnabled = true`)
   - **보스 13종**: 128×128 정밀 래스터라이저 (`ink_bosses.js`, 농묵/중묵/담묵 + 네온 안광)
   - **일반 몬스터 30종**: 128×128 고해상도 수묵 래스터라이저 (`ink_enemies.js`, 송연먹 갈필 + 단청 안광)
   - **아이콘 51종**: 128×128 단청 엠블럼 (`ink_emblems.js`, 비백 림 + 단청 오방색)
   - **장애물 6종**: 64×64 수묵 기암괴석/고목/궤짝 3종 및 심해 산호암초/거대해초/침몰선궤짝 3종 (조류 만곡 물리 연동)
   - **아이템/영석**: 단청 수묵화풍 특수 드랍 아이템 5종 및 영석 4단계
   - **투사체/이펙트**: 60fps 무렉 수묵 서예 비백 궤적 및 네온 코어 (총 22종)

---

## 3. 핵심 시스템 아키텍처

1. **무기 유효 사거리 체크 및 스마트 홀드 파이어 (`js/weapons.js`)**:
   - 발사체/휘두르기 무기는 유효 사거리 내에 적이 감지되지 않으면 허공에 난사하지 않고 쿨타임을 0으로 대기(Hold Fire)합니다.
   - 사거리 무제한 무기 10종(`lightningRing`, `holyWater`, `sanctuary`, `heavenlySanctuary`, `plague`, `bladeStorm`, `shadowOrb`, `eclipseSpiral` 등)은 상시 작동합니다.
   - 도끼 계열(`axe`, `fireAxe`)은 보스 투사체 패링 가능 범위까지 사거리 체크에 포함됩니다.
2. **근접 무기 궤적 반경 정밀 동기화 (`js/player.js`)**:
   - 철검, 도끼, 벼락검 등 휘두르는 무기의 수묵 궤적 반경을 무기 끝(Tip) 위치에 1:1로 일치시키고, 범위(`area`) 스탯 증가 시 비례 확대되도록 정밀 보정되었습니다.
3. **세이브 데이터 무결성 보호 (`js/saveManager.js`)**:
   - FNV-1a 32비트 해시 체크섬을 통해 유저 재화 및 영구 강화 스탯 변조를 완벽 방지합니다.

---

## 4. 빠른 참조 맵 (Fast Lookup)

| 도메인 | 핵심 파일 | 설명 |
| :--- | :--- | :--- |
| **마스터 에셋 빌더** | [`generate_assets.js`](generate_assets.js) | 모든 수묵 에셋 일괄 빌드 총괄 (Zero-dependency) |
| **수묵 엠블럼 엔진** | [`assets/data/ink_emblems.js`](assets/data/ink_emblems.js) | 128×128 단청 엠블럼 51종 래스터라이저 |
| **수묵 보스 엔진** | [`assets/data/ink_bosses.js`](assets/data/ink_bosses.js) | 128×128 고해상도 보스 13종 래스터라이저 |
| **수묵 일반 몬스터 엔진** | [`assets/data/ink_enemies.js`](assets/data/ink_enemies.js) | 128×128 고해상도 일반 몬스터 수묵 래스터라이저 (30종 전원) |
| **카드 시스템** | [`js/cards.js`](js/cards.js) | 무기 해금/업그레이드, 17대 진화 무기, 패시브 카드풀 |
| **에셋 매니페스트** | [`js/assets.js`](js/assets.js) | 스프라이트 프리로딩 및 Canvas 2D 렌더링 인터페이스 |
| **필드 장애물** | [`js/obstacles.js`](js/obstacles.js) | 기암괴석/고목/궤짝 및 월드 2 심해 장애물 충돌/타격/파괴 |
| **드랍 아이템** | [`js/dropItems.js`](js/dropItems.js) | 자석, 폭탄, 빙결, 회복, 골드 및 경험치 영석 흡수 로직 |
| **무기 발사체 엔진** | [`js/weapons.js`](js/weapons.js) | 34종 무기 투사체 생성, 유효 사거리 체크, 홀드 파이어 제어 |
| **무기 스펙 데이터** | [`js/weaponData.js`](js/weaponData.js) | 34종 고유 무기 스펙, 진화 트리, 스탯 배율 (단일 정규 ID) |
| **무기 실행자** | [`js/weaponExecutors.js`](js/weaponExecutors.js) | 무기별 세부 스킬 및 액션 실행 파이프라인 |
| **무기 렌더러** | [`js/weaponRenderer.js`](js/weaponRenderer.js) | 수묵 서예 궤적 및 단청 이펙트 렌더링 |
| **전투 정적 검사기** | [`.agents/skills/anti-logic-auditor/scripts/audit_weapons.js`](.agents/skills/anti-logic-auditor/scripts/audit_weapons.js) | 34종 무기 로직/공식/진화 무결성 정적 검사 |
