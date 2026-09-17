// UI 렌더러 및 이벤트 핸들러 (HUD, 모달, 모바일 가상 조이스틱)

class UIManager {
  constructor(game) {
    this.game = game;

    // HUD 엘리먼트 참조
    this.stageBadge = document.getElementById('stageBadge');
    this.timerBadge = document.getElementById('timerBadge');
    this.killBadge = document.getElementById('killBadge');
    this.levelBadge = document.getElementById('levelBadge');
    this.expBarFill = document.getElementById('expBarFill');
    this.expText = document.getElementById('expText');
    this.hpBarFill = document.getElementById('hpBarFill');
    this.hpText = document.getElementById('hpText');
    this.weaponSlots = document.getElementById('weaponSlots');
    this.passiveSlots = document.getElementById('passiveSlots');

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

    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    this.restartBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.game.restart();
    });

    this.victoryRestartBtn.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.game.restart();
    });
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
    for (let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      if (i < keys.length) {
        const key = keys[i];
        const w = weapons[key];
        const isEvolved = key === 'spinningAxe' || key === 'bladeWhip' || key === 'holyShotgun' || key === 'arcaneSanctuary' || key === 'plasmaTempest';
        slot.className = `inv-icon inv-weapon ${isEvolved ? 'inv-evolution' : ''}`;
        
        let iconKey = 'icon_atk';
        if (key === 'sword') iconKey = 'icon_sword';
        else if (key === 'axe' || key === 'spinningAxe') iconKey = 'icon_axe';
        else if (key === 'whip' || key === 'bladeWhip') iconKey = 'icon_whip';
        else if (key === 'throwingDagger') iconKey = 'icon_dagger';
        else if (key === 'magicMissile') iconKey = 'icon_missile';
        else if (key === 'shotgun') iconKey = 'icon_shotgun';
        else if (key === 'holyShotgun') iconKey = 'icon_holyshotgun';
        else if (key === 'holyWater' || key === 'acidPool') iconKey = 'icon_holywater';
        else if (key === 'sanctuary') iconKey = 'icon_sanctuary';
        else if (key === 'lightningRing') iconKey = 'icon_lightning';
        else if (key === 'fireWand') iconKey = 'icon_firewand';
        else if (key === 'arcaneSanctuary') iconKey = 'icon_arcanesanctuary';
        else if (key === 'plasmaTempest') iconKey = 'icon_plasmatempest';

        const imgSrc = assets.manifest[iconKey];
        const iconHtml = imgSrc ? `<img src="${imgSrc}" class="inv-img" alt="${w.name}">` : `<span>${w.icon}</span>`;
        const totalUpgrades = (w.speedLevel || 0) + (w.countLevel || 0) + (w.areaLevel || 0) + (w.speedProjLevel || 0);
        const totalLv = isEvolved ? 'EVO' : (totalUpgrades >= 6 ? 'MAX' : totalUpgrades + 1);
        slot.innerHTML = `
          ${iconHtml}
          <span class="inv-level ${isEvolved ? 'inv-level-evo' : (totalUpgrades >= 6 ? 'inv-level-max' : '')}">${totalLv}</span>
        `;
        slot.title = `${w.name} ${isEvolved ? '(진화 무기)' : `(총 강화 ${totalUpgrades}/6)`}`;
      } else {
        slot.className = 'inv-icon inv-empty';
        slot.title = '빈 무기 슬롯 (최대 5개)';
      }
      this.weaponSlots.appendChild(slot);
    }
  }

  renderPassiveSlots(passives) {
    this.passiveSlots.innerHTML = '';
    const keys = Object.keys(passives);
    for (let i = 0; i < 5; i++) {
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
        slot.title = '빈 패시브 슬롯 (최대 5개)';
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
          sounds.playSelect();
          if (onSkip) onSkip();
        };
      }
    }

    cards.forEach(card => {
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

      el.innerHTML = `
        <span class="card-type-tag ${tagClass}">${tagLabel}</span>
        <span class="card-badge ${isEvo ? 'badge-evolution' : (isNew ? 'badge-new' : (isMaxBadge ? 'badge-max' : (isPassive ? 'badge-passive' : 'badge-weapon')))}">${card.badge}</span>
        ${iconHtml}
        <div class="card-name">${card.title}</div>
        ${card.stars ? `<div class="card-stars">${card.stars}</div>` : ''}
        <div class="card-desc">${card.desc}</div>
        <div class="card-effect">${card.effectText}</div>
        ${evoHintHtml}
      `;

      el.addEventListener('click', () => {
        this.cardModal.classList.add('hidden');
        onSelect(card);
      });

      this.cardsList.appendChild(el);
    });
  }
  showGameOver(stats) {
    this.gameOverStats.innerHTML = `
      <div class="stat-row"><span>생존 시간</span><strong>${stats.time}</strong></div>
      <div class="stat-row"><span>도달 스테이지</span><strong>Stage ${stats.stage}</strong></div>
      <div class="stat-row"><span>최종 레벨</span><strong>Lv. ${stats.level}</strong></div>
      <div class="stat-row"><span>처치한 마물</span><strong>${stats.kills} 마리</strong></div>
    `;
    this.gameOverModal.classList.remove('hidden');
    sounds.playGameOver();
  }

  showVictory(stats) {
    this.victoryStats.innerHTML = `
      <div class="stat-row"><span>클리어 시간</span><strong>${stats.time}</strong></div>
      <div class="stat-row"><span>달성 스테이지</span><strong>Stage 15 (Hell All Clear)</strong></div>
      <div class="stat-row"><span>최종 레벨</span><strong>Lv. ${stats.level}</strong></div>
      <div class="stat-row"><span>처치한 마물</span><strong>${stats.kills} 마리</strong></div>
    `;
    this.victoryModal.classList.remove('hidden');
    sounds.playVictory();
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
