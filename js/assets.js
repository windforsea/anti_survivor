// 다크 판타지 수묵화풍 픽셀 아트 에셋 로더 및 오프스크린 스프라이트 매니저

class AssetManager {
  constructor() {
    this.images = {};
    this.hitFlashImages = {};
    this.isLoaded = false;

    // 몬스터 30종 키 세트 (수묵화풍 렌더링 스무딩 적용 대상)
    this.sumieEnemyKeys = new Set([
      'bat', 'slime', 'miniSlime', 'zombie', 'skeleton', 'goblin', 'ghost',
      'gargoyle', 'cultist', 'assassin', 'golem', 'darkMage', 'bloodHound',
      'wraithSwarm', 'abyssTitan',
      'plankton', 'jellyfish', 'hermitCrab', 'flyingFish', 'seaLobster',
      'stingray', 'coralGolem', 'seaLeech', 'anglerFish', 'ghostJelly',
      'deepShark', 'poisonRay', 'shadowEel', 'voidSeaSerpent', 'trilobite'
    ]);

    // 보스 13종 키 세트 (64x64 고해상도 수묵화 렌더링 스무딩 적용 대상)
    this.sumieBossKeys = new Set([
      'boss_boar', 'boss_void', 'boss_eye', 'boss_colossus', 'boss_doom',
      'boss_lich', 'boss_reaper', 'boss_wyrm', 'boss_overlord',
      'boss_kraken', 'boss_titancrab', 'boss_leviathan', 'boss_dagon'
    ]);

    this.manifest = {
      player: 'assets/sprites/player.png',
      bat: 'assets/sprites/bat.png',
      slime: 'assets/sprites/slime.png',
      zombie: 'assets/sprites/zombie.png',
      skeleton: 'assets/sprites/skeleton.png',
      goblin: 'assets/sprites/goblin.png',
      ghost: 'assets/sprites/ghost.png',
      gargoyle: 'assets/sprites/gargoyle.png',
      cultist: 'assets/sprites/cultist.png',
      assassin: 'assets/sprites/assassin.png',
      golem: 'assets/sprites/golem.png',
      darkMage: 'assets/sprites/darkMage.png',
      bloodHound: 'assets/sprites/bloodHound.png',
      wraithSwarm: 'assets/sprites/wraithSwarm.png',
      abyssTitan: 'assets/sprites/abyssTitan.png',

      // 월드 2 심해 마물 15종
      plankton: 'assets/sprites/plankton.png',
      jellyfish: 'assets/sprites/jellyfish.png',
      hermitCrab: 'assets/sprites/hermitCrab.png',
      flyingFish: 'assets/sprites/flyingFish.png',
      seaLobster: 'assets/sprites/seaLobster.png',
      stingray: 'assets/sprites/stingray.png',
      coralGolem: 'assets/sprites/coralGolem.png',
      seaLeech: 'assets/sprites/seaLeech.png',
      anglerFish: 'assets/sprites/anglerFish.png',
      ghostJelly: 'assets/sprites/ghostJelly.png',
      deepShark: 'assets/sprites/deepShark.png',
      poisonRay: 'assets/sprites/poisonRay.png',
      shadowEel: 'assets/sprites/shadowEel.png',
      voidSeaSerpent: 'assets/sprites/voidSeaSerpent.png',
      trilobite: 'assets/sprites/trilobite.png',

      // 월드 1 및 엔드게임 보스 9종
      boss_boar: 'assets/sprites/boss_boar.png',
      boss_void: 'assets/sprites/boss_void.png',
      boss_eye: 'assets/sprites/boss_eye.png',
      boss_colossus: 'assets/sprites/boss_colossus.png',
      boss_doom: 'assets/sprites/boss_doom.png',
      boss_lich: 'assets/sprites/boss_lich.png',
      boss_reaper: 'assets/sprites/boss_reaper.png',
      boss_wyrm: 'assets/sprites/boss_wyrm.png',
      boss_overlord: 'assets/sprites/boss_overlord.png',

      // 월드 2 심해 4대 보스
      boss_kraken: 'assets/sprites/boss_kraken.png',
      boss_titancrab: 'assets/sprites/boss_titancrab.png',
      boss_leviathan: 'assets/sprites/boss_leviathan.png',
      boss_dagon: 'assets/sprites/boss_dagon.png',

      tile_floor: 'assets/sprites/tile_floor.png',

      // 카드 아이콘
      icon_sword: 'assets/sprites/icon_sword.png',
      icon_axe: 'assets/sprites/icon_axe.png',
      icon_dagger: 'assets/sprites/icon_dagger.png',
      icon_shuriken: 'assets/sprites/icon_shuriken.png',
      icon_whip: 'assets/sprites/icon_whip.png',
      icon_missile: 'assets/sprites/icon_missile.png',
      icon_shotgun: 'assets/sprites/icon_shotgun.png',
      icon_acid: 'assets/sprites/icon_acid.png',
      icon_holywater: 'assets/sprites/icon_holywater.png',
      icon_holyshotgun: 'assets/sprites/icon_holyshotgun.png',
      icon_heavenlysanctuary: 'assets/sprites/icon_heavenlysanctuary.png',
      icon_morningstartempest: 'assets/sprites/icon_morningstartempest.png',
      icon_apocalypsecomet: 'assets/sprites/icon_apocalypsecomet.png',
      icon_slayerbladestorm: 'assets/sprites/icon_slayerbladestorm.png',
      icon_teslashotgun: 'assets/sprites/icon_teslashotgun.png',
      icon_armor: 'assets/sprites/icon_armor.png',
      icon_speed: 'assets/sprites/icon_speed.png',
      icon_atk: 'assets/sprites/icon_atk.png',
      icon_heal: 'assets/sprites/icon_heal.png',
      icon_regen: 'assets/sprites/icon_regen.png',
      icon_hp: 'assets/sprites/icon_hp.png',
      icon_global_speed: 'assets/sprites/icon_global_speed.png',
      icon_proj_speed: 'assets/sprites/icon_proj_speed.png',
      icon_proj_count: 'assets/sprites/icon_proj_count.png',

      // 신규 무기 및 패시브 아이콘 & 아기 슬라임
      icon_sanctuary: 'assets/sprites/icon_sanctuary.png',
      icon_lightning: 'assets/sprites/icon_lightning.png',
      icon_firewand: 'assets/sprites/icon_firewand.png',
      icon_arcanesanctuary: 'assets/sprites/icon_arcanesanctuary.png',
      icon_plasmatempest: 'assets/sprites/icon_plasmatempest.png',
      icon_clover: 'assets/sprites/icon_clover.png',
      icon_crown: 'assets/sprites/icon_crown.png',
      miniSlime: 'assets/sprites/miniSlime.png',

      // 캐릭터 스프라이트
      player_mage: 'assets/sprites/player_mage.png',
      player_assassin: 'assets/sprites/player_assassin.png',
      player_cleric: 'assets/sprites/player_cleric.png',
      player_sylph: 'assets/sprites/player_sylph.png',
      player_malakar: 'assets/sprites/player_malakar.png',

      // 신규 무기 및 패시브 아이콘
      icon_poisondagger: 'assets/sprites/icon_poisondagger.png',
      icon_frostorb: 'assets/sprites/icon_frostorb.png',
      icon_venomblizzard: 'assets/sprites/icon_venomblizzard.png',
      icon_thunderblade: 'assets/sprites/icon_thunderblade.png',
      icon_fireaxe: 'assets/sprites/icon_fireaxe.png',
      icon_frostwhip: 'assets/sprites/icon_frostwhip.png',
      icon_scattershuriken: 'assets/sprites/icon_scattershuriken.png',
      icon_holyarrow: 'assets/sprites/icon_holyarrow.png',
      icon_plague: 'assets/sprites/icon_plague.png',
      icon_vampire: 'assets/sprites/icon_vampire.png',
      icon_shield: 'assets/sprites/icon_shield.png',
      icon_windbow: 'assets/sprites/icon_windbow.png',
      icon_shadoworb: 'assets/sprites/icon_shadoworb.png',
      icon_cyclonebow: 'assets/sprites/icon_cyclonebow.png',
      icon_eclipsespiral: 'assets/sprites/icon_eclipsespiral.png',
      icon_flamepillar: 'assets/sprites/icon_flamepillar.png',
      icon_chakram: 'assets/sprites/icon_chakram.png',
      icon_holycross: 'assets/sprites/icon_holycross.png',
      icon_infernocataclysm: 'assets/sprites/icon_infernocataclysm.png',
      icon_shadowvortex: 'assets/sprites/icon_shadowvortex.png',
      icon_divinejudgement: 'assets/sprites/icon_divinejudgement.png',
      icon_crit_dmg: 'assets/sprites/icon_crit_dmg.png',
      icon_thorns: 'assets/sprites/icon_thorns.png',

      // 특수 드랍 아이템
      item_magnet: 'assets/sprites/item_magnet.png',
      item_bomb: 'assets/sprites/item_bomb.png',
      item_freeze: 'assets/sprites/item_freeze.png',

      // 필드 장애물
      obstacle_rock: 'assets/sprites/obstacle_rock.png',
      obstacle_tree: 'assets/sprites/obstacle_tree.png',
      obstacle_crate: 'assets/sprites/obstacle_crate.png',

      // 무기 공격 애니메이션
      anim_sword: 'assets/sprites/anim_sword.png',
      anim_axe: 'assets/sprites/anim_axe.png',
      anim_dagger: 'assets/sprites/anim_dagger.png',
      anim_whip: 'assets/sprites/anim_whip.png',
      anim_bladewhip: 'assets/sprites/anim_bladewhip.png',
      anim_muzzle: 'assets/sprites/anim_muzzle.png',
      proj_dagger: 'assets/sprites/proj_dagger.png',
      proj_shuriken: 'assets/sprites/proj_shuriken.png',
      proj_holypellet: 'assets/sprites/proj_holypellet.png',

      // 수묵화풍 신규 무기 투사체 및 광역 이펙트
      proj_missile: 'assets/sprites/proj_missile.png',
      proj_shotgun: 'assets/sprites/proj_shotgun.png',
      proj_windarrow: 'assets/sprites/proj_windarrow.png',
      proj_holyarrow: 'assets/sprites/proj_holyarrow.png',
      proj_frostshard: 'assets/sprites/proj_frostshard.png',
      proj_axe: 'assets/sprites/proj_axe.png',
      proj_sword: 'assets/sprites/proj_sword.png',
      proj_chakram: 'assets/sprites/proj_chakram.png',
      proj_holycross: 'assets/sprites/proj_holycross.png',
      proj_frostorb: 'assets/sprites/proj_frostorb.png',
      proj_shadoworb: 'assets/sprites/proj_shadoworb.png',
      proj_fireball: 'assets/sprites/proj_fireball.png',
      proj_teslapellet: 'assets/sprites/proj_teslapellet.png',
      effect_sanctuary: 'assets/sprites/effect_sanctuary.png',
      effect_holywater: 'assets/sprites/effect_holywater.png',
      effect_flamepillar: 'assets/sprites/effect_flamepillar.png',
      effect_comet: 'assets/sprites/effect_comet.png',
      effect_cyclone: 'assets/sprites/effect_cyclone.png',
      effect_divine: 'assets/sprites/effect_divine.png'
    };
  }

