import http from 'http';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== Testing ChemLab AI Auth API Endpoints ===");
  try {
    // 1. Health check
    const health = await makeRequest('/api/health');
    console.log("1. /api/health:", health.status, health.data);

    // 2. Whoami check (guest)
    const whoami = await makeRequest('/api/whoami');
    console.log("2. /api/whoami:", whoami.status, whoami.data);

    // 3. Unwhitelisted teacher login attempt
    const badLogin = await makeRequest('/api/teacher/login', 'POST', { email: 'fake@email.com', password: '123' });
    console.log("3. /api/teacher/login (unwhitelisted):", badLogin.status, badLogin.data);

    // 4. Verify code with no active code
    const verifyNoCode = await makeRequest('/api/verify-code', 'POST', { code: '123456' });
    console.log("4. /api/verify-code (no active code):", verifyNoCode.status, verifyNoCode.data);

  } catch (err) {
    console.error("Test request error:", err.message);
  }
}

runTests();
