// 관리자 인증 공용 모듈 (Cloudflare Pages Functions)
// 필요한 환경 설정:
//   ADMIN_PASSWORD  : 관리자 로그인 비밀번호 (Secret)
//   SESSION_SECRET  : (선택) 세션 서명 키. 없으면 ADMIN_PASSWORD를 사용
//   SELLTHAI_KV     : KV 네임스페이스 바인딩

const COOKIE_NAME = 'sellthai_admin';
const SESSION_MAX_AGE = 60 * 60 * 12; // 12시간
const encoder = new TextEncoder();

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

async function sha256(text) {
  return toBase64Url(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sessionSecret(env) {
  return env.SESSION_SECRET || env.ADMIN_PASSWORD || '';
}

export function isConfigured(env) {
  return Boolean(env.ADMIN_PASSWORD && env.SELLTHAI_KV);
}

export async function checkPassword(env, password) {
  if (!env.ADMIN_PASSWORD || typeof password !== 'string') return false;
  return safeEqual(await sha256(password), await sha256(env.ADMIN_PASSWORD));
}

export async function createSessionCookie(env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const signature = await hmac(sessionSecret(env), String(expires));
  return `${COOKIE_NAME}=${expires}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdmin(request, env) {
  const secret = sessionSecret(env);
  if (!secret) return false;

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expires, signature] = match[1].split('.');
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now() / 1000) return false;

  return safeEqual(signature, await hmac(secret, expires));
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

export function notConfiguredResponse() {
  return json(
    { error: '서버 설정이 아직 완료되지 않았습니다. Cloudflare에서 ADMIN_PASSWORD와 SELLTHAI_KV를 설정해 주세요.' },
    503
  );
}
