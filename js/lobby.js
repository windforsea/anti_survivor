// Anti Survivors - 로비 및 영구 강화 상점 (js/lobby.js)

UIManager.prototype.showCharacterSelect = function() {
    if (this.characterSelectModal) {
      this.characterSelectModal.classList.remove('hidden');
    }
  }

UIManager.prototype.hideCharacterSelect = function() {
    if (this.characterSelectModal) {
      this.characterSelectModal.classList.add('hidden');
    }
  }

  // 스테이지(월드) 선택 모달 표시
UIManager.prototype.showStageSelect = function() {
    if (this.stageSelectModal) {
      this.stageSelectModal.classList.remove('hidden');
    }
  }

UIManager.prototype.hideStageSelect = function() {
    if (this.stageSelectModal) {
      this.stageSelectModal.classList.add('hidden');
    }
  }

  // 로비 모달 노출 및 상점 렌더링
UIManager.prototype.showLobby = function() {
    if (this.lobbyModal) {
      this.lobbyModal.classList.remove('hidden');
      this.renderLobbyUpgrades();
    }
  }

UIManager.prototype.hideLobby = function() {
    if (this.lobbyModal) {
      this.lobbyModal.classList.add('hidden');
    }
  }

UIManager.prototype.renderLobbyUpgrades = function() {
    if (!this.lobbyUpgradesList) return;

    const saveData = saveManager.load();
    const gold = saveData.gold || 0;
    const upgrades = saveData.upgrades || {};

    if (this.lobbyGoldText) {
      this.lobbyGoldText.innerHTML = `<img src="assets/sprites/item_gold.png" class="coin-icon-lg" alt="상평통보"> 보유: ${gold.toLocaleString()}`;
    }

    const configs = [
      { id: 'atk', name: '공격력 증가', icon: '⚔️', desc: '모든 공격력 +4%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'cooldown', name: '쿨타임 감소', icon: '⏳', desc: '재사용 대기시간 -3%', maxLevel: 5, baseCost: 150, costInc: 75 },
      { id: 'area', name: '공격 범위 증가', icon: '🎯', desc: '공격 및 폭발 범위 +5%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'hp', name: '최대 체력 증가', icon: '❤️', desc: '최대 생명력 +15', maxLevel: 5, baseCost: 80, costInc: 40 },
      { id: 'speed', name: '이동 속도 증가', icon: '👟', desc: '이동 속도 +3%', maxLevel: 5, baseCost: 100, costInc: 50 },
      { id: 'regen', name: '체력 재생', icon: '💍', desc: '초당 체력 회복 +0.3 HP/s', maxLevel: 3, baseCost: 200, costInc: 100 },
      { id: 'magnet', name: '자석 반경 증가', icon: '🧲', desc: '보석/금화 흡수 반경 +20px', maxLevel: 5, baseCost: 70, costInc: 35 },
      { id: 'greed', name: '엽전 획득량 증가', icon: '<img src="assets/sprites/item_gold.png" class="coin-icon" alt="엽전">', desc: '엽전 획득량 +10%', maxLevel: 5, baseCost: 120, costInc: 60 },
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
          ${isMax ? 'MAX 달성' : `<img src="assets/sprites/item_gold.png" class="coin-icon" alt="엽전"> ${cost} 강화`}
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

UIManager.prototype.buyPermanentUpgrade = function(id, cost, nextLv) {
    try {
      const success = saveManager.spendGoldForUpgrade(id, cost, nextLv);
      if (!success) return;

      sounds.playLevelUp();
      this.renderLobbyUpgrades();
    } catch (e) {
      console.warn('업그레이드 구매 실패:', e);
    }
  }

  // 모바일 동적 플로팅 가상 조이스틱 (화면 좌측 60% 터치 시 터치 위치에 즉시 생성)
