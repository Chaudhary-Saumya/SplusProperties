import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const responseTime = new Trend('response_time');
const errorRate = new Rate('error_rate');

// ============================================================
// BASIC LOAD TEST: 50 concurrent users for 30s
// Run with: k6 run load-test.js
// ============================================================
export let options = {
    stages: [
        { duration: '10s', target: 50 },   // Ramp up
        { duration: '30s', target: 50 },   // Hold steady
        { duration: '10s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
        error_rate: ['rate<0.01'],          // Less than 1% errors
    },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
    // Test 1: Get All Listings
    const listingsRes = http.get(`${BASE_URL}/api/listings?page=1&limit=12`);
    check(listingsRes, {
        'listings status 200': (r) => r.status === 200,
        'listings has data': (r) => JSON.parse(r.body).data !== undefined,
    });
    responseTime.add(listingsRes.timings.duration);
    errorRate.add(listingsRes.status !== 200);

    sleep(1);
}
