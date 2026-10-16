/**
 * Fonte ÚNICA de todos os valores ajustáveis do jogo (skill `tuning-vars`).
 * Definido a partir do card `[in-progress]-core-da-corrida-poderes-e-tuning`.
 *
 * Regras:
 * 1. Nenhum número de comportamento de jogo fora deste arquivo.
 * 2. Leia SEMPRE na hora do uso (`getTuning('race.targetDurationSec')`).
 * 3. Nunca copie para constante estática de módulo.
 */

export interface NumberParam {
  value: number;
  min: number;
  max: number;
  /** Unidade humana: 's', 'm', '%', 'x', etc. */
  unit: string;
  desc: string;
}

type TuningTree = Record<string, Record<string, NumberParam>>;

export const TUNING_DEFAULTS = {
  race: {
    targetDurationSec: { value: 180, min: 30, max: 1800, unit: 's', desc: 'Duração estimada da corrida sem interação' },
    trackLength: { value: 100, min: 50, max: 1000, unit: 'm', desc: 'Comprimento abstrato da pista de corrida' },
    intermissionSec: { value: 15, min: 3, max: 120, unit: 's', desc: 'Tempo de exibição do placar entre corridas' },
  },
  chat: {
    minIntervalPerUserSec: { value: 3, min: 1, max: 60, unit: 's', desc: 'Intervalo mínimo entre mensagens válidas por usuário' },
    maxLeadShiftPct: { value: 15, min: 1, max: 50, unit: '%', desc: 'Teto de deslocamento de liderança causado apenas pelo chat' },
    pushSpeedPct: { value: 2, min: 0.1, max: 20, unit: '%', desc: 'Acréscimo percentual de velocidade por mensagem' },
    pushDurationSec: { value: 1, min: 0.1, max: 10, unit: 's', desc: 'Duração do impulso de velocidade por mensagem' },
  },
  power: {
    impulseSpeedPct: { value: 25, min: 5, max: 100, unit: '%', desc: 'Impulso de velocidade (Rosa / Rosa Branca)' },
    impulseDurationSec: { value: 4, min: 1, max: 30, unit: 's', desc: 'Duração do impulso de velocidade' },
    slipSlowdownPct: { value: 40, min: 5, max: 95, unit: '%', desc: 'Redução de velocidade no rival por escorregão (Banana / Dinossauro)' },
    slipDurationSec: { value: 3, min: 1, max: 20, unit: 's', desc: 'Duração do escorregão' },
    superStartSpeedPct: { value: 60, min: 10, max: 200, unit: '%', desc: 'Super arrancada (Donut / Capivara)' },
    superStartDurationSec: { value: 2, min: 0.5, max: 15, unit: 's', desc: 'Duração da super arrancada' },
    tripSlowdownPct: { value: 80, min: 10, max: 99, unit: '%', desc: 'Redução de velocidade no rival por tropeço (Confete / Balões)' },
    tripDurationSec: { value: 1.5, min: 0.5, max: 10, unit: 's', desc: 'Duração do tropeço' },
    shieldDurationSec: { value: 8, min: 1, max: 60, unit: 's', desc: 'Duração do escudo contra sabotagens' },
    stackMaxFactor: { value: 2, min: 1, max: 5, unit: 'x', desc: 'Fator máximo de renovação da duração de efeito acumulado' },
  },
  balance: {
    rubberBandPct: { value: 10, min: 0, max: 50, unit: '%', desc: 'Bônus máximo de velocidade para quem está atrás' },
    rubberBandGapPct: { value: 20, min: 5, max: 60, unit: '%', desc: 'Diferença mínima na pista para ativar o rubber-band' },
  },
  auto: {
    idleThresholdSec: { value: 20, min: 3, max: 120, unit: 's', desc: 'Tempo sem interação para iniciar corrida automática' },
    paceVariationPct: { value: 5, min: 0, max: 20, unit: '%', desc: 'Variação natural de ritmo baseada na seed sem poderes' },
    simulatePowers: { value: 0, min: 0, max: 1, unit: 'bool', desc: 'Simular poderes na corrida automática (0=desligado, 1=ligado)' },
    simulatePowersRatePerSec: { value: 0.05, min: 0.01, max: 1, unit: 'evt/s', desc: 'Frequência de poderes simulados por segundo quando ligado' },
  },
} as const satisfies TuningTree;

type Defaults = typeof TUNING_DEFAULTS;
export type TuningPath = {
  [G in keyof Defaults]: `${G & string}.${keyof Defaults[G] & string}`;
}[keyof Defaults];

export interface TuningEntry extends NumberParam {
  path: TuningPath;
  default: number;
}

const current = new Map<string, number>();
const listeners = new Set<(path: TuningPath, value: number) => void>();

function meta(path: string): NumberParam {
  const [group, key] = path.split('.');
  const param = (TUNING_DEFAULTS as TuningTree)[group]?.[key];
  if (!param) throw new Error(`tuning: parâmetro desconhecido '${path}'`);
  return param;
}

export function listTuning(): TuningEntry[] {
  return (Object.entries(TUNING_DEFAULTS) as [string, Record<string, NumberParam>][]).flatMap(([group, params]) =>
    Object.entries(params).map(([key, p]) => {
      const path = `${group}.${key}` as TuningPath;
      return { ...p, path, default: p.value, value: getTuning(path) };
    }),
  );
}

export function getTuning(path: TuningPath): number {
  return current.get(path) ?? meta(path).value;
}

/**
 * Ajusta em tempo de execução (painel admin / overlay de debug).
 * O valor é automaticamente limitado ao intervalo [min, max].
 */
export function setTuning(path: TuningPath, value: number): number {
  const p = meta(path);
  if (!Number.isFinite(value)) throw new Error(`tuning: valor inválido para '${path}'`);
  const clamped = Math.min(p.max, Math.max(p.min, value));
  current.set(path, clamped);
  listeners.forEach((fn) => fn(path, clamped));
  return clamped;
}

export function resetTuning(path?: TuningPath): void {
  const paths = path ? [path] : listTuning().map((e) => e.path);
  paths.forEach((p) => {
    current.delete(p);
    listeners.forEach((fn) => fn(p, meta(p).value));
  });
}

/**
 * Aplica um conjunto de overrides (ex.: JSON salvo ou agendado).
 * Devolve a lista de caminhos rejeitados (inválidos ou fora da árvore).
 */
export function applyOverrides(overrides: Record<string, unknown>): string[] {
  const rejected: string[] = [];
  for (const [path, value] of Object.entries(overrides)) {
    try {
      if (typeof value !== 'number') throw new Error('não numérico');
      setTuning(path as TuningPath, value);
    } catch {
      rejected.push(path);
    }
  }
  return rejected;
}

export function exportTuning(): Record<string, number> {
  return Object.fromEntries(listTuning().map((e) => [e.path, e.value]));
}

export function onTuningChange(fn: (path: TuningPath, value: number) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
