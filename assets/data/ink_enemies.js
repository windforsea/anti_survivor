// Anti Survivors - 128x128 수묵화풍 일반 몬스터 30종 전체 래스터라이저 (ink_enemies.js)
// Phase 1: 월드 1 기본 8종 (bat, slime, miniSlime, zombie, skeleton, goblin, ghost, gargoyle)
// Phase 2: 월드 1 고급 7종 (cultist, assassin, golem, darkMage, bloodHound, wraithSwarm, abyssTitan)
// Phase 3: 월드 2 심해 기본 8종 (plankton, jellyfish, hermitCrab, flyingFish, seaLobster, stingray, coralGolem, seaLeech)
// Phase 4: 월드 2 심해 심연 최종 7종 (anglerFish, ghostJelly, deepShark, poisonRay, shadowEel, voidSeaSerpent, trilobite)
// 순수 JS 기반 Zero-dependency: 128x128 캔버스에 직접 농묵/중묵/담묵 번짐, 서예 붓터치, 단청 안광 구현

const WIDTH = 128;
const HEIGHT = 128;
const CX = 64;
const CY = 64;

// ================= 단청(丹靑) 오방색 및 수묵 팔레트 =================
const INK_COLORS = {
  // 수묵 (농묵, 중묵, 담묵, 운수)
  INK_DEEP: [10, 12, 18],        // 濃墨 (극도로 진한 송연먹)
  INK_MID: [32, 36, 48],         // 中墨 (깊은 먹빛)
  INK_LIGHT: [68, 76, 94],       // 淡墨 (물에 번진 먹빛)
  INK_WASH: [105, 115, 138],     // 雲水 (은은한 수묵 안개)
  INK_FAINT: [168, 178, 196],    // 극담묵 (선염 잔상)

  // 단청 오방색 & 호분 백색
  WHITE_JADE: [248, 250, 255],   // 옥백 (호분 백색, 하이라이트)
  WHITE_SILVER: [210, 222, 238], // 은백 (차가운 강철/상아)
  
  RED_CRIMSON: [225, 29, 72],    // 선혈 진홍 (단청 주홍)
  RED_DEEP: [159, 18, 57],       // 석간주 (묵직한 암적색)
  RED_FIRE: [244, 63, 94],       // 화염 홍안 (타오르는 불꽃)

  GOLD_ROYAL: [250, 204, 21],    // 어전 황금 (제왕/황토 코어)
  GOLD_AMBER: [217, 119, 6],     // 삼색 황토 (온화한 호박색)
  GOLD_BRIGHT: [254, 240, 138],  // 명황 (빛의 코어)

  BLUE_AZURE: [2, 132, 199],     // 감청 (단청 푸른빛)
  BLUE_CYAN: [6, 182, 212],      // 비취 시안 (영기, 플라즈마, 생체발광)
  BLUE_MIDNIGHT: [15, 23, 42],   // 심해 암청 (어둠의 장막)

  GREEN_JADE: [16, 185, 129],    // 벽옥 에메랄드
  GREEN_VENOM: [34, 197, 94],    // 맹독 취록 / 하엽록
  GREEN_DARK: [20, 83, 45],      // 송록 (깊은 소나무 먹록색)
  GREEN_MINT: [110, 231, 183],   // 담청록 (슬라임/해파리 하이라이트)

  PURPLE_ARCANE: [168, 85, 247], // 아케인 자황
  PURPLE_SHADOW: [88, 28, 135],  // 심연 흑자
  PURPLE_VOID: [46, 16, 101]     // 공허 극자색
};

// ================= 시드 기반 결정적 의사난수 생성기 =================
function createPRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ================= 128x128 순수 JS 고해상도 소프트웨어 래스터라이저 =================
class EnemyInkCanvas {
  constructor(width = WIDTH, height = HEIGHT) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4);
  }

  // Alpha Over 블렌딩
  blendPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    const sa = Math.min(1, Math.max(0, a));
    const da = this.buffer[idx + 3] / 255;
    const outA = sa + da * (1 - sa);

    if (outA > 0) {
      const dr = this.buffer[idx];
      const dg = this.buffer[idx + 1];
      const db = this.buffer[idx + 2];

      this.buffer[idx] = Math.round((r * sa + dr * da * (1 - sa)) / outA);
      this.buffer[idx + 1] = Math.round((g * sa + dg * da * (1 - sa)) / outA);
      this.buffer[idx + 2] = Math.round((b * sa + db * da * (1 - sa)) / outA);
      this.buffer[idx + 3] = Math.round(outA * 255);
    }
  }

  // 가산 블렌딩 (빛, 안광, 영혼불, 에너지 코어, 심해 생체발광)
  addPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    const sa = Math.min(1, Math.max(0, a));

    this.buffer[idx] = Math.min(255, this.buffer[idx] + Math.round(r * sa));
    this.buffer[idx + 1] = Math.min(255, this.buffer[idx + 1] + Math.round(g * sa));
    this.buffer[idx + 2] = Math.min(255, this.buffer[idx + 2] + Math.round(b * sa));
    this.buffer[idx + 3] = Math.min(255, this.buffer[idx + 3] + Math.round(sa * 255 * 0.75));
  }

  // 서브픽셀 안티앨리어싱 원형 스탬프
  stampDisc(cx, cy, radius, color, alpha = 1.0, isAdditive = false) {
    const minX = Math.max(0, Math.floor(cx - radius - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius + 1));
    const minY = Math.max(0, Math.floor(cy - radius - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius + 1));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius + 0.5) {
          const edgeAlpha = dist > radius - 0.5 ? Math.max(0, radius + 0.5 - dist) : 1.0;
          const finalAlpha = alpha * edgeAlpha;
          if (isAdditive) {
            this.addPixel(x, y, color[0], color[1], color[2], finalAlpha);
          } else {
            this.blendPixel(x, y, color[0], color[1], color[2], finalAlpha);
          }
        }
      }
    }
  }

  // 타원형 스탬프 (동공, 몸체 선염 묵염, 갑각)
  stampEllipse(cx, cy, rx, ry, angleRad, color, alpha = 1.0, isAdditive = false) {
    const maxR = Math.max(rx, ry) + 1;
    const minX = Math.max(0, Math.floor(cx - maxR));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + maxR));
    const minY = Math.max(0, Math.floor(cy - maxR));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + maxR));

    const cosA = Math.cos(-angleRad);
    const sinA = Math.sin(-angleRad);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const rotX = dx * cosA - dy * sinA;
        const rotY = dx * sinA + dy * cosA;
        const d = (rotX * rotX) / (rx * rx) + (rotY * rotY) / (ry * ry);
        if (d <= 1.0) {
          const edgeAlpha = d > 0.8 ? Math.max(0, (1.0 - d) / 0.2) : 1.0;
          const finalAlpha = alpha * edgeAlpha;
          if (isAdditive) {
            this.addPixel(x, y, color[0], color[1], color[2], finalAlpha);
          } else {
            this.blendPixel(x, y, color[0], color[1], color[2], finalAlpha);
          }
        }
      }
    }
  }

  // 방사형 수묵 번짐 워시 (Ink Wash Gradient)
  drawRadialWash(cx, cy, radius, innerColor, outerColor, innerAlpha = 0.8, outerAlpha = 0.0) {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const t = dist / radius;
          const smoothT = t * t * (3 - 2 * t);
          const r = Math.round(innerColor[0] * (1 - smoothT) + outerColor[0] * smoothT);
          const g = Math.round(innerColor[1] * (1 - smoothT) + outerColor[1] * smoothT);
          const b = Math.round(innerColor[2] * (1 - smoothT) + outerColor[2] * smoothT);
          const a = innerAlpha * (1 - smoothT) + outerAlpha * smoothT;
          this.blendPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  // 발광 오라 (Neon / Spiritual Glow / Bioluminescence)
  drawGlow(cx, cy, radius, color, intensity = 0.5) {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const t = dist / radius;
          const a = intensity * Math.pow(1 - t, 2.2);
          this.addPixel(x, y, color[0], color[1], color[2], a);
        }
      }
    }
  }

  // 서예 붓터치 곡선 스트로크 (기필, 행필, 수필 필압 및 비백 반영)
  drawCalligraphyStroke(points, color, widthStart, widthEnd, options = {}) {
    if (points.length < 2) return;
    const {
      alpha = 0.95,
      isAdditive = false,
      feiBai = 0.0,
      prng = Math.random
    } = options;

    let totalDist = 0;
    const dists = [0];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0];
      const dy = points[i + 1][1] - points[i][1];
      const d = Math.sqrt(dx * dx + dy * dy);
      totalDist += d;
      dists.push(totalDist);
    }
    if (totalDist === 0) return;

    const step = 0.35;
    const steps = Math.ceil(totalDist / step);

    for (let s = 0; s <= steps; s++) {
      const curDist = (s / steps) * totalDist;
      let seg = 0;
      while (seg < dists.length - 1 && dists[seg + 1] < curDist) {
        seg++;
      }
      const segLen = dists[seg + 1] - dists[seg];
      const tSeg = segLen > 0 ? (curDist - dists[seg]) / segLen : 0;
      const x = points[seg][0] + (points[seg + 1][0] - points[seg][0]) * tSeg;
      const y = points[seg][1] + (points[seg + 1][1] - points[seg][1]) * tSeg;

      const progress = curDist / totalDist;
      const pressure = Math.sin(progress * Math.PI * 0.9 + 0.1);
      const curWidth = widthStart + (widthEnd - widthStart) * progress;
      const radius = Math.max(0.5, (curWidth * (0.6 + 0.5 * pressure)) / 2);

      if (feiBai > 0 && progress > 0.15) {
        const splitChance = feiBai * (0.35 + 0.5 * progress);
        if (prng() < splitChance) {
          const normalX = -(points[seg + 1][1] - points[seg][1]);
          const normalY = points[seg + 1][0] - points[seg][0];
          const nLen = Math.sqrt(normalX * normalX + normalY * normalY) || 1;
          const off = radius * 0.75;
          this.stampDisc(x + (normalX / nLen) * off, y + (normalY / nLen) * off, radius * 0.4, color, alpha * 0.85, isAdditive);
          this.stampDisc(x - (normalX / nLen) * off, y - (normalY / nLen) * off, radius * 0.35, color, alpha * 0.75, isAdditive);
          continue;
        }
      }

      this.stampDisc(x, y, radius, color, alpha, isAdditive);
    }
  }

  // 좌우 대칭 붓터치 헬퍼
  drawSymmetricStroke(points, color, widthStart, widthEnd, options = {}) {
    this.drawCalligraphyStroke(points, color, widthStart, widthEnd, options);
    const mirrored = points.map(pt => [WIDTH - pt[0], pt[1]]);
    this.drawCalligraphyStroke(mirrored, color, widthStart, widthEnd, options);
  }

  // 비묵(飛墨, Splatter) 효과
  drawSplatter(cx, cy, count = 8, spread = 25, color = INK_COLORS.INK_DEEP, seed = 701) {
    const prng = createPRNG(seed);
    for (let i = 0; i < count; i++) {
      const angle = prng() * Math.PI * 2;
      const dist = 6 + prng() * spread;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = 0.5 + prng() * 1.5;
      const a = 0.35 + prng() * 0.55;
      this.stampDisc(x, y, size, color, a);
    }
  }
}

// ================= 일반 몬스터 30종 128x128 수묵화풍 렌더러 =================

