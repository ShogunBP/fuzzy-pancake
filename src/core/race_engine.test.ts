import { beforeEach, describe, expect, it } from 'vitest';
import { getTuning, resetTuning } from '../config/tuning';
import { RaceEngine } from './race_engine';

describe('RaceEngine', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('roda uma corrida completa determinística sem DOM até a linha de chegada', () => {
    const engine = new RaceEngine({ seed: 12345 });
    engine.startRace();

    expect(engine.getState().status).toBe('running');
    expect(engine.getState().winnerId).toBeNull();

    // Simula 200 segundos com ticks de 0.1s
    for (let t = 0; t < 2000; t++) {
      engine.tick(0.1);
      if (engine.getState().winnerId) break;
    }

    const state = engine.getState();
    expect(state.winnerId).toBeDefined();
    expect(['lula', 'flavio']).toContain(state.winnerId);
    expect(engine.getScores().session[state.winnerId!]).toBe(1);
    expect(engine.getScores().total[state.winnerId!]).toBe(1);
  });

  it('mesma seed e mesmos eventos geram o mesmo resultado exato (reprodutibilidade)', () => {
    const runSimulation = (seed: number) => {
      const engine = new RaceEngine({ seed });
      engine.startRace();

      // Eventos pré-programados
      engine.handleEvent({
        type: 'chat',
        userId: 'user_1',
        candidateId: 'lula',
        timestamp: 5,
      });

      engine.handleEvent({
        type: 'gift',
        userId: 'user_2',
        giftId: 'rose',
        repeatCount: 1,
        candidateBenefited: 'lula',
        power: 'impulse',
        timestamp: 10,
      });

      for (let t = 0; t < 500; t++) {
        engine.tick(0.1);
      }

      return {
        lulaPos: engine.getState().candidates.lula.position,
        flavioPos: engine.getState().candidates.flavio.position,
        elapsed: engine.getState().elapsedTimeSec,
      };
    };

    const res1 = runSimulation(424242);
    const res2 = runSimulation(424242);

    expect(res1.lulaPos).toBe(res2.lulaPos);
    expect(res1.flavioPos).toBe(res2.flavioPos);
    expect(res1.elapsed).toBe(res2.elapsed);
  });

  it('rejeita eventos antes da corrida iniciar com motivo IGNORED_RACE_NOT_RUNNING', () => {
    const engine = new RaceEngine({ seed: 100 });
    // Corrida NÃO foi iniciada (status: waiting)
    const decision = engine.handleEvent({
      type: 'chat',
      userId: 'user_A',
      candidateId: 'lula',
      timestamp: 0,
    });

    expect(decision.applied).toBe(false);
    expect(decision.code).toBe('IGNORED_RACE_NOT_RUNNING');
    expect(decision.reason).toContain('não está em andamento');
  });

  it('rejeita eventos quando a corrida está pausada com IGNORED_RACE_PAUSED', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();
    engine.setPaused(true);

    const decision = engine.handleEvent({
      type: 'chat',
      userId: 'user_A',
      candidateId: 'lula',
      timestamp: 1,
    });

    expect(decision.applied).toBe(false);
    expect(decision.code).toBe('IGNORED_RACE_PAUSED');
  });

  it('bloqueia spam de chat do mesmo usuário com IGNORED_MIN_INTERVAL_PER_USER', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    // Primeira mensagem do user_A no t=10 deve ser aceita
    const first = engine.handleEvent({
      type: 'chat',
      userId: 'user_A',
      candidateId: 'lula',
      timestamp: 10,
    });
    expect(first.applied).toBe(true);
    expect(first.code).toBe('APPLIED');
    expect(first.effectDescription).toContain('+2% velocidade');

    // Segunda mensagem do mesmo user_A no t=11 (dentro de 3s) deve ser rejeitada
    const spam = engine.handleEvent({
      type: 'chat',
      userId: 'user_A',
      candidateId: 'lula',
      timestamp: 11,
    });
    expect(spam.applied).toBe(false);
    expect(spam.code).toBe('IGNORED_MIN_INTERVAL_PER_USER');
    expect(spam.reason).toContain('Limite de spam');

    // Mensagem de outro usuário no t=11 deve ser aceita
    const otherUser = engine.handleEvent({
      type: 'chat',
      userId: 'user_B',
      candidateId: 'lula',
      timestamp: 11,
    });
    expect(otherUser.applied).toBe(true);
    expect(otherUser.code).toBe('APPLIED');

    // user_A tenta novamente após 3s (t=13.1) -> aceito
    const afterCooldown = engine.handleEvent({
      type: 'chat',
      userId: 'user_A',
      candidateId: 'lula',
      timestamp: 13.1,
    });
    expect(afterCooldown.applied).toBe(true);
    expect(afterCooldown.code).toBe('APPLIED');
  });

  it('rejeita chat quando o teto de liderança (maxLeadShiftPct) é atingido', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    // Coloca Lula com vantagem de 16 metros (teto é 15% de 100m = 15m)
    engine.getState().candidates.lula.position = 20;
    engine.getState().candidates.flavio.position = 4;

    const decision = engine.handleEvent({
      type: 'chat',
      userId: 'u_lula',
      candidateId: 'lula',
      timestamp: 1,
    });

    expect(decision.applied).toBe(false);
    expect(decision.code).toBe('IGNORED_MAX_LEAD_SHIFT');
    expect(decision.reason).toContain('Teto de liderança');
  });

  it('efeitos do mesmo tipo renovam a duração sem somar potência', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    const d1 = engine.handleEvent({
      type: 'gift',
      userId: 'u1',
      giftId: 'rose',
      repeatCount: 1,
      candidateBenefited: 'lula',
      power: 'impulse',
      timestamp: 1,
    });
    expect(d1.applied).toBe(true);

    const cand = engine.getState().candidates.lula;
    expect(cand.activeEffects.length).toBe(1);
    const initialDuration = cand.activeEffects[0].remainingDurationSec;
    const initialMultiplier = cand.activeEffects[0].speedMultiplier;

    // Segundo impulso do mesmo tipo
    const d2 = engine.handleEvent({
      type: 'gift',
      userId: 'u2',
      giftId: 'rose',
      repeatCount: 1,
      candidateBenefited: 'lula',
      power: 'impulse',
      timestamp: 2,
    });
    expect(d2.applied).toBe(true);

    expect(cand.activeEffects.length).toBe(1);
    expect(cand.activeEffects[0].speedMultiplier).toBe(initialMultiplier);
    expect(cand.activeEffects[0].remainingDurationSec).toBeGreaterThan(initialDuration);
  });

  it('escudo protege contra sabotagem com BLOCKED_BY_SHIELD e é consumido', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    // Lula ganha escudo
    engine.handleEvent({
      type: 'gift',
      userId: 'u1',
      giftId: 'balloons',
      repeatCount: 1,
      candidateBenefited: 'lula',
      power: 'shield',
      timestamp: 1,
    });

    expect(engine.getState().candidates.lula.hasShield).toBe(true);

    // Flavio tenta jogar casca de banana (slip) em Lula
    const decision = engine.handleEvent({
      type: 'gift',
      userId: 'u2',
      giftId: 'banana',
      repeatCount: 1,
      candidateBenefited: 'flavio',
      power: 'slip',
      timestamp: 2,
    });

    expect(decision.applied).toBe(false);
    expect(decision.code).toBe('BLOCKED_BY_SHIELD');
    expect(decision.reason).toContain('BLOQUEADO pelo escudo');
    expect(engine.getState().candidates.lula.hasShield).toBe(false);
  });

  it('mecanismo de equilíbrio (rubber-band) acelera quem está atrás', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    engine.getState().candidates.flavio.position = 35;
    engine.getState().candidates.lula.position = 10;

    engine.tick(0.1);

    const lulaSpeed = engine.getState().candidates.lula.currentSpeed;
    const flavioSpeed = engine.getState().candidates.flavio.currentSpeed;

    expect(lulaSpeed).toBeGreaterThan(flavioSpeed);
  });

  it('corrida automática ativa após período de inatividade', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    const idleThreshold = getTuning('auto.idleThresholdSec');

    engine.tick(idleThreshold - 1);
    expect(engine.getState().isAutoRacing).toBe(false);

    engine.tick(2);
    expect(engine.getState().isAutoRacing).toBe(true);
  });

  it('armazena logs de eventos e ciclo de vida, com filtro, limpeza e exportação JSON', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    engine.handleEvent({
      type: 'chat',
      userId: 'u1',
      candidateId: 'lula',
      timestamp: 1,
    });

    engine.handleEvent({
      type: 'gift',
      userId: 'u2',
      giftId: 'rose',
      repeatCount: 1,
      candidateBenefited: 'lula',
      power: 'impulse',
      timestamp: 2,
    });

    const allLogs = engine.getLogs();
    expect(allLogs.length).toBeGreaterThanOrEqual(3); // RACE_STARTED + 1 chat + 1 gift

    const chatLogs = engine.getLogs({ type: 'chat' });
    expect(chatLogs.length).toBe(1);

    const giftLogs = engine.getLogs({ type: 'gift' });
    expect(giftLogs.length).toBe(1);

    const json = engine.exportLogsJson();
    expect(json).toContain('RACE_STARTED');
    expect(json).toContain('rose');

    engine.clearLogs();
    expect(engine.getLogs().length).toBe(0);
  });

  it('notifica listeners onDecision e onLifecycle em tempo real', () => {
    const engine = new RaceEngine({ seed: 100 });
    const decisions: string[] = [];
    const lifecycles: string[] = [];

    const unDecision = engine.onDecision((d) => decisions.push(d.code));
    const unLifecycle = engine.onLifecycle((l) => lifecycles.push(l.code));

    engine.startRace();
    expect(lifecycles).toContain('RACE_STARTED');

    engine.handleEvent({
      type: 'chat',
      userId: 'u1',
      candidateId: 'lula',
      timestamp: 1,
    });
    expect(decisions).toContain('APPLIED');

    unDecision();
    unLifecycle();
  });

  it('permite ajustar e zerar placares com setScores e resetScores', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.setScores({ session: { lula: 5, flavio: 3 }, total: { lula: 10, flavio: 8 } });

    const sc = engine.getScores();
    expect(sc.session.lula).toBe(5);
    expect(sc.session.flavio).toBe(3);
    expect(sc.total.lula).toBe(10);
    expect(sc.total.flavio).toBe(8);

    // Zerar apenas sessão
    engine.resetScores(false);
    expect(engine.getScores().session.lula).toBe(0);
    expect(engine.getScores().session.flavio).toBe(0);
    expect(engine.getScores().total.lula).toBe(10);

    // Zerar tudo
    engine.resetScores(true);
    expect(engine.getScores().total.lula).toBe(0);
    expect(engine.getScores().total.flavio).toBe(0);
  });

  it('respeita a política de retenção do buffer de logs (máximo 250)', () => {
    const engine = new RaceEngine({ seed: 100 });
    engine.startRace();

    for (let i = 0; i < 300; i++) {
      engine.handleEvent({
        type: 'chat',
        userId: `flood_${i}`,
        candidateId: 'lula',
        timestamp: i * 0.1,
      });
    }

    const logs = engine.getLogs();
    expect(logs.length).toBeLessThanOrEqual(250);
  });
});
