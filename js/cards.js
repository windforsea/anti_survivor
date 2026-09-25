// 레벨업 카드 시스템: 무기 강화, 신규 무기 해금, 17대 진화 무기 합성, 16종 캐릭터 패시브 강화
// [밸런스 패치]
// 1. stat_global_speed(황혼의 시계) 쿨타임 감소량 완화 (레벨당 -4%, 5레벨 최대 -20% 제한)
// 2. 무기 개별 쿨타임 카드 완화 (-15% -> -8%) 및 공격력 카드 강화 (+30% -> +35%)
// 3. 패시브 stat_speed(장화) 무빙 회피 보조 상향 (+12% -> +15%)

function formatStars(currentLevel, maxLevel) {
  const filled = Math.min(currentLevel, maxLevel);
  const empty = Math.max(0, maxLevel - filled);
  return '★'.repeat(filled) + '☆'.repeat(empty);
}

// 5종 캐릭터별 고유 시그니처 무기 체계 (철검은 전 직업 공용 무기로 전환되어 모든 캐릭터 사용 가능)
const CHARACTER_SIGNATURE_WEAPONS = {
  mage: 'flamePillar',        // 마도사: 화염 기둥 (불 지팡이 공용화)
  assassin: 'chakram',        // 암살자: 차크람 (독비수 공용화)
  cleric: 'holyCross',        // 성직자: 십자가 (성수 공용화)
  sylph: 'windBow',           // 바람 궁수: 바람 활
  malakar: 'shadowOrb'        // 흑마법사: 어둠의 보주
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
    const allWeaponKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand', 'poisonDagger', 'frostOrb', 'windBow', 'shadowOrb', 'flamePillar', 'chakram', 'holyCross'];
    const starterKeys = allWeaponKeys.filter(k => !forbidden.includes(k));
    const weaponMeta = {
      sword: { name: '철검', icon: '🗡️', iconKey: 'icon_sword', desc: '검을 휘둘러 벱니다.' },
      axe: { name: '도끼', icon: '🪓', iconKey: 'icon_axe', desc: '원형으로 베어내며 적을 밀쳐냅니다.' },
      whip: { name: '채찍', icon: '🪢', iconKey: 'icon_whip', desc: '교차 강타합니다.' },
      shuriken: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '관통하는 표창을 던집니다.' },
      magicMissile: { name: '마법 화살', icon: '🔮', iconKey: 'icon_missile', desc: '유도 마법탄을 발사합니다.' },
      shotgun: { name: '산탄총', icon: '💥', iconKey: 'icon_shotgun', desc: '여러 발의 산탄을 사격합니다.' },
      holyWater: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척합니다.' },
      sanctuary: { name: '성역', icon: '⛪', iconKey: 'icon_sanctuary', desc: '결계로 적들에게 피해를 입힙니다.' },
      lightningRing: { name: '번개 반지', icon: '⚡', iconKey: 'icon_lightning', desc: '벼락을 내리꽂아 범위 피해를 입힙니다.' },
      fireWand: { name: '불 지팡이', icon: '🔥', iconKey: 'icon_firewand', desc: '화염구를 발사하며, 명중 시 폭발합니다.' },
      poisonDagger: { name: '독비수', icon: '🗡️🧪', iconKey: 'icon_poisondagger', desc: '독이 묻은 비수를 투척하여 중독 피해를 입힙니다.' },
      frostOrb: { name: '빙결 보주', icon: '❄️🔮', iconKey: 'icon_frostorb', desc: '천천히 전진하며 지속적인 냉기 파동을 발산합니다.' },
      windBow: { name: '바람 활', icon: '🏹💨', iconKey: 'icon_windbow', desc: '화살을 쏘아 적들을 꿰뚫고 밀쳐냅니다.' },
      shadowOrb: { name: '어둠의 보주', icon: '🔮🖤', iconKey: 'icon_shadoworb', desc: '자율 추적하여 플레이어를 호위합니다.' },
      flamePillar: { name: '화염 기둥', icon: '🌋🔥', iconKey: 'icon_flamepillar', desc: '화염 기둥을 솟구치게 하여 폭발 피해를 입힙니다.' },
      chakram: { name: '차크람', icon: '💫🗡️', iconKey: 'icon_chakram', desc: '관통한 뒤 되돌아오며 2중 피해를 입힙니다.' },
      holyCross: { name: '십자가', icon: '✝️✨', iconKey: 'icon_holycross', desc: '십자가를 투척하여 폭발합니다.' }
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

    // 1. 미보유 무기 해금 카드 (최대 6개 무기 슬롯 제한, 타 직업 시그니처 5종 차단, 공용 12종 허용)
    const ownedWeaponsCount = Object.keys(this.weaponManager.weapons).length;
    const allWeaponKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand', 'poisonDagger', 'frostOrb', 'windBow', 'shadowOrb', 'flamePillar', 'chakram', 'holyCross'];
    const charType = this.player.characterType || 'knight';
    const forbiddenWeapons = getForbiddenWeaponsForClass(charType);

    // 이미 진화에 소모되었거나 현재 보유 중인 진화 무기의 재료 무기는 카드 풀에서 영구 제외
    const evolvedMaterialPairs = {
      heavenlySanctuary: ['sanctuary', 'holyWater'],
      morningstarTempest: ['whip', 'shuriken'],
      apocalypseComet: ['fireWand', 'magicMissile'],
      bladeStorm: ['sword', 'axe'],
      teslaShotgun: ['shotgun', 'lightningRing'],
      venomBlizzard: ['poisonDagger', 'frostOrb'],
      thunderBlade: ['sword', 'lightningRing'],
      fireAxe: ['axe', 'fireWand'],
      frostWhip: ['whip', 'frostOrb'],
      scatterShuriken: ['shuriken', 'shotgun'],
      holyArrow: ['magicMissile', 'holyWater'],
      plague: ['poisonDagger', 'sanctuary'],
      cycloneBow: ['windBow', 'shuriken'],
      eclipseSpiral: ['shadowOrb', 'magicMissile'],
      infernoCataclysm: ['flamePillar', 'fireWand'],
      shadowVortex: ['chakram', 'poisonDagger'],
      divineJudgement: ['holyCross', 'holyWater']
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
      if (forbiddenWeapons.includes(k)) return false;
      return !this.weaponManager.weapons[k] && !isConsumedWeapon(k);
    });

    const weaponMeta = {
      sword: { name: '철검', type: '근접', icon: '🗡️', iconKey: 'icon_sword', desc: '검을 휘둘러 벱니다.' },
      axe: { name: '도끼', type: '근접', icon: '🪓', iconKey: 'icon_axe', desc: '원형으로 베어내며 적을 밀쳐냅니다.' },
      whip: { name: '채찍', type: '근접', icon: '🪢', iconKey: 'icon_whip', desc: '교차 강타합니다.' },
      shuriken: { name: '표창', type: '원거리', icon: '🥷', iconKey: 'icon_shuriken', desc: '관통하는 표창을 던집니다.' },
      magicMissile: { name: '마법 화살', type: '원거리', icon: '🔮', iconKey: 'icon_missile', desc: '유도 마법탄을 발사합니다.' },
      shotgun: { name: '산탄총', type: '원거리', icon: '💥', iconKey: 'icon_shotgun', desc: '여러 발의 산탄을 사격합니다.' },
      holyWater: { name: '성수', type: '도트', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척합니다.' },
      sanctuary: { name: '성역', type: '도트', icon: '⛪', iconKey: 'icon_sanctuary', desc: '결계로 적들에게 피해를 입힙니다.' },
      lightningRing: { name: '번개 반지', type: '원거리', icon: '⚡', iconKey: 'icon_lightning', desc: '벼락을 내리꽂아 범위 피해를 입힙니다.' },
      fireWand: { name: '불 지팡이', type: '원거리', icon: '🔥', iconKey: 'icon_firewand', desc: '화염구를 발사하며, 명중 시 폭발합니다.' },
      poisonDagger: { name: '독비수', type: '원거리', icon: '🗡️🧪', iconKey: 'icon_poisondagger', desc: '독이 묻은 비수를 투척하여 중독 피해를 입힙니다.' },
      frostOrb: { name: '빙결 보주', type: '원거리', icon: '❄️🔮', iconKey: 'icon_frostorb', desc: '천천히 전진하며 지속적인 냉기 파동을 발산합니다.' },
      windBow: { name: '바람 활', type: '원거리', icon: '🏹💨', iconKey: 'icon_windbow', desc: '화살을 쏘아 적들을 꿰뚫고 밀쳐냅니다.' },
      shadowOrb: { name: '어둠의 보주', type: '소환', icon: '🔮🖤', iconKey: 'icon_shadoworb', desc: '자율 추적하여 플레이어를 호위합니다.' },
      flamePillar: { name: '화염 기둥', type: '소환', icon: '🌋🔥', iconKey: 'icon_flamepillar', desc: '화염 기둥을 솟구치게 하여 폭발 피해를 입힙니다.' },
      chakram: { name: '차크람', type: '원거리', icon: '💫🗡️', iconKey: 'icon_chakram', desc: '관통한 뒤 되돌아오며 2중 피해를 입힙니다.' },
      holyCross: { name: '십자가', type: '원거리', icon: '✝️✨', iconKey: 'icon_holycross', desc: '십자가를 투척하여 폭발합니다.' },

      // 17대 진화 무기 메타
      heavenlySanctuary: { name: '생츄어리', type: '도트', icon: '⛪✨', iconKey: 'icon_heavenlysanctuary', desc: '결계를 형성하여 낮은 확률로 적을 얼립니다.' },
      morningstarTempest: { name: '모닝스타', type: '원거리', icon: '⛓️🌪️', iconKey: 'icon_morningstartempest', desc: '타겟 적중 시 관통 표창을 발사합니다.' },
      apocalypseComet: { name: '메테오', type: '원거리', icon: '☄️🔥', iconKey: 'icon_apocalypsecomet', desc: '화염 혜성을 발사하며, 연쇄 폭발을 일으킵니다.' },
      bladeStorm: { name: '폭풍칼날', type: '근접', icon: '⚔️🌪️', iconKey: 'icon_bladestorm', desc: '검과 도끼들이 주위를 상시 회전합니다.' },
      teslaShotgun: { name: '뇌전포', type: '원거리', icon: '⚡💥', iconKey: 'icon_teslashotgun', desc: '산탄 사격하며, 적중 시 낙뢰가 폭격됩니다.' },
      venomBlizzard: { name: '블리자드', type: '원거리', icon: '❄️🧪', iconKey: 'icon_venomblizzard', desc: '구체는 전진하며 2초 후 폭발하여 독단검을 일제 사격합니다.' },
      thunderBlade: { name: '벼락검', type: '근접', icon: '⚡⚔️', iconKey: 'icon_thunderblade', desc: '베어낸 위치에 벼락이 내리꽂힙니다.' },
      fireAxe: { name: '화염도끼', type: '근접', icon: '🪓🔥', iconKey: 'icon_fireaxe', desc: '도끼 베기 직후, 화염구를 방출합니다.' },
      frostWhip: { name: '얼음채찍', type: '근접', icon: '❄️⛓️', iconKey: 'icon_frostwhip', desc: '낮은 확률로 빙결시킵니다.' },
      scatterShuriken: { name: '산탄표창', type: '원거리', icon: '🎯💥', iconKey: 'icon_scattershuriken', desc: '회전 관통 표창을 일제히 발사 적들을 밀쳐냅니다.' },
      holyArrow: { name: '신성화살', type: '원거리', icon: '🏹✨', iconKey: 'icon_holyarrow', desc: '빛의 화살 2발을 발사하며, 착탄 위치에 성역을 생성합니다.' },
      plague: { name: '역병', type: '도트', icon: '☣️💀', iconKey: 'icon_plague', desc: '일정 시간마다 화면 전체에 역병 폭발을 일으킵니다.' },
      cycloneBow: { name: '태풍의 눈', type: '원거리', icon: '🌀🏹', iconKey: 'icon_cyclonebow', desc: '블랙홀 관통 화살을 발사합니다.' },
      eclipseSpiral: { name: '황혼의 나선', type: '소환', icon: '🔮✨', iconKey: 'icon_eclipsespiral', desc: '사역마가 마법 화살을 난사합니다.' },
      infernoCataclysm: { name: '인페르노', type: '광역', icon: '🌋☄️', iconKey: 'icon_infernocataclysm', desc: '화염 분화구와 화염지대를 남깁니다.' },
      shadowVortex: { name: '섀도우 차크람', type: '복합', icon: '🌀🗡️', iconKey: 'icon_shadowvortex', desc: '적중 시 6방향 맹독 파편을 뿌립니다.' },
      divineJudgement: { name: '저지먼트', type: '성광', icon: '✝️⚡', iconKey: 'icon_divinejudgement', desc: '십자가를 투척하고, 낙뢰로 기절시킵니다.' }
    };

    // 진화 링크 힌트 헬퍼
    const getEvolutionHints = (weaponKey) => {
      const evoList = [
        { w1: 'sanctuary', w2: 'holyWater', evoId: 'heavenlySanctuary', evoName: '생츄어리', evoIcon: '⛪✨', evoIconKey: 'icon_heavenlysanctuary' },
        { w1: 'whip', w2: 'shuriken', evoId: 'morningstarTempest', evoName: '모닝스타', evoIcon: '⛓️🌪️', evoIconKey: 'icon_morningstartempest' },
        { w1: 'fireWand', w2: 'magicMissile', evoId: 'apocalypseComet', evoName: '메테오', evoIcon: '☄️🔥', evoIconKey: 'icon_apocalypsecomet' },
        { w1: 'sword', w2: 'axe', evoId: 'bladeStorm', evoName: '폭풍칼날', evoIcon: '⚔️🌪️', evoIconKey: 'icon_bladestorm' },
        { w1: 'shotgun', w2: 'lightningRing', evoId: 'teslaShotgun', evoName: '뇌전포', evoIcon: '⚡💥', evoIconKey: 'icon_teslashotgun' },
        { w1: 'poisonDagger', w2: 'frostOrb', evoId: 'venomBlizzard', evoName: '블리자드', evoIcon: '❄️🧪', evoIconKey: 'icon_venomblizzard' },
        { w1: 'sword', w2: 'lightningRing', evoId: 'thunderBlade', evoName: '벼락검', evoIcon: '⚡🗡️', evoIconKey: 'icon_thunderblade' },
        { w1: 'axe', w2: 'fireWand', evoId: 'fireAxe', evoName: '화염도끼', evoIcon: '🪓🔥', evoIconKey: 'icon_fireaxe' },
        { w1: 'whip', w2: 'frostOrb', evoId: 'frostWhip', evoName: '얼음채찍', evoIcon: '🪢❄️', evoIconKey: 'icon_frostwhip' },
        { w1: 'shuriken', w2: 'shotgun', evoId: 'scatterShuriken', evoName: '산탄표창', evoIcon: '🥷💥', evoIconKey: 'icon_scattershuriken' },
        { w1: 'magicMissile', w2: 'holyWater', evoId: 'holyArrow', evoName: '신성화살', evoIcon: '🏹✨', evoIconKey: 'icon_holyarrow' },
        { w1: 'poisonDagger', w2: 'sanctuary', evoId: 'plague', evoName: '역병', evoIcon: '☠️⛪', evoIconKey: 'icon_plague' },
        { w1: 'windBow', w2: 'shuriken', evoId: 'cycloneBow', evoName: '태풍의 눈', evoIcon: '🌀🏹', evoIconKey: 'icon_cyclonebow' },
        { w1: 'shadowOrb', w2: 'magicMissile', evoId: 'eclipseSpiral', evoName: '황혼의 나선', evoIcon: '🔮✨', evoIconKey: 'icon_eclipsespiral' },
        { w1: 'flamePillar', w2: 'fireWand', evoId: 'infernoCataclysm', evoName: '인페르노', evoIcon: '🌋☄️', evoIconKey: 'icon_infernocataclysm' },
        { w1: 'chakram', w2: 'poisonDagger', evoId: 'shadowVortex', evoName: '섀도우 차크람', evoIcon: '🌀🗡️', evoIconKey: 'icon_shadowvortex' },
        { w1: 'holyCross', w2: 'holyWater', evoId: 'divineJudgement', evoName: '저지먼트', evoIcon: '✝️⚡', evoIconKey: 'icon_divinejudgement' }
      ];

      const hints = [];
      for (const evo of evoList) {
        if (this.weaponManager.weapons[evo.evoId]) continue;
        let partnerKey = null;
        if (evo.w1 === weaponKey) partnerKey = evo.w2;
        else if (evo.w2 === weaponKey) partnerKey = evo.w1;

        if (partnerKey && this.weaponManager.weapons[partnerKey]) {
          const partnerMeta = weaponMeta[partnerKey] || {};
          const currentWeapon = this.weaponManager.weapons[weaponKey];
          const partnerWeapon = this.weaponManager.weapons[partnerKey];
          const currentLv = currentWeapon ? this.weaponManager.getLevel(currentWeapon) : 0;
          const partnerLv = partnerWeapon ? this.weaponManager.getLevel(partnerWeapon) : 0;
          const isPartnerMax = partnerLv >= 5;
          const isReady = currentLv >= 5 && isPartnerMax;

          hints.push({
            status: isReady ? 'ready' : 'linked',
            isReady,
            partnerKey,
            partnerIcon: partnerMeta.icon || '🗡️',
            partnerIconKey: partnerMeta.iconKey || ('icon_' + partnerKey.toLowerCase()),
            partnerLevel: partnerLv,
            levelText: isPartnerMax ? 'M' : String(partnerLv),
            evoId: evo.evoId,
            evoName: evo.evoName,
            text: isReady ? ('✨ ' + evo.evoName) : evo.evoName
          });
        }
      }
      return hints;
    };

    if (ownedWeaponsCount < 6) {
      unownedWeapons.forEach(key => {
        const meta = weaponMeta[key];
        const evoHints = getEvolutionHints(key);
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
          evolutionHints: evoHints,
          evolutionHint: evoHints[0] || null,
          apply: () => {
            this.weaponManager.unlockWeapon(key);
          }
        });
      });
    }

    // 2. 특수 진화 무기 합성 카드 (조건: 두 재료 무기 모두 5레벨 MAX)
    const evolutionCards = [];

    // [진화 1] 생츄어리 = 성역(5Lv) + 성수(5Lv)
    const wSanctuary = this.weaponManager.weapons['sanctuary'];
    const wHolyWater = this.weaponManager.weapons['holyWater'];
    const hasHeavenlySanctuary = !!this.weaponManager.weapons['heavenlySanctuary'];
    if (wSanctuary && wHolyWater && !hasHeavenlySanctuary) {
      if (this.weaponManager.getLevel(wSanctuary) >= 5 && this.weaponManager.getLevel(wHolyWater) >= 5) {
        evolutionCards.push({
          id: 'evolve_heavenly_sanctuary',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 생츄어리',
          icon: '⛪✨',
          iconKey: 'icon_heavenlysanctuary',
          desc: '성역과 성수를 합성 진화합니다! 결계를 형성하여 낮은 확률로 적을 얼립니다.',
          effectText: '성역(5Lv) + 성수(5Lv) 합성 -> [생츄어리 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('sanctuary');
              this.weaponManager.consumedWeapons.add('holyWater');
            }
            delete this.weaponManager.weapons['sanctuary'];
            delete this.weaponManager.weapons['holyWater'];
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
    const wShuriken = this.weaponManager.weapons['shuriken'];
    const hasMorningstarTempest = !!this.weaponManager.weapons['morningstarTempest'];
    if (wWhip && wShuriken && !hasMorningstarTempest) {
      if (this.weaponManager.getLevel(wWhip) >= 5 && this.weaponManager.getLevel(wShuriken) >= 5) {
        evolutionCards.push({
          id: 'evolve_morningstar_tempest',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 모닝스타',
          icon: '⛓️🌪️',
          iconKey: 'icon_morningstartempest',
          desc: '채찍과 표창을 합성 진화합니다! 타겟 적중 시 관통 표창을 발사합니다.',
          effectText: '채찍(5Lv) + 표창(5Lv) 합성 -> [모닝스타 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('whip');
              this.weaponManager.consumedWeapons.add('shuriken');
            }
            delete this.weaponManager.weapons['whip'];
            delete this.weaponManager.weapons['shuriken'];
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
      if (this.weaponManager.getLevel(wFire) >= 5 && this.weaponManager.getLevel(wMissile) >= 5) {
        evolutionCards.push({
          id: 'evolve_apocalypse_comet',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 메테오',
          icon: '☄️🔥',
          iconKey: 'icon_apocalypsecomet',
          desc: '불 지팡이와 마법 화살을 합성 진화합니다! 화염 혜성을 발사하며, 연쇄 폭발을 일으킵니다.',
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

    // [진화 4] 폭풍칼날 = 철검(5Lv) + 도끼(5Lv)
    const wSword = this.weaponManager.weapons['sword'];
    const wAxe = this.weaponManager.weapons['axe'];
    const hasBladeStorm = !!this.weaponManager.weapons['bladeStorm'];
    if (wSword && wAxe && !hasBladeStorm) {
      if (this.weaponManager.getLevel(wSword) >= 5 && this.weaponManager.getLevel(wAxe) >= 5) {
        evolutionCards.push({
          id: 'evolve_slayer_blade_storm',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 폭풍칼날',
          icon: '⚔️🌪️',
          iconKey: 'icon_bladestorm',
          desc: '철검과 도끼를 합성 진화합니다! 검과 도끼들이 주위를 상시 회전합니다.',
          effectText: '철검(5Lv) + 도끼(5Lv) 합성 -> [폭풍칼날 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('sword');
              this.weaponManager.consumedWeapons.add('axe');
            }
            delete this.weaponManager.weapons['sword'];
            delete this.weaponManager.weapons['axe'];
            this.weaponManager.unlockWeapon('bladeStorm');
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
      if (this.weaponManager.getLevel(wShotgun) >= 5 && this.weaponManager.getLevel(wLightning) >= 5) {
        evolutionCards.push({
          id: 'evolve_tesla_shotgun',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 뇌전포',
          icon: '⚡💥',
          iconKey: 'icon_teslashotgun',
          desc: '산탄총과 번개 반지를 합성 진화합니다! 산탄 사격하며, 적중 시 낙뢰가 폭격됩니다.',
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
      if (this.weaponManager.getLevel(wDagger) >= 5 && this.weaponManager.getLevel(wFrost) >= 5) {
        evolutionCards.push({
          id: 'evolve_venom_blizzard',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 블리자드',
          icon: '❄️🧪',
          iconKey: 'icon_venomblizzard',
          desc: '독비수와 빙결 보주를 합성 진화합니다! 구체는 전진하며 2초 후 폭발하여 독단검을 일제 사격합니다.',
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
      if (this.weaponManager.getLevel(wSword) >= 5 && this.weaponManager.getLevel(wLightning) >= 5) {
        evolutionCards.push({
          id: 'evolve_thunder_blade',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 벼락검',
          icon: '⚡⚔️',
          iconKey: 'icon_thunderblade',
          desc: '철검과 번개 반지를 합성 진화합니다! 베어낸 위치에 벼락이 내리꽂힙니다.',
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
      if (this.weaponManager.getLevel(wAxe) >= 5 && this.weaponManager.getLevel(wFire) >= 5) {
        evolutionCards.push({
          id: 'evolve_fire_axe',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 화염도끼',
          icon: '🪓🔥',
          iconKey: 'icon_fireaxe',
          desc: '도끼와 불 지팡이를 합성 진화합니다! 도끼 베기 직후, 화염구를 방출합니다.',
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
      if (this.weaponManager.getLevel(wWhip) >= 5 && this.weaponManager.getLevel(wFrost) >= 5) {
        evolutionCards.push({
          id: 'evolve_frost_whip',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 얼음채찍',
          icon: '❄️⛓️',
          iconKey: 'icon_frostwhip',
          desc: '채찍과 빙결 보주를 합성 진화합니다! 낮은 확률로 빙결시킵니다.',
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
      if (this.weaponManager.getLevel(wShuriken) >= 5 && this.weaponManager.getLevel(wShotgun) >= 5) {
        evolutionCards.push({
          id: 'evolve_scatter_shuriken',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 산탄표창',
          icon: '🎯💥',
          iconKey: 'icon_scattershuriken',
          desc: '표창과 산탄총을 합성 진화합니다! 회전 관통 표창을 일제히 발사 적들을 밀쳐냅니다.',
          effectText: '표창(5Lv) + 산탄총(5Lv) 합성 -> [산탄표창 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('shuriken');
              this.weaponManager.consumedWeapons.add('shotgun');
            }
            delete this.weaponManager.weapons['shuriken'];
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
      if (this.weaponManager.getLevel(wMissile) >= 5 && this.weaponManager.getLevel(wHolyWater) >= 5) {
        evolutionCards.push({
          id: 'evolve_holy_arrow',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 신성화살',
          icon: '🏹✨',
          iconKey: 'icon_holyarrow',
          desc: '마법 화살과 성수를 합성 진화합니다! 빛의 화살 2발을 발사하며, 착탄 위치에 성역을 생성합니다.',
          effectText: '마법 화살(5Lv) + 성수(5Lv) 합성 -> [신성화살 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('magicMissile');
              this.weaponManager.consumedWeapons.add('holyWater');
            }
            delete this.weaponManager.weapons['magicMissile'];
            delete this.weaponManager.weapons['holyWater'];
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
      if (this.weaponManager.getLevel(wDagger) >= 5 && this.weaponManager.getLevel(wSanctuary) >= 5) {
        evolutionCards.push({
          id: 'evolve_plague',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 역병',
          icon: '☣️💀',
          iconKey: 'icon_plague',
          desc: '독비수와 성역을 합성 진화합니다! 일정 시간마다 화면 전체에 역병 폭발을 일으킵니다.',
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
      if (this.weaponManager.getLevel(wWindBow) >= 5 && this.weaponManager.getLevel(wShuriken) >= 5) {
        evolutionCards.push({
          id: 'evolve_cyclone_bow',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 태풍의 눈',
          icon: '🌀🏹',
          iconKey: 'icon_cyclonebow',
          desc: '바람 활과 표창을 합성 진화합니다! 블랙홀 관통 화살을 발사합니다.',
          effectText: '바람 활(5Lv) + 표창(5Lv) 합성 -> [태풍의 눈 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('windBow');
              this.weaponManager.consumedWeapons.add('shuriken');
            }
            delete this.weaponManager.weapons['windBow'];
            delete this.weaponManager.weapons['shuriken'];
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
      if (this.weaponManager.getLevel(wShadowOrb) >= 5 && this.weaponManager.getLevel(wMissile) >= 5) {
        evolutionCards.push({
          id: 'evolve_eclipse_spiral',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 황혼의 나선',
          icon: '🔮✨',
          iconKey: 'icon_eclipsespiral',
          desc: '어둠의 보주와 마법 화살을 합성 진화합니다! 사역마가 마법 화살을 난사합니다.',
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

    // [진화 15] 인페르노 = 화염 기둥(5Lv) + 불 지팡이(5Lv)
    const wFlamePillar = this.weaponManager.weapons['flamePillar'];
    const hasInferno = !!this.weaponManager.weapons['infernoCataclysm'];
    if (wFlamePillar && wFire && !hasInferno) {
      if (this.weaponManager.getLevel(wFlamePillar) >= 5 && this.weaponManager.getLevel(wFire) >= 5) {
        evolutionCards.push({
          id: 'evolve_inferno_cataclysm',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 인페르노',
          icon: '🌋🔥',
          iconKey: 'icon_infernocataclysm',
          desc: '화염 기둥과 불 지팡이를 합성 진화합니다! 화염 분화구와 화염지대를 남깁니다.',
          effectText: '화염 기둥(5Lv) + 불 지팡이(5Lv) 합성 -> [인페르노 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('flamePillar');
              this.weaponManager.consumedWeapons.add('fireWand');
            }
            delete this.weaponManager.weapons['flamePillar'];
            delete this.weaponManager.weapons['fireWand'];
            this.weaponManager.unlockWeapon('infernoCataclysm');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#f97316', 50);
              window.game.addParticles(this.player.x, this.player.y, '#ef4444', 50);
            }
          }
        });
      }
    }

    // [진화 16] 섀도우 차크람 = 차크람(5Lv) + 독비수(5Lv)
    const wChakram = this.weaponManager.weapons['chakram'];
    const hasShadowVortex = !!this.weaponManager.weapons['shadowVortex'];
    if (wChakram && wDagger && !hasShadowVortex) {
      if (this.weaponManager.getLevel(wChakram) >= 5 && this.weaponManager.getLevel(wDagger) >= 5) {
        evolutionCards.push({
          id: 'evolve_shadow_vortex',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 섀도우 차크람',
          icon: '💫☠️',
          iconKey: 'icon_shadowvortex',
          desc: '차크람과 독비수를 합성 진화합니다! 적중 시 6방향 맹독 파편을 뿌립니다.',
          effectText: '차크람(5Lv) + 독비수(5Lv) 합성 -> [섀도우 차크람 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('chakram');
              this.weaponManager.consumedWeapons.add('poisonDagger');
            }
            delete this.weaponManager.weapons['chakram'];
            delete this.weaponManager.weapons['poisonDagger'];
            this.weaponManager.unlockWeapon('shadowVortex');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#10b981', 50);
              window.game.addParticles(this.player.x, this.player.y, '#6366f1', 50);
            }
          }
        });
      }
    }

    // [진화 17] 저지먼트 = 십자가(5Lv) + 성수(5Lv)
    const wHolyCross = this.weaponManager.weapons['holyCross'];
    const hasDivineJudgement = !!this.weaponManager.weapons['divineJudgement'];
    if (wHolyCross && wHolyWater && !hasDivineJudgement) {
      if (this.weaponManager.getLevel(wHolyCross) >= 5 && this.weaponManager.getLevel(wHolyWater) >= 5) {
        evolutionCards.push({
          id: 'evolve_divine_judgement',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 저지먼트',
          icon: '✝️⚡',
          iconKey: 'icon_divinejudgement',
          desc: '십자가와 성수를 합성 진화합니다! 십자가를 투척하고, 낙뢰로 기절시킵니다.',
          effectText: '십자가(5Lv) + 성수(5Lv) 합성 -> [저지먼트 1Lv]',
          badge: 'EVOLUTION',
          stars: '★★★★★',
          apply: () => {
            if (this.weaponManager.consumedWeapons) {
              this.weaponManager.consumedWeapons.add('holyCross');
              this.weaponManager.consumedWeapons.add('holyWater');
            }
            delete this.weaponManager.weapons['holyCross'];
            delete this.weaponManager.weapons['holyWater'];
            this.weaponManager.unlockWeapon('divineJudgement');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 50);
              window.game.addParticles(this.player.x, this.player.y, '#e0e7ff', 50);
            }
          }
        });
      }
    }

    // 3. 보유 중인 무기별 강화 카드
    for (const key in this.weaponManager.weapons) {
      const w = this.weaponManager.weapons[key];
      const currentLv = this.weaponManager.getLevel(w);

      if (currentLv >= 5) continue;

      const nextLv = currentLv + 1;
      const meta = weaponMeta[key] || { icon: '⚔️', iconKey: 'icon_atk', name: w.name };
      const evoHints = getEvolutionHints(key);

      // 1) [무기 쿨타임 감소 강화] - 말뚝딜 억제를 위해 -15% -> -8%로 밸런싱
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
        effectText: '쿨타임 -8%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHints: evoHints,
        evolutionHint: evoHints[0] || null,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'cooldown');
        }
      });

      // 2) [무기 데미지 증가 강화] - 한방 묵직함을 위해 +30% -> +35%로 상향
      cardPool.push({
        id: `${key}_damage`,
        type: 'weapon_upgrade',
        category: 'weapon',
        title: `${w.name} 데미지 증가`,
        icon: '💥',
        iconKey: meta.iconKey,
        desc: `공격력을 대폭 증가시킵니다. (Lv.${nextLv}/5)`,
        effectText: '공격력 +35%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHints: evoHints,
        evolutionHint: evoHints[0] || null,
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
        desc: `공격 범위를 확대합니다. (Lv.${nextLv}/5)`,
        effectText: '공격 범위 +20%',
        badge: `Lv.${nextLv}/5`,
        stars: formatStars(nextLv, 5),
        evolutionHints: evoHints,
        evolutionHint: evoHints[0] || null,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'area');
        }
      });

      // 4) [무기 투사체 / 연속공격 증가 강화]
      if (key !== 'sanctuary' && key !== 'heavenlySanctuary') {
        let countTitle = `${w.name} 투사체 증가`;
        let countDesc = `투사체 수를 늘립니다.`;
        let countEffect = '투사체 +1개';

        if (key === 'sword' || key === 'axe' || key === 'whip' || key === 'bladeStorm') {
          countTitle = `${w.name} 연속공격`;
          countEffect = '연속 공격 +1회';
          if (key === 'sword') {
            countDesc = `공격 횟수를 추가합니다.`;
          } else if (key === 'axe') {
            countDesc = `공격 횟수를 추가합니다.`;
          } else if (key === 'whip') {
            countDesc = `공격 횟수를 추가합니다.`;
          } else if (key === 'bladeStorm') {
            countDesc = `공격 횟수를 추가합니다.`;
          }
        } else {
          countTitle = `${w.name} 투사체 증가`;
          if (key === 'shotgun' || key === 'teslaShotgun' || key === 'scatterShuriken') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +2개';
          } else if (key === 'shuriken') {
            countDesc = `표창 개수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'magicMissile') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'fireWand') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'lightningRing') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'holyWater') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'morningstarTempest') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'apocalypseComet') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'poisonDagger') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'frostOrb') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'venomBlizzard') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'windBow') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'shadowOrb') {
            countDesc = `보주의 수를 늘립니다.`;
            countEffect = '보주 +1개';
          } else if (key === 'cycloneBow') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '투사체 +1개';
          } else if (key === 'eclipseSpiral') {
            countDesc = `보주의 수를 늘립니다.`;
            countEffect = '보주 +1개';
          } else if (key === 'flamePillar') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '화염 기둥 +1개';
          } else if (key === 'chakram') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '차크람 +1개';
          } else if (key === 'holyCross') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '십자가 +1개';
          } else if (key === 'infernoCataclysm') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '기둥 +1개';
          } else if (key === 'shadowVortex') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '차크람 +1개';
          } else if (key === 'divineJudgement') {
            countDesc = `투사체 수를 늘립니다.`;
            countEffect = '십자가 +1개';
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
          evolutionHints: evoHints,
          evolutionHint: evoHints[0] || null,
          apply: () => {
            this.weaponManager.upgradeWeapon(key, 'count');
          }
        });
      }
    }

    // 4. 캐릭터 패시브 스탯 카드 (총 16종 중 최대 6종 슬롯 제한)
    const ownedPassiveKeys = Object.keys(this.player.ownedPassives);
    const canAcquireNewPassive = ownedPassiveKeys.length < 6;

    const passiveDefinitions = [
      {
        id: 'stat_armor',
        title: '철벽 갑옷',
        icon: '🛡️',
        iconKey: 'icon_armor',
        desc: '받는 피해를 감쇄합니다.',
        effectText: '방어력 +1 & 피해 4% 경감',
        maxLevel: 5,
        apply: () => { this.player.armor += 1; }
      },
      {
        id: 'stat_speed',
        title: '장화',
        icon: '👟',
        iconKey: 'icon_speed',
        desc: '이동 속도를 증가합니다.',
        effectText: '이동 속도 +15%', // +12% -> +15% 상향 (무빙 회피 생존력 보장)
        maxLevel: 5,
        apply: () => { this.player.speed += this.player.baseSpeed * 0.15; }
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
        desc: '체력을 지속 회복합니다.',
        effectText: '초당 회복 +0.9 HP/s',
        maxLevel: 5,
        apply: () => { this.player.hpRegen += 0.9; }
      },
      {
        id: 'stat_hp',
        title: '거인의 심장',
        icon: '❤️',
        iconKey: 'icon_hp',
        desc: '최대 체력을 증가시킵니다.',
        effectText: '최대 체력 +25',
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
        effectText: '쿨타임 감소 -4%',
        maxLevel: 5,
        apply: () => {
          // 레벨당 4.5% 가속 적용 (5레벨 달성 시 1.045^5 = 1.246배 가속, 실질 쿨타임 약 20% 감소로 말뚝딜 억제)
          this.player.globalCooldownMult *= 1.045;
        }
      },
      {
        id: 'stat_magnet',
        title: '자력의 부적',
        icon: '🧲',
        iconKey: 'icon_magnet',
        desc: '자석 반경을 확장합니다.',
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
        iconKey: 'icon_area',
        desc: '공격 범위를 확대합니다.',
        effectText: '공격 범위 +30%',
        maxLevel: 3,
        apply: () => { this.player.bonusAreaMult = (this.player.bonusAreaMult || 1.0) + 0.30; }
      },
      {
        id: 'stat_proj_count',
        title: '복제의 오브',
        icon: '🪞',
        iconKey: 'icon_proj_count',
        desc: '투사체 수를 영구 증가시킵니다.',
        effectText: '투사체 +1',
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
        desc: '투사체가 빨라집니다.',
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
        desc: '치명타&드랍률이 증가합니다.',
        effectText: '치명률 +10% & 드랍률 +15%',
        maxLevel: 5,
        apply: () => {
          this.player.critChance = (this.player.critChance || 0) + 0.10;
          this.player.dropRateBonus = (this.player.dropRateBonus || 0.0) + 0.15;
        }
      },
      {
        id: 'stat_crown',
        title: '지혜의 왕관',
        icon: '👑',
        iconKey: 'icon_crown',
        desc: '경험치 획득량이 증가합니다.',
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
        desc: '처치시 일정 확률로 체력을 회복합니다.',
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
        desc: '주기적으로 피격을 무효화 합니다.',
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
        desc: '치명률이 상승하고, 치명타 피해량이 증가합니다.',
        effectText: '치명률 +4% & 치명 피해량 +35%',
        maxLevel: 5,
        apply: () => {
          const curLv = (this.player.ownedPassives['stat_crit_dmg']?.level || 0) + 1;
          this.player.critChance = (this.player.critChance || 0) + 0.04;
          this.player.critDamageMult = 2.0 + curLv * 0.35;
        }
      },
      {
        id: 'stat_thorns',
        title: '가시갑옷',
        icon: '🛡️🌵',
        iconKey: 'icon_thorns',
        desc: '피격 시 받은 피해를 되돌려줍니다.',
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
      desc: '즉시 치료합니다.',
      effectText: '체력 +35',
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
