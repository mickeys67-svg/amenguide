
import axios from 'axios';

const BASE_URL = 'https://amenguide-backend-775250805671.us-west1.run.app';

async function probe() {
    console.log(`--- PROBING BACKEND: ${BASE_URL} ---`);
    const paths = [
        '/',
        '/health',
        '/events',
        '/api/v1',
        '/api/v1/events',
        '/api/v1/events/health',
        '/api/v1/dev/reset-all'
    ];

    for (const path of paths) {
        try {
            const start = Date.now();
            const res = await axios.get(`${BASE_URL}${path}`, { timeout: 5000 });
            console.log(`[PASS] ${path} -> Status: ${res.status}, Time: ${Date.now() - start}ms`);
            console.log(`       Body: ${JSON.stringify(res.data).substring(0, 100)}`);
        } catch (err) {
            console.log(`[FAIL] ${path} -> Error: ${err.response?.status || err.message}`);
            if (err.response?.data) {
                console.log(`       Data: ${JSON.stringify(err.response.data)}`);
            }
        }
    }
}

probe();
