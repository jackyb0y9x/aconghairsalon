#!/usr/bin/env node
/**
 * Modern Hair Salon - Standalone E2E Test Runner CLI
 * Usage:
 *   node tests/run-e2e.ts
 *   node tests/run-e2e.ts --tier=1
 *   node tests/run-e2e.ts --grep=booking
 *   node tests/run-e2e.ts --verbose
 *   node tests/run-e2e.ts --report-path=./test-results/my-report.json
 */

import { runAllTests } from './harness/runner.ts';
import type { RunnerOptions, TestTier } from './harness/types.ts';

// ─── Register All Test Suites ───────────────────────────────────────────────
// Tier 1: Feature Coverage
import './e2e/tier1-features/public.test.ts';
import './e2e/tier1-features/admin.test.ts';
import './e2e/tier1-features/try-on.test.ts';
import './e2e/tier1-features/booking.test.ts';
import './e2e/tier1-features/auth.test.ts';

// Tier 2: Boundary & Corner Cases
import './e2e/tier2-boundaries/booking-boundaries.test.ts';
import './e2e/tier2-boundaries/tryon-boundaries.test.ts';
import './e2e/tier2-boundaries/rbac-boundaries.test.ts';
import './e2e/tier2-boundaries/content-boundaries.test.ts';

// Tier 3: Cross-Feature Combinations
import './e2e/tier3-combinations/booking-style-color.test.ts';
import './e2e/tier3-combinations/admin-crud-public-reflection.test.ts';
import './e2e/tier3-combinations/tryon-to-booking.test.ts';

// Tier 4: Real-World Application Scenarios
import './e2e/tier4-scenarios/customer-booking-journey.test.ts';
import './e2e/tier4-scenarios/content-management-lifecycle.test.ts';
import './e2e/tier4-scenarios/unauthorized-penetration.test.ts';

// ─── Parse CLI Options ───────────────────────────────────────────────────────
function parseArgs(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
Modern Hair Salon - E2E Test Runner CLI

Usage:
  node tests/run-e2e.ts [options]

Options:
  --tier=<1|2|3|4>        Execute only tests belonging to specified Tier
  --grep=<pattern>        Filter tests by name / description regex
  --verbose               Show detailed request/response diagnostics and stacks
  --report-path=<path>    Custom path for output JSON report (default: test-results/e2e-report.json)
  --base-url=<url>        Live server target URL (or set TEST_BASE_URL env var)
  --help, -h              Show this help message
      `);
      process.exit(0);
    }

    if (arg.startsWith('--tier=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if ([1, 2, 3, 4].includes(val)) {
        options.tier = val as TestTier;
      } else {
        console.error(`Invalid tier: ${val}. Must be 1, 2, 3, or 4.`);
        process.exit(1);
      }
    } else if (arg.startsWith('--grep=')) {
      options.grep = arg.split('=')[1];
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--report-path=')) {
      options.reportPath = arg.split('=')[1];
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    }
  }

  return options;
}

// ─── Main Execution ─────────────────────────────────────────────────────────
async function main() {
  const options = parseArgs();

  try {
    const summary = await runAllTests(options);
    if (summary.failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal execution error in test runner:', err);
    process.exit(1);
  }
}

main();
