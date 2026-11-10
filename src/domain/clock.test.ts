import { describe, expect, it } from 'vitest';
import { fixedClock, systemClock } from './clock.js';

describe('fixedClock', () => {
  it('常に同じ時刻を返す', () => {
    const clock = fixedClock('2026-04-01T01:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-04-01T01:00:00.000Z');
    expect(clock.now().getTime()).toBe(clock.now().getTime());
  });

  it('返した Date を変更しても時刻は変わらない', () => {
    const clock = fixedClock('2026-04-01T01:00:00.000Z');
    clock.now().setFullYear(2000);
    expect(clock.now().toISOString()).toBe('2026-04-01T01:00:00.000Z');
  });

  it('不正な日時は RangeError', () => {
    expect(() => fixedClock('not-a-date')).toThrow(RangeError);
  });
});

describe('systemClock', () => {
  it('現在時刻を返す', () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
  });
});
