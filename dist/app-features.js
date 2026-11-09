/**
 * APP-FEATURES.JS
 * Simulador de Parcelas Reduzidas, Painel Admin Blindado,
 * Header Harmônico & Gestão de Leads com Mensagem Padrão.
 */

(function() {
  'use strict';

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
  function injectSimulator() {
    if (document.getElementById('simulador-section')) return;

    var section = document.createElement('section');
    section.id = 'simulador-section';
    section.className = 'py-20 lg:py-28 bg-gradient-to-b from-[#FAF6EF] via-white to-[#FAF6EF] border-y border-[#E8DFD0] relative overflow-hidden';
    
    section.innerHTML = [
      '<div class="max-w-[1400px] w-full mx-auto px-4 sm:px-8 lg:px-12 relative z-10">',
      '  <div class="max-w-3xl mx-auto text-center space-y-4 mb-12">',
      '    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A1220]/5 border border-[#D4AF37]/40 text-[#A07817] text-xs font-extrabold uppercase tracking-widest shadow-2xs">',
      '      <span>\uD83D\uDCCA</span> Simulador de Parcelas Reduzidas',
      '    </div>',
      '    <h2 class="font-serif text-3xl sm:text-5xl font-medium text-[#5A1220] leading-tight">',
      '      Simule sua carta de cr\u00E9dito e veja o valor na sua moeda',
      '    </h2>',
      '    <p class="text-sm sm:text-base text-[#6B5A5E] leading-relaxed max-w-2xl mx-auto">',
      '      No cons\u00F3rcio estrat\u00E9gico voc\u00EA paga <strong class="text-[#5A1220]">apenas metade da amortiza\u00E7\u00E3o + 24% de taxa administrativa total</strong> dilu\u00EDda em at\u00E9 220 meses.',
      '    </p>',
      '  </div>',
      '  <div class="max-w-5xl mx-auto bg-[#1D0A10] text-white rounded-3xl p-6 sm:p-12 shadow-2xl border border-[#D4AF37]/40">',
      '    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">',
      '      <div class="lg:col-span-7 space-y-6">',
      '        <div>',
      '          <div class="flex justify-between items-center mb-2">',
      '            <label class="text-xs font-bold uppercase tracking-wider text-[#F3E7C4]">1. Valor da Carta de Cr\u00E9dito:</label>',
      '            <span id="sim-credit-text" class="font-serif text-xl sm:text-2xl font-bold text-[#D4AF37]">R$ 100.000</span>',
      '          </div>',
      '          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">',
      '            <button type="button" onclick="window.setSimCredit(100000)" class="sim-c-btn active px-3 py-2 rounded-xl text-xs font-bold border border-[#D4AF37] bg-[#D4AF37] text-[#1D0A10] transition">100 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(150000)" class="sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">150 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(200000)" class="sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">200 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(300000)" class="sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">300 mil</button>',
      '            <button type="button" onclick="window.setSimCredit(500000)" class="sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">500 mil</button>',
      '          </div>',
      '          <input type="range" id="sim-range-credit" min="80000" max="1000000" step="10000" value="100000" oninput="window.setSimCreditFromSlider(this.value)" class="w-full accent-[#D4AF37] cursor-pointer">',
      '          <div class="flex justify-between text-[11px] text-white/50 mt-1">',
      '            <span>R$ 80 mil</span>',
      '            <span>R$ 500 mil</span>',
      '            <span>R$ 1 Milh\u00E3o</span>',
      '          </div>',
      '        </div>',
      '        <div>',
      '          <div class="flex justify-between items-center mb-2">',
      '            <label class="text-xs font-bold uppercase tracking-wider text-[#F3E7C4]">2. Prazo (M\u00E1ximo 220 meses):</label>',
      '            <span id="sim-months-text" class="font-bold text-[#D4AF37] text-base">220 meses</span>',
      '          </div>',
      '          <div class="grid grid-cols-4 gap-2">',
      '            <button type="button" onclick="window.setSimMonths(150)" class="sim-m-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">150 m</button>',
      '            <button type="button" onclick="window.setSimMonths(180)" class="sim-m-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">180 m</button>',
      '            <button type="button" onclick="window.setSimMonths(200)" class="sim-m-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition">200 m</button>',
      '            <button type="button" onclick="window.setSimMonths(220)" class="sim-m-btn active px-3 py-2 rounded-xl text-xs font-bold border border-[#D4AF37] bg-[#D4AF37] text-[#1D0A10] transition">220 meses</button>',
      '          </div>',
      '        </div>',
      '        <div>',
      '          <label class="block text-xs font-bold uppercase tracking-wider text-[#F3E7C4] mb-2">3. Comparar com sua moeda no exterior:</label>',
      '          <select id="sim-currency-sel" onchange="window.setSimCurrency(this.value)" class="w-full bg-[#2D060E] border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-[#D4AF37] focus:outline-none">',
      '            <option value="EUR">\uD83C\uDDEA\uD83C\uDDFA Euro (EUR \u20AC)</option>',
      '            <option value="USD">\uD83C\uDDFA\uD83C\uDDF8 D\u00F3lar Americano (USD $)</option>',
      '            <option value="GBP">\uD83C\uDDEC\uD83C\uDDE7 Libra Esterlina (GBP \u00A3)</option>',
      '            <option value="CHF">\uD83C\uDDE8\uD83C\uDDED Franco Su\u00ED\u00E7o (CHF)</option>',
      '            <option value="JPY">\uD83C\uDDEF\uD83C\uDDF5 Iene Japon\u00EAs (JPY \u00A5)</option>',
      '            <option value="AUD">\uD83C\uDDE6\uD83C\uDDFA D\u00F3lar Australiano (AUD A$)</option>',
      '            <option value="CAD">\uD83C\uDDE8\uD83C\uDDE6 D\u00F3lar Canadense (CAD C$)</option>',
      '          </select>',
      '        </div>',
      '      </div>',
      '      <div class="lg:col-span-5 bg-gradient-to-br from-[#2D060E] to-[#17050A] p-6 sm:p-8 rounded-2xl border-2 border-[#D4AF37]/50 shadow-xl space-y-6">',
      '        <div>',
      '          <span class="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-[#D4AF37] text-[#1D0A10] mb-2">Parcela Reduzida</span>',
      '          <div class="text-xs text-white/70">Seu valor mensal em Reais:</div>',
      '          <div id="sim-reais-val" class="font-serif text-3xl sm:text-4xl font-bold text-[#F3E7C4] mt-1">R$ 336,36 <span class="text-sm font-normal text-white/60">/m\u00EAs</span></div>',
      '        </div>',
      '        <div class="pt-4 border-t border-white/10">',
      '          <div class="text-xs font-bold uppercase tracking-wider text-[#D4AF37]" id="sim-foreign-title">Equivalente no exterior em Euro:</div>',
      '          <div id="sim-foreign-val" class="font-serif text-3xl sm:text-5xl font-extrabold text-[#D4AF37] mt-1">\u20AC 57,50 <span class="text-base font-normal text-white/70">/m\u00EAs</span></div>',
      '          <div class="text-xs text-white/60 mt-1">Esfor\u00E7o muito menor para quem ganha em moeda forte.</div>',
      '        </div>',
      '        <div class="p-3.5 rounded-xl bg-[#5A1220]/70 border border-[#D4AF37]/50 text-xs text-[#F3E7C4] leading-relaxed flex items-start gap-2.5">',
      '          <span class="text-base shrink-0">\u26A0\uFE0F</span>',
      '          <div><strong class="text-white">Aten\u00E7\u00E3o Importante:</strong> A <u>parcela reduzida \u00E9 v\u00E1lida at\u00E9 a contempla\u00E7\u00E3o</u>. Ap\u00F3s ser contemplada, a parcela passa a ser no valor integral.</div>',
      '        </div>',
      '        <div>',
      '          <button type="button" onclick="window.sendSimToWhatsApp()" class="w-full py-4 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#A07817] text-[#1D0A10] font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">',
      '            <span>Simular Esta Carta no WhatsApp</span>',
      '            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>',
      '          </button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="mt-10 pt-8 border-t border-white/10">',
      '      <div class="text-xs font-bold uppercase tracking-wider text-white/70 mb-4 text-center sm:text-left">\uD83C\uDF10 Comparativo do Esfor\u00E7o Mensal Reduzido em Todas as Moedas:</div>',
      '      <div id="sim-multi-currency-grid" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    // Inserir antes da seção de contemplação ou diagnóstico
    var target = document.getElementById('contemplacao') || document.getElementById('diagnostico');
    if (target && target.parentNode) {
      target.parentNode.insertBefore(section, target);
    } else {
      document.body.appendChild(section);
    }

    updateSimulatorUI();
  }

  function updateSimulatorUI() {
    var res = calculate(state.credit, state.months);
    
    var creditText = document.getElementById('sim-credit-text');
    if (creditText) creditText.textContent = 'R$ ' + state.credit.toLocaleString('pt-BR');

    var monthsText = document.getElementById('sim-months-text');
    if (monthsText) monthsText.textContent = state.months + ' meses';

    var reaisVal = document.getElementById('sim-reais-val');
    if (reaisVal) {
      reaisVal.innerHTML = 'R$ ' + res.reducedTotal.toFixed(2).replace('.', ',') + ' <span class="text-sm font-normal text-white/60">/m\u00EAs</span>';
    }

    var curr = CURRENCIES[state.currency] || CURRENCIES.EUR;
    var fVal = res.reducedTotal / curr.rate;
    var fStr = (state.currency === 'JPY') ? Math.round(fVal).toLocaleString('pt-BR') : fVal.toFixed(2).replace('.', ',');

    var fTitle = document.getElementById('sim-foreign-title');
    if (fTitle) fTitle.textContent = 'Equivalente no exterior em ' + curr.name + ':';

    var fDisplay = document.getElementById('sim-foreign-val');
    if (fDisplay) {
      fDisplay.innerHTML = curr.symbol + ' ' + fStr + ' <span class="text-base font-normal text-white/70">/m\u00EAs</span>';
    }

    var grid = document.getElementById('sim-multi-currency-grid');
    if (grid) {
      grid.innerHTML = Object.keys(CURRENCIES).map(function(k) {
        var c = CURRENCIES[k];
        var v = res.reducedTotal / c.rate;
        var s = (k === 'JPY') ? Math.round(v).toLocaleString('pt-BR') : v.toFixed(0);
        return [
          '<div class="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:border-[#D4AF37]/50 transition">',
          '  <div class="text-base mb-1">' + c.flag + '</div>',
          '  <div class="text-[11px] font-bold text-white/70">' + k + '</div>',
          '  <div class="font-serif font-bold text-[#F3E7C4] text-sm mt-0.5">' + c.symbol + ' ' + s + '</div>',
          '  <div class="text-[9px] text-white/40">/m\u00EAs</div>',
          '</div>'
        ].join('');
      }).join('');
    }
  }

  // Métodos globais
  window.setSimCredit = function(val) {
    state.credit = val;
    var slider = document.getElementById('sim-range-credit');
    if (slider) slider.value = val;
    document.querySelectorAll('.sim-c-btn').forEach(function(b) {
      if (b.textContent.indexOf((val/1000) + ' mil') !== -1) {
        b.className = 'sim-c-btn active px-3 py-2 rounded-xl text-xs font-bold border border-[#D4AF37] bg-[#D4AF37] text-[#1D0A10] transition';
      } else {
        b.className = 'sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition';
      }
    });
    updateSimulatorUI();
  };

  window.setSimCreditFromSlider = function(val) {
    state.credit = parseInt(val, 10);
    document.querySelectorAll('.sim-c-btn').forEach(function(b) {
      b.className = 'sim-c-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition';
    });
    updateSimulatorUI();
  };

  window.setSimMonths = function(val) {
    state.months = val;
    document.querySelectorAll('.sim-m-btn').forEach(function(b) {
      if (b.textContent.indexOf(val.toString()) !== -1) {
        b.className = 'sim-m-btn active px-3 py-2 rounded-xl text-xs font-bold border border-[#D4AF37] bg-[#D4AF37] text-[#1D0A10] transition';
      } else {
        b.className = 'sim-m-btn px-3 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/5 text-white hover:border-[#D4AF37] transition';
      }
    });
    updateSimulatorUI();
  };

  window.setSimCurrency = function(val) {
    state.currency = val;
    updateSimulatorUI();
  };

  window.sendSimToWhatsApp = function() {
    var res = calculate(state.credit, state.months);
    var curr = CURRENCIES[state.currency] || CURRENCIES.EUR;
    var fVal = res.reducedTotal / curr.rate;
    var fStr = (state.currency === 'JPY') ? Math.round(fVal).toLocaleString('pt-BR') : fVal.toFixed(2).replace('.', ',');

    var msg = [
      'Ol\u00E1, Erlane! Fiz uma simula\u00E7\u00E3o no site com parcela reduzida:',
      '',
      '\u2022 *Carta de Cr\u00E9dito:* R$ ' + state.credit.toLocaleString('pt-BR'),
      '\u2022 *Prazo do Plano:* ' + state.months + ' meses',
      '\u2022 *Parcela Reduzida (at\u00E9 a contempla\u00E7\u00E3o):* R$ ' + res.reducedTotal.toFixed(2).replace('.', ',') + ' / m\u00EAs',
      '\u2022 *Equivalente na minha moeda (' + curr.name + '):* ' + curr.symbol + ' ' + fStr + ' / m\u00EAs',
      '',
      'Gostaria de tirar d\u00FAvidas sobre este grupo e ver como come\u00E7ar!'
    ].join('\n');

    window.open('https://wa.me/5538997373140?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
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
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    injectSimulator();
  }

  // Tentar novamente após o carregamento completo para garantir montagem sobre o React
  window.addEventListener('load', function() {
    setTimeout(injectSimulator, 200);
    setTimeout(injectSimulator, 800);
  });

})();
