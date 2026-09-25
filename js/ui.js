// UI 렌더러 및 이벤트 핸들러 (HUD, 모달, 모바일 가상 조이스틱)

class UIManager {
  constructor(game) {
    this.game = game;

    // HUD 엘리먼트 참조
    this.stageBadge = document.getElementById('stageBadge');
    this.timerBadge = document.getElementById('timerBadge');
    this.killBadge = document.getElementById('killBadge');
    this.goldBadge = document.getElementById('goldBadge');
    this.levelBadge = document.getElementById('levelBadge');
    this.expBarFill = document.getElementById('expBarFill');
    this.expText = document.getElementById('expText');
    this.hpBarFill = document.getElementById('hpBarFill');
    this.hpText = document.getElementById('hpText');
    this.weaponSlots = document.getElementById('weaponSlots');
    this.passiveSlots = document.getElementById('passiveSlots');

    // 로비 및 영구 업그레이드 모달
    this.lobbyModal = document.getElementById('lobbyModal');
    this.lobbyGoldText = document.getElementById('lobbyGoldText');
    this.lobbyUpgradesList = document.getElementById('lobbyUpgradesList');
    this.lobbyStartBtn = document.getElementById('lobbyStartBtn');
    this.gameOverLobbyBtn = document.getElementById('gameOverLobbyBtn');
    this.victoryLobbyBtn = document.getElementById('victoryLobbyBtn');

    // 캐릭터 선택 모달
    this.characterSelectModal = document.getElementById('characterSelectModal');
    this.charSelectBackBtn = document.getElementById('charSelectBackBtn');
    // 스테이지 선택 모달
    this.stageSelectModal = document.getElementById('stageSelectModal');
    this.stageSelectBackBtn = document.getElementById('stageSelectBackBtn');
    this.selectedCharType = 'knight';

    // 명예의 전당 챔피언 배너
    this.championBanner = document.getElementById('championBanner');
    this.champName = document.getElementById('champName');
    this.champQuote = document.getElementById('champQuote');

    // 승리 시 챔피언 입력 폼
    this.championInputSection = document.getElementById('championInputSection');
    this.championNameInput = document.getElementById('championNameInput');
    this.championQuoteInput = document.getElementById('championQuoteInput');
    this.championSubmitBtn = document.getElementById('championSubmitBtn');
    this.championSubmitSuccess = document.getElementById('championSubmitSuccess');

    // 명예의 전당 전용 랭킹 모달
    this.hallOfFameModal = document.getElementById('hallOfFameModal');
    this.hofRankList = document.getElementById('hofRankList');
    this.hofRecentCard = document.getElementById('hofRecentCard');
    this.closeHofBtn = document.getElementById('closeHofBtn');
    this.lobbyHallOfFameBtn = document.getElementById('lobbyHallOfFameBtn');
    this.victoryHallOfFameBtn = document.getElementById('victoryHallOfFameBtn');
    this.lastVictoryStats = null;

    // 모달 및 배너
    this.bossAlert = document.getElementById('bossAlert');
    this.bossAlertText = document.getElementById('bossAlertText');
    this.stageClearBanner = document.getElementById('stageClearBanner');
    this.stageBannerTitle = document.getElementById('stageBannerTitle');
    this.stageBannerSub = document.getElementById('stageBannerSub');

    this.cardModal = document.getElementById('cardModal');
    this.cardsList = document.getElementById('cardsList');
    this.cardRerollBtn = document.getElementById('cardRerollBtn');
    this.cardSkipBtn = document.getElementById('cardSkipBtn');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.gameOverStats = document.getElementById('gameOverStats');
    this.restartBtn = document.getElementById('restartBtn');
    this.victoryModal = document.getElementById('victoryModal');
    this.victoryStats = document.getElementById('victoryStats');
    this.victoryRestartBtn = document.getElementById('victoryRestartBtn');

    this.pauseModal = document.getElementById('pauseModal');
    this.pauseToggleBtn = document.getElementById('pauseToggleBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.pauseLobbyBtn = document.getElementById('pauseLobbyBtn') || document.getElementById('pauseRestartBtn');

    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    this.lobbyFullscreenBtn = document.getElementById('lobbyFullscreenBtn');

    // 키보드 카드 선택 포커스 상태
    this.focusedCardIndex = 0;
    this.activeCards = [];
    this.cardElements = [];
    this.onCardSelectCallback = null;
    this.isCardModalOpen = false;

    this.wakeLock = null;

    this.initEventListeners();
    this.initJoystick();
    this.initFullscreen();
    this.initWakeLock();
  }

  // 모바일 햅틱 진동 피드백
  triggerHaptic(pattern = 35) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // XSS 텍스트 살균
  sanitizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .slice(0, 50); // 최대 50자 제한
  }

