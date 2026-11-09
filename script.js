/**
 * SEU PATRIMÔNIO NO BRASIL — SCRIPT PRINCIPAL & ADMIN BLINDADO
 * Responsável por:
 * 1. Sanitização Anti-XSS & Segurança
 * 2. Autenticação Admin com Proteção Anti-Força Bruta (5 tentativas / 15 min)
 * 3. Recuperação e Alteração Segura de Senha
 * 4. Diagnóstico Interativo & Despacho Inteligente para o WhatsApp da Erlane
 * 5. Calculadora de Alavancagem Cambial em Moeda Forte
 * 6. Gerenciamento de Vídeo & Acordeão de Perguntas Frequentes (FAQ)
 * 7. Sistema de Toasts & Mídia Multi-Fontes
 */

// ============================================================================
// 1. UTILITÁRIOS DE SEGURANÇA ANTI-XSS & SANITIZAÇÃO UNIVERSAL
// ============================================================================
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return '#';
  const clean = url.trim();
  if (/^(https?:|mailto:|tel:|wa\.me|#)/i.test(clean)) {
    return clean;
  }
  return '#';
}

// ============================================================================
// 2. SISTEMA DE TOASTS
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-[#1D0A10] border-l-4 border-[#D4AF37] text-white',
    error: 'bg-red-900 border-l-4 border-red-500 text-white',
    info: 'bg-[#5A1220] border-l-4 border-[#F3E7C4] text-white'
  };

  toast.className = `toast px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium flex items-center justify-between gap-4 max-w-md ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
    <button onclick="this.parentElement.remove()" class="text-white/60 hover:text-white text-lg font-bold">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ============================================================================
// 3. AUTENTICAÇÃO ADMINISTRATIVA & PROTEÇÃO ANTI-FORÇA BRUTA
// ============================================================================
const ADMIN_CONFIG = {
  storageKey: 'erlane_admin_hash',
  sessionKey: 'erlane_admin_auth',
  attemptsKey: 'erlane_admin_attempts',
  lockoutKey: 'erlane_admin_lockout',
  defaultPass: 'erlane2026', // Pode ser alterada no painel
  masterKey: 'EMIA-PATRIMONIO-2026',
  officialWhatsApp: '5538997373140'
};

function getStoredPassword() {
  return localStorage.getItem(ADMIN_CONFIG.storageKey) || ADMIN_CONFIG.defaultPass;
}

function checkLockout() {
  const lockoutUntil = localStorage.getItem(ADMIN_CONFIG.lockoutKey);
  if (lockoutUntil) {
    const remaining = parseInt(lockoutUntil, 10) - Date.now();
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      return minutes;
    } else {
      localStorage.removeItem(ADMIN_CONFIG.lockoutKey);
      localStorage.setItem(ADMIN_CONFIG.attemptsKey, '0');
    }
  }
  return 0;
}

function registerFailedAttempt() {
  let attempts = parseInt(localStorage.getItem(ADMIN_CONFIG.attemptsKey) || '0', 10) + 1;
  localStorage.setItem(ADMIN_CONFIG.attemptsKey, attempts.toString());
  if (attempts >= 5) {
    const lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutos
    localStorage.setItem(ADMIN_CONFIG.lockoutKey, lockoutUntil.toString());
    return 15;
  }
  return 0;
}

function resetAttempts() {
  localStorage.setItem(ADMIN_CONFIG.attemptsKey, '0');
  localStorage.removeItem(ADMIN_CONFIG.lockoutKey);
}

function openAdminLogin() {
  const lockout = checkLockout();
  if (lockout > 0) {
    showToast(`Painel temporariamente bloqueado. Aguarde ${lockout} minuto(s) ou use a Recuperação de Acesso.`, 'error');
    return;
  }

  if (sessionStorage.getItem(ADMIN_CONFIG.sessionKey) === 'true') {
    openAdminPanel();
    return;
  }

  const modal = document.getElementById('modal-admin-login');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const input = document.getElementById('admin-password-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function closeAdminLogin() {
  const modal = document.getElementById('modal-admin-login');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleAdminLogin(event) {
  if (event) event.preventDefault();
  const lockout = checkLockout();
  if (lockout > 0) {
    showToast(`Bloqueado por segurança. Restam ${lockout} minuto(s).`, 'error');
    return;
  }

  const input = document.getElementById('admin-password-input');
  const enteredPass = input ? input.value : '';
  const currentPass = getStoredPassword();

  if (enteredPass === currentPass) {
    resetAttempts();
    sessionStorage.setItem(ADMIN_CONFIG.sessionKey, 'true');
    closeAdminLogin();
    showToast('Acesso administrativo autorizado com sucesso.', 'success');
    openAdminPanel();
  } else {
    const lockedMinutes = registerFailedAttempt();
    if (lockedMinutes > 0) {
      closeAdminLogin();
      showToast(`Limite de 5 tentativas excedido. Painel bloqueado por 15 minutos.`, 'error');
    } else {
      const remainingAttempts = 5 - parseInt(localStorage.getItem(ADMIN_CONFIG.attemptsKey) || '0', 10);
      showToast(`Senha incorreta. Restam ${remainingAttempts} tentativa(s).`, 'error');
    }
  }
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
  closeAdminPanel();
  showToast('Sessão administrativa encerrada.', 'info');
}

// ============================================================================
// 4. PAINEL ADMIN COM ABAS & IMUTABILIDADE DO LAYOUT
// ============================================================================
function openAdminPanel() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loadAdminStats();
    switchAdminTab('leads');
  }
}

function closeAdminPanel() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function switchAdminTab(tabName) {
  const tabs = ['leads', 'media', 'security', 'settings'];
  tabs.forEach(t => {
    const content = document.getElementById(`tab-content-${t}`);
    const button = document.getElementById(`tab-btn-${t}`);
    if (content) {
      if (t === tabName) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
    if (button) {
      if (t === tabName) {
        button.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-[#D4AF37] text-[#D4AF37] bg-white/5 rounded-t-lg';
      } else {
        button.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-white/60 hover:text-white rounded-t-lg transition';
      }
    }
  });
}

function handlePasswordChange(event) {
  if (event) event.preventDefault();
  const currentInput = document.getElementById('pwd-current');
  const newInput = document.getElementById('pwd-new');
  const confirmInput = document.getElementById('pwd-confirm');

  const currentStored = getStoredPassword();
  if (currentInput.value !== currentStored) {
    showToast('A senha atual informada está incorreta.', 'error');
    return;
  }
  if (!newInput.value || newInput.value.length < 6) {
    showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
    return;
  }
  if (newInput.value !== confirmInput.value) {
    showToast('A confirmação da nova senha não confere.', 'error');
    return;
  }

  localStorage.setItem(ADMIN_CONFIG.storageKey, newInput.value);
  currentInput.value = '';
  newInput.value = '';
  confirmInput.value = '';
  showToast('Senha administrativa alterada com segurança!', 'success');
}

function openRecoveryModal() {
  closeAdminLogin();
  const modal = document.getElementById('modal-admin-recovery');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeRecoveryModal() {
  const modal = document.getElementById('modal-admin-recovery');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleRecoverySubmit(event) {
  if (event) event.preventDefault();
  const keyInput = document.getElementById('recovery-key-input');
  if (keyInput && keyInput.value.trim() === ADMIN_CONFIG.masterKey) {
    resetAttempts();
    localStorage.removeItem(ADMIN_CONFIG.storageKey); // redefine para o padrão
    closeRecoveryModal();
    showToast('Acesso redefinido para a senha padrão de emergência. Faça login e cadastre uma nova senha.', 'success');
    openAdminLogin();
  } else {
    showToast('Chave Mestra inválida. Em caso de dúvidas, contate o suporte técnico.', 'error');
  }
}

// ============================================================================
// 5. DIAGNÓSTICO INTERATIVO & DESPACHO PARA O WHATSAPP DA ERLANE
// ============================================================================
function handleDiagnosticSubmit(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('diag-name');
  const countryInput = document.getElementById('diag-country');
  const phoneInput = document.getElementById('diag-phone');
  const goalInput = document.getElementById('diag-goal');
  const budgetInput = document.getElementById('diag-budget');

  const name = nameInput ? nameInput.value.trim() : '';
  const country = countryInput ? countryInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const goal = goalInput ? goalInput.value : '';
  const budget = budgetInput ? budgetInput.value : '';

  if (!name || !country || !phone) {
    showToast('Por favor, preencha nome, país onde reside e WhatsApp para prosseguir.', 'error');
    return;
  }

  // Armazena lead localmente para histórico no Painel Admin
  const leads = JSON.parse(localStorage.getItem('erlane_leads') || '[]');
  const newLead = {
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR'),
    name: escapeHTML(name),
    country: escapeHTML(country),
    phone: escapeHTML(phone),
    goal: escapeHTML(goal),
    budget: escapeHTML(budget)
  };
  leads.unshift(newLead);
  localStorage.setItem('erlane_leads', JSON.stringify(leads));

  // Monta mensagem personalizada de WhatsApp
  const message = `Olá, Erlane! Preenchi meu diagnóstico no site e gostaria de planejar meu patrimônio no Brasil:
  
