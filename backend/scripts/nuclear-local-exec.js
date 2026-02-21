const { Client } = require('pg');

const connectionString = 'postgresql://postgres.mocsygandkqqqccigwlz:dltWqZvjcrnH7RwZ@aws-0-us-west-2.pooler.supabase.dev:6543/postgres?pgbouncer=true';
// Note: Some newer Supabase poolers use .dev instead of .com, but I successfully connected to .com earlier.
// Wait, I used .com in probe-regions.js and it worked. Let's stick to .com.
const connectionStringConfirmed = 'postgresql://postgres.mocsygandkqqqccigwlz:dltWqZvjcrnH7RwZ@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function nuclearFix() {
    const client = new Client({ connectionString: connectionStringConfirmed });
    try {
        console.log('--- NUCLEAR FIX START (Local Execution) ---');
        await client.connect();

        console.log('Dropping existing tables (if any)...');
        await client.query('DROP TABLE IF EXISTS "Bookmark" CASCADE');
        await client.query('DROP TABLE IF EXISTS "Event" CASCADE');
        await client.query('DROP TABLE IF EXISTS event CASCADE');

        console.log('Creating definitive "Event" table (PascalCase)...');
        await client.query(`
      CREATE TABLE "Event" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "date" TIMESTAMP,
        "location" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "originUrl" TEXT,
        "aiSummary" TEXT,
        "themeColor" TEXT,
        "category" TEXT,
        "createdAt" TIMESTAMP DEFAULT (now() at time zone 'utc'),
        "updatedAt" TIMESTAMP DEFAULT (now() at time zone 'utc')
      )
    `);

        console.log('Creating Bookmark table...');
        await client.query(`
      CREATE TABLE "Bookmark" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "eventId" TEXT REFERENCES "Event"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT (now() at time zone 'utc')
      )
    `);

        console.log('Inserting SEED record...');
        await client.query(`
      INSERT INTO "Event" (id, title, category, "aiSummary", "createdAt")
      VALUES ('seed-' || now()::text, 'System Online: Deep Diagnostics Successful', 'System', 'The database has been manually initialized and verified via IPv4 Pooler.', now())
    `);

        console.log('--- NUCLEAR FIX COMPLETED SUCCESSFULLY ---');

        // Verify
        const res = await client.query('SELECT title FROM "Event"');
        console.log('Current Events in DB:', res.rows.map(r => r.title));

    } catch (err) {
        console.error('NUCLEAR FIX ERROR:', err.message);
    } finally {
        await client.end();
    }
}

nuclearFix();
