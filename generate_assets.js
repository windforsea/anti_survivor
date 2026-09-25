// Anti Survivors - 통합 수묵화풍(Ink-Wash Calligraphy) 마스터 에셋 빌더 (generate_assets.js)
// 과거 16x16 레거시 도트 파이프라인을 완전히 제거하고, 100% 고화질 수묵화풍 에셋만을 단일 빌드합니다.
// Zero-dependency: Node.js 내장 fs, path, zlib 모듈만 사용

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets', 'sprites');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ================= 1. 128x128 수묵화풍 고화질 엠블럼 및 보스 렌더러 =================
const { renderInkEmblem, hasInkEmblem } = require('./assets/data/ink_emblems');
const { renderInkBoss, hasInkBoss, BOSS_KEYS } = require('./assets/data/ink_bosses');

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

console.log('================================================================');
console.log('🖌️ Anti Survivors 통합 수묵화풍(Ink-Wash) 마스터 에셋 빌드 시작');
console.log('================================================================');

// 1. [수묵 장애물 3종 & 드랍 아이템 5종 & 영석 4종 빌드]
console.log('\n[1/5] 필드 장애물(기암괴석/고목/궤짝) 및 단청 수묵 아이템 빌드 중...');
try {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts', 'generate_sumie_items.js')], { stdio: 'inherit' });
} catch (e) {
  console.error('❌ generate_sumie_items.js 실행 실패:', e.message);
}

// 2. [수묵 일반 몬스터 30종 빌드]
console.log('\n[2/5] 수묵화풍 일반 몬스터 30종 빌드 중...');
try {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts', 'generate_sumie_enemies.js')], { stdio: 'inherit' });
} catch (e) {
  console.error('❌ generate_sumie_enemies.js 실행 실패:', e.message);
}

// 3. [수묵 무기 투사체 18종 및 광역 이펙트 빌드]
console.log('\n[3/5] 수묵 서예 투사체 18종 및 광역 이펙트 빌드 중...');
try {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts', 'generate_sumie_projectiles.js')], { stdio: 'inherit' });
} catch (e) {
  console.error('❌ generate_sumie_projectiles.js 실행 실패:', e.message);
}

// 4. [128x128 수묵 보스 빌드]
const targetBossKeys = (typeof BOSS_KEYS !== 'undefined' && BOSS_KEYS.length > 0) ? BOSS_KEYS : [
  'boss_boar', 'boss_void', 'boss_eye', 'boss_colossus',
  'boss_doom', 'boss_lich', 'boss_reaper'
];
console.log(`\n[4/5] 128x128 고해상도 수묵 보스 ${targetBossKeys.length}종 빌드 중...`);
let bossCount = 0;
for (const key of targetBossKeys) {
  if (hasInkBoss(key)) {
    const rgbaBuffer = renderInkBoss(key);
    const pngData = createPNG(128, 128, rgbaBuffer);
    fs.writeFileSync(path.join(ASSETS_DIR, `${key}.png`), pngData);
    bossCount++;
  }
}
console.log(`  ✓ 128x128 수묵 보스 ${bossCount}종 생성 완료`);

// 5. [128x128 수묵 엠블럼 56종 빌드]
console.log('\n[5/5] 128x128 수묵 엠블럼(무기/패시브/진화/자석) 빌드 중...');
const ALL_EMBLEM_KEYS = [
  // 기본 무기 16종
  'icon_sword', 'icon_axe', 'icon_whip', 'icon_shuriken', 'icon_missile',
  'icon_shotgun', 'icon_holywater', 'icon_sanctuary', 'icon_lightning', 'icon_firewand',
  'icon_poisondagger', 'icon_frostorb', 'icon_windbow', 'icon_shadoworb', 'icon_flamepillar', 'icon_chakram',
  'icon_holycross',

  // 패시브 17종 (신규 icon_magnet 포함)
  'icon_armor', 'icon_speed', 'icon_atk', 'icon_heal', 'icon_regen',
  'icon_hp', 'icon_global_speed', 'icon_proj_speed', 'icon_proj_count', 'icon_clover',
  'icon_crown', 'icon_vampire', 'icon_shield', 'icon_crit_dmg', 'icon_thorns', 'icon_area',
  'icon_magnet',

  // 진화 무기 17종
  'icon_heavenlysanctuary', 'icon_morningstartempest', 'icon_apocalypsecomet',
  'icon_slayerbladestorm', 'icon_teslashotgun', 'icon_venomblizzard',
  'icon_thunderblade', 'icon_fireaxe', 'icon_frostwhip', 'icon_scattershuriken',
  'icon_holyarrow', 'icon_plague', 'icon_cyclonebow', 'icon_eclipsespiral',
  'icon_infernocataclysm', 'icon_shadowvortex', 'icon_divinejudgement',

  // 레거시 호환 4종
  'icon_acid', 'icon_holyshotgun', 'icon_arcanesanctuary', 'icon_plasmatempest'
];

let emblemCount = 0;
for (const key of ALL_EMBLEM_KEYS) {
  if (hasInkEmblem(key)) {
    const rgbaBuffer = renderInkEmblem(key);
    const pngData = createPNG(128, 128, rgbaBuffer);
    fs.writeFileSync(path.join(ASSETS_DIR, `${key}.png`), pngData);
    emblemCount++;
  }
}
console.log(`  ✓ 128x128 수묵 엠블럼 ${emblemCount}종 생성 완료`);

console.log('\n================================================================');
console.log(`🎉 [마스터 빌드 완료] 모든 에셋이 100% 순수 수묵화풍(Ink-Wash)으로 정상화되었습니다!`);
console.log(`📂 저장 디렉토리: ${ASSETS_DIR}`);
console.log('================================================================\n');
