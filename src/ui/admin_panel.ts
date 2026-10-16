import { giftRegistry } from '../config/gifts';
import { getTuning, listTuning, onTuningChange, resetTuning, setTuning, type TuningPath } from '../config/tuning';
import { liveServiceMock } from '../core/live_service_mock';
import type { RaceEngine } from '../core/race_engine';
import { ADMIN_STYLES } from './admin_styles';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type AdminTopSection = 'operar' | 'configurar';
export type AdminConfigCategory =
  | 'race'
  | 'chat'
  | 'power'
  | 'balance'
  | 'auto'
  | 'presets'
  | 'candidates'
  | 'gifts';

export class AdminPanel {
  private engine: RaceEngine;
  private container: HTMLElement;
  private unsubscribeTuning?: () => void;
  private unsubscribeLiveConnection?: () => void;
  private unsubscribeLiveData?: () => void;
  private unsubscribeLiveCandidate?: () => void;

  // Estado das seções e abas
  private currentSection: AdminTopSection = 'operar';
  private configCategory: AdminConfigCategory = 'race';
  private activeMonitorTab: 'telemetry' | 'ranking' | 'chat' = 'telemetry';

  // Filtros e buscas
  private paramSearchQuery = '';
  private logFilter: 'all' | 'applied' | 'ignored' | 'chat' | 'gifts' | 'system' = 'all';
  private donorWindow: 'session' | '15m' = 'session';
  private showScoreModal = false;
  private showGiftModal: string | null = null;
  private isCrtActive = false;
  private isSimulateAccordionOpen = true;

  // Automações de spam
  private spamLulaInterval: any = null;
  private spamFlavioInterval: any = null;

  constructor(engine: RaceEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
  }

