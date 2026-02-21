const { Client } = require('pg');

const connectionString = 'postgresql://postgres.mocsygandkqqqccigwlz:dltWqZvjcrnH7RwZ@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function testSeoulPooler() {
    const client = new Client({ connectionString });
    try {
        console.log('--- SEOUL POOLER TEST START ---');
        await client.connect();
        console.log('SUCCESS! Connected to Supabase via SEOUL IPv4 Pooler.');
        const res = await client.query('SELECT version()');
        console.log('DB Version:', res.rows[0].version);
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('SEOUL POOLER TEST FAILED:', err.message);
    } finally {
        await client.end();
        console.log('--- SEOUL POOLER TEST END ---');
    }
}

testSeoulPooler();
