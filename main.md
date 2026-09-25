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
├── AGENTS.md / GEMINI.md        # AI 에이전트 공통 표준 작업 규칙
│
├── js/                          # 핵심 게임 엔진 모듈 (순수 바닐라 ES6+)
│   ├── main.js                  # 메인 게임 루프, 입력 처리, 씬 전환
│   ├── assets.js                # 에셋 프리로더 및 오프스크린 스프라이트 관리
│   ├── player.js                # 플레이어 이동, 스탯 공식, 60fps 무렉 초승달 수묵 베기 모션
│   ├── weapons.js               # 34종 무기 발사 엔진, 쿨타임/투사체/범위 계산, 콤보큐
│   ├── weaponData.js            # 34종 무기 상세 스펙, 데미지 공식, 진화 트리 정의
│   ├── weaponRenderer.js        # 무기별 수묵 서예 궤적 및 네온 코어 렌더링
│   ├── cards.js                 # 레벨업/상자 카드 풀, 17대 진화 합성, 패시브 카드
│   ├── enemies.js               # 일반 몬스터 30종 AI, 스폰 테이블, 충돌 처리
│   ├── bosses.js                # 보스 13종 패턴, 탄막, 체력바 렌더링
│   ├── obstacles.js             # 필드 장애물(기암괴석, 고목, 궤짝, 심해 장애물) 시스템
│   ├── dropItems.js             # 특수 드랍 아이템(자석, 폭탄, 빙결, 회복, 골드) 및 영석
│   ├── stage.js / world.js      # 월드 1(사각 부유섬), 월드 2(심해 대협곡) 지형/웨이브
│   ├── saveManager.js           # FNV-1a 해시 체크섬 기반 세이브 무결성 관리
│   └── sounds.js                # Web Audio API 절차적 사운드 신시사이저
│
├── assets/                      # 게임 리소스
│   ├── data/
│   │   ├── ink_emblems.js       # 128x128 수묵 엠블럼 래스터라이저 (무기/패시브/진화/자석 56종)
│   │   ├── ink_bosses.js        # 128x128 고해상도 수묵 보스 래스터라이저 (7종)
│   │   └── ink_enemies.js       # 128x128 고해상도 수묵 일반 몬스터 래스터라이저 (Phase 1 8종 등)
│   └── sprites/                 # 100% 수묵화풍 고화질 PNG 스프라이트 (빌드 결과물)
│       ├── player*.png          # 영웅 6종 128x128 고해상도 수묵 스프라이트
│       ├── boss_*.png           # 보스 몬스터 스프라이트 (128x128 7종 등)
│       ├── icon_*.png           # 128x128 단청 수묵 엠블럼 56종 (icon_magnet 포함)
│       ├── obstacle_*.png       # 64x64 산수화 기암괴석/고목/궤짝 장애물 3종
│       ├── item_*.png           # 단청 수묵 특수 드랍 아이템 5종
│       ├── gem_*.png            # 단청 수묵 경험치 영석 4종
│       └── proj_*.png           # 수묵 서예 투사체 및 스킬 이펙트
│
└── scripts/                     # 서브 수묵 빌더 모듈 (generate_assets.js가 일괄 호출)
    ├── generate_sumie_items.js  # 수묵 장애물 3종, 드랍 아이템 5종, 영석 4종 생성기
    ├── generate_sumie_enemies.js# 수묵 일반 몬스터 30종 생성기
    ├── generate_sumie_projectiles.js # 수묵 투사체 18종 및 광역 이펙트 생성기
    └── generate_sumie_bosses.js # 수묵 보스 렌더러
```

---

## 2. 100% 수묵화풍 에셋 파이프라인 불변 원칙

1. **레거시 16×16 도트 완전 퇴출 (Zero-Legacy)**:
   - 과거 16×16 깍두기 도트 파일(`sprites_*.js`)은 완전히 삭제되었습니다.
   - 모든 에셋은 `node generate_assets.js` 단일 명령어로 일괄 빌드되며, 레거시 도트로 덮어씌워질 위험이 100% 차단되었습니다.
2. **에셋별 렌더링 규격**:
   - **영웅 6종**: 128×128 고해상도 수묵화풍 단청 스프라이트 (`imageSmoothingEnabled = true`)
   - **보스 7종**: 128×128 정밀 래스터라이저 (`ink_bosses.js`, 농묵/중묵/담묵 + 네온 안광)
   - **아이콘 56종**: 128×128 단청 엠블럼 (`ink_emblems.js`, 비백 림 + 단청 오방색)
   - **장애물 3종**: 64×64 동양 산수화 부벽준 기암괴석, 굽이치는 흑묵 고목, 수묵 궤짝
   - **아이템/영석**: 단청 수묵화풍 특수 드랍 아이템 5종 및 영석 4단계
   - **일반 몬스터 30종**: 128×128 고해상도 수묵 래스터라이저 (ink_enemies.js, 송연먹 갈필 + 단청 안광)
   - **투사체/이펙트**: 60fps 무렉 수묵 서예 비백 궤적 및 네온 코어

---

## 3. 빠른 참조 맵 (Fast Lookup)

| 도메인 | 핵심 파일 | 설명 |
| :--- | :--- | :--- |
| **마스터 에셋 빌더** | [`generate_assets.js`](generate_assets.js) | 모든 수묵 에셋 일괄 빌드 총괄 (Zero-dependency) |
| **수묵 엠블럼 엔진** | [`assets/data/ink_emblems.js`](assets/data/ink_emblems.js) | 128×128 단청 엠블럼 56종 래스터라이저 |
| **수묵 보스 엔진** | [`assets/data/ink_bosses.js`](assets/data/ink_bosses.js) | 128×128 고해상도 보스 7종 래스터라이저 |
| **수묵 일반 몬스터 엔진** | [`assets/data/ink_enemies.js`](assets/data/ink_enemies.js) | 128×128 고해상도 일반 몬스터 수묵 래스터라이저 (Phase 1 8종 등) |
| **카드 시스템** | [`js/cards.js`](js/cards.js) | 무기 해금/업그레이드, 17대 진화 무기, 패시브 카드풀 |
| **에셋 매니페스트** | [`js/assets.js`](js/assets.js) | 스프라이트 프리로딩 및 Canvas 2D 렌더링 인터페이스 |
| **필드 장애물** | [`js/obstacles.js`](js/obstacles.js) | 기암괴석/고목/궤짝 및 월드 2 심해 장애물 충돌/타격/파괴 |
| **드랍 아이템** | [`js/dropItems.js`](js/dropItems.js) | 자석, 폭탄, 빙결, 회복, 골드 및 경험치 영석 흡수 로직 |
| **무기 발사체 엔진** | [`js/weapons.js`](js/weapons.js) | 34종 무기 투사체 생성, 쿨타임, 콤보큐 연타 제어 |
