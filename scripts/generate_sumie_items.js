// 순수 Node.js 기반 수묵화풍(Ink-Wash) 필드 장애물 및 드랍 아이템 PNG 생성 빌더
// 외부 의존성(npm canvas 등) 없이 순수 Node.js(fs, zlib, path)만으로 PNG 파일을 직접 바이너리 인코딩합니다.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- 1. 순수 바이너리 PNG 인코더 엔진 ---
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writePngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(calcCrc32(typeAndData), 8 + len);
  return chunk;
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  const rowSize = 1 + width * 4;
  const rawScanlines = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawScanlines[rowOffset] = 0; // Filter 0 (None)
    rgbaBuffer.copy(rawScanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth: 8
  ihdr[9] = 6;  // color type: RGBA (6)
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter: standard
  ihdr[12] = 0; // interlace: none

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = writePngChunk('IHDR', ihdr);
  const idatChunk = writePngChunk('IDAT', compressedData);
  const iendChunk = writePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// --- 2. 수묵화 전용 픽셀 캔버스 유틸리티 ---
class SumieCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buffer = Buffer.alloc(w * h * 4); // RGBA
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h || a <= 0) return;

    const idx = (y * this.w + x) * 4;
    const sa = a / 255;
    const da = this.buffer[idx + 3] / 255;
    const outA = sa + da * (1 - sa);

    if (outA > 0) {
      this.buffer[idx] = Math.min(255, Math.max(0, Math.round((r * sa + this.buffer[idx] * da * (1 - sa)) / outA)));
      this.buffer[idx + 1] = Math.min(255, Math.max(0, Math.round((g * sa + this.buffer[idx + 1] * da * (1 - sa)) / outA)));
      this.buffer[idx + 2] = Math.min(255, Math.max(0, Math.round((b * sa + this.buffer[idx + 2] * da * (1 - sa)) / outA)));
      this.buffer[idx + 3] = Math.min(255, Math.max(0, Math.round(outA * 255)));
    }
  }

  drawLine(x0, y0, x1, y1, width, color) {
    const [r, g, b, a = 255] = color;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const steps = Math.max(dx, dy) * 2;
    if (steps === 0) {
      this.fillCircle(x0, y0, width / 2, color);
      return;
    }
    const rad = width / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.fillCircle(x, y, rad, color);
    }
  }

  fillCircle(cx, cy, radius, color) {
    const [r, g, b, a = 255] = color;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.w - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.h - 1, Math.ceil(cy + radius));

    const r2 = radius * radius;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 <= r2) {
          const edgeDist = radius - Math.sqrt(d2);
          const edgeAlpha = edgeDist < 1.0 ? edgeDist * a : a;
          this.setPixel(x, y, r, g, b, edgeAlpha);
        }
      }
    }
  }

  fillPolygon(points, color) {
    if (points.length < 3) return;
    const [r, g, b, a = 255] = color;
    let minY = this.h;
    let maxY = 0;
    for (const p of points) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(this.h - 1, Math.ceil(maxY));

    for (let y = minY; y <= maxY; y++) {
      const nodeX = [];
      let j = points.length - 1;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[j];
        if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
          nodeX.push(p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x));
        }
        j = i;
      }
      nodeX.sort((v1, v2) => v1 - v2);
      for (let i = 0; i < nodeX.length; i += 2) {
        if (nodeX[i] >= this.w) break;
        if (nodeX[i + 1] > 0) {
          const startX = Math.max(0, Math.round(nodeX[i]));
          const endX = Math.min(this.w - 1, Math.round(nodeX[i + 1]));
          for (let x = startX; x <= endX; x++) {
            this.setPixel(x, y, r, g, b, a);
          }
        }
      }
    }
  }

  strokePolygon(points, width, color) {
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      this.drawLine(p1.x, p1.y, p2.x, p2.y, width, color);
    }
  }

  inkWash(cx, cy, rx, ry, color, maxAlpha = 180) {
    const [r, g, b] = color;
    const minX = Math.max(0, Math.floor(cx - rx));
    const maxX = Math.min(this.w - 1, Math.ceil(cx + rx));
    const minY = Math.max(0, Math.floor(cy - ry));
    const maxY = Math.min(this.h - 1, Math.ceil(cy + ry));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d <= 1.0) {
          const alpha = (1 - d * d) * maxAlpha;
          this.setPixel(x, y, r, g, b, alpha);
        }
      }
    }
  }

  toPngBuffer() {
    return encodeRGBAtoPNG(this.w, this.h, this.buffer);
  }
}

// --- 3. 개별 수묵화 오브젝트 렌더러 ---

// [장애물 1]: 바위 (obstacle_rock - 64x64) - 동양 산수화 부벽준(斧劈皴) 기암괴석
function createObstacleRock() {
  const cvs = new SumieCanvas(64, 64);

  // 바닥 짙은 담묵 그림자
  cvs.inkWash(32, 54, 26, 8, [15, 18, 22], 140);

  // 바위 기본 실루엣 다각형
  const rockPoly = [
    { x: 12, y: 53 }, { x: 8, y: 44 }, { x: 14, y: 28 }, { x: 22, y: 14 },
    { x: 30, y: 10 }, { x: 42, y: 12 }, { x: 52, y: 22 }, { x: 56, y: 38 },
    { x: 52, y: 53 }, { x: 32, y: 55 }
  ];
  cvs.fillPolygon(rockPoly, [38, 42, 48, 255]);

  // 부벽준(斧劈皴) 음영 절벽면 1 (중앙 어두운 면)
  cvs.fillPolygon([
    { x: 22, y: 14 }, { x: 34, y: 24 }, { x: 38, y: 48 }, { x: 24, y: 54 },
    { x: 14, y: 44 }, { x: 14, y: 28 }
  ], [24, 27, 32, 255]);

  // 부벽준 음영 절벽면 2 (우측 가장 어두운 면)
  cvs.fillPolygon([
    { x: 34, y: 24 }, { x: 52, y: 22 }, { x: 56, y: 38 }, { x: 52, y: 53 },
    { x: 38, y: 48 }
  ], [15, 17, 20, 255]);

  // 상단 능선 하이라이트 (백묵/담묵 터치)
  cvs.fillPolygon([
    { x: 22, y: 14 }, { x: 30, y: 10 }, { x: 42, y: 12 }, { x: 34, y: 24 }
  ], [110, 118, 128, 255]);
  cvs.drawLine(24, 13, 38, 12, 1.8, [180, 188, 198, 200]);

  // 짙은 송연묵 붓선 테두리
  cvs.strokePolygon(rockPoly, 2.5, [10, 12, 15, 255]);

  // 날카로운 도끼 자국 준법 먹선
  cvs.drawLine(30, 10, 34, 24, 2.0, [8, 10, 12, 255]);
  cvs.drawLine(34, 24, 38, 48, 2.2, [8, 10, 12, 255]);
  cvs.drawLine(22, 14, 14, 44, 1.8, [12, 14, 18, 240]);
  cvs.drawLine(34, 24, 52, 34, 1.8, [10, 12, 15, 240]);
  cvs.drawLine(18, 32, 28, 40, 1.5, [14, 16, 20, 220]);

  // 바위 틈새와 상단의 푸른 단청 묵태(이끼/풀포기)
  cvs.fillCircle(20, 24, 2.8, [34, 68, 48, 240]);
  cvs.fillCircle(22, 22, 2.0, [52, 98, 70, 250]);
  cvs.fillCircle(40, 16, 2.5, [30, 60, 42, 240]);
  cvs.fillCircle(42, 15, 1.8, [48, 92, 65, 250]);
  cvs.fillCircle(14, 46, 3.2, [28, 54, 38, 230]);
  cvs.fillCircle(38, 50, 3.0, [28, 54, 38, 230]);

  return cvs.toPngBuffer();
}

