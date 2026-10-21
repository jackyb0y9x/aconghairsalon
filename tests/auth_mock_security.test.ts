/**
 * Security Attestation Test: Mock Token Production Backdoor Elimination
 * Verifies that mock tokens are strictly forbidden in production,
 * and only permitted when NODE_ENV !== 'production' && ALLOW_TEST_MOCK_AUTH === 'true'.
 */

import { verifySession } from '../lib/auth';
import { MOCK_USERS } from './fixtures/mock-data';

async function testMockBackdoorElimination() {
  console.log('Testing Mock Token Backdoor Elimination in lib/auth.ts...\n');

  const superAdminToken = MOCK_USERS.SUPER_ADMIN.token;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowMock = process.env.ALLOW_TEST_MOCK_AUTH;
  const env = process.env as Record<string, string | undefined>;

  try {
    // Scenario 1: Production environment with ALLOW_TEST_MOCK_AUTH="true"
    // MUST REJECT mock tokens (no backdoor in production)
    env.NODE_ENV = 'production';
    env.ALLOW_TEST_MOCK_AUTH = 'true';
    const prodWithFlagRes = await verifySession(superAdminToken);
    if (prodWithFlagRes !== null) {
      throw new Error('FAIL: Mock token was accepted in production when ALLOW_TEST_MOCK_AUTH=true!');
    }
    console.log('  ✓ [PASS] Production rejects mock token even if ALLOW_TEST_MOCK_AUTH="true"');

    // Scenario 2: Production environment without ALLOW_TEST_MOCK_AUTH flag
    // MUST REJECT mock tokens
    env.NODE_ENV = 'production';
    delete env.ALLOW_TEST_MOCK_AUTH;
    const prodNoFlagRes = await verifySession(superAdminToken);
    if (prodNoFlagRes !== null) {
      throw new Error('FAIL: Mock token was accepted in production!');
    }
    console.log('  ✓ [PASS] Production rejects mock token without ALLOW_TEST_MOCK_AUTH');

    // Scenario 3: Non-production environment without ALLOW_TEST_MOCK_AUTH flag
    // MUST REJECT mock tokens
    env.NODE_ENV = 'development';
    delete env.ALLOW_TEST_MOCK_AUTH;
    const devNoFlagRes = await verifySession(superAdminToken);
    if (devNoFlagRes !== null) {
      throw new Error('FAIL: Mock token was accepted in development without ALLOW_TEST_MOCK_AUTH!');
    }
    console.log('  ✓ [PASS] Development rejects mock token without ALLOW_TEST_MOCK_AUTH="true"');

    // Scenario 4: Non-production environment with ALLOW_TEST_MOCK_AUTH="false"
    // MUST REJECT mock tokens
    env.NODE_ENV = 'development';
    env.ALLOW_TEST_MOCK_AUTH = 'false';
    const devFalseFlagRes = await verifySession(superAdminToken);
    if (devFalseFlagRes !== null) {
      throw new Error('FAIL: Mock token was accepted in development with ALLOW_TEST_MOCK_AUTH="false"!');
    }
    console.log('  ✓ [PASS] Development rejects mock token with ALLOW_TEST_MOCK_AUTH="false"');

    // Scenario 5: Non-production environment with ALLOW_TEST_MOCK_AUTH="true"
    // MUST ACCEPT mock tokens for authorized test harness
    env.NODE_ENV = 'development';
    env.ALLOW_TEST_MOCK_AUTH = 'true';
    const devTrueFlagRes = await verifySession(superAdminToken);
    if (devTrueFlagRes === null || devTrueFlagRes.role.name !== 'SUPER_ADMIN') {
      throw new Error('FAIL: Mock token was not accepted in development with ALLOW_TEST_MOCK_AUTH="true"!');
    }
    console.log('  ✓ [PASS] Development accepts mock token only when ALLOW_TEST_MOCK_AUTH="true"');

    console.log('\n✅ ALL MOCK BACKDOOR SECURITY CHECKS PASSED EMPIRICALLY!');
  } finally {
    env.NODE_ENV = originalNodeEnv;
    if (originalAllowMock !== undefined) {
      env.ALLOW_TEST_MOCK_AUTH = originalAllowMock;
    } else {
      delete env.ALLOW_TEST_MOCK_AUTH;
    }
  }
}

testMockBackdoorElimination().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
