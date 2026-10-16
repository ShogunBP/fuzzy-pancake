import { exportTuning, setTuning, type TuningPath } from '../config/tuning';
import { RaceEngine } from './race_engine';
import type { CandidateId, LiveGameEvent, RaceState } from './types';

export interface RecordedEvent {
  timeOffsetSec: number;
  event: LiveGameEvent;
}

export interface RecordedRace {
  seed: number;
  initialTuning: Record<string, number>;
  events: RecordedEvent[];
  finalWinnerId: CandidateId | null;
  totalDurationSec: number;
}

export class RaceRecorder {
  private seed: number;
  private initialTuning: Record<string, number>;
  private events: RecordedEvent[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.initialTuning = exportTuning();
  }

  public recordEvent(timeOffsetSec: number, event: LiveGameEvent): void {
    this.events.push({ timeOffsetSec, event });
  }

  public finalize(finalWinnerId: CandidateId | null, totalDurationSec: number): RecordedRace {
    return {
      seed: this.seed,
      initialTuning: { ...this.initialTuning },
      events: [...this.events],
      finalWinnerId,
      totalDurationSec,
    };
  }
}

/**
 * Executa uma reprodução determinística completa de uma corrida gravada.
 */
export function replayRace(recorded: RecordedRace, deltaSec = 0.1): RaceState {
  // Aplicar tuning inicial gravado
  for (const [path, val] of Object.entries(recorded.initialTuning)) {
    setTuning(path as TuningPath, val);
  }

  const engine = new RaceEngine({ seed: recorded.seed });
  engine.startRace();

  let nextEventIdx = 0;
  const sortedEvents = [...recorded.events].sort((a, b) => a.timeOffsetSec - b.timeOffsetSec);

  // Simular até o vencedor ser definido ou até a duração total registrada
  const maxTicks = Math.ceil((recorded.totalDurationSec + 5) / deltaSec);
  for (let t = 0; t < maxTicks; t++) {
    const currentTime = engine.getState().elapsedTimeSec;

    // Disparar eventos agendados para este instante
    while (nextEventIdx < sortedEvents.length && sortedEvents[nextEventIdx].timeOffsetSec <= currentTime) {
      engine.handleEvent(sortedEvents[nextEventIdx].event);
      nextEventIdx++;
    }

    engine.tick(deltaSec);

    if (engine.getState().winnerId || engine.getState().elapsedTimeSec >= recorded.totalDurationSec - 1e-6) {
      break;
    }
  }

  return engine.getState();
}