// [장애물 2]: 고목 나무 (obstacle_tree - 64x64) - 굽이치는 흑묵 등걸 고목
function createObstacleTree() {
  const cvs = new SumieCanvas(64, 64);

  // 바닥 흙 및 뿌리 담묵
  cvs.inkWash(32, 57, 24, 6, [20, 16, 12], 150);

  // 굵은 밑동 뿌리
  cvs.drawLine(32, 45, 16, 58, 6.0, [26, 18, 12, 255]);
  cvs.drawLine(32, 45, 48, 58, 6.0, [24, 16, 10, 255]);
  cvs.drawLine(32, 45, 32, 60, 7.0, [32, 22, 15, 255]);

  // 용틀임하며 굽이치는 주 줄기 (S자 곡선 붓질)
  cvs.drawLine(32, 48, 30, 36, 10.0, [38, 26, 18, 255]);
  cvs.drawLine(30, 36, 36, 26, 8.5, [34, 24, 16, 255]);
  cvs.drawLine(36, 26, 32, 16, 7.0, [30, 20, 14, 255]);

  // 뻗어나가는 잔가지
  cvs.drawLine(36, 28, 50, 20, 4.0, [24, 16, 12, 255]);
  cvs.drawLine(50, 20, 56, 14, 2.5, [18, 12, 8, 255]);
  cvs.drawLine(30, 34, 16, 24, 4.2, [24, 16, 12, 255]);
  cvs.drawLine(16, 24, 10, 18, 2.5, [18, 12, 8, 255]);
  cvs.drawLine(32, 16, 28, 8, 3.5, [20, 14, 10, 255]);
  cvs.drawLine(32, 16, 38, 7, 3.5, [20, 14, 10, 255]);

  // 고목 줄기 갈필(渴筆) 수묵 외곽 먹선
  cvs.drawLine(27, 48, 25, 36, 2.0, [8, 6, 5, 255]);
  cvs.drawLine(37, 48, 35, 36, 2.0, [8, 6, 5, 255]);
  cvs.drawLine(25, 36, 31, 26, 1.8, [8, 6, 5, 255]);
  cvs.drawLine(35, 36, 41, 26, 1.8, [8, 6, 5, 255]);

  // 수목 줄기 옹이 구멍
  cvs.fillCircle(33, 34, 2.8, [12, 8, 6, 255]);
  cvs.strokePolygon([
    { x: 31, y: 32 }, { x: 35, y: 32 }, { x: 36, y: 36 }, { x: 31, y: 36 }
  ], 1.2, [65, 48, 35, 240]);

  // 솔잎/단청 잎사귀 송침(松針) 태점 클러스터 (짙은 흑묵 + 암녹색)
  const foliageNodes = [
    { x: 14, y: 18, r: 10 }, { x: 26, y: 8, r: 11 }, { x: 40, y: 7, r: 11 },
    { x: 52, y: 15, r: 10 }, { x: 34, y: 15, r: 13 }, { x: 22, y: 22, r: 8 },
    { x: 44, y: 22, r: 8 }
  ];

  for (const f of foliageNodes) {
    // 짙은 먹색 덩어리
    cvs.fillCircle(f.x, f.y, f.r, [12, 24, 16, 240]);
    // 솔잎 녹색 담채
    cvs.fillCircle(f.x, f.y - 1, f.r * 0.75, [26, 62, 42, 245]);
    cvs.fillCircle(f.x - 1, f.y - 2, f.r * 0.45, [48, 108, 72, 230]);
    // 잎 겉면 먹선 태점
    cvs.fillCircle(f.x + f.r * 0.6, f.y + 1, 1.5, [6, 12, 8, 255]);
    cvs.fillCircle(f.x - f.r * 0.6, f.y - 1, 1.5, [6, 12, 8, 255]);
  }

  return cvs.toPngBuffer();
}

