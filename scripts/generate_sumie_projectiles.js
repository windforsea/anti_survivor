// Anti Survivors - 수묵화풍(Ink-Wash) 34종 무기 투사체 & 스킬 이펙트 PNG 빌더
// 순수 Node.js 내장 모듈(fs, path, zlib)만 사용하여 PNG 청크(IHDR, IDAT, IEND)를 직접 인코딩합니다.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. 순수 JS CRC32 테이블 및 해시 계산기
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 2. 순수 PNG 청크 인코더 (RGBA 버퍼 -> PNG 바이너리)
function encodePNG(width, height, rgbaBuffer) {
  const rowSize = 1 + width * 4;
  const rawScanlines = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    rawScanlines[y * rowSize] = 0; // Filter Type 0 (None)
    rgbaBuffer.copy(rawScanlines, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR 청크
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Standard filter
  ihdr[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT 청크
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND 청크
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

// 3. 서예 붓글씨 및 수묵화 픽셀 캔버스 조작 클래스
class InkCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 1.0) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (y * this.width + x) * 4;
    const srcA = Math.min(1.0, Math.max(0.0, a));
    const dstA = this.buffer[idx + 3] / 255.0;
    const outA = srcA + dstA * (1.0 - srcA);
    if (outA <= 0) return;

    const outR = Math.round((r * srcA + this.buffer[idx] * dstA * (1.0 - srcA)) / outA);
    const outG = Math.round((g * srcA + this.buffer[idx + 1] * dstA * (1.0 - srcA)) / outA);
    const outB = Math.round((b * srcA + this.buffer[idx + 2] * dstA * (1.0 - srcA)) / outA);

    this.buffer[idx] = outR;
    this.buffer[idx + 1] = outG;
    this.buffer[idx + 2] = outB;
    this.buffer[idx + 3] = Math.round(outA * 255.0);
  }

  // 부드러운 수묵 점/원
  drawCircle(cx, cy, radius, r, g, b, alpha = 1.0) {
    const minX = Math.max(0, Math.floor(cx - radius - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius + 1));
    const minY = Math.max(0, Math.floor(cy - radius - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius + 1));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= radius) {
          const edgeA = (radius - d < 1.0) ? (radius - d) * alpha : alpha;
          this.setPixel(x, y, r, g, b, edgeA);
        }
      }
    }
  }

  // 서예 붓글씨 획 (시작 굵기 -> 끝 굵기 테이퍼드 및 비백 갈필)
  drawStroke(x0, y0, x1, y1, w0, w1, r, g, b, alpha = 1.0) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(dist * 2.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const curW = w0 + (w1 - w0) * t;
      this.drawCircle(x, y, curW / 2.0, r, g, b, alpha);
    }
  }

  // 송연먹 튐 (Ink Splatter)
  drawSplatter(cx, cy, maxRadius, count, r, g, b, baseAlpha = 0.75) {
    for (let i = 0; i < count; i++) {
      const ang = (i * 2.39996 + 0.3) % (Math.PI * 2);
      const dist = (0.25 + ((i * 7) % 10) / 13.0) * maxRadius;
      const sx = cx + Math.cos(ang) * dist;
      const sy = cy + Math.sin(ang) * dist;
      const dotR = 0.6 + ((i * 3) % 4) * 0.4;
      this.drawCircle(sx, sy, dotR, r, g, b, baseAlpha * (1.0 - dist / (maxRadius * 1.2)));
    }
  }

  // 수묵 원환 결계선
  drawRing(cx, cy, rInner, rOuter, r, g, b, alpha = 1.0) {
    const minX = Math.max(0, Math.floor(cx - rOuter - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + rOuter + 1));
    const minY = Math.max(0, Math.floor(cy - rOuter - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + rOuter + 1));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= rInner && d <= rOuter) {
          let a = alpha;
          if (d - rInner < 1.0) a *= (d - rInner);
          if (rOuter - d < 1.0) a *= (rOuter - d);
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  // 한지 수묵 번짐 그라데이션
  drawInkBleed(cx, cy, radius, r, g, b, innerAlpha, outerAlpha) {
    const minX = Math.max(0, Math.floor(cx - radius - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius + 1));
    const minY = Math.max(0, Math.floor(cy - radius - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius + 1));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= radius) {
          const t = d / radius;
          const a = innerAlpha * (1.0 - t) + outerAlpha * t;
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.buffer);
  }
}

