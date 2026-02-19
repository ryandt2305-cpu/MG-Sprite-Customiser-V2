/**
 * Cloudflare Worker — CORS proxy for MG Sprite Customiser
 *
 * Deploy this for free at https://workers.cloudflare.com (no credit card needed):
 *   1. Sign in / create a free Cloudflare account
 *   2. Workers & Pages → Create → Create Worker
 *   3. Paste this entire file, click "Save and Deploy"
 *   4. Note your worker URL: https://<name>.<account>.workers.dev
 *   5. In your GitHub repo → Settings → Variables → Actions,
 *      add variable:  VITE_CORS_PROXY = https://<name>.<account>.workers.dev/?url=
 *   6. Re-run the GitHub Actions deploy workflow
 *
 * The free tier handles 100,000 requests/day — more than enough for a community tool.
 * Responses are cached at Cloudflare's edge for 1 hour, so repeat visitors are fast and free.
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return new Response('Missing ?url= query parameter', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    // Only proxy known game asset domains
    const allowed = ['mg-api.ariedam.fr', 'magicgarden.gg'];
    if (!allowed.includes(targetUrl.hostname)) {
      return new Response('Forbidden domain', { status: 403 });
    }

    const upstream = await fetch(targetUrl.href, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Cache at the Cloudflare edge for 1 hour
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
