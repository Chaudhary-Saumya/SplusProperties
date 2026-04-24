import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const responseTime = new Trend('response_time');
const errorRate = new Rate('error_rate');
const requestCount = new Counter('requests_total');

// ============================================================
// REAL USER BEHAVIOR SIMULATION: Mixed API traffic
// Run with: k6 run tests/stress-test.js
// ============================================================
export let options = {
    stages: [
        { duration: '15s', target: 50 },   // Warm up
        { duration: '30s', target: 100 },  // Normal load
        { duration: '30s', target: 250 },  // High load
        { duration: '30s', target: 500 },  // Stress load
        { duration: '15s', target: 0 },    // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        error_rate: ['rate<0.05'],         // Accept up to 5% errors under stress
    },
};

const BASE_URL = 'http://localhost:5000';
const HEADERS_JSON = { headers: { 'Content-Type': 'application/json' } };

// Helper: Random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SEARCH_TERMS = ['land', 'plot', 'farm', 'residential', 'commercial'];
const SORT_OPTIONS = ['-createdAt', 'price', '-price'];

export default function () {
    const scenario = Math.random();

    // 40% - Browse listings (most common)
    if (scenario < 0.4) {
        const sort = randomItem(SORT_OPTIONS);
        const page = Math.ceil(Math.random() * 3);
        const res = http.get(`${BASE_URL}/api/listings?sort=${sort}&page=${page}&limit=12`);
        check(res, { 'browse listings 200': (r) => r.status === 200 });
        responseTime.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        requestCount.add(1);

    // 30% - Search
    } else if (scenario < 0.7) {
        const q = randomItem(SEARCH_TERMS);
        const res = http.get(`${BASE_URL}/api/listings?search=${q}&page=1&limit=12`);
        check(res, { 'search 200': (r) => r.status === 200 });
        responseTime.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        requestCount.add(1);

    // 15% - Login attempt
    } else if (scenario < 0.85) {
        const res = http.post(
            `${BASE_URL}/api/auth/login`,
            JSON.stringify({ email: 'test@test.com', password: 'password123' }),
            HEADERS_JSON
        );
        // 401 Unauthorized is acceptable (user might not exist)
        check(res, { 'login attempted': (r) => r.status === 200 || r.status === 401 });
        responseTime.add(res.timings.duration);
        errorRate.add(res.status >= 500); // Only count server errors
        requestCount.add(1);

    // 10% - Trending / Recommendations
    } else if (scenario < 0.95) {
        const res = http.get(`${BASE_URL}/api/recommendations/trending`);
        check(res, { 'trending 200': (r) => r.status === 200 });
        responseTime.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        requestCount.add(1);

    // 5% - Search suggestions (autocomplete)
    } else {
        const q = randomItem(SEARCH_TERMS);
        const res = http.get(`${BASE_URL}/api/listings/search/suggestions?q=${q}`);
        check(res, { 'suggestions 200': (r) => r.status === 200 });
        responseTime.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        requestCount.add(1);
    }

    sleep(Math.random() * 2 + 0.5); // Randomized think time (0.5-2.5s)
}

export function handleSummary(data) {
    return {
        'tests/results/stress-report.json': JSON.stringify(data, null, 2),
    };
}
