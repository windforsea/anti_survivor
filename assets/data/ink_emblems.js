// Anti Survivors - 128x128 수묵화풍 고화질 엠블럼 생성 엔진 (ink_emblems.js)
// 순수 JS 기반 Zero-dependency: 서예 붓터치(필압·갈필), 단청 오방색 그라디언트, 비백 림(Fei-bai Enso Rim) 직접 래스터라이징

const WIDTH = 128;
const HEIGHT = 128;
const CX = 64;
const CY = 64;

// ================= 단청(丹靑) 오방색 및 수묵 팔레트 =================
const INK_COLORS = {
  // 수묵 (농묵, 중묵, 담묵, 청묵)
  INK_DEEP: [12, 14, 20],        // 濃墨 (진한 먹물)
  INK_MID: [38, 42, 54],         // 中墨 (깊은 먹빛)
  INK_LIGHT: [74, 82, 102],      // 淡墨 (물에 번진 먹빛)
  INK_WASH: [110, 120, 145],     // 雲水 (수묵 잔향)

  // 단청 오방색 (청, 적, 황, 백, 흑) & 간색
  WHITE_JADE: [248, 250, 255],   // 옥백 (호분 백색, 비백 림 하이라이트)
  WHITE_SILVER: [215, 225, 238], // 은백 (차가운 강철/한기)
  
  RED_CRIMSON: [225, 29, 72],    // 선혈 진홍 (단청 주홍)
  RED_DEEP: [159, 18, 57],       // 석간주 (묵직한 암적색)
  RED_FIRE: [244, 63, 94],       // 화염 홍안 (타오르는 불꽃)

  GOLD_ROYAL: [250, 204, 21],    // 어전 황금 (제왕/성역의 황금빛)
  GOLD_AMBER: [217, 119, 6],     // 삼색 황토 (온화한 호박색)
  GOLD_BRIGHT: [254, 240, 138],  // 명황 (빛의 코어)

  BLUE_AZURE: [2, 132, 199],     // 감청 (단청 푸른빛)
  BLUE_CYAN: [6, 182, 212],      // 비취 시안 (영기, 플라즈마)
  BLUE_MIDNIGHT: [15, 23, 42],   // 심해 암청 (어둠의 장막)

  GREEN_JADE: [16, 185, 129],    // 벽옥 에메랄드 (치유, 정령)
  GREEN_VENOM: [34, 197, 94],    // 맹독 취록 (독비수, 풀잎)
  GREEN_DARK: [20, 83, 45],      // 송록 (깊은 솔잎색)

  PURPLE_ARCANE: [168, 85, 247], // 아케인 자황 (비전 마법)
  PURPLE_SHADOW: [88, 28, 135],  // 심연 흑자 (워록의 암흑)
  PURPLE_VOID: [46, 16, 101]     // 공허 자색
};

// ================= 시드 기반 경량 의사난수 생성기 (결정적 렌더링) =================
function createPRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ================= 128x128 순수 JS 고화질 소프트웨어 래스터라이저 =================
class InkCanvas {
  constructor(width = WIDTH, height = HEIGHT) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4); // RGBA
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

  // 가산 블렌딩 (빛/오라 효과)
  addPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    const sa = Math.min(1, Math.max(0, a));

    this.buffer[idx] = Math.min(255, this.buffer[idx] + Math.round(r * sa));
    this.buffer[idx + 1] = Math.min(255, this.buffer[idx + 1] + Math.round(g * sa));
    this.buffer[idx + 2] = Math.min(255, this.buffer[idx + 2] + Math.round(b * sa));
    this.buffer[idx + 3] = Math.min(255, this.buffer[idx + 3] + Math.round(sa * 255 * 0.7));
  }

  // 안티앨리어싱 원형 스탬프
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
      feiBai = 0.0, // 갈필/비백 강도 (0: 없음 ~ 1: 강함)
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

    // 0.4픽셀 간격으로 정밀 보간하며 브러시 스탬핑
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
      // 서예 필압 커브 (가운데가 살짝 부풀었다가 끝에서 날카롭게 빠지는 전통 필법)
      const pressure = Math.sin(progress * Math.PI * 0.9 + 0.1);
      const curWidth = widthStart + (widthEnd - widthStart) * progress;
      const radius = Math.max(0.6, (curWidth * (0.6 + 0.5 * pressure)) / 2);

      // 비백(갈필) 처리: 진행 방향에 따라 붓털이 갈라져 여백이 생기는 서예 특유의 표현
      if (feiBai > 0 && progress > 0.25) {
        const splitChance = feiBai * (0.3 + 0.5 * progress);
        if (prng() < splitChance) {
          // 붓털 갈라짐: 중심을 비우고 양갈래 미세 스탬프 찍기
          const normalX = -(points[seg + 1][1] - points[seg][1]);
          const normalY = points[seg + 1][0] - points[seg][0];
          const nLen = Math.sqrt(normalX * normalX + normalY * normalY) || 1;
          const off = (radius * 0.75);
          this.stampDisc(x + (normalX / nLen) * off, y + (normalY / nLen) * off, radius * 0.4, color, alpha * 0.85, isAdditive);
          this.stampDisc(x - (normalX / nLen) * off, y - (normalY / nLen) * off, radius * 0.35, color, alpha * 0.75, isAdditive);
          continue;
        }
      }

      this.stampDisc(x, y, radius, color, alpha, isAdditive);
    }
  }

  // 일필휘지 수묵 비백 원환 (Enso Rim)
  drawEnsoRim(cx, cy, radius, baseThick = 5.5, color = INK_COLORS.INK_DEEP, feiBaiFactor = 0.4, seed = 42) {
    const prng = createPRNG(seed);
    const startAngle = -Math.PI * 0.75; // 10시 방향 기필
    const sweepAngle = Math.PI * 1.95;  // 350도 회전 수필
    const steps = 180;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + sweepAngle * t;
      // 붓의 미세한 흔들림 및 완급
      const rOffset = (prng() - 0.5) * 1.5 + Math.sin(t * Math.PI * 3) * 0.8;
      const r = radius + rOffset;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push([x, y]);
    }

    // 1패스: 짙은 본선 붓터치 (기필은 굵고, 중반에 육중하며, 수필에서 비백으로 흩어짐)
    this.drawCalligraphyStroke(points, color, baseThick * 0.8, baseThick * 0.3, {
      alpha: 0.96,
      feiBai: feiBaiFactor,
      prng
    });

    // 2패스: 먹 번짐 잔상 (은은한 담묵 워시)
    this.drawCalligraphyStroke(points, INK_COLORS.INK_LIGHT, baseThick * 1.8, baseThick * 0.5, {
      alpha: 0.18,
      feiBai: 0,
      prng
    });

    // 3패스: 비백 림 옥백 하이라이트 림 스침
    const whitePoints = points.slice(Math.floor(steps * 0.15), Math.floor(steps * 0.7));
    this.drawCalligraphyStroke(whitePoints, INK_COLORS.WHITE_JADE, 1.2, 0.6, {
      alpha: 0.35,
      isAdditive: true,
      feiBai: 0.2,
      prng
    });
  }

  // 붓을 튕길 때 튀는 비묵(飛墨, Ink Splatter) 효과
  drawSplatter(cx, cy, count = 8, spread = 30, color = INK_COLORS.INK_DEEP, seed = 101) {
    const prng = createPRNG(seed);
    for (let i = 0; i < count; i++) {
      const angle = prng() * Math.PI * 2;
      const dist = 12 + prng() * spread;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = 0.5 + prng() * 1.5;
      const a = 0.4 + prng() * 0.5;
      this.stampDisc(x, y, size, color, a);
    }
  }

  // 128x128 엠블럼 기본 베이스 (단청 오방색 기운 + 수묵 원환 비백 림)
  drawBaseEmblem(themeColor, auraGlow = 0.35, seed = 777) {
    // 1. 외곽 은은한 수묵 먹 번짐 워시
    this.drawRadialWash(CX, CY, 58, INK_COLORS.INK_MID, INK_COLORS.INK_DEEP, 0.22, 0.0);
    // 2. 단청 오방색 내부 코어 오라
    this.drawRadialWash(CX, CY, 46, themeColor, INK_COLORS.INK_DEEP, auraGlow, 0.0);
    // 3. 중심 은은한 발광
    this.drawGlow(CX, CY, 38, themeColor, 0.3);
    // 4. 일필휘지 수묵 비백 림 (외곽 원환)
    this.drawEnsoRim(CX, CY, 52, 5.2, INK_COLORS.INK_DEEP, 0.45, seed);
    // 5. 비묵 점포
    this.drawSplatter(CX, CY, 6, 42, INK_COLORS.INK_DEEP, seed + 1);
  }
}

