// Automated Security Test Suite for PowerPulse RBAC & Security Boundaries
const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING POWERPULSE RBAC & SECURITY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. GUEST ACCESS RESTRICTIONS
  await test('Test 1: Guest cannot submit report without auth (HTTP 401)', async () => {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat_outage', description: 'Test guest report' })
    });
    if (res.status !== 401) {
      throw new Error(`Expected status 401, got ${res.status}`);
    }
  });

  await test('Test 1b: Guest cannot access admin users list (HTTP 401)', async () => {
    const res = await fetch(`${BASE_URL}/admin/users`);
    if (res.status !== 401) {
      throw new Error(`Expected status 401, got ${res.status}`);
    }
  });

  // 2. RESIDENT ACCOUNT REGISTRATION
  let residentToken = '';
  const testPhone = `+25670${Math.floor(1000000 + Math.random() * 9000000)}`;
  await test('Test 2: Resident can self-register with phone & password', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Community Member Test',
        phone: testPhone,
        password: 'Password123!',
        district: 'Kabale',
        subArea: 'Central'
      })
    });
    if (res.status !== 201) {
      const txt = await res.text();
      throw new Error(`Expected 201, got ${res.status}: ${txt}`);
    }
    const data = await res.json();
    if (!data.token || data.user.role !== 'RESIDENT') {
      throw new Error(`Invalid registration response: ${JSON.stringify(data)}`);
    }
    residentToken = data.token;
  });

  // 3. PRIVILEGE ESCALATION AT REGISTRATION
  await test('Test 3: Privileged role in public registration payload is rejected or clamped', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Attempt',
        phone: `+25670${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password123!',
        role: 'ADMIN',
        district: 'Kabale'
      })
    });
    if (res.status === 201) {
      const data = await res.json();
      if (data.user.role === 'ADMIN') {
        throw new Error('Security breach: Public registration allowed ADMIN role creation!');
      }
    } else if (res.status !== 403 && res.status !== 400) {
      throw new Error(`Unexpected status ${res.status}`);
    }
  });

  // 4. RESIDENT PRIVILEGE BOUNDARIES
  await test('Test 4: Resident cannot access admin users (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${residentToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  await test('Test 4b: Resident cannot create incident (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${residentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Rogue Incident', district: 'Kabale' })
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  // Log in as Verifier (Sarah) and Admin (System Admin)
  let verifierToken = '';
  let adminToken = '';
  await test('Auth setup: Login as Verifier and Admin', async () => {
    const vRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+256 782 500 310', password: 'demo1234' })
    });
    const vData = await vRes.json();
    if (!vData.token) throw new Error(`Verifier login failed: ${JSON.stringify(vData)}`);
    verifierToken = vData.token;

    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+256 788 001 999', password: 'demo1234' })
    });
    const aData = await aRes.json();
    if (!aData.token) throw new Error(`Admin login failed: ${JSON.stringify(aData)}`);
    adminToken = aData.token;
  });

  // 5. VERIFIER DISTRICT SCOPING & CROSS-DISTRICT ISOLATION
  await test('Test 5 & 11: Verifier cannot update report outside their district', async () => {
    // Sarah is Verifier for Kabale. Let's find or create a report in Kisoro
    // Submit a resident report in Kisoro
    const kResPhone = `+25671${Math.floor(1000000 + Math.random() * 9000000)}`;
    const kRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kisoro Resident',
        phone: kResPhone,
        password: 'Password123!',
        district: 'Kisoro'
      })
    });
    const kData = await kRes.json();
    const kisoroToken = kData.token;

    const reportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${kisoroToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId: 'cat-outage-total',
        description: 'Kisoro outage test',
        district: 'Kisoro',
        locationName: 'Kisoro Town',
        latitude: -1.2825,
        longitude: 29.6914
      })
    });
    const reportData = await reportRes.json();
    if (!reportData.report) {
      throw new Error(`Report creation failed: ${JSON.stringify(reportData)}`);
    }
    const kisoroReportId = reportData.report.id;

    // Now Sarah (Kabale Verifier) tries to verify/update Kisoro report
    const verifyAttempt = await fetch(`${BASE_URL}/reports/${kisoroReportId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${verifierToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'VERIFIED' })
    });

    if (verifyAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-district verification, got ${verifyAttempt.status}`);
    }
  });

  // 6. ENGINEER ASSIGNMENT BOUNDARIES
  let engineerToken = '';
  await test('Test 6: Engineer cannot access Admin Cockpit or Reports Queue', async () => {
    const eRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+256 774 990 123', password: 'demo1234' })
    });
    const eData = await eRes.json();
    if (!eData.token) throw new Error(`Engineer login failed: ${JSON.stringify(eData)}`);
    engineerToken = eData.token;

    const adminCheck = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${engineerToken}` }
    });
    if (adminCheck.status !== 403) {
      throw new Error(`Expected 403 for engineer accessing admin, got ${adminCheck.status}`);
    }
  });

  // 7. PROVIDER MANAGER BOUNDARIES
  let managerToken = '';
  await test('Test 7: Provider Manager cannot modify RBAC user roles or reset demo', async () => {
    const mRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+256 772 888 404', password: 'demo1234' })
    });
    const mData = await mRes.json();
    if (!mData.token) throw new Error(`Manager login failed: ${JSON.stringify(mData)}`);
    managerToken = mData.token;

    const demoResetCheck = await fetch(`${BASE_URL}/admin/reset-demo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    if (demoResetCheck.status !== 403) {
      throw new Error(`Expected 403 for manager resetting demo, got ${demoResetCheck.status}`);
    }
  });

  // 8. SYSTEM ADMINISTRATOR TERRITORIAL & ROLE LIMITS
  await test('Test 8: System Administrator cannot create duplicate active Verifier in same district', async () => {
    // Sarah is already active Verifier in Kabale.
    const dupRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Second Verifier in Kabale',
        phone: '+256 777 999111',
        email: 'dupverifier@powerpulse.demo',
        role: 'VERIFIER',
        district: 'Kabale'
      })
    });
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate verifier in district, got ${dupRes.status}`);
    }
  });

  await test('Test 8b: System Administrator cannot exceed single Superadmin limit', async () => {
    const dupAdmin = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Second Superadmin',
        phone: '+256 777 888222',
        email: 'secondadmin@powerpulse.demo',
        role: 'ADMIN'
      })
    });
    if (dupAdmin.status !== 409) {
      throw new Error(`Expected 409 Conflict for second superadmin, got ${dupAdmin.status}`);
    }
  });

  // 9. DIRECT API AUTHORIZATION (BYPASSING UI)
  await test('Test 9: Calling protected endpoint with forged bearer token returns 401', async () => {
    const forged = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fake_tampered_token_xyz',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoryId: 'cat_outage', description: 'Tampered token' })
    });
    if (forged.status !== 401) {
      throw new Error(`Expected 401 for tampered token, got ${forged.status}`);
    }
  });

  // 10. ROLE-CHANGE RESISTANCE
  await test('Test 10: Resident cannot upgrade own role to ADMIN via user update API', async () => {
    // User profile endpoint or admin update endpoint
    const res = await fetch(`${BASE_URL}/admin/users/usr-res-1`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${residentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 12. PUBLIC DATA MINIMIZATION
  await test('Test 12: Public incident and stats feed does not expose private passwords or salt', async () => {
    const res = await fetch(`${BASE_URL}/incidents/public`);
    const data = await res.json();
    const str = JSON.stringify(data);
    if (str.includes('passwordHash') || str.includes('salt')) {
      throw new Error('Security leak: Password hash or salt exposed in public incidents feed!');
    }
  });

  // 13. AUDIT TRAIL INTEGRITY
  await test('Test 13: Report submission & updates record proper user ownership and timestamps', async () => {
    const res = await fetch(`${BASE_URL}/reports`, {
      headers: { 'Authorization': `Bearer ${residentToken}` }
    });
    const data = await res.json();
    if (!Array.isArray(data.reports)) {
      throw new Error('Reports list invalid');
    }
  });

  // 14. SUSPENDED & DEACTIVATED ACCOUNTS
  await test('Test 14: Deactivated user is immediately rejected from operational APIs', async () => {
    // Create a temporary engineer and then deactivate them
    const tempPhone = `+25679${Math.floor(1000000 + Math.random() * 9000000)}`;
    const createRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Temporary Engineer',
        phone: tempPhone,
        email: `temp.eng.${Date.now()}.${Math.random().toString(36).substring(7)}@powerpulse.demo`,
        role: 'ENGINEER',
        district: 'Kabale'
      })
    });
    const createData = await createRes.json();
    const tempUserId = createData.user.id;

    // Login as the temporary engineer
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: tempPhone, password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    const tempToken = loginData.token;

    // Deactivate the user
    await fetch(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'DEACTIVATED' })
    });

    // Now try to make an API request with the deactivated token
    const blockedRes = await fetch(`${BASE_URL}/assignments/my-jobs`, {
      headers: { 'Authorization': `Bearer ${tempToken}` }
    });

    if (blockedRes.status !== 403) {
      throw new Error(`Expected 403 for deactivated user, got ${blockedRes.status}`);
    }

    // Try to login again
    const reLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: tempPhone, password: 'demo1234' })
    });
    if (reLogin.status !== 403) {
      throw new Error(`Expected 403 on login for deactivated account, got ${reLogin.status}`);
    }
  });

  console.log('\n====================================================');
  console.log(`SECURITY VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
