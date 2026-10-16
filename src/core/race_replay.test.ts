import { describe, expect, it } from 'vitest';
import { RaceEngine } from './race_engine';
import { RaceRecorder, replayRace } from './race_replay';

describe('RaceReplay', () => {
  it('grava uma corrida e reproduz com vencedor e posições finais exatamente idênticos', () => {
    const seed = 98765;
    const recorder = new RaceRecorder(seed);
    const engine = new RaceEngine({ seed });
    engine.startRace();

    // Simula 20 ticks (2.0 segundos)
    for (let t = 0; t < 20; t++) engine.tick(0.1);

    // Evento 1 aos 2 segundos
    const ev1 = {
      type: 'chat' as const,
      userId: 'user_1',
      candidateId: 'lula' as const,
      timestamp: 2,
    };
    recorder.recordEvent(engine.getState().elapsedTimeSec, ev1);
    engine.handleEvent(ev1);

    // Simula mais 20 ticks (até 4.0 segundos)
    for (let t = 0; t < 20; t++) engine.tick(0.1);

    // Evento 2 aos 4 segundos
    const ev2 = {
      type: 'gift' as const,
      userId: 'user_2',
      giftId: 'donut',
      repeatCount: 1,
      candidateBenefited: 'lula' as const,
      power: 'superStart' as const,
      timestamp: 4,
    };
    recorder.recordEvent(engine.getState().elapsedTimeSec, ev2);
    engine.handleEvent(ev2);

    // Simula mais 60 ticks (até 10 segundos)
    for (let t = 0; t < 60; t++) {
      engine.tick(0.1);
    }

    const recorded = recorder.finalize(engine.getState().winnerId, engine.getState().elapsedTimeSec);

    // Agora executa o replay independente
    const replayedState = replayRace(recorded, 0.1);

    // Compara posições e estado
    expect(replayedState.candidates.lula.position).toBeCloseTo(engine.getState().candidates.lula.position, 4);
    expect(replayedState.candidates.flavio.position).toBeCloseTo(engine.getState().candidates.flavio.position, 4);
    expect(replayedState.winnerId).toBe(engine.getState().winnerId);
  });
});
