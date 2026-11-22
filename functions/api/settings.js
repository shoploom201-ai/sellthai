import { isAdmin, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';

// 사이트 디자인 설정 (관리자가 '디자인 스타일 변경'에서 바꾼 값 → 모든 방문자에게 적용)
const SETTINGS_KEY = 'site_settings';
const THEMES = ['default', 'mono', 'sage', 'midnight', 'butter'];
const RADII = ['sharp', 'medium', 'soft'];
const GRID_COLS = [2, 3, 4];

function text(value, max) {
  return typeof value === 'string' ? value.replace(/[<>"`]/g, '').trim().slice(0, max) : '';
}

function sanitizeSettings(raw = {}) {
  return {
    theme: THEMES.includes(raw.theme) ? raw.theme : 'default',
    radius: RADII.includes(raw.radius) ? raw.radius : 'medium',
    gridCols: GRID_COLS.includes(Number(raw.gridCols)) ? Number(raw.gridCols) : 4,
    brandName: text(raw.brandName, 40) || 'ATELIER NOOK',
    heroTitle: text(raw.heroTitle, 100)
  };
}

// GET /api/settings → 저장된 디자인 설정 (없으면 null → 사이트 기본값)
export async function onRequestGet({ env }) {
  if (!env.SELLTHAI_KV) return json({ settings: null });
  const settings = await env.SELLTHAI_KV.get(SETTINGS_KEY, 'json');
  return json({ settings: settings || null });
}

// PUT /api/settings { settings } → 저장 (관리자 전용)
export async function onRequestPut({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const settings = sanitizeSettings(body.settings);
  await env.SELLTHAI_KV.put(SETTINGS_KEY, JSON.stringify(settings));
  return json({ ok: true, settings });
}
