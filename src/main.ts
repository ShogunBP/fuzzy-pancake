import { RaceEngine } from './core/race_engine';
import { AdminPanel } from './ui/admin_panel';
import { isDebugMode, setupDebugPanel } from './ui/debug_panel';
import { EventLogUI } from './ui/event_log_ui';

const isDebug = isDebugMode();
const engine = new RaceEngine({ isDebug });

// Roteador simples por pathname ou query string (?admin=1 ou /admin)
const isAdminRoute = window.location.pathname.startsWith('/admin') || new URLSearchParams(window.location.search).has('admin');

if (isAdminRoute) {
  document.body.className = 'admin-body';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.display = 'block';

  let adminContainer = document.getElementById('admin-container');
  if (!adminContainer) {
    adminContainer = document.createElement('div');
    adminContainer.id = 'admin-container';
    document.body.innerHTML = '';
    document.body.appendChild(adminContainer);
  }
  const adminPanel = new AdminPanel(engine, adminContainer);
  adminPanel.mount();

  let lastTime = performance.now();
  function adminLoop(currentTime: number) {
    const deltaSec = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    engine.tick(Math.min(deltaSec, 0.1));
    requestAnimationFrame(adminLoop);
  }
  requestAnimationFrame(adminLoop);
} else {
  // Elementos da interface padrão
const scoreLulaEl = document.getElementById('score-lula')!;
const scoreFlavioEl = document.getElementById('score-flavio')!;
const raceStatusEl = document.getElementById('race-status')!;
const raceTimerEl = document.getElementById('race-timer')!;
const barLulaEl = document.getElementById('bar-lula')!;
const barFlavioEl = document.getElementById('bar-flavio')!;
const lulaSpeedEl = document.getElementById('lula-speed')!;
const flavioSpeedEl = document.getElementById('flavio-speed')!;
const effectsLulaEl = document.getElementById('effects-lula')!;
const effectsFlavioEl = document.getElementById('effects-flavio')!;
const indicatorLulaEl = document.getElementById('indicator-lula')!;
const indicatorFlavioEl = document.getElementById('indicator-flavio')!;
const selectUserMode = document.getElementById('select-user-mode') as HTMLSelectElement;

const btnStart = document.getElementById('btn-start')!;
const btnPause = document.getElementById('btn-pause')!;
const btnChat13 = document.getElementById('btn-chat-13')!;
const btnChat22 = document.getElementById('btn-chat-22')!;
const btnSpamLula = document.getElementById('btn-spam-lula')!;
const btnSpamFlavio = document.getElementById('btn-spam-flavio')!;
const btnGiftRose = document.getElementById('btn-gift-rose')!;
const btnGiftWhiteRose = document.getElementById('btn-gift-white-rose')!;
const btnGiftBanana = document.getElementById('btn-gift-banana')!;
const btnGiftDino = document.getElementById('btn-gift-dino')!;

let userSequence = 0;
function getSimulatedUserId(): string {
  if (selectUserMode && selectUserMode.value === 'single') {
    return 'usuario_fixo_teste';
  }
  return `usuario_${++userSequence}`;
}

function triggerPushIndicator(candidate: 'lula' | 'flavio') {
  const el = candidate === 'lula' ? indicatorLulaEl : indicatorFlavioEl;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 650);
}

// Botões principais
btnStart.addEventListener('click', () => {
  engine.startRace();
});

btnPause.addEventListener('click', () => {
  const current = engine.getState().isPaused;
  engine.setPaused(!current);
});

btnChat13.addEventListener('click', () => {
  const decision = engine.handleEvent({
    type: 'chat',
    userId: getSimulatedUserId(),
    candidateId: 'lula',
    timestamp: engine.getState().elapsedTimeSec,
  });
  if (decision.applied) {
    triggerPushIndicator('lula');
  }
});

btnChat22.addEventListener('click', () => {
  const decision = engine.handleEvent({
    type: 'chat',
    userId: getSimulatedUserId(),
    candidateId: 'flavio',
    timestamp: engine.getState().elapsedTimeSec,
  });
  if (decision.applied) {
    triggerPushIndicator('flavio');
  }
});

// Botões de Spam (10 msg/s por 3 segundos)
function startSpamSimulation(candidate: 'lula' | 'flavio', btn: HTMLElement) {
  const originalText = btn.textContent;
  btn.setAttribute('disabled', 'true');
  let count = 0;
  const maxCount = 30; // 30 mensagens em 3 segundos
  const interval = setInterval(() => {
    count++;
    btn.textContent = `🔥 Spam (${count}/${maxCount})`;
    const decision = engine.handleEvent({
      type: 'chat',
      userId: getSimulatedUserId(),
      candidateId: candidate,
      timestamp: engine.getState().elapsedTimeSec,
    });
    if (decision.applied) {
      triggerPushIndicator(candidate);
    }
    if (count >= maxCount) {
      clearInterval(interval);
      btn.removeAttribute('disabled');
      btn.textContent = originalText;
    }
  }, 100);
}

