// Anti Survivors - 무기 투사체/장판 렌더러 (js/weaponRenderer.js)

WeaponManager.prototype.draw = function(ctx) {
    // 0. 성역 (sanctuary) 360도 오라 결계 렌더링
    const sanctuary = this.weapons['sanctuary'];
    if (sanctuary) {
      const area = this.getArea(sanctuary);
      const radius = 90 * area;
      const time = Date.now() * 0.002;
      const pulse = 0.16 + Math.sin(time * 3) * 0.05;

      ctx.save();
      // 성스러운 황금빛 오라 바닥
      ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 결계 외곽 테두리선
      ctx.strokeStyle = `rgba(253, 224, 71, ${pulse + 0.35})`;
      ctx.lineWidth = Math.max(2, Math.round(3 * Math.sqrt(area)));
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // 회전하는 8개 성스러운 룬 마커
      const runes = 8;
      for (let r = 0; r < runes; r++) {
        const rAngle = time + (r * Math.PI * 2) / runes;
        const rx = this.player.x + Math.cos(rAngle) * radius;
        const ry = this.player.y + Math.sin(rAngle) * radius;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5 * Math.sqrt(area), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 0-1. 역병 (plague) 360도 독기 결계 렌더링
    const plague = this.weapons['plague'];
    if (plague) {
      const area = this.getArea(plague);
      const radius = 105 * area;
      const time = Date.now() * 0.002;
      const pulse = 0.18 + Math.sin(time * 3) * 0.06;

      ctx.save();
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(34, 197, 94, ${pulse + 0.4})`;
      ctx.lineWidth = Math.max(2, Math.round(3 * Math.sqrt(area)));
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.stroke();

      const runes = 8;
      for (let r = 0; r < runes; r++) {
        const rAngle = time + (r * Math.PI * 2) / runes;
        const rx = this.player.x + Math.cos(rAngle) * radius;
        const ry = this.player.y + Math.sin(rAngle) * radius;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(rx, ry, 4 * Math.sqrt(area), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 0.1 [진화 1] 생츄어리 (heavenlySanctuary) 초대형 황금빛+성수 결계 렌더링
    const heavenly = this.weapons['heavenlySanctuary'] || this.weapons['holyShotgun'];
    if (heavenly) {
      const area = this.getArea(heavenly);
      const radius = 135 * area;
      const time = Date.now() * 0.003;
      const pulse = 0.24 + Math.sin(time * 3.5) * 0.08;

      ctx.save();
      // 성스러운 황금빛 + 청록빛(성수) 이중 결계
      const grad = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.2, this.player.x, this.player.y, radius);
      grad.addColorStop(0, `rgba(56, 189, 248, ${pulse * 0.5})`);
      grad.addColorStop(0.7, `rgba(250, 204, 21, ${pulse * 0.7})`);
      grad.addColorStop(1, `rgba(253, 224, 71, ${pulse * 0.2})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 결계 내부 성수 파동 링
      ctx.strokeStyle = `rgba(56, 189, 248, ${pulse + 0.3})`;
      ctx.lineWidth = Math.max(2, Math.round(2.5 * Math.sqrt(area)));
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius * 0.60, 0, Math.PI * 2);
      ctx.stroke();

      // 외곽 황금 테두리
      ctx.strokeStyle = `rgba(254, 240, 138, ${pulse + 0.45})`;
      ctx.lineWidth = Math.max(3, Math.round(4.5 * Math.sqrt(area)));
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // 회전하는 10개 천상 룬 마커
      const runes = 10;
      for (let r = 0; r < runes; r++) {
        const rAngle = time + (r * Math.PI * 2) / runes;
        const rx = this.player.x + Math.cos(rAngle) * radius;
        const ry = this.player.y + Math.sin(rAngle) * radius;
        ctx.fillStyle = r % 2 === 0 ? '#fef08a' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5 * Math.sqrt(area), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 1. 도트 장판 바닥 렌더링
    for (const pool of this.damagePools) {
      const alpha = Math.min(0.5, pool.life * 0.3);
      const isHoly = pool.isHoly || false;
      const isPlasma = pool.isPlasma || false;
      ctx.save();
      if (isPlasma) {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
      } else if (isHoly) {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();

      if (isPlasma) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${alpha + 0.35})`;
      } else if (isHoly) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha + 0.25})`;
      } else {
        ctx.strokeStyle = `rgba(134, 239, 172, ${alpha + 0.2})`;
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      const bubbleTime = Date.now() * 0.005;
      for (let b = 0; b < 3; b++) {
        const bx = pool.x + Math.sin(bubbleTime + b * 2) * (pool.radius * 0.6);
        const by = pool.y + Math.cos(bubbleTime + b * 2) * (pool.radius * 0.6);
        ctx.fillStyle = isPlasma ? `rgba(254, 240, 138, ${alpha + 0.4})` : (isHoly ? `rgba(224, 242, 254, ${alpha + 0.35})` : `rgba(187, 247, 208, ${alpha + 0.3})`);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 1.5 번개 낙뢰 이펙트 렌더링
    for (const ls of this.lightningStrikes) {
      const alpha = Math.min(1.0, ls.life / (ls.maxLife * 0.7));
      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      if (ls.segments && ls.segments.length > 0) {
        ctx.moveTo(ls.segments[0].x, ls.segments[0].y);
        for (let i = 1; i < ls.segments.length; i++) {
          ctx.lineTo(ls.segments[i].x, ls.segments[i].y);
        }
      }
      ctx.stroke();

      // 밝은 코어 번개선
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 지면 타격 충격 지점
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(ls.x, ls.y, ls.radius * (1 - ls.life / ls.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 1.6 플라즈마 폭풍 이펙트 렌더링
    for (const ps of this.plasmaStrikes) {
      const prog = 1 - (ps.life / ps.maxLife);
      const alpha = Math.min(1.0, ps.life / (ps.maxLife * 0.6));
      ctx.save();
      // 확장되는 플라즈마 충격파
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 5 * (1 - prog);
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * prog, 0, Math.PI * 2);
      ctx.stroke();

      // 중심 초고열 플라즈마 구
      ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * 0.35 * (1 - prog * 0.5), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.radius * 0.18 * (1 - prog * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 근접 베기 렌더링: 투명 인디케이터(부채꼴/원형 선) 완전 제거 (순수 무기 휘두르기 스프라이트 연출만 표시)

    // 3. 투사체 렌더링 (범위 증가 시 투사체 크기도 비례 확대)
    for (const p of this.projectiles) {
      ctx.save();
      const projArea = p.area || 1.0;

      if (p.type === 'shuriken' || p.type === 'dagger') {
        // 표창 스프라이트 렌더링 (고속 회전 연출)
        const img = assets.images['proj_shuriken'] || assets.images['proj_dagger'];
        const size = Math.round(22 * projArea);
        const rot = p.rotAngle !== undefined ? p.rotAngle : (Math.atan2(p.vy, p.vx) + Math.PI / 2);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.translate(p.x, p.y);
          ctx.rotate(rot);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(rot);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-size / 2, -size / 6, size, size / 3);
          ctx.fillRect(-size / 6, -size / 2, size / 3, size);
          ctx.restore();
        }
      } else if (p.type === 'apocalypseComet') {
        // [진화 3] 메테오 고열 마도 혜성 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.40, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'teslaPellet') {
        // [진화 5] 뇌전포 탄환 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'swordWave') {
        // [진화 4] 폭풍검 초승달 검기 렌더링
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(26 * projArea);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, sz, -Math.PI / 3, Math.PI / 3);
        ctx.quadraticCurveTo(-sz * 0.4, 0, Math.cos(-Math.PI / 3) * sz, Math.sin(-Math.PI / 3) * sz);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'holyPellet') {
        // 홀리 산탄총 성스러운 탄환 렌더링
        const img = assets.images['proj_holypellet'];
        const size = Math.round(16 * projArea);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'fireball') {
        // 불 지팡이 폭발 화염구 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'arcaneMissile') {
        // 비전 성역 유도탄 렌더링
        const radius = p.radius;
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'poisonDagger') {
        // 독비수 렌더링 (녹색 독성 안광 + 고속 직진 비수)
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(18 * projArea);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 12;
        ctx.fillRect(-sz / 2, -3, sz, 6);
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(-sz / 2 + 2, -1.5, sz - 4, 3);
        ctx.restore();
      } else if (p.type === 'frostOrb') {
        // 빙결 보주 렌더링 (시안빛 회전 얼음 구체 + 냉기 펄스 테두리)
        const radius = p.radius;
        const pulse = Math.sin(Date.now() * 0.008) * 4;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (51 * projArea) + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'venomBlizzardOrb') {
        // [진화 6] 블리자드 보주 렌더링 (맹독 녹색 + 빙결 시안 회전 구체 + 광역 파동 링)
        const radius = p.radius;
        const pulse = Math.sin(Date.now() * 0.010) * 6;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (51 * projArea) + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'poisonShard') {
        // 블리자드 2단계 독성 얼음 파편 렌더링
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'windArrow') {
        // 바람 활 바람 화살 렌더링 (날렵한 청록색 화살)
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(20 * projArea);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
        ctx.fillRect(-sz / 2, -2, sz, 4);
        // 화살촉
        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.moveTo(sz / 2 + 4, 0);
        ctx.lineTo(sz / 2 - 2, -4);
        ctx.lineTo(sz / 2 - 2, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'cycloneArrow') {
        // [진화 7] 태풍의 눈 소용돌이 화살 렌더링 (대형 비취빛 화살 + 회전 소용돌이 링)
        const angle = Math.atan2(p.vy, p.vx);
        const sz = Math.round(30 * projArea);
        const pulse = Math.sin(Date.now() * 0.015) * 5;
        ctx.save();
        ctx.translate(p.x, p.y);
        // 외곽 소용돌이 흡인 링
        const growthProg = p.growthProg !== undefined ? p.growthProg : 0;
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.45 * growthProg})`;
        ctx.lineWidth = 1.5 + growthProg * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, (50 * projArea * growthProg) + (pulse * growthProg), 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(angle);
        ctx.fillStyle = '#059669';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.fillRect(-sz / 2, -4, sz, 8);
        ctx.fillStyle = '#6ee7b7';
        ctx.fillRect(-sz / 2 + 3, -2, sz - 6, 4);
        // 대형 비취 촉
        ctx.fillStyle = '#ecfdf5';
        ctx.beginPath();
        ctx.moveTo(sz / 2 + 8, 0);
        ctx.lineTo(sz / 2 - 4, -7);
        ctx.lineTo(sz / 2 - 4, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'shadowOrbProj') {
        // 어둠의 보주 렌더링 (심연의 보랏빛 궤도 구체)
        const radius = p.radius;
        ctx.fillStyle = '#7c3aed';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'eclipseOrbProj') {
        // [진화 8] 황혼의 나선 대형 암흑 보주 (보라-자주 펄스 + 심연 코어)
        const radius = p.radius;
        const pulse = Math.sin(Date.now() * 0.012) * 3;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 4 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4c1d95';
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'voidGhostMissile') {
        // 황혼의 나선 공허 유령탄 (유도탄)
        const radius = p.radius;
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 일반 투사체 (마법 화살, 산탄)
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. [진화 4] 폭풍검 (slayerBladeStorm) 상시 궤도 회전 대검 & 도끼 렌더링
    const bladeStorm = this.weapons['slayerBladeStorm'] || this.weapons['spinningAxe'];
    if (bladeStorm) {
      const area = this.getArea(bladeStorm);
      const orbitRadius = 85 * area;
      const count = this.getCount(bladeStorm);
      const imgAxe = assets.images['anim_axe'];
      const imgSword = assets.images['anim_sword'];
      const bladeSize = Math.round(38 * area);

      for (let i = 0; i < count; i++) {
        const angle = bladeStorm.orbitAngle + (i * Math.PI * 2) / count;
        const bx = this.player.x + Math.cos(angle) * orbitRadius;
        const by = this.player.y + Math.sin(angle) * orbitRadius;
        const isAxe = (i % 2 === 0);
        const img = isAxe ? imgAxe : imgSword;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle * 3.5);
        ctx.shadowColor = isAxe ? '#d97706' : '#38bdf8';
        ctx.shadowBlur = 14;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, -bladeSize / 2, -bladeSize / 2, bladeSize, bladeSize);
        } else {
          ctx.fillStyle = isAxe ? '#d97706' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 16 * area, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 5. [기본 무기 14] 어둠의 보주 (shadowOrb) 자율 추적 사역마(소환수 구체) 렌더링
    const shadowOrb = this.weapons['shadowOrb'];
    if (shadowOrb && shadowOrb.familiars) {
      const area = this.getArea(shadowOrb);
      const baseR = 12 * area;

      for (const fam of shadowOrb.familiars) {
        // 잔상 렌더링 (보랏빛 유성 꼬리)
        if (fam.trail && fam.trail.length > 1) {
          for (let t = 0; t < fam.trail.length; t++) {
            const pt = fam.trail[t];
            const alpha = (1 - t / fam.trail.length) * 0.45;
            const trR = baseR * (1 - (t / fam.trail.length) * 0.5);
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, trR, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 외곽 암흑 글로우 오라
        ctx.save();
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#6b21a8';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR, 0, Math.PI * 2);
        ctx.fill();

        // 내부 마력 코어
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 중심 하이라이트 점
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 6. [진화 14] 황혼의 나선 (eclipseSpiral) 대형 사역마 3체 및 일식 링 렌더링
    const eclipseSpiral = this.weapons['eclipseSpiral'];
    if (eclipseSpiral && eclipseSpiral.familiars) {
      const area = this.getArea(eclipseSpiral);
      const baseR = 16 * area;
      const pulseTime = Date.now() * 0.008;

      for (let fIdx = 0; fIdx < eclipseSpiral.familiars.length; fIdx++) {
        const fam = eclipseSpiral.familiars[fIdx];

        // 잔상 렌더링 (은하수 보라-자주빛 꼬리)
        if (fam.trail && fam.trail.length > 1) {
          for (let t = 0; t < fam.trail.length; t++) {
            const pt = fam.trail[t];
            const alpha = (1 - t / fam.trail.length) * 0.55;
            const trR = baseR * (1 - (t / fam.trail.length) * 0.45);
            ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, trR, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.save();
        // 회전하는 일식 고리 (Eclipse Ring)
        const ringPulse = Math.sin(pulseTime * 2 + fIdx) * 3;
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.75)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR + 5 + ringPulse, 0, Math.PI * 2);
        ctx.stroke();

        // 본체 암흑 코어
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR, 0, Math.PI * 2);
        ctx.fill();

        // 황혼 에너지 펄스
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // 백색 비전 중심핵
        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath();
        ctx.arc(fam.x, fam.y, baseR * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