// [장애물 3]: 보물 궤짝 (obstacle_crate - 64x64) - 칠보 고풍 나무 궤짝
function createObstacleCrate() {
  const cvs = new SumieCanvas(64, 64);

  // 바닥 짙은 그림자
  cvs.inkWash(32, 54, 25, 7, [15, 12, 10], 160);

  // 상자 본체 (오동나무 고가구 원목 질감)
  const bodyPoly = [
    { x: 12, y: 24 }, { x: 52, y: 24 }, { x: 52, y: 52 }, { x: 12, y: 52 }
  ];
  cvs.fillPolygon(bodyPoly, [68, 44, 28, 255]);

  // 뚜껑 (두툼한 원목 덮개)
  const lidPoly = [
    { x: 9, y: 15 }, { x: 55, y: 15 }, { x: 53, y: 26 }, { x: 11, y: 26 }
  ];
  cvs.fillPolygon(lidPoly, [92, 60, 38, 255]);

  // 상자 정면 판자 가로 결 먹선
  cvs.drawLine(12, 33, 52, 33, 1.8, [36, 22, 14, 255]);
  cvs.drawLine(12, 42, 52, 42, 1.8, [36, 22, 14, 255]);

  // 고풍 놋쇠/황금 모서리 철물 보강 띠
  // 좌측 세로 쇠띠
  cvs.fillPolygon([{ x: 16, y: 24 }, { x: 21, y: 24 }, { x: 21, y: 52 }, { x: 16, y: 52 }], [185, 138, 48, 255]);
  // 우측 세로 쇠띠
  cvs.fillPolygon([{ x: 43, y: 24 }, { x: 48, y: 24 }, { x: 48, y: 52 }, { x: 43, y: 52 }], [185, 138, 48, 255]);
  // 덮개 놋쇠 테두리
  cvs.fillPolygon([{ x: 9, y: 22 }, { x: 55, y: 22 }, { x: 55, y: 26 }, { x: 9, y: 26 }], [210, 162, 60, 255]);

  // 중앙 전통 문양 자물쇠 판 (나비/태극 장석 형태)
  cvs.fillCircle(32, 29, 6.5, [220, 175, 68, 255]);
  cvs.fillCircle(32, 29, 3.5, [130, 92, 30, 255]);
  // 닫힌 자물통
  cvs.fillPolygon([{ x: 29, y: 31 }, { x: 35, y: 31 }, { x: 35, y: 38 }, { x: 29, y: 38 }], [195, 148, 52, 255]);
  cvs.fillCircle(32, 34, 1.2, [30, 20, 10, 255]); // 열쇠구멍

  // 놋쇠 장식 리벳 못(동병)
  const rivets = [
    { x: 18, y: 26 }, { x: 18, y: 38 }, { x: 18, y: 49 },
    { x: 46, y: 26 }, { x: 46, y: 38 }, { x: 46, y: 49 },
    { x: 13, y: 19 }, { x: 51, y: 19 }
  ];
  for (const rv of rivets) {
    cvs.fillCircle(rv.x, rv.y, 1.4, [50, 35, 15, 255]);
    cvs.fillCircle(rv.x - 0.5, rv.y - 0.5, 0.7, [255, 225, 140, 255]);
  }

  // 짙은 흑묵 외곽선 마감
  cvs.strokePolygon(bodyPoly, 2.5, [14, 10, 8, 255]);
  cvs.strokePolygon(lidPoly, 2.5, [14, 10, 8, 255]);

  return cvs.toPngBuffer();
}

// [월드 2 장애물 1]: 심해 산호 암초 바위 (obstacle_reef - 64x64) - 심해 기암괴석 & 형광 산호초
function createObstacleReef() {
  const cvs = new SumieCanvas(64, 64);

  // 심해 해저 바닥 짙은 청흑색 수묵 번짐
  cvs.inkWash(32, 54, 26, 8, [8, 16, 26], 160);

  // 기암 산호 암초 기본 실루엣 다각형 (날카롭고 웅장한 해저 바위)
  const reefPoly = [
    { x: 10, y: 54 }, { x: 6, y: 42 }, { x: 13, y: 26 }, { x: 20, y: 12 },
    { x: 28, y: 16 }, { x: 38, y: 8 }, { x: 48, y: 18 }, { x: 58, y: 34 },
    { x: 54, y: 54 }, { x: 32, y: 56 }
  ];
  cvs.fillPolygon(reefPoly, [20, 30, 44, 255]);

  // 심해 부벽준(斧劈皴) 음영 절벽면 1 (중앙 심해 청묵)
  cvs.fillPolygon([
    { x: 20, y: 12 }, { x: 32, y: 25 }, { x: 36, y: 50 }, { x: 22, y: 55 },
    { x: 13, y: 44 }, { x: 13, y: 26 }
  ], [12, 20, 32, 255]);

  // 심해 절벽면 2 (우측 가장 깊은 심연 음영)
  cvs.fillPolygon([
    { x: 32, y: 25 }, { x: 48, y: 18 }, { x: 58, y: 34 }, { x: 54, y: 54 },
    { x: 36, y: 50 }
  ], [8, 14, 22, 255]);

  // 암초 능선 하이라이트 (심해 청록빛 백묵 터치)
  cvs.fillPolygon([
    { x: 20, y: 12 }, { x: 28, y: 16 }, { x: 38, y: 8 }, { x: 32, y: 25 }
  ], [35, 75, 95, 255]);
  cvs.drawLine(22, 13, 36, 10, 1.8, [56, 189, 248, 180]);

  // 짙은 송연묵 붓선 테두리
  cvs.strokePolygon(reefPoly, 2.5, [5, 10, 16, 255]);

  // 날카로운 암초 균열 및 도끼자국 먹선
  cvs.drawLine(28, 16, 32, 25, 2.0, [4, 8, 12, 255]);
  cvs.drawLine(32, 25, 36, 50, 2.2, [4, 8, 12, 255]);
  cvs.drawLine(20, 12, 13, 44, 1.8, [6, 12, 18, 240]);
  cvs.drawLine(32, 25, 54, 32, 1.8, [5, 10, 15, 240]);
  cvs.drawLine(16, 34, 26, 42, 1.5, [8, 15, 22, 220]);

  // 좌측 솟아오른 붉은 수묵 산호 뿔 가지 (Coral Horn)
  cvs.fillPolygon([
    { x: 12, y: 30 }, { x: 7, y: 18 }, { x: 10, y: 14 }, { x: 16, y: 24 }
  ], [225, 45, 75, 255]);
  cvs.fillPolygon([
    { x: 9, y: 16 }, { x: 4, y: 10 }, { x: 7, y: 8 }, { x: 11, y: 14 }
  ], [244, 114, 138, 255]);
  cvs.strokePolygon([
    { x: 12, y: 30 }, { x: 7, y: 18 }, { x: 4, y: 10 }, { x: 7, y: 8 },
    { x: 10, y: 14 }, { x: 16, y: 24 }
  ], 1.2, [10, 5, 8, 255]);

  // 우측 단청 다홍빛 산호 분지
  cvs.fillPolygon([
    { x: 46, y: 24 }, { x: 55, y: 14 }, { x: 59, y: 17 }, { x: 50, y: 30 }
  ], [225, 45, 75, 255]);
  cvs.fillCircle(57, 13, 2.5, [251, 113, 133, 255]);
  cvs.fillCircle(50, 10, 1.8, [244, 63, 94, 255]);
  cvs.drawLine(55, 16, 50, 11, 1.5, [180, 20, 50, 255]);

  // 암초 표면 발광 따개비 및 청록 수묵 태점(苔點) 클러스터
  const barnacles = [
    { x: 22, y: 28, r: 3.2, c: [14, 165, 233] },
    { x: 25, y: 25, r: 2.0, c: [56, 189, 248] },
    { x: 42, y: 36, r: 3.5, c: [14, 165, 233] },
    { x: 44, y: 34, r: 2.2, c: [125, 211, 252] },
    { x: 33, y: 44, r: 2.8, c: [13, 148, 136] },
    { x: 17, y: 48, r: 3.0, c: [15, 118, 110] },
    { x: 49, y: 46, r: 2.6, c: [244, 63, 94] }
  ];
  for (const b of barnacles) {
    cvs.fillCircle(b.x, b.y, b.r, [5, 15, 25, 255]);
    cvs.fillCircle(b.x, b.y, b.r * 0.75, [...b.c, 245]);
    cvs.fillCircle(b.x - 0.5, b.y - 0.5, b.r * 0.35, [224, 242, 254, 255]); // 중심 발광 핵
    cvs.fillCircle(b.x, b.y, 0.8, [5, 10, 15, 255]); // 따개비 숨구멍
  }

  return cvs.toPngBuffer();
}