// 4. 단청 오방색 & 송연먹 컬러 팔레트 정의
const C = {
  INK_DARK: [9, 9, 11],       // 농묵 흑색 (#09090b)
  INK_MID: [39, 39, 42],      // 중묵 먹색 (#27272a)
  INK_LIGHT: [113, 113, 122], // 담묵 회색 (#71717a)
  WHITE: [250, 250, 249],     // 한지 비백 (#fafaf9)
  
  RED_DAN: [185, 28, 28],     // 진사 적색 (#b91c1c)
  RED_FIRE: [234, 88, 12],    // 주홍 불꽃 (#ea580c)
  
  GREEN_DAN: [5, 150, 105],   // 하엽 녹색 (#059669)
  GREEN_JADE: [16, 185, 129], // 비취 녹색 (#10b981)
  
  BLUE_DAN: [29, 78, 216],    // 군청 청색 (#1d4ed8)
  BLUE_SKY: [2, 132, 199],    // 청화 쪽빛 (#0284c7)
  
  GOLD_DAN: [202, 138, 4],    // 단청 황금 (#ca8a04)
  GOLD_BRIGHT: [253, 224, 71],// 금박 황색 (#fde047)
  
  PURPLE_DAN: [126, 34, 206], // 단청 자적 (#7e22ce)
  PURPLE_DEEP: [59, 7, 100]   // 심연 흑자색 (#3b0764)
};