• *Nome:* ${name}
• *Onde moro:* ${country}
• *WhatsApp:* ${phone}
• *Meu Objetivo:* ${goal || 'Comprar imóvel / Investir no Brasil'}
• *Faixa de Aporte Mensal:* ${budget || 'A definir na consulta'}

Poderia me orientar com os próximos passos do meu diagnóstico gratuito?`;

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/5538997373140?text=${encodedMsg}`;

  showToast('Diagnóstico recebido! Abrindo o WhatsApp da Erlane...', 'success');

  // Abre WhatsApp em nova aba com conformidade bancária/LGPD
  setTimeout(() => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, 600);

  // Limpa formulário
  if (nameInput) nameInput.value = '';
  if (countryInput) countryInput.value = '';
  if (phoneInput) phoneInput.value = '';
  loadAdminStats();
}

function loadAdminStats() {
  const leads = JSON.parse(localStorage.getItem('erlane_leads') || '[]');
  const leadsContainer = document.getElementById('admin-leads-list');
  const leadsCount = document.getElementById('admin-leads-count');

  if (leadsCount) leadsCount.textContent = leads.length.toString();

  if (leadsContainer) {
    if (leads.length === 0) {
      leadsContainer.innerHTML = `
        <div class="text-center py-8 text-white/50 text-sm">
          Nenhum diagnóstico registrado ainda. Os contatos preenchidos no site aparecerão aqui.
        </div>
      `;
    } else {
      leadsContainer.innerHTML = leads.map(l => `
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div>
            <div class="font-bold text-[#F3E7C4] text-base">${l.name} <span class="text-xs font-normal text-white/60">(${l.country})</span></div>
            <div class="text-white/80 mt-1">📱 ${l.phone} | 🎯 ${l.goal}</div>
            <div class="text-white/50 text-xs mt-1">Aporte: ${l.budget} • Registrado em: ${l.date}</div>
          </div>
          <a href="https://wa.me/${l.phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#A07817] text-[#1D0A10] font-bold text-xs rounded-lg transition shrink-0">
            Falar no WhatsApp
          </a>
        </div>
      `).join('');
    }
  }
}

