import type { ApiErrorBody } from './types.js';

/** API のエラーコードを画面に表示する日本語メッセージに変換する。 */
export function errorMessage(error: ApiErrorBody): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return '注文内容を確認してください（数量は 1〜99 個まで）。';
    case 'PRODUCT_NOT_FOUND':
      return 'メニューにない商品が含まれています。ページを再読み込みしてください。';
    case 'COUPON_NOT_FOUND':
      return 'クーポンコードが見つかりません。入力内容をご確認ください。';
    case 'COUPON_EXPIRED':
      return 'このクーポンは有効期間外です。利用できる期間をご確認ください。';
    case 'COUPON_MINIMUM_NOT_MET':
      return 'このクーポンは小計1,000円以上で使えます。商品を追加してお試しください。';
    case 'NETWORK_ERROR':
      return 'サーバーに接続できませんでした。通信状態を確認してください。';
    default:
      return `注文を受け付けできませんでした（${error.code}）。`;
  }
}
