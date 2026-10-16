import GUI from 'lil-gui';
import { getTuning, listTuning, resetTuning, setTuning, type TuningPath } from '../config/tuning';
import type { RaceEngine } from '../core/race_engine';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

interface ParamMetaPt {
  name: string;
  categoryPt: string;
  desc: string;
}

const PARAM_TRANSLATIONS: Record<string, ParamMetaPt> = {
  'race.targetDurationSec': {
    name: 'Duração da Corrida [s]',
    categoryPt: '🏁 PISTA & DURAÇÃO',
    desc: 'Tempo que a corrida leva para terminar sem interferência do chat/presentes',
  },
  'race.trackLength': {
    name: 'Extensão da Pista [m]',
    categoryPt: '🏁 PISTA & DURAÇÃO',
    desc: 'Distância total em metros abstratos até a linha de chegada',
  },
  'race.intermissionSec': {
    name: 'Intervalo pós-corrida [s]',
    categoryPt: '🏁 PISTA & DURAÇÃO',
    desc: 'Tempo de exibição do placar antes da próxima corrida iniciar',
  },
  'chat.minIntervalPerUserSec': {
    name: 'Intervalo Mín. por Usuário [s]',
    categoryPt: '💬 REGRAS DO CHAT (13/22)',
    desc: 'Proteção anti-spam: mensagens do mesmo usuário antes desse tempo são ignoradas',
  },
  'chat.maxLeadShiftPct': {
    name: 'Teto de Vantagem do Chat [%]',
    categoryPt: '💬 REGRAS DO CHAT (13/22)',
    desc: 'Vantagem máxima da pista que o chat sozinho pode abrir entre os candidatos',
  },
  'chat.pushSpeedPct': {
    name: 'Empurrão por Mensagem [%]',
    categoryPt: '💬 REGRAS DO CHAT (13/22)',
    desc: 'Bônus percentual temporário de velocidade concedido por cada chat válido',
  },
  'chat.pushDurationSec': {
    name: 'Duração do Empurrão [s]',
    categoryPt: '💬 REGRAS DO CHAT (13/22)',
    desc: 'Tempo em segundos que o empurrão do chat permanece ativo',
  },
  'power.impulseSpeedPct': {
    name: 'Rosa: Bônus de Velocidade [%]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Aumento de velocidade do candidato beneficiado pela Rosa / Rosa Branca',
  },
  'power.impulseDurationSec': {
    name: 'Rosa: Duração [s]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Duração do efeito de impulso da Rosa',
  },
  'power.slipSlowdownPct': {
    name: 'Banana: Redução do Rival [%]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Percentual de redução de velocidade sofrido pelo adversário que escorrega',
  },
  'power.slipDurationSec': {
    name: 'Banana: Duração [s]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Tempo que o adversário fica escorregando e mais lento',
  },
  'power.superStartSpeedPct': {
    name: 'Donut: Super Arrancada [%]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Bônus massivo de arrancada do Donut / Capivara',
  },
  'power.superStartDurationSec': {
    name: 'Donut: Duração [s]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Tempo de duração da super arrancada',
  },
  'power.tripSlowdownPct': {
    name: 'Confete: Tropeço no Rival [%]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Redução drástica de velocidade imposta ao rival por tropeço',
  },
  'power.tripDurationSec': {
    name: 'Confete: Duração Tropeço [s]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Duração do tropeço no adversário',
  },
  'power.shieldDurationSec': {
    name: 'Escudo: Duração de Proteção [s]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Tempo que o escudo protetor fica ativo bloqueando a próxima sabotagem',
  },
  'power.stackMaxFactor': {
    name: 'Renovação Máxima de Efeito [x]',
    categoryPt: '🎁 SUPER PODERES & PRESENTES',
    desc: 'Multiplicador máximo de renovação da duração acumulada de mesmo efeito',
  },
  'balance.rubberBandPct': {
    name: 'Rubber-band: Bônus de Recuperação [%]',
    categoryPt: '⚖ EQUILÍBRIO (RUBBER-BAND)',
    desc: 'Aceleração extra para o candidato que ficou muito para trás',
  },
  'balance.rubberBandGapPct': {
    name: 'Distância para Ativar Equilíbrio [%]',
    categoryPt: '⚖ EQUILÍBRIO (RUBBER-BAND)',
    desc: 'Distância mínima entre os candidatos na pista para o rubber-band ser acionado',
  },
  'auto.idleThresholdSec': {
    name: 'Tempo sem Chat para Rodar Sozinho [s]',
    categoryPt: '🤖 CORRIDA AUTOMÁTICA (IDLE)',
    desc: 'Segundos sem nenhuma interação para o sistema entrar em modo automático',
  },
  'auto.paceVariationPct': {
    name: 'Variação Natural de Ritmo [%]',
    categoryPt: '🤖 CORRIDA AUTOMÁTICA (IDLE)',
    desc: 'Oscilação suave natural entre os candidatos gerada pela seed (sem superpoderes)',
  },
  'auto.simulatePowers': {
    name: 'Simular Poderes Sozinho (0/1)',
    categoryPt: '🤖 CORRIDA AUTOMÁTICA (IDLE)',
    desc: 'Se ligado (1), simula poderes sozinhos. Padrão desligado (0) para manter o log limpo',
  },
  'auto.simulatePowersRatePerSec': {
    name: 'Taxa de Poderes Simulados [evt/s]',
    categoryPt: '🤖 CORRIDA AUTOMÁTICA (IDLE)',
    desc: 'Frequência de poderes automáticos por segundo caso simulatePowers esteja ativo',
  },
};

