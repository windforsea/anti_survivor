// Anti Survivors - 128x128 수묵화풍 고해상도 보스 7종 래스터라이저 (ink_bosses.js)
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

// ================= 보스 7종 128x128 수묵화풍 고해상도 렌더러 =================

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
  }
};

// ================= 보스 7종 식별자 목록 =================
const BOSS_KEYS = [
  'boss_boar',
  'boss_void',
  'boss_eye',
  'boss_colossus',
  'boss_doom',
  'boss_lich',
  'boss_reaper'
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
