import type { ApiErrorBody } from './types.js';

/** API のエラーコードを画面に表示する日本語メッセージに変換する。 */
export function errorMessage(error: ApiErrorBody): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return '注文内容を確認してください（数量は 1〜99 個まで）。';
    case 'PRODUCT_NOT_FOUND':
      return 'メニューにない商品が含まれています。ページを再読み込みしてください。';
    case 'NETWORK_ERROR':
      return 'サーバーに接続できませんでした。通信状態を確認してください。';
    default:
      return `注文を受け付けできませんでした（${error.code}）。`;
  }
}
