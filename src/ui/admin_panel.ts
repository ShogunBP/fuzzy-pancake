import { giftRegistry } from '../config/gifts';
import { getTuning, listTuning, onTuningChange, resetTuning, setTuning, type TuningPath } from '../config/tuning';
import { liveServiceMock } from '../core/live_service_mock';
import type { RaceEngine } from '../core/race_engine';
import { ADMIN_STYLES } from './admin_styles';

export const ADMIN_DEFAULT_PIN = '2026';

export class AdminPanel {
  private engine: RaceEngine;
  private container: HTMLElement;
  private unsubscribeTuning?: () => void;
  private unsubscribeLiveConnection?: () => void;
  private unsubscribeLiveData?: () => void;
  private unsubscribeLiveCandidate?: () => void;

  private activeTab: 'telemetry' | 'ranking' | 'chat' | 'candidates' | 'gifts' = 'telemetry';
  private paramSearchQuery = '';
  private logFilter: 'all' | 'applied' | 'ignored' | 'chat' | 'gifts' | 'system' = 'all';
  private donorWindow: 'session' | '15m' = 'session';
  private isAuthenticated = false;
  private activePreset: '180' | '30' | '15' = '180';
  private showScoreModal = false;
  private showGiftModal: string | null = null; // giftId para edição
  private isCrtActive = false;
  private spamLulaInterval: any = null;
  private spamFlavioInterval: any = null;
  private collapsedGroups: Set<string> = new Set();

