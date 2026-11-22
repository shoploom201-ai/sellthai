// 주문 공용 모듈
import { DEFAULT_PRODUCTS } from './default-products.js';

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 3000;
export const PAYMENT_KEY = 'payment_settings';

export const STATUS_LABELS = {
  pending: '입금대기',
  paid: '입금확인',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '주문취소'
};

export function orderKey(id) {
  return `order:${id}`;
}

export function isValidOrderId(id) {
  return typeof id === 'string' && /^\d{6}-[A-Z0-9]{6}$/.test(id);
}

export function text(value, max) {
  return typeof value === 'string' ? value.replace(/[<>"`]/g, '').trim().slice(0, max) : '';
}

export function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

export async function getProducts(env) {
  const saved = await env.SELLTHAI_KV.get('products', 'json');
  return Array.isArray(saved) ? saved : DEFAULT_PRODUCTS;
}

export async function getPaymentSettings(env) {
  const saved = env.SELLTHAI_KV ? await env.SELLTHAI_KV.get(PAYMENT_KEY, 'json') : null;
  return {
    bankName: saved?.bankName || '',
    accountNumber: saved?.accountNumber || '',
    accountHolder: saved?.accountHolder || '',
    depositDays: saved?.depositDays || 3
  };
}

export function isBankReady(bank) {
  return Boolean(bank.bankName && bank.accountNumber && bank.accountHolder);
}

export function newOrderId() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // 한국 시간 기준 날짜
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = crypto.getRandomValues(new Uint8Array(6));
  return `${ymd}-${[...rand].map(n => chars[n % chars.length]).join('')}`;
}
