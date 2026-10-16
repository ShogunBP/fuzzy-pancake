/**
 * Estilos canônicos do Painel Admin (Arcade Retrô Moderno).
 * Zero dependências de CDNs ou internet. Cores e tokens do DESIGN.md.
 */

export const ADMIN_STYLES = `
/* Reset & Base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Flex & Layout Utilities */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.w-full { width: 100%; }
.text-center { text-align: center; }
.text-right { text-align: right; }

body.admin-body {
  background: #0f131d;
  color: #dfe2f1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* Tokens de cores e bordas duras */
:root {
  --admin-surface: #0f131d;
  --admin-surface-low: #171b26;
  --admin-surface-container: #1c1f2a;
  --admin-surface-high: #262a35;
  --admin-surface-highest: #313540;
  --admin-surface-lowest: #0a0e18;
  --admin-primary: #ffd165;
  --admin-primary-dark: #eab308;
  --admin-outline: #cbd5e1; /* Cinza claro com contraste alto >= 4.5:1 contra fundos escuros */
  --admin-outline-muted: #94a3b8;
  --admin-outline-variant: #475569;
  --admin-red: #ef4444;
  --admin-red-bright: #f87171;
  --admin-blue: #3b82f6;
  --admin-blue-bright: #60a5fa;
  --admin-green: #10b981;
  --admin-green-bright: #34d399;
}

/* Tipografia */
.font-pixel {
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}
.font-mono {
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

/* Micro-botões com hit-target ampliado para acessibilidade e toque */
.arcade-micro-btn {
  font-size: 11px;
  padding: 2px 5px;
  line-height: 1;
  position: relative;
  min-width: 22px;
  min-height: 16px;
}
.arcade-micro-btn::after {
  content: '';
  position: absolute;
  inset: -6px;
  z-index: 1;
}

/* 16-Bit Pixel Borders & Arcade Shadows from dev/mock/DESIGN.md */
.pixel-border-heavy {
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000, inset 2px 2px 0px 0px rgba(255, 255, 255, 0.15), inset -2px -2px 0px 0px rgba(0, 0, 0, 0.6);
}
.pixel-border-gold {
  border: 3px solid #000000;
  box-shadow: 3px 3px 0px 0px #000000, inset 2px 2px 0px 0px #fde047, inset -2px -2px 0px 0px #92400e;
}
.pixel-border-red {
  border: 3px solid #000000;
  box-shadow: 3px 3px 0px 0px #000000, inset 2px 2px 0px 0px #fca5a5, inset -2px -2px 0px 0px #7f1d1d;
}
.pixel-border-blue {
  border: 3px solid #000000;
  box-shadow: 3px 3px 0px 0px #000000, inset 2px 2px 0px 0px #93c5fd, inset -2px -2px 0px 0px #1e3a8a;
}
.pixel-btn {
  position: relative;
  transition: transform 0.05s ease, box-shadow 0.05s ease;
}
.pixel-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px 0px #000000 !important;
}

/* CRT Scanline Simulation Overlay (Toggleable) */
.crt-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.6;
  display: none;
}
.crt-overlay.active {
  display: block;
}

/* Pulsing Arcade Animations */
@keyframes arcade-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.2; }
}
.animate-arcade-blink {
  animation: arcade-blink 0.8s infinite;
}

/* Botões arcade com sombra dura e clique tátil */
.arcade-btn {
  font-weight: 700;
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 0 #000000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.05s ease, box-shadow 0.05s ease;
  padding: 8px 14px;
  text-transform: uppercase;
  font-size: 12px;
  line-height: 1.2;
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
  background: #10b981;
  color: #000000;
}
.arcade-btn-green:hover {
  background: #34d399;
}

.arcade-btn-amber {
  background: #f59e0b;
  color: #000000;
}
.arcade-btn-amber:hover {
  background: #fbbf24;
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
  color: #ffffff;
}
.arcade-btn-dark:hover {
  background: #313540;
  color: #ffffff;
}

/* Caixas e painéis modulares */
.arcade-panel {
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 3px 3px 0 0 #000000;
}

.arcade-panel-inset {
  background: var(--admin-surface-lowest);
  border: 1px solid #262a35;
}

/* Accordion de Tuning */
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: var(--admin-surface-high);
  border: 1px solid #000;
  color: var(--admin-primary);
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  text-transform: uppercase;
  border-left: 3px solid var(--admin-primary);
}
.accordion-header:hover {
  background: var(--admin-surface-highest);
}
.accordion-header:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}
.accordion-body {
  background: var(--admin-surface-lowest);
  border: 1px solid #000;
  border-top: none;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.accordion-body.collapsed {
  display: none;
}

/* Segmented Pixel Progress Bar (dev/mock) */
.pixel-progress-frame {
  width: 100%;
  background: #000000;
  padding: 2px;
  border: 2px solid #000000;
  box-shadow: inset 1px 1px 0 #000000;
  margin-top: 4px;
}
.pixel-progress-track {
  width: 100%;
  height: 14px;
  background: #0f131d;
  overflow: hidden;
  display: flex;
}
.pixel-progress-bar-red {
  height: 100%;
  background: linear-gradient(90deg, #b91c1c 0%, #ef4444 60%, #ffd165 100%);
  transition: width 0.1s linear;
}
.pixel-progress-bar-blue {
  height: 100%;
  background: linear-gradient(90deg, #1d4ed8 0%, #3b82f6 60%, #ffd165 100%);
  transition: width 0.1s linear;
}

/* Layout do Cockpit */
#admin-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

header.admin-header {
  background: var(--admin-surface-low);
  border-bottom: 2px solid #000000;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 3px 0 0 #000000;
  z-index: 50;
  flex-shrink: 0;
}

.admin-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-badge-icon {
  width: 34px;
  height: 34px;
  background: var(--admin-primary);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  font-weight: bold;
  font-size: 16px;
}

.admin-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Colunas */
.admin-col-left {
  width: 320px;
  flex-shrink: 0;
  border-right: 2px solid #000000;
  box-shadow: 3px 0 0 0 #000000;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--admin-surface-low);
  z-index: 20;
}

.admin-col-center {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.admin-col-right {
  width: 340px;
  flex-shrink: 0;
  border-left: 2px solid #000000;
  box-shadow: -3px 0 0 0 #000000;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--admin-surface-low);
  z-index: 20;
}

/* Centro: Contêiner de Pré-visualização & Slot de Abas */
.admin-center-stage {
  display: flex;
  flex: 1;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

/* Slot de Pré-visualização com suporte a proporção (9:16 ou futuro 16:9) */
.preview-stage-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 100%;
}
.preview-stage-column[data-aspect="9:16"] {
  width: 360px;
}
.preview-stage-column[data-aspect="16:9"] {
  width: 640px;
}

.arena-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000000;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0 0 #000000;
  padding: 6px;
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
}

.preview-aspect-box {
  width: 100%;
  height: 100%;
  max-width: 100%;
  aspect-ratio: 9 / 16;
  background: #0f1423;
  border: 2px solid var(--admin-primary);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
}

/* Topo do estádio 9:16 (Refletores e Jumbotron) */
.preview-stadium-top {
  background: linear-gradient(180deg, #11192e 0%, #0d1424 100%);
  padding: 6px 10px;
  border-bottom: 2px solid #000;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preview-floodlights-mast {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preview-floodlight {
  width: 32px;
  height: 8px;
  background: #fef08a;
  border: 1px solid #000;
  box-shadow: 0 0 8px #fde047;
}
.preview-jumbotron {
  background: #000;
  border: 1px solid rgba(234, 179, 8, 0.6);
  text-align: center;
  padding: 4px 6px;
}

/* Régua de Distância 9:16 */
.preview-ruler {
  display: flex;
  justify-content: space-between;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.85);
  border-bottom: 1px solid #1c1f2a;
  font-size: 11px;
  color: #cbd5e1;
}

/* Faixas 9:16 dos corredores */
.preview-track-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #19161d;
}

.preview-lane {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
  overflow: hidden;
}
.preview-lane:last-child {
  border-bottom: none;
}
.preview-lane-lula {
  background: linear-gradient(90deg, #450a0a 0%, #7f1d1d 100%);
}
.preview-lane-flavio {
  background: linear-gradient(90deg, #0c2340 0%, #1e3a8a 100%);
}

/* Efeito visual flash de push no chat */
.preview-lane.flash-push {
  animation: lane-flash 0.5s ease-out;
}
@keyframes lane-flash {
  0% { filter: brightness(1.8); }
  100% { filter: brightness(1.0); }
}

/* Linha de Chegada Quadriculada */
.checkered-finish-line {
  position: absolute;
  right: 10px;
  top: 0;
  bottom: 0;
  width: 14px;
  background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 7px 7px;
  border-left: 2px solid #000;
  border-right: 2px solid #000;
  opacity: 0.9;
  z-index: 5;
}

/* Sprite do Corredor */
.preview-runner-sprite {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: left 0.1s linear;
  z-index: 10;
}
.preview-runner-badge {
  font-size: 11px;
  font-weight: bold;
  padding: 1px 4px;
  border: 1px solid #000;
  box-shadow: 1px 1px 0 #000;
  margin-bottom: 1px;
}
.preview-runner-body {
  width: 22px;
  height: 26px;
  border: 2px solid #000000;
  box-shadow: 1px 1px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.preview-runner-body.running {
  animation: runner-bob 0.25s infinite alternate ease-in-out;
}
@keyframes runner-bob {
  0% { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}

/* Aura de Poder no Corredor */
.runner-aura-boost {
  position: absolute;
  inset: -4px;
  border: 2px solid #facc15;
  box-shadow: 0 0 8px #facc15;
  animation: pulse-aura 0.6s infinite alternate;
}
.runner-aura-slip {
  position: absolute;
  inset: -4px;
  border: 2px solid #ef4444;
  box-shadow: 0 0 8px #ef4444;
}
.runner-aura-shield {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2.5px solid #38bdf8;
  box-shadow: 0 0 10px #38bdf8;
}
@keyframes pulse-aura {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Cartões Compactos de Candidatos abaixo do preview */
.preview-candidates-deck {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.candidate-compact-card {
  padding: 8px 10px;
  background: var(--admin-surface-low);
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.candidate-compact-card.card-lula {
  border-left: 4px solid #ef4444;
}
.candidate-compact-card.card-flavio {
  border-left: 4px solid #3b82f6;
}

/* Painel de Abas Lateral ao Preview */
.admin-tabbed-monitor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: var(--admin-surface-low);
  border: 2px solid #000000;
  box-shadow: 3px 3px 0 0 #000000;
}

/* Tabelas e log retro */
.arcade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.arcade-table th {
  padding: 8px 10px;
  text-align: left;
  background: #000000;
  color: var(--admin-outline);
  font-size: 11px;
  font-weight: 700;
  border-bottom: 2px solid #262a35;
  letter-spacing: 0.05em;
}
.arcade-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: middle;
}

/* Filtros do Log */
.log-filter-btn {
  background: #262a35;
  color: #cbd5e1;
  border: 1px solid #000;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.log-filter-btn:hover {
  background: #313540;
  color: #fff;
}
.log-filter-btn:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 1px;
}
.log-filter-btn.active {
  background: var(--admin-primary);
  color: #000000;
  border-color: #000;
  box-shadow: 1px 1px 0 #000;
}

/* Modais e Abas */
.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #94a3b8;
  font-weight: 700;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 12px;
  text-transform: uppercase;
  transition: color 0.1s ease, background 0.1s ease;
  white-space: nowrap;
}
.tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
}
.tab-btn:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: -2px;
}
.tab-btn.active {
  color: var(--admin-primary);
  border-bottom-color: var(--admin-primary);
  background: rgba(255, 209, 101, 0.08);
}

/* Sliders e Inputs */
.arcade-input {
  background: #0a0e18;
  border: 1px solid #334155;
  color: #ffffff;
  padding: 8px 10px;
  font-size: 13px;
  width: 100%;
  border-radius: 0;
  font-family: inherit;
}
.arcade-input:focus {
  outline: 2px solid var(--admin-primary);
  outline-offset: 1px;
  border-color: var(--admin-primary);
}

/* Presets de Prova */
.preset-btn {
  padding: 6px 8px;
  border: 1px solid #000;
  box-shadow: 1px 1px 0 #000;
  font-size: 11px;
  cursor: pointer;
  background: #262a35;
  color: #dfe2f1;
  text-align: center;
}
.preset-btn:hover {
  background: #313540;
}
.preset-btn.active {
  background: var(--admin-primary);
  color: #000;
  font-weight: bold;
}

/* Mini-deck de telemetria lateral */
.mini-telemetry-deck {
  background: #0a0e18;
  border: 1px solid #262a35;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Modal de Autenticação Arcade */
.admin-auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 24, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}
.admin-auth-card {
  width: 360px;
  background: #171b26;
  border: 3px solid #000000;
  box-shadow: 6px 6px 0 0 #000000;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}
.admin-auth-header {
  border-bottom: 2px solid #000;
  padding-bottom: 12px;
}
.admin-auth-pin {
  letter-spacing: 0.3em;
  font-size: 20px;
  text-align: center;
  font-weight: bold;
  height: 42px;
}

/* Modal Genérico Arcade */
.arcade-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}
.arcade-modal-dialog {
  background: #171b26;
  border: 3px solid #000;
  box-shadow: 5px 5px 0 #000;
  padding: 16px;
  width: 90%;
  max-width: 440px;
}

/* Barras de votação Top Mensagens */
.top-msg-bar-container {
  height: 6px;
  background: #0a0e18;
  border: 1px solid #262a35;
  margin-top: 3px;
  overflow: hidden;
}
.top-msg-bar {
  height: 100%;
}

/* Arcade Gift Cards from dev/mock/code.html */
.arcade-gift-card {
  background: var(--admin-surface-container);
  border: 2px solid #000000;
  box-shadow: 2px 2px 0 0 #000000;
  padding: 6px 8px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.05s ease;
}
.arcade-gift-card:hover {
  background: var(--admin-surface-high);
}
.arcade-gift-card:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #000000;
}
.arcade-gift-card.buff {
  border-color: rgba(16, 185, 129, 0.7);
}
.arcade-gift-card.debuff {
  border-color: rgba(239, 68, 68, 0.7);
}
.arcade-gift-card.super {
  border-color: rgba(234, 179, 8, 0.85);
}

.badge-buff {
  background: #052e16;
  color: #34d399;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #15803d;
  text-transform: uppercase;
}
.badge-debuff {
  background: #450a0a;
  color: #f87171;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #b91c1c;
  text-transform: uppercase;
}
.badge-super {
  background: #422006;
  color: #facc15;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #ca8a04;
  text-transform: uppercase;
}

/* LED Indicators for Spam Toggles */
.led-indicator {
  width: 10px;
  height: 10px;
  border: 1px solid #000000;
  background: #475569;
  display: inline-block;
}
.led-indicator.active-green {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.led-indicator.active-red {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

/* Log Readouts & Badges from dev/mock */
.log-counter-pill {
  background: #000000;
  border: 1px solid var(--admin-outline-variant);
  padding: 5px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.log-badge-gift {
  background: #450a0a;
  color: #f87171;
  border: 1px solid #991b1b;
  padding: 2px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
}
.log-badge-chat {
  background: #172554;
  color: #60a5fa;
  border: 1px solid #1e40af;
  padding: 2px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
}
.log-badge-spam {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #475569;
  padding: 2px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
}
.log-badge-system {
  background: #422006;
  color: #facc15;
  border: 1px solid #ca8a04;
  padding: 2px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
}

/* Acessibilidade: Respeito a prefers-reduced-motion (Vercel Guidelines) */
@media (prefers-reduced-motion: reduce) {
  .preview-runner-body.running,
  .runner-aura-boost,
  .preview-lane.flash-push,
  .animate-arcade-blink,
  .crt-overlay.active {
    animation: none !important;
  }
  .pixel-progress-bar-red,
  .pixel-progress-bar-blue,
  .preview-runner-sprite,
  .arcade-btn {
    transition: none !important;
  }
}
`;
