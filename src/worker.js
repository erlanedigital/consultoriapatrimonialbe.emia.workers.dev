/**
 * Cloudflare Worker — Consultoria Patrimonial com Erlane Mota
 * Subdomínio Oficial: consultoriapatrimonialbe.emia.workers.dev
 * API REST de Leads (/api/leads), Conexão com App Principal, HSTS e PWA SPA
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key, X-App-Token",
  "Access-Control-Max-Age": "86400"
};

let inMemoryLeads = [];

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

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }

    // =======================================================================
    // API REST /api/leads — CONEXÃO COM APP PRINCIPAL (PUXAR E ENVIAR LEADS)
    // =======================================================================

    // 1. GET /api/leads (PULL: O App Principal consome para puxar os leads)
    if (url.pathname === "/api/leads" && request.method === "GET") {
      const auth = request.headers.get("Authorization") || "";
      const token = request.headers.get("X-Api-Key") || url.searchParams.get("token") || url.searchParams.get("key") || "";
      
      const isAuthorized = token === "erlane2026" || 
                           token === "EMIA-PATRIMONIO-2026" || 
                           auth.includes("erlane2026") || 
                           auth.includes("EMIA-PATRIMONIO-2026");

      if (!isAuthorized) {
        return new Response(JSON.stringify({
          error: "Não autorizado",
          message: "Informe a chave da API no cabeçalho Authorization ou parâmetro ?token=erlane2026",
          status: 401
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        project: "consultoriapatrimonialbe",
        consultora: "Erlane Mota",
        total: inMemoryLeads.length,
        leads: inMemoryLeads,
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }

    // 2. POST /api/leads (PUSH / INGESTÃO: Registra novo lead e despacha para webhook do App)
    if (url.pathname === "/api/leads" && request.method === "POST") {
      try {
        const body = await request.json();
        const lead = {
          id: "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          name: body.name || "Cliente Interessado",
          phone: body.phone || "",
          country: body.country || "Exterior",
          goal: body.goal || "Consórcio com Parcelas Reduzidas",
          credit: body.credit || null,
          months: body.months || null,
          reducedMonthly: body.reducedMonthly || null,
          currency: body.currency || null,
          foreignMonthly: body.foreignMonthly || null,
          source: body.source || "Website Oficial Erlane Mota",
          createdAt: body.createdAt || new Date().toISOString()
        };

        inMemoryLeads.unshift(lead);
        if (inMemoryLeads.length > 500) inMemoryLeads.pop();

        // Se houver Webhook do App configurado, repassa assincronamente
        if (body.webhookUrl && body.webhookUrl.startsWith("http")) {
          ctx.waitUntil(
            fetch(body.webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "ErlaneMota-LeadDispatcher/1.0",
                ...(body.webhookToken ? { "Authorization": "Bearer " + body.webhookToken } : {})
              },
              body: JSON.stringify({
                event: "new_lead_captured",
                source: "consultoriapatrimonialbe.emia.workers.dev",
                data: lead,
                timestamp: new Date().toISOString()
              })
            }).catch(err => console.error("Webhook error:", err))
          );
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Lead registrado com sucesso e pronto para o App Principal!",
          leadId: lead.id
        }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "JSON inválido", details: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }
    }

    // 3. POST /api/webhook/test (Teste de Conexão com o App Principal)
    if (url.pathname === "/api/webhook/test" && request.method === "POST") {
      try {
        const body = await request.json();
        const targetUrl = body.url;
        if (!targetUrl || !targetUrl.startsWith("http")) {
          return new Response(JSON.stringify({ success: false, message: "URL do Webhook inválida." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
          });
        }

        const resp = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ErlaneMota-IntegrationTest/1.0",
            ...(body.token ? { "Authorization": "Bearer " + body.token } : {})
          },
          body: JSON.stringify({
            event: "test_integration",
            source: "consultoriapatrimonialbe.emia.workers.dev",
            testLead: {
              name: "Lead de Teste (Erlane Mota)",
              phone: "+55 (11) 99999-9999",
              country: "Estados Unidos",
              goal: "Teste de Integração com App Principal",
              createdAt: new Date().toISOString()
            }
          })
        });

        return new Response(JSON.stringify({
          success: resp.ok,
          status: resp.status,
          message: resp.ok ? "Conexão com seu App Principal confirmada com sucesso!" : "O app respondeu com status HTTP " + resp.status
        }), {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: e.message,
          message: "Não foi possível conectar ao App. Verifique a URL e se o servidor está acessível."
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }
    }

    // 4. GET /api/health
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        status: "online",
        project: "consultoriapatrimonialbe",
        domain: "consultoriapatrimonialbe.emia.workers.dev",
        consultora: "Erlane Mota",
        api: "/api/leads",
        pwa: "enabled",
        security: "bank-grade",
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
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
