import type { Express } from 'express';
import { createApp } from '../app.js';
import { fixedClock, type Clock } from '../domain/clock.js';
import { createInMemoryRepositories, type Repositories } from '../repositories/index.js';

/** テストの基準時刻（日本時間 2026-04-01 10:00）。 */
export const TEST_NOW = '2026-04-01T01:00:00.000Z';

interface TestContext {
  app: Express;
  clock: Clock;
  repositories: Repositories;
}

export function createTestApp(now: string | Date = TEST_NOW): TestContext {
  const clock = fixedClock(now);
  const repositories = createInMemoryRepositories();
  return { app: createApp({ clock, repositories }), clock, repositories };
}
