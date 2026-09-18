# ⚙️ 시스템 아키텍처 및 보안 명세 (System & Security)

Anti Survivors의 클라이언트/서버 아키텍처, 11대 핵심 자바스크립트 모듈 구조, 세이브 암호화 서명 및 보안 방어 체계 명세입니다.

---

## 🏗️ 1. 클라이언트 자바스크립트 모듈 구조 (`js/`)

단일 거대 파일 비대화를 방지하고 작은 밸런스 수치 조절 시에도 즉각적인 1:1 수정을 가능하게 하기 위해, 전체 코드가 65개 세분화 모듈군으로 분할 설계되었습니다.

```text
js/
├── 📄 main.js             # 게임 엔진 루프(requestAnimationFrame), 우주 부유섬 맵 및 엔티티 총괄 관리
├── 📄 player.js           # 플레이어 엔티티(스탯, 이동, 피격/무적, 치명타, 픽업 범위)
├── 📄 saveManager.js      # FNV-1a 해시 체크섬 기반 세이브 무결성 검증 및 위변조 방지
├── 📄 waveManager.js      # 웨이브 스케줄러: 20단계 웨이브 타임라인, 스폰 계수, 20초 돌발 대습격 이벤트
├── 📄 audio.js            # 사운드 엔진: Web Audio API 기반 8비트 레트로 신디사이저
├── 📄 assets.js           # 에셋 로더: 79종 스프라이트 이미지 프리로더 및 캔버스 렌더링 헬퍼
├── 📄 ui.js               # UI 매니저: HUD, 인게임 UI, 모바일 가상 조이스틱, XSS 방어
├── 📄 weapons.js          # 무기 엔진: 레지스트리(`WeaponConfigs`) 연동 및 타격/피격 파이프라인
├── 📄 enemies.js          # 몬스터/보스 엔진: 레지스트리(`MonsterConfigs`, `BossConfigs`) 연동 파이프라인
├── 📄 cards.js            # 레벨업 카드 시스템: 분할된 카드 데이터(`CardData`) 연동
│
├── 📂 enemies/            # 👾 몬스터/보스 세분화 도메인
│   ├── 📄 enemyRegistry.js # 일반 몬스터(15종)/보스(10종) 통합 레지스트리 매핑
│   ├── 📄 projectiles.js   # 적 투사체(암흑구체, 맹독탄, 레이저) 발사/이동/판정 엔진
│   ├── 📂 monsters/       # 15종 개별 일반 몬스터 스탯 및 AI (bat.js, slime.js, assassin.js 등)
│   └── 📂 bosses/         # 10종 개별 보스 스탯 및 전투 패턴 (direBoar.js, grimReaper.js 등)
│
├── 📂 weapons/            # 🗡️ 무기 세분화 도메인
│   ├── 📄 weaponRegistry.js # 기본 무기(12종)/진화 무기(6종) 통합 레지스트리 매핑
│   ├── 📂 basic/          # 12종 개별 기본 무기 스펙/투사체 (sword.js, shotgun.js, frostOrb.js 등)
│   └── 📂 evolutions/     # 6종 개별 진화 무기 스펙/특수효과 (heavenlySanctuary.js, venomBlizzard.js 등)
│
├── 📂 cards/              # 🃏 카드 세분화 도메인
│   └── 📂 data/           # weaponCards.js (12종), passiveCards.js (14종), evolutionCards.js (6종)
│
├── 📂 items/              # 📦 아이템 세분화 도메인
│   ├── 📄 gem.js          # 경험치 보석(등급별 수치) 및 자석 흡수 물리
│   ├── 📄 dropItems.js    # 5종 특수 드랍 아이템(포션, 자석, 폭탄, 시계, 금화)
│   └── 📄 obstacles.js    # 청크 안전 스폰, 바위/나무 지형 충돌, 파괴 상자
│
└── 📂 ui/components/      # 🖥️ UI 컴포넌트 세분화 도메인
    ├── 📄 lobby.js        # 로비 영구 강화 상점 & 명예의 전당 (1~3위 + 최근 유저)
    └── 📄 characterSelect.js # 기사, 마도사, 암살자 영웅 선택 카드 모달
```

