# 🎨 에셋 및 스프라이트 명세 (Assets & Sprites)

Anti Survivors의 119종 다크 판타지 도트 픽셀 아트 스프라이트 리소스 및 생성기(`generate_assets.js`) 가이드입니다.

---

## 📁 에셋 디렉토리 구조

모든 스프라이트는 `assets/sprites/` 디렉토리에 저장되어 있으며, 게임 기동 시 `js/assets.js`의 `AssetManager`를 통해 일괄 프리로드됩니다.

```text
assets/sprites/
├── 👤 플레이어 (6종)
├── 👾 일반 몬스터 (30종: 월드 1 15종 + 월드 2 15종) + 분열체 (1종)
├── 👑 보스 몬스터 (13종: 월드 1 9종 + 월드 2 4종)
├── 🎴 무기/패시브 카드 아이콘 (54종)
├── 📦 필드 아이템 & 장애물 (6종)
├── 💥 공격 이펙트 & 투사체 (8종)
└── 🧱 배경 지형 타일 (1종)
총 119종 스프라이트
```

---

## 📑 119종 스프라이트 분류 명세표

### 1. 플레이어 & 몬스터 스프라이트 (27종)

| 키값 / 파일명 | 용도 | 설명 |
| :--- | :--- | :--- |
| `player.png` | 플레이어: 방랑 기사 | 망토와 강철 갑옷을 두른 균형형 전사 |
| `player_mage.png` | 플레이어: 화염 마도사 | 진홍빛 로브와 마법봉을 든 원소 마도학자 |
| `player_assassin.png` | 플레이어: 그림자 암살자 | 흑단 가면에 쌍단검을 든 고속 암살자 |
| `player_cleric.png` | 플레이어: 해골 성직자 | 보랏빛 사제 로브와 불사의 해골 성직자 |
| `player_sylph.png` | 플레이어: 바람의 궁수 | 비취빛 망토와 초고속 바람 활을 든 명사수 |
| `player_malakar.png` | 플레이어: 심연의 워록 | 암흑 오라와 공전하는 보주를 다루는 흑마법사 |
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
| `boss_reaper.png` | 종말의 사신 (15 Stg) | **중간 관문 보스**: 암흑 나선검기, 절망 폭발, 낫 돌진 |
| `boss_wyrm.png` | 공허의 지네 (18 Stg) | **심연 보스**: 지그재그 기동과 5방향 맹독 탄환 |
| `boss_overlord.png` | 혼돈의 절대신 (20 Stg) | **진 최종 보스**: 16방향 나선 탄막, 레이저, 순간폭발 |
| `plankton.png` | 발광 플랑크톤 (W2) | 발광 코어와 미세 촉모를 지닌 부유 유기체 |
| `jellyfish.png` | 청록 해파리 (W2) | 투명 돔형 갓과 발광 청록 촉수를 지닌 수중 마물 |
| `hermitCrab.png` | 뿔소라게 (W2) | 나선형 껍질과 날카로운 집게발을 가진 해저 게 |
| `flyingFish.png` | 심해 날치 (W2) | 에메랄드 유선형 몸체와 펼쳐진 날개 지느러미 |
| `seaLobster.png` | 갑주 가재 (W2) | 진홍빛 중장갑 갑각과 대형 집게발을 지닌 갑각수 |
| `stingray.png` | 전기 가오리 (W2) | 황금빛 전기 날개와 방전 꼬리침을 구사하는 가오리 |
| `coralGolem.png` | 산호 골렘 (W2) | 청록 암반에 붉은 산호가 돋아난 해저 거수 |
| `seaLeech.png` | 심해 거머리 (W2) | 핏빛 주름진 몸체와 날카로운 흡혈 구기 |
| `anglerFish.png` | 심해 아귀 (W2) | 거대한 이빨 턱과 이마의 발광 유혹등을 지닌 포식자 |
| `ghostJelly.png` | 유령 해파리 (W2) | 신비로운 연청빛 영체 갓과 하늘거리는 촉수 |
| `deepShark.png` | 메갈로돈 상어 (W2) | 위압적인 등지느러미와 날카로운 이빨의 심해 상어 |
| `poisonRay.png` | 독침 가오리 (W2) | 보랏빛 맹독을 두른 날개와 가시 침꼬리 |
| `shadowEel.png` | 심연 그림자장어 (W2) | 굽이치는 짙은 남색 몸체와 번뜩이는 황금 눈 |
| `voidSeaSerpent.png` | 공허 바다뱀 (W2) | 공허 에너지를 두른 거대한 해저 바다뱀 머리 |
| `trilobite.png` | 고대 삼엽충 (W2) | 마디마디 층을 이룬 단단한 화석 갑각과 황금 안광 |
| `boss_kraken.png` | 심해 크라켄 (W2 5 Stg) | 거대한 문어 머리와 소용돌이치는 발광 촉수 군단 |
| `boss_titancrab.png` | 타이탄 크랩 (W2 10 Stg) | 등딱지에 산호 암초를 얹은 거대 메가 집게 게 |
| `boss_leviathan.png` | 원시 레비아탄 (W2 15 Stg) | 청록빛 지느러미와 서리 뿔을 지닌 전설의 심해 고룡 |
| `boss_dagon.png` | 심연의 고대신 다곤 (W2 20 Stg) | 에메랄드 왕관과 삼지창을 든 심해의 절대 지배자 |

