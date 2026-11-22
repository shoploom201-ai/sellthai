import { isAdmin, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';

const PRODUCTS_KEY = 'products';
const IMAGE_URL_PREFIX = '/api/images/';
const MAX_PRODUCTS = 300;

const BADGE_COLORS = {
  BEST: 'bg-stone-900 text-white',
  NEW: 'bg-amber-800 text-white',
  SALE: 'bg-red-700 text-white',
  SET: 'bg-stone-800 text-white',
  'GIFT SET': 'bg-stone-700 text-white',
  SUSTAINABLE: 'bg-emerald-800 text-white'
};

const CATEGORY_NAMES = {
  ceramics: '도자기 & 오브제',
  scent: '향 & 캔들',
  lighting: '조명 & 라이팅',
  fabric: '패브릭 & 베딩',
  living: '리빙 & 키친'
};

function text(value, max = 2000) {
  // 사이트가 innerHTML로 그리므로 HTML 특수문자는 저장하지 않음
  return typeof value === 'string' ? value.replace(/[<>"`]/g, '').trim().slice(0, max) : '';
}

function money(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isAllowedImageUrl(url) {
  if (typeof url !== 'string' || url.length > 1000) return false;
  if (/["'<>`\s\\]/.test(url)) return false;
  return /^\/api\/images\/img_\d+_\d+$/.test(url) || /^https:\/\//.test(url);
}

function sanitizeProduct(raw, index) {
  const category = CATEGORY_NAMES[raw.category] ? raw.category : 'living';
  const tag = BADGE_COLORS[raw.tag] ? raw.tag : null;
  const price = money(raw.price);
  const originalPrice = money(raw.originalPrice);
  const rating = Math.min(5, Math.max(0, Number(raw.rating) || 5));

  const options = (Array.isArray(raw.options) ? raw.options : [])
    .map(o => text(o, 100))
    .filter(Boolean)
    .slice(0, 20);

  const images = (Array.isArray(raw.images) ? raw.images : [])
    .filter(isAllowedImageUrl)
    .slice(0, 10);

  return {
    id: Number.isInteger(raw.id) && raw.id > 0 ? raw.id : index + 1,
    name: text(raw.name, 200) || '이름 없는 상품',
    category,
    categoryName: CATEGORY_NAMES[category],
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    tag,
    badgeColor: tag ? BADGE_COLORS[tag] : '',
    rating: Math.round(rating * 10) / 10,
    reviewCount: money(raw.reviewCount),
    images,
    summary: text(raw.summary, 300),
    description: text(raw.description, 5000),
    options: options.length ? options : ['단일상품'],
    dimensions: text(raw.dimensions, 200),
    material: text(raw.material, 200),
    isNew: Boolean(raw.isNew),
    isPopular: Boolean(raw.isPopular)
  };
}

function uploadedImageKeys(products) {
  const keys = new Set();
  for (const p of products || []) {
    for (const url of p.images || []) {
      if (typeof url === 'string' && url.startsWith(IMAGE_URL_PREFIX)) {
        keys.add(url.slice(IMAGE_URL_PREFIX.length));
      }
    }
  }
  return keys;
}

// GET /api/products → 저장된 상품 목록 (없으면 null → 사이트 기본 데이터 사용)
export async function onRequestGet({ env }) {
  if (!env.SELLTHAI_KV) return json({ products: null });
  const products = await env.SELLTHAI_KV.get(PRODUCTS_KEY, 'json');
  return json({ products: Array.isArray(products) ? products : null });
}

// PUT /api/products  { products: [...] } → 전체 목록 저장 (관리자 전용)
export async function onRequestPut({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  if (!Array.isArray(body.products) || body.products.length > MAX_PRODUCTS) {
    return json({ error: '상품 목록 형식이 올바르지 않습니다.' }, 400);
  }

  const products = body.products.map(sanitizeProduct);

  // id 중복 방지
  const seen = new Set();
  let nextId = Math.max(0, ...products.map(p => p.id)) + 1;
  for (const p of products) {
    if (seen.has(p.id)) p.id = nextId++;
    seen.add(p.id);
  }

  const previous = await env.SELLTHAI_KV.get(PRODUCTS_KEY, 'json');
  await env.SELLTHAI_KV.put(PRODUCTS_KEY, JSON.stringify(products));

  // 더 이상 쓰지 않는 업로드 사진 정리
  const stillUsed = uploadedImageKeys(products);
  const removed = [...uploadedImageKeys(previous)].filter(key => !stillUsed.has(key));
  await Promise.all(removed.map(key => env.SELLTHAI_KV.delete(key)));

  return json({ ok: true, products });
}
