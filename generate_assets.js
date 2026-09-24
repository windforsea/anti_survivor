// Node.js 내장 zlib 및 fs 모듈만 사용하여 다크 판타지 픽셀 아트 PNG를 생성하는 스크립트 (Zero-dependency)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, 'assets', 'sprites');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

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

const SPRITES = {
  // [플레이어 6종]
  player: [
    ".....KKKKK......",
    "....KMMMMMK.....",
    "...KMLYYYLMK....",
    "...KMDDDDMMK....",
    "...KLLLLLLMK....",
    "....KKDDKKK.....",
    "...KRRMMRRK.....",
    "..KRRMMMMRRK....",
    "..KRRMMMMRRK....",
    "..KRMDDDDMKK....",
    "...KMDDDDMK.....",
    "...KMMKKMMK.....",
    "...KMMKKMMK.....",
    "...KLLKKLLK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  player_mage: [
    ".....KKKKK......",
    "....KRRRRRK.....",
    "...KRRYYYRRK....",
    "...KRPPPPRRK....",
    "...KWWWWWWPK....",
    "....KKDDKKK.....",
    "...KPPCCPPK.....",
    "..KPPCCCCPPK....",
    "..KPPCCCCPPK....",
    "..KPDDDDDPKK....",
    "...KPDDDDPK.....",
    "...KPPKKPPK.....",
    "...KPPKKPPK.....",
    "...KRRKKRRK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  player_assassin: [
    ".....KKKKK......",
    "....KKDDDKK.....",
    "...KKDYYYDKK....",
    "...KKKKKKKKK....",
    "...KKCCCCCCK....",
    "....KKDDKKK.....",
    "...KKDDKKDK.....",
    "..KKDDDDDDKK....",
    "..KKDDDDDDKK....",
    "..KKDDKKDDKK....",
    "...KKDDDDDKK....",
    "...KKDKKDKKK....",
    "...KKDKKDKKK....",
    "...KKMKKMKKK....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  player_cleric: [
    ".....KKKKK......",
    "....KWWWWWK.....",
    "...KWYYYYYWK....",
    "...KWKKKKKWK....",
    "...KWWWWWWWK....",
    "....KKGGKKK.....",
    "...KGGWWGGK.....",
    "..KGGWWWWGGK....",
    "..KGGWWWWGGK....",
    "..KGGDDDDGGK....",
    "...KDDDDDDDK....",
    "...KWWKKWWK.....",
    "...KWWKKWWK.....",
    "...KGGKKGGK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  player_sylph: [
    ".....KKKKK......",
    "....KAAAAAK.....",
    "...KAAEEEYAK....",
    "...KASSSSAAK....",
    "...KWWWWWWAK....",
    "....KKDDKKK.....",
    "...KSSOOSSK.....",
    "..KSSOOOOOSSK...",
    "..KSSOOOOOSSK...",
    "..KSSDDDDSSK....",
    "...KSDDDDSK.....",
    "...KAAKKAAK.....",
    "...KAAKKAAK.....",
    "...KSSKKSSK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  player_malakar: [
    ".....KKKKK......",
    "....KPPPPPK.....",
    "...KPVCCCVPK....",
    "...KPVKKKVPK....",
    "...KWWWWWWPK....",
    "....KKDDKKK.....",
    "...KDDVVDDK.....",
    "..KDDVVVVDDK....",
    "..KDDVVVVDDK....",
    "..KDDDDDDDDK....",
    "...KPDDDDPK.....",
    "...KPPKKPPK.....",
    "...KPPKKPPK.....",
    "...KPPKKPPK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],

  // [일반 몬스터 15종]
  bat: [
    "................",
    "V..............V",
    "VK............KV",
    "VVKK........KKVV",
    "VVVKK..KK..KKVVV",
    ".VVVKKYWWYKKVVV.",
    "..VVKYYCCYYKVV..",
    "...VKCCCCCCCKV...",
    "....KCCWWCCK....",
    "...KK.KCCK.KK...",
    "..KK...KK...KK..",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  slime: [
    "................",
    "................",
    "................",
    "......KKKK......",
    "....KKSAAAKK....",
    "...KSAAAAAAAK...",
    "..KSAAWWAAWWAK..",
    "..KSAAWWAAWWAK..",
    ".KSAAAAAAAAAAAK.",
    ".KSAAAAAAAAAAAK.",
    ".KSAAKKAAAKKAAK.",
    ".KSSAAKKKKAAAAK.",
    ".KSSSSSSSSSSSSK.",
    "..KKSSSSSSSSKK..",
    "....KKKKKKKK....",
    "................"
  ],
  miniSlime: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....KKKKK......",
    "...KKAAAAAKK....",
    "..KAAAAAAAAAAK..",
    ".KAAAWAAAWAAAAK.",
    ".KAAYKAAYKAAAAK.",
    ".KAAYKAAYKAAAAK.",
    ".KAAAAAAAAAAAAK.",
    ".KASSSSSSSSSSAK.",
    "..KKKKKKKKKKKK..",
    "................"
  ],
  zombie: [
    ".....KKKKK......",
    "....KSSZZSKK....",
    "...KSWWKSWWKK...",
    "...KSCKKSCAKK...",
    "...KSSKKSSAKK...",
    "....KKSSKKK.....",
    "...KDDZZDDDK....",
    "..KDDZZZZZDDK...",
    "..KDDZDDDZDKK...",
    "..KSDZZZZZDSK...",
    "...KSDDDDDSK....",
    "...KZZKKZZKK....",
    "...KZZKKZZKK....",
    "...KSSKKSSKK....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  skeleton: [
    ".....KKKKK......",
    "....KWWWWWK.....",
    "...KWCKWCKWK....",
    "...KWKKWKKWK....",
    "...KWWWWWWWK....",
    "....KKWKWKK.....",
    "....KWWWWWK.....",
    "...KWWKWWKWK....",
    "..KWKWKWWKWKW...",
    "..KW.KWWWWK.WK..",
    ".....KDKKDK.....",
    ".....KWKKWK.....",
    ".....KWKKWK.....",
    ".....KWKKWK.....",
    "....KWWKKWWK....",
    ".....KK..KK....."
  ],
  goblin: [
    "A..............A",
    "KA............AK",
    "KSA..........ASK",
    ".KSAAKKKKAASK...",
    "..KSAAAAAASK....",
    "..KSAWYYWASAK...",
    "..KSAYKKWASAK...",
    "...KSAAAAAASK...",
    "....KKSAAKK.....",
    "...KDDMMMMDDK...",
    "..KDDMMMMMMDDK..",
    "..KDDDKKDKDDK...",
    "..KSSKKKKSSK....",
    "...KK....KK.....",
    "................",
    "................"
  ],
  ghost: [
    "......KKKK......",
    "....KKTTTTKK....",
    "...KTTWWWWTTK...",
    "..KTTWTTTTWTTK..",
    "..KTWTCKTCKTWTK.",
    ".KTTWKKTTKKWTTK.",
    ".KTTWWTTTTWWTTK.",
    ".KTTTTTTTTTTTTK.",
    "..KTTTTTTTTTTK..",
    "...KTTTTTTTTK...",
    "....KTTTTTTK....",
    "...KTTTTTTTTK...",
    "..KTTKTTKTTKTTK.",
    "..KTK.KTK.KTK.K.",
    "...K...K...K....",
    "................"
  ],
  gargoyle: [
    "K..............K",
    "KK............KK",
    "KZK..........KZK",
    "KZZKK......KKZZK",
    ".KZZZKKKKKKZZZK.",
    "..KZZZHWWZHZZK..",
    "...KZZHWWZHZZK..",
    "...KZZZCCZZZK...",
    "....KZZZZZZK....",
    "...KZZMKKMZZK...",
    "..KZZMMKKMMZZK..",
    "..KZMMKKKKMMZK..",
    ".KKZKK....KKZKK.",
    ".KK..........KK.",
    "................",
    "................"
  ],
  cultist: [
    ".....KKKKK......",
    "....KRRRRRK.....",
    "...KRRCCCRRK....",
    "...KRCYYYCRK....",
    "...KRCYYYCRK....",
    "....KKRRRKK.....",
    "...KRRDDDRRK....",
    "..KRRDDDDDDRK...",
    "..KRRDDPPDDDRK..",
    "..KRRDPPPPDDRK..",
    "...KRRDDDDRRK...",
    "...KRRKKKRRK....",
    "...KRRKKKRRK....",
    "...KRR...KRRK...",
    "..KKR.....RKK...",
    "................"
  ],
  assassin: [
    ".....KKKKK......",
    "....KKDDDKK.....",
    "...KKDCCCDKK....",
    "...KKCYWYCDKK...",
    "...KKDCCCDKK....",
    "....KKDDKKK.....",
    "...KMDDDDDMK....",
    "..KMDDDDDDDMK...",
    "..KMDDKKKKDMMK..",
    "..KMDDKKKKDMMK..",
    "...KMDDDDMMK....",
    "...KMMKKMMK.....",
    "...KMMKKMMK.....",
    "...KLLKKLLK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  golem: [
    "...KKKKKKKKKK...",
    "..KZZZZZZZZZZK..",
    ".KZZZHWWWWZHZZK.",
    ".KZZHWKYYKWHZZK.",
    ".KZZHWKYYKWHZZK.",
    ".KZZZHWWWWZHZZK.",
    "..KZZZZZZZZZZK..",
    "KZZKKZZZZZZKKZZK",
    "KZZHZZZZZZZZHZZK",
    "KZZHZZZZZZZZHZZK",
    "KZZKKZZZZZZKKZZK",
    ".KK.KZZKKZZK.KK.",
    "....KZZKKZZK....",
    "....KZZKKZZK....",
    "...KZZZKKZZZK...",
    "...KKKK..KKKK..."
  ],
  darkMage: [
    ".....KKKKK......",
    "....KPPVPPK.....",
    "...KPVVYYVVPK...",
    "...KPVWWWWVPK...",
    "...KPVCCCCVPK...",
    "....KKPVPKK.....",
    "...KDDDDDDDK....",
    "..KDDVVVVVDDK...",
    "..KDDVPPPVVDDK..",
    "..KDDVPPPVVDDK..",
    "...KDDDDDDKK....",
    "...KPPKKPPK.....",
    "...KPPKKPPK.....",
    "...KPPKKPPK.....",
    "...KDKKKKDK.....",
    "....KK..KK......"
  ],
  bloodHound: [
    "................",
    "....KK....KK....",
    "...KOOK..KOOK...",
    "..KOEEOKKOEEOK..",
    ".KOEEEEEEEEEEOK.",
    ".KOEEYWEEWYEEOK.",
    ".KOEEYCEECYEEOK.",
    "..KOEEEEEEEEOK..",
    "...KOECCCCEOK...",
    "....KKEEEEK.....",
    "...KDDDDDDDDK...",
    "..KDDDDDDDDDDK..",
    "..KDDKKDDDKKDK..",
    "..KDDK.KDDK.KK..",
    "..KKK..KKK......",
    "................"
  ],
  wraithSwarm: [
    ".KK..........KK.",
    "KPPK........KPPK",
    "KPVVK......KPVVK",
    ".KPVVK....KPVVK.",
    "..KPVVKKKKVVPPK.",
    "...KPVCCVVPPK...",
    "..KPVCCCCVVPPK..",
    ".KPVCCYYCCVVPPK.",
    ".KPVCCYYCCVVPPK.",
    "..KPVCCCCVVPPK..",
    "...KPVCCVVPPK...",
    "..KPVVKKKKVVPPK.",
    ".KPVVK....KPVVK.",
    "KPVVK......KPVVK",
    "KPPK........KPPK",
    ".KK..........KK."
  ],
  abyssTitan: [
    "..KKKKKKKKKKKK..",
    ".KDDDDDDDDDDDDK.",
    "KDDDDDDDDDDDDDDK",
    "KDDKYYYYYYYYKDDK",
    "KDDKYYCCCCYYKDDK",
    "KDDKYYCCCCYYKDDK",
    "KDDDDDDDDDDDDDDK",
    ".KDDDRRRRRRDDDK.",
    ".KDDDRRRRRRDDDK.",
    "KDDDDRRRRRRDDDDK",
    "KDDDDRRRRRRDDDDK",
    "KDDDDKKKKKKDDDDK",
    ".KDDDK....KDDDK.",
    ".KDDDK....KDDDK.",
    "..KDDK....KDDK..",
    "...KK......KK..."
  ],

  // [월드 2: 심해 대협곡 몬스터 15종]
  plankton: [
    ".......QQ.......",
    "......KQQK......",
    ".....KQQQQK.....",
    "....KQQWWQQK....",
    "...KQWWYYYYWQK..",
    "..KQQWYYYYYYWQQK",
    ".KQQQYYYYYYYYQQK",
    "QQQQQYYYYYYYYQQQ",
    "QQQQQYYYYYYYYQQQ",
    ".KQQQYYYYYYYYQQK",
    "..KQQWYYYYYYWQQK",
    "...KQWWYYYYWQK..",
    "....KQQWWQQK....",
    ".....KQQQQK.....",
    "......KQQK......",
    ".......QQ......."
  ],
  jellyfish: [
    ".....KKKKKK.....",
    "...KKQQNNQQKK...",
    "..KQQNNNNNNQQK..",
    ".KQQNNWWWWNNQQK.",
    ".KQQNNWYYWNNQQK.",
    "KQQNNNNNNNNNNQQK",
    "KQQNNNNNNNNNNQQK",
    "KKKKKKKKKKKKKKKK",
    "..KQ.KN..NK.QK..",
    "..KQ.KN..NK.QK..",
    ".KQK..K..K..KQK.",
    ".KQ....KK....QK.",
    "..QK........KQ..",
    "...K........K...",
    "................",
    "................"
  ],
  hermitCrab: [
    "................",
    "......KKKKK.....",
    "....KKXEEEXKK...",
    "...KXXEEEEEXXK..",
    "..KXXEEEEEEEXXK.",
    ".KXXEEEEEEEEEEXK",
    ".KXXEEEYYYEEEXXK",
    "KXXKKKKKKKKKKXXK",
    "KCCK.KYKKKYK.KCCK",
    "KCCCK.KCCCK.KCCCK",
    ".KCCKKKCCCKKKCCK",
    "..KKK.KKKKK.KKK.",
    "....K.K...K.K...",
    "...KK.K...K.KK..",
    "................",
    "................"
  ],
  flyingFish: [
    "................",
    ".......KK.......",
    "...K..KQJK..K...",
    "..KQKKQJJQKKQK..",
    "..KQQQQJJQQQQK..",
    "...KQQQJJQQQK...",
    "....KQQJJQQK....",
    "KKKKKQJJJJQKKKKK",
    "KWWQQJJYYJJQQWWK",
    "KKKKKQJJJJQKKKKK",
    "....KQQJJQQK....",
    "...KQQQJJQQQK...",
    "..KQQQQJJQQQQK..",
    "..KQKKQJJQKKQK..",
    "...K..KQJK..K...",
    ".......KK......."
  ],
  seaLobster: [
    "................",
    ".KCCK.......KCCK",
    "KCCCCK.....KCCCCK",
    "KCCCCCCKKKCCCCCCK",
    ".KCCCCCKCKCCCCCK",
    "..KCCCKCCCKCCCK.",
    "...KKKRRRRRKKK..",
    "...KRRCCCCCRRK..",
    "..KRRCCYYYCCRRK.",
    "..KRRCCYYYCCRRK.",
    "...KRRCCCCCRRK..",
    "...KRRRRRRRRRK..",
    "..KRRRKKKKKRRRK.",
    ".KK.KK.....KK.KK",
    "................",
    "................"
  ],
  stingray: [
    ".......KK.......",
    "......KYYK......",
    ".....KYYYYK.....",
    "....KEYYYYEK....",
    "...KEEYYYYEIK...",
    "..KEEEYYYYEEIK..",
    ".KEEEEYYYYEEEEIK",
    "KEEEEEYYYYEEEEEI",
    ".KEEEEYYYYEEEEIK",
    "..KEEEYYYYEEIK..",
    "...KEEYYYYEIK...",
    "....KEYYYYEK....",
    ".....KYYYYK.....",
    "......KQKK......",
    "......KQQK......",
    ".......QQ......."
  ],
  coralGolem: [
    "..KKKKKKKKKKKK..",
    ".KFXUFXUFXUFXFK.",
    "KFXUUUUFXUUUUFXK",
    "KFXUUUUFXUUUUFXK",
    "KFFXXUUFFXXUUFFK",
    "KFFKKKKFFKKKKFFK",
    "KFFKQQKFFKQQKFFK",
    "KFFFFFFFFFFFFFFK",
    ".KFFFFUFFFFUFFK.",
    ".KFFFUUFFFFUUFK.",
    "KFFFFFFFFFFFFFFK",
    "KFFXXXXXXXXXXFFK",
    "KFFXKKKKKKKKXFFK",
    ".KFXK......KFXK.",
    ".KFXK......KFXK.",
    "..KK........KK.."
  ],
  seaLeech: [
    "................",
    "....KKKKKKKK....",
    "...KRRRRRRRRK...",
    "..KRRCCCCCCRKK..",
    ".KRRCCWWWWCCRRK.",
    ".KRRCCWYYWCCRRK.",
    "..KRRCCWWCCRRK..",
    "...KRRCCCCRRK...",
    "....KRRRRRRK....",
    "...KRRCCCCRRK...",
    "..KRRCCCCCCRKK..",
    ".KRRCCCCCCCCRRK.",
    "..KRRCCCCCCRKK..",
    "...KRRRRRRRRK...",
    "....KKKKKKKK....",
    "................"
  ],
  anglerFish: [
    ".....KKQKK......",
    "....KQYYYQK.....",
    "...KQQYYYQQK....",
    "....KKQQKKK.....",
    "......KK........",
    "....KKFFKKKK....",
    "..KKFFFFFFKKKK..",
    ".KFFFFFFFFFFFFK.",
    "KFFFFYYYYFFFFFFK",
    "KFFFYYYYWWFFFFFK",
    "KFFFWWWWWFFFFFK.",
    "KFFFWKKKKFFFFK..",
    ".KFFFFWWFFFFK...",
    "..KKFFFFFFKK....",
    "....KKKKKK......",
    "................"
  ],
  ghostJelly: [
    ".....KKKKKK.....",
    "...KKTWWTTWWKK..",
    "..KTWWWWWWWWTTK.",
    ".KTWWWWWWWWWWTTK",
    ".KTWWTTQQTTWWTTK",
    "KTWWTTYYYYTTWWTT",
    "KTWWTTYYYYTTWWTT",
    "KKKKKKKKKKKKKKKK",
    "..KT.KW..WK.TK..",
    "..KT.KW..WK.TK..",
    ".KTK..K..K..KTK.",
    ".KT....KK....TK.",
    "..TK........KT..",
    "...T........T...",
    "................",
    "................"
  ],
  deepShark: [
    "................",
    ".......KK.......",
    "......KIIK......",
    ".....KIIIIK.....",
    "....KIIIIIIK....",
    "...KIIIIIIIIK...",
    "..KIIIIIIIIIIK..",
    ".KIIWWIIWWIIIIK.",
    "KIIIWYIIWYIIIIIK",
    "KIIIIWWIIWWIIIIK",
    "KIIIIIIIIIIIIIIK",
    ".KIIWWWWWWWWIIK.",
    "..KIIIIIIIIIIK..",
    "...KIIIIIIIIK...",
    "....KIKKKKIK....",
    ".....KK..KK....."
  ],
  poisonRay: [
    ".......KK.......",
    "......KPPK......",
    ".....KPPPPK.....",
    "....KPVVVVPK....",
    "...KPVVJJVVPK...",
    "..KPVVJJJJVVPK..",
    ".KPVVJJYYJJVVPK.",
    "KPVVJJYYYYJJVVPK",
    ".KPVVJJYYJJVVPK.",
    "..KPVVJJJJVVPK..",
    "...KPVVJJVVPK...",
    "....KPVVVVPK....",
    ".....KPPPPK.....",
    "......KJJK......",
    "......KJJJ......",
    ".......JJ......."
  ],
  shadowEel: [
    "................",
    "....KKKKKKKK....",
    "...KIIFFFFFFIK..",
    "..KIIFYYYYFFIIK.",
    "..KIIFYYYYFFIIK.",
    "...KIIFFFFFFIK..",
    "....KKKKKKKKIK..",
    ".........KFFIIK.",
    ".........KFFIIK.",
    "....KKKKKKFFIIK.",
    "...KIIFFFFFFIK..",
    "..KIIFFFFFFIK...",
    "..KIIKKKKKKK....",
    "..KIIK..........",
    "...KK...........",
    "................"
  ],
  voidSeaSerpent: [
    ".....KKKKKK.....",
    "...KKPPVVPPKK...",
    "..KPPVVQQVVPPK..",
    ".KPPVVQQQQVVPPK.",
    ".KPPVYYYYYYVPPK.",
    "KPPVYYCCCCYYVPPK",
    "KPPVYCCCCCCYVPPK",
    "KPPVYYCCCCYYVPPK",
    ".KPPVYYYYYYVPPK.",
    "..KPPVVQQVVPPK..",
    "...KKPPVVPPKK...",
    "....KPPVVPPK....",
    "...KPPVVVVPPK...",
    "..KPP.KPPK.PPK..",
    ".KK....KK...KKK.",
    "................"
  ],
  trilobite: [
    ".....KKKKKK.....",
    "...KKXXEEXXKK...",
    "..KXXEEEEEEEXXK.",
    ".KXXEEYYYYEEXXK.",
    ".KXXEEYKK YEEXXK.",
    "KXXXEEEEEEEEXXXK",
    "KXXXXXXXXXXXXXXK",
    "KKKKKKKKKKKKKKKK",
    "KXXXXXXXXXXXXXXK",
    "KXXXEEEEEEEEXXXK",
    "KKKKKKKKKKKKKKKK",
    ".KXXXXXXXXXXXXK.",
    "..KXXXXXXXXXXK..",
    "...KXXXXXXXXK...",
    "....KXXXXXXK....",
    ".....KKKKKK....."
  ],

  // [보스 9종]
  boss_boar: [
    "................",
    "..KK........KK..",
    ".KOOK......KOOK.",
    ".KOEEOKKKKOEEOK.",
    "KOEEEEEEEEEEEEOK",
    "KOEYYWEEEEEWYYOK",
    "KOEYCWEEEEWCYYOK",
    "KOECCCCCCCCCCEOK",
    ".KOEWWCCCCWWEOK.",
    "..KOEEEEEEEEOK..",
    "...KOEEEEEEEOK..",
    "..KDDDDDDDDDDK..",
    ".KDDDKKKKKKDDDK.",
    ".KDDK......KDDK.",
    ".KKK........KKK.",
    "................"
  ],
  boss_void: [
    "....KKKKKKKK....",
    "..KKPPVVVVPPKK..",
    ".KPVVVYYYYVVVPK.",
    ".KPVVYYYYYYVVPK.",
    "KPVVYYCCCCYYVVPK",
    "KPVVYCCCCCCYVVPK",
    "KPVVYYCCCCYYVVPK",
    "KPVVYYYYYYYYVVPK",
    ".KPVVVYYYYVVVPK.",
    "..KKPVVVVVVPKK..",
    "...KKPVVVVPKK...",
    "....KPVVVVPK....",
    "...KPPVVVVPKK...",
    "..KPP.KPPK.PPK..",
    ".KK....KK...KKK.",
    "................"
  ],
  boss_eye: [
    "....KKKKKKKK....",
    "..KKCCCCCCCCKK..",
    ".KCCCCCCCCCCCCK.",
    ".KCCCCWWWWCCCCK.",
    "KCCCCWYYYYWCCCCK",
    "KCCCWYKKKKYWCCCK",
    "KCCCWYKKKKYWCCCK",
    "KCCCCWYYYYWCCCCK",
    "KCCCCWYYYYWCCCCK",
    "KCCCWYKKKKYWCCCK",
    "KCCCWYKKKKYWCCCK",
    ".KCCCCWWWWCCCCK.",
    ".KCCCCCCCCCCCCK.",
    "..KKCCCCCCCCKK..",
    "....KKKKKKKK....",
    "................"
  ],
  boss_colossus: [
    "..KKKKKKKKKKKK..",
    ".KDDDDDDDDDDDDK.",
    "KDDLLDDDDDDLLDDK",
    "KDDLLDDDDDDLLDDK",
    "KDDLLDDDDDDLLDDK",
    "KDDYYDDDDDDYYDDK",
    "KDDYYDDDDDDYYDDK",
    ".KDDDDDDDDDDDDK.",
    "..KDDDRRRRDDDK..",
    ".KDDDDRRRRDDDDK.",
    ".KDDDDRRRRDDDDK.",
    "KDDDDDRRRRDDDDDK",
    "KDDDDDKKKKDDDDDK",
    ".KDDDK....KDDDK.",
    "..KDDK....KDDK..",
    "...KK......KK..."
  ],
  boss_doom: [
    "C..............C",
    "KC............CK",
    "KCK..KKKKKK..KCK",
    "KCCKKGGYYGGKKCCK",
    "KCCKGGYYYYGGKCCK",
    ".KKGWWKWWKWWGKK.",
    ".KGGWCKWCKWWGGK.",
    ".KGGWWKWWKWWGGK.",
    ".KRRRRRRRRRRRRK.",
    "KRRRCCRRRRCCRRRK",
    "KRRCCCCRRCCCCRRK",
    "KRRCCCCRRCCCCRRK",
    ".KRRRRRRRRRRRRK.",
    "..KRRRKKKKRRRK..",
    "..KRRKK..KKRRK..",
    "...KK......KK..."
  ],
  boss_lich: [
    "....KGGYYGGK....",
    "...KGGYYYYGGK...",
    "...KWWKWWKWWK...",
    "...KWCKWCKWWK...",
    "...KWWKWWKWWK...",
    "....KWWWWWWK....",
    "Y..KPVVVVVVPK..Y",
    "YK.KPVVCCVVPK.KY",
    "YYKKPVCCCCVPKKYY",
    ".YKKPVCCCCVPKKYY",
    "..KPVVVVVVVPK...",
    "..KPVVVVVVVPK...",
    "..KPVKKKKVVPK...",
    "..KPPK..KPPK....",
    "..KPK....KPK....",
    "...KK....KK....."
  ],
  boss_reaper: [
    "..KKLLMMDDDKK...",
    ".KLLMMDDDKK..KK.",
    "KLLMMDDDKK.KKDDK",
    "KLMDDDKK..KDDDDD",
    ".KMDDK...KDDWWDD",
    "..KKK...KDDWYYWD",
    "...K....KDDWWWD.",
    "..KKK...KDDDDDD.",
    ".KDKDK...KDDDD..",
    "KDK.KDK.KDDDD...",
    "KK...KK.KDDDD...",
    "........KDDDD...",
    "........KDDDD...",
    "........KDDDD...",
    ".........KDD....",
    "..........KK...."
  ],
  boss_wyrm: [
    "....KKKKKKKK....",
    "...KPVVYYVVPK...",
    "..KPVVYYYYVVPK..",
    ".KPVYYYYYYYYVPK.",
    ".KPVYYKKKKYYVPK.",
    "KPVVYYKPPKYYVVPK",
    "KPVVYYKPPKYYVVPK",
    "KPVVYYKKKKYYVVPK",
    "KPVVYYYYYYYYVVPK",
    ".KPVVVYYYYVVVPK.",
    "..KPPVVVVVVPPK..",
    "...KKPPVVPPKK...",
    "....KKKPPKKK....",
    ".....KKPPKK.....",
    "......KPPK......",
    ".......KK......."
  ],
  boss_overlord: [
    "..KK........KK..",
    ".KYYK......KYYK.",
    "KYYYYKKKKKKYYYYK",
    "KYYYYKCCCCKYYYYK",
    ".KYYKCWWWWCKYYK.",
    "..KKCWWYYWWCKK..",
    "...KCWWYYWWCK...",
    "...KCWWWWWWCK...",
    "..KKCCCDDCCCKK..",
    ".KTTCCCCDDCCCKTK",
    "KTTTCCCCCCCCCTTK",
    "KTTKCCCCCCCCKTTK",
    ".KK.KCCCCCCK.KK.",
    "....KCCCCCCK....",
    "...KDKKKKKKDK...",
    "...KK......KK..."
  ],

  // [월드 2: 심해 대협곡 4대 보스]
  boss_kraken: [
    ".....KKKKKK.....",
    "...KKUUUUUUKK...",
    "..KUUUYYYYUUUK..",
    ".KUUYYYYYYYYUUK.",
    ".KUUYYWWWWYYUUK.",
    "KUUYYWCCCCWYYUUK",
    "KUUYYWCCCCWYYUUK",
    "KKKKKKKKKKKKKKKK",
    ".KUU.KU..UK.UUK.",
    ".KUU.KU..UK.UUK.",
    "KUKK..K..K..KKUK",
    "KUK.KK....KK.KUK",
    ".K..KUU..UUK..K.",
    "....KUU..UUK....",
    "....KUK..KUK....",
    ".....KK..KK....."
  ],
  boss_titancrab: [
    "..KKKK....KKKK..",
    ".KCCCCK..KCCCCK.",
    "KCCCCCCKKCCCCCCK",
    "KCCCXXUUUUXXCCCK",
    ".KCXXUUUUUUXXCK.",
    "..KXXUUYYUUXXK..",
    ".KXXKKKKKKKKXXK.",
    "KXXKYYYYYYYYKXXK",
    "KXXKYKKKKKKYKXXK",
    "KXXKKKKKKKKKKXXK",
    ".KXXXXXXXXXXXXK.",
    "..KXXXXXXXXXXK..",
    ".KKK.KKKKKK.KKK.",
    ".K.K..K..K..K.K.",
    "KK.K..K..K..K.KK",
    "................"
  ],
  boss_leviathan: [
    "....KKKKKKKK....",
    "...KQQIIIIQQK...",
    "..KQWWIIIIWWQK..",
    ".KQQWWIIIIWWQQK.",
    ".KQQIIYYYYIIQQK.",
    "KQQIIYYYYYYIIQQK",
    "KQQIIYWWWWYIIQQK",
    "KQQIYWKKKKWYIQQK",
    "KQQIYWKKKKWYIQQK",
    "KQQIIYWWWWYIIQQK",
    ".KQQIIYYYYIIQQK.",
    "..KQQIIIIIIQQK..",
    "...KQQIIIIQQK...",
    "....KQQIIQQK....",
    ".....KQQQQK.....",
    "......KKKK......"
  ],
  boss_dagon: [
    ".....KYYYYK.....",
    "....KYYJJYYK....",
    "...KJJJYYJJJK...",
    "..KJJJJJJJJJJK..",
    "..KJJWWJJWWJJK..",
    ".KJJJWYJJYWJJJK.",
    ".KJJJWWJJWWJJJK.",
    "KKJJJJJJJJJJJJKK",
    "KYYKJJJJJJJJKYYK",
    "KYK.KJJJJJJK.KYK",
    "KK..KJJJJJJK..KK",
    "....KJJJJJJK....",
    "....KJJ..JJK....",
    "...KJJ....JJK...",
    "...KK......KK...",
    "................"
  ],

  // [바닥 타일]
  tile_floor: [
    "KKKKKKKKKKKKKKKK",
    "KDDDDDDDDDDDDDDM",
    "KDMDDDDDDDDDDMDM",
    "KDMDDDDDDMDDDMDM",
    "KDMDDDDDDDDDDMDM",
    "KDDDDDDDDDDDDDDM",
    "KMMMMMMMMMMMMMMM",
    "KKKKKKKKKKKKKKKK",
    "KDDDDDDDDDDDDDDM",
    "KDMDDDDDDDDDDMDM",
    "KDMDDDKKKDDDDMDM",
    "KDMDDDDKDDDDDMDM",
    "KDMDDDDDKDDDDMDM",
    "KDDDDDDDKDDDDDDM",
    "KMMMMMMMMMMMMMMM",
    "KKKKKKKKKKKKKKKK"
  ],

  // ================= 기본 무기 아이콘 14종 (창의적 리디자인 적용) =================

  // 1. 철검 (sword - 방랑기사 시그니처) : 웅장한 십자 가드와 넓은 강철 대검
  icon_sword: [
    "...............W",
    "..............WW",
    ".............WLL",
    "............WLLM",
    "...........WLLMD",
    "..........WLLMD.",
    ".........WLLMD..",
    "........WLLMD...",
    ".......WLLMD....",
    "....KKKWLLMD....",
    "..KGGYYYYGGK....",
    ".KGYKMMMMKYGK...",
    ".KK.KMMMMK.KK...",
    "....KOOOOK......",
    "....KOOOOK......",
    ".....KGGK......."
  ],

  // 2. 도끼 (axe - 공용) : 묵직한 중세 양날 배틀액스
  icon_axe: [
    "...KK......KK...",
    "..KWWK....KWWK..",
    ".KWWLK....KLWWK.",
    "KLMMDK....KDMMLL",
    "KLMDK......KDMLK",
    ".KKDKK....KKDKK.",
    "...KKOOOOOOKK...",
    "....KOOEEEOK....",
    "....KOOEEEOK....",
    "....KOOEEEOK....",
    "...KKOOOOOOKK...",
    ".KLMDK....KDMLK.",
    "KLMMDK....KDMMLL",
    ".KWWLK....KLWWK.",
    "..KWWK....KWWK..",
    "...KK......KK..."
  ],

  // 3. 단검 (dagger) : 투척용 날렵한 밸런스 비수
  icon_dagger: [
    "..............WW",
    ".............WLW",
    "............WMMW",
    "...........WMMW.",
    "..........WMMW..",
    ".........WMMW...",
    "........WMMW....",
    ".......WMMW.....",
    "......WMMW......",
    ".....WMMW.......",
    "...KKKKW........",
    "..KGGKKK........",
    ".KGGKK..........",
    ".KKK............",
    "KC..............",
    "K..............."
  ],

  // 4. 표창 (shuriken - 공용) : 고속 회전 4방향 닌자 수리검
  icon_shuriken: [
    ".......KK.......",
    "......KLLK......",
    ".....KLLMK......",
    ".....KMMMK......",
    "...KKKMMMK..KK..",
    "..KLLMMMDMKKLLK.",
    ".KLLMMMDDDMLLMK.",
    "KKMMMDDKKDDMMMKK",
    "KKMMMDDKKDDMMMKK",
    ".KMLLMDDDMMLLK.",
    ".KLLKKMDMMMKK...",
    "..KK..KMMMKK....",
    "......KMMMK.....",
    "......KMLLK.....",
    "......KLLK......",
    ".......KK......."
  ],

  // 5. 채찍 (whip - 공용) : 나선형으로 똬리를 튼 가죽 채찍
  icon_whip: [
    "....KKKKKKKK....",
    "..KKEEEEEEEEKK..",
    ".KEEEOOOOOOEEEK.",
    "KEEEOOKKKKOOEEEK",
    "KEEOOKEEEEKOOEEK",
    "KEEOKEEEOEK.KOEK",
    "KEEOKEEKKEE.KOEK",
    "KEEOKEE.KEE.KOEK",
    "KEEOKEE.KEEKOEEK",
    "KEEOKEE.KKEOOEEK",
    "KEEOKEE..KEEEEKK",
    "KEEOKEE...KKKK..",
    ".KEOKEE.........",
    "..KKKOOO........",
    "....KOEEK.......",
    ".....KKKK......."
  ],

  // 6. 마법 화살 (missile - 공용) : 꼬리를 물고 유도 비행하는 비전 유성
  icon_missile: [
    "..............WW",
    "............WTTW",
    "...........WTTBW",
    ".........KKWTTBK",
    "........KTTWWTTK",
    ".......KTTBBWWK.",
    "......KTTBBTTK..",
    ".....KTTBBTTK...",
    "....KTTBBTTK....",
    "...KTBBTTKK.....",
    "..KTBBTTK.......",
    ".KTBBTK.........",
    "KTBBK...........",
    "KKK.............",
    "................",
    "................"
  ],

  // 7. 산탄 총포 (shotgun - 공용) : 묵직한 더블 배럴 샷건 총포
  icon_shotgun: [
    "................",
    "................",
    "..........KKKKKK",
    ".....KKKKKLLLLLL",
    "..KKKDDDDDMMMMMM",
    "KKDDDDDMMMMMMMMM",
    "KDDDDMMMMMMMMKKK",
    "KDDMMKKKKKKKK...",
    "KDDKK...........",
    "KDKK............",
    "KDKK............",
    "KK..............",
    "................",
    "................",
    "................",
    "................"
  ],

  // 8. 성수 (holywater - 성직자 시그니처) : 성스러운 황금 성배(Holy Grail)
  icon_holywater: [
    "..KKKKKKKKKKKK..",
    ".KGGYYYYYYYYGGK.",
    ".KGYWWTWWTTWYGK.",
    ".KGYWTTTTTTWYGK.",
    "..KGYWTTTTWYGK..",
    "...KGYWTTWYGK...",
    "....KGGYYGGK....",
    ".....KGYYGK.....",
    "......KGGK......",
    "......KGGK......",
    ".....KGYYGK.....",
    "....KGGYYGGK....",
    "...KGYYYYYYGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    "................"
  ],

  // 9. 성역 (sanctuary - 공용) : 360도 수호 룬 결계 진
  icon_sanctuary: [
    "......KKKK......",
    ".....KYYYYK.....",
    "....KYWWWWYK....",
    "...KYWKKKKWYK...",
    "..KYWK.KK.KWYK..",
    "..KYWKKWWKKWYK..",
    ".KYWWKKWWKKWWYK.",
    ".KYYWWWWWWWWYYK.",
    ".KYYWWWWWWWWYYK.",
    ".KYWWKKWWKKWWYK.",
    "..KYWKKWWKKWYK..",
    "..KYWK.KK.KWYK..",
    "...KYWKKKKWYK...",
    "....KYWWWWYK....",
    ".....KYYYYK.....",
    "......KKKK......"
  ],

  // 10. 번개 반지 (lightning - 공용) : 벼락 룬 번개 심볼
  icon_lightning: [
    ".......KK.......",
    "......KYYK......",
    ".....KYYYYK.....",
    "....KYYYYYK.....",
    "...KYYYYYYK.....",
    "..KYYYYYYYYK....",
    "...KKKKYYYYK....",
    "......KYYYYK....",
    ".....KYYYYK.....",
    "....KYYYYK......",
    "...KYYYYK.......",
    "..KYYYYK........",
    ".KYYYYK.........",
    "..KYYK..........",
    "...KK...........",
    "................"
  ],

  // 11. 불 지팡이 (firewand - 마도사 시그니처) : 타오르는 화염보주 지팡이
  icon_firewand: [
    ".......KK.......",
    "......KYYK......",
    ".....KYCCYK.....",
    "....KYCCCCYK....",
    "....KCCCCCCK....",
    ".....KCRRCK.....",
    "......KGGK......",
    ".....KOGGK......",
    "....KOOOGK......",
    "...KOOOGK.......",
    "..KOOOGK........",
    ".KOOOGK.........",
    "KOOOGK..........",
    "KOGGK...........",
    ".KKK............",
    "................"
  ],

  // 12. 독비수 (poisondagger - 암살자 시그니처) : 독방울 맺힌 암살자의 맹독 곡도(쿠크리)
  icon_poisondagger: [
    "..............AA",
    ".............AS.",
    "............KAAK",
    "...........KSAK.",
    "..........KSSAK.",
    ".....KK..KSAAK..",
    "....KAAKKSAAK...",
    "...KSSAAASAK....",
    "...KSAAAAAK.....",
    "..KKSSAAAK......",
    ".KDDSAAAK.......",
    "KDDDSSAASAK.....",
    ".KDDKK...KAAK...",
    "..KK......KSAK..",
    "...........KAAK.",
    "............KK.."
  ],

  // 13. 빙결 보주 (frostorb - 공용) : 눈꽃 얼음 결정이 각인된 차가운 수정구
  icon_frostorb: [
    ".....KKKKKK.....",
    "...KKTTWWTTKK...",
    "..KTTWWWWWWTTK..",
    ".KTTW..WW..WTTK.",
    ".KT.W.WWWW.W.TK.",
    "KTWWWWWWWWWWWWTT",
    "KT..WWWWWWWW..TK",
    "KTWWWWWWWWWWWWTT",
    "KTWWWWWWWWWWWWTT",
    "KT..WWWWWWWW..TK",
    "KTWWWWWWWWWWWWTT",
    ".KT.W.WWWW.W.TK.",
    ".KTTW..WW..WTTK.",
    "..KTTWWWWWWTTK..",
    "...KKTTWWTTKK...",
    ".....KKKKKK....."
  ],

  // 14. 바람 활 (windbow - 실프 시그니처) : 바람 깃털이 달린 우아한 엘프 장궁
  icon_windbow: [
    "..............KK",
    "............KKAA",
    "..........KKAAAA",
    "........KKSSAAKK",
    ".......KSSAAKK..",
    "......KSSAKK.W..",
    ".....KSSAK..WW..",
    "....KSSAK...WW..",
    "...KSSAK....WW..",
    "..KSSAK.....WW..",
    ".KSSAK......WW..",
    "KKAAK.......WW..",
    "KAAK........WW..",
    "KK..........KK..",
    "................",
    "................"
  ],

  // 15. 어둠의 보주 (shadoworb - 워록 시그니처) : 붉은 악마 눈동자와 심연의 블랙홀 오브
  icon_shadoworb: [
    ".....KKKKKK.....",
    "...KKPPVVPPKK...",
    "..KPPVVCCVVPPK..",
    ".KPVVCCCCVVPPK..",
    ".KPVCCYYCCVVPK..",
    "KPVCCYYYYCCVVPKK",
    "KPVCCYYYYCCVVPKK",
    "KPVCCYYCCVVPKKKK",
    "KPVVCCCCVVPPKKKK",
    "KPVVCCCCVVPPKKKK",
    "KPVVCCCCVVPPK...",
    ".KPVVVVVVVVPK...",
    ".KPPVVVVVVPPK...",
    "..KKPPVVPPKK....",
    "....KKKKKK......",
    "................"
  ],

  // ================= 14대 2단계 진화 무기 아이콘 =================

  // [진화 1] 천상의 성역 (heavenlySanctuary)
  icon_heavenlysanctuary: [
    "......KYYK......",
    ".....KYWWYK.....",
    "....KYWTTWYK....",
    "...KYWTKKTWYK...",
    "..KYWTKWWKTWYK..",
    ".KYYTTKWWKTTYYK.",
    ".KYWWKKWWKKWWYK.",
    "KYWTWWWWWWWWTTYK",
    "KYWTWWWWWWWWTTYK",
    ".KYWWKKWWKKWWYK.",
    ".KYYTTKWWKTTYYK.",
    "..KYWTKWWKTWYK..",
    "...KYWTKKTWYK...",
    "....KYWTTWYK....",
    ".....KYWWYK.....",
    "......KYYK......"
  ],

  // [진화 2] 모닝스타 선풍 (morningstarTempest)
  icon_morningstartempest: [
    "...KK......KK...",
    "..KLLK....KLLK..",
    "..KLMMKKKKMMLK..",
    "...KMMMDDMMMK...",
    "..KMMMWWWWMMMK..",
    ".KLMDWWKKWWDMMLK",
    "KKMDWWKKKKWWDMKK",
    "KLMDWKK..KKWDMML",
    "KLMDWKK..KKWDMML",
    "KKMDWWKKKKWWDMKK",
    ".KLMDWWKKWWDMMLK",
    "..KMMMWWWWMMMK..",
    "...KMMMDDMMMK...",
    "..KLMMKKKKMMLK..",
    "..KLLK....KLLK..",
    "...KK......KK..."
  ],

  // [진화 3] 멸망의 혜성 (apocalypseComet)
  icon_apocalypsecomet: [
    "......KCCK......",
    "....KKCCCCKK....",
    "...KCYYYYYYCK...",
    "..KCYWWWWWWYCK..",
    ".KCYWVVVVWWYCK.",
    ".KCYWVVVVWWYCK.",
    "KCCWVVRRVVWWCCK",
    "KCCWVRRRRVWWCCK",
    "KCCWVRRRRVWWCCK",
    "KCCWVVRRVVWWCCK",
    ".KCYWVVVVWWYCK.",
    ".KCYWVVVVWWYCK.",
    "..KCYWWWWWWYCK..",
    "...KCYYYYYYCK...",
    "....KKCCCCKK....",
    "......KCCK......"
  ],

  // [진화 4] 학살자의 폭풍검 (slayerBladeStorm)
  icon_slayerbladestorm: [
    "KLLK........KLLK",
    "KMLLK......KLLMK",
    "KKMLLK....KLLMKK",
    ".KKMLLK..KLLMKK.",
    "..KKMDDKKDDMKK..",
    "...KMDDYYDDMK...",
    "...KMDYYYYDMK...",
    "..KKDYYYYYYDKK..",
    "..KKDYYYYYYDKK..",
    "...KMDYYYYDMK...",
    "...KMDDYYDDMK...",
    "..KKMDDKKDDMKK..",
    ".KKMLLK..KLLMKK.",
    "KKMLLK....KLLMKK",
    "KMLLK......KLLMK",
    "KLLK........KLLK"
  ],

  // [진화 5] 테슬라 뇌전포 (teslaShotgun)
  icon_teslashotgun: [
    "....KK....KK....",
    "...KTTK..KTTK...",
    "..KTTWWKKTWWK...",
    "..KTWWYYKYYWWK..",
    ".KTWWYYKKYYWWK.",
    ".KTTYYKKKKYTTK.",
    "KKTTYYYYYYTTKKKK",
    "KTTTTTTTTTTTTTTK",
    "KTTTTTTTTTTTTTTK",
    "KKTTYYYYYYTTKKKK",
    ".KTTYYKKKKYTTK.",
    ".KTWWYYKKYYWWK.",
    "..KTWWYYKYYWWK..",
    "..KTTWWKKTWWK...",
    "...KTTK..KTTK...",
    "....KK....KK...."
  ],

  // [진화 6] 베놈 블리자드 (venomBlizzard)
  icon_venomblizzard: [
    ".....KKKKKK.....",
    "...KKSATTTASKK..",
    "..KSAWWWWWWASK..",
    ".KSAWTTAATTWASK.",
    ".KSAWTAASATWASK.",
    "KSAWTTAASATTWASK",
    "KSATTSSAASSTTTAK",
    "KSAWTTAASATTWASK",
    "KSAWTTAASATTWASK",
    "KSATTSSAASSTTTAK",
    "KSAWTTAASATTWASK",
    ".KSAWTAASATWASK.",
    ".KSAWTTAATTWASK.",
    "..KSAWWWWWWASK..",
    "...KKSATTTASKK..",
    ".....KKKKKK....."
  ],

  // [진화 7] 벼락검 (thunderBlade) : 지그재그 번개 검신과 뇌전 스파크
  icon_thunderblade: [
    "..............YY",
    ".............YWK",
    "...........KTTWK",
    "..........KTTWKY",
    "........KKTTWK..",
    ".......KTTWWK...",
    "......KTTWK.....",
    "....KKTTWWK.....",
    "...KTTWWK...YY..",
    "..KTTWWK...KYYK.",
    ".KTTWK......KK..",
    ".KWWKGGKK.......",
    "..KKGYYGGK......",
    "...KGGKK........",
    "....KMMK........",
    ".....KK........."
  ],

  // [진화 8] 화염 도끼 (fireAxe) : 작열하는 불꽃의 버닝 배틀액스
  icon_fireaxe: [
    "...YY......YY...",
    "..YCCY....YCCY..",
    ".YCWWCY..YCWWCY.",
    "KCCYYCK..KCYYCCK",
    "KCRRCK....KCRRCC",
    ".KKRKK....KKRKK.",
    "...KKOOOOOOKK...",
    "....KOOEEEOK....",
    "....KOOEEEOK....",
    "....KOOEEEOK....",
    "...KKOOOOOOKK...",
    ".KCRRCK....KCRRC",
    "KCCYYCK..KCYYCCK",
    ".YCWWCY..YCWWCY.",
    "..YCCY....YCCY..",
    "...YY......YY..."
  ],

  // [진화 9] 얼음 채찍 (frostWhip) : 고드름 얼음 가시가 돋친 프로스트 휩
  icon_frostwhip: [
    "....KKTTTTKK....",
    "..KKTTWWWWTTKK..",
    ".KTTWWTTTTWWTTK.",
    "KTTWWTKKKKTTWWTK",
    "KTWWTKTTTTKTTWTK",
    "KTWWTKTTTWTK.KWT",
    "KTWWTKTTKKTT.KWT",
    "KTWWTKTT.KTT.KWT",
    "KTWWTKTT.KTTKTWK",
    "KTWWTKTT.KKTWWTT",
    "KTWWTKTT..KTTTKK",
    "KTWWTKTT...KKKK.",
    ".KTWTKTT........",
    "..KKKTTT........",
    "....KTTWK.......",
    ".....KKKK......."
  ],

  // [진화 10] 산탄 표창 (scatterShuriken) : 8방향 기계식 강철 산탄 수리검
  icon_scattershuriken: [
    ".......KK.......",
    "...KK.KLLK.KK...",
    "..KLLKMMMMKLLK..",
    "...KMMWDDWMMK...",
    ".KK.MWDKKDW.M.KK",
    "KLLMWDKKKKDWMLLK",
    "KMMMDDKKKKDDMMMK",
    ".KWDDKKKKKKDDWK.",
    ".KWDDKKKKKKDDWK.",
    "KMMMDDKKKKDDMMMK",
    "KLLMWDKKKKDWMLLK",
    ".KK.MWDKKDW.M.KK",
    "...KMMWDDWMMK...",
    "..KLLKMMMMKLLK..",
    "...KK.KLLK.KK...",
    ".......KK......."
  ],

  // [진화 11] 신성 화살 (holyArrow) : 천사의 날개가 달린 빛의 화살
  icon_holyarrow: [
    "..............YY",
    ".............YYW",
    "............YYWW",
    "...........YYWWT",
    "..........YYWWTT",
    ".........YYWWTT.",
    "........YYWWTT..",
    ".......YYWWTT...",
    "......YYWWTT....",
    ".....YYWWTT.....",
    "...KKYYWWTT.....",
    "..KWWYYWWTT.....",
    ".KWWLKYTT.......",
    "KWL...KTT.......",
    "KL.....KT.......",
    "K..............."
  ],

  // [진화 12] 역병 (plague) : 독골 해골 문양과 보라색 역병 결계
  icon_plague: [
    ".....KKKKKK.....",
    "...KKSSSSSSKK...",
    "..KSSAAPPPAASSK.",
    ".KSAAPWKKWPAASK.",
    ".KSAAPWWWWPAASK.",
    "KSAAAPWKKWPAAASK",
    "KSAAAPWWWWPAAASK",
    "KSSAAAPPPPAAASSS",
    "KSSAAAPPPPAAASSS",
    "KSAAAKPKPKPKAAASK",
    "KSAAAKKKKKKKAAASK",
    ".KSAAAAAAAAAAASK.",
    ".KSSAAAAAAAAASSK.",
    "..KKSSSSSSSSKK..",
    "....KKKKKKKK....",
    "................"
  ],

  // [진화 13] 태풍의 눈 (cycloneBow) : 거대한 태풍 룬이 깃든 사이클론 보우
  icon_cyclonebow: [
    "..............TT",
    "............TTAA",
    "..........TTAAAA",
    "........TTAAAATT",
    "......TTAATT.WW.",
    ".....TTAAT...WW.",
    "....TTAAT....WW.",
    "...TTAAT.TT..WW.",
    "..TTAAT.TAAT.WW.",
    ".TTAAT..TAAT.WW.",
    "TTAAT....TT..WW.",
    "TAAT.........WW.",
    "TAAT.........WW.",
    "TT...........TT.",
    "................",
    "................"
  ],

  // [진화 14] 황혼의 나선 (eclipseSpiral) : 태양과 달이 교차하는 일식 은하 나선
  icon_eclipsespiral: [
    ".......KK.......",
    "....KKYYYYKK....",
    "..KKYYWWWWYYKK..",
    ".KYYYYPPPPYYYYK.",
    "KYYYPPCCCCPPYYYK",
    "KYYPPCCKKCCPPYYK",
    "KYPPCCK..KCCPPYK",
    "KPPCCK....KCCPPK",
    "KPPCCK....KCCPPK",
    "KYPPCCK..KCCPPYK",
    "KYYPPCCKKCCPPYYK",
    "KYYYPPCCCCPPYYYK",
    ".KYYYYPPPPYYYYK.",
    "..KKYYWWWWYYKK..",
    "....KKYYYYKK....",
    ".......KK......."
  ],

  // ================= 레거시 / 대체 아이콘 4종 =================
  icon_acid: [
    ".......AA.......",
    ".....SS.AA......",
    "......KKKK......",
    "......KWWK......",
    "......KWWK......",
    ".....KKWWKK.....",
    "....KSAAAASK....",
    "...KSAAAAAAASK..",
    "..KSAAAAAAAASK..",
    ".KSAAWWAAWWAAASK",
    ".KSAAWWAAWWAAASK",
    "KSAAAAAAAAAAAAASK",
    "KSSAAAKKKKAAASSSK",
    "KKSSSSSSSSSSSSSKK",
    ".KKKKKKKKKKKKKK.",
    "................"
  ],
  icon_holyshotgun: [
    "....KKKKKKKK....",
    "...KYYWWWWYYK...",
    "..KYYWLLLLWYYK..",
    ".KYYWLMKKMLWYYK.",
    ".KYYWLKWWKLWYYK.",
    ".KYYWLMKKMLWYYK.",
    "..KYYWLLLLWYYK..",
    "...KYYWWWWYYK...",
    "....KKYYYYKK....",
    ".....KYYYYK.....",
    ".....KYYYYK.....",
    ".....KYYEEK.....",
    ".....KYYEEK.....",
    "....KYYEEEKK....",
    "...KKYYEEEEEKK..",
    "................"
  ],
  icon_arcanesanctuary: [
    "......KWWK......",
    "....KKTTTTKK....",
    "...KTTBBBBTTK...",
    "..KTBBWWWWBBTK..",
    ".KTBWWTTTTWWBTK.",
    ".KTBWTTKKTTWBTK.",
    "KTBWTTK..KTTWBTK",
    "KTBWTTK..KTTWBTK",
    "KTBWTTK..KTTWBTK",
    ".KTBWTTKKTTWBTK.",
    ".KTBWWTTTTWWBTK.",
    "..KTBBWWWWBBTK..",
    "...KTTBBBBTTK...",
    "....KKTTTTKK....",
    "......KWWK......",
    "................"
  ],
  icon_plasmatempest: [
    "......KYYK......",
    "....KKYYYYKK....",
    "...KYYVVVVYYK...",
    "..KYVVRRRRVVYK..",
    ".KYVRRCCCCRRVYK.",
    ".KYVRCCCCCCRVYK.",
    "KYVRCCWWWWCCRVYK",
    "KYVRCCWWWWCCRVYK",
    "KYVRCCWWWWCCRVYK",
    ".KYVRCCCCCCRVYK.",
    ".KYVRRCCCCRRVYK.",
    "..KYVVRRRRVVYK..",
    "...KYYVVVVYYK...",
    "....KKYYYYKK....",
    "......KYYK......",
    "................"
  ],

  // ================= 패시브 스탯 아이콘 15종 =================
  icon_armor: [
    "..KKKKKKKKKKKK..",
    ".KLLLLLLLLLLLLK.",
    "KLMMMMMMMMMMMMLK",
    "KLMDDDDDDDDDDMLK",
    "KLMDDDKKKKDDDMLK",
    "KLMDDKYYYYKDDMLK",
    "KLMDDKYYYYKDDMLK",
    "KLMDDDKKKKDDDMLK",
    "KLMDDDDDDDDDDMLK",
    ".KLMDDDDDDDDMLK.",
    "..KLMDDDDDDMLK..",
    "...KLMDDDDMLK...",
    "....KLMDDMLK....",
    ".....KLMDMLK....",
    "......KLMLK.....",
    ".......KKK......"
  ],
  icon_speed: [
    "................",
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "...KWKKKKKKWK...",
    "...KWWWWWWWWK...",
    "....KKKKKKKK....",
    "....KLLLLLLK....",
    "....KLLMMLLK....",
    "....KMMDDMMK....",
    "....KMMDDMMK....",
    "...KMMDDDDMMKK..",
    "..KMMDDDDDDMMMMK",
    ".KMMDDDDDDDDMMMK",
    "KMMDDDDDDDDDDMMK",
    "KKKKKKKKKKKKKKKK",
    "................"
  ],
  icon_atk: [
    "..............WW",
    ".............WLW",
    "............WMMW",
    "...........WMMW.",
    "..........WMMW..",
    ".........WMMW...",
    "........WMMW....",
    ".......WMMW.....",
    "......WMMW......",
    ".....WMMW.......",
    "...KKKKW........",
    "..KCCKKK........",
    ".KCCKK..........",
    ".KKK............",
    "KR..............",
    "K..............."
  ],
  icon_heal: [
    "................",
    "WW..KKKK..KKKK..",
    "WL.KCCCCKKCCCCK.",
    "W.KCCCCWWCCCCCCK",
    "L.KCCCCCCCCCCCCK",
    ".LKCCCCCCCCCCCCK",
    "..LKCCCCCCCCCCK.",
    "...LKCCCCCCCCK..",
    "....KCCCCCCCCK..",
    ".....KCCCCCCK.L.",
    "......KCCCCK..LW",
    ".......KCCK..LLW",
    "........KK...LWW",
    "............LWW.",
    "................",
    "................"
  ],
  icon_regen: [
    "................",
    "..KKKK....KKKK..",
    ".KCCCCK..KCCCCK.",
    "KCCCCCCKKCCCCCCK",
    "KCCCCCCWWCCCCCCK",
    "KCCCCCCCCCCCCCCK",
    ".KCCCCCCCCCCCCK.",
    "..KCCCCCCCCCCK..",
    "...KCCCCCCCCK...",
    "....KCCCCCCK....",
    ".....KCCCCK.....",
    "......KCCK......",
    ".......KK.......",
    "................",
    "................",
    "................"
  ],
  icon_hp: [
    "......KKKK......",
    "...KKKRRRRKKK...",
    "..KRRCCCCCCRRK..",
    ".KRCCCCCCCCCCRK.",
    ".KRCCCCWWCCCCRK.",
    "KRCCCCWWWWCCCCRK",
    "KRCCCWWWWWWCCCRK",
    "KRCCCCCCCCCCCCRK",
    "KRCCCCCCCCCCCCRK",
    ".KRCCCCCCCCCCRK.",
    ".KRCCCCCCCCCCRK.",
    "..KRRCCCCCCRRK..",
    "...KKKRRRRKKK...",
    "......KKKK......",
    "................",
    "................"
  ],
  icon_global_speed: [
    ".............KK.",
    "............KYYK",
    "...........KYYK.",
    "..........KYYK..",
    ".........KYYK...",
    "........KYYK....",
    ".......KYYK.....",
    "......KYYK......",
    ".....KYYK.......",
    "....KYYK........",
    "...KYYK.........",
    "..KYYK..........",
    ".KYYK...........",
    "KYYK............",
    "KK..............",
    "................"
  ],
  icon_proj_speed: [
    "...............K",
    ".............KYY",
    "...........KYYYY",
    ".........KYYTTTK",
    ".......KYYTTTK..",
    ".....KYYTTTK....",
    "...KYYTTTK......",
    ".KYYTTTK........",
    "KYYTTK..........",
    ".KTTK...........",
    "..KK............",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  icon_proj_count: [
    ".........K......",
    ".......KYYK.....",
    ".....KYYYYK.K...",
    "...KYYTTTK.KYYK.",
    ".KYYTTTK..KYYYYK",
    "KYYTTK...KYYTTTK",
    ".KTTK...KYYTTK..",
    "..KK...KYYTTK...",
    "......KYYTTK....",
    ".....KYYTTK.....",
    "....KYYTTK......",
    "...KYYTTK.......",
    "..KYYTTK........",
    ".KYYTTK.........",
    "KYYTTK..........",
    "KKKK............"
  ],
  icon_clover: [
    "....KK....KK....",
    "...KAAK..KAAK...",
    "..KAAAAKKAAGAK..",
    "..KAAASSSAAGAK..",
    "...KASSSSSSAK...",
    ".KKKASSSSSSAKKK.",
    "KAASSSSSSSSSSAAK",
    "KAGASSSSSSSSAGAK",
    "KAGASSSSSSSSAGAK",
    "KAASSSSSSSSSSAAK",
    ".KKKASSSSSSAKKK.",
    "...KASSSSSSAK...",
    "..KAAASSSAAGAK..",
    "..KAAAAKKAAGAK..",
    "...KAAK.KKAAK...",
    "....KK...KOK...."
  ],
  icon_crown: [
    "................",
    "................",
    "..KYK..KYK..KYK.",
    "..KYYKKYYYYKKYYK",
    ".KYYYYYYYYYYYYYK",
    ".KYYCYYYBYYYCYYK",
    ".KYYYYYYYYYYYYYK",
    ".KGGGGGGGGGGGGGK",
    "..KGGGGGGGGGGGK.",
    "...KKKKKKKKKKK..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  icon_vampire: [
    "....KK....KK....",
    "...KRCCK..KRCCK...",
    "..KRCCCCKKRCCCCK..",
    ".KRCCCCCCKRCCCCCCK",
    ".KRCCWWCCKRCCWWCCK",
    "KRCCCWWCCKRCCCWWCK",
    "KRCCCWWCCKRCCCWWCK",
    "KRCCCWWCCKRCCCWWCK",
    "KRCCCCWCCKRCCCCWCK",
    ".KRCCCCWKRCCCCWK.",
    ".KRCCCCKKRCCCCK..",
    "..KRCCCKKRCCCK...",
    "...KRCCKKRCCK....",
    "....KRCKKRCK.....",
    ".....KK..KK.....",
    "................"
  ],
  icon_shield: [
    "KKKKKKKKKKKKKKKK",
    "KTTTTTTTTTTTTTTK",
    "KTWWWWWWWWWWWWTT",
    "KTWWYYYYYYYYWWTT",
    "KTWWYYYYYYYYWWTT",
    "KTWWYYKKKKYYWWTT",
    "KTWWYYKKKKYYWWTT",
    "KTWWYYKKKKYYWWTT",
    ".KTWYYYYYYYYWWK.",
    ".KTWWYYYYYYWWK..",
    "..KTWWYYYYWWK...",
    "...KTWWYYWWK....",
    "....KTWWWWK.....",
    ".....KTTWK......",
    "......KTK.......",
    ".......K........"
  ],
  icon_crit_dmg: [
    "................",
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRCCCCCCRK...",
    "..KRCCWWWWCCRK..",
    "..KRCWWCCWWCRK..",
    "..KRCWWCCWWCRK..",
    "..KRCCWWWWCCRK..",
    "...KRCCWWCCRK...",
    "....KRRWWRRK....",
    ".....KKWWKK.....",
    ".......WW.......",
    ".....KKWWKK.....",
    "....KRRWWRRK....",
    ".....KKKKKK.....",
    "................"
  ],
  icon_thorns: [
    "K..............K",
    "KK....KKKK....KK",
    ".KK..KDDMMK..KK.",
    "..KKKDDMMMMKKK..",
    "...KDMMMMMMDDK..",
    "..KDMMMDDDDMMDK.",
    ".KDMMDDKKKKDDMMK",
    ".KDMMDKWWKKDMMDK",
    ".KDMMDKWWKKDMMDK",
    ".KDMMDDKKKKDDMMK",
    "..KDMMMDDDDMMDK.",
    "...KDMMMMMMDDK..",
    "..KKKDDMMMMKKK..",
    ".KK..KDDMMK..KK.",
    "KK....KKKK....KK",
    "K..............K"
  ],

  // ================= 특수 필드 드랍 3종 =================
  item_magnet: [
    "...KKKK..KKKK...",
    "..KRRRRKKRRRRK..",
    ".KRRRRRRRRRRRRK.",
    ".KRRKKRRRRKKRRK.",
    ".KRK..KRRK..KRK.",
    ".KRK..KRRK..KRK.",
    ".KRK..KRRK..KRK.",
    ".KRK..KRRK..KRK.",
    ".KWK..KWWK..KWK.",
    ".KWK..KWWK..KWK.",
    ".KLK..KLLK..KLK.",
    ".KLK..KLLK..KLK.",
    ".KMK..KMMK..KMK.",
    ".KKK..KKKK..KKK.",
    "................",
    "................"
  ],
  item_bomb: [
    "...........YYYY.",
    "..........YYYYY.",
    ".........KYYYYK.",
    "........KWWKKK..",
    ".......KWWK.....",
    "......KKKKKK....",
    "....KKDDDDDDKK..",
    "...KDDDDDDDDDDK.",
    "..KDDDDDDDDDDDDK",
    ".KDDDWWDDDDDDDDD",
    ".KDDDWWDDDDDDDDD",
    ".KDDDDDDDDDDDDDD",
    "..KDDDDDDDDDDDDK",
    "...KDDDDDDDDDDK.",
    "....KKDDDDDDKK..",
    "......KKKKKK...."
  ],
  item_freeze: [
    ".......TT.......",
    "......TTTT......",
    ".T.....TT.....T.",
    ".TT....TT....TT.",
    "..TT...TT...TT..",
    "...TT..TT..TT...",
    "....TTTTTTTT....",
    "TTTTTTTWWTTTTTTT",
    "TTTTTTTWWTTTTTTT",
    "....TTTTTTTT....",
    "...TT..TT..TT...",
    "..TT...TT...TT..",
    ".TT....TT....TT.",
    ".T.....TT.....T.",
    "......TTTT......",
    ".......TT......."
  ],

  // ================= 필드 장애물 3종 =================
  obstacle_tree: [
    ".....KKSSSKK....",
    "...KKSSAAASSKK..",
    "..KSSAAAAAAASSK.",
    ".KSSAAAGGGAAASSK",
    ".KSSAAAGGAAAASSK",
    ".KSSAAAAAAAAASSK",
    "..KSSAAAAAAASSK.",
    "...KKSSAAASSKK..",
    ".....KKOOKK.....",
    "....KKOOOKK.....",
    "....KKOOOKK.....",
    "....KKOODKK.....",
    "....KKOODKK.....",
    "...KKODDDKKK....",
    "..KKODDDDDDKK...",
    "................"
  ],
  obstacle_rock: [
    ".....KKKKKK.....",
    "....KZZZZZZK....",
    "...KZHZZZZHZK...",
    "..KZHWWZZZZHZK..",
    "..KZHHZZZZZZZK..",
    ".KZHHHHZZZZDDKK.",
    ".KZHHZZZZZZDDDK.",
    ".KZZZZZZZZDDDDK.",
    ".KZZZZZZZDDDDDK.",
    ".KZZZZZZZDDDDDK.",
    ".KZZZZZZZDDDDDK.",
    ".KZZZZZZDDDDDDK.",
    "..KZDDDDDDDDDK..",
    "..KKDDDDDDDDKK..",
    "...KKKKKKKKKK...",
    "................"
  ],
  obstacle_crate: [
    "..KKKKKKKKKKKK..",
    ".KGEEEEEEEEEEGK.",
    ".KEGKKKKKKKKGEK.",
    ".KEKOOOOOOOOKEKO",
    ".KEKOEEOEEOOKEKO",
    ".KEKOOEOEOOOKEKO",
    ".KEKGGEEGGEEKEKO",
    ".KEKOOEOEOOOKEKO",
    ".KEKOEEOEEOOKEKO",
    ".KEKOOOOOOOOKEKO",
    ".KEGKKKKKKKKGEK.",
    ".KGEEEEEEEEEEGK.",
    "..KKKKKKKKKKKK..",
    "................",
    "................",
    "................"
  ],

  // ================= 공격 애니메이션 및 투사체 9종 =================
  anim_sword: [
    "...............W",
    "..............WL",
    ".............WLM",
    "............WLMD",
    "...........WLMD.",
    "..........WLMD..",
    ".........WLMD...",
    "........WLMD....",
    ".......WLMD.....",
    "......WLMD......",
    ".....WLMD.......",
    "...KKKKD........",
    "..KGGKKK........",
    ".KGGKK..........",
    ".KKK............",
    "KC.............."
  ],
  anim_axe: [
    ".......KKKKKK...",
    ".....KKWWWLLLKK.",
    "....KWWLLMMMMDKK",
    "...KWLLMMMKKKKKK",
    "..KWLMMMKK..KK..",
    ".KWLMMKK....KO..",
    ".KLLMKK....KOO..",
    "KKMMKK....KOO...",
    "KKKKK....KOO....",
    "........KOO.....",
    ".......KOO......",
    "......KOO.......",
    ".....KOO........",
    "....KOO.........",
    "...KKK..........",
    "................"
  ],
  anim_dagger: [
    "...............W",
    "..............WL",
    ".............WLM",
    "............WLMD",
    "...........WLMD.",
    "..........WLMD..",
    ".........WLMD...",
    "........WLMD....",
    ".......WLMD.....",
    "......WLMD......",
    ".....WLMD.......",
    "...KKKKD........",
    "..KGGKKK........",
    ".KGGKK..........",
    ".KKK............",
    "KC.............."
  ],
  anim_whip: [
    ".......KK.......",
    "......KMMK......",
    ".....KMDDMK.....",
    "...KKKMDDMKKK...",
    "..KMMKMDDMKMMK..",
    ".KMDDMMWWMMDDK.",
    ".KMDDMWWWWMDDK.",
    "KKDDMWWKKWWDDMMK",
    "KKDDMWWKKWWDDMMK",
    ".KMDDMWWWWMDDK.",
    ".KMDDMMWWMMDDK.",
    "..KMMKMDDMKMMK..",
    "...KKKMDDMKKK...",
    ".....KMDDMK.....",
    "......KMMK......",
    ".......KK......."
  ],
  anim_bladewhip: [
    "..............KK",
    "...........KKKYY",
    "........KKKYYWWL",
    "......KKYYWWLMMD",
    "....KKYYWWLMDDKK",
    "..KKYYWWLMDDKK..",
    ".KYYWWLMDDKKWWL.",
    "KYYWLMDDKK.KKKK.",
    "KYLMDDKKWWL.....",
    "KLMDDKK.KKKK....",
    ".KMDDKKWWL......",
    "..KDDKK.KKKK....",
    "...KDDKK........",
    "....KDKK........",
    ".....KKK........",
    "......KK........"
  ],
  anim_muzzle: [
    ".......YY.......",
    ".....YYYYYY.....",
    "...YYYYCCCCCC...",
    "..YYYCCCCCCCCYY.",
    ".YYCCCCWWCCCCYY.",
    ".YYCCCWWWWCCCYY.",
    ".YYCCCWWWWCCCYY.",
    "..YYCCCCCCCCYY..",
    "...YYYCCCCYYYY..",
    ".....YYYYYY.....",
    ".......YY.......",
    "................",
    "................",
    "................",
    "................",
    "................"
  ],
  proj_dagger: [
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......WW.......",
    "......WLLW......",
    ".....WLLMMW.....",
    ".....WLLMMW.....",
    "......KKKK......",
    "......KGGK......",
    "......KGGK......",
    ".......KK.......",
    "................",
    "................",
    "................"
  ],
  proj_shuriken: [
    ".......KK.......",
    "......KWWK......",
    ".....KLLLK......",
    ".....KLMLK......",
    "...KKKLMLKK.KK..",
    "..KWWLMMDMKKWWK.",
    ".KWWLMMDDDMLLWK.",
    "KKLLMDDKKDDLLMKK",
    "KKMLLDDKKDMMLLKK",
    ".KWLLMDDDMLLWWK.",
    ".KWWKKMDMLKKK...",
    "..KK..KLMLK.....",
    "......KLMLK.....",
    "......KLLLK.....",
    "......KWWK......",
    ".......KK......."
  ],
  proj_holypellet: [
    "................",
    "................",
    "................",
    "......KKKK......",
    ".....KYYYYK.....",
    "....KYYWWYYK....",
    "...KYYWWWWYYK...",
    "...KYYWWWWYYK...",
    "...KYYWWWWYYK...",
    "...KYYWWWWYYK...",
    "....KYYWWYYK....",
    ".....KYYYYK.....",
    "......KKKK......",
    "................",
    "................",
    "................"
  ]
};

// 모든 스프라이트 파일 저장 (기본 16x16을 32x32로 2배 스케일링하여 저장)
console.log('🖌️ 다크 판타지 픽셀 아트 스프라이트 생성 시작...');
let count = 0;

for (const key in SPRITES) {
  const matrix = SPRITES[key];
  const { width, height, buf } = renderMatrix(matrix, PALETTE, 2);
  const pngData = createPNG(width, height, buf);
  const filePath = path.join(ASSETS_DIR, `${key}.png`);
  fs.writeFileSync(filePath, pngData);
  count++;
}

console.log(`✅ 총 ${count}개의 다크 판타지 스프라이트 PNG가 성공적으로 생성되었습니다!`);
console.log(`📂 저장 위치: ${ASSETS_DIR}`);