  loadAll(onComplete) {
    const keys = Object.keys(this.manifest);
    let loadedCount = 0;

    keys.forEach(key => {
      const img = new Image();
      img.src = this.manifest[key];
      img.onload = () => {
        this.images[key] = img;
        this.createHitFlashVersion(key, img);
        loadedCount++;
        if (loadedCount === keys.length) {
          this.isLoaded = true;
          if (onComplete) onComplete();
        }
      };
      img.onerror = () => {
        console.warn(`[AssetManager] 에셋 로드 실패: ${this.manifest[key]}`);
        loadedCount++;
        if (loadedCount === keys.length) {
          this.isLoaded = true;
          if (onComplete) onComplete();
        }
      };
    });
  }

  createHitFlashVersion(key, img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.hitFlashImages[key] = canvas;
  }

  drawSprite(ctx, key, x, y, size, facingX = 1, isHitFlash = false) {
    const img = (isHitFlash && this.hitFlashImages[key]) ? this.hitFlashImages[key] : this.images[key];
    if (!img) return false;
    if (img instanceof HTMLImageElement && (!img.complete || img.naturalWidth === 0)) return false;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // 좌우 방향에 따른 반전
    if (facingX < 0) {
      ctx.scale(-1, 1);
    }

    // 영웅(128x128), 일반 몬스터 30종(32x32), 보스 13종(64x64) 및 수묵 투사체/이펙트는 먹선 부드러움 보간 처리
    const isSumie = key.startsWith('player') || key.startsWith('proj_') || key.startsWith('effect_') || this.sumieEnemyKeys.has(key) || this.sumieBossKeys.has(key);
    ctx.imageSmoothingEnabled = isSumie;
    if (isSumie) {
      ctx.imageSmoothingQuality = 'high';
    }

    const half = size / 2;
    ctx.drawImage(img, -half, -half, size, size);

    ctx.restore();
    return true;
  }
}

const assets = new AssetManager();
