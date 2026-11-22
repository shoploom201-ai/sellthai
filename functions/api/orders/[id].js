import { isAdmin, isConfigured, json, notConfiguredResponse } from '../../_lib/auth.js';
import { isValidOrderId, orderKey, text } from '../../_lib/orders.js';

// 단계별로 가능한 상태 변경
//  입금대기 → 입금확인 → (송장 입력) 배송중 → 배송완료,  입금대기/입금확인 → 주문취소
const ACTIONS = {
  confirm: { from: ['pending'], to: 'paid' },
  ship: { from: ['paid'], to: 'shipping' },
  deliver: { from: ['shipping'], to: 'delivered' },
  cancel: { from: ['pending', 'paid'], to: 'cancelled' },
  // 실수로 누른 경우 한 단계 되돌리기
  back: { from: ['paid', 'shipping', 'delivered', 'cancelled'] },
  // 배송중일 때 송장 정보만 수정
  tracking: { from: ['shipping'] }
};

// PATCH /api/orders/:id  { action, courier?, trackingNumber? } (관리자 전용)
export async function onRequestPatch({ request, env, params }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  const id = String(params.id || '');
  if (!isValidOrderId(id)) return json({ error: '주문을 찾을 수 없습니다.' }, 404);

  const order = await env.SELLTHAI_KV.get(orderKey(id), 'json');
  if (!order) return json({ error: '주문을 찾을 수 없습니다.' }, 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const action = ACTIONS[body.action];
  if (!action) return json({ error: '알 수 없는 요청입니다.' }, 400);
  if (!action.from.includes(order.status)) {
    return json({ error: '현재 주문 상태에서는 할 수 없는 작업입니다. 새로고침 후 다시 시도해 주세요.' }, 409);
  }

  const now = new Date().toISOString();

  if (body.action === 'ship' || body.action === 'tracking') {
    const courier = text(body.courier, 30);
    const trackingNumber = text(body.trackingNumber, 40).replace(/\s/g, '');
    if (!courier || !trackingNumber) return json({ error: '택배사와 송장번호를 입력해 주세요.' }, 400);
    order.courier = courier;
    order.trackingNumber = trackingNumber;
  }

  if (body.action === 'back') {
    // 직전 상태로 되돌리기
    const history = order.history || [];
    if (history.length < 2) return json({ error: '되돌릴 단계가 없습니다.' }, 400);
    history.pop();
    order.status = history[history.length - 1].status;
    order.history = history;
  } else if (action.to) {
    order.status = action.to;
    order.history = [...(order.history || []), { status: action.to, at: now }];
  }
  order.updatedAt = now;

  await env.SELLTHAI_KV.put(orderKey(id), JSON.stringify(order), {
    metadata: { status: order.status, createdAt: order.createdAt }
  });
  return json({ ok: true, order });
}
