const { Client } = require('pg');

// Trying the pooler address which usually has IPv4
const connectionString = 'postgresql://postgres:dltWqZvjcrnH7RwZ@mocsygandkqqqccigwlz.supabase.co:6543/postgres';

async function testPooler() {
    const client = new Client({ connectionString });
    try {
        console.log('--- POOLER TEST START ---');
        console.log('Target:', connectionString.split('@')[1]);
        await client.connect();
        console.log('SUCCESS! Connected via Pooler (Port 6543)');
        const res = await client.query('SELECT version()');
        console.log('DB Version:', res.rows[0].version);
    } catch (err) {
        console.error('POOLER TEST FAILED:', err.message);
    } finally {
        await client.end();
        console.log('--- POOLER TEST END ---');
    }
}

testPooler();