  public mount(): void {
    // Injeta CSS no documento sem qualquer CDN externo
    if (!document.getElementById('admin-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'admin-custom-styles';
      styleEl.textContent = ADMIN_STYLES;
      document.head.appendChild(styleEl);
    }

    document.body.className = 'admin-body';
    document.title = "PRESIDENTIAL SPRINT '26 - Painel Admin";

    // O painel é de configuração direta (sem PIN/login conforme Rodada 3)
    this.renderCockpit();
  }

  public unmount(): void {
    if (this.spamLulaInterval) clearInterval(this.spamLulaInterval);
    if (this.spamFlavioInterval) clearInterval(this.spamFlavioInterval);
    if (this.unsubscribeTuning) this.unsubscribeTuning();
    if (this.unsubscribeLiveConnection) this.unsubscribeLiveConnection();
    if (this.unsubscribeLiveData) this.unsubscribeLiveData();
    if (this.unsubscribeLiveCandidate) this.unsubscribeLiveCandidate();
  }

  // ==========================================
  // RENDERIZAÇÃO DO COCKPIT
  // ==========================================
  private renderCockpit(): void {
    this.container.innerHTML = this.renderHtml();
    this.populateMonitorTables();
    this.bindEvents();

    this.unsubscribeTuning = onTuningChange(() => {
      this.updateTuningValues();
    });

    this.unsubscribeLiveConnection = liveServiceMock.onConnectionChange(() => {
      this.updateConnectionDisplay();
    });

    this.unsubscribeLiveData = liveServiceMock.onDataChange(() => {
      if (this.currentSection === 'operar') {
        this.populateMonitorTables();
      }
    });

    this.unsubscribeLiveCandidate = liveServiceMock.onCandidateChange(() => {
      this.updateCandidateProfilesDisplay();
    });

    // Loop de telemetria dinâmico a 60fps
    const updateLoop = () => {
      if (document.body.contains(this.container)) {
        this.updateDynamicState();
        requestAnimationFrame(updateLoop);
      }
    };
    requestAnimationFrame(updateLoop);
  }

  private renderHtml(): string {
    const scores = this.engine.getScores();
    const candidates = liveServiceMock.getCandidateProfiles();

    return `
      <div id="admin-root" style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">
        <!-- CRT Scanline Global Overlay (Opcional) -->
        <div class="crt-overlay ${this.isCrtActive ? 'active' : ''}" id="admin-crt-overlay"></div>

        <!-- 1. BARRA ÚNICA SUPERIOR (~44px) -->
        <header class="admin-topbar">
          <!-- ESQUERDA: ABAS OPERAR E CONFIGURAR -->
          <div class="admin-topbar-left">
            <button id="admin-nav-operar" class="admin-nav-tab ${this.currentSection === 'operar' ? 'active' : ''}">
              OPERAR
            </button>
            <button id="admin-nav-configurar" class="admin-nav-tab ${this.currentSection === 'configurar' ? 'active' : ''}">
              CONFIGURAR
            </button>
          </div>

          <!-- MEIO: ESTADO, CRONÔMETRO, CONTROLES & PLACAR EM TEXTO SIMPLES -->
          <div class="admin-topbar-center">
            <span id="admin-race-status-badge" class="admin-status-chip">
              AGUARDANDO
            </span>
            <span id="admin-main-timer" class="admin-timer-display tabular-nums">
              00:00 / 03:00
            </span>

            <div style="display: flex; gap: 4px; align-items: center;">
              <button id="admin-btn-start" class="arcade-btn arcade-btn-green arcade-btn-sm">
                ▶ INICIAR
              </button>
              <button id="admin-btn-pause" class="arcade-btn arcade-btn-amber arcade-btn-sm">
                ⏸ PAUSAR
              </button>
              <button id="admin-btn-reset" class="arcade-btn arcade-btn-dark arcade-btn-sm" title="Reiniciar Pista">
                ↺ REINICIAR
              </button>
            </div>

            <!-- Placar em texto simples com botão Ajustar (sem setas) -->
            <div class="admin-score-banner">
              <span id="admin-score-text">
                13 ${escapeHtml(candidates.lula.name.toUpperCase())} ${scores.session.lula} × ${scores.session.flavio} ${escapeHtml(candidates.flavio.name.toUpperCase())} 22
              </span>
              <button id="admin-btn-open-score-modal" class="arcade-btn arcade-btn-dark arcade-btn-sm" title="Ajustar ou zerar placar">
                Ajustar
              </button>
            </div>
          </div>

          <!-- DIREITA: ETIQUETA SIMULADO & MENU ⚙ COM CRT -->
          <div class="admin-topbar-right">
            <span class="admin-simulated-badge">SIMULADO</span>
            <button id="admin-btn-toggle-crt" class="arcade-btn arcade-btn-dark arcade-btn-sm" title="Alternar filtro CRT">
              ⚙ CRT
            </button>
          </div>
        </header>

        <!-- 2. WORKSPACE COM 3 COLUNAS (1920×940) -->
        <main class="admin-workspace">
          ${this.currentSection === 'operar' ? this.renderOperarSectionHtml() : this.renderConfigurarSectionHtml()}
        </main>

        <!-- 3. MODAIS -->
        ${this.showScoreModal ? this.renderScoreModalHtml() : ''}
        ${this.showGiftModal ? this.renderGiftModalHtml(this.showGiftModal) : ''}
      </div>
    `;
  }

  // ==========================================
  // ABA OPERAR
  // ==========================================
  private renderOperarSectionHtml(): string {
    const liveStatus = liveServiceMock.getConnectionStatus();

    return `
      <!-- COLUNA ESQUERDA: CONEXÃO, SIMULAR RECOLHÍVEL & PRESENTES -->
      <aside class="admin-col-left">
        <!-- Bloco Conexão Compacta -->
        <div class="arcade-panel admin-connection-card">
          <div class="admin-connection-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="admin-connection-title">CONEXÃO</span>
              <span class="admin-simulated-badge" style="font-size: 10px; padding: 1px 5px;">SIMULADO</span>
            </div>
            <span id="admin-live-badge" class="admin-status-chip" style="font-size: 11px; padding: 2px 6px;">
              ${this.translateLiveState(liveStatus.state)}
            </span>
          </div>
          <div style="font-size: 12px; color: var(--admin-outline); display: flex; flex-direction: column; gap: 2px;">
            <div>Canal: <strong style="color: #fff;">${escapeHtml(liveStatus.channelName)}</strong></div>
            <div>Tempo: <span id="admin-live-duration" style="color: #fff;">0m 00s</span> (Reconexões: <span id="admin-live-reconnects" style="color: #ffd165;">${liveStatus.reconnectCount}</span>)</div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button id="admin-btn-reconnect" class="arcade-btn arcade-btn-dark arcade-btn-sm" style="flex: 1;">
              Reconectar
            </button>
            <button id="admin-btn-disconnect" class="arcade-btn arcade-btn-dark arcade-btn-sm" style="flex: 1;">
              Derrubar
            </button>
          </div>
        </div>

        <!-- Bloco Simular (Recolhível, aberto por padrão) -->
        <div class="arcade-panel" style="overflow: hidden;">
          <button id="admin-toggle-simular" class="admin-accordion-header" aria-expanded="${this.isSimulateAccordionOpen}">
            <span>SIMULAR</span>
            <span id="admin-simular-arrow">${this.isSimulateAccordionOpen ? '▲' : '▼'}</span>
          </button>
          <div id="admin-simular-body" class="admin-accordion-body ${this.isSimulateAccordionOpen ? '' : 'collapsed'}">
            <!-- Lula 13 -->
            <div style="display: flex; gap: 6px;">
              <button id="admin-btn-chat-13" class="arcade-btn arcade-btn-danger" style="flex: 2; padding: 6px;">
                +1 MSG LULA (13)
              </button>
              <button id="admin-btn-spam-lula" class="arcade-btn arcade-btn-dark" style="flex: 1; padding: 6px; font-size: 11px;">
                SPAM (10/s)
              </button>
            </div>
            <!-- Flávio 22 -->
            <div style="display: flex; gap: 6px;">
              <button id="admin-btn-chat-22" class="arcade-btn" style="flex: 2; padding: 6px; background: #2563eb; color: #fff;">
                +1 MSG FLÁVIO (22)
              </button>
              <button id="admin-btn-spam-flavio" class="arcade-btn arcade-btn-dark" style="flex: 1; padding: 6px; font-size: 11px;">
                SPAM (10/s)
              </button>
            </div>
          </div>
        </div>

        <!-- Bloco Presentes em Grade sem rolagem -->
        <div class="arcade-panel" style="flex: 1; display: flex; flex-direction: column; padding: 8px; min-height: 0;">
          <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: var(--admin-primary); margin-bottom: 6px;">
            PRESENTES RÁPIDOS
          </div>
          <div class="admin-gifts-grid">
            ${this.renderQuickGiftsHtml()}
          </div>
        </div>
      </aside>

      <!-- COLUNA CENTRAL: PALCO 9:16 PERMANENTE & CARTÕES COMPACTOS -->
      ${this.renderCenterStageHtml()}

      <!-- COLUNA DIREITA: MONITOR COM ABAS (Telemetria, Top doações, Mensagens) -->
      <aside class="admin-col-right" data-aspect="9:16">
        <div class="admin-monitor-container">
          <div class="admin-monitor-tabs">
            <button class="admin-tab-btn ${this.activeMonitorTab === 'telemetry' ? 'active' : ''}" data-tab="telemetry">
              Telemetria
            </button>
            <button class="admin-tab-btn ${this.activeMonitorTab === 'ranking' ? 'active' : ''}" data-tab="ranking">
              Top Doações
            </button>
            <button class="admin-tab-btn ${this.activeMonitorTab === 'chat' ? 'active' : ''}" data-tab="chat">
              Mensagens
            </button>
          </div>
          <div class="admin-monitor-content" id="admin-monitor-content">
            ${this.renderMonitorTabContentHtml()}
          </div>
        </div>
      </aside>
    `;
  }

  // ==========================================
  // ABA CONFIGURAR
  // ==========================================
  private renderConfigurarSectionHtml(): string {
    return `
      <!-- COLUNA ESQUERDA: LISTA DE 8 CATEGORIAS -->
      <aside class="admin-config-left-menu">
        <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: #ffd165; padding: 6px 8px; border-bottom: 1px solid #262a35; margin-bottom: 4px;">
          CATEGORIAS
        </div>
        <button class="admin-category-btn ${this.configCategory === 'race' ? 'active' : ''}" data-category="race">
          <span>⏱</span> <span>Corrida</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'chat' ? 'active' : ''}" data-category="chat">
          <span>💬</span> <span>Chat e anti-spam</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'power' ? 'active' : ''}" data-category="power">
          <span>⚡</span> <span>Poderes e presentes</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'balance' ? 'active' : ''}" data-category="balance">
          <span>⚖</span> <span>Equilíbrio</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'auto' ? 'active' : ''}" data-category="auto">
          <span>🤖</span> <span>Corrida automática</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'presets' ? 'active' : ''}" data-category="presets">
          <span>🚀</span> <span>Presets de Prova</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'candidates' ? 'active' : ''}" data-category="candidates">
          <span>👤</span> <span>Personagens</span>
        </button>
        <button class="admin-category-btn ${this.configCategory === 'gifts' ? 'active' : ''}" data-category="gifts">
          <span>🎁</span> <span>Tabela de presentes</span>
        </button>
      </aside>

      <!-- COLUNA CENTRAL: PALCO 9:16 PERMANENTE (CONTINUA VISÍVEL) -->
      ${this.renderCenterStageHtml()}

      <!-- COLUNA DIREITA: PARÂMETROS DA CATEGORIA ESCOLHIDA -->
      <aside class="admin-col-right">
        <div class="admin-config-right-panel">
          <div class="admin-config-header">
            <span class="admin-config-title">
              ${this.getCategoryTitle(this.configCategory)}
            </span>
            <div style="display: flex; gap: 6px;">
              <input
                type="text"
                id="admin-config-search"
                class="arcade-input"
                placeholder="Buscar parâmetro…"
                value="${escapeHtml(this.paramSearchQuery)}"
                style="width: 150px; font-size: 12px;"
              />
              <button id="admin-btn-reset-tuning-category" class="arcade-btn arcade-btn-dark arcade-btn-sm" title="Restaurar valores padrão desta categoria">
                Restaurar
              </button>
            </div>
          </div>

          <div class="admin-config-alert">
            ℹ️ Alterações de balanceamento entram em vigor na <strong>próxima corrida</strong>.
          </div>

          <div class="admin-params-scroll-area" id="admin-config-content">
            ${this.renderCategoryContentHtml()}
          </div>
        </div>
      </aside>
    `;
  }

  // ==========================================
  // PALCO CENTRAL 9:16 (PERMANENTE NAS 2 ABAS)
  // ==========================================
  private renderCenterStageHtml(): string {
    const candidates = liveServiceMock.getCandidateProfiles();

    return `
      <section class="admin-col-center">
        <div class="arena-preview-wrapper">
          <div class="preview-aspect-box">
            <!-- Réguas de distância mínimas -->
            <div class="preview-ruler">
              <span>0m</span>
              <span>50m</span>
              <span>100m</span>
            </div>

            <!-- Pista e corredores -->
            <div class="preview-track-area">
              <div class="preview-finish-line" title="Linha de Chegada"></div>

              <!-- Faixa Lula (13) -->
              <div class="preview-lane preview-lane-lula" id="lane-preview-lula">
                <div class="preview-runner-sprite" id="admin-preview-runner-lula" style="bottom: 12px;">
                  <span class="preview-runner-badge" style="background: #dc2626;">13</span>
                  <div class="preview-runner-body" id="admin-runner-body-lula" style="background: ${escapeHtml(candidates.lula.color)};">
                    <div id="aura-lula"></div>
                  </div>
                </div>
              </div>

              <!-- Faixa Flávio (22) -->
              <div class="preview-lane preview-lane-flavio" id="lane-preview-flavio">
                <div class="preview-runner-sprite" id="admin-preview-runner-flavio" style="bottom: 12px;">
                  <span class="preview-runner-badge" style="background: #2563eb;">22</span>
                  <div class="preview-runner-body" id="admin-runner-body-flavio" style="background: ${escapeHtml(candidates.flavio.color)};">
                    <div id="aura-flavio"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cartões compactos dos candidatos logo abaixo do quadro (mesma largura de 320px) -->
        <div class="preview-candidates-deck">
          <!-- Card Lula -->
          <div class="candidate-compact-card card-lula">
            <div class="candidate-card-header">
              <span class="candidate-card-name" id="label-card-lula" style="color: #f87171;">13 LULA</span>
              <span id="admin-speed-lula" class="tabular-nums font-body" style="font-weight: 700; color: #fff;">0.00 m/s</span>
            </div>
            <div class="candidate-card-stats tabular-nums">
              <span>Posição: <strong id="admin-pos-lula">0.0m</strong></span>
              <span>Progresso: <strong id="admin-pct-lula">0%</strong></span>
            </div>
            <div class="candidate-progress-bar-bg">
              <div id="admin-bar-lula" class="candidate-progress-bar-fill" style="width: 0%; background: #ef4444;"></div>
            </div>
            <div style="font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              Efeitos: <span id="admin-effects-lula" style="color: #cbd5e1;">Nenhum</span>
            </div>
          </div>

          <!-- Card Flávio -->
          <div class="candidate-compact-card card-flavio">
            <div class="candidate-card-header">
              <span class="candidate-card-name" id="label-card-flavio" style="color: #60a5fa;">22 FLÁVIO</span>
              <span id="admin-speed-flavio" class="tabular-nums font-body" style="font-weight: 700; color: #fff;">0.00 m/s</span>
            </div>
            <div class="candidate-card-stats tabular-nums">
              <span>Posição: <strong id="admin-pos-flavio">0.0m</strong></span>
              <span>Progresso: <strong id="admin-pct-flavio">0%</strong></span>
            </div>
            <div class="candidate-progress-bar-bg">
              <div id="admin-bar-flavio" class="candidate-progress-bar-fill" style="width: 0%; background: #3b82f6;"></div>
            </div>
            <div style="font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              Efeitos: <span id="admin-effects-flavio" style="color: #cbd5e1;">Nenhum</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // PRESENTES RÁPIDOS
  // ==========================================
  private renderQuickGiftsHtml(): string {
    const list = giftRegistry.list();
    const iconMap: Record<string, string> = {
      rose: '🌹',
      white_rose: '💮',
      banana: '🍌',
      dinosaur: '🦖',
      donut: '🍩',
      capybara: '🐾',
      confetti: '🎉',
      balloons: '🎈',
    };

    return list
      .map((g) => {
        return `
          <button class="arcade-gift-mini-card quick-gift-btn" data-gift="${g.giftId}" aria-label="Enviar presente ${escapeHtml(g.name)}">
            <span style="font-size: 16px;">${iconMap[g.giftId] || '🎁'}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(g.name)}
              </div>
              <div style="font-size: 12px; color: #ffd165; font-weight: 700;">
                💎 ${g.diamondCost}
              </div>
            </div>
          </button>
        `;
      })
      .join('');
  }

  // ==========================================
  // CONTEÚDO DO MONITOR (Aba Operar)
  // ==========================================
  private renderMonitorTabContentHtml(): string {
    if (this.activeMonitorTab === 'telemetry') {
      const allLogs = this.engine.getLogs();
      const appliedCount = allLogs.filter((l) => l.kind === 'event_decision' && l.applied).length;
      const ignoredCount = allLogs.filter((l) => l.kind === 'event_decision' && !l.applied).length;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm log-filter-btn ${this.logFilter === 'all' ? 'arcade-btn-primary' : ''}" data-filter="all">TODOS</button>
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm log-filter-btn ${this.logFilter === 'applied' ? 'arcade-btn-primary' : ''}" data-filter="applied">APLICADOS</button>
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm log-filter-btn ${this.logFilter === 'ignored' ? 'arcade-btn-primary' : ''}" data-filter="ignored">IGNORADOS</button>
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm log-filter-btn ${this.logFilter === 'chat' ? 'arcade-btn-primary' : ''}" data-filter="chat">CHAT</button>
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm log-filter-btn ${this.logFilter === 'gifts' ? 'arcade-btn-primary' : ''}" data-filter="gifts">PRESENTES</button>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 12px; color: #94a3b8;">Total: <strong style="color: #fff;">${allLogs.length}</strong> (OK: <strong style="color: #34d399;">${appliedCount}</strong> / Ign: <strong style="color: #f87171;">${ignoredCount}</strong>)</span>
            <button id="admin-btn-export-logs" class="arcade-btn arcade-btn-dark arcade-btn-sm">Exportar</button>
            <button id="admin-btn-clear-logs" class="arcade-btn arcade-btn-dark arcade-btn-sm">Limpar</button>
          </div>
        </div>

        <table class="arcade-table">
          <thead>
            <tr>
              <th style="width: 70px;">HORA</th>
              <th style="width: 70px;">TIPO</th>
              <th style="width: 80px;">ORIGEM</th>
              <th>MENSAGEM / PAYLOAD</th>
              <th style="text-align: right; width: 80px;">STATUS</th>
            </tr>
          </thead>
          <tbody id="admin-telemetry-tbody"></tbody>
        </table>
      `;
    }

