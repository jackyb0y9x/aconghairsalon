/**
 * E2E Test Suite Types and Interfaces
 */

export type TestTier = 1 | 2 | 3 | 4;

export interface TestMetadata {
  id: string;
  name: string;
  tier: TestTier;
  feature: string;
  description?: string;
}

export type TestFunction = (ctx: TestContext) => Promise<void> | void;

export interface TestCase extends TestMetadata {
  fn: TestFunction;
}

export interface TestSuite {
  id: string;
  name: string;
  tier: TestTier;
  tests: TestCase[];
}

export interface TestResult {
  id: string;
  name: string;
  tier: TestTier;
  feature: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: {
    message: string;
    stack?: string;
    expected?: any;
    actual?: any;
  };
}

export interface SuiteResult {
  id: string;
  name: string;
  tier: TestTier;
  durationMs: number;
  tests: TestResult[];
  passedCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface TestRunSummary {
  timestamp: string;
  mode: 'live' | 'simulation';
  baseUrl?: string;
  totalSuites: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  durationMs: number;
  tiers: {
    [key in TestTier]: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    };
  };
  suites: SuiteResult[];
}

export interface RunnerOptions {
  tier?: TestTier;
  grep?: string;
  verbose?: boolean;
  reportPath?: string;
  baseUrl?: string;
}

export interface HttpResponse<T = any> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: T;
  rawText: string;
  durationMs: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  authRole?: 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'BOOKING_STAFF' | 'EDITOR' | 'ANONYMOUS';
  authToken?: string;
  timeoutMs?: number;
}

export interface TestContext {
  client: any; // ApiClient
  fixtures: any;
  log: (...args: any[]) => void;
}
