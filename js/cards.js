// 레벨업 카드 시스템: 무기 강화, 신규 무기 해금, 진화 무기 합성, 캐릭터 패시브 강화
// 1. 캐릭터 패시브 스탯은 최대 6종만 인벤토리에 장착 가능 (각 5강 제한, 범위 3강, 투사체 2강)
// 2. 무기 슬롯 최대 6개 제한 (각 무기 총 5레벨 MAX 제한)
// 3. 5대 정통 진화 무기 체계:
//    - 천상의 성역 (heavenlySanctuary) = 성역 (sanctuary 5렙) + 성수 (holyWater 5렙)
//    - 모닝스타 선풍 (morningstarTempest) = 모닝스타 채찍 (whip 5렙) + 표창 (shuriken 5렙)
//    - 멸망의 혜성 (apocalypseComet) = 화염 지팡이 (fireWand 5렙) + 마법 화살 (magicMissile 5렙)
//    - 학살자의 폭풍검 (slayerBladeStorm) = 일반 검 (sword 5렙) + 도끼 (axe 5렙)
//    - 테슬라 뇌전포 (teslaShotgun) = 산탄 총포 (shotgun 5렙) + 번개 반지 (lightningRing 5렙)

function formatStars(currentLevel, maxLevel) {
  const filled = Math.min(currentLevel, maxLevel);
  const empty = Math.max(0, maxLevel - filled);
  return '★'.repeat(filled) + '☆'.repeat(empty);
}

class CardManager {
  constructor(player, weaponManager) {
    this.player = player;
    this.weaponManager = weaponManager;
  }

