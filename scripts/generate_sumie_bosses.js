// Anti Survivors - 수묵화풍(Ink-Wash) 보스 13종 순수 Node.js PNG 빌더
// 외부 그래픽 라이브러리(Canvas, node-canvas 등) 없이 Node.js 내장 zlib, fs 모듈로 64x64 RGBA PNG를 무손실 직접 인코딩합니다.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. 단청 및 수묵화 전용 정밀 RGBA 컬러 팔레트
const PALETTE = {
  TRANSPARENT:  [0, 0, 0, 0],
  // 송연먹 5단계 농담 (Shades of Pine-Soot Ink)
  INK_BLACK:    [10, 10, 14, 255],   // 최고 농묵 (외곽 굵은 먹선, 골격, 심연)
  INK_DARK:     [30, 32, 40, 245],   // 농묵 (갑옷 음영, 가죽 주름, 주 근육선)
  INK_MID:      [68, 72, 85, 220],   // 중묵 (바위 표면, 뼈마디 명암, 털 질감)
  INK_LIGHT:    [135, 140, 155, 170],// 담묵 (먹물 번짐, 피부 베이스, 그림자)
  INK_WASH:     [190, 195, 210, 95], // 극담묵/선염 (외곽 비백 잔상, 영기 기운)
  BONE_WHITE:   [244, 246, 250, 255],// 호분 백색 (해골, 낫날, 날카로운 엄니)
  PALE_GREY:    [168, 174, 188, 225],// 석회 회백색 (풍화된 석괴 및 갑각)

  // 단청 / 오방색 포인트 컬러 (깊이 있는 전통 채도 적용)
  CINNABAR:     [218, 38, 38, 255],  // 단청 진사(붉은색) - 안광, 핏빛 참격, 로브
  VERMILION:    [245, 84, 68, 255],  // 단청 다홍 - 갑각 강조, 활성 코어
  OCHRE:        [215, 138, 24, 255], // 단청 황토(금황색) - 고대 룬, 보주, 맹수 갈기
  GOLD:         [250, 204, 21, 255], // 단청 황금 - 보스 절대 왕관, 신성 뇌격
  ROD_GREEN:    [30, 175, 90, 255],  // 단청 하엽/뇌록 - 심연 맹독, 이끼
  MINT_PALE:    [130, 235, 170, 220],// 담청록 - 독기 번짐
  COBALT:       [24, 110, 210, 255], // 단청 군청(깊은 청색) - 심해 비늘, 파도
  SKY_CYAN:     [44, 185, 230, 230], // 단청 옥색(발광 청록) - 영혼불, 촉수 발광체
  PALE_CYAN:    [160, 240, 250, 150],// 담옥색 번짐 (해파리 영체, 한기 오라)
  ROYAL_PURPLE: [135, 48, 205, 255], // 단청 자주(보라) - 심연 보이드, 마도 오라
  DEEP_INDIGO:  [18, 22, 45, 255]    // 심연 감색 - 심해 거수, 공허 본체
};

// 2. 순수 Node.js 경량 PNG 청크 빌더 (CRC32 및 무손실 Deflate 압축)
function makeCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}
const crcTable = makeCRC32Table();

