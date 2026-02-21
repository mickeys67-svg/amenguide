const { Client } = require('pg');

const project_id = 'mocsygandkqqqccigwlz';
const password = 'dltWqZvjcrnH7RwZ';
const regions = [
    'us-west-1', 'us-west-2', 'us-east-1', 'us-east-2',
    'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
    'eu-central-1', 'eu-west-1'
];

async function probe() {
    console.log('--- REGION PROBE START ---');
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgresql://postgres.${project_id}:${password}@${host}:6543/postgres?pgbouncer=true`;
        const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });

        try {
            console.log(`Probing [${region}]...`);
            await client.connect();
            console.log(`🟢 SUCCESS in [${region}]!`);
            const res = await client.query('SELECT version()');
            console.log('DB Version:', res.rows[0].version);
            await client.end();
            console.log('--- REGION PROBE END ---');
            return; // Found it
        } catch (err) {
            console.log(`  ❌ [${region}] Failed: ${err.message}`);
        } finally {
            // Ensure client is ended if connect succeeded but query failed
            try { await client.end(); } catch (e) { }
        }
    }
    console.log('--- REGION PROBE END (Nothing found) ---');
}

probe();
