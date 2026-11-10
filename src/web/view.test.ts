import { describe, expect, it } from 'vitest';
import { MAX_QUANTITY } from './cart.js';
import type { OrderDto, ProductDto } from './types.js';
import { escapeHtml, renderMenu, renderOrderLines, renderReceipt, renderTotals } from './view.js';

const products: ProductDto[] = [
  { id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' },
  { id: 'croissant', name: 'クロワッサン', price: 350, category: 'food' },
];

const order: OrderDto = {
  id: 'ORD-0001',
  items: [
    { productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 },
    { productId: 'croissant', name: 'クロワッサン', unitPrice: 350, quantity: 1, lineTotal: 350 },
  ],
  subtotal: 1450,
  total: 1450,
  createdAt: '2026-04-01T01:00:00.000Z',
};

describe('escapeHtml', () => {
  it('HTML の特殊文字をエスケープする', () => {
    expect(escapeHtml(`<b class="x">'&'</b>`)).toBe('&lt;b class=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;');
  });
});

describe('renderMenu', () => {
  it('商品ごとにカード・価格・数量・＋／−ボタンを出す', () => {
    const html = renderMenu(products, { latte: 2 });
    expect(html.match(/class="menu-card/g)).toHaveLength(2);
    expect(html).toContain('カフェラテ');
    expect(html).toContain('¥550');
    expect(html).toContain('ドリンク');
    expect(html).toContain('フード');
    expect(html).toContain('<output class="qty" aria-label="カフェラテの数量">2</output>');
    expect(html).toContain('data-action="increment" data-product-id="latte"');
  });

  it('数量 0 の商品は − ボタンが無効', () => {
    const html = renderMenu([products[1]!], {});
    expect(html).toMatch(/data-action="decrement"[^>]*disabled/);
    expect(html).not.toMatch(/data-action="increment"[^>]*disabled/);
  });

  it(`数量 ${MAX_QUANTITY} の商品は ＋ ボタンが無効`, () => {
    const html = renderMenu([products[0]!], { latte: MAX_QUANTITY });
    expect(html).toMatch(/data-action="increment"[^>]*disabled/);
  });

  it('商品名はエスケープする', () => {
    const html = renderMenu([{ id: 'x', name: '<script>', price: 100, category: 'food' }], {});
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('商品がなければメッセージを出す', () => {
    expect(renderMenu([], {})).toContain('メニューがありません');
  });
});

describe('renderOrderLines', () => {
  it('明細ごとに商品名・数量・金額を出す', () => {
    const html = renderOrderLines(order.items);
    expect(html).toContain('<span class="line-name">カフェラテ</span><span class="line-qty">× 2</span>');
    expect(html).toContain('¥1,100');
  });

  it('空なら案内文を出す', () => {
    expect(renderOrderLines([])).toContain('メニューから商品を選んでください');
  });
});

describe('renderTotals', () => {
  it('小計と合計を出す', () => {
    const html = renderTotals({ subtotal: 1450, total: 1450 });
    expect(html).toContain('<dt>小計</dt><dd>¥1,450</dd>');
    expect(html).toContain('<dt>合計</dt><dd>¥1,450</dd>');
  });
});

describe('renderReceipt', () => {
  it('注文番号とサーバーの金額を出す', () => {
    const html = renderReceipt({ ...order, total: 1400 });
    expect(html).toContain('注文番号 <strong>ORD-0001</strong>');
    expect(html).toContain('<dt>小計</dt><dd>¥1,450</dd>');
    expect(html).toContain('<dt>合計</dt><dd>¥1,400</dd>');
  });
});
