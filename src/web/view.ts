import { MAX_QUANTITY, type Cart, type CartLine } from './cart.js';
import { formatYen } from './format.js';
import type { OrderDto, ProductCategory, ProductDto } from './types.js';

/** 画面の HTML を組み立てる純粋関数。DOM には触れない（main.ts が innerHTML に入れる）。 */

const CATEGORY_LABELS: Record<ProductCategory, string> = { drink: 'ドリンク', food: 'フード' };
const CATEGORY_ICONS: Record<ProductCategory, string> = { drink: '☕', food: '🥐' };

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderMenu(products: readonly ProductDto[], cart: Cart): string {
  if (products.length === 0) {
    return '<p class="muted">メニューがありません。</p>';
  }
  return products.map((product) => renderMenuCard(product, cart[product.id] ?? 0)).join('');
}

function renderMenuCard(product: ProductDto, quantity: number): string {
  const id = escapeHtml(product.id);
  const name = escapeHtml(product.name);
  return `<article class="menu-card${quantity > 0 ? ' selected' : ''}">
  <span class="menu-icon" aria-hidden="true">${CATEGORY_ICONS[product.category]}</span>
  <h3 class="menu-name">${name}</h3>
  <p class="menu-meta"><span class="tag">${CATEGORY_LABELS[product.category]}</span><span class="price">${formatYen(product.price)}</span></p>
  <div class="qty-control">
    <button type="button" class="qty-button" data-action="decrement" data-product-id="${id}" aria-label="${name}を1つ減らす"${quantity === 0 ? ' disabled' : ''}>−</button>
    <output class="qty" aria-label="${name}の数量">${quantity}</output>
    <button type="button" class="qty-button" data-action="increment" data-product-id="${id}" aria-label="${name}を1つ追加"${quantity >= MAX_QUANTITY ? ' disabled' : ''}>＋</button>
  </div>
</article>`;
}

export function renderOrderLines(lines: readonly CartLine[]): string {
  if (lines.length === 0) {
    return '<li class="order-line empty">メニューから商品を選んでください。</li>';
  }
  return lines.map(renderLine).join('');
}

function renderLine(line: Pick<CartLine, 'name' | 'quantity' | 'lineTotal'>): string {
  return `<li class="order-line"><span class="line-name">${escapeHtml(line.name)}</span><span class="line-qty">× ${line.quantity}</span><span class="line-total">${formatYen(line.lineTotal)}</span></li>`;
}

interface Totals {
  subtotal: number;
  total: number;
}

/** <dl> の中身として 小計・合計 を描画する。 */
export function renderTotals({ subtotal, total }: Totals): string {
  return [
    `<div class="totals-row"><dt>小計</dt><dd>${formatYen(subtotal)}</dd></div>`,
    `<div class="totals-row grand-total"><dt>合計</dt><dd>${formatYen(total)}</dd></div>`,
  ].join('');
}

/** 注文完了後に表示する控え。金額はサーバーの計算結果を使う。 */
export function renderReceipt(order: OrderDto): string {
  return `<h3>ご注文ありがとうございます</h3>
<p class="order-number">注文番号 <strong>${escapeHtml(order.id)}</strong></p>
<ul class="receipt-lines">${order.items.map(renderLine).join('')}</ul>
<dl class="totals">${renderTotals(order)}</dl>`;
}