// ================= 14종 기본 무기 128x128 수묵 엠블럼 렌더러 =================

const WEAPONS_INK = {
  // 1. 철검 (sword) : 웅장한 사인참사검의 서예 검신과 백은/단청 하이라이트
  icon_sword: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.WHITE_SILVER, 0.4, 101);
    const prng = createPRNG(101);

    // 대각선(-45도) 서예 검신 붓터치
    const bladePts = [[26, 102], [48, 80], [74, 54], [102, 26]];
    // 짙은 먹선 검신 본체
    canvas.drawCalligraphyStroke(bladePts, INK_COLORS.INK_DEEP, 7.5, 3.5, { alpha: 0.98, feiBai: 0.15, prng });
    // 백은 하이라이트 날선 (은백)
    const edgePts = [[28, 100], [50, 78], [76, 52], [103, 25]];
    canvas.drawCalligraphyStroke(edgePts, INK_COLORS.WHITE_JADE, 2.2, 0.8, { alpha: 0.95, isAdditive: true, prng });
    // 검 중심 혈조(Blood groove) 청백 광채
    canvas.drawCalligraphyStroke([[34, 94], [70, 58], [94, 34]], INK_COLORS.BLUE_CYAN, 1.0, 0.4, { alpha: 0.8, isAdditive: true, prng });

    // 단청 황금 십자 가드
    const guardPts = [[32, 68], [44, 80], [56, 92]];
    canvas.drawCalligraphyStroke(guardPts, INK_COLORS.GOLD_ROYAL, 4.8, 4.8, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(guardPts, INK_COLORS.GOLD_BRIGHT, 1.8, 1.8, { alpha: 0.9, isAdditive: true, prng });

    // 칼자루 및 손잡이 끝 붉은 매듭 술
    canvas.drawCalligraphyStroke([[24, 104], [14, 114]], INK_COLORS.INK_DEEP, 3.8, 3.2, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[14, 114], [10, 118]], INK_COLORS.RED_CRIMSON, 3.2, 1.2, { alpha: 0.95, prng });
    canvas.drawGlow(72, 56, 24, INK_COLORS.BLUE_CYAN, 0.4);
  },

  // 2. 도끼 (axe) : 육중한 금강 양날 배틀액스와 화염 단청 룬
  icon_axe: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_AMBER, 0.42, 102);
    const prng = createPRNG(102);

    // 중앙 자루 (서예 나무 먹선)
    const shaftPts = [[32, 110], [64, 64], [96, 18]];
    canvas.drawCalligraphyStroke(shaftPts, INK_COLORS.INK_DEEP, 5.0, 4.0, { alpha: 0.98, feiBai: 0.1, prng });
    canvas.drawCalligraphyStroke(shaftPts, INK_COLORS.GOLD_AMBER, 1.5, 1.0, { alpha: 0.6, isAdditive: true, prng });

    // 좌측 초승달 도끼날
    const leftBlade = [[60, 42], [32, 34], [22, 54], [40, 78], [62, 70]];
    canvas.drawCalligraphyStroke(leftBlade, INK_COLORS.INK_DEEP, 6.5, 5.5, { alpha: 0.95, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke([[32, 34], [22, 54], [40, 78]], INK_COLORS.WHITE_JADE, 2.2, 1.2, { alpha: 0.9, isAdditive: true, prng });

    // 우측 초승달 도끼날
    const rightBlade = [[68, 42], [96, 34], [106, 54], [88, 78], [66, 70]];
    canvas.drawCalligraphyStroke(rightBlade, INK_COLORS.INK_DEEP, 6.5, 5.5, { alpha: 0.95, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke([[96, 34], [106, 54], [88, 78]], INK_COLORS.WHITE_JADE, 2.2, 1.2, { alpha: 0.9, isAdditive: true, prng });

    // 중앙 코어 단청 황금/화염 결속 룬
    canvas.stampDisc(64, 56, 7.5, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.stampDisc(64, 56, 4.2, INK_COLORS.RED_CRIMSON, 0.95);
    canvas.drawGlow(64, 56, 20, INK_COLORS.GOLD_ROYAL, 0.45);
  },

  // 3. 단검 (dagger) : 날렵한 수묵 비수와 대각선 시안 참격풍
  icon_dagger: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 103);
    const prng = createPRNG(103);

    // 날렵한 칼날 궤적
    const bladePts = [[38, 90], [58, 70], [82, 46], [98, 30]];
    canvas.drawCalligraphyStroke(bladePts, INK_COLORS.INK_DEEP, 5.8, 1.8, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(bladePts, INK_COLORS.WHITE_JADE, 1.8, 0.6, { alpha: 0.95, isAdditive: true, prng });

    // 서예 참격풍 (비백 스피드 라인)
    canvas.drawCalligraphyStroke([[30, 60], [64, 38], [88, 22]], INK_COLORS.BLUE_CYAN, 2.0, 0.5, { alpha: 0.7, isAdditive: true, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke([[48, 88], [82, 66], [106, 50]], INK_COLORS.WHITE_SILVER, 1.6, 0.4, { alpha: 0.6, isAdditive: true, feiBai: 0.3, prng });

    // 단검 가드 및 손잡이
    canvas.drawCalligraphyStroke([[44, 84], [32, 96]], INK_COLORS.GOLD_ROYAL, 3.6, 3.6, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[32, 96], [22, 106]], INK_COLORS.INK_DEEP, 3.2, 2.6, { alpha: 0.95, prng });
  },

  // 4. 표창 (shuriken) : 4방향 회전 수리검과 먹선 돌풍
  icon_shuriken: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.WHITE_SILVER, 0.4, 104);
    const prng = createPRNG(104);

    // 중심 원환
    canvas.stampDisc(CX, CY, 8, INK_COLORS.INK_DEEP, 0.95);
    canvas.stampDisc(CX, CY, 4, INK_COLORS.WHITE_JADE, 0.95);

    // 4방향 칼날 (상, 하, 좌, 우 붓터치)
    const blades = [
      [[CX, CY - 6], [CX - 9, CY - 24], [CX, CY - 44], [CX + 6, CY - 20]],
      [[CX + 6, CY], [CX + 24, CY - 9], [CX + 44, CY], [CX + 20, CY + 6]],
      [[CX, CY + 6], [CX + 9, CY + 24], [CX, CY + 44], [CX - 6, CY + 20]],
      [[CX - 6, CY], [CX - 24, CY + 9], [CX - 44, CY], [CX - 20, CY - 6]]
    ];

    blades.forEach(pts => {
      canvas.drawCalligraphyStroke(pts, INK_COLORS.INK_DEEP, 5.0, 1.5, { alpha: 0.96, prng });
      canvas.drawCalligraphyStroke([pts[0], pts[2]], INK_COLORS.WHITE_JADE, 1.8, 0.6, { alpha: 0.9, isAdditive: true, prng });
    });

    // 회전 돌풍 비백 궤적
    canvas.drawEnsoRim(CX, CY, 34, 2.8, INK_COLORS.BLUE_CYAN, 0.6, 104);
  },

  // 5. 채찍 (whip) : 허공을 찰싹 가르는 역동적인 대각선 S자 수묵 채찍과 비백 파열
  icon_whip: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_CRIMSON, 0.4, 105);
    const prng = createPRNG(105);

    // (1) 좌하단 가죽 손잡이 자루와 황동 폼멜
    const handlePts = [[20, 106], [32, 94]];
    canvas.drawCalligraphyStroke(handlePts, INK_COLORS.INK_DEEP, 7.5, 6.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(handlePts, INK_COLORS.GOLD_ROYAL, 4.0, 3.2, { alpha: 0.95, prng });
    canvas.stampDisc(20, 106, 5.0, INK_COLORS.GOLD_BRIGHT, 0.98); // 폼멜 구슬
    canvas.stampDisc(32, 94, 4.0, INK_COLORS.GOLD_BRIGHT, 0.95);  // 가드 링

    // (2) 역동적인 S자 가죽 채찍 궤적 (손잡이 끝 -> 상향 급상승 -> 완만한 굴곡 -> 우상단 스냅 타격)
    const p0 = [32, 94];
    const p1 = [16, 26];  // 좌상단으로 강렬하게 솟구침
    const p2 = [114, 98]; // 우하단으로 크게 휘감김
    const p3 = [104, 22]; // 우상단 끝단으로 찰싹 튀어오름
    
    const whipPts = [];
    const steps = 70;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
      const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
      whipPts.push([x, y]);
    }

    // 육중한 흑사편 먹선 몸통 (손잡이 쪽 5.5px -> 끝단 1.2px)
    canvas.drawCalligraphyStroke(whipPts, INK_COLORS.INK_DEEP, 5.5, 1.2, { alpha: 0.98, feiBai: 0.35, prng });
    // 채찍 심선을 타고 달리는 진홍빛 단청 혈류
    canvas.drawCalligraphyStroke(whipPts, INK_COLORS.RED_CRIMSON, 2.2, 0.7, { alpha: 0.9, isAdditive: true, prng });
    // 백색 비백 섬광 코어
    canvas.drawCalligraphyStroke(whipPts, INK_COLORS.WHITE_JADE, 1.0, 0.4, { alpha: 0.75, isAdditive: true, prng });

    // (3) 끝단 찰싹 터지는 파열 스파크 (Whip Crack Flash)
    const tip = whipPts[whipPts.length - 1];
    canvas.drawGlow(tip[0], tip[1], 18, INK_COLORS.RED_FIRE, 0.8);
    canvas.stampDisc(tip[0], tip[1], 4.0, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(tip[0], tip[1], 2.0, INK_COLORS.GOLD_BRIGHT, 0.95);

    // 파열 비산 스파크 3선
    const crackSparks = [
      [[tip[0], tip[1]], [tip[0] + 12, tip[1] - 8]],
      [[tip[0], tip[1]], [tip[0] + 10, tip[1] + 8]],
      [[tip[0], tip[1]], [tip[0] - 8, tip[1] - 10]]
    ];
    crackSparks.forEach(spark => {
      canvas.drawCalligraphyStroke(spark, INK_COLORS.RED_FIRE, 2.0, 0.6, { alpha: 0.85, isAdditive: true, prng });
      canvas.drawCalligraphyStroke(spark, INK_COLORS.WHITE_JADE, 1.0, 0.3, { alpha: 0.9, isAdditive: true, prng });
    });
  },

  // 6. 마법 화살 (missile) : 비천하는 푸른 비전 유성과 혜성 비백
  icon_missile: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.5, 106);
    const prng = createPRNG(106);

    // 꼬리를 길게 늘어뜨리는 비천 궤적 3조
    const tails = [
      [[24, 104], [52, 76], [82, 46], [98, 30]],
      [[18, 98], [44, 78], [76, 50], [94, 34]],
      [[30, 110], [58, 82], [86, 54], [102, 38]]
    ];

    tails.forEach((tail, idx) => {
      const col = idx === 0 ? INK_COLORS.WHITE_JADE : INK_COLORS.BLUE_CYAN;
      const thick = idx === 0 ? 4.5 : 2.5;
      canvas.drawCalligraphyStroke(tail, col, thick, 1.0, { alpha: 0.85, isAdditive: true, feiBai: 0.4, prng });
    });

    // 혜성 탄두 코어
    canvas.drawGlow(96, 32, 22, INK_COLORS.BLUE_CYAN, 0.6);
    canvas.stampDisc(96, 32, 6.5, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(96, 32, 3.5, INK_COLORS.GOLD_BRIGHT, 0.95);
  },

  // 7. 산탄 총포 (shotgun) : 쌍열 승자총통과 폭발하는 흑연 탄환
  icon_shotgun: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_AMBER, 0.4, 107);
    const prng = createPRNG(107);

    // 육중한 대각선 쌍열 총신
    const barrel1 = [[24, 98], [68, 54]];
    const barrel2 = [[32, 106], [76, 62]];
    canvas.drawCalligraphyStroke(barrel1, INK_COLORS.INK_DEEP, 6.2, 5.8, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(barrel2, INK_COLORS.INK_DEEP, 6.2, 5.8, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(barrel1, INK_COLORS.WHITE_SILVER, 1.8, 1.6, { alpha: 0.7, isAdditive: true, prng });

    // 포구 단청 황동 링
    canvas.stampDisc(68, 54, 4.5, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.stampDisc(76, 62, 4.5, INK_COLORS.GOLD_ROYAL, 0.95);

    // 포구 전방으로 부채꼴 분사되는 산탄 화염 및 탄환
    canvas.drawGlow(84, 46, 26, INK_COLORS.GOLD_AMBER, 0.55);
    const pellets = [[88, 38], [98, 44], [92, 54], [106, 32], [104, 60]];
    pellets.forEach(pt => {
      canvas.stampDisc(pt[0], pt[1], 2.8, INK_COLORS.GOLD_BRIGHT, 0.95);
      canvas.stampDisc(pt[0], pt[1], 1.5, INK_COLORS.WHITE_JADE, 0.95);
    });
  },

  // 8. 성수 (holywater) : 정화의 백자 감로병과 솟구치는 성수
  icon_holywater: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 108);
    const prng = createPRNG(108);

    // 우아한 백자/감로병 몸체
    const bottleLeft = [[64, 46], [54, 52], [46, 72], [50, 92], [64, 96]];
    const bottleRight = [[64, 46], [74, 52], [82, 72], [78, 92], [64, 96]];
    canvas.drawCalligraphyStroke(bottleLeft, INK_COLORS.INK_DEEP, 5.0, 4.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke(bottleRight, INK_COLORS.INK_DEEP, 5.0, 4.5, { alpha: 0.95, prng });
    canvas.drawRadialWash(64, 74, 18, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_AZURE, 0.7, 0.2);

    // 병 중앙 단청 황금 띠
    canvas.drawCalligraphyStroke([[48, 74], [64, 76], [80, 74]], INK_COLORS.GOLD_ROYAL, 3.2, 3.2, { alpha: 0.95, prng });

    // 병 입구에서 솟구치는 성스러운 감로수 방울
    canvas.drawGlow(64, 38, 20, INK_COLORS.BLUE_CYAN, 0.6);
    canvas.stampDisc(64, 36, 5.5, INK_COLORS.WHITE_JADE, 0.98);
    canvas.stampDisc(64, 24, 3.8, INK_COLORS.BLUE_CYAN, 0.9);
    canvas.stampDisc(56, 28, 2.5, INK_COLORS.WHITE_JADE, 0.85);
    canvas.stampDisc(72, 28, 2.5, INK_COLORS.WHITE_JADE, 0.85);
  },

  // 9. 성역 (sanctuary) : 삼태극 음양과 8방 팔괘 결계진
  icon_sanctuary: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.5, 109);
    const prng = createPRNG(109);

    // 8방 괘선 결계 원환
    canvas.drawEnsoRim(CX, CY, 38, 3.5, INK_COLORS.GOLD_ROYAL, 0.3, 109);

    // 중심 수묵 음양 태극 (S커브 먹선)
    const sCurve = [[CX, CY - 20], [CX + 12, CY - 10], [CX, CY], [CX - 12, CY + 10], [CX, CY + 20]];
    canvas.drawCalligraphyStroke(sCurve, INK_COLORS.INK_DEEP, 5.0, 5.0, { alpha: 0.95, prng });
    canvas.stampDisc(CX, CY - 10, 4.0, INK_COLORS.INK_DEEP, 0.95);
    canvas.stampDisc(CX, CY + 10, 4.0, INK_COLORS.WHITE_JADE, 0.95);

    // 4방 팔괘 수묵 문양 바(bar)
    const bars = [
      [[CX - 8, 20], [CX + 8, 20]],
      [[CX - 8, 108], [CX + 8, 108]],
      [[20, CY - 8], [20, CY + 8]],
      [[108, CY - 8], [108, CY + 8]]
    ];
    bars.forEach(b => {
      canvas.drawCalligraphyStroke(b, INK_COLORS.GOLD_AMBER, 2.8, 2.8, { alpha: 0.9, prng });
    });
    canvas.drawGlow(CX, CY, 28, INK_COLORS.GOLD_ROYAL, 0.4);
  },

  // 10. 번개 반지 (lightning) : 황금 옥환과 작열하는 뇌전 갈필
  icon_lightning: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 110);
    const prng = createPRNG(110);

    // 황금 옥환 (반지 몸체)
    canvas.drawEnsoRim(CX, CY, 32, 4.8, INK_COLORS.GOLD_ROYAL, 0.25, 110);
    canvas.drawEnsoRim(CX, CY, 32, 1.8, INK_COLORS.GOLD_BRIGHT, 0.2, 111);

    // 반지를 꿰뚫는 지그재그 뇌전 (청백 플라즈마)
    const boltPts = [
      [CX + 12, 18],
      [CX - 6, 44],
      [CX + 14, 52],
      [CX - 14, 88],
      [CX + 2, 92],
      [CX - 10, 110]
    ];
    // 뇌전 먹선 림
    canvas.drawCalligraphyStroke(boltPts, INK_COLORS.INK_DEEP, 5.0, 3.0, { alpha: 0.95, prng });
    // 뇌전 중심 백열
    canvas.drawCalligraphyStroke(boltPts, INK_COLORS.WHITE_JADE, 2.4, 1.2, { alpha: 0.98, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(boltPts, INK_COLORS.BLUE_CYAN, 4.5, 2.2, { alpha: 0.6, isAdditive: true, prng });
    canvas.drawGlow(CX, CY, 30, INK_COLORS.BLUE_CYAN, 0.5);
  },

  // 11. 불 지팡이 (firewand) : 주작의 화염보주 지팡이
  icon_firewand: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.48, 111);
    const prng = createPRNG(111);

    // 고목 서예 지팡이대
    const staffPts = [[26, 112], [54, 84], [72, 66]];
    canvas.drawCalligraphyStroke(staffPts, INK_COLORS.INK_DEEP, 5.5, 4.2, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(staffPts, INK_COLORS.GOLD_AMBER, 1.8, 1.2, { alpha: 0.6, isAdditive: true, prng });

    // 지팡이 머리 삼지창 단청 금속관
    canvas.drawCalligraphyStroke([[64, 74], [74, 58], [88, 68]], INK_COLORS.GOLD_ROYAL, 4.0, 4.0, { alpha: 0.95, prng });

    // 타오르는 화염보주 (삼매진화)
    canvas.drawRadialWash(84, 46, 22, INK_COLORS.GOLD_BRIGHT, INK_COLORS.RED_CRIMSON, 0.9, 0.2);
    canvas.drawGlow(84, 46, 28, INK_COLORS.RED_FIRE, 0.65);

    // 솟구치는 불꽃 혀 3가닥
    const flames = [
      [[84, 46], [86, 28], [94, 18]],
      [[84, 46], [74, 32], [70, 22]],
      [[84, 46], [96, 36], [108, 30]]
    ];
    flames.forEach(f => {
      canvas.drawCalligraphyStroke(f, INK_COLORS.GOLD_BRIGHT, 3.5, 0.8, { alpha: 0.95, isAdditive: true, prng });
    });
  },

  // 12. 독비수 (poisondagger) : 서슬 퍼런 맹독 곡도와 비취 독방울
  icon_poisondagger: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_VENOM, 0.45, 112);
    const prng = createPRNG(112);

    // 날렵한 쿠크리 곡도 칼날
    const kukriPts = [[32, 96], [48, 80], [68, 66], [90, 56], [102, 38], [94, 34], [74, 52], [52, 74], [32, 96]];
    canvas.drawCalligraphyStroke(kukriPts, INK_COLORS.INK_DEEP, 5.0, 3.5, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke([[48, 80], [68, 66], [90, 56], [102, 38]], INK_COLORS.GREEN_JADE, 2.2, 1.0, { alpha: 0.9, isAdditive: true, prng });

    // 칼날에 맺혀 떨어지는 맹독 방울
    canvas.stampDisc(86, 68, 5.2, INK_COLORS.GREEN_VENOM, 0.95);
    canvas.stampDisc(86, 68, 2.6, INK_COLORS.WHITE_JADE, 0.95);
    canvas.stampDisc(92, 82, 3.5, INK_COLORS.GREEN_VENOM, 0.85);
    canvas.drawGlow(86, 68, 22, INK_COLORS.GREEN_VENOM, 0.5);

    // 칼자루 짙은 묵선
    canvas.drawCalligraphyStroke([[32, 96], [20, 108]], INK_COLORS.INK_DEEP, 5.5, 4.5, { alpha: 0.98, prng });
  },

  // 13. 빙결 보주 (frostorb) : 만년설화 6각 얼음 결정과 냉기 묵선
  icon_frostorb: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_AZURE, 0.45, 113);
    const prng = createPRNG(113);

    // 수정구 본체 (차가운 백은 워시)
    canvas.drawRadialWash(CX, CY, 32, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_AZURE, 0.8, 0.2);
    canvas.drawEnsoRim(CX, CY, 32, 3.5, INK_COLORS.WHITE_SILVER, 0.2, 113);

    // 6방향 설화 결정 붓터치
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x2 = CX + Math.cos(angle) * 26;
      const y2 = CY + Math.sin(angle) * 26;
      canvas.drawCalligraphyStroke([[CX, CY], [x2, y2]], INK_COLORS.WHITE_JADE, 2.2, 0.8, { alpha: 0.95, isAdditive: true, prng });

      // 가지 결정
      const branchAngle1 = angle + 0.45;
      const branchAngle2 = angle - 0.45;
      const bx = CX + Math.cos(angle) * 16;
      const by = CY + Math.sin(angle) * 16;
      canvas.drawCalligraphyStroke([[bx, by], [bx + Math.cos(branchAngle1) * 8, by + Math.sin(branchAngle1) * 8]], INK_COLORS.WHITE_SILVER, 1.4, 0.5, { alpha: 0.9, isAdditive: true, prng });
      canvas.drawCalligraphyStroke([[bx, by], [bx + Math.cos(branchAngle2) * 8, by + Math.sin(branchAngle2) * 8]], INK_COLORS.WHITE_SILVER, 1.4, 0.5, { alpha: 0.9, isAdditive: true, prng });
    }
    canvas.drawGlow(CX, CY, 32, INK_COLORS.BLUE_CYAN, 0.55);
  },

  // 14. 바람 활 (windbow) : 바람 깃털을 머금은 우아한 각궁
  icon_windbow: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_JADE, 0.42, 114);
    const prng = createPRNG(114);

    // 휘어진 수묵 활대 (C커브)
    const bowPts = [
      [36, 24],
      [58, 36],
      [76, 64],
      [58, 92],
      [36, 104]
    ];
    canvas.drawCalligraphyStroke(bowPts, INK_COLORS.INK_DEEP, 6.0, 3.5, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(bowPts, INK_COLORS.GREEN_JADE, 2.0, 1.0, { alpha: 0.8, isAdditive: true, prng });

    // 팽팽한 활시위 (백은 선)
    canvas.drawCalligraphyStroke([[36, 24], [44, 64], [36, 104]], INK_COLORS.WHITE_JADE, 1.2, 1.2, { alpha: 0.85, isAdditive: true, prng });

    // 매겨진 바람 화살
    const arrowPts = [[32, 64], [64, 64], [96, 64], [104, 64]];
    canvas.drawCalligraphyStroke(arrowPts, INK_COLORS.GOLD_ROYAL, 2.5, 1.5, { alpha: 0.95, isAdditive: true, prng });
    // 화살촉
    canvas.drawCalligraphyStroke([[94, 58], [106, 64], [94, 70]], INK_COLORS.WHITE_JADE, 2.4, 1.0, { alpha: 0.98, isAdditive: true, prng });
    canvas.drawGlow(104, 64, 18, INK_COLORS.GREEN_JADE, 0.5);
  },

  // 추가 무기 4종 (flamepillar, chakram, holycross, shadoworb)
  icon_flamepillar: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.5, 115);
    const prng = createPRNG(115);
    const pillarLeft = [[50, 110], [54, 70], [48, 40], [64, 16]];
    const pillarRight = [[78, 110], [74, 70], [80, 40], [64, 16]];
    canvas.drawCalligraphyStroke(pillarLeft, INK_COLORS.RED_FIRE, 6.0, 2.0, { alpha: 0.95, isAdditive: true, feiBai: 0.25, prng });
    canvas.drawCalligraphyStroke(pillarRight, INK_COLORS.GOLD_BRIGHT, 6.0, 2.0, { alpha: 0.95, isAdditive: true, feiBai: 0.25, prng });
    canvas.drawRadialWash(CX, 64, 28, INK_COLORS.GOLD_ROYAL, INK_COLORS.RED_CRIMSON, 0.8, 0.1);
    canvas.drawGlow(CX, 54, 32, INK_COLORS.RED_FIRE, 0.65);
  },

  icon_chakram: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.WHITE_SILVER, 0.45, 116);
    const prng = createPRNG(116);
    canvas.drawEnsoRim(CX, CY, 36, 5.5, INK_COLORS.INK_DEEP, 0.15, 116);
    canvas.drawEnsoRim(CX, CY, 36, 2.4, INK_COLORS.WHITE_JADE, 0.2, 117);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = CX + Math.cos(angle) * 36;
      const y = CY + Math.sin(angle) * 36;
      canvas.stampDisc(x, y, 5.0, INK_COLORS.GOLD_ROYAL, 0.95);
      canvas.stampDisc(x, y, 2.5, INK_COLORS.WHITE_JADE, 0.95);
    }
    canvas.drawGlow(CX, CY, 36, INK_COLORS.BLUE_CYAN, 0.4);
  },

  icon_holycross: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.5, 117);
    const prng = createPRNG(117);
    const vert = [[CX, 20], [CX, 108]];
    const horiz = [[28, 48], [100, 48]];
    canvas.drawCalligraphyStroke(vert, INK_COLORS.INK_DEEP, 7.5, 7.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(horiz, INK_COLORS.INK_DEEP, 7.5, 7.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(vert, INK_COLORS.GOLD_BRIGHT, 2.8, 2.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(horiz, INK_COLORS.GOLD_BRIGHT, 2.8, 2.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawGlow(CX, 48, 30, INK_COLORS.GOLD_ROYAL, 0.6);
  },

  icon_shadoworb: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.PURPLE_ARCANE, 0.5, 118);
    const prng = createPRNG(118);
    canvas.drawRadialWash(CX, CY, 32, INK_COLORS.PURPLE_VOID, INK_COLORS.INK_DEEP, 0.95, 0.4);
    canvas.drawEnsoRim(CX, CY, 30, 4.2, INK_COLORS.PURPLE_ARCANE, 0.4, 118);
    canvas.drawGlow(CX, CY, 34, INK_COLORS.PURPLE_ARCANE, 0.6);
    // 중심 붉은 악마 안광
    canvas.stampDisc(CX, CY, 6.5, INK_COLORS.RED_CRIMSON, 0.95);
    canvas.stampDisc(CX, CY, 3.2, INK_COLORS.GOLD_BRIGHT, 0.95);
  }
};