---

### 2. 카드 및 인벤토리 아이콘 스프라이트 (54종)

#### [기본 무기 아이콘 17종]
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
- `icon_poisondagger.png`: 맹독 비수
- `icon_frostorb.png`: 빙결 보주
- `icon_windbow.png`: 바람 활
- `icon_shadoworb.png`: 어둠의 보주
- `icon_flamepillar.png`: 화염 기둥 (신규)
- `icon_chakram.png`: 차크람 (신규)
- `icon_holycross.png`: 십자가 (신규)

#### [진화 무기 아이콘 17종]
- `icon_heavenlysanctuary.png`: 생츄어리 (성역 + 성수)
- `icon_morningstartempest.png`: 모닝스타 (채찍 + 표창)
- `icon_apocalypsecomet.png`: 메테오 (불 지팡이 + 마법 화살)
- `icon_slayerbladestorm.png`: 폭풍검 (철검 + 도끼)
- `icon_teslashotgun.png`: 뇌전포 (산탄총 + 번개 반지)
- `icon_venomblizzard.png`: 블리자드 (독비수 + 빙결 보주)
- `icon_thunderblade.png`: 벼락검 (철검 + 번개 반지)
- `icon_fireaxe.png`: 화염도끼 (도끼 + 불 지팡이)
- `icon_frostwhip.png`: 얼음채찍 (채찍 + 빙결 보주)
- `icon_scattershuriken.png`: 산탄표창 (표창 + 산탄총)
- `icon_holyarrow.png`: 신성화살 (마법 화살 + 성수)
- `icon_plague.png`: 역병 (독비수 + 성역)
- `icon_cyclonebow.png`: 태풍의 눈 (바람 활 + 표창)
- `icon_eclipsespiral.png`: 황혼의 나선 (어둠의 보주 + 마법 화살)
- `icon_infernocataclysm.png`: 인페르노 (화염 기둥 + 불 지팡이, 신규)
- `icon_shadowvortex.png`: 섀도우 차크람 (차크람 + 독비수, 신규)
- `icon_divinejudgement.png`: 저지먼트 (십자가 + 성수, 신규)

#### [패시브 및 스탯 아이콘]
- `icon_armor.png`: 철벽 갑옷 (방어력/피해경감)
- `icon_speed.png`: 장화 (이동 속도)
- `icon_atk.png`: 피의 계약 (공격력)
- `icon_regen.png`: 재생의 반지 (체력 재생)
- `icon_hp.png`: 거인의 심장 (최대 체력)
- `icon_global_speed.png`: 황혼의 시계 (쿨타임 감소)
- `icon_heal.png`: 체력 회복
- `icon_proj_speed.png`: 질풍의 깃털 (투사체 비행 속도)
- `icon_proj_count.png`: 복제의 오브 (투사체/연속공격 수량)
- `icon_clover.png`: 행운의 클로버 (치명타/드랍률)
- `icon_crown.png`: 지혜의 왕관 (경험치 보너스)
- `icon_vampire.png`: 흡혈의 송곳니 (흡혈 패시브)
- `icon_shield.png`: 빛의 성벽 (방벽 보호막 패시브)
- `icon_crit_dmg.png`: 사신의 낫 (치명타 피해 증폭 패시브)
- `icon_thorns.png`: 가시 갑옷 (반사 피해 패시브)

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

본 프로젝트는 외부 그래픽 툴이나 무거운 빌드 체인 없이, **순수 Node.js 내장 모듈(`fs`, `zlib`)만으로 119종 픽셀 아트 PNG 바이너리를 즉시 생성**하는 독자적인 렌더러 스크립트를 내장하고 있습니다.

### 에셋 재생성 방법
스프라이트를 새로 생성하거나 픽셀 데이터를 초기화해야 할 경우 터미널에서 다음 명령어를 실행합니다:
```bash
node generate_assets.js
```
- 실행 시 `assets/sprites/` 디렉토리에 119종의 PNG 파일이 0.5초 이내에 자동 빌드됩니다.
- PNG 청크(IHDR, IDAT, IEND)와 Deflate 압축을 표준 규격대로 직접 조립하므로 100% 브라우저 호환성을 가집니다.
