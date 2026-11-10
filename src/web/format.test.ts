import { describe, expect, it } from 'vitest';
import { formatYen } from './format.js';

describe('formatYen', () => {
  it.each([
    [0, '¥0'],
    [550, '¥550'],
    [1000, '¥1,000'],
    [1234567, '¥1,234,567'],
    [-500, '−¥500'],
  ])('%d → %s', (amount, expected) => {
    expect(formatYen(amount)).toBe(expected);
  });
});
