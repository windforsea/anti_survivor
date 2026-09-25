// Anti Survivors - 113종 다크 판타지 도트 픽셀 아트 및 128x128 수묵화풍 고화질 엠블럼·보스 PNG 빌더 (generate_assets.js)
// Node.js 내장 zlib 및 fs 모듈만 사용하여 순수 JS로 고품질 스프라이트 PNG를 생성 (Zero-dependency)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, 'assets', 'sprites');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ================= 128x128 수묵화풍 고화질 엠블럼 및 보스 렌더러 모듈 로드 =================
const { renderInkEmblem, hasInkEmblem } = require('./assets/data/ink_emblems');
const { renderInkBoss, hasInkBoss } = require('./assets/data/ink_bosses');

// 순수 JS 기반 초경량 PNG 인코더
function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = width * 4;
  const rawScanlines = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawScanlines[rowOffset] = 0;
    rgbaBuffer.copy(rawScanlines, rowOffset + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeInt32BE(crc, len + 8);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c ^= buf[n];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return c ^ 0xffffffff;
}

function hexToRgba(hex) {
  if (!hex || hex === '.') return [0, 0, 0, 0];
  const num = parseInt(hex.replace('#', ''), 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
    255
  ];
}

function renderMatrix(rows, palette, scale = 2) {
  const origH = rows.length;
  const origW = rows[0].length;
  const width = origW * scale;
  const height = origH * scale;
  const buf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < origH; y++) {
    const row = rows[y];
    for (let x = 0; x < origW; x++) {
      const char = row[x];
      const color = hexToRgba(palette[char] || '.');
      
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x * scale + sx;
          const py = y * scale + sy;
          const idx = (py * width + px) * 4;
          buf[idx] = color[0];
          buf[idx + 1] = color[1];
          buf[idx + 2] = color[2];
          buf[idx + 3] = color[3];
        }
      }
    }
  }

  return { width, height, buf };
}

// ================= 다크 판타지 픽셀 아트 팔레트 =================
const PALETTE = {
  '.': '.',
  'K': '#0f111a', // 딥 블랙 외곽선
  'D': '#1e2235', // 어두운 흉갑/음영
  'M': '#3e4566', // 중간 강철
  'L': '#8290be', // 밝은 하이라이트 강철
  'W': '#e2e8f0', // 순백/뼈/빛
  'R': '#881337', // 핏빛 어두운 천/망토
  'C': '#e11d48', // 선혈 크림슨 레드
  'G': '#b45309', // 어두운 황금
  'Y': '#fde047', // 황금 안광/빛
  'S': '#14532d', // 맹독 슬라임 딥 그린
  'A': '#22c55e', // 슬라임 밝은 녹색
  'P': '#581c87', // 그림자 보라
  'V': '#a855f7', // 아케인 바이올렛
  'B': '#0369a1', // 영혼 푸른빛
  'T': '#38bdf8', // 시안 영기
  'O': '#78350f', // 맹수 짙은 털/목재
  'E': '#d97706', // 맹수 밝은 털/호박색
  'Z': '#475569', // 석조 그레이
  'H': '#94a3b8', // 밝은 석조
  'Q': '#06b6d4', // 발광 네온 시안 (플랑크톤/아귀 불빛)
  'N': '#0891b2', // 심해 청록 (해파리 갓/산호)
  'F': '#0e7490', // 어두운 심해 청록 (해저 마물 음영)
  'U': '#f43f5e', // 심해 산호 핑크 (촉수/크라켄)
  'J': '#10b981', // 심해 에메랄드 (날치/독/다곤)
  'I': '#0284c7', // 심해 딥 블루 (상어/바다뱀 가죽)
  'X': '#1e293b'  // 암청색 심해 갑각 (삼엽충/게 껍질)
};

// ================= 도메인별 픽셀아트 데이터 로드 =================
const HEROES = require('./assets/data/sprites_heroes');
const ENEMIES_W1 = require('./assets/data/sprites_enemies_w1');
const ENEMIES_W2 = require('./assets/data/sprites_enemies_w2');
const BOSSES = require('./assets/data/sprites_bosses');
const ICONS = require('./assets/data/sprites_icons');
const MISC = require('./assets/data/sprites_misc');

const SPRITES = {
  ...HEROES,
  ...ENEMIES_W1,
  ...ENEMIES_W2,
  ...BOSSES,
  ...ICONS,
  ...MISC
};

console.log('🖌️ Anti Survivors [방안 A] 고화질 수묵 엠블럼 및 128x128 수묵 보스 스프라이트 생성 시작...');
let count = 0;
let inkEmblemCount = 0;
let inkBossCount = 0;

for (const key in SPRITES) {
  const isIcon = key.startsWith('icon_') || (key in ICONS);

  // [방안 A Part 1]: 16x16 깍두기 확대를 완전히 폐기하고 128x128 수묵 엠블럼 생성기로 직접 렌더링
  if (isIcon && hasInkEmblem(key)) {
    const rgbaBuffer = renderInkEmblem(key);
    const pngData = createPNG(128, 128, rgbaBuffer);
    const filePath = path.join(ASSETS_DIR, `${key}.png`);
    fs.writeFileSync(filePath, pngData);
    count++;
    inkEmblemCount++;
    continue;
  }

  // [방안 A Part 2]: 16x16 깍두기 확대를 완전히 폐기하고 128x128 수묵화풍 보스 생성기로 직접 렌더링
  if (hasInkBoss(key)) {
    const rgbaBuffer = renderInkBoss(key);
    const pngData = createPNG(128, 128, rgbaBuffer);
    const filePath = path.join(ASSETS_DIR, `${key}.png`);
    fs.writeFileSync(filePath, pngData);
    count++;
    inkBossCount++;
    continue;
  }

  // 캐릭터/몬스터(32x32) 및 기타 미지원 보스 레거시 스프라이트 렌더링 파이프라인
  const matrix = SPRITES[key];
  const origW = matrix[0].length;
  const isBoss = key.startsWith('boss_') || (key in BOSSES);
  
  const scale = isBoss ? Math.max(1, Math.round(128 / origW)) : 2;
  const { width, height, buf } = renderMatrix(matrix, PALETTE, scale);
  const pngData = createPNG(width, height, buf);
  const filePath = path.join(ASSETS_DIR, `${key}.png`);
  fs.writeFileSync(filePath, pngData);
  count++;
}

console.log(`✅ 총 ${count}개의 스프라이트 PNG가 성공적으로 빌드되었습니다!`);
console.log(`🎨 128x128 수묵화풍 고화질 엠블럼: ${inkEmblemCount}종 적용 완료`);
console.log(`👹 128x128 수묵화풍 고해상도 보스 몬스터 7종: ${inkBossCount}종 래스터라이징 완료`);
console.log(`📂 저장 위치: ${ASSETS_DIR}`);