btnSpamLula.addEventListener('click', () => startSpamSimulation('lula', btnSpamLula));
btnSpamFlavio.addEventListener('click', () => startSpamSimulation('flavio', btnSpamFlavio));

// Botões de Presentes
btnGiftRose.addEventListener('click', () => {
  engine.handleEvent({
    type: 'gift',
    userId: `doador_${Date.now()}`,
    giftId: 'rose',
    repeatCount: 1,
    candidateBenefited: 'lula',
    power: 'impulse',
    timestamp: engine.getState().elapsedTimeSec,
  });
});

btnGiftWhiteRose.addEventListener('click', () => {
  engine.handleEvent({
    type: 'gift',
    userId: `doador_${Date.now()}`,
    giftId: 'white_rose',
    repeatCount: 1,
    candidateBenefited: 'flavio',
    power: 'impulse',
    timestamp: engine.getState().elapsedTimeSec,
  });
});

btnGiftBanana.addEventListener('click', () => {
  engine.handleEvent({
    type: 'gift',
    userId: `doador_${Date.now()}`,
    giftId: 'banana',
    repeatCount: 1,
    candidateBenefited: 'lula', // Beneficia Lula sabotando Flávio
    power: 'slip',
    timestamp: engine.getState().elapsedTimeSec,
  });
});

btnGiftDino.addEventListener('click', () => {
  engine.handleEvent({
    type: 'gift',
    userId: `doador_${Date.now()}`,
    giftId: 'dinosaur',
    repeatCount: 1,
    candidateBenefited: 'flavio', // Beneficia Flávio sabotando Lula
    power: 'slip',
    timestamp: engine.getState().elapsedTimeSec,
  });
});

// Inicializar Event Log UI
const logColumn = document.getElementById('log-column')!;
new EventLogUI(engine, logColumn);

// Setup do painel debug lil-gui se ?debug=1 estiver presente
if (isDebug) {
  setupDebugPanel(engine);
}

// Loop de animação e atualização
let lastTime = performance.now();

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateUI() {
  const state = engine.getState();
  const scores = engine.getScores();

  scoreLulaEl.textContent = scores.total.lula.toString();
  scoreFlavioEl.textContent = scores.total.flavio.toString();

  raceStatusEl.textContent = state.isPaused
    ? 'PAUSADO'
    : state.status === 'running'
    ? state.isAutoRacing
      ? 'CORRENDO (AUTO)'
      : 'CORRENDO'
    : state.status === 'intermission'
    ? `INTERVALO (${Math.ceil(state.intermissionRemainingSec)}s)`
    : 'AGUARDANDO';

  raceTimerEl.textContent = formatTime(state.elapsedTimeSec);

  const lulaPct = Math.min(100, (state.candidates.lula.position / state.trackLength) * 100);
  const flavioPct = Math.min(100, (state.candidates.flavio.position / state.trackLength) * 100);

  barLulaEl.style.width = `${lulaPct}%`;
  barLulaEl.textContent = `${Math.floor(lulaPct)}%`;

  barFlavioEl.style.width = `${flavioPct}%`;
  barFlavioEl.textContent = `${Math.floor(flavioPct)}%`;

  lulaSpeedEl.textContent = `${state.candidates.lula.currentSpeed.toFixed(2)} m/s`;
  flavioSpeedEl.textContent = `${state.candidates.flavio.currentSpeed.toFixed(2)} m/s`;

  // Renderizar efeitos ativos
  const formatEffects = (cand: typeof state.candidates.lula) => {
    const list: string[] = [];
    if (cand.hasShield) list.push(`🛡️ Escudo (${cand.shieldRemainingDurationSec.toFixed(1)}s)`);
    for (const eff of cand.activeEffects) {
      list.push(`⚡ ${eff.type} (${eff.remainingDurationSec.toFixed(1)}s)`);
    }
    return list.join(' | ');
  };

  effectsLulaEl.textContent = formatEffects(state.candidates.lula);
  effectsFlavioEl.textContent = formatEffects(state.candidates.flavio);
}

function loop(currentTime: number) {
  const deltaSec = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const clampedDelta = Math.min(deltaSec, 0.1);
  engine.tick(clampedDelta);
  updateUI();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
}
