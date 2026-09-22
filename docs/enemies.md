# 👾 몬스터 및 보스 체계 (Enemies & Bosses)

Anti Survivors의 15종 일반 몬스터 및 10종 보스의 상세 스탯, 고유 AI, 전투 기믹 명세입니다.

---

## 🧟 1. 일반 몬스터 (15종)

일반 몬스터는 **지상형**과 **공중형**으로 명확히 구분되며, 우주 부유섬 맵 경계 규칙 및 장애물 상호작용이 다릅니다.
- **공중형 몬스터 & 비행형 보스 (4, 6, 12, 15, 18, 20, 99 Stg)**: 지면 없이 우주 상공에서도 자유롭게 스폰되며, **바위/나무/상자 등 모든 필드 장애물을 무시하고 관통 비행**하여 직선 추격합니다.
- **지상형 몬스터**: 부유섬 육지 지면에서만 스폰되며, 부유섬 경계(-1580 ~ 1580)를 벗어날 수 없고 필드 장애물에 충돌하여 가로막힙니다.
- **원거리 몬스터 밸런스 조정**: 원거리 투사체를 발사하는 몬스터(`cultist`, `darkMage`)는 후반부 난이도 급상승 완화를 위해 **스폰 생성량이 기존 대비 2/3 (66.7%)로 감소** 적용됩니다.

