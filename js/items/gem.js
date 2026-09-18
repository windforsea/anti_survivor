// 💎 [아이템 도메인] 경험치 보석 (ExpGem) 클래스
export class ExpGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.magnetized = false;
    this.radius = value >= 50 ? 8 : (value >= 20 ? 6 : (value >= 5 ? 5 : 4));
    this.color = value >= 50 ? '#facc15' : (value >= 20 ? '#ef4444' : (value >= 5 ? '#22c55e' : '#38bdf8'));
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.magnetized || dist < player.magnetRadius) {
      const speed = this.magnetized ? 750 : (420 + (1 - dist / player.magnetRadius) * 480);
      this.vx = (dx / (dist || 1)) * speed;
      this.vy = (dy / (dist || 1)) * speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (window.game && window.game.obstacleManager) {
      for (const obs of window.game.obstacleManager.obstacles) {
        if (obs.isDead) continue;
        const od = Math.hypot(this.x - obs.x, this.y - obs.y);
        const minD = obs.radius + this.radius + 6;
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
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.value >= 50 ? 10 : 6;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();

    if (this.value >= 50) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.ExpGem = ExpGem;
}