// Anti Survivors - 수묵화풍(Ink-Wash) 30종 일반 몬스터 순수 Node.js PNG 빌더
// 외부 의존성(Canvas, npm 패키지) 없이 Node.js 내장 zlib, fs 모듈로 32x32 RGBA PNG를 직접 인코딩합니다.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. 단청 및 수묵화 전용 정밀 RGBA 컬러 팔레트 정의
const PALETTE = {
  TRANSPARENT: [0, 0, 0, 0],
  // 먹의 농담 (Shades of Pine-Soot Ink)
  INK_BLACK:   [12, 12, 16, 255],  // 송연먹 최고 농묵 (외곽선 및 핵심 음영)
  INK_DARK:    [34, 34, 42, 245],  // 짙은 먹색 (몸체 주름 및 갑각 음영)
  INK_MID:     [78, 80, 92, 215],  // 중묵 (골격 명암 및 근육선)
  INK_LIGHT:   [142, 145, 160, 160], // 담묵 (먹물 번짐 및 피부 베이스)
  INK_WASH:    [198, 202, 214, 90],  // 선염 담묵 (외곽 비백 및 잔상)
  BONE_WHITE:  [242, 244, 248, 255], // 호분 백색 (해골 뼈마디 및 안광 하이라이트)
  PALE_GREY:   [175, 180, 192, 230], // 석회 회백색

  // 단청 / 오방색 포인트 컬러 (절제된 채도 적용)
  CINNABAR:    [218, 38, 38, 255],   // 단청 진사(붉은색) - 안광, 혈흔, 교단 로브
  VERMILION:   [245, 86, 70, 255],   // 단청 다홍 - 갑각 강조, 활성 안광
  OCHRE:       [217, 138, 24, 255],  // 단청 황토(금황색) - 룬 문자, 골렘 코어, 아귀 발광체
  ROD_GREEN:   [34, 182, 95, 255],   // 단청 하엽/뇌록(청록빛 녹색) - 슬라임 핵, 고블린 피부
  MINT_PALE:   [134, 239, 172, 230], // 담청록 (슬라임 외곽 번짐)
  COBALT:      [28, 115, 215, 255],  // 단청 군청(깊은 청색) - 심해 마물 유선형 무늬
  SKY_CYAN:    [46, 188, 235, 230],  // 단청 옥색(발광 청록) - 플랑크톤, 유령 영기
  PALE_CYAN:   [165, 243, 252, 150], // 담옥색 번짐 (해파리 갓, 영체 잔상)
  ROYAL_PURPLE:[140, 52, 210, 255],  // 단청 자주 - 흑마도사 오라, 독침 가오리
  DEEP_INDIGO: [20, 24, 48, 255]     // 심연 감색 - 심연 거인 및 뱀 몸체
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

function encodePNG32x32(pixelBuffer) {
  const width = 32;
  const height = 32;
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
    rawData[rawOffset] = 0; // Filter type None
    pixelBuffer.copy(rawData, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 3. 32x32 수묵화 래스터 캔버스 도우미
class SumieCanvas {
  constructor() {
    this.width = 32;
    this.height = 32;
    this.buffer = Buffer.alloc(32 * 32 * 4);
  }

  setPixel(x, y, rgba) {
    if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
    const idx = (Math.floor(y) * 32 + Math.floor(x)) * 4;
    const srcA = rgba[3] / 255;
    if (srcA <= 0) return;

    if (srcA >= 1.0) {
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

  // 송연먹 타원형 묵염(선염 번짐) 채우기
  fillInkEllipse(cx, cy, rx, ry, innerColor, edgeColor, strokeColor = PALETTE.INK_BLACK) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
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
          // 외곽 송연먹선 (갈필 질감)
          this.setPixel(x, y, strokeColor);
        }
      }
    }
  }

  // 갈필(渴筆) 수묵 붓선 긋기
  drawBrushStroke(x0, y0, x1, y1, color, thickness = 1.2) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist * 2));
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
}

