import type { Yen } from '../domain/money.js';
import { AppError } from '../http/errors.js';

const COUPONS = {
  WELCOME10: {
    startsAt: new Date('2026-10-09T15:00:00.000Z'),
    endsAt: new Date('2027-01-07T15:00:00.000Z'),
    minimumSubtotal: 1000,
    discountRate: 0.1,
  },
  STAMP500: {
    startsAt: new Date('2026-10-09T15:00:00.000Z'),
    endsAt: new Date('2027-10-09T15:00:00.000Z'),
    discountAmount: 500,
  },
} as const;

export interface CouponResult {
  couponCode: keyof typeof COUPONS;
  discount: Yen;
}

export function applyCoupon(code: string, subtotal: Yen, now: Date): CouponResult {
  const couponCode = code.trim().toUpperCase();
  if (couponCode !== 'WELCOME10' && couponCode !== 'STAMP500') {
    throw new AppError(400, 'COUPON_NOT_FOUND', `Coupon not found: ${couponCode}`, { couponCode });
  }

  if (couponCode === 'WELCOME10') {
    const coupon = COUPONS.WELCOME10;
    if (now < coupon.startsAt || now >= coupon.endsAt) {
      throw expiredCouponError(couponCode, coupon.startsAt, coupon.endsAt);
    }
    if (subtotal < coupon.minimumSubtotal) {
      throw new AppError(400, 'COUPON_MINIMUM_NOT_MET', 'Coupon minimum subtotal not met', {
        couponCode,
        minimumSubtotal: coupon.minimumSubtotal,
        subtotal,
      });
    }
    return { couponCode, discount: Math.floor(subtotal * coupon.discountRate) as Yen };
  }

  const coupon = COUPONS.STAMP500;
  if (now < coupon.startsAt || now >= coupon.endsAt) {
    throw expiredCouponError(couponCode, coupon.startsAt, coupon.endsAt);
  }
  return { couponCode, discount: Math.min(subtotal, coupon.discountAmount) as Yen };
}

function expiredCouponError(couponCode: string, startsAt: Date, endsAt: Date): AppError {
  return new AppError(400, 'COUPON_EXPIRED', `Coupon is not valid at this time: ${couponCode}`, {
    couponCode,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });
}
