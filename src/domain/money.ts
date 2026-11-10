/** 金額（円）。常に 0 以上の整数で扱い、小数は使わない。 */
export type Yen = number;

export function assertYen(value: number, label = 'amount'): Yen {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer (yen): ${value}`);
  }
  return value;
}

export function multiplyYen(unitPrice: Yen, quantity: number): Yen {
  assertYen(unitPrice, 'unitPrice');
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`quantity must be a non-negative integer: ${quantity}`);
  }
  return assertYen(unitPrice * quantity, 'result');
}

export function sumYen(amounts: readonly Yen[]): Yen {
  return amounts.reduce<Yen>((sum, amount) => assertYen(sum + assertYen(amount), 'sum'), 0);
}
