/**
 * Core Test Runner Engine
 */

import { ApiClient } from './client.ts';
import { TestReporter } from './reporter.ts';
import type {
  RunnerOptions,
  SuiteResult,
  TestCase,
  TestContext,
  TestFunction,
  TestMetadata,
  TestResult,
  TestRunSummary,
  TestSuite,
  TestTier
} from './types.ts';
import * as fixtures from '../fixtures/mock-data.ts';

// Registry of all test suites
const registeredSuites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

export function describe(name: string, tier: TestTier, fn: () => void) {
  const suite: TestSuite = {
    id: `suite-${registeredSuites.length + 1}`,
    name,
    tier,
    tests: []
  };

  registeredSuites.push(suite);
  const prevSuite = currentSuite;
  currentSuite = suite;

  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function it(name: string, fn: TestFunction, metadata?: Partial<TestMetadata>) {
  test(name, fn, metadata);
}

export function test(name: string, fn: TestFunction, metadata?: Partial<TestMetadata>) {
  if (!currentSuite) {
    throw new Error(`Test "${name}" must be placed inside a describe() block`);
  }

  const testCase: TestCase = {
    id: metadata?.id || `test-${currentSuite.tests.length + 1}`,
    name,
    tier: metadata?.tier || currentSuite.tier,
    feature: metadata?.feature || 'General',
    description: metadata?.description,
    fn
  };

  currentSuite.tests.push(testCase);
}

export async function runAllTests(options: RunnerOptions = {}): Promise<TestRunSummary> {
  const reporter = new TestReporter(options.verbose);
  reporter.printBanner();

  const client = new ApiClient(options.baseUrl);
  const startTime = Date.now();

  const summary: TestRunSummary = {
    timestamp: new Date().toISOString(),
    mode: client.getBaseUrl() ? 'live' : 'simulation',
    baseUrl: client.getBaseUrl() || undefined,
    totalSuites: 0,
    totalTests: 0,
    passedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    durationMs: 0,
    tiers: {
      1: { total: 0, passed: 0, failed: 0, skipped: 0 },
      2: { total: 0, passed: 0, failed: 0, skipped: 0 },
      3: { total: 0, passed: 0, failed: 0, skipped: 0 },
      4: { total: 0, passed: 0, failed: 0, skipped: 0 }
    },
    suites: []
  };

  const tierNames: Record<TestTier, string> = {
    1: 'Feature Coverage (Public, Admin, Try-On, Booking, Auth)',
    2: 'Boundary Value & Corner Cases (Limits, Regex, Formats, RBAC)',
    3: 'Cross-Feature Combinations (Pairwise Interaction & Reflection)',
    4: 'Real-World Application Scenarios (Journeys, Lifecycles, Security)'
  };

  // Group suites by Tier
  const tierOrder: TestTier[] = [1, 2, 3, 4];

  for (const tier of tierOrder) {
    if (options.tier && options.tier !== tier) {
      continue;
    }

    const suitesInTier = registeredSuites.filter(s => s.tier === tier);
    if (suitesInTier.length === 0) continue;

    reporter.printTierHeader(tier, tierNames[tier]);

    for (const suite of suitesInTier) {
      reporter.printSuiteStart(suite.name);
      summary.totalSuites++;

      const suiteResult: SuiteResult = {
        id: suite.id,
        name: suite.name,
        tier: suite.tier,
        durationMs: 0,
        tests: [],
        passedCount: 0,
        failedCount: 0,
        skippedCount: 0
      };

      const suiteStartTime = Date.now();

      for (const t of suite.tests) {
        // Grep filter check
        if (options.grep && !t.name.toLowerCase().includes(options.grep.toLowerCase())) {
          const testRes: TestResult = {
            id: t.id,
            name: t.name,
            tier: t.tier,
            feature: t.feature,
            status: 'skipped',
            durationMs: 0
          };
          suiteResult.tests.push(testRes);
          suiteResult.skippedCount++;
          summary.totalTests++;
          summary.skippedCount++;
          summary.tiers[tier].total++;
          summary.tiers[tier].skipped++;
          reporter.printTestResult(testRes);
          continue;
        }

        summary.totalTests++;
        summary.tiers[tier].total++;

        // Context for test execution
        client.resetSimulator();
        const ctx: TestContext = {
          client,
          fixtures,
          log: (...args) => {
            if (options.verbose) console.log('       [log]', ...args);
          }
        };

        const testStartTime = Date.now();
        const testRes: TestResult = {
          id: t.id,
          name: t.name,
          tier: t.tier,
          feature: t.feature,
          status: 'passed',
          durationMs: 0
        };

        try {
          await t.fn(ctx);
          testRes.durationMs = Date.now() - testStartTime;
          testRes.status = 'passed';
          suiteResult.passedCount++;
          summary.passedCount++;
          summary.tiers[tier].passed++;
        } catch (err: any) {
          testRes.durationMs = Date.now() - testStartTime;
          testRes.status = 'failed';
          testRes.error = {
            message: err.message || String(err),
            stack: err.stack,
            expected: err.expected,
            actual: err.actual
          };
          suiteResult.failedCount++;
          summary.failedCount++;
          summary.tiers[tier].failed++;
        }

        suiteResult.tests.push(testRes);
        reporter.printTestResult(testRes);
      }

      suiteResult.durationMs = Date.now() - suiteStartTime;
      summary.suites.push(suiteResult);
    }
  }

  summary.durationMs = Date.now() - startTime;
  reporter.printSummary(summary);

  const reportPath = options.reportPath || 'test-results/e2e-report.json';
  reporter.writeJsonReport(summary, reportPath);

  return summary;
}