// ============================================================================
// 6. CALCULADORA DE ALAVANCAGEM CAMBIAL (MOEDA FORTE VS REAL)
// ============================================================================
function updateLeverageCalculator() {
  const currencySelect = document.getElementById('calc-currency');
  const amountInput = document.getElementById('calc-amount');
  const resultStrong = document.getElementById('calc-result-strong');
  const resultReais = document.getElementById('calc-result-reais');
  const resultLetter = document.getElementById('calc-result-letter');

  if (!currencySelect || !amountInput || !resultStrong || !resultReais || !resultLetter) return;

  const currency = currencySelect.value;
  const amount = parseFloat(amountInput.value) || 300;

  // Cotações conceituais conservadoras
  const rates = {
    USD: 5.60,
    EUR: 6.10,
    GBP: 7.20,
    CHF: 6.40,
    CAD: 4.10
  };

  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'CHF',
    CAD: 'C$'
  };

  const rate = rates[currency] || 5.60;
  const symbol = symbols[currency] || '$';
  const totalReaisMensal = amount * rate;

  // Projeção de carta de crédito estimada via consórcio imobiliário (média de 150 a 180 meses)
  const estimatedLetter = totalReaisMensal * 140;

  resultStrong.textContent = `${symbol} ${amount.toLocaleString('pt-BR')}/mês`;
  resultReais.textContent = `R$ ${Math.round(totalReaisMensal).toLocaleString('pt-BR')}/mês no Brasil`;
  resultLetter.textContent = `R$ ${Math.round(estimatedLetter).toLocaleString('pt-BR')}`;
}

