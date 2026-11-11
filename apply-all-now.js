const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/ERLANE/.gemini/antigravity/scratch/seupatrimonionobrasil';

// =========================================================================
// 1. UPDATE WRANGLER.JSONC
// =========================================================================
const wranglerPath = path.join(basePath, 'wrangler.jsonc');
let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
wranglerContent = wranglerContent.replace('"run_worker_first": false', '"run_worker_first": true');
fs.writeFileSync(wranglerPath, wranglerContent, 'utf8');
console.log('1. wrangler.jsonc -> run_worker_first: true');

// =========================================================================
// 2. UPDATE SRC/WORKER.JS WITH API ENDPOINTS FOR MAIN APP (PULL & PUSH)
// =========================================================================
const workerPath = path.join(basePath, 'src/worker.js');
const workerCode = `/**
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
`;

fs.writeFileSync(workerPath, workerCode, 'utf8');
console.log('2. src/worker.js updated');

// =========================================================================
// 3. UPDATE INDEX.HTML (GOLDEN EM MONOGRAM IN FOOTER + LANG PT-BR)
// =========================================================================
const indexPath = path.join(basePath, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// A. lang="pt-BR"
html = html.replace('<html lang="en">', '<html lang="pt-BR">');

// B. Golden EM in footer
const targetFooterP = 'i("p",{className:"font-serif text-2xl text-left",style:{textAlign:"left"},children:"ERLANE MOTA"})';
const goldenEmFooter = 'i("span",{className:"block font-serif text-3xl font-bold text-[#C9A86A] mb-2 leading-none text-left",style:{color:"#C9A86A",fontFamily:"Fraunces, Georgia, serif",textAlign:"left",display:"block"},children:"EM"}),' + targetFooterP;

if (html.includes(targetFooterP) && !html.includes('text-[#C9A86A] mb-2 leading-none text-left",style:{color:"#C9A86A",fontFamily:"Fraunces, Georgia, serif",textAlign:"left",display:"block"},children:"EM"')) {
  html = html.replace(targetFooterP, goldenEmFooter);
  console.log('3. Golden EM added in footer above ERLANE MOTA');
}

fs.writeFileSync(indexPath, html, 'utf8');
fs.writeFileSync(path.join(basePath, 'dist/index.html'), html, 'utf8');

// =========================================================================
// 4. UPDATE STYLES.CSS (ICON-TITLE SPACING + RULE 32 JUSTIFIED TEXT)
// =========================================================================
const stylesPath = path.join(basePath, 'styles.css');
let css = fs.readFileSync(stylesPath, 'utf8');

const additionalStyles = `
/* ==========================================================================
   ESPAÇAMENTO ENTRE SÍMBOLO E FRASE (CARDS DE CONSÓRCIO)
   ========================================================================== */
#por-que-consorcio .rounded-\\[24px\\] > div:first-child {
  margin-bottom: 1.75rem !important;
}

#por-que-consorcio .rounded-\\[24px\\] h3 {
  margin-top: 1.25rem !important;
  margin-bottom: 0.875rem !important;
}

/* ==========================================================================
   REGRA MESTRE 32: CORPO DE TODOS OS TEXTOS JUSTIFICADOS (PADRÃO OURO)
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
footer a,
footer span {
  text-align: left !important;
}
`;

if (!css.includes('ESPAÇAMENTO ENTRE SÍMBOLO E FRASE')) {
  css += '\n' + additionalStyles;
} else {
  // Replace old collapsed margin-top
  css = css.replace(
    '#por-que-consorcio .rounded-\\[24px\\] h3 {\n  margin-top: 0.25rem !important;\n  margin-bottom: 0.875rem !important;\n}',
    '#por-que-consorcio .rounded-\\[24px\\] > div:first-child {\n  margin-bottom: 1.75rem !important;\n}\n\n#por-que-consorcio .rounded-\\[24px\\] h3 {\n  margin-top: 1.25rem !important;\n  margin-bottom: 0.875rem !important;\n}'
  );
}

fs.writeFileSync(stylesPath, css, 'utf8');
fs.writeFileSync(path.join(basePath, 'dist/styles.css'), css, 'utf8');
console.log('4. styles.css updated with icon-title spacing and Rule 32');

// =========================================================================
// 5. UPDATE APP-FEATURES.JS WITH AUTO-DISPATCH & INTEGRATION TAB IN ADMIN
// =========================================================================
const appJsPath = path.join(basePath, 'app-features.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Auto dispatch to /api/leads on submit
if (!appJs.includes('fetch(\'/api/leads\'')) {
  const submitTarget = "localStorage.setItem('erlane_leads', JSON.stringify(leads));";
  const submitWithDispatch = `localStorage.setItem('erlane_leads', JSON.stringify(leads));
      try {
        var webhookUrl = localStorage.getItem('erlane_app_webhook_url') || '';
        var webhookToken = localStorage.getItem('erlane_app_webhook_token') || '';
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput ? nameInput.value : 'Cliente Interessado',
            phone: phoneInput ? phoneInput.value : '',
            country: countrySelect ? countrySelect.value : 'Exterior',
            goal: 'Consórcio com Parcelas Reduzidas',
            webhookUrl: webhookUrl,
            webhookToken: webhookToken,
            createdAt: new Date().toISOString()
          })
        }).catch(function(err){ console.log('Sync lead:', err); });
      } catch(e) {}`;
  appJs = appJs.replace(submitTarget, submitWithDispatch);
  console.log('5A. Auto-dispatch to /api/leads injected into form submit');
}

// Add integration functions and UI helpers to window
const integrationHelpers = `
  // =========================================================================
  // INTEGRAÇÃO COM APP PRINCIPAL (PUXAR LEADS & WEBHOOK)
  // =========================================================================
  window.testAppWebhook = function() {
    var url = (document.getElementById('app-webhook-url') || {}).value || '';
    var token = (document.getElementById('app-webhook-token') || {}).value || '';
    if (!url || !url.startsWith('http')) {
      window.showToast('Informe uma URL de Webhook válida (começando com https://).', 'error');
      return;
    }
    localStorage.setItem('erlane_app_webhook_url', url);
    localStorage.setItem('erlane_app_webhook_token', token);
    window.showToast('Enviando lead de teste para seu App...', 'info');

    fetch('/api/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, token: token })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.success) {
        window.showToast('✅ Conexão bem-sucedida! Seu App respondeu perfeitamente.', 'success');
      } else {
        window.showToast('⚠️ App respondeu: ' + (data.message || data.error), 'error');
      }
    })
    .catch(function(err){
      window.showToast('Erro ao testar conexão: ' + err.message, 'error');
    });
  };

  window.saveAppWebhookConfig = function() {
    var url = (document.getElementById('app-webhook-url') || {}).value || '';
    var token = (document.getElementById('app-webhook-token') || {}).value || '';
    localStorage.setItem('erlane_app_webhook_url', url);
    localStorage.setItem('erlane_app_webhook_token', token);
    window.showToast('Configurações de integração salvas com sucesso!', 'success');
  };

  window.exportLeadsJSON = function() {
    var leads = localStorage.getItem('erlane_leads') || '[]';
    var blob = new Blob([leads], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'leads-erlane-mota-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    window.showToast('Arquivo JSON baixado com sucesso!', 'success');
  };

  window.exportLeadsCSV = function() {
    var leads = JSON.parse(localStorage.getItem('erlane_leads') || '[]');
    if (!leads.length) {
      window.showToast('Nenhum lead para exportar.', 'error');
      return;
    }
    var csv = 'Nome,Telefone,País,Objetivo,Data\\n';
    leads.forEach(function(l) {
      csv += '"' + (l.name||'').replace(/"/g, '""') + '","' + 
             (l.phone||'').replace(/"/g, '""') + '","' + 
             (l.country||'').replace(/"/g, '""') + '","' + 
             (l.goal||'').replace(/"/g, '""') + '","' + 
             (l.date||'') + '"\\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'leads-erlane-mota-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    window.showToast('Arquivo CSV/Excel baixado com sucesso!', 'success');
  };

  window.copyApiPullUrl = function() {
    var url = window.location.origin + '/api/leads?token=erlane2026';
    navigator.clipboard.writeText(url).then(function() {
      window.showToast('URL da API copiada! Cole no seu App para puxar os leads.', 'success');
    }).catch(function(){
      window.showToast('URL: ' + url, 'info');
    });
  };
`;

if (!appJs.includes('window.testAppWebhook = function()')) {
  appJs += '\n' + integrationHelpers;
  console.log('5B. Integration helper functions added to app-features.js');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
fs.writeFileSync(path.join(basePath, 'dist/app-features.js'), appJs, 'utf8');

console.log('All updates compiled and synced to dist!');
