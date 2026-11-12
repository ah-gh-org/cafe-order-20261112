import { describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/clock.js';
import { applyCoupon } from './coupons.js';

describe('applyCoupon', () => {
  it('前後の空白と小文字を正規化する', () => {
    expect(applyCoupon('  welcome10  ', 1450, fixedClock('2026-10-10T00:00:00+09:00').now())).toEqual({
      couponCode: 'WELCOME10',
      discount: 145,
    });
  });

  it('10% 割引の端数は切り捨てる', () => {
    expect(applyCoupon('WELCOME10', 1459, new Date('2026-10-10T00:00:00+09:00'))).toEqual({
      couponCode: 'WELCOME10',
      discount: 145,
    });
  });

  it('未知のコードは理由付きの COUPON_NOT_FOUND', () => {
    expect(() => applyCoupon('UNKNOWN', 1450, new Date('2026-10-10T00:00:00+09:00'))).toThrow(
      expect.objectContaining({
        status: 400,
        code: 'COUPON_NOT_FOUND',
        details: { couponCode: 'UNKNOWN' },
      }),
    );
  });

  it.each([
    ['開始直前', '2026-10-09T14:59:59.999Z'],
    ['終了時刻', '2027-01-07T15:00:00.000Z'],
  ])('%s は COUPON_EXPIRED', (_label, now) => {
    expect(() => applyCoupon('WELCOME10', 1450, new Date(now))).toThrow(
      expect.objectContaining({ code: 'COUPON_EXPIRED' }),
    );
  });

  it.each([
    ['開始時刻', '2026-10-09T15:00:00.000Z'],
    ['終了直前', '2027-01-07T14:59:59.999Z'],
  ])('%s は WELCOME10 が有効', (_label, now) => {
    expect(applyCoupon('WELCOME10', 1000, new Date(now))).toEqual({
      couponCode: 'WELCOME10',
      discount: 100,
    });
  });

  it('STAMP500 は終了日の最終時刻まで有効で、終了直後は期限切れ', () => {
    expect(() => applyCoupon('STAMP500', 400, new Date('2026-10-09T14:59:59.999Z'))).toThrow(
      expect.objectContaining({ code: 'COUPON_EXPIRED' }),
    );
    expect(applyCoupon('STAMP500', 400, new Date('2026-10-09T15:00:00.000Z'))).toEqual({
      couponCode: 'STAMP500',
      discount: 400,
    });
    expect(applyCoupon('STAMP500', 400, new Date('2027-10-09T14:59:59.999Z'))).toEqual({
      couponCode: 'STAMP500',
      discount: 400,
    });
    expect(() => applyCoupon('STAMP500', 400, new Date('2027-10-09T15:00:00.000Z'))).toThrow(
      expect.objectContaining({ code: 'COUPON_EXPIRED' }),
    );
  });

  it.each([
    [999, true],
    [1000, false],
    [1001, false],
  ])('小計 %i 円の最低額境界を判定する', (subtotal, rejected) => {
    const action = () => applyCoupon('WELCOME10', subtotal, new Date('2026-10-10T00:00:00+09:00'));
    if (rejected) {
      expect(action).toThrow(
        expect.objectContaining({ code: 'COUPON_MINIMUM_NOT_MET', details: { couponCode: 'WELCOME10', minimumSubtotal: 1000, subtotal } }),
      );
    } else {
      expect(action()).toMatchObject({ discount: Math.floor((subtotal * 10) / 100) });
    }
  });
});