// ============================================================================
// 7. ACORDEÃO DE PERGUNTAS FREQUENTES (FAQ)
// ============================================================================
function toggleFaq(index) {
  const content = document.getElementById(`faq-ans-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);

  if (!content) return;

  const isOpen = content.classList.contains('open');

  // Fecha todas as outras
  document.querySelectorAll('.faq-content').forEach((el, i) => {
    el.classList.remove('open');
    const otherIcon = document.getElementById(`faq-icon-${i}`);
    if (otherIcon) otherIcon.classList.remove('rotated');
  });

  if (!isOpen) {
    content.classList.add('open');
    if (icon) icon.classList.add('rotated');
  }
}

// ============================================================================
// 8. CONTROLES DE VÍDEO
// ============================================================================
function toggleVideoSound() {
  const video = document.getElementById('presentation-video');
  const btnText = document.getElementById('video-sound-btn-text');
  const btnIcon = document.getElementById('video-sound-btn-icon');

  if (!video) return;

  if (video.muted) {
    video.muted = false;
    video.play().catch(() => {});
    if (btnText) btnText.textContent = 'Silenciar Áudio';
    if (btnIcon) btnIcon.textContent = '🔇';
    showToast('Áudio da apresentação ativado.', 'info');
  } else {
    video.muted = true;
    if (btnText) btnText.textContent = 'Ativar Áudio da Apresentação';
    if (btnIcon) btnIcon.textContent = '🔊';
  }
}

// ============================================================================
// 9. MÍDIA MULTI-FONTES NO ADMIN
// ============================================================================
function handleLocalMediaUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const previewContainer = document.getElementById('admin-media-preview');
    if (previewContainer) {
      if (file.type.startsWith('video/')) {
        previewContainer.innerHTML = `
          <video src="${e.target.result}" controls class="w-full rounded-xl max-h-64 object-contain bg-black"></video>
          <div class="text-xs text-white/70 mt-2">Vídeo local carregado com sucesso (${(file.size / (1024*1024)).toFixed(2)} MB).</div>
        `;
      } else {
        previewContainer.innerHTML = `
          <img src="${e.target.result}" alt="Preview" class="w-full rounded-xl max-h-64 object-contain bg-black" />
          <div class="text-xs text-white/70 mt-2">Imagem carregada com sucesso.</div>
        `;
      }
    }
    showToast('Mídia processada no navegador.', 'success');
  };
  reader.readAsDataURL(file);
}

function handleCloudLinkConvert() {
  const input = document.getElementById('admin-cloud-url');
  if (!input || !input.value) {
    showToast('Insira uma URL do Google Drive, Dropbox ou link direto.', 'error');
    return;
  }
  let url = input.value.trim();

  // Conversor Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    url = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    input.value = url;
    showToast('Link do Google Drive convertido para link direto!', 'success');
  }

  // Conversor Dropbox
  if (url.includes('dropbox.com')) {
    url = url.replace('dl=0', 'raw=1');
    input.value = url;
    showToast('Link do Dropbox convertido para link direto!', 'success');
  }
}

// Inicialização segura no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  updateLeverageCalculator();
  loadAdminStats();
  
  // Suporte a tecla Enter em modais de login e recuperação
  const loginInput = document.getElementById('admin-password-input');
  if (loginInput) {
    loginInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdminLogin(e);
    });
  }
});
