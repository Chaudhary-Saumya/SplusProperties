import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const responseTime = new Trend('response_time');
const errorRate    = new Rate('error_rate');
const successRate  = new Rate('success_rate');
const reqCount     = new Counter('total_requests');

// ============================================================
// FULL CAPACITY ANALYSIS: Find real breaking point
// Stages: 10 → 50 → 100 → 200 → 300 → 500 users
// Run with: k6 run Backend/tests/capacity-analysis.js
// ============================================================
export let options = {
    stages: [
        { duration: '15s', target: 10  },  // Warm up
        { duration: '20s', target: 50  },  // Normal load
        { duration: '20s', target: 100 },  // Moderate load
        { duration: '20s', target: 200 },  // Heavy load
        { duration: '20s', target: 300 },  // Stress zone
        { duration: '20s', target: 500 },  // Breaking point
        { duration: '15s', target: 0   },  // Cool down
    ],
    thresholds: {
        // These are targets — test still completes even if breached
        http_req_duration: ['p(95)<500', 'p(99)<2000'],
        error_rate:        ['rate<0.05'],
        success_rate:      ['rate>0.95'],
    },
};

const BASE = 'http://localhost:5000';
const SEARCHES = ['land', 'plot', 'farm', 'commercial', 'residential'];
const SORTS    = ['-createdAt', 'price', '-price'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randPage() { return Math.ceil(Math.random() * 3); }

export default function () {
    const scenario = Math.random();

    let res;

    if (scenario < 0.45) {
        // 45% — Browse listings (most common user action)
        res = http.get(`${BASE}/api/listings?sort=${rand(SORTS)}&page=${randPage()}&limit=12`);
    } else if (scenario < 0.70) {
        // 25% — Search
        res = http.get(`${BASE}/api/listings?search=${rand(SEARCHES)}&page=1&limit=12`);
    } else if (scenario < 0.82) {
        // 12% — Trending
        res = http.get(`${BASE}/api/recommendations/trending`);
    } else if (scenario < 0.92) {
        // 10% — Autocomplete suggestions
        res = http.get(`${BASE}/api/listings/search/suggestions?q=${rand(SEARCHES)}`);
    } else {
        // 8% — Login (auth stress)
        res = http.post(
            `${BASE}/api/auth/login`,
            JSON.stringify({ email: 'perf@test.com', password: 'test123456' }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 200=ok, 401=no user(expected), 429=rate limited(expected under load), 5xx=real error
    const ok = res.status === 200 || res.status === 201 || res.status === 401 || res.status === 429;
    const serverError = res.status >= 500;

    check(res, { 'no server error': () => !serverError });

    responseTime.add(res.timings.duration);
    errorRate.add(serverError);   // Only count 5xx as errors
    successRate.add(!serverError);
    reqCount.add(1);

    sleep(Math.random() * 1.5 + 0.3); // Think time: 0.3 – 1.8s
}

export function handleSummary(data) {
    const m = data.metrics;

    const avg   = m.http_req_duration?.values?.avg?.toFixed(2)    || 'N/A';
    const p95   = m.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A';
    const p99   = m.http_req_duration?.values?.['p(99)']?.toFixed(2) || 'N/A';
    const maxRT = m.http_req_duration?.values?.max?.toFixed(2)    || 'N/A';
    const errPct = ((m.error_rate?.values?.rate || 0) * 100).toFixed(2);
    const rps   = m.http_reqs?.values?.rate?.toFixed(2)           || 'N/A';
    const total = m.http_reqs?.values?.count                      || 0;
    const maxVU = m.vus_max?.values?.max                          || 0;
    const pass  = m.checks?.values?.passes                        || 0;
    const fail  = m.checks?.values?.fails                         || 0;

    const report = `
╔══════════════════════════════════════════════════════════════╗
║           🚀 BACKEND CAPACITY ANALYSIS REPORT               ║
╠══════════════════════════════════════════════════════════════╣
║  Max Concurrent Users Tested : ${String(maxVU).padEnd(27)} ║
║  Total Requests Made         : ${String(total).padEnd(27)} ║
║  Throughput (req/s)          : ${String(rps).padEnd(27)} ║
╠══════════════════════════════════════════════════════════════╣
║  RESPONSE TIME                                               ║
║  ├─ Average                  : ${String(avg + ' ms').padEnd(27)} ║
║  ├─ P95 (95% of users)       : ${String(p95 + ' ms').padEnd(27)} ║
║  ├─ P99 (99% of users)       : ${String(p99 + ' ms').padEnd(27)} ║
║  └─ Max                      : ${String(maxRT + ' ms').padEnd(27)} ║
╠══════════════════════════════════════════════════════════════╣
║  RELIABILITY                                                 ║
║  ├─ Error Rate               : ${String(errPct + '%').padEnd(27)} ║
║  ├─ Checks Passed            : ${String(pass).padEnd(27)} ║
║  └─ Checks Failed            : ${String(fail).padEnd(27)} ║
╠══════════════════════════════════════════════════════════════╣
║  VERDICT                                                     ║
║  ${errPct < 1 ? '✅ Excellent  — Error rate < 1%' : errPct < 5 ? '⚠️  Acceptable — Error rate < 5%' : '❌ Degraded   — Error rate > 5%'}${''.padEnd(25 - (errPct < 1 ? 15 : 16))} ║
║  ${parseFloat(p95) < 500 ? '✅ Fast       — P95 < 500ms' : parseFloat(p95) < 1000 ? '⚠️  Moderate  — P95 < 1000ms' : '❌ Slow       — P95 > 1000ms'}${''.padEnd(26 - (parseFloat(p95) < 500 ? 14 : 15))} ║
╚══════════════════════════════════════════════════════════════╝
`;

    console.log(report);

    return {
        'tests/results/capacity-report.json': JSON.stringify(data, null, 2),
        'tests/results/capacity-report.txt':  report,
        stdout: report,
    };
}
