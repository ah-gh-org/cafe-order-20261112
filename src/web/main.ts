import { createOrder, fetchProducts, previewOrder, toApiErrorBody } from './api.js';
import { buildCartLines, cartSubtotal, decrementItem, incrementItem, toOrderRequest, type Cart } from './cart.js';
import { formatYen } from './format.js';
import { errorMessage } from './messages.js';
import type { OrderDto, OrderPreviewDto, ProductDto } from './types.js';
import { renderMenu, renderOrderLines, renderReceipt, renderTotals } from './view.js';

// DOM とのつなぎ込みだけを行う。表示内容の組み立ては view.ts、計算は cart.ts に置く。

interface State {
  products: ProductDto[];
  cart: Cart;
  submitting: boolean;
  error: string | null;
  receipt: OrderDto | null;
  preview: OrderPreviewDto | null;
  appliedCouponCode: string | null;
  previewing: boolean;
  previewRequestId: number;
  couponMessage: string;
}

const state: State = {
  products: [],
  cart: {},
  submitting: false,
  error: null,
  receipt: null,
  preview: null,
  appliedCouponCode: null,
  previewing: false,
  previewRequestId: 0,
  couponMessage: '',
};

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`#${id} が見つかりません`);
  }
  return found as T;
}

const menu = element('menu');
const orderLines = element('order-lines');
const orderTotals = element('order-totals');
const orderForm = element<HTMLFormElement>('order-form');
const submitButton = element<HTMLButtonElement>('submit-order');
const orderError = element('order-error');
const orderReceipt = element('order-receipt');
const couponCodeInput = element<HTMLInputElement>('coupon-code');
const applyCouponButton = element<HTMLButtonElement>('apply-coupon');
const couponStatus = element('coupon-status');
const couponConfetti = element('coupon-confetti');

function render(): void {
  const lines = buildCartLines(state.cart, state.products);
  const subtotal = cartSubtotal(lines);
  const totals = state.preview ?? { subtotal, discount: 0, total: subtotal };

  menu.innerHTML = renderMenu(state.products, state.cart);
  orderLines.innerHTML = renderOrderLines(lines);
  orderTotals.innerHTML = renderTotals(totals);
  submitButton.disabled = lines.length === 0 || state.submitting || state.previewing;
  submitButton.textContent = state.submitting ? '送信中…' : '注文する';
  applyCouponButton.disabled = lines.length === 0 || state.submitting || state.previewing;
  orderError.textContent = state.error ?? '';
  orderError.hidden = state.error === null;
  couponStatus.textContent = state.couponMessage;
  orderReceipt.innerHTML = state.receipt ? renderReceipt(state.receipt) : '';
}

function invalidatePreview(message = ''): void {
  const hadPreview = state.preview !== null || state.previewing || state.appliedCouponCode !== null;
  state.previewRequestId += 1;
  state.preview = null;
  state.appliedCouponCode = null;
  state.previewing = false;
  state.couponMessage = hadPreview ? message : '';
}

function showConfetti(): void {
  couponConfetti.classList.remove('is-active');
  void couponConfetti.offsetWidth;
  couponConfetti.classList.add('is-active');
}

menu.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
  const productId = button?.dataset.productId;
  if (!button || !productId) {
    return;
  }
  state.cart =
    button.dataset.action === 'increment'
      ? incrementItem(state.cart, productId)
      : decrementItem(state.cart, productId);
  invalidatePreview('カート内容が変わりました。クーポンをもう一度適用してください。');
  state.error = null;
  state.receipt = null;
  render();
  menu
    .querySelector<HTMLButtonElement>(
      `button[data-action="${button.dataset.action}"][data-product-id="${CSS.escape(productId)}"]`,
    )
    ?.focus();
});

couponCodeInput.addEventListener('input', () => {
  invalidatePreview('クーポンコードを変更しました。もう一度適用してください。');
  state.error = null;
  render();
});

applyCouponButton.addEventListener('click', async () => {
  const couponCode = couponCodeInput.value.trim().toUpperCase();
  if (!couponCode || state.submitting || state.previewing) {
    return;
  }

  const requestId = state.previewRequestId + 1;
  state.previewRequestId = requestId;
  state.preview = null;
  state.appliedCouponCode = null;
  state.previewing = true;
  state.couponMessage = 'クーポンを確認しています…';
  state.error = null;
  render();

  try {
    const preview = await previewOrder({ ...toOrderRequest(state.cart), couponCode });
    if (requestId !== state.previewRequestId) {
      return;
    }
    state.preview = preview;
    state.appliedCouponCode = couponCode;
    state.couponMessage = `${couponCode}を適用しました。割引額は${formatYen(preview.discount)}です。`;
    showConfetti();
  } catch (error) {
    if (requestId !== state.previewRequestId) {
      return;
    }
    state.couponMessage = errorMessage(toApiErrorBody(error));
  } finally {
    if (requestId === state.previewRequestId) {
      state.previewing = false;
      render();
    }
  }
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting || state.previewing) {
    return;
  }
  state.submitting = true;
  state.error = null;
  render();
  try {
    const request = toOrderRequest(state.cart);
    state.receipt = await createOrder(
      state.appliedCouponCode && state.preview ? { ...request, couponCode: state.appliedCouponCode } : request,
    );
    state.cart = {};
    couponCodeInput.value = '';
    invalidatePreview();
    state.couponMessage = '';
  } catch (error) {
    const apiError = toApiErrorBody(error);
    state.error = errorMessage(apiError);
    if (
      apiError.code === 'COUPON_NOT_FOUND' ||
      apiError.code === 'COUPON_EXPIRED' ||
      apiError.code === 'COUPON_MINIMUM_NOT_MET'
    ) {
      invalidatePreview();
    }
  } finally {
    state.submitting = false;
    render();
  }
});

async function start(): Promise<void> {
  try {
    state.products = await fetchProducts();
  } catch {
    state.error = 'メニューを読み込めませんでした。ページを再読み込みしてください。';
  }
  render();
}

void start();
