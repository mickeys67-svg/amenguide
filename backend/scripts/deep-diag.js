const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function diag() {
    try {
        await client.connect();
        console.log('--- DATABASE DIAGNOSTIC START ---');
        console.log('Connected to:', process.env.DATABASE_URL.split('@')[1]);

        // 1. List all tables
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Public Tables:', tables.rows.map(r => r.table_name).join(', '));

        // 2. Check "Event" table (Capitalized)
        try {
            const eventCap = await client.query('SELECT COUNT(*) FROM "Event"');
            console.log('Table "Event" (PascalCase) Row Count:', eventCap.rows[0].count);
            if (parseInt(eventCap.rows[0].count) > 0) {
                const samples = await client.query('SELECT title, "originUrl", "createdAt" FROM "Event" ORDER BY "createdAt" DESC LIMIT 3');
                console.log('Sample Data from "Event":');
                samples.rows.forEach(s => console.log(` - [${s.createdAt}] ${s.title} (${s.originUrl})`));
            }
        } catch (e) {
            console.log('Table "Event" (PascalCase) Check Failed:', e.message);
        }

        // 3. Check "event" table (lowercase)
        try {
            const eventLower = await client.query('SELECT COUNT(*) FROM event');
            console.log('Table "event" (lowercase) Row Count:', eventLower.rows[0].count);
        } catch (e) {
            console.log('Table "event" (lowercase) Check Failed:', e.message);
        }

        // 4. Check "User" table
        try {
            const userCount = await client.query('SELECT COUNT(*) FROM "User"');
            console.log('Table "User" Row Count:', userCount.rows[0].count);
        } catch (e) {
            console.log('Table "User" Check Failed:', e.message);
        }

    } catch (err) {
        console.error('CRITICAL DIAGNOSTIC ERROR:', err.message);
    } finally {
        await client.end();
        console.log('--- DATABASE DIAGNOSTIC END ---');
    }
}

diag();
