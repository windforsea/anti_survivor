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
| 👾 **몬스터 및 보스 체계** | 15종 일반 몬스터 스탯 및 고유 AI 기믹, 9종 보스 전투 패턴(사신/공허의 지네/혼돈의 절대신), 보스 보상 | [상세보기](docs/enemies.md) |
| 🌌 **스테이지 및 전장 환경** | 20스테이지 웨이브 타임라인(스폰 주기, 수량, hpScale), 20초 돌발 대습격 이벤트, 우주 부유섬 지형 규칙 | [상세보기](docs/stages.md) |
| 📦 **필드 오브젝트 및 아이템** | 비파괴/파괴 장애물(바위, 나무, 상자), 5종 특수 드랍 아이템(포션, 자석, 폭탄, 얼음, 금화), 경험치 보석 | [상세보기](docs/items.md) |
| 🎨 **에셋 및 스프라이트 명세** | 79종 다크 판타지 도트 스프라이트 분류표, 순수 Node.js 기반 `generate_assets.js` 에셋 빌더 가이드 | [상세보기](docs/assets.md) |
| ⚙️ **시스템 및 보안 명세** | 클라이언트 11대 핵심 JS 모듈 구조, FNV-1a 해시 체크섬 세이브 보안, XSS 방어, 로컬 서버 및 챔피언 API | [상세보기](docs/system.md) |

---

## 📁 디렉토리 및 파일 구조

```text
vam/
├── 📄 index.html              # 게임 캔버스, 모달 레이어(캐릭터 선택창/일시정지/레벨업 카드/결과창), 모바일 조이스틱 UI 엔트리
├── 📄 style.css               # 다크 판타지 네온 레트로 UI 스타일시트, 캐릭터 카드 및 반응형 레이아웃
├── 📄 server.js               # Node.js 경량 로컬 정적 파일 서빙 HTTP 서버 (포트 3000, LAN 접속 및 챔피언 API)
├── 📄 start_server.bat        # 원클릭 서버 실행 배치 파일 (Node 검사 -> 브라우저 자동 오픈 -> 서버 구동)
├── 📄 generate_assets.js      # 순수 Node.js로 79종 픽셀 아트 PNG 스프라이트를 즉시 생성하는 빌더 스크립트
├── 📄 champion.json           # 최종 승리 챔피언 기록(닉네임, 한마디, 날짜) 서버 저장소
├── 📄 readme.md               # 게임 개요, 실행법 및 문서 가이드 허브 (본 파일)
│
├── 📂 docs/                   # 세부 도메인별 프로젝트 명세 문서 (7개 파일)
│   ├── 📄 character.md        # 3종 캐릭터 선택, 조작법, 패시브(14종), 영구 강화(9종)
│   ├── 📄 weapons.md          # 12종 기본 무기, 6대 진화 무기 조합 및 강화 옵션
│   ├── 📄 enemies.md          # 15종 일반 몬스터, 9종 보스 기믹 및 패턴
│   ├── 📄 stages.md           # 20스테이지 웨이브 타임라인, 부유섬 전장 규칙
│   ├── 📄 items.md            # 필드 장애물, 5종 특수 드랍 아이템 및 보석
│   ├── 📄 assets.md           # 79종 스프라이트 에셋 명세표 및 에셋 빌더 가이드
│   └── 📄 system.md           # JS 모듈 아키텍처, FNV-1a 세이브 무결성 보안, 서버 API
│
├── 📂 js/                     # 게임 클라이언트 핵심 자바스크립트 모듈 (11개 파일)
│   ├── 📄 main.js             # Game 엔진: 3종 영웅 선택 런, requestAnimationFrame 렌더링/루프, 우주 부유섬 맵
│   ├── 📄 player.js           # Player: 3종 영웅 스탯/스프라이트, 흡혈/방벽 패시브, 이동, 피격 판정
│   ├── 📄 saveManager.js      # SaveManager: FNV-1a 해시 체크섬 기반 세이브 무결성 검증, 데이터 마이그레이션
│   ├── 📄 weapons.js          # WeaponManager: 12종 기본 무기 + 6종 진화 무기(베놈 블리자드) 피격 판정 로직
│   ├── 📄 enemies.js          # Enemy, BossEnemy: 15종 일반 몹 AI & 9종 보스 기믹(공허의 지네, 혼돈의 절대신)
│   ├── 📄 waveManager.js      # WaveManager: 20단계 웨이브, 몬스터 스폰 스케줄러, 돌발 이벤트
│   ├── 📄 obstacles.js        # ObstacleManager, Obstacle: 무한 청크 기반 지형 충돌 및 안전 스폰
│   ├── 📄 cards.js            # CardManager: 레벨업 시 12종 무기/14종 패시브/6종 진화 카드 생성
│   ├── 📄 ui.js               # UIManager: 캐릭터 선택 모달, 체력/경험치 HUD, 조이스틱, XSS 방어
│   ├── 📄 audio.js            # SoundEngine: Web Audio API 기반 8비트 레트로 신디사이저 + Safe Proxy
│   └── 📄 assets.js           # AssetManager: 79종 스프라이트 이미지 프리로더 및 캔버스 렌더링 헬퍼
│
└── 📂 assets/                 # 게임 시각 리소스
    └── 📂 sprites/            # 79종 다크 판타지 도트 스프라이트 PNG (캐릭터, 몬스터, 보스, 아이콘, 이펙트)
```