export function setupDebugPanel(engine?: RaceEngine): GUI | null {
  if (typeof window === 'undefined') return null;

  const gui = new GUI({ title: '⚡ Painel de Ajustes (Tuning)' });
  gui.domElement.style.maxHeight = '85vh';
  gui.domElement.style.overflowY = 'auto';

  // 1. MONITOR DE ESTADO EM TEMPO REAL
  if (engine) {
    const statusFolder = gui.addFolder('📊 ESTADO AO VIVO');
    const liveMonitor = {
      status: 'Aguardando',
      tempo: '00:00',
      lula: '0m (0%) - 0.00 m/s',
      flavio: '0m (0%) - 0.00 m/s',
      lulaEfeitos: 'Nenhum',
      flavioEfeitos: 'Nenhum',
    };

    statusFolder.add(liveMonitor, 'status').name('Status').listen().disable();
    statusFolder.add(liveMonitor, 'tempo').name('Tempo').listen().disable();
    statusFolder.add(liveMonitor, 'lula').name('🔴 Lula').listen().disable();
    statusFolder.add(liveMonitor, 'flavio').name('🔵 Flávio').listen().disable();
    statusFolder.add(liveMonitor, 'lulaEfeitos').name('Efeitos Lula').listen().disable();
    statusFolder.add(liveMonitor, 'flavioEfeitos').name('Efeitos Flávio').listen().disable();

    setInterval(() => {
      const state = engine.getState();
      liveMonitor.status = state.isPaused ? 'PAUSADO' : state.status;
      const m = Math.floor(state.elapsedTimeSec / 60);
      const s = Math.floor(state.elapsedTimeSec % 60);
      liveMonitor.tempo = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      const lula = state.candidates.lula;
      const flavio = state.candidates.flavio;
      const lulaPct = ((lula.position / state.trackLength) * 100).toFixed(1);
      const flavioPct = ((flavio.position / state.trackLength) * 100).toFixed(1);

      liveMonitor.lula = `${lula.position.toFixed(1)}m (${lulaPct}%) - ${lula.currentSpeed.toFixed(2)} m/s`;
      liveMonitor.flavio = `${flavio.position.toFixed(1)}m (${flavioPct}%) - ${flavio.currentSpeed.toFixed(2)} m/s`;

      const formatEffs = (cand: typeof lula) => {
        const parts: string[] = [];
        if (cand.hasShield) parts.push(`🛡️ Escudo (${cand.shieldRemainingDurationSec.toFixed(1)}s)`);
        for (const eff of cand.activeEffects) {
          parts.push(`⚡ ${eff.type} (${eff.remainingDurationSec.toFixed(1)}s)`);
        }
        return parts.length ? parts.join(', ') : 'Nenhum';
      };

      liveMonitor.lulaEfeitos = formatEffs(lula);
      liveMonitor.flavioEfeitos = formatEffs(flavio);
    }, 100);

    statusFolder.open();

    // 2. PRESETS RÁPIDOS
    const presetFolder = gui.addFolder('⚡ PRESETS RÁPIDOS DE TESTE');
    const presets = {
      presetPadrao: () => {
        setTuning('race.targetDurationSec', 180);
        setTuning('race.trackLength', 100);
        setTuning('auto.idleThresholdSec', 20);
        gui.destroy();
        setupDebugPanel(engine);
      },
      preset30s: () => {
        setTuning('race.targetDurationSec', 30);
        setTuning('race.trackLength', 100);
        setTuning('auto.idleThresholdSec', 6);
        gui.destroy();
        setupDebugPanel(engine);
      },
      presetTurbo15s: () => {
        setTuning('race.targetDurationSec', 15);
        setTuning('race.trackLength', 50);
        setTuning('chat.pushSpeedPct', 10);
        gui.destroy();
        setupDebugPanel(engine);
      },
    };

    presetFolder.add(presets, 'presetPadrao').name('⏱ Padrão (3 minutos / 180s)');
    presetFolder.add(presets, 'preset30s').name('🚀 Rápido (30 segundos)');
    presetFolder.add(presets, 'presetTurbo15s').name('⚡ Turbo (15s / Pista 50m)');

    // 2.1 POLÍTICA DE APLICAÇÃO E ALTERAÇÕES PENDENTES
    const isDebugActive = isDebugMode();
    const policyFolder = gui.addFolder('ℹ️ POLÍTICA DE TUNING');
    const policyMonitor = {
      modo: isDebugActive ? '⚡ IMEDIATO (?debug=1 ativo)' : '⏳ PRÓXIMA CORRIDA (produção)',
      pendentes: 'Nenhuma',
    };
    policyFolder.add(policyMonitor, 'modo').name('Modo').disable();
    policyFolder.add(policyMonitor, 'pendentes').name('Pendentes p/ Próxima').listen().disable();

    setInterval(() => {
      const pending = engine.getPendingTuningOverrides();
      const keys = pending ? Object.keys(pending) : [];
      policyMonitor.pendentes = keys.length > 0 ? `${keys.length} pendente(s): ${keys.join(', ')}` : 'Nenhuma';
    }, 250);
  }

  // 3. BUSCA RÁPIDA DE PARÂMETROS
  const allCategoryFolders: GUI[] = [];
  const allControllers: { controller: any; name: string; path: string; folder: GUI }[] = [];

  const searchBox = { termo: '' };
  const searchCtrl = gui.add(searchBox, 'termo').name('🔍 Buscar Parâmetro').listen();
  searchCtrl.onChange((term: string) => {
    const q = term.trim().toLowerCase();
    for (const item of allControllers) {
      const matches = !q || item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q);
      item.controller.show(matches);
      if (q && matches) {
        item.folder.open();
      }
    }
  });

  // 4. PARÂMETROS DE TUNING POR CATEGORIA EM PORTUGUÊS
  const entries = listTuning();
  const categoriesMap: Record<string, typeof entries> = {};

  for (const entry of entries) {
    const metaInfo = PARAM_TRANSLATIONS[entry.path] ?? {
      name: entry.path,
      categoryPt: 'OUTROS',
      desc: entry.desc,
    };

    if (!categoriesMap[metaInfo.categoryPt]) {
      categoriesMap[metaInfo.categoryPt] = [];
    }
    categoriesMap[metaInfo.categoryPt].push(entry);
  }

  for (const [categoryTitle, catEntries] of Object.entries(categoriesMap)) {
    const folder = gui.addFolder(categoryTitle);
    allCategoryFolders.push(folder);

    // Botão de restaurar apenas este grupo
    folder
      .add(
        {
          restaurarGrupo: () => {
            for (const entry of catEntries) {
              setTuning(entry.path as TuningPath, entry.default);
            }
            gui.destroy();
            setupDebugPanel(engine);
          },
        },
        'restaurarGrupo',
      )
      .name('↺ Restaurar Este Grupo');

    const folderState: Record<string, number> = {};

    for (const entry of catEntries) {
      const metaInfo = PARAM_TRANSLATIONS[entry.path];
      const baseName = metaInfo ? metaInfo.name : entry.path;
      folderState[entry.path] = getTuning(entry.path);

      const isModified = getTuning(entry.path) !== entry.default;
      const initialDisplayName = `${baseName} [Padrão: ${entry.default}${entry.unit}]${isModified ? ' ★' : ''}`;

      const controller = folder
        .add(folderState, entry.path, entry.min, entry.max)
        .name(initialDisplayName)
        .onChange((val: number) => {
          setTuning(entry.path as TuningPath, val);
          const changed = val !== entry.default;
          controller.name(`${baseName} [Padrão: ${entry.default}${entry.unit}]${changed ? ' ★' : ''}`);
        });

      if (controller.domElement) {
        controller.domElement.title = `${metaInfo?.desc || entry.desc}\nPadrão: ${entry.default} ${entry.unit}`;
      }

      allControllers.push({
        controller,
        name: baseName,
        path: entry.path,
        folder,
      });
    }
    folder.close();
  }

  // 5. RESTAURAR TUDO
  const resetFolder = gui.addFolder('🔄 RESTAURAR');
  resetFolder.add(
    {
      restaurarPadroes: () => {
        resetTuning();
        gui.destroy();
        setupDebugPanel(engine);
      },
    },
    'restaurarPadroes',
  ).name('Restaurar Todos os Padrões');
  resetFolder.close();

  return gui;
}