// [월드 2 장애물 2]: 거대 수묵 해초 (obstacle_kelp - 64x64) - 굽이치는 난초잎 수류 해초 기둥
function createObstacleKelp() {
  const cvs = new SumieCanvas(64, 64);

  // 해저 모래 및 해초 뿌리 담묵 침전
  cvs.inkWash(32, 57, 24, 6, [10, 30, 25], 160);

  // 단단한 해저 암반 부착기(Holdfast) 뿌리 덩어리
  cvs.fillCircle(32, 56, 8.0, [8, 25, 18, 255]);
  cvs.fillCircle(24, 57, 5.0, [6, 20, 15, 255]);
  cvs.fillCircle(40, 57, 5.0, [6, 20, 15, 255]);
  cvs.drawLine(32, 54, 18, 61, 3.5, [5, 18, 12, 255]);
  cvs.drawLine(32, 54, 46, 61, 3.5, [5, 18, 12, 255]);

  // [1] 좌측 해초 잎새 (물결치며 좌측으로 휘었다가 위로 향함)
  const leftFrond = [
    { x: 28, y: 54 }, { x: 18, y: 44 }, { x: 11, y: 32 }, { x: 14, y: 18 },
    { x: 18, y: 8 }, { x: 19, y: 14 }, { x: 17, y: 26 }, { x: 22, y: 38 },
    { x: 30, y: 52 }
  ];
  cvs.fillPolygon(leftFrond, [13, 95, 65, 255]);
  cvs.strokePolygon(leftFrond, 1.8, [4, 25, 15, 255]);
  cvs.drawLine(29, 53, 16, 22, 1.5, [52, 211, 153, 200]); // 잎맥 담채

  // [2] 우측 해초 잎새 (풍성하게 우측으로 너울거림)
  const rightFrond = [
    { x: 34, y: 53 }, { x: 42, y: 42 }, { x: 53, y: 33 }, { x: 52, y: 20 },
    { x: 45, y: 12 }, { x: 46, y: 18 }, { x: 46, y: 28 }, { x: 38, y: 40 },
    { x: 33, y: 52 }
  ];
  cvs.fillPolygon(rightFrond, [16, 115, 78, 255]);
  cvs.strokePolygon(rightFrond, 1.8, [5, 30, 20, 255]);
  cvs.drawLine(34, 52, 49, 24, 1.5, [110, 231, 183, 200]);

  // [3] 중앙 주 줄기 해초 (하늘 높이 용틀임하며 솟구침)
  const centerFrond = [
    { x: 30, y: 54 }, { x: 35, y: 43 }, { x: 27, y: 31 }, { x: 36, y: 19 },
    { x: 31, y: 6 }, { x: 35, y: 13 }, { x: 33, y: 24 }, { x: 39, y: 36 },
    { x: 34, y: 54 }
  ];
  cvs.fillPolygon(centerFrond, [5, 65, 45, 255]);
  cvs.strokePolygon(centerFrond, 2.2, [3, 18, 12, 255]);
  // 중앙 잎새 갈필(渴筆) 수묵 터치
  cvs.drawLine(32, 52, 33, 10, 1.8, [16, 185, 129, 230]);
  cvs.drawLine(33, 40, 29, 29, 1.2, [167, 243, 208, 220]);

  // 해초 줄기 곳곳에 맺힌 발광 공기주머니(Pneumatocyst / 수포 부낭)
  const bulbs = [
    { x: 22, y: 40, r: 3.2 },
    { x: 13, y: 28, r: 2.8 },
    { x: 40, y: 41, r: 3.5 },
    { x: 48, y: 27, r: 3.0 },
    { x: 30, y: 32, r: 2.8 },
    { x: 34, y: 20, r: 2.4 }
  ];
  for (const b of bulbs) {
    cvs.fillCircle(b.x, b.y, b.r, [4, 40, 25, 255]);
    cvs.fillCircle(b.x, b.y, b.r * 0.75, [16, 185, 129, 245]);
    cvs.fillCircle(b.x - 0.6, b.y - 0.6, b.r * 0.35, [209, 250, 229, 255]);
    cvs.fillCircle(b.x, b.y, 0.7, [2, 20, 12, 255]);
  }

  // 주변을 떠도는 심해 미세 유기물 기포 먹점
  cvs.fillCircle(20, 12, 1.2, [52, 211, 153, 200]);
  cvs.fillCircle(43, 8, 1.5, [110, 231, 183, 220]);
  cvs.fillCircle(26, 4, 1.0, [209, 250, 229, 240]);

  return cvs.toPngBuffer();
}

