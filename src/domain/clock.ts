/** 現在時刻の取得元。テストでは固定時刻の Clock を注入する。 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(at: string | Date): Clock {
  const time = new Date(at).getTime();
  if (Number.isNaN(time)) {
    throw new RangeError(`invalid date: ${String(at)}`);
  }
  return { now: () => new Date(time) };
}