// 4. 몬스터 30종 수묵화풍(서양 다크 판타지 형태 + 굵은 먹선/농담/단청) 제너레이터 테이블
const ENEMY_BUILDERS = {
  // ===================== [월드 1: 심연의 부유섬 15종] =====================
  bat: (cv) => {
    // 거친 먹선 박쥐 날개막 (좌우 대칭 붓선)
    cv.drawBrushStroke(16, 14, 5, 8, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(5, 8, 2, 14, PALETTE.INK_DARK, 1.2);
    cv.drawBrushStroke(2, 14, 8, 17, PALETTE.INK_MID, 1.0);
    cv.drawBrushStroke(8, 17, 14, 18, PALETTE.INK_DARK, 1.0);
    cv.fillInkEllipse(7, 13, 4, 3, PALETTE.INK_MID, PALETTE.INK_WASH, null);

    cv.drawBrushStroke(16, 14, 27, 8, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(27, 8, 30, 14, PALETTE.INK_DARK, 1.2);
    cv.drawBrushStroke(30, 14, 24, 17, PALETTE.INK_MID, 1.0);
    cv.drawBrushStroke(24, 17, 18, 18, PALETTE.INK_DARK, 1.0);
    cv.fillInkEllipse(25, 13, 4, 3, PALETTE.INK_MID, PALETTE.INK_WASH, null);

    // 몸통 및 박쥐 귀
    cv.fillInkEllipse(16, 17, 4.5, 6, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(14, 12, 12, 7, PALETTE.INK_BLACK, 1.1);
    cv.drawBrushStroke(18, 12, 20, 7, PALETTE.INK_BLACK, 1.1);
    // 단청 진사 붉은 안광
    cv.setPixel(14, 15, PALETTE.CINNABAR);
    cv.setPixel(18, 15, PALETTE.CINNABAR);
  },

  slime: (cv) => {
    // 끈적이는 묵지(墨池) 웅덩이 형태와 단청 하엽(녹색) 코어
    cv.fillInkEllipse(16, 20, 10, 7, PALETTE.ROD_GREEN, PALETTE.INK_MID, PALETTE.INK_BLACK);
    cv.fillInkEllipse(16, 15, 7, 6, PALETTE.MINT_PALE, PALETTE.ROD_GREEN, PALETTE.INK_DARK);
    cv.fillInkEllipse(16, 12, 3, 2.5, PALETTE.BONE_WHITE, PALETTE.MINT_PALE, null);
    // 단청 먹방울 안구
    cv.setPixel(13, 17, PALETTE.INK_BLACK);
    cv.setPixel(14, 17, PALETTE.BONE_WHITE);
    cv.setPixel(18, 17, PALETTE.INK_BLACK);
    cv.setPixel(19, 17, PALETTE.BONE_WHITE);
    cv.drawBrushStroke(8, 25, 24, 25, PALETTE.INK_BLACK, 1.3);
  },

  miniSlime: (cv) => {
    cv.fillInkEllipse(16, 21, 6, 4.5, PALETTE.ROD_GREEN, PALETTE.INK_MID, PALETTE.INK_BLACK);
    cv.fillInkEllipse(16, 18, 4, 3.5, PALETTE.MINT_PALE, PALETTE.ROD_GREEN, null);
    cv.setPixel(14, 19, PALETTE.INK_BLACK);
    cv.setPixel(18, 19, PALETTE.INK_BLACK);
  },

  zombie: (cv) => {
    // 서양 구울 체형 + 썩어 흩날리는 담묵 살점과 옥색 안광
    cv.fillInkEllipse(16, 9, 4.5, 4.5, PALETTE.PALE_GREY, PALETTE.INK_MID, PALETTE.INK_BLACK);
    // 너덜너덜한 몸체와 어깨
    cv.drawBrushStroke(16, 14, 16, 24, PALETTE.INK_DARK, 3.0);
    cv.drawBrushStroke(10, 15, 7, 22, PALETTE.INK_MID, 1.8);
    cv.drawBrushStroke(22, 15, 25, 20, PALETTE.INK_MID, 1.8);
    cv.drawBrushStroke(13, 24, 12, 30, PALETTE.INK_DARK, 1.8);
    cv.drawBrushStroke(19, 24, 20, 30, PALETTE.INK_DARK, 1.8);
    // 번뜩이는 단청 옥색 눈과 핏빛 입
    cv.setPixel(14, 8, PALETTE.SKY_CYAN);
    cv.setPixel(17, 8, PALETTE.SKY_CYAN);
    cv.setPixel(15, 11, PALETTE.CINNABAR);
    cv.setPixel(16, 11, PALETTE.CINNABAR);
  },

  skeleton: (cv) => {
    // 백골(호분백)과 송연먹선 골격 + 타오르는 주사 안광
    cv.fillInkEllipse(16, 9, 4.5, 4.5, PALETTE.BONE_WHITE, PALETTE.PALE_GREY, PALETTE.INK_BLACK);
    // 눈구멍 (먹빛) 속에 붉은 부활 불꽃
    cv.setPixel(14, 9, PALETTE.INK_BLACK);
    cv.setPixel(15, 9, PALETTE.CINNABAR);
    cv.setPixel(17, 9, PALETTE.INK_BLACK);
    cv.setPixel(18, 9, PALETTE.CINNABAR);
    // 치아 먹선
    cv.drawBrushStroke(14, 12, 18, 12, PALETTE.INK_BLACK, 0.8);
    // 척추 및 갈비뼈 (먹선)
    cv.drawBrushStroke(16, 14, 16, 24, PALETTE.BONE_WHITE, 1.6);
    cv.drawBrushStroke(12, 16, 20, 16, PALETTE.INK_BLACK, 0.8);
    cv.drawBrushStroke(13, 19, 19, 19, PALETTE.INK_BLACK, 0.8);
    // 골반 및 팔다리
    cv.drawBrushStroke(12, 24, 10, 31, PALETTE.BONE_WHITE, 1.4);
    cv.drawBrushStroke(20, 24, 22, 31, PALETTE.BONE_WHITE, 1.4);
    cv.drawBrushStroke(11, 15, 7, 23, PALETTE.BONE_WHITE, 1.2);
    cv.drawBrushStroke(21, 15, 25, 23, PALETTE.BONE_WHITE, 1.2);
  },

  goblin: (cv) => {
    // 뾰족한 고블린 귀와 단청 뇌록 피부 + 거친 먹선 단도
    cv.fillInkEllipse(16, 11, 4.5, 4.5, PALETTE.ROD_GREEN, PALETTE.INK_MID, PALETTE.INK_BLACK);
    cv.drawBrushStroke(12, 10, 6, 7, PALETTE.ROD_GREEN, 1.2); // 좌측 뾰족귀
    cv.drawBrushStroke(20, 10, 26, 7, PALETTE.ROD_GREEN, 1.2); // 우측 뾰족귀
    // 노란 황토 눈과 사악한 입
    cv.setPixel(14, 11, PALETTE.OCHRE);
    cv.setPixel(18, 11, PALETTE.OCHRE);
    // 가죽 조끼 및 몸통
    cv.fillInkEllipse(16, 19, 4, 5, PALETTE.INK_DARK, PALETTE.INK_MID, PALETTE.INK_BLACK);
    cv.drawBrushStroke(13, 24, 12, 30, PALETTE.INK_BLACK, 1.5);
    cv.drawBrushStroke(19, 24, 20, 30, PALETTE.INK_BLACK, 1.5);
    // 단도 (먹선+호분 칼날)
    cv.drawBrushStroke(22, 18, 27, 22, PALETTE.BONE_WHITE, 1.2);
    cv.setPixel(28, 23, PALETTE.INK_BLACK);
  },

  ghost: (cv) => {
    // 비백(갈필)처럼 흩어지는 하단 묵흔 + 단청 옥색 영기
    cv.fillInkEllipse(16, 12, 6, 6, PALETTE.PALE_CYAN, PALETTE.INK_WASH, PALETTE.INK_LIGHT);
    cv.fillInkEllipse(16, 11, 3.5, 3.5, PALETTE.BONE_WHITE, PALETTE.PALE_CYAN, null);
    // 번지는 유령 꼬리
    cv.drawBrushStroke(13, 17, 10, 26, PALETTE.PALE_CYAN, 2.0);
    cv.drawBrushStroke(16, 18, 16, 29, PALETTE.INK_WASH, 2.2);
    cv.drawBrushStroke(19, 17, 22, 26, PALETTE.PALE_CYAN, 2.0);
    // 깊은 먹빛 눈구멍
    cv.setPixel(14, 11, PALETTE.INK_BLACK);
    cv.setPixel(18, 11, PALETTE.INK_BLACK);
    cv.setPixel(16, 14, PALETTE.INK_DARK);
  },

  gargoyle: (cv) => {
    // 석상 질감의 묵직한 돌날개 + 송연먹 발톱
    cv.drawBrushStroke(16, 13, 4, 6, PALETTE.INK_BLACK, 2.0);
    cv.drawBrushStroke(4, 6, 6, 17, PALETTE.INK_MID, 1.5);
    cv.drawBrushStroke(16, 13, 28, 6, PALETTE.INK_BLACK, 2.0);
    cv.drawBrushStroke(28, 6, 26, 17, PALETTE.INK_MID, 1.5);
    // 석수 몸통
    cv.fillInkEllipse(16, 17, 5.5, 7, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 뿔 및 붉은 안광
    cv.drawBrushStroke(13, 10, 10, 6, PALETTE.INK_BLACK, 1.2);
    cv.drawBrushStroke(19, 10, 22, 6, PALETTE.INK_BLACK, 1.2);
    cv.setPixel(14, 12, PALETTE.CINNABAR);
    cv.setPixel(18, 12, PALETTE.CINNABAR);
  },

  cultist: (cv) => {
    // 단청 진사(붉은 주사) 로브 + 깊은 송연먹 후드 속 황금 안광
    cv.fillInkEllipse(16, 9, 4.5, 4.5, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.setPixel(14, 9, PALETTE.OCHRE);
    cv.setPixel(17, 9, PALETTE.OCHRE);
    // 핏빛 예복 (선염 주사 먹선)
    cv.drawBrushStroke(16, 13, 10, 29, PALETTE.CINNABAR, 2.5);
    cv.drawBrushStroke(16, 13, 22, 29, PALETTE.CINNABAR, 2.5);
    cv.fillInkEllipse(16, 20, 5, 8, PALETTE.CINNABAR, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 저주 의식 완장
    cv.drawBrushStroke(13, 18, 19, 18, PALETTE.OCHRE, 0.8);
  },

  assassin: (cv) => {
    // 묵연(먹구름)처럼 휘날리는 망토 + 은빛 먹선 비수
    cv.fillInkEllipse(16, 8, 4, 4, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(16, 12, 10, 28, PALETTE.INK_BLACK, 2.6);
    cv.drawBrushStroke(16, 12, 23, 26, PALETTE.INK_DARK, 2.2);
    // 눈가리개 틈새의 번뜩이는 안광
    cv.drawBrushStroke(13, 8, 19, 8, PALETTE.INK_BLACK, 1.0);
    cv.setPixel(15, 8, PALETTE.BONE_WHITE);
    cv.setPixel(17, 8, PALETTE.BONE_WHITE);
    // 이도류 단도
    cv.drawBrushStroke(8, 20, 4, 25, PALETTE.BONE_WHITE, 1.2);
    cv.drawBrushStroke(24, 18, 28, 23, PALETTE.BONE_WHITE, 1.2);
  },

  golem: (cv) => {
    // 바위 결마다 굵은 농묵 갈필과 단청 황토 룬 균열
    cv.fillInkEllipse(16, 16, 11, 10, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(16, 10, 6, 5, PALETTE.INK_MID, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 어깨 거석
    cv.fillInkEllipse(6, 14, 4, 4, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(26, 14, 4, 4, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 황토 룬 균열선 (가슴 코어)
    cv.drawBrushStroke(12, 16, 20, 16, PALETTE.OCHRE, 1.0);
    cv.drawBrushStroke(16, 13, 16, 20, PALETTE.OCHRE, 1.0);
    cv.setPixel(14, 10, PALETTE.OCHRE);
    cv.setPixel(18, 10, PALETTE.OCHRE);
    // 육중한 다리
    cv.drawBrushStroke(11, 24, 10, 31, PALETTE.INK_BLACK, 2.5);
    cv.drawBrushStroke(21, 24, 22, 31, PALETTE.INK_BLACK, 2.5);
  },

  darkMage: (cv) => {
    // 칠흑 로브 + 단청 자청(보라) 마도 오라와 지팡이 보주
    cv.fillInkEllipse(16, 8, 4.5, 4.5, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.setPixel(15, 8, PALETTE.SKY_CYAN);
    cv.setPixel(17, 8, PALETTE.SKY_CYAN);
    // 마도사 로브
    cv.drawBrushStroke(16, 12, 11, 29, PALETTE.ROYAL_PURPLE, 2.4);
    cv.drawBrushStroke(16, 12, 21, 29, PALETTE.INK_DARK, 2.4);
    cv.fillInkEllipse(16, 19, 5, 7, PALETTE.INK_DARK, PALETTE.ROYAL_PURPLE, PALETTE.INK_BLACK);
    // 마도 지팡이 & 떠오르는 구체
    cv.drawBrushStroke(25, 6, 25, 28, PALETTE.INK_BLACK, 1.2);
    cv.fillInkEllipse(25, 6, 3, 3, PALETTE.ROYAL_PURPLE, PALETTE.SKY_CYAN, PALETTE.INK_BLACK);
  },

  bloodHound: (cv) => {
    // 거친 털을 농묵 갈필로 표현한 맹견과 붉은 진사 안광
    cv.fillInkEllipse(18, 18, 8, 5, PALETTE.INK_DARK, PALETTE.INK_MID, PALETTE.INK_BLACK);
    cv.fillInkEllipse(10, 14, 4.5, 4, PALETTE.INK_BLACK, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 귀 및 주둥이
    cv.drawBrushStroke(12, 11, 15, 8, PALETTE.INK_BLACK, 1.2);
    cv.drawBrushStroke(9, 15, 5, 17, PALETTE.INK_BLACK, 1.5);
    // 번뜩이는 핏빛 눈
    cv.setPixel(8, 13, PALETTE.CINNABAR);
    cv.setPixel(11, 13, PALETTE.CINNABAR);
    // 달리는 네 다리
    cv.drawBrushStroke(12, 22, 8, 29, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(15, 22, 13, 30, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(22, 22, 26, 29, PALETTE.INK_BLACK, 1.4);
    cv.drawBrushStroke(24, 21, 28, 27, PALETTE.INK_BLACK, 1.4);
  },

  wraithSwarm: (cv) => {
    // 먹물이 휘감아 도는 원형 군단 소용돌이
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const sx = 16 + Math.cos(angle) * 8;
      const sy = 16 + Math.sin(angle) * 8;
      cv.fillInkEllipse(sx, sy, 3, 3, PALETTE.SKY_CYAN, PALETTE.INK_MID, PALETTE.INK_BLACK);
      cv.setPixel(sx, sy, PALETTE.BONE_WHITE);
    }
    cv.fillInkEllipse(16, 16, 4, 4, PALETTE.INK_BLACK, PALETTE.INK_DARK, null);
  },

  abyssTitan: (cv) => {
    // 칠흑의 거대 실루엣 + 핏빛 단청 균열과 압도적인 어깨
    cv.fillInkEllipse(16, 16, 12, 11, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    cv.fillInkEllipse(16, 8, 5, 4.5, PALETTE.INK_BLACK, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK);
    // 핏빛 가슴 틈새
    cv.drawBrushStroke(13, 14, 19, 18, PALETTE.CINNABAR, 1.2);
    cv.drawBrushStroke(19, 14, 13, 18, PALETTE.CINNABAR, 1.2);
    cv.setPixel(14, 8, PALETTE.VERMILION);
    cv.setPixel(18, 8, PALETTE.VERMILION);
    // 거대한 팔뚝
    cv.drawBrushStroke(7, 14, 3, 24, PALETTE.INK_BLACK, 2.8);
    cv.drawBrushStroke(25, 14, 29, 24, PALETTE.INK_BLACK, 2.8);
  },

  // ===================== [월드 2: 심해 대협곡 15종] =====================
  plankton: (cv) => {
    // 발광 청록 단청 코어 + 은은한 먹물 섬모
    cv.fillInkEllipse(16, 16, 4, 4, PALETTE.BONE_WHITE, PALETTE.SKY_CYAN, PALETTE.COBALT);
    cv.drawBrushStroke(16, 10, 16, 4, PALETTE.INK_MID, 0.8);
    cv.drawBrushStroke(16, 22, 16, 28, PALETTE.INK_MID, 0.8);
    cv.drawBrushStroke(10, 16, 4, 16, PALETTE.INK_MID, 0.8);
    cv.drawBrushStroke(22, 16, 28, 16, PALETTE.INK_MID, 0.8);
  },

  jellyfish: (cv) => {
    // 붓으로 살짝 찍어 누른 담묵 갓 + 하늘거리는 먹선 촉수
    cv.fillInkEllipse(16, 12, 9, 6, PALETTE.PALE_CYAN, PALETTE.SKY_CYAN, PALETTE.INK_BLACK);
    cv.drawBrushStroke(10, 16, 9, 28, PALETTE.COBALT, 1.0);
    cv.drawBrushStroke(13, 17, 13, 30, PALETTE.INK_MID, 1.0);
    cv.drawBrushStroke(16, 17, 16, 31, PALETTE.SKY_CYAN, 1.2);
    cv.drawBrushStroke(19, 17, 19, 30, PALETTE.INK_MID, 1.0);
    cv.drawBrushStroke(22, 16, 23, 28, PALETTE.COBALT, 1.0);
  },

  hermitCrab: (cv) => {
    // 단단한 소라껍질 먹선 질감 + 다홍빛 단청 집게발
    cv.fillInkEllipse(17, 13, 8, 7, PALETTE.OCHRE, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 소라 나선 먹선
    cv.drawBrushStroke(14, 10, 20, 15, PALETTE.INK_BLACK, 1.1);
    // 다홍 집게발
    cv.fillInkEllipse(8, 20, 3.5, 3.5, PALETTE.VERMILION, PALETTE.CINNABAR, PALETTE.INK_BLACK);
    cv.fillInkEllipse(24, 20, 3.5, 3.5, PALETTE.VERMILION, PALETTE.CINNABAR, PALETTE.INK_BLACK);
    cv.setPixel(14, 18, PALETTE.INK_BLACK);
    cv.setPixel(18, 18, PALETTE.INK_BLACK);
    // 기어가는 다리
    cv.drawBrushStroke(11, 23, 8, 28, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(21, 23, 24, 28, PALETTE.INK_BLACK, 1.0);
  },

  flyingFish: (cv) => {
    // 유선형 날치 체형 + 먹선 지느러미 날개
    cv.fillInkEllipse(16, 16, 9, 4, PALETTE.COBALT, PALETTE.SKY_CYAN, PALETTE.INK_BLACK);
    // 좌우로 크게 펼친 붓선 날개 지느러미
    cv.drawBrushStroke(16, 14, 8, 6, PALETTE.SKY_CYAN, 1.5);
    cv.drawBrushStroke(8, 6, 4, 10, PALETTE.INK_MID, 1.0);
    cv.drawBrushStroke(16, 14, 24, 6, PALETTE.SKY_CYAN, 1.5);
    cv.drawBrushStroke(24, 6, 28, 10, PALETTE.INK_MID, 1.0);
    // 꼬리지느러미
    cv.drawBrushStroke(7, 16, 3, 13, PALETTE.COBALT, 1.2);
    cv.drawBrushStroke(7, 16, 3, 19, PALETTE.COBALT, 1.2);
    cv.setPixel(23, 15, PALETTE.BONE_WHITE);
  },

  seaLobster: (cv) => {
    // 중후한 송연먹 갑각 + 진사 붉은 대형 집게
    cv.fillInkEllipse(16, 17, 5, 8, PALETTE.INK_DARK, PALETTE.CINNABAR, PALETTE.INK_BLACK);
    // 대형 진사 집게발 2개
    cv.fillInkEllipse(8, 10, 4.5, 4.5, PALETTE.CINNABAR, PALETTE.VERMILION, PALETTE.INK_BLACK);
    cv.fillInkEllipse(24, 10, 4.5, 4.5, PALETTE.CINNABAR, PALETTE.VERMILION, PALETTE.INK_BLACK);
    cv.drawBrushStroke(12, 14, 8, 12, PALETTE.INK_BLACK, 1.5);
    cv.drawBrushStroke(20, 14, 24, 12, PALETTE.INK_BLACK, 1.5);
    // 꼬리 마디
    cv.drawBrushStroke(13, 24, 19, 24, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(14, 27, 18, 27, PALETTE.INK_BLACK, 1.0);
  },

  stingray: (cv) => {
    // 선염(먹물 번짐) 마름모 가오리 날개 + 황금 단청 무늬
    cv.fillInkEllipse(16, 15, 12, 8, PALETTE.INK_MID, PALETTE.COBALT, PALETTE.INK_BLACK);
    cv.drawBrushStroke(16, 15, 16, 30, PALETTE.INK_BLACK, 1.4); // 가오리 꼬리
    // 등판 황금 반점
    cv.setPixel(14, 13, PALETTE.OCHRE);
    cv.setPixel(18, 13, PALETTE.OCHRE);
    cv.setPixel(16, 16, PALETTE.OCHRE);
  },

  coralGolem: (cv) => {
    // 산호빛 청록/홍색 단청 + 먹선 바위 골격
    cv.fillInkEllipse(16, 16, 10, 9, PALETTE.PALE_GREY, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 어깨 산호 가지
    cv.drawBrushStroke(10, 10, 5, 4, PALETTE.VERMILION, 1.5);
    cv.drawBrushStroke(5, 4, 3, 6, PALETTE.VERMILION, 1.0);
    cv.drawBrushStroke(22, 10, 27, 4, PALETTE.SKY_CYAN, 1.5);
    cv.drawBrushStroke(27, 4, 29, 6, PALETTE.SKY_CYAN, 1.0);
    cv.setPixel(14, 13, PALETTE.SKY_CYAN);
    cv.setPixel(18, 13, PALETTE.SKY_CYAN);
    cv.drawBrushStroke(12, 24, 10, 30, PALETTE.INK_BLACK, 2.2);
    cv.drawBrushStroke(20, 24, 22, 30, PALETTE.INK_BLACK, 2.2);
  },

  seaLeech: (cv) => {
    // 먹물 지렁이처럼 굽이치는 짙은 묵선과 붉은 흡반
    cv.drawBrushStroke(10, 8, 22, 14, PALETTE.INK_DARK, 2.5);
    cv.drawBrushStroke(22, 14, 11, 22, PALETTE.INK_BLACK, 2.5);
    cv.drawBrushStroke(11, 22, 20, 28, PALETTE.INK_DARK, 2.2);
    // 붉은 흡반 입
    cv.fillInkEllipse(9, 7, 3, 3, PALETTE.CINNABAR, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
  },

  anglerFish: (cv) => {
    // 묵빛 아귀 몸체 + 날카로운 백골 이빨 + 황금 단청 발광체
    cv.fillInkEllipse(17, 17, 9, 8, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 낚싯대 돌기 및 황금 등불
    cv.drawBrushStroke(19, 10, 14, 4, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(14, 4, 11, 6, PALETTE.INK_BLACK, 0.8);
    cv.fillInkEllipse(10, 7, 2.5, 2.5, PALETTE.BONE_WHITE, PALETTE.OCHRE, null);
    // 흉포한 턱과 백골 이빨
    cv.drawBrushStroke(20, 16, 26, 22, PALETTE.INK_BLACK, 1.2);
    cv.setPixel(22, 18, PALETTE.BONE_WHITE);
    cv.setPixel(24, 19, PALETTE.BONE_WHITE);
    cv.setPixel(19, 13, PALETTE.CINNABAR);
  },

  ghostJelly: (cv) => {
    // 백묵과 담묵으로 흐르는 심해 유령 해파리
    cv.fillInkEllipse(16, 12, 9, 6, PALETTE.BONE_WHITE, PALETTE.INK_WASH, PALETTE.INK_LIGHT);
    cv.drawBrushStroke(11, 17, 9, 29, PALETTE.INK_WASH, 1.2);
    cv.drawBrushStroke(16, 17, 16, 31, PALETTE.BONE_WHITE, 1.0);
    cv.drawBrushStroke(21, 17, 23, 29, PALETTE.INK_WASH, 1.2);
    cv.setPixel(14, 11, PALETTE.SKY_CYAN);
    cv.setPixel(18, 11, PALETTE.SKY_CYAN);
  },

  deepShark: (cv) => {
    // 심연 포식자 상어 유선형 실루엣과 백골 이빨
    cv.fillInkEllipse(16, 16, 11, 6, PALETTE.INK_DARK, PALETTE.INK_BLACK, PALETTE.INK_BLACK);
    // 등지느러미
    cv.drawBrushStroke(16, 10, 13, 4, PALETTE.INK_BLACK, 1.8);
    // 꼬리지느러미
    cv.drawBrushStroke(6, 16, 2, 9, PALETTE.INK_BLACK, 1.6);
    cv.drawBrushStroke(6, 16, 2, 23, PALETTE.INK_BLACK, 1.6);
    // 번뜩이는 눈과 이빨
    cv.setPixel(23, 14, PALETTE.BONE_WHITE);
    cv.drawBrushStroke(21, 18, 25, 18, PALETTE.BONE_WHITE, 0.8);
  },

  poisonRay: (cv) => {
    // 자청빛 단청 독침 가오리
    cv.fillInkEllipse(16, 15, 11, 7, PALETTE.ROYAL_PURPLE, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    cv.drawBrushStroke(16, 15, 16, 31, PALETTE.ROYAL_PURPLE, 1.5);
    cv.setPixel(16, 28, PALETTE.VERMILION); // 독침 끝
    cv.setPixel(13, 13, PALETTE.SKY_CYAN);
    cv.setPixel(19, 13, PALETTE.SKY_CYAN);
  },

  shadowEel: (cv) => {
    // 수묵 용처럼 요동치는 심연 먹빛 바다장어
    cv.drawBrushStroke(7, 24, 15, 18, PALETTE.INK_BLACK, 2.5);
    cv.drawBrushStroke(15, 18, 18, 10, PALETTE.COBALT, 2.4);
    cv.drawBrushStroke(18, 10, 26, 8, PALETTE.INK_BLACK, 2.2);
    // 장어 눈 및 수염
    cv.setPixel(25, 7, PALETTE.SKY_CYAN);
    cv.drawBrushStroke(26, 9, 30, 11, PALETTE.INK_MID, 0.8);
  },

  voidSeaSerpent: (cv) => {
    // 거대한 심연의 뱀, 굵은 갈필 비늘과 군청빛 단청
    cv.fillInkEllipse(16, 16, 10, 9, PALETTE.DEEP_INDIGO, PALETTE.COBALT, PALETTE.INK_BLACK);
    cv.fillInkEllipse(23, 11, 5, 4.5, PALETTE.INK_BLACK, PALETTE.DEEP_INDIGO, PALETTE.INK_BLACK);
    // 뱀의 붉은 혓바닥과 안광
    cv.setPixel(24, 10, PALETTE.CINNABAR);
    cv.drawBrushStroke(27, 12, 31, 11, PALETTE.CINNABAR, 0.8);
    // 등줄기 볏
    cv.drawBrushStroke(12, 8, 19, 9, PALETTE.SKY_CYAN, 1.2);
  },

  trilobite: (cv) => {
    // 황토와 송연먹선 마디가 층층이 새겨진 고대 삼엽충
    cv.fillInkEllipse(16, 16, 8, 11, PALETTE.OCHRE, PALETTE.INK_DARK, PALETTE.INK_BLACK);
    // 갑각 마디 늑골선
    cv.drawBrushStroke(10, 11, 22, 11, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(9, 15, 23, 15, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(9, 19, 23, 19, PALETTE.INK_BLACK, 1.0);
    cv.drawBrushStroke(10, 23, 22, 23, PALETTE.INK_BLACK, 1.0);
    // 안테나 촉각
    cv.drawBrushStroke(13, 7, 9, 3, PALETTE.INK_BLACK, 0.8);
    cv.drawBrushStroke(19, 7, 23, 3, PALETTE.INK_BLACK, 0.8);
  }
};

// 5. 빌드 실행 엔진
function buildAllSumieEnemies() {
  const targetDir = path.resolve(__dirname, '../assets/sprites');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const keys = Object.keys(ENEMY_BUILDERS);
  console.log(`[Sumie Enmey Builder] 총 ${keys.length}종 몬스터 수묵화풍 32x32 PNG 생성 시작...`);

  let successCount = 0;
  keys.forEach((key) => {
    const cv = new SumieCanvas();
    const builder = ENEMY_BUILDERS[key];
    builder(cv);

    const pngBuffer = encodePNG32x32(cv.buffer);
    const filePath = path.join(targetDir, `${key}.png`);
    fs.writeFileSync(filePath, pngBuffer);
    successCount++;
  });

  console.log(`[Sumie Enemy Builder] 성공: ${successCount}개 몬스터 스프라이트 생성 완료 (${targetDir})`);
}

buildAllSumieEnemies();