// [월드 2 장애물 3]: 침몰선 수묵 보물궤짝 (obstacle_chest - 64x64) - 청동 녹청 & 해조류가 덮인 침몰선 목제 궤짝
function createObstacleChest() {
  const cvs = new SumieCanvas(64, 64);

  // 바닥 짙은 해저 침전 그림자
  cvs.inkWash(32, 54, 25, 7, [10, 18, 22], 170);

  // 상자 본체 (해수에 절어 검푸른빛을 띠는 침몰선 오크 목재)
  const bodyPoly = [
    { x: 12, y: 25 }, { x: 52, y: 25 }, { x: 52, y: 52 }, { x: 12, y: 52 }
  ];
  cvs.fillPolygon(bodyPoly, [18, 52, 56, 255]);

  // 뚜껑 (둥근 돔형 아치 덮개)
  const lidPoly = [
    { x: 9, y: 25 }, { x: 11, y: 15 }, { x: 22, y: 11 }, { x: 42, y: 11 },
    { x: 53, y: 15 }, { x: 55, y: 25 }
  ];
  cvs.fillPolygon(lidPoly, [24, 72, 78, 255]);

  // 상자 본체 목재 판자 틈새 먹선
  cvs.drawLine(12, 34, 52, 34, 1.8, [8, 28, 30, 255]);
  cvs.drawLine(12, 43, 52, 43, 1.8, [8, 28, 30, 255]);
  cvs.drawLine(11, 19, 53, 19, 1.5, [12, 38, 42, 255]);

  // 산화되어 청록색 녹청(Patina)이 슨 황동 쇠띠
  // 좌측 세로 쇠띠
  cvs.fillPolygon([{ x: 16, y: 25 }, { x: 21, y: 25 }, { x: 21, y: 52 }, { x: 16, y: 52 }], [20, 140, 120, 255]);
  // 우측 세로 쇠띠
  cvs.fillPolygon([{ x: 43, y: 25 }, { x: 48, y: 25 }, { x: 48, y: 52 }, { x: 43, y: 52 }], [20, 140, 120, 255]);
  // 덮개 테두리 황동 띠
  cvs.fillPolygon([{ x: 9, y: 22 }, { x: 55, y: 22 }, { x: 55, y: 26 }, { x: 9, y: 26 }], [45, 175, 145, 255]);
  cvs.fillPolygon([{ x: 16, y: 12 }, { x: 21, y: 12 }, { x: 21, y: 25 }, { x: 16, y: 25 }], [20, 140, 120, 255]);
  cvs.fillPolygon([{ x: 43, y: 12 }, { x: 48, y: 12 }, { x: 48, y: 25 }, { x: 43, y: 25 }], [20, 140, 120, 255]);

  // 황금빛 힌지와 금박 잔여 흔적
  cvs.drawLine(17, 23, 20, 23, 1.5, [234, 179, 8, 255]);
  cvs.drawLine(44, 23, 47, 23, 1.5, [234, 179, 8, 255]);

  // 중앙 해적 문양/봉인 황동 자물쇠 판
  cvs.fillCircle(32, 30, 6.5, [30, 160, 135, 255]);
  cvs.fillCircle(32, 30, 3.5, [15, 85, 75, 255]);
  // 녹슨 황금빛 자물통
  cvs.fillPolygon([{ x: 29, y: 32 }, { x: 35, y: 32 }, { x: 35, y: 39 }, { x: 29, y: 39 }], [202, 138, 4, 255]);
  cvs.fillCircle(32, 35, 1.2, [10, 20, 22, 255]); // 열쇠구멍

  // 쇠띠 고정 황동 리벳 못(동병)
  const rivets = [
    { x: 18, y: 27 }, { x: 18, y: 38 }, { x: 18, y: 49 },
    { x: 46, y: 27 }, { x: 46, y: 38 }, { x: 46, y: 49 },
    { x: 18, y: 16 }, { x: 46, y: 16 }
  ];
  for (const rv of rivets) {
    cvs.fillCircle(rv.x, rv.y, 1.4, [10, 45, 40, 255]);
    cvs.fillCircle(rv.x - 0.5, rv.y - 0.5, 0.7, [153, 246, 228, 255]);
  }

  // 궤짝 표면에 달라붙은 심해 따개비 & 해조류
  cvs.fillCircle(13, 47, 2.2, [244, 63, 94, 255]);
  cvs.fillCircle(13, 47, 0.8, [15, 23, 42, 255]);
  cvs.fillCircle(50, 48, 2.5, [14, 165, 233, 255]);
  cvs.fillCircle(50, 48, 0.9, [15, 23, 42, 255]);
  cvs.fillCircle(11, 28, 1.8, [16, 185, 129, 255]);
  // 덮개 위에 살짝 얹힌 물풀 조각
  cvs.drawLine(35, 11, 41, 8, 1.6, [16, 185, 129, 240]);
  cvs.drawLine(41, 8, 45, 11, 1.4, [5, 150, 105, 240]);

  // 짙은 흑묵 외곽선 마감
  cvs.strokePolygon(bodyPoly, 2.5, [6, 18, 20, 255]);
  cvs.strokePolygon(lidPoly, 2.5, [6, 18, 20, 255]);

  return cvs.toPngBuffer();
}

// [특수 아이템 1]: 서예 나침반 / 자석 (item_magnet - 32x32) - 단청 태극 지남철 자석
function createItemMagnet() {
  const cvs = new SumieCanvas(32, 32);

  // 푸른빛/붉은빛 수묵 자기장 기운 링
  cvs.inkWash(16, 16, 14, 14, [56, 189, 248], 110);

  // 말굽 자석 실루엣 (좌측 붉은 주사극, 우측 푸른 청람극)
  // 좌측(N극 - 붉은 주사)
  cvs.fillPolygon([
    { x: 6, y: 24 }, { x: 12, y: 24 }, { x: 12, y: 13 }, { x: 16, y: 7 },
    { x: 11, y: 7 }, { x: 6, y: 13 }
  ], [220, 38, 38, 255]);

  // 우측(S극 - 청람옥)
  cvs.fillPolygon([
    { x: 26, y: 24 }, { x: 20, y: 24 }, { x: 20, y: 13 }, { x: 16, y: 7 },
    { x: 21, y: 7 }, { x: 26, y: 13 }
  ], [37, 99, 235, 255]);

  // 중심 둥근 아치 만곡부
  cvs.fillCircle(16, 11, 4.0, [20, 24, 30, 255]);

  // 양 끝단 은백색 놋쇠 팁
  cvs.fillPolygon([{ x: 6, y: 20 }, { x: 12, y: 20 }, { x: 12, y: 25 }, { x: 6, y: 25 }], [226, 232, 240, 255]);
  cvs.fillPolygon([{ x: 20, y: 20 }, { x: 26, y: 20 }, { x: 26, y: 25 }, { x: 20, y: 25 }], [226, 232, 240, 255]);

  // 강렬한 송연묵 윤곽선
  cvs.strokePolygon([
    { x: 6, y: 25 }, { x: 12, y: 25 }, { x: 12, y: 14 }, { x: 20, y: 14 },
    { x: 20, y: 25 }, { x: 26, y: 25 }, { x: 26, y: 13 }, { x: 16, y: 6 },
    { x: 6, y: 13 }
  ], 1.8, [8, 10, 14, 255]);

  // 자기력 먹물 파동 호
  cvs.drawLine(7, 27, 11, 27, 1.2, [239, 68, 68, 255]);
  cvs.drawLine(21, 27, 25, 27, 1.2, [59, 130, 246, 255]);

  return cvs.toPngBuffer();
}

