import { createOrder, fetchProducts, toApiErrorBody } from './api.js';
import { buildCartLines, cartSubtotal, decrementItem, incrementItem, toOrderRequest, type Cart } from './cart.js';
import { errorMessage } from './messages.js';
import type { OrderDto, ProductDto } from './types.js';
import { renderMenu, renderOrderLines, renderReceipt, renderTotals } from './view.js';

// DOM とのつなぎ込みだけを行う。表示内容の組み立ては view.ts、計算は cart.ts に置く。

interface State {
  products: ProductDto[];
  cart: Cart;
  submitting: boolean;
  error: string | null;
  receipt: OrderDto | null;
}

const state: State = { products: [], cart: {}, submitting: false, error: null, receipt: null };

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

function render(): void {
  const lines = buildCartLines(state.cart, state.products);
  const subtotal = cartSubtotal(lines);

  menu.innerHTML = renderMenu(state.products, state.cart);
  orderLines.innerHTML = renderOrderLines(lines);
  orderTotals.innerHTML = renderTotals({ subtotal, total: subtotal });
  submitButton.disabled = lines.length === 0 || state.submitting;
  submitButton.textContent = state.submitting ? '送信中…' : '注文する';
  orderError.textContent = state.error ?? '';
  orderError.hidden = state.error === null;
  orderReceipt.innerHTML = state.receipt ? renderReceipt(state.receipt) : '';
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
  state.error = null;
  state.receipt = null;
  render();
  menu
    .querySelector<HTMLButtonElement>(
      `button[data-action="${button.dataset.action}"][data-product-id="${CSS.escape(productId)}"]`,
    )
    ?.focus();
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting) {
    return;
  }
  state.submitting = true;
  state.error = null;
  render();
  try {
    state.receipt = await createOrder(toOrderRequest(state.cart));
    state.cart = {};
  } catch (error) {
    state.error = errorMessage(toApiErrorBody(error));
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
