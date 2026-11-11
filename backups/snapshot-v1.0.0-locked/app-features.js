/**
 * APP-FEATURES.JS
 * Simulador de Parcelas Reduzidas, Painel Admin Blindado,
 * Header Harmônico & Gestão de Leads com Mensagem Padrão.
 */

(function() {
  'use strict';
  // Sanitização Universal Anti-XSS e Anti-Injeção
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sanitizeUrl(url) {
    if (!url) return '#';
    var clean = String(url).trim();
    if (clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('tel:') || clean.startsWith('mailto:') || clean.startsWith('#') || clean.startsWith('/')) {
      return clean;
    }
    return '#';
  }
  

  // ==========================================================================
  // 1. DADOS DE MOEDAS E COTAÇÕES CONSERVADORAS
  // ==========================================================================
  var CURRENCIES = {
    EUR: { name: 'Euro', symbol: '\u20AC', flag: '\uD83C\uDDEA\uD83C\uDDFA', rate: 5.85 },
    USD: { name: 'D\u00F3lar Americano', symbol: '$', flag: '\uD83C\uDDFA\uD83C\uDDF8', rate: 5.60 },
    GBP: { name: 'Libra Esterlina', symbol: '\u00A3', flag: '\uD83C\uDDEC\uD83C\uDDE7', rate: 7.05 },
    CHF: { name: 'Franco Su\u00ED\u00E7o', symbol: 'CHF', flag: '\uD83C\uDDE8\uD83C\uDDED', rate: 6.30 },
    JPY: { name: 'Iene Japon\u00EAs', symbol: '\u00A5', flag: '\uD83C\uDDEF\uD83C\uDDF5', rate: 0.037 },
    AUD: { name: 'D\u00F3lar Australiano', symbol: 'A$', flag: '\uD83C\uDDE6\uD83C\uDDFA', rate: 3.70 },
    CAD: { name: 'D\u00F3lar Canadense', symbol: 'C$', flag: '\uD83C\uDDE8\uD83C\uDDE6', rate: 4.10 }
  };

  var state = {
    credit: 100000,
    months: 220,
    currency: 'EUR'
  };

  function calculateForeign(valBrl, currCode) {
    var c = CURRENCIES[currCode] || CURRENCIES.EUR;
    if (!c || !c.rate) return 0;
    return valBrl / c.rate;
  }

  function calculate(credit, months) {
    // 24% de taxa total sobre o crédito dividido pelos meses
    var adminFeeMonthly = (credit * 0.24) / months;
    // Metade da carta dividida pelos meses
    var amortReduced = (credit * 0.50) / months;
    // Parcela reduzida total (válida até a contemplação)
    var reducedTotal = amortReduced + adminFeeMonthly;
    // Parcela integral (após contemplação)
    var integralTotal = (credit / months) + adminFeeMonthly;

    return {
      adminFeeMonthly: adminFeeMonthly,
      amortReduced: amortReduced,
      reducedTotal: reducedTotal,
      integralTotal: integralTotal
    };
  }

  // ==========================================================================
  // 2. MONTAGEM DO SIMULADOR NA PÁGINA
  // ==========================================================================
  
  // Garantir posicionamento imediato e permanente ACIMA DO RODAPÉ (FOOTER)
  function ensureSimulatorAboveFooter() {
    var footer = document.querySelector('footer');
    var sim = document.getElementById('simulador');
    if (!footer || !footer.parentNode) return;

    if (!sim) {
      injectSimulator();
      sim = document.getElementById('simulador');
    }

    if (sim && footer && sim.nextElementSibling !== footer) {
      footer.parentNode.insertBefore(sim, footer);
    }
  }

  function injectSimulator() {
    if (document.getElementById('simulador')) return;

    var section = document.createElement('section');
    section.id = 'simulador';
    section.style.cssText = 'background: #FAF6EF; padding: 60px 0; border-top: 1px solid rgba(201,168,106,0.35); border-bottom: 1px solid rgba(201,168,106,0.35); position: relative; font-family: "Manrope", "Plus Jakarta Sans", system-ui, sans-serif; width: 100%; max-width: 100vw; overflow-x: hidden; box-sizing: border-box;';
    
    section.innerHTML = [
      '<div class="sim-container">',
      '  <div style="text-align: center; max-width: 800px; margin: 0 auto 32px auto; padding: 0 10px;">',
      '    <span style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 999px; background: #5A1220; color: #F3E7C4; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; border: 1px solid #C9A86A; box-shadow: 0 4px 14px rgba(90,18,32,0.15);">',
      '      <span>📊</span> SIMULADOR DE PARCELAS REDUZIDAS',
      '    </span>',
      '    <h2 style="font-family: Fraunces, Georgia, serif; font-size: clamp(24px, 4vw, 40px); font-weight: 600; color: #5A1220; margin: 16px 0 10px 0; line-height: 1.25;">',
      '      Simule sua carta de crédito e veja o valor na sua moeda\n    </h2>\n    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 999px; background: rgba(90, 18, 32, 0.08); color: #5A1220; font-size: 11px; font-weight: 700; border: 1px solid rgba(201,168,106,0.4); margin-top: 4px;">ℹ️ Valores estimados e aproximados conforme taxa de câmbio comercial e tabela vigente</div>',
      '    </h2>',
      '  </div>',
      '  <div class="sim-card">',
      '    <div class="sim-grid-layout">',
      '      <div style="display: flex; flex-direction: column; gap: 22px; justify-content: center; width: 100%; box-sizing: border-box;">',
      '        <div>',
      '          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 4px;">',
      '            <label style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #5A1220;">1. Valor da Carta de Crédito:</label>',
      '            <span id="sim-credit-text" style="font-family: Fraunces, Georgia, serif; font-size: 21px; font-weight: 700; color: #5A1220;">R$ 100.000</span>',
      '          </div>',
      '          <div class="sim-credit-btns-row">',
      '            <button type="button" onclick="window.setSimCredit(100000)" class="sim-c-btn active" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid #5A1220; background: #5A1220; color: #F3E7C4; cursor: pointer; transition: all 0.2s; width: 100%;">100 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(150000)" class="sim-c-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">150 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(200000)" class="sim-c-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">200 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(300000)" class="sim-c-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">300 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(500000)" class="sim-c-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">500 mil</button>',
      '          </div>',
      '          <input type="range" id="sim-range-credit" min="80000" max="1000000" step="10000" value="100000" oninput="window.setSimCreditFromSlider(this.value)" style="width: 100%; accent-color: #C9A86A; cursor: pointer; height: 6px;">',
      '          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #8A6E3E; margin-top: 4px; font-weight: 600;">',
      '            <span>R$ 80 mil</span>',
      '            <span>R$ 500 mil</span>',
      '            <span>R$ 1 Milhão</span>',
      '          </div>',
      '        </div>',
      '        <div>',
      '          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 4px;">',
      '            <label style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #5A1220;">2. Prazo do Consórcio (até 220 meses):</label>',
      '            <span id="sim-months-text" style="font-size: 15px; font-weight: 800; color: #5A1220;">220 meses</span>',
      '          </div>',
      '          <div class="sim-months-btns-row">',
      '            <button type="button" onclick="window.setSimMonths(150)" class="sim-m-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">150 m</button>',
      '            <button type="button" onclick="window.setSimMonths(180)" class="sim-m-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">180 m</button>',
      '            <button type="button" onclick="window.setSimMonths(200)" class="sim-m-btn" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid rgba(201,168,106,0.4); background: #FAF6EF; color: #5A1220; cursor: pointer; transition: all 0.2s; width: 100%;">200 m</button>',
      '            <button type="button" onclick="window.setSimMonths(220)" class="sim-m-btn active" style="padding: 10px 4px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid #5A1220; background: #5A1220; color: #F3E7C4; cursor: pointer; transition: all 0.2s; width: 100%;">220 meses</button>',
      '          </div>',
      '        </div>',
      '        <div>',
      '          <label style="display: block; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #5A1220; margin-bottom: 8px;">3. Sua moeda de ganho no exterior:</label>',
      '          <select id="sim-currency-sel" onchange="window.setSimCurrency(this.value)" style="width: 100%; background: #FAF6EF; border: 1.5px solid #C9A86A; border-radius: 12px; padding: 12px 14px; font-size: 14px; font-weight: 700; color: #5A1220; outline: none; box-sizing: border-box; cursor: pointer;">',
      '            <option value="EUR">🇪🇺 Euro (EUR €)</option>',
      '            <option value="USD">🇺🇸 Dólar Americano (USD $)</option>',
      '            <option value="GBP">🇬🇧 Libra Esterlina (GBP £)</option>',
      '            <option value="CHF">🇨🇭 Franco Suíço (CHF)</option>',
      '            <option value="JPY">🇯🇵 Iene Japonês (JPY ¥)</option>',
      '            <option value="AUD">🇦🇺 Dólar Australiano (AUD A$)</option>',
      '            <option value="CAD">🇨🇦 Dólar Canadense (CAD C$)</option>',
      '          </select>',
      '        </div>',
      '      </div>',
      '      <div style="background: linear-gradient(145deg, #5A1220 0%, #3D0C16 100%); border-radius: 20px; border: 2px solid #C9A86A; padding: clamp(20px, 3.5vw, 32px); color: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; box-shadow: 0 12px 35px rgba(90,18,32,0.25); box-sizing: border-box; width: 100%;">',
      '        <div>',
      '          <div style="text-align: center; margin-bottom: 14px;"><div id="sim-badge-reduced" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 18px; border-radius: 999px; background: #C9A86A; color: #5A1220; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin: 0 auto;">★ PARCELA REDUZIDA ATÉ A CONTEMPLAÇÃO</div></div>',
      '          <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 4px;">Seu investimento mensal em Reais:</div>',
      '          <div id="sim-reais-val" style="font-family: Fraunces, Georgia, serif; font-size: clamp(26px, 4vw, 38px); font-weight: 700; color: #F3E7C4;">R$ 336,36 <span style="font-size: 14px; font-weight: normal; color: rgba(255,255,255,0.7);">/mês</span></div>',
      '        </div>',
      '        <div style="padding-top: 14px; border-top: 1px solid rgba(201,168,106,0.3);">',
      '          <div id="sim-foreign-title" style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #C9A86A; margin-bottom: 2px;">Equivalente no exterior em Euro:</div>',
      '          <div id="sim-foreign-val" style="font-family: Fraunces, Georgia, serif; font-size: clamp(32px, 6vw, 46px); font-weight: 800; color: #F3E7C4; line-height: 1.1;">€ 57,50 <span style="font-size: 15px; font-weight: normal; color: rgba(255,255,255,0.7);">/mês</span></div>',
      '          <div style="font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 6px; line-height: 1.4;">Um esforço financeiro acessível ganhando em moeda forte, com o poder de alavancagem do consórcio no Brasil.</div>',
      '        </div>',
      '        <div style="background: rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 14px; font-size: 11px; color: rgba(255,255,255,0.75); line-height: 1.4;">* Valores aproximados com base em taxas médias e cotação de referência. Na contemplação, a parcela passa a ser no valor integral.</div>',
      '        <div>',
      '          <button type="button" onclick="window.sendSimToWhatsApp()" style="width: 100%; box-sizing: border-box; padding: 15px 18px; border-radius: 999px; background: #C9A86A; color: #5A1220; font-size: 14px; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">',
      '            <span>Simular Esta Carta no WhatsApp</span>',
      '            <span style="font-size: 18px;">➔</span>',
      '          </button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(201,168,106,0.3); width: 100%; box-sizing: border-box;">',
      '      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #5A1220; margin-bottom: 12px; text-align: center;">🌐 Comparativo do Esforço Mensal Reduzido em Todas as Moedas:</div>',
      '      <div id="sim-multi-currency-grid" class="sim-multicurrency-grid-row"></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    // POSICIONAMENTO OFICIAL: DIRETAMENTE ACIMA DO RODAPÉ (FOOTER)
    var host = document.getElementById('simulador-host');
    if (host && host.parentNode) {
      host.parentNode.insertBefore(section, host);
      host.remove();
    } else {
      var footer = document.querySelector('footer');
      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(section, footer);
      } else {
        document.body.appendChild(section);
      }
    }

    updateSimulatorUI();
  }

  function updateSimulatorUI() {
    var calc = calculate(state.credit, state.months);
    var curr = CURRENCIES[state.currency] || CURRENCIES.EUR;

    // 1. Atualizar texto do crédito
    var cText = document.getElementById('sim-credit-text');
    if (cText) cText.textContent = 'R$ ' + state.credit.toLocaleString('pt-BR');

    // 2. Atualizar texto do prazo
    var mText = document.getElementById('sim-months-text');
    if (mText) mText.textContent = state.months + ' meses';

    // 3. Atualizar valor em Reais (Parcela Reduzida)
    var rVal = document.getElementById('sim-reais-val');
    if (rVal) {
      rVal.innerHTML = 'R$ ' + calc.reducedTotal.toFixed(2).replace('.', ',') + ' <span style="font-size: 14px; font-weight: normal; color: rgba(255,255,255,0.7);">/mês</span>';
    }

    // 4. Atualizar TÍTULO da moeda estrangeira
    var fTitle = document.getElementById('sim-foreign-title');
    if (fTitle) {
      fTitle.textContent = 'Equivalente no exterior em ' + curr.name + ':';
    }

    // 5. Atualizar VALOR da moeda estrangeira (Euro, Dólar, etc.)
    var fVal = calculateForeign(calc.reducedTotal, state.currency);
    var fStr = (state.currency === 'JPY') 
      ? Math.round(fVal).toLocaleString('pt-BR') 
      : fVal.toFixed(2).replace('.', ',');

    var fValEl = document.getElementById('sim-foreign-val');
    if (fValEl) {
      fValEl.innerHTML = curr.symbol + ' ' + fStr + ' <span style="font-size: 16px; font-weight: normal; color: rgba(255,255,255,0.7);">/mês</span>';
    }

    // 6. Atualizar slider e select de moeda
    var range = document.getElementById('sim-range-credit');
    if (range && Number(range.value) !== state.credit) range.value = state.credit;

    var sel = document.getElementById('sim-currency-sel');
    if (sel && sel.value !== state.currency) sel.value = state.currency;

    // 7. Atualizar grade comparativa multimoedas com clique interativo
    var grid = document.getElementById('sim-multi-currency-grid');
    if (grid) {
      grid.innerHTML = Object.keys(CURRENCIES).map(function(k) {
        var c = CURRENCIES[k];
        var v = calculateForeign(calc.reducedTotal, k);
        var s = (k === 'JPY') ? Math.round(v).toLocaleString('pt-BR') : v.toFixed(0);
        var isSel = (k === state.currency);
        return '<div onclick="window.setSimCurrency(\'' + k + '\')" style="cursor: pointer; transition: all 0.2s; background: ' + (isSel ? '#5A1220' : '#FFFFFF') + '; border: 1.5px solid ' + (isSel ? '#C9A86A' : 'rgba(201,168,106,0.35)') + '; border-radius: 14px; padding: 10px 8px; text-align: center; color: ' + (isSel ? '#F3E7C4' : '#5A1220') + '; box-shadow: ' + (isSel ? '0 6px 18px rgba(90,18,32,0.25)' : '0 2px 6px rgba(0,0,0,0.03)') + '; user-select: none;">' +
          '<div style="font-size: 11px; font-weight: 800; text-transform: uppercase;">' + c.flag + ' ' + k + '</div>' +
          '<div style="font-family: Fraunces, Georgia, serif; font-size: 17px; font-weight: 700; margin-top: 4px;">' + c.symbol + ' ' + s + '<span style="font-size: 11px; font-weight: normal; opacity: 0.8;">/mês</span></div>' +
        '</div>';
      }).join('');
    }
  }

  window.setSimCredit = function(val) {
    state.credit = Number(val);
    document.querySelectorAll('.sim-c-btn').forEach(function(b) {
      var isTarget = b.textContent.includes(String(val / 1000));
      b.style.background = isTarget ? '#5A1220' : '#FAF6EF';
      b.style.color = isTarget ? '#F3E7C4' : '#5A1220';
      b.style.borderColor = isTarget ? '#5A1220' : 'rgba(201,168,106,0.4)';
    });
    updateSimulatorUI();
  };

  window.setSimCreditFromSlider = function(val) {
    state.credit = Number(val);
    document.querySelectorAll('.sim-c-btn').forEach(function(b) {
      var isTarget = b.textContent.includes(String(val / 1000));
      b.style.background = isTarget ? '#5A1220' : '#FAF6EF';
      b.style.color = isTarget ? '#F3E7C4' : '#5A1220';
      b.style.borderColor = isTarget ? '#5A1220' : 'rgba(201,168,106,0.4)';
    });
    updateSimulatorUI();
  };

  window.setSimMonths = function(val) {
    state.months = Number(val);
    document.querySelectorAll('.sim-m-btn').forEach(function(b) {
      var isTarget = b.textContent.includes(String(val));
      b.style.background = isTarget ? '#5A1220' : '#FAF6EF';
      b.style.color = isTarget ? '#F3E7C4' : '#5A1220';
      b.style.borderColor = isTarget ? '#5A1220' : 'rgba(201,168,106,0.4)';
    });
    updateSimulatorUI();
  };

  window.setSimCurrency = function(val) {
    if (!CURRENCIES[val]) return;
    state.currency = val;
    var sel = document.getElementById('sim-currency-sel');
    if (sel && sel.value !== val) sel.value = val;
    updateSimulatorUI();
  };

  window.sendSimToWhatsApp = function() {
    var res = calculate(state.credit, state.months);
    var curr = CURRENCIES[state.currency] || CURRENCIES.EUR;
    var fVal = res.reducedTotal / curr.rate;
    var fStr = (state.currency === 'JPY') ? Math.round(fVal).toLocaleString('pt-BR') : fVal.toFixed(2).replace('.', ',');

    var msg = [
      'Olá, Erlane! Fiz uma simulação no site com parcela reduzida:',
      '',
      '• *Carta de Crédito:* R$ ' + state.credit.toLocaleString('pt-BR'),
      '• *Prazo do Plano:* ' + state.months + ' meses',
      '• *Parcela Reduzida (até a contemplação):* R$ ' + res.reducedTotal.toFixed(2).replace('.', ',') + ' / mês',
      '• *Equivalente na minha moeda (' + curr.name + '):* ' + curr.symbol + ' ' + fStr + ' / mês',
      '',
      'Gostaria de tirar dúvidas sobre este grupo e ver como começar!'
    ].join('\n');

    window.open('https://wa.me/5538997373140?text=' + encodeURIComponent(msg), '_blank');
  };

  // ==========================================================================
  // 3. PAINEL ADMIN BLINDADO, LEADS & TEXTO PADRÃO DE CONTATO
  // ==========================================================================
  var ADMIN_PASS_KEY = 'erlane_adm_pwd_hash';
  var ADMIN_SESSION_KEY = 'erlane_adm_active';
  var ATTEMPTS_KEY = 'erlane_adm_err_cnt';
  var LOCKOUT_KEY = 'erlane_adm_lock_ts';
  var DEFAULT_PASS = 'erlane2026';
  var MASTER_KEY = 'EMIA-PATRIMONIO-2026';

  function getStoredPass() {
    return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_PASS;
  }

  function checkLockout() {
    var lock = localStorage.getItem(LOCKOUT_KEY);
    if (lock) {
      var diff = parseInt(lock, 10) - Date.now();
      if (diff > 0) return Math.ceil(diff / 60000);
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.setItem(ATTEMPTS_KEY, '0');
    }
    return 0;
  }

  window.openAdminLogin = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    var lock = checkLockout();
    if (lock > 0) {
      window.showToast('Painel bloqueado por seguran\u00E7a. Aguarde ' + lock + ' minuto(s).', 'error');
      return;
    }
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
      window.openAdminPanel();
      return;
    }
    var m = document.getElementById('modal-admin-login');
    if (m) {
      m.classList.remove('hidden');
      m.style.setProperty('display', 'flex', 'important');
      m.style.setProperty('z-index', '999999', 'important');
      var input = document.getElementById('admin-pass-field');
      if (input) { input.value = ''; setTimeout(function() { input.focus(); }, 100); }
    }
  };

  window.closeAdminLogin = function() {
    var m = document.getElementById('modal-admin-login');
    if (m) {
      m.classList.add('hidden');
      m.style.setProperty('display', 'none', 'important');
    }
  };

  window.handleAdminLogin = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    var lock = checkLockout();
    if (lock > 0) {
      window.showToast('Bloqueado. Aguarde ' + lock + ' minuto(s).', 'error');
      return;
    }
    var input = document.getElementById('admin-pass-field');
    var val = input ? input.value : '';
    if (val === getStoredPass()) {
      localStorage.setItem(ATTEMPTS_KEY, '0');
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      window.closeAdminLogin();
      window.showToast('Acesso concedido com sucesso!', 'success');
      window.openAdminPanel();
    } else {
      var attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPTS_KEY, attempts.toString());
      if (attempts >= 5) {
        localStorage.setItem(LOCKOUT_KEY, (Date.now() + 15 * 60 * 1000).toString());
        window.closeAdminLogin();
        window.showToast('Limite de 5 tentativas excedido. Bloqueado por 15 minutos.', 'error');
      } else {
        window.showToast('Senha incorreta. Restam ' + (5 - attempts) + ' tentativa(s).', 'error');
      }
    }
  };

  window.openAdminPanel = function() {
    var m = document.getElementById('modal-admin-panel');
    if (m) {
      m.classList.remove('hidden');
      m.style.setProperty('display', 'flex', 'important');
      m.style.setProperty('z-index', '999999', 'important');
      window.renderAdminLeads();
      window.switchAdminTab('leads');
    }
  };

  window.closeAdminPanel = function() {
    var m = document.getElementById('modal-admin-panel');
    if (m) {
      m.classList.add('hidden');
      m.style.setProperty('display', 'none', 'important');
    }
  };

  window.logoutAdmin = function() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.closeAdminPanel();
    window.showToast('Sess\u00E3o administrativa encerrada.', 'info');
  };

  window.openRecoveryModal = function() {
    window.closeAdminLogin();
    var m = document.getElementById('modal-admin-recovery');
    if (m) {
      m.classList.remove('hidden');
      m.style.setProperty('display', 'flex', 'important');
    }
  };

  window.closeRecoveryModal = function() {
    var m = document.getElementById('modal-admin-recovery');
    if (m) {
      m.classList.add('hidden');
      m.style.setProperty('display', 'none', 'important');
    }
  };

  window.handleRecoverySubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    var input = document.getElementById('recovery-key-field');
    if (input && input.value.trim() === MASTER_KEY) {
      localStorage.removeItem(ADMIN_PASS_KEY);
      localStorage.setItem(ATTEMPTS_KEY, '0');
      localStorage.removeItem(LOCKOUT_KEY);
      window.closeRecoveryModal();
      window.showToast('Senha redefinida para a padr\u00E3o (erlane2026).', 'success');
      window.openAdminLogin();
    } else {
      window.showToast('Chave Mestra inv\u00E1lida.', 'error');
    }
  };

  window.switchAdminTab = function(tab) {
    var leadsTab = document.getElementById('admin-tab-leads');
    var secTab = document.getElementById('admin-tab-security');
    var leadsBtn = document.getElementById('admin-tab-leads-btn');
    var secBtn = document.getElementById('admin-tab-security-btn');

    if (tab === 'leads') {
      if (leadsTab) leadsTab.style.display = 'block';
      if (secTab) secTab.style.display = 'none';
      if (leadsBtn) { leadsBtn.style.color = '#D4AF37'; leadsBtn.style.borderBottomColor = '#D4AF37'; }
      if (secBtn) { secBtn.style.color = 'rgba(255,255,255,0.6)'; secBtn.style.borderBottomColor = 'transparent'; }
    } else {
      if (leadsTab) leadsTab.style.display = 'none';
      if (secTab) secTab.style.display = 'block';
      if (secBtn) { secBtn.style.color = '#D4AF37'; secBtn.style.borderBottomColor = '#D4AF37'; }
      if (leadsBtn) { leadsBtn.style.color = 'rgba(255,255,255,0.6)'; leadsBtn.style.borderBottomColor = 'transparent'; }
    }
  };

  window.handlePasswordChange = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    var curr = document.getElementById('admin-pwd-curr').value;
    var newP = document.getElementById('admin-pwd-new').value;
    var conf = document.getElementById('admin-pwd-conf').value;

    if (curr !== getStoredPass()) {
      window.showToast('Senha atual incorreta.', 'error');
      return;
    }
    if (!newP || newP.length < 6) {
      window.showToast('A nova senha deve ter no m\u00EDnimo 6 caracteres.', 'error');
      return;
    }
    if (newP !== conf) {
      window.showToast('A confirma\u00E7\u00E3o n\u00E3o coincide.', 'error');
      return;
    }

    localStorage.setItem(ADMIN_PASS_KEY, newP);
    document.getElementById('admin-pwd-curr').value = '';
    document.getElementById('admin-pwd-new').value = '';
    document.getElementById('admin-pwd-conf').value = '';
    window.showToast('Senha alterada com sucesso!', 'success');
  };

  // Funções de Texto Padrão para Entrar em Contato com os Leads
  window.copyGlobalTemplate = function() {
    var text = "Ol\u00E1! Tudo bem? Aqui \u00E9 a Erlane Mota, Consultora Patrimonial. Recebi seu diagn\u00F3stico pelo site. Vi que voc\u00EA mora no exterior e tem interesse em construir patrim\u00F4nio no Brasil com cons\u00F3rcio em parcelas reduzidas. Como est\u00E1 sua disponibilidade de hor\u00E1rio a\u00ED para conversarmos rapidinho por aqui ou por videochamada?";
    navigator.clipboard.writeText(text).then(function() {
      window.showToast('Texto padr\u00E3o copiado para a \u00E1rea de transfer\u00EAncia!', 'success');
    });
  };

  window.copyLeadCustomMessage = function(name, country, goal) {
    var text = "Ol\u00E1, " + name + "! Tudo bem? Aqui \u00E9 a Erlane Mota, Consultora Patrimonial. Recebi seu diagn\u00F3stico pelo site. Vi que voc\u00EA mora em " + country + " e planeja " + goal + " no Brasil com cons\u00F3rcio em parcelas reduzidas. Como est\u00E1 sua disponibilidade de hor\u00E1rio a\u00ED para conversarmos rapidinho por aqui ou por videochamada?";
    navigator.clipboard.writeText(text).then(function() {
      window.showToast('Mensagem personalizada para ' + name + ' copiada!', 'success');
    });
  };

  window.sendWhatsAppToLead = function(phone, name, country, goal) {
    var text = "Ol\u00E1, " + name + "! Tudo bem? Aqui \u00E9 a Erlane Mota, Consultora Patrimonial. Recebi seu diagn\u00F3stico pelo site. Vi que voc\u00EA mora em " + country + " e planeja " + goal + " no Brasil com cons\u00F3rcio em parcelas reduzidas. Como est\u00E1 sua disponibilidade de hor\u00E1rio a\u00ED para conversarmos rapidinho por aqui ou por videochamada?";
    var cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
  };

  window.renderAdminLeads = function() {
    var leads = JSON.parse(localStorage.getItem('erlane_leads') || '[]');
    var counter = document.getElementById('admin-leads-counter');
    if (counter) counter.textContent = leads.length.toString();

    var container = document.getElementById('admin-leads-list-container');
    if (!container) return;

    if (leads.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 32px; color: rgba(255,255,255,0.4); font-size: 13px;">Nenhum lead registrado ainda. Os contatos preenchidos no formul\u00E1rio do site aparecer\u00E3o aqui com o bot\u00E3o de mensagem pronta.</div>';
      return;
    }

    container.innerHTML = leads.map(function(l) {
      return [
        '<div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">',
        '  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">',
        '    <div>',
        '      <div style="font-weight: bold; color: #F3E7C4; font-size: 15px;">' + l.name + ' <span style="font-size: 11px; font-weight: normal; color: rgba(255,255,255,0.6);">(' + l.country + ')</span></div>',
        '      <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 2px;">\uD83D\uDCF1 ' + l.phone + ' &bull; \uD83C\uDFAF ' + l.goal + '</div>',
        '      <div style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 2px;">Registrado em: ' + (l.date || 'Hoje') + '</div>',
        '    </div>',
        '    <div style="display: flex; gap: 8px;">',
        '      <button onclick="window.copyLeadCustomMessage(\'' + l.name.replace(/'/g, "\\'") + '\', \'' + l.country.replace(/'/g, "\\'") + '\', \'' + l.goal.replace(/'/g, "\\'") + '\')" style="padding: 6px 12px; background: rgba(212,175,55,0.2); border: 1px solid #D4AF37; color: #F3E7C4; font-size: 11px; font-weight: bold; border-radius: 8px; cursor: pointer;">\uD83D\uDCCB Copiar Mensagem</button>',
        '      <button onclick="window.sendWhatsAppToLead(\'' + l.phone + '\', \'' + l.name.replace(/'/g, "\\'") + '\', \'' + l.country.replace(/'/g, "\\'") + '\', \'' + l.goal.replace(/'/g, "\\'") + '\')" style="padding: 6px 12px; background: #25D366; border: none; color: white; font-size: 11px; font-weight: bold; border-radius: 8px; cursor: pointer;">\uD83D\uDCF2 Abrir no WhatsApp</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  };

  // Sistema de Toasts
  window.showToast = function(msg, type) {
    var cont = document.getElementById('toast-container');
    if (!cont) return;
    var t = document.createElement('div');
    var bg = (type === 'success') ? '#1D0A10' : ((type === 'error') ? '#7f1d1d' : '#5A1220');
    t.style.cssText = 'background: ' + bg + '; border-left: 4px solid #D4AF37; color: white; padding: 12px 18px; border-radius: 12px; font-size: 13px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); pointer-events: auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 280px;';
    t.innerHTML = '<span>' + msg + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:16px;">&times;</button>';
    cont.appendChild(t);
    setTimeout(function() { t.remove(); }, 4000);
  };

  // Interceptar formulário para registrar leads
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form.closest && form.closest('#diagnostico')) {
      var nameInput = form.querySelector('input[type="text"]');
      var phoneInput = form.querySelector('input[type="tel"]');
      var countrySelect = form.querySelector('select');
      var leads = JSON.parse(localStorage.getItem('erlane_leads') || '[]');
      leads.unshift({
        name: nameInput ? nameInput.value : 'Cliente Interessado',
        phone: phoneInput ? phoneInput.value : '',
        country: countrySelect ? countrySelect.value : 'Exterior',
        goal: 'Cons\u00F3rcio com Parcelas Reduzidas',
        date: new Date().toLocaleString('pt-BR')
      });
      localStorage.setItem('erlane_leads', JSON.stringify(leads));
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
      } catch(e) {}
      if (window.renderAdminLeads) window.renderAdminLeads();
    }
  }, true);

  // Atalho de Teclado Global: Ctrl + Shift + A
  window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.openAdminLogin();
    }
  });

  // Inicialização no DOM
  if (document.readyState === 'loading') {
    
  // Observador para monitorar a montagem do rodapé e garantir posição
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function() {
      ensureSimulatorAboveFooter();
      if (typeof styleFormBoxes === 'function') styleFormBoxes();
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
  
  document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  
  // Injetar sub-barra de navegação horizontal para mobile/tablets
  function injectSubBarNavigation() { /* handled cleanly in header template */ }

  
  // Aplicação de contorno interno e estilo elegante nos boxes de formulário
  function styleFormBoxes() {
    var boxIds = ['receber-nome', 'receber-whatsapp', 'receber-mora', 'receber-objetivo'];
    boxIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.backgroundColor = '#FFFFFF';
        el.style.border = '2px solid #C9A86A';
        el.style.borderRadius = '12px';
        el.style.boxShadow = 'inset 0 2px 5px rgba(90, 18, 32, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
        el.style.padding = '14px 16px';
        el.style.fontSize = '15px';
        el.style.fontWeight = '500';
        el.style.color = '#2A181C';
        el.style.outline = 'none';

        el.onfocus = function() {
          el.style.borderColor = '#5A1220';
          el.style.boxShadow = 'inset 0 2px 5px rgba(90, 18, 32, 0.08), 0 0 0 3.5px rgba(201, 168, 106, 0.35)';
        };
        el.onblur = function() {
          el.style.borderColor = '#C9A86A';
          el.style.boxShadow = 'inset 0 2px 5px rgba(90, 18, 32, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
        };
      }
    });

    var diag = document.getElementById('diagnostico');
    if (diag) {
      var inputs = diag.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select');
      inputs.forEach(function(el) {
        el.style.backgroundColor = '#FFFFFF';
        el.style.border = '2px solid #C9A86A';
        el.style.borderRadius = '12px';
        el.style.boxShadow = 'inset 0 2px 5px rgba(90, 18, 32, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
        el.style.padding = '14px 16px';
        el.style.fontSize = '15px';
        el.style.color = '#2A181C';
        el.style.outline = 'none';
      });
    }
  }

  function init() {
    styleFormBoxes();
    injectSubBarNavigation();
    injectSimulator();
  }

  // Tentar novamente após o carregamento completo para garantir montagem sobre o React
  window.addEventListener('load', function() {
    setTimeout(injectSimulator, 200);
    setTimeout(styleFormBoxes, 200);
    setTimeout(styleFormBoxes, 600);
    setTimeout(styleFormBoxes, 1200);
    setInterval(styleFormBoxes, 2000);
    setTimeout(injectSubBarNavigation, 200);
    setTimeout(injectSimulator, 800);
    setTimeout(injectSubBarNavigation, 800);
  });

})();


  // Registro de PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
    });
  }
  

  // Suporte ativo a Rolagem Touch e Drag na Barra de Navegação no Celular
  (function initNavTouchScroll() {
    function attachTouchDrag() {
      var nav = document.querySelector('nav[aria-label="Navegação por seções"]');
      if (!nav || nav.dataset.touchAttached === 'true') return;
      nav.dataset.touchAttached = 'true';

      var isDown = false;
      var startX = 0;
      var scrollLeft = 0;

      // Mouse drag para emuladores e desktop
      nav.addEventListener('mousedown', function(e) {
        isDown = true;
        startX = e.pageX - nav.offsetLeft;
        scrollLeft = nav.scrollLeft;
        nav.style.cursor = 'grabbing';
      });

      window.addEventListener('mouseup', function() {
        isDown = false;
        if (nav) nav.style.cursor = 'grab';
      });

      nav.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - nav.offsetLeft;
        var walk = (x - startX) * 1.5;
        nav.scrollLeft = scrollLeft - walk;
      });

      // Touch drag nativo assistido para celular
      var touchStartX = 0;
      var touchStartScroll = 0;

      nav.addEventListener('touchstart', function(e) {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].pageX;
          touchStartScroll = nav.scrollLeft;
        }
      }, { passive: true });

      nav.addEventListener('touchmove', function(e) {
        if (e.touches && e.touches.length === 1) {
          var currentX = e.touches[0].pageX;
          var diffX = touchStartX - currentX;
          nav.scrollLeft = touchStartScroll + diffX;
        }
      }, { passive: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachTouchDrag);
    } else {
      attachTouchDrag();
    }
    window.addEventListener('load', attachTouchDrag);
    setTimeout(attachTouchDrag, 400);
    setTimeout(attachTouchDrag, 1200);
  })();


  // Monitor de Rolagem para Fixar a Barra de Navegação no Topo da Tela
  (function initStickyNavWatcher() {
    function setupWatcher() {
      var header = document.querySelector('header');
      var nav = document.querySelector('nav[aria-label="Navegação por seções"]');
      if (!nav || !header) return;

      var placeholder = document.getElementById('nav-sticky-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'nav-sticky-placeholder';
        placeholder.style.display = 'none';
        nav.parentNode.insertBefore(placeholder, nav);
      }

      function updateStickyState() {
        var headerRect = header.getBoundingClientRect();
        // Quando o cabeçalho sair pelo topo da tela
        if (headerRect.bottom <= 0) {
          if (!nav.classList.contains('is-stuck')) {
            placeholder.style.height = nav.offsetHeight + 'px';
            placeholder.style.display = 'block';
            nav.classList.add('is-stuck');
          }
        } else {
          if (nav.classList.contains('is-stuck')) {
            nav.classList.remove('is-stuck');
            placeholder.style.display = 'none';
          }
        }
      }

      window.addEventListener('scroll', updateStickyState, { passive: true });
      window.addEventListener('resize', updateStickyState, { passive: true });
      updateStickyState();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupWatcher);
    } else {
      setupWatcher();
    }
    window.addEventListener('load', setupWatcher);
    setTimeout(setupWatcher, 300);
    setTimeout(setupWatcher, 1000);
  })();


  // Disparador Oficial e Suporte do Instalador do PWA no Menu
  (function initPwaInstaller() {
    window.addEventListener('beforeinstallprompt', function(e) {
      try { e.preventDefault(); } catch(err) {}
      window.deferredPwaPrompt = e;
      console.log('PWA: evento beforeinstallprompt capturado com sucesso.');
    });

    window.triggerPwaInstall = function() {
      if (window.deferredPwaPrompt) {
        window.deferredPwaPrompt.prompt();
        window.deferredPwaPrompt.userChoice.then(function(choice) {
          if (choice && choice.outcome === 'accepted') {
            alert('🎉 Aplicativo da Erlane Mota instalado com sucesso!');
          }
          window.deferredPwaPrompt = null;
        }).catch(function() {
          showManualInstallModal();
        });
      } else {
        showManualInstallModal();
      }
    };

    function showManualInstallModal() {
      var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIos) {
        alert('📲 Como instalar no iPhone/iPad:\n\n1. Toque no botão de Compartilhar do Safari (quadrado com seta para cima ⎋)\n2. Role para baixo e selecione "Adicionar à Tela de Início"');
      } else {
        alert('📲 Como instalar no seu aparelho:\n\n1. Toque nos três pontinhos (menu) do seu navegador\n2. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }
    }
  })();


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
    var csv = 'Nome,Telefone,País,Objetivo,Data\n';
    leads.forEach(function(l) {
      csv += '"' + (l.name||'').replace(/"/g, '""') + '","' + 
             (l.phone||'').replace(/"/g, '""') + '","' + 
             (l.country||'').replace(/"/g, '""') + '","' + 
             (l.goal||'').replace(/"/g, '""') + '","' + 
             (l.date||'') + '"\n';
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