// [특수 아이템 2]: 단청 주사 폭탄 (item_bomb - 32x32) - 비격진천뢰(飛擊震天雷)
function createItemBomb() {
  const cvs = new SumieCanvas(32, 32);

  // 바닥 붉은 폭발 화기 담묵
  cvs.inkWash(16, 18, 13, 13, [239, 68, 68], 90);

  // 검은 무쇠 구체 (지름 약 18px)
  cvs.fillCircle(16, 18, 9.0, [28, 32, 38, 255]);
  cvs.fillCircle(14, 15, 6.0, [48, 54, 64, 255]);
  cvs.fillCircle(12, 13, 2.5, [110, 120, 135, 240]); // 광택

  // 둘레를 감싼 붉은 주사(朱砂) 봉인 부적 띠
  cvs.fillPolygon([
    { x: 8, y: 17 }, { x: 24, y: 17 }, { x: 23, y: 22 }, { x: 9, y: 22 }
  ], [220, 38, 38, 255]);
  // 부적 위 황금 먹선 글귀
  cvs.drawLine(11, 19, 21, 19, 1.2, [254, 240, 138, 255]);
  cvs.fillCircle(13, 20, 0.8, [254, 240, 138, 255]);
  cvs.fillCircle(18, 20, 0.8, [254, 240, 138, 255]);

  // 상단 놋쇠 도화선 마개
  cvs.fillPolygon([{ x: 14, y: 7 }, { x: 18, y: 7 }, { x: 17, y: 10 }, { x: 15, y: 10 }], [190, 140, 50, 255]);

  // 꼬여 올라가는 도화선 새끼줄
  cvs.drawLine(16, 7, 20, 4, 1.6, [140, 90, 40, 255]);

  // 타오르는 주사 먹물 불꽃 스파크
  cvs.fillCircle(21, 3, 2.2, [245, 158, 11, 255]);
  cvs.fillCircle(22, 2, 1.2, [254, 240, 138, 255]);
  cvs.fillCircle(24, 3, 0.8, [239, 68, 68, 255]);
  cvs.fillCircle(19, 1, 0.8, [239, 68, 68, 255]);

  // 짙은 흑묵 외곽선
  cvs.fillCircle(16, 18, 9.2, [8, 10, 12, 120]);

  return cvs.toPngBuffer();
}

// [특수 아이템 3]: 한기 빙결 옥령석 (item_freeze - 32x32) - 서빙고 한기 옥(玉)
function createItemFreeze() {
  const cvs = new SumieCanvas(32, 32);

  // 차가운 청백색 한기 안개 수묵 번짐
  cvs.inkWash(16, 16, 14, 14, [165, 243, 252], 130);

  // 팔각 빙결 옥석 결정
  const icePoly = [
    { x: 16, y: 4 }, { x: 25, y: 9 }, { x: 28, y: 18 }, { x: 23, y: 26 },
    { x: 16, y: 29 }, { x: 9, y: 26 }, { x: 4, y: 18 }, { x: 7, y: 9 }
  ];
  cvs.fillPolygon(icePoly, [14, 116, 144, 255]); // 심해 청록

  // 내부 맑은 빙옥 층
  cvs.fillPolygon([
    { x: 16, y: 7 }, { x: 22, y: 11 }, { x: 24, y: 18 }, { x: 20, y: 24 },
    { x: 16, y: 26 }, { x: 12, y: 24 }, { x: 8, y: 18 }, { x: 10, y: 11 }
  ], [56, 189, 248, 255]);

  // 중심 영롱한 서리 백옥 핵
  cvs.fillPolygon([
    { x: 16, y: 11 }, { x: 20, y: 14 }, { x: 19, y: 20 }, { x: 16, y: 22 },
    { x: 13, y: 20 }, { x: 12, y: 14 }
  ], [224, 242, 254, 255]);
  cvs.fillCircle(15, 14, 2.0, [255, 255, 255, 255]);

  // 빙렬(氷裂) 날카로운 묵선
  cvs.drawLine(16, 4, 16, 29, 1.5, [6, 44, 62, 240]);
  cvs.drawLine(4, 18, 28, 18, 1.5, [6, 44, 62, 240]);
  cvs.drawLine(7, 9, 23, 26, 1.2, [8, 50, 70, 220]);

  // 짙은 흑묵 테두리
  cvs.strokePolygon(icePoly, 1.8, [4, 26, 38, 255]);

  return cvs.toPngBuffer();
}

