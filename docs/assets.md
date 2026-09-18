# 🎨 에셋 및 스프라이트 명세 (Assets & Sprites)

Anti Survivors의 70종 다크 판타지 도트 픽셀 아트 스프라이트 리소스 및 생성기(`generate_assets.js`) 가이드입니다.

---

## 📁 에셋 디렉토리 구조

모든 스프라이트는 `assets/sprites/` 디렉토리에 저장되어 있으며, 게임 기동 시 `js/assets.js`의 `AssetManager`를 통해 일괄 프리로드됩니다.

```text
assets/sprites/
├── 👤 플레이어 (1종)
├── 👾 일반 몬스터 (15종) + 분열체 (1종)
├── 👑 보스 몬스터 (7종)
├── 🎴 무기/패시브 카드 아이콘 (33종)
├── 📦 필드 아이템 & 장애물 (6종)
├── 💥 공격 이펙트 & 투사체 (6종)
└── 🧱 배경 지형 타일 (1종)
총 70종 스프라이트
```

---

## 📑 70종 스프라이트 분류 명세표

### 1. 플레이어 & 몬스터 스프라이트 (23종)

| 키값 / 파일명 | 용도 | 설명 |
| :--- | :--- | :--- |
| `player.png` | 플레이어 캐릭터 | 망토를 두른 다크 판타지 용사 |
| `bat.png` | 박쥐 | 보랏빛 날개를 펄럭이는 공중 박쥐 |
| `slime.png` | 슬라임 | 녹색 반투명 젤리형 지상 몬스터 |
| `miniSlime.png` | 아기 슬라임 | 슬라임 처치 시 2마리로 분열되는 소형체 |
| `zombie.png` | 좀비 | 썩어가는 피부의 느리고 육중한 언데드 |
| `skeleton.png` | 해골 병사 | 백골의 검사 (사망 시 붉은 해골로 1회 부활) |
| `goblin.png` | 고블린 | 날렵하게 우회 기동하는 녹색 소악마 |
| `ghost.png` | 유령 | 반투명 영체화 무적 기믹의 부유 망령 |
| `gargoyle.png` | 가고일 | 단단한 돌날개를 지닌 비행 석상 |
| `cultist.png` | 흑마술사 | 원거리 유도 암흑구를 시전하는 교단 사제 |
| `assassin.png` | 암살자 | 그림자 속에서 고속 돌진하는 암살 요원 |
| `golem.png` | 골렘 | 지면을 발구르며 감속을 거는 바위 거인 |
| `darkMage.png` | 타락한 마도사 | 우주를 비행하며 카이팅하는 고위 마도사 |
| `bloodHound.png` | 핏빛 사냥개 | 플레이어보다 빠른 광포한 추격 맹수 |
| `wraithSwarm.png` | 망령 군단 | 12마리가 군집하여 사방을 포위하는 원혼 |
| `abyssTitan.png` | 심연의 거인 | 최상위 탱킹력과 파괴력을 지닌 심연 거인 |
| `boss_boar.png` | 돌진 맹수 (2 Stg) | 붉은 궤적으로 가속 돌진하는 돌연변이 멧돼지 |
| `boss_void.png` | 그림자 마법사 (4 Stg) | 순간이동 및 암흑탄막을 구사하는 허공술사 |
| `boss_eye.png` | 혼돈의 눈 (6 Stg) | 나선형 핏빛 탄막을 난사하는 거대 안구 |
| `boss_colossus.png` | 불멸의 골렘 (8 Stg) | 넉백 면역 및 대지진을 일으키는 거대 골렘 |
| `boss_doom.png` | 파멸의 군주 (10 Stg) | 텔레포트, 돌진, 8방향 탄막을 복합 구사하는 군주 |
| `boss_lich.png` | 심연의 리치 (12 Stg) | 빙결 탄환과 프로스트 노바를 발산하는 언데드 군주 |
| `boss_reaper.png` | 종말의 사신 (15 Stg) | **최종 보스**: 암흑 나선검기, 절망 폭발, 낫 돌진 |

---

### 2. 카드 및 인벤토리 아이콘 스프라이트 (33종)

#### [기본 무기 아이콘]
- `icon_sword.png`: 철검
- `icon_axe.png`: 도끼
- `icon_whip.png`: 채찍
- `icon_shuriken.png`: 표창
- `icon_missile.png`: 마법 화살
- `icon_shotgun.png`: 산탄 총포
- `icon_holywater.png`: 성수
- `icon_sanctuary.png`: 성역
- `icon_lightning.png`: 번개 반지
- `icon_firewand.png`: 화염 지팡이
- `icon_dagger.png`: 투척 단검 (예비/특수)
- `icon_acid.png`: 부식성 산액 (예비/특수)
- `icon_holyshotgun.png`: 성스러운 산탄 (예비/특수)

