// 📦 [아이템 도메인] 5종 필드 특수 드랍 아이템 (포션, 자석, 폭탄, 얼음, 금화)
export class PickupItem {
  constructor(type, x, y, goldValue = 1) {
    this.type = type; // heal, magnet, bomb, freeze, gold
    this.x = x;
    this.y = y;
    this.radius = type === 'gold' ? 12 : 14;
    this.goldValue = goldValue;
    this.life = Infinity;
    this.bobTimer = Math.random() * 10;
    this.magnetized = false;
    this.magnetSpeed = 0;
  }

  update(dt, player) {
    this.bobTimer += dt * 4;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (this.magnetized || (this.type === 'gold' && dist < player.magnetRadius)) {
      const speed = 360 + this.magnetSpeed;
      this.magnetSpeed += dt * 500;
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;
    } else if (window.game && window.game.obstacleManager) {
      for (const obs of window.game.obstacleManager.obstacles) {
        if (obs.isDead) continue;
        const od = Math.hypot(this.x - obs.x, this.y - obs.y);
        const minD = obs.radius + this.radius + 8;
        if (od < minD && od > 0.01) {
          this.x = obs.x + ((this.x - obs.x) / od) * minD;
          this.y = obs.y + ((this.y - obs.y) / od) * minD;
        }
      }
    }

    return dist < player.radius + this.radius;
  }

  draw(ctx) {
    ctx.save();
    const bobOffset = Math.sin(this.bobTimer) * 3;
    ctx.translate(this.x, this.y + bobOffset);
    const spriteKey = 'item_' + this.type;
    const drawn = (typeof assets !== 'undefined') && assets.draw(ctx, spriteKey, 0, 0, this.radius * 2, this.radius * 2);
    if (!drawn) {
      ctx.fillStyle = this.type === 'heal' ? '#ef4444' : this.type === 'magnet' ? '#3b82f6' : this.type === 'bomb' ? '#f97316' : this.type === 'freeze' ? '#06b6d4' : '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.PickupItem = PickupItem;
}