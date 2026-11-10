/**
 * Cloudflare Worker — Consultoria Patrimonial com Erlane Mota
 * Subdomínio Oficial: consultoriapatrimonialbe.emia.workers.dev
 * Segurança Bancária HSTS, CSP, Anti-XSS, LGPD e Static Assets PWA (dist/)
 */

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-XSS-Protection": "1; mode=block",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https:;"
};

function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Endpoint de Verificação de Saúde / Status
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        status: "online",
        project: "consultoriapatrimonialbe",
        domain: "consultoriapatrimonialbe.emia.workers.dev",
        consultora: "Erlane Mota",
        pwa: "enabled",
        security: "bank-grade",
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS }
      });
    }

    // Servir assets estáticos compilados em dist/ (PWA SPA)
    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        return addSecurityHeaders(assetResponse);
      } catch (e) {
        return new Response("Asset not found", { status: 404, headers: SECURITY_HEADERS });
      }
    }

    return new Response("Consultoria Patrimonial — Worker Ativo", {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS }
    });
  }
};
