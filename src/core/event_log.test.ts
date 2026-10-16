import { beforeEach, describe, expect, it } from 'vitest';
import { RaceEngine } from './race_engine';
import { resetTuning } from '../config/tuning';

describe('Event Log & Decision Model', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('registra motivo compreensível e código ao descartar chat com corrida pausada', () => {
    const engine = new RaceEngine({ seed: 777 });
    engine.startRace();
    engine.setPaused(true);

    const decision = engine.handleEvent({
      type: 'chat',
      userId: 'user_1',
      candidateId: 'lula',
      timestamp: 1,
    });

    expect(decision.applied).toBe(false);
    expect(decision.code).toBe('IGNORED_RACE_PAUSED');
    expect(decision.reason).toContain('pausada');

    const logs = engine.getLogs();
    const pauseLogs = logs.filter((l) => l.kind === 'lifecycle' && l.code === 'RACE_PAUSED');
    expect(pauseLogs.length).toBe(1);
  });

  it('exporta log em formato JSON válido contendo eventos e decisões', () => {
    const engine = new RaceEngine({ seed: 777 });
    engine.startRace();

    engine.handleEvent({
      type: 'chat',
      userId: 'ana',
      candidateId: 'flavio',
      timestamp: 0.5,
    });

    const jsonStr = engine.exportLogsJson();
    const parsed = JSON.parse(jsonStr);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
    expect(parsed[0].kind).toBe('lifecycle');

    const decisionEntry = parsed.find((p: any) => p.kind === 'event_decision');
    expect(decisionEntry).toBeDefined();
    expect(decisionEntry.event.userId).toBe('ana');
    expect(decisionEntry.code).toBe('APPLIED');
  });

  it('suporta fila de tuning agendado quando fora de modo debug', () => {
    const engine = new RaceEngine({ seed: 777, isDebug: false });
    engine.startRace();

    const immediate = engine.queueTuningOverride({ 'race.targetDurationSec': 60 });
    expect(immediate).toBe(false);

    const pending = engine.getPendingTuningOverrides();
    expect(pending).toEqual({ 'race.targetDurationSec': 60 });

    const logs = engine.getLogs({ type: 'lifecycle' });
    const queuedLogs = logs.filter((l) => l.kind === 'lifecycle' && l.code === 'TUNING_QUEUED');
    expect(queuedLogs.length).toBe(1);
  });
});