function calculateCRC(buffer) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = calculateCRC(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function encodePNG64x64(pixelBuffer) {
  const width = 64;
  const height = 64;
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced
  const ihdrChunk = createChunk('IHDR', ihdr);

  // 라인 필터 바이트(0: None) 추가
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (width * 4 + 1);
    rawData[rawOffset] = 0;
    pixelBuffer.copy(rawData, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 3. 64x64 보스 전용 수묵화 래스터 캔버스 도우미
class SumieCanvas64 {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.buffer = Buffer.alloc(64 * 64 * 4);
  }

  setPixel(x, y, rgba) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
    const idx = (Math.floor(y) * 64 + Math.floor(x)) * 4;
    const srcA = rgba[3] / 255;
    if (srcA <= 0) return;

    if (srcA >= 0.99) {
      this.buffer[idx] = rgba[0];
      this.buffer[idx + 1] = rgba[1];
      this.buffer[idx + 2] = rgba[2];
      this.buffer[idx + 3] = rgba[3];
    } else {
      const dstA = this.buffer[idx + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA > 0) {
        this.buffer[idx] = Math.round((rgba[0] * srcA + this.buffer[idx] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 1] = Math.round((rgba[1] * srcA + this.buffer[idx + 1] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 2] = Math.round((rgba[2] * srcA + this.buffer[idx + 2] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  // 타원형 묵염(선염 번짐) 채우기
  fillInkEllipse(cx, cy, rx, ry, innerColor, edgeColor, strokeColor = PALETTE.INK_BLACK) {
    for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) {
      for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d <= 1.0) {
          const ratio = Math.sqrt(d);
          const col = [
            Math.round(innerColor[0] * (1 - ratio) + edgeColor[0] * ratio),
            Math.round(innerColor[1] * (1 - ratio) + edgeColor[1] * ratio),
            Math.round(innerColor[2] * (1 - ratio) + edgeColor[2] * ratio),
            Math.round(innerColor[3] * (1 - ratio) + edgeColor[3] * ratio)
          ];
          this.setPixel(x, y, col);
        } else if (strokeColor && d <= 1.25) {
          this.setPixel(x, y, strokeColor);
        }
      }
    }
  }

  // 갈필(渴筆) 수묵 붓선 긋기
  drawBrushStroke(x0, y0, x1, y1, color, thickness = 1.5) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist * 2.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curX = x0 + (x1 - x0) * t;
      const curY = y0 + (y1 - y0) * t;
      for (let ox = -thickness; ox <= thickness; ox += 0.8) {
        for (let oy = -thickness; oy <= thickness; oy += 0.8) {
          if (ox * ox + oy * oy <= thickness * thickness) {
            this.setPixel(curX + ox, curY + oy, color);
          }
        }
      }
    }
  }

  // 베지어 곡선 붓선 (사신의 낫, 촉수, 꼬리 등 유려한 갈필 표현)
  drawBezierCurve(x0, y0, cx, cy, x1, y1, color, thickness = 1.6) {
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const inv = 1 - t;
      const curX = inv * inv * x0 + 2 * inv * t * cx + t * t * x1;
      const curY = inv * inv * y0 + 2 * inv * t * cy + t * t * y1;
      for (let ox = -thickness; ox <= thickness; ox += 0.8) {
        for (let oy = -thickness; oy <= thickness; oy += 0.8) {
          if (ox * ox + oy * oy <= thickness * thickness) {
            this.setPixel(curX + ox, curY + oy, color);
          }
        }
      }
    }
  }

  // 먹물 튀김(비백 잔상) 효과
  drawSplatter(cx, cy, count, radius, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      this.setPixel(sx, sy, color);
    }
  }
}

// 4. 보스 13종 64x64 수묵화풍 제너레이터 빌더 테이블
const BOSS_BUILDERS = {
  // 1. 돌진 맹수 (Dire Boar - 2 Stg)
  // 거친 송연먹 털, 호분백 대형 엄니, 단청 주사 핏빛 안광과 황토 갈기
  boss_boar: (cv) => {
    // 뒷배경 흩날리는 먹물 비백
    cv.drawSplatter(32, 36, 24, 26, PALETTE.INK_WASH);

    // 몸통 및 등줄기 근육 덩어리
    cv.fillInkEllipse(32, 38, 22, 16, PALETTE.OCHRE, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(30, 36, 17, 12, PALETTE.INK_MID, PALETTE.INK_DARK, null);

    // 솟구친 갈기털 (갈필 붓선)
    for (let x = 18; x <= 46; x += 4) {
      cv.drawBrushStroke(x, 26, x - 3, 14 + (Math.sin(x) * 4), PALETTE.INK_BLACK, 1.8);
      cv.drawBrushStroke(x + 1, 26, x - 1, 17, PALETTE.OCHRE, 1.2);
    }

    // 맹수의 머리와 주둥이
    cv.fillInkEllipse(44, 40, 12, 10, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(53, 42, 6, 5, PALETTE.INK_MID, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 콧구멍
    cv.setPixel(56, 42, PALETTE.INK_BLACK);
    cv.setPixel(56, 44, PALETTE.INK_BLACK);

    // 흉포한 한 쌍의 거대 호분 엄니 (곡선 붓질)
    cv.drawBezierCurve(48, 46, 56, 48, 55, 33, PALETTE.BONE_WHITE, 2.4);
    cv.drawBezierCurve(44, 47, 50, 50, 48, 36, PALETTE.BONE_WHITE, 2.0);

    // 단청 진사 붉은 안광
    cv.fillInkEllipse(43, 36, 2.5, 2.5, PALETTE.CINNABAR, PALETTE.VERMILION, PALETTE.INK_BLACK);
    cv.setPixel(44, 35, PALETTE.BONE_WHITE);

    // 육중한 네 다리와 굽
    cv.drawBrushStroke(20, 46, 16, 58, PALETTE.INK_BLACK, 3.2);
    cv.drawBrushStroke(28, 48, 26, 60, PALETTE.INK_BLACK, 3.0);
    cv.drawBrushStroke(38, 48, 38, 60, PALETTE.INK_BLACK, 3.0);
    cv.drawBrushStroke(48, 46, 49, 58, PALETTE.INK_BLACK, 3.2);
    // 굽 (호분백)
    cv.drawBrushStroke(14, 58, 17, 58, PALETTE.BONE_WHITE, 1.5);
    cv.drawBrushStroke(24, 60, 27, 60, PALETTE.BONE_WHITE, 1.5);
    cv.drawBrushStroke(36, 60, 39, 60, PALETTE.BONE_WHITE, 1.5);
    cv.drawBrushStroke(47, 58, 50, 58, PALETTE.BONE_WHITE, 1.5);
  },

  // 2. 그림자 마법사 (Void Sorcerer - 4 Stg)
  // 칠흑의 찢어진 로브, 단청 자주/심연 오라, 번뜩이는 옥색 마안
  boss_void: (cv) => {
    // 심연 공허 오라 (선염 번짐)
    cv.fillInkEllipse(32, 34, 26, 26, PALETTE.INK_WASH, PALETTE.TRANSPARENT, null);
    cv.fillInkEllipse(32, 34, 20, 20, PALETTE.ROYAL_PURPLE, PALETTE.DEEP_INDIGO, null);

    // 찢어진 칠흑 후드와 로브
    cv.fillInkEllipse(32, 22, 10, 11, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBezierCurve(26, 26, 14, 48, 18, 58, PALETTE.INK_BLACK, 3.5);
    cv.drawBezierCurve(38, 26, 50, 48, 46, 58, PALETTE.INK_BLACK, 3.5);
    cv.fillInkEllipse(32, 42, 14, 18, PALETTE.INK_BLACK, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK);

    // 후드 속 번뜩이는 단청 옥색 눈빛
    cv.fillInkEllipse(29, 21, 2, 2, PALETTE.SKY_CYAN, PALETTE.BONE_WHITE, null);
    cv.fillInkEllipse(35, 21, 2, 2, PALETTE.SKY_CYAN, PALETTE.BONE_WHITE, null);

    // 부유하는 양손과 마도 보주
    cv.fillInkEllipse(14, 38, 4, 4, PALETTE.SKY_CYAN, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK);
    cv.fillInkEllipse(50, 38, 4, 4, PALETTE.SKY_CYAN, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK);
    cv.drawSplatter(14, 38, 8, 8, PALETTE.PALE_CYAN);
    cv.drawSplatter(50, 38, 8, 8, PALETTE.PALE_CYAN);

    // 하단으로 흩날리는 갈필 옷자락 잔상
    for (let i = 20; i <= 44; i += 6) {
      cv.drawBrushStroke(i, 52, i + (i % 4 - 2), 62, PALETTE.INK_DARK, 2.0);
    }
  },

  // 3. 혼돈의 눈 (Chaos Eye - 6 Stg)
  // 거대 마안 실루엣, 단청 진홍 동공, 사방으로 뻗친 송연먹 핏줄 갈필
  boss_eye: (cv) => {
    // 외곽 선염 붉은 안개
    cv.fillInkEllipse(32, 32, 28, 28, PALETTE.CINNABAR, PALETTE.INK_WASH, null);

    // 안구 본체 (호분백 및 석회 음영)
    cv.fillInkEllipse(32, 32, 22, 22, PALETTE.BONE_WHITE, PALETTE.PALE_GREY, PALETTE.INK_BLACK);

    // 사방으로 뻗어나가는 핏발 갈필 먹선
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const x0 = 32 + Math.cos(a) * 12;
      const y0 = 32 + Math.sin(a) * 12;
      const x1 = 32 + Math.cos(a + 0.2) * 22;
      const y1 = 32 + Math.sin(a + 0.2) * 22;
      cv.drawBrushStroke(x0, y0, x1, y1, PALETTE.CINNABAR, 1.2);
    }

    // 홍채 (단청 진사 및 다홍 링)
    cv.fillInkEllipse(32, 32, 13, 13, PALETTE.CINNABAR, PALETTE.VERMILION, PALETTE.INK_BLACK);
    cv.fillInkEllipse(32, 32, 9, 9, PALETTE.OCHRE, PALETTE.CINNABAR, null);

    // 중심 칠흑의 동공 및 하이라이트
    cv.fillInkEllipse(32, 32, 5.5, 5.5, PALETTE.INK_BLACK, PALETTE.INK_DARK, null);
    cv.fillInkEllipse(30, 30, 2, 2, PALETTE.BONE_WHITE, PALETTE.BONE_WHITE, null);

    // 위아래 찢어진 살점 눈꺼풀 먹선
    cv.drawBezierCurve(10, 32, 32, 12, 54, 32, PALETTE.INK_BLACK, 2.5);
    cv.drawBezierCurve(10, 32, 32, 52, 54, 32, PALETTE.INK_BLACK, 2.5);
  },

  // 4. 불멸의 골렘 (Ironclad Colossus - 8 Stg)
  // 육중한 풍화 암석, 갈필 균열, 단청 황토 룬 코어
  boss_colossus: (cv) => {
    // 거대한 어깨 거석
    cv.fillInkEllipse(16, 26, 11, 10, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(48, 26, 11, 10, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);

    // 머리와 가슴 몸체
    cv.fillInkEllipse(32, 20, 8, 7, PALETTE.INK_MID, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(32, 34, 18, 16, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);

    // 가슴의 십자 단청 황토 룬 코어
    cv.drawBrushStroke(22, 34, 42, 34, PALETTE.OCHRE, 2.5);
    cv.drawBrushStroke(32, 24, 32, 44, PALETTE.OCHRE, 2.5);
    cv.fillInkEllipse(32, 34, 4, 4, PALETTE.GOLD, PALETTE.OCHRE, null);

    // 석상 안광 (황토)
    cv.setPixel(29, 19, PALETTE.GOLD);
    cv.setPixel(35, 19, PALETTE.GOLD);

    // 바위 표면 갈필 균열선
    cv.drawBrushStroke(24, 26, 29, 31, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(40, 28, 36, 36, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(26, 40, 31, 46, PALETTE.INK_BLACK, 1.4);

    // 무쇠 같은 두 팔과 거수 다리
    cv.drawBrushStroke(12, 32, 8, 50, PALETTE.INK_DARK, 4.5);
    cv.drawBrushStroke(52, 32, 56, 50, PALETTE.INK_DARK, 4.5);
    cv.drawBrushStroke(24, 46, 22, 60, PALETTE.INK_BLACK, 4.8);
    cv.drawBrushStroke(40, 46, 42, 60, PALETTE.INK_BLACK, 4.8);
  },

  // 5. 파멸의 군주 (Lord of Doom - 10 Stg)
  // 거대한 악마의 뿔, 검붉은 진사 판금, 농묵 날개
  boss_doom: (cv) => {
    // 등 뒤의 거대한 송연먹 박쥐 날개
    cv.drawBezierCurve(32, 28, 12, 8, 4, 24, PALETTE.INK_BLACK, 3.2);
    cv.drawBezierCurve(4, 24, 10, 40, 24, 38, PALETTE.INK_DARK, 2.2);
    cv.fillInkEllipse(14, 26, 9, 8, PALETTE.INK_DARK, PALETTE.INK_WASH, null);

    cv.drawBezierCurve(32, 28, 52, 8, 60, 24, PALETTE.INK_BLACK, 3.2);
    cv.drawBezierCurve(60, 24, 54, 40, 40, 38, PALETTE.INK_DARK, 2.2);
    cv.fillInkEllipse(50, 26, 9, 8, PALETTE.INK_DARK, PALETTE.INK_WASH, null);

    // 거대한 한 쌍의 악마 뿔 (갈필 호선)
    cv.drawBezierCurve(26, 18, 16, 6, 8, 10, PALETTE.INK_BLACK, 3.0);
    cv.drawBezierCurve(38, 18, 48, 6, 56, 10, PALETTE.INK_BLACK, 3.0);

    // 투구와 진사 안광
    cv.fillInkEllipse(32, 20, 8, 8, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(29, 19, 2, 2, PALETTE.CINNABAR, PALETTE.VERMILION, null);
    cv.fillInkEllipse(35, 19, 2, 2, PALETTE.CINNABAR, PALETTE.VERMILION, null);

    // 검붉은 판금 흉갑
    cv.fillInkEllipse(32, 34, 14, 13, PALETTE.CINNABAR, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(26, 32, 38, 32, PALETTE.GOLD, 1.5); // 황금 장식선
    cv.drawBrushStroke(32, 26, 32, 42, PALETTE.GOLD, 1.5);

    // 하체 및 군주의 망토
    cv.drawBrushStroke(22, 42, 16, 58, PALETTE.INK_BLACK, 3.6);
    cv.drawBrushStroke(42, 42, 48, 58, PALETTE.INK_BLACK, 3.6);
    cv.drawBrushStroke(26, 44, 25, 60, PALETTE.INK_DARK, 3.0);
    cv.drawBrushStroke(38, 44, 39, 60, PALETTE.INK_DARK, 3.0);
  },

  // 6. 심연의 리치 (Abyss Lich - 12 Stg)
  // 호분 해골, 옥색 빙백 영혼불꽃, 낡은 주술 로브와 마도 지팡이
  boss_lich: (cv) => {
    // 배경에 소용돌이치는 한기 오라
    cv.fillInkEllipse(32, 32, 26, 26, PALETTE.PALE_CYAN, PALETTE.TRANSPARENT, null);

    // 낡은 주술 로브와 어깨 견갑
    cv.fillInkEllipse(32, 38, 16, 20, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(18, 24, 46, 24, PALETTE.INK_BLACK, 2.5);

    // 호분백 해골 머리 및 사령관 왕관
    cv.fillInkEllipse(32, 17, 8, 8, PALETTE.BONE_WHITE, PALETTE.PALE_GREY, PALETTE.INK_BLACK);
    // 왕관 (황토)
    cv.drawBrushStroke(26, 12, 38, 12, PALETTE.OCHRE, 1.8);
    cv.setPixel(28, 9, PALETTE.OCHRE);
    cv.setPixel(32, 8, PALETTE.GOLD);
    cv.setPixel(36, 9, PALETTE.OCHRE);

    // 깊은 눈구멍 속 타오르는 단청 옥색 영혼불
    cv.setPixel(29, 17, PALETTE.SKY_CYAN);
    cv.setPixel(30, 17, PALETTE.BONE_WHITE);
    cv.setPixel(34, 17, PALETTE.SKY_CYAN);
    cv.setPixel(35, 17, PALETTE.BONE_WHITE);

    // 늑골과 심장부의 빙백 보주
    cv.drawBrushStroke(26, 28, 38, 28, PALETTE.BONE_WHITE, 1.4);
    cv.drawBrushStroke(28, 32, 36, 32, PALETTE.BONE_WHITE, 1.4);
    cv.fillInkEllipse(32, 30, 4, 4, PALETTE.SKY_CYAN, PALETTE.PALE_CYAN, null);

    // 마도 지팡이 (좌측)
    cv.drawBrushStroke(12, 10, 12, 58, PALETTE.INK_BLACK, 2.0);
    cv.fillInkEllipse(12, 10, 5, 5, PALETTE.SKY_CYAN, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK);
    cv.drawSplatter(12, 10, 10, 8, PALETTE.PALE_CYAN);
  },

  // 7. 종말의 사신 / 붉은 사신 (Grim Reaper / The Red Death - 15 & 99 Stg)
  // 거대한 비백 대낫, 휘날리는 칠흑 망토, 핏빛 단청 잔상
  boss_reaper: (cv) => {
    // 배경 핏빛 단청 선염
    cv.drawSplatter(32, 32, 35, 28, PALETTE.INK_WASH);

    // 거대한 사신의 대낫 (우측 상단에서 좌측으로 휘어지는 비백 칼날)
    // 자루
    cv.drawBrushStroke(52, 6, 16, 58, PALETTE.INK_BLACK, 2.8);
    // 낫날 (호분백 및 진사 칼날선)
    cv.drawBezierCurve(52, 6, 40, 0, 18, 8, PALETTE.BONE_WHITE, 3.8);
    cv.drawBezierCurve(18, 8, 30, 12, 48, 10, PALETTE.PALE_GREY, 2.0);
    cv.drawBezierCurve(52, 6, 42, 2, 20, 9, PALETTE.CINNABAR, 1.2); // 칼날 핏빛 먹선

    // 칠흑의 망토와 후드 실루엣
    cv.fillInkEllipse(32, 26, 12, 14, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBezierCurve(22, 26, 10, 44, 14, 60, PALETTE.INK_BLACK, 4.0);
    cv.drawBezierCurve(42, 26, 50, 44, 46, 60, PALETTE.INK_BLACK, 4.0);
    cv.fillInkEllipse(32, 46, 15, 16, PALETTE.INK_BLACK, PALETTE.INK_DARK, null);

    // 후드 속 번뜩이는 사신의 백골 안면과 붉은 안광
    cv.fillInkEllipse(32, 24, 6, 6, PALETTE.INK_DARK, PALETTE.INK_BLACK, null);
    cv.setPixel(30, 23, PALETTE.CINNABAR);
    cv.setPixel(31, 23, PALETTE.VERMILION);
    cv.setPixel(34, 23, PALETTE.CINNABAR);
    cv.setPixel(35, 23, PALETTE.VERMILION);
    cv.drawBrushStroke(30, 27, 34, 27, PALETTE.BONE_WHITE, 0.8); // 이빨
  },

  // 8. 공허의 지네 (Void Wyrm - 18 Stg)
  // S자 곡선으로 휘감기는 송연먹 외골격, 단청 자주빛 등마디, 맹독 가시
  boss_wyrm: (cv) => {
    // S자로 꿈틀거리는 몸통 마디들
    const points = [
      { x: 32, y: 12, r: 8 },
      { x: 24, y: 20, r: 7.5 },
      { x: 22, y: 30, r: 7 },
      { x: 28, y: 40, r: 6.5 },
      { x: 38, y: 48, r: 6 },
      { x: 44, y: 56, r: 5 }
    ];

    points.forEach((p, idx) => {
      cv.fillInkEllipse(p.x, p.y, p.r, p.r * 0.9, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
      cv.fillInkEllipse(p.x, p.y - 1, p.r * 0.5, p.r * 0.4, PALETTE.DEEP_INDIGO, PALETTE.ROYAL_PURPLE, null);

      // 양옆의 날카로운 다리 갈필 붓질
      cv.drawBrushStroke(p.x - p.r, p.y, p.x - p.r - 6, p.y + 4, PALETTE.ROD_GREEN, 1.6);
      cv.drawBrushStroke(p.x + p.r, p.y, p.x + p.r + 6, p.y + 4, PALETTE.ROD_GREEN, 1.6);
    });

    // 머리부 대형 집게턱 (단청 진사 및 칠흑 먹선)
    cv.drawBezierCurve(26, 10, 16, 4, 18, 16, PALETTE.INK_BLACK, 2.5);
    cv.drawBezierCurve(38, 10, 48, 4, 46, 16, PALETTE.INK_BLACK, 2.5);
    cv.setPixel(18, 14, PALETTE.CINNABAR);
    cv.setPixel(46, 14, PALETTE.CINNABAR);

    // 지네의 복안 (발광 옥색)
    cv.setPixel(29, 10, PALETTE.SKY_CYAN);
    cv.setPixel(35, 10, PALETTE.SKY_CYAN);
  },

  // 9. 혼돈의 절대신 / 심연의 군주 (Chaos Overlord / Abyss Sovereign - 20 & 25 Stg)
  // 등 뒤의 거대한 만다라 광배, 4중 혼돈 촉수, 황금과 진홍의 절대 왕관
  boss_overlord: (cv) => {
    // 배경 만다라 신륜 (먹선과 황금 단청 링)
    for (let r = 18; r <= 28; r += 5) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const sx = 32 + Math.cos(a) * r;
        const sy = 30 + Math.sin(a) * r;
        cv.setPixel(sx, sy, PALETTE.GOLD);
      }
    }
    cv.drawSplatter(32, 30, 25, 26, PALETTE.INK_WASH);

    // 4중 혼돈 촉수 날개
    cv.drawBezierCurve(32, 28, 8, 12, 6, 36, PALETTE.INK_BLACK, 3.2);
    cv.drawBezierCurve(32, 28, 56, 12, 58, 36, PALETTE.INK_BLACK, 3.2);
    cv.drawBezierCurve(32, 36, 12, 48, 10, 62, PALETTE.INK_BLACK, 3.0);
    cv.drawBezierCurve(32, 36, 52, 48, 54, 62, PALETTE.INK_BLACK, 3.0);

    // 본체 (심연 감색과 진홍 로브)
    cv.fillInkEllipse(32, 32, 14, 18, PALETTE.CINNABAR, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK);

    // 머리와 황금 관
    cv.fillInkEllipse(32, 18, 8, 8, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(24, 13, 40, 13, PALETTE.GOLD, 2.2);
    cv.setPixel(32, 8, PALETTE.GOLD);
    cv.setPixel(27, 9, PALETTE.GOLD);
    cv.setPixel(37, 9, PALETTE.GOLD);

    // 절대신의 삼안 (중앙 진홍, 좌우 황금)
    cv.setPixel(29, 18, PALETTE.GOLD);
    cv.setPixel(35, 18, PALETTE.GOLD);
    cv.fillInkEllipse(32, 15, 1.5, 1.5, PALETTE.CINNABAR, PALETTE.BONE_WHITE, null);

    // 가슴의 혼돈 코어
    cv.fillInkEllipse(32, 32, 5, 5, PALETTE.GOLD, PALETTE.CINNABAR, PALETTE.INK_BLACK);
  },

  // 10. 심해 대왕 문어 (Kraken - 205 Stg)
  // 꿈틀거리는 8갈래 굵은 먹선 촉수, 군청/담묵 번짐, 단청 옥색 흡반
  boss_kraken: (cv) => {
    // 뿜어져 나오는 칠흑 먹물 안개
    cv.drawSplatter(32, 36, 40, 26, PALETTE.INK_BLACK);

    // 문어 머리 갓 (유선형 타원)
    cv.fillInkEllipse(32, 20, 16, 15, PALETTE.COBALT, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK);
    cv.fillInkEllipse(32, 18, 10, 9, PALETTE.SKY_CYAN, PALETTE.COBALT, null);

    // 거대한 황금빛 크라켄 눈
    cv.fillInkEllipse(24, 25, 4, 4, PALETTE.GOLD, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(40, 25, 4, 4, PALETTE.GOLD, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.setPixel(24, 25, PALETTE.INK_BLACK);
    cv.setPixel(40, 25, PALETTE.INK_BLACK);

    // 사방으로 뻗어 나가는 8갈래 유려한 촉수 (베지어 곡선)
    const tentaclePaths = [
      [24, 30, 8, 38, 4, 56],
      [28, 32, 16, 46, 12, 62],
      [32, 33, 26, 48, 24, 62],
      [32, 33, 38, 48, 40, 62],
      [36, 32, 48, 46, 52, 62],
      [40, 30, 56, 38, 60, 56]
    ];

    tentaclePaths.forEach(tp => {
      cv.drawBezierCurve(tp[0], tp[1], tp[2], tp[3], tp[4], tp[5], PALETTE.INK_BLACK, 3.2);
      cv.drawBezierCurve(tp[0], tp[1], tp[2], tp[3], tp[4], tp[5], PALETTE.COBALT, 1.8);
      // 빨판 (옥색 점)
      cv.setPixel(tp[2] - 1, tp[3], PALETTE.SKY_CYAN);
      cv.setPixel(tp[4] + 1, tp[5] - 2, PALETTE.SKY_CYAN);
    });
  },

  // 11. 강철 집게 타이탄 크랩 (Titan Crab - 210 Stg)
  // 압도적인 진사/다홍 거대 집게, 송연먹 견고한 갑각
  boss_titancrab: (cv) => {
    // 양쪽의 웅장한 대형 집게발
    // 좌측 집게
    cv.fillInkEllipse(12, 22, 10, 12, PALETTE.VERMILION, PALETTE.CINNABAR, PALETTE.INK_BLACK);
    cv.drawBezierCurve(6, 14, 10, 4, 18, 12, PALETTE.BONE_WHITE, 2.5); // 안쪽 이빨
    cv.drawBrushStroke(18, 28, 24, 36, PALETTE.INK_BLACK, 3.5);

    // 우측 집게
    cv.fillInkEllipse(52, 22, 10, 12, PALETTE.VERMILION, PALETTE.CINNABAR, PALETTE.INK_BLACK);
    cv.drawBezierCurve(58, 14, 54, 4, 46, 12, PALETTE.BONE_WHITE, 2.5);
    cv.drawBrushStroke(46, 28, 40, 36, PALETTE.INK_BLACK, 3.5);

    // 등딱지 본체 (단단한 묵암 갑각)
    cv.fillInkEllipse(32, 38, 18, 14, PALETTE.OCHRE, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(32, 36, 12, 9, PALETTE.VERMILION, PALETTE.OCHRE, null);

    // 돌출된 눈자루와 검은 눈
    cv.drawBrushStroke(27, 28, 26, 24, PALETTE.INK_BLACK, 1.8);
    cv.drawBrushStroke(37, 28, 38, 24, PALETTE.INK_BLACK, 1.8);
    cv.fillInkEllipse(26, 23, 2, 2, PALETTE.BONE_WHITE, PALETTE.INK_BLACK, null);
    cv.fillInkEllipse(38, 23, 2, 2, PALETTE.BONE_WHITE, PALETTE.INK_BLACK, null);

    // 걷는다리 마디 (갈필 붓질)
    cv.drawBrushStroke(20, 44, 10, 56, PALETTE.INK_BLACK, 2.6);
    cv.drawBrushStroke(24, 48, 18, 62, PALETTE.INK_BLACK, 2.6);
    cv.drawBrushStroke(44, 44, 54, 56, PALETTE.INK_BLACK, 2.6);
    cv.drawBrushStroke(40, 48, 46, 62, PALETTE.INK_BLACK, 2.6);
  },

  // 12. 심해의 지배자 레비아탄 (Leviathan - 215 Stg)
  // 바다를 가르는 고대 해룡, 비백(갈필) 파도 지느러미, 날카로운 백골 이빨
  boss_leviathan: (cv) => {
    // 배경 소용돌이치는 해류 잔상
    cv.drawBezierCurve(10, 50, 32, 60, 54, 44, PALETTE.SKY_CYAN, 2.2);

    // 해룡의 유선형 몸통 (대각선 역동적 구도)
    cv.drawBezierCurve(14, 54, 28, 36, 46, 24, PALETTE.INK_BLACK, 8.0);
    cv.drawBezierCurve(14, 54, 28, 36, 46, 24, PALETTE.COBALT, 5.0);

    // 머리와 큰 턱
    cv.fillInkEllipse(48, 22, 10, 8, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 날카로운 백골 이빨
    cv.drawBrushStroke(46, 26, 56, 24, PALETTE.BONE_WHITE, 1.5);
    cv.setPixel(50, 18, PALETTE.SKY_CYAN); // 안광

    // 갈필로 흩날리는 거대한 지느러미 날개
    cv.drawBezierCurve(34, 30, 26, 12, 12, 14, PALETTE.SKY_CYAN, 2.8);
    cv.drawBezierCurve(34, 30, 38, 10, 44, 6, PALETTE.PALE_CYAN, 2.2);
    cv.drawBezierCurve(26, 40, 14, 34, 6, 40, PALETTE.SKY_CYAN, 2.4);

    // 등줄기 가시 볏
    for (let i = 20; i <= 40; i += 5) {
      cv.drawBrushStroke(i, 44 - (i * 0.5), i - 2, 36 - (i * 0.5), PALETTE.BONE_WHITE, 1.4);
    }
  },

  // 13. 심연의 고대신 다곤 (Dagon - 220 Stg)
  // 반인반어 심연 신격, 빛나는 황금 삼지창, 심연 비늘과 고대 왕관
  boss_dagon: (cv) => {
    // 신성한 심해 후광 오라
    cv.fillInkEllipse(32, 28, 25, 25, PALETTE.INK_WASH, PALETTE.TRANSPARENT, null);

    // 삼지창 (우측에 웅장하게 선 신기)
    cv.drawBrushStroke(48, 6, 48, 58, PALETTE.GOLD, 2.2);
    // 삼지창 날 (호분 및 황금)
    cv.drawBrushStroke(44, 10, 52, 10, PALETTE.GOLD, 2.0);
    cv.drawBrushStroke(44, 4, 44, 12, PALETTE.BONE_WHITE, 1.8);
    cv.drawBrushStroke(48, 2, 48, 12, PALETTE.BONE_WHITE, 2.2);
    cv.drawBrushStroke(52, 4, 52, 12, PALETTE.BONE_WHITE, 1.8);

    // 고대신 본체 (단청 뇌록과 심연 감색 비늘)
    cv.fillInkEllipse(28, 34, 15, 18, PALETTE.ROD_GREEN, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK);

    // 머리와 지느러미 귀
    cv.fillInkEllipse(28, 18, 9, 8, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 지느러미 귀
    cv.drawBrushStroke(19, 18, 14, 14, PALETTE.SKY_CYAN, 1.8);
    cv.drawBrushStroke(37, 18, 42, 14, PALETTE.SKY_CYAN, 1.8);

    // 고대 심해 왕관 (황금)
    cv.drawBrushStroke(22, 12, 34, 12, PALETTE.GOLD, 2.2);
    cv.setPixel(24, 9, PALETTE.GOLD);
    cv.setPixel(28, 8, PALETTE.GOLD);
    cv.setPixel(32, 9, PALETTE.GOLD);

    // 빛나는 고대신의 황금 안광
    cv.setPixel(25, 18, PALETTE.GOLD);
    cv.setPixel(31, 18, PALETTE.GOLD);

    // 하반신 심연 해룡 지느러미 꼬리
    cv.drawBezierCurve(28, 46, 22, 56, 12, 62, PALETTE.INK_BLACK, 3.8);
    cv.drawBezierCurve(28, 46, 34, 56, 40, 62, PALETTE.INK_BLACK, 3.8);
  }
};

// 5. 빌드 실행 엔진
function buildAllSumieBosses() {
  const targetDir = path.resolve(__dirname, '../assets/sprites');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const keys = Object.keys(BOSS_BUILDERS);
  console.log(`[Sumie Boss Builder] 총 ${keys.length}종 보스 수묵화풍 64x64 PNG 생성 시작...`);

  let successCount = 0;
  keys.forEach((key) => {
    const cv = new SumieCanvas64();
    const builder = BOSS_BUILDERS[key];
    builder(cv);

    const pngBuffer = encodePNG64x64(cv.buffer);
    const filePath = path.join(targetDir, `${key}.png`);
    fs.writeFileSync(filePath, pngBuffer);
    successCount++;
  });

  console.log(`[Sumie Boss Builder] 성공: ${successCount}개 보스 수묵화 스프라이트 생성 완료 (${targetDir})`);
}

buildAllSumieBosses();
