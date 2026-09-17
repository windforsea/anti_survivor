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
    if (req.method === 'GET') {
      fs.readFile(CHAMPION_FILE, 'utf8', (err, data) => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        if (err || !data) {
          res.end(JSON.stringify({ name: '용감한 생존자', quote: '내가 이 구역의 지배자다!', date: Date.now() }));
        } else {
          res.end(data);
        }
      });
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 10000) req.destroy(); // 과도한 페이로드 차단
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const championData = {
            name: String(parsed.name || '무명의 영웅').slice(0, 20),
            quote: String(parsed.quote || '승리는 나의 것!').slice(0, 60),
            date: Date.now()
          };
          fs.writeFile(CHAMPION_FILE, JSON.stringify(championData, null, 2), 'utf8', (wErr) => {
            if (wErr) {
              res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: false, error: '저장 실패' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: true, data: championData }));
            }
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
