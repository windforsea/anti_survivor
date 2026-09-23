# ⚔️ Anti Survivors (안티 서바이버즈)

웹 기반 탑다운 뱀파이어 서바이벌라이크 액션 게임입니다.  
HTML5 Canvas, Pure JavaScript(ES6+), Web Audio API를 기반으로 외부 라이브러리/프레임워크 없이 초경량 네이티브로 구현되었습니다.

---

## 🎮 게임 특징 (Features)

- **4종의 개성 넘치는 영웅**: 기사(Knight), 마도사(Mage), 암살자(Assassin), 해골 성직자(Mortis - 자체 1회 부활 내장).
- **12종 기본 무기 & 6대 특수 합성 진화**: 무기 5레벨 달성 시 강력한 진화 무기로 합성 (천상의 성역, 베놈 블리자드, 테슬라 뇌전포 등).
- **25단계의 극한 웨이브 전장**: 18분 45초 동안 몰려드는 15종의 일반 몬스터와 11종의 특수 기믹 보스.
- **실시간 글로벌 명예의 전당**: Vercel Serverless API와 FNV-1a 해시 체크섬 보안이 적용된 랭킹 시스템.
- **모바일/태블릿 완벽 지원**: 반응형 캔버스 및 가상 조이스틱 터치 컨트롤 탑재.

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

## 🕹️ 조작 방법 (Controls)

| 플랫폼 | 조작키 | 설명 |
| :--- | :--- | :--- |
| **PC (키보드)** | `W`, `A`, `S`, `D` 또는 `방향키` | 8방향 캐릭터 이동 |
| **PC (키보드)** | `ESC` 또는 `P` | 게임 일시정지 / 재개 |
| **모바일 / 태블릿** | 화면 좌측 하단 가상 조이스틱 터치 | 360도 아날로그 이동 |
| **공통** | 마우스 클릭 / 화면 터치 | 카드 선택, UI 버튼 상호작용 |

---

## 📑 프로젝트 문서 가이드 허브 (Documentation Index)

Anti Survivors는 유지보수와 모듈 확장을 위해 상세 명세서를 분할 관리하고 있습니다.

| 문서명 | 주요 내용 | 링크 |
| :--- | :--- | :---: |
| 🤖 **AI 에이전트 지침서** | 저장소 표준 규칙, main.md 우선 참조, 워크플로우 | [AGENTS.md](AGENTS.md) |
| 🗺️ **AI 아키텍처 인덱스** | 전체 디렉토리 맵, 핵심 인터페이스 명세표, Fast Lookup 핀포인트 맵 | [main.md](main.md) |
| 👤 **캐릭터 및 성장 체계** | 4종 영웅 스탯, 14종 패시브 장신구, 9종 영구 강화 상점 | [docs/character.md](docs/character.md) |
| 🗡️ **무기 및 진화 체계** | 12종 기본 무기 스펙, 4대 강화 옵션, 6대 진화 무기 조합 공식 | [docs/weapons.md](docs/weapons.md) |
| 👾 **몬스터 및 보스 체계** | 15종 일반 몬스터 AI, 11종 보스 패턴(심연의 군주, 사신 강림) | [docs/enemies.md](docs/enemies.md) |
| 🌌 **스테이지 및 환경** | 25스테이지 타임라인(스폰 계수), 부유섬 지형 경계 규칙 | [docs/stages.md](docs/stages.md) |
| 📦 **필드 오브젝트 & 아이템** | 장애물(바위/상자), 5종 드랍템(폭탄 2/3 반경), 경험치 보석 | [docs/items.md](docs/items.md) |
| 🎨 **에셋 및 스프라이트** | 79종 픽셀아트 스프라이트 분류표 및 Node.js 빌더 가이드 | [docs/assets.md](docs/assets.md) |
| ⚙️ **시스템 및 보안 명세** | 클라이언트 11대 핵심 모듈 구조, FNV-1a 해시 체크섬 보안 | [docs/system.md](docs/system.md) |

---

***기본 지침 (AI Working Rules)***  
모든 AI는 기본 [AGENTS.md](AGENTS.md) 파일의 규칙에 따라 [main.md](main.md)를 확인하여 작업하도록 한다.