// [특수 아이템 4]: 신선 백자 호리병 (item_heal - 32x32) - 仙丹 葫蘆
function createItemHeal() {
  const cvs = new SumieCanvas(32, 32);

  // 상서로운 청록빛 약기운 번짐
  cvs.inkWash(16, 17, 13, 13, [34, 197, 94], 100);

  // 백자 표주박 하단 볼록체 (지름 15)
  cvs.fillCircle(16, 21, 7.5, [226, 232, 240, 255]);
  // 백자 표주박 상단 볼록체 (지름 11)
  cvs.fillCircle(16, 11, 5.0, [241, 245, 249, 255]);

  // 도자기 하이라이트
  cvs.fillCircle(14, 19, 3.2, [255, 255, 255, 240]);
  cvs.fillCircle(14, 10, 2.0, [255, 255, 255, 240]);

  // 병목 주사 붉은 명주실 매듭 끈
  cvs.fillPolygon([{ x: 12, y: 14 }, { x: 20, y: 14 }, { x: 20, y: 17 }, { x: 12, y: 17 }], [220, 38, 38, 255]);
  // 늘어진 노리개 술
  cvs.drawLine(18, 16, 22, 24, 1.4, [185, 28, 28, 255]);
  cvs.fillCircle(22, 24, 1.2, [239, 68, 68, 255]);

  // 상단 황금 나무 마개
  cvs.fillPolygon([{ x: 14, y: 5 }, { x: 18, y: 5 }, { x: 18, y: 7 }, { x: 14, y: 7 }], [180, 130, 45, 255]);

  // 짙은 먹선 외곽선
  cvs.fillCircle(16, 21, 7.6, [15, 23, 42, 60]);
  cvs.drawLine(10, 18, 9, 23, 1.6, [15, 23, 42, 255]);
  cvs.drawLine(22, 18, 23, 23, 1.6, [15, 23, 42, 255]);
  cvs.drawLine(12, 8, 11, 13, 1.5, [15, 23, 42, 255]);
  cvs.drawLine(20, 8, 21, 13, 1.5, [15, 23, 42, 255]);

  return cvs.toPngBuffer();
}

// [특수 아이템 5]: 상평통보 엽전 (item_gold - 24x24) - 常平通寶
function createItemGold() {
  const cvs = new SumieCanvas(24, 24);

  // 황금빛 영롱한 기운
  cvs.inkWash(12, 12, 10, 10, [245, 158, 11], 120);

  // 둥근 놋쇠 엽전 외형 (반경 9)
  cvs.fillCircle(12, 12, 9.0, [217, 119, 6, 255]);
  cvs.fillCircle(11, 11, 7.5, [251, 191, 36, 255]);
  cvs.fillCircle(10, 10, 5.0, [254, 240, 138, 240]);

  // 중앙 사각 구멍 (방공 方孔 - 6x6)
  cvs.fillPolygon([
    { x: 9, y: 9 }, { x: 15, y: 9 }, { x: 15, y: 15 }, { x: 9, y: 15 }
  ], [24, 18, 10, 255]);

  // 사각 구멍 흑묵 테두리
  cvs.strokePolygon([
    { x: 9, y: 9 }, { x: 15, y: 9 }, { x: 15, y: 15 }, { x: 9, y: 15 }
  ], 1.2, [10, 8, 6, 255]);

  // 엽전 상하좌우 먹글씨 각인 획 (상평통보 양식 획)
  cvs.drawLine(12, 4, 12, 7, 1.2, [40, 25, 10, 255]);  // 상
  cvs.drawLine(12, 17, 12, 20, 1.2, [40, 25, 10, 255]); // 평
  cvs.drawLine(4, 12, 7, 12, 1.2, [40, 25, 10, 255]);  // 통
  cvs.drawLine(17, 12, 20, 12, 1.2, [40, 25, 10, 255]); // 보

  // 짙은 흑묵 외곽 테두리
  cvs.strokePolygon([
    { x: 12, y: 3 }, { x: 18, y: 6 }, { x: 21, y: 12 }, { x: 18, y: 18 },
    { x: 12, y: 21 }, { x: 6, y: 18 }, { x: 3, y: 12 }, { x: 6, y: 6 }
  ], 1.8, [18, 12, 6, 255]);

  return cvs.toPngBuffer();
}

// [경험치 영석 4단계] (20x20)
function createExpGem(colorType) {
  const cvs = new SumieCanvas(20, 20);

  let mainColor, hiColor, edgeColor;
  if (colorType === 'blue') {
    // 1단계: 청록빛 벽옥(碧玉)
    mainColor = [14, 116, 144, 255];
    hiColor = [56, 189, 248, 255];
    edgeColor = [3, 105, 161, 255];
  } else if (colorType === 'green') {
    // 2단계: 비취빛 비취옥(翡翠玉)
    mainColor = [22, 101, 52, 255];
    hiColor = [74, 222, 128, 255];
    edgeColor = [21, 128, 61, 255];
  } else if (colorType === 'red') {
    // 3단계: 붉은 홍옥(紅玉) / 주사영석
    mainColor = [185, 28, 28, 255];
    hiColor = [248, 113, 113, 255];
    edgeColor = [220, 38, 38, 255];
  } else {
    // 4단계: 찬란한 자수정/자금옥(紫金玉)
    mainColor = [107, 33, 168, 255];
    hiColor = [216, 180, 254, 255];
    edgeColor = [147, 51, 234, 255];
  }

  // 마름모 보석 실루엣
  const gemPoly = [
    { x: 10, y: 2 }, { x: 17, y: 10 }, { x: 10, y: 18 }, { x: 3, y: 10 }
  ];
  cvs.fillPolygon(gemPoly, mainColor);

  // 내부 깎아지른 단면 음영
  cvs.fillPolygon([
    { x: 10, y: 5 }, { x: 15, y: 10 }, { x: 10, y: 15 }, { x: 5, y: 10 }
  ], edgeColor);

  // 상단 찬란한 광채 면
  cvs.fillPolygon([
    { x: 10, y: 5 }, { x: 13, y: 10 }, { x: 10, y: 12 }, { x: 7, y: 10 }
  ], hiColor);
  cvs.fillCircle(10, 9, 1.2, [255, 255, 255, 255]);

  // 특대 보석은 황금빛 림 추가
  if (colorType === 'purple') {
    cvs.drawLine(10, 2, 17, 10, 1.4, [251, 191, 36, 255]);
    cvs.drawLine(10, 2, 3, 10, 1.4, [251, 191, 36, 255]);
  }

  // 짙은 흑색 송연먹선 테두리
  cvs.strokePolygon(gemPoly, 1.6, [5, 5, 8, 255]);

  return cvs.toPngBuffer();
}