| 몬스터명 | 키값 | 구분 | 개별 모듈 파일 | 기본 HP | 이동 속도 | 접촉 피해 | 기본 EXP | 넉백 저항 | 고유 AI 및 특색 기믹 |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **박쥐** | `bat` | **공중** | [`bat.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/bat.js) | 12 | 170 | 6 | 2 | 0% | 우주 공간에서도 스폰. 사인파(Sine-wave) 파동 비행으로 요격 회피 |
| **슬라임** | `slime` | **지상** | [`slime.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/slime.js) | 18 | 85 | 8 | 3 | 0% | 지면 스폰. 처치 시 아기 슬라임 2마리로 즉시 분열 |
| **아기 슬라임** | `miniSlime` | **지상** | [`miniSlime.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/miniSlime.js) | 4 | 65 | 4 | 1 | 0% | 슬라임 분열체. 1방에 처치 가능한 소형 몬스터 |
| **좀비** | `zombie` | **지상** | [`zombie.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/zombie.js) | 42 | 65 | 12 | 3 | 45% | 높은 내구도와 45% 넉백 저항력으로 묵직하게 전진 |
| **해골** | `skeleton` | **지상** | [`skeleton.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/skeleton.js) | 34 | 105 | 10 | 4 | 0% | 처치 시 2초간 뼈무덤 상태 후 체력 35%의 '붉은 해골'로 1회 부활 |
| **고블린** | `goblin` | **지상** | [`goblin.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/goblin.js) | 42 | 145 | 9 | 5 | 0% | 플레이어 220px 근접 시 측면으로 우회 기동(Flanking) |
| **유령** | `ghost` | **공중** | [`ghost.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/ghost.js) | 60 | 115 | 11 | 6 | 0% | 우주 비행. 3.5초 주기마다 0.6초간 반투명 영체화(무적 & 충돌 통과) |
| **가고일** | `gargoyle` | **공중** | [`gargoyle.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/gargoyle.js) | 130 | 75 | 16 | 7 | 0% | 우주 비행. 높은 생명력을 지닌 중형 공중 비행수 |
| **흑마술사** | `cultist` | **지상** | [`cultist.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/cultist.js) | 100 | 95 | 14 | 9 | 0% | 310px 거리 유지 카이팅 및 5.2초 주기 유도 암흑 투사체 발사 |
| **암살자** | `assassin` | **지상** | [`assassin.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/assassin.js) | 60 | 155 | 12 | 11 | 0% | 210px 근접 시 0.35초간 속도 280으로 그림자 급습 돌진 (쿨타임 4.5s) |
| **골렘** | `golem` | **지상** | [`golem.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/golem.js) | 300 | 50 | 25 | 25 | 85% | 85% 넉백 저항. 4.5초 주기 지면 발구르기(110px)로 1.2초간 35% 감속 |
| **타락한 마도사** | `darkMage` | **공중** | [`darkMage.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/darkMage.js) | 140 | 95 | 16 | 12 | 0% | 우주 비행. 320px 거리 유지 카이팅 및 유도형 암흑 구체 발사 |
| **핏빛 사냥개** | `bloodHound` | **지상** | [`bloodHound.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/bloodHound.js) | 110 | 210 | 18 | 10 | 35% | 플레이어 기본 이속(180)보다 빠른 초고속 추격형 맹수 |
| **망령 군단** | `wraithSwarm` | **공중** | [`wraithSwarm.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/wraithSwarm.js) | 55 | 145 | 12 | 5 | 0% | 우주 비행. 1회 스폰 시 12마리가 원형으로 사방을 포위하며 습격 |
| **심연의 거인** | `abyssTitan` | **지상** | [`abyssTitan.js`](file:///g:/내%20드라이브/vam/js/enemies/monsters/abyssTitan.js) | 450 | 55 | 32 | 28 | 70% | 70% 넉백 저항. 강력한 체력과 공격력으로 길목을 막아서는 거대 탱커 |

---

## 👑 2. 특수 기믹 보스 (10종)

보스는 짝수 및 주요 스테이지에 등장하며, 압도적인 체력과 고유한 공격 패턴을 가지고 있습니다.

### 보스 전투 공통 규칙
- **보스 처치 보상**: 처치 시 **50G 대량 금화** 지급 + **1회 무료 보너스 업그레이드 카드 선택창** 즉시 오픈
- **폭탄(TNT) 저항**: 필드 폭탄 아이템 습득 시 보스는 즉사하지 않고 **최대 HP의 10% 또는 최대 250 데미지**로 피격 상한 제한

### 보스 명세표

| 스테이지 | 보스명 | 개별 모듈 파일 | HP | 속도 | 접촉 피해 | EXP | 넉백 면역 | 전투 기믹 및 고유 공격 패턴 |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **2 Stg** | **돌진 맹수 (`Dire Boar`)** | [`direBoar.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/direBoar.js) | 1,600 | 100 | 32 | 150 | X | 4초 주기로 플레이어 위치 조준 후 순간 가속 붉은 궤적 돌진 |
| **4 Stg** | **그림자 마법사 (`Void Sorcerer`)** | [`voidSorcerer.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/voidSorcerer.js) | 3,400 | 80 | 38 | 250 | X | 4.5초 주기 무작위 위치 순간이동 및 주기적 암흑 투사체 사격 |
| **6 Stg** | **혼돈의 눈 (`Chaos Eye`)** | [`chaosEye.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/chaosEye.js) | 5,800 | 60 | 42 | 400 | X | 중심에서 나선형(Spiral)으로 끊임없이 붉은 탄막 방출 |
| **8 Stg** | **불멸의 골렘 (`Ironclad Colossus`)** | [`ironcladColossus.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/ironcladColossus.js) | 9,800 | 70 | 52 | 600 | **면역** | 100% 넉백 무시. 4.5초 주기 대지 발구르기 지진파 광역 공격 |
| **10 Stg** | **파멸의 군주 (`Lord of Doom`)** | [`lordOfDoom.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/lordOfDoom.js) | 18,000 | 110 | 60 | 1,000 | **면역** | 넉백 면역. 순간이동 + 조준 가속 돌진 + 전방위 8방향 탄막 복합 패턴 |
| **12 Stg** | **심연의 리치 (`Abyss Lich`)** | [`abyssLich.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/abyssLich.js) | 26,000 | 95 | 68 | 1,600 | **면역** | 넉백 면역. 3갈래 한기 탄환 + 4초 주기 순간이동 직후 10방향 프로스트 노바 방출 |
| **15 Stg** | **종말의 사신 (`Grim Reaper`)** | [`grimReaper.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/grimReaper.js) | 52,000 | 135 | 88 | 3,500 | **면역** | **중간 관문 보스**: 4방향 나선 암흑 참격 탄막 + 4.2초 주기 순간이동/14방향 절망 폭발 + 4초 주기 초고속 낫 돌진(속도 460) |
| **18 Stg** | **공허의 지네 (`Void Wyrm`)** | [`voidWyrm.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/voidWyrm.js) | 75,000 | 145 | 96 | 5,000 | **면역** | **심연 관문 보스**: 지그재그 위빙 기동 + 3.2초 주기 5갈래 부채꼴 맹독 탄환 일제 사격 |
| **20 Stg** | **혼돈의 절대신 (`Chaos Overlord`)** | [`chaosOverlord.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/chaosOverlord.js) | 68,000 | 125 | 110 | 8,000 | **면역** | **진 최종 보스**: 격파 시 대망의 게임 승리(VICTORY)! 16방향 혼돈 탄막 나선 방출 + 4초 주기 텔레포트 및 3연속 폭발 파동 + 전방위 레이저 빔 소환 |
| **엔드게임** | **진 붉은 사신 (`The Red Death`)** | [`redDeath.js`](file:///g:/내%20드라이브/vam/js/enemies/bosses/redDeath.js) | 666,666 | 360 | 99,999 | 66,666 | **면역** | **엔드게임 재앙 보스**: 20스테이지 시간 만료 시 강림. 360 초고속 추격, 1방 즉사, 장애물 무시 관통 비행, 60초마다 추가 증원 |
