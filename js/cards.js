// 레벨업 카드 시스템: 무기 강화, 신규 무기 해금, 14대 진화 무기 합성, 16종 캐릭터 패시브 강화
// 1. 캐릭터 패시브 스탯은 최대 6종만 인벤토리에 장착 가능 (각 5강 제한)
// 2. 무기 슬롯 최대 6개 제한 (각 무기 총 5레벨 MAX 제한)
// 3. 14대 정통 진화 무기 체계: 성역+성수, 채찍+표창, 불지팡이+마법화살, 검+도끼, 산탄총+번개반지, 독비수+빙결보주 등 14종

function formatStars(currentLevel, maxLevel) {
  const filled = Math.min(currentLevel, maxLevel);
  const empty = Math.max(0, maxLevel - filled);
  return '★'.repeat(filled) + '☆'.repeat(empty);
}

// 5종 캐릭터별 고유 시그니처 무기 체계 (철검은 전 직업 공용 무기로 전환되어 모든 캐릭터 사용 가능)
const CHARACTER_SIGNATURE_WEAPONS = {
  mage: 'fireWand',         // 마도사: 불 지팡이
  assassin: 'poisonDagger', // 암살자: 독비수
  cleric: 'holyWater',      // 성직자: 성수
  sylph: 'windBow',         // 바람 궁수: 바람 활
  malakar: 'shadowOrb'      // 흑마법사: 어둠의 보주
};

// 해당 캐릭터가 사용할 수 없는 타 직업 시그니처 무기 목록 반환 (블랙리스트)
function getForbiddenWeaponsForClass(charType) {
  const mySig = CHARACTER_SIGNATURE_WEAPONS[charType] || null;
  return Object.values(CHARACTER_SIGNATURE_WEAPONS).filter(sig => sig !== mySig);
}

class CardManager {
  constructor(player, weaponManager) {
    this.player = player;
    this.weaponManager = weaponManager;
  }

  // 게임 시작 시 해당 영웅의 전용 무기 중 3개를 선택
  generateStartingWeaponCards() {
    const charType = this.player.characterType || 'knight';
    const forbidden = getForbiddenWeaponsForClass(charType);
    const allWeaponKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand', 'poisonDagger', 'frostOrb', 'windBow', 'shadowOrb'];
    const starterKeys = allWeaponKeys.filter(k => !forbidden.includes(k));
    const weaponMeta = {
      sword: { name: '철검', icon: '🗡️', iconKey: 'icon_sword', desc: '가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다.' },
      axe: { name: '도끼', icon: '🪓', iconKey: 'icon_axe', desc: '주변을 원형으로 크게 베어내며 적을 밀쳐냅니다.' },
      whip: { name: '채찍', icon: '🪢', iconKey: 'icon_whip', desc: '가장 가까운 적을 자동 조준하여 휘두르고, 반대 방향과 번갈아 교차 강타합니다.' },
      shuriken: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전하며 관통하는 표창을 던집니다.' },
      throwingDagger: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전하며 관통하는 표창을 던집니다.' },
      magicMissile: { name: '마법 화살', icon: '🔮', iconKey: 'icon_missile', desc: '가장 가까운 적을 유도 추적하는 마법 탄환을 발사합니다.' },
      shotgun: { name: '산탄총', icon: '💥', iconKey: 'icon_shotgun', desc: '바라보는 방향으로 부채꼴 형태의 산탄을 일제 사격합니다.' },
      holyWater: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.' },
      sanctuary: { name: '성역', icon: '⛪', iconKey: 'icon_sanctuary', desc: '플레이어를 감싸는 원형 결계로 적들에게 매초 도트 피해를 입힙니다.' },
      lightningRing: { name: '번개 반지', icon: '⚡', iconKey: 'icon_lightning', desc: '무작위 적의 머리 위로 하늘에서 벼락을 내리꽂아 반경 범위 피해를 입힙니다.' },
      fireWand: { name: '불 지팡이', icon: '🔥', iconKey: 'icon_firewand', desc: '가장 가까운 적을 향해 화염구를 발사하며, 명중 시 폭발하여 광역 피해를 입힙니다.' },
      poisonDagger: { name: '독비수', icon: '🗡️🧪', iconKey: 'icon_poisondagger', desc: '바라보는 방향으로 독비수를 쾌속 연사하며 피격된 적에게 중독 피해를 입힙니다.' },
      frostOrb: { name: '빙결 보주', icon: '❄️🔮', iconKey: 'icon_frostorb', desc: '전방으로 천천히 전진하며 주변 적들에게 지속 냉기 파동을 발산하여 감속시키고 피해를 입힙니다.' },
      windBow: { name: '바람 활', icon: '🏹💨', iconKey: 'icon_windbow', desc: '직선으로 쾌속 관통 바람 화살을 사격하여 적을 밀쳐냅니다.' },
      shadowOrb: { name: '어둠의 보주', icon: '🔮🖤', iconKey: 'icon_shadoworb', desc: '플레이어 주변을 공전하며 적에게 지속 암흑 피해를 입힙니다.' }
    };

    const shuffled = [...starterKeys].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 3);

