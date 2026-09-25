// Anti Survivors - 무기 투사체, 장판, 결계 및 스킬 이펙트 수묵화(Ink-Wash) 렌더러 (js/weaponRenderer.js)
// 조선 서예 붓글씨(Calligraphy Stroke), 송연먹선(Ink Splash), 단청 오방색(진사 적색, 하엽 녹색, 군청 청색, 황금 황색) 명암 기반 렌더링

WeaponManager.prototype.draw = function(ctx) {
  // ==========================================
  // 0. 결계류 렌더링 (성역, 역병, 생츄어리)
  // ==========================================

  // 0-1. 기본 무기: 성역 (sanctuary) - 조선 천문도 팔괘 수묵 결계
  const sanctuary = this.weapons['sanctuary'];
  if (sanctuary) {
    const area = this.getArea(sanctuary);
    const radius = 90 * area;
    const time = Date.now() * 0.0018;
    const pulse = 0.18 + Math.sin(time * 2.5) * 0.04;

    ctx.save();
    // 한지 담묵 황금빛 번짐
    const grad = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.2, this.player.x, this.player.y, radius);
    grad.addColorStop(0, `rgba(202, 138, 4, ${pulse * 0.3})`);
    grad.addColorStop(0.75, `rgba(234, 179, 8, ${pulse})`);
    grad.addColorStop(1, 'rgba(9, 9, 11, 0.45)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 외곽 농묵 붓선 테두리
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = Math.max(2, Math.round(3.5 * Math.sqrt(area)));
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 내부 황금 단청 림
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
    ctx.lineWidth = Math.max(1, Math.round(1.8 * Math.sqrt(area)));
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // 8개 팔괘 묵선 룬 마커
    const runes = 8;
    for (let r = 0; r < runes; r++) {
      const rAngle = time + (r * Math.PI * 2) / runes;
      const rx = this.player.x + Math.cos(rAngle) * radius;
      const ry = this.player.y + Math.sin(rAngle) * radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.2 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 0-2. [진화 12] 역병 (plague) - 성스러운 맹독 자적(紫赤) 독기 묵연 결계
  const plague = this.weapons['plague'];
  if (plague) {
    const area = this.getArea(plague);
    const radius = 105 * area;
    const time = Date.now() * 0.0018;
    const pulse = 0.20 + Math.sin(time * 2.5) * 0.05;

    ctx.save();
    const grad = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.2, this.player.x, this.player.y, radius);
    grad.addColorStop(0, `rgba(59, 7, 100, ${pulse * 0.4})`);
    grad.addColorStop(0.7, `rgba(126, 34, 206, ${pulse})`);
    grad.addColorStop(1, 'rgba(5, 150, 105, 0.35)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = Math.max(2, Math.round(3.5 * Math.sqrt(area)));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
    ctx.lineWidth = Math.max(1, Math.round(2 * Math.sqrt(area)));
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    const runes = 8;
    for (let r = 0; r < runes; r++) {
      const rAngle = time + (r * Math.PI * 2) / runes;
      const rx = this.player.x + Math.cos(rAngle) * radius;
      const ry = this.player.y + Math.sin(rAngle) * radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(rx, ry, 5 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 0-3. [진화 1] 생츄어리 (heavenlySanctuary) - 청화 군청과 황금 단청의 이중 수묵 결계
  const heavenly = this.weapons['heavenlySanctuary'] || this.weapons['holyShotgun'];
  if (heavenly) {
    const area = this.getArea(heavenly);
    const radius = 135 * area;
    const time = Date.now() * 0.0022;
    const pulse = 0.22 + Math.sin(time * 3.0) * 0.06;

    ctx.save();
    const grad = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.15, this.player.x, this.player.y, radius);
    grad.addColorStop(0, `rgba(2, 132, 199, ${pulse * 0.4})`);
    grad.addColorStop(0.65, `rgba(202, 138, 4, ${pulse * 0.8})`);
    grad.addColorStop(1, 'rgba(9, 9, 11, 0.55)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 내부 청화 수묵 링
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
    ctx.lineWidth = Math.max(2, Math.round(2.5 * Math.sqrt(area)));
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // 외곽 농묵 붓선
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = Math.max(3, Math.round(4.5 * Math.sqrt(area)));
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 금박 림
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    const runes = 10;
    for (let r = 0; r < runes; r++) {
      const rAngle = time + (r * Math.PI * 2) / runes;
      const rx = this.player.x + Math.cos(rAngle) * radius;
      const ry = this.player.y + Math.sin(rAngle) * radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(rx, ry, 5.5 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = (r % 2 === 0) ? '#fde047' : '#0284c7';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.8 * Math.sqrt(area), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 1. 도트 장판 바닥 렌더링 (성수, 플라즈마, 독 웅덩이)
  // ==========================================
  for (const pool of this.damagePools) {
    const alpha = Math.min(0.48, pool.life * 0.28);
    const isHoly = pool.isHoly || false;
    const isPlasma = pool.isPlasma || false;

    ctx.save();
    // 한지 수묵 번짐 그라데이션
    const grad = ctx.createRadialGradient(pool.x, pool.y, pool.radius * 0.2, pool.x, pool.y, pool.radius);
    if (isPlasma) {
      grad.addColorStop(0, `rgba(2, 132, 199, ${alpha * 0.9})`);
      grad.addColorStop(1, `rgba(29, 78, 216, ${alpha * 0.2})`);
    } else if (isHoly) {
      grad.addColorStop(0, `rgba(2, 132, 199, ${alpha * 0.8})`);
      grad.addColorStop(1, `rgba(202, 138, 4, ${alpha * 0.25})`);
    } else {
      grad.addColorStop(0, `rgba(16, 185, 129, ${alpha * 0.85})`);
      grad.addColorStop(1, `rgba(5, 150, 105, ${alpha * 0.2})`);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
    ctx.fill();

    // 농묵 외곽선
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 튀는 수묵 방울 (Ink Droplets)
    const bubbleTime = Date.now() * 0.003;
    for (let b = 0; b < 4; b++) {
      const bx = pool.x + Math.sin(bubbleTime + b * 1.57) * (pool.radius * 0.65);
      const by = pool.y + Math.cos(bubbleTime + b * 1.57) * (pool.radius * 0.65);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isPlasma ? '#0284c7' : (isHoly ? '#fde047' : '#10b981');
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 1.5 번개 낙뢰 이펙트 (서예 갈필 비백 벼락)
  // ==========================================
  for (const ls of this.lightningStrikes) {
    const alpha = Math.min(1.0, ls.life / (ls.maxLife * 0.7));
    ctx.save();

    if (ls.segments && ls.segments.length > 0) {
      // 1. 농묵 두터운 외곽 갈필선
      ctx.strokeStyle = `rgba(9, 9, 11, ${alpha * 0.95})`;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(ls.segments[0].x, ls.segments[0].y);
      for (let i = 1; i < ls.segments.length; i++) {
        ctx.lineTo(ls.segments[i].x, ls.segments[i].y);
      }
      ctx.stroke();

      // 2. 청화 군청 / 단청 황금 뇌전선
      ctx.strokeStyle = `rgba(2, 132, 199, ${alpha * 0.9})`;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // 3. 백색 비백 벼락 중심핵
      ctx.strokeStyle = `rgba(250, 250, 249, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 지면 수묵 스플래시 (Ink Burst)
    const prog = 1 - ls.life / ls.maxLife;
    ctx.fillStyle = `rgba(9, 9, 11, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(ls.x, ls.y, ls.radius * prog, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(253, 224, 71, ${alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(ls.x, ls.y, ls.radius * prog * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================
  // 1.6 플라즈마 폭풍 이펙트 (회오리 묵선 충격파)
  // ==========================================
  for (const ps of this.plasmaStrikes) {
    const prog = 1 - (ps.life / ps.maxLife);
    const alpha = Math.min(1.0, ps.life / (ps.maxLife * 0.6));
    ctx.save();

    // 외곽 농묵 충격파
    ctx.strokeStyle = `rgba(9, 9, 11, ${alpha * 0.85})`;
    ctx.lineWidth = 6 * (1 - prog);
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.radius * prog, 0, Math.PI * 2);
    ctx.stroke();

    // 청화 붓선
    ctx.strokeStyle = `rgba(2, 132, 199, ${alpha})`;
    ctx.lineWidth = 3 * (1 - prog);
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.radius * prog - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // 중심 묵적 코어
    ctx.fillStyle = `rgba(9, 9, 11, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.radius * 0.35 * (1 - prog * 0.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(250, 250, 249, ${alpha * 0.95})`;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.radius * 0.16 * (1 - prog * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================
  // 2. 근접 베기 및 화염 기둥 렌더링
  // ==========================================
  for (const s of this.slashes) {
    if (s.isFlamePillar || s.isInferno) {
      // 화염 기둥 / 인페르노: 진사 적묵 소용돌이 기둥
      const prog = 1 - (s.life / s.maxLife);
      const alpha = Math.min(1.0, s.life / 0.16);
      ctx.save();

      // 한지 붉은 묵연 번짐
      ctx.fillStyle = s.isInferno ? `rgba(185, 28, 28, ${0.45 * alpha})` : `rgba(234, 88, 12, ${0.40 * alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * Math.min(1.0, prog * 1.4), 0, Math.PI * 2);
      ctx.fill();

      // 농묵 외곽선
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 내부 황금 불길 핵
      ctx.fillStyle = `rgba(253, 224, 71, ${0.75 * alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 0.42 * Math.min(1.0, prog * 1.4), 0, Math.PI * 2);
      ctx.fill();

      // 중심 백색 묵적
      ctx.fillStyle = `rgba(250, 250, 249, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 0.20 * Math.min(1.0, prog * 1.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (s.drawSector) {
      // 채찍 / 모닝스타: 서예 부채꼴 묵선 호 (Calligraphy Sector Stroke)
      const alpha = Math.min(1.0, s.life / s.maxLife);
      ctx.save();
      ctx.fillStyle = `rgba(9, 9, 11, ${0.28 * alpha})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, s.range, s.angle - s.arc / 2, s.angle + s.arc / 2);
      ctx.closePath();
      ctx.fill();

      // 외곽 날카로운 해서체 붓선
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.range, s.angle - s.arc / 2, s.angle + s.arc / 2);
      ctx.stroke();

      ctx.strokeStyle = s.isMorningstarTempest ? '#fde047' : '#ca8a04';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ==========================================
  // 3. 투사체 렌더링 (조선 서예 붓글씨 & 수묵 에셋 연동)
  // ==========================================
  for (const p of this.projectiles) {
    ctx.save();
    const projArea = p.area || 1.0;

    if (p.type === 'shuriken' || p.type === 'dagger') {
      // 표창 / 단검: 먹선 십자 날과 송연먹 회전 잔상
      const img = assets.images['proj_shuriken'] || assets.images['proj_dagger'];
      const size = Math.round(24 * projArea);
      const rot = p.rotAngle !== undefined ? p.rotAngle : (Math.atan2(p.vy, p.vx) + Math.PI / 2);

      ctx.translate(p.x, p.y);
      ctx.rotate(rot);

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      } else {
        // 완벽한 프로시저럴 수묵 십자 수리검 폴백
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-size / 2, -size / 7, size, (size * 2) / 7);
        ctx.fillRect(-size / 7, -size / 2, (size * 2) / 7, size);

        ctx.fillStyle = '#fde047';
        ctx.fillRect(-size / 3, -1.5, (size * 2) / 3, 3);
        ctx.fillRect(-1.5, -size / 3, 3, (size * 2) / 3);

        ctx.fillStyle = '#fafaf9';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === 'swordWave') {
      // [진화 4] 폭풍검: 조선 서예 붓글씨 초승달 비백(飛白) 검기
      const angle = Math.atan2(p.vy, p.vx);
      const sz = Math.round(30 * projArea);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      // 외곽 농묵 흑선
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(0, 0, sz, -Math.PI / 2.7, Math.PI / 2.7);
      ctx.quadraticCurveTo(-sz * 0.45, 0, Math.cos(-Math.PI / 2.7) * sz, Math.sin(-Math.PI / 2.7) * sz);
      ctx.fill();

      // 내부 황금빛 단청 비백 코어
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.72, -Math.PI / 3.0, Math.PI / 3.0);
      ctx.quadraticCurveTo(-sz * 0.32, 0, Math.cos(-Math.PI / 3.0) * (sz * 0.72), Math.sin(-Math.PI / 3.0) * (sz * 0.72));
      ctx.fill();

      // 날카로운 백색 비백 칼날선
      ctx.strokeStyle = '#fafaf9';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, sz - 1, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (p.type === 'apocalypseComet') {
      // [진화 3] 메테오: 거대 종말의 혜성 묵선
      const radius = p.radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'teslaPellet') {
      // [진화 5] 뇌전포: 뇌전 묵환 탄환
      const radius = p.radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'holyPellet') {
      // 신성 산탄 묵환
      const radius = p.radius || (6 * projArea);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'fireball') {
      // 화염구: 진사 묵화
      const radius = p.radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'arcaneMissile') {
      // 마법 화살: 청화 군청 묵적
      const radius = p.radius;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'poisonDagger' || p.type === 'frostDagger') {
      // 독비수 / 서리단검
      const angle = Math.atan2(p.vy, p.vx);
      const sz = Math.round(20 * projArea);
      const isFrost = p.type === 'frostDagger';

      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#09090b';
      ctx.fillRect(-sz / 2 - 1, -3.5, sz + 2, 7);

      ctx.fillStyle = isFrost ? '#0284c7' : '#059669';
      ctx.fillRect(-sz / 2, -2.5, sz, 5);

      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(-sz / 2 + 2, -1, sz - 4, 2);
    } else if (p.type === 'frostOrb' || p.type === 'venomBlizzardOrb') {
      // 빙결 보주 / 블리자드 보주: 서리먹 회전 구체
      const isBlizzard = p.type === 'venomBlizzardOrb';
      const radius = p.radius;
      const pulse = Math.sin(Date.now() * 0.008) * 4;

      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (51 * projArea) + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isBlizzard ? 'rgba(16, 185, 129, 0.65)' : 'rgba(2, 132, 199, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (51 * projArea) + pulse - 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isBlizzard ? '#059669' : '#0284c7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'poisonShard') {
      // 독성 파편
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'windArrow' || p.type === 'holyArrow') {
      // 바람 화살 / 신성 화살: 일필휘지 서예 화살
      const isHoly = p.type === 'holyArrow';
      const angle = Math.atan2(p.vy, p.vx);
      const sz = Math.round(22 * projArea);

      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#09090b';
      ctx.fillRect(-sz / 2 - 1, -2.5, sz + 2, 5);

      ctx.fillStyle = isHoly ? '#ca8a04' : '#059669';
      ctx.fillRect(-sz / 2, -1.8, sz, 3.6);

      // 화살촉
      ctx.fillStyle = isHoly ? '#fde047' : '#10b981';
      ctx.beginPath();
      ctx.moveTo(sz / 2 + 5, 0);
      ctx.lineTo(sz / 2 - 3, -4.5);
      ctx.lineTo(sz / 2 - 3, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(sz / 2 + 3, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'cycloneArrow') {
      // [진화 13] 태풍의 눈: 대형 비취빛 관통 회오리 화살 + 흡인 먹선 소용돌이
      const angle = Math.atan2(p.vy, p.vx);
      const sz = Math.round(32 * projArea);
      const growthProg = p.growthProg !== undefined ? p.growthProg : 0;
      const pulse = Math.sin(Date.now() * 0.012) * 5;

      ctx.translate(p.x, p.y);

      // 외곽 소용돌이 흡인 묵선
      ctx.strokeStyle = `rgba(9, 9, 11, ${0.45 * growthProg})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, (75 * projArea * growthProg) + (pulse * growthProg), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(16, 185, 129, ${0.65 * growthProg})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, (75 * projArea * growthProg) + (pulse * growthProg) - 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(angle);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-sz / 2 - 1, -4.5, sz + 2, 9);

      ctx.fillStyle = '#059669';
      ctx.fillRect(-sz / 2, -3.5, sz, 7);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(sz / 2 + 8, 0);
      ctx.lineTo(sz / 2 - 5, -7);
      ctx.lineTo(sz / 2 - 5, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(sz / 2 + 5, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'shadowOrbProj' || p.type === 'eclipseOrbProj' || p.type === 'voidGhostMissile') {
      // 어둠의 보주 / 황혼의 나선 심연 농묵 구체
      const isEclipse = p.type === 'eclipseOrbProj';
      const radius = p.radius;

      if (isEclipse) {
        ctx.strokeStyle = 'rgba(126, 34, 206, 0.7)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'chakram' || p.type === 'shadowVortex') {
      // 차크람 / 섀도우 차크람: 회전 톱날 묵선 원반
      const isVortex = p.type === 'shadowVortex';
      const r = p.radius;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotAngle || 0);

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isVortex ? '#3b0764' : '#27272a';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // 4개 회전 날
      ctx.fillStyle = isVortex ? '#10b981' : '#fde047';
      for (let b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-r * 0.22, -r * 1.25, r * 0.44, r * 0.55);
      }

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'holyCross' || p.type === 'divineJudgement') {
      // 십자가 / 저지먼트: 서예 해서체 십자 묵선
      const isDivine = p.type === 'divineJudgement';
      const r = p.radius;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotAngle || 0);

      ctx.fillStyle = '#09090b';
      ctx.fillRect(-r * 0.3 - 1, -r - 1, r * 0.6 + 2, r * 2 + 2);
      ctx.fillRect(-r * 0.8 - 1, -r * 0.45 - 1, r * 1.6 + 2, r * 0.6 + 2);

      ctx.fillStyle = isDivine ? '#ca8a04' : '#eab308';
      ctx.fillRect(-r * 0.26, -r, r * 0.52, r * 2);
      ctx.fillRect(-r * 0.76, -r * 0.42, r * 1.52, r * 0.52);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-r * 0.12, -r * 0.85, r * 0.24, r * 1.7);
      ctx.fillRect(-r * 0.65, -r * 0.32, r * 1.3, r * 0.32);

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'lavaPool') {
      // 인페르노 용암 장판: 진사 적묵 웅덩이
      const alpha = Math.min(1.0, p.life / 0.5);
      const pulse = Math.sin(Date.now() * 0.010) * 3;

      ctx.fillStyle = `rgba(9, 9, 11, ${0.45 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + pulse + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(185, 28, 28, ${0.42 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(234, 88, 12, ${0.55 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(253, 224, 71, ${0.7 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 일반/기타 투사체 수묵 폴백
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.color || '#ca8a04';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 4. [진화 4] 폭풍검 (slayerBladeStorm) 상시 회전 대검 & 도끼
  // ==========================================
  const bladeStorm = this.weapons['slayerBladeStorm'] || this.weapons['spinningAxe'];
  if (bladeStorm) {
    const area = this.getArea(bladeStorm);
    const orbitRadius = 85 * area;
    const count = this.getCount(bladeStorm);
    const imgAxe = assets.images['anim_axe'] || assets.images['proj_axe'];
    const imgSword = assets.images['anim_sword'] || assets.images['proj_sword'];
    const bladeSize = Math.round(38 * area);

    ctx.save();
    // 먹선 회전 궤적 호 (Calligraphy Orbit Ring)
    ctx.strokeStyle = 'rgba(9, 9, 11, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      const angle = bladeStorm.orbitAngle + (i * Math.PI * 2) / count;
      const bx = this.player.x + Math.cos(angle) * orbitRadius;
      const by = this.player.y + Math.sin(angle) * orbitRadius;
      const isAxe = (i % 2 === 0);
      const img = isAxe ? imgAxe : imgSword;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle * 3.5);

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -bladeSize / 2, -bladeSize / 2, bladeSize, bladeSize);
      } else {
        // 조선 환도 / 무쇠도끼 프로시저럴 묵선 렌더링
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 0, 16 * area + 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isAxe ? '#ea580c' : '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, 16 * area, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fafaf9';
        ctx.beginPath();
        ctx.arc(0, 0, 6 * area, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ==========================================
  // 5. [기본 무기 14] 어둠의 보주 (shadowOrb) 심연 사역마
  // ==========================================
  const shadowOrb = this.weapons['shadowOrb'];
  if (shadowOrb && shadowOrb.familiars) {
    const area = this.getArea(shadowOrb);
    const baseR = 12 * area;

    for (const fam of shadowOrb.familiars) {
      // 붓글씨 묵연(墨煙) 연기 잔상
      if (fam.trail && fam.trail.length > 1) {
        for (let t = 0; t < fam.trail.length; t++) {
          const pt = fam.trail[t];
          const alpha = (1 - t / fam.trail.length) * 0.40;
          const trR = baseR * (1 - (t / fam.trail.length) * 0.5);
          ctx.fillStyle = `rgba(9, 9, 11, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trR + 1, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(126, 34, 206, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // 6. [진화 14] 황혼의 나선 (eclipseSpiral) 대형 사역마 3체
  // ==========================================
  const eclipseSpiral = this.weapons['eclipseSpiral'];
  if (eclipseSpiral && eclipseSpiral.familiars) {
    const area = this.getArea(eclipseSpiral);
    const baseR = 16 * area;
    const pulseTime = Date.now() * 0.007;

    for (let fIdx = 0; fIdx < eclipseSpiral.familiars.length; fIdx++) {
      const fam = eclipseSpiral.familiars[fIdx];

      // 묵연 연기 꼬리
      if (fam.trail && fam.trail.length > 1) {
        for (let t = 0; t < fam.trail.length; t++) {
          const pt = fam.trail[t];
          const alpha = (1 - t / fam.trail.length) * 0.50;
          const trR = baseR * (1 - (t / fam.trail.length) * 0.45);
          ctx.fillStyle = `rgba(9, 9, 11, ${alpha * 0.75})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trR + 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      // 회전하는 자적 일식 묵륜 (Eclipse Ink Ring)
      const ringPulse = Math.sin(pulseTime * 2 + fIdx) * 3;
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR + 5 + ringPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(232, 121, 249, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR + 5 + ringPulse - 1, 0, Math.PI * 2);
      ctx.stroke();

      // 심연 농묵 코어
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(fam.x, fam.y, baseR * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
};
