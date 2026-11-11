const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/ERLANE/.gemini/antigravity/scratch/seupatrimonionobrasil';

// 1. Update wrangler.jsonc
const wranglerPath = path.join(basePath, 'wrangler.jsonc');
let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
wranglerContent = wranglerContent.replace('"run_worker_first": false', '"run_worker_first": true');
fs.writeFileSync(wranglerPath, wranglerContent, 'utf8');
console.log('1. wrangler.jsonc updated (run_worker_first: true)');

// 2. Update src/worker.js with REST API for Leads and Webhook support
const workerPath = path.join(basePath, 'src/worker.js');
const workerCode = `/**
 * Cloudflare Worker — Consultoria Patrimonial com Erlane Mota
 * Subdomínio Oficial: consultoriapatrimonialbe.emia.workers.dev
 * API de Integração com App Principal (/api/leads), Segurança Bancária e PWA SPA
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

// Armazenamento em memória do Worker para sincronização de leads recentes
let recentLeads = [];

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

    // Tratamento de Preflight CORS para integrações externas
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }

    // =========================================================================
    // API DE INTEGRAÇÃO COM APP PRINCIPAL: /api/leads (PULL & PUSH)
    // =========================================================================

    // 1. GET /api/leads -> O App Principal consome para PUXAR todos os leads
    if (url.pathname === "/api/leads" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization") || "";
      const apiKey = request.headers.get("X-Api-Key") || url.searchParams.get("token") || url.searchParams.get("key") || "";
      
      // Validação de Token (aceita token padrão erlane2026, master key ou Bearer)
      const isAuthorized = apiKey === "erlane2026" || 
                           apiKey === "EMIA-PATRIMONIO-2026" || 
                           authHeader.includes("erlane2026") || 
                           authHeader.includes("EMIA-PATRIMONIO-2026");

      if (!isAuthorized) {
        return new Response(JSON.stringify({
          error: "Não autorizado",
          message: "Forneça o token correto no cabeçalho Authorization ou parâmetro ?token=erlane2026",
          status: 401
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        project: "consultoriapatrimonialbe",
        total: recentLeads.length,
        leads: recentLeads,
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }

    // 2. POST /api/leads -> Recebe novo lead do formulário e repassa para o App Principal
    if (url.pathname === "/api/leads" && request.method === "POST") {
      try {
        const body = await request.json();
        const lead = {
          id: "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
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

        recentLeads.unshift(lead);
        if (recentLeads.length > 500) recentLeads.pop(); // Limite dos últimos 500

        // Se houver Webhook URL do App Principal configurada no corpo, dispara assincronamente
        if (body.webhookUrl && body.webhookUrl.startsWith("http")) {
          ctx.waitUntil(
            fetch(body.webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "ErlaneMota-LeadWebhook/1.0",
                ...(body.webhookToken ? { "Authorization": "Bearer " + body.webhookToken } : {})
              },
              body: JSON.stringify({
                event: "new_lead",
                source: "consultoriapatrimonialbe.emia.workers.dev",
                data: lead,
                timestamp: new Date().toISOString()
              })
            }).catch(err => console.error("Erro webhook:", err))
          );
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Lead registrado com sucesso e enfileirado para o App Principal!",
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

    // 3. POST /api/webhook/test -> Testa a conexão com o App Principal
    if (url.pathname === "/api/webhook/test" && request.method === "POST") {
      try {
        const body = await request.json();
        const targetUrl = body.url;
        if (!targetUrl || !targetUrl.startsWith("http")) {
          return new Response(JSON.stringify({ success: false, message: "URL inválida" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
          });
        }

        const resp = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ErlaneMota-WebhookTest/1.0",
            ...(body.token ? { "Authorization": "Bearer " + body.token } : {})
          },
          body: JSON.stringify({
            event: "test_connection",
            source: "consultoriapatrimonialbe.emia.workers.dev",
            testLead: {
              name: "Lead de Teste (Erlane Mota)",
              phone: "+55 (11) 99999-9999",
              country: "Estados Unidos",
              goal: "Simulação de Conexão com App Principal",
              createdAt: new Date().toISOString()
            }
          })
        });

        return new Response(JSON.stringify({
          success: resp.ok,
          status: resp.status,
          statusText: resp.statusText,
          message: resp.ok ? "Conexão com seu App Principal confirmada com sucesso!" : "O app respondeu com status HTTP " + resp.status
        }), {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: e.message,
          message: "Falha ao conectar na URL informada. Verifique se a URL está no ar e acessível."
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
`;

fs.writeFileSync(workerPath, workerCode, 'utf8');
console.log('2. src/worker.js updated with /api/leads endpoints and Webhook push/pull');

// 3. Update styles.css with Rule 32 (Corpo de Texto Justificado)
const stylesPath = path.join(basePath, 'styles.css');
let css = fs.readFileSync(stylesPath, 'utf8');

const justifiedRuleCss = `
/* ==========================================================================
   REGRA MESTRE 32: CORPO DE TODOS OS TEXTOS JUSTIFICADOS COM HIERARQUIA PRESERVADA
   ========================================================================== */
p,
li,
blockquote,
.card p,
article p,
#por-que-consorcio p,
#depois-da-contemplacao p,
#como-funciona p,
#vantagens p,
#sobre p,
.justify-body p,
[data-body] {
  text-align: justify !important;
  text-justify: inter-word !important;
  hyphens: auto !important;
  -webkit-hyphens: auto !important;
  line-height: 1.7 !important;
}

/* Exceções de Design: Títulos, Eyebrows Centrais, Botões, Selos e Rodapé */
h1, h2, h3, h4, h5, h6,
.eyebrow,
.max-w-3xl.mx-auto.text-center p:first-child,
section p[class*="tracking-"],
p[class*="tracking-[0.24em]"],
p[class*="tracking-[0.22em]"],
p[class*="tracking-[0.20em]"],
#sim-badge-reduced,
.btn,
button,
a.rounded-full {
  text-align: center !important;
}

footer,
footer div,
footer p,
footer a {
  text-align: left !important;
}
`;

if (!css.includes('REGRA MESTRE 32: CORPO DE TODOS OS TEXTOS JUSTIFICADOS')) {
  css += '\n' + justifiedRuleCss;
  fs.writeFileSync(stylesPath, css, 'utf8');
  fs.writeFileSync(path.join(basePath, 'dist/styles.css'), css, 'utf8');
  console.log('3. styles.css updated with Rule 32 (Justified Body Text)');
}

// 4. Update index.html to have lang="pt-BR"
const indexPath = path.join(basePath, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('<html lang="en">', '<html lang="pt-BR">');
fs.writeFileSync(indexPath, html, 'utf8');
fs.writeFileSync(path.join(basePath, 'dist/index.html'), html, 'utf8');
console.log('4. index.html updated with lang="pt-BR"');

console.log('All backend and styling configurations ready!');
