import { describe, expect, it } from 'vitest';
import { assertYen, multiplyYen, sumYen } from './money.js';

describe('assertYen', () => {
  it('0 以上の整数はそのまま返す', () => {
    expect(assertYen(0)).toBe(0);
    expect(assertYen(550)).toBe(550);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    '%s は RangeError になる',
    (value) => {
      expect(() => assertYen(value)).toThrow(RangeError);
    },
  );
});

describe('multiplyYen', () => {
  it('単価 × 数量を返す', () => {
    expect(multiplyYen(550, 2)).toBe(1100);
  });

  it('数量 0 なら 0 円', () => {
    expect(multiplyYen(550, 0)).toBe(0);
  });

  it('数量が整数でなければ RangeError', () => {
    expect(() => multiplyYen(550, 1.5)).toThrow(RangeError);
    expect(() => multiplyYen(550, -1)).toThrow(RangeError);
  });

  it('単価が不正なら RangeError', () => {
    expect(() => multiplyYen(-550, 1)).toThrow(RangeError);
  });
});

describe('sumYen', () => {
  it('空配列は 0 円', () => {
    expect(sumYen([])).toBe(0);
  });

  it('合計を返す', () => {
    expect(sumYen([550, 350, 480])).toBe(1380);
  });

  it('不正な金額が含まれると RangeError', () => {
    expect(() => sumYen([100, -1])).toThrow(RangeError);
  });
});