// [핵심 아이콘 1]: 행운 클로버 (icon_clover - 32x32) - 사엽초(四葉草)
function createIconClover() {
  const cvs = new SumieCanvas(32, 32);

  // 단청 비취빛 안개
  cvs.inkWash(16, 15, 13, 13, [34, 197, 94], 100);

  // 사방 4개 하트 잎사귀 클러스터 (위, 아래, 좌, 우)
  const leaves = [
    { cx: 16, cy: 9, dx: 3 },  // 위
    { cx: 16, cy: 21, dx: 3 }, // 아래
    { cx: 10, cy: 15, dx: 3 }, // 좌
    { cx: 22, cy: 15, dx: 3 }  // 우
  ];

  for (const lv of leaves) {
    cvs.fillCircle(lv.cx - 2, lv.cy, 4.0, [21, 128, 61, 255]);
    cvs.fillCircle(lv.cx + 2, lv.cy, 4.0, [22, 163, 74, 255]);
    cvs.fillCircle(lv.cx, lv.cy - 1, 2.5, [74, 222, 128, 240]);
  }

  // 중앙 캘리그래피 줄기
  cvs.drawLine(16, 16, 13, 28, 2.2, [20, 83, 45, 255]);
  cvs.drawLine(13, 28, 11, 30, 1.5, [10, 40, 20, 255]);

  // 짙은 묵선 잎맥 및 테두리
  cvs.drawLine(16, 9, 16, 15, 1.2, [5, 46, 22, 255]);
  cvs.drawLine(16, 15, 16, 21, 1.2, [5, 46, 22, 255]);
  cvs.drawLine(10, 15, 22, 15, 1.2, [5, 46, 22, 255]);
  cvs.fillCircle(16, 15, 1.8, [15, 23, 42, 255]);

  return cvs.toPngBuffer();
}

// [핵심 아이콘 2]: 황금 왕관 (icon_crown - 32x32) - 신라 금관 / 제왕 보관
function createIconCrown() {
  const cvs = new SumieCanvas(32, 32);

  // 찬란한 황금빛 안개 번짐
  cvs.inkWash(16, 16, 14, 14, [245, 158, 11], 120);

  // 왕관 관테(베이스 띠)
  const bandPoly = [
    { x: 5, y: 22 }, { x: 27, y: 22 }, { x: 26, y: 26 }, { x: 6, y: 26 }
  ];
  cvs.fillPolygon(bandPoly, [217, 119, 6, 255]);

  // 3대 솟은가지 (중앙 대형 수지형 가지, 좌우 녹각 가지)
  // 중앙 출자(出字) 나뭇가지
  cvs.fillPolygon([
    { x: 14, y: 7 }, { x: 18, y: 7 }, { x: 18, y: 22 }, { x: 14, y: 22 }
  ], [251, 191, 36, 255]);
  cvs.fillPolygon([
    { x: 11, y: 11 }, { x: 21, y: 11 }, { x: 21, y: 14 }, { x: 11, y: 14 }
  ], [245, 158, 11, 255]);

  // 좌측 솟은가지
  cvs.fillPolygon([
    { x: 6, y: 12 }, { x: 10, y: 12 }, { x: 12, y: 22 }, { x: 8, y: 22 }
  ], [245, 158, 11, 255]);

  // 우측 솟은가지
  cvs.fillPolygon([
    { x: 22, y: 12 }, { x: 26, y: 12 }, { x: 24, y: 22 }, { x: 20, y: 22 }
  ], [245, 158, 11, 255]);

  // 매달린 비취 곡옥(曲玉) 장식
  cvs.fillCircle(9, 17, 2.2, [34, 197, 94, 255]);
  cvs.fillCircle(23, 17, 2.2, [34, 197, 94, 255]);
  cvs.fillCircle(16, 5, 2.5, [254, 240, 138, 255]); // 정수리 황금 영락

  // 짙은 흑묵 외곽선
  cvs.strokePolygon(bandPoly, 1.8, [15, 10, 5, 255]);
  cvs.drawLine(14, 7, 18, 7, 1.5, [15, 10, 5, 255]);
  cvs.drawLine(6, 12, 10, 12, 1.5, [15, 10, 5, 255]);
  cvs.drawLine(22, 12, 26, 12, 1.5, [15, 10, 5, 255]);

  return cvs.toPngBuffer();
}

// --- 4. 메인 에셋 생성 및 디스크 기록 실행 ---
function runGenerator() {
  const targetDirs = [
    path.join(__dirname, '../assets/sprites')
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const assetList = [
    // 월드 1 필드 장애물 3종 (64x64)
    { name: 'obstacle_rock.png', generator: createObstacleRock },
    { name: 'obstacle_tree.png', generator: createObstacleTree },
    { name: 'obstacle_crate.png', generator: createObstacleCrate },

    // 월드 2 심해 필드 장애물 3종 (64x64 수묵화풍 리메이크)
    { name: 'obstacle_reef.png', generator: createObstacleReef },
    { name: 'obstacle_kelp.png', generator: createObstacleKelp },
    { name: 'obstacle_chest.png', generator: createObstacleChest },

    // 특수 드랍 아이템 (32x32, 24x24)
    { name: 'item_magnet.png', generator: createItemMagnet },
    { name: 'item_bomb.png', generator: createItemBomb },
    { name: 'item_freeze.png', generator: createItemFreeze },
    { name: 'item_heal.png', generator: createItemHeal },
    { name: 'item_gold.png', generator: createItemGold },

    // 경험치 영석 4단계 (20x20)
    { name: 'gem_blue.png', generator: () => createExpGem('blue') },
    { name: 'gem_green.png', generator: () => createExpGem('green') },
    { name: 'gem_red.png', generator: () => createExpGem('red') },
    { name: 'gem_purple.png', generator: () => createExpGem('purple') },

    // 핵심 아이콘 2종 (32x32)
    { name: 'icon_clover.png', generator: createIconClover },
    { name: 'icon_crown.png', generator: createIconCrown }
  ];

  console.log(`[SumieGenerator] 수묵화풍(Step 7) 필드 장애물 및 드랍 아이템 PNG 생성 시작 (총 ${assetList.length}종)...`);

  for (const item of assetList) {
    const pngBuffer = item.generator();
    for (const dir of targetDirs) {
      const outPath = path.join(dir, item.name);
      fs.writeFileSync(outPath, pngBuffer);
    }
    console.log(`  ✓ 생성 완료: ${item.name} (${pngBuffer.length} bytes)`);
  }

  console.log('[SumieGenerator] 모든 수묵화풍 장애물 & 드랍 아이템 PNG 파일 생성 완료!');
}

runGenerator();
