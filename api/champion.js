// Vercel Serverless Function: /api/champion
let memoryChampion = {
  records: [
    { name: 'ho', quote: 'yaho', clearTime: '13:45', timeSeconds: 825, date: 1789692887241, level: 36, kills: 890 },
    { name: '성기사 아더', quote: '빛의 가호로 어둠을 물리쳤다!', clearTime: '14:12', timeSeconds: 852, date: 1789685000000, level: 34, kills: 810 },
    { name: '마도학자 린', quote: '화염의 폭풍 앞에 모든 것이 재가 되리라.', clearTime: '14:38', timeSeconds: 878, date: 1789680000000, level: 32, kills: 760 }
  ],
  recent: { name: 'ho', quote: 'yaho', clearTime: '13:45', timeSeconds: 825, date: 1789692887241, level: 36, kills: 890 }
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const sorted = [...memoryChampion.records].sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));
    res.status(200).json({
      records: sorted,
      top3: sorted.slice(0, 3),
      recent: memoryChampion.recent
    });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const newRecord = {
        name: String(body.name || '익명의 영웅').slice(0, 20),
        quote: String(body.quote || '승리는 우리의 것!').slice(0, 60),
        clearTime: String(body.clearTime || '15:00').slice(0, 10),
        timeSeconds: Number(body.timeSeconds) || 900,
        date: Date.now(),
        hero: String(body.hero || 'knight').slice(0, 20),
        level: Number(body.level) || 1,
        kills: Number(body.kills) || 0
      };

      memoryChampion.records.push(newRecord);
      memoryChampion.records.sort((a, b) => (Number(a.timeSeconds) || 99999) - (Number(b.timeSeconds) || 99999));
      if (memoryChampion.records.length > 50) {
        memoryChampion.records = memoryChampion.records.slice(0, 50);
      }
      memoryChampion.recent = newRecord;

      res.status(200).json({
        success: true,
        top3: memoryChampion.records.slice(0, 3),
        recent: newRecord,
        records: memoryChampion.records
      });
    } catch (err) {
      res.status(400).json({ success: false, error: '유효하지 않은 데이터' });
    }
  }
};
