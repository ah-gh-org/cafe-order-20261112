/** 円を「¥1,234」形式で表示する。負の値は「−¥1,234」。 */
export function formatYen(amount: number): string {
  const sign = amount < 0 ? '−' : '';
  const digits = String(Math.abs(Math.trunc(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}¥${digits}`;
}
