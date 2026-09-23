# 🗡️ 무기 및 진화 체계 (Weapons & Evolutions)

Anti Survivors의 12종 기본 무기 스펙, 4대 강화 카드 옵션, 6대 특수 진화 무기 조합 공식 및 공격 매커니즘 명세입니다.

---

## ⚔️ 1. 기본 무기 (12종)

- **장착 한도**: 12종 중 최대 **6개** 동시 장착 가능
- **최대 강화 레벨**: 각 무기당 **5레벨 (MAX)**

| 무기명 | 타입 | 개별 모듈 파일 | 기본 사거리/범위 | 기본 피해량 | 기본 쿨다운 | 기본 수량 | 특징 및 공격 매커니즘 |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **철검 (`sword`)** | **근접** | [`sword.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/sword.js) | 80px | 20 | 0.45s | 1타 | 가장 가까운 적을 자동 조준하여 날렵하게 베어냄. 강화 시 연속 공격 횟수 증가 |
| **도끼 (`axe`)** | **근접** | [`axe.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/axe.js) | 95px 반경 | 55 | 1.10s | 1타 | 플레이어 주변 360도를 크게 원형 회전 베기하며 강력한 넉백 부여. 강화 시 연속 공격 증가 |
| **채찍 (`whip`)** | **근접** | [`whip.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/whip.js) | 165px (112° 호) | 44 | 0.95s | 1타 | 가장 가까운 적을 자동 조준해 전방/후방 교차 타격하며 모닝스타 철퇴로 강타 |
| **표창 (`shuriken`)** | **원거리** | [`shuriken.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/shuriken.js) | 320px | 24 | 0.42s | 1발 | 가장 가까운 적을 향해 자전 회전하며 관통 비행하는 닌자 표창 투척 |
| **마법 화살 (`magicMissile`)** | **원거리** | [`magicMissile.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/magicMissile.js) | 700px (화면 전체) | 25 | 0.55s | 1발 | 가장 가까운 적을 고속 유도 추적하는 마법 탄환 발사 |
| **산탄 총포 (`shotgun`)** | **원거리** | [`shotgun.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/shotgun.js) | 280px | 32 | 1.30s | 3발 | 가장 가까운 적 방향 부채꼴로 산탄 일제 사격 (자동 조준) |
| **성수 (`holyWater`)** | **도트** | [`holyWater.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/holyWater.js) | 60px 장판 반경 | 14 (틱당) | 2.00s | 1개 | 무작위 적 발밑에 지속 데미지를 입히는 성스러운 정화 장판 투척 (0.8초 틱 주기, 넉백 없음) |
| **성역 (`sanctuary`)** | **도트** | [`sanctuary.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/sanctuary.js) | 90px 반경 | 28 (초당) | 1.00s | 결계 | 플레이어 중심 360도 원형 룬 결계로 상시 지속 피해 (0.8초 틱 주기, 넉백 삭제 0) |
| **번개 반지 (`lightningRing`)** | **원거리** | [`lightningRing.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/lightningRing.js) | 48px 스플래시 | 42 | 1.10s | 1발 | 무작위 적 머리 위로 하늘에서 벼락을 내리꽂아 지면 폭발 피해 부여 |
| **화염 지팡이 (`fireWand`)** | **원거리** | [`fireWand.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/fireWand.js) | 380px (폭발 65px) | 36 | 1.00s | 1발 | 적을 향해 화염구를 발사하며 착탄 시 폭발하여 광역 화염 피해 부여 |
| **맹독 비수 (`poisonDagger`)** | **원거리/도트** | [`poisonDagger.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/poisonDagger.js) | 350px (관통) | 18 | 0.48s | 1발 | 가장 가까운 적을 향해 독단검을 던져(자동 조준) 관통 및 3초간 중독(초당 10 DPS) 부여 |
| **빙결 보주 (`frostOrb`)** | **원거리/군중제어** | [`frostOrb.js`](file:///g:/내%20드라이브/vam/js/weapons/basic/frostOrb.js) | 400px (냉기 파동 반경 51px) | 30 | 1.20s | 1발 | 서리 보주가 서서히 비행하며 경로상의 적에게 지속 냉기 피해(반경 51px) 및 이동 속도 감속 부여 |

---

## 📈 2. 무기 레벨업 강화 카드 4대 핵심 옵션

무기 레벨업 시 4대 옵션 카드 중 하나를 선택하여 무기를 강화할 수 있습니다.  
(카드 데이터 수정: [`js/cards/data/weaponCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/weaponCards.js), [`passiveCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/passiveCards.js), [`evolutionCards.js`](file:///g:/내%20드라이브/vam/js/cards/data/evolutionCards.js))

- **쿨타임 감소**: 무기 쿨타임 **-15%** (성역의 경우 도트 틱 주기 가속)
- **공격력 증가**: 무기 기본 피해량 **+30%**
- **범위 증가**: 공격 판정 및 투사체/장판 크기 **+20%**
- **투사체 / 연속공격**: 투사체 **+1개** (산탄총 계열은 투사체 증가 단위당 +2발씩) 또는 연속 공격 **+1회** 추가 (성역 계열 제외)

---

## 🔮 3. 6대 특수 진화 무기 (Evolutions)

두 종류의 무기를 조합하여 강력한 상위 무기로 합성 진화시킬 수 있습니다.

### 진화 및 운용 규칙
1. **진화 조건**: 두 재료 무기 모두 **5레벨 MAX** 달성 시 레벨업 선택지에 진화 카드가 확률 출현합니다.
2. **슬롯 반환**: 진화 시 두 재료 무기가 소모되고 **1레벨 진화 무기 획득 (무기 슬롯 1칸 반환)**됩니다.
3. **진화 무기 성장**: 진화 무기 역시 레벨업 카드를 통해 **5레벨(★★★★★)까지 추가 강화**가 가능합니다.

### 진화 조합 명세표

| 진화 무기 | 타입 | 개별 모듈 파일 | 합성 조합 공식 | 기본 피해 | 쿨다운/주기 | 매커니즘 및 특수 고유 효과 |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **천상의 성역 (`heavenlySanctuary`)** | **도트** | [`heavenlySanctuary.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/heavenlySanctuary.js) | **성역(5Lv) + 성수(5Lv)** | 36 | 0.80s | 플레이어 주위에 초대형 룬 결계(반경 135px)를 상시 형성하여 0.8초마다 도트 피해를 입히며 넉백 제거(0), 5% 확률로 적을 1.5초간 완전 빙결 (보스는 40% 감속) |
| **모닝스타 선풍 (`morningstarTempest`)** | **원거리/근접** | [`morningstarTempest.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/morningstarTempest.js) | **채찍(5Lv) + 표창(5Lv)** | 52 | 0.95s (기본 2연타) | 자동 조준 전후방 교차 타격을 수행하며, 첫 번째 타겟 적중 지점에서 4방향 십자형 관통 표창을 폭쇄 방출 |
| **멸망의 혜성 (`apocalypseComet`)** | **원거리** | [`apocalypseComet.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/apocalypseComet.js) | **화염 지팡이(5Lv) + 마법 화살(5Lv)** | 62 | 0.85s (기본 2발) | 적을 유도 추적하는 거대한 초고열 화염 혜성을 연속 발사하여 초대형 헬파이어 연쇄 폭발 발생 |
| **학살자의 폭풍검 (`slayerBladeStorm`)** | **근접** | [`slayerBladeStorm.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/slayerBladeStorm.js) | **철검(5Lv) + 도끼(5Lv)** | 56 | 0.50s (회전무기 4개) | 거대 대검과 도끼들이 플레이어 주위를 초고속 상시 궤도 회전하며 접근하는 모든 적을 갈아내고 강력한 넉백(240) 부여 + **적 투사체(일반몹 암흑탄 및 보스 탄막) 요격 및 무이펙트 즉시 삭제 (렉 방지 최적화)** |
| **테슬라 뇌전포 (`teslaShotgun`)** | **원거리** | [`teslaShotgun.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/teslaShotgun.js) | **산탄 총포(5Lv) + 번개 반지(5Lv)** | 45 | 1.25s (기본 6발) | 가장 가까운 적을 자동 조준하여 전방 부채꼴로 고전압 뇌전 탄환 6발 일제 사격, 적중 시 체인 라이트닝 전이 및 낙뢰 폭격 + **고전압 스파크 파티클 타격 연출** |
| **베놈 블리자드 (`venomBlizzard`)** | **원거리/폭발** | [`venomBlizzard.js`](file:///g:/내%20드라이브/vam/js/weapons/evolutions/venomBlizzard.js) | **맹독 비수(5Lv) + 빙결 보주(5Lv)** | 45 (폭발 60) | 1.80s (사방 8비수) | **2단계 원거리 발사형 메커니즘**:<br>1단계: 서리독 구체가 전진하며 궤적 주변에 빙결 보주와 동일한 냉기 파동(반경 51px, 피해 + 감속) 방출<br>2단계: 발사 2초 후 대폭발하며 사방 8방향으로 관통형 독단검(`poisonDagger`)을 일제 사격(적중 시 3초간 맹독 중독) |
