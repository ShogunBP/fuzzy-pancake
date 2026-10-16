import { beforeEach, describe, expect, it } from 'vitest';
import { getTuning, resetTuning } from '../config/tuning';
import { RaceEngine } from './race_engine';

describe('Corrida Automática e Ausência de Efeitos Simulados', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('garante que corrida automática não aplica nenhum efeito/poder sem interação externa', () => {
    const seeds = [101, 202, 303, 404, 505];

    for (const seed of seeds) {
      const engine = new RaceEngine({ seed });
      engine.startRace();

      // Simula 200 segundos (tempo suficiente para entrar em idle e terminar a corrida)
      for (let t = 0; t < 2000; t++) {
        engine.tick(0.1);
        if (engine.getState().winnerId) break;
      }

      const state = engine.getState();
      expect(state.candidates.lula.activeEffects.length).toBe(0);
      expect(state.candidates.flavio.activeEffects.length).toBe(0);
      expect(state.candidates.lula.hasShield).toBe(false);
      expect(state.candidates.flavio.hasShield).toBe(false);

      const logs = engine.getLogs();
      const effectLogs = logs.filter(
        (l) => l.kind === 'lifecycle' && (l.code === 'EFFECT_APPLIED' || l.code === 'EFFECT_EXPIRED'),
      );
      expect(effectLogs.length).toBe(0);
      expect(state.winnerId).toBeDefined();
    }
  });

  it('mantém resultado 100% reproduzível pela seed', () => {
    const run = (seed: number) => {
      const engine = new RaceEngine({ seed });
      engine.startRace();
      for (let t = 0; t < 2000; t++) {
        engine.tick(0.1);
        if (engine.getState().winnerId) break;
      }
      return {
        winnerId: engine.getState().winnerId,
        finishTime: engine.getState().elapsedTimeSec,
        lulaPos: engine.getState().candidates.lula.position,
        flavioPos: engine.getState().candidates.flavio.position,
      };
    };

    const resA = run(998877);
    const resB = run(998877);

    expect(resA.winnerId).toBe(resB.winnerId);
    expect(resA.finishTime).toBe(resB.finishTime);
    expect(resA.lulaPos).toBe(resB.lulaPos);
    expect(resA.flavioPos).toBe(resB.flavioPos);
  });

  it('simulação estatística de 1.000 corridas automáticas (sem interação)', () => {
    const TOTAL_RACES = 1000;
    const wins = { lula: 0, flavio: 0 };
    const durations: number[] = [];
    let totalPowersApplied = 0;

    for (let i = 1; i <= TOTAL_RACES; i++) {
      const engine = new RaceEngine({ seed: i * 7919 });
      engine.startRace();

      // Tick com passos de 0.2s para simular rápido
      for (let t = 0; t < 1500; t++) {
        engine.tick(0.2);
        if (engine.getState().winnerId) break;
      }

      const winner = engine.getState().winnerId;
      expect(winner).not.toBeNull();
      wins[winner!]++;
      durations.push(engine.getState().elapsedTimeSec);

      const effectsCount =
        engine.getState().candidates.lula.activeEffects.length +
        engine.getState().candidates.flavio.activeEffects.length;
      totalPowersApplied += effectsCount;
    }

    // 1. Zero efeitos aplicados
    expect(totalPowersApplied).toBe(0);

    // 2. Estatísticas de duração
    const sumDurations = durations.reduce((a, b) => a + b, 0);
    const avgDuration = sumDurations / TOTAL_RACES;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const variance = durations.reduce((acc, d) => acc + Math.pow(d - avgDuration, 2), 0) / TOTAL_RACES;
    const stdDev = Math.sqrt(variance);

    // 3. Proporção de vitórias
    const lulaPct = (wins.lula / TOTAL_RACES) * 100;
    const flavioPct = (wins.flavio / TOTAL_RACES) * 100;

    console.log(`\n================ RELATÓRIO DE 1.000 CORRIDAS AUTOMÁTICAS ================`);
    console.log(`Total de Corridas: ${TOTAL_RACES}`);
    console.log(`Vitórias Lula:    ${wins.lula} (${lulaPct.toFixed(1)}%)`);
    console.log(`Vitórias Flávio:  ${wins.flavio} (${flavioPct.toFixed(1)}%)`);
    console.log(`Duração Média:    ${avgDuration.toFixed(2)}s (Alvo: ${getTuning('race.targetDurationSec')}s)`);
    console.log(`Duração Mínima:   ${minDuration.toFixed(2)}s`);
    console.log(`Duração Máxima:   ${maxDuration.toFixed(2)}s`);
    console.log(`Desvio Padrão:    ${stdDev.toFixed(2)}s`);
    console.log(`Poderes Aplicados: ${totalPowersApplied} (ZERO)`);
    console.log(`=========================================================================\n`);

    // Equilíbrio competitivo entre 44% e 56% (bem próximo do 50/50 ideal)
    expect(lulaPct).toBeGreaterThanOrEqual(44);
    expect(lulaPct).toBeLessThanOrEqual(56);
    expect(flavioPct).toBeGreaterThanOrEqual(44);
    expect(flavioPct).toBeLessThanOrEqual(56);

    // Duração média dentro de 10% do alvo (180s)
    expect(avgDuration).toBeGreaterThan(165);
    expect(avgDuration).toBeLessThan(195);
  });
});
