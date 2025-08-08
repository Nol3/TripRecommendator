// Simple validation script for TripRecommendator functionality
const http = require('http');

const port = 3000;
const host = 'localhost';

console.log('🧪 Starting validation tests...\n');

// Test 1: Server health check
function testServerHealth() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: '/',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Server health check: PASSED');
                resolve();
            } else {
                console.log('❌ Server health check: FAILED', res.statusCode);
                reject(new Error(`Server returned ${res.statusCode}`));
            }
        });

        req.on('error', (error) => {
            console.log('❌ Server health check: FAILED', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Server health check: TIMEOUT');
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test 2: Auth status endpoint
function testAuthStatus() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: '/api/auth/status',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (typeof parsed.authenticated === 'boolean') {
                        console.log('✅ Auth status endpoint: PASSED');
                        resolve();
                    } else {
                        console.log('❌ Auth status endpoint: FAILED - Invalid response format');
                        reject(new Error('Invalid response format'));
                    }
                } catch (error) {
                    console.log('❌ Auth status endpoint: FAILED - Parse error');
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Auth status endpoint: FAILED', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Auth status endpoint: TIMEOUT');
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test 3: Static files (basic check)
function testStaticFiles() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: '/app.js',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Static files serving: PASSED');
                resolve();
            } else {
                console.log('❌ Static files serving: FAILED', res.statusCode);
                reject(new Error(`Static file returned ${res.statusCode}`));
            }
        });

        req.on('error', (error) => {
            console.log('❌ Static files serving: FAILED', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Static files serving: TIMEOUT');
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    const tests = [
        testServerHealth,
        testAuthStatus,
        testStaticFiles
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            await test();
            passed++;
        } catch (error) {
            failed++;
        }
    }

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Application is ready.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please check the application.');
        process.exit(1);
    }
}

runTests();