const ENEMY_RENDERERS = {
  // ---------------- 월드 1 기본 8종 ----------------

  // 1. 박쥐 (bat)
  // 날렵하고 거친 수묵 날개선, 비백 피막 번짐, 솟구친 귀와 진홍빛 단청 안광
  bat: (canvas) => {
    const prng = createPRNG(2001);

    // [후방] 잔상 및 먹물 튀김
    canvas.drawRadialWash(CX, CY - 4, 38, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.28, 0.0);
    canvas.drawSplatter(CX, CY - 4, 10, 32, INK_COLORS.INK_DEEP, 2002);

    // [박쥐 날개막 먹물 번짐 (Wash)]
    canvas.stampEllipse(CX - 32, CY - 6, 26, 15, -0.25, INK_COLORS.INK_LIGHT, 0.45);
    canvas.stampEllipse(CX + 32, CY - 6, 26, 15, 0.25, INK_COLORS.INK_LIGHT, 0.45);
    canvas.stampEllipse(CX - 28, CY - 2, 20, 10, -0.15, INK_COLORS.PURPLE_SHADOW, 0.35);
    canvas.stampEllipse(CX + 28, CY - 2, 20, 10, 0.15, INK_COLORS.PURPLE_SHADOW, 0.35);

    // [날개 상단 강한 흑묵 골격선 (좌우 대칭)]
    const wingBoneMain = [
      [CX - 8, CY - 2],
      [CX - 28, CY - 24],
      [CX - 46, CY - 30],
      [CX - 60, CY - 18]
    ];
    canvas.drawSymmetricStroke(wingBoneMain, INK_COLORS.INK_DEEP, 5.0, 1.8, { alpha: 0.98, feiBai: 0.2, prng });

    // [날개 외곽 갈고리 및 지골 뼈대]
    const finger1 = [[CX - 46, CY - 30], [CX - 54, CY - 2], [CX - 52, CY + 14]];
    const finger2 = [[CX - 46, CY - 30], [CX - 34, CY + 8], [CX - 32, CY + 22]];
    const finger3 = [[CX - 28, CY - 24], [CX - 18, CY + 10], [CX - 14, CY + 20]];
    canvas.drawSymmetricStroke(finger1, INK_COLORS.INK_DEEP, 2.8, 1.0, { alpha: 0.95, prng });
    canvas.drawSymmetricStroke(finger2, INK_COLORS.INK_DEEP, 2.4, 0.9, { alpha: 0.95, prng });
    canvas.drawSymmetricStroke(finger3, INK_COLORS.INK_DEEP, 2.2, 0.8, { alpha: 0.95, prng });

    // 날개 하단 호(arc) 마감선
    const wingRim = [
      [CX - 60, CY - 18], [CX - 56, CY - 2], [CX - 52, CY + 14],
      [CX - 42, CY + 8], [CX - 32, CY + 22],
      [CX - 22, CY + 10], [CX - 14, CY + 20], [CX - 6, CY + 8]
    ];
    canvas.drawSymmetricStroke(wingRim, INK_COLORS.INK_MID, 2.0, 1.2, { alpha: 0.9, feiBai: 0.3, prng });

    // [박쥐 몸체와 털]
    canvas.stampEllipse(CX, CY + 2, 10, 16, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY + 2, 12, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // [머리 및 뾰족한 귀]
    canvas.stampDisc(CX, CY - 10, 8.5, INK_COLORS.INK_DEEP, 0.99);
    const leftEar = [[CX - 4, CY - 14], [CX - 10, CY - 28], [CX - 14, CY - 32], [CX - 8, CY - 18]];
    canvas.drawSymmetricStroke(leftEar, INK_COLORS.INK_DEEP, 3.5, 1.0, { alpha: 0.98, prng });
    canvas.drawSymmetricStroke(leftEar, INK_COLORS.PURPLE_ARCANE, 1.2, 0.5, { alpha: 0.65, isAdditive: true, prng });

    // [단청 주홍 안광과 송곳니]
    canvas.drawGlow(CX - 4.5, CY - 10, 8, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawGlow(CX + 4.5, CY - 10, 8, INK_COLORS.RED_FIRE, 0.9);
    canvas.stampDisc(CX - 4.5, CY - 10, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 10, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 4.5, CY - 10, 0.8, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 10, 0.8, INK_COLORS.WHITE_JADE, 1.0);

    // 아래 송곳니 2점
    canvas.stampDisc(CX - 3, CY - 5, 0.9, INK_COLORS.WHITE_JADE, 0.95);
    canvas.stampDisc(CX + 3, CY - 5, 0.9, INK_COLORS.WHITE_JADE, 0.95);
  },

  // 2. 슬라임 (slime)
  // 바닥에 넓게 퍼진 묵지(墨池) 웅덩이, 투명한 맹독 비취 수포, 코어 발광과 점안
  slime: (canvas) => {
    const prng = createPRNG(2003);

    // [바닥 먹물 웅덩이 및 튀김]
    canvas.stampEllipse(CX, CY + 30, 44, 14, 0, INK_COLORS.INK_DEEP, 0.9);
    canvas.drawRadialWash(CX, CY + 28, 42, INK_COLORS.GREEN_DARK, INK_COLORS.INK_DEEP, 0.75, 0.1);
    canvas.drawSplatter(CX, CY + 28, 12, 38, INK_COLORS.GREEN_DARK, 2004);

    // [슬라임 돔 외곽 서예 필선 (점성 표현)]
    const slimeContour = [
      [CX - 38, CY + 26], [CX - 34, CY + 6], [CX - 22, CY - 16],
      [CX, CY - 28],
      [CX + 22, CY - 16], [CX + 34, CY + 6], [CX + 38, CY + 26]
    ];
    canvas.drawCalligraphyStroke(slimeContour, INK_COLORS.INK_DEEP, 7.5, 7.5, { alpha: 0.98, feiBai: 0.15, prng });

    // [내부 농담 번짐 (하엽록 -> 맹독 취록 -> 옥백)]
    canvas.drawRadialWash(CX, CY + 10, 36, INK_COLORS.GREEN_VENOM, INK_COLORS.GREEN_DARK, 0.9, 0.4);
    canvas.drawRadialWash(CX, CY - 2, 22, INK_COLORS.GREEN_MINT, INK_COLORS.GREEN_VENOM, 0.85, 0.2);

    // [내부 점성 코어 및 기포]
    canvas.drawGlow(CX, CY + 6, 22, INK_COLORS.GREEN_MINT, 0.75);
    canvas.stampDisc(CX - 12, CY + 12, 5.5, INK_COLORS.GREEN_DARK, 0.8);
    canvas.stampDisc(CX + 14, CY + 8, 4.0, INK_COLORS.GREEN_DARK, 0.75);
    canvas.stampDisc(CX - 2, CY + 18, 6.0, INK_COLORS.GREEN_DARK, 0.85);

    // [상단 하이라이트 백은/옥백 수묵 윤기]
    const highlightCurve = [
      [CX - 16, CY - 18], [CX - 4, CY - 24], [CX + 8, CY - 22]
    ];
    canvas.drawCalligraphyStroke(highlightCurve, INK_COLORS.WHITE_JADE, 3.8, 1.2, { alpha: 0.85, isAdditive: true, prng });

    // [수묵화풍 먹방울 안구 2점]
    canvas.stampDisc(CX - 13, CY + 2, 6.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX - 13, CY + 2, 4.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX - 12, CY + 2, 2.4, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX - 14, CY, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    canvas.stampDisc(CX + 13, CY + 2, 6.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 13, CY + 2, 4.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 12, CY + 2, 2.4, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX + 10, CY, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // 바닥 끈적이는 먹물 융합선
    canvas.drawCalligraphyStroke([[CX - 36, CY + 28], [CX + 36, CY + 28]], INK_COLORS.INK_DEEP, 5.0, 5.0, { alpha: 0.98, prng });
  },

  // 3. 아기 슬라임 (miniSlime)
  // 앙증맞은 소형 수묵 물방울, 투명한 영롱함, 호기심 어린 큰 점안
  miniSlime: (canvas) => {
    const prng = createPRNG(2005);

    // 바닥 소형 묵흔
    canvas.stampEllipse(CX, CY + 24, 26, 9, 0, INK_COLORS.INK_DEEP, 0.85);
    canvas.drawRadialWash(CX, CY + 22, 24, INK_COLORS.GREEN_DARK, INK_COLORS.INK_DEEP, 0.6, 0.0);
    canvas.drawSplatter(CX, CY + 22, 6, 20, INK_COLORS.GREEN_DARK, 2006);

    // 몸체 서예 외곽선
    const miniContour = [
      [CX - 22, CY + 20], [CX - 18, CY + 6], [CX - 12, CY - 10],
      [CX, CY - 18],
      [CX + 12, CY - 10], [CX + 18, CY + 6], [CX + 22, CY + 20]
    ];
    canvas.drawCalligraphyStroke(miniContour, INK_COLORS.INK_DEEP, 5.0, 5.0, { alpha: 0.98, prng });

    // 내부 워시
    canvas.drawRadialWash(CX, CY + 6, 20, INK_COLORS.GREEN_MINT, INK_COLORS.GREEN_VENOM, 0.9, 0.3);
    canvas.drawGlow(CX, CY + 4, 15, INK_COLORS.GREEN_MINT, 0.7);

    // 상단 윤기
    canvas.drawCalligraphyStroke([[CX - 8, CY - 12], [CX + 4, CY - 14]], INK_COLORS.WHITE_JADE, 2.4, 0.8, { alpha: 0.8, isAdditive: true, prng });

    // 동글동글한 큰 눈망울
    canvas.stampDisc(CX - 8, CY + 4, 4.8, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX - 8, CY + 4, 3.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX - 7, CY + 4, 1.8, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX - 9, CY + 2, 0.9, INK_COLORS.WHITE_JADE, 1.0);

    canvas.stampDisc(CX + 8, CY + 4, 4.8, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 8, CY + 4, 3.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 7, CY + 4, 1.8, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX + 6, CY + 2, 0.9, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 4. 좀비 (zombie)
  // 비대칭으로 부패한 담묵 살점, 휜 척추 골격, 찢어진 수의 넝마, 비취 시안의 섬뜩한 안광
  zombie: (canvas) => {
    const prng = createPRNG(2007);

    // [배경] 썩어가는 사기(死氣) 수묵 워시
    canvas.drawRadialWash(CX, CY, 42, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 10, 12, 34, INK_COLORS.INK_DEEP, 2008);

    // [다리 및 찢어진 바지] 절뚝이는 다리
    const leftLeg = [[CX - 10, CY + 24], [CX - 14, CY + 42], [CX - 18, CY + 54]];
    const rightLeg = [[CX + 8, CY + 24], [CX + 12, CY + 38], [CX + 16, CY + 54]];
    canvas.drawCalligraphyStroke(leftLeg, INK_COLORS.INK_DEEP, 6.0, 4.0, { alpha: 0.98, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke(rightLeg, INK_COLORS.INK_DEEP, 5.5, 3.5, { alpha: 0.98, feiBai: 0.2, prng });

    // [구부러진 흉부 및 부패한 몸체]
    const torsoPts = [
      [CX - 16, CY - 4], [CX - 22, CY + 14], [CX - 12, CY + 28],
      [CX + 14, CY + 28], [CX + 18, CY + 12], [CX + 12, CY - 4]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 6.5, 5.5, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, CY + 12, 20, INK_COLORS.INK_LIGHT, INK_COLORS.INK_MID, 0.9, 0.4);

    // 썩어 드러난 갈비뼈 선
    canvas.drawCalligraphyStroke([[CX - 8, CY + 6], [CX + 6, CY + 8]], INK_COLORS.WHITE_SILVER, 2.5, 1.2, { alpha: 0.7, prng });
    canvas.drawCalligraphyStroke([[CX - 10, CY + 14], [CX + 4, CY + 16]], INK_COLORS.WHITE_SILVER, 2.5, 1.2, { alpha: 0.7, prng });

    // [너덜너덜 앞으로 뻗은 양팔]
    const leftArm = [[CX - 16, CY - 2], [CX - 28, CY + 8], [CX - 38, CY + 16]];
    const rightArm = [[CX + 14, CY], [CX + 28, CY + 10], [CX + 40, CY + 12]];
    canvas.drawCalligraphyStroke(leftArm, INK_COLORS.INK_DEEP, 5.0, 2.2, { alpha: 0.98, feiBai: 0.35, prng });
    canvas.drawCalligraphyStroke(rightArm, INK_COLORS.INK_DEEP, 5.0, 2.2, { alpha: 0.98, feiBai: 0.3, prng });

    // [기울어진 좀비 머리]
    canvas.stampEllipse(CX - 2, CY - 22, 13, 15, -0.15, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 2, CY - 22, 12, INK_COLORS.WHITE_SILVER, INK_COLORS.INK_LIGHT, 0.95, 0.5);

    // 비틀린 턱과 찢어진 입
    const jawPts = [[CX - 10, CY - 14], [CX - 4, CY - 8], [CX + 6, CY - 10]];
    canvas.drawCalligraphyStroke(jawPts, INK_COLORS.INK_DEEP, 3.5, 2.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 6, CY - 10], [CX + 2, CY - 11]], INK_COLORS.RED_DEEP, 2.0, 1.0, { alpha: 0.9, prng });

    // [번뜩이는 단청 비취 시안 안광]
    canvas.drawGlow(CX - 6, CY - 24, 10, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.drawGlow(CX + 4, CY - 23, 10, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.stampDisc(CX - 6, CY - 24, 2.0, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX + 4, CY - 23, 2.0, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX - 6, CY - 24, 0.8, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 4, CY - 23, 0.8, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 5. 해골 (skeleton)
  // 순백의 호분 백골, 짙은 송연먹선 늑골과 관절, 퀭한 안와 속 타오르는 진홍 영혼불
  skeleton: (canvas) => {
    const prng = createPRNG(2009);

    // [배경] 묘지의 차가운 청묵 서기
    canvas.drawRadialWash(CX, CY, 40, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.3, 0.0);
    canvas.drawSplatter(CX, CY + 14, 8, 30, INK_COLORS.INK_DEEP, 2010);

    // [두개골 본체]
    canvas.stampDisc(CX, CY - 24, 15, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 24, 14, INK_COLORS.WHITE_JADE, INK_COLORS.WHITE_SILVER, 0.98, 0.6);

    // 턱뼈 및 이빨
    const jawPts = [[CX - 8, CY - 12], [CX - 5, CY - 4], [CX + 5, CY - 4], [CX + 8, CY - 12]];
    canvas.drawCalligraphyStroke(jawPts, INK_COLORS.INK_DEEP, 3.2, 3.2, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 4, CY - 7], [CX + 4, CY - 7]], INK_COLORS.INK_DEEP, 2.0, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 4, CY - 7], [CX + 4, CY - 7]], INK_COLORS.WHITE_JADE, 1.2, 1.2, { alpha: 0.95, isAdditive: true, prng });

    // [퀭한 안와와 진홍 영혼불]
    canvas.stampEllipse(CX - 6, CY - 24, 4.0, 4.8, 0.05, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX + 6, CY - 24, 4.0, 4.8, -0.05, INK_COLORS.INK_DEEP, 1.0);
    canvas.drawGlow(CX - 6, CY - 24, 10, INK_COLORS.RED_FIRE, 0.85);
    canvas.drawGlow(CX + 6, CY - 24, 10, INK_COLORS.RED_FIRE, 0.85);
    canvas.stampDisc(CX - 6, CY - 24, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX + 6, CY - 24, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 6, CY - 24, 0.8, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 6, CY - 24, 0.8, INK_COLORS.GOLD_BRIGHT, 1.0);

    // 코 삼각형 구멍
    canvas.stampDisc(CX, CY - 17, 1.5, INK_COLORS.INK_DEEP, 1.0);

    // [경추 및 척추 (먹선 + 백골)]
    const spine = [[CX, CY - 4], [CX, CY + 24]];
    canvas.drawCalligraphyStroke(spine, INK_COLORS.INK_DEEP, 4.5, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(spine, INK_COLORS.WHITE_JADE, 2.4, 1.8, { alpha: 0.95, isAdditive: true, prng });

    // [갈비뼈 (Ribs) 대칭 필선]
    const ribs = [
      [[CX, CY + 2], [CX - 14, CY + 1], [CX - 16, CY + 6]],
      [[CX, CY + 8], [CX - 16, CY + 8], [CX - 18, CY + 14]],
      [[CX, CY + 14], [CX - 15, CY + 15], [CX - 16, CY + 20]],
      [[CX, CY + 20], [CX - 12, CY + 22], [CX - 13, CY + 26]]
    ];
    ribs.forEach(r => {
      canvas.drawSymmetricStroke(r, INK_COLORS.INK_DEEP, 2.8, 1.5, { alpha: 0.98, prng });
      canvas.drawSymmetricStroke(r, INK_COLORS.WHITE_JADE, 1.5, 0.8, { alpha: 0.95, isAdditive: true, prng });
    });

    // [골반 (Pelvis)]
    const pelvis = [[CX - 14, CY + 24], [CX, CY + 28], [CX + 14, CY + 24]];
    canvas.drawCalligraphyStroke(pelvis, INK_COLORS.WHITE_JADE, 4.0, 4.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(pelvis, INK_COLORS.INK_DEEP, 1.6, 1.6, { alpha: 0.8, prng });

    // [사지 뼈 (다리와 팔)]
    const leftLegSkeleton = [[CX - 10, CY + 28], [CX - 14, CY + 42], [CX - 16, CY + 56]];
    const rightLegSkeleton = [[CX + 10, CY + 28], [CX + 14, CY + 42], [CX + 16, CY + 56]];
    canvas.drawCalligraphyStroke(leftLegSkeleton, INK_COLORS.WHITE_JADE, 3.2, 1.8, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightLegSkeleton, INK_COLORS.WHITE_JADE, 3.2, 1.8, { alpha: 0.98, prng });

    const leftArmSkeleton = [[CX - 14, CY + 2], [CX - 24, CY + 14], [CX - 32, CY + 26]];
    const rightArmSkeleton = [[CX + 14, CY + 2], [CX + 24, CY + 14], [CX + 32, CY + 26]];
    canvas.drawCalligraphyStroke(leftArmSkeleton, INK_COLORS.WHITE_JADE, 2.8, 1.4, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightArmSkeleton, INK_COLORS.WHITE_JADE, 2.8, 1.4, { alpha: 0.98, prng });
  },

  // 6. 고블린 (goblin)
  // 길게 뻗은 뾰족귀, 웅크린 잔등과 송록빛 피부, 단청 황금 안광과 차가운 먹선 단도
  goblin: (canvas) => {
    const prng = createPRNG(2011);

    // [배경] 비열한 살기 수묵 워시
    canvas.drawRadialWash(CX, CY, 40, INK_COLORS.GREEN_DARK, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 16, 10, 32, INK_COLORS.INK_DEEP, 2012);

    // [웅크린 가죽 조끼 및 몸통]
    const torsoPts = [
      [CX - 16, CY + 4], [CX - 22, CY + 20], [CX - 14, CY + 36],
      [CX + 14, CY + 36], [CX + 20, CY + 18], [CX + 14, CY + 4]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 6.5, 5.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 18, 18, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 조끼 가죽 끈
    canvas.drawCalligraphyStroke([[CX - 12, CY + 8], [CX + 10, CY + 28]], INK_COLORS.GOLD_AMBER, 2.2, 1.2, { alpha: 0.85, prng });
    canvas.drawCalligraphyStroke([[CX + 10, CY + 8], [CX - 10, CY + 26]], INK_COLORS.GOLD_AMBER, 2.2, 1.2, { alpha: 0.85, prng });

    // [웅크린 민첩한 다리]
    const leftLeg = [[CX - 12, CY + 34], [CX - 24, CY + 44], [CX - 22, CY + 56]];
    const rightLeg = [[CX + 12, CY + 34], [CX + 22, CY + 44], [CX + 20, CY + 56]];
    canvas.drawCalligraphyStroke(leftLeg, INK_COLORS.INK_DEEP, 5.0, 3.2, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightLeg, INK_COLORS.INK_DEEP, 5.0, 3.2, { alpha: 0.98, prng });

    // [고블린 머리 및 피부]
    canvas.stampDisc(CX, CY - 12, 14, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 12, 13, INK_COLORS.GREEN_VENOM, INK_COLORS.GREEN_DARK, 0.95, 0.6);

    // [좌우로 솟구친 거대한 고블린 뾰족귀 (대칭)]
    const leftEar = [
      [CX - 8, CY - 10], [CX - 22, CY - 18], [CX - 38, CY - 24],
      [CX - 24, CY - 8], [CX - 10, CY - 4]
    ];
    canvas.drawSymmetricStroke(leftEar, INK_COLORS.INK_DEEP, 4.5, 1.2, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(leftEar, INK_COLORS.GREEN_VENOM, 2.2, 0.8, { alpha: 0.8, prng });

    // [주창코와 음흉한 입]
    canvas.stampEllipse(CX, CY - 8, 4.5, 3.0, 0, INK_COLORS.GREEN_DARK, 0.95);
    const smirk = [[CX - 7, CY - 2], [CX, CY - 4], [CX + 8, CY - 1]];
    canvas.drawCalligraphyStroke(smirk, INK_COLORS.INK_DEEP, 2.5, 1.5, { alpha: 0.98, prng });
    canvas.stampDisc(CX - 4, CY - 4, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 5, CY - 3, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // [단청 황금/황토 안광]
    canvas.drawGlow(CX - 6, CY - 14, 8, INK_COLORS.GOLD_BRIGHT, 0.8);
    canvas.drawGlow(CX + 6, CY - 14, 8, INK_COLORS.GOLD_BRIGHT, 0.8);
    canvas.stampDisc(CX - 6, CY - 14, 2.4, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampDisc(CX + 6, CY - 14, 2.4, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampDisc(CX - 6, CY - 14, 1.0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX + 6, CY - 14, 1.0, INK_COLORS.INK_DEEP, 1.0);

    // [단도 (Dagger)를 쥐고 있는 오른손]
    const daggerBlade = [[CX + 24, CY + 14], [CX + 38, CY + 4], [CX + 48, CY - 4]];
    canvas.drawCalligraphyStroke(daggerBlade, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(daggerBlade, INK_COLORS.WHITE_SILVER, 2.0, 0.6, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawGlow(CX + 42, CY, 10, INK_COLORS.WHITE_SILVER, 0.5);
  },

  // 7. 유령 (ghost)
  // 비백(갈필)으로 흐트러지는 영체 꼬리, 청묵/담옥색 환영 오라, 깊은 심연의 공허 안구
  ghost: (canvas) => {
    const prng = createPRNG(2013);

    // [배경] 은은한 한기와 영기(靈氣) 워시
    canvas.drawRadialWash(CX, CY - 8, 48, INK_COLORS.BLUE_CYAN, INK_COLORS.INK_LIGHT, 0.45, 0.0);
    canvas.drawGlow(CX, CY - 8, 42, INK_COLORS.BLUE_CYAN, 0.65);
    canvas.drawSplatter(CX, CY + 10, 12, 36, INK_COLORS.BLUE_CYAN, 2014);

    // [영체 꼬리선 (하단으로 물결치며 흩어지는 비백 필선)]
    const tail1 = [[CX - 18, CY + 4], [CX - 24, CY + 28], [CX - 32, CY + 52]];
    const tail2 = [[CX, CY + 8], [CX - 4, CY + 34], [CX + 6, CY + 56]];
    const tail3 = [[CX + 18, CY + 4], [CX + 22, CY + 28], [CX + 28, CY + 50]];
    canvas.drawCalligraphyStroke(tail1, INK_COLORS.BLUE_CYAN, 5.5, 0.8, { alpha: 0.75, feiBai: 0.5, prng });
    canvas.drawCalligraphyStroke(tail2, INK_COLORS.INK_WASH, 6.5, 1.0, { alpha: 0.8, feiBai: 0.6, prng });
    canvas.drawCalligraphyStroke(tail3, INK_COLORS.BLUE_CYAN, 5.5, 0.8, { alpha: 0.75, feiBai: 0.5, prng });

    // [유령 상반신 갓/두건 형태]
    const hoodOutline = [
      [CX - 28, CY + 8], [CX - 26, CY - 18], [CX - 14, CY - 34],
      [CX, CY - 38],
      [CX + 14, CY - 34], [CX + 26, CY - 18], [CX + 28, CY + 8]
    ];
    canvas.drawCalligraphyStroke(hoodOutline, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.95, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, CY - 16, 26, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_CYAN, 0.95, 0.35);

    // 양옆으로 하늘거리는 영체 소매
    const leftWisp = [[CX - 20, CY - 2], [CX - 36, CY + 8], [CX - 46, CY + 22]];
    const rightWisp = [[CX + 20, CY - 2], [CX + 36, CY + 8], [CX + 46, CY + 22]];
    canvas.drawCalligraphyStroke(leftWisp, INK_COLORS.BLUE_CYAN, 4.0, 0.8, { alpha: 0.8, feiBai: 0.45, prng });
    canvas.drawCalligraphyStroke(rightWisp, INK_COLORS.BLUE_CYAN, 4.0, 0.8, { alpha: 0.8, feiBai: 0.45, prng });

    // [퀭하고 깊은 칠흑의 눈구멍과 벌린 입]
    canvas.stampEllipse(CX - 8, CY - 16, 3.8, 5.5, 0.05, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX + 8, CY - 16, 3.8, 5.5, -0.05, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX, CY - 4, 4.5, 6.5, 0, INK_COLORS.INK_DEEP, 1.0);

    // 공허 속 청백색 영혼 불씨
    canvas.drawGlow(CX - 8, CY - 16, 7, INK_COLORS.BLUE_CYAN, 0.8);
    canvas.drawGlow(CX + 8, CY - 16, 7, INK_COLORS.BLUE_CYAN, 0.8);
    canvas.stampDisc(CX - 8, CY - 16, 1.2, INK_COLORS.WHITE_JADE, 0.95);
    canvas.stampDisc(CX + 8, CY - 16, 1.2, INK_COLORS.WHITE_JADE, 0.95);
  },

  // 8. 가고일 (gargoyle)
  // 묵직한 석수(石獸) 석조 날개, 악마 뿔과 흉갑 균열, 타오르는 진홍 핏빛 안광 슬릿
  gargoyle: (canvas) => {
    const prng = createPRNG(2015);

    // [배경] 석조 분진 및 암흑 수묵 워시
    canvas.drawRadialWash(CX, CY, 46, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 18, 14, 38, INK_COLORS.INK_DEEP, 2016);

    // [거대한 석조 돌날개 (Stone Wings, 좌우 대칭)]
    const wingMain = [
      [CX - 12, CY - 2],
      [CX - 32, CY - 26],
      [CX - 50, CY - 36],
      [CX - 58, CY - 22]
    ];
    canvas.drawSymmetricStroke(wingMain, INK_COLORS.INK_DEEP, 6.5, 2.5, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawSymmetricStroke(wingMain, INK_COLORS.WHITE_SILVER, 2.2, 0.8, { alpha: 0.7, isAdditive: true, prng });

    // 날개 깃 가시돌기
    const wingBlade1 = [[CX - 50, CY - 36], [CX - 56, CY - 2], [CX - 50, CY + 14]];
    const wingBlade2 = [[CX - 32, CY - 26], [CX - 38, CY + 6], [CX - 34, CY + 22]];
    canvas.drawSymmetricStroke(wingBlade1, INK_COLORS.INK_DEEP, 4.5, 1.5, { alpha: 0.98, prng });
    canvas.drawSymmetricStroke(wingBlade2, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.98, prng });

    // 날개 피막 석조 명암
    canvas.stampEllipse(CX - 34, CY - 6, 18, 12, -0.2, INK_COLORS.INK_MID, 0.6);
    canvas.stampEllipse(CX + 34, CY - 6, 18, 12, 0.2, INK_COLORS.INK_MID, 0.6);

    // [석수 흉부 및 몸체]
    const torsoPts = [
      [CX - 18, CY], [CX - 22, CY + 22], [CX - 14, CY + 42],
      [CX + 14, CY + 42], [CX + 22, CY + 22], [CX + 18, CY]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 7.5, 6.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 20, 22, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.98, 0.5);

    // 흉판 석조 음영선
    canvas.drawCalligraphyStroke([[CX, CY + 6], [CX, CY + 34]], INK_COLORS.INK_DEEP, 3.5, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 12, CY + 16], [CX + 12, CY + 16]], INK_COLORS.INK_DEEP, 3.0, 3.0, { alpha: 0.98, prng });

    // [머리 및 위로 솟은 악마의 석조 뿔]
    canvas.stampDisc(CX, CY - 14, 14, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 14, 13, INK_COLORS.WHITE_SILVER, INK_COLORS.INK_MID, 0.95, 0.5);

    // 치솟는 뿔 (좌우 대칭)
    const leftHorn = [[CX - 6, CY - 20], [CX - 18, CY - 34], [CX - 24, CY - 44]];
    canvas.drawSymmetricStroke(leftHorn, INK_COLORS.INK_DEEP, 5.0, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(leftHorn, INK_COLORS.WHITE_SILVER, 1.8, 0.6, { alpha: 0.8, isAdditive: true, prng });

    // [흉포한 턱과 석조 이빨]
    const gargoyleJaw = [[CX - 8, CY - 6], [CX, CY], [CX + 8, CY - 6]];
    canvas.drawCalligraphyStroke(gargoyleJaw, INK_COLORS.INK_DEEP, 3.5, 3.5, { alpha: 0.98, prng });
    canvas.stampDisc(CX - 4, CY - 5, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 4, CY - 5, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // [선혈 진홍빛 안광 슬릿]
    canvas.drawGlow(CX - 6, CY - 16, 12, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawGlow(CX + 6, CY - 16, 12, INK_COLORS.RED_FIRE, 0.9);
    canvas.stampEllipse(CX - 6, CY - 16, 3.0, 1.8, -0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampEllipse(CX + 6, CY - 16, 3.0, 1.8, 0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 6, CY - 16, 1.0, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 6, CY - 16, 1.0, INK_COLORS.GOLD_BRIGHT, 1.0);
  },

  // ---------------- 월드 1 고급 7종 ----------------

  // 9. 흑마술사 (cultist)
  // 진홍빛 피의 로브와 깊은 두건, 제의용 주술 지팡이와 피어오르는 혈진 룬
  cultist: (canvas) => {
    const prng = createPRNG(2017);

    // [배경] 사악한 혈진(血陣) 수묵 워시 및 비묵
    canvas.drawRadialWash(CX, CY + 4, 44, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX, CY + 16, 12, 36, INK_COLORS.RED_DEEP, 2018);

    // [바닥 마법진 룬 원호 필선]
    canvas.drawCalligraphyStroke([
      [CX - 32, CY + 48], [CX, CY + 54], [CX + 32, CY + 48]
    ], INK_COLORS.RED_CRIMSON, 2.5, 2.5, { alpha: 0.8, feiBai: 0.3, prng });

    // [긴 사제 로브 하반신]
    const robeBase = [
      [CX - 22, CY + 52], [CX - 18, CY + 24], [CX - 12, CY + 4],
      [CX + 12, CY + 4], [CX + 18, CY + 24], [CX + 22, CY + 52]
    ];
    canvas.drawCalligraphyStroke(robeBase, INK_COLORS.INK_DEEP, 7.0, 5.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 26, 24, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.85, 0.4);

    // 로브 주름 및 붉은 전면 띠
    canvas.drawCalligraphyStroke([[CX, CY + 6], [CX, CY + 50]], INK_COLORS.RED_CRIMSON, 3.2, 2.2, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke([[CX - 8, CY + 14], [CX + 8, CY + 14]], INK_COLORS.GOLD_AMBER, 2.0, 2.0, { alpha: 0.85, prng });

    // [넓은 소매의 양팔]
    const leftSleeve = [[CX - 12, CY + 8], [CX - 24, CY + 18], [CX - 30, CY + 30]];
    const rightSleeve = [[CX + 12, CY + 8], [CX + 24, CY + 16], [CX + 32, CY + 26]];
    canvas.drawCalligraphyStroke(leftSleeve, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawCalligraphyStroke(rightSleeve, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.25, prng });

    // [흑마술 지팡이 (Staff)] 우측 손에 쥐어진 제의용 고목 지팡이
    const staffShaft = [[CX + 28, CY + 52], [CX + 26, CY - 26]];
    canvas.drawCalligraphyStroke(staffShaft, INK_COLORS.INK_DEEP, 3.5, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(staffShaft, INK_COLORS.RED_DEEP, 1.5, 0.8, { alpha: 0.8, prng });

    // 지팡이 머리 해골/혈옥(Blood Gem)
    canvas.stampDisc(CX + 26, CY - 28, 5.5, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 26, CY - 28, 3.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX + 26, CY - 28, 1.5, INK_COLORS.WHITE_JADE, 1.0);
    canvas.drawGlow(CX + 26, CY - 28, 14, INK_COLORS.RED_FIRE, 0.9);

    // [머리 및 뾰족한 후드 두건]
    const hoodPts = [
      [CX - 18, CY - 4], [CX - 16, CY - 22], [CX - 6, CY - 36],
      [CX, CY - 40],
      [CX + 6, CY - 36], [CX + 16, CY - 22], [CX + 18, CY - 4]
    ];
    canvas.drawCalligraphyStroke(hoodPts, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.stampEllipse(CX, CY - 18, 14, 16, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 22, 13, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.9, 0.5);

    // 후드 안쪽 칠흑의 공간
    canvas.stampEllipse(CX, CY - 16, 9, 8, 0, INK_COLORS.INK_DEEP, 1.0);

    // [어둠 속에서 번뜩이는 핏빛 단청 안광]
    canvas.drawGlow(CX - 4.5, CY - 16, 9, INK_COLORS.RED_FIRE, 0.85);
    canvas.drawGlow(CX + 4.5, CY - 16, 9, INK_COLORS.RED_FIRE, 0.85);
    canvas.stampDisc(CX - 4.5, CY - 16, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 16, 1.8, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 4.5, CY - 16, 0.7, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 16, 0.7, INK_COLORS.GOLD_BRIGHT, 1.0);
  },

  // 10. 암살자 (assassin)
  // 칠흑의 야행복, 휘날리는 비백 머플러, 서슬 퍼런 은백 쌍단도와 냉혹한 안광
  assassin: (canvas) => {
    const prng = createPRNG(2019);

    // [배경] 살기 넘치는 암청빛 수묵 바람 및 흩뿌려진 비묵
    canvas.drawRadialWash(CX, CY, 42, INK_COLORS.BLUE_MIDNIGHT, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX, CY, 12, 34, INK_COLORS.INK_MID, 2020);

    // [바람에 휘날리는 긴 흑자색 머플러 (스카프)]
    const scarfPts1 = [
      [CX - 2, CY - 12], [CX + 14, CY - 18], [CX + 32, CY - 26], [CX + 54, CY - 22]
    ];
    const scarfPts2 = [
      [CX, CY - 10], [CX + 18, CY - 12], [CX + 38, CY - 18], [CX + 58, CY - 10]
    ];
    canvas.drawCalligraphyStroke(scarfPts1, INK_COLORS.INK_DEEP, 4.8, 1.0, { alpha: 0.95, feiBai: 0.45, prng });
    canvas.drawCalligraphyStroke(scarfPts2, INK_COLORS.PURPLE_SHADOW, 3.5, 0.8, { alpha: 0.85, feiBai: 0.4, prng });

    // [낮게 도약하는 하체와 가죽 장화]
    const legLeft = [[CX - 12, CY + 18], [CX - 24, CY + 34], [CX - 32, CY + 48]];
    const legRight = [[CX + 6, CY + 18], [CX + 16, CY + 32], [CX + 24, CY + 46]];
    canvas.drawCalligraphyStroke(legLeft, INK_COLORS.INK_DEEP, 5.0, 3.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawCalligraphyStroke(legRight, INK_COLORS.INK_DEEP, 5.0, 3.0, { alpha: 0.98, feiBai: 0.2, prng });

    // [날렵한 상체 및 어깨 견갑]
    const torsoPts = [
      [CX - 14, CY - 4], [CX - 18, CY + 10], [CX - 10, CY + 22],
      [CX + 10, CY + 22], [CX + 16, CY + 8], [CX + 12, CY - 4]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 6.0, 4.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 8, 16, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 가슴 십자 띠
    canvas.drawCalligraphyStroke([[CX - 10, CY], [CX + 8, CY + 18]], INK_COLORS.WHITE_SILVER, 1.8, 1.0, { alpha: 0.7, prng });

    // [머리 및 암살자 복면]
    canvas.stampDisc(CX - 2, CY - 16, 12, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 2, CY - 16, 11, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.95, 0.6);

    // [서슬 퍼런 쌍단도 (Dual Daggers)]
    const daggerLeftBlade = [[CX - 18, CY + 8], [CX - 30, CY + 20], [CX - 46, CY + 32]];
    canvas.drawCalligraphyStroke(daggerLeftBlade, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(daggerLeftBlade, INK_COLORS.WHITE_SILVER, 2.0, 0.6, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawGlow(CX - 38, CY + 26, 10, INK_COLORS.BLUE_CYAN, 0.6);

    const daggerRightBlade = [[CX + 16, CY + 4], [CX + 32, CY - 4], [CX + 50, CY - 14]];
    canvas.drawCalligraphyStroke(daggerRightBlade, INK_COLORS.INK_DEEP, 4.2, 1.2, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(daggerRightBlade, INK_COLORS.WHITE_JADE, 2.2, 0.6, { alpha: 0.98, isAdditive: true, prng });
    canvas.drawGlow(CX + 42, CY - 10, 12, INK_COLORS.WHITE_SILVER, 0.65);

    // [복면 틈새의 냉혹한 안광 슬릿]
    canvas.drawGlow(CX - 4, CY - 16, 8, INK_COLORS.WHITE_SILVER, 0.8);
    canvas.drawGlow(CX + 4, CY - 16, 8, INK_COLORS.WHITE_SILVER, 0.8);
    canvas.stampEllipse(CX - 4, CY - 16, 2.8, 1.2, -0.15, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampEllipse(CX + 4, CY - 16, 2.8, 1.2, 0.15, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX - 4, CY - 16, 0.8, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX + 4, CY - 16, 0.8, INK_COLORS.BLUE_CYAN, 1.0);
  },

  // 11. 골렘 (golem)
  // 육중한 고대 암석 결합체, 바위 어깨와 주먹, 크랙 속에서 분출하는 황금 룬 코어
  golem: (canvas) => {
    const prng = createPRNG(2021);

    // [배경] 지반 분쇄 충격파 워시 및 암석 파편 비묵
    canvas.drawRadialWash(CX, CY, 52, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 14, 16, 42, INK_COLORS.INK_MID, 2022);

    // [거대한 바위 다리와 지지대]
    const legLeft = [[CX - 22, CY + 28], [CX - 28, CY + 44], [CX - 32, CY + 58]];
    const legRight = [[CX + 22, CY + 28], [CX + 28, CY + 44], [CX + 32, CY + 58]];
    canvas.drawCalligraphyStroke(legLeft, INK_COLORS.INK_DEEP, 9.0, 7.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(legRight, INK_COLORS.INK_DEEP, 9.0, 7.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX - 28, CY + 46, 12, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.8, 0.3);
    canvas.drawRadialWash(CX + 28, CY + 46, 12, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.8, 0.3);

    // [거대한 암석 몸통]
    const torsoPts = [
      [CX - 26, CY - 10], [CX - 32, CY + 14], [CX - 24, CY + 34],
      [CX + 24, CY + 34], [CX + 32, CY + 14], [CX + 26, CY - 10]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 8.5, 7.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 12, 28, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // [좌우 거대한 바위 어깨 견갑]
    canvas.stampEllipse(CX - 36, CY - 6, 16, 12, -0.3, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 36, CY - 6, 14, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.9, 0.4);
    canvas.stampEllipse(CX + 36, CY - 6, 16, 12, 0.3, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX + 36, CY - 6, 14, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.9, 0.4);

    // [육중한 바위 팔과 주먹]
    const armLeft = [[CX - 36, CY - 2], [CX - 46, CY + 18], [CX - 44, CY + 36]];
    const armRight = [[CX + 36, CY - 2], [CX + 46, CY + 18], [CX + 44, CY + 36]];
    canvas.drawCalligraphyStroke(armLeft, INK_COLORS.INK_DEEP, 8.0, 7.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(armRight, INK_COLORS.INK_DEEP, 8.0, 7.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.stampDisc(CX - 44, CY + 38, 8.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 44, CY + 38, 8.0, INK_COLORS.INK_DEEP, 0.98);

    // [몸체 균열(Crack) 및 고대 황금 룬 코어]
    canvas.drawGlow(CX, CY + 10, 24, INK_COLORS.GOLD_BRIGHT, 0.9);
    canvas.stampDisc(CX, CY + 10, 7.5, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampDisc(CX, CY + 10, 3.5, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX, CY + 10, 1.5, INK_COLORS.WHITE_JADE, 1.0);

    const crack1 = [[CX - 14, CY + 2], [CX - 6, CY + 8], [CX, CY + 10]];
    const crack2 = [[CX + 14, CY + 2], [CX + 6, CY + 8], [CX, CY + 10]];
    const crack3 = [[CX, CY + 10], [CX - 4, CY + 22], [CX + 6, CY + 28]];
    canvas.drawCalligraphyStroke(crack1, INK_COLORS.GOLD_ROYAL, 2.8, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(crack2, INK_COLORS.GOLD_ROYAL, 2.8, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(crack3, INK_COLORS.GOLD_AMBER, 2.5, 1.0, { alpha: 0.9, isAdditive: true, prng });

    // [몸통에 묻힌 단단한 석조 두상]
    canvas.stampDisc(CX, CY - 18, 12, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 18, 11, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.95, 0.5);

    canvas.drawCalligraphyStroke([[CX - 8, CY - 24], [CX + 8, CY - 24]], INK_COLORS.INK_DEEP, 3.5, 3.5, { alpha: 0.98, prng });

    // [단청 황금빛 룬 안광 슬릿]
    canvas.drawGlow(CX - 5, CY - 18, 8, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 5, CY - 18, 8, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.stampEllipse(CX - 5, CY - 18, 2.5, 1.5, 0, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampEllipse(CX + 5, CY - 18, 2.5, 1.5, 0, INK_COLORS.GOLD_BRIGHT, 1.0);
  },

  // 12. 타락한 마도사 (darkMage)
  // 공중 부유 로브, 솟구친 어깨깃과 마관, 양손에 소환된 심연의 아케인 마력 구체
  darkMage: (canvas) => {
    const prng = createPRNG(2023);

    // [배경] 공허 왜곡 수묵 워시 및 아케인 마력 비묵
    canvas.drawRadialWash(CX, CY, 48, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.45, 0.0);
    canvas.drawSplatter(CX, CY, 14, 38, INK_COLORS.PURPLE_ARCANE, 2024);

    // [공중에 부유하는 찢어진 로브 하단 필선]
    const tailFloat1 = [[CX - 16, CY + 14], [CX - 22, CY + 36], [CX - 28, CY + 54]];
    const tailFloat2 = [[CX, CY + 18], [CX - 4, CY + 40], [CX + 4, CY + 58]];
    const tailFloat3 = [[CX + 16, CY + 14], [CX + 22, CY + 36], [CX + 28, CY + 54]];
    canvas.drawCalligraphyStroke(tailFloat1, INK_COLORS.PURPLE_VOID, 6.0, 1.2, { alpha: 0.95, feiBai: 0.35, prng });
    canvas.drawCalligraphyStroke(tailFloat2, INK_COLORS.PURPLE_SHADOW, 6.5, 1.0, { alpha: 0.95, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke(tailFloat3, INK_COLORS.PURPLE_VOID, 6.0, 1.2, { alpha: 0.95, feiBai: 0.35, prng });

    // [로브 상체 및 치솟은 하이 칼라]
    const torsoPts = [
      [CX - 18, CY - 8], [CX - 22, CY + 8], [CX - 14, CY + 24],
      [CX + 14, CY + 24], [CX + 22, CY + 8], [CX + 18, CY - 8]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 6.5, 5.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 8, 18, INK_COLORS.PURPLE_SHADOW, INK_COLORS.PURPLE_VOID, 0.95, 0.5);

    // 치솟은 옷깃 (좌우 대칭)
    const collar = [[CX - 8, CY - 10], [CX - 20, CY - 24], [CX - 24, CY - 34]];
    canvas.drawSymmetricStroke(collar, INK_COLORS.INK_DEEP, 4.5, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(collar, INK_COLORS.PURPLE_ARCANE, 1.8, 0.8, { alpha: 0.75, isAdditive: true, prng });

    // [마도 두건 및 머리]
    canvas.stampDisc(CX, CY - 18, 11, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 18, 10, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 두건 위 아케인 뿔 장식
    const horn = [[CX - 4, CY - 24], [CX - 10, CY - 38], [CX - 14, CY - 44]];
    canvas.drawSymmetricStroke(horn, INK_COLORS.INK_DEEP, 3.5, 1.2, { alpha: 0.98, prng });

    // [타락한 보라/비취 안광]
    canvas.drawGlow(CX - 4.5, CY - 18, 9, INK_COLORS.PURPLE_ARCANE, 0.9);
    canvas.drawGlow(CX + 4.5, CY - 18, 9, INK_COLORS.PURPLE_ARCANE, 0.9);
    canvas.stampDisc(CX - 4.5, CY - 18, 1.8, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 18, 1.8, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX - 4.5, CY - 18, 0.7, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 4.5, CY - 18, 0.7, INK_COLORS.WHITE_JADE, 1.0);

    // [양손에서 회전하는 거대한 아케인 마력 구체 (Arcane Orb)]
    const leftHand = [[CX - 16, CY + 4], [CX - 24, CY + 14], [CX - 14, CY + 22]];
    const rightHand = [[CX + 16, CY + 4], [CX + 24, CY + 14], [CX + 14, CY + 22]];
    canvas.drawCalligraphyStroke(leftHand, INK_COLORS.INK_DEEP, 4.0, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightHand, INK_COLORS.INK_DEEP, 4.0, 2.0, { alpha: 0.98, prng });

    // 가슴 앞 마력 구체
    canvas.drawGlow(CX, CY + 14, 22, INK_COLORS.PURPLE_ARCANE, 0.95);
    canvas.drawGlow(CX, CY + 14, 14, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.stampDisc(CX, CY + 14, 7.0, INK_COLORS.PURPLE_VOID, 1.0);
    canvas.stampDisc(CX, CY + 14, 4.5, INK_COLORS.PURPLE_ARCANE, 0.9);
    canvas.stampDisc(CX, CY + 14, 2.0, INK_COLORS.WHITE_JADE, 1.0);

    // 구체를 감싸는 궤도 룬 고리
    canvas.drawCalligraphyStroke([
      [CX - 14, CY + 8], [CX, CY + 6], [CX + 14, CY + 12],
      [CX + 12, CY + 20], [CX - 2, CY + 22], [CX - 14, CY + 16]
    ], INK_COLORS.BLUE_CYAN, 1.6, 1.6, { alpha: 0.85, isAdditive: true, prng });
  },

  // 13. 핏빛 사냥개 (bloodHound)
  // 초고속 돌진 야수, 웅크린 척추와 선혈 갈기털, 찢어진 주둥이와 송곳니, 흩뿌려지는 혈흔
  bloodHound: (canvas) => {
    const prng = createPRNG(2025);

    // [배경] 혈풍(血風) 수묵 워시 및 비산하는 혈흔 비묵
    canvas.drawRadialWash(CX, CY + 4, 46, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX - 12, CY + 6, 16, 38, INK_COLORS.RED_CRIMSON, 2026);

    // [야수의 몸통과 역동적 척추 곡선]
    const spinePts = [
      [CX - 38, CY + 10], [CX - 18, CY - 4], [CX + 10, CY - 6], [CX + 32, CY + 2]
    ];
    canvas.drawCalligraphyStroke(spinePts, INK_COLORS.INK_DEEP, 8.0, 6.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX - 4, CY + 4, 22, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.9, 0.4);

    // 등을 따라 곤두선 핏빛 갈기털
    const mane1 = [[CX - 24, CY - 2], [CX - 20, CY - 18]];
    const mane2 = [[CX - 10, CY - 4], [CX - 6, CY - 22]];
    const mane3 = [[CX + 4, CY - 6], [CX + 8, CY - 22]];
    canvas.drawCalligraphyStroke(mane1, INK_COLORS.RED_CRIMSON, 3.5, 1.0, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke(mane2, INK_COLORS.RED_FIRE, 4.0, 1.2, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(mane3, INK_COLORS.RED_CRIMSON, 3.5, 1.0, { alpha: 0.9, prng });

    // [질주하는 네 다리 및 발톱]
    const hindLeg1 = [[CX - 32, CY + 8], [CX - 44, CY + 24], [CX - 40, CY + 42]];
    const hindLeg2 = [[CX - 22, CY + 10], [CX - 30, CY + 28], [CX - 24, CY + 44]];
    canvas.drawCalligraphyStroke(hindLeg1, INK_COLORS.INK_DEEP, 5.5, 3.2, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(hindLeg2, INK_COLORS.INK_DEEP, 5.0, 3.0, { alpha: 0.98, feiBai: 0.2, prng });

    const foreLeg1 = [[CX + 14, CY + 6], [CX + 20, CY + 26], [CX + 28, CY + 42]];
    const foreLeg2 = [[CX + 24, CY + 4], [CX + 34, CY + 22], [CX + 44, CY + 38]];
    canvas.drawCalligraphyStroke(foreLeg1, INK_COLORS.INK_DEEP, 5.5, 3.2, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(foreLeg2, INK_COLORS.INK_DEEP, 5.5, 3.2, { alpha: 0.98, feiBai: 0.2, prng });

    // 발톱 호분 백색
    canvas.stampDisc(CX - 40, CY + 43, 1.5, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 28, CY + 43, 1.5, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 44, CY + 39, 1.5, INK_COLORS.WHITE_JADE, 1.0);

    // [사냥개 꼬리] 치솟은 비백 꼬리선
    const tail = [[CX - 38, CY + 10], [CX - 50, CY + 4], [CX - 58, CY - 8]];
    canvas.drawCalligraphyStroke(tail, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.95, feiBai: 0.45, prng });

    // [머리 및 포효하는 늑대 주둥이]
    canvas.stampDisc(CX + 28, CY - 4, 11, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX + 28, CY - 4, 10, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 뾰족하게 젖혀진 귀
    const houndEar = [[CX + 22, CY - 12], [CX + 18, CY - 26], [CX + 26, CY - 20]];
    canvas.drawCalligraphyStroke(houndEar, INK_COLORS.INK_DEEP, 3.5, 1.2, { alpha: 0.98, prng });

    // 벌린 주둥이 (상악 & 하악)
    const upperJaw = [[CX + 30, CY - 8], [CX + 44, CY - 8], [CX + 52, CY - 4]];
    const lowerJaw = [[CX + 32, CY + 2], [CX + 44, CY + 4], [CX + 50, CY + 6]];
    canvas.drawCalligraphyStroke(upperJaw, INK_COLORS.INK_DEEP, 3.8, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(lowerJaw, INK_COLORS.INK_DEEP, 3.2, 1.8, { alpha: 0.98, prng });

    // 입 안쪽 암적색 공간
    canvas.stampEllipse(CX + 40, CY - 1, 6, 3, 0.1, INK_COLORS.RED_DEEP, 0.95);

    // 송곳니
    canvas.stampDisc(CX + 44, CY - 5, 1.4, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 48, CY - 3, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 45, CY + 2, 1.4, INK_COLORS.WHITE_JADE, 1.0);

    // [뒤로 길게 찢어지는 핏빛 안광 궤적]
    const eyeTrail = [[CX + 32, CY - 8], [CX + 18, CY - 14], [CX + 6, CY - 12]];
    canvas.drawCalligraphyStroke(eyeTrail, INK_COLORS.RED_FIRE, 2.8, 0.8, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawGlow(CX + 32, CY - 8, 12, INK_COLORS.RED_FIRE, 0.95);
    canvas.stampDisc(CX + 32, CY - 8, 2.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX + 32, CY - 8, 0.9, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 14. 망령 군단 (wraithSwarm)
  // 소용돌이치는 원혼의 무리, 주 영체와 주위를 공전하는 2~3기의 환영 잔상, 비취 시안 영기
  wraithSwarm: (canvas) => {
    const prng = createPRNG(2027);

    // [배경] 소용돌이치는 한기 워시 및 영혼 입자 비묵
    canvas.drawRadialWash(CX, CY, 46, INK_COLORS.BLUE_CYAN, INK_COLORS.BLUE_MIDNIGHT, 0.42, 0.0);
    canvas.drawSplatter(CX, CY, 16, 40, INK_COLORS.BLUE_CYAN, 2028);

    // [원혼들의 소용돌이 나선 궤적 (Vortex)]
    const spiral1 = [
      [CX - 36, CY - 12], [CX - 22, CY - 32], [CX + 12, CY - 36],
      [CX + 34, CY - 18], [CX + 28, CY + 14], [CX, CY + 28]
    ];
    canvas.drawCalligraphyStroke(spiral1, INK_COLORS.BLUE_CYAN, 4.0, 1.0, { alpha: 0.65, feiBai: 0.5, prng });

    // [1. 중앙 우두머리 망령 (Main Wraith)]
    const mainTail = [[CX, CY + 2], [CX - 8, CY + 24], [CX + 4, CY + 48]];
    canvas.drawCalligraphyStroke(mainTail, INK_COLORS.BLUE_CYAN, 6.0, 1.0, { alpha: 0.75, feiBai: 0.5, prng });

    const mainHood = [
      [CX - 18, CY + 6], [CX - 16, CY - 16], [CX - 8, CY - 28],
      [CX, CY - 32],
      [CX + 8, CY - 28], [CX + 16, CY - 16], [CX + 18, CY + 6]
    ];
    canvas.drawCalligraphyStroke(mainHood, INK_COLORS.INK_DEEP, 5.0, 4.0, { alpha: 0.95, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, CY - 12, 18, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_CYAN, 0.9, 0.3);

    // 중앙 망령 공허 안구
    canvas.stampEllipse(CX - 5, CY - 14, 2.8, 4.2, 0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX + 5, CY - 14, 2.8, 4.2, 0, INK_COLORS.INK_DEEP, 1.0);
    canvas.drawGlow(CX - 5, CY - 14, 6, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.drawGlow(CX + 5, CY - 14, 6, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.stampDisc(CX - 5, CY - 14, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 5, CY - 14, 1.0, INK_COLORS.WHITE_JADE, 1.0);

    // [2. 좌상단 공전 소형 망령 (Mini Wraith A)]
    const subA_CX = CX - 26;
    const subA_CY = CY - 16;
    const subATail = [[subA_CX, subA_CY], [subA_CX - 8, subA_CY + 14], [subA_CX - 14, subA_CY + 26]];
    canvas.drawCalligraphyStroke(subATail, INK_COLORS.BLUE_CYAN, 3.5, 0.6, { alpha: 0.6, feiBai: 0.4, prng });
    canvas.stampDisc(subA_CX, subA_CY - 6, 6.5, INK_COLORS.INK_DEEP, 0.85);
    canvas.drawRadialWash(subA_CX, subA_CY - 6, 6.0, INK_COLORS.WHITE_SILVER, INK_COLORS.BLUE_CYAN, 0.85, 0.2);
    canvas.stampDisc(subA_CX - 2, subA_CY - 6, 1.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(subA_CX + 2, subA_CY - 6, 1.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.drawGlow(subA_CX, subA_CY - 6, 8, INK_COLORS.BLUE_CYAN, 0.6);

    // [3. 우하단 공전 소형 망령 (Mini Wraith B)]
    const subB_CX = CX + 26;
    const subB_CY = CY + 14;
    const subBTail = [[subB_CX, subB_CY], [subB_CX + 8, subB_CY + 14], [subB_CX + 14, subB_CY + 28]];
    canvas.drawCalligraphyStroke(subBTail, INK_COLORS.BLUE_CYAN, 3.5, 0.6, { alpha: 0.6, feiBai: 0.4, prng });
    canvas.stampDisc(subB_CX, subB_CY - 4, 6.0, INK_COLORS.INK_DEEP, 0.85);
    canvas.drawRadialWash(subB_CX, subB_CY - 4, 5.5, INK_COLORS.WHITE_SILVER, INK_COLORS.BLUE_CYAN, 0.85, 0.2);
    canvas.stampDisc(subB_CX - 2, subB_CY - 4, 1.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(subB_CX + 2, subB_CY - 4, 1.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.drawGlow(subB_CX, subB_CY - 4, 8, INK_COLORS.BLUE_CYAN, 0.6);

    // [군단 영혼불 도깨비불 2점]
    canvas.drawGlow(CX - 12, CY + 32, 10, INK_COLORS.BLUE_CYAN, 0.7);
    canvas.stampDisc(CX - 12, CY + 32, 2.0, INK_COLORS.WHITE_JADE, 0.9);
    canvas.drawGlow(CX + 20, CY - 24, 10, INK_COLORS.BLUE_CYAN, 0.7);
    canvas.stampDisc(CX + 20, CY - 24, 2.0, INK_COLORS.WHITE_JADE, 0.9);
  },

  // 15. 심연의 거인 (abyssTitan)
  // 캔버스를 압도하는 초대형 거구, 심연 암흑 갑주, 치솟은 이중 마신 뿔, 가슴의 공허 블랙홀 코어
  abyssTitan: (canvas) => {
    const prng = createPRNG(2029);

    // [배경] 공간을 집어삼키는 심연의 공허 수묵 워시 및 비묵 폭풍
    canvas.drawRadialWash(CX, CY, 58, INK_COLORS.PURPLE_VOID, INK_COLORS.INK_DEEP, 0.5, 0.0);
    canvas.drawSplatter(CX, CY, 18, 48, INK_COLORS.PURPLE_SHADOW, 2030);

    // [초대형 하체 및 암석 갑주 다리]
    const legLeft = [[CX - 28, CY + 28], [CX - 34, CY + 44], [CX - 38, CY + 60]];
    const legRight = [[CX + 28, CY + 28], [CX + 34, CY + 44], [CX + 38, CY + 60]];
    canvas.drawCalligraphyStroke(legLeft, INK_COLORS.INK_DEEP, 11.0, 9.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(legRight, INK_COLORS.INK_DEEP, 11.0, 9.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX - 34, CY + 48, 14, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.9, 0.4);
    canvas.drawRadialWash(CX + 34, CY + 48, 14, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.9, 0.4);

    // [압도적인 거인의 흉부 몸체]
    const torsoPts = [
      [CX - 32, CY - 14], [CX - 38, CY + 12], [CX - 28, CY + 34],
      [CX + 28, CY + 34], [CX + 38, CY + 12], [CX + 32, CY - 14]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 9.5, 8.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 10, 32, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.98, 0.6);

    // [좌우 거대한 심연 어깨 견갑 및 거대한 암흑 팔]
    canvas.stampEllipse(CX - 42, CY - 10, 18, 14, -0.35, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 42, CY - 10, 16, INK_COLORS.PURPLE_VOID, INK_COLORS.INK_MID, 0.9, 0.4);
    canvas.stampEllipse(CX + 42, CY - 10, 18, 14, 0.35, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX + 42, CY - 10, 16, INK_COLORS.PURPLE_VOID, INK_COLORS.INK_MID, 0.9, 0.4);

    const armLeft = [[CX - 42, CY - 4], [CX - 52, CY + 16], [CX - 50, CY + 38]];
    const armRight = [[CX + 42, CY - 4], [CX + 52, CY + 16], [CX + 50, CY + 38]];
    canvas.drawCalligraphyStroke(armLeft, INK_COLORS.INK_DEEP, 9.0, 7.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(armRight, INK_COLORS.INK_DEEP, 9.0, 7.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.stampDisc(CX - 50, CY + 40, 9.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 50, CY + 40, 9.0, INK_COLORS.INK_DEEP, 0.98);

    // [가슴 중앙 심연의 블랙홀 코어 (Abyss Core)]
    canvas.drawGlow(CX, CY + 8, 28, INK_COLORS.PURPLE_ARCANE, 0.95);
    canvas.drawRadialWash(CX, CY + 8, 18, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.95, 0.4);
    canvas.stampDisc(CX, CY + 8, 8.5, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX, CY + 8, 3.5, INK_COLORS.PURPLE_VOID, 1.0);
    canvas.drawGlow(CX, CY + 8, 10, INK_COLORS.BLUE_CYAN, 0.75);

    // 블랙홀로 빨려 들어가는 나선형 먹선
    const spiralCore = [
      [CX - 14, CY + 2], [CX, CY + 4], [CX + 14, CY + 8],
      [CX + 6, CY + 16], [CX - 8, CY + 14], [CX, CY + 8]
    ];
    canvas.drawCalligraphyStroke(spiralCore, INK_COLORS.PURPLE_ARCANE, 2.5, 1.0, { alpha: 0.85, isAdditive: true, prng });

    // [거인의 두상 및 웅장한 이중 마신 뿔]
    canvas.stampDisc(CX, CY - 22, 14, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 22, 13, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 주 뿔 (위로 치솟은 거대한 곡선 뿔, 대칭)
    const mainHorn = [
      [CX - 8, CY - 28], [CX - 22, CY - 44], [CX - 32, CY - 58]
    ];
    canvas.drawSymmetricStroke(mainHorn, INK_COLORS.INK_DEEP, 6.0, 2.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(mainHorn, INK_COLORS.PURPLE_ARCANE, 2.2, 0.8, { alpha: 0.75, isAdditive: true, prng });

    // 보조 뿔 (바깥으로 뻗은 뿔, 대칭)
    const subHorn = [
      [CX - 12, CY - 24], [CX - 26, CY - 30], [CX - 36, CY - 32]
    ];
    canvas.drawSymmetricStroke(subHorn, INK_COLORS.INK_DEEP, 4.5, 1.5, { alpha: 0.98, prng });

    // 굳게 다문 강철 턱
    canvas.drawCalligraphyStroke([[CX - 8, CY - 14], [CX, CY - 10], [CX + 8, CY - 14]], INK_COLORS.INK_DEEP, 4.0, 4.0, { alpha: 0.98, prng });

    // [파멸의 안광 슬릿 (심연의 붉은 보랏빛)]
    canvas.drawGlow(CX - 6, CY - 22, 12, INK_COLORS.RED_FIRE, 0.95);
    canvas.drawGlow(CX + 6, CY - 22, 12, INK_COLORS.RED_FIRE, 0.95);
    canvas.stampEllipse(CX - 6, CY - 22, 3.2, 1.6, -0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampEllipse(CX + 6, CY - 22, 3.2, 1.6, 0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 6, CY - 22, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 6, CY - 22, 1.0, INK_COLORS.WHITE_JADE, 1.0);
  },

  // ---------------- 월드 2 심해 기본 8종 (Phase 3) ----------------

  // 16. 발광 플랑크톤 (plankton)
  // 초미세 발광 코어, 사방으로 뻗은 영롱한 섬모와 편모, 비취 시안빛 심해 생체발광 포자
  plankton: (canvas) => {
    const prng = createPRNG(2031);

    // [배경] 심해 암흑 속 미세 발광 수포 및 포자 수묵 워시
    canvas.drawRadialWash(CX, CY, 42, INK_COLORS.BLUE_CYAN, INK_COLORS.BLUE_MIDNIGHT, 0.42, 0.0);
    canvas.drawSplatter(CX, CY, 16, 32, INK_COLORS.BLUE_CYAN, 2032);

    // [중심 생체 발광 핵 (Bioluminescent Core)]
    canvas.drawGlow(CX, CY, 24, INK_COLORS.BLUE_CYAN, 0.95);
    canvas.drawGlow(CX, CY, 14, INK_COLORS.WHITE_JADE, 0.85);
    canvas.stampDisc(CX, CY, 8.5, INK_COLORS.BLUE_MIDNIGHT, 0.98);
    canvas.stampDisc(CX, CY, 6.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX, CY, 3.0, INK_COLORS.WHITE_JADE, 1.0);

    // [방사형 유영 편모 (Flagella) 및 미세 섬모 (Cilia)]
    const flagellaList = [
      [[CX - 6, CY - 6], [CX - 20, CY - 18], [CX - 34, CY - 28], [CX - 46, CY - 36]],
      [[CX + 6, CY - 6], [CX + 20, CY - 18], [CX + 34, CY - 28], [CX + 46, CY - 36]],
      [[CX - 8, CY + 2], [CX - 24, CY + 6], [CX - 38, CY + 14], [CX - 50, CY + 22]],
      [[CX + 8, CY + 2], [CX + 24, CY + 6], [CX + 38, CY + 14], [CX + 50, CY + 22]],
      [[CX - 4, CY + 8], [CX - 14, CY + 24], [CX - 18, CY + 38], [CX - 26, CY + 52]],
      [[CX + 4, CY + 8], [CX + 14, CY + 24], [CX + 18, CY + 38], [CX + 26, CY + 52]]
    ];

    flagellaList.forEach((pts) => {
      canvas.drawCalligraphyStroke(pts, INK_COLORS.BLUE_CYAN, 2.6, 0.6, { alpha: 0.88, feiBai: 0.35, prng });
      canvas.drawCalligraphyStroke(pts, INK_COLORS.WHITE_JADE, 1.2, 0.4, { alpha: 0.75, isAdditive: true, prng });
    });

    // [군집을 이루는 보조 미세 발광체 4기]
    const satellites = [
      [CX - 18, CY - 14, 2.2],
      [CX + 20, CY - 12, 2.0],
      [CX - 14, CY + 20, 1.8],
      [CX + 16, CY + 18, 2.4]
    ];
    satellites.forEach(([sx, sy, sr]) => {
      canvas.drawGlow(sx, sy, 8, INK_COLORS.BLUE_CYAN, 0.7);
      canvas.stampDisc(sx, sy, sr, INK_COLORS.WHITE_JADE, 0.95, true);
    });
  },

  // 17. 청록 해파리 (jellyfish)
  // 반투명한 비취빛 우산(Bell) 돔, 유려하게 물결치는 비백 구완과 흩날리는 긴 촉수선
  jellyfish: (canvas) => {
    const prng = createPRNG(2033);

    // [배경] 심해 해류 워시 및 미세 부유 비묵
    canvas.drawRadialWash(CX, CY - 8, 46, INK_COLORS.BLUE_CYAN, INK_COLORS.BLUE_MIDNIGHT, 0.4, 0.0);
    canvas.drawSplatter(CX, CY + 12, 14, 36, INK_COLORS.BLUE_CYAN, 2034);

    // [우산 돔 (Bell) 반투명 수묵 번짐]
    canvas.stampEllipse(CX, CY - 18, 28, 22, 0, INK_COLORS.INK_LIGHT, 0.5);
    canvas.drawRadialWash(CX, CY - 22, 26, INK_COLORS.BLUE_CYAN, INK_COLORS.INK_DEEP, 0.85, 0.25);

    // 삿갓 상단 서예 윤곽선
    const bellDome = [
      [CX - 30, CY - 10], [CX - 26, CY - 26], [CX - 14, CY - 38],
      [CX, CY - 40],
      [CX + 14, CY - 38], [CX + 26, CY - 26], [CX + 30, CY - 10]
    ];
    canvas.drawCalligraphyStroke(bellDome, INK_COLORS.INK_DEEP, 4.5, 3.5, { alpha: 0.98, feiBai: 0.15, prng });

    // 삿갓 하단 파도 물결 림 (Puff Rim)
    const bellRim = [
      [CX - 30, CY - 10], [CX - 20, CY - 6], [CX - 10, CY - 9],
      [CX, CY - 6],
      [CX + 10, CY - 9], [CX + 20, CY - 6], [CX + 30, CY - 10]
    ];
    canvas.drawCalligraphyStroke(bellRim, INK_COLORS.BLUE_CYAN, 3.2, 3.2, { alpha: 0.92, prng });

    // [내부 4엽 생식선 및 발광 코어]
    canvas.drawGlow(CX, CY - 22, 18, INK_COLORS.BLUE_CYAN, 0.9);
    canvas.stampDisc(CX - 7, CY - 22, 4.5, INK_COLORS.GREEN_MINT, 0.8);
    canvas.stampDisc(CX + 7, CY - 22, 4.5, INK_COLORS.GREEN_MINT, 0.8);
    canvas.stampDisc(CX, CY - 28, 4.2, INK_COLORS.GREEN_MINT, 0.8);
    canvas.stampDisc(CX, CY - 16, 4.2, INK_COLORS.GREEN_MINT, 0.8);
    canvas.stampDisc(CX, CY - 22, 3.0, INK_COLORS.WHITE_JADE, 0.95);

    // [중앙 주름진 구완 (Oral Arms)]
    const arm1 = [[CX - 4, CY - 6], [CX - 8, CY + 14], [CX + 2, CY + 34], [CX - 4, CY + 54]];
    const arm2 = [[CX + 4, CY - 6], [CX + 8, CY + 14], [CX - 2, CY + 34], [CX + 4, CY + 54]];
    canvas.drawCalligraphyStroke(arm1, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.95, feiBai: 0.35, prng });
    canvas.drawCalligraphyStroke(arm2, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.95, feiBai: 0.35, prng });
    canvas.drawCalligraphyStroke(arm1, INK_COLORS.BLUE_CYAN, 2.0, 0.6, { alpha: 0.85, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(arm2, INK_COLORS.BLUE_CYAN, 2.0, 0.6, { alpha: 0.85, isAdditive: true, prng });

    // [외곽 하늘거리는 긴 촉수군 (Tentacles)]
    const tent1 = [[CX - 22, CY - 8], [CX - 28, CY + 16], [CX - 18, CY + 38], [CX - 26, CY + 56]];
    const tent2 = [[CX + 22, CY - 8], [CX + 28, CY + 16], [CX + 18, CY + 38], [CX + 26, CY + 56]];
    const tent3 = [[CX - 12, CY - 7], [CX - 16, CY + 22], [CX - 8, CY + 44], [CX - 14, CY + 58]];
    const tent4 = [[CX + 12, CY - 7], [CX + 16, CY + 22], [CX + 8, CY + 44], [CX + 14, CY + 58]];

    canvas.drawCalligraphyStroke(tent1, INK_COLORS.BLUE_CYAN, 2.5, 0.6, { alpha: 0.8, feiBai: 0.45, prng });
    canvas.drawCalligraphyStroke(tent2, INK_COLORS.BLUE_CYAN, 2.5, 0.6, { alpha: 0.8, feiBai: 0.45, prng });
    canvas.drawCalligraphyStroke(tent3, INK_COLORS.INK_WASH, 2.2, 0.5, { alpha: 0.75, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke(tent4, INK_COLORS.INK_WASH, 2.2, 0.5, { alpha: 0.75, feiBai: 0.4, prng });
  },

  // 18. 뿔소라게 (hermitCrab)
  // 단단하게 나선으로 꼬인 뿔소라 껍질, 우람한 주홍빛 집게발, 돌출된 기둥 눈
  hermitCrab: (canvas) => {
    const prng = createPRNG(2035);

    // [배경] 모래톱 및 해저 암반 수묵 워시
    canvas.drawRadialWash(CX, CY + 4, 46, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 22, 12, 36, INK_COLORS.INK_DEEP, 2036);

    // [나선형 뿔소라 껍질 (Spiral Shell)]
    canvas.stampEllipse(CX - 16, CY - 20, 16, 12, -0.6, INK_COLORS.GOLD_AMBER, 0.95);
    canvas.stampEllipse(CX - 4, CY - 8, 22, 16, -0.4, INK_COLORS.GOLD_AMBER, 0.95);
    canvas.stampEllipse(CX + 6, CY + 2, 20, 15, -0.2, INK_COLORS.INK_DEEP, 0.98);

    // 소라 나선 능선 붓터치
    const ridge1 = [[CX - 32, CY - 28], [CX - 22, CY - 34], [CX - 10, CY - 26], [CX - 18, CY - 14]];
    const ridge2 = [[CX - 24, CY - 18], [CX - 10, CY - 20], [CX + 6, CY - 10], [CX - 2, CY + 4]];
    const ridge3 = [[CX - 6, CY + 2], [CX + 14, CY - 2], [CX + 24, CY + 10], [CX + 12, CY + 22]];

    canvas.drawCalligraphyStroke(ridge1, INK_COLORS.INK_DEEP, 4.0, 2.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(ridge2, INK_COLORS.INK_DEEP, 4.5, 3.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(ridge3, INK_COLORS.INK_DEEP, 5.0, 3.5, { alpha: 0.98, feiBai: 0.2, prng });

    // [소라 밖으로 드러난 보행지 3개]
    const leg1 = [[CX + 14, CY + 18], [CX + 26, CY + 28], [CX + 34, CY + 44]];
    const leg2 = [[CX + 6, CY + 22], [CX + 14, CY + 36], [CX + 18, CY + 52]];
    const leg3 = [[CX - 6, CY + 24], [CX - 2, CY + 38], [CX, CY + 54]];

    canvas.drawCalligraphyStroke(leg1, INK_COLORS.INK_DEEP, 4.5, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(leg2, INK_COLORS.INK_DEEP, 4.5, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(leg3, INK_COLORS.INK_DEEP, 4.0, 1.8, { alpha: 0.98, prng });

    canvas.drawCalligraphyStroke(leg1, INK_COLORS.GOLD_AMBER, 2.0, 0.8, { alpha: 0.85, prng });
    canvas.drawCalligraphyStroke(leg2, INK_COLORS.GOLD_AMBER, 2.0, 0.8, { alpha: 0.85, prng });
    canvas.drawCalligraphyStroke(leg3, INK_COLORS.GOLD_AMBER, 1.8, 0.8, { alpha: 0.85, prng });

    // [우람한 주홍 대형 집게발 (Great Claw)]
    const clawArm = [[CX + 18, CY + 8], [CX + 32, CY + 4], [CX + 42, CY + 10]];
    canvas.drawCalligraphyStroke(clawArm, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.98, prng });
    canvas.stampEllipse(CX + 44, CY + 10, 10, 7, 0.2, INK_COLORS.RED_DEEP, 0.98);

    const clawTop = [[CX + 46, CY + 6], [CX + 56, CY + 4], [CX + 58, CY + 10]];
    const clawBtm = [[CX + 46, CY + 14], [CX + 54, CY + 16], [CX + 58, CY + 10]];
    canvas.drawCalligraphyStroke(clawTop, INK_COLORS.INK_DEEP, 3.6, 1.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(clawBtm, INK_COLORS.INK_DEEP, 3.6, 1.5, { alpha: 0.98, prng });

    // 집게 이빨 호분 백색
    canvas.stampDisc(CX + 52, CY + 8, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 52, CY + 12, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // [돌출된 기둥 눈 (Eye Stalks)]
    const stalkL = [[CX + 10, CY - 4], [CX + 14, CY - 16]];
    const stalkR = [[CX + 18, CY - 2], [CX + 24, CY - 14]];
    canvas.drawCalligraphyStroke(stalkL, INK_COLORS.INK_DEEP, 2.5, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(stalkR, INK_COLORS.INK_DEEP, 2.5, 2.0, { alpha: 0.98, prng });

    canvas.stampDisc(CX + 14, CY - 16, 2.5, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 24, CY - 14, 2.5, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 14, CY - 16, 1.0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX + 24, CY - 14, 1.0, INK_COLORS.INK_DEEP, 1.0);
  },

  // 19. 심해 날치 (flyingFish)
  // 초고속 유선형 어체, 활짝 펼쳐진 부채꼴 날개 지느러미, 갈라진 제비꼬리와 수류
  flyingFish: (canvas) => {
    const prng = createPRNG(2037);

    // [배경] 고속 활공 수류 워시 및 비산하는 물보라 비묵
    canvas.drawRadialWash(CX, CY, 46, INK_COLORS.BLUE_AZURE, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY + 16, 14, 38, INK_COLORS.BLUE_CYAN, 2038);

    // [유선형 어체 (Body)]
    canvas.stampEllipse(CX, CY - 2, 10, 34, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 6, 28, INK_COLORS.BLUE_AZURE, INK_COLORS.INK_MID, 0.9, 0.4);

    // 등줄기 은백색 하이라이트
    canvas.drawCalligraphyStroke([[CX, CY - 30], [CX, CY + 24]], INK_COLORS.WHITE_SILVER, 2.5, 1.2, { alpha: 0.85, isAdditive: true, prng });

    // [거대한 가슴지느러미 날개 (좌우 대칭)]
    const finMain = [
      [CX - 6, CY - 12], [CX - 26, CY - 22], [CX - 48, CY - 24], [CX - 58, CY - 12]
    ];
    canvas.drawSymmetricStroke(finMain, INK_COLORS.INK_DEEP, 4.5, 1.8, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(finMain, INK_COLORS.BLUE_CYAN, 2.0, 0.8, { alpha: 0.85, isAdditive: true, prng });

    // 날개 피막 투명 시안 번짐
    canvas.stampEllipse(CX - 34, CY - 10, 22, 10, -0.2, INK_COLORS.BLUE_CYAN, 0.45);
    canvas.stampEllipse(CX + 34, CY - 10, 22, 10, 0.2, INK_COLORS.BLUE_CYAN, 0.45);

    // 지느러미살 (Rays) 갈필 필선
    const ray1 = [[CX - 10, CY - 8], [CX - 32, CY - 2], [CX - 52, CY + 4]];
    const ray2 = [[CX - 8, CY - 4], [CX - 28, CY + 6], [CX - 44, CY + 16]];
    canvas.drawSymmetricStroke(ray1, INK_COLORS.INK_LIGHT, 2.0, 0.8, { alpha: 0.8, feiBai: 0.3, prng });
    canvas.drawSymmetricStroke(ray2, INK_COLORS.INK_LIGHT, 1.8, 0.8, { alpha: 0.75, feiBai: 0.3, prng });

    // [갈라진 제비꼬리 지느러미]
    const tailFinL = [[CX, CY + 28], [CX - 12, CY + 44], [CX - 18, CY + 56]];
    const tailFinR = [[CX, CY + 28], [CX + 12, CY + 44], [CX + 18, CY + 56]];
    canvas.drawCalligraphyStroke(tailFinL, INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.98, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke(tailFinR, INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.98, feiBai: 0.3, prng });

    // [두상 및 번뜩이는 심해 어안]
    canvas.drawGlow(CX - 6, CY - 26, 8, INK_COLORS.BLUE_CYAN, 0.8);
    canvas.drawGlow(CX + 6, CY - 26, 8, INK_COLORS.BLUE_CYAN, 0.8);
    canvas.stampDisc(CX - 6, CY - 26, 2.5, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX + 6, CY - 26, 2.5, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX - 6, CY - 26, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 6, CY - 26, 1.0, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 20. 갑주 가재 (seaLobster)
  // 중후한 진홍빛 분절 갑주, 위협적으로 벌어진 대형 집게발, 부채꼴 꼬리와 긴 수염
  seaLobster: (canvas) => {
    const prng = createPRNG(2039);

    // [배경] 핏빛 갑각 분진 및 심해 살기 워시
    canvas.drawRadialWash(CX, CY, 48, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.38, 0.0);
    canvas.drawSplatter(CX, CY + 14, 14, 38, INK_COLORS.RED_CRIMSON, 2040);

    // [복부 분절 갑각 (Abdomen Segments)]
    const seg1 = [[CX - 14, CY + 14], [CX, CY + 16], [CX + 14, CY + 14]];
    const seg2 = [[CX - 12, CY + 24], [CX, CY + 26], [CX + 12, CY + 24]];
    const seg3 = [[CX - 10, CY + 34], [CX, CY + 36], [CX + 10, CY + 34]];
    canvas.drawCalligraphyStroke(seg1, INK_COLORS.INK_DEEP, 5.0, 5.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(seg2, INK_COLORS.INK_DEEP, 4.5, 4.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(seg3, INK_COLORS.INK_DEEP, 4.0, 4.0, { alpha: 0.98, prng });

    // 부채꼴 꼬리 (Telson)
    const telsonMid = [[CX, CY + 38], [CX, CY + 54]];
    const telsonL = [[CX, CY + 38], [CX - 14, CY + 52]];
    const telsonR = [[CX, CY + 38], [CX + 14, CY + 52]];
    canvas.drawCalligraphyStroke(telsonMid, INK_COLORS.RED_DEEP, 4.0, 2.0, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(telsonL, INK_COLORS.RED_DEEP, 3.5, 1.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(telsonR, INK_COLORS.RED_DEEP, 3.5, 1.5, { alpha: 0.95, prng });

    // [두흉부 (Carapace)]
    canvas.stampEllipse(CX, CY - 2, 16, 18, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 2, 15, INK_COLORS.RED_CRIMSON, INK_COLORS.RED_DEEP, 0.95, 0.5);

    // 날카로운 이마뿔 (Rostrum)
    canvas.drawCalligraphyStroke([[CX, CY - 16], [CX, CY - 30]], INK_COLORS.INK_DEEP, 3.5, 1.2, { alpha: 0.98, prng });

    // [거대한 양쪽 집게발 (대칭)]
    const armPts = [[CX - 12, CY - 6], [CX - 28, CY - 16], [CX - 38, CY - 8]];
    canvas.drawSymmetricStroke(armPts, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.98, prng });

    canvas.stampEllipse(CX - 40, CY - 8, 12, 8, -0.3, INK_COLORS.RED_DEEP, 0.98);
    canvas.stampEllipse(CX + 40, CY - 8, 12, 8, 0.3, INK_COLORS.RED_DEEP, 0.98);

    const pincerL1 = [[CX - 44, CY - 12], [CX - 56, CY - 18], [CX - 58, CY - 10]];
    const pincerL2 = [[CX - 44, CY - 4], [CX - 54, CY + 2], [CX - 56, CY - 6]];
    canvas.drawCalligraphyStroke(pincerL1, INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(pincerL2, INK_COLORS.INK_DEEP, 3.5, 1.5, { alpha: 0.98, prng });

    const pincerR1 = [[CX + 44, CY - 12], [CX + 56, CY - 18], [CX + 58, CY - 10]];
    const pincerR2 = [[CX + 44, CY - 4], [CX + 54, CY + 2], [CX + 56, CY - 6]];
    canvas.drawCalligraphyStroke(pincerR1, INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(pincerR2, INK_COLORS.INK_DEEP, 3.5, 1.5, { alpha: 0.98, prng });

    // [긴 촉각 수염 (Antennae)]
    const antenna = [[CX - 4, CY - 24], [CX - 20, CY - 42], [CX - 38, CY - 56]];
    canvas.drawSymmetricStroke(antenna, INK_COLORS.RED_FIRE, 2.4, 0.6, { alpha: 0.9, feiBai: 0.3, prng });

    // [안광]
    canvas.stampDisc(CX - 5, CY - 18, 1.8, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX + 5, CY - 18, 1.8, INK_COLORS.GOLD_BRIGHT, 1.0);
  },

  // 21. 전기 가오리 (stingray)
  // 마름모형 활공 원반 지느러미, 채찍 꼬리와 독침, 번뜩이는 황금 생체 전기 방전 룬
  stingray: (canvas) => {
    const prng = createPRNG(2041);

    // [배경] 황금 전격 및 심해 암청 수묵 워시
    canvas.drawRadialWash(CX, CY - 2, 48, INK_COLORS.GOLD_AMBER, INK_COLORS.BLUE_MIDNIGHT, 0.4, 0.0);
    canvas.drawSplatter(CX, CY + 8, 14, 38, INK_COLORS.GOLD_BRIGHT, 2042);

    // [마름모형 원반 날개 (Pectoral Disc)]
    const discPts = [
      [CX, CY - 36], [CX - 24, CY - 22], [CX - 48, CY], [CX - 50, CY + 14],
      [CX - 28, CY + 24], [CX, CY + 28], [CX + 28, CY + 24], [CX + 50, CY + 14],
      [CX + 48, CY], [CX + 24, CY - 22], [CX, CY - 36]
    ];
    canvas.drawCalligraphyStroke(discPts, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawRadialWash(CX, CY, 32, INK_COLORS.GOLD_ROYAL, INK_COLORS.INK_MID, 0.85, 0.35);

    // [등 척추선 및 채찍 꼬리]
    canvas.drawCalligraphyStroke([[CX, CY - 28], [CX, CY + 26]], INK_COLORS.INK_DEEP, 4.5, 3.0, { alpha: 0.98, prng });

    const tailWhip = [[CX, CY + 26], [CX - 4, CY + 38], [CX + 2, CY + 48], [CX, CY + 60]];
    canvas.drawCalligraphyStroke(tailWhip, INK_COLORS.INK_DEEP, 3.2, 0.8, { alpha: 0.98, feiBai: 0.35, prng });

    // 독침 가시
    canvas.drawCalligraphyStroke([[CX, CY + 36], [CX + 8, CY + 34]], INK_COLORS.WHITE_SILVER, 2.2, 0.8, { alpha: 0.95, prng });

    // [전기 방전 아크 (Sparks & Electric Arc)]
    canvas.drawGlow(CX, CY - 4, 22, INK_COLORS.GOLD_BRIGHT, 0.88);
    const arcL = [[CX - 12, CY - 10], [CX - 26, CY - 6], [CX - 38, CY + 4]];
    const arcR = [[CX + 12, CY - 10], [CX + 26, CY - 6], [CX + 38, CY + 4]];
    canvas.drawCalligraphyStroke(arcL, INK_COLORS.GOLD_BRIGHT, 2.2, 0.8, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(arcR, INK_COLORS.GOLD_BRIGHT, 2.2, 0.8, { alpha: 0.9, isAdditive: true, prng });

    // [상단 안구 슬릿]
    canvas.stampEllipse(CX - 8, CY - 18, 2.5, 1.5, -0.2, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampEllipse(CX + 8, CY - 18, 2.5, 1.5, 0.2, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX - 8, CY - 18, 1.0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX + 8, CY - 18, 1.0, INK_COLORS.INK_DEEP, 1.0);
  },

  // 22. 산호 골렘 (coralGolem)
  // 해저 암초와 가지 산호초의 융합체, 굳건한 바위 주먹, 크랙 속 맥동하는 에메랄드 코어
  coralGolem: (canvas) => {
    const prng = createPRNG(2043);

    // [배경] 해저 암초 분진 및 에메랄드 마력 워시
    canvas.drawRadialWash(CX, CY, 52, INK_COLORS.GREEN_JADE, INK_COLORS.INK_DEEP, 0.38, 0.0);
    canvas.drawSplatter(CX, CY + 16, 16, 42, INK_COLORS.GREEN_VENOM, 2044);

    // [하체 암초 다리]
    const legL = [[CX - 20, CY + 28], [CX - 26, CY + 44], [CX - 28, CY + 58]];
    const legR = [[CX + 20, CY + 28], [CX + 26, CY + 44], [CX + 28, CY + 58]];
    canvas.drawCalligraphyStroke(legL, INK_COLORS.INK_DEEP, 8.5, 7.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(legR, INK_COLORS.INK_DEEP, 8.5, 7.0, { alpha: 0.98, feiBai: 0.2, prng });

    // [육중한 산호석 흉부]
    const torsoPts = [
      [CX - 24, CY - 10], [CX - 30, CY + 12], [CX - 22, CY + 32],
      [CX + 22, CY + 32], [CX + 30, CY + 12], [CX + 24, CY - 10]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 8.0, 6.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY + 10, 26, INK_COLORS.GREEN_JADE, INK_COLORS.INK_DEEP, 0.9, 0.45);

    // [어깨와 머리 위의 가지 산호초 (Branching Corals)]
    const coralL1 = [[CX - 28, CY - 12], [CX - 38, CY - 26], [CX - 42, CY - 40]];
    const coralL2 = [[CX - 38, CY - 26], [CX - 48, CY - 28]];
    const coralR1 = [[CX + 28, CY - 12], [CX + 38, CY - 26], [CX + 42, CY - 40]];
    const coralR2 = [[CX + 38, CY - 26], [CX + 48, CY - 28]];
    const coralHead = [[CX, CY - 24], [CX - 6, CY - 38], [CX - 8, CY - 50]];
    const coralHeadR = [[CX, CY - 24], [CX + 6, CY - 38], [CX + 8, CY - 50]];

    canvas.drawCalligraphyStroke(coralL1, INK_COLORS.RED_FIRE, 4.0, 1.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(coralL2, INK_COLORS.RED_FIRE, 3.0, 1.2, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(coralR1, INK_COLORS.RED_FIRE, 4.0, 1.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(coralR2, INK_COLORS.RED_FIRE, 3.0, 1.2, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(coralHead, INK_COLORS.GREEN_JADE, 3.5, 1.2, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(coralHeadR, INK_COLORS.GREEN_JADE, 3.5, 1.2, { alpha: 0.95, prng });

    // [바위 팔과 산호 주먹]
    const armL = [[CX - 32, CY - 4], [CX - 44, CY + 14], [CX - 42, CY + 34]];
    const armR = [[CX + 32, CY - 4], [CX + 44, CY + 14], [CX + 42, CY + 34]];
    canvas.drawCalligraphyStroke(armL, INK_COLORS.INK_DEEP, 7.5, 6.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(armR, INK_COLORS.INK_DEEP, 7.5, 6.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.stampDisc(CX - 42, CY + 36, 7.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 42, CY + 36, 7.0, INK_COLORS.INK_DEEP, 0.98);

    // [가슴의 심해 산호 마력 코어]
    canvas.drawGlow(CX, CY + 10, 22, INK_COLORS.GREEN_MINT, 0.9);
    canvas.stampDisc(CX, CY + 10, 7.0, INK_COLORS.GREEN_DARK, 1.0);
    canvas.stampDisc(CX, CY + 10, 4.0, INK_COLORS.GREEN_MINT, 1.0);
    canvas.stampDisc(CX, CY + 10, 1.5, INK_COLORS.WHITE_JADE, 1.0);

    // [안광]
    canvas.stampDisc(CX - 5, CY - 16, 2.0, INK_COLORS.GREEN_MINT, 1.0);
    canvas.stampDisc(CX + 5, CY - 16, 2.0, INK_COLORS.GREEN_MINT, 1.0);
  },

  // 23. 심해 거머리 (seaLeech)
  // 꿈틀거리는 S자형 환형 연체 몸체, 원형 흡반 구강과 동심원 톱니 이빨, 끈적이는 점액질
  seaLeech: (canvas) => {
    const prng = createPRNG(2045);

    // [배경] 심연 암자색 점액 워시 및 사악한 비묵
    canvas.drawRadialWash(CX, CY, 46, INK_COLORS.RED_DEEP, INK_COLORS.PURPLE_SHADOW, 0.4, 0.0);
    canvas.drawSplatter(CX, CY + 10, 14, 36, INK_COLORS.RED_DEEP, 2046);

    // [유연한 파동 S자형 연체 척추]
    const leechSpine = [
      [CX - 16, CY - 36], [CX - 24, CY - 22], [CX - 18, CY - 4],
      [CX + 6, CY + 8], [CX + 20, CY + 22], [CX + 14, CY + 38], [CX - 4, CY + 48]
    ];
    canvas.drawCalligraphyStroke(leechSpine, INK_COLORS.INK_DEEP, 12.0, 8.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(leechSpine, INK_COLORS.RED_DEEP, 7.0, 4.5, { alpha: 0.85, prng });

    // [환형 분절 (Annuli) 주름 횡선]
    canvas.drawCalligraphyStroke([[CX - 26, CY - 14], [CX - 14, CY - 16]], INK_COLORS.INK_DEEP, 2.2, 2.2, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke([[CX - 14, CY - 2], [CX - 2, CY - 4]], INK_COLORS.INK_DEEP, 2.5, 2.5, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke([[CX + 2, CY + 12], [CX + 14, CY + 8]], INK_COLORS.INK_DEEP, 2.8, 2.8, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke([[CX + 14, CY + 26], [CX + 24, CY + 22]], INK_COLORS.INK_DEEP, 2.5, 2.5, { alpha: 0.9, prng });
    canvas.drawCalligraphyStroke([[CX + 4, CY + 40], [CX + 16, CY + 38]], INK_COLORS.INK_DEEP, 2.2, 2.2, { alpha: 0.9, prng });

    // [전면 원형 구강 흡반 (Oral Sucker)]
    canvas.stampEllipse(CX - 16, CY - 36, 9.0, 8.0, -0.4, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX - 16, CY - 36, 6.0, 5.0, -0.4, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampEllipse(CX - 16, CY - 36, 2.5, 2.0, -0.4, INK_COLORS.INK_DEEP, 1.0);

    // 흡반 둘레의 동심원상 톱니 이빨 6점
    const mouthCX = CX - 16;
    const mouthCY = CY - 36;
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const tx = mouthCX + Math.cos(ang) * 4.5;
      const ty = mouthCY + Math.sin(ang) * 4.0;
      canvas.stampDisc(tx, ty, 0.8, INK_COLORS.WHITE_JADE, 1.0);
    }

    // [후면 꼬리 흡반 (Caudal Sucker)]
    canvas.stampDisc(CX - 4, CY + 48, 6.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX - 4, CY + 48, 3.5, INK_COLORS.RED_DEEP, 0.95);

    // [점액질 윤기 가산 하이라이트]
    const mucusHighlight = [[CX - 22, CY - 20], [CX, CY + 6], [CX + 16, CY + 26]];
    canvas.drawCalligraphyStroke(mucusHighlight, INK_COLORS.WHITE_SILVER, 2.0, 0.6, { alpha: 0.75, isAdditive: true, prng });
  },

  // ---------------- 월드 2 심해 심연 최종 7종 (Phase 4) ----------------

  // 24. 심해 아귀 (anglerFish)
  // 흉포하게 벌어진 대형 하악골, 호분 백색 송곳니, 이마 위로 뻗은 발광 유인 돌기(에스카)
  anglerFish: (canvas) => {
    const prng = createPRNG(2047);

    // [배경] 심연 흑청 수묵 워시 및 부유물 비묵
    canvas.drawRadialWash(CX, CY + 4, 48, INK_COLORS.BLUE_MIDNIGHT, INK_COLORS.INK_DEEP, 0.45, 0.0);
    canvas.drawSplatter(CX, CY + 14, 14, 38, INK_COLORS.INK_MID, 2048);

    // [뚱뚱하고 육중한 심해 어체]
    canvas.stampEllipse(CX - 4, CY + 6, 26, 30, -0.15, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 4, CY + 6, 24, INK_COLORS.GREEN_DARK, INK_COLORS.BLUE_MIDNIGHT, 0.9, 0.45);

    // 등줄기 굵은 먹선
    const spinePts = [[CX - 12, CY - 20], [CX - 4, CY - 24], [CX + 14, CY - 14], [CX + 24, CY + 2]];
    canvas.drawCalligraphyStroke(spinePts, INK_COLORS.INK_DEEP, 6.0, 4.0, { alpha: 0.98, feiBai: 0.2, prng });

    // [거대하고 흉포하게 벌어진 주둥이와 턱]
    const upperLip = [[CX - 28, CY - 4], [CX - 16, CY - 14], [CX - 6, CY - 16]];
    const lowerJaw = [[CX - 28, CY + 18], [CX - 20, CY + 28], [CX - 4, CY + 34], [CX + 10, CY + 30]];
    canvas.drawCalligraphyStroke(upperLip, INK_COLORS.INK_DEEP, 4.5, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(lowerJaw, INK_COLORS.INK_DEEP, 6.0, 4.5, { alpha: 0.98, feiBai: 0.15, prng });

    // 입 속 칠흑의 심연 공간
    canvas.stampEllipse(CX - 12, CY + 8, 14, 12, -0.2, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX - 12, CY + 8, 10, 8, -0.2, INK_COLORS.RED_DEEP, 0.7);

    // 위아래로 교차하는 날카로운 송곳니 6점
    const teeth = [
      [CX - 24, CY - 2], [CX - 18, CY - 8], [CX - 12, CY - 11],
      [CX - 22, CY + 14], [CX - 16, CY + 20], [CX - 8, CY + 24]
    ];
    teeth.forEach(([tx, ty]) => {
      canvas.stampDisc(tx, ty, 1.4, INK_COLORS.WHITE_JADE, 1.0);
      canvas.stampDisc(tx, ty, 2.2, INK_COLORS.WHITE_SILVER, 0.4, true);
    });

    // [지느러미 - 가슴지느러미 및 부채꼴 꼬리지느러미]
    const pecFin = [[CX + 6, CY + 12], [CX + 20, CY + 22], [CX + 32, CY + 26]];
    canvas.drawCalligraphyStroke(pecFin, INK_COLORS.INK_DEEP, 5.0, 1.5, { alpha: 0.95, feiBai: 0.35, prng });

    const caudalFin = [[CX + 22, CY + 4], [CX + 38, CY - 6], [CX + 46, CY + 12], [CX + 36, CY + 22]];
    canvas.drawCalligraphyStroke(caudalFin, INK_COLORS.INK_MID, 4.0, 1.8, { alpha: 0.9, feiBai: 0.4, prng });

    // [머리 위로 길게 솟아 전방으로 휘어지는 일리카(Illicium)]
    const illicium = [
      [CX - 6, CY - 18], [CX - 2, CY - 38], [CX + 18, CY - 46], [CX + 32, CY - 36]
    ];
    canvas.drawCalligraphyStroke(illicium, INK_COLORS.INK_DEEP, 3.2, 1.2, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(illicium, INK_COLORS.BLUE_CYAN, 1.4, 0.6, { alpha: 0.85, isAdditive: true, prng });

    // [전방 발광 유인 돌기 (Esca Core)]
    const escaX = CX + 32;
    const escaY = CY - 36;
    canvas.drawGlow(escaX, escaY, 22, INK_COLORS.BLUE_CYAN, 0.98);
    canvas.drawGlow(escaX, escaY, 12, INK_COLORS.WHITE_JADE, 0.9);
    canvas.stampDisc(escaX, escaY, 5.5, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(escaX, escaY, 3.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(escaX, escaY, 1.2, INK_COLORS.GOLD_BRIGHT, 1.0);

    // [작고 냉혹한 심해 어안]
    canvas.stampDisc(CX - 8, CY - 14, 3.2, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX - 8, CY - 14, 2.0, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(CX - 8, CY - 14, 0.8, INK_COLORS.INK_DEEP, 1.0);
  },

  // 25. 유령 해파리 (ghostJelly)
  // 영롱하게 빛나는 비취 백옥 우산 돔, 공허 에테르 코어, 유려하게 흩어지는 긴 비백 촉수
  ghostJelly: (canvas) => {
    const prng = createPRNG(2049);

    // [배경] 몽환적인 청백색 에테르 한기 워시 및 영기 비묵
    canvas.drawRadialWash(CX, CY - 6, 50, INK_COLORS.BLUE_CYAN, INK_COLORS.BLUE_MIDNIGHT, 0.45, 0.0);
    canvas.drawGlow(CX, CY - 6, 44, INK_COLORS.BLUE_CYAN, 0.7);
    canvas.drawSplatter(CX, CY + 14, 16, 38, INK_COLORS.BLUE_CYAN, 2050);

    // [반투명 우산 돔 (Translucent Bell) 수묵 중첩]
    canvas.stampEllipse(CX, CY - 20, 30, 24, 0, INK_COLORS.INK_LIGHT, 0.45);
    canvas.drawRadialWash(CX, CY - 24, 28, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_CYAN, 0.9, 0.2);

    // 우산 외곽 서예 필선
    const bellContour = [
      [CX - 32, CY - 10], [CX - 28, CY - 28], [CX - 16, CY - 40],
      [CX, CY - 42],
      [CX + 16, CY - 40], [CX + 28, CY - 28], [CX + 32, CY - 10]
    ];
    canvas.drawCalligraphyStroke(bellContour, INK_COLORS.WHITE_SILVER, 4.2, 3.2, { alpha: 0.95, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(bellContour, INK_COLORS.INK_DEEP, 2.0, 1.5, { alpha: 0.85, prng });

    // 삿갓 밑단 주름진 호(arc) 림
    const bellLappets = [
      [CX - 32, CY - 10], [CX - 20, CY - 6], [CX - 8, CY - 8],
      [CX, CY - 5],
      [CX + 8, CY - 8], [CX + 20, CY - 6], [CX + 32, CY - 10]
    ];
    canvas.drawCalligraphyStroke(bellLappets, INK_COLORS.BLUE_CYAN, 3.5, 3.5, { alpha: 0.9, prng });

    // [내부 공허 에테르 핵 (Void Ether Core)]
    canvas.drawGlow(CX, CY - 22, 22, INK_COLORS.PURPLE_ARCANE, 0.8);
    canvas.drawGlow(CX, CY - 22, 14, INK_COLORS.WHITE_JADE, 0.9);
    canvas.stampDisc(CX, CY - 22, 7.0, INK_COLORS.PURPLE_SHADOW, 0.85);
    canvas.stampDisc(CX, CY - 22, 4.2, INK_COLORS.WHITE_JADE, 0.95);

    // [중심 주름 구완 (Spiritual Oral Arms)]
    const oralArm1 = [[CX - 6, CY - 6], [CX - 12, CY + 16], [CX - 2, CY + 36], [CX - 8, CY + 56]];
    const oralArm2 = [[CX + 6, CY - 6], [CX + 12, CY + 16], [CX + 2, CY + 36], [CX + 8, CY + 56]];
    canvas.drawCalligraphyStroke(oralArm1, INK_COLORS.WHITE_JADE, 4.5, 1.2, { alpha: 0.9, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke(oralArm2, INK_COLORS.WHITE_JADE, 4.5, 1.2, { alpha: 0.9, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke(oralArm1, INK_COLORS.BLUE_CYAN, 2.2, 0.6, { alpha: 0.8, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(oralArm2, INK_COLORS.BLUE_CYAN, 2.2, 0.6, { alpha: 0.8, isAdditive: true, prng });

    // [외곽으로 유려하게 물결치는 비백 촉수군 (Tentacles)]
    const tentacles = [
      [[CX - 26, CY - 8], [CX - 32, CY + 18], [CX - 22, CY + 40], [CX - 30, CY + 58]],
      [[CX + 26, CY - 8], [CX + 32, CY + 18], [CX + 22, CY + 40], [CX + 30, CY + 58]],
      [[CX - 16, CY - 6], [CX - 22, CY + 22], [CX - 12, CY + 46], [CX - 18, CY + 60]],
      [[CX + 16, CY - 6], [CX + 22, CY + 22], [CX + 12, CY + 46], [CX + 18, CY + 60]]
    ];

    tentacles.forEach((pts) => {
      canvas.drawCalligraphyStroke(pts, INK_COLORS.BLUE_CYAN, 2.4, 0.5, { alpha: 0.85, feiBai: 0.5, prng });
      canvas.drawCalligraphyStroke(pts, INK_COLORS.WHITE_JADE, 1.2, 0.4, { alpha: 0.75, isAdditive: true, prng });
    });
  },

  // 26. 메갈로돈 상어 (deepShark)
  // 초고속 유선형 흑묵 거구, 치솟은 주 등지느러미, 흉포한 2열 톱니 턱과 차가운 살기 안광
  deepShark: (canvas) => {
    const prng = createPRNG(2051);

    // [배경] 심해 돌진 수류 및 핏빛 포식 워시
    canvas.drawRadialWash(CX, CY, 52, INK_COLORS.BLUE_MIDNIGHT, INK_COLORS.INK_DEEP, 0.42, 0.0);
    canvas.drawSplatter(CX, CY + 12, 16, 42, INK_COLORS.INK_DEEP, 2052);

    // [유선형 거대한 상어 체형 (Body)]
    canvas.stampEllipse(CX, CY - 2, 16, 44, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 4, 38, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.9, 0.45);

    // 하복부 은백색 배(Belly) 선염
    canvas.stampEllipse(CX, CY + 2, 8, 32, 0, INK_COLORS.WHITE_SILVER, 0.75);

    // [치솟은 날카로운 주 등지느러미 (Dorsal Fin)]
    const dorsalFin = [[CX, CY - 14], [CX, CY - 36], [CX + 8, CY - 42], [CX + 6, CY - 18]];
    canvas.drawCalligraphyStroke(dorsalFin, INK_COLORS.INK_DEEP, 4.5, 2.0, { alpha: 0.98, feiBai: 0.2, prng });

    // [좌우 거대한 흉포 가슴지느러미 (대칭)]
    const pectFin = [
      [CX - 12, CY - 6], [CX - 34, CY + 4], [CX - 54, CY + 18], [CX - 42, CY + 24], [CX - 16, CY + 12]
    ];
    canvas.drawSymmetricStroke(pectFin, INK_COLORS.INK_DEEP, 5.5, 2.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawSymmetricStroke(pectFin, INK_COLORS.WHITE_SILVER, 2.0, 0.8, { alpha: 0.7, isAdditive: true, prng });

    // [갈라진 초승달 꼬리지느러미 (Caudal Fin)]
    const caudalUpper = [[CX, CY + 38], [CX - 18, CY + 54], [CX - 24, CY + 60]];
    const caudalLower = [[CX, CY + 38], [CX + 14, CY + 52], [CX + 20, CY + 58]];
    canvas.drawCalligraphyStroke(caudalUpper, INK_COLORS.INK_DEEP, 5.0, 2.0, { alpha: 0.98, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke(caudalLower, INK_COLORS.INK_DEEP, 4.5, 1.8, { alpha: 0.98, feiBai: 0.3, prng });

    // [흉포한 상어 주둥이와 2열 톱니 이빨]
    const jawArc = [[CX - 10, CY - 32], [CX, CY - 24], [CX + 10, CY - 32]];
    canvas.drawCalligraphyStroke(jawArc, INK_COLORS.INK_DEEP, 4.5, 4.5, { alpha: 0.98, prng });
    canvas.stampEllipse(CX, CY - 27, 8, 4, 0, INK_COLORS.RED_DEEP, 0.9);

    // 날카로운 호분 백색 이빨 6점
    const sharkTeeth = [
      [CX - 7, CY - 30], [CX - 3, CY - 26], [CX + 3, CY - 26], [CX + 7, CY - 30],
      [CX - 5, CY - 28], [CX + 5, CY - 28]
    ];
    sharkTeeth.forEach(([tx, ty]) => {
      canvas.stampDisc(tx, ty, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    });

    // 아가미 슬릿 3선 (좌우 대칭)
    const gill1 = [[CX - 13, CY - 12], [CX - 14, CY - 6]];
    const gill2 = [[CX - 11, CY - 10], [CX - 12, CY - 4]];
    canvas.drawSymmetricStroke(gill1, INK_COLORS.INK_DEEP, 2.0, 2.0, { alpha: 0.95, prng });
    canvas.drawSymmetricStroke(gill2, INK_COLORS.INK_DEEP, 2.0, 2.0, { alpha: 0.95, prng });

    // [냉혹한 진홍빛 포식 안광]
    canvas.drawGlow(CX - 10, CY - 36, 10, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawGlow(CX + 10, CY - 36, 10, INK_COLORS.RED_FIRE, 0.9);
    canvas.stampEllipse(CX - 10, CY - 36, 2.8, 1.5, -0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampEllipse(CX + 10, CY - 36, 2.8, 1.5, 0.2, INK_COLORS.RED_CRIMSON, 1.0);
    canvas.stampDisc(CX - 10, CY - 36, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 10, CY - 36, 1.0, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 27. 독침 가오리 (poisonRay)
  // 심연 자황빛 맹독 마름모 원반 지느러미, 치명적인 삼중 독침 가시와 맹독 룬 액적
  poisonRay: (canvas) => {
    const prng = createPRNG(2053);

    // [배경] 심연 맹독 자황 워시 및 튀는 독액 비묵
    canvas.drawRadialWash(CX, CY - 2, 50, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.42, 0.0);
    canvas.drawSplatter(CX, CY + 10, 16, 40, INK_COLORS.GREEN_VENOM, 2054);

    // [맹독 마름모형 원반 날개 (Poison Disc)]
    const discPts = [
      [CX, CY - 38], [CX - 26, CY - 22], [CX - 52, CY + 2], [CX - 50, CY + 18],
      [CX - 26, CY + 28], [CX, CY + 30], [CX + 26, CY + 28], [CX + 50, CY + 18],
      [CX + 52, CY + 2], [CX + 26, CY - 22], [CX, CY - 38]
    ];
    canvas.drawCalligraphyStroke(discPts, INK_COLORS.INK_DEEP, 6.5, 5.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, CY, 34, INK_COLORS.PURPLE_SHADOW, INK_COLORS.PURPLE_VOID, 0.9, 0.4);

    // 표면 맹독 룬 및 등뼈선
    canvas.drawCalligraphyStroke([[CX, CY - 30], [CX, CY + 26]], INK_COLORS.INK_DEEP, 4.5, 3.0, { alpha: 0.98, prng });

    const runeL = [[CX - 12, CY - 14], [CX - 28, CY - 4], [CX - 36, CY + 8]];
    const runeR = [[CX + 12, CY - 14], [CX + 28, CY - 4], [CX + 36, CY + 8]];
    canvas.drawCalligraphyStroke(runeL, INK_COLORS.GREEN_VENOM, 2.5, 1.0, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(runeR, INK_COLORS.GREEN_VENOM, 2.5, 1.0, { alpha: 0.9, isAdditive: true, prng });

    // [긴 채찍 꼬리와 삼중 독침 (Triple Venom Stingers)]
    const tailPts = [[CX, CY + 26], [CX - 6, CY + 40], [CX + 4, CY + 52], [CX, CY + 62]];
    canvas.drawCalligraphyStroke(tailPts, INK_COLORS.INK_DEEP, 3.5, 1.0, { alpha: 0.98, feiBai: 0.3, prng });

    // 꼬리 양옆으로 돋아난 은백색 독침 3개
    canvas.drawCalligraphyStroke([[CX - 4, CY + 38], [CX - 14, CY + 36]], INK_COLORS.WHITE_SILVER, 2.5, 0.8, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[CX + 2, CY + 42], [CX + 12, CY + 40]], INK_COLORS.WHITE_SILVER, 2.5, 0.8, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[CX - 2, CY + 48], [CX - 10, CY + 50]], INK_COLORS.WHITE_SILVER, 2.2, 0.8, { alpha: 0.95, prng });

    // 독침 끝 취록빛 맹독 오라
    canvas.drawGlow(CX - 14, CY + 36, 10, INK_COLORS.GREEN_VENOM, 0.85);
    canvas.drawGlow(CX + 12, CY + 40, 10, INK_COLORS.GREEN_VENOM, 0.85);
    canvas.stampDisc(CX - 14, CY + 36, 1.5, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 12, CY + 40, 1.5, INK_COLORS.WHITE_JADE, 1.0);

    // [단청 자황/맹독 안광]
    canvas.stampEllipse(CX - 8, CY - 20, 2.8, 1.6, -0.2, INK_COLORS.GREEN_VENOM, 1.0);
    canvas.stampEllipse(CX + 8, CY - 20, 2.8, 1.6, 0.2, INK_COLORS.GREEN_VENOM, 1.0);
    canvas.stampDisc(CX - 8, CY - 20, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 8, CY - 20, 1.0, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 28. 심연 그림자장어 (shadowEel)
  // 3단 파동 사인 곡선으로 사행하는 연체 척추, 물결치는 등지느러미와 날카로운 송곳니 주둥이
  shadowEel: (canvas) => {
    const prng = createPRNG(2055);

    // [배경] 고속 사행 수묵 그림자 워시 및 수류 비묵
    canvas.drawRadialWash(CX, CY, 48, INK_COLORS.BLUE_AZURE, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX, CY + 8, 14, 38, INK_COLORS.BLUE_AZURE, 2056);

    // [3중 파동 S자형 유연한 장어 몸체 (Serpentine Body)]
    const eelSpine = [
      [CX - 8, CY - 44], [CX - 24, CY - 28], [CX - 12, CY - 6],
      [CX + 16, CY + 8], [CX + 24, CY + 24], [CX + 8, CY + 42], [CX - 8, CY + 54]
    ];
    canvas.drawCalligraphyStroke(eelSpine, INK_COLORS.INK_DEEP, 9.5, 2.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(eelSpine, INK_COLORS.BLUE_AZURE, 5.0, 1.5, { alpha: 0.85, prng });

    // 몸통을 따라 흐르는 등지느러미 비백 필선
    const eelFin = [
      [CX - 14, CY - 40], [CX - 30, CY - 26], [CX - 18, CY - 2],
      [CX + 22, CY + 10], [CX + 30, CY + 26], [CX + 12, CY + 44]
    ];
    canvas.drawCalligraphyStroke(eelFin, INK_COLORS.INK_LIGHT, 3.2, 1.0, { alpha: 0.75, feiBai: 0.45, prng });

    // [머리 및 포효하는 장어 주둥이]
    canvas.stampEllipse(CX - 8, CY - 44, 9, 12, 0.25, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 8, CY - 44, 10, INK_COLORS.BLUE_AZURE, INK_COLORS.INK_DEEP, 0.9, 0.5);

    // 벌린 주둥이와 송곳니
    const eelJaw = [[CX - 14, CY - 48], [CX - 8, CY - 56], [CX, CY - 46]];
    canvas.drawCalligraphyStroke(eelJaw, INK_COLORS.INK_DEEP, 3.5, 2.0, { alpha: 0.98, prng });
    canvas.stampDisc(CX - 10, CY - 50, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX - 6, CY - 50, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // [뒤로 번지는 비취빛 그림자 안광]
    canvas.drawGlow(CX - 6, CY - 42, 12, INK_COLORS.BLUE_CYAN, 0.9);
    canvas.stampDisc(CX - 6, CY - 42, 2.2, INK_COLORS.BLUE_CYAN, 1.0);
    canvas.stampDisc(CX - 6, CY - 42, 0.9, INK_COLORS.WHITE_JADE, 1.0);

    const shadowTrail = [[CX - 6, CY - 42], [CX + 6, CY - 36], [CX + 18, CY - 32]];
    canvas.drawCalligraphyStroke(shadowTrail, INK_COLORS.BLUE_CYAN, 2.0, 0.6, { alpha: 0.8, isAdditive: true, prng });
  },

  // 29. 공허 바다뱀 (voidSeaSerpent)
  // 화면을 장악하는 초대형 나선형 해룡(수룡) 골격, 마신 뿔과 용의 수염, 가슴의 심연 소용돌이 코어
  voidSeaSerpent: (canvas) => {
    const prng = createPRNG(2057);

    // [배경] 공간을 삼키는 공허 왜곡 수묵 워시 및 비묵 폭풍
    canvas.drawRadialWash(CX, CY, 56, INK_COLORS.PURPLE_VOID, INK_COLORS.INK_DEEP, 0.5, 0.0);
    canvas.drawSplatter(CX, CY, 18, 46, INK_COLORS.PURPLE_SHADOW, 2058);

    // [거대한 해룡의 나선형 루프 몸통 (Spiral Leviathan Body)]
    const bodyLoop = [
      [CX - 38, CY - 16], [CX - 12, CY - 32], [CX + 24, CY - 30],
      [CX + 44, CY - 10], [CX + 38, CY + 18], [CX + 14, CY + 34],
      [CX - 22, CY + 38], [CX - 40, CY + 22], [CX - 32, CY + 4],
      [CX - 10, CY - 4]
    ];
    canvas.drawCalligraphyStroke(bodyLoop, INK_COLORS.INK_DEEP, 12.0, 5.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX + 14, CY + 8, 28, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.85, 0.35);

    // 꼬리 끝 비백 필선
    const serpentTail = [[CX - 22, CY + 38], [CX - 4, CY + 52], [CX + 16, CY + 58]];
    canvas.drawCalligraphyStroke(serpentTail, INK_COLORS.INK_DEEP, 5.0, 1.2, { alpha: 0.95, feiBai: 0.45, prng });

    // 등줄기를 따라 돋아난 공허 가시 갈기
    const spines = [
      [[CX + 30, CY - 28], [CX + 40, CY - 38]],
      [[CX + 44, CY - 6], [CX + 56, CY - 10]],
      [[CX + 36, CY + 22], [CX + 48, CY + 26]],
      [[CX + 10, CY + 36], [CX + 16, CY + 48]]
    ];
    spines.forEach((pts) => {
      canvas.drawCalligraphyStroke(pts, INK_COLORS.PURPLE_ARCANE, 3.2, 1.0, { alpha: 0.9, prng });
    });

    // [가슴/중심 공허 소용돌이 블랙홀 코어]
    canvas.drawGlow(CX, CY, 24, INK_COLORS.PURPLE_ARCANE, 0.95);
    canvas.stampDisc(CX, CY, 8.0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX, CY, 4.0, INK_COLORS.PURPLE_VOID, 1.0);
    canvas.drawGlow(CX, CY, 10, INK_COLORS.BLUE_CYAN, 0.8);

    // [위엄 있는 해룡 두상 (Dragon Head)]
    canvas.stampDisc(CX - 38, CY - 16, 15, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 38, CY - 16, 14, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // 위로 솟은 한 쌍의 공허 뿔
    const horn1 = [[CX - 34, CY - 24], [CX - 38, CY - 40], [CX - 48, CY - 50]];
    const horn2 = [[CX - 28, CY - 22], [CX - 24, CY - 36], [CX - 28, CY - 46]];
    canvas.drawCalligraphyStroke(horn1, INK_COLORS.INK_DEEP, 4.5, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(horn2, INK_COLORS.PURPLE_ARCANE, 3.5, 1.2, { alpha: 0.85, prng });

    // 용의 긴 수염 (Barbels)
    const barbel1 = [[CX - 46, CY - 10], [CX - 56, CY - 4], [CX - 62, CY + 6]];
    const barbel2 = [[CX - 42, CY - 6], [CX - 50, CY + 4], [CX - 54, CY + 16]];
    canvas.drawCalligraphyStroke(barbel1, INK_COLORS.WHITE_SILVER, 2.2, 0.6, { alpha: 0.85, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke(barbel2, INK_COLORS.WHITE_SILVER, 2.0, 0.6, { alpha: 0.85, feiBai: 0.3, prng });

    // [단청 황금 안광]
    canvas.drawGlow(CX - 40, CY - 18, 12, INK_COLORS.GOLD_BRIGHT, 0.95);
    canvas.stampDisc(CX - 40, CY - 18, 2.8, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampDisc(CX - 40, CY - 18, 1.0, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 30. 고대 삼엽충 (trilobite)
  // 축엽과 좌우 늑엽의 3엽 분절 각피, 반원형 두부와 제넨 협침, 방해석 격자 겹눈
  trilobite: (canvas) => {
    const prng = createPRNG(2059);

    // [배경] 고대 암반 퇴적물 워시 및 화석 분진 비묵
    canvas.drawRadialWash(CX, CY, 50, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_DEEP, 0.38, 0.0);
    canvas.drawSplatter(CX, CY + 14, 14, 38, INK_COLORS.GOLD_AMBER, 2060);

    // [반원형 두부 (Cephalon)]
    canvas.stampEllipse(CX, CY - 24, 28, 16, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY - 24, 22, INK_COLORS.GOLD_AMBER, INK_COLORS.INK_MID, 0.9, 0.45);

    // 두부 후방 양측 뾰족한 제넨 협침 (Genal Spines)
    const spineL = [[CX - 26, CY - 20], [CX - 36, CY - 8], [CX - 42, CY + 4]];
    const spineR = [[CX + 26, CY - 20], [CX + 36, CY - 8], [CX + 42, CY + 4]];
    canvas.drawCalligraphyStroke(spineL, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(spineR, INK_COLORS.INK_DEEP, 4.0, 1.2, { alpha: 0.98, feiBai: 0.2, prng });

    // [흉부 및 미부 다중 분절 (Thorax & Pygidium - 7 체절)]
    const segmentY = [CY - 10, CY - 2, CY + 6, CY + 14, CY + 22, CY + 30, CY + 38];
    const segmentWidths = [24, 23, 21, 19, 16, 13, 9];

    segmentY.forEach((sy, idx) => {
      const sw = segmentWidths[idx];
      // 늑판 (Pleura) 횡선
      const segStroke = [[CX - sw, sy], [CX, sy + 2], [CX + sw, sy]];
      canvas.drawCalligraphyStroke(segStroke, INK_COLORS.INK_DEEP, 4.5, 4.5, { alpha: 0.98, prng });
      canvas.drawCalligraphyStroke(segStroke, INK_COLORS.GOLD_AMBER, 2.0, 2.0, { alpha: 0.85, prng });

      // 좌우 끝 가시 보행지 돌기
      canvas.stampDisc(CX - sw - 1, sy, 1.2, INK_COLORS.WHITE_SILVER, 0.9);
      canvas.stampDisc(CX + sw + 1, sy, 1.2, INK_COLORS.WHITE_SILVER, 0.9);
    });

    // [중앙 척추 축엽 (Axial Lobe)]
    const axialLobe = [[CX, CY - 26], [CX, CY + 42]];
    canvas.drawCalligraphyStroke(axialLobe, INK_COLORS.INK_DEEP, 6.0, 3.5, { alpha: 0.98, feiBai: 0.15, prng });

    // [초승달 모양의 방해석 격자 겹눈 (Calcite Compound Eyes)]
    canvas.drawGlow(CX - 12, CY - 26, 8, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 12, CY - 26, 8, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.stampEllipse(CX - 12, CY - 26, 3.5, 2.2, -0.35, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampEllipse(CX + 12, CY - 26, 3.5, 2.2, 0.35, INK_COLORS.GOLD_ROYAL, 1.0);
    canvas.stampDisc(CX - 12, CY - 26, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 12, CY - 26, 1.2, INK_COLORS.WHITE_JADE, 1.0);
  }
};

// ================= 일반 몬스터 30종 전체 식별자 목록 =================
const ENEMY_KEYS = [
  // 월드 1 기본 8종 (Phase 1)
  'bat',
  'slime',
  'miniSlime',
  'zombie',
  'skeleton',
  'goblin',
  'ghost',
  'gargoyle',
  // 월드 1 고급 7종 (Phase 2)
  'cultist',
  'assassin',
  'golem',
  'darkMage',
  'bloodHound',
  'wraithSwarm',
  'abyssTitan',
  // 월드 2 심해 기본 8종 (Phase 3)
  'plankton',
  'jellyfish',
  'hermitCrab',
  'flyingFish',
  'seaLobster',
  'stingray',
  'coralGolem',
  'seaLeech',
  // 월드 2 심해 심연 7종 (Phase 4)
  'anglerFish',
  'ghostJelly',
  'deepShark',
  'poisonRay',
  'shadowEel',
  'voidSeaSerpent',
  'trilobite'
];

/**
 * 특정 몬스터 키가 128x128 수묵화풍 렌더러를 지원하는지 검사
 * @param {string} key
 * @returns {boolean}
 */
function hasInkEnemy(key) {
  return typeof ENEMY_RENDERERS[key] === 'function';
}

/**
 * 몬스터 식별자에 대응하는 128x128 고해상도 수묵 RGBA 버퍼 렌더링
 * @param {string} key
 * @returns {Buffer|null}
 */
function renderInkEnemy(key) {
  const renderer = ENEMY_RENDERERS[key];
  if (!renderer) return null;

  const canvas = new EnemyInkCanvas(WIDTH, HEIGHT);
  renderer(canvas);
  return canvas.buffer;
}

module.exports = {
  renderInkEnemy,
  hasInkEnemy,
  ENEMY_KEYS,
  WIDTH,
  HEIGHT,
  INK_COLORS
};
