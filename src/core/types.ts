/**
 * Tipos e contratos do núcleo do jogo (Corrida Presidencial).
 * Totalmente desacoplado de DOM, WebSocket e Canvas/Pixi.
 */

export type CandidateId = 'lula' | 'flavio';

export interface CandidateConfig {
  id: CandidateId;
  name: string;
  number: string; // Ex.: "13", "22"
  color: string;
}

export type PowerType = 'impulse' | 'slip' | 'superStart' | 'trip' | 'shield';

export interface ActiveEffect {
  type: PowerType;
  remainingDurationSec: number;
  initialDurationSec: number;
  speedMultiplier: number;
}

export interface CandidateState {
  id: CandidateId;
  position: number; // 0 até trackLength
  currentSpeed: number; // Unidades/segundo no tick atual
  finished: boolean;
  finishTimeSec?: number;
  activeEffects: ActiveEffect[];
  hasShield: boolean;
  shieldRemainingDurationSec: number;
}

export type RaceStatus = 'waiting' | 'running' | 'finished' | 'intermission';

export interface ChatEvent {
  type: 'chat';
  userId: string;
  candidateId: CandidateId;
  timestamp: number;
}

export interface GiftEvent {
  type: 'gift';
  userId: string;
  giftId: string;
  repeatCount: number;
  candidateBenefited: CandidateId;
  power: PowerType;
  timestamp: number;
}

export type LiveGameEvent = ChatEvent | GiftEvent;

export interface ScoreState {
  session: Record<CandidateId, number>;
  total: Record<CandidateId, number>;
}

export interface RaceState {
  status: RaceStatus;
  seed: number;
  elapsedTimeSec: number;
  trackLength: number;
  candidates: Record<CandidateId, CandidateState>;
  winnerId: CandidateId | null;
  intermissionRemainingSec: number;
  lastInteractionTimestamp: number;
  isAutoRacing: boolean;
  isPaused: boolean;
}

export type EventDecisionCode =
  | 'APPLIED'
  | 'IGNORED_RACE_NOT_RUNNING'
  | 'IGNORED_RACE_PAUSED'
  | 'IGNORED_MIN_INTERVAL_PER_USER'
  | 'IGNORED_MAX_LEAD_SHIFT'
  | 'BLOCKED_BY_SHIELD';

export interface EventDecision {
  kind: 'event_decision';
  id: string;
  timestampSec: number;
  timeIso: string;
  event: LiveGameEvent;
  applied: boolean;
  code: EventDecisionCode;
  reason: string;
  effectDescription?: string;
}

export type LifecycleEventCode =
  | 'RACE_STARTED'
  | 'RACE_PAUSED'
  | 'RACE_RESUMED'
  | 'RACE_FINISHED'
  | 'EFFECT_APPLIED'
  | 'EFFECT_EXPIRED'
  | 'SHIELD_ACTIVATED'
  | 'SHIELD_EXPIRED'
  | 'TUNING_QUEUED'
  | 'TUNING_APPLIED'
  | 'SCORES_UPDATED';

export interface LifecycleLogEntry {
  kind: 'lifecycle';
  id: string;
  timestampSec: number;
  timeIso: string;
  code: LifecycleEventCode;
  description: string;
  details?: Record<string, unknown>;
}

export type LogEntry = EventDecision | LifecycleLogEntry;

export type DecisionListener = (decision: EventDecision) => void;
export type LifecycleListener = (entry: LifecycleLogEntry) => void;