  // 게임 시작 시 3종의 기본 무기 중 1개를 선택 (패시브 제외)
  generateStartingWeaponCards() {
    const starterKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand'];
    const weaponMeta = {
      sword: { name: '철검', icon: '🗡️', iconKey: 'icon_sword', desc: '가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다.' },
      axe: { name: '도끼', icon: '🪓', iconKey: 'icon_axe', desc: '주변을 원형으로 크게 베어내며 적을 밀쳐냅니다.' },
      whip: { name: '채찍', icon: '🪢', iconKey: 'icon_whip', desc: '가장 가까운 적을 자동 조준하여 휘두르고, 강화에 따라 반대 방향과 번갈아 교차 강타합니다.' },
      shuriken: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전하며 관통하는 표창을 던집니다.' },
      throwingDagger: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전하며 관통하는 표창을 던집니다.' },
      magicMissile: { name: '마법 화살', icon: '🔮', iconKey: 'icon_missile', desc: '가장 가까운 적을 유도 추적하는 마법 탄환을 발사합니다.' },
      shotgun: { name: '산탄 총포', icon: '💥', iconKey: 'icon_shotgun', desc: '바라보는 방향으로 부채꼴 형태의 산탄을 일제 사격합니다.' },
      holyWater: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.' },
      sanctuary: { name: '성역', icon: '⛪', iconKey: 'icon_sanctuary', desc: '플레이어를 감싸는 원형 결계로 적들에게 매초 도트 피해를 입힙니다.' },
      lightningRing: { name: '번개 반지', icon: '⚡', iconKey: 'icon_lightning', desc: '무작위 적의 머리 위로 하늘에서 벼락을 내리꽂아 반경 범위 피해를 입힙니다.' },
      fireWand: { name: '화염 지팡이', icon: '🔥', iconKey: 'icon_firewand', desc: '가장 가까운 적을 향해 화염구를 발사하며, 명중 시 폭발하여 광역 피해를 입힙니다.' }
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

    // 진화 링크 힌트 헬퍼: 5대 진화 조합 안내 (주 5렙 + 부 5렙 조건)
    const getEvolutionHint = (weaponKey) => {
      const evoPairs = {
        // [진화 1] 성역 + 성수 = 천상의 성역
        sanctuary: { partner: 'holyWater', partnerKor: '성수', evoId: 'heavenlySanctuary', evoName: '천상의 성역', evoIcon: '⛪✨' },
        holyWater: { partner: 'sanctuary', partnerKor: '성역', evoId: 'heavenlySanctuary', evoName: '천상의 성역', evoIcon: '⛪✨' },
        acidPool: { partner: 'sanctuary', partnerKor: '성역', evoId: 'heavenlySanctuary', evoName: '천상의 성역', evoIcon: '⛪✨' },

        // [진화 2] 채찍 + 표창 = 모닝스타 선풍
        whip: { partner: 'shuriken', partnerKor: '표창', evoId: 'morningstarTempest', evoName: '모닝스타 선풍', evoIcon: '⛓️🌪️' },
        shuriken: { partner: 'whip', partnerKor: '채찍', evoId: 'morningstarTempest', evoName: '모닝스타 선풍', evoIcon: '⛓️🌪️' },
        throwingDagger: { partner: 'whip', partnerKor: '채찍', evoId: 'morningstarTempest', evoName: '모닝스타 선풍', evoIcon: '⛓️🌪️' },

        // [진화 3] 화염 지팡이 + 마법 화살 = 멸망의 혜성
        fireWand: { partner: 'magicMissile', partnerKor: '마법 화살', evoId: 'apocalypseComet', evoName: '멸망의 혜성', evoIcon: '☄️🔥' },
        magicMissile: { partner: 'fireWand', partnerKor: '화염 지팡이', evoId: 'apocalypseComet', evoName: '멸망의 혜성', evoIcon: '☄️🔥' },

        // [진화 4] 철검 + 도끼 = 학살자의 폭풍검
        sword: { partner: 'axe', partnerKor: '도끼', evoId: 'slayerBladeStorm', evoName: '학살자의 폭풍검', evoIcon: '⚔️🌪️' },
        axe: { partner: 'sword', partnerKor: '철검', evoId: 'slayerBladeStorm', evoName: '학살자의 폭풍검', evoIcon: '⚔️🌪️' },

        // [진화 5] 산탄 총포 + 번개 반지 = 테슬라 뇌전포
        shotgun: { partner: 'lightningRing', partnerKor: '번개 반지', evoId: 'teslaShotgun', evoName: '테슬라 뇌전포', evoIcon: '⚡💥' },
        lightningRing: { partner: 'shotgun', partnerKor: '산탄 총포', evoId: 'teslaShotgun', evoName: '테슬라 뇌전포', evoIcon: '⚡💥' }
      };

      const pair = evoPairs[weaponKey];
      if (!pair) return null;

      // 이미 해당 진화 무기를 보유하고 있다면 힌트 표시 불필요
      if (this.weaponManager.weapons[pair.evoId]) return null;

      const currentWeapon = this.weaponManager.weapons[weaponKey];
      const partnerWeapon = this.weaponManager.weapons[pair.partner];

      // 인벤토리에 조합 파트너 무기가 없다면 힌트 박스 미표시
      if (!partnerWeapon) return null;

      const currentLv = currentWeapon ? this.weaponManager.getLevel(currentWeapon) : 0;
      const partnerLv = this.weaponManager.getLevel(partnerWeapon);

      // 조건 충족: 본인 5렙(MAX) + 파트너 5렙(MAX)
      const isReady = (currentLv >= 5 && partnerLv >= 5);
      if (isReady) {
        return {
          status: 'ready',
          evoName: pair.evoName,
          evoIcon: pair.evoIcon,
          text: `✨ ${pair.evoName} (진화 가능)`
        };
      }

      // 파트너 무기 보유 중일 때 진화 무기 명칭만 심플하게 표시
      return {
        status: 'linked',
        evoName: pair.evoName,
        evoIcon: pair.evoIcon,
        text: pair.evoName
      };
    };

    // 1. 미보유 무기 해금 카드 (최대 6개 무기 슬롯 제한)
    const ownedWeaponsCount = Object.keys(this.weaponManager.weapons).length;
    const allWeaponKeys = ['sword', 'axe', 'whip', 'shuriken', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary', 'lightningRing', 'fireWand'];

    // 이미 진화에 소모되었거나 현재 보유 중인 진화 무기의 재료 무기는 카드 풀에서 영구 제외
    const evolvedMaterialPairs = {
      heavenlySanctuary: ['sanctuary', 'holyWater', 'acidPool'],
      morningstarTempest: ['whip', 'shuriken', 'throwingDagger'],
      apocalypseComet: ['fireWand', 'magicMissile'],
      slayerBladeStorm: ['sword', 'axe'],
      teslaShotgun: ['shotgun', 'lightningRing']
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

      // 5대 진화 무기 메타
      heavenlySanctuary: { name: '천상의 성역', type: '도트', icon: '⛪✨', iconKey: 'icon_heavenlysanctuary', desc: '초대형 룬 결계와 적 빙결(동결) 효과' },
      morningstarTempest: { name: '모닝스타 선풍', type: '원거리', icon: '⛓️🌪️', iconKey: 'icon_morningstartempest', desc: '채찍 전후방 교차 타격 및 첫 적중 시 4방향 관통 표창 방출' },
      apocalypseComet: { name: '멸망의 혜성', type: '원거리', icon: '☄️🔥', iconKey: 'icon_apocalypsecomet', desc: '유도 화염 혜성 연사 및 헬파이어 연쇄 폭발' },
      slayerBladeStorm: { name: '학살자의 폭풍검', type: '근접', icon: '⚔️🌪️', iconKey: 'icon_slayerbladestorm', desc: '초고속 상시 궤도 회전 대검·도끼 근접 방쇄' },
      teslaShotgun: { name: '테슬라 뇌전포', type: '원거리', icon: '⚡💥', iconKey: 'icon_teslashotgun', desc: '고전압 뇌전 산탄 일제 사격 및 체인 라이트닝·낙뢰 폭격' }
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

    // [진화 1] 천상의 성역 = 성역(5Lv) + 성수(5Lv)
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
          title: '[진화] 천상의 성역',
          icon: '⛪✨',
          iconKey: 'icon_heavenlysanctuary',
          desc: '성역과 성수를 합성 진화합니다! 두 무기가 흡수 소멸되며 플레이어 주위에 초대형 룬 결계가 형성되고 도트 피해 시 낮은 확률로 적을 얼립니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '성역(5Lv) + 성수(5Lv) 합성 -> [천상의 성역 1Lv]',
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

    // [진화 2] 모닝스타 선풍 = 모닝스타 채찍(5Lv) + 표창(5Lv)
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
          title: '[진화] 모닝스타 선풍',
          icon: '⛓️🌪️',
          iconKey: 'icon_morningstartempest',
          desc: '채찍과 표창을 합성 진화합니다! 채찍을 전후방으로 휘두르며 첫 번째 적중 위치에서 4방향으로 관통 표창이 폭쇄 방출됩니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '채찍(5Lv) + 표창(5Lv) 합성 -> [모닝스타 선풍 1Lv]',
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

    // [진화 3] 멸망의 혜성 = 화염 지팡이(5Lv) + 마법 화살(5Lv)
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
          title: '[진화] 멸망의 혜성',
          icon: '☄️🔥',
          iconKey: 'icon_apocalypsecomet',
          desc: '화염 지팡이와 마법 화살을 합성 진화합니다! 유도 추적 초고열 화염 혜성을 연속 투하하여 헬파이어 연쇄 폭발을 일으킵니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '화염 지팡이(5Lv) + 마법 화살(5Lv) 합성 -> [멸망의 혜성 1Lv]',
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

    // [진화 4] 학살자의 폭풍검 = 철검(5Lv) + 도끼(5Lv)
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
          title: '[진화] 학살자의 폭풍검',
          icon: '⚔️🌪️',
          iconKey: 'icon_slayerbladestorm',
          desc: '철검과 도끼를 합성 진화합니다! 거대 대검과 도끼들이 플레이어 주위를 초고속 상시 회전하며 접근하는 모든 적을 갈아냅니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '철검(5Lv) + 도끼(5Lv) 합성 -> [학살자의 폭풍검 1Lv]',
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

    // [진화 5] 테슬라 뇌전포 = 산탄 총포(5Lv) + 번개 반지(5Lv)
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
          title: '[진화] 테슬라 뇌전포',
          icon: '⚡💥',
          iconKey: 'icon_teslashotgun',
          desc: '산탄 총포와 번개 반지를 합성 진화합니다! 고전압 뇌전 산탄을 일제 사격하며 체인 라이트닝과 하늘에서 벼락이 동시 폭격됩니다. (1Lv 획득, 슬롯 1칸 반환)',
          effectText: '산탄 총포(5Lv) + 번개 반지(5Lv) 합성 -> [테슬라 뇌전포 1Lv]',
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
        effectText: '쿨타임 -10%',
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
        title: '바람의 장화',
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
        effectText: '초당 체력 회복 +1.5 HP/s',
        maxLevel: 5,
        apply: () => { this.player.hpRegen += 1.5; }
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
        effectText: '쿨타임 감소 -15%',
        maxLevel: 5,
        apply: () => { this.player.globalCooldownMult *= 1.15; }
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
        iconKey: 'icon_axe',
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
