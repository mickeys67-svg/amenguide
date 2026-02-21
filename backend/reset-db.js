const { Client } = require('pg');

async function resetDb() {
    const connectionString = 'postgresql://postgres:dltWqZvjcrnH7RwZ@db.mocsygandkqqqccigwlz.supabase.co:5432/postgres';
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Drop existing tables to ensure clean slate
        console.log('Dropping existing tables...');
        await client.query('DROP TABLE IF EXISTS "Bookmark" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "event" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "Event" CASCADE;');

        // 2. Create the "event" table (lowercase for Prisma mapping)
        console.log('Creating "event" table...');
        await client.query(`
            CREATE TABLE "event" (
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
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create Bookmark table if needed (minimal for now)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Bookmark" (
                "id" TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL,
                "eventId" TEXT REFERENCES "event"("id") ON DELETE CASCADE,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database reset and "event" table created successfully.');
    } catch (error) {
        console.error('Database reset failed:', error.message);
    } finally {
        await client.end();
    }
}

resetDb();
