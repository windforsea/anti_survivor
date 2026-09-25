// Anti Survivors - 128x128 수묵화풍 고해상도 보스 13종 래스터라이저 (ink_bosses.js)
// 순수 JS 기반 Zero-dependency: 16x16 깍두기 확대를 전면 폐기하고 128x128 캔버스에 직접 수묵화풍 필선과 단청 채색 구현

const WIDTH = 128;
const HEIGHT = 128;
const CX = 64;
const CY = 64;

// ================= 단청(丹靑) 오방색 및 수묵 팔레트 =================
const INK_COLORS = {
  // 수묵 (농묵, 중묵, 담묵, 청묵)
  INK_DEEP: [10, 12, 18],        // 濃墨 (극도로 진한 먹물)
  INK_MID: [32, 36, 48],         // 中墨 (깊은 먹빛)
  INK_LIGHT: [68, 76, 94],       // 淡墨 (물에 번진 먹빛)
  INK_WASH: [105, 115, 138],     // 雲水 (은은한 수묵 안개)

  // 단청 오방색 (청, 적, 황, 백, 흑) & 간색
  WHITE_JADE: [248, 250, 255],   // 옥백 (호분 백색, 하이라이트)
  WHITE_SILVER: [210, 222, 238], // 은백 (차가운 강철/상아)
  
  RED_CRIMSON: [225, 29, 72],    // 선혈 진홍 (단청 주홍)
  RED_DEEP: [159, 18, 57],       // 석간주 (묵직한 암적색)
  RED_FIRE: [244, 63, 94],       // 화염 홍안 (타오르는 불꽃)

  GOLD_ROYAL: [250, 204, 21],    // 어전 황금 (제왕/성역의 황금빛)
  GOLD_AMBER: [217, 119, 6],     // 삼색 황토 (온화한 호박색)
  GOLD_BRIGHT: [254, 240, 138],  // 명황 (빛의 코어)

  BLUE_AZURE: [2, 132, 199],     // 감청 (단청 푸른빛)
  BLUE_CYAN: [6, 182, 212],      // 비취 시안 (영기, 플라즈마)
  BLUE_MIDNIGHT: [15, 23, 42],   // 심해 암청 (어둠의 장막)

  GREEN_JADE: [16, 185, 129],    // 벽옥 에메랄드
  GREEN_VENOM: [34, 197, 94],    // 맹독 취록
  GREEN_DARK: [20, 83, 45],      // 송록

  PURPLE_ARCANE: [168, 85, 247], // 아케인 자황 (비전 마법)
  PURPLE_SHADOW: [88, 28, 135],  // 심연 흑자 (공허의 암흑)
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
class BossInkCanvas {
  constructor(width = WIDTH, height = HEIGHT) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4); // RGBA 버퍼
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

  // 가산 블렌딩 (빛/오라/마그마/영혼불 효과)
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
          const edgeAlpha = dist > radius - 0.5 ? Math.max(0, (radius + 0.5 - dist)) : 1.0;
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

  // 타원형 스탬프 (동공, 장갑판, 갑각류)
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

  // 발광 오라 (Glow)
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

    const step = 0.4;
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
      const radius = Math.max(0.6, (curWidth * (0.6 + 0.5 * pressure)) / 2);

      if (feiBai > 0 && progress > 0.2) {
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

  // 붓을 튕길 때 튀는 비묵(飛墨, Ink Splatter) 효과
  drawSplatter(cx, cy, count = 10, spread = 35, color = INK_COLORS.INK_DEEP, seed = 501) {
    const prng = createPRNG(seed);
    for (let i = 0; i < count; i++) {
      const angle = prng() * Math.PI * 2;
      const dist = 10 + prng() * spread;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = 0.5 + prng() * 1.8;
      const a = 0.35 + prng() * 0.55;
      this.stampDisc(x, y, size, color, a);
    }
  }
}

// ================= 보스 13종 128x128 수묵화풍 고해상도 렌더러 =================

const BOSS_RENDERERS = {
  // 1. 흉포한 멧돼지 로드 (boss_boar)
  // 거대한 상아 엄니, 가시 돋친 흑철 흉갑, 빳빳한 등 갈기, 충혈된 진홍 안광
  boss_boar: (canvas) => {
    const prng = createPRNG(1001);

    // [바닥 및 후방] 돌진 수묵 워시 및 먹 튀김
    canvas.drawRadialWash(CX, 75, 48, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, 80, 14, 45, INK_COLORS.INK_DEEP, 1002);

    // [등줄기 갈기 및 가시] 위쪽으로 솟구치는 빳빳한 맹수 털 (대칭 필선)
    const spines = [
      [[CX, 44], [CX - 14, 18], [CX - 22, 10]],
      [[CX, 48], [CX - 24, 24], [CX - 36, 16]],
      [[CX, 54], [CX - 32, 32], [CX - 46, 26]],
      [[CX, 62], [CX - 38, 42], [CX - 52, 38]]
    ];
    spines.forEach(s => {
      canvas.drawSymmetricStroke(s, INK_COLORS.INK_DEEP, 5.5, 1.2, { alpha: 0.95, feiBai: 0.35, prng });
      canvas.drawSymmetricStroke(s, INK_COLORS.GOLD_AMBER, 2.0, 0.6, { alpha: 0.8, isAdditive: true, prng });
    });

    // [몸체 및 어깨 흉갑] 육중한 흑철 흉판
    const bodyPts = [
      [CX - 34, 42], [CX - 42, 64], [CX - 36, 88],
      [CX - 18, 102], [CX, 104], [CX + 18, 102],
      [CX + 36, 88], [CX + 42, 64], [CX + 34, 42]
    ];
    canvas.drawCalligraphyStroke(bodyPts, INK_COLORS.INK_DEEP, 8.0, 8.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawRadialWash(CX, 72, 34, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.4);

    // [멧돼지 이마 판금 및 콧등]
    const snoutBridge = [[CX, 42], [CX, 86]];
    canvas.drawCalligraphyStroke(snoutBridge, INK_COLORS.INK_DEEP, 14.0, 10.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(snoutBridge, INK_COLORS.WHITE_SILVER, 3.2, 2.2, { alpha: 0.65, isAdditive: true, prng });

    // [이마의 단청 결속 징/장식]
    canvas.stampDisc(CX, 46, 5.5, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.stampDisc(CX, 46, 2.5, INK_COLORS.GOLD_BRIGHT, 0.98);

    // [거대한 양쪽 상아 엄니 (Tusks)] 치솟는 곡선 상아
    const leftTusk = [[CX - 14, 88], [CX - 34, 94], [CX - 54, 82], [CX - 58, 54], [CX - 48, 38]];
    canvas.drawSymmetricStroke(leftTusk, INK_COLORS.INK_DEEP, 8.5, 2.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(leftTusk, INK_COLORS.WHITE_JADE, 4.0, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawSymmetricStroke(leftTusk, INK_COLORS.WHITE_SILVER, 6.0, 1.8, { alpha: 0.4, prng });

    // [코 주둥이 및 콧구멍]
    canvas.stampEllipse(CX, 88, 12, 8, 0, INK_COLORS.RED_DEEP, 0.95);
    canvas.stampDisc(CX - 5, 89, 2.8, INK_COLORS.INK_DEEP, 0.98);
    canvas.stampDisc(CX + 5, 89, 2.8, INK_COLORS.INK_DEEP, 0.98);

    // [충혈된 핏빛 안광]
    canvas.drawGlow(CX - 18, 58, 18, INK_COLORS.RED_FIRE, 0.8);
    canvas.drawGlow(CX + 18, 58, 18, INK_COLORS.RED_FIRE, 0.8);
    canvas.stampEllipse(CX - 18, 58, 4.5, 2.8, -0.2, INK_COLORS.RED_CRIMSON, 0.98);
    canvas.stampEllipse(CX + 18, 58, 4.5, 2.8, 0.2, INK_COLORS.RED_CRIMSON, 0.98);
    canvas.stampDisc(CX - 18, 58, 1.8, INK_COLORS.GOLD_BRIGHT, 0.95);
    canvas.stampDisc(CX + 18, 58, 1.8, INK_COLORS.GOLD_BRIGHT, 0.95);

    // 코에서 뿜어져 나오는 비백 증기
    canvas.drawCalligraphyStroke([[CX - 8, 92], [CX - 22, 108]], INK_COLORS.WHITE_SILVER, 3.5, 0.8, { alpha: 0.65, isAdditive: true, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke([[CX + 8, 92], [CX + 22, 108]], INK_COLORS.WHITE_SILVER, 3.5, 0.8, { alpha: 0.65, isAdditive: true, feiBai: 0.4, prng });
  },

  // 2. 공허의 지배자 (boss_void)
  // 아케인 에너지가 요동치는 보이드 촉수군, 심연의 블랙홀 코어와 비전 크림슨 특이점
  boss_void: (canvas) => {
    const prng = createPRNG(1003);

    // [배경] 아케인 자황과 공허 극자색 심연 오라 워시
    canvas.drawRadialWash(CX, CY, 56, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.45, 0.0);
    canvas.drawGlow(CX, CY, 52, INK_COLORS.PURPLE_ARCANE, 0.6);

    // [외곽으로 똬리 틀며 뻗어나가는 8가닥 공허 촉수]
    for (let i = 0; i < 8; i++) {
      const baseAngle = (i * Math.PI) / 4;
      const tentaclePts = [];
      const steps = 18;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const r = 24 + t * 38;
        const wave = Math.sin(t * Math.PI * 2.5) * 10;
        const ang = baseAngle + wave * 0.05 + t * 0.4;
        tentaclePts.push([CX + Math.cos(ang) * r, CY + Math.sin(ang) * r]);
      }
      canvas.drawCalligraphyStroke(tentaclePts, INK_COLORS.INK_DEEP, 6.0, 1.5, { alpha: 0.98, feiBai: 0.3, prng });
      canvas.drawCalligraphyStroke(tentaclePts, INK_COLORS.PURPLE_ARCANE, 2.5, 0.6, { alpha: 0.85, isAdditive: true, prng });
      canvas.drawCalligraphyStroke(tentaclePts, INK_COLORS.BLUE_CYAN, 1.2, 0.3, { alpha: 0.7, isAdditive: true, prng });
    }

    // [사건의 지평선 회전 원환 (Accretion Disk)]
    const diskPts = [];
    for (let a = 0; a <= 64; a++) {
      const rad = (a / 64) * Math.PI * 2;
      const r = 30 + Math.sin(rad * 3) * 3;
      diskPts.push([CX + Math.cos(rad) * r, CY + Math.sin(rad) * r]);
    }
    canvas.drawCalligraphyStroke(diskPts, INK_COLORS.INK_DEEP, 8.0, 8.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawCalligraphyStroke(diskPts, INK_COLORS.PURPLE_ARCANE, 3.5, 3.5, { alpha: 0.9, isAdditive: true, prng });

    // [중심 심연 블랙홀 코어]
    canvas.drawRadialWash(CX, CY, 22, INK_COLORS.INK_DEEP, INK_COLORS.PURPLE_VOID, 1.0, 0.9);
    canvas.stampDisc(CX, CY, 16, INK_COLORS.INK_DEEP, 0.99);

    // [중심 특이점 (Singularity) 크림슨/황금 핵]
    canvas.drawGlow(CX, CY, 18, INK_COLORS.RED_FIRE, 0.9);
    canvas.stampDisc(CX, CY, 6.0, INK_COLORS.RED_CRIMSON, 0.98);
    canvas.stampDisc(CX, CY, 3.2, INK_COLORS.GOLD_BRIGHT, 0.98);
    canvas.stampDisc(CX, CY, 1.5, INK_COLORS.WHITE_JADE, 1.0);

    // 공허 비묵 및 아케인 파편
    canvas.drawSplatter(CX, CY, 16, 48, INK_COLORS.PURPLE_ARCANE, 1004);
  },

  // 3. 혼돈의 주시자 (boss_eye)
  // 핏발 선 결막, 거대한 단청 황금 홍채, 칠흑의 세로 악마 동공, 기괴한 촉수 림과 보조 안구
  boss_eye: (canvas) => {
    const prng = createPRNG(1005);

    // [배경] 핏빛 결막 아우라 워시
    canvas.drawRadialWash(CX, CY, 52, INK_COLORS.RED_CRIMSON, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX, CY, 14, 46, INK_COLORS.RED_DEEP, 1006);

    // [안구 외곽 기괴한 촉수 6조]
    const tentacleAngles = [0.2, 0.8, 1.4, 2.2, 2.8, 3.6, 4.4, 5.2];
    tentacleAngles.forEach((ang, idx) => {
      const pts = [];
      for (let s = 0; s <= 12; s++) {
        const t = s / 12;
        const r = 36 + t * 24;
        const wave = Math.sin(t * Math.PI * 2 + idx) * 8;
        pts.push([CX + Math.cos(ang + wave * 0.04) * r, CY + Math.sin(ang + wave * 0.04) * r]);
      }
      canvas.drawCalligraphyStroke(pts, INK_COLORS.INK_DEEP, 5.5, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
      canvas.drawCalligraphyStroke(pts, INK_COLORS.RED_CRIMSON, 2.0, 0.6, { alpha: 0.85, isAdditive: true, prng });

      // 촉수 끝단 보조 안구
      const last = pts[pts.length - 1];
      canvas.stampDisc(last[0], last[1], 4.0, INK_COLORS.WHITE_JADE, 0.95);
      canvas.stampDisc(last[0], last[1], 2.2, INK_COLORS.GOLD_ROYAL, 0.98);
      canvas.stampDisc(last[0], last[1], 1.0, INK_COLORS.INK_DEEP, 1.0);
    });

    // [거대한 본체 안구 공막 (Sclera)]
    canvas.stampDisc(CX, CY, 35, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, CY, 34, INK_COLORS.WHITE_JADE, INK_COLORS.WHITE_SILVER, 0.98, 0.7);

    // [결막 모세혈관 (핏줄) 서예 갈필 필선]
    for (let v = 0; v < 10; v++) {
      const vAng = (v * Math.PI * 2) / 10 + prng() * 0.2;
      const vPts = [
        [CX + Math.cos(vAng) * 34, CY + Math.sin(vAng) * 34],
        [CX + Math.cos(vAng + 0.1) * 26, CY + Math.sin(vAng + 0.1) * 26],
        [CX + Math.cos(vAng - 0.05) * 19, CY + Math.sin(vAng - 0.05) * 19]
      ];
      canvas.drawCalligraphyStroke(vPts, INK_COLORS.RED_CRIMSON, 2.0, 0.6, { alpha: 0.9, prng });
    }

    // [거대한 단청 황금 홍채 (Iris)]
    canvas.stampDisc(CX, CY, 19, INK_COLORS.GOLD_AMBER, 0.98);
    canvas.stampDisc(CX, CY, 16, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.drawGlow(CX, CY, 24, INK_COLORS.GOLD_BRIGHT, 0.65);

    // 홍채 방사형 단청 결
    for (let r = 0; r < 12; r++) {
      const rAng = (r * Math.PI) / 6;
      const rPts = [
        [CX + Math.cos(rAng) * 9, CY + Math.sin(rAng) * 9],
        [CX + Math.cos(rAng) * 16, CY + Math.sin(rAng) * 16]
      ];
      canvas.drawCalligraphyStroke(rPts, INK_COLORS.RED_DEEP, 1.5, 1.0, { alpha: 0.85, prng });
    }

    // [칠흑의 악마 세로 동공 (Slit Pupil)]
    canvas.stampEllipse(CX, CY, 5.0, 14.5, 0, INK_COLORS.INK_DEEP, 1.0);
    // 동공 중심 백열 하이라이트
    canvas.stampDisc(CX - 2, CY - 4, 2.2, INK_COLORS.WHITE_JADE, 0.98);
  },

  // 4. 고대 흑철 콜로서스 (boss_colossus)
  // 육중한 각진 석조 흉갑, 갈라진 균열로 박동하는 마그마 코어, 푸른빛 음각 룬 각인
  boss_colossus: (canvas) => {
    const prng = createPRNG(1007);

    // [배경] 초열 마그마 화염 오라 워시
    canvas.drawRadialWash(CX, 72, 48, INK_COLORS.RED_FIRE, INK_COLORS.INK_DEEP, 0.4, 0.0);
    canvas.drawSplatter(CX, 75, 16, 42, INK_COLORS.INK_DEEP, 1008);

    // [거대한 석조/흑철 어깨 견갑 (대칭 붓터치)]
    const leftShoulder = [[CX - 18, 38], [CX - 42, 32], [CX - 56, 48], [CX - 48, 68], [CX - 22, 60]];
    canvas.drawSymmetricStroke(leftShoulder, INK_COLORS.INK_DEEP, 8.5, 6.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(leftShoulder, INK_COLORS.WHITE_SILVER, 2.8, 1.5, { alpha: 0.7, isAdditive: true, prng });

    // [머리 석조 투구 및 이마]
    const helmPts = [
      [CX - 16, 22], [CX + 16, 22],
      [CX + 20, 42], [CX, 46], [CX - 20, 42],
      [CX - 16, 22]
    ];
    canvas.drawCalligraphyStroke(helmPts, INK_COLORS.INK_DEEP, 6.5, 5.5, { alpha: 0.98, prng });
    canvas.drawRadialWash(CX, 34, 18, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.5);

    // [투구 속 황금 안광 슬릿]
    canvas.drawGlow(CX - 8, 36, 10, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 8, 36, 10, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawCalligraphyStroke([[CX - 12, 36], [CX - 4, 36]], INK_COLORS.GOLD_BRIGHT, 2.4, 2.4, { isAdditive: true });
    canvas.drawCalligraphyStroke([[CX + 4, 36], [CX + 12, 36]], INK_COLORS.GOLD_BRIGHT, 2.4, 2.4, { isAdditive: true });

    // [육중한 흑철 흉부 몸체]
    const torsoPts = [
      [CX - 32, 58], [CX - 36, 92], [CX - 20, 110],
      [CX + 20, 110], [CX + 36, 92], [CX + 32, 58]
    ];
    canvas.drawCalligraphyStroke(torsoPts, INK_COLORS.INK_DEEP, 7.5, 6.5, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawRadialWash(CX, 78, 32, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.98, 0.4);

    // [어깨 및 가슴 고대 룬 각인 (푸른 감청/시안)]
    const runes = [
      [[CX - 36, 46], [CX - 44, 56], [CX - 34, 60]],
      [[CX + 36, 46], [CX + 44, 56], [CX + 34, 60]],
      [[CX - 18, 92], [CX - 24, 100]],
      [[CX + 18, 92], [CX + 24, 100]]
    ];
    runes.forEach(r => {
      canvas.drawCalligraphyStroke(r, INK_COLORS.BLUE_CYAN, 2.2, 1.2, { alpha: 0.95, isAdditive: true, prng });
    });

    // [가슴팍에서 박동하는 마그마 코어 (Magma Core)]
    canvas.drawGlow(CX, 76, 26, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawRadialWash(CX, 76, 16, INK_COLORS.GOLD_BRIGHT, INK_COLORS.RED_CRIMSON, 0.98, 0.2);

    // 마그마 균열선 (Cracks)
    const cracks = [
      [[CX, 66], [CX - 6, 74], [CX, 82], [CX - 4, 88]],
      [[CX - 6, 74], [CX - 14, 76]],
      [[CX, 82], [CX + 10, 80], [CX + 14, 86]]
    ];
    cracks.forEach(c => {
      canvas.drawCalligraphyStroke(c, INK_COLORS.WHITE_JADE, 2.5, 1.0, { alpha: 0.98, isAdditive: true, prng });
    });
    canvas.stampDisc(CX, 76, 4.5, INK_COLORS.GOLD_BRIGHT, 0.98);
  },

  // 5. 파멸의 기사 (boss_doom)
  // 뿔 달린 흑기사 투구, 핏빛 안광, 피로 물든 다크 크림슨 망토와 강철 가시 견갑
  boss_doom: (canvas) => {
    const prng = createPRNG(1009);

    // [배경] 선혈 진홍 살기 워시
    canvas.drawRadialWash(CX, 70, 52, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.45, 0.0);
    canvas.drawSplatter(CX, 85, 18, 44, INK_COLORS.RED_CRIMSON, 1010);

    // [펄럭이는 피비린내 나는 다크 크림슨 망토 (하단)]
    const cloakPts = [
      [CX - 38, 62], [CX - 52, 94], [CX - 34, 118],
      [CX, 112], [CX + 34, 118], [CX + 52, 94], [CX + 38, 62]
    ];
    canvas.drawCalligraphyStroke(cloakPts, INK_COLORS.INK_DEEP, 9.0, 7.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, 96, 32, INK_COLORS.RED_CRIMSON, INK_COLORS.RED_DEEP, 0.9, 0.3);

    // [망토 서예 주름선 (갈필)]
    canvas.drawCalligraphyStroke([[CX - 24, 72], [CX - 32, 114]], INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[CX + 24, 72], [CX + 32, 114]], INK_COLORS.INK_DEEP, 4.0, 1.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[CX, 74], [CX, 112]], INK_COLORS.RED_FIRE, 2.2, 0.8, { alpha: 0.7, isAdditive: true, prng });

    // [치솟는 거대한 악마의 흑철 뿔 (좌우 대칭)]
    const leftHorn = [[CX - 14, 42], [CX - 32, 34], [CX - 48, 16], [CX - 54, 8]];
    canvas.drawSymmetricStroke(leftHorn, INK_COLORS.INK_DEEP, 7.5, 1.8, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawSymmetricStroke(leftHorn, INK_COLORS.WHITE_SILVER, 2.4, 0.6, { alpha: 0.8, isAdditive: true, prng });

    // [흑철 가시 견갑 (Shoulder Guards)]
    const leftPauldron = [[CX - 20, 50], [CX - 44, 46], [CX - 50, 64], [CX - 26, 68]];
    canvas.drawSymmetricStroke(leftPauldron, INK_COLORS.INK_DEEP, 7.5, 5.0, { alpha: 0.98, prng });
    canvas.drawSymmetricStroke(leftPauldron, INK_COLORS.WHITE_SILVER, 2.2, 1.2, { alpha: 0.65, isAdditive: true, prng });

    // [흑기사 투구 본체]
    const helmOutline = [
      [CX - 18, 30], [CX + 18, 30],
      [CX + 22, 54], [CX, 66], [CX - 22, 54],
      [CX - 18, 30]
    ];
    canvas.drawCalligraphyStroke(helmOutline, INK_COLORS.INK_DEEP, 7.0, 6.0, { alpha: 0.98, prng });
    canvas.drawRadialWash(CX, 46, 18, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.95, 0.6);

    // [투구 면갑 십자 슬릿 및 핏빛 안광]
    canvas.drawCalligraphyStroke([[CX, 36], [CX, 58]], INK_COLORS.INK_DEEP, 4.0, 4.0, { alpha: 0.99, prng });
    canvas.drawCalligraphyStroke([[CX - 14, 46], [CX + 14, 46]], INK_COLORS.INK_DEEP, 4.5, 4.5, { alpha: 0.99, prng });

    // 번뜩이는 선혈 크림슨 안광 궤적
    canvas.drawGlow(CX - 7, 46, 14, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawGlow(CX + 7, 46, 14, INK_COLORS.RED_FIRE, 0.9);
    canvas.drawCalligraphyStroke([[CX - 12, 46], [CX - 3, 46]], INK_COLORS.RED_FIRE, 2.8, 1.5, { isAdditive: true });
    canvas.drawCalligraphyStroke([[CX + 3, 46], [CX + 12, 46]], INK_COLORS.RED_FIRE, 1.5, 2.8, { isAdditive: true });
    canvas.stampDisc(CX - 7, 46, 1.8, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 7, 46, 1.8, INK_COLORS.WHITE_JADE, 0.98);
  },

  // 6. 망자의 군주 리치 (boss_lich)
  // 황금 네크로맨서 왕관, 영혼불이 타오르는 해골 안광, 아케인 사제 로브와 앙상한 백골 손
  boss_lich: (canvas) => {
    const prng = createPRNG(1011);

    // [배경] 청록 영혼불 & 아케인 자황 오라 워시
    canvas.drawRadialWash(CX, 64, 54, INK_COLORS.BLUE_CYAN, INK_COLORS.PURPLE_SHADOW, 0.4, 0.0);
    canvas.drawSplatter(CX, 64, 14, 44, INK_COLORS.PURPLE_ARCANE, 1012);

    // [공중에 부유하는 아케인 사제 로브 (하단)]
    const robePts = [
      [CX - 32, 58], [CX - 44, 92], [CX - 28, 116],
      [CX, 108], [CX + 28, 116], [CX + 44, 92], [CX + 32, 58]
    ];
    canvas.drawCalligraphyStroke(robePts, INK_COLORS.INK_DEEP, 8.0, 6.0, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, 92, 28, INK_COLORS.PURPLE_SHADOW, INK_COLORS.INK_DEEP, 0.9, 0.3);

    // 로브 앞섬 단청 문양 띠
    canvas.drawCalligraphyStroke([[CX, 60], [CX, 108]], INK_COLORS.GOLD_ROYAL, 3.2, 2.0, { alpha: 0.9, prng });

    // [해골 두개골 본체]
    canvas.stampDisc(CX, 44, 16, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, 44, 15, INK_COLORS.WHITE_JADE, INK_COLORS.WHITE_SILVER, 0.98, 0.6);

    // 턱관절 및 치아 묵선
    const jawPts = [[CX - 9, 54], [CX - 6, 62], [CX + 6, 62], [CX + 9, 54]];
    canvas.drawCalligraphyStroke(jawPts, INK_COLORS.INK_DEEP, 3.5, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 4, 58], [CX + 4, 58]], INK_COLORS.INK_DEEP, 2.0, 2.0, { alpha: 0.98, prng });

    // [퀭한 안와 속에서 타오르는 청록/시안 영혼불 (Soul Fire)]
    canvas.stampEllipse(CX - 7, 44, 4.2, 5.0, 0, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX + 7, 44, 4.2, 5.0, 0, INK_COLORS.INK_DEEP, 1.0);

    canvas.drawGlow(CX - 7, 44, 14, INK_COLORS.BLUE_CYAN, 0.9);
    canvas.drawGlow(CX + 7, 44, 14, INK_COLORS.BLUE_CYAN, 0.9);
    canvas.stampDisc(CX - 7, 44, 2.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 7, 44, 2.2, INK_COLORS.WHITE_JADE, 0.98);

    // 위로 피어오르는 영혼 불꽃 연기
    canvas.drawCalligraphyStroke([[CX - 7, 42], [CX - 10, 30]], INK_COLORS.BLUE_CYAN, 2.0, 0.5, { alpha: 0.7, isAdditive: true, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke([[CX + 7, 42], [CX + 10, 30]], INK_COLORS.BLUE_CYAN, 2.0, 0.5, { alpha: 0.7, isAdditive: true, feiBai: 0.3, prng });

    // [황금 네크로맨서 왕관 (Crown)]
    const crownPts = [
      [CX - 18, 34], [CX - 22, 14], [CX - 10, 24],
      [CX, 8], [CX + 10, 24], [CX + 22, 14], [CX + 18, 34]
    ];
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.GOLD_ROYAL, 2.8, 1.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawGlow(CX, 16, 18, INK_COLORS.GOLD_BRIGHT, 0.65);
    canvas.stampDisc(CX, 10, 3.2, INK_COLORS.BLUE_CYAN, 0.98);

    // [양옆에 떠다니는 저주받은 백골 손가락]
    const leftFingers = [
      [[CX - 36, 72], [CX - 48, 68]],
      [[CX - 36, 76], [CX - 50, 76]],
      [[CX - 36, 80], [CX - 46, 84]]
    ];
    leftFingers.forEach(f => {
      canvas.drawCalligraphyStroke(f, INK_COLORS.WHITE_JADE, 2.6, 1.2, { alpha: 0.95, prng });
      canvas.drawCalligraphyStroke(f.map(p => [WIDTH - p[0], p[1]]), INK_COLORS.WHITE_JADE, 2.6, 1.2, { alpha: 0.95, prng });
    });
  },

  // 7. 영혼 수확자 (boss_reaper)
  // 대낫의 서슬 퍼런 곡선 날, 칠흑의 후드 속 섬뜩한 영혼 안광, 흩날리는 사신의 넝마 망토
  boss_reaper: (canvas) => {
    const prng = createPRNG(1013);

    // [배경] 은은한 한기와 귀기(鬼氣) 서린 청묵 워시
    canvas.drawRadialWash(CX, CY, 56, INK_COLORS.INK_LIGHT, INK_COLORS.INK_DEEP, 0.35, 0.0);
    canvas.drawSplatter(CX, CY, 16, 46, INK_COLORS.INK_DEEP, 1014);

    // [거대한 사신의 대낫 (Soul Scythe)]
    // 낫 자루 (대각선으로 꿰뚫는 고목 서예 붓터치)
    const shaftPts = [[18, 114], [48, 80], [78, 46], [96, 22]];
    canvas.drawCalligraphyStroke(shaftPts, INK_COLORS.INK_DEEP, 6.0, 4.5, { alpha: 0.98, feiBai: 0.1, prng });
    canvas.drawCalligraphyStroke(shaftPts, INK_COLORS.GOLD_AMBER, 1.8, 1.2, { alpha: 0.6, isAdditive: true, prng });

    // 거대한 초승달 낫날 (상단을 가르는 서슬 퍼런 칼날)
    const bladeBack = [[96, 22], [76, 12], [42, 14], [16, 32], [8, 52]];
    const bladeEdge = [[8, 52], [28, 30], [54, 20], [82, 22], [96, 22]];
    
    // 칼등 먹선
    canvas.drawCalligraphyStroke(bladeBack, INK_COLORS.INK_DEEP, 7.5, 3.5, { alpha: 0.98, feiBai: 0.15, prng });
    // 칼날 백은 및 시안 영기
    canvas.drawCalligraphyStroke(bladeEdge, INK_COLORS.WHITE_SILVER, 4.5, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(bladeEdge, INK_COLORS.WHITE_JADE, 2.0, 0.5, { alpha: 0.98, isAdditive: true, prng });
    canvas.drawGlow(32, 26, 22, INK_COLORS.BLUE_CYAN, 0.65);

    // [사신의 후드와 칠흑 망토 본체]
    const cloakPts = [
      [CX - 12, 36], [CX + 24, 38],
      [CX + 38, 70], [CX + 46, 108],
      [CX + 14, 118], [CX - 8, 98], [CX - 22, 114],
      [CX - 28, 78], [CX - 12, 36]
    ];
    canvas.drawCalligraphyStroke(cloakPts, INK_COLORS.INK_DEEP, 9.0, 7.0, { alpha: 0.99, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX + 8, 74, 32, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.98, 0.5);

    // 망토 자락이 연기처럼 흩어지는 비백 필선
    const tatters = [
      [[CX + 46, 108], [CX + 54, 124]],
      [[CX + 14, 118], [CX + 18, 126]],
      [[CX - 22, 114], [CX - 32, 124]]
    ];
    tatters.forEach(t => {
      canvas.drawCalligraphyStroke(t, INK_COLORS.INK_DEEP, 4.5, 0.8, { alpha: 0.9, feiBai: 0.5, prng });
    });

    // [후드 안 완벽한 칠흑의 공허]
    canvas.stampEllipse(CX + 6, 52, 10, 13, 0.1, INK_COLORS.INK_DEEP, 1.0);

    // [후드 속 섬뜩한 영혼 안광 2점]
    canvas.drawGlow(CX + 2, 52, 12, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.drawGlow(CX + 11, 53, 12, INK_COLORS.BLUE_CYAN, 0.85);
    canvas.stampDisc(CX + 2, 52, 2.2, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 11, 53, 2.2, INK_COLORS.WHITE_JADE, 0.98);

    // 주변을 떠도는 영혼 불씨 (Will-o'-the-wisps)
    const wisps = [[24, 78], [88, 72], [98, 94]];
    wisps.forEach(w => {
      canvas.drawGlow(w[0], w[1], 10, INK_COLORS.BLUE_CYAN, 0.7);
      canvas.stampDisc(w[0], w[1], 2.2, INK_COLORS.WHITE_JADE, 0.95);
    });
  },

  // 8. 공허의 지네 / 비룡 (boss_wyrm)
  // S자로 꿈틀거리는 송연먹 외골격 갑판, 맹독 갈필 다리와 치명적 대악 집게턱, 아케인 복안
  boss_wyrm: (canvas) => {
    const prng = createPRNG(1023);

    // [배경] 공허 극자색과 맹독 취록 오라 워시 및 비묵
    canvas.drawRadialWash(CX, CY, 58, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.42, 0.0);
    canvas.drawSplatter(CX, CY, 20, 50, INK_COLORS.PURPLE_VOID, 1024);

    // [몸체 8단계 S자 척추 외골격 분절 정의]
    // 머리(0)에서 꼬리(7)로 갈수록 점진적으로 작아지는 타원 마디 (뒤에서부터 앞으로 렌더링)
    const segments = [
      { x: CX, y: 28, rx: 12.0, ry: 9.5, rot: 0.0 },
      { x: CX - 8, y: 39, rx: 13.0, ry: 10.0, rot: -0.22 },
      { x: CX - 13, y: 52, rx: 13.5, ry: 10.5, rot: -0.28 },
      { x: CX - 9, y: 66, rx: 13.0, ry: 10.0, rot: 0.12 },
      { x: CX + 3, y: 78, rx: 12.0, ry: 9.5, rot: 0.38 },
      { x: CX + 14, y: 90, rx: 10.5, ry: 8.8, rot: 0.46 },
      { x: CX + 17, y: 102, rx: 9.0, ry: 7.5, rot: 0.26 },
      { x: CX + 9, y: 114, rx: 7.0, ry: 6.0, rot: -0.28 }
    ];

    // [다지형 맹독 보행각 6쌍 (뒤~중간 마디에서 뻗어나가는 꺾인 관절 다리)]
    for (let i = 1; i <= 6; i++) {
      const seg = segments[i];
      const legLen = 14 + (6 - i) * 2;
      const sway = Math.sin(i * 1.1) * 3;

      // 좌측 다리 (관절 1 -> 관절 2)
      const leftLeg = [
        [seg.x - seg.rx * 0.7, seg.y],
        [seg.x - seg.rx - 10, seg.y - 4 + sway],
        [seg.x - seg.rx - legLen - 4, seg.y + 6 + sway]
      ];
      // 우측 다리
      const rightLeg = [
        [seg.x + seg.rx * 0.7, seg.y],
        [seg.x + seg.rx + 10, seg.y - 4 + sway],
        [seg.x + seg.rx + legLen + 4, seg.y + 6 + sway]
      ];

      [leftLeg, rightLeg].forEach(l => {
        canvas.drawCalligraphyStroke(l, INK_COLORS.INK_DEEP, 5.0, 1.2, { alpha: 0.98, feiBai: 0.25, prng });
        canvas.drawCalligraphyStroke(l, INK_COLORS.GREEN_VENOM, 2.0, 0.5, { alpha: 0.85, isAdditive: true, prng });
      });

      // 다리 끝 맹독 가시 침
      canvas.stampDisc(leftLeg[2][0], leftLeg[2][1], 1.6, INK_COLORS.GREEN_JADE, 0.98);
      canvas.stampDisc(rightLeg[2][0], rightLeg[2][1], 1.6, INK_COLORS.GREEN_JADE, 0.98);
    }

    // [외골격 분절 본체 렌더링 (꼬리부터 머리 방향 순차 렌더링 - Painter's Algorithm)]
    for (let i = segments.length - 1; i >= 1; i--) {
      const seg = segments[i];
      // 외곽 흑철 갑판 묵선
      canvas.stampEllipse(seg.x, seg.y, seg.rx, seg.ry, seg.rot, INK_COLORS.INK_DEEP, 0.99);
      // 내부 심연 흑자색 갑각 채색
      canvas.stampEllipse(seg.x, seg.y, seg.rx * 0.82, seg.ry * 0.78, seg.rot, INK_COLORS.PURPLE_SHADOW, 0.95);
      // 마디 중심 공허 특이점 광맥
      canvas.drawGlow(seg.x, seg.y, 8, INK_COLORS.PURPLE_ARCANE, 0.7);
      canvas.stampDisc(seg.x, seg.y, 2.4, INK_COLORS.BLUE_CYAN, 0.98);
      canvas.stampDisc(seg.x, seg.y, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    }

    // [머리부(0번 마디) 및 흉포한 대악 집게턱 (Mandibles)]
    const head = segments[0];
    canvas.stampEllipse(head.x, head.y, head.rx, head.ry, head.rot, INK_COLORS.INK_DEEP, 0.99);
    canvas.stampEllipse(head.x, head.y, head.rx * 0.8, head.ry * 0.75, head.rot, INK_COLORS.PURPLE_VOID, 0.98);

    // 좌우로 거대하게 벌어진 지네 대악 (초승달 갈필)
    const leftMandible = [
      [head.x - 6, head.y + 4],
      [head.x - 18, head.y - 2],
      [head.x - 26, head.y - 14],
      [head.x - 16, head.y - 22],
      [head.x - 4, head.y - 18]
    ];
    const rightMandible = [
      [head.x + 6, head.y + 4],
      [head.x + 18, head.y - 2],
      [head.x + 26, head.y - 14],
      [head.x + 16, head.y - 22],
      [head.x + 4, head.y - 18]
    ];
    [leftMandible, rightMandible].forEach(m => {
      canvas.drawCalligraphyStroke(m, INK_COLORS.INK_DEEP, 7.5, 2.0, { alpha: 0.98, feiBai: 0.2, prng });
      canvas.drawCalligraphyStroke(m, INK_COLORS.WHITE_SILVER, 3.2, 1.0, { alpha: 0.9, isAdditive: true, prng });
    });

    // 턱 안쪽 날카로운 백옥 이빨 (Teeth)
    const jawTeeth = [
      [head.x - 18, head.y - 10], [head.x - 13, head.y - 15],
      [head.x + 18, head.y - 10], [head.x + 13, head.y - 15]
    ];
    jawTeeth.forEach(([tx, ty]) => {
      canvas.stampDisc(tx, ty, 1.8, INK_COLORS.WHITE_JADE, 1.0);
    });

    // 턱 끝단의 치명적인 진홍 독액 방울
    canvas.drawGlow(head.x - 4, head.y - 18, 10, INK_COLORS.RED_FIRE, 0.85);
    canvas.drawGlow(head.x + 4, head.y - 18, 10, INK_COLORS.RED_FIRE, 0.85);
    canvas.stampDisc(head.x - 4, head.y - 18, 2.2, INK_COLORS.RED_CRIMSON, 0.98);
    canvas.stampDisc(head.x + 4, head.y - 18, 2.2, INK_COLORS.RED_CRIMSON, 0.98);

    // [전방으로 뻗은 유려한 갈필 더듬이 2조 (Antennae)]
    const leftAntenna = [[head.x - 6, head.y - 4], [head.x - 18, head.y - 16], [head.x - 30, head.y - 26]];
    const rightAntenna = [[head.x + 6, head.y - 4], [head.x + 18, head.y - 16], [head.x + 30, head.y - 26]];
    canvas.drawCalligraphyStroke(leftAntenna, INK_COLORS.PURPLE_ARCANE, 2.8, 0.6, { alpha: 0.85, isAdditive: true, feiBai: 0.3, prng });
    canvas.drawCalligraphyStroke(rightAntenna, INK_COLORS.PURPLE_ARCANE, 2.8, 0.6, { alpha: 0.85, isAdditive: true, feiBai: 0.3, prng });

    // [머리부 기괴한 다중 복안 (Compound Eyes)]
    canvas.drawGlow(head.x - 7, head.y - 2, 12, INK_COLORS.BLUE_CYAN, 0.95);
    canvas.drawGlow(head.x + 7, head.y - 2, 12, INK_COLORS.BLUE_CYAN, 0.95);
    canvas.stampEllipse(head.x - 7, head.y - 2, 3.8, 2.4, -0.2, INK_COLORS.BLUE_CYAN, 0.98);
    canvas.stampEllipse(head.x + 7, head.y - 2, 3.8, 2.4, 0.2, INK_COLORS.BLUE_CYAN, 0.98);
    canvas.stampDisc(head.x - 7, head.y - 2, 1.6, INK_COLORS.GOLD_BRIGHT, 1.0);
    canvas.stampDisc(head.x + 7, head.y - 2, 1.6, INK_COLORS.GOLD_BRIGHT, 1.0);

    // 보조 안구 2쌍
    canvas.stampDisc(head.x - 3, head.y + 3, 1.4, INK_COLORS.GREEN_VENOM, 0.95);
    canvas.stampDisc(head.x + 3, head.y + 3, 1.4, INK_COLORS.GREEN_VENOM, 0.95);
  },

  // 9. 혼돈의 절대신 / 심연의 군주 (boss_overlord)
  // 등 뒤의 신성한 만다라 광배 신륜, 6중 혼돈 촉수 날개, 3단 절대 황금관과 개안한 제3의 눈
  boss_overlord: (canvas) => {
    const prng = createPRNG(1025);

    // [배경] 아케인 자황과 공허 극자색의 심연 신격 오라 워시
    canvas.drawRadialWash(CX, CY, 60, INK_COLORS.PURPLE_ARCANE, INK_COLORS.PURPLE_VOID, 0.48, 0.0);
    canvas.drawSplatter(CX, CY, 22, 52, INK_COLORS.GOLD_AMBER, 1026);

    // [배후 절대신 만다라 광배 (Divine Mandala Halo)]
    // 다중 동심원 신륜 궤적 (반지름 28, 42, 54)
    [28, 42, 54].forEach((radius, idx) => {
      const ringPts = [];
      const steps = 48;
      for (let s = 0; s <= steps; s++) {
        const rad = (s / steps) * Math.PI * 2;
        ringPts.push([CX + Math.cos(rad) * radius, CY + Math.sin(rad) * radius]);
      }
      canvas.drawCalligraphyStroke(ringPts, INK_COLORS.GOLD_ROYAL, 2.5 - idx * 0.5, 2.5 - idx * 0.5, { alpha: 0.85, isAdditive: true, prng });
      canvas.drawCalligraphyStroke(ringPts, INK_COLORS.INK_DEEP, 1.2, 1.2, { alpha: 0.6, prng });
    });

    // 16방위 혼돈 방사형 광선 (Mandala Spokes)
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI * 2) / 16;
      const rayStart = [CX + Math.cos(a) * 26, CY + Math.sin(a) * 26];
      const rayEnd = [CX + Math.cos(a) * 56, CY + Math.sin(a) * 56];
      canvas.drawCalligraphyStroke([rayStart, rayEnd], INK_COLORS.GOLD_BRIGHT, 2.0, 0.5, { alpha: 0.75, isAdditive: true, prng });
      // 광선 끝 신성 보주
      canvas.stampDisc(rayEnd[0], rayEnd[1], 1.5, INK_COLORS.RED_FIRE, 0.9, true);
    }

    // [사방으로 휘감기는 6가닥 절대 혼돈 촉수 날개 (좌우 대칭 3쌍)]
    const wingUpper = [[CX - 14, 48], [CX - 38, 28], [CX - 56, 16], [CX - 62, 4]];
    const wingMid   = [[CX - 16, 58], [CX - 46, 52], [CX - 60, 62], [CX - 56, 78]];
    const wingLower = [[CX - 14, 70], [CX - 40, 80], [CX - 54, 98], [CX - 48, 118]];

    [wingUpper, wingMid, wingLower].forEach(w => {
      canvas.drawSymmetricStroke(w, INK_COLORS.INK_DEEP, 7.5, 1.5, { alpha: 0.98, feiBai: 0.35, prng });
      canvas.drawSymmetricStroke(w, INK_COLORS.PURPLE_ARCANE, 3.0, 0.8, { alpha: 0.85, isAdditive: true, prng });
      canvas.drawSymmetricStroke(w, INK_COLORS.RED_CRIMSON, 1.4, 0.4, { alpha: 0.7, isAdditive: true, prng });
    });

    // [신격 본체 로브 (Lower Robes)]
    const robeOutline = [
      [CX - 24, 64], [CX - 36, 92], [CX - 22, 118],
      [CX, 112], [CX + 22, 118], [CX + 36, 92], [CX + 24, 64]
    ];
    canvas.drawCalligraphyStroke(robeOutline, INK_COLORS.INK_DEEP, 8.5, 6.5, { alpha: 0.99, feiBai: 0.2, prng });
    canvas.drawRadialWash(CX, 90, 30, INK_COLORS.RED_DEEP, INK_COLORS.BLUE_MIDNIGHT, 0.95, 0.4);

    // 로브 중앙을 관통하는 삼라만상 단청 문양 띠
    canvas.drawCalligraphyStroke([[CX, 64], [CX, 112]], INK_COLORS.GOLD_ROYAL, 3.5, 2.0, { alpha: 0.95, isAdditive: true, prng });

    // [제왕의 흉부 및 거대한 황금 견갑 (Pauldron)]
    const leftPauldron = [[CX - 16, 48], [CX - 38, 44], [CX - 44, 58], [CX - 22, 64]];
    canvas.drawSymmetricStroke(leftPauldron, INK_COLORS.INK_DEEP, 7.5, 5.0, { alpha: 0.98, prng });
    canvas.drawSymmetricStroke(leftPauldron, INK_COLORS.GOLD_ROYAL, 3.0, 1.8, { alpha: 0.95, isAdditive: true, prng });

    // [가슴 중앙: 혼돈의 절대 특이점 코어 (Heart of Chaos)]
    canvas.drawGlow(CX, 72, 28, INK_COLORS.RED_FIRE, 0.95);
    canvas.stampDisc(CX, 72, 8.5, INK_COLORS.RED_DEEP, 0.98);
    canvas.stampDisc(CX, 72, 5.5, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampDisc(CX, 72, 3.0, INK_COLORS.GOLD_BRIGHT, 0.99);
    canvas.stampDisc(CX, 72, 1.4, INK_COLORS.WHITE_JADE, 1.0);

    // [절대신의 두부 및 면갑]
    canvas.stampEllipse(CX, 40, 12, 15, 0, INK_COLORS.INK_DEEP, 0.99);
    canvas.drawRadialWash(CX, 38, 13, INK_COLORS.INK_MID, INK_COLORS.PURPLE_SHADOW, 0.98, 0.6);

    // [제왕의 3단 절대 왕관 (Imperial Triple Crown)]
    const crownPts = [
      [CX - 18, 30], [CX - 22, 10], [CX - 10, 18],
      [CX, 2], [CX + 10, 18], [CX + 22, 10], [CX + 18, 30]
    ];
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.INK_DEEP, 5.5, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.GOLD_ROYAL, 2.8, 1.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.stampDisc(CX, 8, 3.2, INK_COLORS.RED_CRIMSON, 0.98);

    // [절대신의 양안 (Golden Divine Eyes)]
    canvas.drawGlow(CX - 6, 42, 10, INK_COLORS.GOLD_BRIGHT, 0.9);
    canvas.drawGlow(CX + 6, 42, 10, INK_COLORS.GOLD_BRIGHT, 0.9);
    canvas.stampDisc(CX - 6, 42, 2.2, INK_COLORS.GOLD_BRIGHT, 0.98);
    canvas.stampDisc(CX + 6, 42, 2.2, INK_COLORS.GOLD_BRIGHT, 0.98);
    canvas.stampDisc(CX - 6, 42, 1.0, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 6, 42, 1.0, INK_COLORS.WHITE_JADE, 1.0);

    // [이마 중앙: 개안한 혼돈의 제3의 눈 (All-Seeing Third Eye)]
    canvas.drawGlow(CX, 32, 14, INK_COLORS.RED_FIRE, 0.95);
    canvas.stampEllipse(CX, 32, 2.2, 5.0, 0, INK_COLORS.RED_CRIMSON, 0.98);
    canvas.stampDisc(CX, 32, 1.2, INK_COLORS.GOLD_BRIGHT, 1.0);

    // 양옆에 부유하는 절대 역장 보주 2기
    canvas.drawGlow(CX - 38, 40, 14, INK_COLORS.PURPLE_ARCANE, 0.85);
    canvas.drawGlow(CX + 38, 40, 14, INK_COLORS.PURPLE_ARCANE, 0.85);
    canvas.stampDisc(CX - 38, 40, 4.0, INK_COLORS.PURPLE_ARCANE, 0.95);
    canvas.stampDisc(CX + 38, 40, 4.0, INK_COLORS.PURPLE_ARCANE, 0.95);
    canvas.stampDisc(CX - 38, 40, 1.8, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 38, 40, 1.8, INK_COLORS.WHITE_JADE, 0.98);
  },

  // 10. 심해 대왕 문어 (boss_kraken)
  // 거대한 심해 유선형 두부, 똬리 튼 8가닥 묵직한 촉수, 발광 흡반과 가로 악마 동공
  boss_kraken: (canvas) => {
    const prng = createPRNG(1015);

    // [배경] 심해 암청과 감청의 심해 수묵 워시 및 먹물 폭풍
    canvas.drawRadialWash(CX, CY, 58, INK_COLORS.BLUE_AZURE, INK_COLORS.BLUE_MIDNIGHT, 0.45, 0.0);
    canvas.drawSplatter(CX, CY, 22, 50, INK_COLORS.INK_DEEP, 1016);

    // [배후 외곽 촉수 4가닥 (좌우 대칭)]
    const outerTentacle1 = [[CX - 18, 52], [CX - 38, 42], [CX - 54, 28], [CX - 58, 14]];
    const outerTentacle2 = [[CX - 22, 58], [CX - 46, 56], [CX - 58, 70], [CX - 54, 88], [CX - 42, 98]];
    [outerTentacle1, outerTentacle2].forEach(ot => {
      canvas.drawSymmetricStroke(ot, INK_COLORS.INK_DEEP, 7.0, 1.8, { alpha: 0.98, feiBai: 0.25, prng });
      canvas.drawSymmetricStroke(ot, INK_COLORS.BLUE_AZURE, 3.2, 0.8, { alpha: 0.85, isAdditive: true, prng });
    });

    // 외곽 촉수 발광 흡반 스탬프 (대칭)
    const outerSuckers = [
      [CX - 36, 43], [CX - 50, 31],
      [CX - 44, 57], [CX - 55, 72], [CX - 50, 87]
    ];
    outerSuckers.forEach(([sx, sy]) => {
      canvas.stampDisc(sx, sy, 2.8, INK_COLORS.BLUE_CYAN, 0.95);
      canvas.stampDisc(sx, sy, 1.4, INK_COLORS.WHITE_JADE, 0.98);
      canvas.stampDisc(WIDTH - sx, sy, 2.8, INK_COLORS.BLUE_CYAN, 0.95);
      canvas.stampDisc(WIDTH - sx, sy, 1.4, INK_COLORS.WHITE_JADE, 0.98);
    });

    // [문어 외투막 두부 (Mantle)]
    canvas.stampEllipse(CX, 36, 26, 22, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX, 34, 24, INK_COLORS.BLUE_AZURE, INK_COLORS.BLUE_MIDNIGHT, 0.98, 0.4);

    // 두부 비백 하이라이트 및 이마 주름 먹선
    canvas.drawCalligraphyStroke([[CX - 14, 22], [CX, 18], [CX + 14, 22]], INK_COLORS.BLUE_CYAN, 3.0, 3.0, { alpha: 0.65, isAdditive: true, prng });
    canvas.drawCalligraphyStroke([[CX, 20], [CX, 44]], INK_COLORS.INK_DEEP, 3.5, 2.0, { alpha: 0.9, prng });

    // [크라켄 안구 및 가로 악마 동공 (Slit Pupil)]
    canvas.drawGlow(CX - 20, 50, 14, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 20, 50, 14, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.stampEllipse(CX - 20, 50, 5.5, 4.2, -0.15, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampEllipse(CX + 20, 50, 5.5, 4.2, 0.15, INK_COLORS.GOLD_ROYAL, 0.98);

    // 수평 악마 동공
    canvas.stampEllipse(CX - 20, 50, 4.0, 1.6, -0.15, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampEllipse(CX + 20, 50, 4.0, 1.6, 0.15, INK_COLORS.INK_DEEP, 1.0);
    canvas.stampDisc(CX - 21, 49, 1.6, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(CX + 19, 49, 1.6, INK_COLORS.WHITE_JADE, 0.98);

    // [전면 거대 포획 촉수군 (Tentacles)]
    const innerTentacle1 = [[CX - 8, 56], [CX - 14, 76], [CX - 8, 98], [CX - 18, 118]];
    const innerTentacle2 = [[CX - 16, 56], [CX - 32, 78], [CX - 36, 102], [CX - 24, 120]];
    [innerTentacle1, innerTentacle2].forEach(it => {
      canvas.drawSymmetricStroke(it, INK_COLORS.INK_DEEP, 8.5, 2.2, { alpha: 0.98, feiBai: 0.2, prng });
      canvas.drawSymmetricStroke(it, INK_COLORS.BLUE_CYAN, 2.5, 0.8, { alpha: 0.85, isAdditive: true, prng });
    });

    // 전면 포획 촉수 발광 흡반들 (좌우 대칭 스탬핑)
    const innerSuckers = [
      [CX - 12, 72], [CX - 11, 88], [CX - 15, 106],
      [CX - 26, 74], [CX - 34, 92], [CX - 30, 110]
    ];
    innerSuckers.forEach(([ix, iy]) => {
      canvas.stampDisc(ix, iy, 3.2, INK_COLORS.BLUE_CYAN, 0.95);
      canvas.stampDisc(ix, iy, 1.6, INK_COLORS.WHITE_JADE, 0.98);
      canvas.stampDisc(WIDTH - ix, iy, 3.2, INK_COLORS.BLUE_CYAN, 0.95);
      canvas.stampDisc(WIDTH - ix, iy, 1.6, INK_COLORS.WHITE_JADE, 0.98);
    });

    // [하단 먹물 분출구 및 수묵 제트]
    canvas.stampEllipse(CX, 62, 6.0, 4.5, 0, INK_COLORS.INK_DEEP, 1.0);
    canvas.drawCalligraphyStroke([[CX, 64], [CX, 92]], INK_COLORS.INK_DEEP, 6.0, 1.5, { alpha: 0.9, feiBai: 0.4, prng });
  },

  // 11. 강철 집게 타이탄 크랩 (boss_titancrab)
  // 난공불락의 흑철 갑각, 위압적인 거대 타이탄 집게발, 날카로운 백은 치열과 솟구친 눈자루
  boss_titancrab: (canvas) => {
    const prng = createPRNG(1017);

    // [배경] 단청 다홍과 석간주 초열 살기 워시 및 갑각 파편
    canvas.drawRadialWash(CX, 68, 56, INK_COLORS.RED_DEEP, INK_COLORS.INK_DEEP, 0.45, 0.0);
    canvas.drawSplatter(CX, 72, 18, 46, INK_COLORS.RED_DEEP, 1018);

    // [보행각 (Walking Legs) 4쌍 (좌우 대칭)]
    const legs = [
      [[CX - 30, 62], [CX - 48, 58], [CX - 58, 48]],
      [[CX - 34, 70], [CX - 54, 72], [CX - 62, 66]],
      [[CX - 32, 78], [CX - 52, 86], [CX - 58, 96]],
      [[CX - 26, 86], [CX - 42, 100], [CX - 48, 116]]
    ];
    legs.forEach(l => {
      canvas.drawSymmetricStroke(l, INK_COLORS.INK_DEEP, 5.5, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
      canvas.drawSymmetricStroke(l, INK_COLORS.RED_CRIMSON, 2.0, 0.6, { alpha: 0.8, isAdditive: true, prng });
    });

    // [등딱지 갑각 본체 (Carapace)]
    canvas.stampEllipse(CX, 72, 34, 24, 0, INK_COLORS.INK_DEEP, 0.99);
    canvas.drawRadialWash(CX, 70, 32, INK_COLORS.GOLD_AMBER, INK_COLORS.RED_DEEP, 0.98, 0.4);

    // 갑각 상하 테두리 흑철 능선
    canvas.drawCalligraphyStroke([[CX - 32, 60], [CX, 56], [CX + 32, 60]], INK_COLORS.INK_DEEP, 6.0, 6.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX - 30, 76], [CX, 94], [CX + 30, 76]], INK_COLORS.INK_DEEP, 5.0, 5.0, { alpha: 0.98, prng });

    // 갑각 중앙 단청 심장부 및 갈필 균열
    canvas.stampEllipse(CX, 72, 18, 12, 0, INK_COLORS.RED_CRIMSON, 0.95);
    canvas.stampEllipse(CX, 72, 10, 6, 0, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.drawSymmetricStroke([[CX, 64], [CX - 12, 72], [CX - 6, 82]], INK_COLORS.WHITE_SILVER, 2.2, 0.8, { isAdditive: true, prng });

    // [돌출된 눈자루 및 황금 안광 (Eyestalks)]
    canvas.drawCalligraphyStroke([[CX - 12, 58], [CX - 14, 46]], INK_COLORS.INK_DEEP, 4.0, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[CX + 12, 58], [CX + 14, 46]], INK_COLORS.INK_DEEP, 4.0, 3.5, { alpha: 0.98, prng });

    canvas.drawGlow(CX - 14, 44, 12, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 14, 44, 12, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.stampDisc(CX - 14, 44, 4.2, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampDisc(CX + 14, 44, 4.2, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampDisc(CX - 14, 44, 1.8, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 14, 44, 1.8, INK_COLORS.WHITE_JADE, 1.0);

    // [압도적인 대형 타이탄 집게발 (Titan Claws - 좌우 대칭)]
    const clawArm = [[CX - 26, 62], [CX - 40, 52], [CX - 44, 38]];
    canvas.drawSymmetricStroke(clawArm, INK_COLORS.INK_DEEP, 8.0, 7.0, { alpha: 0.98, prng });

    // 집게 손목/구(Bulb)
    canvas.stampEllipse(CX - 44, 34, 14, 11, 0.25, INK_COLORS.RED_DEEP, 0.98);
    canvas.stampEllipse(CX + 44, 34, 14, 11, -0.25, INK_COLORS.RED_DEEP, 0.98);

    // 집게발 갈고리 턱 (Dactyl & Pollex)
    const outerClaw = [[CX - 46, 38], [CX - 56, 26], [CX - 52, 10], [CX - 38, 8]];
    const innerClaw = [[CX - 40, 36], [CX - 34, 24], [CX - 32, 14], [CX - 36, 8]];
    canvas.drawSymmetricStroke(outerClaw, INK_COLORS.INK_DEEP, 7.5, 2.2, { alpha: 0.98, prng });
    canvas.drawSymmetricStroke(innerClaw, INK_COLORS.INK_DEEP, 6.5, 2.0, { alpha: 0.98, prng });

    canvas.drawSymmetricStroke(outerClaw, INK_COLORS.RED_CRIMSON, 3.5, 1.0, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawSymmetricStroke(innerClaw, INK_COLORS.GOLD_AMBER, 2.8, 0.8, { alpha: 0.85, isAdditive: true, prng });

    // 집게 안쪽의 예리한 백은 이빨 (Teeth)
    const teeth = [
      [CX - 48, 18], [CX - 44, 14], [CX - 40, 11],
      [CX + 48, 18], [CX + 44, 14], [CX + 40, 11]
    ];
    teeth.forEach(([tx, ty]) => {
      canvas.stampDisc(tx, ty, 2.2, INK_COLORS.WHITE_JADE, 0.98);
    });

    // 주위 분쇄 기포 (Bubbles)
    canvas.stampDisc(CX - 52, 28, 2.5, INK_COLORS.WHITE_SILVER, 0.85);
    canvas.stampDisc(CX + 52, 28, 2.5, INK_COLORS.WHITE_SILVER, 0.85);
    canvas.stampDisc(CX - 32, 8, 2.0, INK_COLORS.BLUE_CYAN, 0.9, true);
    canvas.stampDisc(CX + 32, 8, 2.0, INK_COLORS.BLUE_CYAN, 0.9, true);
  },

  // 12. 심해의 지배자 레비아탄 (boss_leviathan)
  // 바다를 가르는 고대 해룡, 역동적 S자 똬리 척추, 비백 파도 지느러미 날개, 날카로운 백은 치열
  boss_leviathan: (canvas) => {
    const prng = createPRNG(1019);

    // [배경] 소용돌이치는 감청/비취 시안 해류 워시 및 비묵
    canvas.drawRadialWash(CX, CY, 58, INK_COLORS.BLUE_AZURE, INK_COLORS.BLUE_MIDNIGHT, 0.45, 0.0);
    canvas.drawSplatter(CX, CY, 20, 48, INK_COLORS.BLUE_AZURE, 1020);

    // 배경을 휘감는 갈필 해류 소용돌이
    const whirlpoolPts = [[18, 92], [36, 112], [76, 116], [108, 96], [116, 68], [98, 42]];
    canvas.drawCalligraphyStroke(whirlpoolPts, INK_COLORS.BLUE_AZURE, 4.0, 1.0, { alpha: 0.5, isAdditive: true, feiBai: 0.35, prng });

    // [해룡의 S자 똬리 몸체 (Serpentine Spine)]
    const spinePts = [[24, 108], [42, 116], [74, 108], [88, 88], [82, 66], [62, 54], [52, 40], [58, 26]];
    canvas.drawCalligraphyStroke(spinePts, INK_COLORS.INK_DEEP, 16.0, 10.0, { alpha: 0.99, prng });
    canvas.drawCalligraphyStroke(spinePts, INK_COLORS.BLUE_MIDNIGHT, 12.0, 7.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(spinePts, INK_COLORS.WHITE_SILVER, 4.5, 2.2, { alpha: 0.7, isAdditive: true, feiBai: 0.25, prng });

    // [등줄기 가시 볏 (Dorsal Spines)]
    const dorsalSpines = [
      [[42, 116], [42, 126]],
      [[62, 114], [68, 125]],
      [[84, 98], [100, 106]],
      [[88, 80], [104, 82]],
      [[78, 62], [94, 58]],
      [[60, 48], [74, 42]]
    ];
    dorsalSpines.forEach(s => {
      canvas.drawCalligraphyStroke(s, INK_COLORS.WHITE_JADE, 3.5, 0.8, { alpha: 0.98, prng });
    });

    // [갈필 파도 지느러미 날개 (Fin-Wings)]
    const leftFin = [[62, 54], [38, 48], [16, 56], [8, 70]];
    const rightFin = [[82, 66], [104, 60], [120, 68]];
    [leftFin, rightFin].forEach(f => {
      canvas.drawCalligraphyStroke(f, INK_COLORS.INK_DEEP, 6.5, 1.2, { alpha: 0.98, feiBai: 0.4, prng });
      canvas.drawCalligraphyStroke(f, INK_COLORS.BLUE_CYAN, 2.5, 0.5, { alpha: 0.85, isAdditive: true, prng });
    });

    // [해룡의 두부 및 포효하는 턱 (Dragon Jaws)]
    const upperJaw = [[52, 32], [58, 22], [76, 16], [90, 18], [94, 24]];
    const lowerJaw = [[54, 34], [68, 32], [84, 30], [88, 36]];
    canvas.drawCalligraphyStroke(upperJaw, INK_COLORS.INK_DEEP, 6.0, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(lowerJaw, INK_COLORS.INK_DEEP, 5.0, 3.0, { alpha: 0.98, prng });

    // 날카로운 백은 송곳니
    const fangs = [
      [70, 20], [78, 20], [86, 22],
      [66, 30], [74, 30], [82, 28]
    ];
    fangs.forEach(([fx, fy]) => {
      canvas.stampDisc(fx, fy, 2.0, INK_COLORS.WHITE_JADE, 1.0);
    });

    // [고대 산호형 해룡 뿔 및 수염]
    const horn = [[54, 22], [42, 14], [28, 12], [16, 16]];
    canvas.drawCalligraphyStroke(horn, INK_COLORS.INK_DEEP, 5.5, 1.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(horn, INK_COLORS.WHITE_SILVER, 2.2, 0.6, { alpha: 0.8, isAdditive: true, prng });

    const whisker = [[62, 34], [52, 44], [36, 48]];
    canvas.drawCalligraphyStroke(whisker, INK_COLORS.BLUE_CYAN, 2.5, 0.5, { alpha: 0.85, isAdditive: true, feiBai: 0.3, prng });

    // [비취 용안 (Dragon Eye)]
    canvas.drawGlow(64, 22, 14, INK_COLORS.BLUE_CYAN, 0.95);
    canvas.stampEllipse(64, 22, 4.5, 3.2, 0.2, INK_COLORS.BLUE_CYAN, 0.98);
    canvas.stampDisc(64, 22, 2.0, INK_COLORS.GOLD_BRIGHT, 0.98);
    canvas.stampDisc(63, 21, 1.2, INK_COLORS.WHITE_JADE, 1.0);
  },

  // 13. 심연의 고대신 다곤 (boss_dagon)
  // 반인반어 심연 신격, 위엄 있는 황금 삼지창과 심연 보주, 고대 왕관과 촉수 수염
  boss_dagon: (canvas) => {
    const prng = createPRNG(1021);

    // [배경] 벽옥 에메랄드와 심연 흑자색의 고대 신격 오라 워시
    canvas.drawRadialWash(CX, CY, 58, INK_COLORS.GREEN_JADE, INK_COLORS.PURPLE_SHADOW, 0.42, 0.0);
    canvas.drawSplatter(CX, CY, 18, 48, INK_COLORS.GREEN_DARK, 1022);

    // [하반신 로브 및 심연 지느러미 (Lower Robe)]
    const robePts = [
      [CX - 28, 64], [CX - 38, 92], [CX - 24, 116],
      [CX, 110], [CX + 24, 116], [CX + 38, 92], [CX + 28, 64]
    ];
    canvas.drawCalligraphyStroke(robePts, INK_COLORS.INK_DEEP, 8.5, 6.5, { alpha: 0.98, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, 92, 30, INK_COLORS.GREEN_DARK, INK_COLORS.BLUE_MIDNIGHT, 0.95, 0.4);
    canvas.drawCalligraphyStroke([[CX, 64], [CX, 108]], INK_COLORS.GREEN_JADE, 3.5, 1.5, { alpha: 0.85, isAdditive: true, prng });

    // [우측 거대한 황금 삼지창 (Trident of the Abyss)]
    const tridentShaft = [[CX + 36, 122], [CX + 36, 22]];
    canvas.drawCalligraphyStroke(tridentShaft, INK_COLORS.INK_DEEP, 5.5, 4.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(tridentShaft, INK_COLORS.GOLD_ROYAL, 2.5, 2.0, { alpha: 0.95, isAdditive: true, prng });

    const tridentCrossbar = [[CX + 26, 26], [CX + 46, 26]];
    canvas.drawCalligraphyStroke(tridentCrossbar, INK_COLORS.GOLD_ROYAL, 4.0, 4.0, { alpha: 0.95, isAdditive: true, prng });

    const centerProng = [[CX + 36, 26], [CX + 36, 6]];
    const leftProng = [[CX + 28, 26], [CX + 24, 14], [CX + 28, 8]];
    const rightProng = [[CX + 44, 26], [CX + 48, 14], [CX + 44, 8]];
    [centerProng, leftProng, rightProng].forEach(p => {
      canvas.drawCalligraphyStroke(p, INK_COLORS.INK_DEEP, 4.5, 1.2, { alpha: 0.98, prng });
      canvas.drawCalligraphyStroke(p, INK_COLORS.WHITE_JADE, 2.2, 0.6, { alpha: 0.95, isAdditive: true, prng });
    });

    // 삼지창 중앙의 심연 보주 (Abyss Orb)
    canvas.drawGlow(CX + 36, 26, 16, INK_COLORS.BLUE_CYAN, 0.95);
    canvas.stampDisc(CX + 36, 26, 5.5, INK_COLORS.BLUE_CYAN, 0.98);
    canvas.stampDisc(CX + 36, 26, 2.8, INK_COLORS.GOLD_BRIGHT, 0.98);
    canvas.stampDisc(CX + 36, 26, 1.2, INK_COLORS.WHITE_JADE, 1.0);

    // [흉부 및 견갑 (Torso & Shoulders)]
    const leftShoulder = [[CX - 16, 52], [CX - 36, 48], [CX - 44, 62], [CX - 24, 68]];
    const rightShoulder = [[CX + 16, 52], [CX + 32, 48], [CX + 38, 62], [CX + 20, 68]];
    canvas.drawCalligraphyStroke(leftShoulder, INK_COLORS.INK_DEEP, 7.0, 5.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(rightShoulder, INK_COLORS.INK_DEEP, 7.0, 5.0, { alpha: 0.98, prng });
    canvas.stampEllipse(CX - 2, 62, 16, 14, 0, INK_COLORS.GREEN_DARK, 0.98);
    canvas.drawCalligraphyStroke([[CX - 8, 62], [CX + 4, 62]], INK_COLORS.BLUE_CYAN, 2.2, 2.2, { isAdditive: true, prng });

    // [두부, 부채꼴 지느러미 귀 및 촉수 수염]
    canvas.stampEllipse(CX - 4, 42, 14, 15, 0, INK_COLORS.INK_DEEP, 0.98);
    canvas.drawRadialWash(CX - 4, 40, 13, INK_COLORS.GREEN_JADE, INK_COLORS.GREEN_DARK, 0.98, 0.5);

    const leftFrill = [[CX - 16, 38], [CX - 30, 32], [CX - 32, 44], [CX - 18, 48]];
    const rightFrill = [[CX + 8, 38], [CX + 22, 32], [CX + 24, 44], [CX + 10, 48]];
    canvas.drawCalligraphyStroke(leftFrill, INK_COLORS.GREEN_JADE, 4.5, 1.5, { alpha: 0.95, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(rightFrill, INK_COLORS.GREEN_JADE, 4.5, 1.5, { alpha: 0.95, feiBai: 0.2, prng });

    // 턱 아래 촉수 수염 4가닥 (Tentacle Beard)
    const beard = [
      [[CX - 10, 52], [CX - 16, 64], [CX - 12, 74]],
      [[CX - 5, 54], [CX - 8, 68], [CX - 4, 80]],
      [[CX, 54], [CX + 2, 68], [CX + 6, 78]],
      [[CX + 5, 52], [CX + 10, 64], [CX + 8, 74]]
    ];
    beard.forEach(b => {
      canvas.drawCalligraphyStroke(b, INK_COLORS.INK_DEEP, 3.5, 1.0, { alpha: 0.95, feiBai: 0.2, prng });
      canvas.drawCalligraphyStroke(b, INK_COLORS.GREEN_JADE, 1.5, 0.4, { alpha: 0.8, isAdditive: true, prng });
    });

    // [고대 심해 왕관 (Deep Crown)]
    const crownPts = [
      [CX - 16, 32], [CX - 18, 16], [CX - 9, 24],
      [CX - 4, 12], [CX + 2, 24], [CX + 10, 16], [CX + 8, 32]
    ];
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.INK_DEEP, 5.0, 3.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.GOLD_ROYAL, 2.5, 1.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.stampDisc(CX - 4, 18, 3.0, INK_COLORS.BLUE_CYAN, 0.98);

    // [빛나는 황금 안광 (Dagon Eyes)]
    canvas.drawGlow(CX - 9, 40, 12, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.drawGlow(CX + 1, 40, 12, INK_COLORS.GOLD_BRIGHT, 0.85);
    canvas.stampDisc(CX - 9, 40, 2.5, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampDisc(CX + 1, 40, 2.5, INK_COLORS.GOLD_ROYAL, 0.98);
    canvas.stampDisc(CX - 9, 40, 1.2, INK_COLORS.WHITE_JADE, 1.0);
    canvas.stampDisc(CX + 1, 40, 1.2, INK_COLORS.WHITE_JADE, 1.0);
  }
};

// ================= 보스 13종 완전 식별자 목록 =================
const BOSS_KEYS = [
  'boss_boar',
  'boss_void',
  'boss_eye',
  'boss_colossus',
  'boss_doom',
  'boss_lich',
  'boss_reaper',
  'boss_wyrm',
  'boss_overlord',
  'boss_kraken',
  'boss_titancrab',
  'boss_leviathan',
  'boss_dagon'
];

/**
 * 특정 보스 키가 수묵화풍 고해상도 생성기를 지원하는지 검사
 * @param {string} key
 * @returns {boolean}
 */
function hasInkBoss(key) {
  return typeof BOSS_RENDERERS[key] === 'function';
}

/**
 * 보스 식별자에 대응하는 128x128 고해상도 수묵 RGBA 버퍼 렌더링
 * @param {string} key
 * @returns {Buffer|null}
 */
function renderInkBoss(key) {
  const renderer = BOSS_RENDERERS[key];
  if (!renderer) return null;

  const canvas = new BossInkCanvas(WIDTH, HEIGHT);
  renderer(canvas);
  return canvas.buffer;
}

module.exports = {
  renderInkBoss,
  hasInkBoss,
  BOSS_KEYS,
  WIDTH,
  HEIGHT,
  INK_COLORS
};