    return picked.map(key => {
      const meta = weaponMeta[key];
      return {
        id: `start_${key}`,
        type: 'weapon_new',
        category: 'weapon',
        title: `${meta.name} 해금`,
        icon: meta.icon,
        iconKey: meta.iconKey,
        desc: meta.desc,
        effectText: '시작 무기 장착',
        badge: 'START WEAPON',
        stars: '★☆☆☆☆',
        evolutionHint: null,
        apply: () => {
          this.weaponManager.unlockWeapon(key);
        }
      };
    });
  }

  generateCards() {
    const cardPool = [];

    // 진화 링크 힌트 헬퍼: 14대 진화 조합 안내 (각 무기당 2개 진화 루트 지원)
    const getEvolutionHint = (weaponKey) => {
      const evoList = [
        // 루트 1
        { w1: 'sanctuary', w2: 'holyWater', evoId: 'heavenlySanctuary', evoName: '생츄어리', evoIcon: '⛪✨', evoIconKey: 'icon_heavenlysanctuary' },
        { w1: 'whip', w2: 'shuriken', evoId: 'morningstarTempest', evoName: '모닝스타', evoIcon: '⛓️🌪️', evoIconKey: 'icon_morningstartempest' },
        { w1: 'fireWand', w2: 'magicMissile', evoId: 'apocalypseComet', evoName: '메테오', evoIcon: '☄️🔥', evoIconKey: 'icon_apocalypsecomet' },
        { w1: 'sword', w2: 'axe', evoId: 'slayerBladeStorm', evoName: '폭풍검', evoIcon: '⚔️🌪️', evoIconKey: 'icon_slayerbladestorm' },
        { w1: 'shotgun', w2: 'lightningRing', evoId: 'teslaShotgun', evoName: '뇌전포', evoIcon: '⚡💥', evoIconKey: 'icon_teslashotgun' },
        { w1: 'poisonDagger', w2: 'frostOrb', evoId: 'venomBlizzard', evoName: '블리자드', evoIcon: '❄️🧪', evoIconKey: 'icon_venomblizzard' },
        // 루트 2
        { w1: 'sword', w2: 'lightningRing', evoId: 'thunderBlade', evoName: '벼락검', evoIcon: '⚡🗡️', evoIconKey: 'icon_thunderblade' },
        { w1: 'axe', w2: 'fireWand', evoId: 'fireAxe', evoName: '화염도끼', evoIcon: '🪓🔥', evoIconKey: 'icon_fireaxe' },
        { w1: 'whip', w2: 'frostOrb', evoId: 'frostWhip', evoName: '얼음채찍', evoIcon: '🪢❄️', evoIconKey: 'icon_frostwhip' },
        { w1: 'shuriken', w2: 'shotgun', evoId: 'scatterShuriken', evoName: '산탄표창', evoIcon: '🥷💥', evoIconKey: 'icon_scattershuriken' },
        { w1: 'magicMissile', w2: 'holyWater', evoId: 'holyArrow', evoName: '신성화살', evoIcon: '🏹✨', evoIconKey: 'icon_holyarrow' },
        { w1: 'poisonDagger', w2: 'sanctuary', evoId: 'plague', evoName: '역병', evoIcon: '☠️⛪', evoIconKey: 'icon_plague' },
        // 루트 3 (신규 2종)
        { w1: 'windBow', w2: 'shuriken', evoId: 'cycloneBow', evoName: '태풍의 눈', evoIcon: '🌀🏹', evoIconKey: 'icon_cyclonebow' },
        { w1: 'shadowOrb', w2: 'magicMissile', evoId: 'eclipseSpiral', evoName: '황혼의 나선', evoIcon: '🔮✨', evoIconKey: 'icon_eclipsespiral' }
      ];

      for (const evo of evoList) {
        if (this.weaponManager.weapons[evo.evoId]) continue;
        let partnerKey = null;
        if (evo.w1 === weaponKey) partnerKey = evo.w2;
        else if (evo.w2 === weaponKey) partnerKey = evo.w1;

        if (partnerKey && this.weaponManager.weapons[partnerKey]) {
          const partnerName = weaponMeta[partnerKey]?.name || partnerKey;
          const currentWeapon = this.weaponManager.weapons[weaponKey];
          const partnerWeapon = this.weaponManager.weapons[partnerKey];
          const currentLv = currentWeapon ? this.weaponManager.getLevel(currentWeapon) : 0;
          const partnerLv = partnerWeapon ? this.weaponManager.getLevel(partnerWeapon) : 0;

          if (currentLv >= 5 && partnerLv >= 5) {
            return {
              status: 'ready',
              evoName: evo.evoName,
              evoIcon: evo.evoIcon,
              evoIconKey: evo.evoIconKey,
              text: `✨ ${evo.evoName} (진화 가능)`
            };
          }
          return {
            status: 'linked',
            evoName: evo.evoName,
            evoIcon: evo.evoIcon,
            evoIconKey: evo.evoIconKey,
            text: evo.evoName
          };
        }
      }
      return null;
    };

    // 1. 미보유 무기 해금 카드 (최대 6개 무기 슬롯 제한, 타 직업 시그니처 5종 차단, 공용 8종 허용)
    const ownedWeaponsCount = Object.keys(this.weaponManager.weapons).length;
    const allWeaponKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand', 'poisonDagger', 'frostOrb', 'windBow', 'shadowOrb'];
    const charType = this.player.characterType || 'knight';
    const forbiddenWeapons = getForbiddenWeaponsForClass(charType);

    // 이미 진화에 소모되었거나 현재 보유 중인 진화 무기의 재료 무기는 카드 풀에서 영구 제외
    const evolvedMaterialPairs = {
      heavenlySanctuary: ['sanctuary', 'holyWater', 'acidPool'],
      morningstarTempest: ['whip', 'shuriken', 'throwingDagger'],
      apocalypseComet: ['fireWand', 'magicMissile'],
      slayerBladeStorm: ['sword', 'axe'],
      teslaShotgun: ['shotgun', 'lightningRing'],
      venomBlizzard: ['poisonDagger', 'frostOrb'],
      thunderBlade: ['sword', 'lightningRing'],
      fireAxe: ['axe', 'fireWand'],
      frostWhip: ['whip', 'frostOrb'],
      scatterShuriken: ['shuriken', 'shotgun'],
      holyArrow: ['magicMissile', 'holyWater'],
      plague: ['poisonDagger', 'sanctuary'],
      cycloneBow: ['windBow', 'shuriken', 'throwingDagger'],
      eclipseSpiral: ['shadowOrb', 'magicMissile']
    };

    const isConsumedWeapon = (key) => {
      if (this.weaponManager.consumedWeapons && this.weaponManager.consumedWeapons.has(key)) {
        return true;
      }
      for (const evoKey in evolvedMaterialPairs) {
        if (this.weaponManager.weapons[evoKey] && evolvedMaterialPairs[evoKey].includes(key)) {
          return true;
        }
      }
      return false;
    };

    const unownedWeapons = allWeaponKeys.filter(k => {
      if (forbiddenWeapons.includes(k)) return false; // 타 직업 시그니처 무기 5종 차단!
      if (k === 'shuriken' && (this.weaponManager.weapons['throwingDagger'] || isConsumedWeapon('throwingDagger'))) return false;
      return !this.weaponManager.weapons[k] && !isConsumedWeapon(k);
    });

    const weaponMeta = {
      sword: { name: '철검', type: '근접', icon: '🗡️', iconKey: 'icon_sword', desc: '바라보는 방향으로 날렵하게 검을 휘둘러 베기' },
      axe: { name: '도끼', type: '근접', icon: '🪓', iconKey: 'icon_axe', desc: '주변을 원형으로 크게 베어내며 적을 밀쳐냄' },
      whip: { name: '채찍', type: '근접', icon: '🪢', iconKey: 'icon_whip', desc: '가장 가까운 적을 자동 조준하여 휘두르고 반대 방향과 번갈아 교차 강타' },
      shuriken: { name: '표창', type: '원거리', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전 관통 표창 투척' },
      throwingDagger: { name: '표창', type: '원거리', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전 관통 표창 투척' },
      magicMissile: { name: '마법 화살', type: '원거리', icon: '🔮', iconKey: 'icon_missile', desc: '가장 가까운 적을 유도 추적하는 마법 탄환' },
      shotgun: { name: '산탄 총포', type: '원거리', icon: '💥', iconKey: 'icon_shotgun', desc: '바라보는 방향으로 부채꼴 형태의 산탄 일제 사격' },
      holyWater: { name: '성수', type: '도트', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판 생성' },
      sanctuary: { name: '성역', type: '도트', icon: '⛪', iconKey: 'icon_sanctuary', desc: '플레이어를 감싸는 360도 원형 결계로 적들에게 매초 도트 피해 부여' },
      acidPool: { name: '성수', type: '도트', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판 생성' },
      lightningRing: { name: '번개 반지', type: '원거리', icon: '⚡', iconKey: 'icon_lightning', desc: '무작위 적의 머리 위로 하늘에서 벼락을 내리꽂음' },
      fireWand: { name: '화염 지팡이', type: '원거리', icon: '🔥', iconKey: 'icon_firewand', desc: '가장 가까운 적을 향해 폭발 화염구를 발사' },
      poisonDagger: { name: '맹독 비수', type: '원거리', icon: '🗡️🧪', iconKey: 'icon_poisondagger', desc: '바라보는 방향으로 맹독 비수를 쾌속 연사하며 피격된 적에게 중독 피해 부여' },
      frostOrb: { name: '빙결 보주', type: '원거리', icon: '❄️🔮', iconKey: 'icon_frostorb', desc: '전방으로 천천히 전진하며 주변 적들에게 지속 냉기 파동 발산 및 감속' },
      windBow: { name: '바람 활', type: '원거리', icon: '🏹💨', iconKey: 'icon_windbow', desc: '직선으로 쾌속 관통 바람 화살을 사격하여 적을 밀쳐냄' },
      shadowOrb: { name: '어둠의 보주', type: '도트', icon: '🔮🖤', iconKey: 'icon_shadoworb', desc: '플레이어 주변을 공전하며 적에게 지속 암흑 피해 부여' },

      // 14대 진화 무기 메타
      heavenlySanctuary: { name: '천상의 성역', type: '도트', icon: '⛪✨', iconKey: 'icon_heavenlysanctuary', desc: '초대형 룬 결계와 적 빙결(동결) 효과' },
      morningstarTempest: { name: '모닝스타 선풍', type: '원거리', icon: '⛓️🌪️', iconKey: 'icon_morningstartempest', desc: '채찍 전후방 교차 타격 및 첫 적중 시 4방향 관통 표창 방출' },
      apocalypseComet: { name: '멸망의 혜성', type: '원거리', icon: '☄️🔥', iconKey: 'icon_apocalypsecomet', desc: '유도 화염 혜성 연사 및 헬파이어 연쇄 폭발' },
      slayerBladeStorm: { name: '학살자의 폭풍검', type: '근접', icon: '⚔️🌪️', iconKey: 'icon_slayerbladestorm', desc: '초고속 상시 궤도 회전 대검·도끼 근접 방쇄 및 적 투사체 요격 삭제' },
      teslaShotgun: { name: '테슬라 뇌전포', type: '원거리', icon: '⚡💥', iconKey: 'icon_teslashotgun', desc: '고전압 뇌전 산탄 일제 사격 및 체인 라이트닝·낙뢰 폭격' },
      venomBlizzard: { name: '베놈 블리자드', type: '원거리', icon: '❄️🧪', iconKey: 'icon_venomblizzard', desc: '거대 서리독 구체 전진 파동 및 8방향 독성 얼음 파편 폭발 방출' },
      thunderBlade: { name: '벼락검', type: '근접', icon: '⚡⚔️', iconKey: 'icon_thunderblade', desc: '전방 강타 베기 및 타겟 적 벼락 강타' },
      fireAxe: { name: '화염도끼', type: '근접', icon: '🪓🔥', iconKey: 'icon_fireaxe', desc: '360도 도끼 대회전 및 8방향 화염구 폭발' },
      frostWhip: { name: '얼음채찍', type: '근접', icon: '❄️⛓️', iconKey: 'icon_frostwhip', desc: '전후방 냉기 채찍 타격 및 피격 적 1초 동결' },
      scatterShuriken: { name: '산탄표창', type: '원거리', icon: '🎯💥', iconKey: 'icon_scattershuriken', desc: '부채꼴 5발 관통 표창 일제 사격' },
      holyArrow: { name: '신성화살', type: '원거리', icon: '🏹✨', iconKey: 'icon_holyarrow', desc: '유도 신성 화살 사격 및 적중 위치 정화 장판 생성' },
      plague: { name: '역병', type: '도트', icon: '☣️💀', iconKey: 'icon_plague', desc: '독기 결계 지속 중독 및 30초 주기 전체 화면 맹독 폭발' },
      cycloneBow: { name: '태풍의 눈', type: '원거리', icon: '🌀🏹', iconKey: 'icon_cyclonebow', desc: '대형 관통 폭풍 화살을 사격하고 적들을 블랙홀처럼 중심 흡인' },
      eclipseSpiral: { name: '황혼의 나선', type: '도트', icon: '🔮✨', iconKey: 'icon_eclipsespiral', desc: '3개 암흑 나선 보주가 회전하며 주기적으로 유도 공허 유령탄 난사' }
    };

    if (ownedWeaponsCount < 6) {
      unownedWeapons.forEach(key => {
        const meta = weaponMeta[key];
        const evoHint = getEvolutionHint(key);
        cardPool.push({
          id: `unlock_${key}`,
          type: 'weapon_new',
          category: 'weapon',
          title: `${meta.name} 해금`,
          icon: meta.icon,
          iconKey: meta.iconKey,
          desc: meta.desc,
          effectText: '신규 무기 획득',
          badge: meta.type ? `${meta.type} 무기` : 'NEW WEAPON',
          stars: '',
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.unlockWeapon(key);
          }
        });
      });
    }

    // 2. 특수 진화 무기 합성 카드 (5종, 조건: 두 재료 무기 모두 5레벨 MAX)
    const evolutionCards = [];

    // [진화 1] 생츄어리 = 성역(5Lv) + 성수(5Lv)
    const wSanctuary = this.weaponManager.weapons['sanctuary'];
    const wHolyWater = this.weaponManager.weapons['holyWater'] || this.weaponManager.weapons['acidPool'];
    const hasHeavenlySanctuary = !!this.weaponManager.weapons['heavenlySanctuary'];

    if (wSanctuary && wHolyWater && !hasHeavenlySanctuary) {
      const sanctuaryLv = this.weaponManager.getLevel(wSanctuary);
      const holyWaterLv = this.weaponManager.getLevel(wHolyWater);

      if (sanctuaryLv >= 5 && holyWaterLv >= 5) {
        evolutionCards.push({
          id: 'evolve_heavenly_sanctuary',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 생츄어리',
          icon: '⛪✨',
          iconKey: 'icon_heavenlysanctuary',
          desc: '성역과 성수를 합성 진화합니다! 초대형 성역 결계가 형성되고 범위 내 적에게 지속 피해 및 빙결을 겁니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '성역(5Lv) + 성수(5Lv) 합성 -> [생츄어리 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('sanctuary');
              this.weaponManager.consumedWeapons.add('holyWater');
              this.weaponManager.consumedWeapons.add('acidPool');
            }
            delete this.weaponManager.weapons['sanctuary'];
            delete this.weaponManager.weapons['holyWater'];
            delete this.weaponManager.weapons['acidPool'];
            this.weaponManager.unlockWeapon('heavenlySanctuary');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#fef08a', 50);
              window.game.addParticles(this.player.x, this.player.y, '#60a5fa', 50);
            }
          }
        });
      }
    }

    // [진화 2] 모닝스타 = 채찍(5Lv) + 표창(5Lv)
    const wWhip = this.weaponManager.weapons['whip'];
    const wShuriken = this.weaponManager.weapons['shuriken'] || this.weaponManager.weapons['throwingDagger'];
    const hasMorningstarTempest = !!this.weaponManager.weapons['morningstarTempest'];

    if (wWhip && wShuriken && !hasMorningstarTempest) {
      const whipLv = this.weaponManager.getLevel(wWhip);
      const shurikenLv = this.weaponManager.getLevel(wShuriken);

      if (whipLv >= 5 && shurikenLv >= 5) {
        evolutionCards.push({
          id: 'evolve_morningstar_tempest',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 모닝스타',
          icon: '⛓️🌪️',
          iconKey: 'icon_morningstartempest',
          desc: '채찍과 표창을 합성 진화합니다! 채찍 타격 후 적중 위치에서 4방향 관통 표창이 폭쇄 방출됩니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '채찍(5Lv) + 표창(5Lv) 합성 -> [모닝스타 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('whip');
              this.weaponManager.consumedWeapons.add('shuriken');
              this.weaponManager.consumedWeapons.add('throwingDagger');
            }
            delete this.weaponManager.weapons['whip'];
            delete this.weaponManager.weapons['shuriken'];
            delete this.weaponManager.weapons['throwingDagger'];
            this.weaponManager.unlockWeapon('morningstarTempest');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 50);
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 50);
            }
          }
        });
      }
    }

    // [진화 3] 메테오 = 불 지팡이(5Lv) + 마법 화살(5Lv)
    const wFire = this.weaponManager.weapons['fireWand'];
    const wMissile = this.weaponManager.weapons['magicMissile'];
    const hasApocalypseComet = !!this.weaponManager.weapons['apocalypseComet'];

    if (wFire && wMissile && !hasApocalypseComet) {
      const fireLv = this.weaponManager.getLevel(wFire);
      const missileLv = this.weaponManager.getLevel(wMissile);

      if (fireLv >= 5 && missileLv >= 5) {
        evolutionCards.push({
          id: 'evolve_apocalypse_comet',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 메테오',
          icon: '☄️🔥',
          iconKey: 'icon_apocalypsecomet',
          desc: '불 지팡이와 마법 화살을 합성 진화합니다! 유도 추적 화염 메테오를 연속 투하하여 연쇄 폭발을 일으킵니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '불 지팡이(5Lv) + 마법 화살(5Lv) 합성 -> [메테오 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('fireWand');
              this.weaponManager.consumedWeapons.add('magicMissile');
            }
            delete this.weaponManager.weapons['fireWand'];
            delete this.weaponManager.weapons['magicMissile'];
            this.weaponManager.unlockWeapon('apocalypseComet');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#ef4444', 50);
              window.game.addParticles(this.player.x, this.player.y, '#c084fc', 50);
            }
          }
        });
      }
    }

    // [진화 4] 폭풍검 = 철검(5Lv) + 도끼(5Lv)
    const wSword = this.weaponManager.weapons['sword'];
    const wAxe = this.weaponManager.weapons['axe'];
    const hasSlayerBladeStorm = !!this.weaponManager.weapons['slayerBladeStorm'];

    if (wSword && wAxe && !hasSlayerBladeStorm) {
      const swordLv = this.weaponManager.getLevel(wSword);
      const axeLv = this.weaponManager.getLevel(wAxe);

      if (swordLv >= 5 && axeLv >= 5) {
        evolutionCards.push({
          id: 'evolve_slayer_blade_storm',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 폭풍검',
          icon: '⚔️🌪️',
          iconKey: 'icon_slayerbladestorm',
          desc: '철검과 도끼를 합성 진화합니다! 대검과 도끼가 주위를 상시 회전하며 적을 베고 투사체를 요격합니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '철검(5Lv) + 도끼(5Lv) 합성 -> [폭풍검 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('sword');
              this.weaponManager.consumedWeapons.add('axe');
            }
            delete this.weaponManager.weapons['sword'];
            delete this.weaponManager.weapons['axe'];
            this.weaponManager.unlockWeapon('slayerBladeStorm');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#f59e0b', 50);
              window.game.addParticles(this.player.x, this.player.y, '#ef4444', 50);
            }
          }
        });
      }
    }

    // [진화 5] 뇌전포 = 산탄총(5Lv) + 번개 반지(5Lv)
    const wShotgun = this.weaponManager.weapons['shotgun'];
    const wLightning = this.weaponManager.weapons['lightningRing'];
    const hasTeslaShotgun = !!this.weaponManager.weapons['teslaShotgun'];

    if (wShotgun && wLightning && !hasTeslaShotgun) {
      const shotgunLv = this.weaponManager.getLevel(wShotgun);
      const lightningLv = this.weaponManager.getLevel(wLightning);

      if (shotgunLv >= 5 && lightningLv >= 5) {
        evolutionCards.push({
          id: 'evolve_tesla_shotgun',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 뇌전포',
          icon: '⚡💥',
          iconKey: 'icon_teslashotgun',
          desc: '산탄총과 번개 반지를 합성 진화합니다! 뇌전 산탄 사격과 함께 체인 라이트닝 낙뢰가 폭격됩니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '산탄총(5Lv) + 번개 반지(5Lv) 합성 -> [뇌전포 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('shotgun');
              this.weaponManager.consumedWeapons.add('lightningRing');
            }
            delete this.weaponManager.weapons['shotgun'];
            delete this.weaponManager.weapons['lightningRing'];
            this.weaponManager.unlockWeapon('teslaShotgun');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 50);
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 50);
            }
          }
        });
      }
    }

    // [진화 6] 블리자드 = 독비수(5Lv) + 빙결 보주(5Lv)
    const wDagger = this.weaponManager.weapons['poisonDagger'];
    const wFrost = this.weaponManager.weapons['frostOrb'];
    const hasVenomBlizzard = !!this.weaponManager.weapons['venomBlizzard'];

    if (wDagger && wFrost && !hasVenomBlizzard) {
      const daggerLv = this.weaponManager.getLevel(wDagger);
      const frostLv = this.weaponManager.getLevel(wFrost);

      if (daggerLv >= 5 && frostLv >= 5) {
        evolutionCards.push({
          id: 'evolve_venom_blizzard',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 블리자드',
          icon: '❄️🧪',
          iconKey: 'icon_venomblizzard',
          desc: '독비수와 빙결 보주를 합성 진화합니다! 서리 구체가 냉기 파동을 일으킨 후 8방향 얼음 파편으로 폭발합니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '독비수(5Lv) + 빙결 보주(5Lv) 합성 -> [블리자드 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('poisonDagger');
              this.weaponManager.consumedWeapons.add('frostOrb');
            }
            delete this.weaponManager.weapons['poisonDagger'];
            delete this.weaponManager.weapons['frostOrb'];
            this.weaponManager.unlockWeapon('venomBlizzard');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#10b981', 50);
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 50);
            }
          }
        });
      }
    }

    // [진화 7] 벼락검 = 철검(5Lv) + 번개 반지(5Lv)
    const hasThunderBlade = !!this.weaponManager.weapons['thunderBlade'];
    if (wSword && wLightning && !hasThunderBlade) {
      const swordLv = this.weaponManager.getLevel(wSword);
      const lightningLv = this.weaponManager.getLevel(wLightning);
      if (swordLv >= 5 && lightningLv >= 5) {
        evolutionCards.push({
          id: 'evolve_thunder_blade',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 벼락검',
          icon: '⚡⚔️',
          iconKey: 'icon_thunderblade',
          desc: '철검과 번개 반지를 합성 진화합니다! 전방을 강타 베기하며 타겟 적에게 즉시 강력한 벼락을 내리칩니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '철검(5Lv) + 번개 반지(5Lv) 합성 -> [벼락검 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('sword');
              this.weaponManager.consumedWeapons.add('lightningRing');
            }
            delete this.weaponManager.weapons['sword'];
            delete this.weaponManager.weapons['lightningRing'];
            this.weaponManager.unlockWeapon('thunderBlade');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 50);
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 50);
            }
          }
        });
      }
    }

    // [진화 8] 화염도끼 = 도끼(5Lv) + 불 지팡이(5Lv)
    const hasFireAxe = !!this.weaponManager.weapons['fireAxe'];
    if (wAxe && wFire && !hasFireAxe) {
      const axeLv = this.weaponManager.getLevel(wAxe);
      const fireLv = this.weaponManager.getLevel(wFire);
      if (axeLv >= 5 && fireLv >= 5) {
        evolutionCards.push({
          id: 'evolve_fire_axe',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 화염도끼',
          icon: '🪓🔥',
          iconKey: 'icon_fireaxe',
          desc: '도끼와 불 지팡이를 합성 진화합니다! 도끼가 360도 대회전하며 사방으로 화염구를 뿜어내어 폭발시킵니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '도끼(5Lv) + 불 지팡이(5Lv) 합성 -> [화염도끼 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('axe');
              this.weaponManager.consumedWeapons.add('fireWand');
            }
            delete this.weaponManager.weapons['axe'];
            delete this.weaponManager.weapons['fireWand'];
            this.weaponManager.unlockWeapon('fireAxe');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#ef4444', 50);
              window.game.addParticles(this.player.x, this.player.y, '#f59e0b', 50);
            }
          }
        });
      }
    }

    // [진화 9] 얼음채찍 = 채찍(5Lv) + 빙결 보주(5Lv)
    const hasFrostWhip = !!this.weaponManager.weapons['frostWhip'];
    if (wWhip && wFrost && !hasFrostWhip) {
      const whipLv = this.weaponManager.getLevel(wWhip);
      const frostLv = this.weaponManager.getLevel(wFrost);
      if (whipLv >= 5 && frostLv >= 5) {
        evolutionCards.push({
          id: 'evolve_frost_whip',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 얼음채찍',
          icon: '❄️⛓️',
          iconKey: 'icon_frostwhip',
          desc: '채찍과 빙결 보주를 합성 진화합니다! 전후방을 냉기 채찍으로 후려치며 피격된 모든 적을 1초간 동결시킵니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '채찍(5Lv) + 빙결 보주(5Lv) 합성 -> [얼음채찍 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('whip');
              this.weaponManager.consumedWeapons.add('frostOrb');
            }
            delete this.weaponManager.weapons['whip'];
            delete this.weaponManager.weapons['frostOrb'];
            this.weaponManager.unlockWeapon('frostWhip');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 50);
              window.game.addParticles(this.player.x, this.player.y, '#e0f2fe', 50);
            }
          }
        });
      }
    }

    // [진화 10] 산탄표창 = 표창(5Lv) + 산탄총(5Lv)
    const hasScatterShuriken = !!this.weaponManager.weapons['scatterShuriken'];
    if (wShuriken && wShotgun && !hasScatterShuriken) {
      const shurikenLv = this.weaponManager.getLevel(wShuriken);
      const shotgunLv = this.weaponManager.getLevel(wShotgun);
      if (shurikenLv >= 5 && shotgunLv >= 5) {
        evolutionCards.push({
          id: 'evolve_scatter_shuriken',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 산탄표창',
          icon: '🎯💥',
          iconKey: 'icon_scattershuriken',
          desc: '표창과 산탄총을 합성 진화합니다! 부채꼴로 5발의 대형 표창을 일제 발사하여 적들을 꿰뚫고 크게 밀쳐냅니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '표창(5Lv) + 산탄총(5Lv) 합성 -> [산탄표창 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('shuriken');
              this.weaponManager.consumedWeapons.add('throwingDagger');
              this.weaponManager.consumedWeapons.add('shotgun');
            }
            delete this.weaponManager.weapons['shuriken'];
            delete this.weaponManager.weapons['throwingDagger'];
            delete this.weaponManager.weapons['shotgun'];
            this.weaponManager.unlockWeapon('scatterShuriken');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#94a3b8', 50);
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 50);
            }
          }
        });
      }
    }

    // [진화 11] 신성화살 = 마법 화살(5Lv) + 성수(5Lv)
    const hasHolyArrow = !!this.weaponManager.weapons['holyArrow'];
    if (wMissile && wHolyWater && !hasHolyArrow) {
      const missileLv = this.weaponManager.getLevel(wMissile);
      const holyWaterLv = this.weaponManager.getLevel(wHolyWater);
      if (missileLv >= 5 && holyWaterLv >= 5) {
        evolutionCards.push({
          id: 'evolve_holy_arrow',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 신성화살',
          icon: '🏹✨',
          iconKey: 'icon_holyarrow',
          desc: '마법 화살과 성수를 합성 진화합니다! 유도 추적 신성 화살을 쏘아보내며 적중한 자리에 3초간 정화 장판을 생성합니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '마법 화살(5Lv) + 성수(5Lv) 합성 -> [신성화살 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('magicMissile');
              this.weaponManager.consumedWeapons.add('holyWater');
              this.weaponManager.consumedWeapons.add('acidPool');
            }
            delete this.weaponManager.weapons['magicMissile'];
            delete this.weaponManager.weapons['holyWater'];
            delete this.weaponManager.weapons['acidPool'];
            this.weaponManager.unlockWeapon('holyArrow');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#60a5fa', 50);
              window.game.addParticles(this.player.x, this.player.y, '#fef08a', 50);
            }
          }
        });
      }
    }

    // [진화 12] 역병 = 독비수(5Lv) + 성역(5Lv)
    const hasPlague = !!this.weaponManager.weapons['plague'];
    if (wDagger && wSanctuary && !hasPlague) {
      const daggerLv = this.weaponManager.getLevel(wDagger);
      const sanctuaryLv = this.weaponManager.getLevel(wSanctuary);
      if (daggerLv >= 5 && sanctuaryLv >= 5) {
        evolutionCards.push({
          id: 'evolve_plague',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 역병',
          icon: '☣️💀',
          iconKey: 'icon_plague',
          desc: '독비수와 성역을 합성 진화합니다! 플레이어 주위에 독기 결계를 펼쳐 지속 중독을 걸고, 30초마다 화면 전체에 대폭발을 일으킵니다! (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '독비수(5Lv) + 성역(5Lv) 합성 -> [역병 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('poisonDagger');
              this.weaponManager.consumedWeapons.add('sanctuary');
            }
            delete this.weaponManager.weapons['poisonDagger'];
            delete this.weaponManager.weapons['sanctuary'];
            this.weaponManager.unlockWeapon('plague');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#a855f7', 50);
              window.game.addParticles(this.player.x, this.player.y, '#10b981', 50);
            }
          }
        });
      }
    }

    // [진화 13] 태풍의 눈 = 바람 활(5Lv) + 표창(5Lv)
    const wWindBow = this.weaponManager.weapons['windBow'];
    const hasCycloneBow = !!this.weaponManager.weapons['cycloneBow'];
    if (wWindBow && wShuriken && !hasCycloneBow) {
      const windLv = this.weaponManager.getLevel(wWindBow);
      const shurikenLv = this.weaponManager.getLevel(wShuriken);
      if (windLv >= 5 && shurikenLv >= 5) {
        evolutionCards.push({
          id: 'evolve_cyclone_bow',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 태풍의 눈',
          icon: '🌀🏹',
          iconKey: 'icon_cyclonebow',
          desc: '바람 활과 표창을 합성 진화합니다! 거대 폭풍 화살이 모든 적을 꿰뚫고 중심부로 블랙홀 흡인합니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '바람 활(5Lv) + 표창(5Lv) 합성 -> [태풍의 눈 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('windBow');
              this.weaponManager.consumedWeapons.add('shuriken');
              this.weaponManager.consumedWeapons.add('throwingDagger');
            }
            delete this.weaponManager.weapons['windBow'];
            delete this.weaponManager.weapons['shuriken'];
            delete this.weaponManager.weapons['throwingDagger'];
            this.weaponManager.unlockWeapon('cycloneBow');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#10b981', 50);
              window.game.addParticles(this.player.x, this.player.y, '#34d399', 50);
            }
          }
        });
      }
    }

    // [진화 14] 황혼의 나선 = 어둠의 보주(5Lv) + 마법 화살(5Lv)
    const wShadowOrb = this.weaponManager.weapons['shadowOrb'];
    const hasEclipseSpiral = !!this.weaponManager.weapons['eclipseSpiral'];
    if (wShadowOrb && wMissile && !hasEclipseSpiral) {
      const shadowLv = this.weaponManager.getLevel(wShadowOrb);
      const missileLv = this.weaponManager.getLevel(wMissile);
      if (shadowLv >= 5 && missileLv >= 5) {
        evolutionCards.push({
          id: 'evolve_eclipse_spiral',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 황혼의 나선',
          icon: '🔮✨',
          iconKey: 'icon_eclipsespiral',
          desc: '어둠의 보주와 마법 화살을 합성 진화합니다! 3중 나선 보주가 회전하며 주기적으로 유도 공허 유령탄을 쏟아냅니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '어둠의 보주(5Lv) + 마법 화살(5Lv) 합성 -> [황혼의 나선 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('shadowOrb');
              this.weaponManager.consumedWeapons.add('magicMissile');
            }
            delete this.weaponManager.weapons['shadowOrb'];
            delete this.weaponManager.weapons['magicMissile'];
            this.weaponManager.unlockWeapon('eclipseSpiral');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#a855f7', 50);
              window.game.addParticles(this.player.x, this.player.y, '#c084fc', 50);
            }
          }
        });
      }
    }

    // 3. 보유 중인 무기별 강화 카드 (기본 무기 및 진화 무기 모두 1~5레벨 업그레이드 지원)
    for (const key in this.weaponManager.weapons) {
      const w = this.weaponManager.weapons[key];
      const currentLv = this.weaponManager.getLevel(w);

      // 이미 5레벨 MAX인 경우 강화 제외
      if (currentLv >= 5) continue;

      const nextLv = currentLv + 1;
      const meta = weaponMeta[key] || { icon: '⚔️', iconKey: 'icon_atk', name: w.name };
      const evoHint = getEvolutionHint(key);

      // 1) [무기 쿨타임 감소 강화]
      let cdDesc = `재사용 대기시간을 단축합니다. (Lv.${nextLv}/5)`;
      if (key === 'sanctuary' || key === 'heavenlySanctuary') {
        cdDesc = `결계의 피해 적용 주기를 단축합니다. (Lv.${nextLv}/5)`;
      }
      cardPool.push({
        id: `${key}_cooldown`,
        type: 'weapon_upgrade',
        category: 'weapon',
        title: `${w.name} 쿨타임 감소`,
        icon: '⏳',
        iconKey: meta.iconKey,
        desc: cdDesc,
        effectText: '쿨타임 -15%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHint: evoHint,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'cooldown');
        }
      });

      // 2) [무기 데미지 증가 강화]
      cardPool.push({
        id: `${key}_damage`,
        type: 'weapon_upgrade',
        category: 'weapon',
        title: `${w.name} 데미지 증가`,
        icon: '💥',
        iconKey: meta.iconKey,
        desc: `공격력을 대폭 증가시킵니다. (Lv.${nextLv}/5)`,
        effectText: '공격력 +30%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHint: evoHint,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'damage');
        }
      });

      // 3) [무기 범위 증가 강화]
      cardPool.push({
        id: `${key}_area`,
        type: 'weapon_upgrade',
        category: 'weapon',
        title: `${w.name} 범위 증가`,
        icon: '🎯',
        iconKey: meta.iconKey,
        desc: `공격 범위 및 폭발 크기를 확대합니다. (Lv.${nextLv}/5)`,
        effectText: '공격 범위 +20%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHint: evoHint,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'area');
        }
      });

      // 4) [무기 투사체 / 연속공격 증가 강화] (성역 계열은 제외)
      if (key !== 'sanctuary' && key !== 'heavenlySanctuary') {
        let countTitle = `${w.name} 투사체 증가`;
        let countDesc = `동시에 발사하는 투사체 수를 늘립니다.`;
        let countEffect = '투사체 +1개';

        // [근접 계열]: 검, 도끼, 채찍, 학살자의 폭풍검
        if (key === 'sword' || key === 'axe' || key === 'whip' || key === 'slayerBladeStorm') {
          countTitle = `${w.name} 연속공격`;
          countEffect = '연속 공격 +1회';
          if (key === 'sword') {
            countDesc = `빠르게 휘두르는 연속 공격 횟수를 추가합니다.`;
          } else if (key === 'axe') {
            countDesc = `크게 회전시키는 연속 공격 횟수를 추가합니다.`;
          } else if (key === 'whip') {
            countDesc = `반대 방향과 번갈아 타격하는 연속 공격 횟수를 늘립니다.`;
          } else if (key === 'slayerBladeStorm') {
            countDesc = `회전 칼날 및 검기 연속 공격 횟수를 추가합니다.`;
          }
        } else {
          // [원거리 / 도트 투사체 계열]: 표창, 산탄, 마법화살, 화염지팡이, 번개반지, 성수 등
          countTitle = `${w.name} 투사체 증가`;
          if (key === 'shotgun' || key === 'teslaShotgun') {
            countDesc = `동시에 일제 발사하는 산탄 탄환 수를 늘립니다.`;
            countEffect = '투사체 +2개';
          } else if (key === 'shuriken' || key === 'throwingDagger') {
            countDesc = `동시에 투척하는 고속 회전 표창 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'magicMissile') {
            countDesc = `동시에 발사하는 유도 마법 화살 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'fireWand') {
            countDesc = `동시에 발사하는 폭발 화염구 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'lightningRing') {
            countDesc = `동시에 내리꽂는 낙뢰 벼락 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'holyWater' || key === 'acidPool') {
            countDesc = `동시에 투척하는 성수 갯수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'morningstarTempest') {
            countDesc = `적중 시 방출되는 관통 표창 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'apocalypseComet') {
            countDesc = `동시에 연사 투하되는 유도 화염 혜성 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'poisonDagger') {
            countDesc = `동시에 투척하는 맹독 비수 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'frostOrb') {
            countDesc = `동시에 발사하는 빙결 보주 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'venomBlizzard') {
            countDesc = `동시에 발사하는 서리독 구체 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'windBow') {
            countDesc = `동시에 사격하는 바람 화살 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'shadowOrb') {
            countDesc = `플레이어 주위를 공전하는 어둠의 보주 개수를 늘립니다.`;
            countEffect = '보주 +1개';
          } else if (key === 'cycloneBow') {
            countDesc = `동시에 사격하는 태풍의 눈 화살 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'eclipseSpiral') {
            countDesc = `공전 나선 보주 개수 및 유도탄 방출 빈도를 늘립니다.`;
            countEffect = '보주 +1개';
          }
        }

        cardPool.push({
          id: `${key}_count`,
          type: 'weapon_upgrade',
          category: 'weapon',
          title: countTitle,
          icon: '✨',
          iconKey: meta.iconKey,
          desc: countDesc,
          effectText: countEffect,
          badge: `Lv.${nextLv}/5`,
          stars: formatStars(nextLv, 5),
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.upgradeWeapon(key, 'count');
          }
        });
      }
    }

    // 4. 캐릭터 패시브 스탯 카드 (총 10종 중 최대 6종 슬롯 제한)
    const ownedPassiveKeys = Object.keys(this.player.ownedPassives);
    const canAcquireNewPassive = ownedPassiveKeys.length < 6;

    const passiveDefinitions = [
      {
        id: 'stat_armor',
        title: '철벽 갑옷',
        icon: '🛡️',
        iconKey: 'icon_armor',
        desc: '받는 피해를 감쇄하고 추가 경감합니다.',
        effectText: '방어력 +1 & 피해 4% 경감',
        maxLevel: 5,
        apply: () => { this.player.armor += 1; }
      },
      {
        id: 'stat_speed',
        title: '장화',
        icon: '👟',
        iconKey: 'icon_speed',
        desc: '이동 속도를 증가시킵니다.',
        effectText: '이동 속도 +12%',
        maxLevel: 5,
        apply: () => { this.player.speed += this.player.baseSpeed * 0.12; }
      },
      {
        id: 'stat_atk',
        title: '피의 계약',
        icon: '🩸',
        iconKey: 'icon_atk',
        desc: '공격력을 증가시킵니다.',
        effectText: '공격력 +15%',
        maxLevel: 5,
        apply: () => { this.player.atkPowerMult += 0.15; }
      },
      {
        id: 'stat_regen',
        title: '재생의 반지',
        icon: '💍',
        iconKey: 'icon_regen',
        desc: '매초 체력을 지속 자동 회복합니다.',
        effectText: '초당 체력 회복 +0.9 HP/s',
        maxLevel: 5,
        apply: () => { this.player.hpRegen += 0.9; }
      },
      {
        id: 'stat_hp',
        title: '거인의 심장',
        icon: '❤️',
        iconKey: 'icon_hp',
        desc: '최대 체력을 증가시키고 체력을 즉시 일부 회복합니다.',
        effectText: '최대 체력 +25 & 회복 +25',
        maxLevel: 5,
        apply: () => {
          this.player.maxHp += 25;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
        }
      },
      {
        id: 'stat_global_speed',
        title: '황혼의 시계',
        icon: '⏳',
        iconKey: 'icon_global_speed',
        desc: '재사용 대기시간을 단축합니다.',
        effectText: '쿨타임 감소 -20%',
        maxLevel: 5,
        apply: () => { this.player.globalCooldownMult *= 1.20; }
      },
      {
        id: 'stat_magnet',
        title: '자력의 부적',
        icon: '🧲',
        iconKey: 'item_magnet',
        desc: '경험치 보석을 흡수하는 자석 반경을 확장합니다.',
        effectText: '자석 반경 +30%',
        maxLevel: 5,
        apply: () => {
          const bonus = Math.round((this.player.baseMagnetRadius || 130) * 0.30);
          this.player.magnetRadius += bonus;
        }
      },
      {
        id: 'stat_area',
        title: '확장의 룬',
        icon: '🎯',
        iconKey: 'icon_arcanesanctuary',
        desc: '공격 범위 및 크기를 확대합니다.',
        effectText: '공격 범위 +30%',
        maxLevel: 3,
        apply: () => { this.player.bonusAreaMult = (this.player.bonusAreaMult || 1.0) + 0.30; }
      },
      {
        id: 'stat_proj_count',
        title: '복제의 오브',
        icon: '🪞',
        iconKey: 'icon_proj_count',
        desc: '투사체 수 및 연속공격 횟수를 영구 증가시킵니다. (최대 2회)',
        effectText: '투사체/연속공격 +1',
        maxLevel: 2,
        apply: () => {
          this.player.bonusProjectiles = Math.min(2, (this.player.bonusProjectiles || 0) + 1);
        }
      },
      {
        id: 'stat_proj_speed',
        title: '질풍의 깃털',
        icon: '🪶',
        iconKey: 'icon_proj_speed',
        desc: '투사체의 비행 속도를 대폭 증가시킵니다.',
        effectText: '투사체 속도 +20%',
        maxLevel: 5,
        apply: () => {
          this.player.bonusProjSpeedMult = (this.player.bonusProjSpeedMult || 1.0) * 1.20;
        }
      },
      {
        id: 'stat_clover',
        title: '행운의 클로버',
        icon: '🍀',
        iconKey: 'icon_clover',
        desc: '치명타 확률이 상승하고 아이템 드랍률이 증가합니다.',
        effectText: '치명타 확률 +10% & 드랍률 +15%',
        maxLevel: 5,
        apply: () => {
          this.player.critChance = (this.player.critChance || 0.05) + 0.10;
          this.player.dropRateBonus = (this.player.dropRateBonus || 0.0) + 0.15;
        }
      },
      {
        id: 'stat_crown',
        title: '지혜의 왕관',
        icon: '👑',
        iconKey: 'icon_crown',
        desc: '몬스터 처치 및 보석 획득 시 얻는 경험치 획득량이 증가합니다.',
        effectText: '경험치 획득량 +20%',
        maxLevel: 5,
        apply: () => {
          this.player.expMult = (this.player.expMult || 1.0) + 0.20;
        }
      },
      {
        id: 'stat_vampire',
        title: '흡혈의 송곳니',
        icon: '🧛‍♂️',
        iconKey: 'icon_vampire',
        desc: '적 처치 시 피의 정수를 흡수하여 일정 확률로 체력을 회복합니다.',
        effectText: '처치 시 체력 +1 회복 확률 +2%',
        maxLevel: 5,
        apply: () => {
          this.player.vampireChance = (this.player.vampireChance || 0) + (this.player.vampireChance === 0 ? 0.03 : 0.02);
        }
      },
      {
        id: 'stat_shield',
        title: '빛의 성벽',
        icon: '🛡️✨',
        iconKey: 'icon_shield',
        desc: '주기적으로 1회의 피격을 100% 무효화하는 에너지 방벽을 생성합니다.',
        effectText: '방벽 쿨타임 -2.5초 (최대 2스택)',
        maxLevel: 5,
        apply: () => {
          this.player.maxShieldStacks = 2;
          if (this.player.currentShieldStacks === 0) {
            this.player.currentShieldStacks = 1;
          }
          const curLv = (this.player.ownedPassives['stat_shield']?.level || 0) + 1;
          this.player.shieldCooldown = Math.max(8.0, 18.0 - (curLv - 1) * 2.5);
        }
      },
      {
        id: 'stat_crit_dmg',
        title: '사신의 낫',
        icon: '🗡️💀',
        iconKey: 'icon_crit_dmg',
        desc: '치명타 적중 시 입히는 치명타 피해량을 대폭 증가시킵니다.',
        effectText: '치명타 피해량 +30%',
        maxLevel: 5,
        apply: () => {
          const curLv = (this.player.ownedPassives['stat_crit_dmg']?.level || 0) + 1;
          this.player.critDamageMult = 2.0 + curLv * 0.30;
        }
      },
      {
        id: 'stat_thorns',
        title: '가시갑옷',
        icon: '🛡️🌵',
        iconKey: 'icon_thorns',
        desc: '피격 시 주변 적들에게 받은 피해를 가시 폭발로 강력하게 되돌려줍니다.',
        effectText: '피해 반사 +100%',
        maxLevel: 5,
        apply: () => {
          const curLv = (this.player.ownedPassives['stat_thorns']?.level || 0) + 1;
          this.player.thornsPercent = curLv * 1.0;
        }
      }
    ];

    passiveDefinitions.forEach(stat => {
      const current = this.player.ownedPassives[stat.id];
      const isOwned = !!current;

      if (!isOwned && !canAcquireNewPassive) return;

      const currentLv = current ? current.level : 0;
      if (currentLv >= stat.maxLevel) return;

      const nextLv = currentLv + 1;
      cardPool.push({
        id: `${stat.id}_lv${nextLv}`,
        type: isOwned ? 'passive_upgrade' : 'passive_new',
        category: 'passive',
        title: stat.title,
        icon: stat.icon,
        iconKey: stat.iconKey,
        desc: stat.desc,
        effectText: stat.effectText,
        badge: `Lv.${nextLv}/${stat.maxLevel}`,
        stars: formatStars(nextLv, stat.maxLevel),
        apply: () => {
          if (!this.player.ownedPassives[stat.id]) {
            this.player.ownedPassives[stat.id] = {
              level: 1,
              maxLevel: stat.maxLevel,
              iconKey: stat.iconKey,
              icon: stat.icon,
              title: stat.title
            };
          } else {
            this.player.ownedPassives[stat.id].level += 1;
          }
          stat.apply();
        }
      });
    });

    // 5. 비상 대체 카드: 체력 즉시 회복
    const emergencyCard = {
      id: 'emergency_heal',
      type: 'consumable',
      category: 'consumable',
      title: '성수 포션',
      icon: '🧪',
      iconKey: 'icon_heal',
      desc: '상처를 즉시 치료하고 활력을 되찾습니다.',
      effectText: '체력 +35 즉시 회복',
      badge: 'HEAL',
      stars: '★★★',
      apply: () => {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
        sounds.playLevelUp();
      }
    };

    // 진화 카드가 조건을 만족하면 반드시 최우선 보장 노출
    const selectedCards = [];
    if (evolutionCards.length > 0) {
      evolutionCards.forEach(ec => selectedCards.push(ec));
    }

    // 카드 풀 셔플
    const shuffled = [...cardPool].sort(() => Math.random() - 0.5);

    for (const card of shuffled) {
      if (selectedCards.length >= 3) break;
      if (!selectedCards.some(c => c.id === card.id)) {
        selectedCards.push(card);
      }
    }

    while (selectedCards.length < 3) {
      selectedCards.push(emergencyCard);
    }

    return selectedCards;
  }
}
