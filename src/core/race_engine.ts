import { getTuning } from '../config/tuning';
import { DeterministicRNG } from './rng';
import type {
  CandidateId,
  CandidateState,
  ChatEvent,
  DecisionListener,
  EventDecision,
  GiftEvent,
  LifecycleEventCode,
  LifecycleListener,
  LifecycleLogEntry,
  LiveGameEvent,
  LogEntry,
  PowerType,
  RaceState,
  ScoreState,
} from './types';

export const MAX_ENGINE_LOGS_RETAINED = 250;

export interface RaceEngineOptions {
  seed?: number;
  initialScores?: ScoreState;
  isDebug?: boolean;
}

interface CandidatePaceConfig {
  phase1: number;
  phase2: number;
  freq1: number;
  freq2: number;
  bias: number;
}

export class RaceEngine {
  private state: RaceState;
  private scores: ScoreState;
  private rng: DeterministicRNG;
  private isDebug: boolean;
  private userLastChatTime: Map<string, number> = new Map();
  private pendingTuningOverrides: Record<string, unknown> | null = null;
  private candidatePaceConfigs: Record<CandidateId, CandidatePaceConfig> | null = null;

  private logs: LogEntry[] = [];
  private decisionListeners: Set<DecisionListener> = new Set();
  private lifecycleListeners: Set<LifecycleListener> = new Set();
  private eventCounter = 0;

  constructor(options: RaceEngineOptions = {}) {
    const seed = options.seed ?? Math.floor(Math.random() * 1000000);
    this.rng = new DeterministicRNG(seed);
    this.isDebug = options.isDebug ?? false;
    this.scores = options.initialScores ?? {
      session: { lula: 0, flavio: 0 },
      total: { lula: 0, flavio: 0 },
    };

    const trackLength = getTuning('race.trackLength');
    this.state = {
      status: 'waiting',
      seed,
      elapsedTimeSec: 0,
      trackLength,
      candidates: {
        lula: this.createInitialCandidate('lula'),
        flavio: this.createInitialCandidate('flavio'),
      },
      winnerId: null,
      intermissionRemainingSec: 0,
      lastInteractionTimestamp: 0,
      isAutoRacing: false,
      isPaused: false,
    };
  }

  private createInitialCandidate(id: CandidateId): CandidateState {
    return {
      id,
      position: 0,
      currentSpeed: 0,
      finished: false,
      activeEffects: [],
      hasShield: false,
      shieldRemainingDurationSec: 0,
    };
  }

  public getState(): Readonly<RaceState> {
    return this.state;
  }

  public getScores(): Readonly<ScoreState> {
    return this.scores;
  }

  public onDecision(listener: DecisionListener): () => void {
    this.decisionListeners.add(listener);
    return () => this.decisionListeners.delete(listener);
  }

  public onLifecycle(listener: LifecycleListener): () => void {
    this.lifecycleListeners.add(listener);
    return () => this.lifecycleListeners.delete(listener);
  }

  private emitDecision(decision: EventDecision): EventDecision {
    this.logs.push(decision);
    if (this.logs.length > MAX_ENGINE_LOGS_RETAINED) {
      this.logs.shift();
    }
    for (const listener of this.decisionListeners) {
      try {
        listener(decision);
      } catch {
        // Ignora erros de listeners
      }
    }
    return decision;
  }

  private emitLifecycle(code: LifecycleEventCode, description: string, details?: Record<string, unknown>): void {
    const entry: LifecycleLogEntry = {
      kind: 'lifecycle',
      id: `life_${++this.eventCounter}`,
      timestampSec: this.state.elapsedTimeSec,
      timeIso: new Date().toISOString(),
      code,
      description,
      details,
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_ENGINE_LOGS_RETAINED) {
      this.logs.shift();
    }
    for (const listener of this.lifecycleListeners) {
      try {
        listener(entry);
      } catch {
        // Ignora erros de listeners
      }
    }
  }

