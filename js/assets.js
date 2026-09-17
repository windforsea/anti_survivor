// 다크 판타지 픽셀 아트 에셋 로더 및 오프스크린 스프라이트 매니저

class AssetManager {
  constructor() {
    this.images = {};
    this.hitFlashImages = {};
    this.isLoaded = false;

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
      boss_boar: 'assets/sprites/boss_boar.png',
      boss_void: 'assets/sprites/boss_void.png',
      boss_eye: 'assets/sprites/boss_eye.png',
      boss_colossus: 'assets/sprites/boss_colossus.png',
      boss_doom: 'assets/sprites/boss_doom.png',
      boss_lich: 'assets/sprites/boss_lich.png',
      boss_reaper: 'assets/sprites/boss_reaper.png',
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
      proj_holypellet: 'assets/sprites/proj_holypellet.png'
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

  // 피격 시 레트로 아케이드 흰색 점멸(Hit Flash) 효과용 오프스크린 캔버스 생성
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

    // 픽셀 보간 끄기 (선명한 도트 유지)
    ctx.imageSmoothingEnabled = false;

    const half = size / 2;
    ctx.drawImage(img, -half, -half, size, size);

    ctx.restore();
    return true;
  }
}

const assets = new AssetManager();
