require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query(`SELECT indexname FROM pg_indexes WHERE tablename='Event' ORDER BY indexname`);
  console.log('Event 인덱스 목록:');
  r.rows.forEach(row => console.log(' -', row.indexname));
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
