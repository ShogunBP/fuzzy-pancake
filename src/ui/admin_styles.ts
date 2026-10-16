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
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  --admin-outline: #9b8f79;
  --admin-outline-variant: #4f4633;
  --admin-red: #ef4444;
  --admin-blue: #3b82f6;
  --admin-green: #10b981;
}

/* Tipografia */
.font-pixel {
  font-family: 'Press Start 2P', 'Courier New', monospace;
}
.font-mono {
  font-family: 'Geist', monospace;
  font-variant-numeric: tabular-nums;
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
  transition: none;
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
  padding: 6px 12px;
  text-transform: uppercase;
}
.arcade-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 #000000;
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
  color: #dfe2f1;
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
  padding: 8px 10px;
  background: var(--admin-surface-high);
  border: 1px solid #000;
  color: var(--admin-primary);
  font-weight: 700;
  font-size: 10px;
  cursor: pointer;
  text-transform: uppercase;
  border-left: 3px solid var(--admin-primary);
}
.accordion-header:hover {
  background: var(--admin-surface-highest);
}
.accordion-body {
  background: var(--admin-surface-lowest);
  border: 1px solid #000;
  border-top: none;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin-top: 6px;
}
.pixel-progress-track {
  width: 100%;
  height: 12px;
  background: #0f131d;
  overflow: hidden;
  display: flex;
}
.pixel-progress-bar-red {
  height: 100%;
  background: linear-gradient(90deg, #991b1b 0%, #ef4444 60%, #ffd165 100%);
  transition: width 0.1s linear;
}
.pixel-progress-bar-blue {
  height: 100%;
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 60%, #ffd165 100%);
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
  flex-wrap: wrap;
}

.admin-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-badge-icon {
  width: 32px;
  height: 32px;
  background: var(--admin-primary);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  font-weight: bold;
}

.admin-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Colunas */
.admin-col-left {
  width: 310px;
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.admin-col-right {
  width: 330px;
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

/* Preview 9:16 Arena */
.arena-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000000;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0 0 #000000;
  padding: 8px;
  position: relative;
  flex-shrink: 0;
}

.preview-aspect-box {
  width: 220px;
  height: 391px; /* Proporção 9:16 exata */
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
  padding: 6px 8px;
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
  width: 28px;
  height: 7px;
  background: #fef08a;
  border: 1px solid #000;
  box-shadow: 0 0 8px #fde047;
}
.preview-jumbotron {
  background: #000;
  border: 1px solid rgba(234, 179, 8, 0.4);
  text-align: center;
  padding: 2px 4px;
}

/* Régua de Distância 9:16 */
.preview-ruler {
  display: flex;
  justify-content: space-between;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid #1c1f2a;
  font-size: 7px;
  color: #94a3b8;
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
  border-bottom: 1px dashed rgba(255, 255, 255, 0.25);
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
  right: 8px;
  top: 0;
  bottom: 0;
  width: 10px;
  background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 6px 6px;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  opacity: 0.85;
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
  font-size: 7px;
  font-weight: bold;
  padding: 1px 3px;
  border: 1px solid #000;
  box-shadow: 1px 1px 0 #000;
  margin-bottom: 1px;
}
.preview-runner-body {
  width: 18px;
  height: 22px;
  border: 1.5px solid #000000;
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
  100% { transform: translateY(-2px); }
}

/* Aura de Poder no Corredor */
.runner-aura-boost {
  position: absolute;
  inset: -3px;
  border: 1.5px solid #facc15;
  box-shadow: 0 0 6px #facc15;
  animation: pulse-aura 0.6s infinite alternate;
}
.runner-aura-slip {
  position: absolute;
  inset: -3px;
  border: 1.5px solid #ef4444;
  box-shadow: 0 0 6px #ef4444;
}
.runner-aura-shield {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}
@keyframes pulse-aura {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Telemetria Cards */
.telemetry-card {
  padding: 8px;
}

/* Tabelas e log retro */
.arcade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.arcade-table th {
  padding: 6px 8px;
  text-align: left;
  background: #000000;
  color: var(--admin-outline);
  font-size: 9px;
  border-bottom: 1px solid #262a35;
}
.arcade-table td {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Filtros do Log */
.log-filter-btn {
  background: #262a35;
  color: #9b8f79;
  border: 1px solid #000;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 9px;
  font-weight: bold;
}
.log-filter-btn:hover {
  background: #313540;
  color: #fff;
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
  border-bottom: 2px solid transparent;
  color: #9b8f79;
  font-weight: bold;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 10px;
  text-transform: uppercase;
  transition: all 0.1s ease;
}
.tab-btn:hover {
  color: #dfe2f1;
}
.tab-btn.active {
  color: var(--admin-primary);
  border-bottom-color: var(--admin-primary);
  background: rgba(255, 209, 101, 0.05);
}

/* Sliders e Inputs */
.arcade-input {
  background: #0a0e18;
  border: 1px solid #262a35;
  color: #ffffff;
  padding: 5px 8px;
  font-size: 12px;
  width: 100%;
  border-radius: 0;
}
.arcade-input:focus {
  outline: none;
  border-color: var(--admin-primary);
}

/* Presets de Prova */
.preset-btn {
  padding: 4px 6px;
  border: 1px solid #000;
  box-shadow: 1px 1px 0 #000;
  font-size: 9px;
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
  font-size: 7px;
  padding: 1px 4px;
  border: 1px solid #15803d;
  text-transform: uppercase;
}
.badge-debuff {
  background: #450a0a;
  color: #f87171;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  padding: 1px 4px;
  border: 1px solid #b91c1c;
  text-transform: uppercase;
}
.badge-super {
  background: #422006;
  color: #facc15;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  padding: 1px 4px;
  border: 1px solid #ca8a04;
  text-transform: uppercase;
}

/* LED Indicators for Spam Toggles */
.led-indicator {
  width: 8px;
  height: 8px;
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
  padding: 3px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.log-badge-gift {
  background: #450a0a;
  color: #f87171;
  border: 1px solid #991b1b;
  padding: 1px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}
.log-badge-chat {
  background: #172554;
  color: #60a5fa;
  border: 1px solid #1e40af;
  padding: 1px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}
.log-badge-spam {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #475569;
  padding: 1px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}
.log-badge-system {
  background: #422006;
  color: #facc15;
  border: 1px solid #ca8a04;
  padding: 1px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}
`;