// ================= 15종 패시브 룬 128x128 수묵 엠블럼 렌더러 =================

const PASSIVES_INK = {
  // 1. 방어력 (armor) : 현무의 금강 철갑 흉갑
  icon_armor: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_AZURE, 0.4, 201);
    const prng = createPRNG(201);

    // 웅장한 방패/흉갑 윤곽선
    const shieldPts = [
      [36, 32], [92, 32],
      [96, 68], [64, 102], [32, 68],
      [36, 32]
    ];
    canvas.drawCalligraphyStroke(shieldPts, INK_COLORS.INK_DEEP, 6.0, 5.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(shieldPts, INK_COLORS.WHITE_SILVER, 2.0, 1.5, { alpha: 0.85, isAdditive: true, prng });
    canvas.drawRadialWash(64, 60, 24, INK_COLORS.BLUE_AZURE, INK_COLORS.INK_DEEP, 0.6, 0.1);

    // 중심 단청 황금 문양
    canvas.stampDisc(64, 58, 6.0, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.stampDisc(64, 58, 2.8, INK_COLORS.WHITE_JADE, 0.95);
    canvas.drawGlow(64, 58, 22, INK_COLORS.BLUE_CYAN, 0.45);
  },

  // 2. 이동속도 (speed) : 축지법 바람 장화와 질풍의 잔상 비백
  icon_speed: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 202);
    const prng = createPRNG(202);

    // 축지법 장화 실루엣
    const bootPts = [
      [42, 36], [66, 36],
      [66, 68], [94, 76], [98, 90], [38, 90],
      [42, 36]
    ];
    canvas.drawCalligraphyStroke(bootPts, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(bootPts, INK_COLORS.WHITE_JADE, 1.8, 1.2, { alpha: 0.9, isAdditive: true, prng });

    // 뒤로 뻗어나가는 3조의 질풍 비백 선
    canvas.drawCalligraphyStroke([[34, 46], [16, 48]], INK_COLORS.BLUE_CYAN, 3.0, 0.6, { alpha: 0.8, isAdditive: true, feiBai: 0.5, prng });
    canvas.drawCalligraphyStroke([[30, 64], [12, 66]], INK_COLORS.BLUE_CYAN, 3.5, 0.8, { alpha: 0.85, isAdditive: true, feiBai: 0.5, prng });
    canvas.drawCalligraphyStroke([[32, 82], [14, 84]], INK_COLORS.WHITE_SILVER, 3.0, 0.6, { alpha: 0.75, isAdditive: true, feiBai: 0.5, prng });
    canvas.drawGlow(70, 70, 24, INK_COLORS.BLUE_CYAN, 0.45);
  },

  // 3. 공격력 (atk) : 파천의 검기와 타오르는 무신의 검
  icon_atk: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_CRIMSON, 0.5, 203);
    const prng = createPRNG(203);

    // 수직으로 치솟는 거대한 진홍 검기
    const slash = [[64, 108], [64, 56], [64, 18]];
    canvas.drawCalligraphyStroke(slash, INK_COLORS.INK_DEEP, 8.5, 3.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(slash, INK_COLORS.RED_FIRE, 4.5, 1.6, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(slash, INK_COLORS.GOLD_BRIGHT, 2.0, 0.8, { alpha: 0.98, isAdditive: true, prng });

    // 양옆으로 퍼지는 파천의 충격파
    canvas.drawCalligraphyStroke([[42, 64], [64, 42], [86, 64]], INK_COLORS.RED_CRIMSON, 3.2, 1.0, { alpha: 0.8, isAdditive: true, prng });
    canvas.drawGlow(64, 48, 28, INK_COLORS.RED_FIRE, 0.6);
  },

  // 4. 치유 (heal) : 만개한 청룡의 옥빛 연꽃
  icon_heal: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_JADE, 0.45, 204);
    const prng = createPRNG(204);

    // 중앙 연꽃 봉오리
    canvas.drawRadialWash(CX, CY, 22, INK_COLORS.WHITE_JADE, INK_COLORS.GREEN_JADE, 0.8, 0.2);

    // 겹겹이 피어난 5장의 서예 연꽃잎
    const petals = [
      [[CX, 88], [CX, 54]],
      [[CX - 8, 86], [CX - 28, 62], [CX - 12, 48]],
      [[CX + 8, 86], [CX + 28, 62], [CX + 12, 48]],
      [[CX - 18, 82], [CX - 36, 74]],
      [[CX + 18, 82], [CX + 36, 74]]
    ];

    petals.forEach(p => {
      canvas.drawCalligraphyStroke(p, INK_COLORS.INK_DEEP, 4.5, 2.0, { alpha: 0.95, prng });
      canvas.drawCalligraphyStroke(p, INK_COLORS.GREEN_JADE, 2.0, 0.8, { alpha: 0.9, isAdditive: true, prng });
    });

    // 중앙 영약 이슬방울
    canvas.stampDisc(CX, 48, 5.0, INK_COLORS.WHITE_JADE, 0.98);
    canvas.drawGlow(CX, 54, 24, INK_COLORS.GREEN_JADE, 0.55);
  },

  // 5. 재생 (regen) : 음양 삼태극 심장
  icon_regen: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.45, 205);
    const prng = createPRNG(205);

    // 심장 윤곽 붓터치
    const heartLeft = [[64, 88], [34, 62], [38, 38], [64, 52]];
    const heartRight = [[64, 88], [94, 62], [90, 38], [64, 52]];
    canvas.drawCalligraphyStroke(heartLeft, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(heartRight, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawRadialWash(64, 62, 22, INK_COLORS.RED_FIRE, INK_COLORS.RED_DEEP, 0.75, 0.15);

    // 심장 중심 삼태극 소용돌이
    canvas.drawCalligraphyStroke([[64, 52], [54, 62], [64, 72]], INK_COLORS.GOLD_BRIGHT, 2.5, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawGlow(64, 60, 26, INK_COLORS.RED_FIRE, 0.55);
  },

  // 6. 체력 (hp) : 십장생의 진홍 영지버섯
  icon_hp: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_DEEP, 0.45, 206);
    const prng = createPRNG(206);

    // 영지버섯 갓 (구름 모양 수묵 곡선)
    const capPts = [
      [28, 58], [44, 40], [64, 34], [84, 40], [100, 58],
      [84, 66], [64, 60], [44, 66], [28, 58]
    ];
    canvas.drawCalligraphyStroke(capPts, INK_COLORS.INK_DEEP, 6.0, 4.5, { alpha: 0.98, prng });
    canvas.drawRadialWash(64, 48, 26, INK_COLORS.RED_FIRE, INK_COLORS.RED_DEEP, 0.85, 0.2);

    // 버섯 기둥 (단단한 묵선)
    const stemPts = [[56, 62], [54, 88], [64, 94], [74, 88], [72, 62]];
    canvas.drawCalligraphyStroke(stemPts, INK_COLORS.INK_DEEP, 5.0, 4.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[64, 64], [64, 90]], INK_COLORS.GOLD_AMBER, 2.0, 1.5, { alpha: 0.7, isAdditive: true, prng });
    canvas.drawGlow(64, 50, 26, INK_COLORS.RED_FIRE, 0.5);
  },

  // 7. 공격속도 (global_speed) : 섬전 쾌도의 쾌검 섬광
  icon_global_speed: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.45, 207);
    const prng = createPRNG(207);

    // 번개처럼 대각선을 가르는 3조의 초고속 쾌검 참격선
    const slashes = [
      [[24, 104], [64, 64], [104, 24]],
      [[36, 108], [76, 68], [112, 32]],
      [[18, 96], [54, 60], [94, 20]]
    ];

    slashes.forEach((s, idx) => {
      const col = idx === 0 ? INK_COLORS.WHITE_JADE : INK_COLORS.GOLD_ROYAL;
      const thick = idx === 0 ? 5.5 : 2.8;
      canvas.drawCalligraphyStroke(s, INK_COLORS.INK_DEEP, thick + 2.5, 2.0, { alpha: 0.95, feiBai: 0.3, prng });
      canvas.drawCalligraphyStroke(s, col, thick, 1.0, { alpha: 0.95, isAdditive: true, prng });
    });
    canvas.drawGlow(64, 64, 28, INK_COLORS.GOLD_BRIGHT, 0.6);
  },

  // 8. 탄속 (proj_speed) : 꿰뚫는 비상 화살촉과 비백 충격파
  icon_proj_speed: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 208);
    const prng = createPRNG(208);

    // 화살촉 중심 돌파선
    const arrowShaft = [[20, 108], [60, 68], [94, 34]];
    canvas.drawCalligraphyStroke(arrowShaft, INK_COLORS.INK_DEEP, 5.0, 2.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(arrowShaft, INK_COLORS.WHITE_JADE, 2.2, 0.8, { alpha: 0.95, isAdditive: true, prng });

    // 화살촉 양날
    const tipLeft = [[76, 52], [96, 32]];
    const tipRight = [[64, 40], [96, 32]];
    canvas.drawCalligraphyStroke(tipLeft, INK_COLORS.BLUE_CYAN, 3.5, 1.2, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(tipRight, INK_COLORS.BLUE_CYAN, 3.5, 1.2, { alpha: 0.95, isAdditive: true, prng });

    // 음속 돌파 충격파 원호 2조
    canvas.drawCalligraphyStroke([[72, 22], [98, 48]], INK_COLORS.WHITE_SILVER, 2.2, 0.6, { alpha: 0.75, isAdditive: true, feiBai: 0.4, prng });
    canvas.drawCalligraphyStroke([[58, 36], [84, 62]], INK_COLORS.BLUE_CYAN, 2.2, 0.6, { alpha: 0.75, isAdditive: true, feiBai: 0.4, prng });
    canvas.drawGlow(94, 34, 22, INK_COLORS.BLUE_CYAN, 0.6);
  },

  // 9. 투사체 수 (proj_count) : 만천화우(滿天花雨) 삼연 비도
  icon_proj_count: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.45, 209);
    const prng = createPRNG(209);

    // 부채꼴로 전개된 3자루의 비도
    const daggers = [
      [[38, 96], [48, 64], [56, 34]], // 좌측 비도
      [[64, 100], [64, 60], [64, 26]], // 중앙 비도
      [[90, 96], [80, 64], [72, 34]]  // 우측 비도
    ];

    daggers.forEach((d, idx) => {
      canvas.drawCalligraphyStroke(d, INK_COLORS.INK_DEEP, 4.5, 1.8, { alpha: 0.98, feiBai: 0.15, prng });
      canvas.drawCalligraphyStroke(d, INK_COLORS.GOLD_BRIGHT, 1.8, 0.6, { alpha: 0.9, isAdditive: true, prng });
      canvas.stampDisc(d[2][0], d[2][1], 2.8, INK_COLORS.WHITE_JADE, 0.95);
    });
    canvas.drawGlow(64, 38, 26, INK_COLORS.GOLD_ROYAL, 0.5);
  },

  // 10. 행운 (clover) : 길상의 사엽초와 황금 여의보주
  icon_clover: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_JADE, 0.45, 210);
    const prng = createPRNG(210);

    // 4개의 하트 잎사귀 (상하좌우)
    const centers = [
      [CX, CY - 18],
      [CX + 18, CY],
      [CX, CY + 18],
      [CX - 18, CY]
    ];

    centers.forEach(c => {
      canvas.drawRadialWash(c[0], c[1], 14, INK_COLORS.GREEN_JADE, INK_COLORS.GREEN_DARK, 0.85, 0.2);
      canvas.drawEnsoRim(c[0], c[1], 10, 2.2, INK_COLORS.INK_DEEP, 0.2, 210);
    });

    // 중앙 여의보주 황금빛 코어
    canvas.stampDisc(CX, CY, 5.5, INK_COLORS.GOLD_ROYAL, 0.95);
    canvas.stampDisc(CX, CY, 2.8, INK_COLORS.WHITE_JADE, 0.95);
    canvas.drawGlow(CX, CY, 24, INK_COLORS.GOLD_ROYAL, 0.6);
  },

  // 11. 경험치 (crown) : 제왕의 단청 금관
  icon_crown: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.5, 211);
    const prng = createPRNG(211);

    // 신라 금관 삼지창 나뭇가지 실루엣
    const crownPts = [
      [28, 80], [100, 80],
      [100, 68], [90, 44], [80, 64],
      [64, 26], [48, 64], [38, 44], [28, 68],
      [28, 80]
    ];
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.INK_DEEP, 5.5, 4.5, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(crownPts, INK_COLORS.GOLD_ROYAL, 2.4, 1.8, { alpha: 0.95, isAdditive: true, prng });
    canvas.drawRadialWash(64, 60, 24, INK_COLORS.GOLD_BRIGHT, INK_COLORS.GOLD_AMBER, 0.75, 0.15);

    // 비취 곡옥 (에메랄드 열매 3점)
    const jewels = [[38, 44], [64, 26], [90, 44]];
    jewels.forEach(j => {
      canvas.stampDisc(j[0], j[1], 4.2, INK_COLORS.GREEN_JADE, 0.95);
      canvas.stampDisc(j[0], j[1], 2.0, INK_COLORS.WHITE_JADE, 0.95);
    });
    canvas.drawGlow(64, 48, 28, INK_COLORS.GOLD_ROYAL, 0.6);
  },

  // 12. 흡혈 (vampire) : 혈마의 박쥐 날개와 선혈 루비
  icon_vampire: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_CRIMSON, 0.48, 212);
    const prng = createPRNG(212);

    // 서예 박쥐 날개 (좌/우)
    const leftWing = [[64, 68], [44, 44], [22, 52], [32, 74], [48, 80], [64, 68]];
    const rightWing = [[64, 68], [84, 44], [106, 52], [96, 74], [80, 80], [64, 68]];
    canvas.drawCalligraphyStroke(leftWing, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.2, prng });
    canvas.drawCalligraphyStroke(rightWing, INK_COLORS.INK_DEEP, 5.5, 4.0, { alpha: 0.98, feiBai: 0.2, prng });

    // 중앙 선혈 마름모 루비
    const diamond = [[64, 48], [76, 62], [64, 76], [52, 62], [64, 48]];
    canvas.drawCalligraphyStroke(diamond, INK_COLORS.RED_FIRE, 3.2, 2.5, { alpha: 0.98, isAdditive: true, prng });
    canvas.drawRadialWash(64, 62, 12, INK_COLORS.WHITE_JADE, INK_COLORS.RED_CRIMSON, 0.9, 0.2);
    canvas.drawGlow(64, 62, 26, INK_COLORS.RED_FIRE, 0.6);
  },

  // 13. 보호막 (shield) : 금강불괴 수호 방패와 육각 결계
  icon_shield: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 213);
    const prng = createPRNG(213);

    // 육각형 결계 림
    const hexPts = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      hexPts.push([CX + Math.cos(angle) * 36, CY + Math.sin(angle) * 36]);
    }
    canvas.drawCalligraphyStroke(hexPts, INK_COLORS.INK_DEEP, 5.5, 4.5, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke(hexPts, INK_COLORS.BLUE_CYAN, 2.2, 1.5, { alpha: 0.9, isAdditive: true, prng });

    // 방패 코어 및 황금 십자
    canvas.drawRadialWash(CX, CY, 22, INK_COLORS.WHITE_JADE, INK_COLORS.BLUE_AZURE, 0.75, 0.15);
    canvas.drawCalligraphyStroke([[CX, 44], [CX, 84]], INK_COLORS.GOLD_ROYAL, 3.5, 3.5, { alpha: 0.95, prng });
    canvas.drawCalligraphyStroke([[44, CY], [84, CY]], INK_COLORS.GOLD_ROYAL, 3.5, 3.5, { alpha: 0.95, prng });
    canvas.drawGlow(CX, CY, 30, INK_COLORS.BLUE_CYAN, 0.55);
  },

  // 14. 치명타 피해 (crit_dmg) : 일격필살 파쇄 안광과 진홍 파열선
  icon_crit_dmg: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.5, 214);
    const prng = createPRNG(214);

    // 번뜩이는 악귀 안광 타원
    canvas.drawRadialWash(CX, CY, 20, INK_COLORS.GOLD_BRIGHT, INK_COLORS.RED_CRIMSON, 0.95, 0.2);

    // 사방으로 찢어지는 4조의 파열 서예 참격
    const bursts = [
      [[CX - 8, CY - 8], [24, 24]],
      [[CX + 8, CY - 8], [104, 24]],
      [[CX - 8, CY + 8], [24, 104]],
      [[CX + 8, CY + 8], [104, 104]]
    ];

    bursts.forEach(b => {
      canvas.drawCalligraphyStroke(b, INK_COLORS.INK_DEEP, 5.5, 1.5, { alpha: 0.98, feiBai: 0.35, prng });
      canvas.drawCalligraphyStroke(b, INK_COLORS.RED_FIRE, 2.6, 0.6, { alpha: 0.95, isAdditive: true, prng });
    });
    canvas.stampDisc(CX, CY, 4.5, INK_COLORS.WHITE_JADE, 0.98);
    canvas.drawGlow(CX, CY, 28, INK_COLORS.RED_FIRE, 0.65);
  },

  // 15. 반사 가시 (thorns) : 백호의 금강 가시 덤불
  icon_thorns: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_DARK, 0.42, 215);
    const prng = createPRNG(215);

    // 8방향 솟구치는 가시 덤불
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = CX + Math.cos(angle) * 16;
      const y1 = CY + Math.sin(angle) * 16;
      const x2 = CX + Math.cos(angle) * 44;
      const y2 = CY + Math.sin(angle) * 44;
      canvas.drawCalligraphyStroke([[x1, y1], [x2, y2]], INK_COLORS.INK_DEEP, 5.5, 1.0, { alpha: 0.98, feiBai: 0.2, prng });
      canvas.drawCalligraphyStroke([[x1, y1], [x2, y2]], INK_COLORS.WHITE_SILVER, 2.0, 0.5, { alpha: 0.9, isAdditive: true, prng });
    }

    // 중앙 견고한 결속 고리
    canvas.drawEnsoRim(CX, CY, 18, 3.8, INK_COLORS.GOLD_AMBER, 0.2, 215);
    canvas.drawGlow(CX, CY, 24, INK_COLORS.GREEN_JADE, 0.4);
  },

  // 추가 패시브: 확장의 룬 (area)
  icon_area: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.45, 216);
    const prng = createPRNG(216);
    const arrows = [
      [[CX, CY - 10], [CX, 22], [CX - 8, 32]],
      [[CX + 10, CY], [106, CY], [96, CY - 8]],
      [[CX, CY + 10], [CX, 106], [CX + 8, 96]],
      [[CX - 10, CY], [22, CY], [32, CY + 8]]
    ];
    arrows.forEach(a => {
      canvas.drawCalligraphyStroke(a, INK_COLORS.INK_DEEP, 4.5, 2.0, { alpha: 0.98, prng });
      canvas.drawCalligraphyStroke(a, INK_COLORS.BLUE_CYAN, 2.0, 1.0, { alpha: 0.9, isAdditive: true, prng });
    });
    canvas.drawEnsoRim(CX, CY, 26, 3.0, INK_COLORS.WHITE_JADE, 0.3, 216);
    canvas.drawGlow(CX, CY, 28, INK_COLORS.BLUE_CYAN, 0.5);
  },

  // 17. 자력의 부적 (magnet) : 드랍 아이템 자석 형태를 계승한 단청 수묵 말굽자석
  icon_magnet: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_AZURE, 0.45, 217);
    const prng = createPRNG(217);

    // U자형 말굽자석 궤적
    // 좌측(N극 - 진홍): (36, 92) -> (36, 52) -> (64, 28)
    const leftArm = [[36, 92], [36, 54], [50, 32], [64, 28]];
    // 우측(S극 - 감청): (92, 92) -> (92, 52) -> (64, 28)
    const rightArm = [[92, 92], [92, 54], [78, 32], [64, 28]];

    // 1) 굵은 농묵 붓선 바탕
    canvas.drawCalligraphyStroke(leftArm, INK_COLORS.INK_DEEP, 18.0, 14.0, { alpha: 0.98, feiBai: 0.15, prng });
    canvas.drawCalligraphyStroke(rightArm, INK_COLORS.INK_DEEP, 18.0, 14.0, { alpha: 0.98, feiBai: 0.15, prng });

    // 2) 좌측 N극 선혈 단청 진홍 채움
    canvas.drawCalligraphyStroke([[36, 86], [36, 54], [52, 34], [64, 30]], INK_COLORS.RED_CRIMSON, 12.0, 9.0, { alpha: 0.95, isAdditive: true, prng });
    // 3) 우측 S극 감청 단청 푸른빛 채움
    canvas.drawCalligraphyStroke([[92, 86], [92, 54], [76, 34], [64, 30]], INK_COLORS.BLUE_AZURE, 12.0, 9.0, { alpha: 0.95, isAdditive: true, prng });

    // 4) 양 끝단 은백/옥백 놋쇠 팁 (수묵 하이라이트)
    canvas.drawCalligraphyStroke([[36, 92], [36, 80]], INK_COLORS.WHITE_JADE, 14.0, 14.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[92, 92], [92, 80]], INK_COLORS.WHITE_JADE, 14.0, 14.0, { alpha: 0.98, prng });
    canvas.drawCalligraphyStroke([[36, 92], [36, 84]], INK_COLORS.WHITE_SILVER, 8.0, 8.0, { isAdditive: true });
    canvas.drawCalligraphyStroke([[92, 92], [92, 84]], INK_COLORS.WHITE_SILVER, 8.0, 8.0, { isAdditive: true });

    // 5) 양 끝단에서 방출되는 반원형 자기력 파동 호 (진홍/청안 림)
    const arcLeft1 = [[24, 98], [36, 108], [48, 98]];
    const arcLeft2 = [[18, 102], [36, 118], [54, 102]];
    const arcRight1 = [[80, 98], [92, 108], [104, 98]];
    const arcRight2 = [[74, 102], [92, 118], [110, 102]];

    canvas.drawCalligraphyStroke(arcLeft1, INK_COLORS.RED_FIRE, 3.2, 1.2, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(arcLeft2, INK_COLORS.GOLD_BRIGHT, 2.2, 0.8, { alpha: 0.7, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(arcRight1, INK_COLORS.BLUE_CYAN, 3.2, 1.2, { alpha: 0.9, isAdditive: true, prng });
    canvas.drawCalligraphyStroke(arcRight2, INK_COLORS.WHITE_SILVER, 2.2, 0.8, { alpha: 0.7, isAdditive: true, prng });

    // 6) 외곽 원호 비백 림 및 자기력 코어 글로우
    canvas.drawEnsoRim(CX, CY, 42, 4.0, INK_COLORS.WHITE_SILVER, 0.25, 217);
    canvas.drawGlow(36, 90, 18, INK_COLORS.RED_FIRE, 0.6);
    canvas.drawGlow(92, 90, 18, INK_COLORS.BLUE_CYAN, 0.6);
  }
};

// ================= 진화 무기 및 특수 엠블럼 렌더러 (14종 + 알파) =================
const EVOLVED_INK = {
  icon_heavenlysanctuary: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.55, 301);
    canvas.drawEnsoRim(CX, CY, 42, 4.5, INK_COLORS.GOLD_BRIGHT, 0.2, 301);
    canvas.drawEnsoRim(CX, CY, 24, 3.5, INK_COLORS.WHITE_JADE, 0.1, 302);
    canvas.drawCalligraphyStroke([[CX, 16], [CX, 112]], INK_COLORS.GOLD_BRIGHT, 3.2, 3.2, { isAdditive: true });
    canvas.drawCalligraphyStroke([[16, CY], [112, CY]], INK_COLORS.GOLD_BRIGHT, 3.2, 3.2, { isAdditive: true });
    canvas.drawGlow(CX, CY, 38, INK_COLORS.GOLD_ROYAL, 0.7);
  },

  icon_morningstartempest: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.WHITE_SILVER, 0.45, 302);
    canvas.drawEnsoRim(CX, CY, 36, 4.5, INK_COLORS.INK_DEEP, 0.3, 302);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const x = CX + Math.cos(angle) * 36;
      const y = CY + Math.sin(angle) * 36;
      canvas.stampDisc(x, y, 7.0, INK_COLORS.INK_DEEP, 0.98);
      canvas.stampDisc(x, y, 4.0, INK_COLORS.GOLD_ROYAL, 0.95);
    }
    canvas.drawGlow(CX, CY, 32, INK_COLORS.GOLD_BRIGHT, 0.5);
  },

  icon_apocalypsecomet: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.55, 303);
    canvas.drawRadialWash(CX, CY, 30, INK_COLORS.GOLD_BRIGHT, INK_COLORS.RED_CRIMSON, 0.95, 0.2);
    canvas.drawEnsoRim(CX, CY, 40, 5.5, INK_COLORS.RED_CRIMSON, 0.4, 303);
    canvas.drawGlow(CX, CY, 36, INK_COLORS.RED_FIRE, 0.7);
  },

  icon_bladestorm: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.5, 304);
    canvas.drawCalligraphyStroke([[20, 20], [108, 108]], INK_COLORS.WHITE_JADE, 4.5, 4.5, { isAdditive: true });
    canvas.drawCalligraphyStroke([[108, 20], [20, 108]], INK_COLORS.BLUE_CYAN, 4.5, 4.5, { isAdditive: true });
    canvas.drawEnsoRim(CX, CY, 36, 4.0, INK_COLORS.INK_DEEP, 0.4, 304);
    canvas.drawGlow(CX, CY, 32, INK_COLORS.BLUE_CYAN, 0.6);
  },

  icon_teslashotgun: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.5, 305);
    canvas.drawEnsoRim(CX, CY, 36, 4.5, INK_COLORS.GOLD_ROYAL, 0.25, 305);
    canvas.drawCalligraphyStroke([[32, 96], [96, 32]], INK_COLORS.WHITE_JADE, 5.0, 5.0, { isAdditive: true });
    canvas.drawGlow(CX, CY, 34, INK_COLORS.BLUE_CYAN, 0.65);
  },

  icon_venomblizzard: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_JADE, 0.5, 306);
    canvas.drawEnsoRim(CX, CY, 36, 4.5, INK_COLORS.BLUE_CYAN, 0.3, 306);
    canvas.drawRadialWash(CX, CY, 26, INK_COLORS.GREEN_VENOM, INK_COLORS.BLUE_AZURE, 0.8, 0.2);
    canvas.drawGlow(CX, CY, 32, INK_COLORS.GREEN_VENOM, 0.6);
  },

  icon_thunderblade: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.5, 307);
    canvas.drawCalligraphyStroke([[24, 104], [64, 64], [104, 24]], INK_COLORS.WHITE_JADE, 6.0, 2.0, { isAdditive: true });
    canvas.drawCalligraphyStroke([[34, 100], [54, 76], [74, 52], [94, 28]], INK_COLORS.BLUE_CYAN, 3.0, 1.0, { isAdditive: true });
    canvas.drawGlow(64, 64, 32, INK_COLORS.GOLD_ROYAL, 0.6);
  },

  icon_fireaxe: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.5, 308);
    WEAPONS_INK.icon_axe(canvas);
    canvas.drawGlow(CX, CY, 34, INK_COLORS.RED_FIRE, 0.6);
  },

  icon_frostwhip: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.BLUE_CYAN, 0.5, 309);
    WEAPONS_INK.icon_whip(canvas);
    canvas.drawGlow(CX, CY, 34, INK_COLORS.BLUE_AZURE, 0.6);
  },

  icon_scattershuriken: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.WHITE_SILVER, 0.45, 310);
    WEAPONS_INK.icon_shuriken(canvas);
    canvas.drawEnsoRim(CX, CY, 42, 3.0, INK_COLORS.GOLD_ROYAL, 0.3, 310);
  },

  icon_holyarrow: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.55, 311);
    WEAPONS_INK.icon_windbow(canvas);
    canvas.drawGlow(64, 64, 34, INK_COLORS.GOLD_BRIGHT, 0.6);
  },

  icon_plague: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.PURPLE_ARCANE, 0.5, 312);
    canvas.drawRadialWash(CX, CY, 28, INK_COLORS.GREEN_VENOM, INK_COLORS.PURPLE_SHADOW, 0.85, 0.2);
    canvas.drawEnsoRim(CX, CY, 36, 4.5, INK_COLORS.PURPLE_ARCANE, 0.4, 312);
    canvas.drawGlow(CX, CY, 32, INK_COLORS.GREEN_VENOM, 0.55);
  },

  icon_cyclonebow: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GREEN_JADE, 0.5, 313);
    WEAPONS_INK.icon_windbow(canvas);
    canvas.drawEnsoRim(CX, CY, 40, 4.0, INK_COLORS.BLUE_CYAN, 0.5, 313);
  },

  icon_eclipsespiral: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.PURPLE_VOID, 0.55, 314);
    canvas.drawEnsoRim(CX, CY, 38, 5.0, INK_COLORS.GOLD_ROYAL, 0.35, 314);
    canvas.drawEnsoRim(CX, CY, 24, 4.0, INK_COLORS.PURPLE_ARCANE, 0.35, 315);
    canvas.drawGlow(CX, CY, 34, INK_COLORS.GOLD_ROYAL, 0.6);
  },

  // 추가 진화 3종
  icon_infernocataclysm: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.RED_FIRE, 0.6, 315);
    WEAPONS_INK.icon_flamepillar(canvas);
    canvas.drawGlow(CX, CY, 38, INK_COLORS.RED_FIRE, 0.7);
  },

  icon_shadowvortex: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.PURPLE_ARCANE, 0.55, 316);
    WEAPONS_INK.icon_chakram(canvas);
    canvas.drawGlow(CX, CY, 36, INK_COLORS.PURPLE_ARCANE, 0.65);
  },

  icon_divinejudgement: (canvas) => {
    canvas.drawBaseEmblem(INK_COLORS.GOLD_ROYAL, 0.6, 317);
    WEAPONS_INK.icon_holycross(canvas);
    canvas.drawGlow(CX, CY, 38, INK_COLORS.GOLD_BRIGHT, 0.75);
  },

  // 레거시 4종 호환
  icon_acid: (canvas) => WEAPONS_INK.icon_poisondagger(canvas),
  icon_holyshotgun: (canvas) => WEAPONS_INK.icon_shotgun(canvas),
  icon_arcanesanctuary: (canvas) => WEAPONS_INK.icon_sanctuary(canvas),
  icon_plasmatempest: (canvas) => EVOLVED_INK.icon_teslashotgun(canvas)
};

// ================= 통합 수묵 엠블럼 레지스트리 =================
const ALL_INK_EMBLEMS = {
  ...WEAPONS_INK,
  ...PASSIVES_INK,
  ...EVOLVED_INK
};

/**
 * 아이콘 키에 대응하는 128x128 수묵 엠블럼 RGBA 버퍼 렌더링
 * @param {string} key 아이콘 식별자 (예: 'icon_sword', 'icon_armor')
 * @returns {Buffer|null} 128*128*4 바이트 RGBA 버퍼 (등록되지 않은 경우 null)
 */
function renderInkEmblem(key) {
  const renderer = ALL_INK_EMBLEMS[key];
  if (!renderer) return null;

  const canvas = new InkCanvas(WIDTH, HEIGHT);
  renderer(canvas);
  return canvas.buffer;
}

/**
 * 특정 키가 수묵 엠블럼 생성기에서 지원되는지 확인
 * @param {string} key
 * @returns {boolean}
 */
function hasInkEmblem(key) {
  return typeof ALL_INK_EMBLEMS[key] === 'function';
}

module.exports = {
  renderInkEmblem,
  hasInkEmblem,
  WIDTH,
  HEIGHT,
  INK_COLORS
};
