/**
 * E2E Terminal & JSON Reporter
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SuiteResult, TestResult, TestRunSummary, TestTier } from './types.ts';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

export class TestReporter {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  public printBanner() {
    console.log('\n' + ANSI.bold + ANSI.cyan + '='.repeat(80) + ANSI.reset);
    console.log(
      ANSI.bold +
        ANSI.cyan +
        '       MODERN HAIR SALON - OPAQUE-BOX E2E TEST RUNNER' +
        ANSI.reset
    );
    console.log(ANSI.cyan + '='.repeat(80) + ANSI.reset + '\n');
  }

  public printTierHeader(tier: TestTier, tierName: string) {
    const tierColors: Record<TestTier, string> = {
      1: ANSI.cyan,
      2: ANSI.yellow,
      3: ANSI.magenta,
      4: ANSI.green
    };
    const color = tierColors[tier] || ANSI.white;
    console.log(
      `\n${ANSI.bold}${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`
    );
    console.log(`${ANSI.bold}${color}▶ TIER ${tier}: ${tierName.toUpperCase()}${ANSI.reset}`);
    console.log(
      `${ANSI.bold}${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`
    );
  }

  public printSuiteStart(name: string) {
    console.log(`\n  ${ANSI.bold}${ANSI.white}• Suite: ${name}${ANSI.reset}`);
  }

  public printTestResult(test: TestResult) {
    const timeStr = `${test.durationMs}ms`.padStart(5);
    if (test.status === 'passed') {
      console.log(
        `    ${ANSI.green}✓ [PASS]${ANSI.reset} ${ANSI.dim}(${timeStr})${ANSI.reset} ${test.name}`
      );
    } else if (test.status === 'failed') {
      console.log(
        `    ${ANSI.red}✗ [FAIL]${ANSI.reset} ${ANSI.dim}(${timeStr})${ANSI.reset} ${ANSI.bold}${test.name}${ANSI.reset}`
      );
      if (test.error) {
        console.log(`        ${ANSI.red}Error: ${test.error.message}${ANSI.reset}`);
        if (test.error.expected !== undefined && test.error.actual !== undefined) {
          console.log(`        ${ANSI.dim}Expected: ${JSON.stringify(test.error.expected)}${ANSI.reset}`);
          console.log(`        ${ANSI.dim}Actual:   ${JSON.stringify(test.error.actual)}${ANSI.reset}`);
        }
        if (this.verbose && test.error.stack) {
          console.log(`        ${ANSI.dim}${test.error.stack}${ANSI.reset}`);
        }
      }
    } else {
      console.log(
        `    ${ANSI.yellow}○ [SKIP]${ANSI.reset} ${ANSI.dim}(${timeStr})${ANSI.reset} ${test.name}`
      );
    }
  }

  public printSummary(summary: TestRunSummary) {
    console.log('\n' + ANSI.cyan + '='.repeat(80) + ANSI.reset);
    console.log(ANSI.bold + '                         E2E EXECUTION SUMMARY' + ANSI.reset);
    console.log(ANSI.cyan + '='.repeat(80) + ANSI.reset);

    console.log(`  Execution Mode: ${ANSI.bold}${summary.mode.toUpperCase()}${ANSI.reset}`);
    if (summary.baseUrl) {
      console.log(`  Base Target:    ${summary.baseUrl}`);
    }
    console.log(`  Duration:       ${summary.durationMs} ms`);
    console.log(`  Total Suites:   ${summary.totalSuites}`);
    console.log(`  Total Tests:    ${summary.totalTests}`);
    console.log(`  Passed Tests:   ${ANSI.green}${summary.passedCount}${ANSI.reset}`);
    console.log(
      `  Failed Tests:   ${summary.failedCount > 0 ? ANSI.red : ANSI.green}${summary.failedCount}${ANSI.reset}`
    );
    console.log(`  Skipped Tests:  ${ANSI.yellow}${summary.skippedCount}${ANSI.reset}`);

    console.log('\n  ' + ANSI.bold + 'Tier Breakdown:' + ANSI.reset);
    for (const [tier, metrics] of Object.entries(summary.tiers)) {
      const color = metrics.failed > 0 ? ANSI.red : ANSI.green;
      console.log(
        `    Tier ${tier}: ${metrics.total} total | ${ANSI.green}${metrics.passed} passed${ANSI.reset} | ${color}${metrics.failed} failed${ANSI.reset} | ${metrics.skipped} skipped`
      );
    }

    console.log('\n' + ANSI.cyan + '='.repeat(80) + ANSI.reset);
    if (summary.failedCount === 0) {
      console.log(
        `  ${ANSI.bold}${ANSI.green}ALL E2E TESTS PASSED (100% SUCCESSFUL)${ANSI.reset}`
      );
    } else {
      console.log(
        `  ${ANSI.bold}${ANSI.red}SOME TESTS FAILED - CHECK ERROR DETAILS ABOVE${ANSI.reset}`
      );
    }
    console.log(ANSI.cyan + '='.repeat(80) + ANSI.reset + '\n');
  }

  public writeJsonReport(summary: TestRunSummary, reportPath: string = 'test-results/e2e-report.json') {
    const fullPath = path.resolve(reportPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`  ${ANSI.dim}✓ JSON test report saved to: ${fullPath}${ANSI.reset}\n`);
  }
}