// 5. 22종 무기 투사체 & 광역 이펙트 수묵화 스프라이트 생성기
const SPRITE_GENERATORS = {
  // [32x32px] 소형 고속 투사체 (8종)
  'proj_shuriken': () => {
    const cv = new InkCanvas(32, 32);
    // 송연먹 회전 비백 십자 날
    cv.drawStroke(16, 4, 16, 28, 4.5, 1.2, ...C.INK_DARK, 0.95);
    cv.drawStroke(4, 16, 28, 16, 4.5, 1.2, ...C.INK_DARK, 0.95);
    // 내부 비백 및 황금 단청 심
    cv.drawStroke(16, 7, 16, 25, 2.0, 0.8, ...C.GOLD_BRIGHT, 0.85);
    cv.drawStroke(7, 16, 25, 16, 2.0, 0.8, ...C.GOLD_BRIGHT, 0.85);
    cv.drawCircle(16, 16, 3.5, ...C.INK_DARK, 1.0);
    cv.drawCircle(16, 16, 1.8, ...C.WHITE, 0.9);
    cv.drawSplatter(16, 16, 12, 6, ...C.INK_MID, 0.6);
    return cv.toPNG();
  },

  'proj_dagger': () => {
    const cv = new InkCanvas(32, 32);
    // 조선 비수 묵선 날 (우하향)
    cv.drawStroke(6, 6, 26, 26, 5.0, 1.0, ...C.INK_DARK, 0.95);
    // 비취 독흔
    cv.drawStroke(8, 8, 23, 23, 2.4, 0.6, ...C.GREEN_JADE, 0.9);
    cv.drawStroke(10, 10, 20, 20, 1.2, 0.4, ...C.WHITE, 0.85);
    cv.drawCircle(6, 6, 2.5, ...C.INK_MID, 0.9);
    cv.drawSplatter(20, 20, 7, 4, ...C.GREEN_DAN, 0.5);
    return cv.toPNG();
  },

  'proj_missile': () => {
    const cv = new InkCanvas(32, 32);
    // 청화 군청 묵적 유도탄 + 먹선 붓꼬리
    cv.drawStroke(4, 16, 24, 16, 1.0, 5.5, ...C.INK_DARK, 0.85);
    cv.drawStroke(7, 16, 25, 16, 0.8, 3.8, ...C.BLUE_DAN, 0.9);
    cv.drawCircle(25, 16, 4.2, ...C.BLUE_SKY, 0.95);
    cv.drawCircle(26, 16, 2.0, ...C.WHITE, 1.0);
    cv.drawSplatter(12, 16, 9, 5, ...C.INK_MID, 0.5);
    return cv.toPNG();
  },

  'proj_shotgun': () => {
    const cv = new InkCanvas(32, 32);
    // 송연먹 묵환 쇠구슬 + 주홍 파열 튐
    cv.drawCircle(16, 16, 5.5, ...C.INK_DARK, 0.95);
    cv.drawCircle(15, 15, 3.0, ...C.RED_FIRE, 0.8);
    cv.drawCircle(14, 14, 1.5, ...C.WHITE, 0.9);
    cv.drawSplatter(16, 16, 11, 8, ...C.RED_DAN, 0.65);
    cv.drawSplatter(16, 16, 13, 6, ...C.INK_DARK, 0.5);
    return cv.toPNG();
  },

  'proj_holypellet': () => {
    const cv = new InkCanvas(32, 32);
    // 황금 단청 묵환 + 비백 하이라이트
    cv.drawCircle(16, 16, 6.0, ...C.INK_DARK, 0.9);
    cv.drawCircle(16, 16, 4.5, ...C.GOLD_DAN, 0.95);
    cv.drawCircle(15, 15, 2.5, ...C.GOLD_BRIGHT, 0.9);
    cv.drawCircle(14, 14, 1.2, ...C.WHITE, 1.0);
    cv.drawSplatter(16, 16, 10, 5, ...C.GOLD_BRIGHT, 0.5);
    return cv.toPNG();
  },

  'proj_windarrow': () => {
    const cv = new InkCanvas(32, 32);
    // 일필휘지 하엽 녹색 비백 바람 화살
    cv.drawStroke(4, 16, 26, 16, 2.5, 4.0, ...C.INK_DARK, 0.9);
    cv.drawStroke(6, 16, 27, 16, 1.2, 2.2, ...C.GREEN_JADE, 0.95);
    // 화살촉
    cv.drawStroke(27, 16, 21, 10, 3.0, 1.0, ...C.GREEN_DAN, 0.9);
    cv.drawStroke(27, 16, 21, 22, 3.0, 1.0, ...C.GREEN_DAN, 0.9);
    cv.drawCircle(27, 16, 1.5, ...C.WHITE, 0.9);
    return cv.toPNG();
  },

  'proj_holyarrow': () => {
    const cv = new InkCanvas(32, 32);
    // 황금 붓선 신성 화살
    cv.drawStroke(4, 16, 26, 16, 2.5, 4.0, ...C.INK_DARK, 0.9);
    cv.drawStroke(6, 16, 27, 16, 1.2, 2.2, ...C.GOLD_BRIGHT, 0.95);
    cv.drawStroke(27, 16, 20, 9, 3.0, 1.0, ...C.GOLD_DAN, 0.9);
    cv.drawStroke(27, 16, 20, 23, 3.0, 1.0, ...C.GOLD_DAN, 0.9);
    cv.drawCircle(27, 16, 1.6, ...C.WHITE, 1.0);
    return cv.toPNG();
  },

  'proj_frostshard': () => {
    const cv = new InkCanvas(32, 32);
    // 서리먹 빙결 파편
    cv.drawStroke(6, 16, 26, 16, 1.0, 5.0, ...C.INK_DARK, 0.9);
    cv.drawStroke(10, 16, 26, 16, 0.6, 3.0, ...C.BLUE_SKY, 0.9);
    cv.drawStroke(26, 16, 18, 11, 2.0, 0.8, ...C.BLUE_SKY, 0.8);
    cv.drawStroke(26, 16, 18, 21, 2.0, 0.8, ...C.BLUE_SKY, 0.8);
    cv.drawCircle(26, 16, 1.5, ...C.WHITE, 0.95);
    return cv.toPNG();
  },

  // [64x64px] 중형 회전/참격 투사체 (8종)
  'proj_axe': () => {
    const cv = new InkCanvas(64, 64);
    // 조선 무쇠도끼 묵선 날 + 비백 회전 호
    cv.drawRing(32, 32, 22, 28, ...C.INK_MID, 0.35);
    cv.drawStroke(16, 32, 48, 32, 5.0, 3.0, ...C.INK_DARK, 0.95); // 도끼 자루
    // 부채꼴 도끼 머리
    cv.drawStroke(38, 16, 52, 24, 7.0, 2.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(38, 48, 52, 40, 7.0, 2.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(50, 20, 50, 44, 4.0, 4.0, ...C.WHITE, 0.85); // 서예 비백 날
    cv.drawCircle(44, 32, 4.5, ...C.GOLD_DAN, 0.8);
    cv.drawSplatter(32, 32, 24, 10, ...C.INK_DARK, 0.5);
    return cv.toPNG();
  },

  'proj_sword': () => {
    const cv = new InkCanvas(64, 64);
    // 조선 환도 묵선 칼날 + 황금 뇌전 림
    cv.drawStroke(12, 52, 48, 16, 6.0, 1.5, ...C.INK_DARK, 0.95);
    cv.drawStroke(16, 48, 50, 14, 3.0, 0.8, ...C.WHITE, 0.9);
    cv.drawStroke(18, 46, 46, 18, 1.5, 0.5, ...C.GOLD_BRIGHT, 0.7);
    cv.drawStroke(8, 56, 14, 50, 5.0, 5.0, ...C.INK_MID, 0.95); // 손잡이
    cv.drawCircle(14, 50, 4.0, ...C.GOLD_DAN, 0.9); // 코등이
    cv.drawSplatter(32, 32, 20, 8, ...C.INK_LIGHT, 0.45);
    return cv.toPNG();
  },

  'proj_chakram': () => {
    const cv = new InkCanvas(64, 64);
    // 톱날 묵선 원반 + 비취/심연 안광
    cv.drawRing(32, 32, 14, 24, ...C.INK_DARK, 0.9);
    cv.drawRing(32, 32, 17, 21, ...C.PURPLE_DAN, 0.75);
    // 4개 회전 날
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const x0 = 32 + Math.cos(ang) * 16;
      const y0 = 32 + Math.sin(ang) * 16;
      const x1 = 32 + Math.cos(ang + 0.4) * 28;
      const y1 = 32 + Math.sin(ang + 0.4) * 28;
      cv.drawStroke(x0, y0, x1, y1, 4.0, 1.0, ...C.GREEN_JADE, 0.9);
    }
    cv.drawCircle(32, 32, 6.0, ...C.INK_DARK, 1.0);
    cv.drawCircle(32, 32, 3.0, ...C.WHITE, 0.9);
    cv.drawSplatter(32, 32, 26, 8, ...C.PURPLE_DEEP, 0.5);
    return cv.toPNG();
  },

  'proj_holycross': () => {
    const cv = new InkCanvas(64, 64);
    // 서예 해서체 십자 묵선 + 단청 황금 테두리
    cv.drawStroke(32, 8, 32, 56, 9.0, 7.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(14, 24, 50, 24, 9.0, 7.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(32, 11, 32, 53, 5.0, 3.5, ...C.GOLD_DAN, 0.9);
    cv.drawStroke(17, 24, 47, 24, 5.0, 3.5, ...C.GOLD_DAN, 0.9);
    cv.drawStroke(32, 14, 32, 50, 2.0, 1.5, ...C.GOLD_BRIGHT, 0.9);
    cv.drawStroke(20, 24, 44, 24, 2.0, 1.5, ...C.GOLD_BRIGHT, 0.9);
    cv.drawCircle(32, 24, 3.5, ...C.WHITE, 1.0);
    cv.drawSplatter(32, 24, 25, 8, ...C.GOLD_BRIGHT, 0.45);
    return cv.toPNG();
  },

  'proj_frostorb': () => {
    const cv = new InkCanvas(64, 64);
    // 서리먹 빙결 보주 + 냉기 회전 묵선
    cv.drawInkBleed(32, 32, 26, ...C.BLUE_SKY, 0.5, 0.0);
    cv.drawRing(32, 32, 18, 22, ...C.INK_DARK, 0.7);
    cv.drawCircle(32, 32, 14.0, ...C.BLUE_DAN, 0.85);
    cv.drawCircle(32, 32, 9.0, ...C.BLUE_SKY, 0.9);
    cv.drawCircle(30, 30, 4.0, ...C.WHITE, 0.95);
    cv.drawSplatter(32, 32, 25, 10, ...C.WHITE, 0.6);
    return cv.toPNG();
  },

  'proj_shadoworb': () => {
    const cv = new InkCanvas(64, 64);
    // 심연 농묵 구체 + 자색 서예 안광
    cv.drawInkBleed(32, 32, 28, ...C.PURPLE_DEEP, 0.6, 0.0);
    cv.drawCircle(32, 32, 16.0, ...C.INK_DARK, 0.95);
    cv.drawRing(32, 32, 16, 21, ...C.PURPLE_DAN, 0.8);
    cv.drawCircle(32, 32, 8.0, ...C.PURPLE_DAN, 0.85);
    cv.drawCircle(32, 32, 3.5, ...C.WHITE, 0.9);
    cv.drawSplatter(32, 32, 26, 12, ...C.PURPLE_DAN, 0.5);
    return cv.toPNG();
  },

  'proj_fireball': () => {
    const cv = new InkCanvas(64, 64);
    // 진사 주홍 화염구 + 송연먹 불꽃 붓선
    cv.drawInkBleed(32, 32, 26, ...C.RED_DAN, 0.55, 0.0);
    cv.drawCircle(32, 32, 14.0, ...C.RED_DAN, 0.9);
    cv.drawCircle(32, 32, 9.0, ...C.RED_FIRE, 0.95);
    cv.drawCircle(31, 31, 4.5, ...C.GOLD_BRIGHT, 0.95);
    cv.drawCircle(30, 30, 2.0, ...C.WHITE, 1.0);
    cv.drawSplatter(32, 32, 26, 12, ...C.RED_FIRE, 0.65);
    return cv.toPNG();
  },

  'proj_teslapellet': () => {
    const cv = new InkCanvas(64, 64);
    // 뇌전포 벼락 묵환 + 비백 스파크
    cv.drawCircle(32, 32, 12.0, ...C.INK_DARK, 0.9);
    cv.drawCircle(32, 32, 8.0, ...C.BLUE_SKY, 0.9);
    cv.drawCircle(32, 32, 4.0, ...C.WHITE, 1.0);
    // 4방향 벼락 획
    cv.drawStroke(32, 8, 32, 24, 3.5, 1.0, ...C.WHITE, 0.9);
    cv.drawStroke(32, 56, 32, 40, 3.5, 1.0, ...C.WHITE, 0.9);
    cv.drawStroke(8, 32, 24, 32, 3.5, 1.0, ...C.WHITE, 0.9);
    cv.drawStroke(56, 32, 40, 32, 3.5, 1.0, ...C.WHITE, 0.9);
    cv.drawSplatter(32, 32, 25, 10, ...C.BLUE_SKY, 0.6);
    return cv.toPNG();
  },

  // [128x128px] 대형 광역 장판 & 궁극기 이펙트 (6종)
  'effect_sanctuary': () => {
    const cv = new InkCanvas(128, 128);
    // 조선 천문도 팔괘 묵선 결계 원
    cv.drawInkBleed(64, 64, 58, ...C.GOLD_DAN, 0.25, 0.0);
    cv.drawRing(64, 64, 52, 56, ...C.INK_DARK, 0.9);
    cv.drawRing(64, 64, 48, 51, ...C.GOLD_DAN, 0.7);
    cv.drawRing(64, 64, 32, 34, ...C.INK_MID, 0.5);
    // 8개 룬 서예 점
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4;
      const rx = 64 + Math.cos(ang) * 54;
      const ry = 64 + Math.sin(ang) * 54;
      cv.drawCircle(rx, ry, 4.5, ...C.INK_DARK, 0.95);
      cv.drawCircle(rx, ry, 2.5, ...C.GOLD_BRIGHT, 0.9);
    }
    cv.drawSplatter(64, 64, 50, 16, ...C.GOLD_DAN, 0.35);
    return cv.toPNG();
  },

  'effect_holywater': () => {
    const cv = new InkCanvas(128, 128);
    // 한지 먹물 번짐 연못 + 비백 연꽃 파문
    cv.drawInkBleed(64, 64, 56, ...C.BLUE_DAN, 0.35, 0.02);
    cv.drawRing(64, 64, 50, 54, ...C.INK_DARK, 0.8);
    cv.drawRing(64, 64, 34, 37, ...C.BLUE_SKY, 0.6);
    cv.drawRing(64, 64, 18, 20, ...C.WHITE, 0.5);
    cv.drawCircle(64, 64, 6.0, ...C.BLUE_SKY, 0.8);
    cv.drawSplatter(64, 64, 48, 20, ...C.INK_MID, 0.45);
    return cv.toPNG();
  },

  'effect_flamepillar': () => {
    const cv = new InkCanvas(128, 128);
    // 용솟음치는 진사 적묵 화염 기둥
    cv.drawInkBleed(64, 64, 58, ...C.RED_DAN, 0.45, 0.0);
    cv.drawRing(64, 64, 48, 54, ...C.INK_DARK, 0.9);
    cv.drawStroke(64, 110, 64, 18, 24.0, 6.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(64, 105, 64, 22, 16.0, 4.0, ...C.RED_DAN, 0.9);
    cv.drawStroke(64, 100, 64, 28, 8.0, 2.0, ...C.RED_FIRE, 0.95);
    cv.drawCircle(64, 64, 12.0, ...C.GOLD_BRIGHT, 0.85);
    cv.drawCircle(64, 64, 6.0, ...C.WHITE, 0.95);
    cv.drawSplatter(64, 64, 52, 22, ...C.RED_FIRE, 0.6);
    return cv.toPNG();
  },

  'effect_comet': () => {
    const cv = new InkCanvas(128, 128);
    // 종말의 혜성 운석 묵선 + 송연먹 폭쇄 꼬리
    cv.drawStroke(20, 20, 96, 96, 2.0, 28.0, ...C.INK_DARK, 0.85);
    cv.drawStroke(28, 28, 96, 96, 1.0, 18.0, ...C.RED_DAN, 0.9);
    cv.drawStroke(38, 38, 96, 96, 0.5, 10.0, ...C.RED_FIRE, 0.95);
    cv.drawCircle(96, 96, 16.0, ...C.INK_DARK, 1.0);
    cv.drawCircle(94, 94, 11.0, ...C.RED_FIRE, 0.95);
    cv.drawCircle(92, 92, 6.0, ...C.GOLD_BRIGHT, 0.95);
    cv.drawCircle(90, 90, 2.5, ...C.WHITE, 1.0);
    cv.drawSplatter(96, 96, 40, 20, ...C.RED_FIRE, 0.6);
    return cv.toPNG();
  },

  'effect_cyclone': () => {
    const cv = new InkCanvas(128, 128);
    // 태풍의 눈 소용돌이 먹선
    cv.drawInkBleed(64, 64, 58, ...C.GREEN_DAN, 0.35, 0.0);
    // 회오리 곡선 획
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const x0 = 64 + Math.cos(ang) * 12;
      const y0 = 64 + Math.sin(ang) * 12;
      const x1 = 64 + Math.cos(ang + 1.2) * 52;
      const y1 = 64 + Math.sin(ang + 1.2) * 52;
      cv.drawStroke(x0, y0, x1, y1, 8.0, 1.5, ...C.INK_DARK, 0.9);
      cv.drawStroke(x0, y0, x1, y1, 4.0, 0.8, ...C.GREEN_JADE, 0.85);
    }
    cv.drawCircle(64, 64, 8.0, ...C.INK_DARK, 1.0);
    cv.drawCircle(64, 64, 3.5, ...C.WHITE, 0.9);
    cv.drawSplatter(64, 64, 50, 16, ...C.GREEN_JADE, 0.5);
    return cv.toPNG();
  },

  'effect_divine': () => {
    const cv = new InkCanvas(128, 128);
    // 신의 심판 거대 대천사 십자 묵선 + 벼락
    cv.drawStroke(64, 12, 64, 116, 16.0, 12.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(24, 44, 104, 44, 16.0, 12.0, ...C.INK_DARK, 0.95);
    cv.drawStroke(64, 16, 64, 112, 8.0, 6.0, ...C.GOLD_DAN, 0.9);
    cv.drawStroke(28, 44, 100, 44, 8.0, 6.0, ...C.GOLD_DAN, 0.9);
    cv.drawStroke(64, 20, 64, 108, 3.0, 2.0, ...C.WHITE, 0.95);
    cv.drawStroke(32, 44, 96, 44, 3.0, 2.0, ...C.WHITE, 0.95);
    cv.drawCircle(64, 44, 8.0, ...C.GOLD_BRIGHT, 0.9);
    cv.drawCircle(64, 44, 4.0, ...C.WHITE, 1.0);
    cv.drawSplatter(64, 44, 54, 22, ...C.GOLD_BRIGHT, 0.55);
    return cv.toPNG();
  }
};

// 6. 실행 및 파일 저장
function main() {
  const targetDir = path.resolve(__dirname, '../assets/sprites');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('🖌️ [Step 6] 수묵화풍(Ink-Wash) 무기 투사체 & 스킬 이펙트 PNG 빌드 시작...');
  let count = 0;

  for (const [key, genFn] of Object.entries(SPRITE_GENERATORS)) {
    const pngBuffer = genFn();
    const filePath = path.join(targetDir, `${key}.png`);
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`  ✓ 생성 완료: ${key}.png (${pngBuffer.length} bytes)`);
    count++;
  }

  console.log(`🎉 [빌드 완료] 총 ${count}종의 수묵화풍 무기 투사체 & 광역 이펙트 에셋이 생성되었습니다.`);
}

if (require.main === module) {
  main();
}

module.exports = { SPRITE_GENERATORS, encodePNG };