  // 모바일 화면 꺼짐 방지 (Screen Wake Lock API)
  async initWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        document.addEventListener('visibilitychange', async () => {
          if (this.wakeLock !== null && document.visibilityState === 'visible') {
            try {
              this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {}
          }
        });
      } catch (e) {}
    }
  }

  // 전체화면 및 가로 모드 토글 (로비 및 HUD 양쪽 동기화)
  initFullscreen() {
    const toggle = async () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        }
        // 지원 브라우저 가로 화면 락 시도
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
        this.updateFullscreenButtons(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
        this.updateFullscreenButtons(false);
      }
    };

    if (this.fullscreenToggleBtn) {
      this.fullscreenToggleBtn.addEventListener('click', toggle);
    }
    if (this.lobbyFullscreenBtn) {
      this.lobbyFullscreenBtn.addEventListener('click', toggle);
    }

    const onFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      this.updateFullscreenButtons(isFs);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  }

  updateFullscreenButtons(isFullscreen) {
    if (this.fullscreenToggleBtn) {
      this.fullscreenToggleBtn.textContent = isFullscreen ? '✖' : '⛶';
      this.fullscreenToggleBtn.title = isFullscreen ? '전체화면 종료' : '전체화면 (모바일 권장)';
    }
    if (this.lobbyFullscreenBtn) {
      this.lobbyFullscreenBtn.textContent = isFullscreen ? '✖ 전체화면 종료' : '⛶ 전체화면';
      this.lobbyFullscreenBtn.title = isFullscreen ? '전체화면 종료' : '전체화면 전환';
    }
  }

  initEventListeners() {
    if (this.pauseToggleBtn) {
      this.pauseToggleBtn.addEventListener('click', () => {
        this.game.togglePause();
      });
    }

    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => {
        this.game.resumeGame();
      });
    }

    if (this.pauseLobbyBtn) {
      this.pauseLobbyBtn.addEventListener('click', () => {
        this.hidePauseModal();
        this.game.goToLobby();
      });
    }

    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        const isMuted = sounds.toggleMute();
        this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        this.hideGameOver();
        this.game.restart();
      });
    }

    if (this.victoryRestartBtn) {
      this.victoryRestartBtn.addEventListener('click', () => {
        this.hideVictory();
        this.game.restart();
      });
    }

    // 로비 출격 버튼 -> 캐릭터 선택 모달 열기
    if (this.lobbyStartBtn) {
      this.lobbyStartBtn.addEventListener('click', () => {
        this.hideLobby();
        this.showCharacterSelect();
      });
    }

    // 캐릭터 선택 모달 뒤로가기 버튼 -> 로비 복귀
    if (this.charSelectBackBtn) {
      this.charSelectBackBtn.addEventListener('click', () => {
        this.hideCharacterSelect();
        this.showLobby();
      });
    }

    // 캐릭터 카드 및 선택 버튼 클릭 이벤트 바인딩
    const charCards = document.querySelectorAll('.char-card');
    charCards.forEach(card => {
      const charType = card.getAttribute('data-char');
      const btn = card.querySelector('.char-select-btn');

      const selectHero = () => {
        sounds.playLevelUp();
        this.selectedCharType = charType;
        this.hideCharacterSelect();
        this.showStageSelect();
      };

      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectHero();
        });
      }
      card.addEventListener('click', () => {
        selectHero();
      });
    });
    // 스테이지 선택 모달 뒤로가기 버튼 -> 영웅 선택 복귀
    if (this.stageSelectBackBtn) {
      this.stageSelectBackBtn.addEventListener('click', () => {
        this.hideStageSelect();
        this.showCharacterSelect();
      });
    }

    // 스테이지 카드 및 출격 버튼 클릭 이벤트 바인딩
    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach(card => {
      const worldNum = parseInt(card.getAttribute('data-world')) || 1;
      const btn = card.querySelector('.stage-select-btn');

      const selectStage = () => {
        sounds.playLevelUp();
        this.hideStageSelect();
        const hero = this.selectedCharType || 'knight';
        this.game.startRunWithCharacterAndStage(hero, worldNum);
      };

      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectStage();
        });
      }
      card.addEventListener('click', () => {
        selectStage();
      });
    });


    // 로비로 이동 버튼들
    if (this.gameOverLobbyBtn) {
      this.gameOverLobbyBtn.addEventListener('click', () => {
        this.game.goToLobby();
      });
    }

    if (this.victoryLobbyBtn) {
      this.victoryLobbyBtn.addEventListener('click', () => {
        this.game.goToLobby();
      });
    }

    // 챔피언 등록 버튼
    if (this.championSubmitBtn) {
      this.championSubmitBtn.addEventListener('click', () => {
        this.handleChampionSubmit();
      });
    }

    // 명예의 전당 모달 열기/닫기 이벤트 바인딩
    if (this.lobbyHallOfFameBtn) {
      this.lobbyHallOfFameBtn.addEventListener('click', () => {
        this.openHallOfFame();
      });
    }
    if (this.victoryHallOfFameBtn) {
      this.victoryHallOfFameBtn.addEventListener('click', () => {
        this.openHallOfFame();
      });
    }
    if (this.closeHofBtn) {
      this.closeHofBtn.addEventListener('click', () => {
        this.closeHallOfFame();
      });
    }
    if (this.championBanner) {
      this.championBanner.addEventListener('click', () => {
        this.openHallOfFame();
      });
    }
  }

  showPauseModal() {
    if (this.pauseModal) this.pauseModal.classList.remove('hidden');
  }

  hidePauseModal() {
    if (this.pauseModal) this.pauseModal.classList.add('hidden');
  }

  updateHUD(player, waveManager, totalTime) {
    // 1. 상단 바
    this.stageBadge.textContent = `STAGE ${waveManager.currentStage} / ${waveManager.maxStage}`;
    
    // 스테이지 남은 시간 (초 -> MM:SS)
    const sec = Math.ceil(waveManager.stageTimeLeft);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    if (waveManager.currentStage >= waveManager.maxStage && waveManager.stageTimeLeft <= 0) {
      this.timerBadge.textContent = `☠️ 사신 강림!`;
      this.timerBadge.style.color = '#ef4444';
      this.timerBadge.style.fontWeight = 'bold';
    } else {
      this.timerBadge.textContent = `⏱️ ${m}:${s}`;
      this.timerBadge.style.color = '';
      this.timerBadge.style.fontWeight = '';
    }

    this.killBadge.textContent = `💀 ${player.totalKills}`;
    if (this.goldBadge) {
      this.goldBadge.innerHTML = `<img src="assets/sprites/item_gold.png" class="coin-icon" alt="상평통보"> ${player.gold || 0}`;
    }
    this.levelBadge.textContent = `Lv. ${player.level}`;

    // 2. 경험치 바
    const expRatio = Math.min(1, player.exp / player.maxExp);
    this.expBarFill.style.width = `${(expRatio * 100).toFixed(1)}%`;
    this.expText.textContent = `EXP ${Math.floor(expRatio * 100)}%`;

    // 3. 체력 바
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    this.hpBarFill.style.width = `${(hpRatio * 100).toFixed(1)}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    // 4. 인벤토리 무기 아이콘 렌더링
    this.renderWeaponSlots(this.game.weaponManager.weapons);

    // 5. 인벤토리 패시브 스탯 아이콘 렌더링 (최대 6종 슬롯)
    this.renderPassiveSlots(player.ownedPassives);
  }

  renderWeaponSlots(weapons) {
    this.weaponSlots.innerHTML = '';
    const keys = Object.keys(weapons);
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      if (i < keys.length) {
        const key = keys[i];
        const w = weapons[key];
        const isEvolved = [
          'heavenlySanctuary', 'morningstarTempest', 'apocalypseComet', 'bladeStorm', 'teslaShotgun', 'venomBlizzard',
          'thunderBlade', 'fireAxe', 'frostWhip', 'scatterShuriken', 'holyArrow', 'plague',
          'cycloneBow', 'eclipseSpiral',
          'infernoCataclysm', 'shadowVortex', 'divineJudgement',
        ].includes(key);
        slot.className = `inv-icon inv-weapon ${isEvolved ? 'inv-evolution' : ''}`;
        
        let iconKey = w.iconSprite || 'icon_atk';
        if (key === 'sword') iconKey = 'icon_sword';
        else if (key === 'axe') iconKey = 'icon_axe';
        else if (key === 'whip') iconKey = 'icon_whip';
        else if (key === 'shuriken') iconKey = 'icon_shuriken';
        else if (key === 'magicMissile') iconKey = 'icon_missile';
        else if (key === 'shotgun') iconKey = 'icon_shotgun';
        else if (key === 'holyWater') iconKey = 'icon_holywater';
        else if (key === 'sanctuary') iconKey = 'icon_sanctuary';
        else if (key === 'lightningRing') iconKey = 'icon_lightning';
        else if (key === 'fireWand') iconKey = 'icon_firewand';
        else if (key === 'poisonDagger') iconKey = 'icon_poisondagger';
        else if (key === 'frostOrb') iconKey = 'icon_frostorb';
        else if (key === 'windBow') iconKey = 'icon_windbow';
        else if (key === 'shadowOrb') iconKey = 'icon_shadoworb';
        else if (key === 'heavenlySanctuary') iconKey = 'icon_heavenlysanctuary';
        else if (key === 'morningstarTempest') iconKey = 'icon_morningstartempest';
        else if (key === 'apocalypseComet') iconKey = 'icon_apocalypsecomet';
        else if (key === 'bladeStorm') iconKey = 'icon_bladestorm';
        else if (key === 'teslaShotgun') iconKey = 'icon_teslashotgun';
        else if (key === 'venomBlizzard') iconKey = 'icon_venomblizzard';
        else if (key === 'thunderBlade') iconKey = 'icon_thunderblade';
        else if (key === 'fireAxe') iconKey = 'icon_fireaxe';
        else if (key === 'frostWhip') iconKey = 'icon_frostwhip';
        else if (key === 'scatterShuriken') iconKey = 'icon_scattershuriken';
        else if (key === 'holyArrow') iconKey = 'icon_holyarrow';
        else if (key === 'plague') iconKey = 'icon_plague';
        else if (key === 'cycloneBow') iconKey = 'icon_cyclonebow';
        else if (key === 'eclipseSpiral') iconKey = 'icon_eclipsespiral';
        else if (key === 'flamePillar') iconKey = 'icon_flamepillar';
        else if (key === 'chakram') iconKey = 'icon_chakram';
        else if (key === 'holyCross') iconKey = 'icon_holycross';
        else if (key === 'infernoCataclysm') iconKey = 'icon_infernocataclysm';
        else if (key === 'shadowVortex') iconKey = 'icon_shadowvortex';
        else if (key === 'divineJudgement') iconKey = 'icon_divinejudgement';

        const imgSrc = assets.manifest[iconKey];
        const iconHtml = imgSrc ? `<img src="${imgSrc}" class="inv-img" alt="${w.name}">` : `<span>${w.icon}</span>`;
        const totalUpgrades = (w.speedLevel || 0) + (w.countLevel || 0) + (w.areaLevel || 0) + (w.damageLevel || 0);
        const totalLv = isEvolved ? 'EVO' : (totalUpgrades >= 6 ? 'MAX' : totalUpgrades + 1);
        slot.innerHTML = `
          ${iconHtml}
          <span class="inv-level ${isEvolved ? 'inv-level-evo' : (totalUpgrades >= 6 ? 'inv-level-max' : '')}">${totalLv}</span>
        `;
        slot.title = `${w.name} ${isEvolved ? '(진화 무기)' : `(총 강화 ${totalUpgrades}/6)`}`;
      } else {
        slot.className = 'inv-icon inv-empty';
        slot.title = '빈 무기 슬롯 (최대 6개)';
      }
      this.weaponSlots.appendChild(slot);
    }
  }

  renderPassiveSlots(passives) {
    this.passiveSlots.innerHTML = '';
    const keys = Object.keys(passives);
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      if (i < keys.length) {
        const id = keys[i];
        const p = passives[id];
        slot.className = 'inv-icon inv-passive';
        const imgSrc = p.iconKey ? assets.manifest[p.iconKey] : null;
        const iconHtml = imgSrc ? `<img src="${imgSrc}" class="inv-img" alt="${p.title}">` : `<span>${p.icon}</span>`;
        const isMax = p.level >= p.maxLevel;
        slot.innerHTML = `
          ${iconHtml}
          <span class="inv-level ${isMax ? 'inv-level-max' : ''}">${isMax ? 'MAX' : p.level}</span>
        `;
        slot.title = `${p.title} (Lv.${p.level}/${p.maxLevel})`;
      } else {
        slot.className = 'inv-icon inv-empty';
        slot.title = '빈 패시브 슬롯 (최대 6개)';
      }
      this.passiveSlots.appendChild(slot);
    }
  }

  showBossAlert(bossName) {
    this.bossAlertText.textContent = `⚠️ 보스 출현: ${bossName} ⚠️`;
    this.bossAlert.classList.remove('hidden');
    setTimeout(() => {
      this.bossAlert.classList.add('hidden');
    }, 1800);
  }

  showStageClear(stage) {
    this.stageBannerTitle.textContent = `STAGE ${stage} CLEAR!`;
    this.stageBannerSub.textContent = `다음 웨이브가 곧 시작됩니다...`;
    this.stageClearBanner.classList.remove('hidden');
    setTimeout(() => {
      this.stageClearBanner.classList.add('hidden');
    }, 1300);
  }

  showCardSelection(cards, onSelect, onReroll, onSkip, isBossReward = false, isStarting = false) {
    this.cardsList.innerHTML = '';
    this.cardModal.classList.remove('hidden');

    // 키보드 네비게이션 상태 동기화
    this.isCardModalOpen = true;
    this.focusedCardIndex = 0;
    this.activeCards = cards;
    this.cardElements = [];
    this.onCardSelectCallback = onSelect;

    const modalTitle = this.cardModal.querySelector('.modal-title');
    const modalSub = this.cardModal.querySelector('.modal-sub');
    if (modalTitle) {
      if (isStarting) {
        modalTitle.textContent = '⚔️ 시작 무기 선택 ⚔️';
        modalTitle.className = 'modal-title text-gold';
      } else if (isBossReward) {
        modalTitle.textContent = '👑 BOSS VICTORY REWARD 👑';
        modalTitle.className = 'modal-title text-gold';
      } else {
        modalTitle.textContent = '⭐ LEVEL UP! ⭐';
        modalTitle.className = 'modal-title';
      }
    }
    if (modalSub) {
      if (isStarting) {
        modalSub.textContent = '원정을 함께할 첫 번째 시작 무기를 선택하세요!';
      } else if (isBossReward) {
        modalSub.textContent = '보스를 물리친 대가로 특별한 보너스 카드가 주어집니다!';
      } else {
        modalSub.textContent = '강화 카드를 1장 선택하세요';
      }
    }

    // 새로고침 & 스킵 버튼 상태 및 이벤트 바인딩
    if (this.cardRerollBtn) {
      const remaining = this.game.player.rerollCount;
      const maxR = this.game.player.maxRerolls;
      this.cardRerollBtn.textContent = `🎲 새로고침 [R] (${remaining}/${maxR})`;
      this.cardRerollBtn.disabled = remaining <= 0;
      this.cardRerollBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.game.player.rerollCount > 0 && onReroll) {
          sounds.playSelect();
          onReroll();
        }
      };
    }

    if (this.cardSkipBtn) {
      // 시작 무기 선택 시에는 반드시 무기를 선택해야 하므로 스킵 불가
      if (isStarting) {
        this.cardSkipBtn.style.display = 'none';
      } else {
        this.cardSkipBtn.style.display = '';
        this.cardSkipBtn.textContent = '⏩ 스킵/회복 [K] (+20 HP)';
        this.cardSkipBtn.onclick = (e) => {
          e.stopPropagation();
          this.cardModal.classList.add('hidden');
          this.isCardModalOpen = false;
          sounds.playSelect();
          if (onSkip) onSkip();
        };
      }
    }

    cards.forEach((card, index) => {
      const isEvo = card.category === 'evolution' || card.type === 'weapon_evolution';
      const isPassive = card.category === 'passive';
      const isWeapon = card.category === 'weapon';
      const isConsumable = card.category === 'consumable';

      let cardTypeClass = 'type-stat';
      let tagLabel = '📿 패시브';
      let tagClass = 'tag-passive';

      if (isEvo) {
        cardTypeClass = 'type-evolution';
        tagLabel = '✨ 진화 무기';
        tagClass = 'tag-evolution';
      } else if (isWeapon) {
        cardTypeClass = 'type-weapon';
        tagLabel = '⚔️ 무기';
        tagClass = 'tag-weapon';
      } else if (isConsumable) {
        cardTypeClass = 'type-consumable';
        tagLabel = '🧪 회복';
        tagClass = 'tag-consumable';
      }

      const el = document.createElement('div');
      el.className = `upgrade-card ${cardTypeClass}`;
      const isNew = card.badge === 'NEW WEAPON';
      const isMaxBadge = card.badge && (card.badge.includes('6/6') || card.badge.includes('3/3'));

      let iconHtml = `<div class="card-icon">${card.icon}</div>`;
      if (card.iconKey && assets.manifest[card.iconKey]) {
        iconHtml = `<div class="card-icon"><img src="${assets.manifest[card.iconKey]}" alt="${card.title}" class="card-pixel-icon"></div>`;
      }

      let evoHintHtml = '';
      if (card.evolutionHint) {
        const hintClass = card.evolutionHint.status === 'ready'
          ? 'hint-ready'
          : (card.evolutionHint.status === 'linked' ? 'hint-linked' : 'hint-tree');
        let evoIconEl = `<span class="evo-icon">${card.evolutionHint.evoIcon}</span>`;
        if (card.evolutionHint.evoIconKey && assets.manifest[card.evolutionHint.evoIconKey]) {
          evoIconEl = `<img src="${assets.manifest[card.evolutionHint.evoIconKey]}" class="evo-pixel-icon" alt="${card.evolutionHint.evoName}">`;
        }
        evoHintHtml = `
          <div class="card-evo-hint ${hintClass}">
            ${evoIconEl}
            <span class="evo-text">${card.evolutionHint.text}</span>
          </div>
        `;
      }

      const keyNum = index + 1;
      el.innerHTML = `
        <span class="card-num-badge">${keyNum}</span>
        <span class="card-type-tag ${tagClass}">${tagLabel}</span>
        <span class="card-badge ${isEvo ? 'badge-evolution' : (isNew ? 'badge-new' : (isMaxBadge ? 'badge-max' : (isPassive ? 'badge-passive' : 'badge-weapon')))}">${card.badge}</span>
        ${iconHtml}
        <div class="card-name">${card.title}</div>
        ${card.stars ? `<div class="card-stars">${card.stars}</div>` : ''}
        <div class="card-desc">${card.desc}</div>
        <div class="card-effect">${card.effectText}</div>
        ${evoHintHtml}
      `;

      // 마우스 오버 시 키보드 포커스 동기화
      el.addEventListener('mouseenter', () => {
        this.setFocusedCardIndex(index);
      });

      el.addEventListener('click', () => {
        this.selectCardByIndex(index);
      });

      this.cardElements.push(el);
      this.cardsList.appendChild(el);
    });

    // 기본 첫 번째 카드 포커스 활성화
    this.updateCardFocus();
  }

  setFocusedCardIndex(index) {
    if (!this.cardElements || this.cardElements.length === 0) return;
    this.focusedCardIndex = Math.max(0, Math.min(this.cardElements.length - 1, index));
    this.updateCardFocus();
  }

  updateCardFocus() {
    if (!this.cardElements) return;
    this.cardElements.forEach((el, idx) => {
      el.classList.toggle('card-focused', idx === this.focusedCardIndex);
    });
  }

  selectCardByIndex(index) {
    if (!this.activeCards || index < 0 || index >= this.activeCards.length) return;
    const card = this.activeCards[index];
    this.cardModal.classList.add('hidden');
    this.isCardModalOpen = false;
    sounds.playSelect();
    if (this.onCardSelectCallback) {
      this.onCardSelectCallback(card);
    }
  }

  handleCardModalKeydown(e) {
    if (!this.isCardModalOpen || !this.activeCards || this.activeCards.length === 0) return false;

    // 1. 숫자키 1~9 즉시 선택 (일반 숫자키 및 넘버패드)
    let num = -1;
    if (e.code && e.code.startsWith('Digit')) {
      num = parseInt(e.code.replace('Digit', ''), 10);
    } else if (e.code && e.code.startsWith('Numpad')) {
      num = parseInt(e.code.replace('Numpad', ''), 10);
    } else if (e.key >= '1' && e.key <= '9') {
      num = parseInt(e.key, 10);
    }

    if (num >= 1 && num <= this.activeCards.length) {
      this.selectCardByIndex(num - 1);
      return true;
    }

    // 2. 좌측/상단 방향키: 이전 카드로 포커스 이동 (끝에 도달 시 루프 없이 멈춤)
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      const prev = Math.max(0, this.focusedCardIndex - 1);
      if (prev !== this.focusedCardIndex) {
        this.setFocusedCardIndex(prev);
        sounds.playSelect();
      }
      return true;
    }

    // 3. 우측/하단 방향키: 다음 카드로 포커스 이동 (끝에 도달 시 루프 없이 멈춤)
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      const next = Math.min(this.activeCards.length - 1, this.focusedCardIndex + 1);
      if (next !== this.focusedCardIndex) {
        this.setFocusedCardIndex(next);
        sounds.playSelect();
      }
      return true;
    }

    // 4. Enter 또는 Space: 포커스된 카드 승인 선택
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      this.selectCardByIndex(this.focusedCardIndex);
      return true;
    }

    // 5. R 키: 새로고침 (Reroll)
    if ((e.code === 'KeyR' || e.key === 'r' || e.key === 'R' || e.key === 'ㄱ') && this.cardRerollBtn && !this.cardRerollBtn.disabled) {
      this.cardRerollBtn.click();
      return true;
    }

    // 6. K 키 (또는 X 키): 스킵 및 체력 회복 (Skip & Heal)
    if ((e.code === 'KeyK' || e.key === 'k' || e.key === 'K' || e.key === 'ㅏ' || e.code === 'KeyX' || e.key === 'x' || e.key === 'X' || e.key === 'ㅌ') && this.cardSkipBtn && this.cardSkipBtn.style.display !== 'none') {
      this.cardSkipBtn.click();
      return true;
    }

    return false;
  }
  showGameOver(stats) {
    this.gameOverStats.innerHTML = `
      <div class="stat-row"><span>생존 시간</span><strong>${stats.time}</strong></div>
      <div class="stat-row"><span>도달 스테이지</span><strong>Stage ${stats.stage}</strong></div>
      <div class="stat-row"><span>최종 레벨</span><strong>Lv. ${stats.level}</strong></div>
      <div class="stat-row"><span>처치한 마물</span><strong>${stats.kills} 마리</strong></div>
      <div class="stat-row"><span>획득 엽전</span><strong style="color: #facc15;"><img src="assets/sprites/item_gold.png" class="coin-icon" alt="상평통보"> +${stats.gold || 0}</strong></div>
    `;
    this.gameOverModal.classList.remove('hidden');
    sounds.playGameOver();
    this.showChampionBanner(); // 사망 시 챔피언 배너 띄움
  }

  hideGameOver() {
    if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
  }

  showVictory(stats) {
    this.lastVictoryStats = stats;
    this.victoryStats.innerHTML = `
      <div class="stat-row"><span>클리어 시간</span><strong>${stats.time}</strong></div>
      <div class="stat-row"><span>달성 스테이지</span><strong>Stage 25 (Abyss All Clear)</strong></div>
      <div class="stat-row"><span>최종 레벨</span><strong>Lv. ${stats.level}</strong></div>
      <div class="stat-row"><span>처치한 마물</span><strong>${stats.kills} 마리</strong></div>
      <div class="stat-row"><span>획득 엽전</span><strong style="color: #facc15;"><img src="assets/sprites/item_gold.png" class="coin-icon" alt="상평통보"> +${stats.gold || 0}</strong></div>
    `;
    if (this.championSubmitSuccess) this.championSubmitSuccess.classList.add('hidden');
    if (this.championNameInput) this.championNameInput.value = '';
    this.victoryModal.classList.remove('hidden');
    sounds.playVictory();
  }

  hideVictory() {
    if (this.victoryModal) this.victoryModal.classList.add('hidden');
  }

  // 명예의 전당 챔피언 배너 노출 (사망 시, 로비 복귀 시 - 최근 클리어 유저)
  async showChampionBanner() {
    if (!this.championBanner) return;
    let champ = { name: '전설의 서바이버', clearTime: '18:45' };

    // 1. 서버 공용 API 호출 시도
    try {
      const res = await fetch('/api/champion', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          champ = data.recent || (data.records && data.records[0]) || data;
        }
      }
    } catch (netErr) {
      // 오프라인이거나 서버 통신 실패 시 로컬 스토리지 백업 조회
      try {
        const raw = localStorage.getItem('vam_hall_of_fame');
        if (raw) {
          const parsed = JSON.parse(raw);
          champ = parsed.recent || (parsed.records && parsed.records[0]) || champ;
        }
      } catch (e) {}
    }

    if (this.champName) this.champName.textContent = `${champ.name || '무명의 영웅'} [${champ.clearTime || '18:45'}]`;

    this.championBanner.classList.remove('hidden');
    if (this.champBannerTimer) clearTimeout(this.champBannerTimer);
    this.champBannerTimer = setTimeout(() => {
      if (this.championBanner) this.championBanner.classList.add('hidden');
    }, 4500);
  }

  // 최종 보스 클리어 시 챔피언 등록 핸들러 (서버 영구 파일 저장 및 로컬 백업)
  async handleChampionSubmit() {
    const rawName = (this.championNameInput ? this.championNameInput.value.trim() : '') || '익명의 챔피언';
    const name = this.sanitizeText(rawName);

    const stats = this.lastVictoryStats || {
      time: '18:45',
      timeSeconds: 1125,
      level: 30,
      kills: 500,
      hero: (this.game && this.game.player ? this.game.player.characterType : 'knight')
    };

    const newRecord = {
      name,
      clearTime: stats.time,
      timeSeconds: stats.timeSeconds || 1125,
      level: stats.level || 1,
      kills: stats.kills || 0,
      hero: stats.hero || 'knight',
      date: Date.now()
    };

    // 로컬 스토리지 즉시 캐시 & 랭킹 리스트 갱신
    let localData = { records: [], recent: newRecord };
    try {
      const raw = localStorage.getItem('vam_hall_of_fame');
      if (raw) localData = JSON.parse(raw);
      if (!Array.isArray(localData.records)) localData.records = [];
      localData.records.push(newRecord);
      localData.records.sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));
      if (localData.records.length > 50) localData.records = localData.records.slice(0, 50);
      localData.recent = newRecord;
      localStorage.setItem('vam_hall_of_fame', JSON.stringify(localData));
      localStorage.setItem('vam_champion', JSON.stringify(newRecord));
    } catch (e) {}

    // 서버로 영구 저장 전송
    let serverResData = null;
    try {
      const res = await fetch('/api/champion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        serverResData = await res.json();
      }
    } catch (netErr) {
      console.warn('서버 챔피언 등록 실패 (로컬 스토리지에 정상 보존됨):', netErr);
    }

    if (this.championSubmitSuccess) {
      this.championSubmitSuccess.classList.remove('hidden');
    }
    sounds.playLevelUp();
    this.renderHallOfFame(serverResData || localData);

    // 0.8초 후 명예의 전당 모달을 즉시 열어 최신 순위(1~3위 및 최근 글) 확인
    setTimeout(() => {
      this.openHallOfFame(serverResData || localData);
    }, 800);
  }

  // 명예의 전당 모달 열기
  async openHallOfFame(cachedData = null) {
    if (!this.hallOfFameModal) return;

    let data = cachedData;
    if (!data) {
      // 1. 서버 API 조회
      try {
        const res = await fetch('/api/champion', { cache: 'no-store' });
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {}

      // 2. 서버 실패 시 로컬 스토리지 백업
      if (!data) {
        try {
          const raw = localStorage.getItem('vam_hall_of_fame');
          if (raw) data = JSON.parse(raw);
        } catch (e) {}
      }
    }

    this.renderHallOfFame(data);
    this.hallOfFameModal.classList.remove('hidden');
  }

  // 명예의 전당 1~3위 및 4번째 최근 클리어 유저 렌더링
  // ※ 명예의 전당(renderHallOfFame)은 js/ranking.js로 분리됨
  // ※ 로비 모달 및 영구 강화 상점은 js/lobby.js로 분리됨
  // ※ 모바일 가상 조이스틱(initJoystick)은 js/joystick.js로 분리됨
}