  constructor(engine: RaceEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.isAuthenticated = sessionStorage.getItem('admin_auth_token') === 'authorized';
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

    if (!this.isAuthenticated) {
      this.renderAuthScreen();
      return;
    }

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
  // TELA DE AUTENTICAÇÃO
  // ==========================================
  private renderAuthScreen(errorMessage = ''): void {
    this.container.innerHTML = `
      <div class="admin-auth-overlay">
        <div class="admin-auth-card">
          <div class="admin-auth-header">
            <div class="font-pixel" style="font-size: 13px; color: var(--admin-primary); margin-bottom: 6px;">
              ★ OPERATOR ACCESS ★
            </div>
            <div style="font-size: 11px; color: var(--admin-outline);">
              PAINEL ADMIN DA LIVE (PRESIDENTIAL SPRINT)
            </div>
          </div>

          <div style="font-size: 11px; color: #dfe2f1; text-align: center;">
            Insira o PIN de segurança para operar a live e telemetria:
          </div>

          <form id="admin-auth-form" style="display: flex; flex-direction: column; gap: 12px;">
            <input
              type="password"
              id="admin-pin-input"
              class="arcade-input font-pixel admin-auth-pin"
              placeholder="••••"
              maxlength="8"
              autocomplete="off"
              autofocus
            />

            ${
              errorMessage
                ? `<div id="admin-auth-error" class="font-pixel" style="font-size: 9px; color: #ef4444; background: #450a0a; padding: 6px; border: 1px solid #dc2626;">
                    ${errorMessage}
                  </div>`
                : ''
            }

            <button type="submit" class="arcade-btn arcade-btn-primary" style="padding: 10px; font-size: 12px;">
              DESBLOQUEAR COCKPIT
            </button>
            <div style="font-size: 9px; color: #64748b; font-family: monospace;">
              PIN padrão do operador: 2026
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('admin-auth-form');
    const input = document.getElementById('admin-pin-input') as HTMLInputElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = input?.value?.trim();
      if (pin === ADMIN_DEFAULT_PIN) {
        this.isAuthenticated = true;
        sessionStorage.setItem('admin_auth_token', 'authorized');
        this.renderCockpit();
      } else {
        this.renderAuthScreen('PIN INCORRETO. TENTE NOVAMENTE.');
      }
    });
  }

  // ==========================================
  // RENDERIZAÇÃO DO COCKPIT COMPLETO
  // ==========================================
  private renderCockpit(): void {
    this.container.innerHTML = this.renderHtml();
    this.bindEvents();

    this.unsubscribeTuning = onTuningChange(() => {
      this.updateTuningValues();
    });

    this.unsubscribeLiveConnection = liveServiceMock.onConnectionChange(() => {
      this.updateConnectionDisplay();
    });

    this.unsubscribeLiveData = liveServiceMock.onDataChange(() => {
      if (this.activeTab === 'ranking' || this.activeTab === 'chat') {
        this.updateTabContent();
      }
    });

    this.unsubscribeLiveCandidate = liveServiceMock.onCandidateChange(() => {
      this.updateCandidateProfilesDisplay();
    });

    // Loop de atualização constante (60fps)
    const updateLoop = () => {
      if (this.isAuthenticated && document.body.contains(this.container)) {
        this.updateDynamicState();
        requestAnimationFrame(updateLoop);
      }
    };
    requestAnimationFrame(updateLoop);
  }

  private renderHtml(): string {
    const scores = this.engine.getScores();
    const liveStatus = liveServiceMock.getConnectionStatus();
    const candidates = liveServiceMock.getCandidateProfiles();

    return `
      <div id="admin-root">
        <!-- CRT Scanline Global Overlay -->
        <div class="crt-overlay ${this.isCrtActive ? 'active' : ''}" id="admin-crt-overlay"></div>

        <!-- HEADER DO OPERADOR -->
        <header class="admin-header">
          <div class="admin-header-title">
            <div class="admin-badge-icon">★</div>
            <div>
              <div class="font-pixel" style="font-size: 14px; color: var(--admin-primary); display: flex; align-items: center; gap: 8px;">
                PRESIDENTIAL SPRINT '26
                <span class="font-pixel" style="font-size: 11px; background: #064e3b; color: #34d399; padding: 2px 6px; border: 1px solid #059669;">
                  OPERADOR
                </span>
              </div>
              <div style="font-size: 11px; color: var(--admin-outline); display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                <span>ARCADE TELEMETRY ARENA</span>
                <span style="display: inline-flex; align-items: center; gap: 4px; color: #22c55e; font-size: 11px;" class="font-pixel">
                  <span style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%; display: inline-block;"></span>
                  60 FPS
                </span>
              </div>
            </div>
          </div>

          <!-- PLACAR CENTRAL: LULA vs FLÁVIO COM AJUSTE RÁPIDO -->
          <div class="arcade-panel" style="display: flex; align-items: center; padding: 6px 12px; gap: 10px; background: #000; border: 2px solid #000; box-shadow: 2px 2px 0 0 #000;">
            <!-- Lula 13 -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="font-pixel" style="font-size: 11px; background: #dc2626; color: #fff; padding: 2px 5px; border: 1px solid #000; box-shadow: 1px 1px 0 #000;">13</span>
              <span class="font-pixel" style="font-size: 12px; color: #f87171;" id="header-cand-name-lula">${candidates.lula.name.toUpperCase()}:</span>
              <span id="admin-score-lula" class="font-pixel" style="font-size: 16px; color: #fff;">${scores.session.lula}</span>
              <span style="font-size: 14px; color: #ffd165;">★</span>
              <div style="display: flex; flex-direction: column; gap: 1px;">
                <button id="btn-score-lula-inc" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 1px 4px; line-height: 1;" title="+1 Vitória Lula" aria-label="Incrementar vitórias Lula">▲</button>
                <button id="btn-score-lula-dec" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 1px 4px; line-height: 1;" title="-1 Vitória Lula" aria-label="Decrementar vitórias Lula">▼</button>
              </div>
            </div>

            <div class="font-pixel" style="font-size: 12px; color: #ffd165; padding: 0 4px;">VS</div>

            <!-- Flávio 22 -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="display: flex; flex-direction: column; gap: 1px;">
                <button id="btn-score-flavio-inc" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 1px 4px; line-height: 1;" title="+1 Vitória Flávio" aria-label="Incrementar vitórias Flávio">▲</button>
                <button id="btn-score-flavio-dec" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 1px 4px; line-height: 1;" title="-1 Vitória Flávio" aria-label="Decrementar vitórias Flávio">▼</button>
              </div>
              <span style="font-size: 14px; color: #ffd165;">★</span>
              <span id="admin-score-flavio" class="font-pixel" style="font-size: 16px; color: #fff;">${scores.session.flavio}</span>
              <span class="font-pixel" style="font-size: 12px; color: #60a5fa;" id="header-cand-name-flavio">:${candidates.flavio.name.toUpperCase()}</span>
              <span class="font-pixel" style="font-size: 11px; background: #2563eb; color: #fff; padding: 2px 5px; border: 1px solid #000; box-shadow: 1px 1px 0 #000;">22</span>
            </div>

            <!-- Cronômetro Digital -->
            <div style="margin-left: 6px; background: #000; border: 1px solid rgba(234, 179, 8, 0.5); padding: 4px 8px; color: #ffd165; box-shadow: inset 0 0 6px rgba(0,0,0,0.8);" class="font-pixel">
              ⏱ <span id="admin-main-timer" style="font-size: 16px;">00:00.00</span>
            </div>

            <!-- Botão Zerar/Ajustar Placar -->
            <button id="admin-btn-open-score-modal" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 4px 8px;" title="Zerar ou Ajustar Placar">
              ↺ Placar
            </button>
          </div>

          <!-- CONTROLES DA CORRIDA E SAÍDA -->
          <div style="display: flex; gap: 6px; align-items: center;">
            <button id="admin-btn-start" class="arcade-btn arcade-btn-green" style="font-size: 12px;">
              ▶ INICIAR
            </button>
            <button id="admin-btn-pause" class="arcade-btn arcade-btn-amber" style="font-size: 12px;">
              ⏸ PAUSAR
            </button>
            <button id="admin-btn-reset" class="arcade-btn arcade-btn-dark" style="font-size: 12px;" title="Reiniciar Pista">
              ↺ REINICIAR
            </button>
            <button id="admin-btn-toggle-crt" class="arcade-btn arcade-btn-dark" style="font-size: 12px;" title="Alternar Filtro CRT">
              📺 CRT
            </button>
            <button id="admin-btn-logout" class="arcade-btn arcade-btn-dark" style="font-size: 12px;" title="Bloquear / Sair">
              🔒 SAIR
            </button>
          </div>
        </header>

        <!-- WORKSPACE 3 COLUNAS -->
        <div class="admin-workspace">
          <!-- ========================================== -->
          <!-- COLUNA ESQUERDA: CONEXÃO & SIMULAÇÃO LIVE -->
          <!-- ========================================== -->
          <aside class="admin-col-left">
            <!-- CONEXÃO DA LIVE DO TIKTOK -->
            <div class="arcade-panel" style="padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="font-pixel" style="font-size: 11px; color: var(--admin-primary);">CONEXÃO DA LIVE</span>
                <span id="admin-live-badge" class="font-pixel" style="font-size: 11px; padding: 3px 8px; background: #064e3b; color: #34d399; border: 1px solid #059669;">
                  ${liveStatus.state.toUpperCase()}
                </span>
              </div>
              <div style="font-size: 12px; color: var(--admin-outline); line-height: 1.6;" class="font-mono">
                <div>Canal: <strong style="color: #fff;">${liveStatus.channelName}</strong></div>
                <div>Tempo Conectado: <span id="admin-live-duration" style="color: #fff;">0m 00s</span></div>
                <div>Reconexões: <span id="admin-live-reconnects" style="color: #ffd165;">${liveStatus.reconnectCount}</span></div>
                <div id="admin-live-error-row" style="color: #f87171; font-size: 11px; display: ${liveStatus.lastError ? 'block' : 'none'};">
                  Erro: <span id="admin-live-error">${liveStatus.lastError || ''}</span>
                </div>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button id="admin-btn-reconnect" class="arcade-btn arcade-btn-dark" style="font-size: 11px; flex: 1; padding: 6px;">
                  Reconectar
                </button>
                <button id="admin-btn-disconnect" class="arcade-btn arcade-btn-dark" style="font-size: 11px; flex: 1; padding: 6px;">
                  Derrubar
                </button>
              </div>
            </div>

            <!-- CONTROLES DE AUDIÊNCIA (CHAT 13 / 22) -->
            <div class="arcade-panel" style="padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 6px;">
                <span class="font-pixel" style="font-size: 11px; color: var(--admin-primary);">CONTROLES & AUDIÊNCIA</span>
                <span class="font-mono" style="font-size: 11px; color: var(--admin-outline); background: #000; padding: 2px 6px; border: 1px solid #262a35;">
                  CHAT COLETIVO
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Lula 13 Push & Spam -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <button id="admin-btn-chat-13" class="arcade-btn arcade-btn-danger" style="font-size: 12px; width: 100%;">
                    +1 MSG LULA (13)
                  </button>
                  <button id="admin-btn-spam-lula" class="arcade-btn arcade-btn-dark" style="font-size: 11px; width: 100%; justify-content: space-between; padding: 6px 10px;">
                    <span>SPAM AUTO (10/s)</span>
                    <span id="admin-led-spam-lula" class="led-indicator ${this.spamLulaInterval ? 'active-red' : ''}"></span>
                  </button>
                </div>

                <!-- Flávio 22 Push & Spam -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <button id="admin-btn-chat-22" class="arcade-btn arcade-btn-primary" style="font-size: 12px; width: 100%; background: #2563eb; color: #fff;">
                    +1 MSG FLÁVIO (22)
                  </button>
                  <button id="admin-btn-spam-flavio" class="arcade-btn arcade-btn-dark" style="font-size: 11px; width: 100%; justify-content: space-between; padding: 6px 10px;">
                    <span>SPAM AUTO (10/s)</span>
                    <span id="admin-led-spam-flavio" class="led-indicator ${this.spamFlavioInterval ? 'active-green' : ''}"></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- PODERES & PRESENTES RÁPIDOS -->
            <div class="arcade-panel" style="padding: 12px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 6px;">
                <span class="font-pixel" style="font-size: 11px; color: var(--admin-primary);">PODERES & PRESENTES</span>
                <span style="font-size: 11px; color: var(--admin-outline);" class="font-mono">TIKTOK LIVE</span>
              </div>
              <div id="admin-gifts-quick-list" style="display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1;">
                ${this.renderQuickGiftsHtml()}
              </div>
            </div>
          </aside>

          <!-- ========================================== -->
          <!-- COLUNA CENTRAL: ARENA 9:16 + TELEMETRIA    -->
          <!-- ========================================== -->
          <main class="admin-col-center">
            <!-- STATUS DA ARENA & METAS -->
            <div class="arcade-panel" style="padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <span class="font-pixel" style="font-size: 11px; color: var(--admin-outline);">ESTADO:</span>
                <span id="admin-race-status-badge" class="font-pixel" style="font-size: 11px; padding: 3px 8px; background: #78350f; color: #ffd165; border: 1px solid #d97706;">
                  AGUARDANDO SINAL
                </span>
                <span id="admin-auto-badge" class="font-pixel" style="font-size: 11px; padding: 3px 6px; background: #1e1b4b; color: #818cf8; display: none;">
                  AUTO RACING
                </span>
              </div>
              <div class="font-mono" style="font-size: 12px; color: var(--admin-outline); display: flex; gap: 12px;">
                <span>CIRCUITO: <strong style="color: #fff;">ESTÁDIO NACIONAL</strong></span>
                <span>PISTA: <strong id="admin-track-length-display" style="color: #fff;">100m</strong></span>
                <span>DURAÇÃO: <strong id="admin-target-duration-display" style="color: #ffd165;">180s</strong></span>
              </div>
            </div>

            <!-- NOVO PALCO CENTRAL: QUADRO 9:16 COM CARDS EMBAIXO + MONITOR LATERAL COM ABAS -->
            <div class="admin-center-stage">
              <!-- SLOT DE PRÉ-VISUALIZAÇÃO (PREPARADO PARA 9:16 E FUTURO 16:9) -->
              <div class="preview-stage-column" id="preview-stage-slot" data-aspect="9:16">
                <!-- QUADRO 9:16 GRANDE QUASE TELA CHEIA VERTICAL -->
                <div class="arena-preview-container">
                  <div style="font-size: 11px; color: var(--admin-primary); margin-bottom: 4px;" class="font-pixel">
                    ★ TRANSMISSÃO 9:16 ★
                  </div>
                  <div class="preview-aspect-box">
                    <!-- TOPO ESTÁDIO COM REFLETORES -->
                    <div class="preview-stadium-top">
                      <div class="preview-floodlights-mast">
                        <div class="preview-floodlight"></div>
                        <div class="preview-floodlight"></div>
                      </div>
                      <div class="preview-jumbotron font-pixel" style="font-size: 11px; color: #ffd165;">
                        GRANDE PRÊMIO BRASÍLIA
                      </div>
                    </div>

                    <!-- RÉGUA DE DISTÂNCIA 100M -->
                    <div class="preview-ruler font-pixel">
                      <span>0m</span>
                      <span>25m</span>
                      <span>50m</span>
                      <span>75m</span>
                      <span>100m</span>
                    </div>

                    <!-- ÁREA DAS FAIXAS DE CORRIDA COM LINHA DE CHEGADA -->
                    <div class="preview-track-area">
                      <div class="checkered-finish-line" title="Linha de Chegada"></div>

                      <!-- FAIXA 1: LULA (13) -->
                      <div class="preview-lane preview-lane-lula" id="lane-preview-lula">
                        <div class="font-pixel" style="position: absolute; right: 28px; top: 8px; font-size: 13px; color: rgba(255,255,255,0.7); pointer-events: none; letter-spacing: 1px;">
                          13 LULA
                        </div>
                        <div class="preview-runner-sprite" id="admin-preview-runner-lula" style="left: 4px;">
                          <div class="preview-runner-badge font-pixel" style="background: #dc2626; color: #fff; font-size: 11px;">13</div>
                          <div class="preview-runner-body" id="admin-runner-body-lula" style="background: #ef4444; width: 26px; height: 32px;">
                            <div id="aura-lula"></div>
                          </div>
                        </div>
                      </div>

                      <!-- FAIXA 2: FLÁVIO (22) -->
                      <div class="preview-lane preview-lane-flavio" id="lane-preview-flavio">
                        <div class="font-pixel" style="position: absolute; right: 28px; top: 8px; font-size: 13px; color: rgba(255,255,255,0.7); pointer-events: none; letter-spacing: 1px;">
                          22 FLÁVIO
                        </div>
                        <div class="preview-runner-sprite" id="admin-preview-runner-flavio" style="left: 4px;">
                          <div class="preview-runner-badge font-pixel" style="background: #2563eb; color: #fff; font-size: 11px;">22</div>
                          <div class="preview-runner-body" id="admin-runner-body-flavio" style="background: #3b82f6; width: 26px; height: 32px;">
                            <div id="aura-flavio"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- RODAPÉ DA TRANSMISSÃO -->
                    <div style="padding: 6px; background: rgba(0,0,0,0.85); text-align: center; border-top: 1px solid #333; font-size: 11px; color: #cbd5e1;" class="font-pixel">
                      TIKTOK INTERATIVO 2026
                    </div>
                  </div>
                </div>

                <!-- CARTÕES DOS CANDIDATOS LOGO ABAIXO DO QUADRO (MESMA LARGURA) -->
                <div class="preview-candidates-deck">
                  <!-- Card Lula -->
                  <div class="candidate-compact-card card-lula">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="font-pixel" style="font-size: 11px; background: #dc2626; color: #fff; padding: 2px 4px; border: 1px solid #000;">13</span>
                        <strong id="cand-profile-name-lula" class="font-pixel" style="color: #f87171; font-size: 13px;">${candidates.lula.name.toUpperCase()}</strong>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px;" class="font-pixel">
                        <span style="color: #ffd165; font-size: 11px;">BUFF:</span>
                        <span id="admin-effects-lula" style="background: #450a0a; color: #ffd165; border: 1px solid #b91c1c; padding: 2px 6px; font-size: 11px;">
                          NENHUM
                        </span>
                      </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; text-align: center;">
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">VELOCIDADE</div>
                        <div id="admin-speed-lula" class="font-pixel" style="font-size: 13px; color: #fff; margin-top: 2px;">0.00 m/s</div>
                      </div>
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">DISTÂNCIA</div>
                        <div id="admin-pos-lula" class="font-pixel" style="font-size: 13px; color: #ffd165; margin-top: 2px;">0.0 m</div>
                      </div>
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">PROGRESSO</div>
                        <div id="admin-pct-lula" class="font-pixel" style="font-size: 13px; color: #f87171; margin-top: 2px;">0%</div>
                      </div>
                    </div>
                    <div class="pixel-progress-frame">
                      <div class="pixel-progress-track">
                        <div id="admin-bar-lula" class="pixel-progress-bar-red" style="width: 0%;"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Flávio -->
                  <div class="candidate-compact-card card-flavio">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="font-pixel" style="font-size: 11px; background: #2563eb; color: #fff; padding: 2px 4px; border: 1px solid #000;">22</span>
                        <strong id="cand-profile-name-flavio" class="font-pixel" style="color: #60a5fa; font-size: 13px;">${candidates.flavio.name.toUpperCase()}</strong>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px;" class="font-pixel">
                        <span style="color: #ffd165; font-size: 11px;">BUFF:</span>
                        <span id="admin-effects-flavio" style="background: #172554; color: #ffd165; border: 1px solid #1e40af; padding: 2px 6px; font-size: 11px;">
                          NENHUM
                        </span>
                      </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; text-align: center;">
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">VELOCIDADE</div>
                        <div id="admin-speed-flavio" class="font-pixel" style="font-size: 13px; color: #fff; margin-top: 2px;">0.00 m/s</div>
                      </div>
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">DISTÂNCIA</div>
                        <div id="admin-pos-flavio" class="font-pixel" style="font-size: 13px; color: #ffd165; margin-top: 2px;">0.0 m</div>
                      </div>
                      <div class="arcade-panel-inset" style="padding: 4px;">
                        <div style="font-size: 11px; color: var(--admin-outline); font-family: monospace;">PROGRESSO</div>
                        <div id="admin-pct-flavio" class="font-pixel" style="font-size: 13px; color: #60a5fa; margin-top: 2px;">0%</div>
                      </div>
                    </div>
                    <div class="pixel-progress-frame">
                      <div class="pixel-progress-track">
                        <div id="admin-bar-flavio" class="pixel-progress-bar-blue" style="width: 0%;"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MONITOR COM ABAS NO ESPAÇO LATERAL AO QUADRO 9:16 -->
              <div class="admin-tabbed-monitor">
                <div style="display: flex; gap: 4px; border-bottom: 2px solid #000; padding: 4px 8px; background: #0a0e18; overflow-x: auto; flex-shrink: 0;">
                  <button class="tab-btn ${this.activeTab === 'telemetry' ? 'active' : ''}" data-tab="telemetry">Monitor de Telemetria</button>
                  <button class="tab-btn ${this.activeTab === 'ranking' ? 'active' : ''}" data-tab="ranking">Top Doações</button>
                  <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">Mensagens & Top Chat</button>
                  <button class="tab-btn ${this.activeTab === 'candidates' ? 'active' : ''}" data-tab="candidates">Gerenciar Personagens</button>
                  <button class="tab-btn ${this.activeTab === 'gifts' ? 'active' : ''}" data-tab="gifts">Tabela de Presentes</button>
                </div>

                <div id="admin-tab-content" style="flex: 1; padding: 12px; overflow-y: auto;">
                  ${this.renderTabContent()}
                </div>
              </div>
            </div>
          </main>

          <!-- ========================================== -->
          <!-- COLUNA DIREITA: ENGINE PARAMETERS & TUNING -->
          <!-- ========================================== -->
          <aside class="admin-col-right">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px;">
              <span class="font-pixel" style="font-size: 12px; color: var(--admin-primary);">ENGINE PARAMETERS</span>
              <button id="admin-btn-reset-tuning" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 4px 8px;">
                Restaurar Padrão
              </button>
            </div>

            <!-- MINI-DECK DE TELEMETRIA INSTANTÂNEA -->
            <div class="mini-telemetry-deck font-mono">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: var(--admin-outline);">ESTADO MOTOR:</span>
                <span id="side-state-readout" style="color: #ffd165; font-weight: bold;">AGUARDANDO</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: var(--admin-outline);">TEMPO:</span>
                <span id="side-time-readout" style="color: #fff;">00:00.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #f87171;">LULA DIST/VEL:</span>
                <span id="side-lula-readout" style="color: #fff;">0.0m / 0.00m/s</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #60a5fa;">FLÁVIO DIST/VEL:</span>
                <span id="side-flavio-readout" style="color: #fff;">0.0m / 0.00m/s</span>
              </div>
            </div>

            <!-- PRESETS DE PROVA RÁPIDOS -->
            <div>
              <div class="font-pixel" style="font-size: 11px; color: var(--admin-primary); margin-bottom: 6px;">
                PRESETS DE PROVA
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                <button class="preset-btn ${this.activePreset === '180' ? 'active' : ''}" data-preset="180">
                  180s (100m)
                </button>
                <button class="preset-btn ${this.activePreset === '30' ? 'active' : ''}" data-preset="30">
                  30s (100m)
                </button>
                <button class="preset-btn ${this.activePreset === '15' ? 'active' : ''}" data-preset="15">
                  TURBO (15s)
                </button>
              </div>
            </div>

            <!-- BUSCA DE PARÂMETROS -->
            <div>
              <input
                type="text"
                id="admin-param-search"
                class="arcade-input"
                placeholder="Buscar parâmetro de tuning..."
                value="${this.paramSearchQuery}"
                aria-label="Buscar parâmetro de tuning"
              />
            </div>

            <!-- AVISO DE POLÍTICA DE TUNING -->
            <div style="background: #171b26; border-left: 3px solid #ffd165; padding: 6px 8px; font-size: 11px; color: var(--admin-outline); line-height: 1.4;">
              ℹ️ Alterações de balanceamento entram em vigor na <strong>próxima corrida</strong>.
            </div>

            <!-- ÁRVORE DE PARÂMETROS AGRUPADA -->
            <div id="admin-tuning-tree" style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1;">
              ${this.renderTuningTreeHtml()}
            </div>
          </aside>
        </div>

        <!-- MODAL DE PLACAR (SE ATIVO) -->
        ${this.showScoreModal ? this.renderScoreModalHtml() : ''}

        <!-- MODAL DE EDIÇÃO DE PRESENTE (SE ATIVO) -->
        ${this.showGiftModal ? this.renderGiftModalHtml(this.showGiftModal) : ''}
      </div>
    `;
  }

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

    // Lê percentuais dinamicamente de tuning.ts (sem valores mágicos no código da interface)
    const impulsePct = getTuning('power.impulseSpeedPct');
    const superPct = getTuning('power.superStartSpeedPct');
    const slipPct = getTuning('power.slipSlowdownPct');

    return list
      .map((g) => {
        const isBuff = g.power === 'impulse' || g.power === 'superStart' || g.power === 'shield';
        const badgeClass = g.power === 'superStart' ? 'badge-super' : isBuff ? 'badge-buff' : 'badge-debuff';
        const badgeText = g.power === 'superStart' ? 'SUPER' : isBuff ? 'BUFF' : 'DEBUFF';
        const borderClass = g.power === 'superStart' ? 'super' : isBuff ? 'buff' : 'debuff';

        let desc = '';
        if (g.power === 'impulse') desc = `+${impulsePct}% VEL → ${g.candidateBenefited.toUpperCase()}`;
        else if (g.power === 'superStart') desc = `+${superPct}% VEL → ${g.candidateBenefited.toUpperCase()}`;
        else if (g.power === 'slip') desc = `-${slipPct}% VEL → ${g.candidateBenefited === 'lula' ? 'FLÁVIO' : 'LULA'}`;
        else if (g.power === 'trip') desc = `TROPEÇO → ${g.candidateBenefited === 'lula' ? 'FLÁVIO' : 'LULA'}`;
        else if (g.power === 'shield') desc = `ESCUDO → ${g.candidateBenefited.toUpperCase()}`;

        return `
        <button class="arcade-gift-card ${borderClass} quick-gift-btn" data-gift="${g.giftId}" style="width: 100%;" aria-label="Enviar presente ${g.name}">
          <div style="font-size: 20px; line-height: 1;">${iconMap[g.giftId] || '🎁'}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="font-pixel" style="font-size: 11px; color: #fff;">${g.name.toUpperCase()}</span>
              <span class="${badgeClass}">${badgeText}</span>
            </div>
            <div style="font-size: 11px; color: var(--admin-outline); margin-top: 2px;" class="font-mono">
              ${desc}
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
            <span class="font-mono" style="font-size: 12px; color: #ffd165; font-weight: bold; white-space: nowrap;">
              💎 ${g.diamondCost}
            </span>
            <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">provisório</span>
          </div>
        </button>
      `;
      })
      .join('');
  }

  private renderTabContent(): string {
    if (this.activeTab === 'telemetry') {
      const allLogs = this.engine.getLogs();
      const appliedCount = allLogs.filter((l) => l.kind === 'event_decision' && l.applied).length;
      const ignoredCount = allLogs.filter((l) => l.kind === 'event_decision' && !l.applied).length;

      const filteredLogs = allLogs
        .filter((log) => {
          if (this.logFilter === 'all') return true;
          if (this.logFilter === 'applied') return log.kind === 'event_decision' && log.applied;
          if (this.logFilter === 'ignored') return log.kind === 'event_decision' && !log.applied;
          if (this.logFilter === 'chat') return log.kind === 'event_decision' && log.event.type === 'chat';
          if (this.logFilter === 'gifts') return log.kind === 'event_decision' && log.event.type === 'gift';
          if (this.logFilter === 'system') return log.kind === 'lifecycle';
          return true;
        })
        .slice(-50)
        .reverse();

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <!-- Pílulas de filtro -->
          <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
            <button class="log-filter-btn ${this.logFilter === 'all' ? 'active' : ''}" data-filter="all">TODOS</button>
            <button class="log-filter-btn ${this.logFilter === 'applied' ? 'active' : ''}" data-filter="applied">APLICADOS</button>
            <button class="log-filter-btn ${this.logFilter === 'ignored' ? 'active' : ''}" data-filter="ignored">IGNORADOS</button>
            <button class="log-filter-btn ${this.logFilter === 'chat' ? 'active' : ''}" data-filter="chat">CHAT 13/22</button>
            <button class="log-filter-btn ${this.logFilter === 'gifts' ? 'active' : ''}" data-filter="gifts">PRESENTES</button>
            <button class="log-filter-btn ${this.logFilter === 'system' ? 'active' : ''}" data-filter="system">SISTEMA</button>
          </div>

          <!-- Counters LED & Ações -->
          <div style="display: flex; gap: 6px; align-items: center;">
            <div class="log-counter-pill">
              <span style="color: #94a3b8;">TOTAL: <strong style="color: #fff;">${allLogs.length}</strong></span>
              <span style="color: #34d399;">OK: <strong>${appliedCount}</strong></span>
              <span style="color: #f87171;">IGN: <strong>${ignoredCount}</strong></span>
            </div>
            <button id="admin-btn-export-logs" class="arcade-btn arcade-btn-dark" style="font-size: 8px; padding: 3px 6px;">
              💾 Exportar JSON
            </button>
            <button id="admin-btn-clear-logs" class="arcade-btn arcade-btn-dark" style="font-size: 8px; padding: 3px 6px;">
              Limpar Log
            </button>
          </div>
        </div>

        <table class="arcade-table font-mono">
          <thead>
            <tr>
              <th>HORA</th>
              <th>TIPO</th>
              <th>ORIGEM</th>
              <th>PAYLOAD / AÇÃO</th>
              <th style="text-align: right;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredLogs.length === 0
                ? '<tr><td colspan="5" style="text-align: center; color: #666; padding: 16px;">Nenhum evento registrado</td></tr>'
                : filteredLogs
                    .map((log) => {
                      const isDecision = log.kind === 'event_decision';
                      const statusColor = isDecision ? (log.applied ? '#34d399' : '#f87171') : '#60a5fa';
                      const statusText = isDecision ? (log.applied ? 'APLICADO' : 'IGNORADO') : 'SISTEMA';

                      let badgeHtml = '';
                      let originText = 'SISTEMA';
                      let payloadText = '';

                      if (isDecision) {
                        originText = log.event.userId.startsWith('donor_')
                          ? '@doador'
                          : log.event.userId.startsWith('spam_')
                            ? '@espectador'
                            : '@operador';
                        if (log.event.type === 'gift') {
                          badgeHtml = `<span class="log-badge-gift">GIFT</span>`;
                          payloadText = `🎁 Presente ${log.event.giftId} (${log.event.power}) → ${log.event.candidateBenefited.toUpperCase()}`;
                        } else {
                          badgeHtml = `<span class="log-badge-chat">CHAT</span>`;
                          payloadText = `Chat para ${log.event.candidateId.toUpperCase()} (${log.reason})`;
                        }
                      } else {
                        badgeHtml = `<span class="log-badge-system">SISTEMA</span>`;
                        payloadText = log.description;
                      }

                      return `
                  <tr>
                    <td style="color: #94a3b8; font-size: 11px;">${new Date(log.timeIso).toLocaleTimeString()}</td>
                    <td>${badgeHtml}</td>
                    <td style="color: #cbd5e1; font-size: 12px; font-weight: 500;">${originText}</td>
                    <td style="color: #ffffff; font-size: 12px; word-break: break-word;">${payloadText}</td>
                    <td style="text-align: right; color: ${statusColor}; font-weight: bold; font-size: 12px;" class="font-pixel">${statusText}</td>
                  </tr>
                `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      `;
    }

    if (this.activeTab === 'ranking') {
      const windowMs = this.donorWindow === '15m' ? 15 * 60 * 1000 : undefined;
      const top = liveServiceMock.getTopDonors(10, windowMs);
      const maxDiamonds = top.length > 0 ? top[0].totalDiamonds : 1;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 10px; color: #9b8f79;">
            Maiores doadores da live classificados por volume de diamantes
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="log-filter-btn ${this.donorWindow === 'session' ? 'active' : ''}" data-window="session">SESSÃO COMPLETA</button>
            <button class="log-filter-btn ${this.donorWindow === '15m' ? 'active' : ''}" data-window="15m">ÚLTIMOS 15 MIN</button>
          </div>
        </div>

        <table class="arcade-table font-mono">
          <thead>
            <tr>
              <th>POSIÇÃO</th>
              <th>USUÁRIO</th>
              <th>TOTAL DIAMANTES</th>
              <th>QTD PRESENTES</th>
              <th>REPRESENTATIVIDADE</th>
            </tr>
          </thead>
          <tbody>
            ${
              top.length === 0
                ? '<tr><td colspan="5" style="text-align: center; color: #666; padding: 16px;">Nenhuma doação registrada nesta janela</td></tr>'
                : top
                    .map((d, idx) => {
                      const pct = Math.round((d.totalDiamonds / maxDiamonds) * 100);
                      return `
                  <tr>
                    <td style="color: var(--admin-primary); font-weight: bold;">#${idx + 1}</td>
                    <td style="color: #fff; font-weight: bold;">${d.userName}</td>
                    <td style="color: #facc15; font-weight: bold;">💎 ${d.totalDiamonds}</td>
                    <td>${d.count} presentes</td>
                    <td style="width: 140px;">
                      <div class="top-msg-bar-container">
                        <div class="top-msg-bar" style="width: ${pct}%; background: #eab308;"></div>
                      </div>
                    </td>
                  </tr>
                `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      `;
    }

    if (this.activeTab === 'chat') {
      const msgs = liveServiceMock.getChatMessages().slice(0, 25);
      const topMsgs = liveServiceMock.getTopMessages(8);

      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- COLUNA 1: ÚLTIMAS MENSAGENS -->
          <div>
            <div class="font-pixel" style="font-size: 11px; color: var(--admin-primary); margin-bottom: 8px;">
              FEED DE MENSAGENS AO VIVO
            </div>
            <table class="arcade-table font-mono">
              <thead>
                <tr>
                  <th>HORA</th>
                  <th>USUÁRIO</th>
                  <th>VOTO</th>
                  <th>MENSAGEM</th>
                </tr>
              </thead>
              <tbody>
                ${
                  msgs.length === 0
                    ? '<tr><td colspan="4" style="text-align: center; color: #666; padding: 12px;">Nenhuma mensagem registrada</td></tr>'
                    : msgs
                        .map(
                          (m) => `
                      <tr>
                        <td style="color: #94a3b8; font-size: 11px;">${new Date(m.timestamp).toLocaleTimeString()}</td>
                        <td style="color: #ffffff; font-size: 12px; font-weight: bold;">${m.userName}</td>
                        <td>
                          <span style="background: ${m.candidateNumber === '13' ? '#dc2626' : '#2563eb'}; color: #fff; padding: 2px 6px; font-weight: bold; font-size: 11px;">
                            ${m.candidateNumber}
                          </span>
                        </td>
                        <td style="color: #ffffff; font-size: 12px;">${m.message}</td>
                      </tr>
                    `,
                        )
                        .join('')
                }
              </tbody>
            </table>
          </div>

          <!-- COLUNA 2: TOP MENSAGENS MAIS FREQUENTES -->
          <div>
            <div class="font-pixel" style="font-size: 11px; color: #38bdf8; margin-bottom: 8px;">
              TOP MENSAGENS MAIS FREQUENTES (AUDIÊNCIA)
            </div>
            <table class="arcade-table font-mono">
              <thead>
                <tr>
                  <th>MENSAGEM</th>
                  <th>VOTO</th>
                  <th>QTD</th>
                  <th>% DA AUDIÊNCIA</th>
                </tr>
              </thead>
              <tbody>
                ${
                  topMsgs.length === 0
                    ? '<tr><td colspan="4" style="text-align: center; color: #666; padding: 12px;">Sem dados de top mensagens</td></tr>'
                    : topMsgs
                        .map((tm) => {
                          const candColor = tm.candidateNumber === '13' ? '#dc2626' : tm.candidateNumber === '22' ? '#2563eb' : '#64748b';
                          return `
                      <tr>
                        <td style="color: #fff; font-weight: bold;">"${tm.text}"</td>
                        <td><span style="background: ${candColor}; color: #fff; padding: 1px 4px;">${tm.candidateNumber.toUpperCase()}</span></td>
                        <td style="color: #facc15; font-weight: bold;">${tm.count}</td>
                        <td style="width: 120px;">
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <div class="top-msg-bar-container" style="flex: 1;">
                              <div class="top-msg-bar" style="width: ${tm.percentage}%; background: ${candColor};"></div>
                            </div>
                            <span style="font-size: 9px; color: #dfe2f1;">${tm.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    `;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'candidates') {
      const profiles = liveServiceMock.getCandidateProfiles();
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <!-- Candidato 1: Lula -->
          <div class="arcade-panel" style="padding: 12px; border-left: 4px solid ${profiles.lula.color};">
            <div class="font-pixel" style="font-size: 13px; color: #f87171; margin-bottom: 8px;">CANDIDATO 1</div>
            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Nome Exibido:</label>
            <input type="text" id="admin-cand-name-lula" class="arcade-input" value="${profiles.lula.name}" style="margin-bottom: 8px; font-size: 12px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Número Eleitoral:</label>
            <input type="text" id="admin-cand-num-lula" class="arcade-input" value="${profiles.lula.number}" style="margin-bottom: 8px; font-size: 12px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Cor Principal (Hex):</label>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <input type="color" id="admin-cand-color-picker-lula" value="${profiles.lula.color}" style="width: 36px; height: 32px; padding: 0; background: none; border: 1px solid #000; cursor: pointer;" />
              <input type="text" id="admin-cand-color-lula" class="arcade-input" value="${profiles.lula.color}" style="font-size: 12px;" />
            </div>

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">URL do Avatar / Cabeça (opcional):</label>
            <input type="text" id="admin-cand-avatar-lula" class="arcade-input" value="${profiles.lula.avatarUrl}" placeholder="https://..." style="margin-bottom: 12px; font-size: 12px;" />

            <button id="admin-btn-save-cand-lula" class="arcade-btn arcade-btn-danger" style="font-size: 12px; width: 100%; padding: 8px 12px;">
              Salvar Alterações Candidato 1
            </button>
          </div>

          <!-- Candidato 2: Flávio -->
          <div class="arcade-panel" style="padding: 12px; border-left: 4px solid ${profiles.flavio.color};">
            <div class="font-pixel" style="font-size: 13px; color: #60a5fa; margin-bottom: 8px;">CANDIDATO 2</div>
            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Nome Exibido:</label>
            <input type="text" id="admin-cand-name-flavio" class="arcade-input" value="${profiles.flavio.name}" style="margin-bottom: 8px; font-size: 12px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Número Eleitoral:</label>
            <input type="text" id="admin-cand-num-flavio" class="arcade-input" value="${profiles.flavio.number}" style="margin-bottom: 8px; font-size: 12px;" />

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">Cor Principal (Hex):</label>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <input type="color" id="admin-cand-color-picker-flavio" value="${profiles.flavio.color}" style="width: 36px; height: 32px; padding: 0; background: none; border: 1px solid #000; cursor: pointer;" />
              <input type="text" id="admin-cand-color-flavio" class="arcade-input" value="${profiles.flavio.color}" style="font-size: 12px;" />
            </div>

            <label style="font-size: 12px; color: #cbd5e1; font-weight: bold; display: block; margin-bottom: 3px;">URL do Avatar / Cabeça (opcional):</label>
            <input type="text" id="admin-cand-avatar-flavio" class="arcade-input" value="${profiles.flavio.avatarUrl}" placeholder="https://..." style="margin-bottom: 12px; font-size: 12px;" />

            <button id="admin-btn-save-cand-flavio" class="arcade-btn arcade-btn-primary" style="font-size: 12px; width: 100%; background: #2563eb; color: #fff; padding: 8px 12px;">
              Salvar Alterações Candidato 2
            </button>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'gifts') {
      const list = giftRegistry.list();
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 11px; color: #cbd5e1;">
            Edição dos presentes configurados na live (ID, custo, efeito e candidato beneficiado)
          </div>
          <button id="admin-btn-reset-gifts" class="arcade-btn arcade-btn-dark" style="font-size: 11px; padding: 5px 10px;">
            Restaurar Presentes Padrão
          </button>
        </div>

        <table class="arcade-table font-mono">
          <thead>
            <tr>
              <th>ID</th>
              <th>NOME</th>
              <th>CUSTO (DIAMANTES)</th>
              <th>PODER / EFEITO</th>
              <th>BENEFICIADO</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            ${list
              .map(
                (g) => `
              <tr>
                <td style="color: #94a3b8; font-size: 11px;">${g.giftId}</td>
                <td style="color: #fff; font-weight: bold; font-size: 12px;">${g.name}</td>
                <td style="color: #ffd165; font-weight: bold; font-size: 12px;">💎 ${g.diamondCost}</td>
                <td><span style="color: #38bdf8; font-size: 12px;">${g.power}</span></td>
                <td>
                  <span style="color: ${g.candidateBenefited === 'lula' ? '#f87171' : '#60a5fa'}; font-weight: bold; font-size: 12px;">
                    ${g.candidateBenefited.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button class="arcade-btn arcade-btn-dark btn-edit-gift" data-giftid="${g.giftId}" style="font-size: 11px; padding: 4px 8px;">
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    return '';
  }

  private renderTuningTreeHtml(): string {
    const list = listTuning();
    const query = this.paramSearchQuery.toLowerCase();
    const filtered = query
      ? list.filter((e) => e.path.toLowerCase().includes(query) || e.desc.toLowerCase().includes(query))
      : list;

    // Agrupa por categoria
    const groups: Record<string, typeof filtered> = {};
    for (const item of filtered) {
      const [g] = item.path.split('.');
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    }

    const groupNames: Record<string, string> = {
      race: 'Pista & Duração',
      chat: 'Regras Chat & Anti-Spam',
      power: 'Poderes & Presentes',
      balance: 'Equilíbrio & Rubber-Band',
      auto: 'Corrida Automática (Idle)',
    };

    const groupIcons: Record<string, string> = {
      race: '⏱',
      chat: '💬',
      power: '⚡',
      balance: '⚖',
      auto: '🤖',
    };

    // Mapeamento de nomes amigáveis em português para cada parâmetro
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

    return Object.entries(groups)
      .map(([group, items]) => {
        const isCollapsed = this.collapsedGroups.has(group);
        return `
        <div class="arcade-panel" style="border: 1px solid #000; box-shadow: 2px 2px 0 #000; margin-bottom: 6px;">
          <button class="accordion-header" data-accordion="${group}" aria-expanded="${!isCollapsed}">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${groupIcons[group] || '⚙'}</span>
              <span>${groupNames[group] || group.toUpperCase()}</span>
            </div>
            <span class="accordion-arrow font-pixel" style="font-size: 11px;">${isCollapsed ? '▼' : '▲'}</span>
          </button>
          <div class="accordion-body ${isCollapsed ? 'collapsed' : ''}" id="acc-body-${group}">
            ${items
              .map(
                (p) => {
                  const ptTitle = paramTitlesPt[p.path] || p.path.split('.')[1];
                  return `
              <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; gap: 8px;">
                  <div>
                    <strong style="color: #ffffff;">${ptTitle}</strong>
                    <span class="font-mono" style="font-size: 11px; color: #94a3b8; margin-left: 6px;">(${p.path})</span>
                  </div>
                  <span style="color: #ffd165; font-size: 13px;" class="font-mono font-bold" id="label-val-${p.path}">
                    ${p.value} ${p.unit}
                  </span>
                </div>
                <div style="font-size: 11px; color: var(--admin-outline); margin: 3px 0 6px 0; line-height: 1.35;">
                  ${p.desc}
                </div>
                <input
                  type="range"
                  class="arcade-tuning-slider"
                  data-path="${p.path}"
                  min="${p.min}"
                  max="${p.max}"
                  step="${p.max <= 10 ? '0.1' : '1'}"
                  value="${p.value}"
                  aria-label="${ptTitle}"
                  style="width: 100%; accent-color: var(--admin-primary); cursor: pointer;"
                />
              </div>
            `;
                },
              )
              .join('')}
          </div>
        </div>
      `;
      })
      .join('');
  }

  // ==========================================
  // MODAIS (PLACAR & PRESENTE)
  // ==========================================
  private renderScoreModalHtml(): string {
    const scores = this.engine.getScores();
    return `
      <div class="arcade-modal-backdrop">
        <div class="arcade-modal-dialog">
          <div class="font-pixel" style="font-size: 10px; color: var(--admin-primary); margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px;">
            AJUSTAR OU ZERAR PLACAR
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #ef4444; font-weight: bold;">Vitórias Lula (Sessão):</span>
              <input type="number" id="modal-score-session-lula" class="arcade-input font-mono" style="width: 80px;" value="${scores.session.lula}" min="0" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #3b82f6; font-weight: bold;">Vitórias Flávio (Sessão):</span>
              <input type="number" id="modal-score-session-flavio" class="arcade-input font-mono" style="width: 80px;" value="${scores.session.flavio}" min="0" />
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="modal-btn-save-scores" class="arcade-btn arcade-btn-green" style="font-size: 10px;">
              SALVAR VALORES DO PLACAR
            </button>
            <div style="display: flex; gap: 8px;">
              <button id="modal-btn-reset-session" class="arcade-btn arcade-btn-amber" style="flex: 1; font-size: 9px;">
                ZERAR SESSÃO
              </button>
              <button id="modal-btn-reset-total" class="arcade-btn arcade-btn-danger" style="flex: 1; font-size: 9px;">
                ZERAR TUDO
              </button>
            </div>
            <button id="modal-btn-cancel-score" class="arcade-btn arcade-btn-dark" style="font-size: 9px;">
              FECHAR
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGiftModalHtml(giftId: string): string {
    const gift = giftRegistry.get(giftId);
    if (!gift) return '';

    return `
      <div class="arcade-modal-backdrop">
        <div class="arcade-modal-dialog">
          <div class="font-pixel" style="font-size: 10px; color: var(--admin-primary); margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px;">
            EDITAR PRESENTE: ${gift.name.toUpperCase()} (${gift.giftId})
          </div>

          <form id="form-edit-gift" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
            <div>
              <label style="font-size: 10px; color: #9b8f79;">Nome:</label>
              <input type="text" id="gift-edit-name" class="arcade-input" value="${gift.name}" />
            </div>

            <div>
              <label style="font-size: 10px; color: #9b8f79;">Custo em Diamantes:</label>
              <input type="number" id="gift-edit-diamonds" class="arcade-input" value="${gift.diamondCost}" min="1" />
            </div>

            <div>
              <label style="font-size: 10px; color: #9b8f79;">Poder / Efeito:</label>
              <select id="gift-edit-power" class="arcade-input">
                <option value="impulse" ${gift.power === 'impulse' ? 'selected' : ''}>impulse (Aceleração rápida)</option>
                <option value="slip" ${gift.power === 'slip' ? 'selected' : ''}>slip (Escorregão / Sabotagem)</option>
                <option value="superStart" ${gift.power === 'superStart' ? 'selected' : ''}>superStart (Super arrancada)</option>
                <option value="trip" ${gift.power === 'trip' ? 'selected' : ''}>trip (Tropeço no oponente)</option>
                <option value="shield" ${gift.power === 'shield' ? 'selected' : ''}>shield (Escudo protetor)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 10px; color: #9b8f79;">Candidato Beneficiado:</label>
              <select id="gift-edit-candidate" class="arcade-input">
                <option value="lula" ${gift.candidateBenefited === 'lula' ? 'selected' : ''}>Lula (13)</option>
                <option value="flavio" ${gift.candidateBenefited === 'flavio' ? 'selected' : ''}>Flávio (22)</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="submit" class="arcade-btn arcade-btn-green" style="flex: 1; font-size: 9px;">
                SALVAR
              </button>
              <button type="button" id="btn-cancel-gift-modal" class="arcade-btn arcade-btn-dark" style="flex: 1; font-size: 9px;">
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ==========================================
  // BINDING DE EVENTOS
  // ==========================================
  private bindEvents(): void {
    // Ações principais do cabeçalho
    document.getElementById('admin-btn-start')?.addEventListener('click', () => this.engine.startRace());
    document.getElementById('admin-btn-pause')?.addEventListener('click', () => {
      const paused = this.engine.getState().isPaused;
      this.engine.setPaused(!paused);
    });
    document.getElementById('admin-btn-reset')?.addEventListener('click', () => this.engine.resetRace());

    // Logout
    document.getElementById('admin-btn-logout')?.addEventListener('click', () => {
      sessionStorage.removeItem('admin_auth_token');
      this.isAuthenticated = false;
      this.renderAuthScreen();
    });

    // CRT Toggle
    document.getElementById('admin-btn-toggle-crt')?.addEventListener('click', () => {
      this.isCrtActive = !this.isCrtActive;
      const overlay = document.getElementById('admin-crt-overlay');
      if (overlay) {
        overlay.classList.toggle('active', this.isCrtActive);
      }
    });

    // Ajuste de placar rápido no cabeçalho
    document.getElementById('btn-score-lula-inc')?.addEventListener('click', () => {
      const sc = this.engine.getScores();
      this.engine.setScores({ session: { lula: sc.session.lula + 1, flavio: sc.session.flavio } });
    });
    document.getElementById('btn-score-lula-dec')?.addEventListener('click', () => {
      const sc = this.engine.getScores();
      this.engine.setScores({ session: { lula: Math.max(0, sc.session.lula - 1), flavio: sc.session.flavio } });
    });
    document.getElementById('btn-score-flavio-inc')?.addEventListener('click', () => {
      const sc = this.engine.getScores();
      this.engine.setScores({ session: { lula: sc.session.lula, flavio: sc.session.flavio + 1 } });
    });
    document.getElementById('btn-score-flavio-dec')?.addEventListener('click', () => {
      const sc = this.engine.getScores();
      this.engine.setScores({ session: { lula: sc.session.lula, flavio: Math.max(0, sc.session.flavio - 1) } });
    });

    // Modal de Placar
    document.getElementById('admin-btn-open-score-modal')?.addEventListener('click', () => {
      this.showScoreModal = true;
      this.container.innerHTML = this.renderHtml();
      this.bindEvents();
    });

    // Conexão
    document.getElementById('admin-btn-reconnect')?.addEventListener('click', () => liveServiceMock.reconnect());
    document.getElementById('admin-btn-disconnect')?.addEventListener('click', () => liveServiceMock.disconnect());

    // Chat Simulado Lula (+1 e Spam com LED)
    document.getElementById('admin-btn-chat-13')?.addEventListener('click', () => {
      this.triggerPushVisual('lula');
      this.engine.handleEvent({
        type: 'chat',
        userId: `op_${Date.now()}`,
        candidateId: 'lula',
        timestamp: Date.now(),
      });
      liveServiceMock.recordChatMessage({
        userId: `op_${Date.now()}`,
        userName: '@operador',
        candidateNumber: '13',
        message: '13!',
        timestamp: Date.now(),
      });
      if (this.activeTab === 'telemetry' || this.activeTab === 'chat') {
        this.updateTabContent();
      }
    });

    document.getElementById('admin-btn-spam-lula')?.addEventListener('click', () => {
      const led = document.getElementById('admin-led-spam-lula');
      if (this.spamLulaInterval) {
        clearInterval(this.spamLulaInterval);
        this.spamLulaInterval = null;
        led?.classList.remove('active-red');
      } else {
        led?.classList.add('active-red');
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
          if (this.activeTab === 'telemetry' || this.activeTab === 'chat') {
            this.updateTabContent();
          }
        }, 100);
      }
    });

    // Chat Simulado Flávio (+1 e Spam com LED)
    document.getElementById('admin-btn-chat-22')?.addEventListener('click', () => {
      this.triggerPushVisual('flavio');
      this.engine.handleEvent({
        type: 'chat',
        userId: `op_${Date.now()}`,
        candidateId: 'flavio',
        timestamp: Date.now(),
      });
      liveServiceMock.recordChatMessage({
        userId: `op_${Date.now()}`,
        userName: '@operador',
        candidateNumber: '22',
        message: '22!',
        timestamp: Date.now(),
      });
      if (this.activeTab === 'telemetry' || this.activeTab === 'chat') {
        this.updateTabContent();
      }
    });

    document.getElementById('admin-btn-spam-flavio')?.addEventListener('click', () => {
      const led = document.getElementById('admin-led-spam-flavio');
      if (this.spamFlavioInterval) {
        clearInterval(this.spamFlavioInterval);
        this.spamFlavioInterval = null;
        led?.classList.remove('active-green');
      } else {
        led?.classList.add('active-green');
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
          if (this.activeTab === 'telemetry' || this.activeTab === 'chat') {
            this.updateTabContent();
          }
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

        this.triggerPushVisual(mapping.candidateBenefited);
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
          userName: '@doador_admin',
          giftId: mapping.giftId,
          giftName: mapping.name,
          diamonds: mapping.diamondCost,
          timestamp: Date.now(),
        });

        if (this.activeTab === 'telemetry' || this.activeTab === 'ranking') {
          this.updateTabContent();
        }
      });
    });

    // Presets
    this.container.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).getAttribute('data-preset') as '180' | '30' | '15';
        this.applyPreset(preset);
      });
    });

    // Abas
    this.container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        this.activeTab = target.getAttribute('data-tab') as any;
        this.updateTabContent();
      });
    });

    // Sliders & Accordions de Tuning
    this.bindTuningSliders();

    // Reset Tuning
    document.getElementById('admin-btn-reset-tuning')?.addEventListener('click', () => {
      resetTuning();
      this.updateTuningValues();
    });

    // Busca de Tuning
    document.getElementById('admin-param-search')?.addEventListener('input', (e) => {
      this.paramSearchQuery = (e.target as HTMLInputElement).value;
      const tree = document.getElementById('admin-tuning-tree');
      if (tree) tree.innerHTML = this.renderTuningTreeHtml();
      this.bindTuningSliders();
    });

    // Se modal de placar estiver aberto, bind de seus botões
    if (this.showScoreModal) {
      document.getElementById('modal-btn-cancel-score')?.addEventListener('click', () => {
        this.showScoreModal = false;
        this.container.innerHTML = this.renderHtml();
        this.bindEvents();
      });

      document.getElementById('modal-btn-save-scores')?.addEventListener('click', () => {
        const lula = parseInt((document.getElementById('modal-score-session-lula') as HTMLInputElement).value, 10) || 0;
        const flavio = parseInt((document.getElementById('modal-score-session-flavio') as HTMLInputElement).value, 10) || 0;
        this.engine.setScores({ session: { lula, flavio } });
        this.showScoreModal = false;
        this.container.innerHTML = this.renderHtml();
        this.bindEvents();
      });

      document.getElementById('modal-btn-reset-session')?.addEventListener('click', () => {
        if (confirm('Confirma zerar o placar da sessão atual?')) {
          this.engine.resetScores(false);
          this.showScoreModal = false;
          this.container.innerHTML = this.renderHtml();
          this.bindEvents();
        }
      });

      document.getElementById('modal-btn-reset-total')?.addEventListener('click', () => {
        if (confirm('ATENÇÃO: Confirma zerar o placar TOTAL acumulado e da sessão?')) {
          this.engine.resetScores(true);
          this.showScoreModal = false;
          this.container.innerHTML = this.renderHtml();
          this.bindEvents();
        }
      });
    }

    // Se modal de presente estiver aberto
    if (this.showGiftModal) {
      document.getElementById('btn-cancel-gift-modal')?.addEventListener('click', () => {
        this.showGiftModal = null;
        this.container.innerHTML = this.renderHtml();
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
        this.bindEvents();
      });
    }

    this.bindTabEvents(document.getElementById('admin-tab-content'));
  }

  private applyPreset(preset: '180' | '30' | '15'): void {
    this.activePreset = preset;
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
    this.bindEvents();
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

    // Accordions
    this.container.querySelectorAll('.accordion-header').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const group = (e.currentTarget as HTMLElement).getAttribute('data-accordion');
        if (!group) return;
        const body = document.getElementById(`acc-body-${group}`);
        const arrow = (e.currentTarget as HTMLElement).querySelector('.accordion-arrow');
        if (body) {
          const isCollapsed = body.classList.toggle('collapsed');
          if (isCollapsed) {
            this.collapsedGroups.add(group);
            if (arrow) arrow.textContent = '▼';
          } else {
            this.collapsedGroups.delete(group);
            if (arrow) arrow.textContent = '▲';
          }
        }
      });
    });
  }

  private triggerPushVisual(candidate: 'lula' | 'flavio'): void {
    const lane = document.getElementById(candidate === 'lula' ? 'lane-preview-lula' : 'lane-preview-flavio');
    if (lane) {
      lane.classList.add('flash-push');
      setTimeout(() => lane.classList.remove('flash-push'), 450);
    }
  }

  private updateTabContent(): void {
    const el = document.getElementById('admin-tab-content');
    if (!el) return;

    el.innerHTML = this.renderTabContent();
    this.bindTabEvents(el);
  }

  private bindTabEvents(el: HTMLElement | null): void {
    if (!el) return;

    // Filtros de log
    el.querySelectorAll('.log-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filter = (e.currentTarget as HTMLElement).getAttribute('data-filter') as any;
        if (filter) {
          this.logFilter = filter;
          this.updateTabContent();
          return;
        }
        const windowVal = (e.currentTarget as HTMLElement).getAttribute('data-window') as any;
        if (windowVal) {
          this.donorWindow = windowVal;
          this.updateTabContent();
        }
      });
    });

    // Limpar logs
    document.getElementById('admin-btn-clear-logs')?.addEventListener('click', () => {
      this.engine.clearLogs();
      this.updateTabContent();
    });

    // Exportar logs em JSON
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

    // Salvar candidatos
    document.getElementById('admin-btn-save-cand-lula')?.addEventListener('click', () => {
      const name = (document.getElementById('admin-cand-name-lula') as HTMLInputElement)?.value;
      const number = (document.getElementById('admin-cand-num-lula') as HTMLInputElement)?.value;
      const color = (document.getElementById('admin-cand-color-lula') as HTMLInputElement)?.value;
      const avatarUrl = (document.getElementById('admin-cand-avatar-lula') as HTMLInputElement)?.value;
      liveServiceMock.updateCandidateProfile('lula', { name, number, color, avatarUrl });
      alert('Perfil do Candidato Lula salvo!');
    });

    document.getElementById('admin-btn-save-cand-flavio')?.addEventListener('click', () => {
      const name = (document.getElementById('admin-cand-name-flavio') as HTMLInputElement)?.value;
      const number = (document.getElementById('admin-cand-num-flavio') as HTMLInputElement)?.value;
      const color = (document.getElementById('admin-cand-color-flavio') as HTMLInputElement)?.value;
      const avatarUrl = (document.getElementById('admin-cand-avatar-flavio') as HTMLInputElement)?.value;
      liveServiceMock.updateCandidateProfile('flavio', { name, number, color, avatarUrl });
      alert('Perfil do Candidato Flávio salvo!');
    });

    // Color pickers sync
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

    // Reset presentes padrão
    document.getElementById('admin-btn-reset-gifts')?.addEventListener('click', () => {
      if (confirm('Restaurar tabela padrão de presentes?')) {
        giftRegistry.reset();
        this.updateTabContent();
      }
    });

    // Botões editar presente
    el.querySelectorAll('.btn-edit-gift').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const giftId = (e.currentTarget as HTMLElement).getAttribute('data-giftid');
        if (giftId) {
          this.showGiftModal = giftId;
          this.container.innerHTML = this.renderHtml();
          this.bindEvents();
        }
      });
    });
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
      liveBadge.textContent = liveStatus.state.toUpperCase();
      liveBadge.style.background =
        liveStatus.state === 'connected' ? '#064e3b' : liveStatus.state === 'reconnecting' ? '#78350f' : '#7f1d1d';
      liveBadge.style.color =
        liveStatus.state === 'connected' ? '#34d399' : liveStatus.state === 'reconnecting' ? '#fbbf24' : '#f87171';
    }

    const recEl = document.getElementById('admin-live-reconnects');
    if (recEl) recEl.textContent = String(liveStatus.reconnectCount);

    const errRow = document.getElementById('admin-live-error-row');
    const errEl = document.getElementById('admin-live-error');
    if (errRow && errEl) {
      errRow.style.display = liveStatus.lastError ? 'block' : 'none';
      errEl.textContent = liveStatus.lastError || '';
    }
  }

  private updateCandidateProfilesDisplay(): void {
    const profiles = liveServiceMock.getCandidateProfiles();
    const nameLula = document.getElementById('cand-profile-name-lula');
    if (nameLula) nameLula.textContent = profiles.lula.name;
    const nameFlavio = document.getElementById('cand-profile-name-flavio');
    if (nameFlavio) nameFlavio.textContent = profiles.flavio.name;

    const headNameLula = document.getElementById('header-cand-name-lula');
    if (headNameLula) headNameLula.textContent = `${profiles.lula.name.toUpperCase()}:`;
    const headNameFlavio = document.getElementById('header-cand-name-flavio');
    if (headNameFlavio) headNameFlavio.textContent = `:${profiles.flavio.name.toUpperCase()}`;

    const bodyLula = document.getElementById('admin-runner-body-lula');
    if (bodyLula) bodyLula.style.background = profiles.lula.color;
    const bodyFlavio = document.getElementById('admin-runner-body-flavio');
    if (bodyFlavio) bodyFlavio.style.background = profiles.flavio.color;
  }

  private updateDynamicState(): void {
    const state = this.engine.getState();
    const scores = this.engine.getScores();
    const liveStatus = liveServiceMock.getConnectionStatus();
    const trackLength = state.trackLength || getTuning('race.trackLength') || 100;

    // Cronômetro Principal
    const timerEl = document.getElementById('admin-main-timer');
    if (timerEl) {
      const mins = Math.floor(state.elapsedTimeSec / 60);
      const secs = (state.elapsedTimeSec % 60).toFixed(2).padStart(5, '0');
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${secs}`;
    }

    // Cronômetro Lateral
    const sideTime = document.getElementById('side-time-readout');
    if (sideTime) {
      const mins = Math.floor(state.elapsedTimeSec / 60);
      const secs = (state.elapsedTimeSec % 60).toFixed(2).padStart(5, '0');
      sideTime.textContent = `${String(mins).padStart(2, '0')}:${secs}`;
    }

    // Placar
    const scLula = document.getElementById('admin-score-lula');
    if (scLula) scLula.textContent = String(scores.session.lula);
    const scFlavio = document.getElementById('admin-score-flavio');
    if (scFlavio) scFlavio.textContent = String(scores.session.flavio);

    // Status da corrida
    const statusBadge = document.getElementById('admin-race-status-badge');
    const sideState = document.getElementById('side-state-readout');
    let statusText = state.status.toUpperCase();
    if (state.isPaused) statusText = 'PAUSADA';
    else if (state.status === 'intermission') statusText = `INTERVALO (${Math.ceil(state.intermissionRemainingSec)}s)`;

    if (statusBadge) statusBadge.textContent = statusText;
    if (sideState) sideState.textContent = statusText;

    // Metas de Pista e Duração
    const trackEl = document.getElementById('admin-track-length-display');
    if (trackEl) trackEl.textContent = `${trackLength}m`;
    const durEl = document.getElementById('admin-target-duration-display');
    if (durEl) durEl.textContent = `${getTuning('race.targetDurationSec')}s`;

    // Telemetria Lula
    const lula = state.candidates.lula;
    const lulaPct = Math.min(100, Math.round((lula.position / trackLength) * 100));
    const spdLula = document.getElementById('admin-speed-lula');
    if (spdLula) spdLula.textContent = `${lula.currentSpeed.toFixed(2)} m/s`;
    const posLula = document.getElementById('admin-pos-lula');
    if (posLula) posLula.textContent = `${lula.position.toFixed(1)} m`;
    const pctLula = document.getElementById('admin-pct-lula');
    if (pctLula) pctLula.textContent = `${lulaPct}%`;
    const barLula = document.getElementById('admin-bar-lula');
    if (barLula) barLula.style.width = `${lulaPct}%`;

    const sideLula = document.getElementById('side-lula-readout');
    if (sideLula) sideLula.textContent = `${lula.position.toFixed(1)}m / ${lula.currentSpeed.toFixed(2)}m/s`;

    const effLula = document.getElementById('admin-effects-lula');
    if (effLula) {
      const effList = lula.activeEffects.map((e) => `${e.type.toUpperCase()} (${e.remainingDurationSec.toFixed(1)}s)`);
      if (lula.hasShield) effList.push(`ESCUDO (${lula.shieldRemainingDurationSec.toFixed(1)}s)`);
      effLula.textContent = effList.length > 0 ? effList.join(', ') : 'NENHUM';
    }

    // Telemetria Flávio
    const flavio = state.candidates.flavio;
    const flavioPct = Math.min(100, Math.round((flavio.position / trackLength) * 100));
    const spdFlavio = document.getElementById('admin-speed-flavio');
    if (spdFlavio) spdFlavio.textContent = `${flavio.currentSpeed.toFixed(2)} m/s`;
    const posFlavio = document.getElementById('admin-pos-flavio');
    if (posFlavio) posFlavio.textContent = `${flavio.position.toFixed(1)} m`;
    const pctFlavio = document.getElementById('admin-pct-flavio');
    if (pctFlavio) pctFlavio.textContent = `${flavioPct}%`;
    const barFlavio = document.getElementById('admin-bar-flavio');
    if (barFlavio) barFlavio.style.width = `${flavioPct}%`;

    const sideFlavio = document.getElementById('side-flavio-readout');
    if (sideFlavio) sideFlavio.textContent = `${flavio.position.toFixed(1)}m / ${flavio.currentSpeed.toFixed(2)}m/s`;

    const effFlavio = document.getElementById('admin-effects-flavio');
    if (effFlavio) {
      const effList = flavio.activeEffects.map((e) => `${e.type.toUpperCase()} (${e.remainingDurationSec.toFixed(1)}s)`);
      if (flavio.hasShield) effList.push(`ESCUDO (${flavio.shieldRemainingDurationSec.toFixed(1)}s)`);
      effFlavio.textContent = effList.length > 0 ? effList.join(', ') : 'NENHUM';
    }

    // Posição dos corredores no 9:16 Preview
    // A pista no 9:16 vai de 4px até calc(100% - 28px) onde fica a linha quadriculada
    const runnerLula = document.getElementById('admin-preview-runner-lula');
    if (runnerLula) {
      runnerLula.style.left = `calc(${Math.min(88, Math.max(2, lulaPct * 0.88))}% + 4px)`;
    }
    const runnerFlavio = document.getElementById('admin-preview-runner-flavio');
    if (runnerFlavio) {
      runnerFlavio.style.left = `calc(${Math.min(88, Math.max(2, flavioPct * 0.88))}% + 4px)`;
    }

    // Animação de corrida
    const bodyLula = document.getElementById('admin-runner-body-lula');
    if (bodyLula) {
      if (state.status === 'running' && !state.isPaused) bodyLula.classList.add('running');
      else bodyLula.classList.remove('running');
    }
    const bodyFlavio = document.getElementById('admin-runner-body-flavio');
    if (bodyFlavio) {
      if (state.status === 'running' && !state.isPaused) bodyFlavio.classList.add('running');
      else bodyFlavio.classList.remove('running');
    }

    // Auras de poderes no preview
    const auraLula = document.getElementById('aura-lula');
    if (auraLula) {
      if (lula.hasShield) auraLula.className = 'runner-aura-shield';
      else if (lula.activeEffects.some((e) => e.type === 'impulse' || e.type === 'superStart'))
        auraLula.className = 'runner-aura-boost';
      else if (lula.activeEffects.some((e) => e.type === 'slip' || e.type === 'trip'))
        auraLula.className = 'runner-aura-slip';
      else auraLula.className = '';
    }

    const auraFlavio = document.getElementById('aura-flavio');
    if (auraFlavio) {
      if (flavio.hasShield) auraFlavio.className = 'runner-aura-shield';
      else if (flavio.activeEffects.some((e) => e.type === 'impulse' || e.type === 'superStart'))
        auraFlavio.className = 'runner-aura-boost';
      else if (flavio.activeEffects.some((e) => e.type === 'slip' || e.type === 'trip'))
        auraFlavio.className = 'runner-aura-slip';
      else auraFlavio.className = '';
    }

    // Tempo conectado
    const durLiveEl = document.getElementById('admin-live-duration');
    if (durLiveEl && liveStatus.state === 'connected') {
      const totalSec = Math.floor(liveStatus.connectedDurationSec + state.elapsedTimeSec);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      durLiveEl.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
    }
  }
}
