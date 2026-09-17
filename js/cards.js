// 레벨업 카드 시스템: 무기 강화, 신규 무기 해금, 진화 무기 합성, 캐릭터 패시브 강화
// 1. 캐릭터 패시브 스탯은 최대 5종만 인벤토리에 장착 가능 (각 6강 제한, 투사체 3강)
// 2. 무기 슬롯 최대 5개 제한 (각 무기 총 6강 제한)
// 3. 진화 무기 3대 체계:
//    - 회전 도끼 (spinningAxe) = 일반 검 (sword 6강) + 도끼 (axe 6강)
//    - 칼날 채찍 (bladeWhip) = 채찍 (whip 6강) + 던지는 단검 (throwingDagger 6강)
//    - 홀리 산탄총 (holyShotgun) = 산탄 총포 (shotgun 6강) + 성수 (holyWater 6강)

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

  generateCards() {
    const cardPool = [];

    // 진화 링크 파트너 6강 달성 여부 검사 헬퍼
    const getEvolutionHint = (weaponKey) => {
      const evoPairs = {
        axe: { partner: 'sword', evoName: '회전 도끼', evoIcon: '🪓' },
        sword: { partner: 'axe', evoName: '회전 도끼', evoIcon: '🪓' },
        throwingDagger: { partner: 'whip', evoName: '칼날 채찍', evoIcon: '⛓️' },
        whip: { partner: 'throwingDagger', evoName: '칼날 채찍', evoIcon: '⛓️' },
        holyWater: { partner: 'shotgun', evoName: '홀리 산탄총', evoIcon: '✨' },
        acidPool: { partner: 'shotgun', evoName: '홀리 산탄총', evoIcon: '✨' },
        shotgun: { partner: 'holyWater', evoName: '홀리 산탄총', evoIcon: '✨' }
      };

      const pair = evoPairs[weaponKey];
      if (!pair) return null;

      const partnerWeapon = this.weaponManager.weapons[pair.partner];
      if (partnerWeapon && this.weaponManager.getTotalUpgrades(partnerWeapon) >= 6) {
        return {
          partnerName: partnerWeapon.name.split(' ')[0], // 간단한 명칭
          evoName: pair.evoName,
          evoIcon: pair.evoIcon
        };
      }
      return null;
    };

    // 1. 미보유 무기 해금 카드 (최대 5개 무기 슬롯 제한)
    const ownedWeaponsCount = Object.keys(this.weaponManager.weapons).length;
    const allWeaponKeys = ['axe', 'whip', 'throwingDagger', 'magicMissile', 'shotgun', 'holyWater', 'sanctuary'];
    const unownedWeapons = allWeaponKeys.filter(k => !this.weaponManager.weapons[k]);

    const weaponMeta = {
      sword: { name: '일반 검', icon: '🗡️', iconKey: 'icon_sword', desc: '바라보는 방향으로 날렵하게 검을 휘둘러 베기' },
      axe: { name: '도끼', icon: '🪓', iconKey: 'icon_axe', desc: '주변을 원형으로 크게 베어내며 적을 밀쳐냄' },
      whip: { name: '채찍', icon: '🪢', iconKey: 'icon_whip', desc: '사거리가 길며 강화에 따라 전방과 후방을 번갈아 교차 연타' },
      throwingDagger: { name: '던지는 단검', icon: '🔪', iconKey: 'icon_dagger', desc: '가장 가까운 몬스터를 향해 직진 관통 투사체 투척 (사거리 290px)' },
      magicMissile: { name: '마법 화살', icon: '🔮', iconKey: 'icon_missile', desc: '가장 가까운 적을 유도 추적하는 마법 탄환' },
      shotgun: { name: '산탄 총포', icon: '💥', iconKey: 'icon_shotgun', desc: '바라보는 방향으로 부채꼴 형태의 산탄 일제 사격 (데미지 2배 상향)' },
      holyWater: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판 생성' },
      sanctuary: { name: '성역', icon: '⛪', iconKey: 'icon_holywater', desc: '플레이어를 감싸는 360도 원형 결계로 적들에게 매초 도트 피해 부여 (공속 영향 없음)' },
      acidPool: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판 생성' }
    };

    if (ownedWeaponsCount < 5) {
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
          badge: 'NEW WEAPON',
          stars: '',
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.unlockWeapon(key);
          }
        });
      });
    }

    // 2. 특수 진화 무기 합성 카드 (3종)
    const evolutionCards = [];

    // [진화 1] 회전 도끼 = 일반 검(6강) + 도끼(6강)
    const wSword = this.weaponManager.weapons['sword'];
    const wAxe = this.weaponManager.weapons['axe'];
    const hasSpinningAxe = !!this.weaponManager.weapons['spinningAxe'];

    if (wSword && wAxe && !hasSpinningAxe) {
      const swordUpgrades = this.weaponManager.getTotalUpgrades(wSword);
      const axeUpgrades = this.weaponManager.getTotalUpgrades(wAxe);

      if (swordUpgrades >= 6 && axeUpgrades >= 6) {
        evolutionCards.push({
          id: 'evolve_spinning_axe',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 회전 도끼',
          icon: '🪓',
          iconKey: 'icon_axe',
          desc: '일반 검과 도끼를 합성 진화합니다! 두 무기가 흡수 소멸되며 플레이어 주위를 초고속 회전하는 거대 도끼들이 형성됩니다. (무기 슬롯 1칸 반환)',
          effectText: '두 무기 합성 -> [진화 무기: 회전 도끼]',
          badge: 'EVOLUTION',
          stars: '★★★★★★',
          apply: () => {
            delete this.weaponManager.weapons['sword'];
            delete this.weaponManager.weapons['axe'];
            this.weaponManager.unlockWeapon('spinningAxe');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#f59e0b', 40);
              window.game.addParticles(this.player.x, this.player.y, '#ef4444', 40);
            }
          }
        });
      }
    }

    // [진화 2] 칼날 채찍 = 채찍(6강) + 던지는 단검(6강)
    const wWhip = this.weaponManager.weapons['whip'];
    const wThrowingDagger = this.weaponManager.weapons['throwingDagger'];
    const hasBladeWhip = !!this.weaponManager.weapons['bladeWhip'];

    if (wWhip && wThrowingDagger && !hasBladeWhip) {
      const whipUpgrades = this.weaponManager.getTotalUpgrades(wWhip);
      const daggerUpgrades = this.weaponManager.getTotalUpgrades(wThrowingDagger);

      if (whipUpgrades >= 6 && daggerUpgrades >= 6) {
        evolutionCards.push({
          id: 'evolve_blade_whip',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 칼날 채찍',
          icon: '⛓️',
          iconKey: 'icon_whip',
          desc: '채찍과 던지는 단검을 합성 진화합니다! 채찍 끝에 날카로운 단검들이 엮여 초장거리 광역 부채꼴로 전후방을 휩쓸어버립니다. (무기 슬롯 1칸 반환)',
          effectText: '두 무기 합성 -> [진화 무기: 칼날 채찍]',
          badge: 'EVOLUTION',
          stars: '★★★★★★',
          apply: () => {
            delete this.weaponManager.weapons['whip'];
            delete this.weaponManager.weapons['throwingDagger'];
            this.weaponManager.unlockWeapon('bladeWhip');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 40);
              window.game.addParticles(this.player.x, this.player.y, '#fbbf24', 40);
            }
          }
        });
      }
    }

    // [진화 3] 홀리 산탄총 = 산탄 총포(6강) + 성수(6강)
    const wShotgun = this.weaponManager.weapons['shotgun'];
    const wHolyWater = this.weaponManager.weapons['holyWater'] || this.weaponManager.weapons['acidPool'];
    const hasHolyShotgun = !!this.weaponManager.weapons['holyShotgun'];

    if (wShotgun && wHolyWater && !hasHolyShotgun) {
      const shotgunUpgrades = this.weaponManager.getTotalUpgrades(wShotgun);
      const holyWaterUpgrades = this.weaponManager.getTotalUpgrades(wHolyWater);

      if (shotgunUpgrades >= 6 && holyWaterUpgrades >= 6) {
        evolutionCards.push({
          id: 'evolve_holy_shotgun',
          type: 'weapon_evolution',
          category: 'evolution',
          title: '[진화] 홀리 산탄총',
          icon: '✨',
          iconKey: 'icon_holyshotgun',
          desc: '산탄 총포와 성수를 합성 진화합니다! 성스러운 산탄들을 일제히 사격하며, 탄환 적중 시 좁은 반경의 성스러운 폭발을 일으킵니다. (무기 슬롯 1칸 반환)',
          effectText: '두 무기 합성 -> [진화 무기: 홀리 산탄총]',
          badge: 'EVOLUTION',
          stars: '★★★★★★',
          apply: () => {
            delete this.weaponManager.weapons['shotgun'];
            delete this.weaponManager.weapons['holyWater'];
            delete this.weaponManager.weapons['acidPool'];
            this.weaponManager.unlockWeapon('holyShotgun');
            sounds.playVictory();
            if (window.game) {
              window.game.addParticles(this.player.x, this.player.y, '#fef08a', 40);
              window.game.addParticles(this.player.x, this.player.y, '#38bdf8', 40);
            }
          }
        });
      }
    }

    // 3. 보유 중인 무기별 강화 카드 (무기당 총합 6회 제한)
    for (const key in this.weaponManager.weapons) {
      if (key === 'spinningAxe' || key === 'bladeWhip' || key === 'holyShotgun') continue;
      const w = this.weaponManager.weapons[key];
      const totalUpgrades = this.weaponManager.getTotalUpgrades(w);

      if (totalUpgrades >= 6) continue;

      const nextLv = totalUpgrades + 1;
      const meta = weaponMeta[key] || { icon: '⚔️', iconKey: 'icon_atk' };
      const evoHint = getEvolutionHint(key);

      // [무기 공속 강화] - 성역(sanctuary)은 공속 영향 없으므로 제외
      if (key !== 'sanctuary') {
        cardPool.push({
          id: `${key}_speed`,
          type: 'weapon_upgrade',
          category: 'weapon',
          title: `${w.name} 공속`,
          icon: '⚡',
          iconKey: meta.iconKey,
          desc: `발사 주기 및 공격 속도를 단축합니다. (무기 총강화 ${nextLv}/6)`,
          effectText: '공격 속도 +10%',
          badge: `Lv.${nextLv}/6`,
          stars: formatStars(nextLv, 6),
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.upgradeWeapon(key, 'speed');
          }
        });
      } else {
        // 성역 전용 피해 강화
        cardPool.push({
          id: `sanctuary_speed`,
          type: 'weapon_upgrade',
          category: 'weapon',
          title: `성역 결계 강화`,
          icon: '⚡',
          iconKey: meta.iconKey,
          desc: `성역 결계의 정화 도트 피해를 증폭시킵니다. (무기 총강화 ${nextLv}/6)`,
          effectText: '결계 피해 +25%',
          badge: `Lv.${nextLv}/6`,
          stars: formatStars(nextLv, 6),
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.upgradeWeapon('sanctuary', 'speed');
          }
        });
      }

      // [무기 연타 / 투사체 수 강화] (최대 3회)
      if (w.countLevel < 3) {
        let countTitle = `${w.name} 연타수`;
        let countDesc = `공격 횟수를 늘립니다.`;
        let countEffect = '공격 횟수 +1회';

        if (key === 'whip') {
          countTitle = `${w.name} 전후방 교차`;
          countDesc = `채찍을 전방과 후방으로 번갈아 연타하는 교차 타격 횟수를 늘립니다. (최대 앞3 뒤3)`;
          countEffect = '전후방 교차 타격 +1회';
        } else if (key === 'sword') {
          countTitle = `${w.name} 연속베기`;
          countDesc = `검을 전방으로 빠르게 연속 휘두르는 콤보 베기 횟수를 추가합니다.`;
          countEffect = '연속 콤보 베기 +1회';
        } else if (key === 'axe') {
          countTitle = `${w.name} 연속휘두르기`;
          countDesc = `도끼를 연속으로 크게 회전시키는 콤보 횟수를 추가합니다.`;
          countEffect = '연속 회전 베기 +1회';
        } else if (key === 'throwingDagger' || key === 'shotgun' || key === 'magicMissile') {
          countTitle = `${w.name} 투사체 수`;
          countDesc = `동시에 투척/발사하는 투사체 개수를 늘립니다.`;
          countEffect = '투사체 개수 +1개';
        } else if (key === 'holyWater' || key === 'acidPool') {
          countTitle = `${w.name} 장판 수`;
          countDesc = `동시에 투척/생성하는 성수 정화 장판 개수를 늘립니다.`;
          countEffect = '정화 장판 개수 +1개';
        } else if (key === 'sanctuary') {
          countTitle = `성역 밀도 강화`;
          countDesc = `성스러운 결계의 밀도를 높여 도트 피해를 가속합니다.`;
          countEffect = '결계 피해 +25%';
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
          badge: `Lv.${nextLv}/6`,
          stars: formatStars(nextLv, 6),
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.upgradeWeapon(key, 'count');
          }
        });
      }

      // [무기 범위 강화]
      cardPool.push({
        id: `${key}_area`,
        type: 'weapon_upgrade',
        category: 'weapon',
        title: `${w.name} 범위`,
        icon: '🎯',
        iconKey: meta.iconKey,
        desc: `무기의 타격 반경 및 결계 크기를 확대합니다. (무기 총강화 ${nextLv}/6)`,
        effectText: '공격 범위 +20%',
        badge: `Lv.${nextLv}/6`,
        stars: formatStars(nextLv, 6),
        evolutionHint: evoHint,
        apply: () => {
          this.weaponManager.upgradeWeapon(key, 'area');
        }
      });

      // [원거리 무기 전용: 투사체 비행 속도 강화]
      if (key === 'magicMissile' || key === 'shotgun' || key === 'throwingDagger') {
        cardPool.push({
          id: `${key}_proj_speed`,
          type: 'weapon_upgrade',
          category: 'weapon',
          title: `${w.name} 탄속`,
          icon: '💨',
          iconKey: 'icon_proj_speed',
          desc: `발사된 탄환과 단검의 비행 속도를 증가시킵니다. (무기 총강화 ${nextLv}/6)`,
          effectText: '투사체 속도 +18%',
          badge: `Lv.${nextLv}/6`,
          stars: formatStars(nextLv, 6),
          evolutionHint: evoHint,
          apply: () => {
            this.weaponManager.upgradeWeapon(key, 'speedProj');
          }
        });
      }
    }

    // 4. 캐릭터 패시브 스탯 카드 (총 10종 중 최대 5종 슬롯 제한)
    const ownedPassiveKeys = Object.keys(this.player.ownedPassives);
    const canAcquireNewPassive = ownedPassiveKeys.length < 5;

    const passiveDefinitions = [
      {
        id: 'stat_armor',
        title: '철벽 갑옷 (방어력)',
        icon: '🛡️',
        iconKey: 'icon_armor',
        desc: '받는 모든 피해량을 고정 감소시킵니다. (최소 1)',
        effectText: '방어력 +1',
        maxLevel: 6,
        apply: () => { this.player.armor += 1; }
      },
      {
        id: 'stat_speed',
        title: '바람의 장화 (이속)',
        icon: '👟',
        iconKey: 'icon_speed',
        desc: '플레이어 이동 속도를 증가시킵니다.',
        effectText: '이동 속도 +12%',
        maxLevel: 6,
        apply: () => { this.player.speed += this.player.baseSpeed * 0.12; }
      },
      {
        id: 'stat_atk',
        title: '피의 계약 (공격력)',
        icon: '🩸',
        iconKey: 'icon_atk',
        desc: '모든 무기의 타격 공격력을 대폭 증폭시킵니다.',
        effectText: '전체 공격력 +50%',
        maxLevel: 6,
        apply: () => { this.player.atkPowerMult += 0.50; }
      },
      {
        id: 'stat_regen',
        title: '재생의 반지 (체젠)',
        icon: '💍',
        iconKey: 'icon_regen',
        desc: '매초 플레이어의 체력을 지속 회복합니다.',
        effectText: '초당 체력 회복 +1.5 HP/s',
        maxLevel: 6,
        apply: () => { this.player.hpRegen += 1.5; }
      },
      {
        id: 'stat_hp',
        title: '거인의 심장 (최대체력)',
        icon: '❤️',
        iconKey: 'icon_hp',
        desc: '최대 체력을 증가시키고 체력을 즉시 일부 회복합니다.',
        effectText: '최대 체력 +25 & 회복 +25',
        maxLevel: 6,
        apply: () => {
          this.player.maxHp += 25;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
        }
      },
      {
        id: 'stat_global_speed',
        title: '황혼의 시계 (전체 쿨감)',
        icon: '⏳',
        iconKey: 'icon_global_speed',
        desc: '모든 장착 무기의 재사용 대기시간을 단축합니다.',
        effectText: '전체 무기 쿨다운 -15%',
        maxLevel: 6,
        apply: () => { this.player.globalCooldownMult *= 1.15; }
      },
      {
        id: 'stat_magnet',
        title: '자력의 부적 (자석 범위)',
        icon: '🧲',
        iconKey: 'item_magnet',
        desc: '경험치 보석을 흡수하는 자석 반경을 대폭 확장합니다.',
        effectText: '보석 흡수 반경 +60px',
        maxLevel: 6,
        apply: () => { this.player.magnetRadius += 60; }
      },
      {
        id: 'stat_area',
        title: '확장의 룬 (공격 범위)',
        icon: '🎯',
        iconKey: 'icon_axe',
        desc: '모든 무기의 공격 판정 및 이펙트 크기를 확대합니다.',
        effectText: '전체 공격 범위 +30%',
        maxLevel: 6,
        apply: () => { this.player.bonusAreaMult = (this.player.bonusAreaMult || 1.0) + 0.30; }
      },
      {
        id: 'stat_proj_count',
        title: '복제의 오브 (투사체+)',
        icon: '🪞',
        iconKey: 'icon_proj_count',
        desc: '모든 투사체 무기 및 연속 연타 공격 횟수를 영구 증가시킵니다. (최대 3회)',
        effectText: '전체 투사체/연타 횟수 +1',
        maxLevel: 3,
        apply: () => {
          this.player.bonusProjectiles = Math.min(3, (this.player.bonusProjectiles || 0) + 1);
        }
      },
      {
        id: 'stat_proj_speed',
        title: '질풍의 깃털 (원거리 탄속)',
        icon: '🪶',
        iconKey: 'icon_proj_speed',
        desc: '원거리 무기(단검, 마법화살, 산탄)의 탄속을 대폭 증가시킵니다.',
        effectText: '원거리 탄속 +20%',
        maxLevel: 6,
        apply: () => {
          this.player.bonusProjSpeedMult = (this.player.bonusProjSpeedMult || 1.0) * 1.20;
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
        title: isOwned ? `${stat.title}` : `[패시브] ${stat.title}`,
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
      title: '성수 포션 (긴급 회복)',
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
