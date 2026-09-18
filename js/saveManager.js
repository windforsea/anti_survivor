// ==========================================
// SaveManager: 세이브 데이터 무결성 검증 및 해시 체크섬 매니저
// ==========================================

class SaveManager {
  constructor() {
    this.storageKey = 'vam_save_data';
    this.salt = 'anti_survivor_v1_secure_salt_#2026_@key!';
  }

  // FNV-1a 32-bit 해시 알고리즘 기반 서명 계산
  calculateSignature(gold, upgrades) {
    const sortedUpgrades = {};
    if (upgrades && typeof upgrades === 'object') {
      Object.keys(upgrades).sort().forEach(k => {
        sortedUpgrades[k] = Number(upgrades[k]) || 0;
      });
    }

    const payload = `g:${Number(gold) || 0}|u:${JSON.stringify(sortedUpgrades)}|s:${this.salt}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  // 기본 세이브 데이터 구조
  getDefaultData() {
    return {
      gold: 0,
      upgrades: {},
      _sig: this.calculateSignature(0, {})
    };
  }

  // 데이터 무결성 검증 및 로드
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        const defaultData = this.getDefaultData();
        this.save(defaultData);
        return defaultData;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('손상된 세이브 형식');
      }

      const gold = Math.max(0, Math.floor(Number(parsed.gold) || 0));
      const upgrades = (parsed.upgrades && typeof parsed.upgrades === 'object') ? parsed.upgrades : {};

      // 1. 서명이 이미 존재하는 경우 무결성 체크
      if (parsed._sig) {
        const expectedSig = this.calculateSignature(gold, upgrades);
        if (parsed._sig !== expectedSig) {
          console.warn('⚠️ [보안 경고] 세이브 데이터 변조가 감지되었습니다. 세이브 데이터를 초기화합니다.');
          const resetData = this.getDefaultData();
          this.save(resetData);
          return resetData;
        }
        return { gold, upgrades, _sig: parsed._sig };
      }

      // 2. 구버전 세이브 마이그레이션 (기존 정상 데이터 서명 자동 발급)
      const isReasonableGold = gold >= 0 && gold <= 300000;
      let isReasonableUpgrades = true;
      for (const key of Object.keys(upgrades)) {
        const lv = Number(upgrades[key]);
        if (isNaN(lv) || lv < 0 || lv > 10) {
          isReasonableUpgrades = false;
          break;
        }
      }

      if (isReasonableGold && isReasonableUpgrades) {
        const migratedData = {
          gold,
          upgrades,
          _sig: this.calculateSignature(gold, upgrades)
        };
        this.save(migratedData);
        return migratedData;
      } else {
        console.warn('⚠️ [보안 경고] 비정상적인 구버전 데이터가 감지되어 초기화되었습니다.');
        const resetData = this.getDefaultData();
        this.save(resetData);
        return resetData;
      }
    } catch (e) {
      console.warn('세이브 로드 오류:', e);
      return this.getDefaultData();
    }
  }

  // 데이터 안전 저장 (항상 최신 서명 계산 후 기록)
  save(data) {
    try {
      const gold = Math.max(0, Math.floor(Number(data.gold) || 0));
      const upgrades = (data.upgrades && typeof data.upgrades === 'object') ? data.upgrades : {};
      const _sig = this.calculateSignature(gold, upgrades);

      const payload = { gold, upgrades, _sig };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      return payload;
    } catch (e) {
      console.warn('세이브 저장 실패:', e);
      return null;
    }
  }

  // 골드 누적 획득
  addGold(earned) {
    if (typeof earned !== 'number' || earned <= 0 || isNaN(earned)) return;
    const current = this.load();
    current.gold = (current.gold || 0) + Math.floor(earned);
    return this.save(current);
  }

  // 영구 업그레이드 구매
  spendGoldForUpgrade(id, cost, nextLv) {
    const current = this.load();
    if ((current.gold || 0) < cost) return false;

    current.gold -= cost;
    if (!current.upgrades) current.upgrades = {};
    current.upgrades[id] = nextLv;

    this.save(current);
    return true;
  }
}

// 전역 인스턴스 등록
const saveManager = new SaveManager();