#### [진화 무기 아이콘]
- `icon_heavenlysanctuary.png`: 천상의 성역 (성역 + 성수)
- `icon_morningstartempest.png`: 모닝스타 선풍 (채찍 + 표창)
- `icon_apocalypsecomet.png`: 멸망의 혜성 (화염 지팡이 + 마법 화살)
- `icon_slayerbladestorm.png`: 학살자의 폭풍검 (철검 + 도끼)
- `icon_teslashotgun.png`: 테슬라 뇌전포 (산탄 총포 + 번개 반지)
- `icon_arcanesanctuary.png`: 비전 성역 (파생/바리에이션)
- `icon_plasmatempest.png`: 플라즈마 선풍 (파생/바리에이션)

#### [패시브 및 스탯 아이콘]
- `icon_armor.png`: 철벽 갑옷 (방어력/피해경감)
- `icon_speed.png`: 바람의 장화 (이동 속도)
- `icon_atk.png`: 피의 계약 (공격력)
- `icon_regen.png`: 재생의 반지 (체력 재생)
- `icon_hp.png`: 거인의 심장 (최대 체력)
- `icon_global_speed.png`: 황혼의 시계 (쿨타임 감소)
- `icon_heal.png`: 체력 회복
- `icon_proj_speed.png`: 질풍의 깃털 (투사체 비행 속도)
- `icon_proj_count.png`: 복제의 오브 (투사체/연속공격 수량)
- `icon_clover.png`: 행운의 클로버 (치명타/드랍률)
- `icon_crown.png`: 지혜의 왕관 (경험치 보너스)

---

### 3. 필드 아이템 & 장애물 스프라이트 (6종)

| 키값 / 파일명 | 구분 | 설명 |
| :--- | :---: | :--- |
| `item_magnet.png` | 특수 아이템 | 전 필드 보석 및 금화를 끌어모으는 자석 |
| `item_bomb.png` | 특수 아이템 | 화면 전체 적을 일소하는 폭탄 |
| `item_freeze.png` | 특수 아이템 | 전장 전체 적을 3초간 얼리는 빙결의 얼음 |
| `obstacle_rock.png` | 비파괴 장애물 | 단단한 암석 지형물 |
| `obstacle_tree.png` | 비파괴 장애물 | 고대 마법 고목 |
| `obstacle_crate.png` | 파괴 장애물 | 파괴 시 보석/금화/아이템이 나오는 나무 상자 |

---

### 4. 공격 이펙트, 투사체 및 지형 타일 (8종)

| 키값 / 파일명 | 구분 | 설명 |
| :--- | :---: | :--- |
| `anim_sword.png` | 참격 이펙트 | 검 휘두르기 궤적 |
| `anim_axe.png` | 회전 이펙트 | 도끼 360도 회전 베기 궤적 |
| `anim_whip.png` | 채찍 이펙트 | 채찍/모닝스타 타격 궤적 |
| `anim_bladewhip.png` | 합성 이펙트 | 진화 채찍 칼날 궤적 |
| `anim_dagger.png` | 찌르기 이펙트 | 단검 찌르기 모션 |
| `anim_muzzle.png` | 총구 화염 | 산탄총 발사 시 총구 머즐플래시 |
| `proj_shuriken.png` | 투사체 | 회전하며 날아가는 수리검 |
| `proj_dagger.png` | 투사체 | 투척 단검 투사체 |
| `proj_holypellet.png` | 투사체 | 성스러운 산탄 알갱이 |
| `tile_floor.png` | 배경 타일 | 우주 부유섬의 고대 석조 바닥 텍스처 |

---

## 🛠️ 순수 Node.js 픽셀 아트 생성 빌더 (`generate_assets.js`)

본 프로젝트는 외부 그래픽 툴이나 무거운 빌드 체인 없이, **순수 Node.js 내장 모듈(`fs`, `zlib`)만으로 70종 픽셀 아트 PNG 바이너리를 즉시 생성**하는 독자적인 렌더러 스크립트를 내장하고 있습니다.

### 에셋 재생성 방법
스프라이트를 새로 생성하거나 픽셀 데이터를 초기화해야 할 경우 터미널에서 다음 명령어를 실행합니다:
```bash
node generate_assets.js
```
- 실행 시 `assets/sprites/` 디렉토리가 생성되고 70종의 PNG 파일이 0.5초 이내에 자동 빌드됩니다.
- PNG 청크(IHDR, IDAT, IEND)와 Deflate 압축을 표준 규격대로 직접 조립하므로 100% 브라우저 호환성을 가집니다.
