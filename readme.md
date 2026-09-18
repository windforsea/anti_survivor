# ⚔️ Anti Survivors (안티 서바이버즈)

웹 기반 탑다운 뱀파이어 서바이벌라이크 액션 게임입니다.  
HTML5 Canvas, Pure JavaScript(ES6+), Web Audio API를 기반으로 외부 라이브러리/프레임워크 없이 초경량 네이티브로 구현되었습니다.

---

## 🚀 실행 및 접속 방법 (How to Run)

### 방법 1. 24시간 언제 어디서나 웹 접속 (Vercel 클라우드 호스팅)
- 로컬 서버 구동 없이 스마트폰/태블릿/PC 브라우저에서 즉시 플레이 가능합니다.
- **배포 주소**: [https://anti-survivor.vercel.app](https://anti-survivor.vercel.app)
- **공식 저장소**: [https://github.com/windforsea/anti_survivor](https://github.com/windforsea/anti_survivor)

### 방법 2. 원클릭 실행 (Windows 로컬 구동)
- 루트 디렉토리의 **`start_server.bat`** 파일을 더블클릭합니다.
- Node.js 설치 확인 후 기본 웹 브라우저(`http://localhost:3000`)를 자동 호출하며 서버가 즉시 기동됩니다.

### 방법 3. 콘솔 수동 실행
```bash
# 로컬 서버 실행 (Node.js 기본 내장 모듈만 사용, 별도 npm install 불필요)
node server.js

# 브라우저 접속: http://localhost:3000
# (동일 Wi-Fi 공유기 내 스마트폰/태블릿은 콘솔에 안내되는 LAN IP로 접속 가능)
```

---

## 📑 프로젝트 문서 가이드 허브 (Documentation Index)

프로젝트 유지보수 및 확장을 위해 세부 스펙과 데이터가 도메인별 가이드 문서로 분할 관리되고 있습니다.  
필요한 정보를 확인하려면 아래 링크를 참조하세요.

| 문서명 | 주요 내용 | 링크 |
| :--- | :--- | :---: |
| 👤 **캐릭터 및 성장 체계** | 3종 캐릭터 선택 시스템(기사/마도사/암살자), 모바일 조작 체계, 14종 인게임 패시브 스탯, 9종 로비 영구 강화 체계 | [상세보기](docs/character.md) |
| 🗡️ **무기 및 진화 체계** | 12종 기본 무기 스펙 테이블, 무기 강화 4대 카드 옵션, 6대 특수 진화 무기(조합 공식, 베놈 블리자드, 고유 효과) | [상세보기](docs/weapons.md) |
| 👾 **몬스터 및 보스 체계** | 15종 일반 몬스터 스탯 및 고유 AI 기믹, 10종 보스 전투 패턴(사신/공허의 지네/혼돈의 절대신/진 붉은 사신), 보스 보상 | [상세보기](docs/enemies.md) |
| 🌌 **스테이지 및 전장 환경** | 20스테이지 웨이브 타임라인(스폰 주기, 수량, hpScale), 20초 돌발 대습격 이벤트, 엔드게임 사신 강림, 우주 부유섬 지형 규칙 | [상세보기](docs/stages.md) |
| 📦 **필드 오브젝트 및 아이템** | 비파괴/파괴 장애물(바위, 나무, 상자), 5종 특수 드랍 아이템(포션, 자석, 폭탄, 얼음, 금화), 경험치 보석 | [상세보기](docs/items.md) |
| 🎨 **에셋 및 스프라이트 명세** | 79종 다크 판타지 도트 스프라이트 분류표, 순수 Node.js 기반 `generate_assets.js` 에셋 빌더 가이드 | [상세보기](docs/assets.md) |
| ⚙️ **시스템 및 보안 명세** | 클라이언트 11대 핵심 JS 모듈 구조, FNV-1a 해시 체크섬 세이브 보안, XSS 방어, 로컬 서버 및 챔피언 API | [상세보기](docs/system.md) |

---

## 📁 디렉토리 및 모듈 세분화 구조

Anti Survivors는 **단일 파일 비대화를 방지하고 작은 수치 조절 시에도 전수 조사 없이 즉시 수정**할 수 있도록 모든 몬스터, 보스, 무기, 진화체, 카드, 아이템 데이터가 1:1 독립 파일로 완전 세분화 모듈화되어 있습니다.

```text
vam/
├── 📄 index.html              # 게임 캔버스, 모달 레이어, 조이스틱 UI 엔트리
├── 📄 style.css               # 다크 판타지 네온 레트로 UI 스타일시트
├── 📄 server.js               # Node.js 경량 정적 서빙 & 랭킹 API 서버
├── 📄 start_server.bat        # 원클릭 서버 실행 배치 파일
├── 📄 generate_assets.js      # 순수 Node.js 79종 픽셀아트 PNG 빌더
├── 📄 champion.json           # 명예의 전당 (1~3위 랭킹 & 최근 유저 글)
├── 📂 api/                    # Vercel Serverless (champion.js)
├── 📄 readme.md               # 게임 개요, 실행법 및 퀵 수정 핀포인트 가이드 (본 파일)
│
├── 📂 docs/                   # 세부 도메인별 프로젝트 명세 문서 (7개 파일)
│   ├── 📄 character.md        # 3종 캐릭터, 패시브(14종), 영구 강화(9종)
│   ├── 📄 weapons.md          # 12종 기본 무기 & 6대 진화 무기 개별 파일 매핑 명세
│   ├── 📄 enemies.md          # 15종 일반 몹 & 10종 보스 개별 파일 매핑 명세
│   ├── 📄 stages.md           # 20스테이지 타임라인, 사신 강림, 부유섬 규칙
│   ├── 📄 items.md            # 필드 장애물, 5종 특수 드랍 아이템 및 보석
│   ├── 📄 assets.md           # 79종 스프라이트 에셋 명세표
│   └── 📄 system.md           # 세분화 모듈 아키텍처, FNV-1a 보안, 무결성 검증
│
├── 📂 js/                     # 클라이언트 코어 엔진 및 세분화 모듈군
│   ├── 📄 main.js             # Game 엔진: 게임 루프, 렌더링 파이프라인
│   ├── 📄 player.js           # Player: 캐릭터 스탯, 조작, 무적/피격 판정
│   ├── 📄 saveManager.js      # SaveManager: FNV-1a 암호화 체크섬 무결성 검증
│   ├── 📄 waveManager.js      # WaveManager: 20단계 웨이브, 스폰 계수, 돌발 이벤트
│   ├── 📄 audio.js            # SoundEngine: Web Audio API 8비트 레트로 신디사이저
│   ├── 📄 assets.js           # AssetManager: 79종 스프라이트 이미지 프리로더
│   ├── 📄 ui.js               # UIManager: HUD, 인게임 UI, 조이스틱, XSS 살균
│   │
│   ├── 📂 enemies/            # 👾 몬스터 및 보스 세분화 모듈
│   │   ├── 📄 enemyRegistry.js # 일반 몬스터/보스 통합 레지스트리 매핑
│   │   ├── 📄 projectiles.js   # 적 투사체(암흑구체, 맹독탄, 레이저 등) 엔진
│   │   ├── 📂 monsters/       # 15종 일반 몬스터 개별 스탯/AI (bat, slime, assassin 등)
│   │   └── 📂 bosses/         # 10종 보스 개별 스탯/패턴 (direBoar, chaosOverlord 등)
│   │
│   ├── 📂 weapons/            # 🗡️ 무기 세분화 모듈
│   │   ├── 📄 weaponRegistry.js # 기본/진화 무기 통합 레지스트리 매핑
│   │   ├── 📂 basic/          # 12종 기본 무기 개별 스펙/투사체 (sword, shotgun, frostOrb 등)
│   │   └── 📂 evolutions/     # 6대 진화 무기 개별 스펙/특수효과 (venomBlizzard, teslaShotgun 등)
│   │
│   ├── 📂 cards/              # 🃏 레벨업 카드 시스템
│   │   └── 📂 data/           # weaponCards.js, passiveCards.js, evolutionCards.js
│   │
│   ├── 📂 items/              # 📦 아이템 및 필드 오브젝트
│   │   ├── 📄 gem.js          # 경험치 보석(파랑/초록/빨강/보라) 및 자석 흡수
│   │   ├── 📄 dropItems.js    # 5종 특수 드랍 (포션, 자석, 폭탄, 시계, 금화)
│   │   └── 📄 obstacles.js    # 장애물(바위, 나무, 상자) 및 청크 안전 스폰
│   │
│   └── 📂 ui/components/      # 🖥️ UI 컴포넌트 분할
│       ├── 📄 lobby.js        # 로비 영구 강화 상점 & 챔피언 명예의 전당 UI
│       └── 📄 characterSelect.js # 3종 캐릭터(기사, 마도사, 암살자) 선택 모달
│
└── 📂 assets/sprites/         # 79종 다크 판타지 도트 스프라이트 PNG
```

---

## ⚡ 빠른 수치 조절 핀포인트 가이드 (Cheat Sheet)

코드 전체를 뒤적거릴 필요 없이, **원하는 수치를 바로 수정할 수 있는 1:1 매핑 가이드**입니다.

### 1. 일반 몬스터 스탯 및 AI 수정 (`js/enemies/monsters/`)
| 수정 대상 | 파일 경로 | 주요 수정 가능 항목 |
| :--- | :--- | :--- |
| **박쥐** | [`js/enemies/monsters/bat.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/bat.js) | 기본 체력(12), 속도(170), 공격력(6), 사인파 파동 주기 |
| **슬라임 & 분열체** | [`js/enemies/monsters/slime.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/slime.js)<br>[`js/enemies/monsters/miniSlime.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/miniSlime.js) | 기본 체력, 분열 마릿수(2), 분열체 이속 및 체력 |
| **좀비 & 해골** | [`js/enemies/monsters/zombie.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/zombie.js)<br>[`js/enemies/monsters/skeleton.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/skeleton.js) | 좀비 넉백 저항(45%), 해골 부활 대기시간(2s) 및 부활 체력 비율(35%) |
| **그림자 암살자** | [`js/enemies/monsters/assassin.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/assassin.js) | 급습 돌진 속도(280), 급습 쿨타임(4.5s), 돌진 사거리 |
| **원거리 마도사들** | [`js/enemies/monsters/cultist.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/cultist.js)<br>[`js/enemies/monsters/darkMage.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/darkMage.js) | 거리 유지(카이팅) 거리, 투사체 발사 주기, 탄속 |
| **골렘 / 타이탄** | [`js/enemies/monsters/golem.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/golem.js)<br>[`js/enemies/monsters/abyssTitan.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/abyssTitan.js) | 발구르기 감속 디버프, 높은 넉백 저항(70~85%), 체력 |

### 2. 보스 스탯 및 전투 패턴 수정 (`js/enemies/bosses/`)
| 수정 대상 | 파일 경로 | 주요 수정 가능 항목 |
| :--- | :--- | :--- |
| **2 Stg 돌진 맹수** | [`js/enemies/bosses/direBoar.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/direBoar.js) | 체력(1,600), 돌진 쿨타임(4s), 돌진 돌파 속도 |
| **6 Stg 혼돈의 눈** | [`js/enemies/bosses/chaosEye.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/chaosEye.js) | 나선 탄막 방출 주기, 탄속, 회전 각도 가속도 |
| **15 Stg 종말의 사신** | [`js/enemies/bosses/grimReaper.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/grimReaper.js) | 체력(52,000), 초고속 낫 돌진(460), 텔레포트 14방향 폭발 |
| **18 Stg 공허의 지네** | [`js/enemies/bosses/voidWyrm.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/voidWyrm.js) | 지그재그 위빙 각도, 5갈래 부채꼴 맹독 탄환 쿨타임(3.2s) |
| **20 Stg 혼돈의 절대신** | [`js/enemies/bosses/chaosOverlord.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/chaosOverlord.js) | 16방향 혼돈 탄막, 레이저 빔 쿨타임, 3연속 폭발 파동 |
| **엔드게임 진 붉은 사신** | [`js/enemies/bosses/redDeath.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/redDeath.js) | 즉사 피해(99,999), 추격 속도(360), 추가 소환 주기(60s) |

### 3. 기본 무기 스펙 수정 (`js/weapons/basic/`)
| 수정 대상 | 파일 경로 | 주요 수정 가능 항목 |
| :--- | :--- | :--- |
| **철검 / 도끼 / 채찍** | [`js/weapons/basic/sword.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/sword.js)<br>[`js/weapons/basic/axe.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/axe.js)<br>[`js/weapons/basic/whip.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/whip.js) | 기본 데미지, 공격 주기(쿨다운), 사거리, 넉백 파워 |
| **산탄 총포** | [`js/weapons/basic/shotgun.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/shotgun.js) | 산탄 발사 수량(3발), 부채꼴 확산각, 자동 조준 및 탄속 |
| **맹독 비수** | [`js/weapons/basic/poisonDagger.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/poisonDagger.js) | 관통 여부, 초당 중독 데미지(10 DPS), 중독 지속 시간(3s) |
| **빙결 보주** | [`js/weapons/basic/frostOrb.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/frostOrb.js) | 보주 크기, 이동 속도, 피격 시 감속률(50%) 및 감속 지속 시간 |
| **성수 / 성역** | [`js/weapons/basic/holyWater.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/holyWater.js)<br>[`js/weapons/basic/sanctuary.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/sanctuary.js) | 정화 장판 지속 시간, 성역 결계 반경 및 초당 도트 틱 주기 |

### 4. 6대 진화 무기 스펙 및 특수 효과 수정 (`js/weapons/evolutions/`)
| 수정 대상 | 파일 경로 | 주요 수정 가능 항목 |
| :--- | :--- | :--- |
| **베놈 블리자드** | [`js/weapons/evolutions/venomBlizzard.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/venomBlizzard.js) | 1단계 냉기 구체 데미지, 2단계 8방향 파편 폭쇄 데미지 & 독 중독 시간 |
| **테슬라 뇌전포** | [`js/weapons/evolutions/teslaShotgun.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/teslaShotgun.js) | 뇌전 탄환 수량(6발), 체인 라이트닝 전이 횟수, 낙뢰 피해량 |
| **천상의 성역** | [`js/weapons/evolutions/heavenlySanctuary.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/heavenlySanctuary.js) | 초대형 룬 결계 반경(135px), 초고속 틱 주기(0.38s), 빙결 확률(5%) |
| **멸망의 혜성** | [`js/weapons/evolutions/apocalypseComet.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/apocalypseComet.js) | 화염 혜성 유도 속도, 폭발 반경, 화염 연쇄 피해 |
| **학살자의 폭풍검** | [`js/weapons/evolutions/slayerBladeStorm.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/slayerBladeStorm.js) | 상시 회전 대검 개수(4개), 회전 반경, 회전 속도, 넉백 |
| **모닝스타 선풍** | [`js/weapons/evolutions/morningstarTempest.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/morningstarTempest.js) | 2연타 피해량, 적중 시 십자(4방향) 표창 폭쇄 투사체 수 |

### 5. 카드 옵션, 아이템 및 시스템 조절
| 수정 대상 | 파일 경로 | 주요 수정 가능 항목 |
| :--- | :--- | :--- |
| **레벨업 카드 데이터** | [`js/cards/data/weaponCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/weaponCards.js)<br>[`js/cards/data/passiveCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/passiveCards.js)<br>[`js/cards/data/evolutionCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/evolutionCards.js) | 무기/패시브/진화 카드 설명, 레벨별 수치 증가량, 카드 아이콘 |
| **드랍 아이템 & 보석** | [`js/items/gem.js`](file:///g:/내%20드라이브/vam/js/items/gem.js)<br>[`js/items/dropItems.js`](file:///g:/내%20드라이브/vam/js/items/dropItems.js) | 색상별 경험치 획득량, 자석 흡수 속도, 5종 드랍템 효과 수치 |
| **웨이브 & 스폰 주기** | [`js/waveManager.js`](file:///g:/내%20드라이브/vam/js/waveManager.js) | 20스테이지 단계별 시간(60초), 몹 스폰량, 돌발 이벤트 타이머 |
| **플레이어 기본 스탯** | [`js/player.js`](file:///g:/내%20드라이브/vam/js/player.js) | 기사/마도사/암살자 기본 체력, 속도, 공격력 보너스, 픽업 범위 |
| **명예의 전당 & UI** | [`js/ui/components/lobby.js`](file:///g:/내%20드라이브/vam/js/ui/components/lobby.js)<br>[`js/ui.js`](file:///g:/내%20드라이브/vam/js/ui.js) | 1~3위 순위 표시 레이아웃, 최근 클리어 소감 등록창, 키보드 조작 |
