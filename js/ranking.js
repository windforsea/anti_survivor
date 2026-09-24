// Anti Survivors - 명예의 전당 REST API 및 랭킹 모달 (js/ranking.js)

UIManager.prototype.renderHallOfFame = function(data) {
    const defaultRecords = [
      { name: 'ho', quote: 'yaho', clearTime: '13:45', timeSeconds: 825, hero: 'knight', level: 36, kills: 890, date: 1789692887241 },
      { name: '성기사 아더', quote: '빛의 가호로 어둠을 물리쳤다!', clearTime: '14:12', timeSeconds: 852, hero: 'knight', level: 34, kills: 810, date: 1789685000000 },
      { name: '마도학자 린', quote: '화염의 폭풍 앞에 모든 것이 재가 되리라.', clearTime: '14:38', timeSeconds: 878, hero: 'mage', level: 32, kills: 760, date: 1789680000000 }
    ];

    let records = (data && Array.isArray(data.records) && data.records.length > 0)
      ? [...data.records]
      : (data && Array.isArray(data.top3) && data.top3.length > 0)
        ? [...data.top3]
        : defaultRecords;

    records.sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));

    // 상위 3위 채우기
    while (records.length < 3) {
      records.push(defaultRecords[records.length] || {
        name: '용감한 서바이버',
        quote: '새로운 챔피언의 도전을 기다립니다.',
        clearTime: '15:00',
        timeSeconds: 900
      });
    }

    const top3 = records.slice(0, 3);
    const medals = ['🥇 1위', '🥈 2위', '🥉 3위'];
    const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

    if (this.hofRankList) {
      this.hofRankList.innerHTML = top3.map((rec, idx) => {
        const heroName = rec.hero === 'mage' ? '화염 마도사' : rec.hero === 'assassin' ? '그림자 암살자' : rec.hero === 'cleric' ? '해골 성직자' : '방랑 기사';
        return `
          <div class="hof-card ${rankClasses[idx]}">
            <div class="hof-medal">${medals[idx]}</div>
            <div class="hof-info">
              <div class="hof-info-top">
                <span class="hof-user-name">${rec.name || '익명'}</span>
                <span class="hof-time-badge">⏱️ ${rec.clearTime || '18:45'}</span>
              </div>
              <div class="hof-meta" style="margin-top: 6px;">Lv.${rec.level || 30} ${heroName} · ⚔️ ${rec.kills || 0}처치</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4번째 칸: 최근 클리어 유저 기록
    const recent = (data && data.recent)
      ? data.recent
      : (records[0] || defaultRecords[0]);

    if (this.hofRecentCard) {
      const recentHero = recent.hero === 'mage' ? '화염 마도사' : recent.hero === 'assassin' ? '그림자 암살자' : recent.hero === 'cleric' ? '해골 성직자' : '방랑 기사';
      const dateStr = recent.date ? new Date(recent.date).toLocaleDateString() : '최근';

      this.hofRecentCard.innerHTML = `
        <div class="hof-recent-icon">⚡</div>
        <div class="hof-info">
          <div class="hof-info-top">
            <span class="hof-user-name" style="color: #38bdf8;">${recent.name || '익명'} <small style="font-size: 11px; color: #94a3b8;">(${dateStr})</small></span>
            <span class="hof-time-badge" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">⏱️ ${recent.clearTime || '18:45'}</span>
          </div>
          <div class="hof-meta" style="color: #0284c7; margin-top: 6px;">Lv.${recent.level || 30} ${recentHero} · ⚔️ ${recent.kills || 0}처치</div>
        </div>
      `;
    }
  }

UIManager.prototype.closeHallOfFame = function() {
    if (this.hallOfFameModal) {
      this.hallOfFameModal.classList.add('hidden');
    }
  }

  // 캐릭터 선택 모달 표시
