const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:dltWqZvjcrnH7RwZ@db.mocsygandkqqqccigwlz.supabase.co:5432/postgres",
});

async function check() {
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM "Event"');
        console.log('--- DATABASE STATUS ---');
        console.log('Event Count:', res.rows[0].count);

        if (parseInt(res.rows[0].count) > 0) {
            const latest = await client.query('SELECT title, "originUrl" FROM "Event" ORDER BY "createdAt" DESC LIMIT 5');
            console.log('Latest Events:');
            latest.rows.forEach(r => console.log(`- ${r.title} (${r.originUrl})`));
        } else {
            console.log('No events found in table.');
        }
    } catch (err) {
        console.error('DB Check Failed:', err.message);
    } finally {
        await client.end();
    }
}

check();