  public getLogs(filter?: { type?: 'all' | 'chat' | 'gift' | 'lifecycle'; appliedOnly?: boolean }): LogEntry[] {
    let result = [...this.logs];
    if (!filter) return result;

    if (filter.type && filter.type !== 'all') {
      if (filter.type === 'lifecycle') {
        result = result.filter((e) => e.kind === 'lifecycle');
      } else if (filter.type === 'chat') {
        result = result.filter((e) => e.kind === 'event_decision' && e.event.type === 'chat');
      } else if (filter.type === 'gift') {
        result = result.filter((e) => e.kind === 'event_decision' && e.event.type === 'gift');
      }
    }

    if (filter.appliedOnly) {
      result = result.filter((e) => e.kind === 'lifecycle' || e.applied);
    }

    return result;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public startRace(): void {
    const trackLength = getTuning('race.trackLength');
    this.state.status = 'running';
    this.state.elapsedTimeSec = 0;
    this.state.trackLength = trackLength;
    this.state.winnerId = null;
    this.state.isPaused = false;
    this.state.candidates.lula = this.createInitialCandidate('lula');
    this.state.candidates.flavio = this.createInitialCandidate('flavio');
    this.state.intermissionRemainingSec = 0;
    this.state.lastInteractionTimestamp = this.state.elapsedTimeSec;
    this.userLastChatTime.clear();

    // Inicializa ritmos naturais determinísticos simétricos por candidato baseados na seed
    const biasMag = (this.rng.next() - 0.5) * 0.015;
    this.candidatePaceConfigs = {
      lula: {
        phase1: this.rng.next() * Math.PI * 2,
        phase2: this.rng.next() * Math.PI * 2,
        freq1: 1.5 + this.rng.next() * 1.5,
        freq2: 3.5 + this.rng.next() * 2.0,
        bias: biasMag,
      },
      flavio: {
        phase1: this.rng.next() * Math.PI * 2,
        phase2: this.rng.next() * Math.PI * 2,
        freq1: 1.5 + this.rng.next() * 1.5,
        freq2: 3.5 + this.rng.next() * 2.0,
        bias: -biasMag,
      },
    };

    this.emitLifecycle('RACE_STARTED', 'Corrida iniciada', {
      trackLength,
      targetDurationSec: getTuning('race.targetDurationSec'),
    });
  }

  public resetRace(): void {
    const trackLength = getTuning('race.trackLength');
    this.state.status = 'waiting';
    this.state.elapsedTimeSec = 0;
    this.state.trackLength = trackLength;
    this.state.winnerId = null;
    this.state.isPaused = false;
    this.state.isAutoRacing = false;
    this.state.candidates.lula = this.createInitialCandidate('lula');
    this.state.candidates.flavio = this.createInitialCandidate('flavio');
    this.state.intermissionRemainingSec = 0;
    this.state.lastInteractionTimestamp = 0;
    this.userLastChatTime.clear();
    this.candidatePaceConfigs = null;

    this.emitLifecycle('RACE_RESUMED', 'Pista reiniciada para estado inicial');
  }

  /** Ação de emergência: pausar ou retomar imediatamente */
  public setPaused(paused: boolean): void {
    this.state.isPaused = paused;
    this.emitLifecycle(
      paused ? 'RACE_PAUSED' : 'RACE_RESUMED',
      paused ? 'Corrida pausada (emergência)' : 'Corrida retomada',
    );
  }

  /**
   * Processa uma tentativa de agendamento de alteração no tuning.
   * Se for modo debug, entra imediatamente. Se não, entra na próxima corrida.
   */
  public queueTuningOverride(overrides: Record<string, unknown>): boolean {
    if (this.isDebug) {
      this.emitLifecycle('TUNING_APPLIED', 'Tuning aplicado imediatamente (modo debug)', { overrides });
      return true;
    }
    this.pendingTuningOverrides = { ...this.pendingTuningOverrides, ...overrides };
    this.emitLifecycle('TUNING_QUEUED', 'Tuning agendado para a próxima corrida', { overrides });
    return false;
  }

  public getPendingTuningOverrides(): Record<string, unknown> | null {
    return this.pendingTuningOverrides;
  }

  /**
   * Processa eventos normalizados (chat ou presente) e emite a decisão com motivo explícito.
   */
  public handleEvent(event: LiveGameEvent): EventDecision {
    const eventId = `ev_${++this.eventCounter}`;
    const timestampSec = this.state.elapsedTimeSec;
    const timeIso = new Date().toISOString();

    if (this.state.status !== 'running') {
      return this.emitDecision({
        kind: 'event_decision',
        id: eventId,
        timestampSec,
        timeIso,
        event,
        applied: false,
        code: 'IGNORED_RACE_NOT_RUNNING',
        reason: `A corrida não está em andamento (status atual: ${this.state.status}). Inicie a corrida antes de interagir.`,
      });
    }

    if (this.state.isPaused) {
      return this.emitDecision({
        kind: 'event_decision',
        id: eventId,
        timestampSec,
        timeIso,
        event,
        applied: false,
        code: 'IGNORED_RACE_PAUSED',
        reason: 'A corrida está pausada por comando de emergência.',
      });
    }

    this.state.lastInteractionTimestamp = this.state.elapsedTimeSec;
    this.state.isAutoRacing = false;

    if (event.type === 'chat') {
      return this.handleChat(event, eventId, timestampSec, timeIso);
    } else {
      return this.handleGift(event, eventId, timestampSec, timeIso);
    }
  }

  private handleChat(event: ChatEvent, eventId: string, timestampSec: number, timeIso: string): EventDecision {
    const minInterval = getTuning('chat.minIntervalPerUserSec');
    const lastTime = this.userLastChatTime.get(event.userId) ?? -Infinity;

    if (event.timestamp - lastTime < minInterval) {
      const waitRemaining = (minInterval - (event.timestamp - lastTime)).toFixed(1);
      return this.emitDecision({
        kind: 'event_decision',
        id: eventId,
        timestampSec,
        timeIso,
        event,
        applied: false,
        code: 'IGNORED_MIN_INTERVAL_PER_USER',
        reason: `Limite de spam: usuário ${event.userId} precisa aguardar mais ${waitRemaining}s (mínimo ${minInterval}s entre mensagens).`,
      });
    }

    const cand = this.state.candidates[event.candidateId];
    const otherId: CandidateId = event.candidateId === 'lula' ? 'flavio' : 'lula';
    const other = this.state.candidates[otherId];

    // Verificar teto de deslocamento pelo chat (chat.maxLeadShiftPct)
    const trackLength = this.state.trackLength;
    const maxLeadDist = (getTuning('chat.maxLeadShiftPct') / 100) * trackLength;

    if (cand.position - other.position >= maxLeadDist) {
      return this.emitDecision({
        kind: 'event_decision',
        id: eventId,
        timestampSec,
        timeIso,
        event,
        applied: false,
        code: 'IGNORED_MAX_LEAD_SHIFT',
        reason: `Teto de liderança pelo chat atingido (${getTuning('chat.maxLeadShiftPct')}% da pista). Chat isolado não pode ampliar mais a vantagem.`,
      });
    }

    this.userLastChatTime.set(event.userId, event.timestamp);

    const pushSpeedPct = getTuning('chat.pushSpeedPct');
    const pushDurationSec = getTuning('chat.pushDurationSec');

    this.applySpeedEffect(cand, 'impulse', pushDurationSec, 1 + pushSpeedPct / 100);

    return this.emitDecision({
      kind: 'event_decision',
      id: eventId,
      timestampSec,
      timeIso,
      event,
      applied: true,
      code: 'APPLIED',
      reason: `Empurrão de chat aplicado com sucesso para ${cand.id.toUpperCase()}.`,
      effectDescription: `+${pushSpeedPct}% velocidade por ${pushDurationSec}s`,
    });
  }

  private handleGift(event: GiftEvent, eventId: string, timestampSec: number, timeIso: string): EventDecision {
    const benefited = this.state.candidates[event.candidateBenefited];
    const opponentId: CandidateId = event.candidateBenefited === 'lula' ? 'flavio' : 'lula';
    const opponent = this.state.candidates[opponentId];

    switch (event.power) {
      case 'impulse': {
        const bonusPct = getTuning('power.impulseSpeedPct');
        const dur = getTuning('power.impulseDurationSec');
        this.applySpeedEffect(benefited, 'impulse', dur, 1 + bonusPct / 100);
        return this.emitDecision({
          kind: 'event_decision',
          id: eventId,
          timestampSec,
          timeIso,
          event,
          applied: true,
          code: 'APPLIED',
          reason: `Presente [${event.giftId}] concedeu impulso para ${benefited.id.toUpperCase()}.`,
          effectDescription: `+${bonusPct}% velocidade por ${dur}s`,
        });
      }
      case 'superStart': {
        const bonusPct = getTuning('power.superStartSpeedPct');
        const dur = getTuning('power.superStartDurationSec');
        this.applySpeedEffect(benefited, 'superStart', dur, 1 + bonusPct / 100);
        return this.emitDecision({
          kind: 'event_decision',
          id: eventId,
          timestampSec,
          timeIso,
          event,
          applied: true,
          code: 'APPLIED',
          reason: `Super Arrancada ativada para ${benefited.id.toUpperCase()} via [${event.giftId}].`,
          effectDescription: `+${bonusPct}% velocidade por ${dur}s`,
        });
      }
      case 'slip': {
        if (opponent.hasShield) {
          opponent.hasShield = false;
          opponent.shieldRemainingDurationSec = 0;
          this.emitLifecycle('SHIELD_EXPIRED', `Escudo de ${opponent.id.toUpperCase()} bloqueou escorregão e foi consumido`);
          return this.emitDecision({
            kind: 'event_decision',
            id: eventId,
            timestampSec,
            timeIso,
            event,
            applied: false,
            code: 'BLOCKED_BY_SHIELD',
            reason: `O escorregão foi BLOQUEADO pelo escudo protetor ativo de ${opponent.id.toUpperCase()}. O escudo foi consumido.`,
          });
        }
        const slowPct = getTuning('power.slipSlowdownPct');
        const dur = getTuning('power.slipDurationSec');
        this.applySpeedEffect(opponent, 'slip', dur, Math.max(0.01, 1 - slowPct / 100));
        return this.emitDecision({
          kind: 'event_decision',
          id: eventId,
          timestampSec,
          timeIso,
          event,
          applied: true,
          code: 'APPLIED',
          reason: `Escorregão aplicado no rival ${opponent.id.toUpperCase()}.`,
          effectDescription: `-${slowPct}% velocidade por ${dur}s`,
        });
      }
      case 'trip': {
        const shieldDur = getTuning('power.shieldDurationSec');
        benefited.hasShield = true;
        benefited.shieldRemainingDurationSec = shieldDur;
        this.emitLifecycle('SHIELD_ACTIVATED', `Escudo ativado para ${benefited.id.toUpperCase()} por ${shieldDur}s`);

        if (opponent.hasShield) {
          opponent.hasShield = false;
          opponent.shieldRemainingDurationSec = 0;
          this.emitLifecycle('SHIELD_EXPIRED', `Escudo de ${opponent.id.toUpperCase()} bloqueou tropeço e foi consumido`);
          return this.emitDecision({
            kind: 'event_decision',
            id: eventId,
            timestampSec,
            timeIso,
            event,
            applied: false,
            code: 'BLOCKED_BY_SHIELD',
            reason: `Tropeço BLOQUEADO pelo escudo de ${opponent.id.toUpperCase()} (consumido). ${benefited.id.toUpperCase()} ganhou escudo de ${shieldDur}s.`,
            effectDescription: `Escudo ativado por ${shieldDur}s para ${benefited.id}`,
          });
        }

        const slowPct = getTuning('power.tripSlowdownPct');
        const dur = getTuning('power.tripDurationSec');
        this.applySpeedEffect(opponent, 'trip', dur, Math.max(0.01, 1 - slowPct / 100));

        return this.emitDecision({
          kind: 'event_decision',
          id: eventId,
          timestampSec,
          timeIso,
          event,
          applied: true,
          code: 'APPLIED',
          reason: `Tropeço aplicado em ${opponent.id.toUpperCase()} e escudo ativado para ${benefited.id.toUpperCase()}.`,
          effectDescription: `-${slowPct}% rival por ${dur}s + Escudo ${shieldDur}s`,
        });
      }
      case 'shield': {
        const shieldDur = getTuning('power.shieldDurationSec');
        benefited.hasShield = true;
        benefited.shieldRemainingDurationSec = shieldDur;
        this.emitLifecycle('SHIELD_ACTIVATED', `Escudo ativado para ${benefited.id.toUpperCase()} por ${shieldDur}s`);
        return this.emitDecision({
          kind: 'event_decision',
          id: eventId,
          timestampSec,
          timeIso,
          event,
          applied: true,
          code: 'APPLIED',
          reason: `Escudo protetor concedido a ${benefited.id.toUpperCase()}.`,
          effectDescription: `Proteção contra próxima sabotagem por ${shieldDur}s`,
        });
      }
    }
  }

  private applySpeedEffect(cand: CandidateState, type: PowerType, baseDuration: number, multiplier: number): void {
    const maxFactor = getTuning('power.stackMaxFactor');
    const existing = cand.activeEffects.find((e) => e.type === type);

    if (existing) {
      const maxAllowed = baseDuration * maxFactor;
      existing.remainingDurationSec = Math.min(maxAllowed, existing.remainingDurationSec + baseDuration);
    } else {
      cand.activeEffects.push({
        type,
        initialDurationSec: baseDuration,
        remainingDurationSec: baseDuration,
        speedMultiplier: multiplier,
      });
    }

    this.emitLifecycle('EFFECT_APPLIED', `Efeito [${type}] aplicado em ${cand.id.toUpperCase()}`, {
      candidateId: cand.id,
      type,
      multiplier,
      baseDuration,
    });
  }

  public tick(deltaSec: number): void {
    if (this.state.isPaused) {
      return;
    }

    if (this.state.status === 'intermission') {
      this.state.intermissionRemainingSec -= deltaSec;
      if (this.state.intermissionRemainingSec <= 0) {
        this.startRace();
      }
      return;
    }

    if (this.state.status !== 'running') {
      return;
    }

    this.state.elapsedTimeSec += deltaSec;

    const idleThreshold = getTuning('auto.idleThresholdSec');
    if (this.state.elapsedTimeSec - this.state.lastInteractionTimestamp >= idleThreshold) {
      this.state.isAutoRacing = true;
      this.simulateIdleStep(deltaSec);
    }

    for (const cand of Object.values(this.state.candidates)) {
      if (cand.hasShield) {
        cand.shieldRemainingDurationSec -= deltaSec;
        if (cand.shieldRemainingDurationSec <= 0) {
          cand.hasShield = false;
          cand.shieldRemainingDurationSec = 0;
          this.emitLifecycle('SHIELD_EXPIRED', `Escudo de ${cand.id.toUpperCase()} expirou por tempo`);
        }
      }

      for (let i = cand.activeEffects.length - 1; i >= 0; i--) {
        const eff = cand.activeEffects[i];
        eff.remainingDurationSec -= deltaSec;
        if (eff.remainingDurationSec <= 0) {
          cand.activeEffects.splice(i, 1);
          this.emitLifecycle('EFFECT_EXPIRED', `Efeito [${eff.type}] de ${cand.id.toUpperCase()} expirou`);
        }
      }
    }

    const targetDuration = getTuning('race.targetDurationSec');
    const trackLength = this.state.trackLength;
    const baseSpeed = trackLength / targetDuration;

    const rubberBandGapPct = getTuning('balance.rubberBandGapPct');
    const rubberBandPct = getTuning('balance.rubberBandPct');
    const lulaPos = this.state.candidates.lula.position;
    const flavioPos = this.state.candidates.flavio.position;
    const diff = Math.abs(lulaPos - flavioPos);
    const gapDist = (rubberBandGapPct / 100) * trackLength;

    let lulaRubberMultiplier = 1;
    let flavioRubberMultiplier = 1;

    if (diff > gapDist) {
      const bonus = 1 + rubberBandPct / 100;
      if (lulaPos < flavioPos) {
        lulaRubberMultiplier = bonus;
      } else {
        flavioRubberMultiplier = bonus;
      }
    }

    for (const cand of Object.values(this.state.candidates)) {
      if (cand.finished) continue;

      let speedMultiplier = 1;
      for (const eff of cand.activeEffects) {
        speedMultiplier *= eff.speedMultiplier;
      }

      const rubberBonus = cand.id === 'lula' ? lulaRubberMultiplier : flavioRubberMultiplier;
      const naturalPace = this.getNaturalPaceMultiplier(cand.id, targetDuration);
      cand.currentSpeed = baseSpeed * naturalPace * speedMultiplier * rubberBonus;

      cand.position += cand.currentSpeed * deltaSec;

      if (cand.position >= trackLength) {
        cand.position = trackLength;
        cand.finished = true;
        cand.finishTimeSec = this.state.elapsedTimeSec;

        if (!this.state.winnerId) {
          this.state.winnerId = cand.id;
          this.scores.session[cand.id]++;
          this.scores.total[cand.id]++;
          this.state.intermissionRemainingSec = getTuning('race.intermissionSec');
          this.state.status = 'intermission';

          this.emitLifecycle('RACE_FINISHED', `Vencedor: ${cand.id.toUpperCase()}`, {
            winnerId: cand.id,
            finishTimeSec: cand.finishTimeSec,
            scores: this.scores,
          });
          break;
        }
      }
    }
  }

  private getNaturalPaceMultiplier(candId: CandidateId, targetDuration: number): number {
    const paceVarPct = getTuning('auto.paceVariationPct');
    if (paceVarPct <= 0 || !this.candidatePaceConfigs) return 1.0;

    const cfg = this.candidatePaceConfigs[candId];
    if (!cfg) return 1.0;

    const t = this.state.elapsedTimeSec / (targetDuration || 180);
    const wave =
      Math.sin(2 * Math.PI * cfg.freq1 * t + cfg.phase1) * 0.7 +
      Math.sin(2 * Math.PI * cfg.freq2 * t + cfg.phase2) * 0.3;

    return Math.max(0.1, 1 + (paceVarPct / 100) * wave + cfg.bias);
  }

  private simulateIdleStep(deltaSec: number): void {
    const simulatePowers = getTuning('auto.simulatePowers');
    if (simulatePowers < 1) {
      // Padrão: NENHUM efeito de poder é aplicado automaticamente pelo sistema
      return;
    }

    const rate = getTuning('auto.simulatePowersRatePerSec');
    if (rate > 0 && this.rng.next() < rate * deltaSec) {
      const luckyCandidate: CandidateId = this.rng.next() > 0.5 ? 'lula' : 'flavio';
      const cand = this.state.candidates[luckyCandidate];
      this.applySpeedEffect(cand, 'impulse', 1, 1.05);
    }
  }

  public resetScores(clearTotal = false): void {
    this.scores.session = { lula: 0, flavio: 0 };
    if (clearTotal) {
      this.scores.total = { lula: 0, flavio: 0 };
    }
    this.emitLifecycle('SCORES_UPDATED', 'Placar zerado pelo operador', { scores: this.scores });
  }

  public setScores(scores: { session?: { lula: number; flavio: number }; total?: { lula: number; flavio: number } }): void {
    if (scores.session) {
      this.scores.session.lula = Math.max(0, Math.floor(scores.session.lula));
      this.scores.session.flavio = Math.max(0, Math.floor(scores.session.flavio));
    }
    if (scores.total) {
      this.scores.total.lula = Math.max(0, Math.floor(scores.total.lula));
      this.scores.total.flavio = Math.max(0, Math.floor(scores.total.flavio));
    }
    this.emitLifecycle('SCORES_UPDATED', 'Placar ajustado manualmente pelo operador', { scores: this.scores });
  }
}