    if (this.activeMonitorTab === 'ranking') {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: var(--admin-outline);">Classificação por volume de diamantes</span>
          <div style="display: flex; gap: 4px;">
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm donor-window-btn ${this.donorWindow === 'session' ? 'arcade-btn-primary' : ''}" data-window="session">Sessão</button>
            <button class="arcade-btn arcade-btn-dark arcade-btn-sm donor-window-btn ${this.donorWindow === '15m' ? 'arcade-btn-primary' : ''}" data-window="15m">15 Min</button>
          </div>
        </div>

        <table class="arcade-table">
          <thead>
            <tr>
              <th style="width: 40px;">POS</th>
              <th>USUÁRIO</th>
              <th style="width: 100px;">DIAMANTES</th>
              <th style="width: 90px;">PRESENTES</th>
              <th style="width: 100px;">REPRESENTAÇÃO</th>
            </tr>
          </thead>
          <tbody id="admin-ranking-tbody"></tbody>
        </table>
      `;
    }

    if (this.activeMonitorTab === 'chat') {
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: var(--admin-primary); margin-bottom: 6px;">
              FEED DE MENSAGENS AO VIVO
            </div>
            <table class="arcade-table">
              <thead>
                <tr>
                  <th style="width: 60px;">HORA</th>
                  <th>USUÁRIO</th>
                  <th style="width: 40px;">VOTO</th>
                  <th>MENSAGEM</th>
                </tr>
              </thead>
              <tbody id="admin-chat-feed-tbody"></tbody>
            </table>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
              TOP MENSAGENS FREQUENTES
            </div>
            <table class="arcade-table">
              <thead>
                <tr>
                  <th>MENSAGEM</th>
                  <th style="width: 40px;">VOTO</th>
                  <th style="width: 50px;">QTD</th>
                  <th style="width: 60px;">%</th>
                </tr>
              </thead>
              <tbody id="admin-chat-top-tbody"></tbody>
            </table>
          </div>
        </div>
      `;
    }

