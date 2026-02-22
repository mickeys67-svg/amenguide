const { Client } = require('pg');
require('dotenv').config();

async function resetDb() {
    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });


    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Drop existing tables to ensure clean slate
        console.log('Dropping existing tables...');
        await client.query('DROP TABLE IF EXISTS "Bookmark" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "User" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "Event" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "event" CASCADE;'); // Legacy lowercase

        // 2. Create the "User" table
        console.log('Creating "User" table...');
        await client.query(`
            CREATE TABLE "User" (
                "id" TEXT PRIMARY KEY,
                "email" TEXT UNIQUE NOT NULL,
                "name" TEXT,
                "provider" TEXT NOT NULL,
                "targetDiocese" TEXT,
                "themeColor" TEXT,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create the "Event" table
        console.log('Creating "Event" table...');
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
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Create the "Bookmark" table
        console.log('Creating "Bookmark" table...');
        await client.query(`
            CREATE TABLE "Bookmark" (
                "id" TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
                "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE("userId", "eventId")
            );
        `);

        console.log('Database reset and schema (Event, User, Bookmark) created successfully with PascalCase.');
    } catch (error) {
        console.error('Database reset failed:', error.message);
    } finally {
        await client.end();
    }

}

resetDb();
