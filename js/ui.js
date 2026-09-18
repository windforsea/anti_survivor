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
    this.pauseRestartBtn = document.getElementById('pauseRestartBtn');

    this.soundToggleBtn = document.getElementById('soundToggleBtn');

    // 키보드 카드 선택 포커스 상태
    this.focusedCardIndex = 0;
    this.activeCards = [];
    this.cardElements = [];
    this.onCardSelectCallback = null;
    this.isCardModalOpen = false;

    this.initEventListeners();
    this.initJoystick();
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

    if (this.pauseRestartBtn) {
      this.pauseRestartBtn.addEventListener('click', () => {
        this.hidePauseModal();
        this.game.restart();
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

    // 로비 출격 버튼
    if (this.lobbyStartBtn) {
      this.lobbyStartBtn.addEventListener('click', () => {
        this.hideLobby();
        this.game.startRun();
      });
    }

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
    this.timerBadge.textContent = `⏱️ ${m}:${s}`;

    this.killBadge.textContent = `💀 ${player.totalKills}`;
    if (this.goldBadge) {
      this.goldBadge.textContent = `🪙 ${player.gold || 0}`;
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
        const isEvolved = ['heavenlySanctuary', 'morningstarTempest', 'apocalypseComet', 'slayerBladeStorm', 'teslaShotgun', 'spinningAxe', 'bladeWhip', 'holyShotgun', 'arcaneSanctuary', 'plasmaTempest'].includes(key);
        slot.className = `inv-icon inv-weapon ${isEvolved ? 'inv-evolution' : ''}`;
        
        let iconKey = 'icon_atk';
        if (key === 'sword') iconKey = 'icon_sword';
        else if (key === 'axe' || key === 'spinningAxe') iconKey = 'icon_axe';
        else if (key === 'whip' || key === 'bladeWhip') iconKey = 'icon_whip';
        else if (key === 'shuriken' || key === 'throwingDagger') iconKey = 'icon_shuriken';
        else if (key === 'magicMissile') iconKey = 'icon_missile';
        else if (key === 'shotgun') iconKey = 'icon_shotgun';
        else if (key === 'holyShotgun') iconKey = 'icon_holyshotgun';
        else if (key === 'holyWater' || key === 'acidPool') iconKey = 'icon_holywater';
        else if (key === 'sanctuary') iconKey = 'icon_sanctuary';
        else if (key === 'lightningRing') iconKey = 'icon_lightning';
        else if (key === 'fireWand') iconKey = 'icon_firewand';
        else if (key === 'heavenlySanctuary') iconKey = 'icon_heavenlysanctuary';
        else if (key === 'morningstarTempest') iconKey = 'icon_morningstartempest';
        else if (key === 'apocalypseComet') iconKey = 'icon_apocalypsecomet';
        else if (key === 'slayerBladeStorm') iconKey = 'icon_slayerbladestorm';
        else if (key === 'teslaShotgun') iconKey = 'icon_teslashotgun';
        else if (key === 'arcaneSanctuary') iconKey = 'icon_arcanesanctuary';
        else if (key === 'plasmaTempest') iconKey = 'icon_plasmatempest';

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
    }, 3500);
  }

  showStageClear(stage) {
    this.stageBannerTitle.textContent = `STAGE ${stage} CLEAR!`;
    this.stageBannerSub.textContent = `다음 웨이브가 곧 시작됩니다...`;
    this.stageClearBanner.classList.remove('hidden');
    setTimeout(() => {
      this.stageClearBanner.classList.add('hidden');
    }, 2200);
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
      this.cardRerollBtn.textContent = `🎲 새로고침 (${remaining}/${maxR})`;
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
        evoHintHtml = `
          <div class="card-evo-hint ${hintClass}">
            <span class="evo-icon">${card.evolutionHint.evoIcon}</span>
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

    // 2. 좌측/상단 방향키: 이전 카드로 포커스 이동
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      const prev = (this.focusedCardIndex - 1 + this.activeCards.length) % this.activeCards.length;
      this.setFocusedCardIndex(prev);
      sounds.playSelect();
      return true;
    }

    // 3. 우측/하단 방향키: 다음 카드로 포커스 이동
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      const next = (this.focusedCardIndex + 1) % this.activeCards.length;
      this.setFocusedCardIndex(next);
      sounds.playSelect();
      return true;
    }

    // 4. Enter 또는 Space: 포커스된 카드 승인 선택
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      this.selectCardByIndex(this.focusedCardIndex);
      return true;
    }

    // 5. R 키: 새로고침 (Reroll)
    if (e.code === 'KeyR' && this.cardRerollBtn && !this.cardRerollBtn.disabled) {
      this.cardRerollBtn.click();
      return true;
    }

    // 6. X 키: 스킵 (Skip)
    if (e.code === 'KeyX' && this.cardSkipBtn && this.cardSkipBtn.style.display !== 'none') {
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
      <div class="stat-row"><span>획득 금화</span><strong style="color: #facc15;">🪙 +${stats.gold || 0} G</strong></div>
    `;
    this.gameOverModal.classList.remove('hidden');
    sounds.playGameOver();
    this.showChampionBanner(); // 사망 시 챔피언 배너 띄움
  }

  hideGameOver() {
    if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
  }

  showVictory(stats) {
    this.victoryStats.innerHTML = `
      <div class="stat-row"><span>클리어 시간</span><strong>${stats.time}</strong></div>
      <div class="stat-row"><span>달성 스테이지</span><strong>Stage 15 (Hell All Clear)</strong></div>
      <div class="stat-row"><span>최종 레벨</span><strong>Lv. ${stats.level}</strong></div>
      <div class="stat-row"><span>처치한 마물</span><strong>${stats.kills} 마리</strong></div>
      <div class="stat-row"><span>획득 금화</span><strong style="color: #facc15;">🪙 +${stats.gold || 0} G</strong></div>
    `;
    if (this.championSubmitSuccess) this.championSubmitSuccess.classList.add('hidden');
    if (this.championNameInput) this.championNameInput.value = '';
    if (this.championQuoteInput) this.championQuoteInput.value = '';
    this.victoryModal.classList.remove('hidden');
    sounds.playVictory();
  }

  hideVictory() {
    if (this.victoryModal) this.victoryModal.classList.add('hidden');
  }

  // 명예의 전당 챔피언 배너 노출 (사망 시, 로비 복귀 시 - 서버 공용 API 우선 조회)
  async showChampionBanner() {
    if (!this.championBanner) return;
    let champ = { name: '전설의 서바이버', quote: '어둠은 영원하지 않다. 끝까지 살아남아라!' };

    // 1. 서버 공용 API 호출 시도
    try {
      const res = await fetch('/api/champion', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) champ = data;
      }
    } catch (netErr) {
      // 오프라인이거나 서버 통신 실패 시 로컬 스토리지 백업 조회
      try {
        const raw = localStorage.getItem('vam_champion');
        if (raw) champ = JSON.parse(raw);
      } catch (e) {}
    }

    if (this.champName) this.champName.textContent = champ.name || '무명의 영웅';
    if (this.champQuote) this.champQuote.textContent = `"${champ.quote || '승리를 향해 나아가라!'}"`;

    this.championBanner.classList.remove('hidden');
    if (this.champBannerTimer) clearTimeout(this.champBannerTimer);
    this.champBannerTimer = setTimeout(() => {
      if (this.championBanner) this.championBanner.classList.add('hidden');
    }, 4500);
  }

  // 최종 보스 클리어 시 챔피언 등록 핸들러 (서버 영구 파일 저장 및 로컬 백업)
  async handleChampionSubmit() {
    const name = (this.championNameInput ? this.championNameInput.value.trim() : '') || '익명의 챔피언';
    const quote = (this.championQuoteInput ? this.championQuoteInput.value.trim() : '') || '모든 시련을 이겨냈다!';
    const payload = { name, quote, date: Date.now() };

    // 로컬 스토리지 즉시 캐시
    try {
      localStorage.setItem('vam_champion', JSON.stringify(payload));
    } catch (e) {}

    // 서버로 영구 저장 전송 (다른 모든 접속자에게 즉시 공유)
    try {
      await fetch('/api/champion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      console.warn('서버 챔피언 등록 실패 (로컬에만 저장됨):', netErr);
    }

    if (this.championSubmitSuccess) {
      this.championSubmitSuccess.classList.remove('hidden');
    }
    sounds.playLevelUp();
  }

  // 로비 모달 노출 및 상점 렌더링
  showLobby() {
    if (this.lobbyModal) {
      this.lobbyModal.classList.remove('hidden');
      this.renderLobbyUpgrades();
    }
  }

  hideLobby() {
    if (this.lobbyModal) {
      this.lobbyModal.classList.add('hidden');
    }
  }

  renderLobbyUpgrades() {
    if (!this.lobbyUpgradesList) return;

    let saveData = { gold: 0, upgrades: {} };
    try {
      const raw = localStorage.getItem('vam_save_data');
      if (raw) saveData = JSON.parse(raw);
    } catch (e) {}

    const gold = saveData.gold || 0;
    const upgrades = saveData.upgrades || {};

    if (this.lobbyGoldText) {
      this.lobbyGoldText.textContent = `🪙 보유 금화: ${gold.toLocaleString()} G`;
    }

    const configs = [
      { id: 'atk', name: '공격력 증가', icon: '⚔️', desc: '모든 공격력 +4%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'cooldown', name: '쿨타임 감소', icon: '⏳', desc: '재사용 대기시간 -3%', maxLevel: 5, baseCost: 150, costInc: 75 },
      { id: 'area', name: '공격 범위 증가', icon: '🎯', desc: '공격 및 폭발 범위 +5%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'hp', name: '최대 체력 증가', icon: '❤️', desc: '최대 생명력 +15', maxLevel: 5, baseCost: 80, costInc: 40 },
      { id: 'speed', name: '이동 속도 증가', icon: '👟', desc: '이동 속도 +3%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'regen', name: '체력 재생', icon: '💍', desc: '초당 체력 회복 +0.3 HP/s', maxLevel: 3, baseCost: 200, costInc: 100 },
      { id: 'magnet', name: '자석 반경 증가', icon: '🧲', desc: '보석/금화 흡수 반경 +20px', maxLevel: 5, baseCost: 70, costInc: 35 },
      { id: 'greed', name: '금화 획득량 증가', icon: '🪙', desc: '금화 획득량 +10%', maxLevel: 5, baseCost: 120, costInc: 60 },
      { id: 'revive', name: '부활', icon: '👼', desc: '사망 시 1회 체력 50% 부활', maxLevel: 1, baseCost: 1000, costInc: 0 }
    ];

    this.lobbyUpgradesList.innerHTML = '';

    configs.forEach(cfg => {
      const curLv = upgrades[cfg.id] || 0;
      const isMax = curLv >= cfg.maxLevel;
      const cost = cfg.baseCost + curLv * cfg.costInc;
      const canAfford = gold >= cost;

      const card = document.createElement('div');
      card.className = 'lobby-upgrade-card';

      // 핍 게이지
      let pipsHtml = '';
      for (let i = 0; i < cfg.maxLevel; i++) {
        pipsHtml += `<div class="lobby-pip ${i < curLv ? 'active' : ''}"></div>`;
      }

      card.innerHTML = `
        <div class="lobby-card-top">
          <div class="lobby-card-icon">${cfg.icon}</div>
          <div class="lobby-card-info">
            <h3>${cfg.name}</h3>
            <p>${cfg.desc}</p>
          </div>
        </div>
        <div class="lobby-card-progress">
          ${pipsHtml}
        </div>
        <button class="lobby-buy-btn" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? 'MAX 달성' : `${cost} G 강화`}
        </button>
      `;

      const btn = card.querySelector('.lobby-buy-btn');
      if (!isMax && canAfford) {
        btn.addEventListener('click', () => {
          this.buyPermanentUpgrade(cfg.id, cost, curLv + 1);
        });
      }

      this.lobbyUpgradesList.appendChild(card);
    });
  }

  buyPermanentUpgrade(id, cost, nextLv) {
    try {
      const raw = localStorage.getItem('vam_save_data');
      const data = raw ? JSON.parse(raw) : { gold: 0, upgrades: {} };
      if ((data.gold || 0) < cost) return;

      data.gold -= cost;
      if (!data.upgrades) data.upgrades = {};
      data.upgrades[id] = nextLv;

      localStorage.setItem('vam_save_data', JSON.stringify(data));
      sounds.playLevelUp();
      this.renderLobbyUpgrades();
    } catch (e) {
      console.warn('업그레이드 구매 실패:', e);
    }
  }

  // 모바일 가상 조이스틱 터치 지원
  initJoystick() {
    const zone = document.getElementById('joystickZone');
    const knob = document.getElementById('joystickKnob');

    // 터치 기기이거나 작은 화면일 때 조이스틱 표시
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice || window.innerWidth <= 800) {
      zone.style.display = 'block';
    }

    let touchId = null;
    let baseRect = null;
    const maxRadius = 45;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      baseRect = zone.getBoundingClientRect();
      handleTouch(touch);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          handleTouch(e.changedTouches[i]);
          break;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          knob.style.transform = 'translate(-50%, -50%)';
          this.game.input.joystick.active = false;
          this.game.input.joystick.x = 0;
          this.game.input.joystick.y = 0;
          break;
        }
      }
    };

    zone.addEventListener('touchend', endTouch);
    zone.addEventListener('touchcancel', endTouch);

    const handleTouch = (touch) => {
      if (!baseRect) baseRect = zone.getBoundingClientRect();
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;

      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

      this.game.input.joystick.active = true;
      this.game.input.joystick.x = dx / maxRadius;
      this.game.input.joystick.y = dy / maxRadius;
    };
  }
}
