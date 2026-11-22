import { clearSessionCookie, json } from '../_lib/auth.js';

// POST /api/logout
export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
