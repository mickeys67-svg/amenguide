require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  const r = await c.query(
    'SELECT "originUrl", COUNT(*) as cnt FROM "Event" WHERE "originUrl" IS NOT NULL GROUP BY "originUrl" HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 10'
  );
  if (r.rows.length === 0) {
    console.log('중복 없음 — 인덱스 바로 적용 가능');
  } else {
    console.log('중복 발견:');
    r.rows.forEach(row => console.log(` ${row.cnt}건: ${row.originUrl.slice(0, 80)}`));
  }
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
