// Anti Survivors - 128x128 수묵화풍 일반 몬스터 8종 래스터라이저 (ink_enemies.js)
// Phase 1: 월드 1 기본 8종 (bat, slime, miniSlime, zombie, skeleton, goblin, ghost, gargoyle)
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
  BLUE_CYAN: [6, 182, 212],      // 비취 시안 (영기, 플라즈마)
  BLUE_MIDNIGHT: [15, 23, 42],   // 심해 암청 (어둠의 장막)

  GREEN_JADE: [16, 185, 129],    // 벽옥 에메랄드
  GREEN_VENOM: [34, 197, 94],    // 맹독 취록 / 하엽록
  GREEN_DARK: [20, 83, 45],      // 송록 (깊은 소나무 먹록색)
  GREEN_MINT: [110, 231, 183],   // 담청록 (슬라임 하이라이트)

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

  // 가산 블렌딩 (빛, 안광, 영혼불, 에너지 코어)
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

  // 발광 오라 (Neon / Spiritual Glow)
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

// ================= 월드 1 일반 몬스터 8종 128x128 수묵화풍 렌더러 =================

const ENEMY_RENDERERS = {
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
    // 좌측 눈
    canvas.stampDisc(CX - 13, CY + 2, 6.0, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX - 13, CY + 2, 4.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX - 12, CY + 2, 2.4, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX - 14, CY, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // 우측 눈
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
    // 대퇴골 및 경골
    const leftLegSkeleton = [[CX - 10, CY + 28], [CX - 14, CY + 42], [CX - 16, CY + 56]];
    const rightLegSkeleton = [[CX + 10, CY + 28], [CX + 14, CY + 42], [CX + 16, CY + 56]];
    canvas.drawCalligraphyStroke(leftLegSkeleton, INK_COLORS.WHITE_JADE, 3.2, 1.8, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightLegSkeleton, INK_COLORS.WHITE_JADE, 3.2, 1.8, { alpha: 0.98, prng });

    // 팔과 손가락
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
    // 삐져나온 덧니
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
  }
};

// ================= 일반 몬스터 8종 식별자 목록 =================
const ENEMY_KEYS = [
  'bat',
  'slime',
  'miniSlime',
  'zombie',
  'skeleton',
  'goblin',
  'ghost',
  'gargoyle'
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
