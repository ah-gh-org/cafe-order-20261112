/** API のレスポンス／リクエストの型（ブラウザ側）。サーバーの JSON と合わせる。 */

export type ProductCategory = 'drink' | 'food';

export interface ProductDto {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
}

interface OrderItemDto {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDto {
  id: string;
  items: OrderItemDto[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  total: number;
  createdAt: string;
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
}

export interface PreviewOrderRequest {
  items: { productId: string; quantity: number }[];
  couponCode: string;
}

export interface OrderPreviewDto {
  subtotal: number;
  discount: number;
  total: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: Record<string, unknown>;
}
