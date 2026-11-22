import { isAdmin, isConfigured, json } from '../_lib/auth.js';

// GET /api/me  → 현재 로그인 상태
export async function onRequestGet({ request, env }) {
  return json({
    configured: isConfigured(env),
    loggedIn: isConfigured(env) && (await isAdmin(request, env))
  });
}
