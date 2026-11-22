import { json } from '../_lib/auth.js';
import { digits, getPaymentSettings, isValidOrderId, orderKey } from '../_lib/orders.js';

// GET /api/order-lookup?id=주문번호&phone=연락처 → 고객 주문 조회
export async function onRequestGet({ request, env }) {
  if (!env.SELLTHAI_KV) return json({ error: '주문 조회를 할 수 없습니다.' }, 503);

  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') || '').trim().toUpperCase();
  const phone = digits(url.searchParams.get('phone'));
  const notFound = json({ error: '주문을 찾을 수 없습니다. 주문번호와 연락처를 확인해 주세요.' }, 404);

  if (!isValidOrderId(id) || phone.length < 9) return notFound;

  const order = await env.SELLTHAI_KV.get(orderKey(id), 'json');
  if (!order || order.customer?.phone !== phone) return notFound;

  return json({
    order: {
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items.map(({ name, option, price, quantity }) => ({ name, option, price, quantity })),
      total: order.total,
      shipping: order.shipping,
      courier: order.courier,
      trackingNumber: order.trackingNumber
    },
    bank: order.status === 'pending' ? await getPaymentSettings(env) : null
  });
}
