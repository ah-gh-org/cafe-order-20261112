import type { ApiErrorBody, CreateOrderRequest, OrderDto, ProductDto } from './types.js';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function fetchProducts(fetchFn: FetchLike = fetch): Promise<ProductDto[]> {
  return requestJson<ProductDto[]>(fetchFn, '/api/products');
}

export function createOrder(request: CreateOrderRequest, fetchFn: FetchLike = fetch): Promise<OrderDto> {
  return requestJson<OrderDto>(fetchFn, '/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

/** 画面表示用に、任意のエラーを API のエラー形式にそろえる。 */
export function toApiErrorBody(error: unknown): ApiErrorBody {
  if (error instanceof ApiError) {
    return error.body;
  }
  return { code: 'UNKNOWN_ERROR', message: String(error), details: {} };
}

async function requestJson<T>(fetchFn: FetchLike, url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetchFn(url, init);
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Network request failed', details: {} });
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, readErrorBody(body, response.status));
  }
  return body as T;
}

function readErrorBody(body: unknown, status: number): ApiErrorBody {
  const error = (body as { error?: Partial<ApiErrorBody> } | null)?.error;
  if (error && typeof error.code === 'string') {
    return { code: error.code, message: error.message ?? '', details: error.details ?? {} };
  }
  return { code: 'UNKNOWN_ERROR', message: `HTTP ${status}`, details: {} };
}
