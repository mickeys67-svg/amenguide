require('dotenv').config({ path: 'backend/.env' });
const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Check Event table columns
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Event'
    `);

        console.log('Columns in Event table:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });

        const countRes = await client.query('SELECT COUNT(*) FROM "Event"');
        console.log(`Total events in DB: ${countRes.rows[0].count}`);

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
