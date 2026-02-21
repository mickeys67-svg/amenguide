const { Client } = require('pg');

const connectionString = 'postgresql://postgres.mocsygandkqqqccigwlz:dltWqZvjcrnH7RwZ@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function checkContent() {
    const client = new Client({ connectionString });
    try {
        console.log('--- DB CONTENT CHECK START ---');
        await client.connect();

        // 1. List all public tables
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables Found:', tables.rows.map(r => r.table_name).join(', '));

        // 2. Check "Event" (PascalCase)
        try {
            const res = await client.query('SELECT COUNT(*) FROM "Event"');
            console.log(`Table "Event" count: ${res.rows[0].count}`);
            if (parseInt(res.rows[0].count) > 0) {
                const samples = await client.query('SELECT title, "createdAt" FROM "Event" ORDER BY "createdAt" DESC LIMIT 5');
                samples.rows.forEach(r => console.log(` - [${r.createdAt}] ${r.title}`));
            }
        } catch (e) { console.log('Table "Event" check failed:', e.message); }

        // 3. Check "event" (lowercase)
        try {
            const res = await client.query('SELECT COUNT(*) FROM "event"');
            console.log(`Table "event" count: ${res.rows[0].count}`);
            if (parseInt(res.rows[0].count) > 0) {
                const samples = await client.query('SELECT title, "createdAt" FROM "event" ORDER BY "createdAt" DESC LIMIT 5');
                samples.rows.forEach(r => console.log(` - [${r.createdAt}] ${r.title}`));
            }
        } catch (e) { console.log('Table "event" check failed:', e.message); }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
        console.log('--- DB CONTENT CHECK END ---');
    }
}

checkContent();
