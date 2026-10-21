/**
 * Fluent Opaque-Box Assertion Library
 */

export class AssertionError extends Error {
  public expected: any;
  public actual: any;

  constructor(message: string, expected?: any, actual?: any) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

export function expect<T = any>(actual: T) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
          expected,
          actual
        );
      }
    },

    notToBe(expected: any) {
      if (actual === expected) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual)} NOT to be ${JSON.stringify(expected)}`,
          `not ${expected}`,
          actual
        );
      }
    },

    toEqual(expected: any) {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual, null, 2)} to deeply equal ${JSON.stringify(expected, null, 2)}`,
          expected,
          actual
        );
      }
    },

    toBeDefined() {
      if (actual === undefined) {
        throw new AssertionError(`Expected value to be defined, but was undefined`, 'defined', actual);
      }
    },

    toBeUndefined() {
      if (actual !== undefined) {
        throw new AssertionError(`Expected value to be undefined, but was ${JSON.stringify(actual)}`, undefined, actual);
      }
    },

    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`Expected value to be null, but was ${JSON.stringify(actual)}`, null, actual);
      }
    },

    toBeTruthy() {
      if (!actual) {
        throw new AssertionError(`Expected ${JSON.stringify(actual)} to be truthy`, 'truthy', actual);
      }
    },

    toBeFalsy() {
      if (actual) {
        throw new AssertionError(`Expected ${JSON.stringify(actual)} to be falsy`, 'falsy', actual);
      }
    },

    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(`Expected ${actual} to be greater than ${expected}`, `> ${expected}`, actual);
      }
    },

    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(`Expected ${actual} to be greater than or equal to ${expected}`, `>= ${expected}`, actual);
      }
    },

    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(`Expected ${actual} to be less than ${expected}`, `< ${expected}`, actual);
      }
    },

    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new AssertionError(`Expected ${actual} to be less than or equal to ${expected}`, `<= ${expected}`, actual);
      }
    },

    toMatch(pattern: RegExp | string) {
      const reg = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (typeof actual !== 'string' || !reg.test(actual)) {
        throw new AssertionError(`Expected "${actual}" to match pattern ${reg}`, reg.toString(), actual);
      }
    },

    toContain(itemOrSubstring: any) {
      if (typeof actual === 'string') {
        if (!actual.includes(String(itemOrSubstring))) {
          throw new AssertionError(`Expected string "${actual}" to contain "${itemOrSubstring}"`, itemOrSubstring, actual);
        }
      } else if (Array.isArray(actual)) {
        const found = (actual as any[]).some(elem => deepEqual(elem, itemOrSubstring));
        if (!found) {
          throw new AssertionError(`Expected array to contain ${JSON.stringify(itemOrSubstring)}`, itemOrSubstring, actual);
        }
      } else {
        throw new AssertionError(`toContain cannot be used on type ${typeof actual}`);
      }
    },

    toHaveLength(expectedLength: number) {
      const len = (actual as any)?.length;
      if (len !== expectedLength) {
        throw new AssertionError(
          `Expected length ${expectedLength}, but got ${len}`,
          expectedLength,
          len
        );
      }
    },

    toHaveProperty(prop: string, expectedVal?: any) {
      if (actual === null || typeof actual !== 'object' || !(prop in (actual as any))) {
        throw new AssertionError(`Expected object to have property "${prop}"`, prop, actual);
      }
      if (expectedVal !== undefined) {
        const val = (actual as any)[prop];
        if (!deepEqual(val, expectedVal)) {
          throw new AssertionError(
            `Expected property "${prop}" to be ${JSON.stringify(expectedVal)}, but got ${JSON.stringify(val)}`,
            expectedVal,
            val
          );
        }
      }
    },

    toThrow(expectedMessage?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new AssertionError(`Expected function to be tested for throw, but got ${typeof actual}`);
      }
      let threw = false;
      let caughtError: any = null;
      try {
        (actual as any)();
      } catch (err: any) {
        threw = true;
        caughtError = err;
      }

      if (!threw) {
        throw new AssertionError(`Expected function to throw an error, but it did not throw`);
      }

      if (expectedMessage) {
        const msg = caughtError?.message || String(caughtError);
        if (typeof expectedMessage === 'string' && !msg.includes(expectedMessage)) {
          throw new AssertionError(
            `Expected error message to contain "${expectedMessage}", but got "${msg}"`,
            expectedMessage,
            msg
          );
        } else if (expectedMessage instanceof RegExp && !expectedMessage.test(msg)) {
          throw new AssertionError(
            `Expected error message to match ${expectedMessage}, but got "${msg}"`,
            expectedMessage.toString(),
            msg
          );
        }
      }
    }
  };
}
