import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const USAGE_BOUND_MECHANISM = 'independent-json-usage-bound-v1';

export function createUsageBoundFixture({ limit = 100, measured = 0, usageUnknown = false } = {}) {
  if (process.platform !== 'win32') {
    throw new Error(`usage bound fixture only supports win32, received ${process.platform}`);
  }
  const root = mkdtempSync(join(tmpdir(), 'dc-usage-'));
  const sourcePath = join(root, 'usage-source.json');
  writeUsageSource(sourcePath, { limit, measured, usageUnknown });
  return {
    root,
    sourcePath,
    mechanism: USAGE_BOUND_MECHANISM,
    setUsage(next) {
      writeUsageSource(sourcePath, next);
    },
    removeUsageSource() {
      rmSync(sourcePath, { force: true });
    },
    requestEffect(tokens) {
      if (!existsSync(sourcePath)) {
        return { allowed: false, reason: 'USAGE_SOURCE_MISSING', g0Open: true };
      }
      const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
      if (source.usageUnknown === true) {
        return { allowed: false, reason: 'USAGE_UNKNOWN', g0Open: true };
      }
      if (!Number.isInteger(source.limit) || source.limit < 0) {
        return { allowed: false, reason: 'LIMIT_MISSING', g0Open: true };
      }
      if (!Number.isInteger(source.measured) || source.measured < 0) {
        return { allowed: false, reason: 'MEASURED_MISSING', g0Open: true };
      }
      if (source.measured + tokens > source.limit) {
        return { allowed: false, reason: 'LIMIT_EXCEEDED', g0Open: false };
      }
      return { allowed: true, reason: 'OK', g0Open: false };
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeUsageSource(path, value) {
  writeFileSync(path, JSON.stringify(value));
}
