// GET /api/images/:key → 업로드된 사진 제공
export async function onRequestGet({ params, env }) {
  const key = String(params.key || '');
  if (!/^img_\d+_\d+$/.test(key) || !env.SELLTHAI_KV) {
    return new Response('Not found', { status: 404 });
  }

  const { value, metadata } = await env.SELLTHAI_KV.getWithMetadata(key, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });

  return new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.contentType) || 'image/jpeg',
      // 사진 키는 업로드마다 새로 만들어지므로 오래 캐시해도 안전
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