    return '';
  }

  // ==========================================
  // POPULAÇÃO SEGURA DAS TABELAS (XSS SAFE)
  // ==========================================
  public populateTabTables(container?: HTMLElement | null): void {
    const root = container || this.container;
    if (!root) return;

    // 1. Telemetria
    if (this.activeMonitorTab === 'telemetry') {
      const tbody = root.querySelector('#admin-telemetry-tbody');
      if (tbody) {
        tbody.innerHTML = '';

        const allLogs = this.engine.getLogs();
        const filteredLogs = allLogs.filter((log) => {
          if (this.logFilter === 'all') return true;
          if (this.logFilter === 'applied') return log.kind === 'event_decision' && log.applied;
          if (this.logFilter === 'ignored') return log.kind === 'event_decision' && !log.applied;
          if (this.logFilter === 'chat') return log.kind === 'event_decision' && log.event.type === 'chat';
          if (this.logFilter === 'gifts') return log.kind === 'event_decision' && log.event.type === 'gift';
          if (this.logFilter === 'system') return log.kind === 'lifecycle';
          return true;
        });

        if (filteredLogs.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 5;
          td.style.cssText = 'text-align: center; color: #64748b; padding: 14px;';
          td.textContent = 'Nenhum evento registrado nesta categoria';
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else {
          for (const log of filteredLogs.slice(-40).reverse()) {
            const isDecision = log.kind === 'event_decision';
            const tr = document.createElement('tr');

            const tdTime = document.createElement('td');
            tdTime.style.cssText = 'color: #94a3b8; font-size: 12px;';
            tdTime.textContent = new Date(log.timeIso).toLocaleTimeString();
            tr.appendChild(tdTime);

            const tdBadge = document.createElement('td');
            const badgeSpan = document.createElement('span');
            badgeSpan.style.cssText = 'padding: 2px 5px; font-weight: 700; font-size: 11px;';
            badgeSpan.className = isDecision
              ? log.event.type === 'gift' ? 'arcade-btn-danger' : 'arcade-btn-primary'
              : 'arcade-btn-dark';
            badgeSpan.textContent = isDecision ? (log.event.type === 'gift' ? 'PRESENTE' : 'CHAT') : 'SISTEMA';
            tdBadge.appendChild(badgeSpan);
            tr.appendChild(tdBadge);

            const tdOrigin = document.createElement('td');
            tdOrigin.style.cssText = 'color: #cbd5e1; font-size: 12px; font-weight: 600;';
            tdOrigin.textContent = isDecision
              ? log.event.userId.startsWith('donor_') ? '@doador' : log.event.userId.startsWith('spam_') ? '@espectador' : '@operador'
              : 'SISTEMA';
            tr.appendChild(tdOrigin);

            const tdPayload = document.createElement('td');
            tdPayload.style.cssText = 'color: #ffffff; font-size: 12px; word-break: break-word;';
            tdPayload.textContent = isDecision
              ? log.event.type === 'gift'
                ? `🎁 ${log.event.giftId} (${log.event.power}) → ${log.event.candidateBenefited.toUpperCase()}`
                : `Chat para ${log.event.candidateId.toUpperCase()} (${log.reason})`
              : log.description;
            tr.appendChild(tdPayload);

            const tdStatus = document.createElement('td');
            tdStatus.style.cssText = `text-align: right; font-weight: 700; font-size: 12px; color: ${
              isDecision ? (log.applied ? '#34d399' : '#f87171') : '#60a5fa'
            };`;
            tdStatus.textContent = isDecision ? (log.applied ? 'APLICADO' : 'IGNORADO') : 'OK';
            tr.appendChild(tdStatus);

            tbody.appendChild(tr);
          }
        }
      }
    } else if (this.activeMonitorTab === 'ranking') {
      const tbody = root.querySelector('#admin-ranking-tbody');
      if (tbody) {
        tbody.innerHTML = '';

        const windowMs = this.donorWindow === '15m' ? 15 * 60 * 1000 : undefined;
        const top = liveServiceMock.getTopDonors(10, windowMs);
        const maxDiamonds = top.length > 0 ? top[0].totalDiamonds : 1;

        if (top.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 5;
          td.style.cssText = 'text-align: center; color: #64748b; padding: 14px;';
          td.textContent = 'Nenhuma doação registrada nesta janela';
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else {
          top.forEach((d, idx) => {
            const pct = Math.round((d.totalDiamonds / maxDiamonds) * 100);
            const tr = document.createElement('tr');

            const tdPos = document.createElement('td');
            tdPos.style.cssText = 'font-weight: 700; color: #ffd165;';
            tdPos.textContent = `#${idx + 1}`;
            tr.appendChild(tdPos);

            const tdUser = document.createElement('td');
            tdUser.style.cssText = 'font-weight: 700; color: #fff;';
            tdUser.textContent = d.userName;
            tr.appendChild(tdUser);

            const tdDia = document.createElement('td');
            tdDia.style.cssText = 'color: #facc15; font-weight: 700;';
            tdDia.textContent = `💎 ${d.totalDiamonds}`;
            tr.appendChild(tdDia);

            const tdCount = document.createElement('td');
            tdCount.textContent = `${d.count} un`;
            tr.appendChild(tdCount);

            const tdBar = document.createElement('td');
            tdBar.style.width = '100px';
            const barContainer = document.createElement('div');
            barContainer.style.cssText = 'width: 100%; height: 6px; background: #000; border: 1px solid #334155;';
            const bar = document.createElement('div');
            bar.style.cssText = `height: 100%; width: ${pct}%; background: #eab308;`;
            barContainer.appendChild(bar);
            tdBar.appendChild(barContainer);
            tr.appendChild(tdBar);

            tbody.appendChild(tr);
          });
        }
      }
    } else if (this.activeMonitorTab === 'chat') {
      const feedTbody = root.querySelector('#admin-chat-feed-tbody');
      const topTbody = root.querySelector('#admin-chat-top-tbody');

      if (feedTbody) {
        feedTbody.innerHTML = '';
        const msgs = liveServiceMock.getChatMessages().slice(0, 25);

        if (msgs.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 4;
          td.style.cssText = 'text-align: center; color: #64748b; padding: 12px;';
          td.textContent = 'Nenhuma mensagem registrada';
          tr.appendChild(td);
          feedTbody.appendChild(tr);
        } else {
          for (const m of msgs) {
            const tr = document.createElement('tr');

            const tdTime = document.createElement('td');
            tdTime.style.cssText = 'color: #94a3b8; font-size: 12px;';
            tdTime.textContent = new Date(m.timestamp).toLocaleTimeString();
            tr.appendChild(tdTime);

            const tdUser = document.createElement('td');
            tdUser.style.cssText = 'color: #fff; font-weight: 700; font-size: 12px;';
            tdUser.textContent = m.userName;
            tr.appendChild(tdUser);

            const tdVote = document.createElement('td');
            const spanVote = document.createElement('span');
            spanVote.style.cssText = `background: ${
              m.candidateNumber === '13' ? '#dc2626' : '#2563eb'
            }; color: #fff; padding: 2px 4px; font-weight: 700; font-size: 11px;`;
            spanVote.textContent = m.candidateNumber;
            tdVote.appendChild(spanVote);
            tr.appendChild(tdVote);

            const tdMsg = document.createElement('td');
            tdMsg.style.cssText = 'color: #ffffff; font-size: 12px;';
            tdMsg.textContent = m.message;
            tr.appendChild(tdMsg);

            feedTbody.appendChild(tr);
          }
        }
      }

      if (topTbody) {
        topTbody.innerHTML = '';
        const topMsgs = liveServiceMock.getTopMessages(8);

        if (topMsgs.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 4;
          td.style.cssText = 'text-align: center; color: #64748b; padding: 12px;';
          td.textContent = 'Sem dados de mensagens frequentes';
          tr.appendChild(td);
          topTbody.appendChild(tr);
        } else {
          for (const tm of topMsgs) {
            const candColor = tm.candidateNumber === '13' ? '#dc2626' : tm.candidateNumber === '22' ? '#2563eb' : '#64748b';
            const tr = document.createElement('tr');

            const tdMsg = document.createElement('td');
            tdMsg.style.cssText = 'color: #fff; font-weight: 600; font-size: 12px;';
            tdMsg.textContent = `"${tm.text}"`;
            tr.appendChild(tdMsg);

            const tdVote = document.createElement('td');
            const spanVote = document.createElement('span');
            spanVote.style.cssText = `background: ${candColor}; color: #fff; padding: 1px 4px; font-size: 11px; font-weight: 700;`;
            spanVote.textContent = tm.candidateNumber.toUpperCase();
            tdVote.appendChild(spanVote);
            tr.appendChild(tdVote);

            const tdCount = document.createElement('td');
            tdCount.style.cssText = 'color: #facc15; font-weight: 700; font-size: 12px;';
            tdCount.textContent = String(tm.count);
            tr.appendChild(tdCount);

            const tdPct = document.createElement('td');
            tdPct.style.cssText = 'font-size: 12px; color: #ffffff;';
            tdPct.textContent = `${tm.percentage}%`;
            tr.appendChild(tdPct);

            topTbody.appendChild(tr);
          }
        }
      }
    }

    // 2. Presentes na aba Configurar
    if (this.configCategory === 'gifts') {
      const tbody = root.querySelector('#admin-config-gifts-tbody');
      if (tbody) {
        tbody.innerHTML = '';
        const list = giftRegistry.list();

        for (const g of list) {
          const tr = document.createElement('tr');

          const tdId = document.createElement('td');
          tdId.style.cssText = 'color: #94a3b8; font-size: 12px;';
          tdId.textContent = g.giftId;
          tr.appendChild(tdId);

          const tdName = document.createElement('td');
          tdName.style.cssText = 'color: #fff; font-weight: 700; font-size: 12px;';
          tdName.textContent = g.name;
          tr.appendChild(tdName);

          const tdCost = document.createElement('td');
          tdCost.style.cssText = 'color: #ffd165; font-weight: 700; font-size: 12px;';
          tdCost.textContent = `💎 ${g.diamondCost}`;
          tr.appendChild(tdCost);

          const tdPower = document.createElement('td');
          tdPower.style.cssText = 'color: #38bdf8; font-size: 12px;';
          tdPower.textContent = g.power;
          tr.appendChild(tdPower);

          const tdCand = document.createElement('td');
          tdCand.style.cssText = `color: ${g.candidateBenefited === 'lula' ? '#f87171' : '#60a5fa'}; font-weight: 700; font-size: 12px;`;
          tdCand.textContent = g.candidateBenefited.toUpperCase();
          tr.appendChild(tdCand);

          const tdActions = document.createElement('td');
          const btnEdit = document.createElement('button');
          btnEdit.className = 'arcade-btn arcade-btn-dark arcade-btn-sm btn-edit-gift';
          btnEdit.setAttribute('data-giftid', g.giftId);
          btnEdit.textContent = 'Editar';
          tdActions.appendChild(btnEdit);
          tr.appendChild(tdActions);

          tbody.appendChild(tr);
        }
      }
    }
  }

  private populateMonitorTables(): void {
    this.populateTabTables(this.container);
  }

  // ==========================================
  // CONTEÚDO DA ABA CONFIGURAR
  // ==========================================
  private getCategoryTitle(cat: AdminConfigCategory): string {
    switch (cat) {
      case 'race': return 'Corrida (Pista e Duração)';
      case 'chat': return 'Chat e Regras Anti-Spam';
      case 'power': return 'Poderes e Presentes';
      case 'balance': return 'Equilíbrio e Rubber-Band';
      case 'auto': return 'Corrida Automática (Idle)';
      case 'presets': return 'Presets Rápidos de Prova';
      case 'candidates': return 'Gerenciamento dos Personagens';
      case 'gifts': return 'Tabela Oficial de Presentes';
    }
  }

  private renderCategoryContentHtml(): string {
    if (this.configCategory === 'presets') {
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="admin-param-card">
            <div class="admin-param-header">
              <span class="admin-param-name">PADRÃO 180s (100m)</span>
              <button class="arcade-btn arcade-btn-primary arcade-btn-sm preset-apply-btn" data-preset="180">Aplicar</button>
            </div>
            <p class="admin-param-desc">Duração alvo de 3 minutos em pista oficial de 100m. Calibrada para dinâmica completa de chat e super poderes.</p>
          </div>

          <div class="admin-param-card">
            <div class="admin-param-header">
              <span class="admin-param-name">TIRO CURTO 30s (100m)</span>
              <button class="arcade-btn arcade-btn-primary arcade-btn-sm preset-apply-btn" data-preset="30">Aplicar</button>
            </div>
            <p class="admin-param-desc">Sprint veloz de 30 segundos em 100m. Corrida dinâmica ideal para testes rápidos de engajamento.</p>
          </div>

          <div class="admin-param-card">
            <div class="admin-param-header">
              <span class="admin-param-name">TURBO 15s (50m)</span>
              <button class="arcade-btn arcade-btn-primary arcade-btn-sm preset-apply-btn" data-preset="15">Aplicar</button>
            </div>
            <p class="admin-param-desc">Super sprint em pista reduzida de 50 metros com duração de 15 segundos.</p>
          </div>
        </div>
      `;
    }

    if (this.configCategory === 'candidates') {
      const profiles = liveServiceMock.getCandidateProfiles();
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Lula 13 -->
          <div class="arcade-panel" style="padding: 12px; border-left: 4px solid ${profiles.lula.color};">
            <div style="font-family: var(--font-display); font-size: 13px; color: #f87171; font-weight: 700; margin-bottom: 8px;">CANDIDATO 1 (13)</div>
            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Nome:</label>
            <input type="text" id="admin-cand-name-lula" class="arcade-input" value="${escapeHtml(profiles.lula.name)}" style="width: 100%; margin-bottom: 8px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Número Eleitoral:</label>
            <input type="text" id="admin-cand-num-lula" class="arcade-input" value="${escapeHtml(profiles.lula.number)}" style="width: 100%; margin-bottom: 8px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Cor (Hex):</label>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <input type="color" id="admin-cand-color-picker-lula" value="${escapeHtml(profiles.lula.color)}" style="width: 34px; height: 30px; border: 1px solid #000; cursor: pointer; background: none; padding: 0;" />
              <input type="text" id="admin-cand-color-lula" class="arcade-input" value="${escapeHtml(profiles.lula.color)}" style="flex: 1;" />
            </div>

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">URL Avatar:</label>
            <input type="text" id="admin-cand-avatar-lula" class="arcade-input" value="${escapeHtml(profiles.lula.avatarUrl)}" style="width: 100%; margin-bottom: 12px;" />

            <button id="admin-btn-save-cand-lula" class="arcade-btn arcade-btn-danger" style="width: 100%;">Salvar Candidato 1</button>
          </div>

          <!-- Flávio 22 -->
          <div class="arcade-panel" style="padding: 12px; border-left: 4px solid ${profiles.flavio.color};">
            <div style="font-family: var(--font-display); font-size: 13px; color: #60a5fa; font-weight: 700; margin-bottom: 8px;">CANDIDATO 2 (22)</div>
            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Nome:</label>
            <input type="text" id="admin-cand-name-flavio" class="arcade-input" value="${escapeHtml(profiles.flavio.name)}" style="width: 100%; margin-bottom: 8px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Número Eleitoral:</label>
            <input type="text" id="admin-cand-num-flavio" class="arcade-input" value="${escapeHtml(profiles.flavio.number)}" style="width: 100%; margin-bottom: 8px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Cor (Hex):</label>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <input type="color" id="admin-cand-color-picker-flavio" value="${escapeHtml(profiles.flavio.color)}" style="width: 34px; height: 30px; border: 1px solid #000; cursor: pointer; background: none; padding: 0;" />
              <input type="text" id="admin-cand-color-flavio" class="arcade-input" value="${escapeHtml(profiles.flavio.color)}" style="flex: 1;" />
            </div>

            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">URL Avatar:</label>
            <input type="text" id="admin-cand-avatar-flavio" class="arcade-input" value="${escapeHtml(profiles.flavio.avatarUrl)}" style="width: 100%; margin-bottom: 12px;" />

            <button id="admin-btn-save-cand-flavio" class="arcade-btn" style="width: 100%; background: #2563eb; color: #fff;">Salvar Candidato 2</button>
          </div>
        </div>
      `;
    }

    if (this.configCategory === 'gifts') {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: #cbd5e1;">Mapeamento de presentes, custos e efeitos associados</span>
          <button id="admin-btn-reset-gifts" class="arcade-btn arcade-btn-dark arcade-btn-sm">Restaurar Padrão</button>
        </div>
        <table class="arcade-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NOME</th>
              <th>CUSTO</th>
              <th>EFEITO</th>
              <th>BENEFICIADO</th>
              <th>AÇÃO</th>
            </tr>
          </thead>
          <tbody id="admin-config-gifts-tbody"></tbody>
        </table>
      `;
    }

    // Categorias de Tuning
    const all = listTuning();
    const query = this.paramSearchQuery.toLowerCase();
    const filtered = all.filter((item) => {
      const matchesCat = item.path.startsWith(`${this.configCategory}.`);
      if (!matchesCat) return false;
      if (!query) return true;
      return item.path.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
    });

    const paramTitlesPt: Record<string, string> = {
      'race.targetDurationSec': 'Duração Alvo da Corrida',
      'race.trackLength': 'Comprimento da Pista',
      'race.intermissionSec': 'Tempo de Intervalo',
      'chat.minIntervalPerUserSec': 'Intervalo Mínimo por Usuário',
      'chat.maxLeadShiftPct': 'Teto de Deslocamento do Chat',
      'chat.pushSpeedPct': 'Impulso de Velocidade por Mensagem',
      'chat.pushDurationSec': 'Duração do Impulso do Chat',
      'power.impulseSpeedPct': 'Impulso de Velocidade (Rosa)',
      'power.impulseDurationSec': 'Duração do Impulso (Rosa)',
      'power.slipSlowdownPct': 'Redução por Escorregão (Banana)',
      'power.slipDurationSec': 'Duração do Escorregão (Banana)',
      'power.superStartSpeedPct': 'Super Arrancada (Donut/Capivara)',
      'power.superStartDurationSec': 'Duração da Super Arrancada',
      'power.tripSlowdownPct': 'Redução por Tropeço (Confete)',
      'power.tripDurationSec': 'Duração do Tropeço (Confete)',
      'power.shieldDurationSec': 'Duração do Escudo Protetor',
      'power.stackMaxFactor': 'Fator Máximo de Acúmulo de Efeito',
      'balance.rubberBandPct': 'Bônus Máximo de Rubber-Band',
      'balance.rubberBandGapPct': 'Distância Mínima para Rubber-Band',
      'auto.idleThresholdSec': 'Tempo de Espera para Modo Auto',
      'auto.paceVariationPct': 'Variação Natural de Ritmo',
      'auto.simulatePowers': 'Simular Poderes no Modo Auto',
      'auto.simulatePowersRatePerSec': 'Taxa de Poderes Simulados/s',
    };

    if (filtered.length === 0) {
      return `<div style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum parâmetro encontrado com a busca "${escapeHtml(this.paramSearchQuery)}".</div>`;
    }

    return filtered
      .map((item) => {
        const title = paramTitlesPt[item.path] || item.path;
        return `
          <div class="admin-param-card">
            <div class="admin-param-header">
              <span class="admin-param-name">${escapeHtml(title)}</span>
              <span class="admin-param-val" id="label-val-${item.path}">${item.value} ${item.unit}</span>
            </div>
            <div class="admin-param-key">${item.path} (Padrão: ${item.default} ${item.unit})</div>
            <div class="admin-param-desc">${escapeHtml(item.desc)}</div>
            <input
              type="range"
              class="admin-param-slider arcade-tuning-slider"
              data-path="${item.path}"
              min="${item.min}"
              max="${item.max}"
              step="${item.unit === '%' || item.unit === 's' ? '0.5' : '1'}"
              value="${item.value}"
              aria-label="${escapeHtml(title)}"
            />
          </div>
        `;
      })
      .join('');
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  private bindEvents(): void {
    // 1. Alternância de Abas Principais (Operar vs Configurar)
    document.getElementById('admin-nav-operar')?.addEventListener('click', () => {
      this.currentSection = 'operar';
      this.container.innerHTML = this.renderHtml();
      this.populateMonitorTables();
      this.bindEvents();
    });

    document.getElementById('admin-nav-configurar')?.addEventListener('click', () => {
      this.currentSection = 'configurar';
      this.container.innerHTML = this.renderHtml();
      this.populateMonitorTables();
      this.bindEvents();
    });

    // 2. Controles de Corrida no Cabeçalho
    document.getElementById('admin-btn-start')?.addEventListener('click', () => this.engine.startRace());
    document.getElementById('admin-btn-pause')?.addEventListener('click', () => {
      const paused = this.engine.getState().isPaused;
      this.engine.setPaused(!paused);
    });
    document.getElementById('admin-btn-reset')?.addEventListener('click', () => this.engine.resetRace());

    // 3. Botão Ajustar Placar (Modal)
    document.getElementById('admin-btn-open-score-modal')?.addEventListener('click', () => {
      this.showScoreModal = true;
      this.container.innerHTML = this.renderHtml();
      this.populateMonitorTables();
      this.bindEvents();
    });

    // 4. CRT Toggle
    document.getElementById('admin-btn-toggle-crt')?.addEventListener('click', () => {
      this.isCrtActive = !this.isCrtActive;
      const overlay = document.getElementById('admin-crt-overlay');
      if (overlay) overlay.classList.toggle('active', this.isCrtActive);
    });

    // 5. Bloco Conexão (Reconectar / Derrubar)
    document.getElementById('admin-btn-reconnect')?.addEventListener('click', () => {
      liveServiceMock.reconnect();
    });
    document.getElementById('admin-btn-disconnect')?.addEventListener('click', () => {
      liveServiceMock.disconnect();
    });

    // 6. Bloco Simular Recolhível
    document.getElementById('admin-toggle-simular')?.addEventListener('click', () => {
      this.isSimulateAccordionOpen = !this.isSimulateAccordionOpen;
      const body = document.getElementById('admin-simular-body');
      const arrow = document.getElementById('admin-simular-arrow');
      if (body) body.classList.toggle('collapsed', !this.isSimulateAccordionOpen);
      if (arrow) arrow.textContent = this.isSimulateAccordionOpen ? '▲' : '▼';
    });

    // Chat 13 / 22 e Spams
    document.getElementById('admin-btn-chat-13')?.addEventListener('click', () => {
      this.triggerPushVisual('lula');
      this.spawnFloatingCombatText('lula', '💬 +1 VOTO!', '#f87171');
      this.engine.handleEvent({
        type: 'chat',
        userId: `op_lula_${Date.now()}`,
        candidateId: 'lula',
        timestamp: Date.now(),
      });
      liveServiceMock.recordChatMessage({
        userId: `user_${Date.now()}`,
        userName: '@apoiador_13',
        candidateNumber: '13',
        message: 'Lula 13!',
        timestamp: Date.now(),
      });
      if (this.activeMonitorTab === 'telemetry' || this.activeMonitorTab === 'chat') {
        this.populateMonitorTables();
      }
    });

    document.getElementById('admin-btn-chat-22')?.addEventListener('click', () => {
      this.triggerPushVisual('flavio');
      this.spawnFloatingCombatText('flavio', '💬 +1 VOTO!', '#60a5fa');
      this.engine.handleEvent({
        type: 'chat',
        userId: `op_flavio_${Date.now()}`,
        candidateId: 'flavio',
        timestamp: Date.now(),
      });
      liveServiceMock.recordChatMessage({
        userId: `user_${Date.now()}`,
        userName: '@apoiador_22',
        candidateNumber: '22',
        message: 'Flávio 22!',
        timestamp: Date.now(),
      });
      if (this.activeMonitorTab === 'telemetry' || this.activeMonitorTab === 'chat') {
        this.populateMonitorTables();
      }
    });

    // Toggle Spam Lula
    document.getElementById('admin-btn-spam-lula')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      if (this.spamLulaInterval) {
        clearInterval(this.spamLulaInterval);
        this.spamLulaInterval = null;
        btn.classList.remove('arcade-btn-primary');
      } else {
        btn.classList.add('arcade-btn-primary');
        this.spamLulaInterval = setInterval(() => {
          this.triggerPushVisual('lula');
          this.engine.handleEvent({
            type: 'chat',
            userId: `spam_lula_${Date.now()}`,
            candidateId: 'lula',
            timestamp: Date.now(),
          });
          liveServiceMock.recordChatMessage({
            userId: `spam_lula_${Date.now()}`,
            userName: '@espectador_13',
            candidateNumber: '13',
            message: '13!',
            timestamp: Date.now(),
          });
        }, 100);
      }
    });

    // Toggle Spam Flávio
    document.getElementById('admin-btn-spam-flavio')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      if (this.spamFlavioInterval) {
        clearInterval(this.spamFlavioInterval);
        this.spamFlavioInterval = null;
        btn.classList.remove('arcade-btn-primary');
      } else {
        btn.classList.add('arcade-btn-primary');
        this.spamFlavioInterval = setInterval(() => {
          this.triggerPushVisual('flavio');
          this.engine.handleEvent({
            type: 'chat',
            userId: `spam_flavio_${Date.now()}`,
            candidateId: 'flavio',
            timestamp: Date.now(),
          });
          liveServiceMock.recordChatMessage({
            userId: `spam_flavio_${Date.now()}`,
            userName: '@espectador_22',
            candidateNumber: '22',
            message: '22!',
            timestamp: Date.now(),
          });
        }, 100);
      }
    });

    // Presentes rápidos da coluna esquerda
    this.container.querySelectorAll('.quick-gift-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const giftId = (e.currentTarget as HTMLElement).getAttribute('data-gift');
        if (!giftId) return;
        const mapping = giftRegistry.get(giftId);
        if (!mapping) return;

        let targetCand = mapping.candidateBenefited;
        let badgeText = `⚡ ${mapping.name.toUpperCase()}`;
        let badgeColor = '#ffd165';

        if (mapping.power === 'superStart') {
          badgeText = '⚡ SUPER ARRANCADA!';
          badgeColor = '#ffd165';
        } else if (mapping.power === 'shield') {
          badgeText = '🛡️ ESCUDO ATIVO!';
          badgeColor = '#38bdf8';
        } else if (mapping.power === 'slip') {
          targetCand = mapping.candidateBenefited === 'lula' ? 'flavio' : 'lula';
          badgeText = '🍌 CASCA DE BANANA!';
          badgeColor = '#facc15';
        } else if (mapping.power === 'trip') {
          targetCand = mapping.candidateBenefited === 'lula' ? 'flavio' : 'lula';
          badgeText = '🥊 RASTEIRA!';
          badgeColor = '#f87171';
        } else if (mapping.power === 'impulse') {
          badgeText = '🚀 IMPULSO!';
          badgeColor = mapping.candidateBenefited === 'lula' ? '#fca5a5' : '#93c5fd';
        }

        this.triggerPushVisual(mapping.candidateBenefited);
        this.spawnFloatingCombatText(targetCand, badgeText, badgeColor);
        this.engine.handleEvent({
          type: 'gift',
          userId: `donor_${Date.now()}`,
          giftId,
          repeatCount: 1,
          candidateBenefited: mapping.candidateBenefited,
          power: mapping.power,
          timestamp: Date.now(),
        });

        liveServiceMock.recordDonation({
          userId: `donor_${Date.now()}`,
          userName: `@doador_${mapping.candidateBenefited}`,
          giftId,
          giftName: mapping.name,
          diamonds: mapping.diamondCost,
          timestamp: Date.now(),
        });

        if (this.activeMonitorTab === 'telemetry' || this.activeMonitorTab === 'ranking') {
          this.populateMonitorTables();
        }
      });
    });

    // Abas do Monitor
    this.container.querySelectorAll('.admin-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        if (tab) {
          this.activeMonitorTab = tab;
          const content = document.getElementById('admin-monitor-content');
          if (content) content.innerHTML = this.renderMonitorTabContentHtml();
          this.container.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.remove('active'));
          (e.currentTarget as HTMLElement).classList.add('active');
          this.populateMonitorTables();
          this.bindMonitorActions();
        }
      });
    });
    this.bindMonitorActions();

    // Abas e Categorias de Configuração
    this.container.querySelectorAll('.admin-category-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-category') as any;
        if (cat) {
          this.configCategory = cat;
          this.container.innerHTML = this.renderHtml();
          this.populateMonitorTables();
          this.bindEvents();
        }
      });
    });

    // Presets
    this.container.querySelectorAll('.preset-apply-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).getAttribute('data-preset') as '180' | '30' | '15';
        this.applyPreset(preset);
      });
    });

    // Sliders de Tuning
    this.bindTuningSliders();

    // Busca de Parâmetros
    document.getElementById('admin-config-search')?.addEventListener('input', (e) => {
      this.paramSearchQuery = (e.target as HTMLInputElement).value;
      const content = document.getElementById('admin-config-content');
      if (content) content.innerHTML = this.renderCategoryContentHtml();
      this.bindTuningSliders();
    });

    // Restaurar Categoria Atual
    document.getElementById('admin-btn-reset-tuning-category')?.addEventListener('click', () => {
      if (confirm(`Confirma restaurar os parâmetros de ${this.getCategoryTitle(this.configCategory)} para os valores padrão?`)) {
        const all = listTuning();
        all.forEach((item) => {
          if (item.path.startsWith(`${this.configCategory}.`)) {
            resetTuning(item.path);
          }
        });
        this.updateTuningValues();
      }
    });

    // Personagens: Salvar Lula e Flávio
    document.getElementById('admin-btn-save-cand-lula')?.addEventListener('click', () => {
      const name = (document.getElementById('admin-cand-name-lula') as HTMLInputElement)?.value;
      const number = (document.getElementById('admin-cand-num-lula') as HTMLInputElement)?.value;
      const color = (document.getElementById('admin-cand-color-lula') as HTMLInputElement)?.value;
      const avatarUrl = (document.getElementById('admin-cand-avatar-lula') as HTMLInputElement)?.value;
      liveServiceMock.updateCandidateProfile('lula', { name, number, color, avatarUrl });
      alert('Perfil de Lula atualizado!');
    });

    document.getElementById('admin-btn-save-cand-flavio')?.addEventListener('click', () => {
      const name = (document.getElementById('admin-cand-name-flavio') as HTMLInputElement)?.value;
      const number = (document.getElementById('admin-cand-num-flavio') as HTMLInputElement)?.value;
      const color = (document.getElementById('admin-cand-color-flavio') as HTMLInputElement)?.value;
      const avatarUrl = (document.getElementById('admin-cand-avatar-flavio') as HTMLInputElement)?.value;
      liveServiceMock.updateCandidateProfile('flavio', { name, number, color, avatarUrl });
      alert('Perfil de Flávio atualizado!');
    });

    // Sincronizar Color Pickers
    const pickerLula = document.getElementById('admin-cand-color-picker-lula') as HTMLInputElement;
    const inputLula = document.getElementById('admin-cand-color-lula') as HTMLInputElement;
    pickerLula?.addEventListener('input', () => {
      if (inputLula) inputLula.value = pickerLula.value;
    });

    const pickerFlavio = document.getElementById('admin-cand-color-picker-flavio') as HTMLInputElement;
    const inputFlavio = document.getElementById('admin-cand-color-flavio') as HTMLInputElement;
    pickerFlavio?.addEventListener('input', () => {
      if (inputFlavio) inputFlavio.value = pickerFlavio.value;
    });

    // Reset Presentes Padrão
    document.getElementById('admin-btn-reset-gifts')?.addEventListener('click', () => {
      if (confirm('Restaurar a tabela oficial de presentes para os valores padrão?')) {
        giftRegistry.reset();
        this.populateMonitorTables();
      }
    });

    // Modal de Placar
    if (this.showScoreModal) {
      document.getElementById('modal-btn-cancel-score')?.addEventListener('click', () => {
        this.showScoreModal = false;
        this.container.innerHTML = this.renderHtml();
        this.populateMonitorTables();
        this.bindEvents();
      });

      document.getElementById('modal-btn-save-scores')?.addEventListener('click', () => {
        const lula = parseInt((document.getElementById('modal-score-session-lula') as HTMLInputElement).value, 10) || 0;
        const flavio = parseInt((document.getElementById('modal-score-session-flavio') as HTMLInputElement).value, 10) || 0;
        this.engine.setScores({ session: { lula, flavio } });
        this.showScoreModal = false;
        this.container.innerHTML = this.renderHtml();
        this.populateMonitorTables();
        this.bindEvents();
      });

      document.getElementById('modal-btn-reset-session')?.addEventListener('click', () => {
        if (confirm('Confirma zerar o placar da sessão atual?')) {
          this.engine.resetScores(false);
          this.showScoreModal = false;
          this.container.innerHTML = this.renderHtml();
          this.populateMonitorTables();
          this.bindEvents();
        }
      });

      document.getElementById('modal-btn-reset-total')?.addEventListener('click', () => {
        if (confirm('ATENÇÃO: Confirma zerar o placar TOTAL acumulado?')) {
          this.engine.resetScores(true);
          this.showScoreModal = false;
          this.container.innerHTML = this.renderHtml();
          this.populateMonitorTables();
          this.bindEvents();
        }
      });
    }

    // Modal de Edição de Presente
    if (this.showGiftModal) {
      document.getElementById('btn-cancel-gift-modal')?.addEventListener('click', () => {
        this.showGiftModal = null;
        this.container.innerHTML = this.renderHtml();
        this.populateMonitorTables();
        this.bindEvents();
      });

      document.getElementById('form-edit-gift')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const giftId = this.showGiftModal!;
        const name = (document.getElementById('gift-edit-name') as HTMLInputElement).value;
        const diamondCost = parseInt((document.getElementById('gift-edit-diamonds') as HTMLInputElement).value, 10) || 1;
        const power = (document.getElementById('gift-edit-power') as HTMLSelectElement).value as any;
        const candidateBenefited = (document.getElementById('gift-edit-candidate') as HTMLSelectElement).value as any;

        giftRegistry.update(giftId, { name, diamondCost, power, candidateBenefited });
        this.showGiftModal = null;
        this.container.innerHTML = this.renderHtml();
        this.populateMonitorTables();
        this.bindEvents();
      });
    }
  }

  private bindMonitorActions(): void {
    // Filtros de Log
    this.container.querySelectorAll('.log-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filter = (e.currentTarget as HTMLElement).getAttribute('data-filter') as any;
        if (filter) {
          this.logFilter = filter;
          this.populateMonitorTables();
          this.container.querySelectorAll('.log-filter-btn').forEach((b) => b.classList.remove('arcade-btn-primary'));
          (e.currentTarget as HTMLElement).classList.add('arcade-btn-primary');
        }
      });
    });

    // Filtros de Janela de Doadores
    this.container.querySelectorAll('.donor-window-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const windowVal = (e.currentTarget as HTMLElement).getAttribute('data-window') as any;
        if (windowVal) {
          this.donorWindow = windowVal;
          this.populateMonitorTables();
          this.container.querySelectorAll('.donor-window-btn').forEach((b) => b.classList.remove('arcade-btn-primary'));
          (e.currentTarget as HTMLElement).classList.add('arcade-btn-primary');
        }
      });
    });

    // Limpar e Exportar Logs
    document.getElementById('admin-btn-clear-logs')?.addEventListener('click', () => {
      this.engine.clearLogs();
      this.populateMonitorTables();
    });

    document.getElementById('admin-btn-export-logs')?.addEventListener('click', () => {
      const logs = this.engine.getLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrida_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Botões Editar Presente
    this.container.querySelectorAll('.btn-edit-gift').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const giftId = (e.currentTarget as HTMLElement).getAttribute('data-giftid');
        if (giftId) {
          this.showGiftModal = giftId;
          this.container.innerHTML = this.renderHtml();
          this.populateMonitorTables();
          this.bindEvents();
        }
      });
    });
  }

  private bindTuningSliders(): void {
    this.container.querySelectorAll('.arcade-tuning-slider').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const path = target.getAttribute('data-path') as TuningPath;
        const val = parseFloat(target.value);
        setTuning(path, val);
        const lbl = document.getElementById(`label-val-${path}`);
        if (lbl) {
          const item = listTuning().find((i) => i.path === path);
          lbl.textContent = `${val} ${item?.unit || ''}`;
        }
      });
    });
  }

  private applyPreset(preset: '180' | '30' | '15'): void {
    if (preset === '180') {
      setTuning('race.targetDurationSec', 180);
      setTuning('race.trackLength', 100);
    } else if (preset === '30') {
      setTuning('race.targetDurationSec', 30);
      setTuning('race.trackLength', 100);
    } else if (preset === '15') {
      setTuning('race.targetDurationSec', 15);
      setTuning('race.trackLength', 50);
    }
    this.engine.resetRace();
    this.container.innerHTML = this.renderHtml();
    this.populateMonitorTables();
    this.bindEvents();
  }

  // ==========================================
  // EFEITOS VISUAIS TÁTEIS & FEEDBACK
  // ==========================================
  private triggerPushVisual(candidate: 'lula' | 'flavio'): void {
    const lane = document.getElementById(candidate === 'lula' ? 'lane-preview-lula' : 'lane-preview-flavio');
    if (lane) {
      lane.style.background = candidate === 'lula' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
      setTimeout(() => {
        lane.style.background = candidate === 'lula' ? 'rgba(220, 38, 38, 0.05)' : 'rgba(37, 99, 235, 0.05)';
      }, 300);
    }
  }

  private spawnFloatingCombatText(candidate: 'lula' | 'flavio', label: string, color: string): void {
    const lane = document.getElementById(candidate === 'lula' ? 'lane-preview-lula' : 'lane-preview-flavio');
    if (!lane) return;

    const existing = lane.querySelectorAll('.arcade-float-badge');
    if (existing.length >= 2) {
      existing[0].remove();
    }

    const badge = document.createElement('div');
    badge.className = 'arcade-float-badge';
    badge.style.color = color;
    badge.textContent = label;
    lane.appendChild(badge);

    setTimeout(() => {
      badge.remove();
    }, 750);
  }

  // ==========================================
  // ATUALIZAÇÃO DINÂMICA (60FPS)
  // ==========================================
  private updateDynamicState(): void {
    const state = this.engine.getState();
    const scores = this.engine.getScores();
    const liveStatus = liveServiceMock.getConnectionStatus();
    const candidates = liveServiceMock.getCandidateProfiles();
    const trackLength = state.trackLength || getTuning('race.trackLength') || 100;
    const targetDur = getTuning('race.targetDurationSec') || 180;

    // 1. Cronômetro Principal (tempo atual / tempo-alvo)
    const timerEl = document.getElementById('admin-main-timer');
    if (timerEl) {
      const curM = Math.floor(state.elapsedTimeSec / 60);
      const curS = Math.floor(state.elapsedTimeSec % 60);
      const tarM = Math.floor(targetDur / 60);
      const tarS = Math.floor(targetDur % 60);
      timerEl.textContent = `${String(curM).padStart(2, '0')}:${String(curS).padStart(2, '0')} / ${String(tarM).padStart(2, '0')}:${String(tarS).padStart(2, '0')}`;
    }

    // 2. Placar em texto simples
    const scoreTextEl = document.getElementById('admin-score-text');
    if (scoreTextEl) {
      scoreTextEl.textContent = `13 ${candidates.lula.name.toUpperCase()} ${scores.session.lula} × ${scores.session.flavio} ${candidates.flavio.name.toUpperCase()} 22`;
    }

    // 3. Status da corrida
    const statusBadge = document.getElementById('admin-race-status-badge');
    if (statusBadge) {
      let statusText = this.translateRaceStatus(state.status);
      if (state.isPaused) statusText = 'PAUSADA';
      else if (state.status === 'intermission') statusText = `INTERVALO (${Math.ceil(state.intermissionRemainingSec)}s)`;
      statusBadge.textContent = statusText;
    }

    // 4. Corredor e telemetria Lula
    const lula = state.candidates.lula;
    const lulaPct = Math.min(100, Math.max(0, Math.round((lula.position / trackLength) * 100)));
    const spriteLula = document.getElementById('admin-preview-runner-lula');
    if (spriteLula) {
      // Movimento vertical minimalista permanente
      spriteLula.style.bottom = `calc(12px + ${(lulaPct * 0.78).toFixed(1)}%)`;
    }
    const spdLula = document.getElementById('admin-speed-lula');
    if (spdLula) spdLula.textContent = `${lula.currentSpeed.toFixed(2)} m/s`;
    const posLula = document.getElementById('admin-pos-lula');
    if (posLula) posLula.textContent = `${lula.position.toFixed(1)}m`;
    const pctLula = document.getElementById('admin-pct-lula');
    if (pctLula) pctLula.textContent = `${lulaPct}%`;
    const barLula = document.getElementById('admin-bar-lula');
    if (barLula) barLula.style.width = `${lulaPct}%`;

    const effLula = document.getElementById('admin-effects-lula');
    if (effLula) {
      const effList = lula.activeEffects.map((e) => `${e.type.toUpperCase()} (${e.remainingDurationSec.toFixed(1)}s)`);
      if (lula.hasShield) effList.push(`ESCUDO (${lula.shieldRemainingDurationSec.toFixed(1)}s)`);
      effLula.textContent = effList.length > 0 ? effList.join(', ') : 'Nenhum';
    }

    // 5. Corredor e telemetria Flávio
    const flavio = state.candidates.flavio;
    const flavioPct = Math.min(100, Math.max(0, Math.round((flavio.position / trackLength) * 100)));
    const spriteFlavio = document.getElementById('admin-preview-runner-flavio');
    if (spriteFlavio) {
      spriteFlavio.style.bottom = `calc(12px + ${(flavioPct * 0.78).toFixed(1)}%)`;
    }
    const spdFlavio = document.getElementById('admin-speed-flavio');
    if (spdFlavio) spdFlavio.textContent = `${flavio.currentSpeed.toFixed(2)} m/s`;
    const posFlavio = document.getElementById('admin-pos-flavio');
    if (posFlavio) posFlavio.textContent = `${flavio.position.toFixed(1)}m`;
    const pctFlavio = document.getElementById('admin-pct-flavio');
    if (pctFlavio) pctFlavio.textContent = `${flavioPct}%`;
    const barFlavio = document.getElementById('admin-bar-flavio');
    if (barFlavio) barFlavio.style.width = `${flavioPct}%`;

    const effFlavio = document.getElementById('admin-effects-flavio');
    if (effFlavio) {
      const effList = flavio.activeEffects.map((e) => `${e.type.toUpperCase()} (${e.remainingDurationSec.toFixed(1)}s)`);
      if (flavio.hasShield) effList.push(`ESCUDO (${flavio.shieldRemainingDurationSec.toFixed(1)}s)`);
      effFlavio.textContent = effList.length > 0 ? effList.join(', ') : 'Nenhum';
    }

    // 6. Tempo conectado
    const durLiveEl = document.getElementById('admin-live-duration');
    if (durLiveEl && liveStatus.state === 'connected') {
      const totalSec = Math.floor(liveStatus.connectedDurationSec + state.elapsedTimeSec);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      durLiveEl.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
    }
  }

  private updateTuningValues(): void {
    listTuning().forEach((p) => {
      const lbl = document.getElementById(`label-val-${p.path}`);
      if (lbl) lbl.textContent = `${p.value} ${p.unit}`;
      const input = this.container.querySelector(`input[data-path="${p.path}"]`) as HTMLInputElement;
      if (input && document.activeElement !== input) {
        input.value = String(p.value);
      }
    });
  }

  private updateConnectionDisplay(): void {
    const liveStatus = liveServiceMock.getConnectionStatus();
    const liveBadge = document.getElementById('admin-live-badge');
    if (liveBadge) {
      liveBadge.textContent = this.translateLiveState(liveStatus.state);
    }
    const recEl = document.getElementById('admin-live-reconnects');
    if (recEl) recEl.textContent = String(liveStatus.reconnectCount);
  }

  private updateCandidateProfilesDisplay(): void {
    const profiles = liveServiceMock.getCandidateProfiles();
    const lblLula = document.getElementById('label-card-lula');
    if (lblLula) lblLula.textContent = `${profiles.lula.number} ${profiles.lula.name.toUpperCase()}`;
    const lblFlavio = document.getElementById('label-card-flavio');
    if (lblFlavio) lblFlavio.textContent = `${profiles.flavio.number} ${profiles.flavio.name.toUpperCase()}`;

    const bodyLula = document.getElementById('admin-runner-body-lula');
    if (bodyLula) bodyLula.style.background = profiles.lula.color;
    const bodyFlavio = document.getElementById('admin-runner-body-flavio');
    if (bodyFlavio) bodyFlavio.style.background = profiles.flavio.color;
  }

  // ==========================================
  // HELPERS DE TRADUÇÃO
  // ==========================================
  private translateLiveState(state: string): string {
    switch (state) {
      case 'connected': return 'CONECTADO';
      case 'reconnecting': return 'RECONECTANDO';
      case 'disconnected': return 'DESCONECTADO';
      default: return state.toUpperCase();
    }
  }

  private translateRaceStatus(status: string): string {
    switch (status) {
      case 'waiting':
      case 'idle':
        return 'AGUARDANDO';
      case 'running':
        return 'CORRENDO';
      case 'finished':
        return 'FINALIZADA';
      case 'intermission':
        return 'INTERVALO';
      default:
        return status.toUpperCase();
    }
  }

  // ==========================================
  // MODAIS (PLACAR & PRESENTE)
  // ==========================================
  private renderScoreModalHtml(): string {
    const scores = this.engine.getScores();

    return `
      <div class="arcade-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-score-title">
        <div class="arcade-modal-dialog">
          <div id="modal-score-title" class="arcade-modal-title">
            AJUSTAR PLACAR DA CORRIDA
          </div>
          <div style="font-size: 12px; color: #cbd5e1;">
            Modifique as vitórias acumuladas na sessão ou zere os contadores:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label for="modal-score-session-lula" style="color: #f87171; font-weight: 700; font-size: 12px;">Vitórias Lula (Sessão):</label>
              <input type="number" id="modal-score-session-lula" class="arcade-input tabular-nums" style="width: 80px;" value="${scores.session.lula}" min="0" aria-label="Vitórias de Lula na Sessão" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label for="modal-score-session-flavio" style="color: #60a5fa; font-weight: 700; font-size: 12px;">Vitórias Flávio (Sessão):</label>
              <input type="number" id="modal-score-session-flavio" class="arcade-input tabular-nums" style="width: 80px;" value="${scores.session.flavio}" min="0" aria-label="Vitórias de Flávio na Sessão" />
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button id="modal-btn-save-scores" class="arcade-btn arcade-btn-green">SALVAR VALORES DO PLACAR</button>
            <div style="display: flex; gap: 6px;">
              <button id="modal-btn-reset-session" class="arcade-btn arcade-btn-amber arcade-btn-sm" style="flex: 1;">ZERAR SESSÃO</button>
              <button id="modal-btn-reset-total" class="arcade-btn arcade-btn-danger arcade-btn-sm" style="flex: 1;">ZERAR TOTAL</button>
            </div>
            <button id="modal-btn-cancel-score" class="arcade-btn arcade-btn-dark arcade-btn-sm">FECHAR</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGiftModalHtml(giftId: string): string {
    const gift = giftRegistry.get(giftId);
    if (!gift) return '';

    return `
      <div class="arcade-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-gift-title">
        <div class="arcade-modal-dialog">
          <div id="modal-gift-title" class="arcade-modal-title">
            EDITAR PRESENTE: ${escapeHtml(gift.name.toUpperCase())}
          </div>
          <form id="form-edit-gift" style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label for="gift-edit-name" style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Nome:</label>
              <input type="text" id="gift-edit-name" class="arcade-input" value="${escapeHtml(gift.name)}" style="width: 100%;" />
            </div>
            <div>
              <label for="gift-edit-diamonds" style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Custo em Diamantes:</label>
              <input type="number" id="gift-edit-diamonds" class="arcade-input tabular-nums" value="${gift.diamondCost}" min="1" style="width: 100%;" />
            </div>
            <div>
              <label for="gift-edit-power" style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Efeito:</label>
              <select id="gift-edit-power" class="arcade-input" style="width: 100%;">
                <option value="impulse" ${gift.power === 'impulse' ? 'selected' : ''}>impulse (Aceleração)</option>
                <option value="slip" ${gift.power === 'slip' ? 'selected' : ''}>slip (Casca de banana)</option>
                <option value="superStart" ${gift.power === 'superStart' ? 'selected' : ''}>superStart (Super arrancada)</option>
                <option value="trip" ${gift.power === 'trip' ? 'selected' : ''}>trip (Tropeço / Rasteira)</option>
                <option value="shield" ${gift.power === 'shield' ? 'selected' : ''}>shield (Escudo)</option>
              </select>
            </div>
            <div>
              <label for="gift-edit-candidate" style="font-size: 12px; color: #cbd5e1; font-weight: 700; display: block; margin-bottom: 2px;">Candidato Beneficiado:</label>
              <select id="gift-edit-candidate" class="arcade-input" style="width: 100%;">
                <option value="lula" ${gift.candidateBenefited === 'lula' ? 'selected' : ''}>Lula (13)</option>
                <option value="flavio" ${gift.candidateBenefited === 'flavio' ? 'selected' : ''}>Flávio (22)</option>
              </select>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <button type="submit" class="arcade-btn arcade-btn-green" style="flex: 1;">SALVAR</button>
              <button type="button" id="btn-cancel-gift-modal" class="arcade-btn arcade-btn-dark" style="flex: 1;">CANCELAR</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
