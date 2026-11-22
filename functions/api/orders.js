import { isAdmin, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';
import {
  FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, digits, getPaymentSettings, getProducts,
  isBankReady, newOrderId, orderKey, text
} from '../_lib/orders.js';

const MAX_ORDERS_PER_HOUR = 20;

// POST /api/orders → 무통장 입금 주문 접수 (누구나)
export async function onRequestPost({ request, env }) {
  if (!env.SELLTHAI_KV) return notConfiguredResponse();

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `order_rate:${ip}`;
  const count = Number(await env.SELLTHAI_KV.get(rateKey)) || 0;
  if (count >= MAX_ORDERS_PER_HOUR) {
    return json({ error: '주문 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429);
  }

  const bank = await getPaymentSettings(env);
  if (!isBankReady(bank)) {
    return json({ error: '현재 주문을 받을 수 없습니다. (입금 계좌 준비 중) 고객센터로 문의해 주세요.' }, 503);
  }

  let body;
  try {
    body = (await request.json()) || {};
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  // 고객 정보
  const c = body.customer || {};
  const customer = {
    name: text(c.name, 30),
    phone: digits(c.phone).slice(0, 15),
    address: text(c.address, 200),
    addressDetail: text(c.addressDetail, 100),
    depositor: text(c.depositor, 30) || text(c.name, 30),
    memo: text(c.memo, 200)
  };
  if (!customer.name) return json({ error: '받는 분 성함을 입력해 주세요.' }, 400);
  if (customer.phone.length < 9) return json({ error: '연락처를 정확히 입력해 주세요.' }, 400);
  if (!customer.address) return json({ error: '배송지 주소를 입력해 주세요.' }, 400);

  // 상품·가격은 서버에 저장된 상품 목록 기준으로 다시 계산 (가격 조작 방지)
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!rawItems.length) return json({ error: '장바구니가 비어 있습니다.' }, 400);

  const products = await getProducts(env);
  const items = [];
  for (const raw of rawItems) {
    const product = products.find(p => p.id === Number(raw.id));
    if (!product) return json({ error: '판매가 종료된 상품이 있습니다. 장바구니를 확인해 주세요.' }, 400);
    const quantity = Math.floor(Number(raw.quantity));
    if (!(quantity >= 1 && quantity <= 99)) return json({ error: '수량이 올바르지 않습니다.' }, 400);
    const options = Array.isArray(product.options) && product.options.length ? product.options : ['단일상품'];
    const option = options.includes(raw.option) ? raw.option : null;
    if (!option) return json({ error: `"${product.name}" 상품의 옵션이 변경되었습니다. 다시 담아주세요.` }, 400);
    items.push({
      id: product.id,
      name: product.name,
      option,
      price: product.price,
      quantity,
      image: (product.images && product.images[0]) || product.image || ''
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const now = new Date().toISOString();

  const order = {
    id: newOrderId(),
    createdAt: now,
    status: 'pending',
    paymentMethod: 'bank',
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    customer,
    courier: '',
    trackingNumber: '',
    history: [{ status: 'pending', at: now }]
  };

  await env.SELLTHAI_KV.put(orderKey(order.id), JSON.stringify(order), {
    metadata: { status: order.status, createdAt: now }
  });
  await env.SELLTHAI_KV.put(rateKey, String(count + 1), { expirationTtl: 3600 });

  return json({
    ok: true,
    order: { id: order.id, total: order.total, items: order.items, createdAt: now },
    bank
  });
}

// GET /api/orders → 전체 주문 목록 (관리자 전용, 최신순)
export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  const keys = [];
  let cursor;
  do {
    const page = await env.SELLTHAI_KV.list({ prefix: 'order:', cursor });
    keys.push(...page.keys.map(k => k.name));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && keys.length < 2000);

  const orders = (await Promise.all(keys.map(k => env.SELLTHAI_KV.get(k, 'json')))).filter(Boolean);
  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ orders });
}