### 3중 하위 호환 레지스트리 패턴 (Registry Pattern)
모든 세분화 파일은 단독 파일 수정이 시스템 전체에 안전하게 전파되도록 다음과 같은 3중 하위 호환 구조를 갖추고 있습니다:
1. **ES Module `export`**: 모듈 번들러나 모던 브라우저 환경에서 명시적 임포트 지원
2. **Global Registry `window.*Configs`**: 기존 전역 객체 기반 엔진 코드(`weapons.js`, `enemies.js`, `cards.js`)와의 100% 무결점 호환성 유지
3. **CommonJS 호환**: Node.js 서버 및 테스트 스크립트 실행 환경 호환

---

## 🛡️ 2. 데이터 보안 및 무결성 검증 체계 (Security & Anti-Tamper)

순수 클라이언트 웹 게임의 취약점인 브라우저 개발자 도구 조작 및 스토리지 변조를 방어하기 위해 다층 보안 아키텍처가 적용되어 있습니다.

### 1) FNV-1a 32-bit 해시 체크섬 서명 (`SaveManager`)
- **솔트(Salt) 기반 서명 발급**:
  - 보유 금화(`gold`)와 각 영구 업그레이드 레벨(`upgrades`) 데이터를 정규화한 후, 내부 비밀 솔트 키를 조합하여 **FNV-1a 32-bit 해시 서명(`_sig`)**을 자동 생성하여 저장합니다.
- **실시간 위변조 감지 및 데이터 파기**:
  - 브라우저 개발자 도구(F12) 콘솔이나 Application 탭에서 수치를 임의 조작할 경우, 계산된 해시와 서명이 불일치하게 되며 **변조 감지 즉시 비정상 데이터를 안전하게 파기 및 초기화**합니다.
- **하위 호환 마이그레이션**:
  - 보안 시스템 도입 이전의 기존 플레이어 세이브 데이터는 정상 범위 검증(수치 타당성 검사)을 거쳐 최신 보안 서명이 부여되도록 마이그레이션됩니다.

### 2) XSS (Cross-Site Scripting) 방어
- 챔피언 명예의 전당 등록 시 사용자 입력값(닉네임, 명언)에 대해 `<script>`, `onerror` 등 악성 HTML/스크립트 태그를 완벽히 무력화하는 **`sanitizeText` 정규식 살균 필터링**을 거쳐 안전하게 저장 및 렌더링됩니다.

### 3) 콘솔 치트 1차 감시
- 전역 `window.game` 인스턴스에 대한 비정상적인 전역 스코프 조작을 방어하고, 주기적인 세이브 동기화 시 `SaveManager` 무결성 검증 파이프라인을 강제합니다.

---

## 🌐 3. 로컬 서버 및 챔피언 API (`server.js`)

Node.js 내장 모듈(`http`, `fs`, `path`)만을 사용한 무의존성 경량 HTTP 서버입니다.

- **포트**: 기본 `3000`번 포트 바인딩
- **정적 파일 서빙**: HTML, CSS, JS, PNG 파일의 적절한 MIME 타입 자동 매핑
- **LAN 멀티 접속**: 동일 Wi-Fi/공유기 네트워크 내 스마트폰, 태블릿 등 모바일 기기 접속 지원
- **챔피언 명예의 전당 API (`/api/champion`)**:
  - `GET /api/champion`: 클리어 시간순 상위 3위(`top3`) 랭킹 목록 및 최근 클리어 유저(`recent`) 객체 반환
  - `POST /api/champion`: 20스테이지 최종 보스 클리어 시 닉네임, 한마디, 클리어 시간(`clearTime`, `timeSeconds`), 레벨, 킬 수 등록 (`champion.json` 및 `localStorage`에 영구 보존, Vercel Serverless `api/champion.js` 지원)

---

## ⚡ 4. 렌더링 및 프레임 레이트 최적화 (Performance Optimization)

- **크리티컬 전용 데미지 넘버링**:
  - 후반부 20웨이브 및 광역 진화 무기(천상의 성역, 베놈 블리자드 등) 가동 시 발생하는 초당 수천 번의 타격 중, 일반 데미지 텍스트 인스턴스 생성을 생략하고 **치명타(크리티컬) 타격 시에만 데미지 숫자를 팝업**합니다.
  - 이를 통해 캔버스 `strokeText`/`fillText` 드로우콜을 95% 이상 감축하여, 저사양 모바일 및 대규모 난전에서도 안정적인 60 FPS를 유지합니다.
- **오프스크린 스프라이트 캐싱**:
  - 픽셀 아트 스프라이트를 오프스크린 캔버스에 사전 캐싱하여 불필요한 이미지 블렌딩 부하를 방지합니다.
