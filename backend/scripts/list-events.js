const { Client } = require('pg');
require('dotenv').config();

async function listEvents() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query('SELECT title, "originUrl", "createdAt", "aiSummary" FROM "Event" ORDER BY "createdAt" DESC');
        console.log('--- COLLECTED EVENTS ---');
        res.rows.forEach((row, i) => {
            console.log(`${i + 1}. [${row.title}]`);
            console.log(`   URL: ${row.originUrl}`);
            console.log(`   Summary: ${row.aiSummary}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}

listEvents();
