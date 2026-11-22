import { isAdmin, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';
import { PAYMENT_KEY, getPaymentSettings, text } from '../_lib/orders.js';

// GET /api/payment-settings → 무통장 입금 계좌 정보 (주문 화면 표시용, 누구나)
export async function onRequestGet({ env }) {
  return json({ bank: await getPaymentSettings(env) });
}

// PUT /api/payment-settings { bankName, accountNumber, accountHolder, depositDays } (관리자 전용)
export async function onRequestPut({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const days = Math.floor(Number(body.depositDays));
  const bank = {
    bankName: text(body.bankName, 30),
    accountNumber: text(body.accountNumber, 40).replace(/[^\d-]/g, ''),
    accountHolder: text(body.accountHolder, 30),
    depositDays: days >= 1 && days <= 14 ? days : 3
  };
  if (!bank.bankName || !bank.accountNumber || !bank.accountHolder) {
    return json({ error: '은행명, 계좌번호, 예금주를 모두 입력해 주세요.' }, 400);
  }

  await env.SELLTHAI_KV.put(PAYMENT_KEY, JSON.stringify(bank));
  return json({ ok: true, bank });
}
