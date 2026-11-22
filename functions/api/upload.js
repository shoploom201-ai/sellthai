import { isAdmin, isConfigured, json, notConfiguredResponse } from '../_lib/auth.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB (브라우저에서 미리 줄여서 보냄)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST /api/upload  (multipart: file) → { url } (관리자 전용)
export async function onRequestPost({ request, env }) {
  if (!isConfigured(env)) return notConfiguredResponse();
  if (!(await isAdmin(request, env))) return json({ error: '로그인이 필요합니다.' }, 401);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: '사진 파일이 없습니다.' }, 400);
  if (!ALLOWED_TYPES.includes(file.type)) return json({ error: 'JPG, PNG, WEBP, GIF 사진만 올릴 수 있습니다.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: '사진 용량이 너무 큽니다. (최대 5MB)' }, 400);

  const random = crypto.getRandomValues(new Uint32Array(2)).join('');
  const key = `img_${Date.now()}_${random}`;

  await env.SELLTHAI_KV.put(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type }
  });

  return json({ ok: true, url: `/api/images/${key}` });
}
