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
  // PNG 시그니처
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR 청크
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT 청크 (각 행 앞의 필터 바이트 0 포함)
  const rowSize = width * 4;
  const rawScanlines = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawScanlines[rowOffset] = 0; // Filter None
    rgbaBuffer.copy(rawScanlines, rowOffset + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND 청크
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

// CRC32 연산
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

// HEX 색상을 RGBA로 변환
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

// 텍스트 매트릭스를 RGBA 버퍼로 변환 (scale로 배율 확대 가능)
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

// ================= 다크 판타지 픽셀 아트 데이터 =================

const PALETTE = {
  '.': '.',
  'K': '#0f111a', // 딥 블랙 외곽선
  'D': '#1e2235', // 어두운 흉갑/음영
  'M': '#3e4566', // 중간 강철
  'L': '#8290be', // 밝은 하이라이트 강철
  'W': '#e2e8f0', // 순백/뼈
  'R': '#881337', // 핏빛 어두운 천/망토
  'C': '#e11d48', // 선혈 크림슨 레드
  'G': '#b45309', // 어두운 황금
  'Y': '#fde047', // 황금 안광/투구 틈새
  'S': '#14532d', // 맹독 슬라임 딥 그린
  'A': '#22c55e', // 슬라임 밝은 녹색
  'P': '#581c87', // 그림자 보라
  'V': '#a855f7', // 아케인 바이올렛
  'B': '#0369a1', // 영혼 푸른빛
  'T': '#38bdf8', // 시안 영기
  'O': '#78350f', // 맹수 짙은 털
  'E': '#d97706', // 맹수 밝은 털
  'Z': '#475569', // 석조 그레이
  'H': '#94a3b8'  // 밝은 석조
};

const SPRITES = {
  // 플레이어 (다크 나이트) 16x16
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

  // 1. 박쥐 (Bat) 16x16
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

  // 2. 슬라임 (Slime) 16x16
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

  // 3. 좀비 (Zombie) 16x16
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

  // 4. 해골 (Skeleton) 16x16
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

  // 5. 고블린 (Goblin) 16x16
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
    "..KDMMWMMMMDK...",
    "..KDDMMMMMMDK...",
    "...KDDDDDDDDK...",
    "....KSAKKSAK....",
    "....KSAKKSAK....",
    ".....KK..KK....."
  ],

  // 6. 유령 (Ghost) 16x16
  ghost: [
    ".....KKKKK......",
    "....KTTTTTTK....",
    "...KTTBTTBTTK...",
    "..KTTWTTTTWTK...",
    "..KTWWTTTTWWTK..",
    "..KTTKKTTKKTTK..",
    "..KTTTTTTTTTTK..",
    "..KTTTTTTTTTTK..",
    "...KTTBBBBTTK...",
    "...KTTTTTTTTK...",
    "....KTTTTTTK....",
    ".....KTTTTK.....",
    "....KTTTTTTK....",
    "...KTT.KTT.TK...",
    "...KT..KT...K...",
    "....K...K......."
  ],

  // 7. 가고일 (Gargoyle) 16x16
  gargoyle: [
    "Z..............Z",
    "KZ............KZ",
    "KZZK........KZZK",
    "KZZZZKKKKZZZZK..",
    ".KZZZZZZZZZZK...",
    "..KZZYYCCYYZK...",
    "..KZZYYKKYYZK...",
    "...KZZZZZZZZK...",
    "...KZZWKKWZZK...",
    "..KZZZWWWWZZZK..",
    ".KZZKKZZZZKKZZK.",
    "KZK.KZZZZZZK.KZK",
    "KK..KZZZZZZK..KK",
    "....KZZKKZZK....",
    "...KZZKKKZZK....",
    "....KK....KK...."
  ],

  // 8. 흑마술사 (Cultist) 16x16
  cultist: [
    ".....KKKKK......",
    "....KRRRRRK.....",
    "...KRRRRRRRK....",
    "...KRKYYKYYRK...",
    "...KRKKKKKKRK...",
    "....KRRRRRRK....",
    "V..KRRCCCCRRK...",
    "VK.KRCCCCCRRK...",
    "VVKKRCCCCCCRK...",
    ".VKRRCRRRCCRK...",
    "..KRRCRRRCCRK...",
    "...KRRRRRRRK....",
    "...KRRRRRRRK....",
    "...KRRKKKRRK....",
    "...KDK...KDK....",
    "....KK...KK....."
  ],

  // 9. 암살자 (Assassin) 16x16
  assassin: [
    ".....KKKKK......",
    "....KDDDDKK.....",
    "...KDLLDDKKK....",
    "...KDYYKYYKK....",
    "...KDDDDDDDK....",
    "....KKDDDDK.....",
    "L...KDDDDDK...L.",
    "LK..KDDLLDDK..KL",
    "LLKKDDLLLLDKKLL.",
    ".LKKDDDDDDDDKL..",
    "...KDDDDDDDK....",
    "...KDDDDDDDK....",
    "...KDDDKKDDK....",
    "...KLLK.KLLK....",
    "...KDK...KDK....",
    "....KK...KK....."
  ],

  // 10. 골렘 (Golem) 16x16
  golem: [
    "....KKKKKKKK....",
    "...KZZZZZZZZK...",
    "..KZZHWZZWHZZK..",
    "..KZZCCZZCCZZK..",
    "..KZZKKZZKKZZK..",
    "..KZZZZZZZZZZK..",
    ".KZZZZCCCCZZZZK.",
    "KZZZZZCCCCZZZZZK",
    "KZZKKZCCCCZKKZZK",
    "KZZKZZZZZZZZKZZK",
    "KZZKZZHWWHZZKZZK",
    ".KKKZZZZZZZZKKK.",
    "...KZZZZZZZZK...",
    "...KZZZKKZZZK...",
    "...KZZKKKKZZK...",
    "...KKK....KKK..."
  ],

  // 11. 타락한 마도사 (Dark Mage) 16x16
  darkMage: [
    ".....KKKKK......",
    "....KPPVPK......",
    "...KPVVVPKK.....",
    "...KPYKKYKK.....",
    "...KPVVVPKK.....",
    "....KPPPK.......",
    "Y..KPVVVVPK...Y.",
    "YK.KPVCCVPK..KY.",
    "YYKKPVCCVPK.KYY.",
    ".YKKPVVVVPKKYY..",
    "...KPVVVVPKK....",
    "...KPVVVVPK.....",
    "...KPVKKVPK.....",
    "...KPPK.KPPK....",
    "...KPK...KPK....",
    "....KK...KK....."
  ],

  // 12. 핏빛 사냥개 (Blood Hound) 16x16
  bloodHound: [
    "........KKKK....",
    ".......KRRRRK...",
    "......KRCYYCK...",
    "....KKKRRRRCK...",
    "...KCCCCRRRRK...",
    "..KCRRRRRRRRKK..",
    "..KRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRRK",
    ".KRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRK..",
    "..KRRKKKRRRRK...",
    "..KRK...KRRK....",
    "..KRK...KRK.....",
    ".KKKK..KKKK.....",
    "................",
    "................"
  ],

  // 13. 망령 군단 (Wraith Swarm) 16x16
  wraithSwarm: [
    ".....KKKKK......",
    "....KTTTTTK.....",
    "...KTTVVVTTK....",
    "...KTYKKTYTK....",
    "...KTTVVVTTK....",
    "....KTTTTTK.....",
    "...KTTVVVTTK....",
    "..KTTVWWVTTK....",
    ".KTTVWWWWVTTK...",
    ".KTTVWWWWVTTK...",
    "..KTTVVVTTK.....",
    "...KTTTTTK......",
    "....KTKTTK......",
    ".....K.K........",
    "................",
    "................"
  ],

  // 14. 심연의 거인 (Abyss Titan) 16x16
  abyssTitan: [
    "...KKKKKKKKKK...",
    "..KDDDDDDDDDDDK..",
    ".KDDKYYDDYYKDDK.",
    ".KDDDDDDDDDDDDK.",
    ".KDDMMDDDDMMDDK.",
    "KKDDMMDDDDMMDDKK",
    "KDDDDDDDDDDDDDDK",
    "KDDDDDDDDDDDDDDK",
    "KDDDDMMMMMMDDDDK",
    ".KDDMMKKKKMMDDK.",
    ".KDDDDK..KDDDDK.",
    "..KDDDK..KDDDK..",
    "..KDDDK..KDDDK..",
    "..KMMDK..KDMMK..",
    "..KKKKK..KKKKK..",
    "................"
  ],

  // 5종 보스 (각각 16x16 또는 대형 렌더링)
  boss_boar: [
    ".......KKKKKK...",
    "......KEOOOOEK..",
    ".....KEOYWWYOEK.",
    "....KEOOCCCCCOEK",
    "...KEOOCCCCCOEK.",
    "..KWKKEEEOEEEKWK",
    "..KWWEEOOOOEEWWK",
    ".KWWWEEOOOOEEWWW",
    ".KWWEEOOOOOOEWWK",
    "..KEEEOOOOOOEEEK",
    "..KEEKKKKKKKEEEK",
    "..KEEKOOOOOOKEEK",
    "..KEKOOOOOOOOKEK",
    "..KKKOOKKKKOOKKK",
    "....KOKK..KOKK..",
    "....KK....KK...."
  ],

  boss_void: [
    ".....KKKKKK.....",
    "....KPPPPPPK....",
    "...KPPVVVVPPK...",
    "...KPVVYYVVPK...",
    "...KPVKKKKVPK...",
    "....KPVVVVPK....",
    "T..KPPVVVVPPK..T",
    "TK.KPVVCCVVPK.KT",
    "TTKKPVCCCCVPKKTT",
    ".TKPPVCCCCVPPKT.",
    "..KPPPVVVVPPPK..",
    "..KPPPPVVPPPPK..",
    "..KPPPPVVPPPPK..",
    "...KPPKKKKPPK...",
    "....KK....KK....",
    "................"
  ],

  boss_eye: [
    ".....KKKKKK.....",
    "...KKCCCCCCKK...",
    "..KCCWWWWWWCCK..",
    ".KCWWWWWWWWWWCK.",
    ".KCWWRRWWWRRWCK.",
    "KCWWRPPRWPPRWWCK",
    "KCWWPKKPWWKPWWCK",
    "KCWWPKKPWWKPWWCK",
    "KCWWRPPRWWPRWWCK",
    ".KCWWWWWWWWWWCK.",
    ".KCWWWWWWWWWWCK.",
    "..KCCWWWWWWCCK..",
    "...KKCCCCCCKK...",
    "..KC.KKCCKK.CK..",
    ".KC...KKKK...CK.",
    "KK............KK"
  ],

  boss_colossus: [
    "....KKKKKKKK....",
    "...KDDDDDDDDK...",
    "..KDDLLDDLLDDK..",
    "..KDDYYDDYYDDK..",
    "..KDDLLDDLLDDK..",
    "..KDDDDDDDDDDK..",
    ".KDDDDRRRRDDDDK.",
    "KDDDDRRRRRRDDDDK",
    "KDDLLRRRRRRLLDDK",
    "KDDLLRRRRRRLLDDK",
    "KDDLLRRRRRRLLDDK",
    ".KKKDDRRRRDDDKK.",
    "...KDDDDDDDDK...",
    "...KDDDKKDDDK...",
    "...KLLKKKKLLK...",
    "...KKK....KKK..."
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

  // 12스테이지 보스: 심연의 리치 (Abyss Lich) 16x16
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

  // 15스테이지 최종 진 보스: 죽음의 사신 (Grim Reaper) 16x16
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

  // 고딕 석판 던전 바닥 타일 16x16
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

  // 12종 + 알파 카드 픽셀 아이콘 16x16
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

  icon_whip: [
    "........KKKKKKKK",
    ".....KKKLLLLLLLW",
    "...KKLLLLMMMMMMW",
    "..KLLMMMMDDDDDDW",
    ".KLMMDDDDKKKKKKK",
    "KLMDDDDKKK......",
    "KMDDDKK.........",
    "KMDDKK..........",
    "KDDDKK..........",
    "KKDDKK..........",
    ".KKDDKK.........",
    "..KKDDKK........",
    "...KKDDKK.......",
    "....KKDDKK......",
    ".....KKDDKK.....",
    "......KKKK......"
  ],

  icon_missile: [
    ".......TT.......",
    "......TWWTT.....",
    ".....TWWWWTT....",
    "....TWWBBWWTT...",
    "...TWWBBBBWWTT..",
    "..TWWBBBBBBWWTT.",
    ".TWWBBBBBBBBWWTT",
    ".TWWBBBBBBBBWWTT",
    "..TWWBBBBBBWWTT.",
    "...TWWBBBBWWTT..",
    "....TTWWBBWWTT..",
    ".....TTTWWTT....",
    ".......TTTT.....",
    "........TT......",
    "........TT......",
    ".........T......"
  ],

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

  icon_acid: [
    "......KKKK......",
    "......KWWK......",
    "......KWWK......",
    ".....KKKKKK.....",
    "....KSSSSSSK....",
    "...KSAAAAAASK...",
    "..KSAAAAAAAASK..",
    ".KSAAWWAAWWAAASK",
    ".KSAAWWAAWWAAASK",
    ".KSAAAAAAAAAAASK",
    ".KSAAKKAAKKAAASK",
    ".KSSAAKKKKAAAASK",
    "..KSSSSSSSSSSK..",
    "...KSSSSSSSSK...",
    "....KKKKKKKK....",
    "................"
  ],

  icon_holywater: [
    "......KKKK......",
    "......KWWK......",
    "......KWWK......",
    ".....KKKKKK.....",
    "....KBBBBBBK....",
    "...KBTITTTTBK...",
    "..KBTITTTTTTBK..",
    ".KBTITWWTTWWTBK.",
    ".KBTITWWTTWWTBK.",
    ".KBTIITTTTTTTBK.",
    ".KBTTIKKTTKKTBK.",
    ".KBBTIKKKKTTTBK.",
    "..KBBBBBBBBBBK..",
    "...KBBBBBBBBK...",
    "....KKKKKKKK....",
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
  ],

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
    "......KKKK......",
    "......KWWK......",
    "......KWWK......",
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRCCCCCCRK...",
    "..KRCCCCCCCCRK..",
    ".KRCCWWCCWWCCCRK",
    ".KRCCWWCCWWCCCRK",
    ".KRCCCCCCCCCCCRK",
    ".KRCCCCCCCCCCCRK",
    ".KRCCCCWWCCCCCRK",
    "..KRRCCCCCCRRK..",
    "...KRRRRRRRRK...",
    "....KKKKKKKK....",
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

  // 3종 특수 필드 드랍 아이템 (16x16)
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

  // 무기 공격 애니메이션 스프라이트 (단검 찌르기, 회전날, 총구 화염)
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

  // 필드 장애물 스프라이트 (비파괴 돌기둥/바위, 고대 나무, 파괴가능 나무상자)
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

  icon_sword: [
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

  icon_axe: [
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

  anim_whip: [
    "..............KK",
    "...........KKKLL",
    "........KKKLLMMD",
    "......KKLLMMDDDK",
    "....KKLLMMDDDKK.",
    "..KKLLMMDDDKK...",
    ".KLLMMDDDKK.....",
    "KLLMMDDDKK......",
    "KLLMMDDKK.......",
    "KLLMDDKK........",
    ".KLMDDKK........",
    "..KMDDKK........",
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

  // 표창 (Shuriken) 아이콘 16x16
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

  // 투사체 표창 (proj_shuriken) 16x16
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

  // 모닝스타 가시 철퇴 헤드 (anim_whip / anim_morningstar) 16x16
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

  // [진화 1] 천상의 성역 (heavenlySanctuary: 성역 + 성수) 아이콘
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

  // [진화 2] 모닝스타 선풍 (morningstarTempest: 채찍 + 표창) 아이콘
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

  // [진화 3] 멸망의 혜성 (apocalypseComet: 화염지팡이 + 마법화살) 아이콘
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

  // [진화 4] 학살자의 폭풍검 (slayerBladeStorm: 검 + 도끼) 아이콘
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

  // [진화 5] 테슬라 뇌전포 (teslaShotgun: 산탄총 + 번개반지) 아이콘
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
  ]
};

// 모든 스프라이트 파일 저장 (기본 16x16을 32x32로 2배 스케일링하여 저장)
console.log('🖌️ 다크 판타지 픽셀 아트 스프라이트 생성 시작...');
let count = 0;

for (const key in SPRITES) {
  const matrix = SPRITES[key];
  const { width, height, buf } = renderMatrix(matrix, PALETTE, 2); // 32x32 픽셀
  const pngData = createPNG(width, height, buf);
  const filePath = path.join(ASSETS_DIR, `${key}.png`);
  fs.writeFileSync(filePath, pngData);
  count++;
}

console.log(`✅ 총 ${count}개의 다크 판타지 스프라이트 PNG가 성공적으로 생성되었습니다!`);
console.log(`📂 저장 위치: ${ASSETS_DIR}`);
