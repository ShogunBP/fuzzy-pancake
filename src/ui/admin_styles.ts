/**
 * Estilos canônicos do Painel Admin (Arcade Retrô Moderno).
 * Zero dependências de CDNs. Fontes Space Grotesk e Geist locais.
 * Conforme DESIGN.md e diretrizes da Rodada 3 (2026-10-16).
 */

export const ADMIN_STYLES = `
/* ============================================================
   1. FONTES LOCAIS (Space Grotesk & Geist) - OFL 1.1
   ============================================================ */
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/SpaceGrotesk.woff2') format('woff2');
}

@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/Geist.woff2') format('woff2');
}

/* ============================================================
   2. RESET & BASE TOKENS (DESIGN.md)
   ============================================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --admin-surface: #0f131d;
  --admin-surface-low: #171b26;
  --admin-surface-container: #1c1f2a;
  --admin-surface-high: #262a35;
  --admin-surface-highest: #313540;
  --admin-surface-lowest: #0a0e18;
  
  --admin-primary: #ffd165;
  --admin-primary-dark: #eab308;
  --admin-outline: #cbd5e1;
  --admin-outline-muted: #94a3b8;
  --admin-outline-variant: #475569;
  
  --admin-red: #ef4444;
  --admin-red-bright: #f87171;
  --admin-blue: #3b82f6;
  --admin-blue-bright: #60a5fa;
  --admin-green: #10b981;
  --admin-green-bright: #34d399;
  --admin-gold: #eab308;

  --font-display: 'Space Grotesk', -apple-system, sans-serif;
  --font-body: 'Geist', -apple-system, sans-serif;
}

body.admin-body {
  background: var(--admin-surface);
  color: #dfe2f1;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.4;
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: block !important;
  user-select: none;
}

#admin-container {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: block !important;
}

#admin-root {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Utilitários tipográficos */
.font-display {
  font-family: var(--font-display);
  font-weight: 700;
}
.font-body {
  font-family: var(--font-body);
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* ============================================================
   3. BOTÕES ARCADE TÁTEIS & CHIPS
   ============================================================ */
.arcade-btn {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 0 #000000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  text-transform: uppercase;
  line-height: 1.2;
  transition: transform 0.05s ease, box-shadow 0.05s ease, background-color 0.1s ease;
  user-select: none;
  white-space: nowrap;
}

.arcade-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 #000000;
}

.arcade-btn:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}

.arcade-btn-primary {
  background: #eab308;
  color: #000000;
}
.arcade-btn-primary:hover {
  background: #ffd165;
}

.arcade-btn-green {
  background: #059669;
  color: #ffffff;
}
.arcade-btn-green:hover {
  background: #10b981;
}

.arcade-btn-amber {
  background: #d97706;
  color: #ffffff;
}
.arcade-btn-amber:hover {
  background: #f59e0b;
}

.arcade-btn-danger {
  background: #dc2626;
  color: #ffffff;
}
.arcade-btn-danger:hover {
  background: #ef4444;
}

.arcade-btn-dark {
  background: #262a35;
  color: #f8fafc;
}
.arcade-btn-dark:hover {
  background: #334155;
}

.arcade-btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

/* Painéis com bordas duras chanfradas */
.arcade-panel {
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 0 #000000;
  position: relative;
}

/* Inset inputs */
.arcade-input {
  background: var(--admin-surface-lowest);
  border: 2px solid #000000;
  box-shadow: inset 2px 2px 0 0 #000000;
  color: #f8fafc;
  font-family: var(--font-body);
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
}
.arcade-input:focus {
  border-color: var(--admin-primary);
}

/* ============================================================
   4. BARRA ÚNICA SUPERIOR (~44px)
   ============================================================ */
.admin-topbar {
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  background: #12161f;
  border-bottom: 2px solid #000000;
  box-shadow: 0 2px 0 0 #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  gap: 12px;
  z-index: 100;
  position: relative;
}

.admin-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.admin-nav-tab {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  padding: 6px 16px;
  background: #1c1f2a;
  color: #94a3b8;
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  cursor: pointer;
  transition: all 0.1s ease;
}
.admin-nav-tab:hover {
  background: #262a35;
  color: #ffffff;
}
.admin-nav-tab.active {
  background: #ffd165;
  color: #000000;
  box-shadow: 2px 2px 0 #000000;
}

.admin-topbar-center {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.admin-status-chip {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #000000;
  background: #422006;
  color: #fde047;
  white-space: nowrap;
}

.admin-timer-display {
  font-family: var(--font-body);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 14px;
  color: #ffd165;
  background: #000000;
  border: 1px solid #334155;
  padding: 3px 8px;
  white-space: nowrap;
}

.admin-score-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #000000;
  border: 2px solid #000000;
  padding: 4px 10px;
  font-family: var(--font-display);
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
}

.admin-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.admin-simulated-badge {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  background: #78350f;
  color: #fef08a;
  border: 2px solid #000000;
  padding: 3px 8px;
  box-shadow: 1px 1px 0 #000000;
}

/* ============================================================
   5. WORKSPACE PRINCIPAL (3 COLUNAS EM 1920×940)
   ============================================================ */
.admin-workspace {
  height: calc(100vh - 44px);
  max-height: calc(100vh - 44px);
  display: grid;
  grid-template-columns: 310px 1fr 430px;
  gap: 12px;
  padding: 10px 14px;
  overflow: hidden;
}

.admin-col-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
}

.admin-col-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.admin-col-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* ============================================================
   6. COLUNA CENTRAL: PALCO 9:16 PERMANENTE & CARDS
   ============================================================ */
.arena-preview-wrapper {
  flex: 1 1 auto;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-aspect-box {
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: calc(100vh - 170px);
  background: #090d16;
  border: 3px solid #000000;
  box-shadow: 3px 3px 0 0 #000000;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}

.preview-track-area {
  flex: 1;
  position: relative;
  display: flex;
  background: #111827;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  overflow: hidden;
}

.preview-ruler {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #000000;
  font-family: var(--font-body);
  font-size: 12px;
  color: #94a3b8;
  border-bottom: 1px solid #262a35;
}

.preview-lane {
  flex: 1;
  position: relative;
  border-right: 1px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 8px;
}
.preview-lane:last-child {
  border-right: none;
}
.preview-lane-lula {
  background: rgba(220, 38, 38, 0.05);
}
.preview-lane-flavio {
  background: rgba(37, 99, 235, 0.05);
}

.preview-finish-line {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    #ffffff,
    #ffffff 8px,
    #000000 8px,
    #000000 16px
  );
  border-top: 1px solid #000000;
  border-bottom: 1px solid #000000;
  z-index: 5;
}

.preview-runner-sprite {
  position: absolute;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: bottom 0.1s linear;
  z-index: 10;
}

.preview-runner-badge {
  font-family: var(--font-display);
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid #000000;
  color: #ffffff;
  font-weight: 700;
}

.preview-runner-body {
  width: 28px;
  height: 36px;
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 0 #000000;
  position: relative;
}

.runner-aura-boost {
  position: absolute;
  inset: -4px;
  border: 2px dashed #ffd165;
  animation: arcade-blink 0.4s infinite;
  pointer-events: none;
}

/* Badges de combate táteis mantidos no painel */
.arcade-float-badge {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #000000;
  border: 2px solid currentColor;
  padding: 4px 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 25;
  animation: float-badge-up 0.75s ease-out forwards;
}

@keyframes float-badge-up {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.85); }
  20% { opacity: 1; transform: translate(-50%, -10px) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -20px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -30px) scale(0.95); }
}

/* Cartões compactos de candidatos abaixo do quadro (mesma largura) */
.preview-candidates-deck {
  width: 100%;
  max-width: 320px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  flex: none;
}

.candidate-compact-card {
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.candidate-compact-card.card-lula {
  border-left: 4px solid var(--admin-red);
}
.candidate-compact-card.card-flavio {
  border-left: 4px solid var(--admin-blue);
}

.candidate-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-card-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  color: #ffffff;
}

.candidate-card-stats {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--admin-outline);
  display: flex;
  justify-content: space-between;
}

.candidate-progress-bar-bg {
  width: 100%;
  height: 6px;
  background: #000000;
  border: 1px solid #334155;
  overflow: hidden;
}
.candidate-progress-bar-fill {
  height: 100%;
  transition: width 0.1s linear;
}

/* ============================================================
   7. ABA OPERAR: BLOCOS ESQUERDA & MONITOR DIREITA
   ============================================================ */
/* Conexão compacta */
.admin-connection-card {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.admin-connection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-connection-title {
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--admin-primary);
  font-weight: 700;
}

/* Bloco Simular recolhível (aberto por padrão) */
.admin-accordion-header {
  width: 100%;
  padding: 8px 10px;
  background: var(--admin-surface-high);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.admin-accordion-body {
  padding: 8px;
  background: var(--admin-surface-container);
  border: 2px solid #000000;
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-accordion-body.collapsed {
  display: none;
}

/* Grade rápida de presentes sem rolagem */
.admin-gifts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.arcade-gift-mini-card {
  background: var(--admin-surface-container);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.05s ease;
  text-align: left;
}
.arcade-gift-mini-card:hover {
  background: var(--admin-surface-high);
}
.arcade-gift-mini-card:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #000000;
}

/* Monitor lateral com abas */
.admin-monitor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
}

.admin-monitor-tabs {
  display: flex;
  background: #000000;
  border-bottom: 2px solid #000000;
  flex: none;
}

.admin-tab-btn {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  padding: 8px 12px;
  background: #171b26;
  color: #94a3b8;
  border: none;
  border-right: 1px solid #262a35;
  cursor: pointer;
  flex: 1;
  text-align: center;
  white-space: nowrap;
}
.admin-tab-btn:hover {
  background: #262a35;
  color: #ffffff;
}
.admin-tab-btn.active {
  background: #1c1f2a;
  color: var(--admin-primary);
  border-bottom: 2px solid var(--admin-primary);
}

.admin-monitor-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

/* Tabelas arcade com mínimo de 12px */
.arcade-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: 12px;
}
.arcade-table th {
  background: #000000;
  color: var(--admin-outline);
  padding: 6px 8px;
  text-align: left;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  border-bottom: 2px solid #262a35;
  white-space: nowrap;
}
.arcade-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #1c1f2a;
  font-size: 12px;
}
.arcade-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* ============================================================
   8. ABA CONFIGURAR: CATEGORIAS & PARÂMETROS
   ============================================================ */
.admin-config-left-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  padding: 6px;
  overflow-y: auto;
}

.admin-category-btn {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  text-align: left;
  padding: 8px 12px;
  background: #171b26;
  color: #cbd5e1;
  border: 1px solid #262a35;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-category-btn:hover {
  background: #262a35;
  color: #ffffff;
}
.admin-category-btn.active {
  background: #262a35;
  color: #ffd165;
  border-left: 4px solid #ffd165;
  box-shadow: 2px 2px 0 #000000;
}

.admin-config-right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
}

.admin-config-header {
  padding: 10px 14px;
  border-bottom: 2px solid #000000;
  background: #12161f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: none;
}

.admin-config-title {
  font-family: var(--font-display);
  font-size: 14px;
  color: #ffd165;
  font-weight: 700;
}

.admin-config-alert {
  padding: 6px 12px;
  background: #0a0e18;
  border-left: 4px solid #ffd165;
  font-size: 12px;
  color: #cbd5e1;
  flex: none;
  margin: 8px 12px 0;
}

.admin-params-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-param-card {
  background: var(--admin-surface-container);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 #000000;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.admin-param-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.admin-param-name {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}
.admin-param-val {
  font-family: var(--font-body);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 14px;
  color: #ffd165;
}
.admin-param-key {
  font-family: var(--font-body);
  font-size: 12px;
  color: #94a3b8;
}
.admin-param-desc {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.4;
}
.admin-param-slider {
  width: 100%;
  accent-color: #eab308;
  cursor: pointer;
  margin-top: 4px;
}

/* ============================================================
   9. MODAIS & OVERLAYS
   ============================================================ */
.arcade-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.arcade-modal-dialog {
  background: var(--admin-surface-low);
  border: 3px solid #000000;
  box-shadow: 4px 4px 0 #000000;
  padding: 16px;
  width: 440px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.arcade-modal-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  color: var(--admin-primary);
  border-bottom: 2px solid #000000;
  padding-bottom: 6px;
}

/* CRT Overlay */
.crt-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 9990;
  opacity: 0.6;
  display: none;
}
.crt-overlay.active {
  display: block;
}

/* ============================================================
   10. ACESSIBILIDADE: PREFERS-REDUCED-MOTION
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;
