import { describe, expect, it } from 'vitest';
import { errorMessage } from './messages.js';

describe('errorMessage', () => {
  it.each([
    ['VALIDATION_ERROR', '注文内容を確認してください'],
    ['PRODUCT_NOT_FOUND', 'メニューにない商品が含まれています'],
    ['NETWORK_ERROR', 'サーバーに接続できませんでした'],
  ])('%s は日本語メッセージになる', (code, expected) => {
    expect(errorMessage({ code, message: '', details: {} })).toContain(expected);
  });

  it('未知のコードはコードを添えて表示する', () => {
    expect(errorMessage({ code: 'SOMETHING_NEW', message: '', details: {} })).toBe(
      '注文を受け付けできませんでした（SOMETHING_NEW）。',
    );
  });
});
