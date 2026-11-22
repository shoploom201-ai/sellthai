import { isAdmin, isConfigured, json } from '../_lib/auth.js';

// GET /api/me  → 현재 로그인 상태
export async function onRequestGet({ request, env }) {
  return json({
    configured: isConfigured(env),
    // 설정 점검용 (값은 노출하지 않고 존재 여부만)
    hasKV: Boolean(env.SELLTHAI_KV),
    hasPassword: Boolean(env.ADMIN_PASSWORD),
    loggedIn: isConfigured(env) && (await isAdmin(request, env))
  });
}
