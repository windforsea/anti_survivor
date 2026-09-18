const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const CHAMPION_FILE = path.join(PUBLIC_DIR, 'champion.json');

const server = http.createServer((req, res) => {
  // CORS 및 기본 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. 공용 챔피언 명예의 전당 API
  if (req.url === '/api/champion') {
    const defaultData = {
      records: [
        { name: 'ho', quote: 'yaho', clearTime: '13:45', timeSeconds: 825, date: 1789692887241, level: 36, kills: 890 },
        { name: '성기사 아더', quote: '빛의 가호로 어둠을 물리쳤다!', clearTime: '14:12', timeSeconds: 852, date: 1789685000000, level: 34, kills: 810 },
        { name: '마도학자 린', quote: '화염의 폭풍 앞에 모든 것이 재가 되리라.', clearTime: '14:38', timeSeconds: 878, date: 1789680000000, level: 32, kills: 760 }
      ],
      recent: { name: 'ho', quote: 'yaho', clearTime: '13:45', timeSeconds: 825, date: 1789692887241, level: 36, kills: 890 }
    };

    if (req.method === 'GET') {
      fs.readFile(CHAMPION_FILE, 'utf8', (err, data) => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        if (err || !data) {
          res.end(JSON.stringify(defaultData));
        } else {
          try {
            const parsed = JSON.parse(data);
            let records = [];
            let recent = null;

            if (Array.isArray(parsed.records)) {
              records = parsed.records;
              recent = parsed.recent || records[records.length - 1] || defaultData.recent;
            } else if (parsed.name) {
              // 이전 단일 객체 포맷 호환 마이그레이션
              const legacyItem = {
                name: parsed.name,
                quote: parsed.quote || '',
                clearTime: parsed.clearTime || '14:30',
                timeSeconds: parsed.timeSeconds || 870,
                date: parsed.date || Date.now()
              };
              records = [legacyItem];
              recent = legacyItem;
            }

            // 클리어 타임 기준 오름차순(가장 빠른 기록 순) 정렬
            records.sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));
            const top3 = records.slice(0, 3);

            res.end(JSON.stringify({ records, top3, recent }));
          } catch (e) {
            res.end(JSON.stringify(defaultData));
          }
        }
      });
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 20000) req.destroy(); // 과도한 페이로드 차단
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const newRecord = {
            name: String(parsed.name || '익명의 영웅').slice(0, 20),
            quote: String(parsed.quote || '승리는 우리의 것!').slice(0, 60),
            clearTime: String(parsed.clearTime || '15:00').slice(0, 10),
            timeSeconds: Number(parsed.timeSeconds) || 900,
            date: Date.now(),
            hero: String(parsed.hero || 'knight').slice(0, 20),
            level: Number(parsed.level) || 1,
            kills: Number(parsed.kills) || 0
          };

          fs.readFile(CHAMPION_FILE, 'utf8', (rErr, rData) => {
            let records = [];
            if (!rErr && rData) {
              try {
                const existing = JSON.parse(rData);
                if (Array.isArray(existing.records)) {
                  records = existing.records;
                } else if (existing.name) {
                  records = [{
                    name: existing.name,
                    quote: existing.quote,
                    clearTime: existing.clearTime || '14:30',
                    timeSeconds: existing.timeSeconds || 870,
                    date: existing.date || Date.now()
                  }];
                }
              } catch (e) {}
            }

            // 새 기록 추가 후 정렬
            records.push(newRecord);
            records.sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));
            // 최대 50위까지만 보관
            if (records.length > 50) records = records.slice(0, 50);

            const filePayload = {
              records: records,
              recent: newRecord
            };

            fs.writeFile(CHAMPION_FILE, JSON.stringify(filePayload, null, 2), 'utf8', (wErr) => {
              if (wErr) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: '저장 실패' }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                  success: true,
                  top3: records.slice(0, 3),
                  recent: newRecord,
                  records: records
                }));
              }
            });
          });
        } catch (pErr) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: '유효하지 않은 데이터' }));
        }
      });
      return;
    }
  }

  // 2. 정적 파일 서빙
  let safePath = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log('====================================================');
  console.log('⚔️  Anti Survivors (안티 서바이버즈) 웹 게임 서버가 실행되었습니다! ⚔️');
  console.log('----------------------------------------------------');
  console.log(`💻 로컬 접속:   http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`📱 공유기(LAN): http://${ip}:${PORT}`);
    });
    console.log('\n💡 같은 Wi-Fi나 공유기에 연결된 스마트폰/PC에서 위 LAN 주소로 접속하면 바로 플레이 가능합니다!');
  }
  console.log('====================================================');
});
