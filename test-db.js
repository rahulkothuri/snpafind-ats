const { Client } = require('pg');

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    console.log(`Connecting to: ${connectionString.replace(/:[^:@]*@/, ':****@')}`); // Hide password in logs

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Try with no-verify first
    });

    try {
        await client.connect();
        console.log('✅ Connection successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

testConnection();
