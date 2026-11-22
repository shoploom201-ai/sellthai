import { checkPassword, createSessionCookie, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';

const MAX_FAILURES = 10;
const LOCK_SECONDS = 15 * 60;

// POST /api/login  { password }
export async function onRequestPost({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const failKey = `login_fail:${ip}`;
  const failures = Number(await env.SELLTHAI_KV.get(failKey)) || 0;

  if (failures >= MAX_FAILURES) {
    return json({ error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  if (!(await checkPassword(env, body.password))) {
    await env.SELLTHAI_KV.put(failKey, String(failures + 1), { expirationTtl: LOCK_SECONDS });
    return json({ error: '비밀번호가 올바르지 않습니다.' }, 401);
  }

  if (failures > 0) await env.SELLTHAI_KV.delete(failKey);

  return json({ ok: true }, 200, { 'Set-Cookie': await createSessionCookie(env) });
}
