const { Client } = require('pg');

// Correct format for Supabase Transaction Pooler (IPv4 compatible)
const connectionString = 'postgresql://postgres.mocsygandkqqqccigwlz:dltWqZvjcrnH7RwZ@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function testProperPooler() {
    const client = new Client({ connectionString });
    try {
        console.log('--- PROPER POOLER TEST START ---');
        console.log('Target API Host:', 'aws-0-us-west-1.pooler.supabase.com');
        await client.connect();
        console.log('SUCCESS! Connected to Supabase via IPv4 Pooler.');
        const res = await client.query('SELECT version()');
        console.log('DB Version:', res.rows[0].version);

        // Check tables while we are here
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error('PROPER POOLER TEST FAILED:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        await client.end();
        console.log('--- PROPER POOLER TEST END ---');
    }
}

testProperPooler();
